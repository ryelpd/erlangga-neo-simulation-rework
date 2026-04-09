import { useState, useRef, useEffect, useCallback } from 'react';

interface Flux {
  id: string;
  rate: number;
  color: string;
  human?: boolean;
  element?: SVGPathElement | null;
  length?: number;
  timer?: number;
}

interface Particle {
  el: SVGCircleElement;
  flux: Flux;
  progress: number;
  speed: number;
}

interface State {
  atmCO2: number;
  bioMass: number;
  oceanAcid: number;
  soilN: number;
  eutrophication: number;
}

const FLUXES_CARBON: Flux[] = [
  { id: 'path_C_photo', rate: 3, color: '#1e293b' },
  { id: 'path_C_respP', rate: 1.5, color: '#1e293b' },
  { id: 'path_C_eat', rate: 1, color: '#1e293b' },
  { id: 'path_C_respC', rate: 1, color: '#1e293b' },
  { id: 'path_C_decay', rate: 0.5, color: '#1e293b' },
  { id: 'path_C_oceanIn', rate: 2, color: '#1e293b' },
  { id: 'path_C_oceanOut', rate: 2, color: '#1e293b' },
  { id: 'path_C_fossil', rate: 0, human: true, color: '#ef4444' },
  { id: 'path_C_emiss', rate: 0, human: true, color: '#ef4444' }
];

const FLUXES_NITROGEN: Flux[] = [
  { id: 'path_N_fix', rate: 1, color: '#9333ea' },
  { id: 'path_N_assim', rate: 2, color: '#9333ea' },
  { id: 'path_N_eat', rate: 1, color: '#9333ea' },
  { id: 'path_N_decay', rate: 1, color: '#9333ea' },
  { id: 'path_N_denit', rate: 1, color: '#9333ea' },
  { id: 'path_N_fert', rate: 0, human: true, color: '#ef4444' },
  { id: 'path_N_runoff', rate: 0, human: true, color: '#ef4444' }
];

export default function SiklusBiogeokimia() {
  const [currentMode, setCurrentMode] = useState<'CARBON' | 'NITROGEN'>('CARBON');
  const [humanImpact, setHumanImpact] = useState(2);
  const [isPlaying, setIsPlaying] = useState(true);
  const [state, setState] = useState<State>({
    atmCO2: 415,
    bioMass: 600,
    oceanAcid: 8.1,
    soilN: 100,
    eutrophication: 0
  });
  const [skyColor, setSkyColor] = useState('#e0f2fe');
  const [oceanColor, setOceanColor] = useState('#38bdf8');
  const [smokeOpacity, setSmokeOpacity] = useState(0.2);

  const particlesRef = useRef<Particle[]>([]);
  const fluxesRef = useRef<Flux[]>([]);
  const particlesLayerRef = useRef<SVGGElement>(null);
  const animFrameIdRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  const initFluxes = useCallback(() => {
    const fluxes = currentMode === 'CARBON' ? FLUXES_CARBON : FLUXES_NITROGEN;
    fluxesRef.current = fluxes.map(f => {
      const el = document.querySelector(`#${f.id}`) as SVGPathElement | null;
      return {
        ...f,
        element: el,
        length: el?.getTotalLength() || 0,
        timer: 0
      };
    });
  }, [currentMode]);

  const spawnParticle = useCallback((flux: Flux) => {
    if (!particlesLayerRef.current || !flux.element) return;
    
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    el.setAttribute('r', '5');
    el.setAttribute('fill', flux.color);
    el.setAttribute('stroke', '#fff');
    el.setAttribute('stroke-width', '1.5');
    particlesLayerRef.current.appendChild(el);

    particlesRef.current.push({
      el,
      flux,
      progress: 0,
      speed: 0.2 + Math.random() * 0.1
    });
  }, []);

  const updateUI = useCallback(() => {
    if (currentMode === 'CARBON') {
      if (humanImpact > 6) {
        setSkyColor('#fecaca');
        setOceanColor('#0284c7');
        setSmokeOpacity(1);
      } else if (humanImpact > 3) {
        setSkyColor('#fef08a');
        setOceanColor('#0ea5e9');
        setSmokeOpacity(0.6);
      } else {
        setSkyColor('#e0f2fe');
        setOceanColor('#38bdf8');
        setSmokeOpacity(0.2);
      }
    } else {
      if (state.eutrophication > 70) {
        setOceanColor('#166534');
        setSmokeOpacity(1);
      } else if (state.eutrophication > 30) {
        setOceanColor('#0d9488');
        setSmokeOpacity(0.6);
      } else {
        setOceanColor('#38bdf8');
        setSmokeOpacity(0.2);
      }
    }
  }, [currentMode, humanImpact, state.eutrophication]);

  const calculateRates = useCallback((dt: number) => {
    fluxesRef.current.forEach(flux => {
      if (flux.human) {
        flux.rate = currentMode === 'CARBON' 
          ? (humanImpact - 1) * 0.8 
          : (humanImpact - 1) * 0.6;
      }
      
      if (flux.rate > 0) {
        flux.timer = (flux.timer || 0) + dt;
        const interval = 1.0 / flux.rate;
        while (flux.timer > interval) {
          spawnParticle(flux);
          flux.timer -= interval;
        }
      }
    });

    const humanScale = humanImpact - 1;
    if (currentMode === 'CARBON') {
      setState(prev => ({
        ...prev,
        atmCO2: Math.min(800, Math.max(280, prev.atmCO2 + humanScale * 0.5 * dt))
      }));
    } else {
      setState(prev => ({
        ...prev,
        soilN: prev.soilN + humanScale * 2 * dt,
        eutrophication: Math.min(100, Math.max(0, prev.eutrophication + humanScale * 1.5 * dt))
      }));
    }
  }, [currentMode, humanImpact, spawnParticle]);

  const drawFrame = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    if (isPlaying) {
      calculateRates(dt);
      updateUI();

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.progress += p.speed * dt;

        if (p.progress >= 1) {
          p.el.remove();
          particlesRef.current.splice(i, 1);
          continue;
        }

        if (p.flux.element && p.flux.length) {
          const point = p.flux.element.getPointAtLength(p.progress * p.flux.length);
          p.el.setAttribute('cx', point.x.toString());
          p.el.setAttribute('cy', point.y.toString());
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(drawFrame);
  }, [isPlaying, calculateRates, updateUI]);

  useEffect(() => {
    initFluxes();
    animFrameIdRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      particlesRef.current.forEach(p => p.el.remove());
      particlesRef.current = [];
    };
  }, [currentMode, initFluxes, drawFrame]);

  useEffect(() => {
    updateUI();
  }, [updateUI]);

  const handleReset = () => {
    setHumanImpact(2);
    setState({
      atmCO2: 415,
      bioMass: 600,
      oceanAcid: 8.1,
      soilN: 100,
      eutrophication: 0
    });
    particlesRef.current.forEach(p => p.el.remove());
    particlesRef.current = [];
    fluxesRef.current.forEach(f => f.timer = 0);
  };

  const getStatusText = () => {
    if (currentMode === 'CARBON') {
      if (humanImpact > 6) return { text: 'KRITIS: PEMANASAN GLOBAL', color: 'text-rose-500' };
      if (humanImpact > 3) return { text: 'AWAS: EMISI MENINGKAT', color: 'text-yellow-400' };
      return { text: 'KESEIMBANGAN ALAMI', color: 'text-emerald-400' };
    } else {
      if (state.eutrophication > 70) return { text: 'KRITIS: EUTROFIKASI LAUT', color: 'text-rose-500' };
      if (state.eutrophication > 30) return { text: 'AWAS: PENCEMARAN PUPUK', color: 'text-yellow-400' };
      return { text: 'KESEIMBANGAN ALAMI', color: 'text-emerald-400' };
    }
  };

  const statusInfo = getStatusText();

  const getHumanImpactLabel = () => {
    if (humanImpact <= 2) return 'Alami / Rendah';
    if (humanImpact <= 6) return 'Sedang';
    return 'Tinggi (Eksploitasi)';
  };

  const renderCarbonLabels = () => (
    <>
      <text x="220" y="150" fontWeight="bold" fontSize="10" fill="#000" opacity="0.6">Fotosintesis</text>
      <text x="320" y="180" fontWeight="bold" fontSize="10" fill="#000" opacity="0.6">Respirasi</text>
      <text x="150" y="100" fontWeight="bold" fontSize="10" fill="#ef4444" opacity="0.6">Pembakaran Fosil</text>
      <text x="650" y="200" fontWeight="bold" fontSize="10" fill="#000" opacity="0.6">Difusi Lautan</text>
    </>
  );

  const renderNitrogenLabels = () => (
    <>
      <text x="350" y="200" fontWeight="bold" fontSize="10" fill="#000" opacity="0.6">Fiksasi N₂</text>
      <text x="450" y="250" fontWeight="bold" fontSize="10" fill="#000" opacity="0.6">Denitrifikasi</text>
      <text x="100" y="420" fontWeight="bold" fontSize="10" fill="#ef4444" opacity="0.6">Pupuk Sintetis (Haber-Bosch)</text>
      <text x="400" y="440" fontWeight="bold" fontSize="10" fill="#ef4444" opacity="0.6">Runoff (Pencucian)</text>
    </>
  );

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">EKOLOGI & ILMU BUMI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: SIKLUS BIOGEOKIMIA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Dinamika Reservoir dan Flux pada Siklus Karbon (C) & Nitrogen (N)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#10b981] text-md transform rotate-2 z-30 uppercase">
            Panel Intervensi
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Siklus Elemen</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setCurrentMode('CARBON'); particlesRef.current.forEach(p => p.el.remove()); particlesRef.current = []; }}
                  className={`neo-btn py-2 px-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${currentMode === 'CARBON' ? 'bg-slate-800 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                >
                  ⚫ KARBON (C)
                </button>
                <button
                  onClick={() => { setCurrentMode('NITROGEN'); particlesRef.current.forEach(p => p.el.remove()); particlesRef.current = []; }}
                  className={`neo-btn py-2 px-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${currentMode === 'NITROGEN' ? 'bg-purple-600 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                >
                  🟣 NITROGEN (N)
                </button>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">
                  {currentMode === 'CARBON' ? 'Emisi Fosil (Industri)' : 'Pupuk Sintetis (Haber-Bosch)'}
                </span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{getHumanImpactLabel()}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={humanImpact}
                onChange={(e) => setHumanImpact(parseInt(e.target.value))}
                className="w-full bg-transparent cursor-pointer"
                style={{ accentColor: '#f43f5e' }}
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Alami</span>
                <span>Eksploitasi Maksimal</span>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="neo-btn py-3 text-sm flex-1 flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                style={{ backgroundColor: isPlaying ? '#34d399' : '#facc15' }}
              >
                {isPlaying ? '⏸️ JEDA SIKLUS' : '▶️ LANJUTKAN SIKLUS'}
              </button>
              <button
                onClick={handleReset}
                className="neo-btn bg-slate-200 hover:bg-slate-300 py-3 px-4 text-sm flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔄 RESET BUMI
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
            <h4 className="font-black text-yellow-300 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA RESERVOIR GLOBAL</h4>
            
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">
                  {currentMode === 'CARBON' ? 'CO₂ Atmosfer' : 'Nitrogen Tanah (Soil N)'}
                </span>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-rose-400 font-mono">
                    {currentMode === 'CARBON' ? Math.floor(state.atmCO2) : Math.floor(state.soilN)}
                  </span>
                  <span className="text-[9px] text-slate-400 mb-1">{currentMode === 'CARBON' ? 'ppm' : 'Gt'}</span>
                </div>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">
                  {currentMode === 'CARBON' ? 'Biomassa (Hidup)' : 'Ledakan Alga (Eutrofikasi)'}
                </span>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {currentMode === 'CARBON' ? Math.floor(state.bioMass) : Math.floor(state.eutrophication)}
                  </span>
                  <span className="text-[9px] text-slate-400 mb-1">{currentMode === 'CARBON' ? 'Gt' : '%'}</span>
                </div>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex flex-col items-center justify-center rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Lingkungan</span>
              <span className={`text-xs font-black uppercase tracking-widest ${statusInfo.color}`}>{statusInfo.text}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center w-full h-[600px] overflow-hidden border-8 border-black rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Visualisasi Aliran (Flux) {currentMode === 'CARBON' ? 'Karbon' : 'Nitrogen'}
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border border-black`} style={{ backgroundColor: currentMode === 'CARBON' ? '#1e293b' : '#9333ea' }}></div>
                Atom {currentMode === 'CARBON' ? 'Karbon (C)' : 'Nitrogen (N)'}
              </div>
              <div className="flex items-center gap-2"><div className="w-4 h-1 border-t-2 border-slate-500 border-dashed"></div> Jalur Alami (Flux)</div>
              <div className="flex items-center gap-2"><div className="w-4 h-1 border-t-2 border-rose-500 border-dashed"></div> Intervensi Manusia</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <svg viewBox="0 0 800 600" className="w-full h-full overflow-visible">
                <g id="environment">
                  <rect id="skyBg" x="0" y="0" width="800" height="300" fill={skyColor} className="transition-all duration-1000"/>
                  <circle id="sun" cx="700" cy="80" r="40" fill="#facc15" stroke="#eab308" strokeWidth="4"/>
                  
                  <path id="oceanBg" d="M 450 300 Q 550 280 650 300 T 800 300 L 800 600 L 450 600 Z" fill={oceanColor} stroke="#0284c7" strokeWidth="4" opacity="0.8" className="transition-all duration-1000"/>
                  
                  <path d="M 0 300 L 450 300 L 450 600 L 0 600 Z" fill="#a3e635" stroke="#4d7c0f" strokeWidth="4"/>
                  <path d="M 0 350 L 450 350 L 450 600 L 0 600 Z" fill="#8b5cf6" stroke="#5b21b6" strokeWidth="4" opacity="0.2"/>
                  <text x="225" y="480" textAnchor="middle" fontWeight="900" fontSize="20" fill="#000" opacity="0.1">LITOSFER (TANAH & FOSIL)</text>
                </g>

                <g id="objects">
                  <g transform="translate(150, 260)">
                    <rect x="-10" y="0" width="20" height="90" fill="#78350f" stroke="#000" strokeWidth="2"/>
                    <circle cx="0" cy="-20" r="40" fill="#22c55e" stroke="#000" strokeWidth="3"/>
                    <circle cx="-25" cy="10" r="30" fill="#22c55e" stroke="#000" strokeWidth="3"/>
                    <circle cx="25" cy="10" r="30" fill="#22c55e" stroke="#000" strokeWidth="3"/>
                    <text x="0" y="60" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff" className="bg-black px-1 rounded">BIOSFER</text>
                  </g>

                  <g transform="translate(320, 310)">
                    <rect x="-20" y="-15" width="40" height="25" rx="5" fill="#f8fafc" stroke="#000" strokeWidth="2"/>
                    <rect x="-25" y="-25" width="15" height="15" rx="3" fill="#f8fafc" stroke="#000" strokeWidth="2"/>
                    <line x1="-10" y1="10" x2="-10" y2="25" stroke="#000" strokeWidth="3"/>
                    <line x1="10" y1="10" x2="10" y2="25" stroke="#000" strokeWidth="3"/>
                  </g>

                  <g transform="translate(60, 270)">
                    <g id="smokeGroup" style={{ opacity: smokeOpacity }}>
                      <circle cx="0" cy="-30" r="10" fill="#475569" opacity="0.6" className="animate-pulse"/>
                      <circle cx="10" cy="-50" r="15" fill="#64748b" opacity="0.5" className="animate-pulse" style={{ animationDelay: '0.5s' }}/>
                      <circle cx="-5" cy="-70" r="20" fill="#334155" opacity="0.4" className="animate-pulse" style={{ animationDelay: '1s' }}/>
                    </g>
                    <rect x="-30" y="0" width="60" height="80" fill="#cbd5e1" stroke="#000" strokeWidth="3"/>
                    <polygon points="-15,0 -5,-40 5,-40 -5,0" fill="#94a3b8" stroke="#000" strokeWidth="2"/>
                    <polygon points="5,0 15,-50 25,-50 15,0" fill="#94a3b8" stroke="#000" strokeWidth="2"/>
                    <text x="0" y="40" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#000">INDUSTRI</text>
                  </g>
                </g>

                <g id="fluxPaths" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="4 2" opacity="0.2">
                  <path id="path_C_photo" d="M 400 50 Q 150 100 150 240" />
                  <path id="path_C_respP" d="M 170 240 Q 250 100 450 50" />
                  <path id="path_C_eat" d="M 160 300 Q 240 280 300 310" />
                  <path id="path_C_respC" d="M 320 290 Q 350 100 500 50" />
                  <path id="path_C_decay" d="M 320 330 Q 320 400 250 450" />
                  <path id="path_C_fossil" d="M 200 500 Q 60 450 60 350" />
                  <path id="path_C_emiss" d="M 70 230 Q 100 50 350 50" stroke="#ef4444" strokeWidth="2"/>
                  <path id="path_C_oceanIn" d="M 550 50 Q 650 150 650 350" />
                  <path id="path_C_oceanOut" d="M 700 350 Q 700 150 600 50" />

                  <path id="path_N_fix" d="M 450 50 Q 350 150 250 400" />
                  <path id="path_N_assim" d="M 200 400 Q 150 350 150 300" />
                  <path id="path_N_eat" d="M 160 300 Q 240 280 300 310" />
                  <path id="path_N_decay" d="M 320 330 Q 320 400 250 450" />
                  <path id="path_N_denit" d="M 300 450 Q 500 200 550 50" />
                  <path id="path_N_fert" d="M 80 350 Q 100 400 200 420" stroke="#ef4444" strokeWidth="2"/>
                  <path id="path_N_runoff" d="M 350 450 Q 450 450 550 400" stroke="#ef4444" strokeWidth="2"/>
                </g>

                <g id="particlesLayer" ref={particlesLayerRef}></g>

                <g id="labelsOverlay" fontFamily="Space Grotesk" fontWeight="bold" fontSize="10" fill="#000" opacity="0.6">
                  {currentMode === 'CARBON' ? renderCarbonLabels() : renderNitrogenLabels()}
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-emerald-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Siklus Elemen Kehidupan 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-slate-800 border-b-2 border-black pb-1 mb-2">⚫ SIKLUS KARBON</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Karbon adalah tulang punggung molekul organik. Di alam, siklus ini sangat seimbang: tumbuhan menyerap CO₂ (Fotosintesis), lalu makhluk hidup melepaskannya kembali (Respirasi & Dekomposisi).
            </p>
            <p className="text-xs font-medium text-slate-600 bg-rose-50 p-2 border-l-4 border-rose-500 rounded">
              <b>Dampak Manusia:</b> Membakar bahan bakar fosil mengambil karbon yang telah terkunci jutaan tahun di dalam tanah (Litosfer) dan membuangnya ke Atmosfer. Laju ini terlalu cepat untuk diserap kembali oleh alam, menyebabkan <b>Pemanasan Global</b> dan <b>Pengasaman Samudra</b>.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-purple-700 border-b-2 border-black pb-1 mb-2">🟣 SIKLUS NITROGEN</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Nitrogen penting untuk DNA dan Protein. Meskipun 78% atmosfer adalah gas N₂, tumbuhan tidak bisa menggunakannya langsung. N₂ harus diubah (difiksasi) oleh bakteri tanah atau petir menjadi Amonia/Nitrat.
            </p>
            <p className="text-xs font-medium text-slate-600 bg-rose-50 p-2 border-l-4 border-rose-500 rounded">
              <b>Dampak Manusia:</b> Pembuatan pupuk sintetis massal menambahkan terlalu banyak Nitrogen ke dalam tanah. Kelebihannya tercuci oleh hujan (Runoff) ke perairan, memicu ledakan alga beracun yang mencekik kehidupan laut (<b>Eutrofikasi</b>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}