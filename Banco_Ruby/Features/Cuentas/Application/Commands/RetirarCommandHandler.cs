using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Features.Cuentas.Domain.Events;
using FluentResults;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Manejador de MediatR para retirar fondos en Banco Ruby.
    /// Contiene las validaciones físicas y de negocio (billetes de 10, comisiones y límites).
    /// </summary>
    public class RetirarCommandHandler : IRequestHandler<RetirarCommand, Result<OperacionResponse>>
    {
        private const decimal COMISION = 0m;
        private readonly ICuentaRepository _repository;
        private readonly IMediator _mediator;

        public RetirarCommandHandler(
            ICuentaRepository repository,
            IMediator mediator)
        {
            _repository = repository;
            _mediator = mediator;
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

            Result<Cuenta> cuentaResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuenta, cancellationToken);
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
            cuenta.Debitar(totalDebitado);

            await _repository.UpdateAsync(cuenta, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            string msg = $"Retiro de ${command.Monto:N2} realizado.";

            // Publicar Evento de Dominio de Retiro Realizado con éxito (Desacoplado de la transacción)
            await _mediator.Publish(new RetiroRealizadoEvent(cuenta, command.Monto), cancellationToken);

            return Result.Ok(new OperacionResponse(msg, cuenta.Saldo));
        }
    }
}
