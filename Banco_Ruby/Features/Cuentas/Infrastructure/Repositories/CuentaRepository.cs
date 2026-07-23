using BancoCenit.Common;
using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Infrastructure;
using FluentResults;
using Microsoft.EntityFrameworkCore;

namespace BancoCenit.Features.Cuentas.Infrastructure.Repositories
{
    /// <summary>
    /// Repositorio de cuentas que implementa <see cref="ICuentaRepository"/> para Banco Ruby.
    /// Encapsula las operaciones del DbContext para persistir y consultar datos de cuentas.
    /// </summary>
    public class CuentaRepository : ICuentaRepository
    {
        private readonly BancoRubyDbContext _db;

        /// <summary>
        /// Inicializa una nueva instancia del repositorio de cuentas con su DbContext.
        /// </summary>
        /// <param name="db">El contexto de base de datos de Banco Ruby.</param>
        public CuentaRepository(BancoRubyDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Busca una cuenta activa por su número en la base de datos de forma asíncrona.
        /// </summary>
        public async Task<Result<Cuenta>> GetByNumeroCuentaAsync(string numeroCuenta, CancellationToken cancellationToken = default)
        {
            Cuenta? cuenta = await _db.Cuentas
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.NumeroCuenta == numeroCuenta && c.Estado, cancellationToken);

            if (cuenta == null)
            {
                return Result.Fail<Cuenta>($"Cuenta {numeroCuenta} no encontrada o inactiva en Banco Ruby.");
            }

            return Result.Ok(cuenta);
        }

        /// <summary>
        /// Registra la actualización de la cuenta en el contexto de base de datos.
        /// </summary>
        public async Task UpdateAsync(Cuenta cuenta, CancellationToken cancellationToken = default)
        {
            _db.Cuentas.Update(cuenta);
            await _db.SaveChangesAsync(cancellationToken);
        }

        /// <summary>
        /// Agrega una auditoría de transacción al contexto de base de datos.
        /// </summary>
        public async Task RegistrarAuditoriaAsync(Auditoria auditoria, CancellationToken cancellationToken = default)
        {
            await _db.Auditoria.AddAsync(auditoria, cancellationToken);
        }

        /// <summary>
        /// Confirma los cambios realizados en el contexto.
        /// </summary>
        public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
