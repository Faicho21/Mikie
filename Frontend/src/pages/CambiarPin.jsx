import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { cambiarPin, isOnline } from '../services/api';
import { getEmpleado, saveEmpleado } from '../services/storage';

function CambiarPin({ empleado, onLogout }) {
  const navigate = useNavigate();
  const [pinActual, setPinActual] = useState('');
  const [pinNuevo, setPinNuevo] = useState('');
  const [pinRepetir, setPinRepetir] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!pinActual.trim() || !pinNuevo.trim() || !pinRepetir.trim()) {
      setError('Completá todos los campos');
      return;
    }
    if (pinNuevo !== pinRepetir) {
      setError('El nuevo PIN y la repetición no coinciden');
      return;
    }
    if (pinNuevo.length < 4) {
      setError('El nuevo PIN debe tener al menos 4 caracteres');
      return;
    }
    if (!isOnline()) {
      setError('Sin conexión. Necesitás internet para cambiar el PIN.');
      return;
    }
    setLoading(true);
    try {
      const res = await cambiarPin(pinActual, pinNuevo);
      if (res.empleado) {
        const actual = getEmpleado();
        if (actual?.id === res.empleado.id) {
          saveEmpleado({ ...actual, ...res.empleado });
        }
        setExito(true);
        setPinActual('');
        setPinNuevo('');
        setPinRepetir('');
        setTimeout(() => navigate(ROUTES.HOME), 1500);
      }
    } catch (err) {
      setError(err.message || 'Error al cambiar el PIN');
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <div className="container vista-page">
        <div className="vista-card" style={{ textAlign: 'center', padding: '32px' }}>
          <p className="font-bold" style={{ color: 'var(--green)', fontSize: '18px' }}>
            PIN actualizado correctamente
          </p>
          <p className="text-muted mt-2">Volviendo al inicio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container vista-page">
      <header className="vista-header">
        <div className="flex justify-between items-center">
          <h1>Cambiar PIN</h1>
          <button onClick={() => navigate(ROUTES.HOME)} className="btn-secondary">
            Volver
          </button>
        </div>
      </header>

      <div className="vista-card">
        <p className="text-muted mb-3">
          Ingresá tu PIN actual y el nuevo PIN que querés usar para ingresar.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-2" style={{ color: 'var(--gray-muted-strong)' }}>PIN actual</label>
            <input
              type="password"
              value={pinActual}
              onChange={(e) => setPinActual(e.target.value)}
              placeholder="PIN actual"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength="10"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-2" style={{ color: 'var(--gray-muted-strong)' }}>Nuevo PIN</label>
            <input
              type="password"
              value={pinNuevo}
              onChange={(e) => setPinNuevo(e.target.value)}
              placeholder="Nuevo PIN"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength="10"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-2" style={{ color: 'var(--gray-muted-strong)' }}>Repetir nuevo PIN</label>
            <input
              type="password"
              value={pinRepetir}
              onChange={(e) => setPinRepetir(e.target.value)}
              placeholder="Repetir nuevo PIN"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength="10"
            />
          </div>
          {error && (
            <div className="alert-error mb-3">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Cambiar PIN'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CambiarPin;
