// Servicio para manejar localStorage y IndexedDB

const STORAGE_KEY = 'mikie_empleado';
const DB_NAME = 'mikie_db';
const DB_VERSION = 1;
const STORE_MOVIMIENTOS = 'movimientos';
const STORE_PRODUCTOS = 'productos';
const STORE_EMPLEADOS = 'empleados';

// ===== LocalStorage =====
export const saveEmpleado = (empleado) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(empleado));
};

export const getEmpleado = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearEmpleado = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// ===== IndexedDB =====
let db = null;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store para movimientos pendientes de sincronizar
      if (!db.objectStoreNames.contains(STORE_MOVIMIENTOS)) {
        const store = db.createObjectStore(STORE_MOVIMIENTOS, {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('fecha', 'fecha', { unique: false });
        store.createIndex('sincronizado', 'sincronizado', { unique: false });
      }

      // Store para cache de productos
      if (!db.objectStoreNames.contains(STORE_PRODUCTOS)) {
        const store = db.createObjectStore(STORE_PRODUCTOS, {
          keyPath: 'id'
        });
        store.createIndex('codigoBarra', 'codigoBarra', { unique: false });
      }

      // Store para cache de empleados
      if (!db.objectStoreNames.contains(STORE_EMPLEADOS)) {
        db.createObjectStore(STORE_EMPLEADOS, { keyPath: 'id' });
      }
    };
  });
};

// Guardar movimiento offline
export const saveMovimientoOffline = async (movimiento) => {
  const database = await initDB();
  const transaction = database.transaction([STORE_MOVIMIENTOS], 'readwrite');
  const store = transaction.objectStore(STORE_MOVIMIENTOS);

  const movimientoConTimestamp = {
    ...movimiento,
    fecha: movimiento.fecha || new Date().toISOString(),
    sincronizado: false
  };

  return new Promise((resolve, reject) => {
    const request = store.add(movimientoConTimestamp);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Obtener movimientos pendientes de sincronizar
export const getMovimientosPendientes = async () => {
  const database = await initDB();
  const transaction = database.transaction([STORE_MOVIMIENTOS], 'readonly');
  const store = transaction.objectStore(STORE_MOVIMIENTOS);
  const index = store.index('sincronizado');

  return new Promise((resolve, reject) => {
    const request = index.getAll(false);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Marcar movimiento como sincronizado
export const marcarMovimientoSincronizado = async (id) => {
  const database = await initDB();
  const transaction = database.transaction([STORE_MOVIMIENTOS], 'readwrite');
  const store = transaction.objectStore(STORE_MOVIMIENTOS);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const movimiento = getRequest.result;
      if (movimiento) {
        movimiento.sincronizado = true;
        const putRequest = store.put(movimiento);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// Eliminar movimiento sincronizado
export const eliminarMovimientoSincronizado = async (id) => {
  const database = await initDB();
  const transaction = database.transaction([STORE_MOVIMIENTOS], 'readwrite');
  const store = transaction.objectStore(STORE_MOVIMIENTOS);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Cache de productos
export const cacheProductos = async (productos) => {
  const database = await initDB();
  const transaction = database.transaction([STORE_PRODUCTOS], 'readwrite');
  const store = transaction.objectStore(STORE_PRODUCTOS);

  productos.forEach((producto) => {
    store.put(producto);
  });

  return new Promise((resolve) => {
    transaction.oncomplete = () => resolve();
  });
};

// Obtener producto del cache
export const getProductoFromCache = async (codigoBarra) => {
  const database = await initDB();
  const transaction = database.transaction([STORE_PRODUCTOS], 'readonly');
  const store = transaction.objectStore(STORE_PRODUCTOS);
  const index = store.index('codigoBarra');

  return new Promise((resolve, reject) => {
    const request = index.get(codigoBarra);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Obtener todos los productos del cache
export const getAllProductosFromCache = async () => {
  const database = await initDB();
  const transaction = database.transaction([STORE_PRODUCTOS], 'readonly');
  const store = transaction.objectStore(STORE_PRODUCTOS);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Cache de empleados
export const cacheEmpleados = async (empleados) => {
  const database = await initDB();
  const transaction = database.transaction([STORE_EMPLEADOS], 'readwrite');
  const store = transaction.objectStore(STORE_EMPLEADOS);

  empleados.forEach((empleado) => {
    store.put(empleado);
  });

  return new Promise((resolve) => {
    transaction.oncomplete = () => resolve();
  });
};

// Obtener empleado del cache
export const getEmpleadoFromCache = async (id) => {
  const database = await initDB();
  const transaction = database.transaction([STORE_EMPLEADOS], 'readonly');
  const store = transaction.objectStore(STORE_EMPLEADOS);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

