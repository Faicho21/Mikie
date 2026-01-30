import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import { ROUTES } from '../constants/routes';
import { getAllProductos, registrarReposicion, updateProducto, createProducto, deleteProducto, isOnline } from '../services/api';
import { getAllProductosFromCache } from '../services/storage';
import { getProductLabel } from '../utils/producto';
import EscanerCodigo from '../components/EscanerCodigo';

const ORDEN_OPCIONES = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'precio', label: 'Precio' },
  { value: 'stock', label: 'Stock' }
];

function Reponer({ empleado }) {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState('1');
  const [precio, setPrecio] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState('nombre');
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [mostrarNuevoProducto, setMostrarNuevoProducto] = useState(false);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [modoEliminar, setModoEliminar] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoMarca, setNuevoMarca] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoStock, setNuevoStock] = useState('0');
  const [mostrarEscanerCodigo, setMostrarEscanerCodigo] = useState(false);

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
        } catch {
          const cache = await getAllProductosFromCache();
          setProductos(cache || []);
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

  const handleReponer = async () => {
    if (!productoSeleccionado) return;
    const cantidadNum = parseInt(cantidad);
    if (!cantidadNum || cantidadNum <= 0) {
      setError('Cantidad inválida');
      return;
    }
    const precioNum = precio.trim() === '' ? null : parseFloat(precio.replace(',', '.'));
    if (precioNum !== null && (isNaN(precioNum) || precioNum < 0)) {
      setError('Precio inválido');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (precioNum !== null) {
        await updateProducto(productoSeleccionado.id, { precio: precioNum });
      }
      await registrarReposicion(empleado.id, productoSeleccionado.id, cantidadNum);
      setProductoSeleccionado(null);
      setCantidad('1');
      setPrecio('');
      cargarProductos();
    } catch (err) {
      setError(err.message || 'Error al reponer');
    } finally {
      setGuardando(false);
    }
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    const nombreTrim = nuevoNombre.trim();
    if (!nombreTrim) {
      setError('El nombre es obligatorio');
      return;
    }
    const precioNum = parseFloat(String(nuevoPrecio).replace(',', '.'));
    if (isNaN(precioNum) || precioNum < 0) {
      setError('El precio es obligatorio y debe ser un número válido');
      return;
    }
    const stockNum = parseInt(nuevoStock, 10) || 0;
    setGuardandoNuevo(true);
    setError('');
    try {
      await createProducto({
        nombre: nombreTrim,
        marca: nuevoMarca.trim() || undefined,
        codigoBarra: nuevoCodigo.trim() || undefined,
        precio: precioNum,
        stock: stockNum >= 0 ? stockNum : 0,
      });
      setNuevoNombre('');
      setNuevoMarca('');
      setNuevoCodigo('');
      setNuevoPrecio('');
      setNuevoStock('0');
      setMostrarNuevoProducto(false);
      cargarProductos();
    } catch (err) {
      setError(err.message || 'Error al crear el producto');
    } finally {
      setGuardandoNuevo(false);
    }
  };

  const handleEliminarProducto = async (p) => {
    if (!window.confirm(`¿Eliminar "${getProductLabel(p)}"? Ya no aparecerá en el listado.`)) return;
    setEliminandoId(p.id);
    setError('');
    try {
      await deleteProducto(p.id);
      setModoEliminar(false);
      setProductoSeleccionado(null);
      cargarProductos();
    } catch (err) {
      setError(err.message || 'Error al eliminar el producto');
    } finally {
      setEliminandoId(null);
    }
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
        (p.marca && p.marca.toLowerCase().includes(t)) ||
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

  if (mostrarEscanerCodigo) {
    return (
      <EscanerCodigo
        onCodigoEscaneado={(codigo) => {
          setNuevoCodigo(codigo);
          setMostrarEscanerCodigo(false);
        }}
        onCancelar={() => setMostrarEscanerCodigo(false)}
      />
    );
  }

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
          <h1>Reponer Stock</h1>
          <button onClick={() => navigate(ROUTES.HOME)} className="btn-secondary">
            Volver
          </button>
        </div>
      </header>

      <section className="productos-filtros">
        <input
          type="text"
          className="productos-search"
          placeholder="Buscar por nombre, marca o código"
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
          <button
            type="button"
            onClick={() => { setMostrarNuevoProducto(!mostrarNuevoProducto); setError(''); setProductoSeleccionado(null); setModoEliminar(false); }}
            className={mostrarNuevoProducto ? 'btn-secondary' : 'btn-primary'}
            style={{ marginLeft: 'auto', padding: '8px 14px' }}
          >
            {mostrarNuevoProducto ? 'Cancelar' : 'Agregar producto'}
          </button>
          <button
            type="button"
            onClick={() => { setModoEliminar(!modoEliminar); setError(''); setProductoSeleccionado(null); setMostrarNuevoProducto(false); }}
            className={modoEliminar ? 'btn-secondary' : 'btn-secondary'}
            style={{ padding: '8px 14px' }}
          >
            {modoEliminar ? 'Cancelar eliminar' : 'Eliminar producto'}
          </button>
        </div>
      </section>

      {conStockBajo.length > 0 && !soloStockBajo && (
        <div className="productos-alerta-stock">
          <strong>Stock bajo:</strong> {conStockBajo.length} producto(s) en o por debajo del mínimo.
        </div>
      )}

      {mostrarNuevoProducto && (
        <div className="reponer-form-card" style={{ borderLeftColor: 'var(--green-accent)' }}>
          <h3 className="font-bold mb-3">Nuevo producto</h3>
          <form onSubmit={handleCrearProducto}>
            <div className="mb-3">
              <label className="block mb-2">Nombre *</label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: Agua"
                required
              />
            </div>
            <div className="mb-3">
              <label className="block mb-2">Marca (opcional)</label>
              <input
                type="text"
                value={nuevoMarca}
                onChange={(e) => setNuevoMarca(e.target.value)}
                placeholder="Ej: Villa del sur"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-2">Código de barras (opcional)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={nuevoCodigo}
                  onChange={(e) => setNuevoCodigo(e.target.value)}
                  placeholder="Ej: 770037000885"
                  style={{ flex: 1, minWidth: '140px' }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarEscanerCodigo(true)}
                  className="btn-secondary"
                  style={{ flexShrink: 0 }}
                >
                  Escanear código
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label className="block mb-2">Precio *</label>
              <input
                type="text"
                inputMode="decimal"
                value={nuevoPrecio}
                onChange={(e) => setNuevoPrecio(e.target.value)}
                placeholder="Ej: 560"
                required
              />
            </div>
            <div className="mb-3">
              <label className="block mb-2">Stock inicial (opcional)</label>
              <input
                type="number"
                min="0"
                value={nuevoStock}
                onChange={(e) => setNuevoStock(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-success"
                disabled={guardandoNuevo}
              >
                {guardandoNuevo ? 'Guardando...' : 'Crear producto'}
              </button>
              <button
                type="button"
                onClick={() => { setMostrarNuevoProducto(false); setNuevoNombre(''); setNuevoMarca(''); setNuevoCodigo(''); setNuevoPrecio(''); setNuevoStock('0'); setError(''); }}
                className="btn-secondary"
                disabled={guardandoNuevo}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="card mb-3 alert-error">
          {error}
        </div>
      )}

      {productoSeleccionado ? (
        <div className="reponer-form-card">
          <h3 className="font-bold mb-2">
            {productoSeleccionado.marca
              ? `${productoSeleccionado.nombre} · ${productoSeleccionado.marca}`
              : productoSeleccionado.nombre}
          </h3>
          <p className="text-muted text-sm mb-3">Stock actual: {productoSeleccionado.stock}</p>
          <div className="mb-3">
            <label className="block mb-2">Cantidad a reponer</label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              inputMode="numeric"
              style={{ width: '120px' }}
            />
          </div>
          <div className="mb-3">
            <label className="block mb-2">Precio (opcional, dejar vacío para no cambiar)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder={String(productoSeleccionado.precio ?? '')}
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              style={{ width: '140px' }}
            />
            {productoSeleccionado.precio != null && (
              <p className="text-sm text-muted mt-1">Precio actual: ${productoSeleccionado.precio.toFixed(2)}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReponer}
              className="btn-success"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Reponer'}
            </button>
            <button
              type="button"
              onClick={() => { setProductoSeleccionado(null); setCantidad('1'); setPrecio(''); setError(''); }}
              className="btn-secondary"
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {modoEliminar && (
        <p className="text-muted" style={{ marginBottom: '12px', fontSize: '14px' }}>
          Tocá el producto que quieras eliminar y confirmá.
        </p>
      )}

      {productosFiltrados.length > 0 && (
        <div className="productos-list-container">
          <List
            height={Math.min(window.innerHeight * 0.55, 420)}
            itemCount={productosFiltrados.length}
            itemSize={72}
            width="100%"
            itemData={{
              list: productosFiltrados,
              modoEliminar,
              eliminandoId,
              handleEliminarProducto,
              setProductoSeleccionado,
              setCantidad,
              setPrecio,
              setError
            }}
          >
            {({ index, style, data }) => {
              const p = data.list[index];
              const minimo = p.stockMinimo != null ? p.stockMinimo : 0;
              const esBajo = p.stock <= minimo;
              return (
                <div style={style} className="productos-list-item">
                  <div
                    className={`producto-card producto-card-list ${esBajo ? 'stock-bajo' : ''}`}
                    style={data.modoEliminar ? { display: 'flex', alignItems: 'center', gap: '12px' } : undefined}
                    onClick={() => {
                      if (data.modoEliminar) {
                        data.handleEliminarProducto(p);
                      } else {
                        data.setProductoSeleccionado(p);
                        data.setCantidad('1');
                        data.setPrecio('');
                        data.setError('');
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (data.modoEliminar) data.handleEliminarProducto(p);
                        else {
                          data.setProductoSeleccionado(p);
                          data.setCantidad('1');
                          data.setPrecio('');
                          data.setError('');
                        }
                      }
                    }}
                  >
                    <div className="producto-card-list-main" style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="producto-nombre">{getProductLabel(p)}</h3>
                      {p.codigoBarra && (
                        <span className="producto-codigo">· {p.codigoBarra}</span>
                      )}
                    </div>
                    <div className="producto-card-list-meta">
                      <span className="producto-precio">
                        ${typeof p.precio === 'number' ? p.precio.toFixed(2) : p.precio}
                      </span>
                      <span className="producto-stock">Stock: {p.stock}</span>
                      {esBajo && (
                        <span className="badge badge-stock-bajo">Bajo</span>
                      )}
                      {data.modoEliminar ? (
                        <button
                          type="button"
                          className="btn-danger"
                          disabled={data.eliminandoId === p.id}
                          onClick={(e) => { e.stopPropagation(); data.handleEliminarProducto(p); }}
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          {data.eliminandoId === p.id ? '...' : 'Eliminar'}
                        </button>
                      ) : (
                        <span className="badge-action">Reponer</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          </List>
        </div>
      )}

      {productosFiltrados.length === 0 && !error && (
        <div className="productos-empty">
          No hay productos{filtro || soloStockBajo ? ' que coincidan con el filtro' : ''}.
        </div>
      )}
    </div>
  );
}

export default Reponer;
