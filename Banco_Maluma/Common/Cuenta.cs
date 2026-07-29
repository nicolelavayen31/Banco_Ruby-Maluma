namespace BancoMaluma.Common;

/// <summary>
/// Representa a un usuario o cliente titular en la base de datos de Banco Maluma.
/// Custodia las credenciales de PIN y agrupa sus cuentas bancarias.
/// </summary>
public sealed class Usuario
{
    /// <summary>
    /// Identificador único del usuario.
    /// </summary>
    public int UsuarioId { get; set; }

    /// <summary>
    /// Nombre completo del cliente titular.
    /// </summary>
    public string Nombre { get; set; } = default!;

    /// <summary>
    /// PIN de seguridad encriptado requerido para interactuar con cajeros automáticos.
    /// </summary>
    public string Pin { get; set; } = default!;

    /// <summary>
    /// Fecha y hora en la que se dio de alta al usuario.
    /// </summary>
    public DateTime CreadoEn { get; set; }

    /// <summary>
    /// Listado de cuentas bancarias asociadas al usuario titular.
    /// </summary>
    public List<Cuenta> Cuentas { get; set; } = new();
}

/// <summary>
/// Representa la cuenta bancaria de Banco Maluma.
/// Contiene propiedades para gestionar sobregiros y clasificaciones de tipos de cuentas de ahorro/corriente.
/// </summary>
public sealed class Cuenta
{
    /// <summary>
    /// Identificador único de la cuenta en base de datos.
    /// </summary>
    public int CuentaId { get; set; }

    /// <summary>
    /// Identificador del propietario de la cuenta.
    /// </summary>
    public int UsuarioId { get; set; }

    /// <summary>
    /// Referencia de navegación hacia la entidad del propietario de la cuenta.
    /// </summary>
    public Usuario? Usuario { get; set; }

    /// <summary>
    /// Número de cuenta de 16 dígitos.
    /// </summary>
    public string NumeroCuenta { get; set; } = default!;

    /// <summary>
    /// Saldo contable actual de la cuenta bancaria.
    /// </summary>
    public decimal Saldo { get; set; }

    /// <summary>
    /// Clasificación de la cuenta (Ahorros o Corriente).
    /// </summary>
    public string TipoCuenta { get; set; } = Common.TipoCuenta.Ahorros;

    /// <summary>
    /// Cupo de sobregiro asignado de forma exclusiva a cuentas corrientes.
    /// </summary>
    public decimal CupoSobregiro { get; set; } = 0m;

    /// <summary>
    /// Estado de activación física de la cuenta.
    /// </summary>
    public bool Estado { get; set; }

    /// <summary>
    /// Identificador único de la cuenta mapeada en el Integrador ATM.
    /// </summary>
    public string? IntegradorAccountId { get; set; }

    /// <summary>
    /// Fecha y hora de creación de la cuenta bancaria.
    /// </summary>
    public DateTime CreadoEn { get; set; }

    /// <summary>
    /// Historial de auditoría de transacciones asociadas a la cuenta.
    /// </summary>
    public List<Auditoria> Auditorias { get; set; } = new();

    /// <summary>
    /// Calcula el saldo disponible consolidado útil para retiros o transferencias salientes.
    /// </summary>
    /// <returns>El saldo total disponible (Saldo + CupoSobregiro en cuentas corrientes, o solo Saldo en cuentas de ahorro).</returns>
    public decimal CalcularDisponible()
    {
        // En cuentas corrientes se suma el cupo de sobregiro autorizado para permitir débitos que excedan el saldo real.
        return Common.TipoCuenta.Normalizar(TipoCuenta) == Common.TipoCuenta.Corriente
            ? Saldo + CupoSobregiro
            : Saldo;
    }
}

/// <summary>
/// Registra cada operación financiera (débito/crédito) ejecutada sobre una cuenta de Banco Maluma.
/// </summary>
public sealed class Auditoria
{
    /// <summary>
    /// Identificador único del registro de auditoría.
    /// </summary>
    public int AuditoriaId { get; set; }

    /// <summary>
    /// Identificador de la cuenta bancaria afectada.
    /// </summary>
    public int CuentaId { get; set; }

    /// <summary>
    /// Cuenta asociada.
    /// </summary>
    public Cuenta? Cuenta { get; set; }

    /// <summary>
    /// Número de cuenta bancaria redundante para consultas rápidas.
    /// </summary>
    public string NumeroCuenta { get; set; } = default!;

    /// <summary>
    /// Tipo de transacción realizada (ej. Retiro, Depósito, Acreditación Externa).
    /// </summary>
    public string Tipo { get; set; } = default!;

    /// <summary>
    /// Monto involucrado en el movimiento.
    /// </summary>
    public decimal Monto { get; set; }

    /// <summary>
    /// Descripción libre del detalle de la transacción efectuada.
    /// </summary>
    public string Descripcion { get; set; } = default!;

    /// <summary>
    /// Fecha y hora de registro de la transacción de auditoría.
    /// </summary>
    public DateTime CreadoEn { get; set; }
}

/// <summary>
/// DTO utilizado para recibir fondos enviados externamente (interbancario) desde el Integrador ATM.
/// </summary>
/// <param name="NumeroCuentaDestino">Cuenta receptora de los fondos en Banco Maluma.</param>
/// <param name="Monto">Monto total de fondos transferidos.</param>
/// <param name="CuentaOrigen">Cuenta emisora externa del pago.</param>
/// <param name="BancoOrigen">Nombre del banco origen emisor (ej. Banco Ruby).</param>
/// <param name="Concepto">Concepto o glosa de la transferencia.</param>
public record CreditoEntranteRequest(string NumeroCuentaDestino, decimal Monto, string? CuentaOrigen, string? BancoOrigen, string? Concepto);
