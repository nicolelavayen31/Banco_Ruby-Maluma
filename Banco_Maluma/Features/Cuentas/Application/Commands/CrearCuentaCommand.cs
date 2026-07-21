using BancoMaluma.Common;
using FluentResults;
using MediatR;

namespace BancoMaluma.Features.Cuentas.Application.Commands
{
    public record CrearCuentaRequest(string NombreUsuario, string Pin, string NumeroCuenta, decimal SaldoInicial, string TipoCuenta, decimal CupoSobregiro);

    public record CrearCuentaCommand(string NombreUsuario, string Pin, string NumeroCuenta, decimal SaldoInicial, string TipoCuenta, decimal CupoSobregiro) : IRequest<Result<Cuenta>>;
}
