import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistorial, isOnline } from '../services/api';

function ResumenDia({ empleado }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalVentas, setTotalVentas] = useState(null);
  const [cantidadVentas, setCantidadVentas] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError('');
      try {
        if (!isOnline()) {
          setError('Sin conexión. El resumen del día requiere internet.');
          setLoading(false);
          return;
        }
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        const res = await getHistorial({
          empleadoId: empleado.id,
          tipo: 'venta',
          desde: hoy.toISOString(),
          hasta: manana.toISOString(),
          limit: '1000'
        });
        const movs = res.movimientos || [];
        const total = movs.reduce(
          (sum, mov) => sum + (mov.producto?.precio || 0) * Math.abs(mov.cantidad || 0),
          0
        );
        setTotalVentas(total);
        const porMinuto = {};
        movs.forEach((m) => {
          const key = m.fecha ? Math.floor(new Date(m.fecha).getTime() / 60000) : 0;
          porMinuto[key] = true;
        });
        setCantidadVentas(Object.keys(porMinuto).length);
      } catch (err) {
        setError(err.message || 'Error al cargar resumen');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [empleado?.id]);

  if (loading) {
    return (
      <div className="container vista-page" style={{ paddingTop: '50%', textAlign: 'center' }}>
        <p className="text-muted">Cargando resumen...</p>
      </div>
    );
  }

  return (
    <div className="container vista-page">
      <header className="vista-header">
        <div className="flex justify-between items-center">
          <h1>Resumen del día</h1>
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

      {!error && (
        <div className="vista-card" style={{ textAlign: 'center', padding: '28px' }}>
          <p className="text-muted mb-2">Total vendido hoy</p>
          <p className="font-bold" style={{ fontSize: '28px', color: 'var(--green)', marginBottom: '24px' }}>
            ${totalVentas != null ? totalVentas.toFixed(2) : '0.00'}
          </p>
          <p className="text-muted mb-1">Cantidad de ventas</p>
          <p className="font-bold" style={{ fontSize: '22px', color: 'var(--green-dark)' }}>
            {cantidadVentas != null ? cantidadVentas : 0}
          </p>
        </div>
      )}
    </div>
  );
}

export default ResumenDia;
