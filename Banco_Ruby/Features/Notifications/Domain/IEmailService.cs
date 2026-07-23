using System.Threading;
using System.Threading.Tasks;

namespace BancoCenit.Features.Notifications.Domain
{
    /// <summary>
    /// Interfaz del dominio para el servicio de envío de correos transaccionales.
    /// Define el contrato de salida para las notificaciones por correo de Banco Ruby.
    /// </summary>
    public interface IEmailService
    {
        /// <summary>
        /// Envía un correo electrónico de forma asíncrona.
        /// </summary>
        /// <param name="toEmail">Correo electrónico del destinatario.</param>
        /// <param name="toName">Nombre del destinatario.</param>
        /// <param name="subject">Asunto del correo electrónico.</param>
        /// <param name="htmlContent">Contenido del correo estructurado en formato HTML.</param>
        /// <param name="cancellationToken">Token de cancelación para abortar la petición.</param>
        /// <returns>True si el correo fue enviado y aceptado con éxito por el servidor SMTP; de lo contrario, False.</returns>
        Task<bool> SendEmailAsync(
            string toEmail, 
            string toName, 
            string subject, 
            string htmlContent, 
            CancellationToken cancellationToken = default);
    }
}
