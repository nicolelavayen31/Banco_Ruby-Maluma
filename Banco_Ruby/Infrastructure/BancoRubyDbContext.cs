using BancoCenit.Features.Cuentas.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BancoCenit.Infrastructure
{
    /// <summary>
    /// Contexto de Entity Framework Core para la base de datos de Banco Ruby.
    /// Define los DbSets y las configuraciones de mapeo relacional objeto (ORM) para PostgreSQL.
    /// </summary>
    public class BancoRubyDbContext : DbContext
    {
        /// <summary>
        /// Inicializa una nueva instancia de la clase <see cref="BancoRubyDbContext"/> con las opciones de configuración especificadas.
        /// </summary>
        /// <param name="options">Las opciones del contexto de base de datos.</param>
        public BancoRubyDbContext(DbContextOptions<BancoRubyDbContext> options) : base(options)
        {
        }

        /// <summary>
        /// Colección de entidades de usuarios registradas en el sistema.
        /// </summary>
        public DbSet<Usuario> Usuarios => Set<Usuario>();

        /// <summary>
        /// Colección de cuentas bancarias asociadas a los clientes del banco.
        /// </summary>
        public DbSet<Cuenta> Cuentas => Set<Cuenta>();

        /// <summary>
        /// Colección de registros de auditoría que documentan los movimientos y operaciones bancarias realizadas.
        /// </summary>
        public DbSet<Auditoria> Auditoria => Set<Auditoria>();

        /// <summary>
        /// Colección de registros de idempotencia de transacciones.
        /// </summary>
        public DbSet<Idempotencia> Idempotencias => Set<Idempotencia>();

        /// <summary>
        /// Configura el modelo de base de datos utilizando Fluent API.
        /// Establece restricciones, llaves primarias, relaciones y nombres físicos de las tablas.
        /// </summary>
        /// <param name="modelBuilder">Constructor de modelos relacionales utilizado para dar forma a las entidades.</param>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Mapeo y restricciones de la entidad Usuario.
            modelBuilder.Entity<Usuario>(entity =>
            {
                // Mapea la clase Usuario a la tabla 'usuario' en la base de datos PostgreSQL.
                entity.ToTable("usuario");

                // Configura 'UsuarioId' como la clave primaria autoincremental de la tabla.
                entity.HasKey(e => e.UsuarioId);
                entity.Property(e => e.UsuarioId).HasColumnName("usuario_id");

                // El nombre completo del titular es obligatorio.
                entity.Property(e => e.Nombre).HasColumnName("nombre").IsRequired();

                // El PIN para autenticación es obligatorio.
                entity.Property(e => e.Pin).HasColumnName("pin").IsRequired();

                entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

                // Relación uno a muchos: Un usuario posee muchas cuentas. La clave foránea es 'usuario_id'.
                entity.HasMany(e => e.Cuentas).WithOne(e => e.Usuario).HasForeignKey(e => e.UsuarioId);
            });

            // Mapeo y restricciones de la entidad Cuenta.
            modelBuilder.Entity<Cuenta>(entity =>
            {
                // Mapea la clase Cuenta a la tabla física 'cuenta'.
                entity.ToTable("cuenta");

                // Configura 'CuentaId' como la clave primaria.
                entity.HasKey(e => e.CuentaId);
                entity.Property(e => e.CuentaId).HasColumnName("cuenta_id");

                entity.Property(e => e.UsuarioId).HasColumnName("usuario_id");

                // El número de cuenta (tarjeta) de 16 dígitos es obligatorio y se requiere para iniciar sesión.
                entity.Property(e => e.NumeroCuenta).HasColumnName("numero_cuenta").IsRequired();

                // Representa el saldo disponible actual de la cuenta bancaria.
                entity.Property(e => e.Saldo).HasColumnName("saldo");

                // Estado de activación (true = activa, false = bloqueada/inactiva).
                entity.Property(e => e.Estado).HasColumnName("estado");

                entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

                entity.Property(e => e.IntegradorAccountId).HasColumnName("integrador_account_id");

                // Relación uno a muchos: Una cuenta puede registrar múltiples eventos de auditoría (depósitos, retiros, transferencias).
                entity.HasMany(e => e.Auditorias).WithOne(e => e.Cuenta).HasForeignKey(e => e.CuentaId);
            });

            // Mapeo y restricciones de la entidad Auditoria.
            modelBuilder.Entity<Auditoria>(entity =>
            {
                // Mapea la clase Auditoria a la tabla física 'auditoria'.
                entity.ToTable("auditoria");

                // Configura 'AuditoriaId' como clave primaria autoincremental.
                entity.HasKey(e => e.AuditoriaId);
                entity.Property(e => e.AuditoriaId).HasColumnName("auditoria_id");

                entity.Property(e => e.CuentaId).HasColumnName("cuenta_id");

                // Almacena el número de cuenta de forma explícita para agilizar búsquedas e históricos.
                entity.Property(e => e.NumeroCuenta).HasColumnName("numero_cuenta").IsRequired();

                // Tipo de operación (ej. 'Depósito', 'Retiro', 'Transferencia enviada').
                entity.Property(e => e.Tipo).HasColumnName("tipo").IsRequired();

                entity.Property(e => e.Monto).HasColumnName("monto");

                // Explicación descriptiva del movimiento con montos formateados.
                entity.Property(e => e.Descripcion).HasColumnName("descripcion").IsRequired();

                entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            });

            // Mapeo y restricciones de la entidad Idempotencia.
            modelBuilder.Entity<Idempotencia>(entity =>
            {
                entity.ToTable("idempotencia");
                entity.HasKey(e => e.TransactionId);
                entity.Property(e => e.TransactionId).HasColumnName("transaction_id");
                entity.Property(e => e.ResponseJson).HasColumnName("response_json").IsRequired();
                entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            });
        }
    }
}
