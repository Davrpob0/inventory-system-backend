# ANSWERS.md

## 1. NestJS

### Pregunta 1

**Explique la diferencia entre un Guard, un Interceptor y un Pipe en NestJS. Indique un caso de uso concreto para cada uno.**

- **Guard**: decide si una solicitud puede continuar o no. Se ejecuta antes del handler y normalmente se usa para autenticación y autorización.
  - **Caso de uso**: validar un JWT y permitir acceso solo a usuarios con rol `ADMIN`.

- **Pipe**: transforma y/o valida datos de entrada antes de que lleguen al handler.
  - **Caso de uso**: validar un DTO de creación de producto, convertir strings a números o rechazar un UUID inválido con `ParseUUIDPipe`.

- **Interceptor**: envuelve la ejecución del handler para modificar la respuesta, medir tiempos, registrar logs o transformar datos de salida.
  - **Caso de uso**: estandarizar todas las respuestas exitosas con una estructura `{ success: true, data }` o medir latencia de endpoints.

En resumen:

- **Guard**: decide si entra.
- **Pipe**: valida y transforma lo que entra.
- **Interceptor**: envuelve lo que sale o el proceso completo.

---

### Pregunta 2

**El siguiente código tiene varios problemas. Identifique al menos tres y proponga una versión corregida.**

#### Problemas del código original

1. **SQL Injection**: concatena valores del body directamente en la consulta.
2. **Uso de `any`**: no hay DTO ni validación tipada.
3. **Manejo incorrecto de errores**: `throw new Error()` no produce una respuesta HTTP consistente.
4. **No hashea la contraseña**: se almacena en texto plano.
5. **No valida existencia correctamente**: `if (user)` no necesariamente significa que encontró registros válidos.
6. **No define columnas en el `INSERT`**: es frágil y depende del orden exacto de la tabla.
7. **No usa una capa de servicio ni ORM**: mezcla acceso a datos con la lógica del controlador.

#### Versión corregida con NestJS + Prisma

```ts
import { Body, ConflictException, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() body: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    return this.prisma.user.create({
      data: {
        fullName: body.name,
        email: body.email,
        passwordHash,
        role: 'OPERATOR',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
  }
}
```

---

### Pregunta 3

**Explique qué es el ciclo de vida de una solicitud en NestJS desde que llega a la aplicación hasta que retorna la respuesta. Mencione al menos cuatro elementos del ciclo.**

El ciclo de vida de una solicitud en NestJS es la secuencia de componentes que procesan una petición HTTP desde su entrada hasta la respuesta final.

Un flujo típico es:

1. **Middleware**
   - Se ejecuta primero.
   - Puede registrar logs, agregar contexto, validar headers, etc.

2. **Guards**
   - Determinan si la solicitud puede continuar.
   - Se usan para autenticación y autorización.

3. **Interceptors (before)**
   - Se ejecutan antes del handler y pueden envolver la ejecución.
   - Permiten logging, métricas, transformación y caching.

4. **Pipes**
   - Validan y transforman parámetros, query params y body.
   - Aquí suelen ejecutarse `ValidationPipe`, `ParseUUIDPipe`, etc.

5. **Controller**
   - Recibe la solicitud y delega al servicio.

6. **Service**
   - Contiene la lógica de negocio y acceso a datos.

7. **Interceptors (after)**
   - Transforman la respuesta antes de enviarla.

8. **Exception Filters**
   - Capturan errores lanzados durante cualquier etapa y los convierten en respuestas HTTP uniformes.

En una API real, el orden importante es:
**Middleware → Guards → Interceptors (entrada) → Pipes → Controller/Service → Interceptors (salida) → Exception Filters**.

---

### Pregunta 4

**¿Cómo implementaría un manejo global de excepciones que estandarice todas las respuestas de error de la API? Proponga la estructura de un ExceptionFilter global.**

Implementaría un **ExceptionFilter global** que capture cualquier excepción y devuelva una estructura uniforme, por ejemplo:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "path": "/api/products",
  "timestamp": "2026-03-19T15:00:00.000Z",
  "details": [...]
}
```

#### Ejemplo de filtro global

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : 'Internal server error';

    let message: string | string[] = 'Unexpected error';
    let details: unknown = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const obj = exceptionResponse as Record<string, unknown>;
      message = (obj.message as string | string[]) ?? 'Unexpected error';
      details = obj;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      details,
    });
  }
}
```

#### Registro global

```ts
app.useGlobalFilters(new GlobalExceptionFilter());
```

El beneficio es consistencia: clientes frontend, testers y logs consumen siempre el mismo formato de error.

---

### Pregunta 5

**¿Qué diferencia existe entre `@Injectable()` con scope DEFAULT y REQUEST? ¿Cuándo usaría REQUEST scope y cuáles son sus implicaciones en rendimiento?**

- **DEFAULT scope**:
  - Es singleton.
  - Se crea una sola instancia para toda la aplicación.
  - Es el comportamiento recomendado para la mayoría de servicios.

- **REQUEST scope**:
  - Se crea una instancia nueva por cada solicitud HTTP.
  - Cada request recibe su propio objeto.

#### ¿Cuándo usar `REQUEST` scope?

Lo usaría cuando el servicio necesita mantener estado estrictamente ligado a la solicitud actual, por ejemplo:

- correlación de logs por request
- tenant actual en sistemas multi-tenant
- contexto del usuario autenticado sin pasarlo manualmente a todos los métodos

#### Implicaciones de rendimiento

`REQUEST` scope tiene costo mayor porque:

- crea más instancias por solicitud
- aumenta consumo de memoria
- incrementa trabajo del contenedor de inyección
- puede propagarse a otras dependencias y volverlas request-scoped indirectamente

Por eso, usaría `REQUEST` scope solo cuando el beneficio funcional sea claro. En la mayoría de casos prefiero `DEFAULT` y pasar explícitamente el contexto necesario.

---

## 2. PostgreSQL y Prisma

### Pregunta 6

**La siguiente consulta es lenta sobre una tabla con millones de registros. Explique por qué y proponga al menos dos optimizaciones.**

```sql
SELECT * FROM orders
WHERE LOWER(customer_email) = 'cliente@empresa.com'
  AND status = 'pending'
  AND created_at > NOW() - INTERVAL '30 days';
```

#### ¿Por qué puede ser lenta?

1. **`LOWER(customer_email)` rompe el uso eficiente de un índice normal** sobre `customer_email`.
2. **`SELECT *`** trae columnas innecesarias y aumenta I/O.
3. Si no hay índices adecuados sobre `status` y `created_at`, PostgreSQL puede hacer un **sequential scan** sobre millones de filas.
4. El filtro de fecha sobre una tabla muy grande requiere una estrategia de indexación adecuada.

#### Optimizaciones posibles

##### Opción 1: índice funcional

```sql
CREATE INDEX idx_orders_lower_email
ON orders (LOWER(customer_email));
```

##### Opción 2: índice compuesto

```sql
CREATE INDEX idx_orders_email_status_created_at
ON orders (LOWER(customer_email), status, created_at);
```

##### Opción 3: evitar `SELECT *`

```sql
SELECT id, customer_email, status, created_at
FROM orders
WHERE LOWER(customer_email) = 'cliente@empresa.com'
  AND status = 'pending'
  AND created_at > NOW() - INTERVAL '30 days';
```

##### Opción 4: normalizar email en minúsculas al escribir

Si el sistema almacena siempre `customer_email` en minúsculas, ya no hace falta `LOWER()` en la consulta, lo que simplifica el índice.

#### Resumen

Las dos optimizaciones más importantes serían:

- usar un **índice funcional o compuesto**
- evitar funciones sobre columnas indexadas si se puede normalizar el dato de antemano

---

### Pregunta 7

**¿Qué es el problema N+1 en un ORM como Prisma? Muestre con código cómo se produce y cómo se resuelve.**

El problema **N+1** ocurre cuando primero se consulta una lista de registros (1 consulta) y luego, por cada elemento, se hace otra consulta adicional (N consultas). El total termina siendo 1 + N consultas.

#### Ejemplo que produce N+1

```ts
const users = await prisma.user.findMany();

for (const user of users) {
  const movements = await prisma.inventoryMovement.findMany({
    where: { userId: user.id },
  });

  console.log(user.email, movements.length);
}
```

Si hay 100 usuarios:

- 1 consulta para usuarios
- 100 consultas para movimientos

Total: **101 consultas**

#### Cómo resolverlo

Usando `include` o una consulta agregada.

```ts
const users = await prisma.user.findMany({
  include: {
    inventoryMovements: true,
  },
});

for (const user of users) {
  console.log(user.email, user.inventoryMovements.length);
}
```

También puede resolverse con agregaciones si no necesitas todos los registros relacionados:

```ts
const movementsByUser = await prisma.inventoryMovement.groupBy({
  by: ['userId'],
  _count: {
    _all: true,
  },
});
```

#### Idea clave

La solución es **traer relaciones de forma anticipada** o **agregar en base de datos**, no iterar haciendo consultas una por una.

---

### Pregunta 8

**Explique qué es una transacción ACID. Proponga un escenario en el que la ausencia de transacciones generaría inconsistencias en datos de inventario y cómo lo resolvería con Prisma.**

Una transacción ACID garantiza:

- **Atomicidad**: todo se ejecuta o nada se ejecuta.
- **Consistencia**: los datos pasan de un estado válido a otro válido.
- **Aislamiento**: una transacción no debe interferir incorrectamente con otra concurrente.
- **Durabilidad**: una vez confirmada, la información persiste.

#### Escenario de inconsistencia en inventario

Supongamos una salida de producto:

1. se valida stock actual
2. se inserta un movimiento `EXIT`
3. se registra auditoría o un segundo cambio relacionado

Si el sistema inserta el movimiento pero falla el resto del proceso, el sistema puede quedar en un estado parcial.

Otro caso más grave:

- dos solicitudes concurrentes leen stock = 10
- ambas intentan retirar 8
- sin control transaccional y aislamiento adecuado, ambas pasan validación
- resultado final: stock negativo implícito

#### Resolución con Prisma

```ts
await prisma.$transaction(async (tx) => {
  const movements = await tx.inventoryMovement.findMany({
    where: {
      warehouseId,
      productId,
    },
    select: {
      type: true,
      quantity: true,
    },
  });

  const stock = movements.reduce((acc, movement) => {
    return movement.type === 'ENTRY'
      ? acc + movement.quantity
      : acc - movement.quantity;
  }, 0);

  if (stock < quantityToExit) {
    throw new Error('Insufficient stock');
  }

  await tx.inventoryMovement.create({
    data: {
      warehouseId,
      productId,
      userId,
      type: 'EXIT',
      quantity: quantityToExit,
    },
  });
});
```

La transacción garantiza que la validación y la escritura se ejecuten como una unidad lógica.

---

### Pregunta 9

**¿Cuándo usaría un índice parcial en PostgreSQL? Escriba un ejemplo de DDL que lo ilustre y explique el beneficio obtenido.**

Usaría un **índice parcial** cuando solo una porción de las filas participa frecuentemente en consultas y el resto no aporta valor al índice.

#### Ejemplo típico

Si la mayoría de órdenes están cerradas, pero el sistema consulta casi siempre órdenes pendientes:

```sql
CREATE INDEX idx_orders_pending_created_at
ON orders (created_at)
WHERE status = 'pending';
```

#### Beneficio

- índice más pequeño
- menos costo de mantenimiento
- búsquedas más rápidas para el subconjunto realmente consultado
- mejor uso de memoria y caché

#### Cuándo tiene sentido

- flags como `is_active = true`
- `status = 'pending'`
- registros recientes
- filas no eliminadas lógicamente (`deleted_at IS NULL`)

No lo usaría si la condición cubre casi todas las filas, porque el beneficio sería muy pequeño.

---

## 3. Diseño de API y Seguridad

### Pregunta 10

**Explique el flujo completo de autenticación con JWT: generación, firma, transmisión y verificación. ¿Qué diferencia hay entre un Access Token y un Refresh Token y por qué se recomienda usar ambos?**

#### Flujo JWT

1. **Login**
   - El usuario envía email y contraseña.
   - El backend valida las credenciales contra la base de datos.

2. **Generación**
   - Si las credenciales son correctas, el servidor genera un payload con datos mínimos, por ejemplo:
     - `sub` (id del usuario)
     - `email`
     - `role`

3. **Firma**
   - El servidor firma ese payload con una clave secreta.
   - El resultado es un JWT.

4. **Transmisión**
   - El cliente recibe el token y lo envía en solicitudes posteriores, normalmente en:
     - `Authorization: Bearer <token>`

5. **Verificación**
   - En cada request protegida, el backend:
     - extrae el token
     - valida firma
     - valida expiración
     - construye el contexto del usuario autenticado

#### Access Token vs Refresh Token

- **Access Token**
  - vida corta
  - se usa para acceder a endpoints protegidos
  - si se filtra, el impacto temporal es menor

- **Refresh Token**
  - vida más larga
  - se usa solo para emitir un nuevo access token
  - no debería usarse para acceder directamente a recursos

#### ¿Por qué usar ambos?

Porque permite equilibrar:

- **seguridad**: access token corto
- **usabilidad**: refresh token evita relogin constante

Así, si el access token expira cada 15 minutos, el cliente puede renovarlo con el refresh token sin obligar al usuario a autenticarse otra vez cada vez.

---

### Pregunta 11

**Defina idempotencia en el contexto HTTP. ¿Qué métodos son idempotentes por definición? Proponga un caso donde un endpoint POST mal diseñado cause problemas de duplicidad y cómo lo solucionaría.**

La **idempotencia** significa que ejecutar la misma operación varias veces produce el mismo efecto observable en el estado del sistema.

#### Métodos idempotentes por definición

- `GET`
- `PUT`
- `DELETE`
- `HEAD`
- `OPTIONS`

`POST` **no es idempotente por definición**.

#### Ejemplo de POST mal diseñado

Supongamos:

```http
POST /payments
```

Si el cliente reintenta por timeout, el backend podría registrar el pago dos veces.

#### Cómo solucionarlo

1. usar una **idempotency key**, por ejemplo un header:
   - `Idempotency-Key: abc-123`
2. almacenar esa clave con el resultado de la operación
3. si llega la misma clave otra vez, devolver la respuesta anterior en vez de crear un nuevo registro

Otra opción, según el caso, es diseñar la operación como `PUT` con un identificador conocido previamente.

#### Ejemplo conceptual

- mal diseño: `POST /shipments` crea un envío nuevo cada vez
- mejor diseño: `PUT /shipments/{externalId}` asegura una única operación por identificador externo

---

### Pregunta 12

**Liste cinco vulnerabilidades comunes en una API REST y la medida de mitigación concreta para cada una en el contexto de NestJS.**

#### 1. Inyección SQL

- **Riesgo**: concatenar strings en queries.
- **Mitigación**: usar Prisma o consultas parametrizadas; nunca interpolar datos del usuario directamente.

#### 2. Broken Authentication

- **Riesgo**: tokens inseguros, contraseñas débiles, sesiones sin expiración.
- **Mitigación**:
  - `bcrypt` para contraseñas
  - JWT con expiración
  - refresh token separado
  - secretos seguros y variables de entorno

#### 3. Broken Authorization

- **Riesgo**: usuarios autenticados accediendo a recursos que no les corresponden.
- **Mitigación**:
  - `Guards`
  - `RolesGuard`
  - validaciones por recurso, por ejemplo operador solo en su bodega

#### 4. Validación insuficiente de entrada

- **Riesgo**: payloads maliciosos o inconsistentes.
- **Mitigación**:
  - `ValidationPipe`
  - DTOs con `class-validator`
  - `whitelist: true`
  - `forbidNonWhitelisted: true`

#### 5. Exposición de información sensible

- **Riesgo**: devolver hashes, stack traces, secretos o detalles internos.
- **Mitigación**:
  - `ExceptionFilter` global
  - `select` explícito en consultas Prisma
  - nunca retornar `passwordHash`
  - mensajes de error controlados

Otras vulnerabilidades también importantes serían rate limiting, CORS mal configurado y falta de TLS en producción, pero las cinco anteriores son muy típicas y directamente mitigables en NestJS.

---

### Pregunta 13

**Explique el principio de responsabilidad única (SRP) aplicado a un servicio en NestJS. Muestre un ejemplo de clase que lo viola y cómo la refactorizaría.**

El **principio de responsabilidad única (SRP)** indica que una clase debe tener una sola razón de cambio.

En NestJS esto significa que un servicio no debería encargarse al mismo tiempo de:

- acceso a datos
- lógica de negocio
- envío de emails
- logging
- exportación de archivos
- autenticación
- validaciones de infraestructura

#### Ejemplo que viola SRP

```ts
@Injectable()
export class OrdersService {
  async createOrder(dto: CreateOrderDto) {
    // valida stock
    // calcula total
    // inserta en base de datos
    // descuenta inventario
    // envía correo
    // genera PDF
    // registra auditoría
    // publica evento
  }
}
```

Esta clase tiene demasiadas razones de cambio:

- cambia si cambia la lógica de negocio
- cambia si cambia el mail
- cambia si cambia el PDF
- cambia si cambia la auditoría

#### Refactorización

Separaría responsabilidades:

- `OrdersService`
  - coordina el caso de uso
- `InventoryService`
  - valida y aplica movimientos
- `PricingService`
  - calcula totales
- `NotificationService`
  - envía correos
- `AuditService`
  - registra auditoría

#### Ejemplo refactorizado

```ts
@Injectable()
export class OrdersService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly pricingService: PricingService,
    private readonly ordersRepository: OrdersRepository,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    await this.inventoryService.validateAvailability(dto.items);

    const total = this.pricingService.calculate(dto.items);

    const order = await this.ordersRepository.create({
      ...dto,
      total,
    });

    await this.inventoryService.reserve(dto.items);
    await this.notificationService.sendOrderCreated(order);
    await this.auditService.record('ORDER_CREATED', order.id);

    return order;
  }
}
```

Aquí `OrdersService` sigue orquestando, pero cada dependencia tiene una responsabilidad más clara. Eso mejora mantenibilidad, pruebas y legibilidad.
