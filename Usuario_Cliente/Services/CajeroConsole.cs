using System.Globalization;
using System.Text.Json;
using Spectre.Console;

namespace Usuario_Cliente.Services;

/// <summary>
/// Proporciona la interfaz interactiva de línea de comandos (CLI) del Cajero Automático usando Spectre.Console.
/// Controla el flujo de autenticación, la presentación de los menús y la manipulación visual de saldos e históricos.
/// </summary>
public class CajeroConsole
{
    /// <summary>
    /// Límite máximo de dinero permitido por transacción de depósito local ($2000).
    /// </summary>
    private const decimal LIMITE_DEPOSITO = 2000m;

    /// <summary>
    /// Límite máximo de dinero permitido por transacción de retiro local ($800).
    /// </summary>
    private const decimal LIMITE_RETIRO = 800m;

    private readonly CajeroApiClient _apiClient;
    private readonly string _bankName;
    private readonly string _bankPrefix;
    private string _cuenta = string.Empty;
    private string _pin = string.Empty;
    private string _titular = string.Empty;
    private string _sessionId = string.Empty;

    /// <summary>
    /// Inicializa una nueva instancia de la clase <see cref="CajeroConsole"/>.
    /// </summary>
    /// <param name="apiClient">Cliente HTTP para enviar peticiones al banco correspondiente.</param>
    /// <param name="bankName">Nombre comercial del banco (Ruby o Maluma).</param>
    /// <param name="bankPrefix">Prefijo único del banco para formatear identificadores (RUBY o MALUMA).</param>
    public CajeroConsole(CajeroApiClient apiClient, string bankName, string bankPrefix)
    {
        _apiClient = apiClient;
        _bankName = bankName;
        _bankPrefix = bankPrefix.ToUpper();
    }

    /// <summary>
    /// Inicia el bucle principal de ejecución del cajero automático.
    /// Presenta el menú de bienvenida y gestiona el flujo de inserción de tarjeta/cuenta.
    /// </summary>
    public async Task RunAsync()
    {
        while (true)
        {
            AnsiConsole.Clear();
            DrawTitle();

            string[] mainOptions = { "Insertar tarjeta", "Salir" };
            int mainSelection = PromptMenuOption("Seleccione una opción:", mainOptions);

            if (mainSelection == 1)
            {
                AnsiConsole.MarkupLine("[green]Hasta luego.[/]");
                return;
            }

            // Si el usuario pasa la autenticación de PIN, inicia su sesión interactiva.
            if (await AuthenticateAsync())
            {
                await RunSessionAsync();
            }
        }
    }

    /// <summary>
    /// Solicita las credenciales del cliente (Número de cuenta y PIN) y realiza la autenticación remota.
    /// </summary>
    /// <returns>True si la autenticación fue exitosa; de lo contrario, False.</returns>
    private async Task<bool> AuthenticateAsync()
    {
        _cuenta = AnsiConsole.Ask<string>("Ingrese el número de cuenta/tarjeta:");
        _pin = AnsiConsole.Prompt(new TextPrompt<string>("Ingrese su PIN").Secret());

        string authResult = await _apiClient.AutenticarAsync(_cuenta, _pin);
        
        // Comprueba si el servidor devolvió algún error lógico de PIN o cuenta.
        if (authResult.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase) || authResult.Contains("error", StringComparison.OrdinalIgnoreCase))
        {
            AnsiConsole.MarkupLine("[red]Autenticación fallida.[/]");
            AnsiConsole.WriteLine(authResult);
            AnsiConsole.MarkupLine("[grey]Presione Enter para continuar...[/]");
            Console.ReadLine();
            return false;
        }

        try
        {
            // Parsea la respuesta para obtener los datos del titular e iniciar la sesión con un Session ID único.
            using JsonDocument document = JsonDocument.Parse(authResult);
            _titular = document.RootElement.GetProperty("titular").GetString() ?? string.Empty;
            _sessionId = Guid.NewGuid().ToString();
        }
        catch
        {
            _titular = string.Empty;
            _sessionId = Guid.NewGuid().ToString();
        }

        return true;
    }

    /// <summary>
    /// Bucle secundario de sesión activa que presenta las opciones de cajero (Saldo, Retiro, Depósito, Historial, Transferir).
    /// </summary>
    private async Task RunSessionAsync()
    {
        while (true)
        {
            AnsiConsole.Clear();
            DrawSessionHeader();

            string[] options = { "Consultar saldo", "Retirar efectivo", "Depositar efectivo", "Consultar movimientos", "Transferir dinero", "Retirar tarjeta" };
            int selected = PromptMenuOption("Seleccione una opción:", options);

            switch (selected)
            {
                case 0:
                    await ConsultarSaldoAsync();
                    break;
                case 1:
                    await RetirarAsync();
                    break;
                case 2:
                    await DepositarAsync();
                    break;
                case 3:
                    await MostrarHistorialAsync();
                    break;
                case 4:
                    await TransferirAsync();
                    break;
                case 5:
                    return; // Retira la tarjeta y sale de la sesión
            }

            AnsiConsole.MarkupLine("[grey]Presione Enter para continuar...[/]");
            Console.ReadLine();
        }
    }

    /// <summary>
    /// Dibuja el panel de título principal del cajero automático.
    /// </summary>
    private void DrawTitle()
    {
        Panel title = new Panel($"[bold cyan]CAJERO AUTOMATICO BANCO {_bankPrefix}[/]")
            .Header($"[green]Banco {_bankName}[/]")
            .Border(BoxBorder.Double)
            .Expand();

        AnsiConsole.Write(title);
        AnsiConsole.WriteLine();
    }

    /// <summary>
    /// Dibuja la cabecera informativa de la sesión activa en el cajero automático.
    /// </summary>
    private void DrawSessionHeader()
    {
        Table headerTable = new Table().Expand().HideHeaders();
        headerTable.AddColumn(new TableColumn("Info").NoWrap());
        headerTable.AddColumn(new TableColumn("Valor"));
        headerTable.AddRow("[bold green]Sesion activa:[/]", _sessionId);
        headerTable.AddRow("[bold green]Tarjeta:[/]", MaskCard(_cuenta));
        headerTable.AddRow("[bold green]Cuenta:[/]", _cuenta);
        headerTable.AddRow("[bold green]Titular:[/]", _titular);

        Panel panel = new Panel(headerTable)
            .Border(BoxBorder.Double)
            .Header($"[bold cyan]CAJERO AUTOMATICO BANCO {_bankPrefix}[/]");

        AnsiConsole.Write(panel);
        AnsiConsole.WriteLine();
    }

    /// <summary>
    /// Ofusca los dígitos de la tarjeta dejando únicamente visibles los últimos 4 números.
    /// </summary>
    private static string MaskCard(string cardNumber)
    {
        if (string.IsNullOrWhiteSpace(cardNumber) || cardNumber.Length <= 4)
            return cardNumber;

        string visible = cardNumber[^4..];
        return new string('*', cardNumber.Length - 4) + visible;
    }

    /// <summary>
    /// Formatea el número de cuenta local para mostrar su banco origen en las etiquetas.
    /// </summary>
    private string FormatAccountLabel(string accountNumber)
    {
        if (string.IsNullOrWhiteSpace(accountNumber))
            return string.Empty;

        return accountNumber.StartsWith($"{_bankPrefix}-", StringComparison.OrdinalIgnoreCase)
            ? accountNumber
            : $"{_bankPrefix}-{accountNumber[^4..]}";
    }

    /// <summary>
    /// Presenta de forma interactiva una lista de opciones y retorna el índice de la opción seleccionada.
    /// </summary>
    private static int PromptMenuOption(string promptMessage, string[] options)
    {
        var prompt = new SelectionPrompt<string>()
            .Title(promptMessage)
            .PageSize(10)
            .MoreChoicesText("<Seleccione una opción adicional>")
            .AddChoices(options);

        string selected = AnsiConsole.Prompt(prompt);
        return Array.IndexOf(options, selected);
    }

    /// <summary>
    /// Llama al API para consultar saldo e imprime los detalles del cliente en una tabla limpia.
    /// </summary>
    private async Task ConsultarSaldoAsync()
    {
        string result = await _apiClient.ConsultarSaldoAsync(_cuenta);
        if (result.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            AnsiConsole.MarkupLine($"[red]{Markup.Escape(result)}[/]");
            return;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(result);
            JsonElement root = document.RootElement;

            if (root.TryGetProperty("error", out JsonElement error))
            {
                AnsiConsole.MarkupLine($"[red]ERROR: {Markup.Escape(error.GetString() ?? string.Empty)}[/]");
                return;
            }

            decimal saldo = root.GetProperty("saldo").GetDecimal();
            string titular = root.GetProperty("titular").GetString() ?? string.Empty;

            Table table = new Table().Border(TableBorder.Rounded).Title("Saldo");
            table.AddColumn("Cuenta");
            table.AddColumn("Titular");
            table.AddColumn("Saldo");
            table.AddRow(FormatAccountLabel(_cuenta), Markup.Escape(titular), $"${saldo:N2}");
            AnsiConsole.Write(table);
        }
        catch
        {
            AnsiConsole.WriteLine(result);
        }
    }

    /// <summary>
    /// Captura un monto por consola y solicita depósito de efectivo en el servidor de base de datos.
    /// </summary>
    private async Task DepositarAsync()
    {
        decimal monto = AnsiConsole.Ask<decimal>($"Monto a depositar (máx {LIMITE_DEPOSITO:N0}):");
        if (monto <= 0)
        {
            AnsiConsole.MarkupLine("[red]Monto inválido.[/]");
            return;
        }

        if (monto > LIMITE_DEPOSITO)
        {
            AnsiConsole.MarkupLine($"[red]ERROR: Límite de depósito {LIMITE_DEPOSITO:N0}.[/]");
            return;
        }

        if (!AnsiConsole.Confirm("¿Desea continuar con el depósito?"))
        {
            AnsiConsole.MarkupLine("[grey]Depósito cancelado.[/]");
            return;
        }

        string result = await _apiClient.DepositarAsync(_cuenta, monto);
        if (result.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            AnsiConsole.MarkupLine($"[red]{Markup.Escape(result)}[/]");
            return;
        }

        try
        {
            using JsonDocument doc = JsonDocument.Parse(result);
            JsonElement root = doc.RootElement;
            if (root.TryGetProperty("error", out JsonElement err))
            {
                AnsiConsole.MarkupLine($"[red]{Markup.Escape(err.GetString() ?? string.Empty)}[/]");
                return;
            }

            if (root.TryGetProperty("title", out JsonElement title))
            {
                string titleText = title.GetString() ?? string.Empty;
                string detailText = root.TryGetProperty("detail", out JsonElement detail) ? detail.GetString() ?? string.Empty : string.Empty;
                AnsiConsole.MarkupLine($"[red]{Markup.Escape(titleText)}[/]");
                if (!string.IsNullOrEmpty(detailText))
                    AnsiConsole.MarkupLine($"[red]{Markup.Escape(detailText)}[/]");
                return;
            }

            string? mensaje = root.TryGetProperty("mensaje", out JsonElement m) ? m.GetString() : (root.TryGetProperty("Mensaje", out JsonElement m2) ? m2.GetString() : null);
            decimal saldo = 0m;
            if (root.TryGetProperty("saldo", out JsonElement s))
                saldo = s.GetDecimal();
            else if (root.TryGetProperty("Saldo", out JsonElement s2))
                saldo = s2.GetDecimal();

            if (!string.IsNullOrEmpty(mensaje))
                AnsiConsole.MarkupLine($"[green]{Markup.Escape(mensaje)}[/]");
            else
                AnsiConsole.MarkupLine($"[grey]Respuesta del servidor:[/] {Markup.Escape(result)}");

            AnsiConsole.MarkupLine($"[bold]Monto depositado:[/] [yellow]${monto:N2}[/]");
            AnsiConsole.MarkupLine($"[bold]Saldo actual:[/] [yellow]${saldo:N2}[/]");
        }
        catch (JsonException)
        {
            AnsiConsole.WriteLine(result);
        }
        catch (Exception ex)
        {
            AnsiConsole.MarkupLine($"[red]Error al procesar respuesta: {Markup.Escape(ex.Message)}[/]");
            AnsiConsole.WriteLine(result);
        }
    }

    /// <summary>
    /// Captura un monto por consola y procesa un retiro de efectivo debitando fondos del banco.
    /// </summary>
    private async Task RetirarAsync()
    {
        decimal monto = AnsiConsole.Ask<decimal>($"Monto a retirar (máx {LIMITE_RETIRO:N0}):");
        if (monto <= 0)
        {
            AnsiConsole.MarkupLine("[red]Monto inválido.[/]");
            return;
        }

        if (monto > LIMITE_RETIRO)
        {
            AnsiConsole.MarkupLine($"[red]ERROR: Límite de retiro {LIMITE_RETIRO:N0}.[/]");
            return;
        }

        const decimal comision = 0.41m;
        AnsiConsole.MarkupLine($"[yellow]Se cobrará una comisión de ${comision:N2}.[/]");
        if (!AnsiConsole.Confirm("¿Desea continuar?"))
        {
            AnsiConsole.MarkupLine("[grey]Retiro cancelado.[/]");
            return;
        }

        string result = await _apiClient.RetirarAsync(_cuenta, monto);
        if (result.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            AnsiConsole.MarkupLine($"[red]{Markup.Escape(result)}[/]");
            return;
        }

        try
        {
            using JsonDocument doc = JsonDocument.Parse(result);
            JsonElement root = doc.RootElement;
            if (root.TryGetProperty("error", out JsonElement err))
            {
                AnsiConsole.MarkupLine($"[red]{Markup.Escape(err.GetString() ?? string.Empty)}[/]");
                return;
            }

            if (root.TryGetProperty("title", out JsonElement title))
            {
                string titleText = title.GetString() ?? string.Empty;
                string detailText = root.TryGetProperty("detail", out JsonElement detail) ? detail.GetString() ?? string.Empty : string.Empty;
                AnsiConsole.MarkupLine($"[red]{Markup.Escape(titleText)}[/]");
                if (!string.IsNullOrEmpty(detailText))
                    AnsiConsole.MarkupLine($"[red]{Markup.Escape(detailText)}[/]");
                return;
            }

            string? mensaje = root.TryGetProperty("mensaje", out JsonElement m) ? m.GetString() : (root.TryGetProperty("Mensaje", out JsonElement m2) ? m2.GetString() : null);
            decimal saldo = 0m;
            if (root.TryGetProperty("saldo", out JsonElement s))
                saldo = s.GetDecimal();
            else if (root.TryGetProperty("Saldo", out JsonElement s2))
                saldo = s2.GetDecimal();

            if (!string.IsNullOrEmpty(mensaje))
                AnsiConsole.MarkupLine($"[green]{Markup.Escape(mensaje)}[/]");
            else
                AnsiConsole.MarkupLine($"[grey]Respuesta del servidor:[/] {Markup.Escape(result)}");

            AnsiConsole.MarkupLine($"[bold]Monto retirado:[/] [yellow]${monto:N2}[/]");
            AnsiConsole.MarkupLine($"[bold]Comisión:[/] [yellow]${comision:N2}[/]");
            AnsiConsole.MarkupLine($"[bold]Saldo actual:[/] [yellow]${saldo:N2}[/]");
        }
        catch (JsonException)
        {
            AnsiConsole.WriteLine(result);
        }
        catch (Exception ex)
        {
            AnsiConsole.MarkupLine($"[red]Error al procesar respuesta: {Markup.Escape(ex.Message)}[/]");
            AnsiConsole.WriteLine(result);
        }
    }

    /// <summary>
    /// Consulta el listado histórico de movimientos de la cuenta de forma tabulada.
    /// Asigna colores de forma semántica dependiendo del tipo de operación (Débitos en rojo, Créditos en verde).
    /// </summary>
    private async Task MostrarHistorialAsync()
    {
        string result = await _apiClient.ObtenerHistorialAsync(_cuenta);
        if (result.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            AnsiConsole.MarkupLine($"[red]{Markup.Escape(result)}[/]");
            return;
        }

        try
        {
            using JsonDocument doc = JsonDocument.Parse(result);
            JsonElement root = doc.RootElement;
            if (root.TryGetProperty("error", out JsonElement err))
            {
                AnsiConsole.MarkupLine($"[red]{Markup.Escape(err.GetString() ?? string.Empty)}[/]");
                return;
            }

            string titular = root.GetProperty("titular").GetString() ?? string.Empty;
            List<JsonElement> historial = root.GetProperty("historial").EnumerateArray().ToList();

            if (historial.Count == 0)
            {
                AnsiConsole.MarkupLine("[yellow]No hay movimientos registrados.[/]");
                return;
            }

            Table table = new Table()
                .Border(TableBorder.Rounded)
                .Title($"[bold cyan]Movimientos — {Markup.Escape(titular)}[/]")
                .Expand();

            table.AddColumn(new TableColumn("[bold]#[/]").Centered());
            table.AddColumn(new TableColumn("[bold]Movimiento[/]").Centered());
            table.AddColumn(new TableColumn("[bold]Descripción[/]").LeftAligned());
            table.AddColumn(new TableColumn("[bold]Valor[/]").RightAligned());
            table.AddColumn(new TableColumn("[bold]Fecha[/]").Centered());
            table.AddColumn(new TableColumn("[bold]Hora[/]").Centered());

            int numero = 1;
            foreach (JsonElement item in historial)
            {
                // Lee "tipo" o "Tipo" según cómo venga el JSON del servidor.
                string tipo = string.Empty;
                if (item.TryGetProperty("tipo", out JsonElement tp)) tipo = tp.GetString() ?? string.Empty;
                else if (item.TryGetProperty("Tipo", out JsonElement tp2)) tipo = tp2.GetString() ?? string.Empty;

                // Lee "monto" o "Monto".
                decimal monto = 0m;
                if (item.TryGetProperty("monto", out JsonElement mn)) monto = mn.GetDecimal();
                else if (item.TryGetProperty("Monto", out JsonElement mn2)) monto = mn2.GetDecimal();

                // Lee "descripcion" o "Descripcion".
                string desc = string.Empty;
                if (item.TryGetProperty("descripcion", out JsonElement dc)) desc = dc.GetString() ?? string.Empty;
                else if (item.TryGetProperty("Descripcion", out JsonElement dc2)) desc = dc2.GetString() ?? string.Empty;

                string tipoLower = tipo.ToLowerInvariant();
                if (tipoLower.Contains("retiro") || tipoLower.Contains("withdrawal"))
                {
                    desc = $"Se debitó de la cuenta ${monto:N2}";
                }
                else if (tipoLower.Contains("deposit") || tipoLower.Contains("depósito") || tipoLower.Contains("dep"))
                {
                    desc = $"Se acreditó a la cuenta ${monto:N2}";
                }

                // Lee "creadoEn" o "CreadoEn".
                DateTime fechaRaw = DateTime.MinValue;
                if (item.TryGetProperty("creadoEn", out JsonElement fe)) fechaRaw = fe.GetDateTime();
                else if (item.TryGetProperty("CreadoEn", out JsonElement fe2)) fechaRaw = fe2.GetDateTime();

                DateTime fechaLocal = fechaRaw.ToLocalTime();

                string color = tipo.ToLowerInvariant() switch
                {
                    string t when t.Contains("withdrawal") || t.Contains("retiro") => "red",
                    string t when t.Contains("deposit") || t.Contains("dep") => "green",
                    string t when t.Contains("transferencia salida") || t.Contains("transferencia enviada") => "red",
                    string t when t.Contains("transferencia entrada") || t.Contains("transferencia recibida") => "green",
                    _ => "white"
                };

                string etiqueta = tipo.ToLowerInvariant() switch
                {
                    string t when t.Contains("withdrawal") || t.Contains("retiro") => "Retiro",
                    string t when t.Contains("deposit") || t.Contains("dep") => "Depósito",
                    string t when t.Contains("transferencia salida") || t.Contains("transferencia enviada") => "Transferencia enviada",
                    string t when t.Contains("transferencia entrada") || t.Contains("transferencia recibida") => "Transferencia recibida",
                    _ => Markup.Escape(tipo)
                };

                table.AddRow(
                    $"[{color}]{numero}[/]",
                    $"[{color}]{etiqueta}[/]",
                    $"[{color}]{Markup.Escape(desc)}[/]",
                    $"[{color}]${monto:N2}[/]",
                    $"[{color}]{fechaLocal:dd/MM/yyyy}[/]",
                    $"[{color}]{fechaLocal:HH:mm:ss}[/]"
                );

                numero++;
            }

            AnsiConsole.Write(table);
            AnsiConsole.WriteLine();
            AnsiConsole.MarkupLine("[green]●[/] Depósito / Transferencia recibida   [red]●[/] Retiro / Transferencia enviada");
        }
        catch
        {
            AnsiConsole.WriteLine(result);
        }
    }

    /// <summary>
    /// Captura los datos de destino (cuenta, banco, concepto, monto) y efectúa una transferencia.
    /// </summary>
    private async Task TransferirAsync()
    {
        string[] transferOptions = { "Continuar", "Regresar al menú" };
        int transferSelection = PromptMenuOption("Transferencia: elija una opción:", transferOptions);

        if (transferSelection == 1)
        {
            AnsiConsole.MarkupLine("[grey]Transferencia cancelada. Regresando al menú.[/]");
            return;
        }

        string destino = AnsiConsole.Ask<string>("Cuenta destino:");
        if (string.IsNullOrWhiteSpace(destino))
        {
            AnsiConsole.MarkupLine("[red]Cuenta destino inválida.[/]");
            return;
        }

        string banco = AnsiConsole.Ask<string>("Banco destino (opcional):");
        string concepto = AnsiConsole.Ask<string>("Concepto (opcional):");
        decimal monto = AnsiConsole.Ask<decimal>("Monto a transferir:");

        if (monto <= 0)
        {
            AnsiConsole.MarkupLine("[red]Monto inválido.[/]");
            return;
        }

        string result = await _apiClient.TransferirAsync(_cuenta, destino, banco, monto, concepto);
        if (result.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            AnsiConsole.MarkupLine($"[red]{Markup.Escape(result)}[/]");
            return;
        }

        try
        {
            using JsonDocument doc = JsonDocument.Parse(result);
            JsonElement root = doc.RootElement;
            if (root.TryGetProperty("error", out JsonElement err))
            {
                AnsiConsole.MarkupLine($"[red]{Markup.Escape(err.GetString() ?? string.Empty)}[/]");
                return;
            }

            string? mensaje = root.TryGetProperty("mensaje", out JsonElement m) ? m.GetString() : null;
            if (!string.IsNullOrEmpty(mensaje)) AnsiConsole.MarkupLine($"[green]{Markup.Escape(mensaje)}[/]");
        }
        catch
        {
            AnsiConsole.WriteLine(result);
        }
    }
}