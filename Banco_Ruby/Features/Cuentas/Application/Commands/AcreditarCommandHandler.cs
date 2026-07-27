using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Domain;
using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Manejador de MediatR para procesar la acreditación de fondos en cuentas de Banco Ruby.
    /// Utiliza la abstracción del repositorio para desacoplar el negocio de Entity Framework.
    /// </summary>
    public class AcreditarCommandHandler : IRequestHandler<AcreditarCommand, Result<OperacionResponse>>
    {
        private readonly ICuentaRepository _repository;

        /// <summary>
        /// Inicializa una nueva instancia de la clase <see cref="AcreditarCommandHandler"/> con el repositorio.
        /// </summary>
        public AcreditarCommandHandler(ICuentaRepository repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Procesa la solicitud del comando, validando la cuenta de destino y sumando el saldo de manera transaccional.
        /// </summary>
        public async Task<Result<OperacionResponse>> Handle(AcreditarCommand command, CancellationToken cancellationToken)
        {
            // Evita abonos inválidos con montos negativos o nulos.
            if (command.Monto <= 0)
            {
                return Result.Fail<OperacionResponse>("El monto debe ser mayor a cero.");
            }

            // Obtiene la cuenta destino mediante el repositorio
            var cuentaResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuentaDestino, cancellationToken);
            if (cuentaResult.IsFailed)
            {
                return Result.Fail<OperacionResponse>($"Cuenta destino {command.NumeroCuentaDestino} no encontrada o inactiva en Banco Ruby.");
            }

            Cuenta cuenta = cuentaResult.Value;

            // Incrementa el saldo disponible de la cuenta
            cuenta.Saldo += command.Monto;

            // Instancia el registro de auditoría con la descripción del origen de los fondos.
            var auditoria = new Auditoria
            {
                CuentaId = cuenta.CuentaId,
                NumeroCuenta = cuenta.NumeroCuenta,
                Tipo = "Transferencia Interbancaria Recibida",
                Monto = command.Monto,
                Descripcion = $"Abono recibido vía Integrador ATM desde {command.BancoOrigen ?? "Banco Externo"} (Cuenta {command.CuentaOrigen ?? "Desconocida"}). Concepto: {command.Concepto ?? "Transferencia Interbancaria"}",
                CreadoEn = DateTime.UtcNow
            };

            // Iniciar transacción de base de datos
            await _repository.BeginTransactionAsync(cancellationToken);

            try
            {
                // Registra la auditoría y actualiza la cuenta en la base de datos de manera atómica
                await _repository.RegistrarAuditoriaAsync(auditoria, cancellationToken);
                await _repository.UpdateAsync(cuenta, cancellationToken);
                
                await _repository.CommitTransactionAsync(cancellationToken);
            }
            catch (Exception)
            {
                await _repository.RollbackTransactionAsync(cancellationToken);
                throw;
            }

            string msg = $"Transferencia acreditada exitosamente en Banco Ruby para la cuenta {cuenta.NumeroCuenta}. Nuevo saldo: ${cuenta.Saldo:N2}.";
            return Result.Ok(new OperacionResponse(msg, cuenta.Saldo));
        }
    }
}
