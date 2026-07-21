using BancoMaluma.Features.Cuentas;
using BancoMaluma.Infrastructure.Extensions;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Register DB contexts
builder.Services.AddReadDatabase(builder.Configuration);
builder.Services.AddWriteDatabase(builder.Configuration);

// Add MediatR, HttpClient and OpenApi
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
builder.Services.AddHttpClient();
builder.Services.AddOpenApi();

// Register Feature services
builder.Services.AddCuentasServices();

var app = builder.Build();

string? connStr = builder.Configuration.GetConnectionString("BancoMaluma");
if (!string.IsNullOrEmpty(connStr))
{
    await BancoMaluma.Infrastructure.Persistence.DbInitializer.InitializeAsync(connStr);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapGet("/health", () => Results.Ok(new { status = "OK", banco = "Banco Maluma" }))
   .WithName("Health");

app.UseMapEndpoints();

app.Run();
