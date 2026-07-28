using System;
using System.Collections.Generic;

namespace BancoCenit.Features.Cuentas.Domain.Entities
{
    /// <summary>
    /// Representa a un cliente del banco en el dominio de negocio.
    /// Contiene datos personales y las cuentas asociadas para su autenticación mediante PIN.
    /// </summary>
    public sealed class Usuario
    {
        /// <summary>
        /// Identificador único del usuario. Clave primaria de la tabla.
        /// </summary>
        public int UsuarioId { get; set; }

        /// <summary>
        /// Nombre completo del titular de la cuenta.
        /// </summary>
        public string Nombre { get; set; } = default!;

        /// <summary>
        /// Código PIN encriptado (MD5 o hash) utilizado para validar el acceso en cajeros.
        /// </summary>
        public string Pin { get; set; } = default!;

        /// <summary>
        /// Fecha y hora en la que el usuario fue registrado en el sistema.
        /// </summary>
        public DateTime CreadoEn { get; set; }

        /// <summary>
        /// Lista de cuentas bancarias pertenecientes a este usuario.
        /// </summary>
        public List<Cuenta> Cuentas { get; set; } = new();
    }

    /// <summary>
    /// Representa la cuenta bancaria de un cliente.
    /// Custodia el saldo disponible y está vinculada a un titular.
    /// </summary>
    public sealed class Cuenta
    {
        /// <summary>
        /// Identificador único de la cuenta bancaria. Clave primaria.
        /// </summary>
        public int CuentaId { get; set; }

        /// <summary>
        /// Identificador del usuario propietario de la cuenta. Clave foránea.
        /// </summary>
        public int UsuarioId { get; set; }

        /// <summary>
        /// Referencia al usuario/cliente titular de la cuenta.
        /// </summary>
        public Usuario? Usuario { get; set; }

        /// <summary>
        /// Número de tarjeta o número de cuenta único de 16 dígitos.
        /// </summary>
        public string NumeroCuenta { get; set; } = default!;

        /// <summary>
        /// Saldo monetario disponible en pesos de la cuenta.
        /// </summary>
        public decimal Saldo { get; private set; }

        /// <summary>
        /// Debita un monto de la cuenta, validando fondos suficientes.
        /// </summary>
        public void Debitar(decimal monto)
        {
            if (monto <= 0) throw new ArgumentException("El monto a debitar debe ser mayor que cero.");
            if (monto > Saldo) throw new InvalidOperationException("Fondos insuficientes.");
            Saldo -= monto;
        }

        /// <summary>
        /// Acredita un monto a la cuenta.
        /// </summary>
        public void Acreditar(decimal monto)
        {
            if (monto <= 0) throw new ArgumentException("El monto a acreditar debe ser mayor que cero.");
            Saldo += monto;
        }

        /// <summary>
        /// Restaura el saldo a un valor anterior en caso de rollback transaccional.
        /// </summary>
        public void RestaurarSaldo(decimal saldo)
        {
            Saldo = saldo;
        }

        /// <summary>
        /// Indica si la cuenta está activa (true) o inactiva/bloqueada (false).
        /// </summary>
        public bool Estado { get; set; }

        /// <summary>
        /// Fecha y hora de creación de la cuenta bancaria.
        /// </summary>
        public DateTime CreadoEn { get; set; }

        /// <summary>
        /// Historial de eventos y transacciones financieras registradas sobre esta cuenta.
        /// </summary>
        public List<Auditoria> Auditorias { get; set; } = new();

        /// <summary>
        /// Identificador UUID de esta cuenta asignado por el Integrador ATM.
        /// </summary>
        public string? IntegradorAccountId { get; set; }
    }

    /// <summary>
    /// Representa un registro histórico de movimientos y auditoría financiera de una cuenta.
    /// Documenta depósitos, retiros y transferencias para garantizar transparencia y conciliación.
    /// </summary>
    public sealed class Auditoria
    {
        /// <summary>
        /// Identificador único del registro de auditoría.
        /// </summary>
        public int AuditoriaId { get; set; }

        /// <summary>
        /// Identificador de la cuenta bancaria afectada por la transacción.
        /// </summary>
        public int CuentaId { get; set; }

        /// <summary>
        /// Referencia a la cuenta bancaria afectada.
        /// </summary>
        public Cuenta? Cuenta { get; set; }

        /// <summary>
        /// Número de la cuenta bancaria para mantener redundancia histórica rápida.
        /// </summary>
        public string NumeroCuenta { get; set; } = default!;

        /// <summary>
        /// Tipo de transacción realizada (ej. "Retiro", "Depósito", "Transferencia recibida").
        /// </summary>
        public string Tipo { get; set; } = default!;

        /// <summary>
        /// Monto implicado en el movimiento financiero.
        /// </summary>
        public decimal Monto { get; set; }

        /// <summary>
        /// Detalle explicativo de la operación, cuentas involucradas y estado final.
        /// </summary>
        public string Descripcion { get; set; } = default!;

        /// <summary>
        /// Fecha y hora en la que se efectuó y registró la transacción.
        /// </summary>
        public DateTime CreadoEn { get; set; }
    }
}
