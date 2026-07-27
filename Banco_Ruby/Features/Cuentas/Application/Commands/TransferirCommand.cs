using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Comando MediatR para realizar una transferencia local o interbancaria.
    /// </summary>
    public record TransferirCommand(
        string NumeroCuentaOrigen, 
        string NumeroCuentaDestino, 
        decimal Monto,
        string? TransactionId = null
    ) : IRequest<Result<OperacionResponse>>;
}
