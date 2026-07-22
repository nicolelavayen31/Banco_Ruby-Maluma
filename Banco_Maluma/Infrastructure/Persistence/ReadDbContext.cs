using BancoMaluma.Common;
using Microsoft.EntityFrameworkCore;

namespace BancoMaluma.Infrastructure.Persistence
{
    /// <summary>
    /// Contexto de base de datos de Entity Framework Core optimizado para lecturas en Banco Maluma (CQRS).
    /// Mapea las tablas PostgreSQL utilizando nombres en minúscula según las convenciones tradicionales de Postgres.
    /// </summary>
    public class ReadDbContext : DbContext
    {
        /// <summary>
        /// Inicializa una nueva instancia de la clase <see cref="ReadDbContext"/> con las opciones de configuración dadas.
        /// </summary>
        /// <param name="options">Opciones de configuración del DbContext.</param>
        public ReadDbContext(DbContextOptions<ReadDbContext> options) : base(options)
        {
        }

        /// <summary>
        /// DbSet para consultar la tabla de Usuarios.
        /// </summary>
        public DbSet<Usuario> Usuarios => Set<Usuario>();

        /// <summary>
        /// DbSet para consultar la tabla de Cuentas.
        /// </summary>
        public DbSet<Cuenta> Cuentas => Set<Cuenta>();

        /// <summary>
        /// DbSet para consultar la tabla de Auditoria.
        /// </summary>
        public DbSet<Auditoria> Auditoria => Set<Auditoria>();

        /// <summary>
        /// Configura el mapeo relacional de objetos (ORM) para asociar las clases de C# con las tablas PostgreSQL en minúscula.
        /// </summary>
        /// <param name="modelBuilder">El modelador de base de datos EF Core.</param>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Mapeo detallado de la entidad Usuario a la tabla 'usuario'.
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.ToTable("usuario");
                entity.HasKey(e => e.UsuarioId);
                entity.Property(e => e.UsuarioId).HasColumnName("usuario_id");
                entity.Property(e => e.Nombre).HasColumnName("nombre").IsRequired();
                entity.Property(e => e.Pin).HasColumnName("pin").IsRequired();
                entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
                entity.HasMany(e => e.Cuentas).WithOne(e => e.Usuario).HasForeignKey(e => e.UsuarioId);
            });

            // Mapeo detallado de la entidad Cuenta a la tabla 'cuenta'.
            modelBuilder.Entity<Cuenta>(entity =>
            {
                entity.ToTable("cuenta");
                entity.HasKey(e => e.CuentaId);
                entity.Property(e => e.CuentaId).HasColumnName("cuenta_id");
                entity.Property(e => e.UsuarioId).HasColumnName("usuario_id");
                entity.Property(e => e.NumeroCuenta).HasColumnName("numero_cuenta").IsRequired();
                entity.Property(e => e.Saldo).HasColumnName("saldo");
                entity.Property(e => e.TipoCuenta).HasColumnName("tipo_cuenta").IsRequired();
                entity.Property(e => e.CupoSobregiro).HasColumnName("cupo_sobregiro");
                entity.Property(e => e.Estado).HasColumnName("estado");
                entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
                entity.HasMany(e => e.Auditorias).WithOne(e => e.Cuenta).HasForeignKey(e => e.CuentaId);
            });

            // Mapeo detallado de la entidad Auditoria a la tabla 'auditoria'.
            modelBuilder.Entity<Auditoria>(entity =>
            {
                entity.ToTable("auditoria");
                entity.HasKey(e => e.AuditoriaId);
                entity.Property(e => e.AuditoriaId).HasColumnName("auditoria_id");
                entity.Property(e => e.CuentaId).HasColumnName("cuenta_id");
                entity.Property(e => e.NumeroCuenta).HasColumnName("numero_cuenta").IsRequired();
                entity.Property(e => e.Tipo).HasColumnName("tipo").IsRequired();
                entity.Property(e => e.Monto).HasColumnName("monto");
                entity.Property(e => e.Descripcion).HasColumnName("descripcion").IsRequired();
                entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            });
        }

        /// <summary>
        /// Aplica configuraciones globales al contexto, inhabilitando el change tracking de EF.
        /// </summary>
        /// <param name="optionsBuilder">El constructor de opciones de configuración.</param>
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured) return;
            // Asegura que las consultas LINQ no realicen seguimiento de cambios, aumentando la velocidad de lectura.
            optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
        }
    }
}
