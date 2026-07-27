using Spectre.Console;

namespace Usuario_Cliente.Presentation;

/// <summary>
/// Gestiona la presentación visual de la pantalla de inicio de sesión.
/// </summary>
public static class ConsoleLogin
{
    /// <summary>
    /// Muestra el formulario de inicio de sesión con el estilo del banco seleccionado.
    /// </summary>
    /// <param name="bankName">Nombre comercial del banco.</param>
    /// <returns>Tupla con la cuenta y el PIN ingresados.</returns>
    public static (string Cuenta, string Pin) ShowLoginForm(string bankName)
    {
        ConsoleRenderer.Clear();
        ConsoleRenderer.DrawBanner(bankName);

        var formGrid = new Grid().AddColumn();

        // Título del formulario
        formGrid.AddRow(new Rule($"{ConsoleTheme.PrimaryBold} INICIAR SESIÓN {ConsoleTheme.End}") 
        { 
            Style = Style.Parse(ConsoleTheme.PrimaryHex) 
        });
        formGrid.AddRow(new Markup("\n"));

        var panel = new Panel(formGrid)
        {
            Border = BoxBorder.None,
            Padding = new Padding(2, 0, 2, 0)
        };

        AnsiConsole.Write(panel);

        // Entrada del número de cuenta/tarjeta
        var cuenta = AnsiConsole.Prompt(
            new TextPrompt<string>($"  {ConsoleTheme.IconUser} [bold white]Número de Cuenta o Tarjeta:[/] ")
                .PromptStyle(Style.Parse(ConsoleTheme.PrimaryHex))
                .ValidationErrorMessage($"{ConsoleTheme.Error} {ConsoleTheme.IconError} Por favor ingrese un número de cuenta válido{ConsoleTheme.End}")
                .Validate(input => !string.IsNullOrWhiteSpace(input))
        );

        AnsiConsole.WriteLine();

        // Entrada de PIN de seguridad
        var pin = AnsiConsole.Prompt(
            new TextPrompt<string>($"  {ConsoleTheme.IconLock} [bold white]PIN de Seguridad (4 dígitos):[/] ")
                .PromptStyle(Style.Parse(ConsoleTheme.PrimaryHex))
                .Secret()
                .ValidationErrorMessage($"{ConsoleTheme.Error} {ConsoleTheme.IconError} El PIN debe ser numérico{ConsoleTheme.End}")
                .Validate(input => !string.IsNullOrWhiteSpace(input) && input.All(char.IsDigit))
        );

        AnsiConsole.WriteLine();
        
        return (cuenta, pin);
    }
}
