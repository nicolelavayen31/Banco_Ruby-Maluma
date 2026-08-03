using BancoCenit.Features.Cuentas.Domain;
using Dapper;
using FluentResults;
using MediatR;
using Microsoft.Extensions.Configuration;
using Npgsql;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace BancoCenit.Features.Cuentas.Application.Queries
{
    // Manejador de MediatR para consultar el historial de transacciones utilizando Dapper (alto rendimiento).
    public class ObtenerHistorialQueryHandler : IRequestHandler<ObtenerHistorialQuery, Result<HistorialResponse>>
    {
        private readonly string _connectionString;

        public ObtenerHistorialQueryHandler(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("BancoRuby") 
                ?? throw new InvalidOperationException("Cadena de conexiÃ³n 'BancoRuby' no configurada.");
        }

        public async Task<Result<HistorialResponse>> Handle(ObtenerHistorialQuery query, CancellationToken cancellationToken)
        {
            using (NpgsqlConnection connection = new NpgsqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT u.nombre AS TitularNombre, a.tipo AS Tipo, a.monto AS Monto, a.descripcion AS Descripcion, a.creado_en AS CreadoEn
                    FROM cuenta c
                    INNER JOIN usuario u ON c.usuario_id = u.usuario_id
                    LEFT JOIN auditoria a ON c.cuenta_id = a.cuenta_id
                    WHERE c.numero_cuenta = @NumeroCuenta AND c.estado = true
                    ORDER BY a.creado_en DESC";

                IEnumerable<DbRow> rows = await connection.QueryAsync<DbRow>(sql, new { NumeroCuenta = query.NumeroCuenta });
                
                // Si no hay filas, significa que la cuenta no existe o estÃ¡ inactiva
                List<DbRow> rowsList = rows.ToList();
                if (rowsList.Count == 0)
                {
                    return Result.Fail<HistorialResponse>($"Cuenta {query.NumeroCuenta} no encontrada o inactiva.");
                }

                // El nombre del titular es el mismo en todas las filas
                string titularNombre = rowsList[0].TitularNombre;

                // Mapeamos las filas a la estructura final de HistorialResumen.
                // Excluimos las filas donde no hay auditorÃ­as (es decir, Tipo es nulo debido al LEFT JOIN).
                List<HistorialResumen> historial = rowsList
                    .Where(r => r.Tipo != null)
                    .Select(r => new HistorialResumen(r.Tipo!, r.Monto!.Value, r.Descripcion!, r.CreadoEn!.Value))
                    .ToList();

                return Result.Ok(new HistorialResponse(titularNombre, historial));
            }
        }

        private sealed class DbRow
        {
            public string TitularNombre { get; set; } = string.Empty;
            public string? Tipo { get; set; }
            public decimal? Monto { get; set; }
            public string? Descripcion { get; set; }
            public DateTime? CreadoEn { get; set; }
        }
    }
}
