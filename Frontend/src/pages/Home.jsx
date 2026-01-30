import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ROUTES } from '../constants/routes';
import { isOnline, getHistorial } from '../services/api';
import { getMovimientosPendientes } from '../services/storage';

function Home({ empleado, onLogout }) {
  const navigate = useNavigate();
  const [online, setOnline] = useState(true);
  const [resumenHoy, setResumenHoy] = useState(null); // { total, efectivo, transferencia }
  const [pendientesCount, setPendientesCount] = useState(0);

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

  const cargarResumenHoy = () => {
    if (!empleado?.id) return;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    getHistorial({
      empleadoId: empleado.id,
      tipo: 'venta',
      desde: hoy.toISOString(),
      hasta: manana.toISOString(),
      limit: '500'
    })
      .then((res) => {
        const movimientos = res.movimientos || [];
        let total = 0;
        let efectivo = 0;
        let transferencia = 0;
        for (const mov of movimientos) {
          const monto = (mov.producto?.precio || 0) * Math.abs(mov.cantidad || 0);
          total += monto;
          const fp = mov.formaPago;
          if (fp === 'efectivo') efectivo += monto;
          else if (fp === 'transferencia') transferencia += monto;
        }
        setResumenHoy({ total, efectivo, transferencia });
      })
      .catch(() => setResumenHoy(null));
  };

  useEffect(() => {
    cargarResumenHoy();
  }, [empleado?.id]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') cargarResumenHoy();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [empleado?.id]);

  useEffect(() => {
    const actualizarPendientes = async () => {
      try {
        const pendientes = await getMovimientosPendientes();
        setPendientesCount(pendientes?.length ?? 0);
      } catch {
        setPendientesCount(0);
      }
    };
    actualizarPendientes();
    const interval = setInterval(actualizarPendientes, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container vista-page">
      <header className="vista-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 style={{ marginBottom: '6px' }}>Hola, {empleado.nombre}</h1>
            <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
              {online ? 'En línea' : 'Sin conexión'}
            </p>
            {resumenHoy !== null && (
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--green-light)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'clamp(0.75rem, 4vw, 2rem)',
                  margin: 0
                }}
              >
                <span>Hoy: ${resumenHoy.total.toFixed(2)}</span>
                <span>Efectivo: ${resumenHoy.efectivo.toFixed(2)}</span>
                <span>Transferencia: ${resumenHoy.transferencia.toFixed(2)}</span>
              </p>
            )}
            {pendientesCount > 0 && (
              <p style={{ fontSize: '13px', opacity: 0.95, marginTop: '4px' }}>
                Pendiente de enviar: {pendientesCount}
              </p>
            )}
          </div>
          <button onClick={onLogout} className="btn-secondary">
            Salir
          </button>
        </div>
      </header>

      <section className="vista-card home-actions">
        <button
          onClick={() => navigate(ROUTES.VENTA)}
          className="btn-primary w-full"
        >
          Nueva venta
        </button>
      </section>

      <section className="vista-card home-nav">
        <button
          onClick={() => navigate(ROUTES.PRODUCTOS)}
          className="btn-secondary w-full"
        >
          Listado de Productos
        </button>
        <button
          onClick={() => navigate(ROUTES.REPONER)}
          className="btn-secondary w-full"
        >
          Reponer Stock
        </button>
        <button
          onClick={() => navigate(ROUTES.HISTORIAL)}
          className="btn-secondary w-full"
        >
          Ver Historial
        </button>
        <button
          onClick={() => navigate(ROUTES.RESUMEN_DIA)}
          className="btn-secondary w-full"
        >
          Resumen del día
        </button>
        <button
          onClick={() => navigate(ROUTES.CAMBIAR_PIN)}
          className="btn-secondary w-full"
        >
          Cambiar PIN
        </button>
      </section>
    </div>
  );
}

export default Home;

