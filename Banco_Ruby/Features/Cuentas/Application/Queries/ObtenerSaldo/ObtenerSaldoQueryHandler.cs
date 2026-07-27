using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Domain;
using FluentResults;
using MediatR;

namespace BancoCenit.Features.Cuentas.Application.Queries
{
    /// <summary>
    /// Manejador de MediatR para consultar el saldo de una cuenta activa en Banco Ruby.
    /// </summary>
    public class ObtenerSaldoQueryHandler : IRequestHandler<ObtenerSaldoQuery, Result<SaldoResponse>>
    {
        private readonly ICuentaRepository _repository;

        public ObtenerSaldoQueryHandler(ICuentaRepository repository)
        {
            _repository = repository;
        }

        public async Task<Result<SaldoResponse>> Handle(ObtenerSaldoQuery query, CancellationToken cancellationToken)
        {
            var cuentaResult = await _repository.GetByNumeroCuentaAsync(query.NumeroCuenta, cancellationToken);
            if (cuentaResult.IsFailed)
            {
                return Result.Fail<SaldoResponse>(cuentaResult.Errors);
            }

            Cuenta cuenta = cuentaResult.Value;
            string titularNombre = cuenta.Usuario?.Nombre ?? string.Empty;

            return Result.Ok(new SaldoResponse(cuenta.Saldo, titularNombre));
        }
    }
}
