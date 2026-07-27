using Usuario_Cliente.Services;
using Usuario_Cliente.Presentation;
using Spectre.Console;

while (true)
{
    // Limpia la consola del terminal para dar inicio a la interfaz del usuario.
    AnsiConsole.Clear();

    // Dibuja un encabezado con diseño de banco y borde redondeado usando el tema.
    Grid headerGrid = new Grid();
    headerGrid.AddColumn(); // Columna para el icono del banco ASCII
    headerGrid.AddColumn(); // Columna para el texto
    headerGrid.AddRow(
        new Markup($"{ConsoleTheme.Primary}  /\\\n /__\\\n ||||\n======{ConsoleTheme.End}"),
        new Markup($"\n {ConsoleTheme.PrimaryBold}RED BANCARIA NACIONAL{ConsoleTheme.End}\n {ConsoleTheme.Muted}Sistema de Integración Bancaria Central{ConsoleTheme.End}")
    );

    Panel panel = new Panel(headerGrid)
    {
        Border = BoxBorder.Rounded,
        Padding = new Padding(2, 1, 2, 1)
    };
    panel.BorderColor(ConsoleTheme.PrimaryColor);

    AnsiConsole.Write(panel);
    AnsiConsole.WriteLine();

    // Solicita de forma interactiva al usuario elegir el banco al que desea conectarse.
    var bankChoice = AnsiConsole.Prompt(
        new SelectionPrompt<string>()
            .Title($"{ConsoleTheme.Accent}Seleccione el Banco al que desea ingresar:{ConsoleTheme.End}")
            .PageSize(10)
            .HighlightStyle(new Style(ConsoleTheme.PrimaryColor, decoration: Decoration.Bold))
            .AddChoices(new[] { 
                "Banco Ruby (Puerto 5000)", 
                "Banco Maluma (Puerto 5002)", 
                "Salir de la Red Bancaria" 
            }));

    // Controla la salida del programa.
    if (bankChoice == "Salir de la Red Bancaria")
    {
        AnsiConsole.Clear();
        
        Grid exitGrid = new Grid().AddColumn();
        exitGrid.AddRow(new Markup($"{ConsoleTheme.PrimaryBold}¡Gracias por utilizar la Red Bancaria!{ConsoleTheme.End}"));
        exitGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Esperamos verle pronto de regreso. Conexión finalizada con éxito.{ConsoleTheme.End}"));
        
        Panel exitPanel = new Panel(exitGrid)
        {
            Border = BoxBorder.Rounded,
            Padding = new Padding(3, 1, 3, 1)
        };
        exitPanel.BorderColor(ConsoleTheme.PrimaryColor);
        AnsiConsole.Write(exitPanel);
        AnsiConsole.WriteLine();
        break;
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
}
