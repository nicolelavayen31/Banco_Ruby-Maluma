using BancoMaluma.Common;
using BancoMaluma.Features.Cuentas.Domain;
using BancoMaluma.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;

namespace BancoMaluma.Features.Cuentas.Infrastructure.Repositories
{
    /// <summary>
    /// Repositorio de cuentas que implementa <see cref="ICuentaRepository"/>.
    /// Implementa segregación de lectura/escritura (CQRS) inyectando <see cref="ReadDbContext"/> y <see cref="WriteDbContext"/>.
    /// </summary>
    public class CuentaRepository : ICuentaRepository
    {
        private readonly ReadDbContext _readDb;
        private readonly WriteDbContext _writeDb;

        /// <summary>
        /// Inicializa una nueva instancia de la clase <see cref="CuentaRepository"/> con los contextos segregados.
        /// </summary>
        /// <param name="readDb">Contexto optimizado para consultas rápidas de lectura (AsNoTracking).</param>
        /// <param name="writeDb">Contexto de base de datos para operaciones de cambio de estado y persistencia.</param>
        public CuentaRepository(ReadDbContext readDb, WriteDbContext writeDb)
        {
            _readDb = readDb;
            _writeDb = writeDb;
        }

        /// <summary>
        /// Busca una cuenta activa por su número en el contexto de lectura de forma asíncrona.
        /// </summary>
        /// <param name="numeroCuenta">Número de cuenta de 16 dígitos.</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>Objeto Result conteniendo la Cuenta o un error descriptivo.</returns>
        public async Task<Result<Cuenta>> GetByNumeroCuentaAsync(string numeroCuenta, CancellationToken cancellationToken = default)
        {
            // Ejecuta la consulta cargando el usuario mediante JOIN en el DbContext de Lectura.
            Cuenta? cuenta = await _readDb.Cuentas
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.NumeroCuenta == numeroCuenta && c.Estado, cancellationToken);

            if (cuenta == null)
            {
                return Result.Fail<Cuenta>($"Cuenta {numeroCuenta} no encontrada o inactiva en Banco Maluma.");
            }

            return Result.Ok(cuenta);
        }

        /// <summary>
        /// Registra la entidad cuenta para actualización en el DbContext de Escritura.
        /// </summary>
        /// <param name="cuenta">Instancia de la entidad modificada.</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>Tarea completada.</returns>
        public async Task UpdateAsync(Cuenta cuenta, CancellationToken cancellationToken = default)
        {
            // Marca el estado de la entidad como modificado en la base de datos de escritura
            // para que sea procesada en el SaveChanges del manejador o endpoint correspondiente.
            _writeDb.Cuentas.Update(cuenta);
            await Task.CompletedTask;
        }
    }
}
