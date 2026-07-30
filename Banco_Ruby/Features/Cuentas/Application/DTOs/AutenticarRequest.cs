namespace BancoCenit.Features.Cuentas.Application.DTOs
{
    /// <summary>
    /// DTO que representa una solicitud de autenticación de cuenta mediante PIN.
    /// </summary>
    /// <param name="Pin">El PIN de seguridad del cliente.</param>
    public sealed record AutenticarRequest(string Pin);
}
