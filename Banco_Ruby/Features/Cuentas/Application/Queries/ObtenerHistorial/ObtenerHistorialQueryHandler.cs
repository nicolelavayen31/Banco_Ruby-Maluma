using BancoCenit.Common;
using BancoCenit.Features.Cuentas.Domain;
using BancoCenit.Infrastructure;
using FluentResults;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace BancoCenit.Features.Cuentas.Application.Queries
{
    /// <summary>
    /// Manejador de MediatR para consultar el historial de transacciones de una cuenta activa en Banco Ruby.
    /// </summary>
    public class ObtenerHistorialQueryHandler : IRequestHandler<ObtenerHistorialQuery, Result<HistorialResponse>>
    {
        private readonly ICuentaRepository _repository;
        private readonly BancoRubyDbContext _db;

        public ObtenerHistorialQueryHandler(ICuentaRepository repository, BancoRubyDbContext db)
        {
            _repository = repository;
            _db = db;
        }

        public async Task<Result<HistorialResponse>> Handle(ObtenerHistorialQuery query, CancellationToken cancellationToken)
        {
            var cuentaResult = await _repository.GetByNumeroCuentaAsync(query.NumeroCuenta, cancellationToken);
            if (cuentaResult.IsFailed)
            {
                return Result.Fail<HistorialResponse>(cuentaResult.Errors);
            }

            Cuenta cuenta = cuentaResult.Value;

            // Extrae los registros de auditoría filtrados por CuentaId ordenados descendentemente.
            List<HistorialResumen> auditorias = await _db.Auditoria
                .AsNoTracking()
                .Where(a => a.CuentaId == cuenta.CuentaId)
                .OrderByDescending(a => a.CreadoEn)
                .Select(a => new HistorialResumen(a.Tipo, a.Monto, a.Descripcion, a.CreadoEn))
                .ToListAsync(cancellationToken);

            string titularNombre = cuenta.Usuario?.Nombre ?? string.Empty;

            return Result.Ok(new HistorialResponse(titularNombre, auditorias));
        }
    }
}
