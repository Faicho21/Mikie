// Servicio para comunicación con la API

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Verificar si hay conexión
export const isOnline = () => {
  return navigator.onLine;
};

// Función genérica para hacer requests
const request = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const text = await response.text();
      let msg = `Error ${response.status}`;
      try {
        const data = text ? JSON.parse(text) : {};
        if (data.error && typeof data.error === 'string') msg = data.error;
      } catch (_) {}
      throw new Error(msg);
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Sin conexión. ¿Está el backend en marcha en http://localhost:3000?');
    }
    throw new Error(error.message || 'Error de conexión');
  }
};

// ===== Empleados =====
export const loginEmpleado = async (pin) => {
  return request('/api/empleados/login', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
};

export const cambiarPin = async (pinActual, pinNuevo) => {
  return request('/api/empleados/cambiar-pin', {
    method: 'POST',
    body: JSON.stringify({ pinActual, pinNuevo }),
  });
};

// ===== Productos =====
export const buscarProducto = async (codigo) => {
  return request(`/api/productos/buscar/${encodeURIComponent(codigo)}`);
};

export const getProducto = async (id) => {
  return request(`/api/productos/${id}`);
};

export const getAllProductos = async () => {
  return request('/api/productos?activo=true');
};

export const createProducto = async (data) => {
  return request('/api/productos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProducto = async (id, data) => {
  return request(`/api/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteProducto = async (id) => {
  return request(`/api/productos/${id}`, {
    method: 'DELETE',
    headers: {},
  });
};

// ===== Movimientos =====
export const registrarVenta = async (empleadoId, productoId, cantidad) => {
  return request('/api/movimientos/venta', {
    method: 'POST',
    body: JSON.stringify({ empleadoId, productoId, cantidad }),
  });
};

export const registrarVentas = async (empleadoId, items, formaPago) => {
  return request('/api/movimientos/ventas', {
    method: 'POST',
    body: JSON.stringify({
      empleadoId,
      items,
      formaPago: formaPago === 'efectivo' || formaPago === 'transferencia' ? formaPago : null,
    }),
  });
};

export const getHistorial = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return request(`/api/movimientos?${queryString}`, { cache: 'no-store' });
};

export const registrarReposicion = async (empleadoId, productoId, cantidad) => {
  return request('/api/movimientos/reposicion', {
    method: 'POST',
    body: JSON.stringify({ empleadoId, productoId, cantidad }),
  });
};

// ===== Sync =====
export const syncMovimientos = async (movimientos) => {
  return request('/api/sync/movimientos', {
    method: 'POST',
    body: JSON.stringify({ movimientos }),
  });
};

export const getDatosSync = async () => {
  return request('/api/sync/datos');
};

