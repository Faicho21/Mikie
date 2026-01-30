// Servicio para sincronización automática offline

import {
  syncMovimientos,
  getDatosSync,
  isOnline
} from './api';
import {
  getMovimientosPendientes,
  marcarMovimientoSincronizado,
  eliminarMovimientoSincronizado,
  cacheProductos,
  cacheEmpleados
} from './storage';

// Sincronizar movimientos pendientes
export const sincronizarMovimientos = async () => {
  if (!isOnline()) {
    return { success: false, message: 'Sin conexión' };
  }

  try {
    const movimientosPendientes = await getMovimientosPendientes();
    
    if (movimientosPendientes.length === 0) {
      return { success: true, message: 'No hay movimientos pendientes' };
    }

    // Preparar movimientos para enviar (sin el id de IndexedDB)
    const movimientosParaSync = movimientosPendientes.map((mov) => ({
      empleadoId: mov.empleadoId,
      productoId: mov.productoId,
      cantidad: mov.cantidad,
      tipo: mov.tipo,
      fecha: mov.fecha
    }));

    const resultado = await syncMovimientos(movimientosParaSync);

    // Marcar como sincronizados los que se procesaron correctamente
    for (const resultadoItem of resultado.resultados) {
      const movimientoOriginal = movimientosPendientes.find(
        (mov) =>
          mov.empleadoId === resultadoItem.movimiento.empleadoId &&
          mov.productoId === resultadoItem.movimiento.productoId &&
          mov.cantidad === resultadoItem.movimiento.cantidad &&
          mov.fecha === resultadoItem.movimiento.fecha
      );
      
      if (movimientoOriginal) {
        // Eliminar del IndexedDB ya que fue sincronizado
        await eliminarMovimientoSincronizado(movimientoOriginal.id);
      }
    }

    return {
      success: true,
      procesados: resultado.procesados,
      errores: resultado.errores
    };
  } catch (error) {
    console.error('Error al sincronizar:', error);
    return { success: false, message: error.message };
  }
};

// Sincronizar datos iniciales (productos, empleados)
export const sincronizarDatos = async () => {
  if (!isOnline()) {
    return { success: false, message: 'Sin conexión' };
  }

  try {
    const datos = await getDatosSync();
    
    // Cachear productos y empleados
    await cacheProductos(datos.productos);
    if (datos.empleados) {
      const { cacheEmpleados } = await import('./storage.js');
      await cacheEmpleados(datos.empleados);
    }

    return { success: true, datos };
  } catch (error) {
    console.error('Error al sincronizar datos:', error);
    return { success: false, message: error.message };
  }
};

// Iniciar sincronización automática periódica
let syncInterval = null;

export const iniciarSyncAutomatico = (intervalo = 30000) => {
  // Sincronizar inmediatamente
  sincronizarMovimientos();
  sincronizarDatos();

  // Luego cada X segundos
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    if (isOnline()) {
      sincronizarMovimientos();
      sincronizarDatos();
    }
  }, intervalo);
};

export const detenerSyncAutomatico = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

// Sincronizar cuando vuelve la conexión
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    sincronizarMovimientos();
    sincronizarDatos();
  });
}

