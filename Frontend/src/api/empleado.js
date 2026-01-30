/**
 * API de empleados (login, cambiar PIN)
 */

import { request } from './client.js';

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
