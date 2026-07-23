using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Queries
{
    /// <summary>
    /// Respuesta que contiene la información de saldo y titular.
    /// </summary>
    public record SaldoResponse(decimal Saldo, string Titular);

    /// <summary>
    /// Consulta MediatR para consultar el saldo de una cuenta.
    /// </summary>
    public record ObtenerSaldoQuery(string NumeroCuenta) : IRequest<Result<SaldoResponse>>;
}
