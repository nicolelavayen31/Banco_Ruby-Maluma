using FluentResults;
using MediatR;
using System;
using System.Collections.Generic;

namespace BancoCenit.Features.Cuentas.Application.Queries
{
    // Registro DTO inmutable para proyectar los detalles esenciales de un movimiento del historial.
    public sealed record HistorialResumen(string Tipo, decimal Monto, string Descripcion, DateTime CreadoEn);

    // Respuesta que contiene la informaciÃ³n del titular y su historial completo de movimientos.
    public record HistorialResponse(string Titular, List<HistorialResumen> Historial);

    // Consulta MediatR para obtener el historial de transacciones de una cuenta.
    public record ObtenerHistorialQuery(string NumeroCuenta) : IRequest<Result<HistorialResponse>>;
}
