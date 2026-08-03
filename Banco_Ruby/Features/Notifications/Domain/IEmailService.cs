using System.Threading;
using System.Threading.Tasks;

namespace BancoCenit.Features.Notifications.Domain
{
    // Interfaz del dominio para el servicio de envÃ­o de correos transaccionales.
    // Define el contrato de salida para las notificaciones por correo de Banco Ruby.
    public interface IEmailService
    {
        // EnvÃ­a un correo electrÃ³nico de forma asÃ­ncrona.
        // toEmail: Correo electrÃ³nico del destinatario.
        // toName: Nombre del destinatario.
        // subject: Asunto del correo electrÃ³nico.
        // htmlContent: Contenido del correo estructurado en formato HTML.
        // cancellationToken: Token de cancelaciÃ³n para abortar la peticiÃ³n.
        // Retorna: True si el correo fue enviado y aceptado con Ã©xito por el servidor SMTP; de lo contrario, False.
        Task<bool> SendEmailAsync(
            string toEmail, 
            string toName, 
            string subject, 
            string htmlContent, 
            CancellationToken cancellationToken = default);
    }
}
