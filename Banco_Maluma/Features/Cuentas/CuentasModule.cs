using BancoMaluma.Features.Cuentas.Domain;
using BancoMaluma.Features.Cuentas.Endpoint;
using BancoMaluma.Features.Cuentas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace BancoMaluma.Features.Cuentas
{
    /// <summary>
    /// Módulo modular que agrupa los servicios y endpoints de la característica de Cuentas (Vertical Slice) en Banco Maluma.
    /// Sigue principios de arquitectura modular y cohesión.
    /// </summary>
    public static class CuentasModule
    {
        /// <summary>
        /// Registra en el contenedor de IoC los repositorios y servicios asociados a la característica de cuentas.
        /// </summary>
        /// <param name="services">Contenedor de servicios.</param>
        /// <returns>La instancia modificada de <see cref="IServiceCollection"/>.</returns>
        public static IServiceCollection AddCuentasServices(this IServiceCollection services)
        {
            // Registra la implementación de CuentaRepository para el acceso a datos.
            services.AddScoped<ICuentaRepository, CuentaRepository>();
            return services;
        }

        /// <summary>
        /// Configura y registra los endpoints HTTP de la característica de Cuentas en el pipeline de enrutamiento.
        /// </summary>
        /// <param name="group">Constructor del grupo de rutas del pipeline.</param>
        /// <returns>El constructor del grupo de rutas modificado.</returns>
        public static RouteGroupBuilder MapCuentaEndpoints(this RouteGroupBuilder group)
        {
            CuentaEndpoint.MapCuentaEndpoints(group);
            return group;
        }
    }
}
