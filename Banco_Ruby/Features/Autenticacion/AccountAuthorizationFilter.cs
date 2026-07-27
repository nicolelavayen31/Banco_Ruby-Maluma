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

namespace BancoCenit.Features;

/// <summary>
/// Filtro de autorización de ASP.NET Core Minimal APIs que intercepta las peticiones financieras.
/// Valida que las cuentas origen involucradas existan y estén activas antes de ejecutar cualquier acción en los Slices.
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
    /// <returns>El resultado de la petición o un error 404 (NotFound) si la cuenta está inactiva o no existe.</returns>
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        // Analiza los argumentos enviados al endpoint para extraer números de cuenta asociados.
        IReadOnlyCollection<string> accountNumbers = GetAccountNumbers(context.Arguments);
        
        if (accountNumbers.Count > 0)
        {
            // Valida únicamente elementos únicos (Distinct) para evitar consultas redundantes a PostgreSQL.
            foreach (string numeroCuenta in accountNumbers.Distinct())
            {
                // Verifica existencia de la cuenta origen en la base de datos local y valida que esté activa (Estado == true).
                bool exists = await _db.Set<Cuenta>().AsNoTracking().AnyAsync(c => c.NumeroCuenta == numeroCuenta && c.Estado);
                if (!exists)
                {
                    // Evita continuar y devuelve inmediatamente un estado 404 seguro con el error detallado.
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
