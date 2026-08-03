using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BancoCenit.Common.Filters;
using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Application.DTOs;
using BancoCenit.Features.Cuentas.Application.Commands;
using BancoCenit.Features.Cuentas.Application.Queries;
using BancoCenit.Features.Cuentas.Domain;
using FluentResults;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BancoCenit.Features.Cuentas.Presentation
{
    // Expone los endpoints de Minimal APIs para la caracterÃ­stica de Cuentas en Banco Ruby.
    // Delega toda la ejecuciÃ³n de comandos y consultas al mediador centralizado (MediatR).
    public static class CuentaEndpoint
    {
        // Mapea los endpoints locales y de compatibilidad interbancaria en el pipeline HTTP de Banco Ruby.
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
            
            // Endpoint para abono/crÃ©dito interbancario entrante (invocado por el Integrador ATM)
            group.MapPost("/cuentas/{numero}/credito", AcreditarAsync);

            // Endpoint de webhook/callback interbancario (para compatibilidad de firmas)
            group.MapPost("/transferencias/interbancarias/callback", CallbackInterbancarioAsync);

            // ----------------- ENDPOINTS CLÃSICOS / RAÃZ -----------------
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
                // Habilitar buffering para permitir mÃºltiples lecturas si es necesario
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
                // Ignora el error de parseo si estÃ¡ vacÃ­o
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
                    return Results.BadRequest(new { error = "Cuerpo invÃ¡lido" });
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
                return Results.BadRequest(new { error = "Cuerpo invÃ¡lido" });
            }
        }

        // Sobrecarga de depÃ³sito clÃ¡sica
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
                    return Results.BadRequest(new { error = "Cuerpo invÃ¡lido" });
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
                return Results.BadRequest(new { error = "Cuerpo invÃ¡lido" });
            }
        }

        // Sobrecarga de retiro clÃ¡sica
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
                    return Results.BadRequest(new { error = "Cuerpo invÃ¡lido para transferencia." });
                }

                string cuentaDestino = cd.GetString() ?? string.Empty;
                decimal monto = m.GetDecimal();

                // Extrae TransactionId / CorrelationId opcional del JSON dinÃ¡mico
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
                return Results.BadRequest(new { error = $"Cuerpo invÃ¡lido para transferencia: {ex.Message}" });
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
                return Results.BadRequest(new { error = "Cuerpo de acreditaciÃ³n invÃ¡lido" });
            }
        }

        private static async Task<IResult> CallbackInterbancarioAsync(
            HttpRequest req,
            IMediator mediator,
            ICuentaRepository repository,
            CancellationToken cancellationToken)
        {
            try
            {
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body, cancellationToken: cancellationToken);
                JsonElement root = doc.RootElement;
                
                // Si viene del Integrador ATM (notificación de transacción de crédito)
                if (root.TryGetProperty("type", out JsonElement typeProp))
                {
                    string type = typeProp.GetString() ?? string.Empty;
                    if (type.Equals("credit", StringComparison.OrdinalIgnoreCase))
                    {
                        string bankAccountId = root.GetProperty("bankAccountId").GetString() ?? string.Empty;
                        decimal amountInCents = root.GetProperty("amount").GetDecimal();
                        decimal monto = amountInCents / 100.0m;
                        string sourceBank = root.TryGetProperty("sourceBank", out var sb) ? sb.GetString() ?? "Switch" : "Switch";
                        string description = root.TryGetProperty("description", out var desc) ? desc.GetString() ?? "Transferencia Interbancaria" : "Transferencia Interbancaria";

                        // Buscar la cuenta por IntegradorAccountId
                        var cuentaResult = await repository.GetByIntegradorAccountIdAsync(bankAccountId, cancellationToken);
                        if (cuentaResult.IsFailed)
                        {
                            Console.WriteLine($"[Webhook Callback] Error: {cuentaResult.Errors[0].Message}");
                            return Results.BadRequest(new { error = cuentaResult.Errors[0].Message });
                        }

                        Cuenta cuenta = cuentaResult.Value;

                        // Acreditar los fondos
                        var acreditarResult = await mediator.Send(new AcreditarCommand(cuenta.NumeroCuenta, monto, bankAccountId, sourceBank, description), cancellationToken);
                        if (acreditarResult.IsFailed)
                        {
                            Console.WriteLine($"[Webhook Callback] Error al acreditar: {acreditarResult.Errors[0].Message}");
                            return Results.BadRequest(new { error = acreditarResult.Errors[0].Message });
                        }

                        Console.WriteLine($"[Webhook Callback] Acreditación interbancaria exitosa: cuenta='{cuenta.NumeroCuenta}', monto='{monto}'");
                        return Results.Ok(new { recibido = true });
                    }
                }

                string referenciaExterna = root.TryGetProperty("referenciaExterna", out JsonElement re) || root.TryGetProperty("ReferenciaExterna", out re) ? re.GetString() ?? string.Empty : string.Empty;
                string estado = root.TryGetProperty("estado", out JsonElement es) || root.TryGetProperty("Estado", out es) ? es.GetString() ?? string.Empty : string.Empty;
                string? codigoError = root.TryGetProperty("codigoError", out JsonElement ce) || root.TryGetProperty("CodigoError", out ce) ? ce.GetString() : null;
                string? mensaje = root.TryGetProperty("mensaje", out JsonElement ms) || root.TryGetProperty("Mensaje", out ms) ? ms.GetString() : null;

                Console.WriteLine($"[Webhook Callback] Recibido callback para transacciÃ³n '{referenciaExterna}': estado='{estado}', codigoError='{codigoError}', mensaje='{mensaje}'");

                return Results.Ok(new { recibido = true });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = $"Error procesando callback: {ex.Message}" });
            }
        }
    }
}
