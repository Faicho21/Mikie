/**
 * Cliente HTTP base para la API del backend
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const isOnline = () => navigator.onLine;

/**
 * Request genérico a la API
 * @param {string} endpoint - Ruta relativa (ej: /api/productos)
 * @param {RequestInit} options - Opciones fetch
 * @returns {Promise<any>}
 */
export const request = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const defaultOptions = {
    headers: { 'Content-Type': 'application/json' },
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
