using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Features.Cuentas.Infrastructure.Repositories;
using BancoCenit.Features.Cuentas.Infrastructure.Gateways;
using BancoCenit.Features.Cuentas.Presentation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace BancoCenit.Features.Cuentas
{
    /// <summary>
    /// Módulo modular que agrupa los servicios y endpoints de la característica de Cuentas (Vertical Slice) en Banco Ruby.
    /// Sigue principios de arquitectura modular y cohesión.
    /// </summary>
    public static class CuentasModule
    {
        /// <summary>
        /// Registra en el contenedor de IoC los repositorios, gateways y mediadores asociados a la característica de cuentas.
        /// </summary>
        /// <param name="services">Contenedor de servicios.</param>
        /// <returns>La instancia modificada de <see cref="IServiceCollection"/>.</returns>
        public static IServiceCollection AddCuentasServices(this IServiceCollection services)
        {
            // Registra la implementación de CuentaRepository para el acceso a datos.
            services.AddScoped<ICuentaRepository, CuentaRepository>();

            // Registra la implementación del gateway para transferencias salientes con soporte de HttpClient.
            services.AddHttpClient<ITransferenciaGateway, TransferenciaGateway>();

            // Registra MediatR para escanear y registrar automáticamente todos los comandos y manejadores de este ensamblado
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(CuentasModule).Assembly));

            return services;
        }

        /// <summary>
        /// Configura y registra los endpoints HTTP de la característica de Cuentas en el pipeline de enrutamiento.
        /// </summary>
        public static IEndpointRouteBuilder UseCuentasEndpoints(this IEndpointRouteBuilder app)
        {
            return CuentaEndpoint.MapCuentaEndpoints(app);
        }
    }
}
