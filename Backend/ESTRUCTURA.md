# Estructura del Backend (modular)

## Carpetas principales

- **`config/`** – Configuración
  - `index.js` – `config.port`, `config.host` (desde env)

- **`routes/`** – Rutas por dominio
  - `empleado.js` – login, cambiar PIN
  - `producto.js` – CRUD y búsqueda de productos
  - `movimiento.js` – ventas, reposiciones, listado
  - `sync.js` – sincronización offline
  - `index.js` – array `routes` con `{ plugin, prefix }` para registrar en Fastify

- **`prisma/`** – Schema y migraciones

- **`scripts/`** – Scripts de utilidad (seed, borrar ventas, etc.)

## Entrada

`index.js` carga `config` y `routes`, registra las rutas en bucle y arranca el servidor.

Añadir una nueva API: crear `routes/miModulo.js` y registrarlo en `routes/index.js`.
