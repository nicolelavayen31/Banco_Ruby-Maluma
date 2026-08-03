using MediatR;
using BancoCenit.Features.Cuentas.Domain.Entities;

namespace BancoCenit.Features.Cuentas.Domain.Events
{
    // Evento de dominio desencadenado cuando se realiza un depÃ³sito de efectivo con Ã©xito.
    public record DepositoRealizadoEvent(Cuenta Cuenta, decimal Monto) : INotification;

    // Evento de dominio desencadenado cuando se realiza un retiro de efectivo con Ã©xito.
    public record RetiroRealizadoEvent(Cuenta Cuenta, decimal Monto) : INotification;
}
