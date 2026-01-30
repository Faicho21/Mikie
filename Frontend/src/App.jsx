import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
        path="/login"
        element={
          empleado ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/"
        element={
          empleado ? (
            <Home empleado={empleado} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/venta/:productoId?"
        element={
          empleado ? (
            <Venta empleado={empleado} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/historial"
        element={
          empleado ? (
            <Historial empleado={empleado} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/productos"
        element={
          empleado ? (
            <Productos empleado={empleado} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/reponer"
        element={
          empleado ? (
            <Reponer empleado={empleado} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/resumen-dia"
        element={
          empleado ? (
            <ResumenDia empleado={empleado} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/cambiar-pin"
        element={
          empleado ? (
            <CambiarPin empleado={empleado} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;

