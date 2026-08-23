# Guía de Integración con BanNet (para los bancos)

Este documento explica, desde el punto de vista de un banco integrado
(por ejemplo Banco Ruby o Banco Fuego), **para qué sirve cada endpoint
de BanNet, cómo usarlo, y qué notificaciones (webhooks) va a recibir**
durante una transferencia interbancaria.

No es una guía de arquitectura interna de BanNet — es la referencia que
un equipo de banco necesita para integrarse correctamente.

---

## 1. ¿Qué es BanNet?

BanNet es el integrador que conecta a los bancos participantes (Banco
Ruby, Banco Fuego, etc.) para procesar transferencias interbancarias.
BanNet:

- Mantiene el balance interno de la cuenta que cada banco tiene dentro
  de BanNet (no el balance del cliente final, ese vive en el sistema
  propio de cada banco).
- Orquesta el ciclo de vida de cada transferencia (creación, pendiente,
  confirmación, y — si hace falta — reverso).
- Concilia periódicamente que ambas patas de cada transferencia hayan
  llegado al mismo resultado, y notifica a cada banco el resultado de
  esa conciliación.

Cada transferencia entre dos bancos genera **dos transacciones** dentro
de BanNet, una por cada lado (`debit` en el banco origen, `credit` en el
banco destino), unidas por un `correlationId` compartido.

---

## 2. Autenticación

Todas las llamadas de un banco hacia BanNet usan una API key propia,
entregada por BanNet al momento de dar de alta el acuerdo (agreement)
con ese banco.

```
X-Api-Key: <tu-api-key>
x-api-version: 1
```

No hace falta obtener ni enviar un token CSRF: la protección CSRF de
BanNet se salta automáticamente cuando la petición incluye
`X-Api-Key` (esa protección es solo para el panel administrativo de
BanNet, que usa sesión/JWT).

---

## 3. Endpoints que un banco SÍ debe usar

| Método | Ruta | Para qué |
| --- | --- | --- |
| `POST` | `/api/transactions/transfer` | Iniciar una transferencia hacia otro banco. |
| `PATCH` | `/api/transactions/:id/state` | Confirmar, cancelar o reversar **tu propia pata** de una transferencia. |
| `GET` | `/api/transactions/:id` | Consultar el estado actual de una de tus transacciones. |
| `GET` | `/api/transactions` | Listar tus transacciones (paginado). |
| `GET` | `/api/accounts/:id` | Consultar el balance de tu cuenta dentro de BanNet. |

### 3.1 Iniciar una transferencia

```bash
curl -X POST http://localhost:1000/api/transactions/transfer \
  -H "X-Api-Key: <tu-api-key>" \
  -H "x-api-version: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "from_account_id": "<cuenta BanNet origen>",
    "to_account_id": "<cuenta BanNet destino>",
    "amount": 5000,
    "description": "Transferencia interbancaria",
    "source_bank": "bank_a",
    "correlation_id": "<uuid opcional, generado por ti>",
    "from_inner_account": "<referencia de tu cliente origen, opcional>",
    "to_inner_account": "<referencia del cliente destino, opcional>"
  }'
```

Campos:

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| `from_account_id` | Sí | ID de la cuenta BanNet de origen (la tuya, si eres quien envía). |
| `to_account_id` | Sí | ID de la cuenta BanNet de destino. |
| `amount` | Sí | Monto en centavos. |
| `description` | Sí | Descripción libre. |
| `source_bank` | No (default `bank_a`) | Marca lógica para distinguir las dos patas — no es el nombre del banco, es solo `bank_a`/`bank_b`. |
| `correlation_id` | No | Si no lo envías, BanNet genera uno. Úsalo para correlacionar tu transacción con la de la contraparte. |
| `from_inner_account` / `to_inner_account` | No | Referencias de cuenta de tus propios clientes. BanNet las reenvía en el webhook pero **no las guarda** en su base de datos — son solo para que ambos bancos identifiquen a qué cliente aplicar el movimiento. |

Respuesta: un arreglo con las dos transacciones creadas (`debit` y
`credit`), ambas en estado `pending`.

### 3.2 Confirmar, cancelar o reversar tu pata

```bash
curl -X PATCH http://localhost:1000/api/transactions/<id-de-tu-transaccion>/state \
  -H "X-Api-Key: <tu-api-key>" \
  -H "x-api-version: 1" \
  -H "Content-Type: application/json" \
  -d '{"state": "success"}'
```

`state` puede ser `success`, `cancelled` o `reversed`, según en qué
estado esté actualmente tu transacción (ver la sección 5). Este es el
mismo endpoint para las tres acciones — no hay un endpoint distinto
para "confirmar" versus "reversar".

---

## 4. Endpoint que un banco NO debe usar: conciliación

`POST /api/conciliation/run` (y sus lecturas relacionadas,
`GET /api/conciliation`, `GET /api/conciliation/:id`) son un **proceso
interno de BanNet**, hoy ejecutado manualmente por un operador de
BanNet (no automático ni programado). Ningún banco dispara la
conciliación — ustedes solo reciben su resultado a través del webhook
descrito en la sección 6.

> **Nota de seguridad:** al día de hoy el permiso de las API keys de
> banco no bloquea técnicamente estas rutas (una API key de banco
> puede llamarlas sin recibir un 403). Es una restricción de proceso,
> no todavía una restricción técnica reforzada — no se debe invocar
> aunque el sistema no lo impida activamente hoy.

Igualmente, `PATCH /api/conciliation/:id/resolve/:matchId` (resolver una
discrepancia) es una acción de un operador de BanNet, no de un banco.

> **Nota operativa:** cada corrida de conciliación reevalúa **todas**
> las transacciones históricas de ambos bancos, no solo las creadas
> desde la última corrida. Esto significa que tu banco puede recibir un
> webhook con `conciliationState: "match"` para una transferencia que
> ya se había cerrado hace tiempo, simplemente porque un operador volvió
> a correr la conciliación. No es un error ni indica un cambio real en
> esa transacción.
>
> Cada webhook incluye el `transactionId` de tu propia transacción
> (sección 6.1), así que la forma correcta de manejar esto no es
> "ignorar sin más" sino llevar un registro propio de qué
> `transactionId` ya cerraste. Al recibir un webhook, busca ese
> `transactionId` en tu registro: si ya lo tienes marcado como cerrado,
> el webhook es un no-op por diseño — no necesitas volver a decidir
> nada. Esto también te cubre frente a reintentos de entrega del
> webhook en general, no solo frente a re-corridas de conciliación.

---

## 5. Ciclo de vida de una transacción

Cada transacción (cada pata de una transferencia) pasa por estos
estados:

| Estado | Significado | ¿Quién lo dispara? |
| --- | --- | --- |
| `pending` | Se creó la transferencia; tu banco todavía no ha confirmado su movimiento interno. | BanNet, al crear la transferencia. |
| `success` | Confirmaste que tu movimiento interno (débito/crédito al cliente) se realizó. BanNet ya actualizó tu balance interno en BanNet. | Tu banco, vía `PATCH .../state`. |
| `cancelled` | Decidiste no proceder mientras estabas en `pending` (por ejemplo, tu proceso interno falló). No afecta tu balance BanNet porque nunca se aplicó. | Tu banco, vía `PATCH .../state`, solo desde `pending`. |
| `reversed` | Deshiciste una transacción que ya estaba en `success` — BanNet revierte el movimiento de tu balance interno (el débito vuelve a sumarse, el crédito vuelve a restarse). | Tu banco, vía `PATCH .../state`, solo desde `success`. |

Transiciones válidas:

```
pending  -> success
pending  -> cancelled
success  -> reversed
```

`cancelled` y `reversed` son estados finales — no hay transición de
vuelta. Importante: **no puedes pasar directamente de `pending` a
`reversed`** — si tu transacción nunca llegó a `success`, la forma
correcta de cerrarla es `cancelled`.

---

## 6. El webhook que recibes de BanNet

BanNet te notifica por webhook (POST a la URL configurada en tu
agreement, con la autenticación acordada) en tres momentos:

1. Al crear la transferencia (tu pata queda en `pending`).
2. Cada vez que cambia el estado de tu propia transacción (incluida la
   confirmación que tú mismo disparaste).
3. Cuando BanNet corre la conciliación y evalúa el resultado de tu
   transacción.

### 6.1 Estructura del payload

```json
{
  "transactionId": "f5e8e89d-c1ae-4cd3-aec7-f04cd226d13f",
  "amount": 8000,
  "operation": "transfer",
  "type": "debit",
  "state": "success",
  "description": "Transferencia interbancaria",
  "bankAccountId": "550e8400-e29b-41d4-a716-446655440201",
  "correlationId": "550e8400-e29b-41d4-a716-446655449001",
  "sourceBank": "bank_a",
  "fromInnerAccount": "ruby-client-account-1001",
  "toInnerAccount": "fuego-client-account-2040",
  "conciliationState": "pending",
  "occurredOn": "2026-08-21T10:08:04.166Z"
}
```

> **Importante:** el payload **no incluye un "tipo de evento"
> explícito** — no vas a recibir algo como `"eventType": "..."` en el
> cuerpo del webhook. Para saber qué pasó, combina dos campos:
> `state` (el estado actual de tu propia transacción) y
> `conciliationState` (el resultado de la última conciliación sobre
> ella). Tampoco recibes el estado de la transacción de la contraparte
> directamente — solo el tuyo; usa `correlationId` para saber a qué
> transferencia pertenece.

### 6.2 Valores de `conciliationState`

| Valor | Cuándo aparece |
| --- | --- |
| `pending` | Conciliación todavía no ha evaluado esta transacción en su estado actual (incluye el webhook inicial al crear la transferencia y el webhook de cada cambio de estado que tú mismo disparas). |
| `match` | La última conciliación confirmó que tu transacción y la de la contraparte llegaron a un resultado consistente. |
| `mismatch` | La última conciliación encontró una inconsistencia entre las dos patas — se requiere tu acción. |

### 6.3 Qué hacer según lo que recibas

| `state` recibido | `conciliationState` recibido | Qué significa | Qué debes hacer |
| --- | --- | --- | --- |
| `pending` | `pending` | Se está iniciando una transferencia que involucra tu cuenta. | Procesar tu movimiento interno (débito/crédito al cliente) y luego llamar `PATCH .../state` con `success`, o `cancelled` si no puedes proceder. |
| `success` / `cancelled` / `reversed` | `pending` | Es el eco de un cambio de estado que tú mismo disparaste; conciliación aún no lo ha evaluado. | Ninguna acción — es solo confirmación. |
| `success` (o `cancelled`/`reversed`) | `match` | Conciliación confirmó que ambas patas llegaron a un resultado consistente. | Ninguna acción — la transferencia quedó cerrada correctamente. |
| cualquiera | `mismatch` | La contraparte no llegó al mismo resultado que tú (por ejemplo, tú confirmaste pero el otro banco nunca respondió, o los montos no coinciden). | Si tu transacción está en `success`, reversa tu movimiento interno de cliente y luego llama `PATCH .../state` con `reversed`. Si tu transacción sigue en `pending` y ya no vas a proceder, ciérrala con `PATCH .../state` con `cancelled`. |

---

## 7. Casos de uso

Estos casos ya fueron verificados manualmente contra BanNet — ver
`i_conciliation-use-cases-verification.md` para los `curl` completos y
los balances reales. Aquí se listan los mismos pasos, marcando con 🔔
las notificaciones (webhooks) que BanNet dispara en cada uno.

### Caso 1 — Ambos bancos responden

1. Banco Ruby llama `POST /api/transactions/transfer` (Ruby → Fuego).
   🔔 Ruby recibe `state: pending, conciliationState: pending`.
   🔔 Fuego recibe `state: pending, conciliationState: pending`.
2. Ruby confirma su débito: `PATCH .../state {"state":"success"}`.
   🔔 Ruby recibe `state: success, conciliationState: pending`.
3. Fuego confirma su crédito: `PATCH .../state {"state":"success"}`.
   🔔 Fuego recibe `state: success, conciliationState: pending`.
4. Un operador de BanNet corre la conciliación. Ambas patas están en
   `success` → `matched`.
   🔔 Ruby recibe `state: success, conciliationState: match`.
   🔔 Fuego recibe `state: success, conciliationState: match`.
5. **Flujo cerrado.** Ningún banco necesita hacer nada más.

### Caso 2 — Un banco no responde

1. Banco Fuego llama `POST /api/transactions/transfer` (Fuego → Ruby).
   🔔 Fuego recibe `state: pending, conciliationState: pending`.
   🔔 Ruby recibe `state: pending, conciliationState: pending`.
2. Fuego confirma su débito: `PATCH .../state {"state":"success"}`.
   🔔 Fuego recibe `state: success, conciliationState: pending`.
3. Ruby está caído — nunca confirma. Su transacción sigue en `pending`.
4. Un operador de BanNet corre la conciliación. Fuego está en `success`,
   Ruby sigue en `pending` → `state_mismatch`.
   🔔 Fuego recibe `state: success, conciliationState: mismatch`.
   🔔 Ruby recibe `state: pending, conciliationState: mismatch`.
5. Fuego, al recibir el `mismatch`, reversa su movimiento interno de
   cliente y llama `PATCH .../state {"state":"reversed"}`.
   🔔 Fuego recibe `state: reversed, conciliationState: pending`.
6. Ruby, cuando vuelve a estar disponible y ve (por su propia cuenta, o
   porque el `mismatch` sigue vigente en la siguiente conciliación) que
   nunca procedió, cierra su lado con
   `PATCH .../state {"state":"cancelled"}`.
   🔔 Ruby recibe `state: cancelled, conciliationState: pending`.
7. Un operador de BanNet corre la conciliación de nuevo. `reversed` +
   `cancelled` → ninguno de los dos tiene dinero aplicado → `matched`.
   🔔 Fuego recibe `state: reversed, conciliationState: match`.
   🔔 Ruby recibe `state: cancelled, conciliationState: match`.
8. **Flujo cerrado.**

### Caso 3 — Ninguno de los dos bancos responde

1. Banco Ruby llama `POST /api/transactions/transfer` (Ruby → Fuego).
   🔔 Ruby recibe `state: pending, conciliationState: pending`.
   🔔 Fuego recibe `state: pending, conciliationState: pending`.
2. Ninguno de los dos confirma — ambas transacciones siguen `pending`.
3. Un operador de BanNet corre la conciliación. Ambas patas siguen
   `pending` → esto **no se da por cerrado automáticamente** (en un
   entorno real, esto solo debería pasar si ambos bancos están caídos)
   → `state_mismatch`.
   🔔 Ruby recibe `state: pending, conciliationState: mismatch`.
   🔔 Fuego recibe `state: pending, conciliationState: mismatch`.
4. Ambos bancos, al ver que ninguno de los dos avanzó, cierran su lado
   con `PATCH .../state {"state":"cancelled"}`.
   🔔 Ruby recibe `state: cancelled, conciliationState: pending`.
   🔔 Fuego recibe `state: cancelled, conciliationState: pending`.
5. Un operador de BanNet corre la conciliación de nuevo. `cancelled` +
   `cancelled` → `matched`.
   🔔 Ruby recibe `state: cancelled, conciliationState: match`.
   🔔 Fuego recibe `state: cancelled, conciliationState: match`.
6. **Flujo cerrado.**
