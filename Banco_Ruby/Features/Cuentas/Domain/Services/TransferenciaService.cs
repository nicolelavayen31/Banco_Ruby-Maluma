using System;
using System.Threading.Tasks;
using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Application.DTOs;

namespace BancoCenit.Features.Cuentas.Domain.Services
{
    // Encapsula el resultado de la ejecuciÃ³n de una transferencia bancaria.
    public sealed class TransferenciaExecutionResult
    {
        // Obtiene si la operaciÃ³n se completÃ³ exitosamente.
        public bool IsSuccess { get; }

        // Mensaje de error descriptivo en caso de que la operaciÃ³n haya fallado.
        public string? Error { get; }

        // Constructor privado para inicializar el resultado.
        // isSuccess: Indica Ã©xito.
        // error: Mensaje de error.
        private TransferenciaExecutionResult(bool isSuccess, string? error)
        {
            IsSuccess = isSuccess;
            Error = error;
        }

        // Crea un resultado exitoso para la transacciÃ³n.
        // <returns>Instancia exitosa de TransferenciaExecutionResult.</returns>
        public static TransferenciaExecutionResult Success() => new(true, null);

        // Crea un resultado fallido con la causa del error.
        // error: La razÃ³n del fallo.
        // <returns>Instancia fallida de TransferenciaExecutionResult.</returns>
        public static TransferenciaExecutionResult Failure(string error) => new(false, error);
    }

    // Servicio de Dominio encargado de aplicar las reglas de negocio crÃ­ticas para transferencias bancarias.
    // Es un servicio de dominio puro porque no tiene estado y coordina la lÃ³gica transaccional que abarca
    // mÃºltiples entidades y llamadas externas antes de persistir los cambios.
    // Valida saldos, realiza dÃ©bitos/crÃ©ditos locales, y coordina la reversiÃ³n (rollback) en memoria en caso de fallas externas.
    public static class TransferenciaService
    {
        // Ejecuta la lÃ³gica transaccional pura de una transferencia (dÃ©bito, comisiÃ³n interbancaria, crÃ©dito local y rollback en memoria).
        // origen: La entidad Cuenta emisora de la transacciÃ³n.
        // destino: La entidad Cuenta receptora (serÃ¡ null si la transferencia es interbancaria hacia un banco externo).
        // request: Los detalles de la transferencia (monto).
        // enviarTransferencia: FunciÃ³n callback que conecta con el canal externo del integrador/pasarela.
        // Retorna: Un resultado del dominio encapsulado en TransferenciaExecutionResult indicando Ã©xito o error detallado.
        public static async Task<TransferenciaExecutionResult> EjecutarTransferenciaAsync(
            Cuenta origen,
            Cuenta? destino,
            TransferenciaRequest request,
            Func<Task> enviarTransferencia)
        {
            // Regla de Negocio: No se permiten transferencias con montos menores o iguales a cero.
            if (request.Monto <= 0)
            {
                return TransferenciaExecutionResult.Failure("El monto debe ser mayor que cero.");
            }

            // Regla de Negocio: Si la cuenta destino es nula (externa/interbancaria), se cobra una comisiÃ³n de $0.41.
            // Si la transferencia es local (mismo banco), la comisiÃ³n es de $0.00.
            decimal comision = destino is null ? 0.41m : 0m;
            decimal totalDebitado = request.Monto + comision;

            // Regla de Negocio: Verifica que el saldo de la cuenta origen sea suficiente para cubrir el monto solicitado mÃ¡s la comisiÃ³n correspondiente.
            if (totalDebitado > origen.Saldo)
            {
                return TransferenciaExecutionResult.Failure("Fondos insuficientes en la cuenta origen.");
            }

            // Resguarda los saldos en variables temporales antes de realizar cambios.
            // Si el callback externo del integrador falla, restauraremos estos valores para evitar saldos inconsistentes.
            decimal saldoOrigenAntes = origen.Saldo;
            decimal? saldoDestinoAntes = destino?.Saldo;

            // Paso 1: Debita el total (monto + comisiÃ³n) de la cuenta de origen local
            origen.Debitar(totalDebitado);

            // Paso 2: Si la cuenta destino es del mismo banco (local), acredita los fondos inmediatamente
            if (destino is not null)
            {
                destino.Acreditar(request.Monto);
            }

            try
            {
                // Paso 3: Invoca la pasarela o canal externo de comunicaciÃ³n (Integrador ATM)
                // Se ejecuta mediante un callback inyectado para mantener el dominio desacoplado de la infraestructura HTTP.
                await enviarTransferencia();
                return TransferenciaExecutionResult.Success();
            }
            catch (Exception ex)
            {
                // Paso 4 (CompensaciÃ³n): Si la llamada externa fallÃ³ por timeout, error de red o rechazo de pasarela,
                // revertimos los saldos locales en memoria a sus valores iniciales guardados antes de debitar.
                origen.RestaurarSaldo(saldoOrigenAntes);
                if (destino is not null && saldoDestinoAntes.HasValue)
                {
                    destino.RestaurarSaldo(saldoDestinoAntes.Value);
                }
                return TransferenciaExecutionResult.Failure($"TransacciÃ³n fallida. Se devolviÃ³ el monto a la cuenta {origen.NumeroCuenta}. Detalle: {ex.Message}");
            }
        }
    }
}
