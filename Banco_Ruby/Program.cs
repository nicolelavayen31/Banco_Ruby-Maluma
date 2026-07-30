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

// Inicializa el constructor de la aplicación web ASP.NET Core con los argumentos de la línea de comandos.
WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configurar Serilog para guardar logs en la consola y archivos locales
string logDir = Path.Combine(Directory.GetCurrentDirectory(), "logs");
if (!Directory.Exists(logDir))
{
    Directory.CreateDirectory(logDir);
}

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(Path.Combine(logDir, "combined.log"), rollingInterval: RollingInterval.Day)
    .WriteTo.File(Path.Combine(logDir, "error.log"), restrictedToMinimumLevel: Serilog.Events.LogEventLevel.Error, rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Configurar Autenticación JWT Bearer
IConfigurationSection jwtSettings = builder.Configuration.GetSection("JwtSettings");
string secretKey = jwtSettings["Secret"] ?? "super_secret_banco_ruby_key_that_is_at_least_32_characters_long_12345";
string issuer = jwtSettings["Issuer"] ?? "BancoRuby";
string audience = jwtSettings["Audience"] ?? "BancoRubyClients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Configurar Control de Tasa (Rate Limiting)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth-limit", opt =>
    {
        opt.PermitLimit = 5; // Máximo 5 peticiones
        opt.Window = TimeSpan.FromMinutes(1); // Por cada 1 minuto
        opt.QueueLimit = 0; // Sin cola de espera
    });
});

// Registra el contexto específico de base de datos 'BancoRubyDbContext' configurado para conectar con PostgreSQL.
builder.Services.AddDbContext<BancoRubyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("BancoRuby")));

// Registra el DbContext base apuntando al contexto específico de Banco Ruby (requerido por AccountAuthorizationFilter).
builder.Services.AddScoped<DbContext>(sp => sp.GetRequiredService<BancoRubyDbContext>());

// Registra el filtro de autorización de cuentas.
builder.Services.AddScoped<AccountAuthorizationFilter>();

// Registra todos los servicios, repositorios, gateways y MediatR del módulo de Cuentas (Vertical Slice).
builder.Services.AddCuentasServices();

// Registra el servicio de notificaciones y la configuración de Brevo (Vertical Slice).
builder.Services.AddNotificationsServices(builder.Configuration);

// Genera la especificación OpenAPI (Swagger/Scalar) para documentar e interactuar con el API.
builder.Services.AddOpenApi();

// Construye la instancia de WebApplication para configurar el pipeline de solicitudes HTTP.
WebApplication app = builder.Build();

// Inicializar la base de datos y crear la tabla de idempotencia si no existe
using (IServiceScope scope = app.Services.CreateScope())
{
    BancoRubyDbContext db = scope.ServiceProvider.GetRequiredService<BancoRubyDbContext>();
    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS idempotencia (
                transaction_id VARCHAR(100) PRIMARY KEY,
                response_json TEXT NOT NULL,
                creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );");

        // Crear columna de mapeo del integrador si no existe
        await db.Database.ExecuteSqlRawAsync("ALTER TABLE cuenta ADD COLUMN IF NOT EXISTS integrador_account_id VARCHAR(100);");

        // Cifrar el PIN de Nicole si sigue en texto plano
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
        Console.WriteLine($"Error al inicializar tabla de idempotencia: {ex.Message}");
    }
}

// Configura el pipeline de middleware HTTP de la aplicación (CORS, enrutamiento, manejo de excepciones).
app.UseApplicationPipeline();

// Configura la UI interactiva de documentación OpenAPI (Scalar).
app.MapOpenApi();
app.MapScalarApiReference();

// Mapea los endpoints de la característica de Cuentas (Vertical Slice).
app.UseCuentasEndpoints();

// Inicia la aplicación y comienza a escuchar las peticiones HTTP entrantes.
app.Run();
