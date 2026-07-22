namespace BancoMaluma.Common;

/// <summary>
/// Define las constantes de negocio y las funciones auxiliares para clasificar los tipos de cuenta.
/// Normaliza valores y realiza mapeos hacia la terminología requerida por el Integrador ATM.
/// </summary>
public static class TipoCuenta
{
    /// <summary>
    /// Cuenta de Ahorros local.
    /// </summary>
    public const string Ahorros = "Ahorros";

    /// <summary>
    /// Cuenta Corriente local (habilita sobregiro).
    /// </summary>
    public const string Corriente = "Corriente";

    /// <summary>
    /// Clasificación de cuenta de ahorros requerida por el Integrador ATM.
    /// </summary>
    public const string SavingsIntegrator = "savings";

    /// <summary>
    /// Clasificación de cuenta corriente requerida por el Integrador ATM.
    /// </summary>
    public const string CheckingIntegrator = "checking";

    /// <summary>
    /// Normaliza una cadena de texto para retornar consistentemente "Ahorros" o "Corriente".
    /// </summary>
    /// <param name="tipo">Cadena de entrada con el tipo de cuenta.</param>
    /// <returns>La constante normalizada correspondiente ("Ahorros" o "Corriente").</returns>
    public static string Normalizar(string? tipo)
    {
        if (string.IsNullOrWhiteSpace(tipo)) return Ahorros;
        string lower = tipo.Trim().ToLowerInvariant();
        if (lower is "corriente" or "checking") return Corriente;
        return Ahorros;
    }

    /// <summary>
    /// Mapea el tipo de cuenta local al formato esperado en inglés por la base de datos del Integrador ATM.
    /// </summary>
    /// <param name="tipo">Tipo de cuenta local.</param>
    /// <returns>La constante requerida por el integrador ("savings" o "checking").</returns>
    public static string ToIntegratorType(string? tipo)
    {
        return Normalizar(tipo) == Corriente ? CheckingIntegrator : SavingsIntegrator;
    }
}
