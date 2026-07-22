namespace BancoCenit.Features;

/// <summary>
/// DTO de respuesta para la consulta de saldo de una cuenta.
/// </summary>
/// <param name="Saldo">Saldo disponible actual de la cuenta.</param>
/// <param name="Titular">Nombre completo del usuario titular de la cuenta.</param>
public sealed record SaldoResponse(decimal Saldo, string Titular);

/// <summary>
/// DTO de respuesta genérica para operaciones de depósito y retiro.
/// </summary>
/// <param name="Mensaje">Mensaje informativo con los detalles del resultado de la operación.</param>
/// <param name="Saldo">Saldo resultante disponible en la cuenta después de la transacción.</param>
public sealed record OperacionResponse(string Mensaje, decimal Saldo);

/// <summary>
/// DTO de respuesta tras realizar una transferencia local exitosa.
/// </summary>
/// <param name="Mensaje">Detalles de la transferencia efectuada.</param>
/// <param name="SaldoOrigen">Saldo remanente en la cuenta emisora.</param>
/// <param name="SaldoDestino">Nuevo saldo disponible en la cuenta receptora.</param>
public sealed record TransferenciaResponse(string Mensaje, decimal SaldoOrigen, decimal SaldoDestino);

/// <summary>
/// DTO que representa un movimiento individual en el historial de transacciones.
/// </summary>
/// <param name="Tipo">Tipo de movimiento (Depósito, Retiro, Transferencia).</param>
/// <param name="Monto">Monto de la transacción.</param>
/// <param name="Descripcion">Detalle literal del movimiento.</param>
/// <param name="CreadoEn">Fecha y hora en la que se efectuó.</param>
public sealed record HistorialItem(string Tipo, decimal Monto, string Descripcion, DateTime CreadoEn);

/// <summary>
/// DTO de respuesta que encapsula el historial de transacciones del cliente.
/// </summary>
/// <param name="Titular">Nombre del titular de la cuenta.</param>
/// <param name="Historial">Colección de movimientos históricos.</param>
public sealed record HistorialResponse(string Titular, IReadOnlyCollection<HistorialItem> Historial);
