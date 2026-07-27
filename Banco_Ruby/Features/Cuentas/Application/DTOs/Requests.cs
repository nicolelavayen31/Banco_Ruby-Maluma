namespace BancoCenit.Features.Cuentas.Application.DTOs
{
    /// <summary>
    /// DTO que representa una solicitud de depósito de dinero en cuenta.
    /// </summary>
    /// <param name="NumeroCuenta">Número de la cuenta bancaria destino del depósito.</param>
    /// <param name="Monto">Cantidad de dinero a depositar (debe ser mayor que cero).</param>
    public sealed record DepositoRequest(string NumeroCuenta, decimal Monto);

    /// <summary>
    /// DTO que representa una solicitud de retiro de efectivo de una cuenta.
    /// </summary>
    /// <param name="NumeroCuenta">Número de la cuenta bancaria origen del retiro.</param>
    /// <param name="Monto">Monto de efectivo a retirar (sujeto a disponibilidad de fondos).</param>
    public sealed record RetiroRequest(string NumeroCuenta, decimal Monto);

    /// <summary>
    /// DTO que representa una solicitud de transferencia de fondos, ya sea local o interbancaria.
    /// </summary>
    /// <param name="NumeroCuentaOrigen">Número de la cuenta de donde se debitarán los fondos.</param>
    /// <param name="NumeroCuentaDestino">Número de la cuenta receptora de los fondos.</param>
    /// <param name="Monto">Monto monetario a transferir.</param>
    public sealed record TransferenciaRequest(string NumeroCuentaOrigen, string NumeroCuentaDestino, decimal Monto, string? TransactionId = null);
}
