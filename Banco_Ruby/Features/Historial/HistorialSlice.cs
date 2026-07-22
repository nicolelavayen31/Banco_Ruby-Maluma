using BancoCenit.Common;
using BancoCenit.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BancoCenit.Features;

/// <summary>
/// Gestiona la recuperación del historial de movimientos y transacciones.
/// Forma parte del Vertical Slice de Historial.
/// </summary>
public static class HistorialSlice
{
    /// <summary>
    /// Obtiene la lista ordenada de transacciones y auditorías vinculadas a una cuenta.
    /// </summary>
    /// <param name="numeroCuenta">Número de cuenta de 16 dígitos.</param>
    /// <param name="db">El contexto de la base de datos de EF Core.</param>
    /// <returns>JSON con el nombre del titular y la lista histórica de transacciones, u error 404 (NotFound).</returns>
    public static async Task<object> ObtenerAsync(string numeroCuenta, DbContext db)
    {
        // Obtiene la cuenta origen validando su existencia y estado.
        // AsNoTracking evita sobrecargar la memoria de EF al ser consulta de lectura pura.
        Cuenta? cuenta = await db.Set<Cuenta>()
            .Include(c => c.Usuario)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.NumeroCuenta == numeroCuenta && c.Estado);
            
        if (cuenta is null)
        {
            return Results.NotFound(new { error = "Cuenta no encontrada o inactiva." });
        }

        // Consulta de LINQ para extraer los registros de auditoría filtrados por CuentaId.
        // Se ordenan en forma descendente para mostrar primero las transacciones más recientes.
        // Se realiza una proyección directa (.Select) a un record liviano para optimizar la transferencia de red.
        List<HistorialResumen> auditorias = await db.Set<Auditoria>()
            .AsNoTracking()
            .Where(a => a.CuentaId == cuenta.CuentaId)
            .OrderByDescending(a => a.CreadoEn)
            .Select(a => new HistorialResumen(a.Tipo, a.Monto, a.Descripcion, a.CreadoEn))
            .ToListAsync();

        return Results.Ok(new { titular = cuenta.Usuario?.Nombre ?? string.Empty, historial = auditorias });
    }

    /// <summary>
    /// Registro DTO inmutable interno para proyectar los detalles esenciales del historial.
    /// </summary>
    /// <param name="Tipo">Tipo de movimiento (ej. Depósito, Retiro, Transferencia).</param>
    /// <param name="Monto">Monto de la transacción.</param>
    /// <param name="Descripcion">Detalle literal del movimiento.</param>
    /// <param name="CreadoEn">Fecha y hora del movimiento.</param>
    private sealed record HistorialResumen(string Tipo, decimal Monto, string Descripcion, DateTime CreadoEn);
}
