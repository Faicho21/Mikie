/**
 * API de productos
 */

import { request } from './client.js';

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
