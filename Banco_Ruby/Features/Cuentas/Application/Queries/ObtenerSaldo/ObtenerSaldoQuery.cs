using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Queries
{
    // Respuesta que contiene la informaciÃ³n de saldo y titular.
    public record SaldoResponse(decimal Saldo, string Titular);

    // Consulta MediatR para consultar el saldo de una cuenta.
    public record ObtenerSaldoQuery(string NumeroCuenta) : IRequest<Result<SaldoResponse>>;
}
