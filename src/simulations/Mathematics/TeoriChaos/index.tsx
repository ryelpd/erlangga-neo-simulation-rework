import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;
const DT = 0.005;
const MAX_TRAIL = 1200;
const SCALE = 12;
const OFFSET_X = 400;
const OFFSET_Y = 500;
const START_X = 0.1;
const START_Y = 0.0;
const START_Z = 0.0;

interface Point {
  x: number;
  y: number;
  z: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  color: string;
  glowColor: string;
  history: Point[];
}

function createParticle(x: number, y: number, z: number, color: string, glowColor: string): Particle {
  return { x, y, z, color, glowColor, history: [] };
}

function resetParticle(p: Particle, x: number, y: number, z: number) {
  p.x = x;
  p.y = y;
  p.z = z;
  p.history = [];
}

function updateParticle(p: Particle, speedMult: number) {
  for (let i = 0; i < speedMult; i++) {
    const dx = SIGMA * (p.y - p.x) * DT;
    const dy = (p.x * (RHO - p.z) - p.y) * DT;
    const dz = (p.x * p.y - BETA * p.z) * DT;

    p.x += dx;
    p.y += dy;
    p.z += dz;

    if (i === 0) {
      p.history.push({ x: p.x, y: p.y, z: p.z });
      if (p.history.length > MAX_TRAIL) {
        p.history.shift();
      }
    }
  }
}

export default function TeoriChaos(): ReactNode {
  const [initialDiff, setInitialDiff] = useState(0.001);
  const [speedMult, setSpeedMult] = useState(1);
  const [showA, setShowA] = useState(true);
  const [showB, setShowB] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [distance, setDistance] = useState(0.001);
  const [status, setStatus] = useState('MENUNGGU SIMULASI');
  const [statusColor, setStatusColor] = useState('text-slate-300');
  const [statusBg, setStatusBg] = useState('bg-slate-800');
  const [statusBorder, setStatusBorder] = useState('border-slate-500');
  const [distColor, setDistColor] = useState('text-amber-400');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemARef = useRef<Particle>(createParticle(START_X, START_Y, START_Z, 'rgba(34, 211, 238, 0.6)', '#06b6d4'));
  const systemBRef = useRef<Particle>(createParticle(START_X, START_Y, START_Z, 'rgba(236, 72, 153, 0.6)', '#db2777'));
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Helper axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(OFFSET_X, OFFSET_Y);
    ctx.lineTo(OFFSET_X, OFFSET_Y - (RHO * SCALE * 0.8));
    ctx.stroke();

    // Draw Particle A
    if (showA) {
      const p = systemARef.current;
      if (p.history.length > 0) {
        ctx.beginPath();
        for (let i = 0; i < p.history.length; i++) {
          const pt = p.history[i];
          const px = OFFSET_X + (pt.x * SCALE);
          const py = OFFSET_Y - (pt.z * SCALE * 0.8);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const h = p.history[p.history.length - 1];
        const px = OFFSET_X + (h.x * SCALE);
        const py = OFFSET_Y - (h.z * SCALE * 0.8);

        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Draw Particle B
    if (showB) {
      const p = systemBRef.current;
      if (p.history.length > 0) {
        ctx.beginPath();
        for (let i = 0; i < p.history.length; i++) {
          const pt = p.history[i];
          const px = OFFSET_X + (pt.x * SCALE);
          const py = OFFSET_Y - (pt.z * SCALE * 0.8);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const h = p.history[p.history.length - 1];
        const px = OFFSET_X + (h.x * SCALE);
        const py = OFFSET_Y - (h.z * SCALE * 0.8);

        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }, [showA, showB]);

  const updatePhysics = useCallback(() => {
    if (isRunning) {
      if (showA) updateParticle(systemARef.current, speedMult);
      if (showB) updateParticle(systemBRef.current, speedMult);

      setSimTime(prev => prev + (DT * speedMult));

      const dx = systemARef.current.x - systemBRef.current.x;
      const dy = systemARef.current.y - systemBRef.current.y;
      const dz = systemARef.current.z - systemBRef.current.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      setDistance(dist);

      if (dist < 1.0) {
        setStatus('KONDISI STABIL (PREDIKTABEL)');
        setStatusColor('text-sky-300');
        setStatusBg('bg-slate-800');
        setStatusBorder('border-sky-500');
        setDistColor('text-sky-300');
      } else if (dist < 15.0) {
        setStatus('AWAL DIVERGENSI (MENYIMPANG)');
        setStatusColor('text-amber-400');
        setStatusBg('bg-amber-900');
        setStatusBorder('border-amber-500');
        setDistColor('text-amber-400');
      } else {
        setStatus('CHAOS TOTAL (BERBEDA SAMA SEKALI)');
        setStatusColor('text-rose-300');
        setStatusBg('bg-rose-900');
        setStatusBorder('border-rose-500');
        setDistColor('text-rose-400');
      }
    }
  }, [isRunning, showA, showB, speedMult]);

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

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      if (simTime === 0) {
        resetParticle(systemBRef.current, START_X + initialDiff, START_Y, START_Z);
      }
    } else {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSimTime(0);
    resetParticle(systemARef.current, START_X, START_Y, START_Z);
    resetParticle(systemBRef.current, START_X + initialDiff, START_Y, START_Z);
    setDistance(initialDiff);
    setStatus('MENUNGGU SIMULASI');
    setStatusColor('text-slate-300');
    setStatusBg('bg-slate-800');
    setStatusBorder('border-slate-500');
    setDistColor('text-amber-400');
  };

  const handleDiffChange = (value: number) => {
    const newDiff = value / 1000;
    setInitialDiff(newDiff);
    if (simTime === 0) {
      resetParticle(systemBRef.current, START_X + newDiff, START_Y, START_Z);
      setDistance(newDiff);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">SISTEM DINAMIS NON-LINEAR</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: TEORI CHAOS
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Simulasi "Butterfly Effect" pada Model Cuaca Atraktor Lorenz
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#0ea5e9] text-md transform rotate-2 z-30 uppercase">
            Kondisi Awal (Initial State)
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-yellow-900 uppercase text-[10px]">Perbedaan Awal (<span className="italic">Δx₀</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-yellow-700">{initialDiff.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="1000"
                step="1"
                value={initialDiff * 1000}
                onChange={(e) => handleDiffChange(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Sangat Mirip (0.001)</span>
                <span>Berbeda (1.000)</span>
              </div>
            </div>

            <div className="bg-purple-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-purple-900 uppercase text-[10px]">Kecepatan Simulasi</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-purple-700">{speedMult}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={speedMult}
                onChange={(e) => setSpeedMult(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Normal</span>
                <span>Cepat (Time Lapse)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Pengaturan Tampilan</label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-sky-600">
                <input
                  type="checkbox"
                  checked={showA}
                  onChange={(e) => setShowA(e.target.checked)}
                  className="w-4 h-4 accent-sky-500"
                />
                Tampilkan Cuaca A (Cyan)
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-pink-600">
                <input
                  type="checkbox"
                  checked={showB}
                  onChange={(e) => setShowB(e.target.checked)}
                  className="w-4 h-4 accent-pink-500"
                />
                Tampilkan Cuaca B (Magenta)
              </label>
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-black pt-3">
              <button
                onClick={handleStart}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#064e3b] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${isRunning ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'}`}
              >
                {isRunning ? 'JEDA SIMULASI' : 'MULAI SIMULASI CUACA'}
              </button>
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-2 px-3 w-full text-xs flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                KEMBALI KE TITIK AWAL
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-sky-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">TELEMETRI DIVERGENSI</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Waktu (<span className="italic">t</span>)</span>
                <span className="text-xl font-black text-white">{simTime.toFixed(2)}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center relative overflow-hidden">
                <span className="text-[9px] font-bold uppercase text-amber-400 mb-1">Jarak (<span className="italic">Δ</span>)</span>
                <span className={`text-xl font-black relative z-10 ${distColor}`}>{distance.toFixed(3)}</span>
              </div>
            </div>

            <div className={`${statusBg} p-3 border-2 border-dashed ${statusBorder} text-center flex flex-col items-center justify-center min-h-[50px] transition-colors duration-300 rounded`}>
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Prediktabilitas:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${statusColor} ${distance > 15 ? 'glitch-text' : ''}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden"
            style={{
              backgroundColor: '#020617',
              backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-slate-900 font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Ruang Fase Atraktor Lorenz (Proyeksi 2D)
            </span>

            <div className="absolute bottom-4 right-4 bg-black/80 border-2 border-slate-600 p-3 flex flex-col gap-2 z-20 shadow-[4px_4px_0px_0px_#000]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                <span className="text-xs font-bold text-white uppercase">Cuaca A</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]"></div>
                <span className="text-xs font-bold text-white uppercase">Cuaca B (Bergeser <span className="italic text-[10px]">Δx₀</span>)</span>
              </div>
            </div>

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
        <h3 className="text-xl font-bold bg-sky-400 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Memahami Efek Kupu-Kupu (Butterfly Effect)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-cyan-400 border-b-2 border-slate-600 pb-1 mb-2">1. Kepakan Sayap Kupu-Kupu</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              <i>"Mungkinkah kepakan sayap kupu-kupu di Brasil memicu tornado di Texas?"</i> Ini adalah kiasan metaforis. Intinya: Dalam sistem kompleks (seperti cuaca bumi), perubahan awal yang sangat renik (angin sekecil kepakan sayap) dapat terakumulasi menjadi efek yang masif dan menghancurkan di kemudian hari.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-pink-400 border-b-2 border-slate-600 pb-1 mb-2">2. Sistem Deterministik Non-Linear</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Sistem ini <i>deterministik</i> (tidak ada unsur acak di rumusnya), namun masa depannya tetap <i>tidak dapat diprediksi</i> (Chaos). Mengapa? Karena manusia dan komputer tidak akan pernah bisa mengukur kondisi saat ini (suhu, angin) dengan keakuratan tak terhingga (misal, presisi desimal ke-100).
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-yellow-400 border-b-2 border-slate-600 pb-1 mb-2">3. Sang Atraktor (Bentuk Kupu-Kupu)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Bentuk angka '8' atau kupu-kupu pada grafik adalah <b>"Atraktor Lorenz"</b>. Meskipun garis-garis cuaca A dan B berpisah, mereka tidak akan lari tak terbatas ke luar angkasa; mereka akan selalu terperangkap dalam batas-batas bentuk sayap ini, berpindah dari satu sayap (musim/cuaca) ke sayap lainnya secara acak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}