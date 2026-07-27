using BancoCenit.Features.Cuentas.Domain.Entities;
using BancoCenit.Features.Cuentas.Domain.Services;
using BancoCenit.Features.Cuentas.Application.DTOs;
using Xunit;

namespace BancoRuby.Tests;

public class TransferenciaDomainTests
{
    [Fact]
    public async Task ReversaElMontoCuandoElDestinoFalla()
    {
        var origen = new Cuenta { NumeroCuenta = "1001", Saldo = 1000m, Estado = true };
        var destino = new Cuenta { NumeroCuenta = "2002", Saldo = 50m, Estado = true };
        var request = new TransferenciaRequest("1001", "2002", 200m);

        var resultado = await TransferenciaService.EjecutarTransferenciaAsync(origen, destino, request, () => throw new TimeoutException("timeout"));

        Assert.False(resultado.IsSuccess);
        Assert.Equal(1000m, origen.Saldo);
        Assert.Equal(50m, destino.Saldo);
        Assert.Contains("fallida", resultado.Error, StringComparison.OrdinalIgnoreCase);
    }
}
