namespace BancoCenit.Features.Cuentas.Application.DTOs
{
    // DTO que representa una solicitud de autenticaciÃ³n de cuenta mediante PIN.
    // Pin: El PIN de seguridad del cliente.
    public sealed record AutenticarRequest(string Pin);
}
