using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using BancoCenit.Domain.Transferencias;

namespace BancoCenit.Infrastructure;

/// <summary>
/// Adaptador de infraestructura que implementa la interfaz <see cref="ITransferenciaGateway"/>.
/// Establece la conexión HTTP con el Integrador ATM central para transferencias interbancarias.
/// </summary>
public sealed class TransferenciaGateway : ITransferenciaGateway
{
    /// <summary>
    /// Cliente HTTP reutilizable (thread-safe) para evitar el agotamiento de sockets (socket exhaustion).
    /// </summary>
    private static readonly HttpClient _client = new HttpClient();

    /// <summary>
    /// Envía los detalles de la transferencia en formato JSON al Integrador ATM central (puerto 7000) de manera asíncrona.
    /// </summary>
    /// <param name="cuentaOrigen">Cuenta de origen del emisor local.</param>
    /// <param name="cuentaDestino">Cuenta destinataria externa.</param>
    /// <param name="monto">Monto de dinero de la transferencia.</param>
    /// <param name="cancellationToken">Token de cancelación.</param>
    /// <exception cref="Exception">Lanza una excepción si la pasarela responde con error HTTP o retorna una respuesta con estado "ERROR".</exception>
    /// <returns>Tarea que representa la finalización del envío.</returns>
    public async Task EnviarAsync(string cuentaOrigen, string cuentaDestino, decimal monto, CancellationToken cancellationToken = default)
    {
        // Define la estructura del payload JSON compatible con el Integrador ATM.
        var payload = new
        {
            cuentaOrigen = cuentaOrigen,
            bancoOrigen = "Banco Ruby",
            cuentaDestino = cuentaDestino,
            bancoDestino = "Banco Maluma",
            monto = monto,
            concepto = "Transferencia Interbancaria"
        };

        // Realiza una petición POST enviando los datos estructurados en formato JSON al endpoint central del clearing bancario.
        HttpResponseMessage response = await _client.PostAsJsonAsync("http://localhost:7000/api/integrador/interbank-transfer", payload, cancellationToken);
        
        // Verifica si el servidor del integrador devolvió un código de error de protocolo HTTP (ej. 500, 404).
        if (!response.IsSuccessStatusCode)
        {
            string errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new Exception($"El Integrador ATM devolvió error (HTTP {(int)response.StatusCode}): {errorContent}");
        }

        // Lee el cuerpo de la respuesta para analizar posibles códigos de error lógico del negocio estructurados en la respuesta exitosa (HTTP 200).
        string rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);
        using var jsonDoc = System.Text.Json.JsonDocument.Parse(rawResponse);
        
        // Si el JSON contiene un estado lógico de "ERROR" en su propiedad 'status', lanza una excepción de negocio.
        if (jsonDoc.RootElement.TryGetProperty("status", out var statusProp) && statusProp.GetString() == "ERROR")
        {
            string msg = jsonDoc.RootElement.TryGetProperty("message", out var msgProp) ? msgProp.GetString() ?? "Error en Integrador ATM" : "Error en Integrador ATM";
            throw new Exception(msg);
        }
    }
}
