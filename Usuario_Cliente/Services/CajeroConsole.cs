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
                AnsiConsole.Clear();
                Grid exitGrid = new Grid().AddColumn();
                exitGrid.AddRow(new Markup($"[bold deepskyblue1]Cerrando sesión en Banco {_bankName}...[/]"));
                exitGrid.AddRow(new Markup("[grey85]Su tarjeta ha sido retirada con éxito. Regresando a la Red Bancaria...[/]"));
                
                Panel exitPanel = new Panel(exitGrid)
                {
                    Border = BoxBorder.Rounded,
                    Padding = new Padding(3, 1, 3, 1)
                };
                AnsiConsole.Write(exitPanel);
                AnsiConsole.WriteLine();
                
                AnsiConsole.MarkupLine("  [grey]Presione Enter para continuar...[/]");
                Console.ReadLine();
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
        Grid headerGrid = new Grid();
        headerGrid.AddColumn();
        headerGrid.AddColumn();
        headerGrid.AddRow(
            new Markup("[white]  /\\\n /__\\\n ||||\n======[/]"),
            new Markup($"\n [bold deepskyblue1]BANCO {_bankPrefix}[/]\n [grey85]Cajero Automático Activo[/]")
        );

        Panel panel = new Panel(headerGrid)
        {
            Border = BoxBorder.Ascii,
            Padding = new Padding(1, 0, 1, 0)
        };

        AnsiConsole.Write(panel);
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

            AnsiConsole.Clear();
            AnsiConsole.Write(new Rule("[bold deepskyblue1]CONSULTA DE SALDO[/]").LeftJustified());
            AnsiConsole.WriteLine();

            Table table = new Table().Border(TableBorder.Rounded).Expand();
            table.AddColumn("[bold white]Tarjeta[/]");
            table.AddColumn("[bold white]Titular[/]");
            table.AddColumn("[bold white]Saldo Disponible[/]");
            table.AddRow(MaskCard(_cuenta), Markup.Escape(titular), $"[green]${saldo:N2}[/]");
            AnsiConsole.Write(table);
            AnsiConsole.WriteLine();
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

            AnsiConsole.Clear();
            
            AnsiConsole.Write(new Rule("[bold deepskyblue1]CONSULTA DE MOVIMIENTOS[/]").LeftJustified());
            AnsiConsole.WriteLine();

            Grid criteriaGrid = new Grid().AddColumns(3);
            criteriaGrid.AddRow(
                new Markup($"[grey]Número de Tarjeta:[/] [bold white]{MaskCard(_cuenta)}[/]"),
                new Markup($"[grey]Titular:[/] [bold white]{Markup.Escape(titular)}[/]"),
                new Markup($"[grey]Búsqueda:[/] [bold green][[Todos]][/]")
            );
            
            Panel criteriaPanel = new Panel(criteriaGrid)
            {
                Header = new PanelHeader("[bold deepskyblue1] Criterios de Búsqueda [/]"),
                Border = BoxBorder.Rounded,
                Padding = new Padding(2, 0, 2, 0)
            };

            AnsiConsole.Write(criteriaPanel);
            AnsiConsole.WriteLine();

            if (historial.Count == 0)
            {
                AnsiConsole.MarkupLine("[yellow]No hay movimientos registrados para esta cuenta.[/]");
                return;
            }

            var txs = new List<(DateTime Fecha, string Descripcion, string Tipo, decimal Monto, bool IsCredit, decimal Saldo)>();
            decimal totalDebitos = 0m;
            decimal totalCreditos = 0m;

            foreach (JsonElement item in historial)
            {
                string tipo = string.Empty;
                if (item.TryGetProperty("tipo", out JsonElement tp)) tipo = tp.GetString() ?? string.Empty;
                else if (item.TryGetProperty("Tipo", out JsonElement tp2)) tipo = tp2.GetString() ?? string.Empty;

                decimal monto = 0m;
                if (item.TryGetProperty("monto", out JsonElement mn)) monto = mn.GetDecimal();
                else if (item.TryGetProperty("Monto", out JsonElement mn2)) monto = mn2.GetDecimal();

                string desc = string.Empty;
                if (item.TryGetProperty("descripcion", out JsonElement dc)) desc = dc.GetString() ?? string.Empty;
                else if (item.TryGetProperty("Descripcion", out JsonElement dc2)) desc = dc2.GetString() ?? string.Empty;

                DateTime fechaRaw = DateTime.MinValue;
                if (item.TryGetProperty("creadoEn", out JsonElement fe)) fechaRaw = fe.GetDateTime();
                else if (item.TryGetProperty("CreadoEn", out JsonElement fe2)) fechaRaw = fe2.GetDateTime();

                DateTime fechaLocal = fechaRaw.ToLocalTime();

                string tipoLower = tipo.ToLowerInvariant();
                bool isDebit = tipoLower.Contains("withdrawal") || tipoLower.Contains("retiro") || tipoLower.Contains("transferencia salida") || tipoLower.Contains("transferencia enviada");
                bool isCredit = tipoLower.Contains("deposit") || tipoLower.Contains("dep") || tipoLower.Contains("transferencia entrada") || tipoLower.Contains("transferencia recibida");

                if (isCredit) totalCreditos += monto;
                if (isDebit) totalDebitos += monto;

                txs.Add((fechaLocal, desc, isCredit ? "Crédito" : "Débito", monto, isCredit, 0m));
            }

            decimal saldoFinal = 0m;
            string balanceResult = await _apiClient.ConsultarSaldoAsync(_cuenta);
            if (!balanceResult.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    using JsonDocument docB = JsonDocument.Parse(balanceResult);
                    saldoFinal = docB.RootElement.GetProperty("saldo").GetDecimal();
                }
                catch {}
            }

            txs = txs.OrderByDescending(t => t.Fecha).ToList();
            
            decimal currentRunning = saldoFinal;
            for (int i = 0; i < txs.Count; i++)
            {
                var t = txs[i];
                t.Saldo = currentRunning;
                txs[i] = t;

                if (t.IsCredit)
                {
                    currentRunning -= t.Monto;
                }
                else
                {
                    currentRunning += t.Monto;
                }
            }

            decimal saldoInicial = currentRunning;

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

            Grid summaryGrid = new Grid().AddColumns(4);
            summaryGrid.AddRow(
                new Markup($"[grey]Saldo Inicial:[/] [white]${saldoInicial:N2}[/]"),
                new Markup($"[grey]Total Débitos:[/] [red]-${totalDebitos:N2}[/]"),
                new Markup($"[grey]Total Créditos:[/] [green]+${totalCreditos:N2}[/]"),
                new Markup($"[grey]Saldo Final:[/] [bold deepskyblue1]${saldoFinal:N2}[/]")
            );

            Panel summaryPanel = new Panel(summaryGrid)
            {
                Header = new PanelHeader("[bold deepskyblue1] Resumen del Período [/]"),
                Border = BoxBorder.Rounded,
                Padding = new Padding(2, 0, 2, 0)
            };
            AnsiConsole.Write(summaryPanel);
            AnsiConsole.WriteLine();

            AnsiConsole.MarkupLine("  [grey]ENTER[/] Volver al Menú Principal");
        }
        catch (Exception ex)
        {
            AnsiConsole.MarkupLine($"[red]EXCEPCIÓN EN RENDERIZADO: {Markup.Escape(ex.Message)}[/]");
            AnsiConsole.WriteLine(ex.ToString());
            AnsiConsole.WriteLine(result);
        }
    }

    /// <summary>
    /// Captura los datos de destino (cuenta, banco, concepto, monto) y efectúa una transferencia.
    /// </summary>
    private async Task TransferirAsync()
    {
        AnsiConsole.Clear();
        AnsiConsole.Write(new Rule("[bold deepskyblue1]NUEVA TRANSFERENCIA[/]").LeftJustified());
        AnsiConsole.WriteLine();

        AnsiConsole.MarkupLine("[grey]Desde la Tarjeta:[/]");
        AnsiConsole.MarkupLine($"[bold white]{MaskCard(_cuenta)} - {_titular}[/]");
        AnsiConsole.WriteLine();

        string destino = AnsiConsole.Prompt(
            new TextPrompt<string>("[grey]A la Cuenta / Tarjeta:[/]")
                .PromptStyle("bold white")
                .ValidationErrorMessage("[red]Por favor ingrese una cuenta válida[/]")
        );

        if (string.IsNullOrWhiteSpace(destino))
        {
            AnsiConsole.MarkupLine("[red]Cuenta destino inválida.[/]");
            return;
        }

        string banco = AnsiConsole.Prompt(
            new TextPrompt<string>("[grey]Banco Destino (opcional, Enter para omitir):[/]")
                .AllowEmpty()
        );

        decimal monto = AnsiConsole.Prompt(
            new TextPrompt<decimal>("[grey]Monto ($):[/]")
                .PromptStyle("yellow")
                .ValidationErrorMessage("[red]Por favor ingrese un monto válido mayor a 0[/]")
        );

        if (monto <= 0)
        {
            AnsiConsole.MarkupLine("[red]Monto inválido.[/]");
            return;
        }

        string concepto = AnsiConsole.Prompt(
            new TextPrompt<string>("[grey]Descripción / Concepto (opcional, Enter para omitir):[/]")
                .AllowEmpty()
        );

        AnsiConsole.WriteLine();

        var options = new[] { "Confirmar Transferencia", "Cancelar" };
        var selection = AnsiConsole.Prompt(
            new SelectionPrompt<string>()
                .Title("Seleccione una opción:")
                .AddChoices(options)
        );

        if (selection == "Cancelar")
        {
            AnsiConsole.MarkupLine("[grey]Transferencia cancelada. Regresando al menú.[/]");
            return;
        }

        AnsiConsole.MarkupLine("[grey]Procesando transferencia...[/]");

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
            if (!string.IsNullOrEmpty(mensaje)) 
                AnsiConsole.MarkupLine($"[green]{Markup.Escape(mensaje)}[/]");
            else
                AnsiConsole.MarkupLine("[green]¡Transferencia realizada con éxito![/]");
        }
        catch
        {
            AnsiConsole.WriteLine(result);
        }
    }
}