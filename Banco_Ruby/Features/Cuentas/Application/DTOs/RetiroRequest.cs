namespace BancoCenit.Features.Cuentas.Application.DTOs
{
    // DTO que representa una solicitud de retiro de efectivo de una cuenta.
    // NumeroCuenta: NÃºmero de la cuenta bancaria origen del retiro.
    // Monto: Monto de efectivo a retirar (sujeto a disponibilidad de fondos).
    public sealed record RetiroRequest(string NumeroCuenta, decimal Monto);
}
