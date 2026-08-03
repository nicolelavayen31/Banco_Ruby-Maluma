using BancoCenit.Features.Cuentas.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BancoCenit.Infrastructure
{
    // Contexto de Entity Framework Core para la base de datos de Banco Ruby.
    // Define los DbSets y las configuraciones de mapeo relacional objeto (ORM) para PostgreSQL.
    public class BancoRubyDbContext : DbContext
    {
        // Inicializa una nueva instancia de la clase BancoRubyDbContext con las opciones de configuraciÃ³n especificadas.
        // options: Las opciones del contexto de base de datos.
        public BancoRubyDbContext(DbContextOptions<BancoRubyDbContext> options) : base(options)
        {
        }

        // ColecciÃ³n de entidades de usuarios registradas en el sistema.
        public DbSet<Usuario> Usuarios => Set<Usuario>();

        // ColecciÃ³n de cuentas bancarias asociadas a los clientes del banco.
        public DbSet<Cuenta> Cuentas => Set<Cuenta>();

        // ColecciÃ³n de registros de auditorÃ­a que documentan los movimientos y operaciones bancarias realizadas.
        public DbSet<Auditoria> Auditoria => Set<Auditoria>();

        // ColecciÃ³n de registros de idempotencia de transacciones.
        public DbSet<Idempotencia> Idempotencias => Set<Idempotencia>();

        // Configura el modelo de base de datos utilizando Fluent API.
        // Establece restricciones, llaves primarias, relaciones y nombres fÃ­sicos de las tablas.
        // modelBuilder: Constructor de modelos relacionales utilizado para dar forma a las entidades.
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

                // El PIN para autenticaciÃ³n es obligatorio.
                entity.Property(e => e.Pin).HasColumnName("pin").IsRequired();

                entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

                // RelaciÃ³n uno a muchos: Un usuario posee muchas cuentas. La clave forÃ¡nea es 'usuario_id'.
                entity.HasMany(e => e.Cuentas).WithOne(e => e.Usuario).HasForeignKey(e => e.UsuarioId);
            });

            // Mapeo y restricciones de la entidad Cuenta.
            modelBuilder.Entity<Cuenta>(entity =>
            {
                // Mapea la clase Cuenta a la tabla fÃ­sica 'cuenta'.
                entity.ToTable("cuenta");

                // Configura 'CuentaId' como la clave primaria.
                entity.HasKey(e => e.CuentaId);
                entity.Property(e => e.CuentaId).HasColumnName("cuenta_id");

                entity.Property(e => e.UsuarioId).HasColumnName("usuario_id");

                // El nÃºmero de cuenta (tarjeta) de 16 dÃ­gitos es obligatorio y se requiere para iniciar sesiÃ³n.
                entity.Property(e => e.NumeroCuenta).HasColumnName("numero_cuenta").IsRequired();

                // Representa el saldo disponible actual de la cuenta bancaria.
                entity.Property(e => e.Saldo).HasColumnName("saldo");

                // Estado de activaciÃ³n (true = activa, false = bloqueada/inactiva).
                entity.Property(e => e.Estado).HasColumnName("estado");

                entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

                entity.Property(e => e.IntegradorAccountId).HasColumnName("integrador_account_id");

                // RelaciÃ³n uno a muchos: Una cuenta puede registrar mÃºltiples eventos de auditorÃ­a (depÃ³sitos, retiros, transferencias).
                entity.HasMany(e => e.Auditorias).WithOne(e => e.Cuenta).HasForeignKey(e => e.CuentaId);
            });

            // Mapeo y restricciones de la entidad Auditoria.
            modelBuilder.Entity<Auditoria>(entity =>
            {
                // Mapea la clase Auditoria a la tabla fÃ­sica 'auditoria'.
                entity.ToTable("auditoria");

                // Configura 'AuditoriaId' como clave primaria autoincremental.
                entity.HasKey(e => e.AuditoriaId);
                entity.Property(e => e.AuditoriaId).HasColumnName("auditoria_id");

                entity.Property(e => e.CuentaId).HasColumnName("cuenta_id");

                // Almacena el nÃºmero de cuenta de forma explÃ­cita para agilizar bÃºsquedas e histÃ³ricos.
                entity.Property(e => e.NumeroCuenta).HasColumnName("numero_cuenta").IsRequired();

                // Tipo de operaciÃ³n (ej. 'DepÃ³sito', 'Retiro', 'Transferencia enviada').
                entity.Property(e => e.Tipo).HasColumnName("tipo").IsRequired();

                entity.Property(e => e.Monto).HasColumnName("monto");

                // ExplicaciÃ³n descriptiva del movimiento con montos formateados.
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
