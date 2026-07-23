using BancoCenit.Common;
using BancoCenit.Domain.Transferencias;
using BancoCenit.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BancoCenit.Features;

/// <summary>
/// Orquesta la transferencia de fondos entre cuentas (locales o externas mediante el integrador central).
/// Forma parte del Vertical Slice de Transferencias.
/// </summary>
public static class TransferirSlice
{
    /// <summary>
    /// Ejecuta el caso de uso de transferencias locales e interbancarias de forma transaccional.
    /// </summary>
    /// <param name="request">DTO con los detalles del movimiento (origen, destino y monto).</param>
    /// <param name="db">El contexto de base de datos EF Core.</param>
    /// <param name="gateway">La pasarela HTTP para transferir hacia bancos externos.</param>
    /// <returns>Resultado de la transferencia (Ok con mensaje y saldos resultantes, o BadRequest/NotFound si hay error).</returns>
    public static async Task<object> TransferirAsync(TransferenciaRequest request, DbContext db, ITransferenciaGateway gateway)
    {
        // Regla de seguridad: evita que una cuenta se transfiera fondos a sí misma para prevenir duplicidades o inconsistencias.
        if (request.NumeroCuentaOrigen == request.NumeroCuentaDestino)
        {
            return Results.BadRequest(new { error = "La cuenta origen y destino no pueden ser la misma." });
        }

        // Obtiene la cuenta origen validando su existencia y que no esté inactiva/bloqueada.
        Cuenta? origen = await db.Set<Cuenta>().FirstOrDefaultAsync(c => c.NumeroCuenta == request.NumeroCuentaOrigen && c.Estado);
        if (origen is null)
        {
            return Results.NotFound(new { error = "Cuenta origen no encontrada o inactiva." });
        }

        // Intenta obtener la cuenta destino a nivel local en Banco Ruby.
        // Si no se encuentra (destino is null), el sistema deduce dinámicamente que se trata de un envío hacia un banco externo (interbancario).
        Cuenta? destino = await db.Set<Cuenta>().FirstOrDefaultAsync(c => c.NumeroCuenta == request.NumeroCuentaDestino && c.Estado);

        // Orquestar la transferencia: invoca el servicio de dominio.
        // Pasa una expresión lambda como callback que se ejecutará solo después de que el balance origen haya sido debitado temporalmente en memoria,
        // garantizando consistencia atómica antes de realizar la petición HTTP.
        TransferenciaExecutionResult resultado = await TransferenciaService.EjecutarTransferenciaAsync(
            origen,
            destino,
            request,
            () => gateway.EnviarAsync(origen.NumeroCuenta, request.NumeroCuentaDestino, request.Monto));

        // Si la validación de fondos falló o la petición HTTP del gateway devolvió error, aborta y retorna el mensaje correspondiente.
        if (!resultado.IsSuccess)
        {
            return Results.BadRequest(new { error = resultado.Error });
        }

        // Registrar auditoría para el emisor (débito local).
        // Personaliza la descripción dependiendo de si el destinatario es un cliente del mismo banco o externo.
        db.Set<Auditoria>().Add(new Auditoria
        {
            CuentaId = origen.CuentaId,
            NumeroCuenta = origen.NumeroCuenta,
            Tipo = "Transferencia enviada",
            Monto = request.Monto,
            Descripcion = destino is null
                ? $"Se envió transferencia interbancaria de ${request.Monto:N2} a la cuenta externa {request.NumeroCuentaDestino}."
                : $"Se envió transferencia de ${request.Monto:N2} a la cuenta {destino.NumeroCuenta}.",
            CreadoEn = DateTime.UtcNow
        });

        // Registrar auditoría para el receptor local (crédito local), solo si la cuenta destino pertenece a este mismo banco.
        if (destino is not null)
        {
            db.Set<Auditoria>().Add(new Auditoria
            {
                CuentaId = destino.CuentaId,
                NumeroCuenta = destino.NumeroCuenta,
                Tipo = "Transferencia recibida",
                Monto = request.Monto,
                Descripcion = $"Se recibió transferencia de la cuenta {origen.NumeroCuenta} por ${request.Monto:N2}.",
                CreadoEn = DateTime.UtcNow
            });
        }

        // Persiste los cambios financieros en la base de datos PostgreSQL.
        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            mensaje = destino is null
                ? $"Transferencia de ${request.Monto:N2} realizada exitosamente desde Banco Ruby hacia la cuenta {request.NumeroCuentaDestino}."
                : $"Transferencia de ${request.Monto:N2} realizada de {origen.NumeroCuenta} a {destino.NumeroCuenta}.",
            saldoOrigen = origen.Saldo,
            saldoDestino = destino?.Saldo
        });
    }
}
