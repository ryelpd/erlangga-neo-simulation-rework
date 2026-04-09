import { useState, useEffect, useRef, useCallback } from 'react';

interface FunctionDef {
  eq: (x: number) => number;
  deriv: (x: number) => number;
  name: string;
  label: string;
}

const FUNCTIONS: Record<string, FunctionDef> = {
  FUNC1: {
    eq: (x) => (x * x) / 4,
    deriv: (x) => x / 2,
    name: 'x² / 4',
    label: 'Parabola'
  },
  FUNC2: {
    eq: (x) => 3 * Math.sin(x),
    deriv: (x) => 3 * Math.cos(x),
    name: '3 sin(x)',
    label: 'Gelombang'
  },
  FUNC3: {
    eq: (x) => (Math.pow(x, 3) - 16 * x) / 10,
    deriv: (x) => (3 * x * x - 16) / 10,
    name: '(x³ - 16x) / 10',
    label: 'Kubik'
  }
};

export default function LimitTurunan() {
  const [currentFunc, setCurrentFunc] = useState('FUNC1');
  const [valA, setValA] = useState(2);
  const [valH, setValH] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const playIntervalRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const SCALE = 25;

  const mapX = useCallback((x: number) => x * SCALE, []);
  const mapY = useCallback((y: number) => -y * SCALE, []);

  const f = FUNCTIONS[currentFunc].eq;
  const df = FUNCTIONS[currentFunc].deriv;

  const xP = valA;
  const yP = f(xP);
  const xQ = valA + valH;
  const yQ = f(xQ);

  const isLimitReached = Math.abs(valH) < 0.01;
  const mTan = df(xP);
  const mSec = isLimitReached ? mTan : (yQ - yP) / valH;

  const buildCurvePath = useCallback(() => {
    let path = "";
    for (let px = -250; px <= 250; px += 2) {
      const x = px / SCALE;
      const y = f(x);
      const py = mapY(y);
      const clampedPy = Math.max(-1000, Math.min(1000, py));
      path += (px === -250 ? "M " : "L ") + px + " " + clampedPy + " ";
    }
    return path;
  }, [f, mapY]);

  const getLineExtents = useCallback((x0: number, y0: number, m: number) => {
    const startX = -12;
    const endX = 12;
    const startY = m * (startX - x0) + y0;
    const endY = m * (endX - x0) + y0;
    return {
      x1: mapX(startX), y1: mapY(startY),
      x2: mapX(endX), y2: mapY(endY)
    };
  }, [mapX, mapY]);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        setValH(prev => {
          let currH = prev;
          if (currH > 0) {
            currH -= 0.05;
            if (currH < 0) currH = 0;
          } else if (currH < 0) {
            currH += 0.05;
            if (currH > 0) currH = 0;
          }
          return currH;
        });
      }, 30);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (isLimitReached && isPlaying) {
      setIsPlaying(false);
    }
  }, [isLimitReached, isPlaying]);

  const handleFuncChange = (funcKey: string) => {
    setCurrentFunc(funcKey);
    setValH(4);
  };

  const tanCoords = getLineExtents(xP, yP, mTan);
  const secCoords = getLineExtents(xP, yP, mSec);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="text-center mb-8 bg-emerald-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_#000] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_#000]">
            MATEMATIKA: KALKULUS
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
            LAB VIRTUAL: LIMIT & TURUNAN
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
            Visualisasi Definisi Turunan: Garis Sekan Menuju Garis Singgung
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          
          <div className="w-full lg:w-1/3 bg-white border-4 border-black p-6 flex flex-col gap-6 rounded-xl shadow-[8px_8px_0px_0px_#000] relative">
            <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_0px_#34d399] text-md transform rotate-2">
              Panel Fungsi & Limit
            </span>

            <div className="flex flex-col gap-4 mt-4">
              
              <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Fungsi F(x)</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(FUNCTIONS).map(([key, func]) => (
                    <button 
                      key={key}
                      onClick={() => handleFuncChange(key)}
                      className={`py-2 px-3 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg text-left flex justify-between transition-all ${
                        currentFunc === key 
                          ? 'bg-yellow-300 text-black ring-4 ring-black' 
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="italic text-sm">f(x) = {func.name}</span>
                      <span className="text-[10px] bg-white px-1 border border-black">{func.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-yellow-800 uppercase text-[10px]">Posisi Titik P (Nilai a)</span>
                  <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-yellow-600">{valA.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="-8" 
                  max="8" 
                  step="0.1" 
                  value={valA}
                  onChange={(e) => {
                    setValA(parseFloat(e.target.value));
                    if (isPlaying) setIsPlaying(false);
                  }}
                  className="w-full"
                />
              </div>

              <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-sky-800 uppercase text-[10px]">Jarak ke Titik Q (h atau Δx)</span>
                  <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-600">{valH.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="-6" 
                  max="6" 
                  step="0.05" 
                  value={valH}
                  onChange={(e) => {
                    setValH(parseFloat(e.target.value));
                    if (isPlaying) setIsPlaying(false);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                  <span>Negatif (Kiri)</span>
                  <span>0 (Limit)</span>
                  <span>Positif (Kanan)</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (isPlaying) {
                    setIsPlaying(false);
                  } else {
                    if (Math.abs(valH) < 0.05) setValH(4);
                    setIsPlaying(true);
                  }
                }}
                className={`py-3 text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all ${
                  isPlaying ? 'bg-rose-400 hover:bg-rose-300' : 'bg-emerald-400 hover:bg-emerald-300'
                }`}
              >
                {isPlaying ? '⏸️ JEDA ANIMASI' : '▶️ DEKATI LIMIT (h → 0)'}
              </button>
            </div>

            <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
              <h4 className="font-black text-emerald-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">PERHITUNGAN GRADIEN</h4>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Δy / Δx (Sekan)</span>
                  <span className="text-xl font-black text-sky-400 font-mono">{mSec.toFixed(3)}</span>
                </div>
                <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Turunan f'(a) (Singgung)</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{mTan.toFixed(3)}</span>
                </div>
              </div>

              <div className={`bg-black p-2 border-2 border-dashed text-center mt-2 rounded ${
                isLimitReached ? 'border-emerald-500 bg-emerald-900' : 'border-slate-500'
              }`}>
                <span className={`text-xs font-black uppercase tracking-widest ${
                  isLimitReached ? 'text-emerald-400' : 'text-yellow-300'
                }`}>
                  {isLimitReached 
                    ? 'LIMIT TERCAPAI (h = 0)' 
                    : `TITIK Q BERJARAK ${Math.abs(valH).toFixed(2)} DARI P`
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            <div className="bg-pattern-dot p-0 relative flex flex-col w-full h-[600px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000]">
              <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30">
                Bidang Kartesius
              </span>

              <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-black"></div> Kurva f(x)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-sky-400"></div> Garis Sekan</div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-emerald-400"></div> Garis Singgung</div>
              </div>

              <div className="w-full h-full flex justify-center items-center">
                
                <svg ref={svgRef} viewBox="0 0 500 500" className="w-full h-full overflow-visible">
                  <g transform="translate(250, 250)">
                    
                    <g stroke="#cbd5e1" strokeWidth="1">
                      {Array.from({ length: 21 }, (_, i) => i - 10).filter(i => i !== 0).map(i => (
                        <g key={`grid-${i}`}>
                          <line x1={mapX(i)} y1={-250} x2={mapX(i)} y2={250} />
                          <line x1={-250} y1={mapY(i)} x2={250} y2={mapY(i)} />
                        </g>
                      ))}
                    </g>

                    <line x1="-250" y1="0" x2="250" y2="0" stroke="#1e293b" strokeWidth="3" />
                    <line x1="0" y1="-250" x2="0" y2="250" stroke="#1e293b" strokeWidth="3" />

                    <path d={buildCurvePath()} fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    
                    <line 
                      x1={tanCoords.x1} y1={tanCoords.y1} 
                      x2={tanCoords.x2} y2={tanCoords.y2} 
                      stroke="#10b981" strokeWidth="3" strokeDasharray="8 4" opacity="0.6"
                    />

                    <line 
                      x1={secCoords.x1} y1={secCoords.y1} 
                      x2={secCoords.x2} y2={secCoords.y2} 
                      stroke="#38bdf8" strokeWidth="4" 
                    />

                    {!isLimitReached && (
                      <path 
                        d={`M ${mapX(xP)} ${mapY(yP)} L ${mapX(xQ)} ${mapY(yP)} L ${mapX(xQ)} ${mapY(yQ)}`}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}

                    <circle cx={mapX(xP)} cy={mapY(yP)} r="7" fill="#eab308" stroke="#000" strokeWidth="2" />
                    <text x={mapX(xP) + 10} y={mapY(yP) - 10} fontSize="14" fontWeight="900" fill="#000">P</text>

                    {!isLimitReached && (
                      <>
                        <circle cx={mapX(xQ)} cy={mapY(yQ)} r="7" fill="#38bdf8" stroke="#000" strokeWidth="2" />
                        <text x={mapX(xQ) + 10} y={mapY(yQ) - 10} fontSize="14" fontWeight="900" fill="#38bdf8">Q</text>
                      </>
                    )}

                    <circle 
                      cx={mapX(xP)} cy={mapY(yP)} r="15" 
                      fill="none" stroke="#10b981" strokeWidth="4" 
                      opacity={isLimitReached ? '1' : '0'}
                      className={isLimitReached ? 'animate-pulse' : ''}
                    />

                  </g>
                </svg>
              </div>

            </div>

          </div>
        </div>

        <div className="bg-emerald-100 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_#000] mb-10">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1">
            Buku Panduan: Konsep Fundamental Turunan 📖
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">1. Titik P & Q (Garis Sekan)</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
                Titik P adalah posisi awal di <span className="italic">x = a</span>. Titik Q adalah posisi kedua yang berjarak <span className="italic">h</span> (atau Δx) dari P. Garis lurus yang memotong kedua titik ini disebut <b>Garis Sekan</b>.
              </p>
              <div className="bg-sky-50 p-2 border-2 border-sky-200 text-xs font-bold text-sky-800 font-mono text-center rounded">
                m_sekan = [ f(a+h) - f(a) ] / h
              </div>
            </div>
            
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">2. Menuju Limit h → 0</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
                Apa yang terjadi jika kita menggeser Q agar mendekati P? Garis Sekan akan ikut berputar. Saat <span className="italic">h = 0</span> persis, garis tersebut hanya menyentuh SATU titik (P), menjadi <b>Garis Singgung (Turunan)</b>.
              </p>
              <div className="bg-emerald-50 p-2 border-2 border-emerald-200 text-xs font-bold text-emerald-800 font-mono text-center rounded">
                f'(a) = lim<sub>h→0</sub> [ f(a+h) - f(a) ] / h
              </div>
            </div>
          </div>

          <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-md uppercase text-yellow-300 mb-2">Mengapa tidak langsung hitung di h = 0?</h4>
            <p className="text-sm font-semibold leading-relaxed">
              Jika Anda melihat rumus kemiringan, membaginya dengan <span className="italic">h = 0</span> akan menghasilkan <b>pembagian dengan nol (Tak Terdefinisi)</b>. Itulah mengapa kita menggunakan konsep "Limit" dalam Kalkulus; kita melihat apa nilai yang "didekati" oleh gradien tersebut saat <span className="italic">h</span> hampir (tapi tidak persis) nol.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
