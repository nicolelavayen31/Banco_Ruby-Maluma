using BancoMaluma.Features.Cuentas;
using Microsoft.AspNetCore.Builder;

namespace BancoMaluma.Infrastructure.Extensions
{
    /// <summary>
    /// Métodos de extensión para configurar el pipeline de middleware HTTP de ASP.NET Core.
    /// </summary>
    public static class WebApplicationExtensions
    {
        /// <summary>
        /// Mapea de manera centralizada todos los endpoints de negocio de los distintos módulos de la aplicación.
        /// Configura dos RouteGroups independientes (sin prefijo y con prefijo "/api") para máxima compatibilidad.
        /// </summary>
        /// <param name="app">La tubería de la aplicación web.</param>
        /// <returns>La misma instancia de <see cref="WebApplication"/>.</returns>
        public static WebApplication UseMapEndpoints(this WebApplication app)
        {
            // Crea un grupo de rutas en la raíz (compatibilidad con llamadas legacy).
            var rootGroup = app.MapGroup("");
            
            // Crea un grupo de rutas con el prefijo /api (estándar REST moderno).
            var apiGroup = app.MapGroup("api");

            // Registra los endpoints de cuentas en ambos grupos.
            CuentasModule.MapCuentaEndpoints(rootGroup);
            CuentasModule.MapCuentaEndpoints(apiGroup);

            return app;
        }
    }
}
