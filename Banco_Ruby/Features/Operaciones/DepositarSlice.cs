using BancoCenit.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BancoCenit.Features;

/// <summary>
/// Gestiona la acreditación de depósitos en efectivo en las cuentas de los usuarios.
/// Forma parte del Vertical Slice de Operaciones.
/// </summary>
public static class DepositarSlice
{
    /// <summary>
    /// Procesa de forma asíncrona un depósito de fondos en una cuenta bancaria activa.
    /// </summary>
    /// <param name="request">DTO con los detalles del depósito (número de cuenta y monto).</param>
    /// <param name="db">El contexto de la base de datos EF Core.</param>
    /// <returns>Resultado HTTP (Ok con mensaje y nuevo saldo, o BadRequest/NotFound si hay error).</returns>
    public static async Task<object> DepositarAsync(DepositoRequest request, DbContext db)
    {
        // Obtiene la cuenta destino desde la base de datos para acreditarle el monto.
        // Se carga con Tracking porque el saldo será modificado y persistido.
        Cuenta? cuenta = await db.Set<Cuenta>()
            .Include(c => c.Usuario)
            .FirstOrDefaultAsync(c => c.NumeroCuenta == request.NumeroCuenta && c.Estado);

        // Verifica que la cuenta exista en el sistema.
        if (cuenta is null)
        {
            return Results.NotFound(new { error = "Cuenta no encontrada o inactiva." });
        }

        // Evita depósitos inválidos de montos negativos o nulos.
        if (request.Monto <= 0)
        {
            return Results.BadRequest(new { error = "El monto debe ser mayor que cero." });
        }

        // Incrementa el saldo disponible de la cuenta.
        cuenta.Saldo += request.Monto;
        
        // Registra el movimiento financiero en la tabla de auditoría para futuras conciliaciones.
        db.Set<Auditoria>().Add(new Auditoria
        {
            CuentaId = cuenta.CuentaId,
            NumeroCuenta = cuenta.NumeroCuenta,
            Tipo = "Depósito",
            Monto = request.Monto,
            Descripcion = $"Se acreditó a la cuenta ${request.Monto:N2}.",
            CreadoEn = DateTime.UtcNow
        });

        // Confirma los cambios realizados y los escribe físicamente en PostgreSQL de forma transaccional.
        await db.SaveChangesAsync();
        
        return Results.Ok(new { mensaje = $"Depósito de ${request.Monto:N2} realizado.", saldo = cuenta.Saldo });
    }
}