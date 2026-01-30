import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isOnline, getHistorial } from '../services/api';
import { getMovimientosPendientes } from '../services/storage';
import EscanerCodigo from '../components/EscanerCodigo';

function Home({ empleado, onLogout }) {
  const navigate = useNavigate();
  const [mostrarEscaner, setMostrarEscaner] = useState(false);
  const [online, setOnline] = useState(true);
  const [ventasHoy, setVentasHoy] = useState(null);
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

  useEffect(() => {
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
        const total = (res.movimientos || []).reduce(
          (sum, mov) => sum + (mov.producto?.precio || 0) * Math.abs(mov.cantidad || 0),
          0
        );
        setVentasHoy(total);
      })
      .catch(() => setVentasHoy(null));
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

  const handleCodigoEscaneado = (codigo) => {
    setMostrarEscaner(false);
    // Buscar producto y navegar a venta
    navigate(`/venta?codigo=${codigo}`);
  };

  if (mostrarEscaner) {
    return (
      <EscanerCodigo
        onCodigoEscaneado={handleCodigoEscaneado}
        onCancelar={() => setMostrarEscaner(false)}
      />
    );
  }

  return (
    <div className="container vista-page">
      <header className="vista-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 style={{ marginBottom: '6px' }}>Hola, {empleado.nombre}</h1>
            <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
              {online ? 'En línea' : 'Sin conexión'}
            </p>
            {ventasHoy !== null && (
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-light)' }}>
                Hoy: ${ventasHoy.toFixed(2)}
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
          onClick={() => setMostrarEscaner(true)}
          className="btn-primary w-full"
        >
          Nueva venta
        </button>
      </section>

      <section className="vista-card home-nav">
        <button
          onClick={() => navigate('/productos')}
          className="btn-secondary w-full"
        >
          Listado de Productos
        </button>
        <button
          onClick={() => navigate('/reponer')}
          className="btn-secondary w-full"
        >
          Reponer Stock
        </button>
        <button
          onClick={() => navigate('/historial')}
          className="btn-secondary w-full"
        >
          Ver Historial
        </button>
        <button
          onClick={() => navigate('/resumen-dia')}
          className="btn-secondary w-full"
        >
          Resumen del día
        </button>
        <button
          onClick={() => navigate('/cambiar-pin')}
          className="btn-secondary w-full"
        >
          Cambiar PIN
        </button>
      </section>
    </div>
  );
}

export default Home;

