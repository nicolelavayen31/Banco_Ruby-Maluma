using Usuario_Cliente.Services;
using Spectre.Console;

while (true)
{
    // Limpia la consola del terminal para dar inicio a la interfaz del usuario.
    AnsiConsole.Clear();

    // Dibuja un encabezado con diseño de banco y borde segmentado usando Spectre.Console.
    Grid headerGrid = new Grid();
    headerGrid.AddColumn(); // Columna para el icono del banco ASCII
    headerGrid.AddColumn(); // Columna para el texto
    headerGrid.AddRow(
        new Markup("[white]  /\\\n /__\\\n ||||\n======[/]"),
        new Markup("\n [bold deepskyblue1]RED BANCARIA[/]\n [grey85]Sistema de Integración Bancaria[/]")
    );

    Panel panel = new Panel(headerGrid)
    {
        Border = BoxBorder.Ascii,
        Padding = new Padding(1, 0, 1, 0)
    };

    AnsiConsole.Write(panel);
    AnsiConsole.WriteLine();

    // Solicita de forma interactiva al usuario elegir el banco al que desea conectarse.
    var bankChoice = AnsiConsole.Prompt(
        new SelectionPrompt<string>()
            .Title("[bold green]Seleccione el Banco al que desea ingresar:[/]")
            .PageSize(10)
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
        exitGrid.AddRow(new Markup("[bold deepskyblue1]¡Gracias por utilizar la Red Bancaria![/]"));
        exitGrid.AddRow(new Markup("[grey85]Esperamos verle pronto de regreso. Conexión finalizada con éxito.[/]"));
        
        Panel exitPanel = new Panel(exitGrid)
        {
            Border = BoxBorder.Rounded,
            Padding = new Padding(3, 1, 3, 1)
        };
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
