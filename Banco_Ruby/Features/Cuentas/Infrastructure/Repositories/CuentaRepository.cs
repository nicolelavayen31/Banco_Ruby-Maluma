using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Infrastructure;
using FluentResults;
using Microsoft.EntityFrameworkCore;

namespace BancoCenit.Features.Cuentas.Infrastructure.Repositories
{
    // Repositorio de cuentas que implementa ICuentaRepository para Banco Ruby.
    // Encapsula las operaciones del DbContext para persistir y consultar datos de cuentas.
    public class CuentaRepository : ICuentaRepository
    {
        private readonly BancoRubyDbContext _db;

        // Inicializa una nueva instancia del repositorio de cuentas con su DbContext.
        // db: El contexto de base de datos de Banco Ruby.
        public CuentaRepository(BancoRubyDbContext db)
        {
            _db = db;
        }

        // Busca una cuenta activa por su nÃºmero en la base de datos de forma asÃ­ncrona.
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

        // Registra la actualizaciÃ³n de la cuenta en el contexto de base de datos.
        public async Task UpdateAsync(Cuenta cuenta, CancellationToken cancellationToken = default)
        {
            _db.Cuentas.Update(cuenta);
            await _db.SaveChangesAsync(cancellationToken);
        }

        // Agrega una auditorÃ­a de transacciÃ³n al contexto de base de datos.
        public async Task RegistrarAuditoriaAsync(Auditoria auditoria, CancellationToken cancellationToken = default)
        {
            await _db.Auditoria.AddAsync(auditoria, cancellationToken);
        }

        // Confirma los cambios realizados en el contexto.
        public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            await _db.Database.BeginTransactionAsync(cancellationToken);
        }

        public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (_db.Database.CurrentTransaction != null)
            {
                await _db.Database.CommitTransactionAsync(cancellationToken);
            }
        }

        public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (_db.Database.CurrentTransaction != null)
            {
                await _db.Database.RollbackTransactionAsync(cancellationToken);
            }
        }

        public async Task<Result<Cuenta>> GetByIntegradorAccountIdAsync(string integradorAccountId, CancellationToken cancellationToken = default)
        {
            Cuenta? cuenta = await _db.Cuentas
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.IntegradorAccountId == integradorAccountId && c.Estado, cancellationToken);

            if (cuenta == null)
            {
                return Result.Fail<Cuenta>($"Cuenta con IntegradorAccountId {integradorAccountId} no encontrada o inactiva en Banco Ruby.");
            }

            return Result.Ok(cuenta);
        }

        public async Task<Idempotencia?> GetIdempotenciaAsync(string transactionId, CancellationToken cancellationToken = default)
        {
            return await _db.Idempotencias.FirstOrDefaultAsync(i => i.TransactionId == transactionId, cancellationToken);
        }

        public async Task RegistrarIdempotenciaAsync(Idempotencia idempotencia, CancellationToken cancellationToken = default)
        {
            await _db.Idempotencias.AddAsync(idempotencia, cancellationToken);
        }
    }
}
