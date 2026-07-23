using BancoCenit.Features.Notifications.Domain;
using BancoCenit.Features.Notifications.Infrastructure.Configuration;
using BancoCenit.Features.Notifications.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BancoCenit.Features.Notifications
{
    /// <summary>
    /// Módulo modular que registra los servicios y configuraciones de la característica de Notificaciones en Banco Ruby.
    /// </summary>
    public static class NotificationsModule
    {
        /// <summary>
        /// Registra en el contenedor de IoC la configuración de Brevo y el BrevoEmailService usando HttpClient tipado.
        /// </summary>
        public static IServiceCollection AddNotificationsServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Vincula la sección "Brevo" de appsettings.json al objeto BrevoOptions
            services.Configure<BrevoOptions>(configuration.GetSection("Brevo"));

            // Registra el HttpClient tipado para BrevoEmailService
            services.AddHttpClient<IEmailService, BrevoEmailService>();

            return services;
        }
    }
}
