using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Respuesta del proceso de autenticación conteniendo los detalles de la cuenta y el token JWT.
    /// </summary>
    public record AutenticarResponse(string Titular, string Cuenta, string Token);

    /// <summary>
    /// Comando MediatR para autenticar una cuenta en el cajero automático.
    /// </summary>
    public record AutenticarCommand(string NumeroCuenta, string Pin) : IRequest<Result<AutenticarResponse>>;
}
