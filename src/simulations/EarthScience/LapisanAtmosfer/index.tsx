import { useState, useEffect, useRef } from 'react';

const SVG_H = 600;
const P_TROP = 20;
const P_STRAT = 40;
const P_MESO = 60;
const P_THERM = 80;
const P_EXO = 100;

const KM_TROP = 12;
const KM_STRAT = 50;
const KM_MESO = 85;
const KM_THERM = 600;
const KM_EXO = 1000;

export default function LapisanAtmosfer() {
  const [progress, setProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);

  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  const getAltitude = (p: number) => {
    if (p <= P_TROP) return (p / P_TROP) * KM_TROP;
    if (p <= P_STRAT) return KM_TROP + ((p - P_TROP) / (P_STRAT - P_TROP)) * (KM_STRAT - KM_TROP);
    if (p <= P_MESO) return KM_STRAT + ((p - P_STRAT) / (P_MESO - P_STRAT)) * (KM_MESO - KM_STRAT);
    if (p <= P_THERM) return KM_MESO + ((p - P_MESO) / (P_THERM - P_MESO)) * (KM_THERM - KM_MESO);
    return KM_THERM + ((p - P_THERM) / (P_EXO - P_THERM)) * (KM_EXO - KM_THERM);
  };

  const getTemperature = (alt: number) => {
    if (alt <= KM_TROP) return 15 - (75 / KM_TROP) * alt;
    if (alt <= KM_STRAT) return -60 + (45 / (KM_STRAT - KM_TROP)) * (alt - KM_TROP);
    if (alt <= KM_MESO) return -15 - (75 / (KM_MESO - KM_STRAT)) * (alt - KM_STRAT);
    if (alt <= KM_THERM) return -90 + (1590 / (KM_THERM - KM_MESO)) * (alt - KM_MESO);
    return 1500;
  };

  const getPressure = (alt: number) => {
    let p = Math.exp(-alt / 8.0);
    if (p < 0.0001) return 0;
    return p;
  };

  const getLayerInfo = (p: number) => {
    if (p <= P_TROP) return { name: 'TROPOSFER', color: 'text-sky-400' };
    if (p <= P_STRAT) return { name: 'STRATOSFER', color: 'text-blue-400' };
    if (p <= P_MESO) return { name: 'MESOSFER', color: 'text-indigo-400' };
    if (p <= P_THERM) return { name: 'TERMOSFER', color: 'text-purple-400' };
    return { name: 'EKSOSFER', color: 'text-slate-400' };
  };

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      lastTimeRef.current = timestamp;

      let newProgress = progress;
      if (progress !== targetProgress) {
        let diff = targetProgress - progress;
        newProgress = progress + diff * 0.1;
      }
      setProgress(newProgress);

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [progress, targetProgress]);

  const handleSliderChange = (val: number) => {
    setTargetProgress(val);
  };

  const handlePreset = (targetP: number) => {
    setTargetProgress(targetP);
  };

  const altitude = getAltitude(progress);
  const temperature = getTemperature(altitude);
  const pressure = getPressure(altitude);
  const layerInfo = getLayerInfo(progress);

  const svgY = Math.max(20, Math.min(580, SVG_H - (progress / 100) * SVG_H));

  const hasFlame = Math.abs(progress - targetProgress) > 0.5;

  const mapTempToX = (t: number) => 200 + ((t + 100) / 1600) * 500;

  const generateTempCurve = () => {
    let pathD = "";
    for (let p = 0; p <= 100; p++) {
      const alt = getAltitude(p);
      const t = getTemperature(alt);
      const px = mapTempToX(t);
      const py = SVG_H - (p / 100) * SVG_H;
      pathD += (p === 0 ? "M " : "L ") + px + " " + py + " ";
    }
    return pathD;
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3">
          ILMU BUMI & ANTARIKSA
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: LAPISAN ATMOSFER
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Profil Suhu, Tekanan Udara, dan Fenomena Alam
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md transform rotate-2 z-30 uppercase">
            Panel Kendali Wahana
          </span>

          <div className="flex flex-col gap-4 mt-4 h-[500px] overflow-y-auto pr-2">
            <div className="bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-slate-800 uppercase text-[10px]">Ketinggian Wahana</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-600">
                  {Math.round(altitude)} km
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={targetProgress}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Permukaan (0 km)</span>
                <span>Luar Angkasa (1000 km)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-xl">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-2">Lompat ke Lapisan</label>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => handlePreset(10)} className="neo-btn bg-white text-slate-700 py-2 px-3 text-xs font-bold text-left flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                  <span>☁️ TROPOSFER</span>
                  <span className="text-[9px] bg-slate-100 px-1 border border-black">0-12 km</span>
                </button>
                <button onClick={() => handlePreset(30)} className="neo-btn bg-white text-slate-700 py-2 px-3 text-xs font-bold text-left flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                  <span>✈️ STRATOSFER</span>
                  <span className="text-[9px] bg-slate-100 px-1 border border-black">12-50 km</span>
                </button>
                <button onClick={() => handlePreset(50)} className="neo-btn bg-white text-slate-700 py-2 px-3 text-xs font-bold text-left flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                  <span>☄️ MESOSFER</span>
                  <span className="text-[9px] bg-slate-100 px-1 border border-black">50-85 km</span>
                </button>
                <button onClick={() => handlePreset(70)} className="neo-btn bg-white text-slate-700 py-2 px-3 text-xs font-bold text-left flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                  <span>✨ TERMOSFER</span>
                  <span className="text-[9px] bg-slate-100 px-1 border border-black">85-600 km</span>
                </button>
                <button onClick={() => handlePreset(90)} className="neo-btn bg-white text-slate-700 py-2 px-3 text-xs font-bold text-left flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                  <span>🛰️ EKSOSFER</span>
                  <span className="text-[9px] bg-slate-100 px-1 border border-black">&gt; 600 km</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-xl">
            <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">
              DATA TELEMETRI SENSOR
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-2 text-center">
              <div className="bg-slate-800 p-2 border-2 border-rose-500 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Suhu Udara (T)</span>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-rose-400 font-mono">{Math.round(temperature)}</span>
                  <span className="text-xs mb-1">°C</span>
                </div>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-emerald-500 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Tekanan (P)</span>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {pressure < 0.001 && pressure > 0 ? pressure.toExponential(1) : pressure.toFixed(3)}
                  </span>
                  <span className="text-[8px] mb-1 uppercase">atm</span>
                </div>
              </div>
            </div>
            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex flex-col items-center mt-2">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Berada di Lapisan</span>
              <span className={`text-sm font-black uppercase tracking-widest ${layerInfo.color}`}>
                {layerInfo.name}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-900 border-8 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-0 relative flex flex-col items-center w-full h-[600px] overflow-hidden">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Visualisasi Skala Atmosfer
            </span>

            <svg viewBox="0 0 800 600" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <rect x="0" y="480" width="800" height="120" fill="#38bdf8" />
              <rect x="0" y="580" width="800" height="20" fill="#22c55e" />
              <g transform="translate(200, 520)" className="cloud-anim" style={{ animation: 'drift 15s linear infinite' }}>
                <circle cx="0" cy="0" r="15" fill="#fff" />
                <circle cx="20" cy="-5" r="20" fill="#fff" />
                <circle cx="40" cy="5" r="15" fill="#fff" />
              </g>
              <g transform="translate(600, 500)">
                <path d="M 0 0 L -30 0 L -35 -10 L -40 0 L -50 0 L -45 5 L 0 5 Z" fill="#f8fafc" stroke="#000" strokeWidth="1" />
                <line x1="-15" y1="5" x2="-25" y2="15" stroke="#000" strokeWidth="2" />
              </g>

              <rect x="0" y="360" width="800" height="120" fill="#1e3a8a" />
              <rect x="0" y="380" width="800" height="20" fill="#38bdf8" opacity="0.2" />
              <text x="780" y="393" textAnchor="end" fontSize="10" fill="#bae6fd" fontWeight="bold" opacity="0.6">LAPISAN OZON (O₃)</text>
              <g transform="translate(150, 420)">
                <circle cx="0" cy="0" r="10" fill="#f8fafc" />
                <path d="M -5 8 L 0 15 L 5 8 Z" fill="#f8fafc" />
                <line x1="0" y1="15" x2="0" y2="25" stroke="#94a3b8" strokeWidth="1" />
                <rect x="-3" y="25" width="6" height="6" fill="#ef4444" />
              </g>

              <rect x="0" y="240" width="800" height="120" fill="#172554" />
              <g transform="translate(500, 240)" style={{ animation: 'meteorFall 2s linear infinite' }}>
                <line x1="0" y1="0" x2="-40" y2="40" stroke="#fef08a" strokeWidth="2" />
                <circle cx="0" cy="0" r="2" fill="#fff" />
              </g>

              <rect x="0" y="120" width="800" height="120" fill="#1e1b4b" />
              <path d="M 0 200 Q 100 150 200 180 T 400 160 T 600 200 T 800 170 L 800 240 L 0 240 Z" fill="#10b981" opacity="0.3" style={{ animation: 'auroraWave 4s ease-in-out infinite alternate' }} />

              <rect x="0" y="0" width="800" height="120" fill="#020617" />
              <g transform="translate(600, 60)">
                <rect x="-15" y="-5" width="10" height="10" fill="#3b82f6" />
                <rect x="5" y="-5" width="10" height="10" fill="#3b82f6" />
                <rect x="-5" y="-8" width="10" height="16" fill="#f8fafc" />
                <circle cx="0" cy="0" r="2" fill="#ef4444" />
              </g>

              <g stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" fontFamily="sans-serif" fontWeight="bold" fontSize="10" fill="#fff">
                <line x1="0" y1="480" x2="800" y2="480" />
                <text x="10" y="475">Tropopause (12 km)</text>
                <line x1="0" y1="360" x2="800" y2="360" />
                <text x="10" y="355">Stratopause (50 km)</text>
                <line x1="0" y1="240" x2="800" y2="240" />
                <text x="10" y="235">Mesopause (85 km)</text>
                <line x1="0" y1="120" x2="800" y2="120" />
                <text x="10" y="115">Batas Eksosfer (~600 km)</text>
              </g>

              <path d={generateTempCurve()} fill="none" stroke="#facc15" strokeWidth="3" strokeLinejoin="round" opacity="0.6" />
              <text x="400" y="20" fill="#facc15" fontSize="10" fontWeight="bold" opacity="0.8">Profil Suhu (Kuning)</text>

              <g transform={`translate(400, ${svgY})`}>
                <line x1="-800" y1="0" x2="800" y2="0" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
                <path d="M 0 -20 L -10 0 L -10 15 L 10 15 L 10 0 Z" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                <polygon points="-10,0 10,0 0,-20" fill="#ef4444" />
                <polygon points="-10,5 -15,15 -10,15" fill="#ef4444" />
                <polygon points="10,5 15,15 10,15" fill="#ef4444" />
                {hasFlame && (
                  <polygon points="-5,15 5,15 0,30" fill="#f97316" style={{ animation: 'flicker 0.1s infinite alternate' }} />
                )}
              </g>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-sky-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Karakteristik Lapisan Atmosfer 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sm uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">☁️ Troposfer (0-12 km)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Lapisan paling bawah. Semakin tinggi, suhu semakin <b>dingin</b>. 99% uap air ada di sini, semua cuaca terjadi di sini.
            </p>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sm uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">✈️ Stratosfer (12-50 km)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Suhu <b>meningkat</b> karena <b>Lapisan Ozon</b> menyerap radiasi UV. Bebas awan, ideal untuk pesawat terbang.
            </p>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sm uppercase text-indigo-600 border-b-2 border-black pb-1 mb-2">☄️ Mesosfer (50-85 km)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Suhu <b>turun drastis</b> (-90°C). Meteor yang jatuh terbakar di sini, melindungi Bumi.
            </p>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sm uppercase text-purple-600 border-b-2 border-black pb-1 mb-2">✨ Termosfer & Eksosfer</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Suhu <b>melonjak</b> (&gt;1500°C). Tempat Aurora dan orbit satelit. Terasa dingin karena udaranya hampa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
