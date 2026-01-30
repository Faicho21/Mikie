import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function EscanerCodigo({ onCodigoEscaneado, onCancelar }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState('');
  const [codigoManual, setCodigoManual] = useState('');
  const [soloManual, setSoloManual] = useState(true);

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
      return;
    }

    const initScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode('scanner-container');
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length === 0) {
          setError('No se encontr? ninguna c?mara');
          return;
        }

        const cameraId = cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id;

        await html5QrCode.start(
          cameraId,
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
            html5QrCode.stop().then(() => {
              onCodigoEscaneado(decodedText);
            }).catch(() => {
              onCodigoEscaneado(decodedText);
            });
          },
          () => {}
        );
      } catch (err) {
        setError(err.message || 'Error al iniciar el esc?ner');
        console.error('Error en esc?ner:', err);
      }
    };

    initScanner();

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
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
        <h2 style={{ margin: 0, fontSize: '18px' }}>Nueva venta</h2>
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

      {/* Entrada manual siempre visible arriba */}
      <div style={{ 
        padding: '16px', 
        background: 'rgba(20,83,45,0.2)', 
        color: 'white',
        fontSize: '14px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Ingresar c?digo manualmente</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviarCodigoManual()}
            placeholder="C?digo de barras"
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
          onClick={() => setSoloManual(!soloManual)}
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
          {soloManual ? 'Mostrar esc?ner de c?mara' : 'Ocultar esc?ner (solo teclado)'}
        </button>
      </div>

      {/* ?rea del esc?ner: solo si no est? en modo solo manual */}
      {!soloManual && (
        <>
          <div 
            id="scanner-container" 
            ref={scannerRef}
            style={{ 
              minHeight: '200px',
              maxHeight: '40vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexShrink: 0
            }}
          />
          <p style={{ margin: '8px 16px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', textAlign: 'center' }}>
            Apunt? la c?mara al c?digo de barras
          </p>
        </>
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

