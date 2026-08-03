using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    // Respuesta del proceso de autenticaciÃ³n conteniendo los detalles de la cuenta y el token JWT.
    public record AutenticarResponse(string Titular, string Cuenta, string Token);

    // Comando MediatR para autenticar una cuenta en el cajero automÃ¡tico.
    public record AutenticarCommand(string NumeroCuenta, string Pin) : IRequest<Result<AutenticarResponse>>;
}
