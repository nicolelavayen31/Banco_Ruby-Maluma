# @isc/backend — ATM Integrator API

Backend del sistema **ISC ATM Integrator**. API REST construida con NestJS 11, TypeORM, PostgreSQL y patrón CQRS.

## Documentación completa

Ver [README principal](../../README.md) en la raíz del monorepo.

## Comandos rápidos

```bash
# Desarrollo
bun run start:dev          # Iniciar con watch mode (SWC + type-check)

# Base de datos
bun run migration:run      # Ejecutar migraciones
bun run db:seed            # Poblar datos iniciales

# Testing
bun test                   # Tests unitarios (91 tests)
bun test ./test/conciliation.e2e-spec.ts  # Tests E2E (16 tests)

# Producción
bun run build              # Compilar con SWC
bun run start:prod         # Iniciar en producción
```

## API Docs (Swagger)

Una vez iniciado el servidor, acceder a:

```
http://localhost:7000/api/reference
```
