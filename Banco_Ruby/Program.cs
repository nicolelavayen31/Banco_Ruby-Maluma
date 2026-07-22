using BancoCenit.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

// Inicializa el constructor de la aplicación web ASP.NET Core con los argumentos de la línea de comandos.
WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configura y registra los servicios del contenedor de Inyección de Dependencias (DI).
// Encapsula la base de datos (PostgreSQL), la pasarela de transferencias y otras dependencias necesarias.
builder.Services.AddApplicationServices(builder.Configuration);

// Construye la instancia de WebApplication para configurar el pipeline de solicitudes HTTP.
WebApplication app = builder.Build();

// Configura el pipeline de middleware HTTP de la aplicación (CORS, enrutamiento, manejo de excepciones).
app.UseApplicationPipeline();

// Mapea los endpoints mínimos del API de Banco Ruby (Saldo, Depósito, Retiro, Transferencias).
app.MapApplicationEndpoints();

// Inicia la aplicación y comienza a escuchar las peticiones HTTP entrantes.
app.Run();
