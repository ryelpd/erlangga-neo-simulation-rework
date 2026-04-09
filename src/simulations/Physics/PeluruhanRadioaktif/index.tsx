import { useState, useEffect, useRef, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isStable: boolean;
  flashTimer: number;
}

interface GraphPoint {
  t: number;
  u: number;
  s: number;
}

const TOTAL_WIDTH = 800;
const TOTAL_HEIGHT = 500;

export default function PeluruhanRadioaktif() {
  const [halfLife, setHalfLife] = useState(3);
  const [totalAtoms, setTotalAtoms] = useState(400);
  const [unstableCount, setUnstableCount] = useState(400);
  const [stableCount, setStableCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [graphData, setGraphData] = useState<GraphPoint[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('3');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const maxGraphTimeRef = useRef(15);

  const lambda = Math.LN2 / halfLife;

  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    const w = TOTAL_WIDTH;
    const h = TOTAL_HEIGHT;
    const padding = 20;

    for (let i = 0; i < totalAtoms; i++) {
      particles.push({
        id: i,
        x: padding + Math.random() * (w - padding * 2),
        y: padding + Math.random() * (h - padding * 2),
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        isStable: false,
        flashTimer: 0,
      });
    }

    particlesRef.current = particles;
    setUnstableCount(totalAtoms);
    setStableCount(0);
    setTimeElapsed(0);
    setGraphData([]);
    maxGraphTimeRef.current = halfLife * 5;
  }, [totalAtoms, halfLife]);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const safeDt = Math.min(dt, 0.1);

      if (isPlaying && unstableCount > 0 && timeElapsed < maxGraphTimeRef.current) {
        updateSimulation(safeDt);
      }

      drawCanvas();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, unstableCount, timeElapsed, halfLife, totalAtoms]);

  const updateSimulation = (dt: number) => {
    const newTime = timeElapsed + dt;
    setTimeElapsed(newTime);

    const decayProb = 1 - Math.exp(-lambda * dt);
    let decays = 0;

    particlesRef.current.forEach((p) => {
      if (!p.isStable) {
        if (Math.random() < decayProb) {
          p.isStable = true;
          p.flashTimer = 0.2;
          decays++;
        }
      }
    });

    setUnstableCount((prev) => Math.max(0, prev - decays));
    setStableCount((prev) => prev + decays);

    setGraphData((prev) => {
      if (prev.length === 0 || newTime - prev[prev.length - 1].t >= 0.1) {
        return [
          ...prev,
          {
            t: newTime,
            u: unstableCount,
            s: stableCount + decays,
          },
        ];
      }
      return prev;
    });
  };

  const currentActivity = lambda * unstableCount;
  const activityDisplay = Math.round(currentActivity);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, TOTAL_WIDTH, TOTAL_HEIGHT);

    particlesRef.current.forEach((p) => {
      if (!p.isStable) {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        if (p.x < 5 || p.x > TOTAL_WIDTH - 5) p.vx *= -1;
        if (p.y < 5 || p.y > TOTAL_HEIGHT - 5) p.vy *= -1;
        if (Math.random() < 0.05) {
          p.vx += (Math.random() - 0.5) * 5;
          p.vy += (Math.random() - 0.5) * 5;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);

      if (!p.isStable) {
        ctx.fillStyle = '#f43f5e';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#f43f5e';
      } else {
        ctx.shadowBlur = 0;
        if (p.flashTimer > 0) {
          ctx.fillStyle = '#fef08a';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fef08a';
          p.flashTimer -= 0.016;
        } else {
          ctx.fillStyle = '#64748b';
        }
      }

      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  };

  const handlePreset = (preset: string, hl: number) => {
    setSelectedPreset(preset);
    setHalfLife(hl);
    if (isPlaying) setIsPlaying(false);
  };

  const handleSliderChange = (val: number) => {
    setHalfLife(val);
    setSelectedPreset('custom');
  };

  const handleAtomsChange = (val: number) => {
    setTotalAtoms(val);
    if (isPlaying) setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (unstableCount === 0 || timeElapsed >= maxGraphTimeRef.current) {
      initParticles();
    }
    setIsPlaying(!isPlaying);
    lastTimeRef.current = performance.now();
  };

  const handleReset = () => {
    if (isPlaying) setIsPlaying(false);
    initParticles();
  };

  const renderGraph = () => {
    if (graphData.length === 0) return null;

    const maxT = maxGraphTimeRef.current;
    const maxN = totalAtoms;

    let ptsUnstable = '';
    let ptsStable = '';

    graphData.forEach((d) => {
      const x = (d.t / maxT) * 1000;
      const yu = 100 - (d.u / maxN) * 100;
      const ys = 100 - (d.s / maxN) * 100;
      ptsUnstable += `${x.toFixed(1)},${yu.toFixed(1)} `;
      ptsStable += `${x.toFixed(1)},${ys.toFixed(1)} `;
    });

    const halfLifeMarkers = [];
    for (let i = 1; i <= 5; i++) {
      const x = (i * halfLife) / maxT;
      if (x <= 1) {
        halfLifeMarkers.push(
          <line
            key={i}
            x1={x * 1000}
            y1={0}
            x2={x * 1000}
            y2={100}
            stroke="#475569"
            strokeDasharray="2 4"
            strokeWidth="1"
          />
        );
      }
    }

    return (
      <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute left-8 right-0 top-1 bottom-5 w-[calc(100%-32px)] h-[calc(100%-24px)] border-l-2 border-slate-700">
        <line x1="0" y1="50" x2="1000" y2="50" stroke="#334155" strokeDasharray="5 5" strokeWidth="1" />
        {halfLifeMarkers}
        <polyline fill="none" stroke="#f43f5e" strokeWidth="3" points={ptsUnstable} strokeLinejoin="round" />
        <polyline fill="none" stroke="#94a3b8" strokeWidth="3" points={ptsStable} strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-rose-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3">
          FISIKA KUANTUM & INTI
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: PELURUHAN RADIOAKTIF
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Waktu Paruh, Aktivitas Inti, dan Kurva Eksponensial
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f43f5e] text-md transform rotate-2 z-30 uppercase">
            Panel Isotop
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-xl">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Sampel Isotop</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePreset('3', 3)}
                  className={`neo-btn py-2 px-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                    selectedPreset === '3' ? 'bg-rose-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  ⏱️ Iodium-131 (Cepat)
                </button>
                <button
                  onClick={() => handlePreset('8', 8)}
                  className={`neo-btn py-2 px-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                    selectedPreset === '8' ? 'bg-rose-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  🦴 Karbon-14 (Sedang)
                </button>
                <button
                  onClick={() => handlePreset('15', 15)}
                  className={`neo-btn py-2 px-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                    selectedPreset === '15' ? 'bg-rose-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  ☢️ Uranium-238 (Lama)
                </button>
                <button
                  onClick={() => handlePreset('custom', halfLife)}
                  className={`neo-btn py-2 px-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                    selectedPreset === 'custom' ? 'bg-rose-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  ⚙️ Kustom (Manual)
                </button>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">
                  Waktu Paruh / Half-Life (T<sub>1/2</sub>)
                </span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">
                  {halfLife.toFixed(1)} s
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={halfLife}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                disabled={selectedPreset !== 'custom'}
                className="w-full appearance-none bg-transparent cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-800 uppercase text-[10px]">
                  Jumlah Atom Awal (N<sub>0</sub>)
                </span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-blue-600">
                  {totalAtoms}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={totalAtoms}
                onChange={(e) => handleAtomsChange(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={handlePlayPause}
                className={`neo-btn py-3 text-sm flex-1 flex items-center justify-center gap-2 ${
                  isPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'
                } border-4 border-black shadow-[4px_4px_0px_0px_#000]`}
              >
                {isPlaying ? '⏸️ JEDA SIMULASI' : '▶️ MULAI PELURUHAN'}
              </button>
              <button
                onClick={handleReset}
                className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-4 text-xs flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000]"
              >
                🔄 RESET
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-xl">
            <h4 className="font-black text-rose-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">
              DATA PENGAMATAN REAL-TIME
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-slate-800 p-2 border-2 border-rose-500 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-rose-300 mb-1">Atom Radioaktif</span>
                <span className="text-xl font-black text-rose-400 font-mono">{unstableCount}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-500 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-300 mb-1">Atom Stabil</span>
                <span className="text-xl font-black text-slate-300 font-mono">{stableCount}</span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-black p-2 border-2 border-dashed border-slate-500 mt-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Waktu Berlalu (t):</span>
              <span className="text-lg font-black text-yellow-300 font-mono">{timeElapsed.toFixed(1)} s</span>
            </div>
            <div className="flex justify-between items-center bg-black p-2 border-2 border-dashed border-slate-500 mt-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Aktivitas (A = λN):</span>
              <span className="text-md font-black text-sky-400 font-mono">{activityDisplay} Bq</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 border-8 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-0 relative flex flex-col w-full h-[400px] overflow-hidden">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Kamar Sampel Radioaktif
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full border border-black"></div> Unstable (Radioaktif)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-400 rounded-full border border-black"></div> Stable (Meluruh)
              </div>
            </div>

            <div className="w-full h-full p-2">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full h-full block rounded-lg border-4 border-slate-300 bg-slate-900 shadow-inner"
              />
            </div>
          </div>

          <div className="bg-slate-900 p-4 relative flex flex-col w-full h-[200px] border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-white text-[10px] mb-2 uppercase tracking-widest border-b-2 border-slate-700 pb-1">
              KURVA PELURUHAN EKSPONENSIAL
            </h4>
            <div className="relative w-full h-full">
              <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[8px] text-slate-500 font-bold py-1">
                <span id="graphMaxY">100%</span>
                <span>50%</span>
                <span>0</span>
              </div>
              <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[8px] text-slate-500 font-bold border-t-2 border-slate-700 pt-1">
                <span>0s</span>
                <span>{maxGraphTimeRef.current.toFixed(0)}s</span>
              </div>
              {renderGraph()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-rose-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Konsep Waktu Paruh 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Sifat Probabilistik (Acak)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Kita <b>tidak akan pernah tahu</b> atom spesifik mana yang akan meluruh dalam detik berikutnya. Proses ini diatur oleh mekanika kuantum murni yang bersifat probabilistik. Namun, jika kita melihatnya dalam jumlah besar (Makroskopis), pola statistiknya sangat bisa diprediksi!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Waktu Paruh (T<sub>1/2</sub>)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Waktu Paruh adalah waktu yang dibutuhkan agar <b>tepat setengah (50%)</b> dari total atom radioaktif meluruh menjadi stabil.
              <br /><br />
              Contoh: Jika awalnya ada 400 atom, setelah 1 Waktu Paruh sisa 200. Setelah 2 Waktu Paruh sisa 100. Kemudian 50, 25, dan seterusnya.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Hukum Peluruhan & Aktivitas</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              <span className="font-serif italic font-bold">N(t) = N<sub>0</sub> · (1/2)<sup>t / T</sup></span>
              <br /><br />
              Aktivitas (A) adalah jumlah peluruhan per detik (Becquerel/Bq). Semakin sedikit sisa atom radioaktif, semakin lambat laju peluruhannya. Oleh karena itu, kurvanya melandai, bukan membentuk garis lurus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
