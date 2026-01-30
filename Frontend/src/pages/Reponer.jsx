import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProductos, registrarReposicion, updateProducto, createProducto, isOnline } from '../services/api';
import { getAllProductosFromCache } from '../services/storage';

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
  const [mostrarNuevoProducto, setMostrarNuevoProducto] = useState(false);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoStock, setNuevoStock] = useState('0');

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
        codigoBarra: nuevoCodigo.trim() || undefined,
        precio: precioNum,
        stock: stockNum >= 0 ? stockNum : 0,
      });
      setNuevoNombre('');
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

  const productosFiltrados = productos.filter(
    (p) =>
      !filtro.trim() ||
      (p.nombre && p.nombre.toLowerCase().includes(filtro.toLowerCase())) ||
      (p.codigoBarra && p.codigoBarra.includes(filtro))
  );

  if (loading) {
    return (
      <div className="container vista-page" style={{ paddingTop: '50%', textAlign: 'center' }}>
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container vista-page">
      <header className="vista-header">
        <div className="flex justify-between items-center">
          <h1>Reponer Stock</h1>
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
        <button
          type="button"
          onClick={() => { setMostrarNuevoProducto(!mostrarNuevoProducto); setError(''); setProductoSeleccionado(null); }}
          className="btn-primary"
          style={{ width: '100%', marginTop: '12px', padding: '14px' }}
        >
          {mostrarNuevoProducto ? 'Cancelar' : 'Agregar producto nuevo'}
        </button>
      </section>

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
                placeholder="Ej: Repelente Off"
                required
              />
            </div>
            <div className="mb-3">
              <label className="block mb-2">Código de barras (opcional)</label>
              <input
                type="text"
                value={nuevoCodigo}
                onChange={(e) => setNuevoCodigo(e.target.value)}
                placeholder="Ej: 770037000885"
              />
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
                onClick={() => { setMostrarNuevoProducto(false); setNuevoNombre(''); setNuevoCodigo(''); setNuevoPrecio(''); setNuevoStock('0'); setError(''); }}
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
        <div className="vista-card alert-error">
          {error}
        </div>
      )}

      {productoSeleccionado ? (
        <div className="reponer-form-card">
          <h3 className="font-bold mb-2">{productoSeleccionado.nombre}</h3>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {productosFiltrados.map((p) => {
          const minimo = p.stockMinimo != null ? p.stockMinimo : 0;
          const esBajo = p.stock <= minimo;
          return (
            <div
              key={p.id}
              className={`producto-card ${esBajo ? 'stock-bajo' : ''}`}
              onClick={() => { setProductoSeleccionado(p); setCantidad('1'); setPrecio(''); setError(''); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && (setProductoSeleccionado(p), setCantidad('1'), setPrecio(''), setError(''))}
            >
              <h3 className="producto-nombre">{p.nombre}</h3>
              {p.codigoBarra && <p className="producto-codigo">Código: {p.codigoBarra}</p>}
              <div className="producto-meta">
                <div>
                  <p className="producto-stock">Stock: {p.stock}</p>
                  {esBajo && <span className="badge badge-stock-bajo">Stock bajo</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {productosFiltrados.length === 0 && !error && (
        <div className="productos-empty">
          No hay productos
        </div>
      )}
    </div>
  );
}

export default Reponer;
