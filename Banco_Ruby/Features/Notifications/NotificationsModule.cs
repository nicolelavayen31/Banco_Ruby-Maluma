using BancoCenit.Features.Notifications.Domain;
using BancoCenit.Features.Notifications.Infrastructure.Configuration;
using BancoCenit.Features.Notifications.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BancoCenit.Features.Notifications
{
    // MÃ³dulo modular que registra los servicios y configuraciones de la caracterÃ­stica de Notificaciones en Banco Ruby.
    public static class NotificationsModule
    {
        // Registra en el contenedor de IoC la configuraciÃ³n de Brevo y el BrevoEmailService usando HttpClient tipado.
        public static IServiceCollection AddNotificationsServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Vincula la secciÃ³n "Brevo" de appsettings.json al objeto BrevoOptions
            services.Configure<BrevoOptions>(configuration.GetSection("Brevo"));

            // Registra el HttpClient tipado para BrevoEmailService
            services.AddHttpClient<IEmailService, BrevoEmailService>();

            return services;
        }
    }
}
