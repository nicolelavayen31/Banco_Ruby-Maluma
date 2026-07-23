namespace BancoCenit.Features.Notifications.Infrastructure.Configuration
{
    /// <summary>
    /// Configuración tipada para el cliente de correo Brevo API.
    /// Mapea las propiedades declaradas en appsettings.json.
    /// </summary>
    public sealed class BrevoOptions
    {
        /// <summary>
        /// Api Key de autenticación provista por Brevo.
        /// </summary>
        public string ApiKey { get; set; } = string.Empty;

        /// <summary>
        /// Correo electrónico institucional del emisor (remitente).
        /// </summary>
        public string SenderEmail { get; set; } = string.Empty;

        /// <summary>
        /// Nombre comercial del emisor (remitente).
        /// </summary>
        public string SenderName { get; set; } = string.Empty;

        /// <summary>
        /// Lista de correos destinatarios de prueba separados por coma.
        /// </summary>
        public string DestinatariosPrueba { get; set; } = string.Empty;
    }
}
