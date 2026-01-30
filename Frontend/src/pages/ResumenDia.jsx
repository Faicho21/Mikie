import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistorial, isOnline } from '../services/api';

function ResumenDia({ empleado }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState(null);

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
        let total = 0;
        let efectivo = 0;
        let transferencia = 0;
        let itemsVendidos = 0;
        const porMinuto = {};
        movs.forEach((m) => {
          const monto = (m.producto?.precio || 0) * Math.abs(m.cantidad || 0);
          total += monto;
          if (m.formaPago === 'efectivo') efectivo += monto;
          else if (m.formaPago === 'transferencia') transferencia += monto;
          itemsVendidos += Math.abs(m.cantidad || 0);
          const key = m.fecha ? Math.floor(new Date(m.fecha).getTime() / 60000) : 0;
          porMinuto[key] = true;
        });
        const cantidadTransacciones = Object.keys(porMinuto).length;
        const promedioTransaccion = cantidadTransacciones > 0 ? total / cantidadTransacciones : 0;
        setResumen({
          total,
          efectivo,
          transferencia,
          cantidadTransacciones,
          itemsVendidos,
          promedioTransaccion
        });
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

      {!error && resumen && (
        <div className="resumen-dia-cards">
          <div className="vista-card resumen-dia-total">
            <p className="text-muted mb-1">Total vendido hoy</p>
            <p className="font-bold resumen-dia-monto">
              ${resumen.total.toFixed(2)}
            </p>
          </div>
          <div className="vista-card resumen-dia-linea">
            <span className="text-muted">Efectivo</span>
            <span className="font-bold">${resumen.efectivo.toFixed(2)}</span>
          </div>
          <div className="vista-card resumen-dia-linea">
            <span className="text-muted">Transferencia</span>
            <span className="font-bold">${resumen.transferencia.toFixed(2)}</span>
          </div>
          <div className="vista-card resumen-dia-linea">
            <span className="text-muted">Transacciones</span>
            <span className="font-bold">{resumen.cantidadTransacciones}</span>
          </div>
          <div className="vista-card resumen-dia-linea">
            <span className="text-muted">Ítems vendidos</span>
            <span className="font-bold">{resumen.itemsVendidos}</span>
          </div>
          <div className="vista-card resumen-dia-linea">
            <span className="text-muted">Promedio por transacción</span>
            <span className="font-bold">${resumen.promedioTransaccion.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumenDia;
