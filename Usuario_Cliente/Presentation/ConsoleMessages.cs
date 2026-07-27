using Spectre.Console;

namespace Usuario_Cliente.Presentation;

/// <summary>
/// Proporciona visualizaciones de mensajes y alertas elegantes usando Spectre.Console.
/// </summary>
public static class ConsoleMessages
{
    /// <summary>
    /// Muestra una alerta de éxito (verde).
    /// </summary>
    public static void ShowSuccess(string message)
    {
        var content = new Markup($"{ConsoleTheme.SuccessBold} {ConsoleTheme.IconSuccess} {message}{ConsoleTheme.End}");
        var panel = new Panel(content)
        {
            Border = BoxBorder.Rounded,
            Padding = new Padding(2, 0, 2, 0)
        };
        panel.BorderColor(ConsoleTheme.SuccessColor);

        AnsiConsole.Write(panel);
        AnsiConsole.WriteLine();
    }

    /// <summary>
    /// Muestra una alerta de error (rojo), opcionalmente con detalles del error.
    /// </summary>
    public static void ShowError(string message, string? detail = null)
    {
        var rows = new Rows();
        var mainMsg = new Markup($"{ConsoleTheme.ErrorBold} {ConsoleTheme.IconError} {message}{ConsoleTheme.End}");
        
        if (!string.IsNullOrEmpty(detail))
        {
            var detailMsg = new Markup($"{ConsoleTheme.Muted}Detalle: {Markup.Escape(detail)}{ConsoleTheme.End}");
            var panelContent = new Rows(mainMsg, detailMsg);
            
            var panel = new Panel(panelContent)
            {
                Border = BoxBorder.Rounded,
                Padding = new Padding(2, 0, 2, 0)
            };
            panel.BorderColor(ConsoleTheme.ErrorColor);
            AnsiConsole.Write(panel);
        }
        else
        {
            var panel = new Panel(mainMsg)
            {
                Border = BoxBorder.Rounded,
                Padding = new Padding(2, 0, 2, 0)
            };
            panel.BorderColor(ConsoleTheme.ErrorColor);
            AnsiConsole.Write(panel);
        }
        
        AnsiConsole.WriteLine();
    }

    /// <summary>
    /// Muestra una alerta de advertencia (amarillo).
    /// </summary>
    public static void ShowWarning(string message)
    {
        var content = new Markup($"{ConsoleTheme.WarningBold} {ConsoleTheme.IconWarning} {message}{ConsoleTheme.End}");
        var panel = new Panel(content)
        {
            Border = BoxBorder.Rounded,
            Padding = new Padding(2, 0, 2, 0)
        };
        panel.BorderColor(ConsoleTheme.WarningColor);

        AnsiConsole.Write(panel);
        AnsiConsole.WriteLine();
    }

    /// <summary>
    /// Muestra una alerta de información (azul/cyan).
    /// </summary>
    public static void ShowInfo(string message)
    {
        var content = new Markup($"{ConsoleTheme.InfoBold} {ConsoleTheme.IconInfo} {message}{ConsoleTheme.End}");
        var panel = new Panel(content)
        {
            Border = BoxBorder.Rounded,
            Padding = new Padding(2, 0, 2, 0)
        };
        panel.BorderColor(ConsoleTheme.InfoColor);

        AnsiConsole.Write(panel);
        AnsiConsole.WriteLine();
    }
}
