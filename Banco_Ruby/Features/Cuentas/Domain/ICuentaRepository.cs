using BancoCenit.Features.Cuentas.Domain.Entities;
using FluentResults;

namespace BancoCenit.Features.Cuentas.Domain
{
    // Interfaz del repositorio de cuentas de Banco Ruby.
    // Define los mÃ©todos de acceso y actualizaciÃ³n de la entidad Cuenta, desacoplando el negocio de Entity Framework.
    public interface ICuentaRepository
    {
        // Recupera una cuenta de la base de datos por su nÃºmero Ãºnico de cuenta, validando que estÃ© activa.
        // numeroCuenta: NÃºmero de la cuenta bancaria.
        // cancellationToken: Token de cancelaciÃ³n.
        // Retorna: La cuenta encontrada envuelta en un Result, o un error si no se encuentra o estÃ¡ inactiva.
        Task<Result<Cuenta>> GetByNumeroCuentaAsync(string numeroCuenta, CancellationToken cancellationToken = default);

        // Sincroniza y persiste las modificaciones sobre los atributos de una cuenta en la base de datos.
        // cuenta: Entidad cuenta con datos actualizados.
        // cancellationToken: Token de cancelaciÃ³n.
        // Retorna: Una tarea asÃ­ncrona de actualizaciÃ³n.
        Task UpdateAsync(Cuenta cuenta, CancellationToken cancellationToken = default);

        // Agrega una auditorÃ­a de transacciÃ³n a la base de datos.
        // auditoria: Registro de auditorÃ­a.
        // cancellationToken: Token de cancelaciÃ³n.
        // Retorna: Una tarea asÃ­ncrona de guardado.
        Task RegistrarAuditoriaAsync(Auditoria auditoria, CancellationToken cancellationToken = default);

        // Guarda todos los cambios pendientes en el contexto de persistencia.
        // cancellationToken: Token de cancelaciÃ³n.
        // Retorna: Una tarea asÃ­ncrona de confirmaciÃ³n.
        Task SaveChangesAsync(CancellationToken cancellationToken = default);

        // Inicia una transacciÃ³n de base de datos de manera asÃ­ncrona.
        Task BeginTransactionAsync(CancellationToken cancellationToken = default);

        // Confirma la transacciÃ³n actual de base de datos de manera asÃ­ncrona.
        Task CommitTransactionAsync(CancellationToken cancellationToken = default);

        // Revierte la transacciÃ³n actual de base de datos de manera asÃ­ncrona.
        Task RollbackTransactionAsync(CancellationToken cancellationToken = default);

        // Obtiene una cuenta activa en base a su IntegradorAccountId del Integrador ATM.
        Task<Result<Cuenta>> GetByIntegradorAccountIdAsync(string integradorAccountId, CancellationToken cancellationToken = default);

        // Obtiene un registro de idempotencia por su identificador Ãºnico.
        Task<Idempotencia?> GetIdempotenciaAsync(string transactionId, CancellationToken cancellationToken = default);

        // Registra un nuevo token de idempotencia en la base de datos.
        Task RegistrarIdempotenciaAsync(Idempotencia idempotencia, CancellationToken cancellationToken = default);
    }
}
