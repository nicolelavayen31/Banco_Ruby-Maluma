using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Options;
using Serilog;
using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Domain.Events;
using BancoCenit.Features.Notifications.Domain;
using BancoCenit.Features.Notifications.Infrastructure.Configuration;

namespace BancoCenit.Features.Cuentas.Application.Handlers
{
    // Manejador de eventos unificado para registrar la auditorÃ­a y enviar correos de cuentas (depÃ³sitos y retiros) de forma asÃ­ncrona.
    public class AccountEventHandlers : 
        INotificationHandler<DepositoRealizadoEvent>,
        INotificationHandler<RetiroRealizadoEvent>
    {
        private readonly ICuentaRepository _repository;
        private readonly IEmailService _emailService;
        private readonly BrevoOptions _brevoOptions;

        public AccountEventHandlers(
            ICuentaRepository repository,
            IEmailService emailService,
            IOptions<BrevoOptions> brevoOptions)
        {
            _repository = repository;
            _emailService = emailService;
            _brevoOptions = brevoOptions?.Value ?? new BrevoOptions();
        }

        // Manejador del evento de depÃ³sito
        public async Task Handle(DepositoRealizadoEvent notification, CancellationToken cancellationToken)
        {
            try
            {
                await RegistrarAuditoriaAsync(notification.Cuenta, "DepÃ³sito", notification.Monto, $"Se acreditÃ³ a la cuenta ${notification.Monto:N2}.", cancellationToken);
                
                string htmlContent = EmailTemplates.BuildDepositHtml(notification.Cuenta, notification.Monto);
                string titularNombre = notification.Cuenta.Usuario?.Nombre ?? "Cliente";
                
                await EnviarEmailAsync(titularNombre, "ConfirmaciÃ³n de DepÃ³sito - Banco Ruby", htmlContent);
                Log.Information("AuditorÃ­a y correo de depÃ³sito procesados con Ã©xito (Manejador Unificado).");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error al procesar el evento de depÃ³sito realizado en el manejador unificado");
            }
        }

        // Manejador del evento de retiro
        public async Task Handle(RetiroRealizadoEvent notification, CancellationToken cancellationToken)
        {
            try
            {
                await RegistrarAuditoriaAsync(notification.Cuenta, "Retiro", notification.Monto, $"Se debitÃ³ de la cuenta ${notification.Monto:N2}.", cancellationToken);
                
                string htmlContent = EmailTemplates.BuildWithdrawHtml(notification.Cuenta, notification.Monto);
                string titularNombre = notification.Cuenta.Usuario?.Nombre ?? "Cliente";
                
                await EnviarEmailAsync(titularNombre, "ConfirmaciÃ³n de Retiro - Banco Ruby", htmlContent);
                Log.Information("AuditorÃ­a y correo de retiro procesados con Ã©xito (Manejador Unificado).");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error al procesar el evento de retiro realizado en el manejador unificado");
            }
        }

        private async Task RegistrarAuditoriaAsync(Cuenta cuenta, string tipo, decimal monto, string descripcion, CancellationToken cancellationToken)
        {
            Auditoria auditoria = new Auditoria
            {
                CuentaId = cuenta.CuentaId,
                NumeroCuenta = cuenta.NumeroCuenta,
                Tipo = tipo,
                Monto = monto,
                Descripcion = descripcion,
                CreadoEn = DateTime.UtcNow
            };

            await _repository.RegistrarAuditoriaAsync(auditoria, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
        }

        private async Task EnviarEmailAsync(string titularNombre, string subject, string htmlContent)
        {
            string destinatariosRaw = string.IsNullOrWhiteSpace(_brevoOptions.DestinatariosPrueba)
                ? "nicoa6088@gmail.com"
                : _brevoOptions.DestinatariosPrueba;

            string[] destinatarios = destinatariosRaw.Split(',', StringSplitOptions.RemoveEmptyEntries);

            foreach (string email in destinatarios)
            {
                string targetEmail = email.Trim();
                _ = Task.Run(() => _emailService.SendEmailAsync(
                    targetEmail,
                    titularNombre,
                    subject,
                    htmlContent,
                    CancellationToken.None
                ));
            }
            await Task.CompletedTask;
        }
    }
}
