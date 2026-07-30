using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BancoCenit.Common.Filters;
using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Application.DTOs;
using BancoCenit.Features.Cuentas.Application.Commands;
using BancoCenit.Features.Cuentas.Application.Queries;
using FluentResults;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BancoCenit.Features.Cuentas.Presentation
{
    /// <summary>
    /// Expone los endpoints de Minimal APIs para la característica de Cuentas en Banco Ruby.
    /// Delega toda la ejecución de comandos y consultas al mediador centralizado (MediatR).
    /// </summary>
    public static class CuentaEndpoint
    {
        /// <summary>
        /// Mapea los endpoints locales y de compatibilidad interbancaria en el pipeline HTTP de Banco Ruby.
        /// </summary>
        public static IEndpointRouteBuilder MapCuentaEndpoints(this IEndpointRouteBuilder app)
        {
            // ----------------- ENDPOINTS DE COMPATIBILIDAD CON CAJERO / CLIENTE -----------------
            RouteGroupBuilder group = app.MapGroup("/api");

            group.MapPost("/cuentas/{numero}/autenticar", AutenticarAsync)
                 .RequireRateLimiting("auth-limit");
            
            group.MapGet("/cuentas/{numero}/saldo", ConsultarSaldoAsync)
                 .AddEndpointFilter<AccountAuthorizationFilter>();
                 
            group.MapPost("/cuentas/{numero}/depositar", DepositarCajeroAsync)
                 .AddEndpointFilter<AccountAuthorizationFilter>();
                 
            group.MapPost("/cuentas/{numero}/retirar", RetirarCajeroAsync)
                 .AddEndpointFilter<AccountAuthorizationFilter>();
                 
            group.MapPost("/cuentas/{numero}/transferir", TransferirAsync)
                 .AddEndpointFilter<AccountAuthorizationFilter>();
                 
            group.MapGet("/cuentas/{numero}/historial", ObtenerHistorialAsync)
                 .AddEndpointFilter<AccountAuthorizationFilter>();
            
            // Endpoint para abono/crédito interbancario entrante (invocado por el Integrador ATM)
            group.MapPost("/cuentas/{numero}/credito", AcreditarAsync);

            // Endpoint de webhook/callback interbancario (para compatibilidad de firmas)
            group.MapPost("/transferencias/interbancarias/callback", CallbackInterbancarioAsync);

            // ----------------- ENDPOINTS CLÁSICOS / RAÍZ -----------------
            app.MapGet("/saldo/{numero}", ConsultarSaldoAsync)
               .AddEndpointFilter<AccountAuthorizationFilter>();
               
            app.MapPost("/deposito", DepositarClassicAsync)
               .AddEndpointFilter<AccountAuthorizationFilter>();
               
            app.MapPost("/retiro", RetirarClassicAsync)
               .AddEndpointFilter<AccountAuthorizationFilter>();
               
            app.MapPost("/transferencia", TransferirClassicAsync)
               .AddEndpointFilter<AccountAuthorizationFilter>();
               
            app.MapGet("/historial/{numero}", ObtenerHistorialAsync)
               .AddEndpointFilter<AccountAuthorizationFilter>();

            return app;
        }

        private static async Task<IResult> AutenticarAsync(
            string numero, 
            HttpRequest req, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            string pin = string.Empty;
            try
            {
                // Habilitar buffering para permitir múltiples lecturas si es necesario
                req.EnableBuffering();
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body);
                JsonElement root = doc.RootElement;
                if (root.TryGetProperty("Pin", out JsonElement p) || root.TryGetProperty("pin", out p))
                {
                    pin = p.GetString() ?? string.Empty;
                }
            }
            catch
            {
                // Ignora el error de parseo si está vacío
            }

            Result<AutenticarResponse> result = await mediator.Send(new AutenticarCommand(numero, pin), cancellationToken);
            if (result.IsFailed)
            {
                if (result.Errors[0].Message.Contains("PIN incorrecto"))
                {
                    return Results.Json(new { error = result.Errors[0].Message }, statusCode: 401);
                }
                return Results.Json(new { error = result.Errors[0].Message }, statusCode: 404);
            }

            return Results.Ok(new { titular = result.Value.Titular, cuenta = result.Value.Cuenta, token = result.Value.Token });
        }

        private static async Task<IResult> ConsultarSaldoAsync(
            string numero, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            Result<SaldoResponse> result = await mediator.Send(new ObtenerSaldoQuery(numero), cancellationToken);
            if (result.IsFailed)
            {
                return Results.NotFound(new { error = result.Errors[0].Message });
            }

            return Results.Ok(new { saldo = result.Value.Saldo, titular = result.Value.Titular });
        }

        private static async Task<IResult> DepositarCajeroAsync(
            string numero, 
            HttpRequest req, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            try
            {
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body);
                JsonElement root = doc.RootElement;
                if (!root.TryGetProperty("Monto", out JsonElement m) && !root.TryGetProperty("monto", out m))
                {
                    return Results.BadRequest(new { error = "Cuerpo inválido" });
                }

                decimal monto = m.GetDecimal();
                Result<OperacionResponse> result = await mediator.Send(new DepositarCommand(numero, monto), cancellationToken);
                if (result.IsFailed)
                {
                    return Results.BadRequest(new { error = result.Errors[0].Message });
                }

                return Results.Ok(new { mensaje = result.Value.Mensaje, saldo = result.Value.SaldoActual });
            }
            catch
            {
                return Results.BadRequest(new { error = "Cuerpo inválido" });
            }
        }

        // Sobrecarga de depósito clásica
        private static async Task<IResult> DepositarClassicAsync(
            DepositoRequest request, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            Result<OperacionResponse> result = await mediator.Send(new DepositarCommand(request.NumeroCuenta, request.Monto), cancellationToken);
            if (result.IsFailed)
            {
                return Results.BadRequest(new { error = result.Errors[0].Message });
            }

            return Results.Ok(new { mensaje = result.Value.Mensaje, saldo = result.Value.SaldoActual });
        }

        private static async Task<IResult> RetirarCajeroAsync(
            string numero, 
            HttpRequest req, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            try
            {
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body);
                JsonElement root = doc.RootElement;
                if (!root.TryGetProperty("Monto", out JsonElement m) && !root.TryGetProperty("monto", out m))
                {
                    return Results.BadRequest(new { error = "Cuerpo inválido" });
                }

                decimal monto = m.GetDecimal();
                Result<OperacionResponse> result = await mediator.Send(new RetirarCommand(numero, monto), cancellationToken);
                if (result.IsFailed)
                {
                    return Results.BadRequest(new { error = result.Errors[0].Message });
                }

                return Results.Ok(new { mensaje = result.Value.Mensaje, saldo = result.Value.SaldoActual });
            }
            catch
            {
                return Results.BadRequest(new { error = "Cuerpo inválido" });
            }
        }

        // Sobrecarga de retiro clásica
        private static async Task<IResult> RetirarClassicAsync(
            RetiroRequest request, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            Result<OperacionResponse> result = await mediator.Send(new RetirarCommand(request.NumeroCuenta, request.Monto), cancellationToken);
            if (result.IsFailed)
            {
                return Results.BadRequest(new { error = result.Errors[0].Message });
            }

            return Results.Ok(new { mensaje = result.Value.Mensaje, saldo = result.Value.SaldoActual });
        }

        private static async Task<IResult> TransferirAsync(
            string numero, 
            HttpRequest req, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            try
            {
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body);
                JsonElement root = doc.RootElement;
                if ((!root.TryGetProperty("CuentaDestino", out JsonElement cd) && !root.TryGetProperty("cuentaDestino", out cd)) ||
                    (!root.TryGetProperty("Monto", out JsonElement m) && !root.TryGetProperty("monto", out m)))
                {
                    return Results.BadRequest(new { error = "Cuerpo inválido para transferencia." });
                }

                string cuentaDestino = cd.GetString() ?? string.Empty;
                decimal monto = m.GetDecimal();

                // Extrae TransactionId / CorrelationId opcional del JSON dinámico
                string? transactionId = null;
                if (root.TryGetProperty("TransactionId", out JsonElement tId) || root.TryGetProperty("transactionId", out tId) ||
                    root.TryGetProperty("CorrelationId", out tId) || root.TryGetProperty("correlationId", out tId))
                {
                    transactionId = tId.GetString();
                }

                Result<OperacionResponse> result = await mediator.Send(new TransferirCommand(numero, cuentaDestino, monto, transactionId), cancellationToken);
                if (result.IsFailed)
                {
                    return Results.BadRequest(new { error = result.Errors[0].Message });
                }

                return Results.Ok(new { mensaje = result.Value.Mensaje, saldo = result.Value.SaldoActual });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = $"Cuerpo inválido para transferencia: {ex.Message}" });
            }
        }

        private static async Task<IResult> TransferirClassicAsync(
            TransferenciaRequest request, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            Result<OperacionResponse> result = await mediator.Send(new TransferirCommand(
                request.NumeroCuentaOrigen, 
                request.NumeroCuentaDestino, 
                request.Monto, 
                request.TransactionId), cancellationToken);
            if (result.IsFailed)
            {
                return Results.BadRequest(new { error = result.Errors[0].Message });
            }

            return Results.Ok(new { mensaje = result.Value.Mensaje, saldoOrigen = result.Value.SaldoActual });
        }

        private static async Task<IResult> ObtenerHistorialAsync(
            string numero, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            Result<HistorialResponse> result = await mediator.Send(new ObtenerHistorialQuery(numero), cancellationToken);
            if (result.IsFailed)
            {
                return Results.NotFound(new { error = result.Errors[0].Message });
            }

            return Results.Ok(new { titular = result.Value.Titular, historial = result.Value.Historial });
        }

        private static async Task<IResult> AcreditarAsync(
            string numero,
            HttpRequest req,
            IMediator mediator,
            CancellationToken cancellationToken)
        {
            try
            {
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body);
                JsonElement root = doc.RootElement;

                // Parsea campos enviados por el Integrador (monto, cuentaOrigen, bancoOrigen, concepto)
                decimal monto = root.TryGetProperty("monto", out JsonElement m) ? m.GetDecimal() : 0;
                string? cuentaOrigen = root.TryGetProperty("cuentaOrigen", out JsonElement co) ? co.GetString() : null;
                string? bancoOrigen = root.TryGetProperty("bancoOrigen", out JsonElement bo) ? bo.GetString() : null;
                string? concepto = root.TryGetProperty("concepto", out JsonElement cp) ? cp.GetString() : null;

                Result<OperacionResponse> result = await mediator.Send(new AcreditarCommand(numero, monto, cuentaOrigen, bancoOrigen, concepto), cancellationToken);
                if (result.IsFailed)
                {
                    return Results.BadRequest(new { error = result.Errors[0].Message });
                }

                return Results.Ok(new { mensaje = result.Value.Mensaje, saldo = result.Value.SaldoActual });
            }
            catch
            {
                return Results.BadRequest(new { error = "Cuerpo de acreditación inválido" });
            }
        }

        private static async Task<IResult> CallbackInterbancarioAsync(
            HttpRequest req,
            CancellationToken cancellationToken)
        {
            try
            {
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body, cancellationToken: cancellationToken);
                JsonElement root = doc.RootElement;
                
                string referenciaExterna = root.TryGetProperty("referenciaExterna", out JsonElement re) || root.TryGetProperty("ReferenciaExterna", out re) ? re.GetString() ?? string.Empty : string.Empty;
                string estado = root.TryGetProperty("estado", out JsonElement es) || root.TryGetProperty("Estado", out es) ? es.GetString() ?? string.Empty : string.Empty;
                string? codigoError = root.TryGetProperty("codigoError", out JsonElement ce) || root.TryGetProperty("CodigoError", out ce) ? ce.GetString() : null;
                string? mensaje = root.TryGetProperty("mensaje", out JsonElement ms) || root.TryGetProperty("Mensaje", out ms) ? ms.GetString() : null;

                Console.WriteLine($"[Webhook Callback] Recibido callback para transacción '{referenciaExterna}': estado='{estado}', codigoError='{codigoError}', mensaje='{mensaje}'");

                return Results.Ok(new { recibido = true });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = $"Error procesando callback: {ex.Message}" });
            }
        }
    }
}
