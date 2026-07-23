using BancoCenit.Common;
using BancoCenit.Features;
using BancoCenit.Features.Cuentas.Application.Commands;
using BancoCenit.Features.Cuentas.Application.Queries;
using FluentResults;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Text.Json;

namespace BancoCenit.Features.Cuentas.Endpoint
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
            var group = app.MapGroup("/api");

            group.MapPost("/cuentas/{numero}/autenticar", AutenticarAsync);
            
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
            // Intenta leer el body por compatibilidad física si envía PIN
            try
            {
                using JsonDocument doc = await JsonDocument.ParseAsync(req.Body);
            }
            catch
            {
                // Ignora el error de parseo si está vacío
            }

            var result = await mediator.Send(new AutenticarCommand(numero), cancellationToken);
            if (result.IsFailed)
            {
                return Results.NotFound(new { error = result.Errors[0].Message });
            }

            return Results.Ok(new { titular = result.Value.Titular, cuenta = result.Value.Cuenta });
        }

        private static async Task<IResult> ConsultarSaldoAsync(
            string numero, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new ObtenerSaldoQuery(numero), cancellationToken);
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
                var result = await mediator.Send(new DepositarCommand(numero, monto), cancellationToken);
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
            var result = await mediator.Send(new DepositarCommand(request.NumeroCuenta, request.Monto), cancellationToken);
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
                var result = await mediator.Send(new RetirarCommand(numero, monto), cancellationToken);
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
            var result = await mediator.Send(new RetirarCommand(request.NumeroCuenta, request.Monto), cancellationToken);
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

                var result = await mediator.Send(new TransferirCommand(numero, cuentaDestino, monto), cancellationToken);
                if (result.IsFailed)
                {
                    return Results.BadRequest(new { error = result.Errors[0].Message });
                }

                return Results.Ok(new { mensaje = result.Value.Mensaje, saldo = result.Value.SaldoActual });
            }
            catch
            {
                return Results.BadRequest(new { error = "Cuerpo inválido para transferencia." });
            }
        }

        private static async Task<IResult> TransferirClassicAsync(
            TransferenciaRequest request, 
            IMediator mediator, 
            CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new TransferirCommand(request.NumeroCuentaOrigen, request.NumeroCuentaDestino, request.Monto), cancellationToken);
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
            var result = await mediator.Send(new ObtenerHistorialQuery(numero), cancellationToken);
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

                var result = await mediator.Send(new AcreditarCommand(numero, monto, cuentaOrigen, bancoOrigen, concepto), cancellationToken);
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
    }
}
