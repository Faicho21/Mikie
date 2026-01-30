import { useState } from 'react';
import { loginEmpleado, isOnline } from '../services/api';
import { saveEmpleado } from '../services/storage';

const TECLAS_PIN = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'borrar'];

function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTecla = (tecla) => {
    if (tecla === 'borrar') {
      setPin((p) => p.slice(0, -1));
      setError('');
      return;
    }
    if (tecla === '' || pin.length >= 10) return;
    setPin((p) => p + tecla);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!pin.trim()) {
      setError('Ingresá tu PIN');
      setLoading(false);
      return;
    }

    try {
      if (!isOnline()) {
        setError('Sin conexión. Necesitás internet para iniciar sesión.');
        setLoading(false);
        return;
      }

      const response = await loginEmpleado(pin);
      if (response.empleado) {
        saveEmpleado(response.empleado);
        onLogin(response.empleado);
      }
    } catch (err) {
      setError(err.message || 'Error al ingresar. Revisá que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container login-page">
      <div className="login-header">
        <h1>Mikie</h1>
        <p>Sistema de Control de Stock</p>
      </div>

      <div className="login-card">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              id="pin"
              type="password"
              value={pin}
              readOnly
              placeholder="PIN"
              maxLength="10"
              inputMode="numeric"
              autoComplete="off"
              style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '20px', width: '100%' }}
            />
          </div>

          <div className="teclado-pin">
            {TECLAS_PIN.map((tecla, i) => (
              <button
                key={tecla ? tecla : `empty-${i}`}
                type="button"
                className={tecla === 'borrar' ? 'btn-secondary' : 'btn-primary'}
                style={{ visibility: tecla === '' ? 'hidden' : 'visible' }}
                onClick={() => handleTecla(tecla)}
                disabled={tecla === ''}
              >
                {tecla === 'borrar' ? 'Borrar' : tecla || ''}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 alert-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || !pin.trim()}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
