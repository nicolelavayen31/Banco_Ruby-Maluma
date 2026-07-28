using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Features.Notifications.Domain;
using BancoCenit.Features.Notifications.Infrastructure.Configuration;
using FluentResults;
using MediatR;
using Microsoft.Extensions.Options;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Manejador de MediatR para depositar fondos en Banco Ruby.
    /// </summary>
    public class DepositarCommandHandler : IRequestHandler<DepositarCommand, Result<OperacionResponse>>
    {
        private readonly ICuentaRepository _repository;
        private readonly IEmailService _emailService;
        private readonly BrevoOptions _brevoOptions;

        public DepositarCommandHandler(
            ICuentaRepository repository,
            IEmailService emailService,
            IOptions<BrevoOptions> brevoOptions)
        {
            _repository = repository;
            _emailService = emailService;
            _brevoOptions = brevoOptions?.Value ?? new BrevoOptions();
        }

        public async Task<Result<OperacionResponse>> Handle(DepositarCommand command, CancellationToken cancellationToken)
        {
            if (command.Monto <= 0)
            {
                return Result.Fail<OperacionResponse>("El monto debe ser mayor que cero.");
            }

            var cuentaResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuenta, cancellationToken);
            if (cuentaResult.IsFailed)
            {
                return Result.Fail<OperacionResponse>(cuentaResult.Errors);
            }

            Cuenta cuenta = cuentaResult.Value;

            // Incrementa el saldo
            cuenta.Acreditar(command.Monto);

            var auditoria = new Auditoria
            {
                CuentaId = cuenta.CuentaId,
                NumeroCuenta = cuenta.NumeroCuenta,
                Tipo = "Depósito",
                Monto = command.Monto,
                Descripcion = $"Se acreditó a la cuenta ${command.Monto:N2}.",
                CreadoEn = DateTime.UtcNow
            };

            await _repository.RegistrarAuditoriaAsync(auditoria, cancellationToken);
            await _repository.UpdateAsync(cuenta, cancellationToken);

            string msg = $"Depósito de ${command.Monto:N2} realizado.";
            string titularNombre = cuenta.Usuario?.Nombre ?? "Cliente";

            // Enviar correo de notificación de depósito
            string subject = "Confirmación de Depósito - Banco Ruby";
            string htmlContent = $@"
                <html>
                    <body style='font-family: Arial, sans-serif; color: #333;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                            <h2 style='color: #2e7d32;'>Banco Ruby - Depósito Exitoso</h2>
                            <p>Hola, <b>{titularNombre}</b>.</p>
                            <p>Tu cuenta ha recibido un depósito de efectivo con los siguientes detalles:</p>
                            <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Número de Cuenta:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>{cuenta.NumeroCuenta}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Monto Depositado:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; color: #2e7d32; font-weight: bold;'>${command.Monto:N2}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Saldo Disponible:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>${cuenta.Saldo:N2}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Fecha/Hora:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>{DateTime.Now:dd/MM/yyyy HH:mm:ss}</td>
                                </tr>
                            </table>
                            <br/>
                            <p style='font-size: 12px; color: #777;'>Este es un correo transaccional automático enviado de forma segura por Banco Ruby.</p>
                        </div>
                    </body>
                </html>";

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
                ), CancellationToken.None);
            }

            return Result.Ok(new OperacionResponse(msg, cuenta.Saldo));
        }
    }
}
