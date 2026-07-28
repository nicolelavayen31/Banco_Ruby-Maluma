using BancoMaluma.Features.Cuentas;
using BancoMaluma.Infrastructure.Extensions;
using Scalar.AspNetCore;

// Inicializa el host constructor de la aplicación web ASP.NET Core para Banco Maluma.
var builder = WebApplication.CreateBuilder(args);

// Registro de los contextos segregados de base de datos PostgreSQL (CQRS - Segregación de responsabilidades de lectura y escritura).
builder.Services.AddReadDatabase(builder.Configuration);
builder.Services.AddWriteDatabase(builder.Configuration);

// Registro de MediatR para habilitar el patrón Mediator de envío de Comandos y Consultas de forma desacoplada.
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// Registra la factoría de clientes HTTP para llamadas salientes al Integrador ATM.
builder.Services.AddHttpClient();

// Genera la especificación OpenAPI (Swagger/Scalar) para documentar e interactuar con el API.
builder.Services.AddOpenApi();

// Registrar los servicios modulares y repositorios de la característica de Cuentas (Vertical Slice).
builder.Services.AddCuentasServices();

var app = builder.Build();

// Inicialización asíncrona de base de datos (creación del esquema semilla, tablas y datos iniciales en PostgreSQL).
string? connStr = builder.Configuration.GetConnectionString("BancoMaluma");
if (!string.IsNullOrEmpty(connStr))
{
    await BancoMaluma.Infrastructure.Persistence.DbInitializer.InitializeAsync(connStr);
}

// Configura la UI interactiva de documentación OpenAPI (Scalar).
app.MapOpenApi();
app.MapScalarApiReference();

// Endpoint público de salud (Liveness check) para monitorizar el estado de Banco Maluma.
app.MapGet("/health", () => Results.Ok(new { status = "OK", banco = "Banco Maluma" }))
   .WithName("Health");

// Mapea los endpoints de negocio de la característica de Cuentas (Vertical Slice).
app.UseMapEndpoints();

app.Run();
