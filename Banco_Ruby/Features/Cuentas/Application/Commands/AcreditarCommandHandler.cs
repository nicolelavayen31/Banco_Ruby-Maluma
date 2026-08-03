using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Domain;
using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    // Manejador de MediatR para procesar la acreditaciÃ³n de fondos en cuentas de Banco Ruby.
    // Utiliza la abstracciÃ³n del repositorio para desacoplar el negocio de Entity Framework.
    public class AcreditarCommandHandler : IRequestHandler<AcreditarCommand, Result<OperacionResponse>>
    {
        private readonly ICuentaRepository _repository;

        // Inicializa una nueva instancia de la clase AcreditarCommandHandler con el repositorio.
        public AcreditarCommandHandler(ICuentaRepository repository)
        {
            _repository = repository;
        }

        // Procesa la solicitud del comando, validando la cuenta de destino y sumando el saldo de manera transaccional.
        public async Task<Result<OperacionResponse>> Handle(AcreditarCommand command, CancellationToken cancellationToken)
        {
            // Evita abonos invÃ¡lidos con montos negativos o nulos.
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
            cuenta.Acreditar(command.Monto);

            // Instancia el registro de auditorÃ­a con la descripciÃ³n del origen de los fondos.
            var auditoria = new Auditoria
            {
                CuentaId = cuenta.CuentaId,
                NumeroCuenta = cuenta.NumeroCuenta,
                Tipo = "Transferencia Interbancaria Recibida",
                Monto = command.Monto,
                Descripcion = $"Abono recibido vÃ­a Integrador ATM desde {command.BancoOrigen ?? "Banco Externo"} (Cuenta {command.CuentaOrigen ?? "Desconocida"}). Concepto: {command.Concepto ?? "Transferencia Interbancaria"}",
                CreadoEn = DateTime.UtcNow
            };

            // Iniciar transacciÃ³n de base de datos
            await _repository.BeginTransactionAsync(cancellationToken);

            try
            {
                // Registra la auditorÃ­a y actualiza la cuenta en la base de datos de manera atÃ³mica
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
