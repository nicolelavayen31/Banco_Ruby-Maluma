namespace BancoCenit.Features.Cuentas.Application.DTOs
{
    // DTO que representa una solicitud de depÃ³sito de dinero en cuenta.
    // NumeroCuenta: NÃºmero de la cuenta bancaria destino del depÃ³sito.
    // Monto: Cantidad de dinero a depositar (debe ser mayor que cero).
    public sealed record DepositoRequest(string NumeroCuenta, decimal Monto);
}
