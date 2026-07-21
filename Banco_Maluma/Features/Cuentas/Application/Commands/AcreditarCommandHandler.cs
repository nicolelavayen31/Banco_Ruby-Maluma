using BancoMaluma.Common;
using BancoMaluma.Features.Cuentas.Domain;
using BancoMaluma.Infrastructure.Persistence;
using FluentResults;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BancoMaluma.Features.Cuentas.Application.Commands
{
    public class AcreditarCommandHandler : IRequestHandler<AcreditarCommand, Result<OperacionResponse>>
    {
        private readonly WriteDbContext _writeDb;

        public AcreditarCommandHandler(WriteDbContext writeDb)
        {
            _writeDb = writeDb;
        }

        public async Task<Result<OperacionResponse>> Handle(AcreditarCommand command, CancellationToken cancellationToken)
        {
            if (command.Monto <= 0)
            {
                return Result.Fail<OperacionResponse>("El monto debe ser mayor a cero.");
            }

            Cuenta? cuenta = await _writeDb.Cuentas
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.NumeroCuenta == command.NumeroCuentaDestino && c.Estado, cancellationToken);

            if (cuenta == null)
            {
                return Result.Fail<OperacionResponse>($"Cuenta destino {command.NumeroCuentaDestino} no encontrada o inactiva en Banco Maluma.");
            }

            cuenta.Saldo += command.Monto;

            var auditoria = new Auditoria
            {
                CuentaId = cuenta.CuentaId,
                NumeroCuenta = cuenta.NumeroCuenta,
                Tipo = "Transferencia Interbancaria Recibida",
                Monto = command.Monto,
                Descripcion = $"Abono recibido vía Integrador ATM desde {command.BancoOrigen ?? "Banco Externo"} (Cuenta {command.CuentaOrigen ?? "Desconocida"}). Concepto: {command.Concepto ?? "Transferencia Interbancaria"}",
                CreadoEn = DateTime.UtcNow
            };

            await _writeDb.Auditoria.AddAsync(auditoria, cancellationToken);
            await _writeDb.SaveChangesAsync(cancellationToken);

            string msg = $"Transferencia acreditada exitosamente en Banco Maluma para la cuenta {cuenta.NumeroCuenta}. Nuevo saldo: ${cuenta.Saldo:N2}.";
            return Result.Ok(new OperacionResponse(msg, cuenta.Saldo));
        }
    }
}
