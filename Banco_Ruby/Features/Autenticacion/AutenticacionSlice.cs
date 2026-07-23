using BancoCenit.Common;
using BancoCenit.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BancoCenit.Features;

/// <summary>
/// Gestiona la autenticación y validación de sesiones de cuentas de usuarios.
/// Forma parte del Vertical Slice de Autenticación.
/// </summary>
public static class AutenticacionSlice
{
    /// <summary>
    /// Consulta el saldo disponible y recupera el nombre del titular para el inicio de sesión o consulta de balance.
    /// </summary>
    /// <param name="numeroCuenta">El número de tarjeta o cuenta de 16 dígitos.</param>
    /// <param name="db">El contexto de base de datos de Banco Ruby.</param>
    /// <returns>Objeto JSON con el saldo y titular, o un error 404 (NotFound) si la cuenta no es válida.</returns>
    public static async Task<object> ConsultarSaldoAsync(string numeroCuenta, BancoRubyDbContext db)
    {
        // Ejecuta una consulta asíncrona cargando los datos del usuario relacionado (Eager Loading).
        // Se utiliza AsNoTracking ya que no se realizarán modificaciones sobre estas entidades en esta operación de lectura.
        Cuenta? cuenta = await db.Set<Cuenta>()
            .Include(c => c.Usuario)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.NumeroCuenta == numeroCuenta && c.Estado);

        // Retorna error 404 si la cuenta no existe en el sistema o está suspendida.
        return cuenta is null
            ? Results.NotFound(new { error = "Cuenta no encontrada o inactiva." })
            : Results.Ok(new { saldo = cuenta.Saldo, titular = cuenta.Usuario?.Nombre ?? string.Empty });
    }
}
