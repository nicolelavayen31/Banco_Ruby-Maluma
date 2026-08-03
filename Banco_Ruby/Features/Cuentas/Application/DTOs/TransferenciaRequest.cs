namespace BancoCenit.Features.Cuentas.Application.DTOs
{
    // DTO que representa una solicitud de transferencia de fondos, ya sea local o interbancaria.
    // NumeroCuentaOrigen: NÃºmero de la cuenta de donde se debitarÃ¡n los fondos.
    // NumeroCuentaDestino: NÃºmero de la cuenta receptora de los fondos.
    // Monto: Monto monetario a transferir.
    public sealed record TransferenciaRequest(string NumeroCuentaOrigen, string NumeroCuentaDestino, decimal Monto, string? TransactionId = null);
}
