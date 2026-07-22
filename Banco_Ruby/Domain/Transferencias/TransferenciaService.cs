using BancoCenit.Common;

namespace BancoCenit.Domain.Transferencias;

/// <summary>
/// Encapsula el resultado de la ejecución de una transferencia bancaria.
/// </summary>
public sealed class TransferenciaExecutionResult
{
    /// <summary>
    /// Obtiene si la operación se completó exitosamente.
    /// </summary>
    public bool IsSuccess { get; }

    /// <summary>
    /// Mensaje de error descriptivo en caso de que la operación haya fallado.
    /// </summary>
    public string? Error { get; }

    /// <summary>
    /// Constructor privado para inicializar el resultado.
    /// </summary>
    /// <param name="isSuccess">Indica éxito.</param>
    /// <param name="error">Mensaje de error.</param>
    private TransferenciaExecutionResult(bool isSuccess, string? error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    /// <summary>
    /// Crea un resultado exitoso para la transacción.
    /// </summary>
    /// <returns>Instancia exitosa de <see cref="TransferenciaExecutionResult"/>.</returns>
    public static TransferenciaExecutionResult Success() => new(true, null);

    /// <summary>
    /// Crea un resultado fallido con la causa del error.
    /// </summary>
    /// <param name="error">La razón del fallo.</param>
    /// <returns>Instancia fallida de <see cref="TransferenciaExecutionResult"/>.</returns>
    public static TransferenciaExecutionResult Failure(string error) => new(false, error);
}

/// <summary>
/// Servicio de Dominio encargado de aplicar las reglas de negocio críticas para transferencias bancarias.
/// Valida saldos, realiza débitos/créditos locales, y coordina la reversión en caso de fallas externas.
/// </summary>
public static class TransferenciaService
{
    /// <summary>
    /// Ejecuta la lógica transaccional de una transferencia (débito, crédito opcional, envío y rollback).
    /// </summary>
    /// <param name="origen">Cuenta origen de donde se debitarán los fondos.</param>
    /// <param name="destino">Cuenta destino (nula si es una transferencia interbancaria hacia un banco externo).</param>
    /// <param name="request">Los detalles de la transferencia (monto).</param>
    /// <param name="enviarTransferencia">Función callback que conecta con el canal externo del integrador/pasarela.</param>
    /// <returns>Un resultado que detalla el éxito o el error de la operación.</returns>
    public static async Task<TransferenciaExecutionResult> EjecutarTransferenciaAsync(
        Cuenta origen,
        Cuenta? destino,
        TransferenciaRequest request,
        Func<Task> enviarTransferencia)
    {
        // Evita que se realicen transferencias con montos menores o iguales a cero.
        if (request.Monto <= 0)
        {
            return TransferenciaExecutionResult.Failure("El monto debe ser mayor que cero.");
        }

        // Valida que el emisor tenga saldo suficiente para cubrir el monto.
        if (request.Monto > origen.Saldo)
        {
            return TransferenciaExecutionResult.Failure("Fondos insuficientes en la cuenta origen.");
        }

        // Resguarda los saldos antes de la operación en caso de requerir rollback.
        decimal saldoOrigenAntes = origen.Saldo;
        decimal? saldoDestinoAntes = destino?.Saldo;

        // Se debita el monto de la cuenta de origen.
        origen.Saldo -= request.Monto;

        // Si la cuenta destino es local, se le acredita el monto.
        if (destino is not null)
        {
            destino.Saldo += request.Monto;
        }

        try
        {
            // Invoca la pasarela o canal externo de comunicación.
            await enviarTransferencia();
            return TransferenciaExecutionResult.Success();
        }
        catch (Exception ex)
        {
            // Revierte el saldo a su estado original si ocurre un fallo de red o rechazo de pasarela.
            origen.Saldo = saldoOrigenAntes;
            if (destino is not null && saldoDestinoAntes.HasValue)
            {
                destino.Saldo = saldoDestinoAntes.Value;
            }
            return TransferenciaExecutionResult.Failure($"Transacción fallida. Se devolvió el monto a la cuenta {origen.NumeroCuenta}. Detalle: {ex.Message}");
        }
    }
}
