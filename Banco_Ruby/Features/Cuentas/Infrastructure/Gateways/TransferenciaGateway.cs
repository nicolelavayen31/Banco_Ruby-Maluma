using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using BancoCenit.Features.Cuentas.Domain;

namespace BancoCenit.Features.Cuentas.Infrastructure.Gateways
{
    /// <summary>
    /// Adaptador de infraestructura que implementa la interfaz <see cref="ITransferenciaGateway"/>.
    /// Establece la conexión HTTP con el Integrador ATM central para transferencias interbancarias.
    /// </summary>
    public sealed class TransferenciaGateway : ITransferenciaGateway
    {
        private static readonly HttpClient _client = new HttpClient();

        /// <summary>
        /// Envía los detalles de la transferencia en formato JSON al Integrador ATM central (puerto 7000) de manera asíncrona.
        /// </summary>
        public async Task EnviarAsync(string cuentaOrigen, string cuentaDestino, decimal monto, CancellationToken cancellationToken = default)
        {
            var payload = new
            {
                cuentaOrigen = cuentaOrigen,
                bancoOrigen = "Banco Ruby",
                cuentaDestino = cuentaDestino,
                bancoDestino = "Banco Maluma",
                monto = monto,
                concepto = "Transferencia Interbancaria"
            };

            // Realiza la petición POST al integrador
            HttpResponseMessage response = await _client.PostAsJsonAsync("http://localhost:7000/api/integrador/interbank-transfer", payload, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                string errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new Exception($"El Integrador ATM devolvió error (HTTP {(int)response.StatusCode}): {errorContent}");
            }

            string rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);
            using var jsonDoc = System.Text.Json.JsonDocument.Parse(rawResponse);
            
            if (jsonDoc.RootElement.TryGetProperty("status", out var statusProp) && statusProp.GetString() == "ERROR")
            {
                string msg = jsonDoc.RootElement.TryGetProperty("message", out var msgProp) ? msgProp.GetString() ?? "Error en Integrador ATM" : "Error en Integrador ATM";
                throw new Exception(msg);
            }
        }
    }
}
