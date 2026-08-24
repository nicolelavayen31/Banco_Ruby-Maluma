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
    // Adaptador de infraestructura que implementa la interfaz ITransferenciaGateway.
    // Se encarga de la integraciÃ³n externa con el Integrador ATM (BanNet/Cenit).
    // Este proceso requiere un flujo de seguridad en tres pasos:
    // 1. ObtenciÃ³n de token CSRF para prevenir falsificaciÃ³n de peticiones en sitios cruzados.
    // 2. ExtracciÃ³n de la cookie de sesiÃ³n CSRF provista por el servidor.
    // 3. PropagaciÃ³n de cabeceras de API Key del Convenio, Token CSRF y cookies de seguridad en la peticiÃ³n POST de transferencia.
    public sealed class TransferenciaGateway : ITransferenciaGateway
    {
        private readonly HttpClient _client;
        private readonly IConfiguration _configuration;

        // Inicializa una nueva instancia de la clase TransferenciaGateway.
        // client: Instancia HttpClient inyectada con Polly preconfigurado en CuentasModule.
        // configuration: ConfiguraciÃ³n de la aplicaciÃ³n para extraer URLs y credenciales.
        public TransferenciaGateway(HttpClient client, IConfiguration configuration)
        {
            _client = client;
            _configuration = configuration;
        }

        // EnvÃ­a los detalles de la transferencia en formato JSON al Integrador ATM central de manera asÃ­ncrona.
        // cuentaOrigenUuid: UUID identificador de la cuenta origen en el integrador.
        // cuentaDestinoUuid: UUID identificador de la cuenta destino en el integrador.
        // monto: Monto de la transferencia en formato decimal (ej: 10.50).
        // cancellationToken: Token de cancelación de la tarea asíncrona.
        public async Task EnviarAsync(string cuentaOrigenUuid, string cuentaDestinoUuid, string cuentaOrigenNumero, string cuentaDestinoNumero, decimal monto, CancellationToken cancellationToken = default)
        {
            // Carga de configuraciÃ³n del Integrador ATM desde appsettings.json
            var settings = _configuration.GetSection("IntegradorAtm");
            string baseUrl = settings["BaseUrl"] ?? "http://localhost:7000";
            string apiKey = settings["ApiKey"] ?? "REMPLAZAR_CON_TU_API_KEY_ENTREGADA";
            string sourceBank = settings["SourceBank"] ?? "bank_ruby";

            // ---------------------------------------------------------------------------------
            // PASO 1: Obtener el token CSRF obligatorio (GET /csrf-token)
            // ---------------------------------------------------------------------------------
            // Limpia cabeceras residuales de llamadas anteriores para evitar colisiones de cookies.
            _client.DefaultRequestHeaders.Clear();
            _client.DefaultRequestHeaders.Add("x-api-version", "1");
            
            var csrfHttpResponse = await _client.GetAsync($"{baseUrl}/csrf-token", cancellationToken);
            csrfHttpResponse.EnsureSuccessStatusCode();

            var csrfResponse = await csrfHttpResponse.Content.ReadFromJsonAsync<CsrfResponse>(cancellationToken: cancellationToken);
            string csrfToken = csrfResponse?.Token ?? throw new Exception("No se pudo obtener el token CSRF del Integrador.");

            // Extrae la cabecera Set-Cookie para volver a mandarla al servidor en el siguiente POST.
            // Si no se devuelve la cookie junto con el header x-csrf-token, el servidor rechazarÃ¡ la peticiÃ³n.
            string? csrfCookie = null;
            if (csrfHttpResponse.Headers.TryGetValues("Set-Cookie", out var cookieHeaders))
            {
                csrfCookie = string.Join("; ", cookieHeaders);
            }

            // ---------------------------------------------------------------------------------
            // PASO 2: Configurar cabeceras de autorizaciÃ³n y CSRF para el POST de Transferencia
            // ---------------------------------------------------------------------------------
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/transactions/transfer");
            requestMessage.Headers.Add("x-api-version", "1");
            requestMessage.Headers.Add("x-api-key", apiKey);          // Clave secreta del convenio con el Integrador
            requestMessage.Headers.Add("x-csrf-token", csrfToken);   // Token CSRF recibido en el paso 1
            if (!string.IsNullOrEmpty(csrfCookie))
            {
                requestMessage.Headers.Add("Cookie", csrfCookie);    // Cookies de sesiÃ³n asociadas al CSRF
            }

            // ---------------------------------------------------------------------------------
            // PASO 3: ConversiÃ³n de moneda a Centavos y serializaciÃ³n del Payload
            // ---------------------------------------------------------------------------------
            // El integrador financiero exige que el monto sea un entero que represente los centavos.
            // Ejemplo: un monto decimal de $12.50 se transmite como el entero 1250.
            int montoEnCentavos = (int)(monto * 100);

            Console.WriteLine($"[TransferenciaGateway] Enviando a Integrador: from_account_id='{cuentaOrigenUuid}', to_account_id='{cuentaDestinoUuid}', amount={montoEnCentavos}");

            // Construye el payload dinÃ¡mico alineado al contrato de 'TransferCommand' del integrador
            var payload = new
            {
                from_account_id = cuentaOrigenUuid,
                to_account_id = cuentaDestinoUuid,
                amount = montoEnCentavos,
                description = "Transferencia Interbancaria",
                source_bank = sourceBank,
                correlation_id = Guid.NewGuid().ToString()
            };

            string jsonPayload = System.Text.Json.JsonSerializer.Serialize(payload);
            Console.WriteLine($"[DEBUG] Payload JSON exacto que se envía al Integrador: {jsonPayload}");

            requestMessage.Content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");

            // ---------------------------------------------------------------------------------
            // PASO 4: EnvÃ­o y anÃ¡lisis del resultado
            // ---------------------------------------------------------------------------------
            var response = await _client.SendAsync(requestMessage, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                string error = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new Exception($"Error en transferencia del integrador (HTTP {(int)response.StatusCode}): {error}");
            }
        }
    }

    // DTO para deserializar el token CSRF devuelto por el integrador externo.
    public sealed class CsrfResponse
    {
        public string Token { get; set; } = default!;
    }
}
