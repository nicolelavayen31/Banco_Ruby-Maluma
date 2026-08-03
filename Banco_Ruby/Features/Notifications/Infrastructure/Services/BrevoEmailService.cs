using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using BancoCenit.Features.Notifications.Domain;
using BancoCenit.Features.Notifications.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace BancoCenit.Features.Notifications.Infrastructure.Services
{
    // ImplementaciÃ³n concreta de IEmailService utilizando la API REST de Brevo.
    // Realiza peticiones HTTP no bloqueantes al servidor de correo transaccional de Brevo.
    public sealed class BrevoEmailService : IEmailService
    {
        private readonly HttpClient _httpClient;
        private readonly BrevoOptions _options;

        // Inicializa una nueva instancia de BrevoEmailService inyectando su HttpClient y las opciones de Brevo.
        public BrevoEmailService(HttpClient httpClient, IOptions<BrevoOptions> options)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _options = options?.Value ?? throw new ArgumentNullException(nameof(options));

            // ConfiguraciÃ³n base del cliente HTTP para consumir la API de Brevo
            _httpClient.BaseAddress = new Uri("https://api.brevo.com/");
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            // Establece la API Key de autorizaciÃ³n provista por Brevo
            _httpClient.DefaultRequestHeaders.Add("api-key", _options.ApiKey);
        }

        // EnvÃ­a el correo electrÃ³nico de forma transaccional mediante llamada POST a la API SMTP.
        public async Task<bool> SendEmailAsync(
            string toEmail, 
            string toName, 
            string subject, 
            string htmlContent, 
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Define la estructura del DTO esperado por el payload de Brevo
                var payload = new
                {
                    sender = new
                    {
                        name = _options.SenderName,
                        email = _options.SenderEmail
                    },
                    to = new[]
                    {
                        new
                        {
                            email = toEmail,
                            name = toName
                        }
                    },
                    subject = subject,
                    htmlContent = htmlContent
                };

                // Realiza la peticiÃ³n POST de forma asÃ­ncrona enviando el JSON
                HttpResponseMessage response = await _httpClient.PostAsJsonAsync(
                    "v3/smtp/email", 
                    payload, 
                    cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    string errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    Console.WriteLine($"[BrevoEmailService] Error al enviar correo (HTTP {(int)response.StatusCode}): {errorContent}");
                }

                return response.IsSuccessStatusCode;
            }
            catch
            {
                // Si ocurre algÃºn fallo de red o tiempo de espera agotado, retorna false
                return false;
            }
        }
    }
}
