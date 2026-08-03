namespace BancoCenit.Features.Notifications.Infrastructure.Configuration
{
    // ConfiguraciÃ³n tipada para el cliente de correo Brevo API.
    // Mapea las propiedades declaradas en appsettings.json.
    public sealed class BrevoOptions
    {
        // Api Key de autenticaciÃ³n provista por Brevo.
        public string ApiKey { get; set; } = string.Empty;

        // Correo electrÃ³nico institucional del emisor (remitente).
        public string SenderEmail { get; set; } = string.Empty;

        // Nombre comercial del emisor (remitente).
        public string SenderName { get; set; } = string.Empty;

        // Lista de correos destinatarios de prueba separados por coma.
        public string DestinatariosPrueba { get; set; } = string.Empty;
    }
}
