using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    // Comando MediatR para retirar efectivo de una cuenta local.
    public record RetirarCommand(string NumeroCuenta, decimal Monto) : IRequest<Result<OperacionResponse>>;
}
