import { useState, useEffect, useRef } from 'react';

export default function PerubahanIklim() {
  const [year, setYear] = useState(2024);
  const [co2Level, setCo2Level] = useState(420);
  const [tempAnomaly, setTempAnomaly] = useState(1.2);
  const [seaLevel, setSeaLevel] = useState(0);
  const [emissionRate, setEmissionRate] = useState(7);
  const [forestCoverage, setForestCoverage] = useState(50);
  const [isPlaying, setIsPlaying] = useState(true);

  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const photonsRef = useRef<{ x: number; y: number; vx: number; vy: number; type: string; bounced: boolean }[]>([]);

  const getPhotonColor = (type: string) => (type === 'SUN' ? '#facc15' : '#ef4444');

  const updatePhysics = (dt: number) => {
    const yearsPassed = dt * 1;
    const newYear = year + yearsPassed;

    const emissionFactor = (emissionRate / 7) * 4.0;
    const absorptionFactor = (forestCoverage / 50) * 1.5;
    const netCO2Change = (emissionFactor - absorptionFactor) * yearsPassed;
    let newCo2 = Math.max(280, co2Level + netCO2Change);

    const forcing = Math.log(newCo2 / 280);
    const newTemp = (forcing / 0.69) * 3.0;

    let newSeaLevel = seaLevel;
    if (newTemp > 0) {
      newSeaLevel += (newTemp * 0.02) * yearsPassed;
    }

    setYear(newYear);
    setCo2Level(newCo2);
    setTempAnomaly(newTemp);
    setSeaLevel(newSeaLevel);

    if (Math.random() < 0.2) spawnPhoton();
    updatePhotons();
  };

  const spawnPhoton = () => {
    if (photonsRef.current.length > 50) return;
    const isIncoming = Math.random() > 0.4;
    let x, y, vx, vy, type;
    if (isIncoming) {
      x = 100 + Math.random() * 50;
      y = 100 + Math.random() * 50;
      vx = 2 + Math.random() * 2;
      vy = 3 + Math.random() * 2;
      type = 'SUN';
    } else {
      x = 200 + Math.random() * 500;
      y = 500 + Math.random() * 50;
      vx = (Math.random() - 0.5) * 2;
      vy = -2 - Math.random() * 2;
      type = 'HEAT';
    }
    photonsRef.current.push({ x, y, vx, vy, type, bounced: false });
  };

  const updatePhotons = () => {
    for (let i = photonsRef.current.length - 1; i >= 0; i--) {
      let p = photonsRef.current[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'HEAT' && !p.bounced && p.y < 200) {
        let bounceProb = Math.min(0.9, (co2Level - 200) / 800);
        if (Math.random() < bounceProb) {
          p.vy *= -1;
          p.bounced = true;
        }
      }

      if (p.type === 'SUN' && p.y > 500) {
        photonsRef.current.splice(i, 1);
        continue;
      }

      if (p.x > 850 || p.x < -50 || p.y < -50 || (p.type === 'HEAT' && p.bounced && p.y > 600)) {
        photonsRef.current.splice(i, 1);
        continue;
      }
    }
  };

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        updatePhysics(dt);
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, year, co2Level, tempAnomaly, seaLevel, emissionRate, forestCoverage]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    lastTimeRef.current = performance.now();
  };

  const handleReset = () => {
    setYear(2024);
    setCo2Level(420);
    setTempAnomaly(1.2);
    setSeaLevel(0);
    photonsRef.current = [];
  };

  const getTempClass = () => {
    if (tempAnomaly > 2.0) return 'text-rose-500';
    if (tempAnomaly > 1.5) return 'text-orange-400';
    return 'text-rose-400';
  };

  const ghgOpacity = Math.min(0.8, 0.2 + ((co2Level - 420) / 800));
  const oceanRisePx = seaLevel * 5;
  const currentOceanY = 480 - oceanRisePx;
  const iceScale = Math.max(0, 1 - ((tempAnomaly - 1.2) / 2.8));

  const numTrees = Math.floor((forestCoverage / 100) * 15);

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-orange-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3">
          SAINS LINGKUNGAN
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: PERUBAHAN IKLIM
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Dinamika Efek Rumah Kaca, Emisi Karbon, dan Pemanasan Global
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f97316] text-md transform rotate-2 z-30 uppercase">
            Aktivitas Manusia
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-orange-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-orange-800 uppercase text-[10px]">Tingkat Emisi Industri (CO₂)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-orange-600">
                  {emissionRate < 4 ? 'Rendah' : emissionRate < 8 ? 'Sedang' : 'Tinggi (Fosil)'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={emissionRate}
                onChange={(e) => setEmissionRate(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-800 uppercase text-[10px]">Tutupan Hutan Global</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-600">
                  {forestCoverage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={forestCoverage}
                onChange={(e) => setForestCoverage(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={handlePlayPause}
                className={`neo-btn py-3 text-sm flex-1 flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                  isPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'
                }`}
              >
                {isPlaying ? '⏸️ JEDA WAKTU' : '▶️ LANJUTKAN SIMULASI'}
              </button>
              <button
                onClick={handleReset}
                className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-4 text-xs flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000]"
              >
                🔄 KEMBALI KE 2024
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-xl">
            <h4 className="font-black text-orange-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">
              DATA IKLIM GLOBAL
            </h4>
            <div className="flex justify-between items-center bg-black p-2 border-2 border-dashed border-slate-500 mb-3">
              <span className="text-[10px] font-bold uppercase text-slate-400">Tahun Simulasi:</span>
              <span className="text-xl font-black text-white font-mono tracking-widest">{Math.floor(year)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Konsentrasi CO₂</span>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-yellow-300 font-mono">{Math.floor(co2Level)}</span>
                  <span className="text-[8px] text-slate-500 mb-1">ppm</span>
                </div>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Anomali Suhu</span>
                <div className="flex items-end gap-1">
                  <span className={`text-xl font-black font-mono ${getTempClass()}`}>
                    {tempAnomaly > 0 ? '+' : ''}{tempAnomaly.toFixed(2)}
                  </span>
                  <span className="text-[8px] text-slate-500 mb-1">°C</span>
                </div>
              </div>
              <div className="col-span-2 bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Kenaikan Permukaan Laut</span>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-sky-400 font-mono">+{seaLevel.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 mb-1">Meter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-sky-100 border-8 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-0 relative flex flex-col items-center w-full h-[600px] overflow-hidden transition-colors duration-1000">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Visualisasi Biosfer & Atmosfer
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 border border-black rounded-full"></div> Cahaya Matahari
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 border border-black rounded-full"></div> Radiasi Panas
              </div>
            </div>

            <svg viewBox="0 0 800 600" className="w-full h-full overflow-visible">
              <circle cx="100" cy="100" r="40" fill="#facc15" stroke="#eab308" strokeWidth="4" style={{ filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.6))' }} />

              <path d="M 0 150 Q 400 50 800 150 L 800 200 Q 400 100 0 200 Z" fill="#64748b" opacity={ghgOpacity} className="transition-opacity duration-300" />

              {photonsRef.current.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill={getPhotonColor(p.type)} />
              ))}

              <path d="M 0 600 L 0 450 Q 150 430 350 480 L 350 600 Z" fill="#a3e635" stroke="#4d7c0f" strokeWidth="4" />

              <g transform="translate(600, 350)">
                <path d="M -150 250 L -50 0 L 50 100 L 120 -50 L 200 250 Z" fill="#94a3b8" stroke="#334155" strokeWidth="4" />
                <g transform={`scale(${iceScale})`}>
                  <path d="M -110 150 L -50 0 L 15 65 L -30 100 Z M 80 50 L 120 -50 L 160 50 L 120 80 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                </g>
              </g>

              {Array.from({ length: numTrees }).map((_, i) => (
                <g key={i} transform={`translate(${120 + i * 15}, ${470})`}>
                  <rect x="-2" y="-10" width="4" height="10" fill="#78350f" />
                  <path d="M -10 -10 L 10 -10 L 0 -30 Z" fill="#22c55e" stroke="#14532d" strokeWidth="1" />
                </g>
              ))}

              <g transform="translate(50, 400)">
                <circle cx="40" cy="-30" r="15" fill="#475569" opacity={emissionRate / 10} className="smoke-anim" style={{ animationDelay: '0s' }} />
                <circle cx="50" cy="-50" r="20" fill="#64748b" opacity={emissionRate / 10} className="smoke-anim" style={{ animationDelay: '0.5s' }} />
                <circle cx="35" cy="-70" r="25" fill="#334155" opacity={emissionRate / 10} className="smoke-anim" style={{ animationDelay: '1s' }} />
                <rect x="0" y="0" width="60" height="60" fill="#cbd5e1" stroke="#0f172a" strokeWidth="3" />
                <rect x="10" y="10" width="10" height="15" fill="#0f172a" />
                <rect x="30" y="10" width="10" height="15" fill="#0f172a" />
                <polygon points="35,0 45,0 50,-40 40,-40" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
              </g>

              <rect x="300" y={currentOceanY} width="500" height={200 + oceanRisePx} fill="#38bdf8" stroke="#0284c7" strokeWidth="4" opacity="0.8" className="transition-all duration-300" />
              <path d={`M 300 ${currentOceanY} Q 350 ${currentOceanY - 10} 400 ${currentOceanY} T 500 ${currentOceanY} T 600 ${currentOceanY} T 700 ${currentOceanY} T 800 ${currentOceanY}`} fill="none" stroke="#e0f2fe" strokeWidth="3" opacity="0.6" className="transition-all duration-300" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-orange-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Memahami Perubahan Iklim 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-orange-600 border-b-2 border-black pb-1 mb-2">1. Efek Rumah Kaca</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Bumi menerima cahaya dari Matahari. Permukaan memantulkan panas (Inframerah). Gas rumah kaca (CO₂) di atmosfer memantulkan panas ini kembali ke Bumi, mencegah Terbuang ke luar angkasa.
            </p>
          </div>
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">2. Karbon Sink (Hutan)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Pohon dan lautan menyerap CO₂ melalui fotosintesis. Deforestasi mengurangi penyerap karbon ini.
            </p>
          </div>
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">3. Dampak Pemanasan Global</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Jika suhu anomali &gt; 1.5°C, es abadi mencair. Air laut memuai (Ekspansi termal), menyebabkan Kenaikan Permukaan Laut yang menenggelamkan pesisir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
