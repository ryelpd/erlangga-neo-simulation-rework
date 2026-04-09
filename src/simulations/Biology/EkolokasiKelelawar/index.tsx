import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const CX = 400;
const CY = 275;
const SOUND_SPEED = 4.0;
const REAL_SOUND_SPEED = 340;
const PIXEL_TO_METER = 0.05;

interface Obstacle {
  id: number;
  x: number;
  y: number;
  isMoth: boolean;
  radius: number;
  vx: number;
  vy: number;
  highlightAlpha: number;
}

interface Pulse {
  id: number;
  r: number;
  speed: number;
  maxR: number;
  hitObstacles: Set<number>;
  alpha: number;
  freqMultiplier: number;
}

interface Echo {
  x: number;
  y: number;
  r: number;
  speed: number;
  maxR: number;
  alpha: number;
  isMoth: boolean;
  received?: boolean;
}

export default function EkolokasiKelelawar(): ReactNode {
  const [freq, setFreq] = useState(50);
  const [obstacleCount, setObstacleCount] = useState(5);
  const [blindMode, setBlindMode] = useState(false);
  const [autoPulse, setAutoPulse] = useState(true);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);
  const [status, setStatus] = useState('MENCARI MANGSA...');
  const [statusColor, setStatusColor] = useState('text-slate-400');
  const [showAlert, setShowAlert] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const echoesRef = useRef<Echo[]>([]);
  const autoPulseTimerRef = useRef(0);
  const alertTimeoutRef = useRef(0);
  const pulseIdCounterRef = useRef(0);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const spawnObstacle = useCallback((id: number) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 300;
    const x = CX + Math.cos(angle) * dist;
    const y = CY + Math.sin(angle) * dist;
    const isMoth = Math.random() > 0.3;

    return {
      id,
      x,
      y,
      isMoth,
      radius: isMoth ? 8 : 15 + Math.random() * 20,
      vx: isMoth ? (Math.random() - 0.5) * 1.5 : 0,
      vy: isMoth ? (Math.random() - 0.5) * 1.5 : 0,
      highlightAlpha: 0
    };
  }, []);

  const initSimulation = useCallback(() => {
    obstaclesRef.current = [];
    pulsesRef.current = [];
    echoesRef.current = [];
    alertTimeoutRef.current = 0;
    setShowAlert(false);

    for (let i = 0; i < obstacleCount; i++) {
      obstaclesRef.current.push(spawnObstacle(i));
    }
  }, [obstacleCount, spawnObstacle]);

  const createEcho = useCallback((obs: Obstacle) => {
    echoesRef.current.push({
      x: obs.x,
      y: obs.y,
      r: obs.radius,
      speed: SOUND_SPEED,
      maxR: 800,
      alpha: 1.0,
      isMoth: obs.isMoth
    });
    obs.highlightAlpha = 1.0;
  }, []);

  const emitPulse = useCallback(() => {
    pulsesRef.current.push({
      id: pulseIdCounterRef.current++,
      r: 10,
      speed: SOUND_SPEED,
      maxR: Math.max(800, 1500 - (freq * 5)),
      hitObstacles: new Set(),
      alpha: 1.0,
      freqMultiplier: freq / 50
    });
    setStatus('MEMANCARKAN SUARA...');
    setStatusColor('text-sky-400');
  }, [freq]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pulses
    ctx.lineWidth = 2;
    for (const p of pulsesRef.current) {
      ctx.beginPath();
      ctx.arc(CX, CY, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${p.alpha})`;
      ctx.stroke();

      if (p.r > 20) {
        ctx.beginPath();
        ctx.arc(CX, CY, p.r - 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${p.alpha * 0.5})`;
        ctx.stroke();
      }
    }

    // Draw echoes
    ctx.lineWidth = 2;
    for (const e of echoesRef.current) {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      const color = e.isMoth ? '132, 204, 22' : '16, 185, 129';
      ctx.strokeStyle = `rgba(${color}, ${e.alpha})`;
      ctx.stroke();
    }

    // Draw obstacles
    for (const o of obstaclesRef.current) {
      const baseAlpha = blindMode ? 0 : (o.isMoth ? 0.6 : 0.3);
      const currentAlpha = Math.max(baseAlpha, o.highlightAlpha);

      if (currentAlpha > 0) {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);

        if (o.isMoth) {
          ctx.fillStyle = `rgba(250, 204, 21, ${currentAlpha})`;
          ctx.fill();

          if (currentAlpha > 0.2) {
            ctx.beginPath();
            ctx.moveTo(o.x, o.y);
            ctx.lineTo(o.x - 12, o.y - 12);
            ctx.lineTo(o.x - 12, o.y + 12);
            ctx.fillStyle = `rgba(253, 224, 71, ${currentAlpha * 0.7})`;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(o.x, o.y);
            ctx.lineTo(o.x + 12, o.y - 12);
            ctx.lineTo(o.x + 12, o.y + 12);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = `rgba(148, 163, 184, ${currentAlpha})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(71, 85, 105, ${currentAlpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (o.highlightAlpha > 0) {
          const glow = ctx.createRadialGradient(o.x, o.y, o.radius, o.x, o.y, o.radius * 3);
          glow.addColorStop(0, `rgba(16, 185, 129, ${o.highlightAlpha * 0.8})`);
          glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }
    }

    // Draw bat
    ctx.save();
    ctx.translate(CX, CY);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(-12, -18);
    ctx.lineTo(-8, -2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(12, -18);
    ctx.lineTo(8, -2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.quadraticCurveTo(-30, -20, -50, 0);
    ctx.quadraticCurveTo(-30, 10, -6, 6);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.quadraticCurveTo(30, -20, 50, 0);
    ctx.quadraticCurveTo(30, 10, 6, 6);
    ctx.fill();

    ctx.restore();

    if (pulsesRef.current.length > 0) {
      const latestPulse = pulsesRef.current[pulsesRef.current.length - 1];
      if (latestPulse.r < 30) {
        ctx.beginPath();
        ctx.arc(CX, CY - 10, latestPulse.r, Math.PI + Math.PI / 4, Math.PI * 2 - Math.PI / 4);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }, [blindMode]);

  const updatePhysics = useCallback(() => {
    // Adjust obstacle count
    const targetCount = obstacleCount;
    while (obstaclesRef.current.length < targetCount) {
      obstaclesRef.current.push(spawnObstacle(obstaclesRef.current.length));
    }
    while (obstaclesRef.current.length > targetCount) {
      obstaclesRef.current.pop();
    }

    // Auto pulse
    if (autoPulse) {
      autoPulseTimerRef.current++;
      const emitRate = 120 - (freq / 2);
      if (autoPulseTimerRef.current >= emitRate) {
        emitPulse();
        autoPulseTimerRef.current = 0;
      }
    }

    // Update obstacles
    for (const o of obstaclesRef.current) {
      if (o.isMoth) {
        o.x += o.vx;
        o.y += o.vy;
        if (Math.random() < 0.05) {
          o.vx += (Math.random() - 0.5) * 0.5;
          o.vy += (Math.random() - 0.5) * 0.5;
        }
        if (o.x < 20 || o.x > 800 - 20) o.vx *= -1;
        if (o.y < 20 || o.y > 550 - 20) o.vy *= -1;
      }
      if (o.highlightAlpha > 0) {
        o.highlightAlpha -= 0.02;
      }
    }

    // Update pulses
    for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
      const p = pulsesRef.current[i];
      p.r += p.speed;
      p.alpha = 1.0 - (p.r / p.maxR);

      for (const o of obstaclesRef.current) {
        const dist = Math.hypot(CX - o.x, CY - o.y);
        if (p.r >= dist - o.radius && p.r <= dist + o.radius + 10 && !p.hitObstacles.has(o.id)) {
          p.hitObstacles.add(o.id);
          createEcho(o);
        }
      }

      if (p.r >= p.maxR || p.alpha <= 0) {
        pulsesRef.current.splice(i, 1);
      }
    }

    // Update echoes
    let echoReceived = false;
    let currentMinDist = Infinity;

    for (let i = echoesRef.current.length - 1; i >= 0; i--) {
      const e = echoesRef.current[i];
      e.r += e.speed;
      e.alpha -= 0.005;

      const distToBat = Math.hypot(CX - e.x, CY - e.y);
      if (e.r >= distToBat && !e.received) {
        e.received = true;
        echoReceived = true;
        if (distToBat < currentMinDist) {
          currentMinDist = distToBat;
        }
      }

      if (e.alpha <= 0) {
        echoesRef.current.splice(i, 1);
      }
    }

    // Update telemetry
    if (echoReceived) {
      const distMeter = currentMinDist * PIXEL_TO_METER;
      const timeMs = ((2 * distMeter) / REAL_SOUND_SPEED) * 1000;

      setDistance(distMeter);
      setTime(timeMs);
      setStatus('TARGET TERKUNCI (MENDENGAR GEMA)');
      setStatusColor('text-emerald-400');
      setShowAlert(true);
      alertTimeoutRef.current = 30;
    } else {
      if (alertTimeoutRef.current > 0) {
        alertTimeoutRef.current--;
        if (alertTimeoutRef.current <= 0) {
          setShowAlert(false);
          setStatus('MENCARI MANGSA...');
          setStatusColor('text-slate-400');
        }
      }
    }
  }, [freq, autoPulse, obstacleCount, emitPulse, createEcho, spawnObstacle]);

  useEffect(() => {
    initSimulation();
  }, [initSimulation]);

  useEffect(() => {
    const loop = () => {
      updatePhysics();
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updatePhysics, draw]);

  const handleReset = () => {
    initSimulation();
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">BIOAKUSTIK & FISIKA GELOMBANG</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: EKOLOKASI
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Navigasi Kelelawar Menggunakan Pantulan Ultrasonik (Echo)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#10b981] text-md transform rotate-2 z-30 uppercase">
            Panel Vokalisasi
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-900 uppercase text-[10px]">Frekuensi Ultrasonik</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-700">{freq} kHz</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                step="10"
                value={freq}
                onChange={(e) => setFreq(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Rendah (Jauh)</span>
                <span>Tinggi (Detail)</span>
              </div>
            </div>

            <div className="bg-violet-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-violet-900 uppercase text-[10px]">Kepadatan Objek</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-violet-600">{obstacleCount} Objek</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={obstacleCount}
                onChange={(e) => setObstacleCount(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Sepi</span>
                <span>Ramai</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Visualisasi Ruang</label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-rose-600">
                <input
                  type="checkbox"
                  checked={blindMode}
                  onChange={(e) => setBlindMode(e.target.checked)}
                  className="w-4 h-4 accent-rose-600"
                />
                Mode Gelap Total (Tunanetra)
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-emerald-600">
                <input
                  type="checkbox"
                  checked={autoPulse}
                  onChange={(e) => setAutoPulse(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                Auto-Kicau (Pancaran Berkala)
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button
                onClick={emitPulse}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#064e3b] rounded-lg bg-emerald-400 hover:bg-emerald-300 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                PANCARKAN GELOMBANG (PULSE)
              </button>
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-2 px-3 w-full text-xs flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                ACAK POSISI MANGSA
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-emerald-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">RADAR BIOLOGIS (AUDITORI)</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-sky-400 mb-1">Estimasi Jarak (<span className="italic">d</span>)</span>
                <span className="text-xl font-black text-emerald-400">{distance.toFixed(2)} m</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-rose-900 rounded flex flex-col items-center relative overflow-hidden">
                <span className="text-[9px] font-bold uppercase text-rose-400 mb-1">Jeda Gema (<span className="italic">Δt</span>)</span>
                <span className="text-xl font-black text-rose-400 relative z-10">{time.toFixed(1)} ms</span>
              </div>
            </div>

            <div className={`p-2 border-2 border-dashed text-center flex flex-col items-center justify-center min-h-[50px] transition-colors duration-300 rounded ${showAlert ? 'bg-emerald-900 border-emerald-400' : 'bg-black border-emerald-500'}`}>
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Navigasi:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${statusColor}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div 
            className="border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden" 
            style={{ 
              backgroundColor: blindMode ? '#000000' : '#020617',
              backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.1) 2px, transparent 2px)',
              backgroundSize: '30px 30px'
            }}
          >
            <span className="absolute top-4 left-4 bg-black text-emerald-400 font-black px-3 py-1 border-4 border-emerald-500 shadow-[4px_4px_0px_#10b981] text-[10px] transform -rotate-1 z-30 uppercase">
              Visibilitas Akustik (Top-Down View)
            </span>

            {showAlert && (
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-black font-black px-6 py-2 border-4 border-black shadow-[6px_6px_0px_#000] text-xl uppercase z-40 tracking-widest pointer-events-none text-center animate-pulse">
                TARGET TERDETEKSI!
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              className="w-full h-full block"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-emerald-500 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Prinsip Fisika Ekolokasi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-400 border-b-2 border-slate-600 pb-1 mb-2">Pancaran & Gema (Echo)</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Kelelawar mengeluarkan suara ultrasonik (di atas 20.000 Hz, tidak terdengar manusia). Gelombang suara ini menjalar di udara, menabrak objek (mangsa/dinding), dan memantul kembali sebagai gema (echo) yang ditangkap oleh telinga kelelawar.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">Menghitung Jarak (d = v x t / 2)</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Otak kelelawar menghitung selisih waktu (Δt) antara saat suara dikeluarkan dan saat gema diterima. Karena kecepatan suara di udara konstan (v ≈ 340 m/s), jarak objek dapat diketahui akurat. Dibagi 2 karena suara menempuh perjalanan bolak-balik.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-violet-400 border-b-2 border-slate-600 pb-1 mb-2">Frekuensi & Resolusi</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Frekuensi yang tinggi memiliki panjang gelombang (λ) yang pendek, memungkinkan kelelawar mendeteksi objek super kecil (seperti nyamuk). Namun, frekuensi tinggi lebih cepat diserap udara, sehingga jarak jangkaunya lebih pendek dibanding frekuensi rendah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}