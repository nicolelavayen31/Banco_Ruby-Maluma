using BancoMaluma.Features.Cuentas.Domain;
using BancoMaluma.Features.Cuentas.Endpoint;
using BancoMaluma.Features.Cuentas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace BancoMaluma.Features.Cuentas
{
    public static class CuentasModule
    {
        public static IServiceCollection AddCuentasServices(this IServiceCollection services)
        {
            services.AddScoped<ICuentaRepository, CuentaRepository>();
            return services;
        }

        public static RouteGroupBuilder MapCuentaEndpoints(this RouteGroupBuilder group)
        {
            CuentaEndpoint.MapCuentaEndpoints(group);
            return group;
        }
    }
}
