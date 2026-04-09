import { useState, useEffect, useRef, useCallback } from 'react';

type SimulationMode = 'CLASSIC' | 'QUANTUM' | 'OBSERVED';

interface Particle {
  id: number;
  x: number;
  y: number;
  y1: number;
  y2: number;
  phase: 1 | 2;
  speed: number;
}

const GUN_X = 80;
const GUN_Y = 250;
const BARRIER_X = 350;
const SLIT_1_Y = 200;
const SLIT_2_Y = 300;
const SCREEN_X = 700;
const NUM_BINS = 100;
const BIN_HEIGHT = 5;

export default function FisikaKuantum() {
  const [mode, setMode] = useState<SimulationMode>('CLASSIC');
  const [firingRate, setFiringRate] = useState(5);
  const [isPlaying, setIsPlaying] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [histogram, setHistogram] = useState<number[]>(new Array(NUM_BINS).fill(0));
  const [totalHits, setTotalHits] = useState(0);
  const [maxHistValue, setMaxHistValue] = useState(1);

  const particlesRef = useRef<Particle[]>([]);
  const histogramRef = useRef<number[]>(new Array(NUM_BINS).fill(0));
  const totalHitsRef = useRef(0);
  const maxHistValueRef = useRef(1);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const waveTimerRef = useRef(0);
  const particleIdRef = useRef(0);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        let spawnChance = firingRate * 4 * dt;
        while (spawnChance > 0) {
          if (Math.random() < spawnChance) {
            spawnParticle();
          }
          spawnChance--;
        }

        if (mode === 'QUANTUM') {
          waveTimerRef.current += dt;
        }

        updateParticles(dt);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, firingRate, mode]);

  const getQuantumY = useCallback((): number => {
    while (true) {
      const y = Math.random() * 500;
      const freq = 0.055;
      const center = 250;
      const prob = Math.pow(Math.cos((y - center) * freq), 2) * Math.exp(-Math.pow(y - center, 2) / 25000);
      if (Math.random() < prob) return y;
    }
  }, []);

  const randomNormal = (): number => {
    let u = 1 - Math.random();
    let v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const getClassicY = (): number => {
    const slitCenter = Math.random() > 0.5 ? SLIT_1_Y : SLIT_2_Y;
    return slitCenter + randomNormal() * 20;
  };

  const spawnParticle = () => {
    const targetY2 = mode === 'QUANTUM' ? getQuantumY() : getClassicY();
    let targetY1: number;
    if (mode === 'QUANTUM') {
      targetY1 = Math.random() > 0.5 ? SLIT_1_Y : SLIT_2_Y;
    } else {
      targetY1 = targetY2 < 250 ? SLIT_1_Y : SLIT_2_Y;
    }

    const newParticle: Particle = {
      id: particleIdRef.current++,
      x: GUN_X,
      y: GUN_Y,
      y1: targetY1,
      y2: targetY2,
      phase: 1,
      speed: 400 + Math.random() * 100,
    };

    particlesRef.current.push(newParticle);
  };

  const updateParticles = (dt: number) => {
    const toRemove: number[] = [];

    particlesRef.current.forEach((p) => {
      let distMove = p.speed * dt;

      if (p.phase === 1) {
        let dx = BARRIER_X - p.x;
        let dy = p.y1 - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (distMove >= dist) {
          p.x = BARRIER_X;
          p.y = p.y1;
          p.phase = 2;
        } else {
          p.x += (dx / dist) * distMove;
          p.y += (dy / dist) * distMove;
        }
      } else if (p.phase === 2) {
        let dx = SCREEN_X - p.x;
        let dy = p.y2 - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (distMove >= dist) {
          recordHit(p.y2);
          toRemove.push(p.id);
        } else {
          p.x += (dx / dist) * distMove;
          p.y += (dy / dist) * distMove;
        }
      }
    });

    if (toRemove.length > 0) {
      particlesRef.current = particlesRef.current.filter((p) => !toRemove.includes(p.id));
    }

    setParticles([...particlesRef.current]);
    setHistogram([...histogramRef.current]);
    setTotalHits(totalHitsRef.current);
    setMaxHistValue(maxHistValueRef.current);
  };

  const recordHit = (y: number) => {
    totalHitsRef.current++;
    let constrainedY = Math.max(0, Math.min(499, y));
    let binIndex = Math.floor(constrainedY / BIN_HEIGHT);
    histogramRef.current[binIndex]++;
    if (histogramRef.current[binIndex] > maxHistValueRef.current) {
      maxHistValueRef.current = histogramRef.current[binIndex];
    }
  };

  const handleClear = () => {
    histogramRef.current = new Array(NUM_BINS).fill(0);
    totalHitsRef.current = 0;
    maxHistValueRef.current = 1;
    particlesRef.current = [];
    setParticles([]);
    setHistogram([...histogramRef.current]);
    setTotalHits(0);
    setMaxHistValue(1);
  };

  const handleModeChange = (newMode: SimulationMode) => {
    setMode(newMode);
    handleClear();
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    lastTimeRef.current = performance.now();
  };

  const renderHistogram = () => {
    const bars: React.ReactNode[] = [];
    for (let i = 0; i < NUM_BINS; i++) {
      if (histogram[i] > 0) {
        let width = (histogram[i] / maxHistValue) * 80;
        bars.push(
          <rect
            key={i}
            x="0"
            y={i * BIN_HEIGHT}
            width={width}
            height={BIN_HEIGHT - 0.5}
            fill="#34d399"
          />
        );
      }
    }
    return bars;
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3">
          MEKANIKA KUANTUM
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: EKSPERIMEN CELAH GANDA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Dualisme Gelombang-Partikel & Efek Pengamat
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#818cf8] text-md transform rotate-2 z-30 uppercase">
            Instrumen Pengukuran
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-xl">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Perilaku Elektron</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleModeChange('CLASSIC')}
                  className={`neo-btn py-3 px-3 text-xs font-bold text-left flex justify-between items-center transition-all ${
                    mode === 'CLASSIC'
                      ? 'bg-rose-300 ring-4 ring-black'
                      : 'bg-white text-slate-600'
                  } border-4 border-black shadow-[4px_4px_0px_0px_#000]`}
                >
                  <span>🔵 PARTIKEL (KLASIK)</span>
                </button>
                <button
                  onClick={() => handleModeChange('QUANTUM')}
                  className={`neo-btn py-3 px-3 text-xs font-bold text-left flex justify-between items-center transition-all ${
                    mode === 'QUANTUM'
                      ? 'bg-indigo-300 ring-4 ring-black'
                      : 'bg-white text-slate-600'
                  } border-4 border-black shadow-[4px_4px_0px_0px_#000]`}
                >
                  <span>🌊 GELOMBANG (KUANTUM)</span>
                </button>
                <button
                  onClick={() => handleModeChange('OBSERVED')}
                  className={`neo-btn py-3 px-3 text-xs font-bold text-left flex justify-between items-center transition-all ${
                    mode === 'OBSERVED'
                      ? 'bg-rose-300 ring-4 ring-black'
                      : 'bg-white text-slate-600'
                  } border-4 border-black shadow-[4px_4px_0px_0px_#000]`}
                >
                  <span>👁️ KUANTUM + DETEKTOR</span>
                </button>
              </div>
            </div>

            <div className="bg-indigo-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-indigo-800 uppercase text-[10px]">Laju Tembakan Elektron</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-indigo-600">
                  {firingRate < 10 ? 'Lambat' : firingRate < 30 ? 'Sedang' : 'Sangat Cepat'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={firingRate}
                onChange={(e) => setFiringRate(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={handlePlayPause}
                className={`neo-btn py-3 text-sm flex-1 flex items-center justify-center gap-2 ${
                  isPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'
                } border-4 border-black shadow-[4px_4px_0px_0px_#000]`}
              >
                {isPlaying ? '⏸️ JEDA EKSPERIMEN' : '▶️ LANJUTKAN EKSPERIMEN'}
              </button>
              <button
                onClick={handleClear}
                className="neo-btn bg-slate-200 hover:bg-slate-300 py-3 px-4 text-sm flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000]"
              >
                🧹 HAPUS
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-xl">
            <h4 className="font-black text-indigo-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">
              DATA DETEKTOR LAYAR
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Total Tumbukan</span>
                <span className="text-xl font-black text-white font-mono">{totalHits}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center text-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Pola Terbentuk</span>
                <span className={`text-xs font-black uppercase mt-1 ${
                  mode === 'QUANTUM' ? 'text-indigo-400' : 'text-rose-400'
                }`}>
                  {mode === 'QUANTUM' ? 'Pola Interferensi' : '2 Garis (Partikel)'}
                </span>
              </div>
            </div>
            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex flex-col items-center mt-2">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Fungsi Gelombang (Ψ)</span>
              <span className={`text-xs font-black uppercase tracking-widest ${
                mode === 'CLASSIC' ? 'text-slate-400' : mode === 'QUANTUM' ? 'text-indigo-400' : 'text-rose-400'
              }`}>
                {mode === 'CLASSIC' ? 'N/A (Klasik)' : mode === 'QUANTUM' ? 'Superposisi Aktif' : 'Kolaps (Runtuh)'}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-900 border-8 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-0 relative flex flex-col w-full h-[600px] overflow-hidden">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Ruang Hampa Udara
            </span>

            <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] text-white">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-sky-400 rounded-full border border-black"></div> Elektron
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-emerald-400"></div> Distribusi Probabilitas
              </div>
              {mode === 'OBSERVED' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-500 border border-black"></div> Detektor Aktif
                </div>
              )}
            </div>

            <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
              <defs>
                <pattern id="gridKv" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="1" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="800" height="500" fill="url(#gridKv)" />

              <g transform="translate(710, 0)">
                <line x1="0" y1="0" x2="0" y2="500" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
                {renderHistogram()}
              </g>

              <g transform="translate(20, 220)">
                <rect x="0" y="0" width="40" height="60" fill="#64748b" stroke="#ffffff" strokeWidth="3" />
                <rect x="40" y="20" width="20" height="20" fill="#334155" stroke="#ffffff" strokeWidth="3" />
                <circle cx="60" cy="30" r="5" fill="#ef4444" />
                <text x="20" y="80" textAnchor="middle" fontWeight="900" fontSize="12" fill="#fff">GUN</text>
              </g>

              <g transform="translate(350, 0)">
                <rect x="0" y="0" width="20" height="180" fill="#f8fafc" stroke="#000" strokeWidth="4" />
                <rect x="0" y="220" width="20" height="60" fill="#f8fafc" stroke="#000" strokeWidth="4" />
                <rect x="0" y="320" width="20" height="180" fill="#f8fafc" stroke="#000" strokeWidth="4" />

                {mode === 'OBSERVED' && (
                  <>
                    <g transform="translate(10, 160)">
                      <circle cx="0" cy="0" r="15" fill="#ef4444" stroke="#fff" strokeWidth="3" />
                      <circle cx="0" cy="0" r="5" fill="#000" />
                      <path d="M 0 0 L -30 -30 M 0 0 L -30 30" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
                    </g>
                    <g transform="translate(10, 340)">
                      <circle cx="0" cy="0" r="15" fill="#ef4444" stroke="#fff" strokeWidth="3" />
                      <circle cx="0" cy="0" r="5" fill="#000" />
                      <path d="M 0 0 L -30 -30 M 0 0 L -30 30" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
                    </g>
                  </>
                )}
              </g>

              <rect x="700" y="0" width="10" height="500" fill="#38bdf8" stroke="#fff" strokeWidth="2" />
              <text x="705" y="480" textAnchor="middle" fontWeight="900" fontSize="14" fill="#fff" transform="rotate(-90 705 480)">
                SCREEN DETEKTOR
              </text>

              {particles.map((p) => (
                <circle
                  key={p.id}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill={mode === 'QUANTUM' && p.phase === 2 ? '#818cf8' : '#38bdf8'}
                  opacity={mode === 'QUANTUM' && p.phase === 2 ? 0.3 : 1}
                  filter="url(#glow)"
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-indigo-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Misteri Terbesar Kuantum 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">1. Mode Partikel (Klasik)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Jika elektron hanya berupa bola padat seperti peluru, menembakkannya melewati dua celah secara acak akan menghasilkan <b>Dua Pita/Garis</b> pada layar. Mirip seperti menyoprolkan cat melalui stensil.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-indigo-600 border-b-2 border-black pb-1 mb-2">2. Mode Kuantum</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Anehnya, eksperimen asli menunjukkan bahwa elektron menciptakan <b>Pola Interferensi (Banyak Garis)</b>. Ini berarti elektron bergerak seperti gelombang (melewati KEDUA celah secara bersamaan) dan berinterferensi dengan dirinya sendiri sebelum menghantam layar sebagai satu titik partikel!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">3. Efek Pengamat (Observer)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Apa yang terjadi jika kita pasang kamera (Detektor) di celah untuk "mengintip" celah mana yang dilewati elektron? Alam semesta seakan tahu ia sedang diawasi. Fungsi gelombangnya <b>Runtuh (Collapse)</b>, dan elektron kembali bertingkah laku seperti partikel padat (Kembali menjadi 2 garis).
            </p>
          </div>
        </div>

        <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <h4 className="font-black text-md uppercase text-yellow-300 mb-2">Persamaan Schrödinger & Probabilitas</h4>
          <p className="text-sm font-semibold leading-relaxed text-slate-300">
            Dalam mekanika kuantum, kita tidak bisa memprediksi di mana pastinya SEBUAH elektron akan mendarat. Kita hanya bisa memprediksi probabilitasnya melalui <b>Kuadrat Fungsi Gelombang (|Ψ|²)</b>. Histogram hijau di sebelah kanan layar menunjukkan bahwa setelah menembakkan ribuan elektron, pola probabilitas matematis ini akan muncul dengan sendirinya secara sempurna.
          </p>
        </div>
      </div>
    </div>
  );
}
