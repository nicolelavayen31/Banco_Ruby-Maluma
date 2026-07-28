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
        var origen = new Cuenta { NumeroCuenta = "1001", Estado = true };
        origen.Acreditar(1000m);
        var destino = new Cuenta { NumeroCuenta = "2002", Estado = true };
        destino.Acreditar(50m);
        var request = new TransferenciaRequest("1001", "2002", 200m);

        var resultado = await TransferenciaService.EjecutarTransferenciaAsync(origen, destino, request, () => throw new TimeoutException("timeout"));

        Assert.False(resultado.IsSuccess);
        Assert.Equal(1000m, origen.Saldo);
        Assert.Equal(50m, destino.Saldo);
        Assert.Contains("fallida", resultado.Error, StringComparison.OrdinalIgnoreCase);
    }
}
