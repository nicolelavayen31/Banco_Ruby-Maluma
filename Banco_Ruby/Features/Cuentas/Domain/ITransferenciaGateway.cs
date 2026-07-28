namespace BancoCenit.Features.Cuentas.Domain
{
    /// <summary>
    /// Define la pasarela o puerto de salida para el envío de transferencias hacia el intermediario (Integrador ATM o banco destino).
    /// Sigue el principio de Dependency Inversion de Clean Architecture.
    /// </summary>
    public interface ITransferenciaGateway
    {
        /// <summary>
        /// Envía una transacción de transferencia de forma asíncrona hacia la pasarela de pagos.
        /// </summary>
        /// <param name="cuentaOrigenUuid">UUID de la cuenta origen en el integrador (o número de cuenta si no tiene UUID).</param>
        /// <param name="cuentaDestinoUuid">UUID de la cuenta destino en el integrador (o número de cuenta si no tiene UUID).</param>
        /// <param name="monto">Monto total de la transferencia.</param>
        /// <param name="cancellationToken">Token de cancelación para la operación asíncrona.</param>
        /// <returns>Una tarea que representa la operación de envío.</returns>
        Task EnviarAsync(string cuentaOrigenUuid, string cuentaDestinoUuid, decimal monto, CancellationToken cancellationToken = default);
    }
}
