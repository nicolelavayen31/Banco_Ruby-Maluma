# @isc/backend — Agent Instructions

## Stack
NestJS 11 + TypeORM + PostgreSQL + CQRS + SWC builder.

## Package manager
**bun**. Never use npm/pnpm/yarn.

## Critical commands

| Action | Command |
|--------|---------|
| Dev server | `bun run start:dev` |
| Build | `bun run build` |
| Type-check | `bun run build` (SWC w/ typeCheck=true) |
| Lint | `bun run lint` |
| Format | `bun run format` |
| Unit tests | `bun test src/ test/` (Bun runner) |
| E2E tests | `bun run test:e2e` (Jest, config at `test/jest-e2e.json`) |
| Coverage | `bun run test:cov` (Jest) |
| Migrations | `bun run migration:run` / `migration:revert` (builds first) |
| Seeds | `bun run seed` (builds first) |
| In-memory Redis | `bun run start:cache` |

`bun --bun` prefix required for nest/typeorm/eslint commands (scripts handle this).

## Pre-commit
Husky → lint-staged → prettier + eslint --fix on staged `*.ts`.

## Architecture

### DDD + CQRS per feature (`src/features/<name>/`)
```
application/    commands/queries/events handlers, DTOs
domain/         domain models, repo interfaces (Symbol injection tokens)
infrastructure/ TypeORM entities, repo implementations
presentation/   controllers
<name>.module.ts
```

### Shared patterns
- `Result<T,E>` — success/failure result type (`src/shared/core/result.ts`)
- `ApiResponse<T>` — standardized JSON wrapper for all API responses
- InMemory repositories for tests (implement same interfaces as TypeORM repos)
- `nestjs-cls` (CLS) for async-local-storage context

### Path aliases
`@shared/*`, `@core/*`, `@cqrs/*`, `@features/*`, `@infrastructure/*`

## Testing quirks
- Unit: `bun test` (Bun runner), file pattern `src/**/*.spec.ts`
- E2E: Jest via `test/jest-e2e.json`, file pattern `test/*.e2e-spec.ts`
- E2E config has `moduleNameMapper` for path aliases
- Integration tests use InMemory repos, no Testcontainers yet
- Existing E2E tests (conciliations) cover full handler pipelines
- `testing-strategy.md` has full test plan

## Swagger
- Plugin in nest-cli.json: DTO suffix `.dto.ts`, controller suffix `.controller.ts`
- API reference at `GET /api/reference` (Scalar UI)

## Code style
- Prettier: singleQuote, trailingComma all, tabWidth 4, no tabs
- ESLint: `no-explicit-any` off, `no-floating-promises` warn, `no-unsafe-argument` warn

## Security
- JWT bearer + API key (`x-api-key` header) via Passport strategies
- CSRF protection, Helmet middleware
- Global validation pipe (class-validator)

## Environment
- `.env` gitignored, actual `.env` exists locally
- PostgreSQL + Redis required for dev server
- Default port: 7000
