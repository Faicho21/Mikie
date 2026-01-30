/**
 * API de sincronización offline
 */

import { request } from './client.js';

export const syncMovimientos = async (movimientos) => {
  return request('/api/sync/movimientos', {
    method: 'POST',
    body: JSON.stringify({ movimientos }),
  });
};

export const getDatosSync = async () => {
  return request('/api/sync/datos');
};
