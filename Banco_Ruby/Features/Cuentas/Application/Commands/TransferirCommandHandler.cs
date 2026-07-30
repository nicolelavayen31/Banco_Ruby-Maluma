using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Application.DTOs;
using BancoCenit.Features.Cuentas.Domain.Services;
using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Features.Cuentas.Domain.Events;
using FluentResults;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

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
        private readonly IMediator _mediator;

        public TransferirCommandHandler(
            ICuentaRepository repository, 
            ITransferenciaGateway gateway,
            IMediator mediator)
        {
            _repository = repository;
            _gateway = gateway;
            _mediator = mediator;
        }

        public async Task<Result<OperacionResponse>> Handle(TransferirCommand command, CancellationToken cancellationToken)
        {
            // 1. Validar idempotencia primero si se especifica un TransactionId
            if (!string.IsNullOrWhiteSpace(command.TransactionId))
            {
                Idempotencia? registroIdempotencia = await _repository.GetIdempotenciaAsync(command.TransactionId, cancellationToken);
                if (registroIdempotencia != null)
                {
                    try
                    {
                        OperacionResponse? cachedResponse = System.Text.Json.JsonSerializer.Deserialize<OperacionResponse>(registroIdempotencia.ResponseJson);
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
                Result<Cuenta> origenResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuentaOrigen, cancellationToken);
                if (origenResult.IsFailed)
                {
                    await _repository.RollbackTransactionAsync(cancellationToken);
                    return Result.Fail<OperacionResponse>("Cuenta origen no encontrada o inactiva.");
                }

                Cuenta origen = origenResult.Value;

                // Busca cuenta destino de manera opcional (local)
                Cuenta? destino = null;
                Result<Cuenta> destinoResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuentaDestino, cancellationToken);
                if (destinoResult.IsSuccess)
                {
                    destino = destinoResult.Value;
                }

                TransferenciaRequest request = new TransferenciaRequest(command.NumeroCuentaOrigen, command.NumeroCuentaDestino, command.Monto, command.TransactionId);

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

                    // Publicar Evento de Dominio de Transferencia Fallida (Desacoplado de la transacción)
                    await _mediator.Publish(new TransferenciaFallidaEvent(origen, command.NumeroCuentaDestino, command.Monto, resultado.Error!), cancellationToken);

                    return Result.Fail<OperacionResponse>(resultado.Error!);
                }

                // Guardar actualizaciones locales del saldo del emisor
                await _repository.UpdateAsync(origen, cancellationToken);

                // Guardar actualizaciones locales del saldo del receptor (solo si es local)
                if (destino is not null)
                {
                    await _repository.UpdateAsync(destino, cancellationToken);
                }

                string mensaje = destino is null
                    ? $"Transferencia de ${command.Monto:N2} realizada exitosamente desde Banco Ruby hacia la cuenta {command.NumeroCuentaDestino}."
                    : $"Transferencia de ${command.Monto:N2} realizada de {origen.NumeroCuenta} a {destino.NumeroCuenta}.";

                OperacionResponse responseValue = new OperacionResponse(mensaje, origen.Saldo);

                // 2. Registrar idempotencia antes de confirmar transacción
                if (!string.IsNullOrWhiteSpace(command.TransactionId))
                {
                    string responseJson = System.Text.Json.JsonSerializer.Serialize(responseValue);
                    await _repository.RegistrarIdempotenciaAsync(new Idempotencia
                    {
                        TransactionId = command.TransactionId,
                        ResponseJson = responseJson
                    }, cancellationToken);
                    await _repository.SaveChangesAsync(cancellationToken);
                }

                // Confirmar transacción de base de datos
                await _repository.CommitTransactionAsync(cancellationToken);

                // Publicar Evento de Dominio de Transferencia Realizada con éxito (Desacoplado de la transacción)
                await _mediator.Publish(new TransferenciaRealizadaEvent(origen, destino, command.Monto, command.TransactionId, command.NumeroCuentaDestino), cancellationToken);

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
