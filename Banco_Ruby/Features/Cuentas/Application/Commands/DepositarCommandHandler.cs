using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Features.Cuentas.Domain.Events;
using FluentResults;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    // Manejador de MediatR para depositar fondos en Banco Ruby.
    public class DepositarCommandHandler : IRequestHandler<DepositarCommand, Result<OperacionResponse>>
    {
        private readonly ICuentaRepository _repository;
        private readonly IMediator _mediator;

        public DepositarCommandHandler(
            ICuentaRepository repository,
            IMediator mediator)
        {
            _repository = repository;
            _mediator = mediator;
        }

        public async Task<Result<OperacionResponse>> Handle(DepositarCommand command, CancellationToken cancellationToken)
        {
            if (command.Monto <= 0)
            {
                return Result.Fail<OperacionResponse>("El monto debe ser mayor que cero.");
            }

            Result<Cuenta> cuentaResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuenta, cancellationToken);
            if (cuentaResult.IsFailed)
            {
                return Result.Fail<OperacionResponse>(cuentaResult.Errors);
            }

            Cuenta cuenta = cuentaResult.Value;

            // Incrementa el saldo
            cuenta.Acreditar(command.Monto);

            await _repository.UpdateAsync(cuenta, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            string msg = $"DepÃ³sito de ${command.Monto:N2} realizado.";

            // Publicar Evento de Dominio de DepÃ³sito Realizado con Ã©xito (Desacoplado de la transacciÃ³n)
            await _mediator.Publish(new DepositoRealizadoEvent(cuenta, command.Monto), cancellationToken);

            return Result.Ok(new OperacionResponse(msg, cuenta.Saldo));
        }
    }
}
