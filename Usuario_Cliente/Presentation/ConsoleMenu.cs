using Spectre.Console;

namespace Usuario_Cliente.Presentation;

/// <summary>
/// Gestiona la presentación del menú interactivo y el Dashboard del Cajero.
/// </summary>
public static class ConsoleMenu
{
    /// <summary>
    /// Presenta de forma interactiva una lista de opciones y retorna el índice de la opción seleccionada.
    /// </summary>
    public static int PromptMenuOption(string promptMessage, string[] options)
    {
        var prompt = new SelectionPrompt<string>()
            .Title($"{ConsoleTheme.Accent}{promptMessage}{ConsoleTheme.End}")
            .PageSize(10)
            .HighlightStyle(new Style(ConsoleTheme.PrimaryColor, decoration: Decoration.Bold))
            .MoreChoicesText($"{ConsoleTheme.Muted}(Use las flechas ↑↓ para navegar, Enter para confirmar){ConsoleTheme.End}")
            .AddChoices(options);

        string selected = AnsiConsole.Prompt(prompt);
        return Array.IndexOf(options, selected);
    }

    /// <summary>
    /// Dibuja la cabecera informativa de la sesión activa en formato de Dashboard con Paneles.
    /// </summary>
    public static void DrawSessionDashboard(
        string bankName, 
        string titular, 
        string cuenta, 
        string sessionId, 
        bool isServerOnline, 
        bool isIntegratorOnline)
    {
        var grid = new Grid().AddColumns(3);

        // Panel 1: Titular y Cuenta
        var clientGrid = new Grid().AddColumn();
        clientGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Banco:{ConsoleTheme.End} {ConsoleTheme.PrimaryBold}BANCO {bankName.ToUpper()}{ConsoleTheme.End}"));
        clientGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Titular:{ConsoleTheme.End} {ConsoleTheme.Accent}{titular}{ConsoleTheme.End}"));
        clientGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Tarjeta:{ConsoleTheme.End} {ConsoleTheme.Accent}{ConsoleRenderer.MaskCard(cuenta)}{ConsoleTheme.End}"));

        var panel1 = new Panel(clientGrid)
        {
            Header = new PanelHeader($"[bold white] {ConsoleTheme.IconUser} CLIENTE [/]"),
            Border = BoxBorder.Rounded
        };
        panel1.BorderColor(ConsoleTheme.PrimaryColor);

        // Panel 2: Red y Conectividad
        var redGrid = new Grid().AddColumn();
        string serverStatus = isServerOnline 
            ? $"{ConsoleTheme.SuccessBold}{ConsoleTheme.IconStatusOk} EN LÍNEA{ConsoleTheme.End}" 
            : $"{ConsoleTheme.ErrorBold}{ConsoleTheme.IconStatusFail} OFFLINE{ConsoleTheme.End}";
        string integratorStatus = isIntegratorOnline 
            ? $"{ConsoleTheme.SuccessBold}{ConsoleTheme.IconStatusOk} EN LÍNEA{ConsoleTheme.End}" 
            : $"{ConsoleTheme.ErrorBold}{ConsoleTheme.IconStatusFail} OFFLINE{ConsoleTheme.End}";
        string bankDest = bankName.ToUpper() == "RUBY" ? "MALUMA" : "RUBY";

        redGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Servidor:{ConsoleTheme.End} {serverStatus}"));
        redGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Integrador:{ConsoleTheme.End} {integratorStatus}"));
        redGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Destino:{ConsoleTheme.End} {ConsoleTheme.Accent}BANCO {bankDest}{ConsoleTheme.End}"));

        var panel2 = new Panel(redGrid)
        {
            Header = new PanelHeader($"[bold white] {ConsoleTheme.IconBank} RED BANCARIA [/]"),
            Border = BoxBorder.Rounded
        };
        panel2.BorderColor(ConsoleTheme.PrimaryColor);

        // Panel 3: Sesión y Fecha/Hora
        var sessionGrid = new Grid().AddColumn();
        string shortSession = sessionId.Length > 8 ? sessionId.Substring(0, 8) + "..." : sessionId;
        sessionGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Sesión ID:{ConsoleTheme.End} {ConsoleTheme.Accent}{shortSession}{ConsoleTheme.End}"));
        sessionGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Fecha:{ConsoleTheme.End} {ConsoleTheme.Accent}{DateTime.Now:dd/MM/yyyy}{ConsoleTheme.End}"));
        sessionGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Hora:{ConsoleTheme.End} {ConsoleTheme.Accent}{DateTime.Now:HH:mm:ss}{ConsoleTheme.End}"));

        var panel3 = new Panel(sessionGrid)
        {
            Header = new PanelHeader($"[bold white] {ConsoleTheme.IconClock} TERMINAL [/]"),
            Border = BoxBorder.Rounded
        };
        panel3.BorderColor(ConsoleTheme.PrimaryColor);

        grid.AddRow(panel1, panel2, panel3);

        AnsiConsole.Write(grid);
        AnsiConsole.WriteLine();
    }
}
