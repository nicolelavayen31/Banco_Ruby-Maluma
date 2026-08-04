using BancoCenit.Extensions;
using BancoCenit.Common.Filters;
using BancoCenit.Features.Cuentas;
using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Notifications;
using BancoCenit.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Scalar.AspNetCore;
using Serilog;
using System.IO;
using System;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using System.Text;

// =====================================================================================
// INICIALIZACIÃ“N DEL CONSTRUCTOR DE LA APLICACIÃ“N
// =====================================================================================
// Inicializa el constructor de la aplicaciÃ³n web ASP.NET Core con los argumentos de la lÃ­nea de comandos.
WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// =====================================================================================
// CONFIGURACIÃ“N DEL SISTEMA DE LOGS (SERILOG)
// =====================================================================================
// Configurar Serilog para guardar logs estructurados tanto en la consola del desarrollador
// como en archivos locales con rotaciÃ³n diaria.
string logDir = Path.Combine(Directory.GetCurrentDirectory(), "logs");
if (!Directory.Exists(logDir))
{
    Directory.CreateDirectory(logDir);
}

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    // combined.log almacena toda la informaciÃ³n general de ejecuciÃ³n del backend
    .WriteTo.File(Path.Combine(logDir, "combined.log"), rollingInterval: RollingInterval.Day)
    // error.log filtra Ãºnicamente errores crÃ­ticos o excepciones para facilitar depuraciÃ³n en producciÃ³n
    .WriteTo.File(Path.Combine(logDir, "error.log"), restrictedToMinimumLevel: Serilog.Events.LogEventLevel.Error, rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// =====================================================================================
// SEGURIDAD Y AUTENTICACIÃ“N JWT (JSON WEB TOKEN)
// =====================================================================================
// Configurar la autenticaciÃ³n utilizando JWT Bearer Tokens.
// Los parÃ¡metros de clave secreta, emisor y audiencia se leen del appsettings.json.
IConfigurationSection jwtSettings = builder.Configuration.GetSection("JwtSettings");
string secretKey = jwtSettings["Secret"] ?? "super_secret_banco_ruby_key_that_is_at_least_32_characters_long_12345";
string issuer = jwtSettings["Issuer"] ?? "BancoRuby";
string audience = jwtSettings["Audience"] ?? "BancoRubyClients";

builder.Services.AddAuthentication(options =>
{
    // Establece JWT como el esquema de autenticaciÃ³n por defecto
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Define los criterios estrictos para validar el token JWT recibido en la cabecera Authorization
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true, // Exige que la clave de firma sea vÃ¡lida y coincida
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true, // Verifica que el emisor coincida con "BancoRuby"
        ValidIssuer = issuer,
        ValidateAudience = true, // Verifica que la audiencia coincida con la esperada
        ValidAudience = audience,
        ValidateLifetime = true, // No permite tokens expirados
        ClockSkew = TimeSpan.Zero // Elimina la tolerancia por desincronizaciÃ³n de reloj para validaciÃ³n exacta de expiraciÃ³n
    };
});

// =====================================================================================
// CONTROL DE FLUJO Y TASA DE PETICIONES (RATE LIMITING)
// =====================================================================================
// Protege el endpoint de autenticaciÃ³n contra ataques de fuerza bruta mediante una polÃ­tica de ventana fija.
builder.Services.AddRateLimiter(options =>
{
    // Devuelve un cÃ³digo HTTP 429 (Too Many Requests) si se sobrepasa el lÃ­mite
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth-limit", opt =>
    {
        opt.PermitLimit = 5; // LÃ­mite mÃ¡ximo de 5 peticiones exitosas o fallidas
        opt.Window = TimeSpan.FromMinutes(1); // Reinicio del contador cada minuto
        opt.QueueLimit = 0; // Rechaza inmediatamente sin encolar las peticiones excedentes
    });
});

// =====================================================================================
// PERSISTENCIA Y INYECCIÃ“N DE DEPENDENCIAS (CONEXIÃ“N DE BD Y MODULOS)
// =====================================================================================
// Registra el DbContext especÃ­fico para Banco Ruby apuntando a la base de datos PostgreSQL.
builder.Services.AddDbContext<BancoRubyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("BancoRuby")));

// Registra la interfaz base DbContext asociada al contenedor para resoluciÃ³n de filtros genÃ©ricos.
builder.Services.AddScoped<DbContext>(sp => sp.GetRequiredService<BancoRubyDbContext>());

// Registra el filtro de autorizaciÃ³n de cuentas de Minimal APIs (AccountAuthorizationFilter)
builder.Services.AddScoped<AccountAuthorizationFilter>();

// Registra todos los servicios, validadores y manejadores de MediatR para el mÃ³dulo modular de Cuentas (Vertical Slice)
builder.Services.AddCuentasServices();

// Registra el servicio de notificaciones y correo transaccional (Brevo SMTP Gateway)
builder.Services.AddNotificationsServices(builder.Configuration);

// Genera la especificaciÃ³n OpenAPI (Swagger/Scalar) para documentar el comportamiento del API
builder.Services.AddOpenApi();

// Construye la instancia de WebApplication para configurar el pipeline de solicitudes HTTP.
WebApplication app = builder.Build();

// =====================================================================================
// MIGRACIÃ“N DE BASE DE DATOS Y TAREAS DE INICIALIZACIÃ“N
// =====================================================================================
// Ejecuta scripts SQL crudos de inicializaciÃ³n al arrancar la aplicaciÃ³n para asegurar consistencia
// en tablas de soporte tÃ©cnico (idempotencia) y campos requeridos para integradores externos.
using (IServiceScope scope = app.Services.CreateScope())
{
    BancoRubyDbContext db = scope.ServiceProvider.GetRequiredService<BancoRubyDbContext>();
    try
    {
        // 1. Crea la tabla de idempotencia si no existe en el esquema de la base de datos.
        // Sirve para evitar el procesamiento repetido del mismo comando financiero de transferencia.
        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS idempotencia (
                transaction_id VARCHAR(100) PRIMARY KEY,
                response_json TEXT NOT NULL,
                creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );");

        // 2. Agrega la columna de mapeo del integrador de forma dinÃ¡mica a la tabla 'cuenta' si no se encuentra presente.
        // Esto permite vincular cuentas de Banco Ruby con los UUIDs del integrador ATM externo (Bannet/Cenit).
        await db.Database.ExecuteSqlRawAsync("ALTER TABLE cuenta ADD COLUMN IF NOT EXISTS integrador_account_id VARCHAR(100);");

        // 3. Proceso de cifrado seguro de PINs antiguos (Ej: PIN heredado de Nicole en desarrollo)
        // Migra los pines de texto plano cortos (<= 4 dÃ­gitos) a hashes seguros usando la biblioteca BCrypt.
        try
        {
            Cuenta? cuenta = await db.Cuentas
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.Usuario != null && c.Usuario.Nombre == "nicole");

            if (cuenta?.Usuario != null && cuenta.Usuario.Pin.Length <= 4)
            {
                cuenta.Usuario.Pin = BCrypt.Net.BCrypt.HashPassword(cuenta.Usuario.Pin);
                await db.SaveChangesAsync();
                Console.WriteLine("[Banco Ruby] PIN de Nicole cifrado con BCrypt exitosamente.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al cifrar PIN de Nicole: {ex.Message}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al inicializar tabla de idempotencia o migrar esquema: {ex.Message}");
    }
}

// =====================================================================================
// MIDDLEWARES Y RUTAS DEL PIPELINE HTTP
// =====================================================================================
// Configura el pipeline de middleware HTTP de la aplicaciÃ³n (CORS, enrutamiento, manejo de excepciones).
app.UseApplicationPipeline();

// Habilita el mapeo de OpenAPI y la interfaz de documentaciÃ³n interactiva Scalar en la ruta por defecto.
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithOpenApiRoutePattern("../openapi/{documentName}.json");
});

// Mapea y publica los endpoints de la caracterÃ­stica de Cuentas (Vertical Slice) utilizando Minimal APIs.
app.UseCuentasEndpoints();

// Inicia la aplicaciÃ³n y comienza a escuchar las peticiones HTTP entrantes en los puertos configurados.
app.Run();
