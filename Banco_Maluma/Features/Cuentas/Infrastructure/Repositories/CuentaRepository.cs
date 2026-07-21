using BancoMaluma.Common;
using BancoMaluma.Features.Cuentas.Domain;
using BancoMaluma.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;

namespace BancoMaluma.Features.Cuentas.Infrastructure.Repositories
{
    public class CuentaRepository : ICuentaRepository
    {
        private readonly ReadDbContext _readDb;
        private readonly WriteDbContext _writeDb;

        public CuentaRepository(ReadDbContext readDb, WriteDbContext writeDb)
        {
            _readDb = readDb;
            _writeDb = writeDb;
        }

        public async Task<Result<Cuenta>> GetByNumeroCuentaAsync(string numeroCuenta, CancellationToken cancellationToken = default)
        {
            Cuenta? cuenta = await _readDb.Cuentas
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.NumeroCuenta == numeroCuenta && c.Estado, cancellationToken);

            if (cuenta == null)
            {
                return Result.Fail<Cuenta>($"Cuenta {numeroCuenta} no encontrada o inactiva en Banco Maluma.");
            }

            return Result.Ok(cuenta);
        }

        public async Task UpdateAsync(Cuenta cuenta, CancellationToken cancellationToken = default)
        {
            _writeDb.Cuentas.Update(cuenta);
            await Task.CompletedTask;
        }
    }
}
