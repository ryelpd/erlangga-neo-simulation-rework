import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const CX = 400;
const BASE_BREATH_SPEED = 0.05;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  status: 'inhaling' | 'exhaling';
}

interface TrappedDot {
  x: number;
  y: number;
  size: number;
}

interface AQIStatus {
  color: string;
  text: string;
}

const getAQIStatus = (aqi: number): AQIStatus => {
  if (aqi <= 50) return { color: "#10b981", text: "Baik" };
  if (aqi <= 100) return { color: "#eab308", text: "Sedang" };
  if (aqi <= 150) return { color: "#f97316", text: "Tidak Sehat (Sensitif)" };
  if (aqi <= 200) return { color: "#ef4444", text: "Tidak Sehat" };
  if (aqi <= 300) return { color: "#a855f7", text: "Sangat Tidak Sehat" };
  return { color: "#7f1d1d", text: "Berbahaya" };
};

const activityLabels = ["", "Istirahat", "Berjalan", "Olahraga"];

export default function PolusiUdara(): ReactNode {
  const [aqi, setAqi] = useState(50);
  const [activityLevel, setActivityLevel] = useState(1);
  const [lungCapacity, setLungCapacity] = useState(100);
  const [toxicity, setToxicity] = useState(0);
  const [status, setStatus] = useState('PARU-PARU SEHAT');
  const [statusColor, setStatusColor] = useState('text-emerald-400');
  const [showAlert, setShowAlert] = useState(false);
  const [bgDarkness, setBgDarkness] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const trappedDotsRef = useRef<TrappedDot[]>([]);
  const lungCapacityRef = useRef(100);
  const toxicityRef = useRef(0);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const drawLungPath = useCallback((
    ctx: CanvasRenderingContext2D,
    side: 'left' | 'right',
    scaleX: number,
    scaleY: number
  ) => {
    const mult = side === 'left' ? -1 : 1;

    ctx.save();
    ctx.translate(CX, 150);
    ctx.scale(scaleX * mult, scaleY);

    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.bezierCurveTo(50, -20, 120, 50, 140, 150);
    ctx.bezierCurveTo(150, 250, 80, 280, 20, 270);
    ctx.bezierCurveTo(-10, 260, 5, 100, 10, 0);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const capacity = lungCapacityRef.current;
    const compensation = (100 - capacity) / 50;
    const breathSpeed = BASE_BREATH_SPEED * (activityLevel + compensation);
    timeRef.current += breathSpeed;

    const breathCycle = Math.sin(timeRef.current);
    const maxExpansion = 0.15 * (capacity / 100);
    const scaleX = 1 + breathCycle * maxExpansion;
    const scaleY = 1 + breathCycle * maxExpansion * 1.2;

    const damageRatio = (100 - capacity) / 70;
    const r = Math.floor(244 - (244 - 51) * damageRatio);
    const g = Math.floor(114 - (114 - 65) * damageRatio);
    const b = Math.floor(182 - (182 - 85) * damageRatio);
    const lungColor = `rgb(${r}, ${g}, ${b})`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Trachea
    ctx.fillStyle = '#fbcfe8';
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 4;
    ctx.fillRect(CX - 15, 0, 30, 160);
    ctx.strokeRect(CX - 15, 0, 30, 160);

    for (let y = 20; y < 140; y += 15) {
      ctx.beginPath();
      ctx.moveTo(CX - 15, y);
      ctx.lineTo(CX + 15, y);
      ctx.stroke();
    }

    // Draw Lungs
    ctx.fillStyle = lungColor;
    ctx.strokeStyle = '#9d174d';
    ctx.lineWidth = 4;

    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    drawLungPath(ctx, 'left', scaleX, scaleY);
    drawLungPath(ctx, 'right', scaleX, scaleY);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw trapped particles
    for (const dot of trappedDotsRef.current) {
      const side = dot.x < CX ? 'left' : 'right';
      const mult = side === 'left' ? -1 : 1;

      const relX = (dot.x - CX) * scaleX * mult;
      const relY = (dot.y - 150) * scaleY;

      const drawX = CX + relX;
      const drawY = 150 + relY;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.arc(drawX, drawY, dot.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw active particles
    ctx.fillStyle = '#64748b';
    for (const p of particlesRef.current) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [activityLevel, drawLungPath]);

  const updatePhysics = useCallback(() => {

    // Spawn particles during inhalation
    if (Math.sin(timeRef.current) > 0 && Math.random() < (aqi / 500) * activityLevel) {
      for (let i = 0; i < Math.ceil(aqi / 100); i++) {
        particlesRef.current.push({
          x: CX + (Math.random() - 0.5) * 40,
          y: 0,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3 * activityLevel,
          status: 'inhaling'
        });
      }
    }

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.y > 150) {
        if (p.status === 'inhaling') {
          p.vx += (p.x < CX ? -0.5 : 0.5) * Math.random();
          p.vy *= 0.95;

          if (Math.random() < 0.02 || p.y > 350 + Math.random() * 100) {
            if (trappedDotsRef.current.length < 1000) {
              trappedDotsRef.current.push({
                x: p.x,
                y: p.y,
                size: 1 + Math.random() * 2
              });
            }
            particlesRef.current.splice(i, 1);
            continue;
          }
        }
      }

      if (Math.sin(timeRef.current) < 0) {
        p.status = 'exhaling';
        p.vy -= 0.5;
        p.vx += (CX - p.x) * 0.01;
      }

      if (p.y < -10) {
        particlesRef.current.splice(i, 1);
      }
    }

    // Accumulation of PM2.5
    if (Math.sin(timeRef.current) > 0) {
      const intakeRate = (aqi / 100) * activityLevel * 0.5;
      toxicityRef.current += intakeRate;
      setToxicity(toxicityRef.current);
    }

    // Update lung capacity
    const newCapacity = Math.max(30, 100 - (toxicityRef.current / 150));
    lungCapacityRef.current = newCapacity;
    setLungCapacity(newCapacity);

    // Update status
    if (newCapacity > 90) {
      setStatus('PARU-PARU SEHAT');
      setStatusColor('text-emerald-400');
      setShowAlert(false);
    } else if (newCapacity > 60) {
      setStatus('IRITASI SALURAN NAPAS');
      setStatusColor('text-yellow-400');
      setShowAlert(false);
    } else {
      setStatus('PPOK / GAGAL NAPAS');
      setStatusColor('text-rose-200');
      if (newCapacity < 50) setShowAlert(true);
    }

    // Update background darkness
    const darkness = Math.min(0.5, aqi / 1000);
    setBgDarkness(darkness);
  }, [aqi, activityLevel]);

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

  const handleClearAir = () => {
    setAqi(0);
  };

  const handleDetox = () => {
    toxicityRef.current = 0;
    lungCapacityRef.current = 100;
    trappedDotsRef.current = [];
    particlesRef.current = [];
    setToxicity(0);
    setLungCapacity(100);
  };

  const aqiStatus = getAQIStatus(aqi);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">KESEHATAN LINGKUNGAN & RESPIRASI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: POLUSI & PARU-PARU
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Efek Partikulat PM2.5 terhadap Kapasitas & Jaringan Pernapasan
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#64748b] text-md transform rotate-2 z-30 uppercase">
            Panel Variabel
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-slate-900 uppercase text-[10px]">Tingkat Polusi PM2.5 (AQI)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black" style={{ color: aqiStatus.color }}>{aqi} ({aqiStatus.text})</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={aqi}
                onChange={(e) => setAqi(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-slate-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span className="text-emerald-600">Hijau (0)</span>
                <span className="text-rose-600">Berbahaya (500)</span>
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-900 uppercase text-[10px]">Aktivitas Fisik</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-600">{activityLabels[activityLevel]}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={activityLevel}
                onChange={(e) => setActivityLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Istirahat</span>
                <span>Berjalan</span>
                <span>Olahraga</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button
                onClick={handleClearAir}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#064e3b] rounded-lg bg-emerald-400 hover:bg-emerald-300 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                GUNAKAN AIR PURIFIER (AQI 0)
              </button>
              <button
                onClick={handleDetox}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#1e3a8a] rounded-lg bg-blue-500 text-white hover:bg-blue-400 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                DETOKS PARU-PARU (RESET)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-slate-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-slate-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">MONITOR SPIROMETRI</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-sky-400 mb-1">Kapasitas Vital</span>
                <span className={`text-xl font-black ${lungCapacity > 90 ? 'text-emerald-400' : lungCapacity > 60 ? 'text-yellow-400' : 'text-rose-500'}`}>
                  {lungCapacity.toFixed(1)}%
                </span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-rose-900 rounded flex flex-col items-center relative overflow-hidden">
                <span className="text-[9px] font-bold uppercase text-rose-400 mb-1">PM2.5 Mengendap</span>
                <span className="text-xl font-black text-rose-500 relative z-10">{Math.floor(toxicity)} µg</span>
              </div>
            </div>

            <div className={`p-2 border-2 border-dashed text-center flex flex-col items-center justify-center min-h-[50px] transition-colors duration-300 rounded ${lungCapacity > 90 ? 'bg-black border-emerald-500' : lungCapacity > 60 ? 'bg-black border-yellow-500' : 'bg-rose-900 border-rose-500'}`}>
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Diagnosa Klinis:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${statusColor}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div 
            className="bg-[#f8fafc] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden" 
            style={{ 
              backgroundImage: 'radial-gradient(rgba(100, 116, 139, 0.2) 3px, transparent 3px)', 
              backgroundSize: '40px 40px',
              backgroundColor: `rgba(100, 116, 139, ${bgDarkness})`
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Kamera Trakea & Alveolus
            </span>

            {showAlert && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-rose-600 text-white font-black px-8 py-4 border-8 border-black shadow-[8px_8px_0px_#000] text-3xl uppercase z-40 tracking-widest pointer-events-none text-center leading-tight animate-pulse">
                SESAK NAPAS!
                <br />
                <span className="text-sm">PENURUNAN FUNGSI PARU (PPOK)</span>
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
        <h3 className="text-xl font-bold bg-sky-400 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan Polusi & Respirasi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-slate-300 border-b-2 border-slate-600 pb-1 mb-2">Partikel PM2.5</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              <b>PM2.5</b> adalah partikel polutan mikroskopis (berdiameter 2.5 mikrometer atau lebih kecil, ~30x lebih kecil dari rambut manusia). Ukurannya yang sangat kecil memungkinkannya lolos dari bulu hidung dan masuk jauh ke dalam kantung udara (alveolus) paru-paru.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-400 border-b-2 border-slate-600 pb-1 mb-2">Kerusakan Jaringan</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Akumulasi partikel beracun ini memicu <b>peradangan kronis</b>. Seiring waktu, jaringan paru yang elastis (merah muda) menjadi kaku, menghitam (mirip paru-paru perokok), dan kehilangan kemampuannya untuk mengembang secara maksimal, sehingga menurunkan kapasitas vital.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">Mekanisme Sesak Napas</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Saat kapasitas paru menurun drastis, tubuh merespons dengan <b>bernapas lebih cepat dan dangkal</b> (hiperventilasi) untuk memenuhi kebutuhan oksigen. Dalam jangka panjang, kondisi ini berkembang menjadi Asma atau Penyakit Paru Obstruktif Kronis (PPOK).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}