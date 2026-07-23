using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Comando MediatR para retirar efectivo de una cuenta local.
    /// </summary>
    public record RetirarCommand(string NumeroCuenta, decimal Monto) : IRequest<Result<OperacionResponse>>;
}
