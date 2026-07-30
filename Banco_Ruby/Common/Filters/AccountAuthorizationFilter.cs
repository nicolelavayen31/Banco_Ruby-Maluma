using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Application.DTOs;
using BancoCenit.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Routing.Template;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BancoCenit.Common.Filters;

/// <summary>
/// Filtro de autorización de ASP.NET Core Minimal APIs que intercepta las peticiones financieras.
/// Valida la autenticidad del token JWT (Bearer Token) y comprueba que coincida con la cuenta solicitada.
/// </summary>
public sealed class AccountAuthorizationFilter : IEndpointFilter
{
    private readonly DbContext _db;

    /// <summary>
    /// Inicializa una nueva instancia de la clase <see cref="AccountAuthorizationFilter"/> con el contexto de persistencia.
    /// </summary>
    /// <param name="db">El contexto de la base de datos.</param>
    public AccountAuthorizationFilter(DbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Intercepta la petición HTTP y ejecuta la validación del estado de las cuentas extraídas de los parámetros del endpoint.
    /// </summary>
    /// <param name="context">El contexto de invocación del filtro de endpoint.</param>
    /// <param name="next">El delegado para continuar con el siguiente filtro o con el endpoint final.</param>
    /// <returns>El resultado de la petición o un error 401/403/404 según corresponda.</returns>
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;
        string? authHeader = httpContext.Request.Headers["Authorization"];

        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Results.Json(new { error = "Debes proporcionar un token de seguridad (Bearer Token) en la cabecera Authorization." }, statusCode: 401);
        }

        string token = authHeader.Substring("Bearer ".Length).Trim();

        // Obtener configuración del contenedor de dependencias
        var configuration = httpContext.RequestServices.GetRequiredService<IConfiguration>();
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"] ?? "super_secret_banco_ruby_key_that_is_at_least_32_characters_long_12345";
        var issuer = jwtSettings["Issuer"] ?? "BancoRuby";
        var audience = jwtSettings["Audience"] ?? "BancoRubyClients";

        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        ClaimsPrincipal principal;
        try
        {
            principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
        }
        catch (Exception)
        {
            return Results.Json(new { error = "El token no es válido o ha expirado." }, statusCode: 401);
        }

        var numeroCuentaClaim = principal.FindFirst("NumeroCuenta")?.Value;
        if (string.IsNullOrWhiteSpace(numeroCuentaClaim))
        {
            return Results.Json(new { error = "Token inválido: falta identificador de cuenta." }, statusCode: 401);
        }

        // Analiza los argumentos enviados al endpoint para extraer números de cuenta asociados.
        IReadOnlyCollection<string> accountNumbers = GetAccountNumbers(context.Arguments);
        
        if (accountNumbers.Count > 0)
        {
            foreach (string numeroCuenta in accountNumbers)
            {
                // Validación 1: El token debe pertenecer a la cuenta que se está intentando operar
                if (!numeroCuenta.Equals(numeroCuentaClaim, StringComparison.OrdinalIgnoreCase))
                {
                    return Results.Json(new { error = $"Acceso denegado: El token no autoriza operaciones sobre la cuenta {numeroCuenta}." }, statusCode: 403);
                }

                // Validación 2: Verifica existencia de la cuenta origen en la base de datos local y valida que esté activa (Estado == true).
                bool exists = await _db.Set<Cuenta>().AsNoTracking().AnyAsync(c => c.NumeroCuenta == numeroCuenta && c.Estado);
                if (!exists)
                {
                    return Results.NotFound(new { error = $"Cuenta {numeroCuenta} no encontrada o inactiva." });
                }
            }
        }

        // Continúa con la ejecución del endpoint si la validación fue exitosa.
        return await next(context);
    }

    /// <summary>
    /// Extrae de forma reflexiva y tipada todos los números de cuenta origen presentes en los argumentos del endpoint.
    /// Soporta parámetros de tipo string planos y objetos DTO estructurados.
    /// </summary>
    /// <param name="arguments">Lista de argumentos recibidos por el endpoint.</param>
    /// <returns>Colección de números de cuenta extraídos.</returns>
    private static IReadOnlyCollection<string> GetAccountNumbers(IList<object?> arguments)
    {
        List<string> accountNumbers = new List<string>();

        foreach (object? arg in arguments)
        {
            switch (arg)
            {
                // Si el argumento es un número de cuenta recibido en formato string directo en la ruta.
                case string value when !string.IsNullOrWhiteSpace(value):
                    accountNumbers.Add(value);
                    break;
                // Si el argumento es un DTO de depósito.
                case DepositoRequest request:
                    accountNumbers.Add(request.NumeroCuenta);
                    break;
                // Si el argumento es un DTO de retiro.
                case RetiroRequest request:
                    accountNumbers.Add(request.NumeroCuenta);
                    break;
                // Si es una solicitud de transferencia, solo extrae y valida la cuenta de origen.
                // La cuenta destino externa (interbancaria) se omitirá de este filtro local ya que no existe en esta DB.
                case TransferenciaRequest request:
                    accountNumbers.Add(request.NumeroCuentaOrigen);
                    break;
            }
        }

        return accountNumbers;
    }
}
