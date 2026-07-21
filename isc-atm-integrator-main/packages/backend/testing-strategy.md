# Estrategia de Testing — @isc/backend

## Estado Actual

| Tipo | Cantidad | Cobertura |
|------|----------|-----------|
| Unit tests (`*.spec.ts` en `src/`) | 0 | 0% |
| Swagger schema tests | 1 | Solo formato de respuesta |
| E2E tests | 1 | Outdated ("Hello World!") |
| **Total** | **2** | **~0%** |

## Pirámide de Testing Propuesta

```
        ╱╲
       ╱  ╲        E2E (5%)
      ╱    ╲       Flujos completos con supertest + Testcontainers
     ╱──────╲
    ╱        ╲     Integración (25%)
   ╱          ╲    Handlers con InMemoryRepositories + Pipes/Guards
  ╱────────────╲
 ╱              ╲  Unitarias (70%)
╱                ╲ Domain models, handlers mockeados, DTOs, shared core
```

> **Nota:** El proyecto usa PostgreSQL real. Para tests de integración se implementan
> **repositorios en memoria** (`InMemoryConciliationRepository`, etc.) que implementan
> las mismas interfaces que los repositorios TypeORM. Esto permite tests rápidos,
> aislados y sin depender de una base de datos.

---

## Fase 1: Pruebas Unitarias (75% — prioridad máxima)

### 1.1 Domain Models (testing puro, sin NestJS)

**Archivos destino:** `src/**/domain/*.ts`

| Modelo | Casos |
|--------|-------|
| `Conciliation` | Builder pattern: valores default, setters encadenados, build valida campos requeridos |
| `ConciliationMatch` | Builder pattern: amountDiff default 0, notas opcionales |
| `Result<T>` (`shared/core/result.ts`) | `success()`, `failure()`, `isSuccess()`, `isFailure()`, `getValue()`, `getError()` |

**Ejemplo de estructura:**
```typescript
// features/conciliation/domain/__tests__/conciliation.spec.ts
describe('Conciliation', () => {
    it('should build with default status "pending"', () => { ... })
    it('should build with provided summary', () => { ... })
    it('should chain setters', () => { ... })
})
```

### 1.2 Handlers (CQRS — mocked dependencies)

**Archivos destino:** `src/**/application/**/handler.ts`

Cada handler se testea con `@nestjs/testing` usando un `TestingModule` que provee SOLO el handler + mocks de sus dependencias.

| Handler | Dependencias a mockear | Casos clave |
|---------|----------------------|-------------|
| `LoginHandler` | `IAuthUserRepository`, `IAuthRefreshTokenRepository`, `JwtService`, `ConfigService` | Credenciales válidas, inválidas, usuario inactivo, error bcrypt |
| `RunConciliationHandler` | `ITransactionRepository`, `IConciliationRepository` | Matching correcto, solo bank_a, solo bank_b, discrepancies, sin transacciones |
| `ResolveDiscrepancyHandler` | `IConciliationRepository` | Match encontrado, match no encontrado, ya resuelto |
| `CreateTransactionHandler` | `ITransactionRepository`, `IBankAccountRepository` | Cuenta existe, cuenta no existe, monto válido |
| `GetConciliationsHandler` | `IConciliationRepository` | Paginación, lista vacía, filtros |

**Patrón:**
```typescript
// features/conciliation/application/commands/run-conciliation/__tests__/handler.spec.ts
describe('RunConciliationHandler', () => {
    let handler: RunConciliationHandler;
    let mockTxRepo: jest.Mocked<ITransactionRepository>;
    let mockConciliationRepo: jest.Mocked<IConciliationRepository>;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            providers: [
                RunConciliationHandler,
                { provide: TRANSACTION_REPOSITORY, useValue: mockTxRepo },
                { provide: CONCILIATION_REPOSITORY, useValue: mockConciliationRepo },
            ],
        }).compile();
        handler = module.get(RunConciliationHandler);
    });

    it('should match transactions with same correlationId', async () => { ... })
    it('should mark as discrepancy when amounts differ', async () => { ... })
    it('should mark as missing when bank_b tx not found', async () => { ... })
})
```

### 1.3 Response DTOs (formato de respuesta)

**Archivos destino:** `src/**/application/**/response.dto.ts`

Testear que los DTOs se construyen correctamente:
```typescript
it('ConciliationResponse should have data and metadata', () => {
    const resp = new ConciliationResponse(
        conciliationEntity,
        new ResponseMetadataBuilder().setStatusCode(201).build(),
    );
    expect(resp.data).toBeDefined();
    expect(resp.data.id).toBeDefined();
    expect(resp.metadata.statusCode).toBe(201);
})
```

### 1.4 Shared Core

| Archivo | Casos |
|---------|-------|
| `response/api-response.ts` | Serialización, wrapping de datos |
| `response/api-response-metadata.ts` | Metadata con y sin paginación |
| `response/api-response-error.ts` | Error con todos los campos |
| `response/api-response-metadata-builder.ts` | Builder pattern |
| `exceptions/exception-filter.ts` | Captura excepciones HTTP y no HTTP |
| `cache/cache-result.service.ts` | try/catch en get/set, Result éxito/fallo |

---

## Fase 2: Pruebas de Integración (25%)

### 2.1 InMemoryRepositories

En lugar de usar una base de datos real para tests, se implementan repositorios en memoria
que implementan las mismas interfaces que los TypeORM repositories. Esto permite probar
la lógica de los handlers con datos reales sin depender de PostgreSQL.

**Estructura:** `src/**/infrastructure/persistence/__tests__/in-memory/`

```typescript
// features/conciliation/infrastructure/persistence/__tests__/in-memory/conciliation.repository.ts
export class InMemoryConciliationRepository implements IConciliationRepository {
    private conciliations: Map<string, Conciliation> = new Map();
    private matches: Map<string, ConciliationMatch> = new Map();

    async createConciliation(conciliation: Conciliation): Promise<void> {
        this.conciliations.set(conciliation.id, conciliation);
    }

    async findById(id: string): Promise<ConciliationEntity | null> {
        const c = this.conciliations.get(id);
        if (!c) return null;
        // Mapear a ConciliationEntity si es necesario
        return toEntity(c);
    }

    async findAll(page: number, limit: number) { /* ... */ }
    // ...
}
```

**Repositorios a implementar:**

| Interfaz | InMemory |
|----------|----------|
| `IConciliationRepository` | `InMemoryConciliationRepository` |
| `ITransactionRepository` | `InMemoryTransactionRepository` |
| `IAuthUserRepository` | `InMemoryAuthUserRepository` |
| `IAuthRefreshTokenRepository` | `InMemoryAuthRefreshTokenRepository` |
| `IBankAccountRepository` | `InMemoryBankAccountRepository` |

### 2.2 Handlers con InMemoryRepositories

Los mismos handlers de la Fase 1 pero usando InMemoryRepositories en vez de mocks.
Esto prueba la integración real entre handler y repositorio sin DB.

```typescript
// features/conciliation/application/commands/run-conciliation/__tests__/handler.int-spec.ts
describe('RunConciliationHandler (integration)', () => {
    let handler: RunConciliationHandler;
    let txRepo: InMemoryTransactionRepository;
    let conciliationRepo: InMemoryConciliationRepository;

    beforeAll(async () => {
        txRepo = new InMemoryTransactionRepository();
        conciliationRepo = new InMemoryConciliationRepository();

        const module = await Test.createTestingModule({
            providers: [
                RunConciliationHandler,
                { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
                { provide: CONCILIATION_REPOSITORY, useValue: conciliationRepo },
            ],
        }).compile();
        handler = module.get(RunConciliationHandler);
    });

    beforeEach(() => {
        txRepo.reset();           // Limpiar datos entre tests
        conciliationRepo.reset();
    });

    it('should match transactions with same correlationId', async () => {
        const corrId = randomUUID();
        txRepo.seed([                                          // Poblar datos de prueba
            { id: randomUUID(), correlationId: corrId, sourceBank: 'bank_a', amount: 1000, /* ... */ },
            { id: randomUUID(), correlationId: corrId, sourceBank: 'bank_b', amount: 1000, /* ... */ },
        ]);
        const result = await handler.execute(new RunConciliationCommand());
        expect(result.data.summary.matched).toBe(1);
    });
});
```

### 2.3 Pipes, Guards y Filters

Probar que los ValidationPipes, PermissionsGuards y ExceptionFilters funcionan
correctamente con casos borde:

```typescript
// shared/core/__tests__/validation.pipe.int-spec.ts
describe('ValidationPipe', () => {
    it('should reject invalid UUIDs', async () => { ... })
    it('should accept valid CreateTransactionCommand', async () => { ... })
})
```

---

## Fase 3: Pruebas E2E (5%)

### 3.1 API Completa (con supertest + Testcontainers)

Para E2E se usa **Testcontainers** que levanta un PostgreSQL real en Docker para la
suite de tests, o un script que crea/usa una base de datos de tests dedicada.

```typescript
// test/api/conciliation.e2e-spec.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('Conciliation API (E2E)', () => {
    let app: INestApplication;
    let container: StartedPostgreSqlContainer;

    beforeAll(async () => {
        container = await new PostgreSqlContainer().start();
        
        process.env.DB_TYPE = 'postgres';
        process.env.DB_HOST = container.getHost();
        process.env.DB_PORT = String(container.getPort());
        process.env.DB_USERNAME = container.getUsername();
        process.env.DB_PASSWORD = container.getPassword();
        process.env.DB_NAME = container.getDatabase();

        const module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        
        app = module.createNestApplication();
        app.enableVersioning(versioningSetup);
        app.setGlobalPrefix('/api');
        app.use(cookieParser());
        csrfSetup(app);
        await app.init();

        // Ejecutar migraciones + seeds
        const dataSource = app.get(DataSource);
        await dataSource.runMigrations();
        // o ejecutar seed programáticamente
    });

    afterAll(async () => {
        await app.close();
        await container.stop();
    });

    it('POST /api/conciliation/run returns 201', async () => { ... })
    it('GET /api/conciliation returns paginated list', async () => { ... })
    it('PATCH /api/conciliation/:id/resolve/:matchId resolves', async () => { ... })
})
```

### 3.2 Flujo Cross-Module

```
Login → crear transacciones bank_a + bank_b → conciliar → verificar reporte → resolver discrepancia
```

---

## Resumen de Archivos a Crear

```
src/
├── features/
│   ├── conciliation/
│   │   ├── domain/__tests__/
│   │   │   ├── conciliation.spec.ts
│   │   │   └── conciliation-match.spec.ts
│   │   ├── application/commands/run-conciliation/__tests__/
│   │   │   ├── handler.spec.ts              (unit, mocked)
│   │   │   └── handler.int-spec.ts           (integration, InMemoryRepo)
│   │   ├── application/commands/resolve-discrepancy/__tests__/
│   │   │   ├── handler.spec.ts
│   │   │   └── handler.int-spec.ts
│   │   ├── application/queries/get-conciliations/__tests__/
│   │   │   └── handler.spec.ts
│   │   ├── application/queries/get-conciliation-report/__tests__/
│   │   │   └── handler.spec.ts
│   │   └── infrastructure/persistence/__tests__/in-memory/
│   │       └── conciliation.repository.ts
│   ├── auth/
│   │   ├── application/commands/login/__tests__/
│   │   │   └── handler.spec.ts
│   │   └── infrastructure/persistence/__tests__/in-memory/
│   │       ├── auth-user.repository.ts
│   │       └── auth-refresh-token.repository.ts
│   ├── transactions/
│   │   ├── application/commands/create-transaction/__tests__/
│   │   │   └── handler.spec.ts
│   │   └── infrastructure/persistence/__tests__/in-memory/
│   │       └── transaction.repository.ts
│   ├── accounts/
│   │   └── infrastructure/persistence/__tests__/in-memory/
│   │       └── bank-account.repository.ts
│   └── orders/
│       └── application/commands/create-order/__tests__/
│           └── handler.spec.ts
├── shared/
│   └── core/
│       └── __tests__/
│           ├── result.spec.ts
│           ├── api-response.spec.ts
│           ├── api-response-metadata.spec.ts
│           └── cache-result.service.spec.ts
└── test/
    └── api/
        ├── conciliation.e2e-spec.ts
        ├── auth.e2e-spec.ts
        └── transactions.e2e-spec.ts
```

## Comandos de Ejecución

```jsonc
// package.json scripts existentes (ya funcionan con bun --bun)
"test": "bun --bun jest",                    // Unit tests
"test:watch": "bun --bun jest --watch",      // Watch mode
"test:cov": "bun --bun jest --coverage",     // Coverage
"test:e2e": "bun --bun jest --config ./test/jest-e2e.json",  // E2E
```

## Orden de Implementación Sugerido

| Iteración | Contenido | Archivos | Esfuerzo |
|-----------|-----------|----------|----------|
| 1 | `Result<T>`, builders, domain models | 5 | Bajo |
| 2 | Response DTOs, metadata, exception filter | 8 | Bajo |
| 3 | **InMemoryRepositories** (base para integración) | 5 | Medio |
| 4 | LoginHandler (unit + int con InMemoryRepo) | 3 | Medio |
| 5 | RunConciliationHandler (unit + int con InMemoryRepo) | 3 | Alto |
| 6 | CreateTransactionHandler (unit + int con InMemoryRepo) | 3 | Medio |
| 7 | E2E: auth + conciliación completa (con Testcontainers) | 2 | Alto |
| 8 | Módulos restantes (orders, accounts, agreements) | 10+ | Medio |

**Total estimado:** ~40 archivos de test, ~1000-1400 casos.
**Valor temprano:** En la iteración 5 ya se puede testear el flujo completo de conciliación sin DB.
