using Spectre.Console;

namespace Usuario_Cliente.Presentation;

/// <summary>
/// Proporciona animaciones de carga, spinners y barras de progreso elegantes.
/// </summary>
public static class ConsoleAnimations
{
    /// <summary>
    /// Ejecuta una tarea asíncrona mientras muestra un spinner institucional.
    /// </summary>
    public static async Task<T> ShowSpinnerAsync<T>(string message, Func<Task<T>> action)
    {
        T result = default!;
        
        await AnsiConsole.Status()
            .Spinner(Spinner.Known.BouncingBar)
            .SpinnerStyle(Style.Parse($"bold {ConsoleTheme.PrimaryHex}"))
            .StartAsync($"[bold white]{message}[/]", async ctx =>
            {
                result = await action();
            });

        return result;
    }

    /// <summary>
    /// Ejecuta una acción asíncrona sin retorno mientras muestra un spinner institucional.
    /// </summary>
    public static async Task ShowSpinnerAsync(string message, Func<Task> action)
    {
        await AnsiConsole.Status()
            .Spinner(Spinner.Known.BouncingBar)
            .SpinnerStyle(Style.Parse($"bold {ConsoleTheme.PrimaryHex}"))
            .StartAsync($"[bold white]{message}[/]", async ctx =>
            {
                await action();
            });
    }

    /// <summary>
    /// Muestra una barra de progreso que simula un proceso del sistema (como una transferencia o conexión).
    /// </summary>
    public static async Task ShowProgressBarAsync(string message, int durationMs = 1500)
    {
        await AnsiConsole.Progress()
            .Columns(new ProgressColumn[]
            {
                new TaskDescriptionColumn(),
                new ProgressBarColumn() { CompletedStyle = Style.Parse(ConsoleTheme.PrimaryHex), RemainingStyle = Style.Parse("grey") },
                new PercentageColumn() { Style = Style.Parse($"bold {ConsoleTheme.PrimaryHex}") },
                new SpinnerColumn(Spinner.Known.Dots) { Style = Style.Parse(ConsoleTheme.PrimaryHex) }
            })
            .StartAsync(async ctx =>
            {
                var task = ctx.AddTask($"[bold white]{message}[/]");
                int steps = 100;
                int sleepTime = durationMs / steps;
                
                while (!ctx.IsFinished)
                {
                    await Task.Delay(sleepTime);
                    task.Increment(1);
                }
            });
    }

    /// <summary>
    /// Simula un proceso corto de carga con un spinner simple.
    /// </summary>
    public static async Task SimulateShortLoadAsync(string message, int durationMs = 800)
    {
        await AnsiConsole.Status()
            .Spinner(Spinner.Known.Dots)
            .SpinnerStyle(Style.Parse($"bold {ConsoleTheme.PrimaryHex}"))
            .StartAsync($"[bold white]{message}[/]", async ctx =>
            {
                await Task.Delay(durationMs);
            });
    }
}
