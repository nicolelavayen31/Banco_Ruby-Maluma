using System;
using System.Collections.Generic;

namespace BancoCenit.Features.Cuentas.Domain.Entities
{
    // Representa a un cliente del banco en el dominio de negocio.
    // Contiene datos personales y las cuentas asociadas para su autenticaciÃ³n mediante PIN.
    public sealed class Usuario
    {
        // Identificador Ãºnico del usuario. Clave primaria de la tabla.
        public int UsuarioId { get; set; }

        // Nombre completo del titular de la cuenta.
        public string Nombre { get; set; } = default!;

        // CÃ³digo PIN encriptado (MD5 o hash) utilizado para validar el acceso en cajeros.
        public string Pin { get; set; } = default!;

        // Fecha y hora en la que el usuario fue registrado en el sistema.
        public DateTime CreadoEn { get; set; }

        // Lista de cuentas bancarias pertenecientes a este usuario.
        public List<Cuenta> Cuentas { get; set; } = new();
    }

    // Representa la cuenta bancaria de un cliente.
    // Custodia el saldo disponible y estÃ¡ vinculada a un titular.
    public sealed class Cuenta
    {
        // Identificador Ãºnico de la cuenta bancaria. Clave primaria.
        public int CuentaId { get; set; }

        // Identificador del usuario propietario de la cuenta. Clave forÃ¡nea.
        public int UsuarioId { get; set; }

        // Referencia al usuario/cliente titular de la cuenta.
        public Usuario? Usuario { get; set; }

        // NÃºmero de tarjeta o nÃºmero de cuenta Ãºnico de 16 dÃ­gitos.
        public string NumeroCuenta { get; set; } = default!;

        // Saldo monetario disponible en pesos de la cuenta.
        public decimal Saldo { get; private set; }

        // Debita un monto de la cuenta, validando fondos suficientes.
        public void Debitar(decimal monto)
        {
            if (monto <= 0) throw new ArgumentException("El monto a debitar debe ser mayor que cero.");
            if (monto > Saldo) throw new InvalidOperationException("Fondos insuficientes.");
            Saldo -= monto;
        }

        // Acredita un monto a la cuenta.
        public void Acreditar(decimal monto)
        {
            if (monto <= 0) throw new ArgumentException("El monto a acreditar debe ser mayor que cero.");
            Saldo += monto;
        }

        // Restaura el saldo a un valor anterior en caso de rollback transaccional.
        public void RestaurarSaldo(decimal saldo)
        {
            Saldo = saldo;
        }

        // Indica si la cuenta estÃ¡ activa (true) o inactiva/bloqueada (false).
        public bool Estado { get; set; }

        // Fecha y hora de creaciÃ³n de la cuenta bancaria.
        public DateTime CreadoEn { get; set; }

        // Historial de eventos y transacciones financieras registradas sobre esta cuenta.
        public List<Auditoria> Auditorias { get; set; } = new();

        // Identificador UUID de esta cuenta asignado por el Integrador ATM.
        public string? IntegradorAccountId { get; set; }
    }

    // Representa un registro histÃ³rico de movimientos y auditorÃ­a financiera de una cuenta.
    // Documenta depÃ³sitos, retiros y transferencias para garantizar transparencia y conciliaciÃ³n.
    public sealed class Auditoria
    {
        // Identificador Ãºnico del registro de auditorÃ­a.
        public int AuditoriaId { get; set; }

        // Identificador de la cuenta bancaria afectada por la transacciÃ³n.
        public int CuentaId { get; set; }

        // Referencia a la cuenta bancaria afectada.
        public Cuenta? Cuenta { get; set; }

        // NÃºmero de la cuenta bancaria para mantener redundancia histÃ³rica rÃ¡pida.
        public string NumeroCuenta { get; set; } = default!;

        // Tipo de transacciÃ³n realizada (ej. "Retiro", "DepÃ³sito", "Transferencia recibida").
        public string Tipo { get; set; } = default!;

        // Monto implicado en el movimiento financiero.
        public decimal Monto { get; set; }

        // Detalle explicativo de la operaciÃ³n, cuentas involucradas y estado final.
        public string Descripcion { get; set; } = default!;

        // Fecha y hora en la que se efectuÃ³ y registrÃ³ la transacciÃ³n.
        public DateTime CreadoEn { get; set; }
    }
}
