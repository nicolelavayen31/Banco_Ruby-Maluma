using BancoMaluma.Common;
using Microsoft.EntityFrameworkCore;

namespace BancoMaluma.Infrastructure.Persistence
{
    public class ReadDbContext : DbContext
    {
        public ReadDbContext(DbContextOptions<ReadDbContext> options) : base(options)
        {
        }

        public DbSet<Usuario> Usuarios => Set<Usuario>();
        public DbSet<Cuenta> Cuentas => Set<Cuenta>();
        public DbSet<Auditoria> Auditoria => Set<Auditoria>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
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

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured) return;
            optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
        }
    }
}
