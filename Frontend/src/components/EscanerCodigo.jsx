import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function EscanerCodigo({ onCodigoEscaneado, onCancelar }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState('');
  const [codigoManual, setCodigoManual] = useState('');
  const [soloManual, setSoloManual] = useState(false); // Cámara por defecto
  const [camaraLista, setCamaraLista] = useState(false);

  const enviarCodigoManual = () => {
    const codigo = codigoManual.trim();
    if (!codigo) return;
    if (navigator.vibrate) navigator.vibrate(100);
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.2, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (_) {}
    onCodigoEscaneado(codigo);
    setCodigoManual('');
  };

  useEffect(() => {
    if (soloManual) {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
      setError('');
      setCamaraLista(false);
      return;
    }

    setCamaraLista(false);
    setError('');

    const initScanner = async () => {
      try {
        const container = document.getElementById('scanner-container');
        if (!container) {
          setError('No se pudo cargar el visor de la cámara');
          return;
        }

        // Sin formatsToSupport = escanea todos los formatos. Sin qrbox = usa toda la imagen (mejor para barras).
        const html5QrCode = new Html5Qrcode('scanner-container', {
          useBarCodeDetectorIfSupported: false,
          verbose: false
        });
        html5QrCodeRef.current = html5QrCode;

        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length === 0) {
          setError('No se encontró ninguna cámara');
          return;
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const config = {
          fps: 20,
          aspectRatio: isMobile ? 1.333 : 1.0
          // Sin qrbox: escanea todo el frame (más chances de leer el código de barras)
        };

        // En móvil usar facingMode para cámara trasera (evita pantalla negra por conflicto cameraId + constraints)
        const cameraIdOrConstraints = isMobile
          ? { facingMode: 'environment' }
          : (() => {
              const back = cameras.find((c) => /back|environment|trasera/i.test(c.label || ''));
              return back ? back.id : cameras[cameras.length - 1]?.id || cameras[0].id;
            })();

        await html5QrCode.start(
          cameraIdOrConstraints,
          config,
          (decodedText) => {
            if (navigator.vibrate) navigator.vibrate(100);
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gain = audioContext.createGain();
              oscillator.connect(gain);
              gain.connect(audioContext.destination);
              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              gain.gain.setValueAtTime(0.2, audioContext.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.1);
            } catch (_) {}
            onCodigoEscaneado(decodedText);
            // No llamar stop() aquí: el cleanup del useEffect lo hace al desmontar. Evita "Cannot stop, scanner is not running".
          },
          () => {}
        );
        setCamaraLista(true);
      } catch (err) {
        const msg = err.name === 'NotAllowedError' || err.message?.includes('Permission')
          ? 'Permiso de cámara denegado. Permití el acceso en la configuración del navegador.'
          : err.message || 'Error al iniciar la cámara';
        setError(msg);
        console.error('Error en escáner:', err);
      }
    };

    // Iniciar la cámara después de que el contenedor esté en el DOM y con tamaño
    const timer = setTimeout(() => initScanner(), 150);

    return () => {
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
      setCamaraLista(false);
    };
  }, [onCodigoEscaneado, soloManual]);

  return (
    <div className="escaner-overlay">
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        background: 'rgba(0,0,0,0.9)', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Escanear código</h2>
        <button
          onClick={onCancelar}
          style={{
            background: '#14532d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancelar
        </button>
      </div>

      {/* C?mara o entrada manual */}
      {!soloManual ? (
        <>
          <div 
            id="scanner-container" 
            ref={scannerRef}
            className="escaner-camera-area"
          />
          {!camaraLista && !error && (
            <p className="escaner-msg">Iniciando c?mara?</p>
          )}
          {camaraLista && (
            <p className="escaner-msg">Enfocá el código de barras en pantalla y mantenelo quieto un momento</p>
          )}
          <button
            type="button"
            onClick={() => setSoloManual(true)}
            className="escaner-toggle-btn"
          >
            Ingresar código manualmente
          </button>
        </>
      ) : (
        <div className="escaner-manual-block">
          <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Ingresar código manualmente</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviarCodigoManual()}
              placeholder="Código de barras"
              autoComplete="off"
              autoFocus
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '10px 12px',
                fontSize: '16px',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white'
              }}
            />
            <button
              type="button"
              onClick={enviarCodigoManual}
              disabled={!codigoManual.trim()}
              style={{
                background: '#14532d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: codigoManual.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                opacity: codigoManual.trim() ? 1 : 0.6
              }}
            >
              Buscar
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSoloManual(false)}
            style={{
              marginTop: '12px',
              background: 'transparent',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Usar cámara
          </button>
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          background: 'rgba(180,60,60,0.3)', 
          color: '#ffb3b3',
          textAlign: 'center',
          fontSize: '14px',
          flexShrink: 0
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default EscanerCodigo;

