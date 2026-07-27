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
        private readonly IServiceProvider _serviceProvider;

        public TransferenciaGateway(HttpClient client, IConfiguration configuration, IServiceProvider serviceProvider)
        {
            _client = client;
            _configuration = configuration;
            _serviceProvider = serviceProvider;
        }

        /// <summary>
        /// Envía los detalles de la transferencia en formato JSON al Integrador ATM central de manera asíncrona.
        /// </summary>
        public async Task EnviarAsync(string cuentaOrigen, string cuentaDestino, decimal monto, CancellationToken cancellationToken = default)
        {
            var settings = _configuration.GetSection("IntegradorAtm");
            string baseUrl = settings["BaseUrl"] ?? "http://localhost:7000";
            string apiKey = settings["ApiKey"] ?? "REMPLAZAR_CON_TU_API_KEY_ENTREGADA";
            string sourceBank = settings["SourceBank"] ?? "bank_ruby";

            // Resolver los UUIDs de cuenta asignados por el integrador
            string cuentaOrigenUuid = cuentaOrigen;
            string cuentaDestinoUuid = cuentaDestino;

            using (var scope = _serviceProvider.CreateScope())
            {
                var repository = scope.ServiceProvider.GetRequiredService<ICuentaRepository>();
                
                var origenResult = await repository.GetByNumeroCuentaAsync(cuentaOrigen, cancellationToken);
                if (origenResult.IsSuccess && !string.IsNullOrEmpty(origenResult.Value.IntegradorAccountId))
                {
                    cuentaOrigenUuid = origenResult.Value.IntegradorAccountId;
                }

                var destinoResult = await repository.GetByNumeroCuentaAsync(cuentaDestino, cancellationToken);
                if (destinoResult.IsSuccess && !string.IsNullOrEmpty(destinoResult.Value.IntegradorAccountId))
                {
                    cuentaDestinoUuid = destinoResult.Value.IntegradorAccountId;
                }
            }

            // Paso 1: Obtener el token CSRF obligatorio (GET /api/v1/csrf-token)
            _client.DefaultRequestHeaders.Clear();
            _client.DefaultRequestHeaders.Add("x-api-version", "1");
            
            var csrfResponse = await _client.GetFromJsonAsync<CsrfResponse>($"{baseUrl}/api/v1/csrf-token", cancellationToken);
            string csrfToken = csrfResponse?.Token ?? throw new Exception("No se pudo obtener el token CSRF del Integrador.");

            // Paso 2: Configurar cabeceras de autorización y CSRF para el POST
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/api/v1/transactions/transfer");
            requestMessage.Headers.Add("x-api-version", "1");
            requestMessage.Headers.Add("api-key", apiKey);          // API Key del Convenio
            requestMessage.Headers.Add("x-csrf-token", csrfToken);   // Token de validación CSRF

            // Convertir monto a centavos (exigido por el integrador)
            int montoEnCentavos = (int)(monto * 100);

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
