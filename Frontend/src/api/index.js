/**
 * API del backend - barrel export
 * Importar desde aquí o desde servicios/api (re-export)
 */

export { API_URL, isOnline, request } from './client.js';
export { loginEmpleado, cambiarPin } from './empleado.js';
export {
  buscarProducto,
  getProducto,
  getAllProductos,
  createProducto,
  updateProducto,
  deleteProducto,
} from './productos.js';
export {
  registrarVenta,
  registrarVentas,
  getHistorial,
  registrarReposicion,
} from './movimientos.js';
export { syncMovimientos, getDatosSync } from './sync.js';
