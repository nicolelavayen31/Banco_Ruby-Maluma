using FluentResults;
using MediatR;

namespace BancoMaluma.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// DTO de respuesta que contiene el resultado descriptivo de la operación bancaria y el saldo disponible actualizado.
    /// </summary>
    /// <param name="Mensaje">Detalle informativo del resultado.</param>
    /// <param name="SaldoActual">Saldo contable final de la cuenta.</param>
    public record OperacionResponse(string Mensaje, decimal SaldoActual);

    /// <summary>
    /// Comando MediatR que solicita acreditar fondos en una cuenta bancaria (por depósito local o transferencia interbancaria).
    /// </summary>
    /// <param name="NumeroCuentaDestino">Cuenta en Banco Maluma a la cual se le acreditarán los fondos.</param>
    /// <param name="Monto">Monto de la transacción.</param>
    /// <param name="CuentaOrigen">Cuenta externa emisora (opcional).</param>
    /// <param name="BancoOrigen">Banco origen emisor (opcional).</param>
    /// <param name="Concepto">Concepto de la acreditación (opcional).</param>
    public record AcreditarCommand(string NumeroCuentaDestino, decimal Monto, string? CuentaOrigen, string? BancoOrigen, string? Concepto) : IRequest<Result<OperacionResponse>>;
}
