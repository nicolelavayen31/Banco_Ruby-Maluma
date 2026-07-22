using BancoCenit.Common;
using BancoCenit.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BancoCenit.Features;

/// <summary>
/// Gestiona la lógica de retiros de efectivo desde cajeros automáticos.
/// Aplica comisiones fijas, validaciones de billetes válidos y límites de seguridad.
/// Forma parte del Vertical Slice de Operaciones.
/// </summary>
public static class RetirarSlice
{
    /// <summary>
    /// Comisión bancaria fija cobrada al usuario por retiro de cajero ($0.41).
    /// </summary>
    private const decimal COMISION = 0.41m;

    /// <summary>
    /// Procesa de forma asíncrona un retiro de efectivo, validando reglas de negocio específicas.
    /// </summary>
    /// <param name="request">DTO con detalles del retiro (número de cuenta y monto solicitado).</param>
    /// <param name="db">El contexto de base de datos EF Core.</param>
    /// <returns>Resultado HTTP (Ok con mensaje, comisión y nuevo saldo, o BadRequest/NotFound si hay error).</returns>
    public static async Task<object> RetirarAsync(RetiroRequest request, DbContext db)
    {
        // Busca la cuenta bancaria por número de cuenta asegurándose que esté activa.
        Cuenta? cuenta = await db.Set<Cuenta>().FirstOrDefaultAsync(c => c.NumeroCuenta == request.NumeroCuenta && c.Estado);
        if (cuenta is null)
        {
            return Results.NotFound(new { error = "Cuenta no encontrada o inactiva." });
        }

        // Valida que el monto solicitado sea un valor positivo.
        if (request.Monto <= 0)
        {
            return Results.BadRequest(new { error = "El monto debe ser mayor que cero." });
        }

        // Validación física del cajero: solo dispensa billetes que sumen múltiplos de 10 (ej. $10, $20, $50).
        if (request.Monto % 10 != 0)
        {
            return Results.BadRequest(new { error = "El retiro debe ser múltiplo de 10." });
        }

        // Límite de seguridad por transacción en cajeros automáticos (máximo de $500 por retiro).
        if (request.Monto > 500)
        {
            return Results.BadRequest(new { error = "El retiro excede el límite de 500." });
        }

        // Calcula el débito total sumando el monto retirado y la comisión fija del banco.
        decimal totalDebitado = request.Monto + COMISION;
        
        // Verifica que la cuenta posea saldo suficiente para cubrir el retiro y su comisión.
        if (totalDebitado > cuenta.Saldo)
        {
            return Results.BadRequest(new { error = "Fondos insuficientes." });
        }

        // Debita los fondos totales de la cuenta en base de datos.
        cuenta.Saldo -= totalDebitado;
        
        // Registra el retiro y su correspondiente cobro de comisión en la auditoría.
        db.Set<Auditoria>().Add(new Auditoria
        {
            CuentaId = cuenta.CuentaId,
            NumeroCuenta = cuenta.NumeroCuenta,
            Tipo = "Retiro",
            Monto = totalDebitado,
            Descripcion = $"Se debitó de la cuenta ${request.Monto:N2} más comisión de ${COMISION:N2}.",
            CreadoEn = DateTime.UtcNow
        });

        // Persiste los cambios de forma transaccional en la base de datos PostgreSQL.
        await db.SaveChangesAsync();
        
        return Results.Ok(new { mensaje = $"Retiro de ${request.Monto:N2} realizado con comisión de ${COMISION:N2}.", saldo = cuenta.Saldo });
    }
}
