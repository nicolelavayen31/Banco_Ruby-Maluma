using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Features.Notifications.Domain;
using BancoCenit.Features.Notifications.Infrastructure.Configuration;
using FluentResults;
using MediatR;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BancoCenit.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Manejador de MediatR para autenticar una cuenta en Banco Ruby.
    /// </summary>
    public class AutenticarCommandHandler : IRequestHandler<AutenticarCommand, Result<AutenticarResponse>>
    {
        private readonly ICuentaRepository _repository;
        private readonly IEmailService _emailService;
        private readonly BrevoOptions _brevoOptions;
        private readonly IConfiguration _configuration;

        public AutenticarCommandHandler(
            ICuentaRepository repository,
            IEmailService emailService,
            IOptions<BrevoOptions> brevoOptions,
            IConfiguration configuration)
        {
            _repository = repository;
            _emailService = emailService;
            _brevoOptions = brevoOptions?.Value ?? new BrevoOptions();
            _configuration = configuration;
        }

        public async Task<Result<AutenticarResponse>> Handle(AutenticarCommand command, CancellationToken cancellationToken)
        {
            var cuentaResult = await _repository.GetByNumeroCuentaAsync(command.NumeroCuenta, cancellationToken);
            if (cuentaResult.IsFailed)
            {
                return Result.Fail<AutenticarResponse>($"Cuenta {command.NumeroCuenta} no encontrada o inactiva en Banco Ruby.");
            }

            Cuenta cuenta = cuentaResult.Value;

            // Verificar PIN con BCrypt
            if (cuenta.Usuario == null || !BCrypt.Net.BCrypt.Verify(command.Pin, cuenta.Usuario.Pin))
            {
                return Result.Fail<AutenticarResponse>("PIN incorrecto o no configurado.");
            }

            string titularNombre = cuenta.Usuario?.Nombre ?? "Cliente";

            // Generar Token JWT
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["Secret"] ?? "super_secret_banco_ruby_key_that_is_at_least_32_characters_long_12345";
            var issuer = jwtSettings["Issuer"] ?? "BancoRuby";
            var audience = jwtSettings["Audience"] ?? "BancoRubyClients";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, cuenta.Usuario?.Nombre ?? "Cliente"),
                new Claim("NumeroCuenta", cuenta.NumeroCuenta)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: creds
            );

            string tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // Enviar alerta de inicio de sesión por correo
            string subject = "Alerta de Seguridad - Banco Ruby";
            string htmlContent = $@"
                <html>
                    <body style='font-family: Arial, sans-serif; color: #333;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                            <h2 style='color: #d32f2f;'>Banco Ruby - Alerta de Seguridad</h2>
                            <p>Hola, <b>{titularNombre}</b>.</p>
                            <p>Te informamos que se ha iniciado sesión en tu cuenta bancaria a través de nuestro cajero automático.</p>
                            <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Número de Cuenta:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>{cuenta.NumeroCuenta}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Fecha/Hora:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>{DateTime.Now:dd/MM/yyyy HH:mm:ss}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Canal:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>Cajero Automático (ATM)</td>
                                </tr>
                            </table>
                            <p style='margin-top: 20px; font-size: 13px; color: #555;'>Si no reconoces esta actividad, por favor ponte en contacto de inmediato con nuestro servicio de atención al cliente.</p>
                            <br/>
                            <p style='font-size: 12px; color: #777;'>Este es un correo transaccional automático enviado de forma segura por Banco Ruby.</p>
                        </div>
                    </body>
                </html>";

            string destinatariosRaw = string.IsNullOrWhiteSpace(_brevoOptions.DestinatariosPrueba)
                ? "nicoa6088@gmail.com"
                : _brevoOptions.DestinatariosPrueba;

            string[] destinatarios = destinatariosRaw.Split(',', StringSplitOptions.RemoveEmptyEntries);

            foreach (var email in destinatarios)
            {
                string targetEmail = email.Trim();
                _ = Task.Run(() => _emailService.SendEmailAsync(
                    targetEmail,
                    titularNombre,
                    subject,
                    htmlContent,
                    CancellationToken.None
                ), CancellationToken.None);
            }

            return Result.Ok(new AutenticarResponse(titularNombre, cuenta.NumeroCuenta, tokenString));
        }
    }
}
