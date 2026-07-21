namespace BancoMaluma.Common;

public static class TipoCuenta
{
    public const string Ahorros = "Ahorros";
    public const string Corriente = "Corriente";

    public const string SavingsIntegrator = "savings";
    public const string CheckingIntegrator = "checking";

    public static string Normalizar(string? tipo)
    {
        if (string.IsNullOrWhiteSpace(tipo)) return Ahorros;
        string lower = tipo.Trim().ToLowerInvariant();
        if (lower is "corriente" or "checking") return Corriente;
        return Ahorros;
    }

    public static string ToIntegratorType(string? tipo)
    {
        return Normalizar(tipo) == Corriente ? CheckingIntegrator : SavingsIntegrator;
    }
}
