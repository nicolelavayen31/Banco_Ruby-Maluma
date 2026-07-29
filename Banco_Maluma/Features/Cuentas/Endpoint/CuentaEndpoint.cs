using BancoMaluma.Common;
using BancoMaluma.Features.Cuentas.Application.Commands;
using BancoMaluma.Features.Cuentas.Domain;
using BancoMaluma.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Net.Http.Json;

namespace BancoMaluma.Features.Cuentas.Endpoint
{
    /// <summary>
    /// DTO para la petición de autenticación de tarjeta.
    /// </summary>
    /// <param name="Pin">Código PIN de acceso del usuario.</param>
    public record AutenticarRequest(string Pin);

    /// <summary>
    /// DTO genérico para recibir montos en transacciones (Depósitos y Retiros).
    /// </summary>
    /// <param name="Monto">Monto de la transacción.</param>
    public record OperacionMontoRequest(decimal Monto);

    /// <summary>
    /// DTO para solicitar una transferencia saliente hacia otro banco.
    /// </summary>
    /// <param name="CuentaDestino">Cuenta receptora externa o local.</param>
    /// <param name="Banco">Nombre del banco receptor (opcional).</param>
    /// <param name="Monto">Monto a transferir.</param>
    /// <param name="Concepto">Motivo de la transferencia (opcional).</param>
    public record TransferirBodyRequest(string CuentaDestino, string? Banco, decimal Monto, string? Concepto);

    /// <summary>
    /// Expone los endpoints de la API de Cuentas para Banco Maluma.
    /// Forma parte del Vertical Slice de Cuentas y gestiona los controladores REST.
    /// </summary>
    public static class CuentaEndpoint
    {
        /// <summary>
        /// Mapea los endpoints mínimos requeridos para operar el cajero automático sobre Banco Maluma.
        /// </summary>
        /// <param name="group">Grupo de rutas de la aplicación.</param>
        /// <returns>La instancia modificada de <see cref="RouteGroupBuilder"/>.</returns>
        public static RouteGroupBuilder MapCuentaEndpoints(this RouteGroupBuilder group)
        {
            group.MapGet("/cuentas/{numero}/saldo", GetSaldoAsync);
            group.MapPost("/cuentas/{numero}/autenticar", AutenticarAsync);
            group.MapPost("/cuentas", CrearCuentaAsync);
            group.MapPost("/cuentas/{numero}/credito", AcreditarAsync);
            group.MapPost("/cuentas/{numero}/depositar", DepositarAsync);
            group.MapPost("/cuentas/{numero}/retirar", RetirarAsync);
            group.MapGet("/cuentas/{numero}/historial", GetHistorialAsync);
            group.MapPost("/cuentas/{numero}/transferir", TransferirAsync);

            return group;
        }

        /// <summary>
        /// Autentica la cuenta del usuario validando la clave PIN ingresada en la consola.
        /// </summary>
        private static async Task<IResult> AutenticarAsync(
            string numero,
            AutenticarRequest request,
            ICuentaRepository repo,
            CancellationToken cancellationToken)
        {
            // Obtiene la cuenta desde el repositorio de base de datos.
            var result = await repo.GetByNumeroCuentaAsync(numero, cancellationToken);
            if (result.IsFailed || !result.Value.Estado)
            {
                return Results.BadRequest(new { error = "Cuenta no encontrada o inactiva en Banco Maluma." });
            }

            Cuenta cuenta = result.Value;
            
            // Valida el PIN ingresado con el PIN registrado del titular.
            if (cuenta.Usuario == null || cuenta.Usuario.Pin != request.Pin)
            {
                return Results.BadRequest(new { error = "PIN incorrecto para Banco Maluma." });
            }

            return Results.Ok(new
            {
                mensaje = "Autenticación exitosa en Banco Maluma",
                sessionId = Guid.NewGuid().ToString(),
                tarjeta = cuenta.NumeroCuenta,
                cuenta = cuenta.NumeroCuenta,
                titular = cuenta.Usuario.Nombre
            });
        }

        /// <summary>
        /// Obtiene la consulta detallada de saldo e información disponible de la cuenta.
        /// </summary>
        private static async Task<IResult> GetSaldoAsync(
            string numero,
            ICuentaRepository repo,
            CancellationToken cancellationToken)
        {
            // Consulta los saldos del repositorio.
            var result = await repo.GetByNumeroCuentaAsync(numero, cancellationToken);
            if (result.IsFailed)
            {
                return Results.NotFound(new { error = result.Errors[0].Message });
            }

            Cuenta cuenta = result.Value;
            return Results.Ok(new
            {
                banco = "Banco Maluma",
                numeroCuenta = cuenta.NumeroCuenta,
                titular = cuenta.Usuario?.Nombre ?? string.Empty,
                saldo = cuenta.Saldo,
                tipoCuenta = TipoCuenta.Normalizar(cuenta.TipoCuenta),
                tipoCuentaIntegrador = TipoCuenta.ToIntegratorType(cuenta.TipoCuenta),
                cupoSobregiro = cuenta.CupoSobregiro,
                disponible = cuenta.CalcularDisponible()
            });
        }

        /// <summary>
        /// Crea una nueva cuenta bancaria enviando el comando a través de MediatR.
        /// </summary>
        private static async Task<IResult> CrearCuentaAsync(
            CrearCuentaRequest body,
            IMediator mediator,
            CancellationToken cancellationToken)
        {
            // Instancia el comando CrearCuenta.
            var command = new CrearCuentaCommand(
                body.NombreUsuario,
                body.Pin,
                body.NumeroCuenta,
                body.SaldoInicial,
                body.TipoCuenta,
                body.CupoSobregiro);

            // Despacha el comando vía MediatR.
            var result = await mediator.Send(command, cancellationToken);
            if (result.IsFailed)
            {
                return Results.BadRequest(new { error = result.Errors[0].Message });
            }

            Cuenta cuenta = result.Value;
            return Results.Created($"/cuentas/{cuenta.NumeroCuenta}/saldo", new
            {
                mensaje = "Cuenta creada exitosamente en Banco Maluma",
                numeroCuenta = cuenta.NumeroCuenta,
                titular = cuenta.Usuario?.Nombre ?? string.Empty,
                saldo = cuenta.Saldo,
                tipoCuenta = TipoCuenta.Normalizar(cuenta.TipoCuenta),
                cupoSobregiro = cuenta.CupoSobregiro
            });
        }

        /// <summary>
        /// Acredita dinero (crédito entrante) enviado desde otro banco mediante el integrador central.
        /// </summary>
        private static async Task<IResult> AcreditarAsync(
            string numero,
            CreditoEntranteRequest body,
            IMediator mediator,
            CancellationToken cancellationToken)
        {
            // Instancia el comando AcreditarCommand.
            var command = new AcreditarCommand(
                numero,
                body.Monto,
                body.CuentaOrigen,
                body.BancoOrigen,
                body.Concepto);

            // Despacha el comando vía MediatR para persistir los saldos de forma transaccional.
            var result = await mediator.Send(command, cancellationToken);
            if (result.IsFailed)
            {
                return Results.BadRequest(new { error = result.Errors[0].Message });
            }

            return Results.Ok(result.Value);
        }

        /// <summary>
        /// Realiza un depósito manual de fondos (crédito local) en la cuenta bancaria.
        /// </summary>
        private static async Task<IResult> DepositarAsync(
            string numero,
            OperacionMontoRequest body,
            ICuentaRepository repo,
            WriteDbContext db,
            CancellationToken cancellationToken)
        {
            var result = await repo.GetByNumeroCuentaAsync(numero, cancellationToken);
            if (result.IsFailed) return Results.NotFound(new { error = "Cuenta no encontrada" });

            Cuenta cuenta = result.Value;
            
            // Incrementa el balance.
            cuenta.Saldo += body.Monto;
            
            // Registrar auditoría del depósito
            var auditoria = new Auditoria
            {
                CuentaId = cuenta.CuentaId,
                NumeroCuenta = cuenta.NumeroCuenta,
                Tipo = "Depósito",
                Monto = body.Monto,
                Descripcion = $"Depósito de ${body.Monto:N2} realizado exitosamente.",
                CreadoEn = DateTime.UtcNow
            };
            await db.Auditoria.AddAsync(auditoria, cancellationToken);
            
            // Actualiza y persiste la entidad.
            await repo.UpdateAsync(cuenta, cancellationToken);

            return Results.Ok(new { mensaje = $"Depósito de ${body.Monto:N2} realizado exitosamente", nuevoSaldo = cuenta.Saldo });
        }

        /// <summary>
        /// Procesa un retiro de efectivo físico verificando fondos disponibles y sobregiros.
        /// </summary>
        private static async Task<IResult> RetirarAsync(
            string numero,
            OperacionMontoRequest body,
            ICuentaRepository repo,
            WriteDbContext db,
            CancellationToken cancellationToken)
        {
            var result = await repo.GetByNumeroCuentaAsync(numero, cancellationToken);
            if (result.IsFailed) return Results.NotFound(new { error = "Cuenta no encontrada" });

            Cuenta cuenta = result.Value;
            
            // Valida disponibilidad considerando saldos y sobregiros autorizados en corriente.
            if (body.Monto > cuenta.CalcularDisponible())
            {
                return Results.BadRequest(new { error = "Fondos insuficientes para el retiro en Banco Maluma" });
            }

            cuenta.Saldo -= body.Monto;

            // Registrar auditoría del retiro
            var auditoria = new Auditoria
            {
                CuentaId = cuenta.CuentaId,
                NumeroCuenta = cuenta.NumeroCuenta,
                Tipo = "Retiro",
                Monto = body.Monto,
                Descripcion = $"Retiro de ${body.Monto:N2} realizado exitosamente.",
                CreadoEn = DateTime.UtcNow
            };
            await db.Auditoria.AddAsync(auditoria, cancellationToken);

            await repo.UpdateAsync(cuenta, cancellationToken);

            return Results.Ok(new { mensaje = $"Retiro de ${body.Monto:N2} realizado exitosamente", nuevoSaldo = cuenta.Saldo });
        }

        /// <summary>
        /// Consulta el historial de movimientos usando el DbContext de Lectura optimizado (CQRS).
        /// </summary>
        private static async Task<IResult> GetHistorialAsync(
            string numero,
            ReadDbContext readDb,
            CancellationToken cancellationToken)
        {
            // Ejecuta la consulta de lectura rápida e incluye el Usuario.
            var cuenta = await readDb.Cuentas
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.NumeroCuenta == numero, cancellationToken);

            if (cuenta == null)
            {
                return Results.NotFound(new { error = "Cuenta no encontrada en Banco Maluma" });
            }

            // Recupera la auditoría ordenada descendente por fecha de transacción.
            var historial = await readDb.Auditoria
                .Where(a => a.NumeroCuenta == numero)
                .OrderByDescending(a => a.CreadoEn)
                .Select(a => new
                {
                    tipo = a.Tipo,
                    monto = a.Monto,
                    descripcion = a.Descripcion,
                    creadoEn = a.CreadoEn
                })
                .ToListAsync(cancellationToken);

            return Results.Ok(new
            {
                titular = cuenta.Usuario?.Nombre ?? "maluma",
                historial = historial
            });
        }

        /// <summary>
        /// Ejecuta una transferencia saliente hacia otro banco vía canal central del Integrador ATM.
        /// </summary>
        private static async Task<IResult> TransferirAsync(
            string numero,
            TransferirBodyRequest body,
            ICuentaRepository repo,
            IHttpClientFactory httpClientFactory,
            WriteDbContext db,
            Microsoft.Extensions.Configuration.IConfiguration configuration,
            CancellationToken cancellationToken)
        {
            // Evita transferencias nulas o negativas.
            if (body.Monto <= 0) return Results.BadRequest(new { error = "El monto debe ser mayor a cero" });

            var origenResult = await repo.GetByNumeroCuentaAsync(numero, cancellationToken);
            if (origenResult.IsFailed) return Results.NotFound(new { error = "Cuenta origen no encontrada o inactiva en Banco Maluma" });

            Cuenta origen = origenResult.Value;
            
            // Valida disponibilidad considerando el cupo de sobregiro.
            if (body.Monto > origen.CalcularDisponible())
            {
                return Results.BadRequest(new { error = $"Fondos insuficientes en la cuenta origen {numero} en Banco Maluma." });
            }

            // Débito temporal en origen.
            origen.Saldo -= body.Monto;

            // Instancia el registro de auditoría local.
            var auditOrigen = new Auditoria
            {
                CuentaId = origen.CuentaId,
                NumeroCuenta = origen.NumeroCuenta,
                Tipo = "Transferencia Interbancaria Enviada",
                Monto = body.Monto,
                Descripcion = $"Transferencia enviada a {body.Banco ?? "Banco Externo"} (Cuenta {body.CuentaDestino}) por ${body.Monto:N2}.",
                CreadoEn = DateTime.UtcNow
            };

            await db.Auditoria.AddAsync(auditOrigen, cancellationToken);

            // Realiza la petición HTTP saliente al Integrador ATM (puerto 7000).
            try
            {
                var settings = configuration.GetSection("IntegradorAtm");
                string baseUrl = settings["BaseUrl"] ?? "http://localhost:7000";
                string apiKey = settings["ApiKey"] ?? "REMPLAZAR_CON_TU_API_KEY_ENTREGADA";
                string sourceBank = settings["SourceBank"] ?? "bank_maluma";

                HttpClient client = httpClientFactory.CreateClient();

                // Paso 1: Obtener el token CSRF obligatorio
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("x-api-version", "1");
                
                var csrfResponse = await client.GetAsync($"{baseUrl}/api/csrf-token", cancellationToken);
                if (!csrfResponse.IsSuccessStatusCode)
                {
                    string csrfError = await csrfResponse.Content.ReadAsStringAsync(cancellationToken);
                    throw new Exception($"No se pudo obtener el token CSRF del Integrador: {csrfError}");
                }
                string csrfJson = await csrfResponse.Content.ReadAsStringAsync(cancellationToken);
                using var csrfDoc = System.Text.Json.JsonDocument.Parse(csrfJson);
                string csrfToken = csrfDoc.RootElement.GetProperty("token").GetString() ?? throw new Exception("Token CSRF del Integrador es nulo.");

                // Extraer las cookies enviadas en la respuesta de CSRF
                string? csrfCookie = null;
                if (csrfResponse.Headers.TryGetValues("Set-Cookie", out var cookieHeaders))
                {
                    csrfCookie = string.Join("; ", cookieHeaders);
                }

                // Paso 2: Resolver los UUIDs de cuenta asignados por el integrador
                Cuenta? destino = null;
                var destinoResult = await repo.GetByNumeroCuentaAsync(body.CuentaDestino, cancellationToken);
                if (destinoResult.IsSuccess)
                {
                    destino = destinoResult.Value;
                }

                string cuentaOrigenUuid = origen.IntegradorAccountId ?? origen.NumeroCuenta;
                string cuentaDestinoUuid = destino?.IntegradorAccountId ?? body.CuentaDestino;

                // Paso 3: Configurar cabeceras de autorización y CSRF para el POST
                var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/api/transactions/transfer");
                requestMessage.Headers.Add("x-api-version", "1");
                requestMessage.Headers.Add("x-api-key", apiKey);          // API Key del Convenio
                requestMessage.Headers.Add("x-csrf-token", csrfToken);   // Token de validación CSRF
                if (!string.IsNullOrEmpty(csrfCookie))
                {
                    requestMessage.Headers.Add("Cookie", csrfCookie);
                }

                // Convertir monto a centavos (exigido por el integrador)
                int montoEnCentavos = (int)(body.Monto * 100);

                // Crear payload alineado a 'TransferCommand' del integrador
                var payload = new
                {
                    from_account_id = cuentaOrigenUuid,   // UUID de cuenta emisor
                    to_account_id = cuentaDestinoUuid,   // UUID de cuenta receptor
                    amount = montoEnCentavos,             // Monto en centavos
                    description = body.Concepto ?? "Transferencia Interbancaria",
                    source_bank = sourceBank,
                    correlation_id = Guid.NewGuid().ToString() // ID de transacción
                };

                requestMessage.Content = JsonContent.Create(payload);

                // Paso 4: Enviar la transferencia
                HttpResponseMessage response = await client.SendAsync(requestMessage, cancellationToken);

                // Si la red responde error, ejecuta el rollback de saldo en la cuenta emisora.
                if (!response.IsSuccessStatusCode)
                {
                    string rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);
                    origen.Saldo += body.Monto; // Rollback
                    return Results.BadRequest(new { error = $"El Integrador ATM devolvió error (HTTP {(int)response.StatusCode}): {rawResponse}" });
                }

                // Si todo sale bien, persiste la base de datos de escritura.
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(new { mensaje = $"Transferencia de ${body.Monto:N2} realizada exitosamente desde Banco Maluma hacia {body.CuentaDestino}.", saldo = origen.Saldo });
            }
            catch (Exception ex)
            {
                // Rollback en caso de fallo de red o conexión rechazada.
                origen.Saldo += body.Monto; // Rollback
                return Results.BadRequest(new { error = $"Fallo al conectar con el Integrador ATM. Detalle: {ex.Message}" });
            }
        }
    }
}
