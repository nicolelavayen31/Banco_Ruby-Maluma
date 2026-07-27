using System;

namespace BancoCenit.Features.Cuentas.Domain.Entities
{
    /// <summary>
    /// Registra el resultado de una operación financiera por su identificador único (TransactionId)
    /// para evitar el doble procesamiento (idempotencia).
    /// </summary>
    public sealed class Idempotencia
    {
        /// <summary>
        /// Identificador único de la transacción enviado por el cliente o integrador.
        /// </summary>
        public string TransactionId { get; set; } = default!;

        /// <summary>
        /// Respuesta serializada en JSON de la transacción previa para ser devuelta en peticiones repetidas.
        /// </summary>
        public string ResponseJson { get; set; } = default!;

        /// <summary>
        /// Fecha y hora de creación del registro.
        /// </summary>
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    }
}
