import { useState, useRef, useEffect, useCallback } from 'react';

interface Particle {
  type: 'O2' | 'SALT';
  x: number;
  y: number;
  vx?: number;
  vy: number;
  wobblePhase: number;
}

const INITIAL_IRON = 100.0;
const INITIAL_ZINC = 20.0;

export default function KorosiBesi() {
  const [hasWater, setHasWater] = useState(true);
  const [oxygen, setOxygen] = useState(50);
  const [salt, setSalt] = useState(0);
  const [protection, setProtection] = useState<'NONE' | 'PAINT' | 'ZINC'>('NONE');
  const [ironMass, setIronMass] = useState(INITIAL_IRON);
  const [rustMass, setRustMass] = useState(0);
  const [zincMass, setZincMass] = useState(INITIAL_ZINC);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [corrosionRate, setCorrosionRate] = useState(0);
  const [isPaintScratched, setIsPaintScratched] = useState(false);

  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef(0);
  const stateRef = useRef({
    ironMass: INITIAL_IRON,
    rustMass: 0,
    zincMass: INITIAL_ZINC,
    isPaintScratched: false
  });

  useEffect(() => {
    stateRef.current = { ironMass, rustMass, zincMass, isPaintScratched };
  }, [ironMass, rustMass, zincMass, isPaintScratched]);

  const generateParticles = useCallback(() => {
    const particles: Particle[] = [];
    
    if (!hasWater) {
      particlesRef.current = particles;
      return;
    }

    const o2Count = Math.floor(oxygen / 5);
    for (let i = 0; i < o2Count; i++) {
      particles.push({
        type: 'O2',
        x: 220 + Math.random() * 160,
        y: 220 + Math.random() * 220,
        vy: -10 - Math.random() * 20,
        wobblePhase: Math.random() * Math.PI * 2
      });
    }

    const saltCount = Math.floor(salt / 5);
    for (let i = 0; i < saltCount; i++) {
      particles.push({
        type: 'SALT',
        x: 220 + Math.random() * 160,
        y: 220 + Math.random() * 220,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        wobblePhase: 0
      });
    }

    particlesRef.current = particles;
  }, [hasWater, oxygen, salt]);

  useEffect(() => {
    generateParticles();
  }, [generateParticles]);

  const calculatePhysics = useCallback((dt: number) => {
    const actualDt = dt * simSpeed;
    let rate = 0;

    if (hasWater && oxygen > 0) {
      const saltMultiplier = 1 + (salt / 100) * 15;
      rate = 0.5 * (oxygen / 100) * saltMultiplier;
    } else if (!hasWater && oxygen > 0) {
      rate = 0.05 * (oxygen / 100);
    }

    let ironRustingRate = 0;

    if (protection === 'ZINC') {
      if (stateRef.current.zincMass > 0) {
        const newZincMass = stateRef.current.zincMass - rate * actualDt * 0.8;
        setZincMass(Math.max(0, newZincMass));
        ironRustingRate = 0;
      } else {
        ironRustingRate = rate;
      }
    } else if (protection === 'PAINT') {
      if (!stateRef.current.isPaintScratched) {
        ironRustingRate = 0;
        if (Math.random() < 0.001 * actualDt && hasWater) {
          setIsPaintScratched(true);
        }
      } else {
        ironRustingRate = rate * 0.8;
      }
    } else {
      ironRustingRate = rate;
    }

    if (stateRef.current.ironMass > 0) {
      const newIronMass = stateRef.current.ironMass - ironRustingRate * actualDt;
      const newRustMass = stateRef.current.rustMass + ironRustingRate * actualDt * 1.4;
      setIronMass(Math.max(0, newIronMass));
      setRustMass(newRustMass);
    }

    setCorrosionRate(ironRustingRate);

    particlesRef.current.forEach(p => {
      if (p.type === 'O2') {
        p.y += p.vy * actualDt;
        p.x += Math.sin(p.y * 0.05 + p.wobblePhase) * 0.5;
        if (p.y < 200) p.y = 450;
      } else if (p.type === 'SALT') {
        p.x += (p.vx || 0) * actualDt;
        p.y += p.vy * actualDt;
        if (p.x < 220 || p.x > 380) p.vx = -(p.vx || 0);
        if (p.y < 210 || p.y > 450) p.vy = -p.vy;
      }
    });
  }, [hasWater, oxygen, salt, protection, simSpeed]);

  const drawFrame = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    if (isPlaying) {
      calculatePhysics(dt);
    }

    animFrameIdRef.current = requestAnimationFrame(drawFrame);
  }, [isPlaying, calculatePhysics]);

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [drawFrame]);

  const handleProtectionChange = (prot: 'NONE' | 'PAINT' | 'ZINC') => {
    setProtection(prot);
    handleReset();
  };

  const handleReset = () => {
    setIronMass(INITIAL_IRON);
    setRustMass(0);
    setZincMass(INITIAL_ZINC);
    setIsPaintScratched(false);
    stateRef.current = {
      ironMass: INITIAL_IRON,
      rustMass: 0,
      zincMass: INITIAL_ZINC,
      isPaintScratched: false
    };
  };

  const getWaterColor = () => {
    if (!hasWater) return 'transparent';
    if (rustMass > 5) {
      const rustTint = Math.min(0.5, rustMass / 100);
      const r = Math.floor(186 + rustTint * 50);
      const g = Math.floor(230 - rustTint * 100);
      const b = Math.floor(253 - rustTint * 150);
      return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }
    return '#bae6fd';
  };

  const getRustOpacity = () => Math.min(1, rustMass / 40);
  const getIronOpacity = () => Math.max(0.2, ironMass / INITIAL_IRON);
  const getZincOpacity = () => zincMass / INITIAL_ZINC;

  const renderParticles = () => {
    return particlesRef.current.map((p, i) => {
      if (p.type === 'O2') {
        return (
          <circle
            key={`o2-${i}`}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
        );
      } else {
        return (
          <circle
            key={`salt-${i}`}
            cx={p.x}
            cy={p.y}
            r="2"
            fill={i % 2 === 0 ? '#facc15' : '#fff'}
          />
        );
      }
    });
  };

  const zincPercent = (zincMass / INITIAL_ZINC) * 100;

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-orange-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">KIMIA & MATERIAL (STEM)</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: KOROSI BESI
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Faktor Perkaratan, Redoks, dan Rekayasa Pencegahan (Teknologi Pelapisan)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f97316] text-md transform rotate-2 z-30 uppercase">
            Parameter Lingkungan
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Medium (Air / H₂O)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setHasWater(true)}
                  className={`neo-btn py-2 px-1 text-[10px] font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${hasWater ? 'bg-blue-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                >
                  💧 TERENDAM AIR
                </button>
                <button
                  onClick={() => setHasWater(false)}
                  className={`neo-btn py-2 px-1 text-[10px] font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${!hasWater ? 'bg-blue-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                >
                  🌵 KERING
                </button>
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-800 uppercase text-[10px]">Oksigen Terlarut (O₂)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-600">{oxygen}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={oxygen}
                onChange={(e) => setOxygen(parseInt(e.target.value))}
                className="w-full cursor-pointer"
                style={{ accentColor: '#38bdf8' }}
              />
            </div>

            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-yellow-800 uppercase text-[10px]">Elektrolit Garam (NaCl)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-yellow-600">{salt}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={salt}
                onChange={(e) => setSalt(parseInt(e.target.value))}
                className="w-full cursor-pointer"
                style={{ accentColor: '#facc15' }}
              />
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-emerald-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-emerald-800 mb-1">Teknologi Perlindungan</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'NONE', label: '1. Paku Besi Polos', sub: '(Rentan)' },
                  { id: 'PAINT', label: '2. Dilapisi Cat (Coating)', sub: '(Fisik)' },
                  { id: 'ZINC', label: '3. Galvanisasi Seng (Zn)', sub: '(Anoda Korban)' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleProtectionChange(item.id as 'NONE' | 'PAINT' | 'ZINC')}
                    className={`neo-btn py-2 px-2 text-[10px] font-bold text-left flex justify-between border-4 border-black shadow-[2px_2px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${protection === item.id ? 'bg-emerald-200 text-emerald-900 ring-2 ring-black' : 'bg-white text-slate-600'}`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[8px]">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t-4 border-black pt-4 mt-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="neo-btn py-3 text-sm flex-1 flex items-center justify-center gap-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              style={{ backgroundColor: isPlaying ? '#fb923c' : '#34d399' }}
            >
              {isPlaying ? '⏸️ JEDA WAKTU' : '▶️ LANJUTKAN'}
            </button>
            <button
              onClick={() => setSimSpeed(simSpeed === 1 ? 10 : 1)}
              className={`neo-btn py-3 px-3 text-xs flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${simSpeed > 1 ? 'bg-rose-500 text-white' : 'bg-purple-400 text-white'}`}
            >
              {simSpeed > 1 ? '⏩ NORMAL' : '⏩ CEPAT'}
            </button>
            <button
              onClick={handleReset}
              className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 text-xs flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              🔄
            </button>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center w-full h-[500px] overflow-hidden border-8 border-black rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Gelas Kimia (Reaksi Oksidasi-Reduksi)
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-400 border border-black"></div> Besi (Fe)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-700 border border-black"></div> Karat (Fe₂O₃·xH₂O)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-zinc-200 border border-black rounded-full"></div> Anoda Seng (Zn)</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
              <svg viewBox="0 0 600 500" className="w-full h-full overflow-visible">
                <path d="M 200 100 L 200 450 Q 200 470 220 470 L 380 470 Q 400 470 400 450 L 400 100" fill="none" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="round" opacity="0.5"/>

                <g id="waterGroup" style={{ opacity: hasWater ? 1 : 0, transition: 'opacity 1s' }}>
                  <path d="M 210 200 L 390 200 L 390 450 Q 390 460 380 460 L 220 460 Q 210 460 210 450 Z" fill={getWaterColor()} opacity="0.6" />
                  <path d="M 210 200 Q 300 190 390 200" fill="none" stroke="#7dd3fc" strokeWidth="4" />
                  {hasWater && renderParticles()}
                </g>

                <g id="nailGroup" transform="translate(300, 280)">
                  <path
                    id="nailBase"
                    d="M -15 -150 L 15 -150 L 10 120 L 0 150 L -10 120 Z"
                    fill="#94a3b8"
                    stroke="#334155"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    opacity={getIronOpacity()}
                  />
                  <rect x="-30" y="-170" width="60" height="20" rx="5" fill="#94a3b8" stroke="#334155" strokeWidth="4" opacity={getIronOpacity()} />

                  {protection === 'PAINT' && (
                    <g opacity={1}>
                      <path d="M -17 -172 L 17 -172 L 17 -148 L 19 -148 L 14 122 L 0 155 L -14 122 L -19 -148 L -17 -148 Z" fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round"/>
                      {isPaintScratched && (
                        <>
                          <path d="M 5 -20 L 15 -10 M 8 40 L 18 50" fill="none" stroke="#bae6fd" strokeWidth="4"/>
                        </>
                      )}
                    </g>
                  )}

                  {protection === 'ZINC' && (
                    <path 
                      d="M -17 -172 L 17 -172 L 17 -148 L 19 -148 L 14 122 L 0 155 L -14 122 L -19 -148 L -17 -148 Z" 
                      fill="none" 
                      stroke="#f1f5f9" 
                      strokeWidth="8" 
                      strokeLinejoin="round" 
                      strokeLinecap="round" 
                      strokeDasharray={`${getZincOpacity() * 4} ${2 + (1 - getZincOpacity()) * 5}`}
                      opacity={getZincOpacity()}
                    />
                  )}

                  {rustMass > 0 && (
                    <g opacity={getRustOpacity()}>
                      <path d="M -15 -50 L 15 -50 L 10 120 L 0 150 L -10 120 Z" fill="#c2410c" />
                      <circle cx="0" cy="0" r="18" fill="#9a3412" />
                      <circle cx="-5" cy="40" r="16" fill="#7c2d12" />
                      <circle cx="8" cy="80" r="14" fill="#c2410c" />
                      <circle cx="0" cy="-30" r="15" fill="#9a3412" />
                      <circle cx="-20" cy="-160" r="15" fill="#9a3412" />
                      <circle cx="20" cy="-160" r="15" fill="#7c2d12" />
                    </g>
                  )}
                </g>

                <path d="M 200 100 L 200 450 Q 200 470 220 470 L 380 470 Q 400 470 400 450 L 400 100" fill="none" stroke="#0f172a" strokeWidth="8" strokeLinecap="round"/>
                <line x1="180" y1="100" x2="220" y2="100" stroke="#0f172a" strokeWidth="8" strokeLinecap="round"/>
                <line x1="380" y1="100" x2="420" y2="100" stroke="#0f172a" strokeWidth="8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="neo-box bg-slate-900 text-white p-6 relative flex flex-col w-full border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-orange-400 text-[12px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">ANALISIS MATEMATIS & KIMIA</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-800 p-3 border-2 border-slate-600 rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Laju Korosi Aktual</span>
                <span className="text-2xl font-black text-yellow-300 font-mono">{corrosionRate.toFixed(2)}</span> <span className="text-xs">mm/tahun</span>
              </div>
              <div className="bg-slate-800 p-3 border-2 border-slate-600 rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Massa Besi Murni (Fe)</span>
                <span className="text-2xl font-black text-white font-mono">{ironMass.toFixed(1)}</span> <span className="text-xs">gram</span>
              </div>
              <div className="bg-black p-3 border-2 border-rose-500 rounded flex flex-col justify-center items-center">
                <span className="text-[10px] font-bold uppercase text-rose-400 block mb-1">Massa Karat (Fe₂O₃)</span>
                <span className="text-3xl font-black text-orange-500 font-mono">{rustMass.toFixed(1)}</span> <span className="text-xs">gram</span>
              </div>
            </div>
            
            {protection === 'ZINC' && (
              <div className="mt-3 bg-slate-800 p-2 border-2 border-dashed border-emerald-500 flex justify-between items-center rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400">Sisa Pelindung Seng (Zn):</span>
                <div className="w-1/2 bg-slate-900 border border-black h-4 rounded overflow-hidden relative">
                  <div 
                    className={`h-full transition-all ${zincPercent < 20 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                    style={{ width: `${zincPercent}%` }}
                  />
                  <span className="absolute inset-0 flex justify-center items-center text-[9px] font-black text-black">{zincMass.toFixed(1)} g</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 bg-orange-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Integrasi STEM pada Korosi 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-orange-600 border-b-2 border-black pb-1 mb-2">Science (Sains)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Korosi adalah reaksi Redoks. Besi (Fe) teroksidasi melepaskan elektron menjadi Fe²⁺. Oksigen (O₂) dan Air (H₂O) bertindak sebagai katoda menerima elektron. Kehadiran Garam (NaCl) tidak ikut bereaksi, namun bertindak sebagai <b>Elektrolit/Katalisator</b> yang mempermudah lalu lintas elektron, mempercepat karat secara drastis!
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Technology (Teknologi)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Teknologi pengecatan (Coating) memisahkan besi dari air dan oksigen secara fisik. Namun, jika cat tergores sekecil apapun, air akan masuk dan perkaratan akan mulai terjadi dari dalam (di bawah lapisan cat).
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Engineering (Rekayasa)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              <b>Anoda Korban (Galvanisasi).</b> Insinyur melapisi besi dengan Seng (Zn). Karena Zn lebih reaktif dari Fe, maka Zn akan "mengorbankan" dirinya untuk berkarat lebih dulu. Hebatnya, meskipun lapisan seng tergores, besi di bawahnya tetap aman selama masih ada sisa seng yang terhubung!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-purple-600 border-b-2 border-black pb-1 mb-2">Mathematics (Matematika)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Laju korosi dapat diprediksi dengan persamaan laju kinetika. Penambahan konsentrasi Oksigen atau Garam membuat pengali pada rumus (Massa Karat). Perhatikan bahwa massa total sistem bertambah karena Karat (Fe₂O₃·xH₂O) mengikat atom Oksigen dan Hidrogen tambahan dari lingkungan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}