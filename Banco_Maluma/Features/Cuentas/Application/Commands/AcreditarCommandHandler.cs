using BancoMaluma.Common;
using BancoMaluma.Features.Cuentas.Domain;
using BancoMaluma.Infrastructure.Persistence;
using FluentResults;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BancoMaluma.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Manejador de MediatR para procesar la acreditación de fondos en cuentas de Banco Maluma.
    /// Escribe y persiste de forma transaccional el saldo en la base de datos de escritura.
    /// </summary>
    public class AcreditarCommandHandler : IRequestHandler<AcreditarCommand, Result<OperacionResponse>>
    {
        private readonly WriteDbContext _writeDb;

        /// <summary>
        /// Inicializa una nueva instancia de la clase <see cref="AcreditarCommandHandler"/> con el DbContext de escritura.
        /// </summary>
        /// <param name="writeDb">Contexto de persistencia de escritura CQRS.</param>
        public AcreditarCommandHandler(WriteDbContext writeDb)
        {
            _writeDb = writeDb;
        }

        /// <summary>
        /// Procesa la solicitud del comando, validando la cuenta de destino y sumando el saldo de manera transaccional.
        /// </summary>
        /// <param name="command">Detalles de la transacción a acreditar.</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>Resultado exitoso con el saldo actualizado, o un objeto de fallo con la causa.</returns>
        public async Task<Result<OperacionResponse>> Handle(AcreditarCommand command, CancellationToken cancellationToken)
        {
            // Evita abonos inválidos con montos negativos o nulos.
            if (command.Monto <= 0)
            {
                return Result.Fail<OperacionResponse>("El monto debe ser mayor a cero.");
            }

            // Obtiene la cuenta destino cargando sus datos de seguimiento.
            Cuenta? cuenta = await _writeDb.Cuentas
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.NumeroCuenta == command.NumeroCuentaDestino && c.Estado, cancellationToken);

            // Valida que la cuenta destino exista en el sistema.
            if (cuenta == null)
            {
                return Result.Fail<OperacionResponse>($"Cuenta destino {command.NumeroCuentaDestino} no encontrada o inactiva en Banco Maluma.");
            }

            // Incrementa el saldo disponible de la cuenta en el ledger de la base de datos.
            cuenta.Saldo += command.Monto;

            // Instancia el registro de auditoría con la descripción del origen de los fondos.
            var auditoria = new Auditoria
            {
                CuentaId = cuenta.CuentaId,
                NumeroCuenta = cuenta.NumeroCuenta,
                Tipo = "Transferencia Interbancaria Recibida",
                Monto = command.Monto,
                Descripcion = $"Abono recibido vía Integrador ATM desde {command.BancoOrigen ?? "Banco Externo"} (Cuenta {command.CuentaOrigen ?? "Desconocida"}). Concepto: {command.Concepto ?? "Transferencia Interbancaria"}",
                CreadoEn = DateTime.UtcNow
            };

            // Guarda el log en la tabla de auditoría de forma asíncrona.
            await _writeDb.Auditoria.AddAsync(auditoria, cancellationToken);
            
            // Persiste todos los cambios de forma atómica en PostgreSQL.
            await _writeDb.SaveChangesAsync(cancellationToken);

            string msg = $"Transferencia acreditada exitosamente en Banco Maluma para la cuenta {cuenta.NumeroCuenta}. Nuevo saldo: ${cuenta.Saldo:N2}.";
            return Result.Ok(new OperacionResponse(msg, cuenta.Saldo));
        }
    }
}
