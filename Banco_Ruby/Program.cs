using BancoCenit.Extensions;
using BancoCenit.Features;
using BancoCenit.Features.Cuentas;
using BancoCenit.Features.Notifications;
using BancoCenit.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Scalar.AspNetCore;
using Serilog;
using System.IO;

// Inicializa el constructor de la aplicación web ASP.NET Core con los argumentos de la línea de comandos.
WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configurar Serilog para guardar logs en la consola y archivos locales
var logDir = Path.Combine(Directory.GetCurrentDirectory(), "logs");
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
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BancoRubyDbContext>();
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
