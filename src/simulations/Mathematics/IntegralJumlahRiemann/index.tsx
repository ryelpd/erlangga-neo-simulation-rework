import { useState, useEffect, useRef, useCallback } from 'react';

interface FunctionDef {
  eq: (x: number) => number;
  antideriv: (x: number) => number;
  name: string;
  label: string;
}

const FUNCTIONS: Record<string, FunctionDef> = {
  FUNC1: {
    eq: (x) => (-x * x / 4) + 8,
    antideriv: (x) => (-Math.pow(x, 3) / 12) + (8 * x),
    name: '-x²/4 + 8',
    label: 'Parabola'
  },
  FUNC2: {
    eq: (x) => 2 * Math.sin(x) + 5,
    antideriv: (x) => -2 * Math.cos(x) + (5 * x),
    name: '2 sin(x) + 5',
    label: 'Gelombang'
  }
};

export default function IntegralJumlahRiemann() {
  const [currentFunc, setCurrentFunc] = useState('FUNC1');
  const [currentMethod, setCurrentMethod] = useState<'LEFT' | 'MID' | 'RIGHT'>('LEFT');
  const [valA, setValA] = useState(-4);
  const [valB, setValB] = useState(4);
  const [valN, setValN] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const playIntervalRef = useRef<number | null>(null);

  const SCALE = 25;

  const mapX = useCallback((x: number) => x * SCALE, []);
  const mapY = useCallback((y: number) => -y * SCALE, []);

  const f = FUNCTIONS[currentFunc].eq;
  const F = FUNCTIONS[currentFunc].antideriv;

  const dx = (valB - valA) / valN;
  const exactArea = F(valB) - F(valA);

  let sumArea = 0;
  for (let i = 0; i < valN; i++) {
    const xLeft = valA + (i * dx);
    const xRight = xLeft + dx;
    let xEval;
    if (currentMethod === 'LEFT') xEval = xLeft;
    else if (currentMethod === 'RIGHT') xEval = xRight;
    else xEval = xLeft + (dx / 2);
    const yEval = f(xEval);
    sumArea += yEval * dx;
  }
  const error = Math.abs(exactArea - sumArea);

  const buildCurvePath = useCallback(() => {
    let path = "";
    for (let px = -250; px <= 250; px += 2) {
      const x = px / SCALE;
      const y = f(x);
      const py = mapY(y);
      const clampedPy = Math.max(-1000, Math.min(200, py));
      path += (px === -250 ? "M " : "L ") + px + " " + clampedPy + " ";
    }
    return path;
  }, [f, mapY]);

  const getExactAreaPath = useCallback(() => {
    let pathD = `M ${mapX(valA)} 0 `;
    for (let x = valA; x <= valB; x += 0.1) {
      pathD += `L ${mapX(x)} ${mapY(f(x))} `;
    }
    pathD += `L ${mapX(valB)} ${mapY(f(valB))} `;
    pathD += `L ${mapX(valB)} 0 Z`;
    return pathD;
  }, [valA, valB, f, mapX, mapY]);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        setValN(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return prev;
          }
          const jump = Math.max(1, Math.floor(prev * 0.1));
          const next = prev + jump;
          return next > 100 ? 100 : next;
        });
      }, 50);
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

  const handleFuncChange = (funcKey: string) => {
    setCurrentFunc(funcKey);
  };

  const handleMethodChange = (method: 'LEFT' | 'MID' | 'RIGHT') => {
    setCurrentMethod(method);
  };

  const handleBoundsChange = (newA: number, newB: number) => {
    if (newA >= newB) {
      newB = newA + 0.5;
    }
    setValA(newA);
    setValB(newB);
  };

  const renderRectangles = () => {
    const rects = [];
    for (let i = 0; i < valN; i++) {
      const xLeft = valA + (i * dx);
      const xRight = xLeft + dx;
      let xEval;
      if (currentMethod === 'LEFT') xEval = xLeft;
      else if (currentMethod === 'RIGHT') xEval = xRight;
      else xEval = xLeft + (dx / 2);
      const yEval = f(xEval);

      const svgX = mapX(xLeft);
      let svgY, svgHeight;
      if (yEval >= 0) {
        svgY = mapY(yEval);
        svgHeight = yEval * SCALE;
      } else {
        svgY = mapY(0);
        svgHeight = Math.abs(yEval) * SCALE;
      }
      const svgWidth = dx * SCALE;

      rects.push(
        <rect
          key={i}
          x={svgX}
          y={svgY}
          width={svgWidth}
          height={svgHeight}
          fill="#38bdf8"
          fillOpacity={0.6}
          stroke="#0f172a"
          strokeWidth={valN > 40 ? 0.5 : 1.5}
        />
      );
    }
    return rects;
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="text-center mb-8 bg-sky-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_#000] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_#000]">
            MATEMATIKA: KALKULUS
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
            LAB VIRTUAL: INTEGRAL
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
            Mendekati Luas Kurva dengan Jumlah Riemann (n → ∞)
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          
          <div className="w-full lg:w-1/3 bg-white border-4 border-black p-6 flex flex-col gap-6 rounded-xl shadow-[8px_8px_0px_0px_#000] relative">
            <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_0px_#38bdf8] text-md transform rotate-2">
              Panel Kurva & Partisi
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

              <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-slate-500">Metode Titik Sampel</label>
                <div className="flex items-center gap-2">
                  {['LEFT', 'MID', 'RIGHT'].map(method => (
                    <button 
                      key={method}
                      onClick={() => handleMethodChange(method as 'LEFT' | 'MID' | 'RIGHT')}
                      className={`py-1 px-2 text-[10px] font-bold border-4 border-black shadow-[2px_2px_0px_0px_#000] rounded-lg flex-1 transition-all ${
                        currentMethod === method 
                          ? 'bg-indigo-300 text-black ring-2 ring-black' 
                          : 'bg-white text-slate-600'
                      }`}
                    >
                      {method === 'LEFT' ? 'KIRI' : method === 'MID' ? 'TENGAH' : 'KANAN'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-rose-800 uppercase text-[10px]">Batas Bawah (a)</span>
                    <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{valA.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-8" 
                    max="8" 
                    step="0.5" 
                    value={valA}
                    onChange={(e) => handleBoundsChange(parseFloat(e.target.value), valB)}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1 border-t-2 border-dashed border-slate-300 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-emerald-800 uppercase text-[10px]">Batas Atas (b)</span>
                    <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-600">{valB.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-8" 
                    max="8" 
                    step="0.5" 
                    value={valB}
                    onChange={(e) => handleBoundsChange(valA, parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-sky-800 uppercase text-[10px]">Jumlah Persegi (n)</span>
                  <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-600">{valN}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  step="1" 
                  value={valN}
                  onChange={(e) => {
                    setValN(parseInt(e.target.value));
                    if (isPlaying) setIsPlaying(false);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                  <span>1 (Kasar)</span>
                  <span>100 (Halus)</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (isPlaying) {
                    setIsPlaying(false);
                  } else {
                    if (valN > 90) setValN(1);
                    setIsPlaying(true);
                  }
                }}
                className={`py-3 text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all ${
                  isPlaying ? 'bg-rose-400 hover:bg-rose-300' : 'bg-sky-400 hover:bg-sky-300'
                }`}
              >
                {isPlaying ? '⏸️ JEDA ANIMASI' : '▶️ ANIMASI (n → ∞)'}
              </button>
            </div>

            <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
              <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">PERHITUNGAN LUAS AREA</h4>
              
              <div className="grid grid-cols-1 gap-2 mb-2">
                <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Estimasi Riemann</span>
                  <span className="text-lg font-black text-yellow-300 font-mono">{sumArea.toFixed(3)}</span>
                </div>
                <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Luas Eksak</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">{exactArea.toFixed(3)}</span>
                </div>
              </div>

              <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-center flex justify-between items-center rounded">
                <span className="text-[10px] font-bold uppercase text-rose-400">Error:</span>
                <span className="text-sm font-black text-rose-400 font-mono">{error.toFixed(3)}</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            <div className="bg-pattern-dot p-0 relative flex flex-col w-full h-[600px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000]">
              <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30">
                Bidang Kartesius & Area
              </span>

              <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-black"></div> Kurva f(x)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-3 bg-emerald-400 opacity-50 border border-black"></div> Area Integral Eksak</div>
                <div className="flex items-center gap-2"><div className="w-4 h-3 bg-sky-400 opacity-60 border border-black"></div> Persegi Riemann</div>
              </div>

              <div className="w-full h-full flex justify-center items-center">
                
                <svg viewBox="0 0 500 500" className="w-full h-full overflow-visible">
                  <g transform="translate(250, 400)">
                    
                    <g stroke="#cbd5e1" strokeWidth="1">
                      {Array.from({ length: 21 }, (_, i) => i - 10).filter(i => i !== 0).map(i => (
                        <line key={`v-${i}`} x1={mapX(i)} y1={mapY(16)} x2={mapX(i)} y2={mapY(-2)} />
                      ))}
                      {Array.from({ length: 17 }, (_, i) => i - 2).filter(i => i !== 0).map(i => (
                        <line key={`h-${i}`} x1={mapX(-10)} y1={mapY(i)} x2={mapX(10)} y2={mapY(i)} />
                      ))}
                    </g>

                    <path d={getExactAreaPath()} fill="#10b981" opacity={0.3} className="animate-pulse" />

                    <g>{renderRectangles()}</g>

                    <line x1="-250" y1="0" x2="250" y2="0" stroke="#1e293b" strokeWidth="3" />
                    <line x1="0" y1="-400" x2="0" y2="100" stroke="#1e293b" strokeWidth="3" />

                    <path d={buildCurvePath()} fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    
                    <line x1={mapX(valA)} y1="10" x2={mapX(valA)} y2="-400" stroke="#be123c" strokeWidth="2" strokeDasharray="6 4" />
                    <text x={mapX(valA)} y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="#be123c">a</text>

                    <line x1={mapX(valB)} y1="10" x2={mapX(valB)} y2="-400" stroke="#047857" strokeWidth="2" strokeDasharray="6 4" />
                    <text x={mapX(valB)} y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="#047857">b</text>

                  </g>
                </svg>
              </div>

            </div>

          </div>
        </div>

        <div className="bg-sky-100 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_#000] mb-10">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1">
            Buku Panduan: Konsep Fundamental Integral 📖
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">1. Pendekatan Jumlah Riemann</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
                Bagaimana cara menghitung luas bentuk melengkung? Kita membaginya menjadi <span className="italic">n</span> buah <b>persegi panjang</b> kecil. Lebar tiap persegi adalah <span className="italic">Δx = (b-a)/n</span>, dan tingginya ditentukan oleh fungsi <span className="italic">f(x)</span> di suatu titik sampel (Kiri, Kanan, atau Tengah).
              </p>
              <div className="bg-sky-50 p-2 border-2 border-sky-200 text-xs font-bold text-sky-800 font-mono text-center rounded">
                Area ≈ Σ f(x_i) Δx
              </div>
            </div>
            
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">2. Menuju Limit (n → ∞)</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
                Semakin banyak jumlah kotaknya (<span className="italic">n</span> membesar), lebarnya (<span className="italic">Δx</span>) semakin tipis mendekati 0. Estimasi luas kotak akan semakin pas menempel dengan kurva asli. Jika <span className="italic">n</span> mendekati tak hingga, jumlah Riemann berubah menjadi <b>Integral Tentu</b>.
              </p>
              <div className="bg-emerald-50 p-2 border-2 border-emerald-200 text-xs font-bold text-emerald-800 font-mono text-center rounded">
                Area Eksak = ∫<sub>a</sub><sup>b</sup> f(x) dx
              </div>
            </div>
          </div>

          <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-md uppercase text-yellow-300 mb-2">Metode Titik Sampel</h4>
            <p className="text-sm font-semibold leading-relaxed">
              Tinggi persegi panjang dapat diukur dari sudut Kiri, Kanan, atau titik Tengah alasnya. Perhatikan bagaimana <b>Metode Tengah (Midpoint)</b> biasanya memberikan hasil yang lebih akurat dengan <i>error</i> lebih kecil pada jumlah <span className="italic">n</span> yang sedikit, karena bagian kotak yang kelebihan (menonjol ke atas kurva) sering kali membatalkan bagian kotak yang kekurangan.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
