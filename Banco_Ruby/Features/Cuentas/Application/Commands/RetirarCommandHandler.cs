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
    /// Manejador de MediatR para retirar fondos en Banco Ruby.
    /// Contiene las validaciones físicas y de negocio (billetes de 10, comisiones y límites).
    /// </summary>
    public class RetirarCommandHandler : IRequestHandler<RetirarCommand, Result<OperacionResponse>>
    {
        private const decimal COMISION = 0.41m;
        private readonly ICuentaRepository _repository;
        private readonly IEmailService _emailService;
        private readonly BrevoOptions _brevoOptions;

        public RetirarCommandHandler(
            ICuentaRepository repository,
            IEmailService emailService,
            IOptions<BrevoOptions> brevoOptions)
        {
            _repository = repository;
            _emailService = emailService;
            _brevoOptions = brevoOptions?.Value ?? new BrevoOptions();
        }

        public async Task<Result<OperacionResponse>> Handle(RetirarCommand command, CancellationToken cancellationToken)
        {
            if (command.Monto <= 0)
            {
                return Result.Fail<OperacionResponse>("El monto debe ser mayor que cero.");
            }

            if (command.Monto % 10 != 0)
            {
                return Result.Fail<OperacionResponse>("El retiro debe ser múltiplo de 10.");
            }

            if (command.Monto > 500)
            {
                return Result.Fail<OperacionResponse>("El retiro excede el límite de 500.");
            }

            var cuentaResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuenta, cancellationToken);
            if (cuentaResult.IsFailed)
            {
                return Result.Fail<OperacionResponse>(cuentaResult.Errors);
            }

            Cuenta cuenta = cuentaResult.Value;

            decimal totalDebitado = command.Monto + COMISION;

            if (totalDebitado > cuenta.Saldo)
            {
                return Result.Fail<OperacionResponse>("Fondos insuficientes.");
            }

            // Debita los fondos
            cuenta.Saldo -= totalDebitado;

            var auditoria = new Auditoria
            {
                CuentaId = cuenta.CuentaId,
                NumeroCuenta = cuenta.NumeroCuenta,
                Tipo = "Retiro",
                Monto = totalDebitado,
                Descripcion = $"Se debitó de la cuenta ${command.Monto:N2} más comisión de ${COMISION:N2}.",
                CreadoEn = DateTime.UtcNow
            };

            await _repository.RegistrarAuditoriaAsync(auditoria, cancellationToken);
            await _repository.UpdateAsync(cuenta, cancellationToken);

            string msg = $"Retiro de ${command.Monto:N2} realizado con comisión de ${COMISION:N2}.";
            string titularNombre = cuenta.Usuario?.Nombre ?? "Cliente";

            // Enviar correo de notificación de retiro
            string subject = "Confirmación de Retiro - Banco Ruby";
            string htmlContent = $@"
                <html>
                    <body style='font-family: Arial, sans-serif; color: #333;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                            <h2 style='color: #c62828;'>Banco Ruby - Retiro Realizado</h2>
                            <p>Hola, <b>{titularNombre}</b>.</p>
                            <p>Se ha realizado un retiro de efectivo en tu cuenta con los siguientes detalles:</p>
                            <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Número de Cuenta:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>{cuenta.NumeroCuenta}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Monto Retirado:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; color: #c62828; font-weight: bold;'>${command.Monto:N2}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Comisión de Operación:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>${COMISION:N2}</td>
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
