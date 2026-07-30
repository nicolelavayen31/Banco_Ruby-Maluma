using MediatR;
using BancoCenit.Features.Cuentas.Domain.Entities;

namespace BancoCenit.Features.Cuentas.Domain.Events
{
    /// <summary>
    /// Evento de dominio desencadenado cuando se realiza un depósito de efectivo con éxito.
    /// </summary>
    public record DepositoRealizadoEvent(Cuenta Cuenta, decimal Monto) : INotification;

    /// <summary>
    /// Evento de dominio desencadenado cuando se realiza un retiro de efectivo con éxito.
    /// </summary>
    public record RetiroRealizadoEvent(Cuenta Cuenta, decimal Monto) : INotification;
}
