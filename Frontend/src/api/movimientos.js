/**
 * API de movimientos (ventas, reposiciones, historial)
 */

import { request } from './client.js';

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
