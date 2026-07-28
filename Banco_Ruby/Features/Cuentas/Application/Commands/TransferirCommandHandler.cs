using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Application.DTOs;
using BancoCenit.Features.Cuentas.Domain.Services;
using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Features.Notifications.Domain;
using BancoCenit.Features.Notifications.Infrastructure.Configuration;
using FluentResults;
using MediatR;
using Microsoft.Extensions.Options;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Manejador de MediatR para realizar transferencias locales e interbancarias en Banco Ruby.
    /// Utiliza el servicio de dominio TransferenciaService para aplicar las reglas consistentes.
    /// </summary>
    public class TransferirCommandHandler : IRequestHandler<TransferirCommand, Result<OperacionResponse>>
    {
        private readonly ICuentaRepository _repository;
        private readonly ITransferenciaGateway _gateway;
        private readonly IEmailService _emailService;
        private readonly BrevoOptions _brevoOptions;

        public TransferirCommandHandler(
            ICuentaRepository repository, 
            ITransferenciaGateway gateway,
            IEmailService emailService,
            IOptions<BrevoOptions> brevoOptions)
        {
            _repository = repository;
            _gateway = gateway;
            _emailService = emailService;
            _brevoOptions = brevoOptions?.Value ?? new BrevoOptions();
        }

        public async Task<Result<OperacionResponse>> Handle(TransferirCommand command, CancellationToken cancellationToken)
        {
            // 1. Validar idempotencia primero si se especifica un TransactionId
            if (!string.IsNullOrWhiteSpace(command.TransactionId))
            {
                var registroIdempotencia = await _repository.GetIdempotenciaAsync(command.TransactionId, cancellationToken);
                if (registroIdempotencia != null)
                {
                    try
                    {
                        var cachedResponse = System.Text.Json.JsonSerializer.Deserialize<OperacionResponse>(registroIdempotencia.ResponseJson);
                        if (cachedResponse != null)
                        {
                            return Result.Ok(cachedResponse);
                        }
                    }
                    catch
                    {
                        // Si falla la deserialización, continuar con el flujo normal
                    }
                }
            }

            if (command.NumeroCuentaOrigen == command.NumeroCuentaDestino)
            {
                return Result.Fail<OperacionResponse>("La cuenta origen y destino no pueden ser la misma.");
            }

            // Iniciar transacción de base de datos
            await _repository.BeginTransactionAsync(cancellationToken);

            try
            {
                var origenResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuentaOrigen, cancellationToken);
                if (origenResult.IsFailed)
                {
                    await _repository.RollbackTransactionAsync(cancellationToken);
                    return Result.Fail<OperacionResponse>("Cuenta origen no encontrada o inactiva.");
                }

                Cuenta origen = origenResult.Value;

                // Busca cuenta destino de manera opcional (local)
                Cuenta? destino = null;
                var destinoResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuentaDestino, cancellationToken);
                if (destinoResult.IsSuccess)
                {
                    destino = destinoResult.Value;
                }

                var request = new TransferenciaRequest(command.NumeroCuentaOrigen, command.NumeroCuentaDestino, command.Monto, command.TransactionId);

                // Resolver los UUIDs de cuenta asignados por el integrador
                string cuentaOrigenUuid = origen.IntegradorAccountId ?? origen.NumeroCuenta;
                string cuentaDestinoUuid = destino?.IntegradorAccountId ?? command.NumeroCuentaDestino;

                // Ejecuta la transferencia mediante el servicio de dominio
                TransferenciaExecutionResult resultado = await TransferenciaService.EjecutarTransferenciaAsync(
                    origen,
                    destino,
                    request,
                    () => _gateway.EnviarAsync(cuentaOrigenUuid, cuentaDestinoUuid, command.Monto, cancellationToken)
                );

                if (!resultado.IsSuccess)
                {
                    await _repository.RollbackTransactionAsync(cancellationToken);
                    return Result.Fail<OperacionResponse>(resultado.Error!);
                }

                decimal comision = destino is null ? 0.41m : 0m;
                decimal totalDebitado = command.Monto + comision;

                // Registrar auditoría para emisor
                var auditOrigen = new Auditoria
                {
                    CuentaId = origen.CuentaId,
                    NumeroCuenta = origen.NumeroCuenta,
                    Tipo = "Transferencia enviada",
                    Monto = totalDebitado,
                    Descripcion = destino is null
                        ? $"Se envió transferencia interbancaria de ${command.Monto:N2} a la cuenta externa {command.NumeroCuentaDestino} más comisión de $0.41."
                        : $"Se envió transferencia de ${command.Monto:N2} a la cuenta {destino.NumeroCuenta}.",
                    CreadoEn = DateTime.UtcNow
                };

                await _repository.RegistrarAuditoriaAsync(auditOrigen, cancellationToken);
                await _repository.UpdateAsync(origen, cancellationToken);

                // Registrar auditoría para receptor (solo si es local)
                if (destino is not null)
                {
                    var auditDestino = new Auditoria
                    {
                        CuentaId = destino.CuentaId,
                        NumeroCuenta = destino.NumeroCuenta,
                        Tipo = "Transferencia recibida",
                        Monto = command.Monto,
                        Descripcion = $"Se recibió transferencia de la cuenta {origen.NumeroCuenta} por ${command.Monto:N2}.",
                        CreadoEn = DateTime.UtcNow
                    };
                    await _repository.RegistrarAuditoriaAsync(auditDestino, cancellationToken);
                    await _repository.UpdateAsync(destino, cancellationToken);
                }

                string mensaje = destino is null
                    ? $"Transferencia de ${command.Monto:N2} realizada exitosamente desde Banco Ruby hacia la cuenta {command.NumeroCuentaDestino}."
                    : $"Transferencia de ${command.Monto:N2} realizada de {origen.NumeroCuenta} a {destino.NumeroCuenta}.";

                var responseValue = new OperacionResponse(mensaje, origen.Saldo);

                // 2. Registrar idempotencia antes de confirmar transacción
                if (!string.IsNullOrWhiteSpace(command.TransactionId))
                {
                    var responseJson = System.Text.Json.JsonSerializer.Serialize(responseValue);
                    await _repository.RegistrarIdempotenciaAsync(new Idempotencia
                    {
                        TransactionId = command.TransactionId,
                        ResponseJson = responseJson
                    }, cancellationToken);
                    await _repository.SaveChangesAsync(cancellationToken);
                }

                // Confirmar transacción de base de datos
                await _repository.CommitTransactionAsync(cancellationToken);

                // Enviar correo de notificación transaccional asíncrono (fuera de la transacción)
                string subject = "Confirmación de Transferencia - Banco Ruby";
                string htmlContent = $@"
                    <html>
                        <body style='font-family: Arial, sans-serif; color: #333;'>
                            <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                                <h2 style='color: #d32f2f;'>Banco Ruby - Transferencia Realizada</h2>
                                <p>Hola, <b>{origen.Usuario?.Nombre ?? "Cliente"}</b>.</p>
                                <p>Te notificamos que se ha realizado una transferencia con los siguientes detalles:</p>
                                <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                                    <tr>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Cuenta Origen:</td>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>{origen.NumeroCuenta}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Cuenta Destino:</td>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>{command.NumeroCuentaDestino}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Monto:</td>
                                        <td style='padding: 8px; border-bottom: 1px solid #eee; color: #d32f2f; font-weight: bold;'>${command.Monto:N2}</td>
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
                        origen.Usuario?.Nombre ?? "Cliente", 
                        subject, 
                        htmlContent, 
                        CancellationToken.None
                    ), CancellationToken.None);
                }

                return Result.Ok(responseValue);
            }
            catch (Exception)
            {
                await _repository.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
    }
}
