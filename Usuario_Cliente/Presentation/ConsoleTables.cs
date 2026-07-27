using Spectre.Console;

namespace Usuario_Cliente.Presentation;

/// <summary>
/// Gestiona la presentación de tablas de datos y gráficos analíticos.
/// </summary>
public static class ConsoleTables
{
    /// <summary>
    /// Muestra los movimientos de cuenta en una tabla formateada y agrega un gráfico de desglose de balance.
    /// </summary>
    public static void DrawMovementsTable(
        List<(DateTime Fecha, string Descripcion, string Tipo, decimal Monto, bool IsCredit, decimal Saldo)> txs,
        decimal saldoInicial,
        decimal totalDebitos,
        decimal totalCreditos,
        decimal saldoFinal)
    {
        Table table = new Table()
            .Border(TableBorder.Rounded)
            .Expand();

        table.AddColumn(new TableColumn("[bold white]Fecha / Hora[/]").Centered());
        table.AddColumn(new TableColumn("[bold white]Descripción[/]").LeftAligned());
        table.AddColumn(new TableColumn("[bold white]Tipo[/]").Centered());
        table.AddColumn(new TableColumn("[bold white]Monto[/]").RightAligned());
        table.AddColumn(new TableColumn("[bold white]Saldo[/]").RightAligned());

        foreach (var t in txs)
        {
            string color = t.IsCredit ? "green" : "red";
            string sign = t.IsCredit ? "+" : "-";
            string amountDisplay = $"{sign}${t.Monto:N2}";

            table.AddRow(
                $"[grey85]{t.Fecha:dd/MM/yyyy HH:mm}[/]",
                $"[white]{Markup.Escape(t.Descripcion)}[/]",
                $"[{color}]{t.Tipo}[/]",
                $"[{color}]{amountDisplay}[/]",
                $"[grey93]${t.Saldo:N2}[/]"
            );
        }

        AnsiConsole.Write(table);
        AnsiConsole.WriteLine();

        // Si existen movimientos, renderizar un gráfico analítico de desglose (BreakdownChart)
        if (totalDebitos > 0 || totalCreditos > 0)
        {
            var chart = new BreakdownChart()
                .Width(60)
                .AddItem("Débitos (Gastos)", (double)totalDebitos, Color.Red)
                .AddItem("Créditos (Ingresos)", (double)totalCreditos, Color.Green);

            var chartPanel = new Panel(chart)
            {
                Header = new PanelHeader("[bold white] RESUMEN ANALÍTICO DE FLUJO [/]"),
                Border = BoxBorder.Rounded,
                Padding = new Padding(2, 1, 2, 1)
            };
            chartPanel.BorderColor(ConsoleTheme.PrimaryColor);
            
            AnsiConsole.Write(chartPanel);
            AnsiConsole.WriteLine();
        }

        // Resumen del período en un grid ordenado
        Grid summaryGrid = new Grid().AddColumns(4);
        summaryGrid.AddRow(
            new Markup($"{ConsoleTheme.Muted}Saldo Inicial:{ConsoleTheme.End} {ConsoleTheme.Accent}${saldoInicial:N2}{ConsoleTheme.End}"),
            new Markup($"{ConsoleTheme.Muted}Total Débitos:{ConsoleTheme.End} {ConsoleTheme.ErrorBold}-${totalDebitos:N2}{ConsoleTheme.End}"),
            new Markup($"{ConsoleTheme.Muted}Total Créditos:{ConsoleTheme.End} {ConsoleTheme.SuccessBold}+${totalCreditos:N2}{ConsoleTheme.End}"),
            new Markup($"{ConsoleTheme.Muted}Saldo Final:{ConsoleTheme.End} {ConsoleTheme.PrimaryBold}${saldoFinal:N2}{ConsoleTheme.End}")
        );

        Panel summaryPanel = new Panel(summaryGrid)
        {
            Header = new PanelHeader("[bold white] BALANCE FINANCIERO [/]"),
            Border = BoxBorder.Rounded,
            Padding = new Padding(2, 1, 2, 1)
        };
        summaryPanel.BorderColor(ConsoleTheme.PrimaryColor);
        
        AnsiConsole.Write(summaryPanel);
        AnsiConsole.WriteLine();
    }
}
