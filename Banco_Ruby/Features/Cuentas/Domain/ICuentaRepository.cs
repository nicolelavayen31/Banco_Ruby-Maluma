using BancoCenit.Common;
using FluentResults;

namespace BancoCenit.Features.Cuentas.Domain
{
    /// <summary>
    /// Interfaz del repositorio de cuentas de Banco Ruby.
    /// Define los métodos de acceso y actualización de la entidad Cuenta, desacoplando el negocio de Entity Framework.
    /// </summary>
    public interface ICuentaRepository
    {
        /// <summary>
        /// Recupera una cuenta de la base de datos por su número único de cuenta, validando que esté activa.
        /// </summary>
        /// <param name="numeroCuenta">Número de la cuenta bancaria.</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>La cuenta encontrada envuelta en un Result, o un error si no se encuentra o está inactiva.</returns>
        Task<Result<Cuenta>> GetByNumeroCuentaAsync(string numeroCuenta, CancellationToken cancellationToken = default);

        /// <summary>
        /// Sincroniza y persiste las modificaciones sobre los atributos de una cuenta en la base de datos.
        /// </summary>
        /// <param name="cuenta">Entidad cuenta con datos actualizados.</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>Una tarea asíncrona de actualización.</returns>
        Task UpdateAsync(Cuenta cuenta, CancellationToken cancellationToken = default);

        /// <summary>
        /// Agrega una auditoría de transacción a la base de datos.
        /// </summary>
        /// <param name="auditoria">Registro de auditoría.</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>Una tarea asíncrona de guardado.</returns>
        Task RegistrarAuditoriaAsync(Auditoria auditoria, CancellationToken cancellationToken = default);

        /// <summary>
        /// Guarda todos los cambios pendientes en el contexto de persistencia.
        /// </summary>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>Una tarea asíncrona de confirmación.</returns>
        Task SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
