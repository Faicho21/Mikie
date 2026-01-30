import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import { getHistorial, isOnline } from '../services/api';

const PAGE_SIZE = 30;

function Historial({ empleado }) {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');

  const cargarHistorial = async (append = false) => {
    if (!append) setLoading(true);
    else setCargandoMas(true);
    setError('');

    try {
      if (!isOnline()) {
        setError('Sin conexión. El historial requiere internet.');
        setLoading(false);
        setCargandoMas(false);
        return;
      }

      const offset = append ? movimientos.length : 0;
      const response = await getHistorial({
        empleadoId: empleado.id,
        limit: String(PAGE_SIZE),
        offset: String(offset)
      });

      const nuevos = response.movimientos || [];
      setTotal(response.total ?? 0);
      setMovimientos((prev) => (append ? [...prev, ...nuevos] : nuevos));
    } catch (err) {
      setError(err.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
      setCargandoMas(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [empleado?.id]);

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container vista-page" style={{ paddingTop: '50%', textAlign: 'center' }}>
        <p className="text-muted">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="container vista-page">
      <header className="vista-header">
        <div className="flex justify-between items-center">
          <h1>Historial de Ventas</h1>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Volver
          </button>
        </div>
      </header>

      {error && (
        <div className="vista-card alert-error">
          {error}
        </div>
      )}

      {movimientos.length === 0 && !error && !loading && (
        <div className="vista-empty">
          No hay movimientos registrados
        </div>
      )}

      {movimientos.length > 0 && (
        <p className="text-muted text-sm" style={{ marginBottom: '12px' }}>
          Mostrando {movimientos.length} de {total}
        </p>
      )}

      {movimientos.length > 0 && (
        <div className="historial-list-container">
          <List
            height={Math.min(window.innerHeight * 0.5, 360)}
            itemCount={movimientos.length}
            itemSize={88}
            width="100%"
            itemData={movimientos}
          >
            {({ index, style, data }) => {
              const mov = data[index];
              return (
                <div style={style} className="historial-list-item">
                  <div
                    className={`historial-mov ${mov.tipo === 'reposicion' ? 'reposicion' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold" style={{ fontSize: '16px', marginBottom: '4px' }}>{mov.producto?.nombre}</h3>
                        <p className="text-sm text-muted">{formatearFecha(mov.fecha)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p className="font-bold" style={{ color: 'var(--green)' }}>
                          {mov.tipo === 'venta' ? '-' : '+'}{Math.abs(mov.cantidad)}
                        </p>
                        <p className="text-sm text-muted">
                          ${(mov.producto?.precio * Math.abs(mov.cantidad)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className={`badge-tipo ${mov.tipo === 'venta' ? 'venta' : 'reposicion'}`}>
                      {mov.tipo === 'venta' ? 'Venta' : 'Reposición'}
                    </span>
                  </div>
                </div>
              );
            }}
          </List>
        </div>
      )}

      {movimientos.length > 0 && movimientos.length < total && (
        <button
          type="button"
          onClick={() => cargarHistorial(true)}
          disabled={cargandoMas}
          className="btn-secondary"
          style={{ marginTop: '16px', width: '100%', padding: '14px' }}
        >
          {cargandoMas ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </div>
  );
}

export default Historial;

