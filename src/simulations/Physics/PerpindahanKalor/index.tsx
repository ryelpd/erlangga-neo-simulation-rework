import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

interface ScenarioOption {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

const SCENARIOS: Record<string, ScenarioOption[]> = {
  conduction: [
    { id: "iron", icon: "🔗", name: "Batang Besi", desc: "Konduktor Baik" },
    { id: "wood", icon: "🪵", name: "Batang Kayu", desc: "Isolator (Penghambat)" }
  ],
  convection: [
    { id: "water", icon: "💧", name: "Air Murni", desc: "Fluida Bebas Bergerak" }
  ],
  radiation: [
    { id: "close", icon: "🖐️", name: "Jarak Dekat", desc: "Radiasi Maksimal" },
    { id: "far", icon: "🚶", name: "Jarak Jauh", desc: "Radiasi Berkurang" }
  ]
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: "1. Saat Anda memanaskan ujung batang besi, lama kelamaan ujung yang Anda pegang akan ikut terasa panas. Ini adalah contoh dari...",
    options: ["Radiasi", "Konveksi", "Konduksi", "Isolasi"],
    answer: 2
  },
  {
    question: "2. Mengapa batang kayu tidak terasa panas di ujungnya saat dibakar seperti batang besi pada simulasi?",
    options: ["Karena kayu adalah konduktor yang baik", "Karena kayu adalah isolator (penghantar panas yang buruk)", "Karena kayu tidak memiliki atom", "Karena api tidak menyukai kayu"],
    answer: 1
  },
  {
    question: "3. Perhatikan simulasi 'Konveksi' pada air mendidih. Apa yang menyebabkan air panas bergerak naik ke atas?",
    options: ["Gaya dorong dari api langsung", "Air panas menjadi lebih ringan (massa jenisnya turun) sehingga naik, ganti air dingin", "Air ditarik oleh udara di atasnya", "Air panas menyusut"],
    answer: 1
  },
  {
    question: "4. Panas matahari bisa sampai ke bumi melewati luar angkasa yang hampa udara. Proses perpindahan panas tanpa medium ini disebut...",
    options: ["Konveksi", "Induksi", "Radiasi", "Konduksi"],
    answer: 2
  },
  {
    question: "5. Jika pada simulasi Radiasi Anda menjauhkan tangan dari api unggun, apa yang terjadi pada perpindahan kalornya?",
    options: ["Intensitas radiasi yang diterima menurun (suhu tangan lebih lambat naik)", "Suhu tangan akan naik lebih cepat", "Berubah menjadi konveksi", "Api akan padam dengan sendirinya"],
    answer: 0
  }
];

export default function PerpindahanKalor(): ReactNode {
  const [mode, setMode] = useState("conduction");
  const [scenario, setScenario] = useState("iron");
  const [firePower, setFirePower] = useState(50);
  const [currentTemp, setCurrentTemp] = useState(20);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'convection') {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          x: 380 + Math.random() * 140,
          y: 160 + Math.random() * 150,
          vx: 0,
          vy: 0
        });
      }
      setParticles(newParticles);
    }
  }, [mode]);

  const updatePhysics = useCallback(() => {
    setFrameCount(prev => prev + 1);
    
    let heatRate = 0;
    
    if (firePower > 0) {
      if (mode === 'conduction') {
        if (scenario === 'iron') {
          heatRate = (firePower / 100) * 0.5;
        } else if (scenario === 'wood') {
          heatRate = (firePower / 100) * 0.05;
        }
      } else if (mode === 'convection') {
        heatRate = (firePower / 100) * 0.3;
      } else if (mode === 'radiation') {
        if (scenario === 'close') {
          heatRate = (firePower / 100) * 0.6;
        } else {
          heatRate = (firePower / 100) * 0.15;
        }
      }
    } else {
      heatRate = -0.1;
    }

    setCurrentTemp(prev => {
      let newTemp = prev + heatRate;
      if (newTemp < 20) newTemp = 20;
      if (newTemp > 100) newTemp = 100;
      return newTemp;
    });

    if (mode === 'convection') {
      setParticles(prev => prev.map(p => {
        let newVx = p.vx;
        let newVy = p.vy;
        const speedMult = (firePower / 100) * 2;

        if (p.x > 420 && p.x < 480) {
          newVy -= 0.1 * speedMult;
        } else {
          newVy += 0.05 * speedMult;
        }

        if (p.y < 170) {
          newVy = 0;
          newVx = p.x > 450 ? 1 * speedMult : -1 * speedMult;
        }
        if (p.y > 300) {
          newVy = 0;
          newVx = p.x > 450 ? -1 * speedMult : 1 * speedMult;
        }

        let newX = p.x + newVx;
        let newY = p.y + newVy;
        newVx *= 0.9;
        newVy *= 0.9;

        if (newX < 380) newX = 380;
        if (newX > 520) newX = 520;
        if (newY < 160) newY = 160;
        if (newY > 310) newY = 310;

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      }));
    }
  }, [firePower, mode, scenario]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(function animate() {
      updatePhysics();
      if (animationRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updatePhysics]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setCurrentTemp(20);
    const scenarios = SCENARIOS[newMode];
    if (scenarios && scenarios.length > 0) {
      setScenario(scenarios[0].id);
    }
  };

  const handleScenarioChange = (newScenario: string) => {
    setScenario(newScenario);
    setCurrentTemp(20);
  };

  const getThermoStatus = () => {
    if (currentTemp > 80) {
      return { text: "SUHU SANGAT TINGGI!", className: "bg-rose-400" };
    } else if (currentTemp > 50) {
      return { text: "SUHU HANGAT / PANAS", className: "bg-orange-300" };
    }
    return { text: "SUHU NORMAL (RUANGAN)", className: "bg-emerald-300" };
  };

  const statusInfo = getThermoStatus();

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

  const fireScale = firePower > 0 ? 0.5 + (firePower / 100) * 1.5 : 0;
  const heatOffset = mode === 'conduction' ? (scenario === 'iron' ? Math.min(100, 20 + currentTemp) : 10) : 0;
  const condArrowsOpacity = mode === 'conduction' ? (scenario === 'iron' ? firePower / 100 : 0) : 0;
  const firePosition = mode === 'convection' ? { x: 450, y: 340 } : { x: 250, y: 320 };
  const handPosition = scenario === 'close' ? { x: 450, y: 240 } : { x: 600, y: 240 };

  const waves = [];
  if (mode === 'radiation' && firePower > 0) {
    const numWaves = Math.floor(firePower / 20) + 1;
    for (let i = 0; i < numWaves; i++) {
      const offset = (frameCount / 10 + i * 20) % 100;
      const startX = 300 + offset * 3;
      const maxX = scenario === 'close' ? 450 : 600;
      if (startX > 300 && startX < maxX) {
        waves.push({ x: startX, opacity: 1 - (startX - 300) / 300 });
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-orange-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-red-700">FISIKA TERMODINAMIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
          LAB VIRTUAL: PERPINDAHAN KALOR
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
          Mengamati Proses Konduksi, Konveksi, dan Radiasi Termal
        </p>
      </header>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl mb-8 flex flex-col gap-6 z-10 relative">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-red-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              1. Mode Perpindahan Kalor
            </label>
            <div className="grid grid-cols-1 gap-2 h-full bg-red-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
              {[
                { id: "conduction", icon: "🥄", label: "Konduksi (Zat Padat)" },
                { id: "convection", icon: "🍲", label: "Konveksi (Zat Cair/Gas)" },
                { id: "radiation", icon: "🔥", label: "Radiasi (Tanpa Medium)" }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  className={`border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg py-3 flex items-center justify-center gap-2 font-bold uppercase text-sm transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${
                    mode === m.id ? 'bg-yellow-200 ring-4 ring-black' : 'bg-white'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span> <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-orange-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              2. Sumber Panas (Api)
            </label>
            <div className="bg-orange-50 p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 h-full justify-center">
              <div className="flex justify-between items-center">
                <span className="font-black text-sm uppercase">Kekuatan Api</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{firePower}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={firePower}
                onChange={(e) => setFirePower(parseInt(e.target.value))}
                className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="text-xs font-bold text-slate-500 text-center">Atur intensitas energi panas yang diberikan</div>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              3. Objek & Material
            </label>
            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 h-full justify-center">
              {SCENARIOS[mode]?.map((scen) => (
                <button
                  key={scen.id}
                  onClick={() => handleScenarioChange(scen.id)}
                  className={`border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg py-2 flex justify-between px-4 items-center font-bold text-sm uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${
                    scenario === scen.id ? 'bg-amber-200 ring-4 ring-black' : 'bg-slate-100'
                  }`}
                >
                  <span className="text-xl">{scen.icon}</span>
                  <span className="font-bold text-sm">{scen.name}</span>
                  <span className="font-mono bg-white px-1 border border-black text-[10px]">{scen.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#fffbeb] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-2 md:p-6 relative flex flex-col items-center w-full max-w-6xl z-10 mb-10 overflow-hidden">
        <div className="absolute top-4 left-4 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform -rotate-2">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-red-700">VISUALISASI TERMODINAMIKA</h2>
        </div>

        <div className="absolute top-4 right-4 z-30 bg-white/95 p-3 md:p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs md:text-sm font-bold uppercase w-56 md:w-72 backdrop-blur-sm">
          <h3 className="text-center font-black border-b-4 border-black pb-2 mb-1 text-red-700">TERMOMETER OBJEK</h3>
          <div className="flex justify-between items-center mt-1">
            <span>Suhu Saat Ini</span>
            <span className="font-mono text-red-600 font-black text-lg">{currentTemp.toFixed(1)} degC</span>
          </div>
          <div className="w-full h-4 border-2 border-black bg-slate-200 mt-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-200" style={{ width: `${currentTemp}%` }}></div>
          </div>
          <div className={`mt-3 text-center p-2 border-2 border-black font-black ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
        </div>

        <div className="mt-48 md:mt-16 relative w-full max-w-[900px] h-[400px] bg-white border-4 border-black overflow-hidden shadow-[inset_0px_0px_20px_rgba(0,0,0,0.1)]">
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          <svg viewBox="0 0 900 400" className="w-full h-full relative z-20">
            <defs>
              <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
              <linearGradient id="heatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset={`${heatOffset}%`} stopColor="#ef4444" />
                <stop offset={`${heatOffset}%`} stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>

            <g transform={`translate(${firePosition.x}, ${firePosition.y})`}>
              <rect x="-40" y="0" width="80" height="20" fill="#78350f" stroke="#000" strokeWidth="3" rx="4" />
              {firePower > 0 && (
                <g transform={`scale(${fireScale})`}>
                  <path d="M -20 0 Q -30 -40 0 -80 Q 30 -40 20 0 Z" fill="url(#fireGrad)" stroke="#000" strokeWidth="2" style={{ transformOrigin: 'bottom center', animation: 'flickerAnim 0.3s infinite alternate ease-in-out' }} />
                </g>
              )}
            </g>

            {mode === 'conduction' && (
              <g>
                <rect x="250" y="270" width="450" height="30" fill="url(#heatGrad)" stroke="#000" strokeWidth="4" rx="15" />
                <path d="M 650 250 Q 630 250 630 280 Q 630 310 650 310 L 750 310 L 750 250 Z" fill="#fcd34d" stroke="#000" strokeWidth="4" />
                <text x="700" y="285" fontWeight="900" textAnchor="middle">TANGAN</text>
                <g opacity={condArrowsOpacity}>
                  <path d="M 300 250 L 350 250 L 330 240 M 350 250 L 330 260" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 400 250 L 450 250 L 430 240 M 450 250 L 430 260" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 500 250 L 550 250 L 530 240 M 550 250 L 530 260" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                  <text x="450" y="230" fill="#ef4444" fontWeight="bold" textAnchor="middle">Kalor Merambat Perlahan</text>
                </g>
              </g>
            )}

            {mode === 'convection' && (
              <g>
                <rect x="350" y="320" width="200" height="15" fill="#475569" stroke="#000" strokeWidth="3" />
                <path d="M 380 320 L 370 150 L 530 150 L 520 320 Z" fill="#e0f2fe" stroke="#000" strokeWidth="4" fillOpacity="0.8" />
                <text x="450" y="345" fontWeight="900" textAnchor="middle">PANCI AIR</text>
                {particles.map((p, i) => {
                  const isHot = p.x > 420 && p.x < 480;
                  return (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill={isHot ? "#ef4444" : "#3b82f6"} />
                  );
                })}
                <g opacity={0.5}>
                  <path d="M 420 300 Q 420 180 390 180 Q 390 280 410 300" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="5 5" />
                  <path d="M 480 300 Q 480 180 510 180 Q 510 280 490 300" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="5 5" />
                </g>
              </g>
            )}

            {mode === 'radiation' && (
              <g>
                <g transform={`translate(${handPosition.x}, ${handPosition.y})`}>
                  <path d="M 0 0 Q -20 40 0 80 L 50 80 L 50 0 Z" fill="#fcd34d" stroke="#000" strokeWidth="4" />
                  <text x="25" y="45" fontWeight="900" textAnchor="middle" transform="rotate(90, 25, 45)">TANGAN</text>
                </g>
                {waves.map((w, i) => (
                  <g key={i}>
                    <path d={`M ${w.x} 200 Q ${w.x + 10} 220 ${w.x} 240 T ${w.x} 280 T ${w.x} 320`} stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" style={{ opacity: w.opacity }} />
                  </g>
                ))}
              </g>
            )}
          </svg>
        </div>
      </div>

      <div className="bg-red-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform rotate-1 text-red-800 uppercase">
          KONSEP FISIKA: CARA KALOR BERPINDAH
        </h3>
        <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/70 p-4 border-2 border-black border-dashed">
          Kalor (Energi Panas) selalu berpindah dari objek bersuhu <strong>TINGGI</strong> ke objek bersuhu <strong>RENDAH</strong> sampai mencapai keseimbangan termal. Perpindahan ini terjadi melalui 3 cara utama:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-amber-600 mb-2 border-b-4 border-black pb-2 uppercase flex items-center gap-2">
              <span>🥄</span> Konduksi
            </h4>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Perpindahan kalor melalui zat perantara (biasanya zat padat) <strong>tanpa disertai perpindahan partikel</strong> zat tersebut. Panas merambat secara berantai dari satu partikel ke partikel tetangganya.
              <br /><br />
              <strong>Besi (Konduktor):</strong> Menghantarkan panas dengan sangat cepat.<br />
              <strong>Kayu (Isolator):</strong> Menghambat aliran panas dengan baik.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-blue-600 mb-2 border-b-4 border-black pb-2 uppercase flex items-center gap-2">
              <span>🍲</span> Konveksi
            </h4>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Perpindahan kalor yang <strong>disertai dengan perpindahan partikel</strong> zatnya. Terjadi pada fluida (zat cair dan gas).
              <br /><br />
              Saat air di bawah memanas, ia memuai (menjadi lebih ringan) dan naik ke atas. Air dingin di atas akan turun menggantikannya, menciptakan <strong>Arus Konveksi</strong> yang terus berputar.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-red-600 mb-2 border-b-4 border-black pb-2 uppercase flex items-center gap-2">
              <span>🔥</span> Radiasi
            </h4>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Perpindahan kalor dalam bentuk gelombang elektromagnetik <strong>tanpa memerlukan medium/zat perantara</strong> sama sekali (bisa merambat di ruang hampa/vakum).
              <br /><br />
              Panas api unggun atau panas Matahari sampai ke tubuh kita melalui radiasi. Semakin dekat jaraknya, intensitas radiasi yang diterima semakin besar (Suhu cepat naik).
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
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
                      btnClass += userAnswers[qIdx] === oIdx ? "bg-black text-white" : "bg-white text-black hover:bg-orange-200";
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
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-red-600 text-white font-black py-4 px-10 text-xl md:text-2xl uppercase tracking-widest hover:bg-red-700 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                CEK JAWABAN SAYA!
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? "LUAR BIASA! PEMAHAMAN TERMODINAMIKAMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP PERPINDAHAN KALOR DI ATAS."}
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