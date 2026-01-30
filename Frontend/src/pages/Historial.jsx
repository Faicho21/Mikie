import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistorial, isOnline } from '../services/api';

function Historial({ empleado }) {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    setError('');

    try {
      if (!isOnline()) {
        setError('Sin conexión. El historial requiere internet.');
        setLoading(false);
        return;
      }

      const response = await getHistorial({
        empleadoId: empleado.id,
        limit: '50'
      });

      setMovimientos(response.movimientos || []);
    } catch (err) {
      setError(err.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

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

      {movimientos.length === 0 && !error && (
        <div className="vista-empty">
          No hay movimientos registrados
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {movimientos.map((mov) => (
          <div
            key={mov.id}
            className={`historial-mov ${mov.tipo === 'reposicion' ? 'reposicion' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold" style={{ fontSize: '16px', marginBottom: '4px' }}>{mov.producto?.nombre}</h3>
                <p className="text-sm text-muted">
                  {formatearFecha(mov.fecha)}
                </p>
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
        ))}
      </div>
    </div>
  );
}

export default Historial;

