using BancoMaluma.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BancoMaluma.Infrastructure.Extensions
{
    public static class DatabaseExtensions
    {
        public static IServiceCollection AddReadDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            string? connectionString = configuration.GetConnectionString("BancoMaluma");
            services.AddDbContext<ReadDbContext>(options =>
            {
                options.UseNpgsql(connectionString);
                options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
            });
            return services;
        }

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
