using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BancoCenit.Infrastructure;
using BancoCenit.Common;
using BancoCenit.Features;
using BancoCenit.Domain.Transferencias;

namespace BancoCenit.Extensions;

/// <summary>
/// Proporciona métodos de extensión para mapear las rutas y endpoints del API web de Banco Ruby.
/// Define las operaciones del cajero automático e implementa un adaptador de compatibilidad para el cliente de consola.
/// </summary>
public static class EndpointExtensions
{
    /// <summary>
    /// Mapea y configura todos los endpoints HTTP mínimos de la aplicación.
    /// </summary>
    /// <param name="app">La instancia de la aplicación web de ASP.NET Core.</param>
    /// <returns>La instancia modificada de <see cref="WebApplication"/>.</returns>
    public static WebApplication MapApplicationEndpoints(this WebApplication app)
    {
        // Endpoint de salud pública (Liveness check) para validar que el servicio web está corriendo.
        app.MapGet("/health", () => Results.Ok(new { status = "OK" }))
           .WithName("Health");

        // Endpoint para consultar el saldo disponible de una cuenta.
        // Recibe el número de cuenta y verifica el estado y fondos actuales.
        app.MapGet("/saldo/{numeroCuenta}", async (string numeroCuenta, BancoRubyDbContext db) =>
        {
            return await AutenticacionSlice.ConsultarSaldoAsync(numeroCuenta, db);
        })
        .WithName("ConsultarSaldo")
        .AddEndpointFilter<AccountAuthorizationFilter>(); // Filtro para garantizar que la cuenta exista y esté activa.

        // Endpoint para procesar un depósito local.
        app.MapPost("/deposito", DepositarSlice.DepositarAsync)
            .WithName("Depositar")
            .AddEndpointFilter<AccountAuthorizationFilter>();

        // Endpoint para procesar un retiro de efectivo.
        app.MapPost("/retiro", RetirarSlice.RetirarAsync)
            .WithName("Retirar")
            .AddEndpointFilter<AccountAuthorizationFilter>();

        // Endpoint para procesar una transferencia de fondos clásica.
        app.MapPost("/transferencia", async (TransferenciaRequest request, BancoRubyDbContext db, ITransferenciaGateway gateway) =>
            await TransferirSlice.TransferirAsync(request, db, gateway))
            .WithName("Transferir")
            .AddEndpointFilter<AccountAuthorizationFilter>();

        // Endpoint para obtener el historial completo de auditoría y movimientos de una cuenta.
        app.MapGet("/historial/{numeroCuenta}", HistorialSlice.ObtenerAsync)
            .WithName("Historial")
            .AddEndpointFilter<AccountAuthorizationFilter>();

        // =========================================================================
        // ADAPTADOR DE COMPATIBILIDAD PARA EL CLIENTE DE CONSOLA `Usuario_Cliente`
        // Mapea las rutas bajo el prefijo "/api/cuentas/{numero}" utilizadas por el cliente interactivo.
        // =========================================================================

        // Adaptador para autenticar una cuenta en el cajero automático.
        // Recibe el número de cuenta e incluye al Usuario mediante JOIN (Include) para retornar el nombre del titular.
        app.MapPost("/api/cuentas/{numero}/autenticar", async (string numero, HttpRequest req, BancoRubyDbContext db) =>
        {
            // Recupera la cuenta usando AsNoTracking para optimizar el rendimiento al ser una consulta de solo lectura,
            // cargando mediante Eager Loading (Include) la entidad Usuario relacionada.
            Cuenta? cuenta = await db.Set<Cuenta>()
                .Include(c => c.Usuario)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.NumeroCuenta == numero && c.Estado);
                
            if (cuenta is null) 
            {
                return Results.NotFound(new { error = "Cuenta no encontrada o inactiva." });
            }

            try
            {
                // Intenta leer el cuerpo de la petición (PIN) si fuera enviado en formato JSON estructurado.
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body);
            }
            catch
            {
                // Ignora el error de parseo si el cuerpo está vacío, manteniendo compatibilidad básica.
            }

            return Results.Ok(new { titular = cuenta.Usuario?.Nombre, cuenta = cuenta.NumeroCuenta });
        });

        // Adaptador para consultar el saldo de una cuenta bajo la ruta extendida del cliente.
        app.MapGet("/api/cuentas/{numero}/saldo", async (string numero, BancoRubyDbContext db) =>
        {
            return await AutenticacionSlice.ConsultarSaldoAsync(numero, db);
        })
        .AddEndpointFilter<AccountAuthorizationFilter>();

        // Adaptador para depositar dinero bajo la ruta extendida.
        // Soporta formatos camelCase y PascalCase en el payload JSON.
        app.MapPost("/api/cuentas/{numero}/depositar", async (string numero, HttpRequest req, BancoRubyDbContext db) =>
        {
            try
            {
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body);
                JsonElement root = doc.RootElement;

                // Soporta deserialización flexible para evitar fallos por mayúsculas/minúsculas de la consola cliente.
                if (!root.TryGetProperty("Monto", out JsonElement m) && !root.TryGetProperty("monto", out m))
                {
                    return Results.BadRequest(new { error = "Cuerpo inválido" });
                }

                decimal monto = m.GetDecimal();
                return await DepositarSlice.DepositarAsync(new DepositoRequest(numero, monto), db);
            }
            catch
            {
                return Results.BadRequest(new { error = "Cuerpo inválido" });
            }
        })
        .AddEndpointFilter<AccountAuthorizationFilter>();

        // Adaptador para retirar dinero bajo la ruta extendida.
        // Valida la recepción correcta de la propiedad 'monto' en el cuerpo.
        app.MapPost("/api/cuentas/{numero}/retirar", async (string numero, HttpRequest req, BancoRubyDbContext db) =>
        {
            try
            {
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body);
                JsonElement root = doc.RootElement;

                // Soporta deserialización flexible.
                if (!root.TryGetProperty("Monto", out JsonElement m) && !root.TryGetProperty("monto", out m))
                {
                    return Results.BadRequest(new { error = "Cuerpo inválido" });
                }

                decimal monto = m.GetDecimal();
                return await RetirarSlice.RetirarAsync(new RetiroRequest(numero, monto), db);
            }
            catch
            {
                return Results.BadRequest(new { error = "Cuerpo inválido" });
            }
        })
        .AddEndpointFilter<AccountAuthorizationFilter>();

        // Adaptador para procesar transferencias interbancarias o locales bajo la ruta extendida.
        // Parsea 'CuentaDestino' y 'Monto' soportando variación de nomenclatura.
        app.MapPost("/api/cuentas/{numeroOrigen}/transferir", async (string numeroOrigen, HttpRequest req, BancoRubyDbContext db, ITransferenciaGateway gateway) =>
        {
            try
            {
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body);
                JsonElement root = doc.RootElement;

                // Comprobación doble para tolerar camelCase y PascalCase en propiedades del request JSON.
                if ((!root.TryGetProperty("CuentaDestino", out JsonElement cd) && !root.TryGetProperty("cuentaDestino", out cd)) ||
                    (!root.TryGetProperty("Monto", out JsonElement m) && !root.TryGetProperty("monto", out m)))
                {
                    return Results.BadRequest(new { error = "Cuerpo inválido para transferencia." });
                }

                string cuentaDestino = cd.GetString() ?? string.Empty;
                decimal monto = m.GetDecimal();

                return await TransferirSlice.TransferirAsync(new TransferenciaRequest(numeroOrigen, cuentaDestino, monto), db, gateway);
            }
            catch
            {
                return Results.BadRequest(new { error = "Cuerpo inválido para transferencia." });
            }
        })
        .AddEndpointFilter<AccountAuthorizationFilter>();

        // Adaptador para consultar el historial de transacciones bajo la ruta extendida.
        app.MapGet("/api/cuentas/{numero}/historial", async (string numero, BancoRubyDbContext db) =>
        {
            return await HistorialSlice.ObtenerAsync(numero, db);
        })
        .AddEndpointFilter<AccountAuthorizationFilter>();

        return app;
    }
}
