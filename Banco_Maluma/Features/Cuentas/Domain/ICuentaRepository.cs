using BancoMaluma.Common;
using FluentResults;

namespace BancoMaluma.Features.Cuentas.Domain
{
    public interface ICuentaRepository
    {
        Task<Result<Cuenta>> GetByNumeroCuentaAsync(string numeroCuenta, CancellationToken cancellationToken = default);
        Task UpdateAsync(Cuenta cuenta, CancellationToken cancellationToken = default);
    }
}
