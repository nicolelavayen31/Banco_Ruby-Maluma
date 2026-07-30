namespace BancoCenit.Features.Cuentas.Application.DTOs
{
    /// <summary>
    /// DTO que representa una solicitud de retiro de efectivo de una cuenta.
    /// </summary>
    /// <param name="NumeroCuenta">Número de la cuenta bancaria origen del retiro.</param>
    /// <param name="Monto">Monto de efectivo a retirar (sujeto a disponibilidad de fondos).</param>
    public sealed record RetiroRequest(string NumeroCuenta, decimal Monto);
}
