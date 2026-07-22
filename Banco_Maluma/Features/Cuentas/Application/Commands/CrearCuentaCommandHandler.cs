using BancoMaluma.Common;
using BancoMaluma.Infrastructure.Persistence;
using FluentResults;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BancoMaluma.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// Manejador de MediatR para procesar la creación de nuevas cuentas bancarias en Banco Maluma.
    /// Valida duplicados, gestiona usuarios de forma idempotente y persiste las entidades.
    /// </summary>
    public class CrearCuentaCommandHandler : IRequestHandler<CrearCuentaCommand, Result<Cuenta>>
    {
        private readonly WriteDbContext _writeDb;

        /// <summary>
        /// Inicializa una nueva instancia de la clase <see cref="CrearCuentaCommandHandler"/> con el DbContext de escritura.
        /// </summary>
        /// <param name="writeDb">Contexto de base de datos de escritura.</param>
        public CrearCuentaCommandHandler(WriteDbContext writeDb)
        {
            _writeDb = writeDb;
        }

        /// <summary>
        /// Procesa de forma asíncrona la creación de la cuenta y su usuario asociado.
        /// </summary>
        /// <param name="command">Detalles de la nueva cuenta.</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>La cuenta creada en caso de éxito, o un error detallado si ya existe.</returns>
        public async Task<Result<Cuenta>> Handle(CrearCuentaCommand command, CancellationToken cancellationToken)
        {
            // Valida de forma defensiva que se envíe un número de cuenta.
            if (string.IsNullOrWhiteSpace(command.NumeroCuenta))
            {
                return Result.Fail<Cuenta>("El número de cuenta es obligatorio.");
            }

            // Evita registrar cuentas duplicadas en el sistema de base de datos.
            bool cuentaExiste = await _writeDb.Cuentas.AnyAsync(c => c.NumeroCuenta == command.NumeroCuenta, cancellationToken);
            if (cuentaExiste)
            {
                return Result.Fail<Cuenta>($"La cuenta {command.NumeroCuenta} ya existe en el sistema.");
            }

            // Busca si ya existe un titular registrado con ese nombre en la base de datos local.
            Usuario? usuario = await _writeDb.Usuarios
                .FirstOrDefaultAsync(u => u.Nombre == command.NombreUsuario, cancellationToken);

            // Si el titular no existe, lo crea dinámicamente de manera atómica para asociarlo a la cuenta.
            if (usuario == null)
            {
                usuario = new Usuario
                {
                    Nombre = command.NombreUsuario,
                    Pin = command.Pin,
                    CreadoEn = DateTime.UtcNow
                };
                await _writeDb.Usuarios.AddAsync(usuario, cancellationToken);
                await _writeDb.SaveChangesAsync(cancellationToken); // Genera la PK auto-incremental.
            }

            // Instancia la nueva cuenta asignándole el UsuarioId recién obtenido.
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

            // Registra el evento histórico de la apertura e ingreso de fondos en auditoría.
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
            
            // Confirma los cambios físicamente de forma transaccional.
            await _writeDb.SaveChangesAsync(cancellationToken);

            nuevaCuenta.Usuario = usuario;
            return Result.Ok(nuevaCuenta);
        }
    }
}
