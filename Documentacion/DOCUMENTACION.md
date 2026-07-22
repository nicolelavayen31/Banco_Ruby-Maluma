# ANÁLISIS PROFUNDO: TransferenciaService.cs

Este documento cumple con las 10 fases de análisis exhaustivo solicitado, utilizando como pieza central el archivo más crítico de las reglas de negocio del sistema bancario: `TransferenciaService.cs`.

---

## FASE 1: CONTEXTO GENERAL

**Qué problema intenta resolver este archivo:**
Este archivo se encarga de gestionar la operación de transferencia de dinero de una cuenta a otra. Su objetivo es asegurar que la transacción ocurra solo si se cumplen las reglas financieras correctas (como tener fondos suficientes) y manejar la reversión (rollback) del dinero si la transferencia a un banco externo falla.

**En qué parte del proyecto participa:**
Se encuentra en la capa de **Dominio** (`Domain/Transferencias`). Es el corazón de la aplicación.

**Responsabilidad:**
Orquestar la lógica de negocio pura de la transferencia y coordinar el envío de la misma mediante una abstracción, sin depender directamente de bases de datos o servicios web.

**Con qué otros archivos normalmente se comunica:**
- Con las entidades `Cuenta` (para modificar sus saldos).
- Con `TransferenciaRequest` (DTO que trae los datos de la solicitud).
- Con `ITransferenciaGateway` o servicios de infraestructura (indirectamente, a través del delegado `Func<Task>`).

**Patrón de diseño utilizado:**
- **Result Pattern:** Retorna un objeto `TransferenciaExecutionResult` para indicar éxito o error sin lanzar excepciones para el flujo normal.
- **Inyección de dependencias por parámetros (Method Injection):** Recibe el comportamiento del gateway externo en la variable `enviarTransferencia` (un delegado/función).

**Principio SOLID que aplica:**
- **SRP (Single Responsibility):** Solo hace transferencias. No guarda en base de datos ni imprime en consola.
- **OCP (Open/Closed):** Al recibir la función `enviarTransferencia`, este archivo está cerrado a la modificación pero abierto a la extensión (podemos pasarle distintos gateways sin tocar el código).

**Patrón arquitectónico:**
Se enmarca dentro de un enfoque **Domain-Driven Design (DDD) simplificado**, actuando como un *Domain Service* (Servicio de Dominio).

**Conocimientos necesarios para entenderlo:**
- C# y Programación Orientada a Objetos (POO).
- Delegados y Expresiones Lambda (`Func<Task>`).
- Programación asíncrona (`async/await`).
- Tipos de referencia vs Tipos de valor.

**Analogía sencilla:**
Imagina que eres el **Gerente de la Bóveda (TransferenciaService)**. Viene un cliente pidiendo enviar $100 a otro banco. Tú revisas que tenga al menos $100 en su caja (Validación). Luego, restas esos $100 de su caja y los sumas temporalmente en una "zona de envío" (Modificación). Finalmente, le das el dinero a un **mensajero blindado (la función enviarTransferencia)**. Si el mensajero entrega el dinero, todo es un éxito. Si el camión blindado se descompone (Excepción), tú devuelves los $100 a la caja original del cliente (Reversión o Rollback). Tú no manejas el camión, solo orquestas el movimiento del dinero de forma segura.

---

## FASE 2: EXPLICACIÓN LÍNEA POR LÍNEA

**Línea 1**
```csharp
using BancoCenit.Common;
```
**Explicación técnica:** Importa el espacio de nombres (namespace) `BancoCenit.Common` para que este archivo pueda reconocer clases que viven allí, como `Cuenta` y `TransferenciaRequest`.
**Por qué fue escrita:** Para evitar escribir la ruta completa cada vez que se usa una clase compartida (ej. `BancoCenit.Common.Cuenta origen`).
**Qué ocurriría si se elimina:** El compilador mostrará errores diciendo "The type or namespace name 'Cuenta' could not be found".
**Qué ocurriría si cambia:** Si apuntara a un namespace equivocado, perderíamos acceso a las clases requeridas.
**Concepto aprendido:** *Namespaces / using*.
**Cómo funciona internamente:** Le dice al compilador en qué "carpetas lógicas" buscar las clases que no pertenecen al namespace actual.
**Relación:** Prepara el terreno para las dependencias del archivo.
**Analogía:** Es como decirle a tu asistente: "A partir de ahora, todo lo que te pida buscar sobre herramientas, búscalo en el armario del pasillo (BancoCenit.Common)".

**Línea 3**
```csharp
namespace BancoCenit.Domain.Transferencias;
```
**Explicación técnica:** Declara el espacio de nombres al que pertenece este archivo (file-scoped namespace).
**Por qué fue escrita:** Para organizar lógicamente la clase y evitar colisiones de nombres si existiera otro `TransferenciaService` en el proyecto.
**Qué ocurriría si se elimina:** Las clases se definirían en el espacio de nombres "global", causando desorden y posibles conflictos de nombres.
**Concepto aprendido:** *Namespaces*. Agrupación lógica de código.
**Analogía:** Es ponerle la etiqueta "Departamento de Transferencias" a este documento.

**Línea 5**
```csharp
public sealed class TransferenciaExecutionResult
```
**Explicación técnica:** Declara una clase pública que no puede ser heredada (`sealed`).
**Por qué fue escrita:** Para encapsular el resultado de una transferencia (si fue exitosa o no, y por qué). Ser `sealed` optimiza el rendimiento y evita que otros la modifiquen mediante herencia.
**Qué ocurriría si no existiera:** Tendríamos que usar variables sueltas (como `bool` y `string`) o lanzar Excepciones, que son lentas y difíciles de rastrear para control de flujo.
**Concepto aprendido:** *Clase*, *Modificador sealed*, *Patrón Result*.
**Analogía:** Es como un sobre de respuesta cerrado herméticamente que te dice "Sí se pudo" o "No se pudo, y esta es la razón". Al estar sellado (`sealed`), nadie puede crear versiones falsificadas del sobre.

**Línea 7 y 8**
```csharp
    public bool IsSuccess { get; }
    public string? Error { get; }
```
**Explicación técnica:** Propiedades públicas de solo lectura (`get;`). `Error` acepta valores nulos (`?`).
**Por qué fueron escritas:** Para almacenar el estado del resultado de forma inmutable (nadie puede cambiarlos después de crearlos).
**Concepto aprendido:** *Propiedades de solo lectura*, *Nullable Types*.
**Analogía:** Son los dos casilleros en el sobre de respuesta. Uno tiene un "Check" (éxito) y el otro el motivo del rechazo. Como están bajo un plástico duro (solo lectura), nadie puede borrarlos.

**Línea 10 al 14**
```csharp
    private TransferenciaExecutionResult(bool isSuccess, string? error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }
```
**Explicación técnica:** Constructor privado. Asigna los valores a las propiedades.
**Por qué fue escrito:** Al ser `private`, prohíbe que cualquier persona fuera de esta clase instancie `TransferenciaExecutionResult` directamente usando la palabra reservada `new`.
**Qué ocurriría si fuera público:** Cualquiera podría crear resultados sin sentido, como `new TransferenciaExecutionResult(true, "Hubo un error fatal")`.
**Concepto aprendido:** *Constructor privado*, *Encapsulamiento*.
**Analogía:** Es una máquina expendedora sin ranura de monedas. No puedes sacar productos tú mismo, tienes que pedírselo a los botones especiales (Factory Methods).

**Línea 16 y 17**
```csharp
    public static TransferenciaExecutionResult Success() => new(true, null);
    public static TransferenciaExecutionResult Failure(string error) => new(false, error);
```
**Explicación técnica:** Métodos de fábrica (Factory Methods) estáticos. Devuelven instancias pre-configuradas de la clase.
**Por qué fueron escritos:** Garantizan que un "Éxito" siempre se cree sin error, y un "Fallo" siempre tenga un mensaje de error. `=>` es una Expresión Lambda para acortar el código.
**Concepto aprendido:** *Factory Pattern*, *Static Methods*, *Expresiones Lambda*.
**Analogía:** Son los únicos dos botones oficiales de la máquina. El botón verde (`Success`) te da el sobre de éxito, y el rojo (`Failure`) te pide la justificación para darte el sobre de rechazo.

**Línea 20**
```csharp
public static class TransferenciaService
```
**Explicación técnica:** Declara una clase estática. No se puede instanciar con `new` y no guarda estado.
**Por qué fue escrita:** Al ser estática, sus métodos pueden ser llamados directamente (ej. `TransferenciaService.Ejecutar...`). Actúa como una calculadora, entra un dato y sale un resultado.
**Concepto aprendido:** *Clase Estática*, *Stateless (Sin Estado)*.
**Analogía:** Es como una ventanilla de atención al cliente. No te llevas la ventanilla a tu casa (`new`), simplemente vas, haces tu trámite y te vas.

**Línea 22 al 26**
```csharp
    public static async Task<TransferenciaExecutionResult> EjecutarTransferenciaAsync(
        Cuenta origen,
        Cuenta destino,
        TransferenciaRequest request,
        Func<Task> enviarTransferencia)
```
**Explicación técnica:** Define la firma del método principal. Es asíncrono (`async Task`) y retorna el `Result`. Recibe las dos cuentas, la petición, y una función delegada llamada `enviarTransferencia` que no devuelve nada pero es asíncrona (`Task`).
**Por qué fue escrita:** Para realizar la transferencia en segundo plano (asíncrono) sin bloquear el hilo principal. Inyecta la dependencia del servicio externo a través de `Func<Task>`.
**Concepto aprendido:** *Async/Await*, *Delegados (Func)*, *Inyección por parámetro*.
**Analogía:** Es el manual de instrucciones del gerente. Dice: "Para hacer este trabajo, necesito al cliente que envía (origen), al que recibe (destino), el formulario (request) y el teléfono del mensajero blindado (enviarTransferencia)".

**Línea 28 al 31**
```csharp
        if (request.Monto <= 0)
        {
            return TransferenciaExecutionResult.Failure("El monto debe ser mayor que cero.");
        }
```
**Explicación técnica:** Condicional. Evalúa si el monto a transferir es negativo o cero y corta la ejecución usando "Early Return" (Retorno temprano).
**Por qué fue escrita:** Evita transferencias inválidas (nadie puede transferir $0 o números negativos, lo que generaría dinero mágico).
**Concepto aprendido:** *Validaciones*, *Guard Clauses (Cláusulas de guardia)*.
**Analogía:** El guardia de seguridad en la puerta del banco comprobando que no estés intentando depositar billetes de monopolio o hacer un depósito vacío.

**Línea 33 al 36**
```csharp
        if (request.Monto > origen.Saldo)
        {
            return TransferenciaExecutionResult.Failure("Fondos insuficientes en la cuenta origen.");
        }
```
**Explicación técnica:** Evalúa que el saldo de la cuenta origen cubra el monto de la solicitud.
**Por qué fue escrita:** Protege la regla de negocio más crítica: no permitir sobregiros.
**Analogía:** Revisar si tienes suficiente dinero en tu billetera antes de pagar la cuenta del restaurante.

**Línea 38 y 39**
```csharp
        decimal saldoOrigenAntes = origen.Saldo;
        decimal saldoDestinoAntes = destino.Saldo;
```
**Explicación técnica:** Guarda en variables temporales locales el estado actual de los saldos.
**Por qué fue escrita:** Para crear un "Punto de guardado" (Savepoint) en memoria por si algo sale mal más adelante, poder restaurar los datos (Rollback).
**Concepto aprendido:** *Variables locales*, *Memoria Stack vs Heap*, *Tipos por valor*. (El `decimal` guarda una copia del valor, no una referencia a la cuenta).
**Analogía:** Es tomarle una fotografía a la caja registradora antes de empezar a mover los billetes, por si te equivocas y necesitas dejarla exactamente como estaba.

**Línea 41 y 42**
```csharp
        origen.Saldo -= request.Monto;
        destino.Saldo += request.Monto;
```
**Explicación técnica:** Operadores de asignación compuesta. Resta el monto a la cuenta origen y se lo suma a la cuenta destino.
**Por qué fue escrita:** Es la ejecución matemática de la transferencia en la memoria de la aplicación (RAM).
**Qué ocurriría si cambia el orden:** No pasaría nada algorítmicamente, pero semánticamente siempre sacamos el dinero antes de entregarlo.
**Analogía:** Pasar los billetes físicos de tu mano izquierda (origen) a tu mano derecha (destino).

**Línea 44**
```csharp
        try
        {
```
**Explicación técnica:** Inicia un bloque de control de errores. El código dentro de las llaves será vigilado.
**Por qué fue escrita:** Porque el siguiente paso (llamar al banco externo) es altamente propenso a fallar (se cae el internet, el otro banco rechaza, etc.).
**Concepto aprendido:** *Manejo de Excepciones (try-catch)*.

**Línea 46**
```csharp
            await enviarTransferencia();
```
**Explicación técnica:** Ejecuta el delegado (la función externa) de manera asíncrona esperando que termine (`await`).
**Por qué fue escrita:** Es el momento en que se conecta con el "mundo exterior" para hacer real la transacción.
**Concepto aprendido:** *Await*, *Ejecución de Delegados*.
**Analogía:** Es cuando el mensajero blindado finalmente sale del banco y tú te quedas esperando en la puerta (`await`) a que te llame confirmando que llegó. Mientras esperas, puedes hacer otras cosas menores, pero la operación general está en pausa.

**Línea 47**
```csharp
            return TransferenciaExecutionResult.Success();
```
**Explicación técnica:** Si la línea anterior no generó errores, se llega aquí y se retorna el botón verde (éxito).
**Por qué fue escrita:** Finaliza el flujo de la transferencia exitosa.

**Línea 49 al 54**
```csharp
        catch (Exception ex)
        {
            origen.Saldo = saldoOrigenAntes;
            destino.Saldo = saldoDestinoAntes;
            return TransferenciaExecutionResult.Failure($"Transacción fallida... Detalle: {ex.Message}");
        }
```
**Explicación técnica:** Atrapa cualquier error (`Exception ex`) que haya ocurrido en el bloque `try`. Ejecuta el Rollback (asigna los saldos previos) y retorna el botón rojo (fallo) con el mensaje de error.
**Por qué fue escrita:** Protege la consistencia de los datos. Si el sistema externo falló, nuestro cliente no debe perder su dinero temporalmente.
**Concepto aprendido:** *Manejo de Excepciones (catch)*, *Rollback Manual*, *Interpolación de strings (`$""`)*.
**Analogía:** El mensajero blindado choca y te llama (la excepción). Tú, viendo la fotografía que tomaste antes (las variables `Antes`), devuelves los billetes a la caja izquierda y cancelas la operación.

---

## FASE 3: EXPLICACIÓN POR BLOQUES

### Bloque `TransferenciaExecutionResult`
- **Qué hace:** Crea un empaque estándar para comunicar el desenlace de la transferencia.
- **Ventajas:** Evita el abuso de "throw exception", lo que mejora enormemente el rendimiento y la legibilidad. Quien llama al método no tiene que envolver todo en `try/catch`, simplemente pregunta `if(resultado.IsSuccess)`.

### Bloque `EjecutarTransferenciaAsync`
- **Flujo de datos:** Recibe entidades de dominio (Cuentas) -> Las lee -> Las valida -> Las muta en memoria -> Intenta el commit externo -> Devuelve éxito o las revierte.
- **Decisiones que toma:** ¿Es válido el monto? ¿Hay fondos? ¿Se cayó el banco de destino?
- **Desventajas:** La mutación directa (`origen.Saldo -= monto`) expone que `Saldo` tiene un *setter público*. En DDD estricto, esto es considerado un "Modelo de Dominio Anémico".
- **Alternativa:** En lugar de `origen.Saldo -= monto`, llamaríamos a `origen.Retirar(monto)`, encapsulando la resta dentro de la propia clase `Cuenta`.

---

## FASE 4: LÓGICA DE NEGOCIO

**Regla 1: Monto Positivo**
- **Necesidad:** Evita ataques o bugs donde enviar $0 gaste recursos, o enviar negativos aumente tu propio dinero.
- **Qué valida:** `request.Monto <= 0`.
- **Qué errores evita:** Enriquecimiento ilícito por manipulación de APIs.

**Regla 2: Fondos Suficientes**
- **Necesidad:** Un banco no regala dinero (a menos que sea crédito, que no es el caso).
- **Usuario que beneficia:** Al banco (evita pérdidas).
- **Qué datos utiliza:** El monto de la solicitud vs el saldo actual de la entidad `Cuenta`.

**Regla 3: Reversión ante fallo externo (El Rollback en memoria)**
- **Necesidad:** En arquitecturas de microservicios o integraciones de terceros (APIs), la red fallará el 100% de las veces en algún momento. El usuario no debe notar que le falta dinero si la transacción nunca llegó al destino.
- **Por qué existe:** Porque EF Core y PostgreSQL guardarán los cambios si no los deshacemos explícitamente antes del "SaveChanges".

---

## FASE 5: FUNDAMENTOS DE PROGRAMACIÓN

### Async / Await / Task
- **Definición técnica:** Modelo de programación asíncrona de C# que libera el hilo de ejecución (Thread) actual mientras se espera una operación I/O (Input/Output, como red o base de datos).
- **Explicación sencilla:** No te quedas mirando fijamente al microondas.
- **Analogía:** Tú (el CPU) pones comida a calentar (la consulta a BD o red). En lugar de quedarte 2 minutos de pie mirando el plato (`Thread.Sleep` o código síncrono), usas `await` (poner el temporizador). Durante esos 2 minutos, puedes lavar los platos o atender a otra persona. Cuando el microondas hace "Piiip", retomas tu comida donde la dejaste.
- **Ejemplo pequeño:**
  ```csharp
  // Sin async (Te quedas mirando la pared)
  var datos = DescargarDeInternetSync(); 
  
  // Con async (Haces otras cosas)
  var datos = await DescargarDeInternetAsync(); 
  ```

### Delegados (`Func<Task>`)
- **Definición técnica:** Un tipo que representa referencias a métodos con una lista de parámetros y un tipo de retorno específicos.
- **Explicación sencilla:** Es poder pasar un "método" como si fuera una variable.
- **Analogía:** En lugar de darte un pescado, te doy un "vale canjeable por la acción de ir a pescar". Tú decides cuándo ejecutar el vale.
- **Ejemplo pequeño:** `Action` (no devuelve nada), `Func<T>` (devuelve algo).

### Tipos por Valor (Value Types) vs Tipos por Referencia (Reference Types)
- **Definición técnica:** Value Types (`decimal`, `int`, `structs`) viven en el **Stack**, y copian el valor al asignarse. Reference Types (`class` como `Cuenta`) viven en el **Heap**, y al asignarse, solo copian el "puntero" a la memoria.
- **Explicación sencilla:** Los tipos de valor son como fotocopias. Los tipos de referencia son como compartir el control remoto de la TV.
- **En el código:** `decimal saldoAntes = cuenta.Saldo` hace una *fotocopia* del número. Si la cuenta cambia su saldo luego, `saldoAntes` NO se altera. Por eso el Rollback funciona.

---

## FASE 6: FLUJO COMPLETO

1. **Quién llama:** Típicamente un *Handler* de la capa Feature, por ejemplo un CQRS Command Handler, o un endpoint de Controller.
2. **Qué recibe:** Dos objetos de tipo `Cuenta` (cargados previamente de la Base de Datos), el `TransferenciaRequest` (con la orden JSON del cliente) y un delegado que envuelve la llamada a `ITransferenciaGateway`.
3. **Paso 1:** Evalúa monto > 0.
4. **Paso 2:** Evalúa saldo origen > monto.
5. **Paso 3:** Realiza "Snapshots" (variables `Antes`) del saldo.
6. **Paso 4:** Muta las instancias de `Cuenta` en la memoria RAM del servidor.
7. **Paso 5:** Intenta ejecutar la acción delegada (`await enviarTransferencia()`).
8. **Decisión:** 
   - Si sale bien: Devuelve `Success`. El manejador externo (quien llamó al método) procederá a guardar en la base de datos (`dbContext.SaveChanges()`).
   - Si lanza excepción: El bloque `catch` atrapa, revierte los saldos RAM a los snapshots (`Antes`), y devuelve `Failure`. El manejador externo no guardará en base de datos.
9. **Fin del flujo.**

---

## FASE 7: VISUALIZACIÓN

**Diagrama de Flujo del Servicio (ASCII):**

```text
 [ Inicio EjecutarTransferenciaAsync ]
               |
               v
      [ ¿Monto <= 0? ] -----> SÍ ----> ( Retorna Failure )
               | NO
               v
  [ ¿Origen.Saldo < Monto? ] -> SÍ ----> ( Retorna Failure )
               | NO
               v
     [ Guardar Snapshot (Variables locales) ]
               |
               v
  [ origen.Saldo -= Monto; destino.Saldo += Monto ] (Mutación RAM)
               |
               v
         [ try { ... } ]
               |
    [ await enviarTransferencia() ] -----> (Falla / Excepción) ---+
               | (Éxito)                                          |
               v                                                  v
      ( Retorna Success )                        [ catch (Exception ex) ]
                                                          |
                                                          v
                                      [ Restaurar Snapshot (Rollback RAM) ]
                                                          |
                                                          v
                                                 ( Retorna Failure )
```

---

## FASE 8: DETECCIÓN DE BUENAS PRÁCTICAS

1. **Patrón Result:** Utilizado en lugar de `throw new Exception()`.
   - **Por qué:** Las excepciones rompen el control de flujo y son costosas en rendimiento (generan stacktraces). La falla de una transferencia bancaria (por falta de saldo) es un caso de negocio *esperado*, no un error fatal del sistema.
2. **Métodos de Fábrica Estáticos (`Success` y `Failure`):**
   - **Por qué:** Ocultan la lógica de inicialización y garantizan que un objeto "Result" siempre esté en un estado coherente.
3. **Delegación de infraestructura:**
   - **Por qué:** El `TransferenciaService` no usa `HttpClient` ni `DbContext`. Es **Agnóstico de Infraestructura**. Solo sabe que hay una función que debe ejecutar. Esto hace que el servicio sea 100% fácil de hacer Unit Testing (Pruebas Unitarias) sin bases de datos reales.

---

## FASE 9: POSIBLES MEJORAS

1. **Problema: Modelo Anémico (Violación de Encapsulamiento)**
   - **Dónde:** `origen.Saldo -= request.Monto;`
   - **Por qué ocurre:** Las propiedades de `Cuenta` son totalmente públicas, lo que permite que cualquier parte del código modifique los saldos sin pasar por reglas de seguridad de la entidad.
   - **Solución:** Hacer que el setter de `Cuenta.Saldo` sea privado (`public decimal Saldo { get; private set; }`). Y crear métodos en `Cuenta` como `public void Retirar(decimal monto)`. El código cambiaría a: `origen.Retirar(monto);`.

2. **Problema: Tipado Fuerte para Moneda**
   - **Dónde:** Uso de `decimal` primitivo para el saldo y montos.
   - **Por qué ocurre:** Puede haber un cruce accidental entre distintas monedas (Dólares vs Pesos).
   - **Solución:** Utilizar el Patrón **Value Object**. Crear una clase inmutable `Money { public decimal Amount; public string Currency; }`. Beneficio: Imposible sumar dólares con pesos por error de código.

3. **Problema: Concurrencia (Race Conditions)**
   - **Dónde:** Entre la verificación del saldo y la resta (Líneas 33 a 41).
   - **Por qué ocurre:** Si el usuario presiona el botón "Transferir" dos veces muy rápido, ambos hilos podrían leer el mismo saldo (ej. $100), ambos pasarían la validación, y ambos descontarían. El usuario gastaría $200 teniendo $100.
   - **Solución:** Se debe implementar "Concurrency Tokens" en EF Core (Optimistic Concurrency) o manejar colas de transacciones. Esto ocurre en capas más altas, pero es vital mencionarlo al hablar de operaciones financieras.

---

## FASE 10: RESUMEN FINAL

**Resumen técnico:**
`TransferenciaService` es un Domain Service estático y puro (no interactúa con I/O directamente) que orquesta la mutación de saldos en memoria para una transferencia bancaria. Emplea el Patrón Result para manejo de control de flujo y Method Injection (`Func<Task>`) para aplazar la ejecución de efectos secundarios externos. Implementa protección en memoria a través de una cláusula Catch que restaura los estados previos en caso de falla asíncrona.

**Resumen para principiantes:**
Es el código responsable de sacar el dinero de una cuenta, ponerlo en otra, y pedirle a un servicio externo que mueva el dinero real. Si el servicio externo falla, este código es tan inteligente que devuelve los saldos a su lugar original antes de decirle a nadie, evitando que el usuario pierda su dinero temporalmente. Además, comprueba que no intentes enviar más dinero del que tienes.

**Conceptos nuevos aprendidos:**
- Result Pattern.
- Delegados / Funciones como parámetros.
- Tipos de Valor vs Tipos de Referencia.
- Rollback manual.

**Flujo de negocio:**
El usuario solicita transferir X cantidad. Se revisan fondos y monto positivo. Se hace el apunte contable interno, se ejecuta la orden externa, y se notifica el resultado final garantizando la consistencia financiera.

**Preguntas de auto-verificación (Para ti):**
1. ¿Por qué `TransferenciaExecutionResult` tiene el constructor privado?
2. ¿Qué pasa si quito la línea `origen.Saldo = saldoOrigenAntes;` del bloque catch?
3. ¿Por qué el archivo es `static` y sus variables temporales no colisionan si 10 usuarios lo usan al mismo tiempo? (Pista: el Call Stack es por hilo).

---
