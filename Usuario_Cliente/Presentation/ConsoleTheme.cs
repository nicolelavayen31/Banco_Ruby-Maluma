using Spectre.Console;

namespace Usuario_Cliente.Presentation;

/// <summary>
/// Define los colores, estilos y símbolos institucionales del banco.
/// </summary>
public static class ConsoleTheme
{
    // Código hexadecimal del color primario (Rojo Rubí)
    public const string PrimaryHex = "#D21F3C";

    // Colores principales
    public static readonly Color PrimaryColor = new Color(210, 31, 60); // Rojo Rubí
    public static readonly Color SecondaryColor = Color.White;
    public static readonly Color MutedColor = Color.Grey;
    public static readonly Color DarkColor = Color.Black;

    // Colores semánticos
    public static readonly Color SuccessColor = Color.Green;
    public static readonly Color ErrorColor = Color.Red;
    public static readonly Color WarningColor = Color.Yellow;
    public static readonly Color InfoColor = new Color(0, 255, 255); // Cyan (RGB)

    // Marcado (Markup) de texto
    public const string Primary = $"[{PrimaryHex}]";
    public const string PrimaryBold = $"[bold {PrimaryHex}]";
    public const string Accent = "[white]";
    public const string AccentBold = "[bold white]";
    public const string Muted = "[grey85]";
    public const string Dark = "[black]";
    
    public const string Success = "[green]";
    public const string SuccessBold = "[bold green]";
    public const string Error = "[red]";
    public const string ErrorBold = "[bold red]";
    public const string Warning = "[yellow]";
    public const string WarningBold = "[bold yellow]";
    public const string Info = "[cyan]";
    public const string InfoBold = "[bold cyan]";

    public const string End = "[/]";

    // Iconos y Emojis
    public const string IconSuccess = "✔";
    public const string IconError = "✖";
    public const string IconWarning = "⚠";
    public const string IconInfo = "ℹ";
    
    public const string IconUser = "👤";
    public const string IconLock = "🔒";
    public const string IconCard = "💳";
    public const string IconBank = "🏦";
    public const string IconBalance = "💰";
    
    public const string IconCalendar = "📅";
    public const string IconClock = "🕒";
    public const string IconStatusOk = "🟢";
    public const string IconStatusFail = "🔴";
}
