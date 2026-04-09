import { useState, useEffect, useRef, useCallback } from 'react';

export default function TrigonometriDasar() {
  const [angleDeg, setAngleDeg] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSin, setShowSin] = useState(true);
  const [showCos, setShowCos] = useState(true);
  const [showTan, setShowTan] = useState(false);
  const [graphMode, setGraphMode] = useState<'SIN' | 'COS'>('SIN');
  
  const playIntervalRef = useRef<number | null>(null);
  const circleRef = useRef<SVGSVGElement>(null);

  const CX = 150;
  const CY = 150;
  const R = 100;

  const degToRad = (deg: number) => deg * (Math.PI / 180);

  const formatRadStr = (deg: number): string => {
    const fractions: Record<number, string> = {
      0: "0", 30: "1/6", 45: "1/4", 60: "1/3", 90: "1/2",
      120: "2/3", 135: "3/4", 150: "5/6", 180: "1",
      210: "7/6", 225: "5/4", 240: "4/3", 270: "3/2",
      300: "5/3", 315: "7/4", 330: "11/6", 360: "2"
    };
    if (fractions[deg]) return fractions[deg] + " π";
    return (deg / 180).toFixed(2) + " π";
  };

  const getSinVal = useCallback(() => Math.sin(degToRad(angleDeg)), [angleDeg]);
  const getCosVal = useCallback(() => Math.cos(degToRad(angleDeg)), [angleDeg]);
  const getTanVal = useCallback(() => Math.tan(degToRad(angleDeg)), [angleDeg]);

  const pX = CX + R * getCosVal();
  const pY = CY - R * getSinVal();

  const generateBaseWavePath = (type: 'SIN' | 'COS') => {
    let path = "M 20 ";
    for (let x = 0; x <= 360; x += 5) {
      const rad = degToRad(x);
      const y = 75 - ((type === 'SIN' ? Math.sin(rad) : Math.cos(rad)) * 60);
      path += `${x === 0 ? '' : 'L '}${20 + x} ${y} `;
    }
    return path;
  };

  const generatePlottedWavePath = (angle: number, type: 'SIN' | 'COS') => {
    if (angle === 0) return "";
    let path = `M 20 ${type === 'SIN' ? 75 : 15} `;
    for (let x = 0; x <= angle; x += 2) {
      const rad = degToRad(x);
      const y = 75 - ((type === 'SIN' ? Math.sin(rad) : Math.cos(rad)) * 60);
      path += `L ${20 + x} ${y} `;
    }
    const finalRad = degToRad(angle);
    const finalY = 75 - ((type === 'SIN' ? Math.sin(finalRad) : Math.cos(finalRad)) * 60);
    path += `L ${20 + angle} ${finalY}`;
    return path;
  };

  const getArcPath = () => {
    if (angleDeg <= 0) return "";
    const arcR = 30;
    const largeArcFlag = angleDeg > 180 ? 1 : 0;
    const arcX = CX + arcR * getCosVal();
    const arcY = CY - arcR * getSinVal();
    return `M ${CX} ${CY} L ${CX + arcR} ${CY} A ${arcR} ${arcR} 0 ${largeArcFlag} 0 ${arcX} ${arcY} Z`;
  };

  const getTangentLine = () => {
    if (angleDeg === 90 || angleDeg === 270) return null;
    let tX = CX + R;
    let tY = CY - R * getTanVal();
    if (tY < -500) tY = -500;
    if (tY > 800) tY = 800;
    return { x1: tX, y1: CY, x2: tX, y2: tY };
  };

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        setAngleDeg(prev => {
          const next = prev + 1;
          return next > 360 ? 0 : next;
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

  const tanLine = getTangentLine();

  const gX = 20 + angleDeg;
  const gY = 75 - ((graphMode === 'SIN' ? getSinVal() : getCosVal()) * 60);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="text-center mb-8 bg-sky-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_#000] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_#000]">
            MATEMATIKA TERAPAN
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
            LAB VIRTUAL: TRIGONOMETRI
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
            Lingkaran Satuan & Visualisasi Fungsi Sin, Cos, Tan
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          
          <div className="w-full lg:w-1/3 bg-white border-4 border-black p-6 flex flex-col gap-6 rounded-xl shadow-[8px_8px_0px_0px_#000] relative">
            <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_0px_#38bdf8] text-md transform rotate-2">
              Panel Sudut
            </span>

            <div className="flex flex-col gap-4 mt-4">
              
              <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-yellow-800 uppercase text-[10px]">Besar Sudut (θ)</span>
                  <div className="flex gap-2">
                    <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-yellow-600">{angleDeg}°</span>
                    <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-slate-500" dangerouslySetInnerHTML={{ __html: formatRadStr(angleDeg) }}></span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  step="1" 
                  value={angleDeg}
                  onChange={(e) => setAngleDeg(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                  <span>0°</span>
                  <span>180°</span>
                  <span>360°</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Sudut Istimewa</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 30, 45, 60, 90, 180, 270, 360].map(angle => (
                    <button 
                      key={angle}
                      onClick={() => setAngleDeg(angle)}
                      className="bg-white py-1 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                      {angle}°
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-slate-500">Tampilkan Elemen</label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-rose-600">
                    <input 
                      type="checkbox" 
                      checked={showSin} 
                      onChange={(e) => setShowSin(e.target.checked)} 
                      className="w-4 h-4 accent-rose-500"
                    /> 
                    Sinus
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-blue-600">
                    <input 
                      type="checkbox" 
                      checked={showCos} 
                      onChange={(e) => setShowCos(e.target.checked)} 
                      className="w-4 h-4 accent-blue-500"
                    /> 
                    Cosinus
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-emerald-600">
                    <input 
                      type="checkbox" 
                      checked={showTan} 
                      onChange={(e) => setShowTan(e.target.checked)} 
                      className="w-4 h-4 accent-emerald-500"
                    /> 
                    Tangen
                  </label>
                </div>
              </div>

              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`neo-btn py-3 text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all ${
                  isPlaying 
                    ? 'bg-yellow-400 hover:bg-yellow-300' 
                    : 'bg-emerald-400 hover:bg-emerald-300'
                }`}
              >
                {isPlaying ? '⏸️ JEDA ROTASI' : '▶️ PUTAR OTOMATIS'}
              </button>
            </div>

            <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
              <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA TRIGONOMETRI (R = 1)</h4>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-slate-800 p-2 border-2 border-rose-500 rounded flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-300">Sin(θ) <span className="text-[8px] text-slate-500">Depan/Miring (y)</span></span>
                  <span className="text-lg font-black text-rose-400 font-mono">
                    {Math.abs(getSinVal()) < 0.001 ? "0.000" : getSinVal().toFixed(3)}
                  </span>
                </div>
                <div className="bg-slate-800 p-2 border-2 border-blue-500 rounded flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-300">Cos(θ) <span className="text-[8px] text-slate-500">Samping/Miring (x)</span></span>
                  <span className="text-lg font-black text-blue-400 font-mono">
                    {Math.abs(getCosVal()) < 0.001 ? "0.000" : getCosVal().toFixed(3)}
                  </span>
                </div>
                <div className="bg-slate-800 p-2 border-2 border-emerald-500 rounded flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-300">Tan(θ) <span className="text-[8px] text-slate-500">Depan/Samping (y/x)</span></span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {angleDeg === 90 || angleDeg === 270 
                      ? "∞" 
                      : (Math.abs(getTanVal()) < 0.001 ? "0.000" : getTanVal().toFixed(3))
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            <div className="bg-pattern-dot p-0 relative flex flex-col w-full h-[600px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000]">
              <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30">
                Lingkaran Satuan & Grafik
              </span>

              <div className="w-full h-full flex flex-col pt-12 pb-4 px-4">
                
                <div className="flex-1 w-full relative flex justify-center items-center">
                  <svg ref={circleRef} viewBox="0 0 300 300" className="w-full h-full max-h-[300px] overflow-visible">
                    <line x1="0" y1="150" x2="300" y2="150" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="150" y1="0" x2="150" y2="300" stroke="#94a3b8" strokeWidth="2" />
                    
                    <text x="290" y="140" fontSize="10" fontWeight="bold">X</text>
                    <text x="155" y="10" fontSize="10" fontWeight="bold">Y</text>
                    
                    <circle cx="150" cy="150" r="100" fill="none" stroke="#1e293b" strokeWidth="3" />
                    
                    <path d={getArcPath()} fill="rgba(250, 204, 21, 0.4)" stroke="#eab308" strokeWidth="2" />
                    
                    {showTan && tanLine && (
                      <>
                        <line 
                          x1={tanLine.x1} y1={tanLine.y1} 
                          x2={tanLine.x2} y2={tanLine.y2} 
                          stroke="#10b981" strokeWidth="4" strokeDasharray="4 2" 
                        />
                        <line 
                          x1={150} y1={150} 
                          x2={tanLine.x2} y2={tanLine.y2} 
                          stroke="#94a3b8" strokeWidth="2" strokeDasharray="2 2" 
                        />
                      </>
                    )}
                    
                    <line 
                      x1={150} y1={150} 
                      x2={showCos ? pX : 150} 
                      y2={150} 
                      stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" 
                      style={{ display: showCos ? 'block' : 'none' }}
                    />
                    
                    <line 
                      x1={pX} y1={150} 
                      x2={pX} y2={showSin ? pY : 150} 
                      stroke="#ef4444" strokeWidth="6" strokeLinecap="round" 
                      style={{ display: showSin ? 'block' : 'none' }}
                    />
                    
                    <line x1="150" y1="150" x2={pX} y2={pY} stroke="#000" strokeWidth="4" strokeLinecap="round" />
                    
                    <circle cx={pX} cy={pY} r="6" fill="#000" />
                  </svg>
                </div>

                <div className="h-[200px] w-full relative mt-4 border-t-4 border-black pt-4">
                  <span className="absolute top-6 left-2 bg-white text-black font-black px-2 py-1 border-2 border-black text-[8px] z-20">
                    Proyeksi Gelombang
                  </span>
                  
                  <div className="absolute top-6 right-2 z-20 flex gap-1">
                    <button 
                      onClick={() => setGraphMode('SIN')}
                      className={`py-1 px-2 text-[8px] font-bold border-4 border-black shadow-[2px_2px_0px_0px_#000] rounded ${
                        graphMode === 'SIN' 
                          ? 'bg-rose-400 text-white ring-2 ring-black' 
                          : 'bg-white text-slate-500'
                      }`}
                    >
                      SIN
                    </button>
                    <button 
                      onClick={() => setGraphMode('COS')}
                      className={`py-1 px-2 text-[8px] font-bold border-4 border-black shadow-[2px_2px_0px_0px_#000] rounded ${
                        graphMode === 'COS' 
                          ? 'bg-blue-400 text-white ring-2 ring-black' 
                          : 'bg-white text-slate-500'
                      }`}
                    >
                      COS
                    </button>
                  </div>

                  <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
                    <line x1="20" y1="75" x2="380" y2="75" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="20" y1="10" x2="20" y2="140" stroke="#94a3b8" strokeWidth="2" />
                    
                    <text x="5" y="20" fontSize="8" fontWeight="bold">1</text>
                    <text x="5" y="135" fontSize="8" fontWeight="bold">-1</text>
                    
                    <text x="110" y="88" fontSize="8" fontWeight="bold">90°</text>
                    <text x="200" y="88" fontSize="8" fontWeight="bold">180°</text>
                    <text x="290" y="88" fontSize="8" fontWeight="bold">270°</text>
                    <text x="380" y="88" fontSize="8" fontWeight="bold">360°</text>
                    
                    <path d={generateBaseWavePath(graphMode)} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2" />
                    
                    <path 
                      d={generatePlottedWavePath(angleDeg, graphMode)} 
                      fill="none" 
                      stroke={graphMode === 'SIN' ? '#ef4444' : '#3b82f6'} 
                      strokeWidth="4" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    
                    <circle 
                      cx={gX} 
                      cy={gY} 
                      r="5" 
                      fill={graphMode === 'SIN' ? '#ef4444' : '#3b82f6'} 
                      stroke="#000" 
                      strokeWidth="2" 
                    />
                    
                    <line x1={gX} y1="75" x2={gX} y2={gY} stroke="#000" strokeWidth="1" strokeDasharray="2" />
                  </svg>
                </div>

              </div>
            </div>

          </div>
        </div>

        <div className="bg-sky-100 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_#000] mb-10">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1">
            Buku Panduan: Segitiga di Dalam Lingkaran 📖
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">SINUS (Garis Merah)</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
                Mengukur seberapa <b>tinggi (Vertikal/Y)</b> titik tersebut dari sumbu X.
              </p>
              <div className="bg-rose-50 p-2 border-2 border-rose-200 text-xs font-bold text-rose-800 rounded">
                SINDEMI = Sisi <span className="underline">Depan</span> / Sisi <span className="underline">Miring</span>
              </div>
              <p className="text-xs font-medium text-slate-600 mt-2">Karena jari-jari (miring) = 1, maka Sin sama dengan panjang sisi vertikal (Y).</p>
            </div>
            
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">COSINUS (Garis Biru)</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
                Mengukur seberapa <b>jauh (Horizontal/X)</b> titik tersebut dari sumbu Y.
              </p>
              <div className="bg-blue-50 p-2 border-2 border-blue-200 text-xs font-bold text-blue-800 rounded">
                COSSAMI = Sisi <span className="underline">Samping</span> / Sisi <span className="underline">Miring</span>
              </div>
              <p className="text-xs font-medium text-slate-600 mt-2">Karena jari-jari (miring) = 1, maka Cos sama dengan panjang sisi horizontal (X).</p>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">TANGEN (Garis Hijau)</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
                Menunjukkan <b>kemiringan (Gradient/Slope)</b> dari garis jari-jari.
              </p>
              <div className="bg-emerald-50 p-2 border-2 border-emerald-200 text-xs font-bold text-emerald-800 rounded">
                TANDESA = Sisi <span className="underline">Depan</span> / Sisi <span className="underline">Samping</span>
              </div>
              <p className="text-xs font-medium text-slate-600 mt-2">Jika sudut 90° (tegak lurus), kemiringannya tak terhingga (∞). Tangen = Sin / Cos.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
