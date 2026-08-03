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

// Filtro de autorizaciÃ³n personalizado para Minimal APIs de ASP.NET Core.
// Intercepta todas las peticiones financieras entrantes y realiza una doble validaciÃ³n:
// 1. Autenticidad e integridad del token JWT (Bearer Token) en la cabecera "Authorization".
// 2. Control de acceso: verifica que el nÃºmero de cuenta que se intenta operar coincida
//    con el nÃºmero de cuenta codificado dentro de los claims del token.
public sealed class AccountAuthorizationFilter : IEndpointFilter
{
    // Contexto de base de datos utilizado para comprobar la existencia y estado de la cuenta en tiempo real.
    private readonly DbContext _db;

    // Inicializa una nueva instancia de la clase AccountAuthorizationFilter con el contexto de persistencia.
    // db: El contexto de la base de datos (generalmente BancoRubyDbContext).
    public AccountAuthorizationFilter(DbContext db)
    {
        _db = db;
    }

    // Intercepta la peticiÃ³n HTTP antes de llegar al endpoint y valida que el cliente tenga permisos.
    // context: El contexto de ejecuciÃ³n que contiene los argumentos de ruta y el HttpContext.
    // next: El delegado para continuar con la tuberÃ­a de filtros o ejecutar el handler final.
    // Retorna: La respuesta HTTP (200 OK, 401 Unauthorized, 403 Forbidden o 404 Not Found) segÃºn la validaciÃ³n.
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;
        
        // 1. Obtener y validar la presencia de la cabecera Authorization con el esquema Bearer
        string? authHeader = httpContext.Request.Headers["Authorization"];

        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Results.Json(new { error = "Debes proporcionar un token de seguridad (Bearer Token) en la cabecera Authorization." }, statusCode: 401);
        }

        // Extraer el string del token JWT propiamente dicho
        string token = authHeader.Substring("Bearer ".Length).Trim();

        // 2. Resolver los valores de configuraciÃ³n de JWT (Secret, Issuer, Audience) desde el contenedor de dependencias
        var configuration = httpContext.RequestServices.GetRequiredService<IConfiguration>();
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"] ?? "super_secret_banco_ruby_key_that_is_at_least_32_characters_long_12345";
        var issuer = jwtSettings["Issuer"] ?? "BancoRuby";
        var audience = jwtSettings["Audience"] ?? "BancoRubyClients";

        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true, // Verifica la validez de la firma digital
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true, // Verifica el emisor
            ValidIssuer = issuer,
            ValidateAudience = true, // Verifica el destinatario/audiencia
            ValidAudience = audience,
            ValidateLifetime = true, // Verifica que no haya expirado temporalmente
            ClockSkew = TimeSpan.Zero // Tolerancia cero para tiempos de expiraciÃ³n vencidos
        };

        ClaimsPrincipal principal;
        try
        {
            // Valida la firma, emisor, audiencia y tiempo de vida del token
            principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
        }
        catch (Exception)
        {
            // Si el token fallÃ³ la validaciÃ³n por expiraciÃ³n o firma incorrecta, retorna 401
            return Results.Json(new { error = "El token no es vÃ¡lido o ha expirado." }, statusCode: 401);
        }

        // 3. Extraer el claim personalizado "NumeroCuenta" incrustado en el token
        var numeroCuentaClaim = principal.FindFirst("NumeroCuenta")?.Value;
        if (string.IsNullOrWhiteSpace(numeroCuentaClaim))
        {
            return Results.Json(new { error = "Token invÃ¡lido: falta identificador de cuenta." }, statusCode: 401);
        }

        // 4. Analizar los argumentos de ruta o cuerpo recibidos por el endpoint
        // Esto permite extraer de manera dinÃ¡mica quÃ© nÃºmero de cuenta se quiere manipular
        IReadOnlyCollection<string> accountNumbers = GetAccountNumbers(context.Arguments);
        
        if (accountNumbers.Count > 0)
        {
            foreach (string numeroCuenta in accountNumbers)
            {
                // ValidaciÃ³n A: Comparar el nÃºmero de cuenta de la peticiÃ³n con el claim del token JWT.
                // Previene que un usuario con un token vÃ¡lido de la cuenta A intente operar sobre la cuenta B.
                if (!numeroCuenta.Equals(numeroCuentaClaim, StringComparison.OrdinalIgnoreCase))
                {
                    return Results.Json(new { error = $"Acceso denegado: El token no autoriza operaciones sobre la cuenta {numeroCuenta}." }, statusCode: 403);
                }

                // ValidaciÃ³n B: Comprobar fÃ­sicamente la existencia y el estado activo de la cuenta en la base de datos local.
                // Previene operaciones si la cuenta fue suspendida o eliminada recientemente.
                bool exists = await _db.Set<Cuenta>().AsNoTracking().AnyAsync(c => c.NumeroCuenta == numeroCuenta && c.Estado);
                if (!exists)
                {
                    return Results.NotFound(new { error = $"Cuenta {numeroCuenta} no encontrada o inactiva." });
                }
            }
        }

        // ContinÃºa con la ejecuciÃ³n del endpoint si la validaciÃ³n fue completamente exitosa.
        return await next(context);
    }

    // Extrae reflexiva y tipadamente los nÃºmeros de cuenta origen contenidos en los argumentos del endpoint.
    // Soporta parÃ¡metros de tipo cadena (en la ruta) o peticiones estructuradas en DTOs (cuerpo JSON).
    // arguments: Lista de argumentos recibidos por la firma del endpoint.
    // Retorna: Una colecciÃ³n de nÃºmeros de cuenta extraÃ­dos para su validaciÃ³n.
    private static IReadOnlyCollection<string> GetAccountNumbers(IList<object?> arguments)
    {
        List<string> accountNumbers = new List<string>();

        foreach (object? arg in arguments)
        {
            switch (arg)
            {
                // Si el argumento es un nÃºmero de cuenta directo de la ruta (Ej: string numero)
                case string value when !string.IsNullOrWhiteSpace(value):
                    accountNumbers.Add(value);
                    break;
                // Si la peticiÃ³n viene envuelta en un DTO clÃ¡sico de depÃ³sito
                case DepositoRequest request:
                    accountNumbers.Add(request.NumeroCuenta);
                    break;
                // Si la peticiÃ³n viene envuelta en un DTO clÃ¡sico de retiro
                case RetiroRequest request:
                    accountNumbers.Add(request.NumeroCuenta);
                    break;
                // Si es una solicitud de transferencia, solo validamos la cuenta de origen.
                // La cuenta destino interbancaria no se valida en este filtro porque no pertenece a este banco.
                case TransferenciaRequest request:
                    accountNumbers.Add(request.NumeroCuentaOrigen);
                    break;
            }
        }

        return accountNumbers;
    }
}
