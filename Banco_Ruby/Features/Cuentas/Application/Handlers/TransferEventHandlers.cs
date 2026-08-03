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
    // Manejador de eventos para registrar la auditorÃ­a de transferencias realizadas de forma desacoplada.
    public class RegistrarAuditoriaEventHandler : INotificationHandler<TransferenciaRealizadaEvent>
    {
        private readonly ICuentaRepository _repository;

        public RegistrarAuditoriaEventHandler(ICuentaRepository repository)
        {
            _repository = repository;
        }

        public async Task Handle(TransferenciaRealizadaEvent notification, CancellationToken cancellationToken)
        {
            try
            {
                decimal comision = notification.Destino is null ? 0.41m : 0m;
                decimal totalDebitado = notification.Monto + comision;

                // Registrar auditorÃ­a para emisor
                var auditOrigen = new Auditoria
                {
                    CuentaId = notification.Origen.CuentaId,
                    NumeroCuenta = notification.Origen.NumeroCuenta,
                    Tipo = "Transferencia enviada",
                    Monto = totalDebitado,
                    Descripcion = notification.Destino is null
                        ? $"Se enviÃ³ transferencia interbancaria de ${notification.Monto:N2} a la cuenta externa {notification.NumeroCuentaDestino} mÃ¡s comisiÃ³n de $0.41."
                        : $"Se enviÃ³ transferencia de ${notification.Monto:N2} a la cuenta {notification.Destino.NumeroCuenta}.",
                    CreadoEn = DateTime.UtcNow
                };

                await _repository.RegistrarAuditoriaAsync(auditOrigen, cancellationToken);

                // Registrar auditorÃ­a para receptor (solo si es local)
                if (notification.Destino is not null)
                {
                    var auditDestino = new Auditoria
                    {
                        CuentaId = notification.Destino.CuentaId,
                        NumeroCuenta = notification.Destino.NumeroCuenta,
                        Tipo = "Transferencia recibida",
                        Monto = notification.Monto,
                        Descripcion = $"Se recibiÃ³ transferencia de la cuenta {notification.Origen.NumeroCuenta} por ${notification.Monto:N2}.",
                        CreadoEn = DateTime.UtcNow
                    };
                    await _repository.RegistrarAuditoriaAsync(auditDestino, cancellationToken);
                }

                await _repository.SaveChangesAsync(cancellationToken);
                Log.Information("AuditorÃ­a de transferencia registrada exitosamente para la cuenta {NumeroCuenta}", notification.Origen.NumeroCuenta);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error crÃ­tico al registrar auditorÃ­a de transferencia realizada");
            }
        }
    }

    // Manejador de eventos para enviar notificaciones por correo electrÃ³nico al emisor de forma asÃ­ncrona.
    public class EnviarNotificacionEmailEventHandler : 
        INotificationHandler<TransferenciaRealizadaEvent>,
        INotificationHandler<TransferenciaFallidaEvent>
    {
        private readonly IEmailService _emailService;
        private readonly BrevoOptions _brevoOptions;

        public EnviarNotificacionEmailEventHandler(
            IEmailService emailService,
            IOptions<BrevoOptions> brevoOptions)
        {
            _emailService = emailService;
            _brevoOptions = brevoOptions?.Value ?? new BrevoOptions();
        }

        public async Task Handle(TransferenciaRealizadaEvent notification, CancellationToken cancellationToken)
        {
            try
            {
                string subject = "ConfirmaciÃ³n de Transferencia - Banco Ruby";
                string htmlContent = $@"
                    <html>
                        <body style='font-family: Arial, sans-serif; color: #333;'>
                            <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                                <h2 style='color: #d32f2f;'>Banco Ruby - Transferencia Realizada</h2>
                                <p>Hola, <b>{notification.Origen.Usuario?.Nombre ?? "Cliente"}</b>.</p>
                                <p>Te notificamos que se ha realizado una transferencia con los siguientes detalles:</p>
                                <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                                    <tr>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Cuenta Origen:</td>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>{notification.Origen.NumeroCuenta}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Cuenta Destino:</td>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>{notification.NumeroCuentaDestino}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Monto:</td>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; color: #d32f2f; font-weight: bold;'>${notification.Monto:N2}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Fecha/Hora:</td>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>{DateTime.Now:dd/MM/yyyy HH:mm:ss}</td>
                                    </tr>
                                </table>
                                <br/>
                                <p style='font-size: 12px; color: #777;'>Este es un correo transaccional automÃ¡tico enviado de forma segura por Banco Ruby.</p>
                            </div>
                        </body>
                    </html>";

                await EnviarEmailAsync(notification.Origen.Usuario?.Nombre ?? "Cliente", subject, htmlContent);
                Log.Information("Correo de confirmaciÃ³n de transferencia enviado.");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error al enviar correo de confirmaciÃ³n de transferencia");
            }
        }

        public async Task Handle(TransferenciaFallidaEvent notification, CancellationToken cancellationToken)
        {
            try
            {
                string subject = "Transferencia Fallida - Fondos Revertidos - Banco Ruby";
                string htmlContent = $@"
                    <html>
                        <body style='font-family: Arial, sans-serif; color: #333;'>
                            <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                                <h2 style='color: #d32f2f;'>Alerta - Transferencia No Realizada</h2>
                                <p>Hola, <b>{notification.Origen.Usuario?.Nombre ?? "Cliente"}</b>.</p>
                                <p>Te informamos que la transferencia de <b>${notification.Monto:N2}</b> a la cuenta <b>{notification.NumeroCuentaDestino}</b> no pudo ser completada debido a un inconveniente en el integrador de pagos.</p>
                                <p><b>Tus fondos han sido reintegrados de inmediato a tu cuenta.</b></p>
                                <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                                    <tr>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Estado:</td>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; color: #d32f2f; font-weight: bold;'>REVERTIDA</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Saldo Actual:</td>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>${notification.Origen.Saldo:N2}</td>
                                    </tr>
                                </table>
                                <br/>
                                <p style='font-size: 12px; color: #777;'>Este es un correo transaccional automÃ¡tico enviado de forma segura por Banco Ruby.</p>
                            </div>
                        </body>
                    </html>";

                await EnviarEmailAsync(notification.Origen.Usuario?.Nombre ?? "Cliente", subject, htmlContent);
                Log.Information("Correo de reversiÃ³n por transferencia fallida enviado.");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error al enviar correo de reversiÃ³n por transferencia fallida");
            }
        }

        private async Task EnviarEmailAsync(string titularNombre, string subject, string htmlContent)
        {
            string destinatariosRaw = string.IsNullOrWhiteSpace(_brevoOptions.DestinatariosPrueba)
                ? "nicoa6088@gmail.com"
                : _brevoOptions.DestinatariosPrueba;

            string[] destinatarios = destinatariosRaw.Split(',', StringSplitOptions.RemoveEmptyEntries);

            foreach (var email in destinatarios)
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
