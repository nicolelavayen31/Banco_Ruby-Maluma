namespace BancoCenit.Domain.Transferencias;

/// <summary>
/// Define la pasarela o puerto de salida para el envío de transferencias hacia el intermediario (Integrador ATM o banco destino).
/// Sigue el principio de Dependency Inversion de Clean Architecture.
/// </summary>
public interface ITransferenciaGateway
{
    /// <summary>
    /// Envía una transacción de transferencia de forma asíncrona hacia la pasarela de pagos.
    /// </summary>
    /// <param name="cuentaOrigen">Cuenta debitada en el banco local.</param>
    /// <param name="cuentaDestino">Cuenta a acreditar en el banco de destino.</param>
    /// <param name="monto">Monto total de la transferencia.</param>
    /// <param name="cancellationToken">Token de cancelación para la operación asíncrona.</param>
    /// <returns>Una tarea que representa la operación de envío.</returns>
    Task EnviarAsync(string cuentaOrigen, string cuentaDestino, decimal monto, CancellationToken cancellationToken = default);
}
