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
    // Manejador de MediatR para realizar transferencias locales e interbancarias en Banco Ruby.
    // Utiliza el servicio de dominio TransferenciaService para aplicar las reglas consistentes.
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

        // Procesa la solicitud de transferencia de forma asÃ­ncrona y atÃ³mica.
        // Realiza validaciones de seguridad, previene doble gasto mediante idempotencia,
        // abre una transacciÃ³n en base de datos y coordina el rollback si el canal externo del integrador falla.
        public async Task<Result<OperacionResponse>> Handle(TransferirCommand command, CancellationToken cancellationToken)
        {
            // ---------------------------------------------------------------------------------
            // 1. VALIDACIÃ“N DE IDEMPOTENCIA
            // ---------------------------------------------------------------------------------
            // Si el cliente envÃ­a una clave Ãºnica de transacciÃ³n (TransactionId), verificamos si
            // ya fue procesada anteriormente para retornar la respuesta en cachÃ© y evitar duplicados.
            if (!string.IsNullOrWhiteSpace(command.TransactionId))
            {
                Idempotencia? registroIdempotencia = await _repository.GetIdempotenciaAsync(command.TransactionId, cancellationToken);
                if (registroIdempotencia != null)
                {
                    try
                    {
                        // Retornar directamente el JSON deserializado guardado de la primera ejecuciÃ³n exitosa.
                        OperacionResponse? cachedResponse = System.Text.Json.JsonSerializer.Deserialize<OperacionResponse>(registroIdempotencia.ResponseJson);
                        if (cachedResponse != null)
                        {
                            return Result.Ok(cachedResponse);
                        }
                    }
                    catch
                    {
                        // Si falla la deserializaciÃ³n del cachÃ©, continuamos con la ejecuciÃ³n normal
                    }
                }
            }

            // ValidaciÃ³n rÃ¡pida de negocio: no se puede transferir a sÃ­ mismo.
            if (command.NumeroCuentaOrigen == command.NumeroCuentaDestino)
            {
                return Result.Fail<OperacionResponse>("La cuenta origen y destino no pueden ser la misma.");
            }

            // ---------------------------------------------------------------------------------
            // 2. INICIO DE TRANSACCIÃ“N DE BASE DE DATOS
            // ---------------------------------------------------------------------------------
            await _repository.BeginTransactionAsync(cancellationToken);

            try
            {
                // Busca la cuenta de origen en base de datos local y verifica si estÃ¡ activa
                Result<Cuenta> origenResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuentaOrigen, cancellationToken);
                if (origenResult.IsFailed)
                {
                    await _repository.RollbackTransactionAsync(cancellationToken);
                    return Result.Fail<OperacionResponse>("Cuenta origen no encontrada o inactiva.");
                }

                Cuenta origen = origenResult.Value;

                // Busca la cuenta destino. Si no existe localmente en nuestra base de datos,
                // asumimos que es una transferencia interbancaria (destino = null).
                Cuenta? destino = null;
                Result<Cuenta> destinoResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuentaDestino, cancellationToken);
                if (destinoResult.IsSuccess)
                {
                    destino = destinoResult.Value;
                }

                TransferenciaRequest request = new TransferenciaRequest(command.NumeroCuentaOrigen, command.NumeroCuentaDestino, command.Monto, command.TransactionId);

                // Traduce los nÃºmeros de cuenta locales a UUIDs requeridos por el Integrador (si existen).
                string cuentaOrigenUuid = origen.IntegradorAccountId ?? origen.NumeroCuenta;
                string cuentaDestinoUuid = destino?.IntegradorAccountId ?? command.NumeroCuentaDestino;

                // ---------------------------------------------------------------------------------
                // 3. EJECUCIÃ“N DE LA LOGICA DE DOMINIO Y LLAMADA EXTERNA
                // ---------------------------------------------------------------------------------
                // Delega al Servicio de Dominio (TransferenciaService) la validaciÃ³n de saldos,
                // la aplicaciÃ³n de comisiones y la ejecuciÃ³n del callback hacia el canal externo.
                TransferenciaExecutionResult resultado = await TransferenciaService.EjecutarTransferenciaAsync(
                    origen,
                    destino,
                    request,
                    () => _gateway.EnviarAsync(cuentaOrigenUuid, cuentaDestinoUuid, command.Monto, cancellationToken)
                );

                // Si ocurriÃ³ un error (saldo insuficiente o falla del gateway externo) se deshacen los cambios.
                if (!resultado.IsSuccess)
                {
                    await _repository.RollbackTransactionAsync(cancellationToken);

                    // Publicar Evento de Dominio para registrar la auditorÃ­a de falla de forma asÃ­ncrona y desacoplada
                    await _mediator.Publish(new TransferenciaFallidaEvent(origen, command.NumeroCuentaDestino, command.Monto, resultado.Error!), cancellationToken);

                    return Result.Fail<OperacionResponse>(resultado.Error!);
                }

                // ---------------------------------------------------------------------------------
                // 4. PERSISTENCIA Y REGISTRO DE IDEMPOTENCIA
                // ---------------------------------------------------------------------------------
                // Guarda las actualizaciones de saldo local para la cuenta de origen.
                await _repository.UpdateAsync(origen, cancellationToken);

                // Si la cuenta destino es del mismo banco (local), actualizamos su saldo tambiÃ©n.
                if (destino is not null)
                {
                    await _repository.UpdateAsync(destino, cancellationToken);
                }

                string mensaje = destino is null
                    ? $"Transferencia de ${command.Monto:N2} realizada exitosamente desde Banco Ruby hacia la cuenta {command.NumeroCuentaDestino}."
                    : $"Transferencia de ${command.Monto:N2} realizada de {origen.NumeroCuenta} a {destino.NumeroCuenta}.";

                OperacionResponse responseValue = new OperacionResponse(mensaje, origen.Saldo);

                // Si se proveyÃ³ un TransactionId, guardamos el resultado exitoso para futuras consultas repetidas.
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

                // Confirma todos los cambios en la base de datos de manera atÃ³mica
                await _repository.CommitTransactionAsync(cancellationToken);

                // Publicar Evento de Dominio de Transferencia Realizada con Ã©xito (Desacoplado de la transacciÃ³n)
                // Se encarga de disparar efectos secundarios como el envÃ­o de correos o registros adicionales.
                await _mediator.Publish(new TransferenciaRealizadaEvent(origen, destino, command.Monto, command.TransactionId, command.NumeroCuentaDestino), cancellationToken);

                return Result.Ok(responseValue);
            }
            catch (Exception)
            {
                // En caso de cualquier excepciÃ³n inesperada en el pipeline, se revierte la transacciÃ³n para evitar inconsistencias.
                await _repository.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
    }
}
