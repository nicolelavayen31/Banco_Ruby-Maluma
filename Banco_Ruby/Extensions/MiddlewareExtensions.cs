using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

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
                // Configura código de error 500 (Internal Server Error) de manera explícita.
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";
                
                // Retorna un mensaje seguro para no filtrar información interna del servidor (stack traces, variables de entorno) hacia el exterior.
                await context.Response.WriteAsJsonAsync(new { error = "Ocurrió un error inesperado en el servidor." });
            });
        });

        return app;
    }
}
