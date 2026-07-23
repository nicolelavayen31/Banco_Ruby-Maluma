using FluentResults;
using MediatR;
using System;
using System.Collections.Generic;

namespace BancoCenit.Features.Cuentas.Application.Queries
{
    /// <summary>
    /// Registro DTO inmutable para proyectar los detalles esenciales de un movimiento del historial.
    /// </summary>
    public sealed record HistorialResumen(string Tipo, decimal Monto, string Descripcion, DateTime CreadoEn);

    /// <summary>
    /// Respuesta que contiene la información del titular y su historial completo de movimientos.
    /// </summary>
    public record HistorialResponse(string Titular, List<HistorialResumen> Historial);

    /// <summary>
    /// Consulta MediatR para obtener el historial de transacciones de una cuenta.
    /// </summary>
    public record ObtenerHistorialQuery(string NumeroCuenta) : IRequest<Result<HistorialResponse>>;
}
