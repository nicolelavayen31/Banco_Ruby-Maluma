using Usuario_Cliente.Services;
using Spectre.Console;

// Limpia la consola del terminal para dar inicio a la interfaz del usuario.
AnsiConsole.Clear();

// Dibuja un encabezado grande decorado con texto ASCII art "RED BANCARIA" usando Spectre.Console.
AnsiConsole.Write(
    new FigletText("RED BANCARIA")
        .Color(Color.FromConsoleColor(ConsoleColor.Cyan)));

// Solicita de forma interactiva al usuario elegir el banco al que desea conectarse.
var bankChoice = AnsiConsole.Prompt(
    new SelectionPrompt<string>()
        .Title("[bold green]Seleccione el Banco al que desea ingresar:[/]")
        .PageSize(10)
        .AddChoices(new[] { 
            "Banco Ruby (Puerto 5000)", 
            "Banco Maluma (Puerto 5002)", 
            "Salir" 
        }));

// Controla la salida del programa.
if (bankChoice == "Salir")
{
    AnsiConsole.MarkupLine("[green]Hasta luego.[/]");
    return;
}

string apiBaseUrl;
string bankName;
string bankPrefix;

// Configura las variables de enrutamiento HTTP y prefijos visuales del cajero automático seleccionado.
if (bankChoice.Contains("Ruby"))
{
    apiBaseUrl = "http://localhost:5000";
    bankName = "Ruby";
    bankPrefix = "RUBY";
}
else
{
    apiBaseUrl = "http://localhost:5002";
    bankName = "Maluma";
    bankPrefix = "MALUMA";
}

// Instancia el cliente HTTP y lanza el bucle de interacción del cajero automático.
CajeroApiClient apiClient = new CajeroApiClient(apiBaseUrl);
CajeroConsole console = new CajeroConsole(apiClient, bankName, bankPrefix);
await console.RunAsync();
