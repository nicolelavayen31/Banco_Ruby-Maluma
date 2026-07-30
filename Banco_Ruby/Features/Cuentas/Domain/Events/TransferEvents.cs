using MediatR;
using BancoCenit.Features.Cuentas.Domain.Entities;

namespace BancoCenit.Features.Cuentas.Domain.Events
{
    /// <summary>
    /// Evento de dominio desencadenado cuando una transferencia se realiza con éxito.
    /// </summary>
    public record TransferenciaRealizadaEvent(
        Cuenta Origen, 
        Cuenta? Destino, 
        decimal Monto, 
        string? TransactionId,
        string NumeroCuentaDestino) : INotification;

    /// <summary>
    /// Evento de dominio desencadenado cuando una transferencia falla y requiere reversión.
    /// </summary>
    public record TransferenciaFallidaEvent(
        Cuenta Origen, 
        string NumeroCuentaDestino, 
        decimal Monto, 
        string Error) : INotification;
}
