import { useState, useEffect, useRef, type ReactNode } from 'react';

interface Particle {
  el: SVGCircleElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

type Mode = 'SOLUTION' | 'COLLOID' | 'SUSPENSION';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: "1. Efek Tyndall terjadi ketika cahaya dihamburkan oleh partikel...",
    options: ["Larutan sejati", "Koloid", "Suspensi kasar", "Gas ideal"],
    answer: 1
  },
  {
    question: "2. Ukuran partikel koloid berada dalam rentang...",
    options: ["< 1 nm", "1-100 nm", "> 100 nm", "> 1000 nm"],
    answer: 1
  },
  {
    question: "3. Gerak Brown adalah gerakan acak partikel koloid akibat...",
    options: ["Gaya gravitasi", "Tumbukan dengan molekul medium pendispersi", "Medan magnet", "Arus listrik"],
    answer: 1
  },
  {
    question: "4. Suspensi berbeda dengan koloid karena suspensi...",
    options: ["Lebih stabil", "Partikelnya mengendap", "Menghamburkan cahaya", "Homogen"],
    answer: 1
  },
  {
    question: "5. Contoh sistem koloid adalah...",
    options: ["Air garam", "Larutan gula", "Susu", "Air murni"],
    answer: 2
  }
];

export default function SistemKoloid(): ReactNode {
  const [currentMode, setCurrentMode] = useState<Mode>('SOLUTION');
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isMicroscopeOn, setIsMicroscopeOn] = useState(false);
  const [suspensionSettled, setSuspensionSettled] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const microParticlesRef = useRef<Particle[]>([]);
  const macroParticlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  const liquidAreaRef = useRef<SVGPathElement>(null);
  const sedimentAreaRef = useRef<SVGPathElement>(null);
  const beakerGroupRef = useRef<SVGGElement>(null);
  const microscopeParticlesRef = useRef<SVGGElement>(null);
  const macroParticlesGroupRef = useRef<SVGGElement>(null);
  const lightBeamGroupRef = useRef<SVGGElement>(null);
  const lightBeamExtendedRef = useRef<SVGGElement>(null);
  const beamInsideRef = useRef<SVGPolygonElement>(null);
  const beamAfterRef = useRef<SVGPolygonElement>(null);
  const microscopeGroupRef = useRef<SVGGElement>(null);

  // Initialize particles
  useEffect(() => {
    if (!microscopeParticlesRef.current || !macroParticlesGroupRef.current) return;

    microscopeParticlesRef.current.innerHTML = '';
    macroParticlesGroupRef.current.innerHTML = '';
    microParticlesRef.current = [];
    macroParticlesRef.current = [];
    setSuspensionSettled(false);

    let microCount = 0;
    let microSize = 0;
    let microColor = '#ffffff';
    let microSpeed = 1;

    if (currentMode === 'SOLUTION') {
      microCount = 80;
      microSize = 1.5;
      microColor = '#bae6fd';
      microSpeed = 4;
    } else if (currentMode === 'COLLOID') {
      microCount = 40;
      microSize = 4;
      microColor = '#f8fafc';
      microSpeed = 1.5;
    } else if (currentMode === 'SUSPENSION') {
      microCount = 20;
      microSize = 12;
      microColor = '#78350f';
      microSpeed = 0;
    }

    for (let i = 0; i < microCount; i++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGCircleElement;
      el.setAttribute('r', microSize.toString());
      el.setAttribute('fill', microColor);
      if (currentMode === 'SOLUTION') el.setAttribute('opacity', '0.6');
      microscopeParticlesRef.current?.appendChild(el);

      microParticlesRef.current.push({
        el,
        x: 650 + (Math.random() - 0.5) * 160,
        y: 150 + (Math.random() - 0.5) * 160,
        vx: (Math.random() - 0.5) * microSpeed,
        vy: (Math.random() - 0.5) * microSpeed,
      });
    }

    let macroCount = currentMode === 'COLLOID' ? 40 : currentMode === 'SUSPENSION' ? 60 : 0;

    for (let i = 0; i < macroCount; i++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGCircleElement;
      el.setAttribute('r', (currentMode === 'COLLOID' ? 1.5 : 3).toString());
      el.setAttribute('fill', currentMode === 'COLLOID' ? '#ffffff' : '#451a03');
      el.setAttribute('opacity', (currentMode === 'COLLOID' ? 0.4 : 0.8).toString());
      macroParticlesGroupRef.current?.appendChild(el);

      macroParticlesRef.current.push({
        el,
        x: (Math.random() - 0.5) * 250,
        y: -80 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }
  }, [currentMode]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      let allMicroSettled = true;
      let allMacroSettled = true;

      if (isMicroscopeOn) {
        microParticlesRef.current.forEach(p => {
          if (currentMode === 'SOLUTION') {
            p.x += p.vx;
            p.y += p.vy;
          } else if (currentMode === 'COLLOID') {
            if (Math.random() < 0.15) {
              p.vx = (Math.random() - 0.5) * 4;
              p.vy = (Math.random() - 0.5) * 4;
            }
            p.x += p.vx;
            p.y += p.vy;
            allMicroSettled = false;
          } else if (currentMode === 'SUSPENSION') {
            if (!suspensionSettled) {
              p.vy += 0.08;
              p.y += p.vy;
              p.x += (Math.random() - 0.5) * 0.5;

              if (p.y > 230 + Math.random() * 10) {
                p.y = 230 + Math.random() * 10;
                p.vy = 0;
              } else {
                allMicroSettled = false;
              }
            }
          }

          const dx = p.x - 650;
          const dy = p.y - 150;
          if (Math.hypot(dx, dy) > 90) {
            p.x = 650 + dx * 0.8;
            p.y = 150 + dy * 0.8;
            p.vx *= -1;
            p.vy *= -1;
          }

          p.el.setAttribute('cx', p.x.toString());
          p.el.setAttribute('cy', p.y.toString());
        });
      }

      if (currentMode !== 'SOLUTION') {
        macroParticlesRef.current.forEach(p => {
          if (currentMode === 'COLLOID') {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < -130 || p.x > 130) p.vx *= -1;
            if (p.y < -90 || p.y > 130) p.vy *= -1;
            allMacroSettled = false;
          } else if (currentMode === 'SUSPENSION') {
            if (!suspensionSettled) {
              p.vy += 0.05;
              p.y += p.vy;
              p.x += (Math.random() - 0.5) * 0.2;

              if (p.y > 120 + Math.random() * 20) {
                p.y = 120 + Math.random() * 20;
                p.vy = 0;
              } else {
                allMacroSettled = false;
              }
            }
          }
          p.el.setAttribute('cx', p.x.toString());
          p.el.setAttribute('cy', p.y.toString());
        });
      }

      if (currentMode === 'SUSPENSION' && allMacroSettled && (allMicroSettled || !isMicroscopeOn) && !suspensionSettled) {
        setSuspensionSettled(true);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentMode, isMicroscopeOn, suspensionSettled]);

  // Update visuals based on mode
  useEffect(() => {
    if (!liquidAreaRef.current || !sedimentAreaRef.current || !beamInsideRef.current || !beamAfterRef.current) return;

    if (currentMode === 'SOLUTION') {
      liquidAreaRef.current.setAttribute('fill', '#bae6fd');
      liquidAreaRef.current.setAttribute('opacity', '0.4');
      sedimentAreaRef.current.setAttribute('opacity', '0');
    } else if (currentMode === 'COLLOID') {
      liquidAreaRef.current.setAttribute('fill', '#cbd5e1');
      liquidAreaRef.current.setAttribute('opacity', '0.7');
      sedimentAreaRef.current.setAttribute('opacity', '0');
    } else if (currentMode === 'SUSPENSION') {
      liquidAreaRef.current.setAttribute('fill', '#d6d3d1');
      liquidAreaRef.current.setAttribute('opacity', suspensionSettled ? '0.4' : '0.9');
      
      if (suspensionSettled) {
        sedimentAreaRef.current.setAttribute('d', 'M -145 100 L 145 100 Q 0 150 -145 140 Z');
        sedimentAreaRef.current.setAttribute('opacity', '1');
      } else {
        sedimentAreaRef.current.setAttribute('opacity', '0');
      }
    }

    // Update beam based on Tyndall effect
    if (isFlashlightOn) {
      lightBeamGroupRef.current?.setAttribute('opacity', '1');
      lightBeamExtendedRef.current?.setAttribute('opacity', '1');

      if (currentMode === 'SOLUTION') {
        beamInsideRef.current?.setAttribute('fill', 'url(#beamInsideSolution)');
        beamAfterRef.current?.setAttribute('opacity', '1');
      } else if (currentMode === 'COLLOID') {
        beamInsideRef.current?.setAttribute('fill', 'url(#beamInsideColloid)');
        beamAfterRef.current?.setAttribute('opacity', '0.4');
      } else if (currentMode === 'SUSPENSION') {
        if (suspensionSettled) {
          beamInsideRef.current?.setAttribute('fill', 'url(#beamInsideSolution)');
          beamAfterRef.current?.setAttribute('opacity', '0.9');
        } else {
          beamInsideRef.current?.setAttribute('fill', 'url(#beamInsideSuspension)');
          beamAfterRef.current?.setAttribute('opacity', '0.05');
        }
      }
    } else {
      lightBeamGroupRef.current?.setAttribute('opacity', '0');
      lightBeamExtendedRef.current?.setAttribute('opacity', '0');
    }

    microscopeGroupRef.current?.setAttribute('opacity', isMicroscopeOn ? '1' : '0');
  }, [currentMode, isFlashlightOn, isMicroscopeOn, suspensionSettled]);

  const triggerStir = () => {
    if (!beakerGroupRef.current) return;
    
    beakerGroupRef.current.style.animation = 'none';
    (beakerGroupRef.current as unknown as HTMLElement).offsetHeight;
    beakerGroupRef.current.style.animation = 'stirBeaker 0.6s ease-in-out';

    if (currentMode === 'SUSPENSION') {
      setSuspensionSettled(false);
      
      microParticlesRef.current.forEach(p => {
        p.y = 70 + Math.random() * 100;
        p.vy = (Math.random() - 0.5) * 8;
      });
      
      macroParticlesRef.current.forEach(p => {
        p.y = -80 + Math.random() * 180;
        p.vy = (Math.random() - 0.5) * 5;
      });
    }
  };

  const handleAnswerSelect = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (userAnswers.every(a => a !== null)) {
      setQuizSubmitted(true);
    }
  };

  const handleRetry = () => {
    setUserAnswers(new Array(5).fill(null));
    setQuizSubmitted(false);
  };

  const score = quizSubmitted
    ? userAnswers.reduce<number>((acc, ans, i) => (ans === quizData[i].answer ? acc + 1 : acc), 0)
    : 0;

  const allAnswered = userAnswers.every(a => a !== null);

  const getTelemetryData = () => {
    if (currentMode === 'SOLUTION') {
      return {
        size: '< 1 nm (Molekuler)',
        sizeClass: 'text-sm font-black text-sky-300',
        tyndall: 'Tidak Ada (Diteruskan)',
        tyndallClass: 'text-sm font-black text-slate-400',
        phase: 'Stabil (1 Fase Jernih)',
        phaseClass: 'text-sm font-black text-emerald-400',
      };
    } else if (currentMode === 'COLLOID') {
      return {
        size: '1 nm - 100 nm',
        sizeClass: 'text-sm font-black text-indigo-300',
        tyndall: 'Ada (Menghamburkan)',
        tyndallClass: 'text-sm font-black text-yellow-300',
        phase: 'Stabil (Efek Gerak Brown)',
        phaseClass: 'text-sm font-black text-emerald-400',
      };
    } else {
      return {
        size: '> 100 nm (Kasar)',
        sizeClass: 'text-sm font-black text-rose-400',
        tyndall: suspensionSettled ? 'Cahaya Diteruskan (Air Jernih)' : 'Cahaya Diblokir / Keruh',
        tyndallClass: suspensionSettled ? 'text-sm font-black text-sky-400' : 'text-sm font-black text-rose-400',
        phase: suspensionSettled ? 'Mengendap (2 Fase)' : 'Tidak Stabil (Proses Turun)',
        phaseClass: suspensionSettled ? 'text-sm font-black text-rose-500' : 'text-sm font-black text-orange-400',
      };
    }
  };

  const telemetry = getTelemetryData();

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <style>{`
        @keyframes pulseBeam {
          0% { opacity: 0.8; filter: drop-shadow(0 0 8px #fef08a); }
          100% { opacity: 1; filter: drop-shadow(0 0 20px #facc15); }
        }
        .beam-glow {
          animation: pulseBeam 1.5s infinite alternate;
        }
        @keyframes stirBeaker {
          0% { transform: translateX(0) rotate(0); }
          20% { transform: translateX(-8px) rotate(-3deg); }
          40% { transform: translateX(8px) rotate(3deg); }
          60% { transform: translateX(-8px) rotate(-3deg); }
          80% { transform: translateX(8px) rotate(3deg); }
          100% { transform: translateX(0) rotate(0); }
        }
        .neo-box {
          background-color: #ffffff;
          border: 4px solid #000000;
          box-shadow: 8px 8px 0px 0px #000000;
          border-radius: 12px;
        }
        .neo-btn {
          border: 4px solid #000000;
          box-shadow: 4px 4px 0px 0px #000000;
          border-radius: 8px;
          transition: all 0.1s ease-in-out;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
        }
        .neo-btn:active, .neo-btn-pressed {
          transform: translate(4px, 4px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
        .neo-btn:disabled {
          background-color: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          transform: translate(4px, 4px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
      `}</style>

      {/* Header */}
      <header className="text-center mb-8 max-w-6xl bg-sky-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black font-bold text-sm transform -rotate-3 text-black">KIMIA FISIK & SISTEM DISPERSI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: SISTEM KOLOID
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Efek Tyndall, Gerak Brown, dan Ukuran Partikel Campuran
        </p>
      </header>

      {/* Main Workspace */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        
        {/* Controls */}
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md transform rotate-2 z-30 uppercase">
            Panel Intervensi
          </span>

          <div className="flex flex-col gap-4 mt-4">
            
            {/* Mode Selection */}
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Jenis Campuran</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setCurrentMode('SOLUTION')}
                  className={`neo-btn py-2 px-3 text-xs font-bold text-left flex justify-between items-center ${currentMode === 'SOLUTION' ? 'bg-blue-300 ring-4 ring-black' : 'bg-blue-200 text-black'}`}
                >
                  <span>💧 LARUTAN SEJATI</span>
                  <span className="text-[9px] bg-white px-1 border border-black">Air Garam</span>
                </button>
                <button
                  onClick={() => setCurrentMode('COLLOID')}
                  className={`neo-btn py-2 px-3 text-xs font-bold text-left flex justify-between items-center ${currentMode === 'COLLOID' ? 'bg-indigo-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                >
                  <span>🥛 KOLOID</span>
                  <span className="text-[9px] bg-white px-1 border border-black">Susu / Kabut</span>
                </button>
                <button
                  onClick={() => setCurrentMode('SUSPENSION')}
                  className={`neo-btn py-2 px-3 text-xs font-bold text-left flex justify-between items-center ${currentMode === 'SUSPENSION' ? 'bg-orange-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                >
                  <span>☕ SUSPENSI</span>
                  <span className="text-[9px] bg-white px-1 border border-black">Air Kopi / Pasir</span>
                </button>
              </div>
              <button
                onClick={triggerStir}
                disabled={currentMode !== 'SUSPENSION'}
                className={`neo-btn bg-slate-800 text-white py-2 mt-2 text-xs ${currentMode !== 'SUSPENSION' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
              >
                🥄 ADUK CAMPURAN
              </button>
            </div>

            {/* Tools */}
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Alat Laboratorium</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsFlashlightOn(!isFlashlightOn)}
                  className={`neo-btn py-3 text-xs flex flex-col items-center justify-center gap-1 ${isFlashlightOn ? 'bg-yellow-300 hover:bg-yellow-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'}`}
                >
                  <span className="text-2xl">🔦</span>
                  <span>Senter (Tyndall)</span>
                </button>
                <button
                  onClick={() => setIsMicroscopeOn(!isMicroscopeOn)}
                  className={`neo-btn py-3 text-xs flex flex-col items-center justify-center gap-1 ${isMicroscopeOn ? 'bg-emerald-300 hover:bg-emerald-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'}`}
                >
                  <span className="text-2xl">🔬</span>
                  <span>Mikroskop (Brown)</span>
                </button>
              </div>
            </div>

          </div>

          {/* Telemetry */}
          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">PROFIL DISPERSI</h4>
            
            <div className="grid grid-cols-1 gap-2 text-left mb-2">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Ukuran Partikel</span>
                <span className={telemetry.sizeClass}>{telemetry.size}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Efek Tyndall</span>
                <span className={telemetry.tyndallClass}>{telemetry.tyndall}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Pemisahan Fase</span>
                <span className={telemetry.phaseClass}>{telemetry.phase}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Area */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center w-full h-[500px] border-8 border-black overflow-hidden" style={{ background: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Meja Eksperimen
            </span>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-black rounded-full"></div> Partikel Terdispersi</div>
              <div className="flex items-center gap-2"><div className="w-4 h-1 bg-yellow-300"></div> Berkas Cahaya</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
              <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
                <defs>
                  <clipPath id="microscopeMask">
                    <circle cx="650" cy="150" r="100" />
                  </clipPath>
                  
                  <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0.1"/>
                  </linearGradient>
                  
                  <linearGradient id="beamInsideSolution" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.05"/>
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0.0"/>
                  </linearGradient>

                  <linearGradient id="beamInsideColloid" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0.7"/>
                  </linearGradient>

                  <linearGradient id="beamInsideSuspension" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9"/>
                    <stop offset="40%" stopColor="#facc15" stopOpacity="0.1"/>
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>

                {/* Flashlight */}
                <g transform="translate(50, 250)">
                  <rect x="-40" y="-20" width="60" height="40" fill="#475569" stroke="#000" strokeWidth="4" rx="4"/>
                  <polygon points="20,-30 40,-40 40,40 20,30" fill="#94a3b8" stroke="#000" strokeWidth="4"/>
                  <rect x="-10" y="-25" width="15" height="5" fill="#ef4444" stroke="#000" strokeWidth="2"/>
                  
                  <g ref={lightBeamGroupRef} opacity="0" className="transition-opacity duration-300 beam-glow">
                    <polygon points="40,-35 250,-50 250,50 40,35" fill="url(#beamGradient)" />
                  </g>
                </g>

                {/* Extended Beam */}
                <g ref={lightBeamExtendedRef} opacity="0" className="transition-opacity duration-300 beam-glow">
                  <polygon ref={beamInsideRef} points="250,200 550,180 550,320 250,300" fill="url(#beamInsideSolution)" />
                  <polygon ref={beamAfterRef} points="550,180 800,150 800,350 550,320" fill="url(#beamGradient)" opacity="1"/>
                </g>

                {/* Beaker */}
                <g ref={beakerGroupRef} transform="translate(400, 300)">
                  <path ref={liquidAreaRef} d="M -145 -100 L 145 -100 L 145 140 Q 0 150 -145 140 Z" fill="#bae6fd" opacity="0.6" className="transition-all duration-500" />
                  
                  <g ref={macroParticlesGroupRef}></g>

                  <path ref={sedimentAreaRef} d="M -145 140 L 145 140 Q 0 150 -145 140 Z" fill="#78350f" opacity="0" className="transition-all duration-500" />

                  <path d="M -150 -180 L -150 140 Q -150 160 -100 160 L 100 160 Q 150 160 150 140 L 150 -180" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" opacity="0.8"/>
                  <path d="M -150 -180 L -150 140 Q -150 160 -100 160 L 100 160 Q 150 160 150 140 L 150 -180" fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                  <line x1="-160" y1="-180" x2="-140" y2="-180" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                  <line x1="140" y1="-180" x2="160" y2="-180" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                </g>

                {/* Microscope */}
                <g ref={microscopeGroupRef} transform="translate(0, 0)" opacity="0" className="transition-opacity duration-500">
                  <line x1="450" y1="200" x2="550" y2="150" stroke="#94a3b8" strokeWidth="4" strokeDasharray="8 4" />
                  
                  <circle cx="650" cy="150" r="105" fill="#f8fafc" stroke="#0f172a" strokeWidth="8" />
                  <circle cx="650" cy="150" r="100" fill="#0f172a" />

                  <g clipPath="url(#microscopeMask)" ref={microscopeParticlesRef}></g>

                  <path d="M 570 80 Q 650 40 730 80 Q 650 100 570 80 Z" fill="#ffffff" opacity="0.1" />
                  <text x="650" y="275" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="900" fontSize="14" fill="#fff">Zoom: 1.000.000x</text>
                </g>

              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-2 bg-sky-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Membedakan Sistem Dispersi 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">1. Larutan Sejati</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Campuran homogen secara total. Ukuran zat terlarut sangat kecil (<b>&lt; 1 nm</b>), berbentuk ion atau molekul individu.
            </p>
            <ul className="text-xs list-disc pl-4 font-medium text-slate-700 space-y-1">
              <li>Sangat jernih, cahaya senter diteruskan tanpa terlihat dari samping.</li>
              <li>Sangat stabil (tidak pernah mengendap).</li>
              <li>Partikel bergerak super cepat.</li>
            </ul>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-indigo-600 border-b-2 border-black pb-1 mb-2">2. Koloid</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Keadaan "tengah-tengah". Secara kasat mata tampak homogen, tapi aslinya heterogen. Ukuran partikel <b>1 nm - 100 nm</b>.
            </p>
            <ul className="text-xs list-disc pl-4 font-medium text-slate-700 space-y-1">
              <li>Menghamburkan cahaya (<b>Efek Tyndall</b>), membuat berkas sinar senter terlihat jelas di dalam cairan.</li>
              <li>Tidak mengendap berkat <b>Gerak Brown</b> (tumbukan zigzag acak partikel medium).</li>
            </ul>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-orange-600 border-b-2 border-black pb-1 mb-2">3. Suspensi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Campuran heterogen kasar. Ukuran partikel sangat besar (<b>&gt; 100 nm</b>).
            </p>
            <ul className="text-xs list-disc pl-4 font-medium text-slate-700 space-y-1">
              <li>Keruh, menghalangi cahaya senter menembus cairan.</li>
              <li>Tidak stabil; partikel akan jatuh ke dasar membentuk <b>endapan</b> akibat gaya gravitasi jika tidak diaduk.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quiz */}
      <div className="mb-12 bg-amber-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform -rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                <h4 className="font-bold text-black mb-4 text-base md:text-lg bg-white inline-block px-2 border-2 border-black">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIdx) => {
                    let btnClass = "border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg text-left px-4 py-3 text-sm md:text-base font-bold uppercase transition-all ";
                    if (quizSubmitted) {
                      if (oIdx === q.answer) {
                        btnClass += "bg-green-400 text-black";
                      } else if (userAnswers[qIdx] === oIdx) {
                        btnClass += "bg-rose-400 text-black opacity-80";
                      } else {
                        btnClass += "bg-slate-200 opacity-50";
                      }
                    } else {
                      btnClass += userAnswers[qIdx] === oIdx ? "bg-black text-white" : "bg-white text-black hover:bg-sky-200";
                    }
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswerSelect(qIdx, oIdx)}
                        disabled={quizSubmitted}
                        className={btnClass}
                      >
                        {quizSubmitted && oIdx === q.answer && "BENAR: "}
                        {quizSubmitted && userAnswers[qIdx] === oIdx && oIdx !== q.answer && "SALAH: "}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted && allAnswered && (
            <div className="text-center mt-8">
              <button
                onClick={handleSubmit}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-sky-500 text-black font-black py-4 px-10 text-xl md:text-2xl uppercase tracking-widest hover:bg-sky-600 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                CEK JAWABAN SAYA!
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? "LUAR BIASA! PEMAHAMAN KOLOIDMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP SISTEM DISPERSI DI ATAS."}
              </p>
              <br />
              <button
                onClick={handleRetry}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-black text-white py-3 px-8 text-lg uppercase tracking-wider font-bold hover:bg-slate-800 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                ULANGI KUIS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
