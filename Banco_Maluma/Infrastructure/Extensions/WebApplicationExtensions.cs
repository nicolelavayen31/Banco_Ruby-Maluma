using BancoMaluma.Features.Cuentas;
using Microsoft.AspNetCore.Builder;

namespace BancoMaluma.Infrastructure.Extensions
{
    public static class WebApplicationExtensions
    {
        public static WebApplication UseMapEndpoints(this WebApplication app)
        {
            var rootGroup = app.MapGroup("");
            var apiGroup = app.MapGroup("api");

            CuentasModule.MapCuentaEndpoints(rootGroup);
            CuentasModule.MapCuentaEndpoints(apiGroup);

            return app;
        }
    }
}
