# Conexión PostgreSQL para Banco_Ruby

## Script de creación
Usa el archivo `postgresql_schema.sql` para crear la base de datos y las tablas del proyecto.

El script hace lo siguiente:
- crea la base de datos `Banco Ruby`
- crea las tablas `usuario`, `cuenta` y `auditoria`
- crea un usuario base de ejemplo con `La Bestia`
- crea una cuenta inicial con número `1234567812345678`
- registra el saldo inicial en `auditoria`

## Cadena de conexión
Guarda la conexión en `Banco_Ruby/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "BancoRuby": "Host=localhost;Port=5432;Database=\"Banco Ruby\";Username=postgres;Password=123456"
  }
}
```

Ajusta el usuario y la contraseña según tu instalación de PostgreSQL.

## Cómo usarla en el proyecto
Si quieres usar Entity Framework Core, instala estos paquetes:

```powershell
dotnet add Banco_Ruby/BancoRuby.csproj package Npgsql.EntityFrameworkCore.PostgreSQL
```

En `Program.cs` puedes agregar:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<BancoRubyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("BancoRuby")));

var app = builder.Build();
```

Y en tu `DbContext`:

```csharp
using Microsoft.EntityFrameworkCore;

public class BancoRubyDbContext : DbContext
{
    public BancoRubyDbContext(DbContextOptions<BancoRubyDbContext> options) : base(options)
    {
    }

    public DbSet<Cuenta> Cuentas { get; set; }
    public DbSet<Movimiento> Movimientos { get; set; }
    public DbSet<Transferencia> Transferencias { get; set; }
    public DbSet<Auditoria> Auditoria { get; set; }
}
```

## Auditoría de movimientos
Cada vez que el sistema inserte un registro en `movimientos` o `transferencias`, el trigger correspondiente guardará una fila en `auditoria` con:
- `cuenta_id`
- `entidad`
- `accion`
- `datos` en formato JSON
- `fecha`

Esto garantiza que cualquier acción del usuario quede registrada.
