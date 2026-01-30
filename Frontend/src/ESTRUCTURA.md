# Estructura del Frontend (modular)

## Carpetas principales

- **`api/`** – Cliente HTTP por dominio
  - `client.js` – URL base, `request()`, `isOnline()`
  - `empleado.js` – login, cambiar PIN
  - `productos.js` – CRUD y búsqueda de productos
  - `movimientos.js` – ventas, reposiciones, historial
  - `sync.js` – sincronización offline
  - `index.js` – re-export de todo

- **`constants/`** – Constantes de la app
  - `routes.js` – paths (`ROUTES.HOME`, `ROUTES.VENTA`, etc.)

- **`services/`** – Servicios de alto nivel
  - `api.js` – re-export de `api/` (compatibilidad con imports actuales)
  - `storage.js` – IndexedDB y localStorage
  - `sync.js` – sincronización automática offline

- **`utils/`** – Utilidades reutilizables
  - `producto.js` – `getProductLabel(producto)` (nombre · marca)
  - `index.js` – barrel export

- **`components/`** – Componentes reutilizables
  - `EscanerCodigo.jsx`

- **`pages/`** – Vistas (una por ruta)

## Uso de rutas

Importar `ROUTES` y usar en `navigate()` y `<Route path={ROUTES.XXX}>`:

```js
import { ROUTES } from '../constants/routes';
navigate(ROUTES.HOME);
```

## Uso de la API

Importar desde `services/api` (re-export) o desde `api`:

```js
import { getAllProductos, isOnline } from '../services/api';
// o
import { getAllProductos } from '../api/productos';
import { isOnline } from '../api/client';
```
