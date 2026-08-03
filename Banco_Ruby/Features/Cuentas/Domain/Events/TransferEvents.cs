using MediatR;
using BancoCenit.Features.Cuentas.Domain.Entities;

namespace BancoCenit.Features.Cuentas.Domain.Events
{
    // Evento de dominio desencadenado cuando una transferencia se realiza con Ã©xito.
    public record TransferenciaRealizadaEvent(
        Cuenta Origen, 
        Cuenta? Destino, 
        decimal Monto, 
        string? TransactionId,
        string NumeroCuentaDestino) : INotification;

    // Evento de dominio desencadenado cuando una transferencia falla y requiere reversiÃ³n.
    public record TransferenciaFallidaEvent(
        Cuenta Origen, 
        string NumeroCuentaDestino, 
        decimal Monto, 
        string Error) : INotification;
}
