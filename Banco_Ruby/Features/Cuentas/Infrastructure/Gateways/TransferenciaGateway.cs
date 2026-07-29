using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using BancoCenit.Features.Cuentas.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BancoCenit.Features.Cuentas.Infrastructure.Gateways
{
    /// <summary>
    /// Adaptador de infraestructura que implementa la interfaz <see cref="ITransferenciaGateway"/>.
    /// Conecta con el Integrador ATM central (Bannet) utilizando CSRF, cabeceras de API Key y formato en centavos.
    /// </summary>
    public sealed class TransferenciaGateway : ITransferenciaGateway
    {
        private readonly HttpClient _client;
        private readonly IConfiguration _configuration;

        public TransferenciaGateway(HttpClient client, IConfiguration configuration)
        {
            _client = client;
            _configuration = configuration;
        }

        /// <summary>
        /// Envía los detalles de la transferencia en formato JSON al Integrador ATM central de manera asíncrona.
        /// </summary>
        public async Task EnviarAsync(string cuentaOrigenUuid, string cuentaDestinoUuid, decimal monto, CancellationToken cancellationToken = default)
        {
            var settings = _configuration.GetSection("IntegradorAtm");
            string baseUrl = settings["BaseUrl"] ?? "http://localhost:7000";
            string apiKey = settings["ApiKey"] ?? "REMPLAZAR_CON_TU_API_KEY_ENTREGADA";
            string sourceBank = settings["SourceBank"] ?? "bank_ruby";

            // Paso 1: Obtener el token CSRF obligatorio (GET /api/csrf-token)
            _client.DefaultRequestHeaders.Clear();
            _client.DefaultRequestHeaders.Add("x-api-version", "1");
            
            var csrfHttpResponse = await _client.GetAsync($"{baseUrl}/api/csrf-token", cancellationToken);
            csrfHttpResponse.EnsureSuccessStatusCode();

            var csrfResponse = await csrfHttpResponse.Content.ReadFromJsonAsync<CsrfResponse>(cancellationToken: cancellationToken);
            string csrfToken = csrfResponse?.Token ?? throw new Exception("No se pudo obtener el token CSRF del Integrador.");

            // Extraer las cookies enviadas en la respuesta de CSRF
            string? csrfCookie = null;
            if (csrfHttpResponse.Headers.TryGetValues("Set-Cookie", out var cookieHeaders))
            {
                csrfCookie = string.Join("; ", cookieHeaders);
            }

            // Paso 2: Configurar cabeceras de autorización y CSRF para el POST
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/api/transactions/transfer");
            requestMessage.Headers.Add("x-api-version", "1");
            requestMessage.Headers.Add("x-api-key", apiKey);          // API Key del Convenio
            requestMessage.Headers.Add("x-csrf-token", csrfToken);   // Token de validación CSRF
            if (!string.IsNullOrEmpty(csrfCookie))
            {
                requestMessage.Headers.Add("Cookie", csrfCookie);
            }

            // Convertir monto a centavos (exigido por el integrador)
            int montoEnCentavos = (int)(monto * 100);

            Console.WriteLine($"[TransferenciaGateway] Enviando a Integrador: from_account_id='{cuentaOrigenUuid}', to_account_id='{cuentaDestinoUuid}', amount={montoEnCentavos}");

            // Crear payload alineado a 'TransferCommand' del integrador
            var payload = new
            {
                from_account_id = cuentaOrigenUuid,   // UUID de cuenta emisor
                to_account_id = cuentaDestinoUuid,       // UUID de cuenta receptor
                amount = montoEnCentavos,             // Monto en centavos
                description = "Transferencia Interbancaria",
                source_bank = sourceBank,
                correlation_id = Guid.NewGuid().ToString() // ID de transacción
            };

            requestMessage.Content = JsonContent.Create(payload);

            // Paso 3: Enviar la transferencia
            var response = await _client.SendAsync(requestMessage, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                string error = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new Exception($"Error en transferencia del integrador (HTTP {(int)response.StatusCode}): {error}");
            }
        }
    }

    /// <summary>
    /// Estructura para deserializar la respuesta del CSRF.
    /// </summary>
    public sealed class CsrfResponse
    {
        public string Token { get; set; } = default!;
    }
}
