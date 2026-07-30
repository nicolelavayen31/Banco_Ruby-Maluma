using BancoCenit.Features.Cuentas.Domain;
using Dapper;
using FluentResults;
using MediatR;
using Microsoft.Extensions.Configuration;
using Npgsql;
using System.Threading;
using System.Threading.Tasks;

namespace BancoCenit.Features.Cuentas.Application.Queries
{
    /// <summary>
    /// Manejador de MediatR para consultar el saldo de una cuenta activa en Banco Ruby utilizando Dapper (alto rendimiento).
    /// </summary>
    public class ObtenerSaldoQueryHandler : IRequestHandler<ObtenerSaldoQuery, Result<SaldoResponse>>
    {
        private readonly string _connectionString;

        public ObtenerSaldoQueryHandler(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("BancoRuby") 
                ?? throw new System.InvalidOperationException("Cadena de conexión 'BancoRuby' no configurada.");
        }

        public async Task<Result<SaldoResponse>> Handle(ObtenerSaldoQuery query, CancellationToken cancellationToken)
        {
            using (NpgsqlConnection connection = new NpgsqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT c.saldo AS Saldo, u.nombre AS TitularNombre
                    FROM cuenta c
                    INNER JOIN usuario u ON c.usuario_id = u.usuario_id
                    WHERE c.numero_cuenta = @NumeroCuenta AND c.estado = true";

                DbResult? result = await connection.QueryFirstOrDefaultAsync<DbResult>(sql, new { NumeroCuenta = query.NumeroCuenta });

                if (result == null)
                {
                    return Result.Fail<SaldoResponse>($"Cuenta {query.NumeroCuenta} no encontrada o inactiva.");
                }

                return Result.Ok(new SaldoResponse(result.Saldo, result.TitularNombre));
            }
        }

        private sealed class DbResult
        {
            public decimal Saldo { get; set; }
            public string TitularNombre { get; set; } = string.Empty;
        }
    }
}
