<h1 align="center">Inventory System API</h1>

<p align="center">
  Backend desarrollado con <strong>NestJS</strong>, <strong>Prisma</strong> y <strong>PostgreSQL</strong> para una prueba técnica de sistema de inventario multi-bodega.
</p>

<h2>Objetivo</h2>

<p>La aplicación permite gestionar:</p>

<ul>
  <li>autenticación con JWT</li>
  <li>usuarios con roles <code>ADMIN</code> y <code>OPERATOR</code></li>
  <li>bodegas</li>
  <li>productos</li>
  <li>asignación de operadores a bodegas</li>
  <li>movimientos de inventario (<code>ENTRY</code> y <code>EXIT</code>)</li>
  <li>validación de stock</li>
  <li>reporte de stock por producto y bodega</li>
</ul>

<h2>Stack tecnológico</h2>

<ul>
  <li><strong>Node.js 20</strong></li>
  <li><strong>NestJS 11</strong></li>
  <li><strong>Prisma 7</strong></li>
  <li><strong>PostgreSQL 15</strong></li>
  <li><strong>Docker Compose</strong></li>
  <li><strong>JWT + Passport</strong></li>
  <li><strong>Swagger</strong></li>
  <li><strong>Jest</strong></li>
</ul>

<h2>Reglas de negocio implementadas</h2>

<ul>
  <li>Solo <code>ADMIN</code> puede gestionar usuarios, bodegas y productos.</li>
  <li><code>ADMIN</code> y <code>OPERATOR</code> pueden registrar movimientos de inventario.</li>
  <li>Un <code>OPERATOR</code> solo puede operar en la bodega que tiene asignada.</li>
  <li>El stock no se almacena como columna persistida; se calcula desde el historial de movimientos.</li>
  <li>Una salida (<code>EXIT</code>) no puede dejar el inventario en negativo.</li>
  <li>Productos o bodegas inactivos no pueden usarse en movimientos.</li>
</ul>

<h2>Modelo de datos</h2>

<p>Tablas principales:</p>

<ul>
  <li><code>users</code></li>
  <li><code>warehouses</code></li>
  <li><code>products</code></li>
  <li><code>warehouse_operators</code></li>
  <li><code>inventory_movements</code></li>
</ul>

<h3>Relación clave</h3>

<ul>
  <li>Un usuario con rol <code>OPERATOR</code> puede tener una única asignación activa a una bodega.</li>
  <li>El stock se calcula con:</li>
</ul>

<pre><code>stock = SUM(ENTRY) - SUM(EXIT)
</code></pre>

<p>agrupado por:</p>

<ul>
  <li><code>warehouseId</code></li>
  <li><code>productId</code></li>
</ul>

<h2>Variables de entorno</h2>

<p>Crear un archivo <code>.env</code> en la raíz del proyecto con valores similares a estos:</p>

<pre><code>PORT=3000
NODE_ENV=development

DATABASE_URL="postgresql://inventory_user:inventory_pass@localhost:5433/inventory_db?schema=public"

JWT_ACCESS_SECRET=replace_with_secure_random_secret
JWT_REFRESH_SECRET=replace_with_secure_random_secret

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
</code></pre>

<h2>Cómo levantar el proyecto</h2>

<h3>Requisito</h3>

<p>Tener instalado:</p>

<ul>
  <li>Docker</li>
  <li>Docker Compose</li>
</ul>

<h3>Arranque completo</h3>

<pre><code>docker compose up --build
</code></pre>

<p>Este comando:</p>

<ul>
  <li>construye la imagen de la API</li>
  <li>levanta PostgreSQL</li>
  <li>aplica migraciones con Prisma</li>
  <li>ejecuta el seed</li>
  <li>inicia la aplicación NestJS</li>
</ul>

<h2>URLs importantes</h2>

<h3>Swagger</h3>

<pre><code>http://localhost:3000/api/docs
</code></pre>

<h3>API base</h3>

<pre><code>http://localhost:3000/api
</code></pre>

<h2>Datos iniciales del seed</h2>

<p>Cuando la aplicación arranca con Docker, se cargan datos de prueba.</p>

<h3>Admin</h3>

<ul>
  <li><strong>email:</strong> <code>admin@test.com</code></li>
  <li><strong>password:</strong> <code>Admin123*</code></li>
</ul>

<h3>Operador 1</h3>

<ul>
  <li><strong>email:</strong> <code>operator1@test.com</code></li>
  <li><strong>password:</strong> <code>Operator123*</code></li>
</ul>

<h3>Operador 2</h3>

<ul>
  <li><strong>email:</strong> <code>operator2@test.com</code></li>
  <li><strong>password:</strong> <code>Operator456*</code></li>
</ul>

<h3>Bodegas</h3>

<ul>
  <li><code>Bodega Central</code></li>
  <li><code>Bodega Norte</code></li>
</ul>

<h3>Productos</h3>

<ul>
  <li><code>SKU1001</code></li>
  <li><code>SKU1002</code></li>
  <li><code>SKU1003</code></li>
  <li><code>SKU1004</code></li>
  <li><code>SKU1005</code></li>
</ul>

<h2>Endpoints principales</h2>

<h3>Auth</h3>

<ul>
  <li><code>POST /api/auth/login</code></li>
  <li><code>POST /api/auth/refresh</code></li>
  <li><code>GET /api/auth/me</code></li>
  <li><code>GET /api/auth/admin-test</code></li>
</ul>

<h3>Users</h3>

<ul>
  <li><code>POST /api/users</code></li>
  <li><code>GET /api/users</code></li>
  <li><code>GET /api/users/:id</code></li>
  <li><code>POST /api/users/:id/assign-warehouse</code></li>
</ul>

<h3>Warehouses</h3>

<ul>
  <li><code>POST /api/warehouses</code></li>
  <li><code>GET /api/warehouses</code></li>
  <li><code>GET /api/warehouses/:id</code></li>
  <li><code>PATCH /api/warehouses/:id</code></li>
</ul>

<h3>Products</h3>

<ul>
  <li><code>POST /api/products</code></li>
  <li><code>GET /api/products</code></li>
  <li><code>GET /api/products/:id</code></li>
  <li><code>PATCH /api/products/:id</code></li>
</ul>

<h3>Inventory Movements</h3>

<ul>
  <li><code>POST /api/inventory-movements</code></li>
  <li><code>GET /api/inventory-movements</code></li>
  <li><code>GET /api/inventory-movements/stock</code></li>
  <li><code>GET /api/inventory-movements/stock/:warehouseId/:productId</code></li>
</ul>

<h2>Cómo correr los tests</h2>

<p>Una vez los contenedores estén levantados con:</p>

<pre><code>docker compose up --build
</code></pre>

<p>abre <strong>otra terminal</strong> en la raíz del proyecto y ejecuta:</p>

<h3>Correr todos los tests</h3>

<pre><code>docker compose exec api npm test
</code></pre>

<h3>Correr solo el test del módulo crítico</h3>

<pre><code>docker compose exec api npm test -- inventory-movements.service.spec.ts
</code></pre>

<h2>Qué valida el test implementado</h2>

<p>El test unitario del módulo <code>inventory-movements</code> cubre:</p>

<ul>
  <li>creación exitosa de un movimiento <code>ENTRY</code></li>
  <li>rechazo de un movimiento <code>EXIT</code> con stock insuficiente</li>
  <li>rechazo de un <code>OPERATOR</code> intentando operar fuera de su bodega</li>
  <li>error cuando el producto no existe</li>
</ul>

<h2>Desarrollo local sin Docker</h2>

<p>Si se desea correr localmente:</p>

<h3>Instalar dependencias</h3>

<pre><code>npm install
</code></pre>

<h3>Generar cliente Prisma</h3>

<pre><code>npx prisma generate
</code></pre>

<h3>Ejecutar migraciones</h3>

<pre><code>npx prisma migrate dev --name init
</code></pre>

<h3>Ejecutar seed</h3>

<pre><code>npx prisma db seed
</code></pre>

<h3>Levantar servidor</h3>

<pre><code>npm run start:dev
</code></pre>

<h2>Decisiones técnicas</h2>

<h3>Prisma 7 con adapter PostgreSQL</h3>

<p>Se utilizó <code>@prisma/adapter-pg</code> para trabajar con Prisma 7 y PostgreSQL.</p>

<h3>Seguridad</h3>

<ul>
  <li>contraseñas hasheadas con <code>bcrypt</code></li>
  <li>JWT para autenticación</li>
  <li>refresh token</li>
  <li>guards para autenticación y roles</li>
</ul>

<h3>Diseño del inventario</h3>

<p>El inventario no se guarda como una columna acumulada; se deriva de movimientos históricos para mantener consistencia con el requerimiento de la prueba.</p>

<h3>Restricción por bodega</h3>

<p>La autorización de operadores se valida con la tabla <code>warehouse_operators</code>, garantizando que cada operador solo registre movimientos en su bodega asignada.</p>

<h2>Posibles mejoras futuras</h2>

<ul>
  <li>paginación y filtros en listados</li>
  <li>persistencia y revocación de refresh tokens</li>
  <li>reportes agregados optimizados en SQL</li>
  <li>pruebas e2e</li>
  <li>manejo global unificado de respuestas y errores</li>
  <li>soft delete explícito para entidades de catálogo</li>
</ul>

<h2>Autor</h2>

<p>David Restrepo</p>
