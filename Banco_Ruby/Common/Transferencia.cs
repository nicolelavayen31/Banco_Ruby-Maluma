namespace BancoCenit.Common;

/// <summary>
/// Representa una transferencia realizada en el sistema.
/// Encapsula la información inmutable de la transacción de fondos entre cuentas origen y destino.
/// </summary>
public sealed class Transferencia
{
    /// <summary>
    /// Número de la cuenta origen de la cual se debitan los fondos.
    /// </summary>
    public string CuentaOrigen { get; init; }

    /// <summary>
    /// Número de la cuenta destino que recibe la acreditación de los fondos.
    /// </summary>
    public string CuentaDestino { get; init; }

    /// <summary>
    /// Monto monetario involucrado en la transferencia.
    /// </summary>
    public decimal Monto { get; init; }

    /// <summary>
    /// Fecha y hora en la que se registra la transferencia (por defecto UTC actual).
    /// </summary>
    public DateTime Fecha { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Inicializa una nueva instancia de la clase <see cref="Transferencia"/>.
    /// </summary>
    /// <param name="origen">Número de cuenta origen.</param>
    /// <param name="destino">Número de cuenta destino.</param>
    /// <param name="monto">Monto de la transferencia.</param>
    public Transferencia(string origen, string destino, decimal monto)
    {
        CuentaOrigen = origen;
        CuentaDestino = destino;
        Monto = monto;
    }
}
