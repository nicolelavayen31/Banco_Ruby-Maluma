using System;

namespace BancoCenit.Features.Cuentas.Domain.Entities
{
    // Registra el resultado de una operaciÃ³n financiera por su identificador Ãºnico (TransactionId)
    // para evitar el doble procesamiento (idempotencia).
    public sealed class Idempotencia
    {
        // Identificador Ãºnico de la transacciÃ³n enviado por el cliente o integrador.
        public string TransactionId { get; set; } = default!;

        // Respuesta serializada en JSON de la transacciÃ³n previa para ser devuelta en peticiones repetidas.
        public string ResponseJson { get; set; } = default!;

        // Fecha y hora de creaciÃ³n del registro.
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    }
}
