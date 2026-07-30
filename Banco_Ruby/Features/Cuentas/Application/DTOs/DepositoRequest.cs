namespace BancoCenit.Features.Cuentas.Application.DTOs
{
    /// <summary>
    /// DTO que representa una solicitud de depósito de dinero en cuenta.
    /// </summary>
    /// <param name="NumeroCuenta">Número de la cuenta bancaria destino del depósito.</param>
    /// <param name="Monto">Cantidad de dinero a depositar (debe ser mayor que cero).</param>
    public sealed record DepositoRequest(string NumeroCuenta, decimal Monto);
}
