using Spectre.Console;

namespace Usuario_Cliente.Presentation;

/// <summary>
/// Gestiona la presentación de paneles informativos y recibos estructurados.
/// </summary>
public static class ConsolePanels
{
    /// <summary>
    /// Muestra la tarjeta de la cuenta con su saldo disponible actual.
    /// </summary>
    public static void ShowAccountCard(string bankName, string titular, string cuenta, decimal saldo)
    {
        var cardGrid = new Grid().AddColumn();
        cardGrid.AddRow(new Markup($"[bold white]CUENTA DE AHORROS / CORRIENTE[/]"));
        cardGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Banco:{ConsoleTheme.End} {ConsoleTheme.PrimaryBold}BANCO {bankName.ToUpper()}{ConsoleTheme.End}"));
        cardGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Titular:{ConsoleTheme.End} {ConsoleTheme.Accent}{titular}{ConsoleTheme.End}"));
        cardGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Tarjeta:{ConsoleTheme.End} {ConsoleTheme.Accent}{ConsoleRenderer.MaskCard(cuenta)}{ConsoleTheme.End}"));
        cardGrid.AddRow(new Markup("\n"));
        cardGrid.AddRow(new Markup($"{ConsoleTheme.Muted}SALDO DISPONIBLE{ConsoleTheme.End}"));
        cardGrid.AddRow(new Markup($"{ConsoleTheme.PrimaryBold}${saldo:N2}{ConsoleTheme.End}"));
        cardGrid.AddRow(new Markup("\n"));
        cardGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Estado:{ConsoleTheme.End} {ConsoleTheme.SuccessBold}Activa{ConsoleTheme.End}"));

        var panel = new Panel(cardGrid)
        {
            Border = BoxBorder.Rounded,
            Padding = new Padding(3, 1, 3, 1)
        };
        panel.BorderColor(ConsoleTheme.PrimaryColor);

        AnsiConsole.Write(panel);
        AnsiConsole.WriteLine();
    }

    /// <summary>
    /// Muestra el resumen y confirmación de los detalles de una transferencia.
    /// </summary>
    public static void ShowTransferDetails(string bancoDest, string cuentaOrig, string cuentaDest, decimal monto, string concepto)
    {
        var grid = new Grid().AddColumns(2);
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Banco Local:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.AccentBold}ACTIVO{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Banco Destino:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.AccentBold}{(string.IsNullOrWhiteSpace(bancoDest) ? "MISMO BANCO" : bancoDest.ToUpper())}{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Cuenta Emisora:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.Accent}{ConsoleRenderer.MaskCard(cuentaOrig)}{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Cuenta Receptora:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.AccentBold}{cuentaDest}{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Concepto de Pago:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.Accent}{(string.IsNullOrWhiteSpace(concepto) ? "SIN CONCEPTO" : concepto)}{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Monto a Transferir:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.PrimaryBold}${monto:N2}{ConsoleTheme.End}"));

        var panel = new Panel(grid)
        {
            Header = new PanelHeader("[bold white] RESUMEN DE TRANSFERENCIA [/]"),
            Border = BoxBorder.Rounded,
            Padding = new Padding(2, 1, 2, 1)
        };
        panel.BorderColor(ConsoleTheme.PrimaryColor);

        AnsiConsole.Write(panel);
        AnsiConsole.WriteLine();
    }

    /// <summary>
    /// Muestra el recibo del depósito efectuado con éxito.
    /// </summary>
    public static void ShowDepositReceipt(string cuenta, decimal monto, decimal saldoActual)
    {
        var grid = new Grid().AddColumns(2);
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Operación:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.SuccessBold}DEPÓSITO LOCAL{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Tarjeta Destino:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.Accent}{ConsoleRenderer.MaskCard(cuenta)}{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Monto Depositado:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.PrimaryBold}${monto:N2}{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Saldo Contable:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.AccentBold}${saldoActual:N2}{ConsoleTheme.End}"));

        var panel = new Panel(grid)
        {
            Header = new PanelHeader("[bold white] COMPROBANTE DE DEPÓSITO [/]"),
            Border = BoxBorder.Rounded,
            Padding = new Padding(2, 1, 2, 1)
        };
        panel.BorderColor(ConsoleTheme.PrimaryColor);

        AnsiConsole.Write(panel);
        AnsiConsole.WriteLine();
    }

    /// <summary>
    /// Muestra el recibo del retiro efectuado con éxito.
    /// </summary>
    public static void ShowWithdrawalReceipt(string cuenta, decimal monto, decimal comision, decimal saldoActual)
    {
        var grid = new Grid().AddColumns(2);
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Operación:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.SuccessBold}RETIRO DE EFECTIVO{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Tarjeta Debitada:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.Accent}{ConsoleRenderer.MaskCard(cuenta)}{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Monto Retirado:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.PrimaryBold}${monto:N2}{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Comisión ATM:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.ErrorBold}${comision:N2}{ConsoleTheme.End}"));
        grid.AddRow(new Markup($"{ConsoleTheme.Muted}Saldo Restante:{ConsoleTheme.End}"), new Markup($"{ConsoleTheme.AccentBold}${saldoActual:N2}{ConsoleTheme.End}"));

        var panel = new Panel(grid)
        {
            Header = new PanelHeader("[bold white] COMPROBANTE DE RETIRO [/]"),
            Border = BoxBorder.Rounded,
            Padding = new Padding(2, 1, 2, 1)
        };
        panel.BorderColor(ConsoleTheme.PrimaryColor);

        AnsiConsole.Write(panel);
        AnsiConsole.WriteLine();
    }
}
