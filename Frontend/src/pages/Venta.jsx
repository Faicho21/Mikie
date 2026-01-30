import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  buscarProducto,
  registrarVentas,
  isOnline
} from '../services/api';
import {
  saveMovimientoOffline,
  getProductoFromCache,
  getAllProductosFromCache
} from '../services/storage';

function Venta({ empleado }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const codigoParam = searchParams.get('codigo');

  const [carrito, setCarrito] = useState(() => {
    const previo = location.state?.carritoPrevio;
    return Array.isArray(previo) ? previo : [];
  });
  const [productoActual, setProductoActual] = useState(null);
  const [cantidadActual, setCantidadActual] = useState('1');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(true);
  const [ventaRealizada, setVentaRealizada] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const updateOnlineStatus = () => setOnline(isOnline());
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const previo = location.state?.carritoPrevio;
    if (Array.isArray(previo) && previo.length > 0) {
      setCarrito(previo);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (codigoParam) {
      setBusqueda(codigoParam);
      buscarProductoPorCodigo(codigoParam);
    }
  }, [codigoParam]);

  const buscarProductoPorCodigo = async (codigo) => {
    if (!codigo?.trim()) return;
    setLoading(true);
    setError('');

    try {
      let productoEncontrado = null;
      if (isOnline()) {
        try {
          const response = await buscarProducto(codigo);
          productoEncontrado = response.producto;
        } catch {
          productoEncontrado = await getProductoFromCache(codigo);
        }
      } else {
        productoEncontrado = await getProductoFromCache(codigo);
        if (!productoEncontrado) {
          const productos = await getAllProductosFromCache();
          productoEncontrado = productos.find(
            (p) =>
              p.codigoBarra === codigo ||
              p.nombre.toLowerCase().includes(codigo.toLowerCase())
          );
        }
      }

      if (productoEncontrado) {
        setProductoActual(productoEncontrado);
        setCantidadActual('1');
      } else {
        setError('Producto no encontrado');
      }
    } catch (err) {
      setError(err.message || 'Error al buscar producto');
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = () => {
    if (!productoActual) return;
    const cantidadNum = parseInt(cantidadActual);
    if (!cantidadNum || cantidadNum <= 0) {
      setError('Cantidad inválida');
      return;
    }
    if (productoActual.stock < cantidadNum) {
      setError(`Stock insuficiente. Disponible: ${productoActual.stock}`);
      return;
    }
    setError('');
    const enCarrito = carrito.find((item) => item.producto.id === productoActual.id);
    if (enCarrito) {
      const nuevaCantidad = enCarrito.cantidad + cantidadNum;
      if (productoActual.stock < nuevaCantidad) {
        setError(`Stock insuficiente. Disponible: ${productoActual.stock}`);
        return;
      }
      setCarrito(
        carrito.map((item) =>
          item.producto.id === productoActual.id
            ? { ...item, cantidad: nuevaCantidad }
            : item
        )
      );
    } else {
      setCarrito([
        ...carrito,
        { producto: { ...productoActual }, cantidad: cantidadNum }
      ]);
    }
    setProductoActual(null);
    setCantidadActual('1');
    setBusqueda('');
    setSearchParams({});
    setToast('Agregado al carrito');
    setTimeout(() => setToast(''), 2000);
  };

  const actualizarCantidadCarrito = (index, nuevaCantidad) => {
    const num = parseInt(nuevaCantidad, 10);
    if (isNaN(num) || num < 1) return;
    const item = carrito[index];
    if (num > item.producto.stock) return;
    setCarrito(
      carrito.map((it, i) =>
        i === index ? { ...it, cantidad: num } : it
      )
    );
  };

  const quitarDelCarrito = (index) => {
    if (!window.confirm('¿Quitar este producto del carrito?')) return;
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const totalCarrito = carrito.reduce(
    (sum, item) => sum + item.producto.precio * item.cantidad,
    0
  );

  const handleConfirmarVenta = async () => {
    if (carrito.length === 0) return;
    setLoading(true);
    setError('');

    const items = carrito.map((item) => ({
      productoId: item.producto.id,
      cantidad: item.cantidad
    }));

    try {
      const totalVenta = totalCarrito;
      if (isOnline()) {
        try {
          await registrarVentas(empleado.id, items);
        } catch (err) {
          for (const item of carrito) {
            await saveMovimientoOffline({
              empleadoId: empleado.id,
              productoId: item.producto.id,
              cantidad: item.cantidad,
              tipo: 'venta',
              fecha: new Date().toISOString()
            });
          }
        }
      } else {
        for (const item of carrito) {
          await saveMovimientoOffline({
            empleadoId: empleado.id,
            productoId: item.producto.id,
            cantidad: item.cantidad,
            tipo: 'venta',
            fecha: new Date().toISOString()
          });
        }
      }
      setVentaRealizada({ total: totalVenta });
      setCarrito([]);
      setProductoActual(null);
      setBusqueda('');
      setError('');
    } catch (err) {
      setError(err.message || 'Error al registrar venta');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    if (carrito.length > 0 && !window.confirm('Hay productos en el carrito. ¿Salir igual? Se perderá la venta.')) {
      return;
    }
    navigate('/');
  };

  const handleVolver = () => {
    if (carrito.length > 0 && !window.confirm('Hay productos en el carrito. ¿Salir igual? Se perderá la venta.')) {
      return;
    }
    navigate('/');
  };

  const realizarNuevaVenta = () => {
    setVentaRealizada(null);
    setCarrito([]);
    setProductoActual(null);
    setBusqueda('');
    setError('');
    setSearchParams({});
  };

  if (loading && !productoActual && carrito.length === 0 && !ventaRealizada) {
    return (
      <div className="container vista-page" style={{ paddingTop: '50%', textAlign: 'center' }}>
        <p className="text-muted">Buscando producto...</p>
      </div>
    );
  }

  if (ventaRealizada) {
    return (
      <div className="container vista-page">
        <header className="vista-header">
          <div className="flex justify-between items-center">
            <h1>Venta</h1>
            <button onClick={() => navigate('/')} className="btn-secondary">
              Volver
            </button>
          </div>
        </header>
        <div className="vista-card venta-exito-card">
          <p className="total-label">Venta realizada</p>
          <p className="total-monto">${ventaRealizada.total.toFixed(2)}</p>
          <button
            type="button"
            onClick={realizarNuevaVenta}
            className="btn-primary w-full"
            style={{ padding: '16px', fontSize: '18px' }}
          >
            Realizar nueva venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container vista-page">
      <header className="vista-header">
        <div className="flex justify-between items-center">
          <h1>Venta</h1>
          <button onClick={handleVolver} className="btn-secondary">
            Volver
          </button>
        </div>
      </header>

      <section className="venta-buscar">
        <h3 className="font-bold" style={{ marginBottom: '12px', color: 'var(--green-dark)' }}>Agregar producto</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={carrito.length > 0 ? 'Código o nombre del próximo producto' : 'Código o nombre'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                buscarProductoPorCodigo(busqueda);
              }
            }}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={() => buscarProductoPorCodigo(busqueda)}
            className="btn-primary"
          >
            Buscar
          </button>
        </div>
      </section>

      {productoActual && (
        <div className="venta-producto-card">
          <h3 className="font-bold mb-2">{productoActual.nombre}</h3>
          {productoActual.codigoBarra && (
            <p className="text-muted text-sm mb-2">Código: {productoActual.codigoBarra}</p>
          )}
          <div className="flex justify-between mb-3">
            <span className="text-muted">Precio:</span>
            <span className="font-bold" style={{ color: 'var(--green)' }}>${productoActual.precio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-muted">Cantidad:</span>
            <input
              type="number"
              min="1"
              max={productoActual.stock}
              value={cantidadActual}
              onChange={(e) => setCantidadActual(e.target.value)}
              style={{ width: '80px', textAlign: 'center', padding: '8px', borderRadius: '8px', border: '2px solid var(--gray-light)' }}
              inputMode="numeric"
            />
          </div>
          <p className="text-sm text-muted mb-3">Stock: {productoActual.stock}</p>
          <div className="flex gap-2">
            <button type="button" onClick={agregarAlCarrito} className="btn-success" style={{ flex: 1 }}>
              Agregar al carrito
            </button>
            <button
              type="button"
              onClick={() => {
                setProductoActual(null);
                setCantidadActual('1');
                setBusqueda('');
                setSearchParams({});
              }}
              className="btn-secondary"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="vista-card alert-error">
          {error}
        </div>
      )}

      {carrito.length > 0 && (
        <div className="venta-carrito-card">
          <h3 className="font-bold mb-3" style={{ color: 'var(--green-dark)' }}>Carrito ({carrito.length} {carrito.length === 1 ? 'producto' : 'productos'})</h3>

          {/* Resumen: nombre, cantidad, subtotal y Quitar por ítem */}
          <div className="venta-resumen-carrito">
            <p className="font-bold text-sm mb-3" style={{ color: 'var(--green)' }}>Resumen</p>
            {carrito.map((item, index) => (
              <div key={`resumen-${item.producto.id}-${index}`} className="venta-resumen-item">
                <div className="venta-resumen-item-content">
                  <span className="venta-resumen-nombre">{item.producto.nombre}</span>
                  <div className="venta-resumen-cant-editor">
                    <button
                      type="button"
                      className="venta-resumen-cant-btn"
                      onClick={() => actualizarCantidadCarrito(index, String(item.cantidad - 1))}
                      disabled={item.cantidad <= 1}
                      aria-label="Menos"
                    >
                      −
                    </button>
                    <span className="venta-resumen-cant">× {item.cantidad}</span>
                    <button
                      type="button"
                      className="venta-resumen-cant-btn"
                      onClick={() => actualizarCantidadCarrito(index, String(item.cantidad + 1))}
                      disabled={item.cantidad >= item.producto.stock}
                      aria-label="Más"
                    >
                      +
                    </button>
                  </div>
                  <span className="venta-resumen-subtotal">
                    ${(item.producto.precio * item.cantidad).toFixed(2)}
                    {item.cantidad > 1 && (
                      <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                        {' '}({item.cantidad} × ${item.producto.precio.toFixed(2)})
                      </span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => quitarDelCarrito(index)}
                  className="btn-danger venta-resumen-btn-quitar"
                  title="Quitar"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate('/productos', { state: { carritoDesdeVenta: carrito } })}
            className="btn-secondary"
            style={{ marginBottom: '16px', width: '100%' }}
          >
            Agregar otro producto
          </button>

          <div className="venta-total-block">
            <div className="flex justify-between">
              <span>Total:</span>
              <span>${totalCarrito.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-3" style={{ marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleConfirmarVenta}
              className="btn-success w-full"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar venta'}
            </button>
            <button
              type="button"
              onClick={handleCancelar}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {carrito.length === 0 && !productoActual && !loading && (
        <div className="vista-empty">
          Buscá un producto por código o nombre y agregalo al carrito. Podés sumar varios antes de confirmar la venta.
        </div>
      )}

      {toast && (
        <div className="venta-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

export default Venta;
