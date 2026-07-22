using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using BancoCenit.Infrastructure;
using BancoCenit.Features;
using BancoCenit.Domain.Transferencias;

namespace BancoCenit.Extensions;

/// <summary>
/// Proporciona métodos de extensión para el registro y configuración de servicios en el contenedor de IoC.
/// Encapsula las dependencias de persistencia (Entity Framework) y los componentes de negocio.
/// </summary>
public static class ServiceExtensions
{
    /// <summary>
    /// Registra los servicios centrales de la aplicación, incluyendo el DbContext, filtros y adaptadores de infraestructura.
    /// </summary>
    /// <param name="services">La colección de servicios para inyección de dependencias.</param>
    /// <param name="configuration">La configuración de la aplicación para extraer las cadenas de conexión.</param>
    /// <returns>La instancia modificada de <see cref="IServiceCollection"/>.</returns>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Registra el contexto específico de base de datos 'BancoRubyDbContext' configurado para conectar con PostgreSQL.
        services.AddDbContext<BancoRubyDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("BancoRuby")));

        // Registra el DbContext base apuntando al contexto específico de Banco Ruby.
        // Esto permite inyectar 'DbContext' directamente en clases genéricas como filtros y controladores sin acoplamiento rígido.
        services.AddScoped<DbContext>(sp => sp.GetRequiredService<BancoRubyDbContext>());

        // Registra el filtro de autorización de cuentas con ciclo de vida Scoped (una instancia por cada solicitud HTTP).
        services.AddScoped<AccountAuthorizationFilter>();

        // Registra el gateway de transferencias para inyección en el slice de transferencia.
        services.AddScoped<ITransferenciaGateway, TransferenciaGateway>();

        return services;
    }
}
