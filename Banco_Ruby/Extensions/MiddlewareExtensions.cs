using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace BancoCenit.Extensions;

/// <summary>
/// Proporciona métodos de extensión para configurar el pipeline de middleware HTTP de la aplicación.
/// Estructura el manejo global de excepciones, redirecciones y respuestas de error estandarizadas.
/// </summary>
public static class MiddlewareExtensions
{
    /// <summary>
    /// Configura y encadena los middlewares HTTP requeridos para procesar las solicitudes en la aplicación.
    /// </summary>
    /// <param name="app">La instancia de la aplicación web.</param>
    /// <returns>La instancia modificada de <see cref="WebApplication"/>.</returns>
    public static WebApplication UseApplicationPipeline(this WebApplication app)
    {
        // En entorno de desarrollo, se puede habilitar comportamiento de depuración específico si es necesario.
        if (app.Environment.IsDevelopment())
        {
            // In development keep default developer exceptions if present; nothing required here.
        }

        // Inyectar cabeceras de seguridad HTTP recomendadas
        app.Use(async (context, next) =>
        {
            context.Response.Headers.Append("X-Frame-Options", "DENY");
            context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
            context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
            context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'");
            await next();
        });

        // Habilitar el middleware de control de tasa (Rate Limiting)
        app.UseRateLimiter();

        // Middleware que proporciona respuestas descriptivas por defecto para códigos de estado de error HTTP comunes (ej. 404, 403).
        app.UseStatusCodePages();

        // Redirecciona todas las peticiones HTTP hacia HTTPS para proteger la confidencialidad de la comunicación bancaria.
        app.UseHttpsRedirection();

        // Middleware global para la captura de excepciones no controladas en el servidor.
        // Captura cualquier error fatal en tiempo de ejecución y retorna una respuesta JSON limpia estructurada.
        app.UseExceptionHandler(handlerApp =>
        {
            handlerApp.Run(async context =>
            {
                var exceptionHandlerFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
                if (exceptionHandlerFeature?.Error is FluentValidation.ValidationException valEx)
                {
                    // Errores de validación estructurados de FluentValidation (400 Bad Request)
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    context.Response.ContentType = "application/json";
                    var errors = valEx.Errors.Select(e => e.ErrorMessage).ToList();
                    await context.Response.WriteAsJsonAsync(new { error = string.Join("; ", errors), details = errors });
                }
                else
                {
                    // Errores inesperados del sistema (500 Internal Server Error)
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    context.Response.ContentType = "application/json";
                    
                    // Retorna un mensaje seguro para no filtrar información interna del servidor (stack traces, variables de entorno) hacia el exterior.
                    await context.Response.WriteAsJsonAsync(new { error = "Ocurrió un error inesperado en el servidor." });
                }
            });
        });

        return app;
    }
}
