using System.Net.Http.Json;
using System.Text.Json;

namespace Usuario_Cliente.Services;

/// <summary>
/// Cliente de red HTTP que encapsula las llamadas REST hacia los endpoints de los bancos (Ruby o Maluma).
/// Proporciona métodos tipados asíncronos para simplificar la interacción en el cajero automático.
/// </summary>
public class CajeroApiClient
{
    private readonly HttpClient _http;

    /// <summary>
    /// Inicializa una nueva instancia de la clase <see cref="CajeroApiClient"/> apuntando a la dirección base del banco seleccionado.
    /// </summary>
    /// <param name="baseUrl">Dirección IP y puerto base (ej. http://localhost:5000 o http://localhost:5002).</param>
    public CajeroApiClient(string baseUrl)
    {
        _http = new HttpClient { BaseAddress = new Uri(baseUrl) };
    }

    /// <summary>
    /// Solicita autenticación mediante PIN para un número de tarjeta/cuenta específico.
    /// </summary>
    /// <param name="numero">Número de tarjeta o cuenta.</param>
    /// <param name="pin">Clave PIN de 4 dígitos.</param>
    /// <returns>Cuerpo JSON de la respuesta exitosa o un mensaje de error estructurado.</returns>
    public async Task<string> AutenticarAsync(string numero, string pin)
    {
        try
        {
            HttpResponseMessage res = await _http.PostAsJsonAsync($"/api/cuentas/{numero}/autenticar", new { Pin = pin });
            string content = await res.Content.ReadAsStringAsync();
            return res.IsSuccessStatusCode ? content : $"ERROR: {content}";
        }
        catch (Exception ex)
        {
            return "ERROR: " + ex.Message;
        }
    }

    /// <summary>
    /// Consulta el saldo y estado actual de una cuenta en el servidor.
    /// </summary>
    /// <param name="numero">Número de cuenta a consultar.</param>
    /// <returns>Detalles del saldo y cupo en JSON, o mensaje de error.</returns>
    public async Task<string> ConsultarSaldoAsync(string numero)
    {
        try
        {
            HttpResponseMessage res = await _http.GetAsync($"/api/cuentas/{numero}/saldo");
            string content = await res.Content.ReadAsStringAsync();
            return res.IsSuccessStatusCode ? content : $"ERROR: {content}";
        }
        catch (Exception ex)
        {
            return "ERROR: " + ex.Message;
        }
    }

    /// <summary>
    /// Envía una solicitud de depósito manual (crédito local) de fondos.
    /// </summary>
    /// <param name="numero">Número de cuenta destino del abono.</param>
    /// <param name="monto">Monto a abonar.</param>
    /// <returns>Detalle del nuevo saldo, o mensaje de error.</returns>
    public async Task<string> DepositarAsync(string numero, decimal monto)
    {
        try
        {
            HttpResponseMessage res = await _http.PostAsJsonAsync($"/api/cuentas/{numero}/depositar", new { Monto = monto });
            string content = await res.Content.ReadAsStringAsync();
            return res.IsSuccessStatusCode ? content : $"ERROR: {content}";
        }
        catch (Exception ex)
        {
            return "ERROR: " + ex.Message;
        }
    }

    /// <summary>
    /// Envía una solicitud de retiro de efectivo (débito local) en el cajero automático.
    /// </summary>
    /// <param name="numero">Número de cuenta a debitar.</param>
    /// <param name="monto">Monto de efectivo solicitado.</param>
    /// <returns>Resultado con mensaje de éxito o comisión cobrada, o mensaje de error.</returns>
    public async Task<string> RetirarAsync(string numero, decimal monto)
    {
        try
        {
            HttpResponseMessage res = await _http.PostAsJsonAsync($"/api/cuentas/{numero}/retirar", new { Monto = monto });
            string content = await res.Content.ReadAsStringAsync();
            return res.IsSuccessStatusCode ? content : $"ERROR: {content}";
        }
        catch (Exception ex)
        {
            return "ERROR: " + ex.Message;
        }
    }

    /// <summary>
    /// Envía una transferencia local o externa (clearing interbancario central).
    /// </summary>
    /// <param name="numeroOrigen">Cuenta de origen emisora.</param>
    /// <param name="cuentaDestino">Cuenta de destino receptora.</param>
    /// <param name="bancoDestino">Nombre del banco receptor.</param>
    /// <param name="monto">Monto total a transferir.</param>
    /// <param name="concepto">Motivo o glosa del envío.</param>
    /// <returns>Resultado exitoso de la transferencia, o mensaje de error.</returns>
    public async Task<string> TransferirAsync(string numeroOrigen, string cuentaDestino, string bancoDestino, decimal monto, string concepto)
    {
        try
        {
            HttpResponseMessage res = await _http.PostAsJsonAsync($"/api/cuentas/{numeroOrigen}/transferir", new { CuentaDestino = cuentaDestino, Banco = bancoDestino, Monto = monto, Concepto = concepto });
            string content = await res.Content.ReadAsStringAsync();
            return res.IsSuccessStatusCode ? content : $"ERROR: {content}";
        }
        catch (Exception ex)
        {
            return "ERROR: " + ex.Message;
        }
    }

    /// <summary>
    /// Recupera los registros de auditoría y movimientos históricos asociados al número de cuenta.
    /// </summary>
    /// <param name="numero">Número de cuenta a consultar.</param>
    /// <returns>Colección JSON con el listado de movimientos, o mensaje de error.</returns>
    public async Task<string> ObtenerHistorialAsync(string numero)
    {
        try
        {
            HttpResponseMessage res = await _http.GetAsync($"/api/cuentas/{numero}/historial");
            string content = await res.Content.ReadAsStringAsync();
            return res.IsSuccessStatusCode ? content : $"ERROR: {content}";
        }
        catch (Exception ex)
        {
            return "ERROR: " + ex.Message;
        }
    }
}
