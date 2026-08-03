namespace BancoCenit.Features.Cuentas.Domain
{
    // Define la pasarela o puerto de salida para el envÃ­o de transferencias hacia el intermediario (Integrador ATM o banco destino).
    // Sigue el principio de Dependency Inversion de Clean Architecture.
    public interface ITransferenciaGateway
    {
        // EnvÃ­a una transacciÃ³n de transferencia de forma asÃ­ncrona hacia la pasarela de pagos.
        // cuentaOrigenUuid: UUID de la cuenta origen en el integrador (o nÃºmero de cuenta si no tiene UUID).
        // cuentaDestinoUuid: UUID de la cuenta destino en el integrador (o nÃºmero de cuenta si no tiene UUID).
        // monto: Monto total de la transferencia.
        // cancellationToken: Token de cancelaciÃ³n para la operaciÃ³n asÃ­ncrona.
        // Retorna: Una tarea que representa la operaciÃ³n de envÃ­o.
        Task EnviarAsync(string cuentaOrigenUuid, string cuentaDestinoUuid, decimal monto, CancellationToken cancellationToken = default);
    }
}
