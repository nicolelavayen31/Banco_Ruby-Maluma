namespace BancoCenit.Features.Cuentas.Application.DTOs
{
    /// <summary>
    /// DTO que representa una solicitud de transferencia de fondos, ya sea local o interbancaria.
    /// </summary>
    /// <param name="NumeroCuentaOrigen">Número de la cuenta de donde se debitarán los fondos.</param>
    /// <param name="NumeroCuentaDestino">Número de la cuenta receptora de los fondos.</param>
    /// <param name="Monto">Monto monetario a transferir.</param>
    public sealed record TransferenciaRequest(string NumeroCuentaOrigen, string NumeroCuentaDestino, decimal Monto, string? TransactionId = null);
}
