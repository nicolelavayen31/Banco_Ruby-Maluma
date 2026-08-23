using System.Globalization;
using System.Text.Json;
using System.Net.Sockets;
using Spectre.Console;
using Usuario_Cliente.Presentation;

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
            ConsoleRenderer.Clear();
            ConsoleRenderer.DrawBanner(_bankName);

            string[] mainOptions = { "Insertar tarjeta", "Salir de este banco" };
            int mainSelection = ConsoleMenu.PromptMenuOption("Seleccione una opción:", mainOptions);

            if (mainSelection == 1)
            {
                ConsoleRenderer.Clear();
                
                var grid = new Grid().AddColumn();
                grid.AddRow(new Markup($"{ConsoleTheme.PrimaryBold}Cerrando sesión en Banco {_bankName}...{ConsoleTheme.End}"));
                grid.AddRow(new Markup($"{ConsoleTheme.Muted}Su tarjeta ha sido retirada con éxito. Regresando a la Red Bancaria...{ConsoleTheme.End}"));
                
                var panel = new Panel(grid)
                {
                    Border = BoxBorder.Rounded,
                    Padding = new Padding(3, 1, 3, 1)
                };
                panel.BorderColor(ConsoleTheme.PrimaryColor);
                
                AnsiConsole.Write(panel);
                ConsoleRenderer.WaitForKey();
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
        var credentials = ConsoleLogin.ShowLoginForm(_bankName);
        _cuenta = credentials.Cuenta;
        _pin = credentials.Pin;

        string authResult = await ConsoleAnimations.ShowSpinnerAsync(
            "Verificando credenciales con el servidor central...",
            () => _apiClient.AutenticarAsync(_cuenta, _pin)
        );
        
        // Comprueba si el servidor devolvió algún error lógico de PIN o cuenta.
        if (authResult.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase) || authResult.Contains("error", StringComparison.OrdinalIgnoreCase))
        {
            ConsoleMessages.ShowError("Autenticación fallida", authResult);
            ConsoleRenderer.WaitForKey();
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

        await ConsoleAnimations.SimulateShortLoadAsync("Sesión autorizada. Accediendo...");
        return true;
    }

    /// <summary>
    /// Bucle secundario de sesión activa que presenta las opciones de cajero (Saldo, Retiro, Depósito, Historial, Transferir).
    /// </summary>
    private async Task RunSessionAsync()
    {
        while (true)
        {
            ConsoleRenderer.Clear();
            await DrawSessionHeaderAsync();

            string[] options = { 
                "Consultar saldo", 
                "Retirar efectivo", 
                "Depositar efectivo", 
                "Consultar movimientos", 
                "Transferir dinero", 
                "Retirar tarjeta" 
            };
            int selected = ConsoleMenu.PromptMenuOption("Seleccione una transacción a realizar:", options);

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

            ConsoleRenderer.WaitForKey();
        }
    }

    /// <summary>
    /// Dibuja la cabecera informativa de la sesión activa en el cajero automático.
    /// Realiza pings no bloqueantes a los puertos de red de forma asíncrona.
    /// </summary>
    private async Task DrawSessionHeaderAsync()
    {
        var status = await CheckNetworkStatusAsync();
        ConsoleMenu.DrawSessionDashboard(
            _bankName,
            _titular,
            _cuenta,
            _sessionId,
            status.ServerOnline,
            status.IntegratorOnline
        );
    }

    /// <summary>
    /// Realiza un ping TCP ligero y rápido para validar la conectividad de los servidores.
    /// </summary>
    private async Task<(bool ServerOnline, bool IntegratorOnline)> CheckNetworkStatusAsync()
    {
        bool serverOnline = false;
        bool integratorOnline = false;
        
        int bankPort = _bankPrefix == "RUBY" ? 5000 : (_bankPrefix == "FUEGO" ? 5004 : 5002);

        try
        {
            using var tcpClient = new TcpClient();
            var connectTask = tcpClient.ConnectAsync("localhost", bankPort);
            if (await Task.WhenAny(connectTask, Task.Delay(150)) == connectTask)
            {
                await connectTask;
                serverOnline = tcpClient.Connected;
            }
        }
        catch { }

        try
        {
            using var tcpClient = new TcpClient();
            var connectTask = tcpClient.ConnectAsync("localhost", 7000);
            if (await Task.WhenAny(connectTask, Task.Delay(150)) == connectTask)
            {
                await connectTask;
                integratorOnline = tcpClient.Connected;
            }
        }
        catch { }

        return (serverOnline, integratorOnline);
    }

    /// <summary>
    /// Llama al API para consultar saldo e imprime los detalles del cliente en una tabla limpia.
    /// </summary>
    private async Task ConsultarSaldoAsync()
    {
        ConsoleRenderer.Clear();
        ConsoleRenderer.DrawScreenTitle("Consulta de Saldo");

        string result = await ConsoleAnimations.ShowSpinnerAsync(
            "Consultando saldos y cuentas activas...",
            () => _apiClient.ConsultarSaldoAsync(_cuenta)
        );

        if (result.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            ConsoleMessages.ShowError("No se pudo obtener el saldo de la cuenta", result);
            return;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(result);
            JsonElement root = document.RootElement;

            if (root.TryGetProperty("error", out JsonElement error))
            {
                ConsoleMessages.ShowError("Error devuelto por la entidad bancaria", error.GetString());
                return;
            }

            decimal saldo = root.GetProperty("saldo").GetDecimal();
            string titular = root.GetProperty("titular").GetString() ?? string.Empty;

            ConsolePanels.ShowAccountCard(_bankName, titular, _cuenta, saldo);
        }
        catch (Exception ex)
        {
            ConsoleMessages.ShowError("Excepción al procesar datos del saldo", ex.Message);
        }
    }

    /// <summary>
    /// Captura un monto por consola y solicita depósito de efectivo en el servidor de base de datos.
    /// </summary>
    private async Task DepositarAsync()
    {
        ConsoleRenderer.Clear();
        ConsoleRenderer.DrawScreenTitle("Depósito de Efectivo");

        decimal monto = AnsiConsole.Prompt(
            new TextPrompt<decimal>($"  {ConsoleTheme.IconBalance} [bold white]Monto a depositar (máx {LIMITE_DEPOSITO:N0}):[/] ")
                .PromptStyle(Style.Parse(ConsoleTheme.PrimaryHex))
                .ValidationErrorMessage($"{ConsoleTheme.Error} {ConsoleTheme.IconError} Ingrese un monto numérico válido mayor a 0{ConsoleTheme.End}")
                .Validate(input => input > 0)
        );

        if (monto > LIMITE_DEPOSITO)
        {
            ConsoleMessages.ShowError($"Límite de depósito excedido. El monto máximo permitido es ${LIMITE_DEPOSITO:N0}.");
            return;
        }

        var confirm = AnsiConsole.Prompt(
            new ConfirmationPrompt($"  {ConsoleTheme.Warning} ¿Desea confirmar el depósito de [bold yellow]${monto:N2}[/]?{ConsoleTheme.End}")
        );

        if (!confirm)
        {
            ConsoleMessages.ShowWarning("Operación de depósito cancelada por el usuario.");
            return;
        }

        string result = await ConsoleAnimations.ShowSpinnerAsync(
            "Registrando depósito y acreditando fondos...",
            () => _apiClient.DepositarAsync(_cuenta, monto)
        );

        if (result.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            ConsoleMessages.ShowError("No se pudo realizar el depósito", result);
            return;
        }

        try
        {
            using JsonDocument doc = JsonDocument.Parse(result);
            JsonElement root = doc.RootElement;
            if (root.TryGetProperty("error", out JsonElement err))
            {
                ConsoleMessages.ShowError("Error del sistema de depósitos", err.GetString());
                return;
            }

            if (root.TryGetProperty("title", out JsonElement title))
            {
                string titleText = title.GetString() ?? string.Empty;
                string detailText = root.TryGetProperty("detail", out JsonElement detail) ? detail.GetString() ?? string.Empty : string.Empty;
                ConsoleMessages.ShowError(titleText, detailText);
                return;
            }

            string? mensaje = root.TryGetProperty("mensaje", out JsonElement m) ? m.GetString() : (root.TryGetProperty("Mensaje", out JsonElement m2) ? m2.GetString() : null);
            decimal saldo = 0m;
            if (root.TryGetProperty("saldo", out JsonElement s))
                saldo = s.GetDecimal();
            else if (root.TryGetProperty("Saldo", out JsonElement s2))
                saldo = s2.GetDecimal();

            ConsoleRenderer.Clear();
            ConsoleRenderer.DrawScreenTitle("Comprobante de Depósito");
            ConsolePanels.ShowDepositReceipt(_cuenta, monto, saldo);
            ConsoleMessages.ShowSuccess(mensaje ?? "El depósito se ha realizado exitosamente.");
        }
        catch (Exception ex)
        {
            ConsoleMessages.ShowError("Error de serialización de respuesta", ex.Message);
        }
    }

    /// <summary>
    /// Captura un monto por consola y procesa un retiro de efectivo debitando fondos del banco.
    /// </summary>
    private async Task RetirarAsync()
    {
        ConsoleRenderer.Clear();
        ConsoleRenderer.DrawScreenTitle("Retiro de Efectivo");

        decimal monto = AnsiConsole.Prompt(
            new TextPrompt<decimal>($"  {ConsoleTheme.IconBalance} [bold white]Monto a retirar (máx {LIMITE_RETIRO:N0}):[/] ")
                .PromptStyle(Style.Parse(ConsoleTheme.PrimaryHex))
                .ValidationErrorMessage($"{ConsoleTheme.Error} {ConsoleTheme.IconError} Ingrese un monto numérico válido mayor a 0{ConsoleTheme.End}")
                .Validate(input => input > 0)
        );

        if (monto > LIMITE_RETIRO)
        {
            ConsoleMessages.ShowError($"Límite de retiro excedido. El monto máximo permitido es ${LIMITE_RETIRO:N0}.");
            return;
        }

        const decimal comision = 0.41m;
        ConsoleMessages.ShowWarning($"Se cobrará una comisión fija transaccional de [bold red]${comision:N2}[/].");

        var confirm = AnsiConsole.Prompt(
            new ConfirmationPrompt($"  {ConsoleTheme.Warning} ¿Desea confirmar el retiro de [bold yellow]${monto:N2}[/]?{ConsoleTheme.End}")
        );

        if (!confirm)
        {
            ConsoleMessages.ShowWarning("Operación de retiro cancelada por el usuario.");
            return;
        }

        string result = await ConsoleAnimations.ShowSpinnerAsync(
            "Validando cupo transaccional y debitando saldo...",
            () => _apiClient.RetirarAsync(_cuenta, monto)
        );

        if (result.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            ConsoleMessages.ShowError("No se pudo procesar el retiro", result);
            return;
        }

        try
        {
            using JsonDocument doc = JsonDocument.Parse(result);
            JsonElement root = doc.RootElement;
            if (root.TryGetProperty("error", out JsonElement err))
            {
                ConsoleMessages.ShowError("Error del sistema de retiros", err.GetString());
                return;
            }

            if (root.TryGetProperty("title", out JsonElement title))
            {
                string titleText = title.GetString() ?? string.Empty;
                string detailText = root.TryGetProperty("detail", out JsonElement detail) ? detail.GetString() ?? string.Empty : string.Empty;
                ConsoleMessages.ShowError(titleText, detailText);
                return;
            }

            string? mensaje = root.TryGetProperty("mensaje", out JsonElement m) ? m.GetString() : (root.TryGetProperty("Mensaje", out JsonElement m2) ? m2.GetString() : null);
            decimal saldo = 0m;
            if (root.TryGetProperty("saldo", out JsonElement s))
                saldo = s.GetDecimal();
            else if (root.TryGetProperty("Saldo", out JsonElement s2))
                saldo = s2.GetDecimal();

            ConsoleRenderer.Clear();
            ConsoleRenderer.DrawScreenTitle("Comprobante de Retiro");
            ConsolePanels.ShowWithdrawalReceipt(_cuenta, monto, comision, saldo);
            ConsoleMessages.ShowSuccess(mensaje ?? "El efectivo se ha debitado correctamente.");
        }
        catch (Exception ex)
        {
            ConsoleMessages.ShowError("Error de procesamiento de respuesta", ex.Message);
        }
    }

    /// <summary>
    /// Consulta el listado histórico de movimientos de la cuenta de forma tabulada.
    /// Asigna colores de forma semántica dependiendo del tipo de operación (Débitos en rojo, Créditos en verde).
    /// </summary>
    private async Task MostrarHistorialAsync()
    {
        ConsoleRenderer.Clear();
        ConsoleRenderer.DrawScreenTitle("Consulta de Movimientos");

        string result = await ConsoleAnimations.ShowSpinnerAsync(
            "Obteniendo historial transaccional...",
            () => _apiClient.ObtenerHistorialAsync(_cuenta)
        );

        if (result.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            ConsoleMessages.ShowError("No se pudo obtener el historial", result);
            return;
        }

        try
        {
            using JsonDocument doc = JsonDocument.Parse(result);
            JsonElement root = doc.RootElement;
            if (root.TryGetProperty("error", out JsonElement err))
            {
                ConsoleMessages.ShowError("Error al listar movimientos", err.GetString());
                return;
            }

            string titular = root.GetProperty("titular").GetString() ?? string.Empty;
            List<JsonElement> historial = root.GetProperty("historial").EnumerateArray().ToList();

            if (historial.Count == 0)
            {
                ConsoleMessages.ShowWarning("No se encontraron movimientos registrados en esta cuenta.");
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

            ConsoleRenderer.Clear();
            ConsoleRenderer.DrawScreenTitle("Consulta de Movimientos");
            ConsoleTables.DrawMovementsTable(txs, saldoInicial, totalDebitos, totalCreditos, saldoFinal);
        }
        catch (Exception ex)
        {
            ConsoleMessages.ShowError("Excepción al estructurar tabla de movimientos", ex.Message);
        }
    }

    /// <summary>
    /// Captura los datos de destino (cuenta, banco, concepto, monto) y efectúa una transferencia.
    /// </summary>
    private async Task TransferirAsync()
    {
        ConsoleRenderer.Clear();
        ConsoleRenderer.DrawScreenTitle("Nueva Transferencia");

        var sourceGrid = new Grid().AddColumn();
        sourceGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Tarjeta de Origen:{ConsoleTheme.End} {ConsoleTheme.AccentBold}{ConsoleRenderer.MaskCard(_cuenta)}{ConsoleTheme.End}"));
        sourceGrid.AddRow(new Markup($"{ConsoleTheme.Muted}Ordenante:{ConsoleTheme.End} {ConsoleTheme.AccentBold}{_titular}{ConsoleTheme.End}"));
        
        var sourcePanel = new Panel(sourceGrid)
        {
            Border = BoxBorder.Rounded
        };
        sourcePanel.BorderColor(ConsoleTheme.PrimaryColor);
        AnsiConsole.Write(sourcePanel);
        AnsiConsole.WriteLine();

        string destino = AnsiConsole.Prompt(
            new TextPrompt<string>($"  {ConsoleTheme.IconCard} [bold white]Número de Cuenta/Tarjeta de Destino:[/] ")
                .PromptStyle(Style.Parse(ConsoleTheme.PrimaryHex))
                .ValidationErrorMessage($"{ConsoleTheme.Error} {ConsoleTheme.IconError} Ingrese un número de destino válido{ConsoleTheme.End}")
                .Validate(input => !string.IsNullOrWhiteSpace(input))
        );

        string banco = AnsiConsole.Prompt(
            new TextPrompt<string>($"  {ConsoleTheme.IconBank} [bold white]Banco de Destino (Enter si es del mismo banco):[/] ")
                .PromptStyle(Style.Parse(ConsoleTheme.PrimaryHex))
                .AllowEmpty()
        );

        decimal monto = AnsiConsole.Prompt(
            new TextPrompt<decimal>($"  {ConsoleTheme.IconBalance} [bold white]Monto a Transferir ($):[/] ")
                .PromptStyle(Style.Parse(ConsoleTheme.PrimaryHex))
                .ValidationErrorMessage($"{ConsoleTheme.Error} {ConsoleTheme.IconError} Ingrese un monto válido mayor a 0{ConsoleTheme.End}")
                .Validate(input => input > 0)
        );

        string concepto = AnsiConsole.Prompt(
            new TextPrompt<string>($"  {ConsoleTheme.IconInfo} [bold white]Concepto / Motivo de Transferencia:[/] ")
                .PromptStyle(Style.Parse(ConsoleTheme.PrimaryHex))
                .AllowEmpty()
        );

        ConsoleRenderer.Clear();
        ConsoleRenderer.DrawScreenTitle("Nueva Transferencia - Confirmación");
        ConsolePanels.ShowTransferDetails(banco, _cuenta, destino, monto, concepto);

        var confirm = AnsiConsole.Prompt(
            new ConfirmationPrompt($"  {ConsoleTheme.Warning} ¿Desea proceder a enviar esta transferencia?{ConsoleTheme.End}")
        );

        if (!confirm)
        {
            ConsoleMessages.ShowWarning("Transferencia cancelada por el usuario.");
            return;
        }

        // Mostrar animación de barra de progreso que emula el Clearing Interbancario
        ConsoleRenderer.Clear();
        ConsoleRenderer.DrawScreenTitle("Procesando Clearing");
        await ConsoleAnimations.ShowProgressBarAsync("Enviando fondos a través del switch interbancario central...");

        string result = await ConsoleAnimations.ShowSpinnerAsync(
            "Esperando confirmación de fondos de la cámara de compensación...",
            () => _apiClient.TransferirAsync(_cuenta, destino, banco, monto, concepto)
        );

        if (result.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            ConsoleMessages.ShowError("La transferencia no se pudo completar", result);
            return;
        }

        try
        {
            using JsonDocument doc = JsonDocument.Parse(result);
            JsonElement root = doc.RootElement;
            if (root.TryGetProperty("error", out JsonElement err))
            {
                ConsoleMessages.ShowError("La transacción fue rechazada", err.GetString());
                return;
            }

            string? mensaje = root.TryGetProperty("mensaje", out JsonElement m) ? m.GetString() : null;
            ConsoleMessages.ShowSuccess(mensaje ?? "¡Transferencia realizada con éxito a través del switch!");
        }
        catch
        {
            ConsoleMessages.ShowSuccess("¡Transferencia realizada con éxito!");
        }
    }
}