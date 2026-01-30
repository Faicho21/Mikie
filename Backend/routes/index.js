/**
 * Índice de rutas del backend.
 * Centraliza la carga de rutas para el servidor.
 */

import empleadoRoutes from './empleado.js';
import productoRoutes from './producto.js';
import movimientoRoutes from './movimiento.js';
import syncRoutes from './sync.js';

export const routes = [
  { plugin: empleadoRoutes, prefix: '/api/empleados' },
  { plugin: productoRoutes, prefix: '/api/productos' },
  { plugin: movimientoRoutes, prefix: '/api/movimientos' },
  { plugin: syncRoutes, prefix: '/api/sync' },
];

export default routes;
