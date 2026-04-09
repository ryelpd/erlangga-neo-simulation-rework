import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

// --- CONSTANTS & PHYSICS VARIABLES ---
// Equation: P * V = n * R * T
// R is set so that P=1 atm when V=100L, T=300K, n=1mol
// 1.0 * 100 = 1.0 * R * 300 => R = 100/300 = 1/3
const R_GAS = 1 / 3;

// Visual boundaries of the Cylinder
const CYL_LEFT = 254;
const CYL_RIGHT = 546;
const CYL_BOTTOM = 496;

// Maximum number of particles for performance
const MAX_PARTICLES = 150;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speedMult: number;
}

type Mode = 'none' | 'isothermal' | 'isobaric' | 'isochoric';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: "1. Dalam proses Isotermal (Suhu konstan), apa yang terjadi pada tekanan jika volume dikurangi setengahnya?",
    options: ["Tekanan tetap", "Tekanan menjadi dua kali lipat", "Tekanan menjadi setengah", "Tekanan menjadi nol"],
    answer: 1
  },
  {
    question: "2. Hukum Charles menyatakan bahwa pada tekanan konstan, Volume gas berbanding lurus dengan...",
    options: ["Massa gas", "Suhu dalam Celcius", "Suhu Mutlak (Kelvin)", "Massa jenis"],
    answer: 2
  },
  {
    question: "3. Dalam proses Isohorik (Volume konstan), apa dampak meningkatnya suhu terhadap tekanan?",
    options: ["Tekanan turun", "Tekanan naik", "Tekanan tidak berubah", "Gas akan membeku"],
    answer: 1
  },
  {
    question: "4. Menurut teori kinetik gas, partikel gas ideal memiliki sifat...",
    options: ["Saling tarik-menarik kuat", "Tidak memiliki volume", "Selalu diam", "Memiliki massa sangat besar"],
    answer: 1
  },
  {
    question: "5. Dalam simulasi, jika n (jumlah mol) bertambah pada V dan T konstan, apa yang terjadi pada P?",
    options: ["P berkurang", "P bertambah", "P tetap", "P menjadi nol"],
    answer: 1
  }
];

export default function HukumGasIdeal(): ReactNode {
  // --- STATE ---
  const [targetV, setTargetV] = useState(100); // Volume (30-150 L)
  const [targetT, setTargetT] = useState(300); // Temperature (50-1000 K)
  const [targetN, setTargetN] = useState(1.0); // Amount of gas (0.1-3 mol)
  const [targetP, setTargetP] = useState(1.0); // Pressure (calculated)
  const [activeMode, setActiveMode] = useState<Mode>('none');
  const [isPlaying, setIsPlaying] = useState(true);
  const [displayCylTop, setDisplayCylTop] = useState(225);
  const [displayP, setDisplayP] = useState(1.0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const targetPRef = useRef(1.0);

  // Initialize particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const x = CYL_LEFT + 10 + Math.random() * (CYL_RIGHT - CYL_LEFT - 20);
      const y = displayCylTop + 10 + Math.random() * (CYL_BOTTOM - displayCylTop - 20);
      const angle = Math.random() * Math.PI * 2;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        speedMult: 0.7 + Math.random() * 0.6,
      });
    }
    setParticles(newParticles);
  }, []);

  // Physics calculation
  const updatePhysics = useCallback(() => {
    let newP = targetP;

    if (activeMode === 'isothermal') {
      // T constant. P = nRT/V
      newP = (targetN * R_GAS * targetT) / targetV;
    } else if (activeMode === 'isochoric') {
      // V constant. P = nRT/V
      newP = (targetN * R_GAS * targetT) / targetV;
    } else if (activeMode === 'isobaric') {
      // P constant. V = nRT/P
      let newV = (targetN * R_GAS * targetT) / targetPRef.current;
      if (newV > 150) {
        newV = 150;
        setTargetT((targetPRef.current * newV) / (targetN * R_GAS));
      }
      if (newV < 30) {
        newV = 30;
        setTargetT((targetPRef.current * newV) / (targetN * R_GAS));
      }
      setTargetV(newV);
    } else {
      // 'none': Calculate P from V, T, n
      newP = (targetN * R_GAS * targetT) / targetV;
    }

    setTargetP(newP);
    targetPRef.current = newP;
  }, [targetV, targetT, targetN, activeMode]);

  // Update physics when inputs change
  useEffect(() => {
    updatePhysics();
  }, [updatePhysics]);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const safeDt = Math.min(dt, 0.1);

      if (isPlaying) {
        const lerpFactor = 8 * safeDt;

        // Smooth cylinder position
        let newCylTop = 400 - ((targetV - 30) * 2.5);
        setDisplayCylTop(prev => prev + (newCylTop - prev) * lerpFactor);

        // Smooth pressure display
        setDisplayP(prev => prev + (targetP - prev) * lerpFactor);

            // Update particles
            const relativeSpeed = Math.sqrt(targetT / 300);
            const targetSpeedMagnitude = relativeSpeed * 150;

            setParticles(prev => prev.map(p => {
          const currentMag = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
          const individualSpeed = targetSpeedMagnitude * p.speedMult;
          let vx = (p.vx / currentMag) * individualSpeed;
          let vy = (p.vy / currentMag) * individualSpeed;

          let newX = p.x + vx * safeDt;
          let newY = p.y + vy * safeDt;

          // Boundary collisions
          if (newX <= CYL_LEFT + 4) { newX = CYL_LEFT + 4; vx = Math.abs(vx); }
          if (newX >= CYL_RIGHT - 4) { newX = CYL_RIGHT - 4; vx = -Math.abs(vx); }
          if (newY >= CYL_BOTTOM - 4) { newY = CYL_BOTTOM - 4; vy = -Math.abs(vy); }
          if (newY <= displayCylTop + 4) { newY = displayCylTop + 4; vy = Math.abs(vy); }

          return { ...p, x: newX, y: newY, vx, vy };
        }));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, targetV, targetT, targetP, displayCylTop]);

  // Get color for particles based on temperature
  function getParticleColor(t: number): string {
    if (t < 150) return '#38bdf8'; // Sky
    if (t < 300) return '#818cf8'; // Indigo
    if (t < 500) return '#facc15'; // Yellow
    if (t < 800) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  // Mode management
  const setLawMode = (mode: Mode) => {
    setActiveMode(mode);
    if (mode === 'isobaric') {
      targetPRef.current = targetP;
    }
  };

  // Number of active particles based on n
  const activeCount = Math.floor((targetN / 3.0) * MAX_PARTICLES);

  // Gauge angle calculation
  const gaugeAngle = Math.max(-60, Math.min(240, (displayP - 1) * 60));

  // Flame/Ice opacity
  let flameOpacity = 0;
  let iceOpacity = 0;
  let flameScale = 1;
  if (targetT > 350) {
    flameOpacity = Math.min(1, (targetT - 350) / 300);
    flameScale = 1 + (targetT - 350) / 1000;
  } else if (targetT < 250) {
    iceOpacity = Math.min(1, (250 - targetT) / 100);
  }

  // Quiz handlers
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

  // Background color for cylinder
  let bgColor = 'rgba(248, 250, 252, 0.4)';
  if (targetT < 300) {
    const intensity = (300 - targetT) / 250 * 0.4;
    bgColor = `rgba(56, 189, 248, ${intensity})`;
  } else {
    const intensity = (targetT - 300) / 700 * 0.5;
    bgColor = `rgba(244, 63, 94, ${intensity})`;
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <style>{`
        @keyframes flicker {
          0% { transform: scale(1) skewX(2deg); opacity: 0.8; }
          100% { transform: scale(1.1) skewX(-2deg); opacity: 1; }
        }
        .flame-anim {
          animation: flicker 0.15s infinite alternate;
          transform-origin: center bottom;
        }
        @keyframes chill {
          0% { filter: drop-shadow(0 0 5px #38bdf8); }
          100% { filter: drop-shadow(0 0 15px #38bdf8); }
        }
        .ice-anim {
          animation: chill 2s infinite alternate;
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
        .neo-btn:active {
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
      <header className="text-center mb-8 max-w-6xl bg-orange-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black font-bold text-sm transform -rotate-3 text-black">FISIKA ZAT & KALOR</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: HUKUM GAS IDEAL
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Termodinamika, Teori Kinetik Gas, dan Hubungan PV = nRT
        </p>
      </header>

      {/* Main Workspace */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        
        {/* Controls (Left) */}
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#fb923c] text-md transform rotate-2 z-30 uppercase">
            Panel Variabel
          </span>

          <div className="flex flex-col gap-4 mt-4">
            
            {/* Isoprocess Selection */}
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Kunci Variabel (Isoproses)</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { mode: 'none', label: '🔓 BEBAS (Semua Terbuka)' },
                  { mode: 'isothermal', label: '⚖️ Hukum Boyle: Suhu Konstan' },
                  { mode: 'isobaric', label: '🎈 Hukum Charles: Tekanan Konstan' },
                  { mode: 'isochoric', label: '🌡️ Hukum Gay-Lussac: Volume Konstan' },
                ].map(({ mode, label }) => (
                  <button
                    key={mode}
                    onClick={() => setLawMode(mode as Mode)}
                    className={`neo-btn bg-white text-slate-700 py-2 px-3 text-xs text-left ${activeMode === mode ? 'ring-4 ring-black bg-yellow-300' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Volume */}
            <div className={`bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 ${activeMode === 'isochoric' ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-800 uppercase text-[10px]">Volume Tabung (V)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-600">{targetV.toFixed(0)} L</span>
              </div>
              <input
                type="range"
                min="30"
                max="150"
                step="1"
                value={targetV}
                onChange={(e) => setTargetV(parseFloat(e.target.value))}
                disabled={activeMode === 'isochoric'}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded cursor-pointer"
              />
            </div>

            {/* Slider Temperature */}
            <div className={`bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 ${activeMode === 'isothermal' ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Temperatur (T)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{targetT.toFixed(0)} K</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="10"
                value={targetT}
                onChange={(e) => setTargetT(parseFloat(e.target.value))}
                disabled={activeMode === 'isothermal'}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded cursor-pointer"
              />
            </div>

            {/* Slider Particles */}
            <div className="bg-purple-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-purple-800 uppercase text-[10px]">Jumlah Gas (n)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-purple-600">{targetN.toFixed(1)} mol</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={targetN}
                onChange={(e) => setTargetN(parseFloat(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded cursor-pointer"
              />
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="neo-btn bg-yellow-400 hover:bg-yellow-300 py-3 text-sm flex-1 flex items-center justify-center gap-2"
              >
                {isPlaying ? '⏸️ JEDA PARTIKEL' : '▶️ LANJUTKAN PARTIKEL'}
              </button>
            </div>
          </div>

          {/* Telemetry Data */}
          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-orange-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA SISTEM (TELEMETRI)</h4>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Tekanan (P)</span>
                <span className="text-xl font-black text-sky-400 font-mono">{displayP.toFixed(2)} atm</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center text-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Kecepatan V<sub>rms</sub></span>
                <span className="text-lg font-black text-emerald-400 font-mono">{(Math.sqrt(targetT / 300)).toFixed(1)} x</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex flex-col items-center mt-2">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Persamaan Gas Ideal</span>
              <span className="text-sm font-black text-yellow-300 font-mono tracking-widest">P × V = n × R × T</span>
            </div>
          </div>
        </div>

        {/* Simulation Area (Right) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center w-full h-[650px] overflow-hidden border-8 border-black">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Ruang Silinder Tertutup
            </span>

            {/* Warning */}
            {displayP > 4.0 && (
              <div className="absolute top-20 bg-rose-500 text-white font-black px-4 py-2 border-4 border-black shadow-[4px_4px_0px_#000] text-xl transform -rotate-3 z-40">
                ⚠️ TEKANAN KRITIS! ⚠️
              </div>
            )}

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <svg id="thermoCanvas" viewBox="0 0 800 600" className="w-full h-full overflow-visible">
                
                {/* Heat Source */}
                <g transform="translate(400, 520)">
                  <rect x="-100" y="0" width="200" height="20" fill="#475569" stroke="#000" strokeWidth="4" />
                  
                  {/* Flame */}
                  <g style={{ opacity: flameOpacity, transform: `scale(${flameScale})`, transformOrigin: 'center bottom' }} className="flame-anim">
                    <path d="M 0 0 Q -50 -70 0 -140 Q 50 -70 0 0 Z" fill="#ef4444" stroke="#000" strokeWidth="2" />
                    <path d="M 0 0 Q -30 -50 0 -100 Q 30 -50 0 0 Z" fill="#f59e0b" />
                    <path d="M 0 0 Q -15 -25 0 -50 Q 15 -25 0 0 Z" fill="#fef08a" />
                  </g>

                  {/* Ice */}
                  <g style={{ opacity: iceOpacity }} className="ice-anim">
                    <polygon points="-50,0 -25,-40 0,-20 25,-50 50,0" fill="#bae6fd" stroke="#0284c7" strokeWidth="3" />
                    <polygon points="-25,0 -12,-20 0,-10 12,-25 25,0" fill="#e0f2fe" />
                  </g>
                </g>

                {/* Pressure Gauge */}
                <g transform="translate(640, 250)">
                  <path d="M -90 0 L 0 0" fill="none" stroke="#64748b" strokeWidth="16" />
                  <path d="M -90 0 L 0 0" fill="none" stroke="#94a3b8" strokeWidth="10" />
                  <path d="M -90 0 L 0 0" fill="none" stroke="#000" strokeWidth="16" strokeDasharray="16 1000" />
                  
                  <circle cx="0" cy="0" r="55" fill="#f8fafc" stroke="#000" strokeWidth="6" />
                  <circle cx="0" cy="0" r="45" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                  
                  <g stroke="#000" strokeWidth="3">
                    <line x1="-40" y1="20" x2="-45" y2="25" />
                    <line x1="-45" y1="-15" x2="-50" y2="-17" />
                    <line x1="0" y1="-40" x2="0" y2="-45" />
                    <line x1="45" y1="-15" x2="50" y2="-17" />
                    <line x1="40" y1="20" x2="45" y2="25" />
                  </g>
                  
                  <text x="0" y="30" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily="Space Grotesk, sans-serif">ATM</text>
                  
                  <g transform={`rotate(${gaugeAngle})`}>
                    <circle cx="0" cy="0" r="8" fill="#000" />
                    <polygon points="-4,0 4,0 0,-38" fill="#ef4444" />
                  </g>
                </g>

                {/* Cylinder System */}
                <g>
                  {/* Ruler */}
                  <g stroke="#000" strokeWidth="2" transform="translate(230, 0)">
                    <line x1="0" y1="100" x2="10" y2="100" /><text x="-5" y="105" fontSize="12" fontWeight="bold" textAnchor="end">150L</text>
                    <line x1="0" y1="250" x2="10" y2="250" /><text x="-5" y="255" fontSize="12" fontWeight="bold" textAnchor="end">90L</text>
                    <line x1="0" y1="400" x2="10" y2="400" /><text x="-5" y="405" fontSize="12" fontWeight="bold" textAnchor="end">30L</text>
                    <line x1="10" y1="100" x2="10" y2="400" strokeWidth="4"/>
                  </g>

                  {/* Piston Rod */}
                  <rect x="390" y={displayCylTop - 200} width="20" height="200" fill="#94a3b8" stroke="#000" strokeWidth="4" />
                  
                  {/* Piston Head */}
                  <g>
                    <rect x="254" y={displayCylTop - 20} width="292" height="20" fill="#475569" stroke="#000" strokeWidth="4" />
                    <line x1="270" y1={displayCylTop - 10} x2="530" y2={displayCylTop - 10} stroke="#1e293b" strokeWidth="2" />
                  </g>

                  {/* Glass Walls */}
                  <path d="M 250 50 L 250 500 L 550 500 L 550 50" fill="none" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 240 50 L 260 50 M 540 50 L 560 50" fill="none" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                  
                  {/* Container Background */}
                  <rect x="254" y={displayCylTop} width="292" height={CYL_BOTTOM - displayCylTop} fill={bgColor} />
                </g>

                {/* Particles */}
                <g>
                  {particles.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill={getParticleColor(targetT)}
                      stroke="#000"
                      strokeWidth="1.5"
                      style={{ display: i < activeCount ? 'block' : 'none' }}
                    />
                  ))}
                </g>

              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-2 bg-orange-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Teori Kinetik Gas 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Hukum Boyle</h4>
            <div className="inline-block bg-slate-900 text-white px-2 py-1 text-[10px] font-bold mb-2 border-2 border-black tracking-widest">SUHU (T) TETAP</div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Jika suhu dijaga konstan, <b>Tekanan berbanding terbalik dengan Volume</b>. Ketika Anda menekan piston (Volume mengecil), ruang gerak partikel berkurang, sehingga mereka lebih sering menabrak dinding. Tabrakan yang bertubi-tubi ini menyebabkan Tekanan (P) meningkat drastis!
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Hukum Charles</h4>
            <div className="inline-block bg-slate-900 text-white px-2 py-1 text-[10px] font-bold mb-2 border-2 border-black tracking-widest">TEKANAN (P) TETAP</div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Jika tekanan dijaga konstan, <b>Volume berbanding lurus dengan Suhu</b>. Ketika gas dipanaskan, partikel bergerak lebih liar dan mendorong dinding dengan lebih kuat. Agar tekanan tidak naik, piston harus ditarik ke atas (Volume diperbesar) untuk memberi ruang ekstra.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Hk. Gay-Lussac</h4>
            <div className="inline-block bg-slate-900 text-white px-2 py-1 text-[10px] font-bold mb-2 border-2 border-black tracking-widest">VOLUME (V) TETAP</div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Jika volume dijaga konstan (piston dikunci), <b>Tekanan berbanding lurus dengan Suhu</b>. Pemanasan membuat partikel bergerak sangat cepat. Karena mereka tidak bisa memperluas ruangan, mereka menghantam dinding tabung dengan keras, memicu lonjakan Tekanan yang bisa meledakkan tabung.
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Section */}
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
                {score === 5 ? "LUAR BIASA! PEMAHAMAN GAS IDEALMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP HUKUM GAS IDEAL DI ATAS."}
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
