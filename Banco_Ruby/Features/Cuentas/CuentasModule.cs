using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Features.Cuentas.Infrastructure.Repositories;
using BancoCenit.Features.Cuentas.Infrastructure.Gateways;
using BancoCenit.Features.Cuentas.Presentation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using MediatR;
using BancoCenit.Common.Behaviors;
using Polly;
using Polly.Extensions.Http;
using System;
using System.Net.Http;

namespace BancoCenit.Features.Cuentas
{
    // MÃ³dulo modular que agrupa los servicios y endpoints de la caracterÃ­stica de Cuentas (Vertical Slice) en Banco Ruby.
    // Sigue principios de arquitectura modular y cohesiÃ³n.
    public static class CuentasModule
    {
        // Registra en el contenedor de IoC los repositorios, gateways y mediadores asociados a la caracterÃ­stica de cuentas.
        // services: Contenedor de servicios.
        // <returns>La instancia modificada de IServiceCollection.</returns>
        public static IServiceCollection AddCuentasServices(this IServiceCollection services)
        {
            // Registra la implementaciÃ³n de CuentaRepository para el acceso a datos.
            services.AddScoped<ICuentaRepository, CuentaRepository>();

            // Registra validadores de FluentValidation del ensamblado
            services.AddValidatorsFromAssembly(typeof(CuentasModule).Assembly);

            // Registra MediatR, manejadores y el pipeline behavior de validaciones estructuradas
            services.AddMediatR(cfg => 
            {
                cfg.RegisterServicesFromAssembly(typeof(CuentasModule).Assembly);
                cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
            });

            // Registra la implementaciÃ³n del gateway para transferencias salientes con soporte de HttpClient y resiliencia de Polly (Retry & Circuit Breaker)
            services.AddHttpClient<ITransferenciaGateway, TransferenciaGateway>()
                .AddPolicyHandler(GetRetryPolicy())
                .AddPolicyHandler(GetCircuitBreakerPolicy());

            return services;
        }

        // Configura y registra los endpoints HTTP de la caracterÃ­stica de Cuentas en el pipeline de enrutamiento.
        public static IEndpointRouteBuilder UseCuentasEndpoints(this IEndpointRouteBuilder app)
        {
            return CuentaEndpoint.MapCuentaEndpoints(app);
        }

        private static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
        }

        private static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .CircuitBreakerAsync(3, TimeSpan.FromSeconds(30));
        }
    }
}
