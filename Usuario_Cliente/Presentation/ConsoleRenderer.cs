using Spectre.Console;

namespace Usuario_Cliente.Presentation;

/// <summary>
/// Proporciona utilidades de renderizado general para la interfaz del banco.
/// </summary>
public static class ConsoleRenderer
{
    /// <summary>
    /// Limpia la consola de forma limpia y estándar.
    /// </summary>
    public static void Clear()
    {
        AnsiConsole.Clear();
    }

    /// <summary>
    /// Ofusca los dígitos de la tarjeta dejando únicamente visibles los últimos 4 números.
    /// </summary>
    public static string MaskCard(string cardNumber)
    {
        if (string.IsNullOrWhiteSpace(cardNumber) || cardNumber.Length <= 4)
            return cardNumber;

        string visible = cardNumber[^4..];
        return new string('*', cardNumber.Length - 4) + visible;
    }

    /// <summary>
    /// Dibuja el banner superior con el logo estilizado del banco en Figlet y un subtítulo.
    /// </summary>
    /// <param name="bankName">Nombre del banco (ej. Ruby, Maluma).</param>
    public static void DrawBanner(string bankName)
    {
        var figlet = new FigletText($"BANCO {bankName.ToUpper()}")
            .Color(ConsoleTheme.PrimaryColor)
            .Centered();

        var subtitle = new Markup($"{ConsoleTheme.Muted}Sistema de Integración Bancaria Nacional - Cajero Automático{ConsoleTheme.End}")
            .Centered();

        var bannerGrid = new Grid().AddColumn();
        bannerGrid.AddRow(figlet);
        bannerGrid.AddRow(new Markup("\n"));
        bannerGrid.AddRow(subtitle);

        var panel = new Panel(bannerGrid)
        {
            Border = BoxBorder.Double,
            Padding = new Padding(3, 1, 3, 1)
        };
        panel.BorderColor(ConsoleTheme.PrimaryColor);

        AnsiConsole.Write(panel);
        AnsiConsole.WriteLine();
    }

    /// <summary>
    /// Dibuja el encabezado de un módulo o pantalla específica utilizando una regla estilizada.
    /// </summary>
    /// <param name="title">Título del módulo (ej. CONSULTA DE SALDO).</param>
    public static void DrawScreenTitle(string title)
    {
        var rule = new Rule($"{ConsoleTheme.PrimaryBold} {title.ToUpper()} {ConsoleTheme.End}")
        {
            Justification = Justify.Left,
            Style = Style.Parse(ConsoleTheme.PrimaryHex)
        };
        
        AnsiConsole.Write(rule);
        AnsiConsole.WriteLine();
    }

    /// <summary>
    /// Muestra un mensaje para solicitar confirmación de continuación (Enter para continuar).
    /// </summary>
    public static void WaitForKey()
    {
        AnsiConsole.WriteLine();
        AnsiConsole.MarkupLine($"  {ConsoleTheme.Muted}Presione Enter para continuar...{ConsoleTheme.End}");
        Console.ReadLine();
    }
}
