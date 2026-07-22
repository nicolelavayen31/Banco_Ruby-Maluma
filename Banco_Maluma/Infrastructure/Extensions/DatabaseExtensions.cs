using BancoMaluma.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BancoMaluma.Infrastructure.Extensions
{
    /// <summary>
    /// Métodos de extensión para configurar y añadir los contextos CQRS segregados (Lectura/Escritura) al contenedor IoC.
    /// </summary>
    public static class DatabaseExtensions
    {
        /// <summary>
        /// Configura y registra el contexto de base de datos optimizado para lectura.
        /// Desactiva el seguimiento de cambios (Change Tracking) de forma global para mejorar el consumo de CPU y memoria.
        /// </summary>
        /// <param name="services">Contenedor de servicios de IoC.</param>
        /// <param name="configuration">Propiedades de configuración del host.</param>
        /// <returns>La instancia modificada de <see cref="IServiceCollection"/>.</returns>
        public static IServiceCollection AddReadDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            string? connectionString = configuration.GetConnectionString("BancoMaluma");
            services.AddDbContext<ReadDbContext>(options =>
            {
                options.UseNpgsql(connectionString);
                
                // Desactiva el tracking de EF de manera global en este contexto.
                // Todas las consultas LINQ a ReadDbContext se ejecutarán por defecto sin almacenar copias de estado.
                options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
            });
            return services;
        }

        /// <summary>
        /// Configura y registra el contexto de base de datos para operaciones de escritura y persistencia transaccional.
        /// </summary>
        /// <param name="services">Contenedor de servicios de IoC.</param>
        /// <param name="configuration">Propiedades de configuración del host.</param>
        /// <returns>La instancia modificada de <see cref="IServiceCollection"/>.</returns>
        public static IServiceCollection AddWriteDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            string? connectionString = configuration.GetConnectionString("BancoMaluma");
            services.AddDbContext<WriteDbContext>(options =>
            {
                options.UseNpgsql(connectionString);
            });
            return services;
        }
    }
}
