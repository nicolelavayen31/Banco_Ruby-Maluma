using BancoMaluma.Common;
using BancoMaluma.Infrastructure.Persistence;
using FluentResults;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BancoMaluma.Features.Cuentas.Application.Commands
{
    public class CrearCuentaCommandHandler : IRequestHandler<CrearCuentaCommand, Result<Cuenta>>
    {
        private readonly WriteDbContext _writeDb;

        public CrearCuentaCommandHandler(WriteDbContext writeDb)
        {
            _writeDb = writeDb;
        }

        public async Task<Result<Cuenta>> Handle(CrearCuentaCommand command, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(command.NumeroCuenta))
            {
                return Result.Fail<Cuenta>("El número de cuenta es obligatorio.");
            }

            bool cuentaExiste = await _writeDb.Cuentas.AnyAsync(c => c.NumeroCuenta == command.NumeroCuenta, cancellationToken);
            if (cuentaExiste)
            {
                return Result.Fail<Cuenta>($"La cuenta {command.NumeroCuenta} ya existe en el sistema.");
            }

            Usuario? usuario = await _writeDb.Usuarios
                .FirstOrDefaultAsync(u => u.Nombre == command.NombreUsuario, cancellationToken);

            if (usuario == null)
            {
                usuario = new Usuario
                {
                    Nombre = command.NombreUsuario,
                    Pin = command.Pin,
                    CreadoEn = DateTime.UtcNow
                };
                await _writeDb.Usuarios.AddAsync(usuario, cancellationToken);
                await _writeDb.SaveChangesAsync(cancellationToken);
            }

            var nuevaCuenta = new Cuenta
            {
                UsuarioId = usuario.UsuarioId,
                NumeroCuenta = command.NumeroCuenta,
                Saldo = command.SaldoInicial >= 0 ? command.SaldoInicial : 0m,
                TipoCuenta = TipoCuenta.Normalizar(command.TipoCuenta),
                CupoSobregiro = command.CupoSobregiro >= 0 ? command.CupoSobregiro : 0m,
                Estado = true,
                CreadoEn = DateTime.UtcNow
            };

            await _writeDb.Cuentas.AddAsync(nuevaCuenta, cancellationToken);

            var auditoria = new Auditoria
            {
                CuentaId = nuevaCuenta.CuentaId,
                NumeroCuenta = nuevaCuenta.NumeroCuenta,
                Tipo = "Apertura de Cuenta",
                Monto = nuevaCuenta.Saldo,
                Descripcion = $"Apertura de {nuevaCuenta.TipoCuenta} con saldo inicial de ${nuevaCuenta.Saldo:N2}.",
                CreadoEn = DateTime.UtcNow
            };

            await _writeDb.Auditoria.AddAsync(auditoria, cancellationToken);
            await _writeDb.SaveChangesAsync(cancellationToken);

            nuevaCuenta.Usuario = usuario;
            return Result.Ok(nuevaCuenta);
        }
    }
}
