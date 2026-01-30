/**
 * Re-export de la API modular.
 * Los módulos están en src/api/ (client, empleado, productos, movimientos, sync).
 */
export {
  API_URL,
  isOnline,
  request,
  loginEmpleado,
  cambiarPin,
  buscarProducto,
  getProducto,
  getAllProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  registrarVenta,
  registrarVentas,
  getHistorial,
  registrarReposicion,
  syncMovimientos,
  getDatosSync,
} from '../api/index.js';
