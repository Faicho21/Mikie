import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ROUTES } from './constants/routes';
import Login from './pages/Login';
import Home from './pages/Home';
import Venta from './pages/Venta';
import Historial from './pages/Historial';
import Productos from './pages/Productos';
import Reponer from './pages/Reponer';
import ResumenDia from './pages/ResumenDia';
import CambiarPin from './pages/CambiarPin';
import { getEmpleado, clearEmpleado, initDB } from './services/storage';
import { iniciarSyncAutomatico, detenerSyncAutomatico } from './services/sync';

const INACTIVIDAD_MINUTOS = 15;

function App() {
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDB().catch(console.error);
    const empleadoGuardado = getEmpleado();
    if (empleadoGuardado) {
      setEmpleado(empleadoGuardado);
      iniciarSyncAutomatico(30000);
    }
    setLoading(false);
    return () => detenerSyncAutomatico();
  }, []);

  useEffect(() => {
    if (!empleado) return;
    let timeoutId = null;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        detenerSyncAutomatico();
        clearEmpleado();
        setEmpleado(null);
      }, INACTIVIDAD_MINUTOS * 60 * 1000);
    };
    resetTimer();
    const eventos = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    eventos.forEach((e) => window.addEventListener(e, resetTimer));
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      eventos.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [empleado]);

  const handleLogin = (empleadoData) => {
    setEmpleado(empleadoData);
    // Iniciar sincronización automática
    iniciarSyncAutomatico(30000);
  };

  const handleLogout = () => {
    detenerSyncAutomatico();
    clearEmpleado();
    setEmpleado(null);
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '50%', textAlign: 'center' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={
          empleado ? (
            <Navigate to={ROUTES.HOME} replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route
        path={ROUTES.HOME}
        element={
          empleado ? (
            <Home empleado={empleado} onLogout={handleLogout} />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }
      />
      <Route
        path={`${ROUTES.VENTA}/:productoId?`}
        element={
          empleado ? (
            <Venta empleado={empleado} />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }
      />
      <Route
        path={ROUTES.HISTORIAL}
        element={
          empleado ? (
            <Historial empleado={empleado} />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }
      />
      <Route
        path={ROUTES.PRODUCTOS}
        element={
          empleado ? (
            <Productos empleado={empleado} />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }
      />
      <Route
        path={ROUTES.REPONER}
        element={
          empleado ? (
            <Reponer empleado={empleado} />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }
      />
      <Route
        path={ROUTES.RESUMEN_DIA}
        element={
          empleado ? (
            <ResumenDia empleado={empleado} />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }
      />
      <Route
        path={ROUTES.CAMBIAR_PIN}
        element={
          empleado ? (
            <CambiarPin empleado={empleado} onLogout={handleLogout} />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }
      />
    </Routes>
  );
}

export default App;

