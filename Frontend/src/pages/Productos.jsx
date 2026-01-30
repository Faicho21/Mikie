import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import { getAllProductos, isOnline } from '../services/api';
import { getAllProductosFromCache } from '../services/storage';

const ORDEN_OPCIONES = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'precio', label: 'Precio' },
  { value: 'stock', label: 'Stock' }
];

function Productos({ empleado }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState('nombre');
  const [soloStockBajo, setSoloStockBajo] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    setError('');
    try {
      if (isOnline()) {
        try {
          const res = await getAllProductos();
          setProductos(res.productos || []);
        } catch (err) {
          const cache = await getAllProductosFromCache();
          setProductos(cache || []);
          if (!cache?.length) setError(err.message || 'Error al cargar productos');
        }
      } else {
        const cache = await getAllProductosFromCache();
        setProductos(cache || []);
        if (!cache?.length) setError('Sin conexión. No hay productos en caché.');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar productos');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleIrAVenta = (producto) => {
    const codigo = producto.codigoBarra || producto.nombre;
    const carritoPrevio = location.state?.carritoDesdeVenta ?? [];
    navigate(`/venta?codigo=${encodeURIComponent(codigo)}`, {
      state: { carritoPrevio }
    });
  };

  const productosFiltrados = productos
    .filter((p) => {
      if (soloStockBajo) {
        const minimo = p.stockMinimo != null ? p.stockMinimo : 0;
        if (p.stock > minimo) return false;
      }
      if (!filtro.trim()) return true;
      const t = filtro.toLowerCase();
      return (
        (p.nombre && p.nombre.toLowerCase().includes(t)) ||
        (p.codigoBarra && p.codigoBarra.includes(filtro))
      );
    })
    .sort((a, b) => {
      if (orden === 'nombre') return (a.nombre || '').localeCompare(b.nombre || '');
      if (orden === 'precio') return (a.precio || 0) - (b.precio || 0);
      if (orden === 'stock') return (a.stock || 0) - (b.stock || 0);
      return 0;
    });

  const conStockBajo = productos.filter(
    (p) => (p.stockMinimo != null ? p.stock <= p.stockMinimo : p.stock <= 0)
  );

  if (loading) {
    return (
      <div className="container productos-page" style={{ paddingTop: '50%', textAlign: 'center' }}>
        <p className="text-muted">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="container vista-page productos-page">
      <header className="vista-header">
        <div className="flex justify-between items-center">
          <h1>Listado de Productos</h1>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Volver
          </button>
        </div>
      </header>

      <section className="productos-filtros">
        <input
          type="text"
          className="productos-search"
          placeholder="Buscar por nombre o código"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <div className="productos-toolbar">
          <select
            className="productos-select"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            aria-label="Ordenar por"
          >
            {ORDEN_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <label className="productos-checkbox-wrap">
            <input
              type="checkbox"
              checked={soloStockBajo}
              onChange={(e) => setSoloStockBajo(e.target.checked)}
            />
            <span>Solo stock bajo ({conStockBajo.length})</span>
          </label>
        </div>
      </section>

      {conStockBajo.length > 0 && !soloStockBajo && (
        <div className="productos-alerta-stock">
          <strong>Stock bajo:</strong> {conStockBajo.length} producto(s) en o por debajo del mínimo.
        </div>
      )}

      {error && (
        <div className="card mb-3 alert-error">
          {error}
        </div>
      )}

      {productosFiltrados.length === 0 && !error && (
        <div className="productos-empty">
          No hay productos{filtro || soloStockBajo ? ' que coincidan con el filtro' : ''}.
        </div>
      )}

      {productosFiltrados.length > 0 && (
        <div className="productos-list-container">
          <List
            height={Math.min(window.innerHeight * 0.55, 420)}
            itemCount={productosFiltrados.length}
            itemSize={108}
            width="100%"
            itemData={productosFiltrados}
          >
            {({ index, style, data }) => {
              const p = data[index];
              const minimo = p.stockMinimo != null ? p.stockMinimo : 0;
              const esBajo = p.stock <= minimo;
              return (
                <div style={style} className="productos-list-item">
                  <div
                    className={`producto-card ${esBajo ? 'stock-bajo' : ''}`}
                    onClick={() => handleIrAVenta(p)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleIrAVenta(p)}
                  >
                    <h3 className="producto-nombre">{p.nombre}</h3>
                    {p.codigoBarra && (
                      <p className="producto-codigo">Código: {p.codigoBarra}</p>
                    )}
                    <div className="producto-meta">
                      <div>
                        <span className="producto-precio">
                          ${typeof p.precio === 'number' ? p.precio.toFixed(2) : p.precio}
                        </span>
                        <p className="producto-stock">Stock: {p.stock}</p>
                        {esBajo && (
                          <span className="badge badge-stock-bajo">Stock bajo</span>
                        )}
                      </div>
                    </div>
                    <p className="badge-action">Tocar para vender</p>
                  </div>
                </div>
              );
            }}
          </List>
        </div>
      )}
    </div>
  );
}

export default Productos;
