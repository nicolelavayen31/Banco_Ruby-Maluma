using BancoMaluma.Common;
using FluentResults;
using MediatR;

namespace BancoMaluma.Features.Cuentas.Application.Commands
{
    /// <summary>
    /// DTO que representa la solicitud del usuario para la creación física de una cuenta bancaria.
    /// </summary>
    /// <param name="NombreUsuario">Nombre completo del cliente.</param>
    /// <param name="Pin">Código PIN para autenticación.</param>
    /// <param name="NumeroCuenta">Número de cuenta de 16 dígitos propuesto.</param>
    /// <param name="SaldoInicial">Saldo monetario inicial para la apertura.</param>
    /// <param name="TipoCuenta">Clasificación de la cuenta (Ahorros / Corriente).</param>
    /// <param name="CupoSobregiro">Monto límite autorizado para sobregirar (solo cuentas corrientes).</param>
    public record CrearCuentaRequest(string NombreUsuario, string Pin, string NumeroCuenta, decimal SaldoInicial, string TipoCuenta, decimal CupoSobregiro);

    /// <summary>
    /// Comando MediatR que solicita la creación de una cuenta en el sistema de Banco Maluma.
    /// </summary>
    /// <param name="NombreUsuario">Nombre completo del usuario titular.</param>
    /// <param name="Pin">PIN de acceso cifrado.</param>
    /// <param name="NumeroCuenta">Número de cuenta de 16 dígitos.</param>
    /// <param name="SaldoInicial">Saldo inicial de la cuenta.</param>
    /// <param name="TipoCuenta">Tipo de cuenta (Corriente o Ahorros).</param>
    /// <param name="CupoSobregiro">Monto de sobregiro.</param>
    public record CrearCuentaCommand(string NombreUsuario, string Pin, string NumeroCuenta, decimal SaldoInicial, string TipoCuenta, decimal CupoSobregiro) : IRequest<Result<Cuenta>>;
}
