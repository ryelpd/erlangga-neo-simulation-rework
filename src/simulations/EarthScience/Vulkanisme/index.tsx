import type { ReactNode } from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';

type EruptionType = 'EFUSIF' | 'EKSPLOSIF' | 'CAMPURAN' | null;

interface Stats {
  eruptionType: string;
  eruptionClass: string;
  magmaTrait: string;
  material: string;
  mountainShape: string;
  description: string;
}

const quizData = [
  {
    question: "1. Apa perbedaan utama antara magma dan lava?",
    options: ["Magma berwarna merah, lava berwarna hitam", "Magma berada di dalam perut bumi, lava adalah magma yang telah mencapai permukaan bumi", "Magma itu cair, lava itu padat", "Keduanya sama sekali tidak ada bedanya"],
    answer: 1
  },
  {
    question: "2. Coba atur slider ke Magma Encer dan Gas Rendah. Tipe letusan apa yang terjadi?",
    options: ["Eksplosif (Meledak sangat kuat)", "Efusif (Meleleh dengan tenang)", "Strombolian", "Tornado"],
    answer: 1
  },
  {
    question: "3. Gunung api berbentuk Perisai (Shield) yang landai, seperti di Kepulauan Hawaii, biasanya terbentuk dari tipe letusan...",
    options: ["Eksplosif", "Vulkanian", "Efusif (Lava encer yang mengalir jauh)", "Plinian"],
    answer: 2
  },
  {
    question: "4. Mengapa magma yang kental (viskositas tinggi) cenderung menghasilkan letusan yang eksplosif (dahsyat)?",
    options: ["Karena magma kental sangat berat", "Karena magma kental menyumbat pipa kepundan, sehingga gas bertekanan tinggi terjebak dan akhirnya meledak", "Karena suhunya dingin", "Karena bercampur dengan air tanah"],
    answer: 1
  },
  {
    question: "5. Material padat berukuran bervariasi (seperti abu, kerikil lapili, dan bom vulkanik) yang dimuntahkan saat erupsi eksplosif disebut...",
    options: ["Piroklastik / Eflata", "Lava Pijar", "Sedimen", "Kristal Kuarsa"],
    answer: 0
  }
];

export default function Vulkanisme(): ReactNode {
  const [silica, setSilica] = useState(20);
  const [gas, setGas] = useState(20);
  const [isErupting, setIsErupting] = useState(false);
  const [eruptionStage, setEruptionStage] = useState(0);
  const [currentEruptionType, setCurrentEruptionType] = useState<EruptionType>(null);

  const [magmaHeight, setMagmaHeight] = useState(0);
  const [lavaFlowProgress, setLavaFlowProgress] = useState(0);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const ashParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; r: number; growth: number; opacity: number }>>([]);
  const bombsRef = useRef<Array<{ x: number; y: number; vx: number; vy: number }>>([]);

  const getSilicaLabel = (val: number) => {
    if (val < 40) return "Encer";
    if (val > 60) return "Kental";
    return "Sedang";
  };

  const getGasLabel = (val: number) => {
    if (val < 40) return "Rendah";
    if (val > 60) return "Tinggi";
    return "Sedang";
  };

  const getEruptionStats = useCallback((silicaVal: number, gasVal: number): Stats => {
    if (silicaVal < 50 && gasVal < 50) {
      return {
        eruptionType: "EFUSIF (HAWAIIAN)",
        eruptionClass: "text-orange-500",
        magmaTrait: "Basaltik (Encer)",
        material: "Lava Cair Mengalir",
        mountainShape: "Perisai (Shield)",
        description: "Magma encer dengan gas rendah keluar perlahan meleleh menuruni lereng tanpa ledakan berarti."
      };
    } else if (silicaVal >= 50 && gasVal >= 50) {
      return {
        eruptionType: "EKSPLOSIF (VULKANIAN/PLINIAN)",
        eruptionClass: "text-rose-500",
        magmaTrait: "Andesitik (Sangat Kental)",
        material: "Abu, Lapili, Bom Vulkanik",
        mountainShape: "Strato / Maar",
        description: "Magma kental menyumbat pipa kepundan, sehingga gas bertekanan tinggi terjebak dan akhirnya meledak menghancurkan material gunung."
      };
    } else {
      return {
        eruptionType: "CAMPURAN (STROMBOLIAN)",
        eruptionClass: "text-yellow-500",
        magmaTrait: "Sedang",
        material: "Lava & Material Padat Ringan",
        mountainShape: "Strato (Kerucut)",
        description: "Erupsi bergantian antara lelehan lava dan lontaran material pijar yang tidak terlalu dahsyat."
      };
    }
  }, []);

  const stats = isErupting && currentEruptionType
    ? getEruptionStats(silica, gas)
    : {
        eruptionType: "MENUNGGU",
        eruptionClass: "text-white",
        magmaTrait: "-",
        material: "-",
        mountainShape: "-",
        description: "Atur kekentalan magma dan tekanan gas, lalu klik tombol letuskan untuk melihat hasilnya."
      };

  const triggerEruption = useCallback(() => {
    if (isErupting) return;

    const type: EruptionType = silica < 50 && gas < 50
      ? 'EFUSIF'
      : silica >= 50 && gas >= 50
        ? 'EKSPLOSIF'
        : 'CAMPURAN';

    setIsErupting(true);
    setCurrentEruptionType(type);
    setEruptionStage(1);
    setMagmaHeight(0);
    setLavaFlowProgress(0);
    startTimeRef.current = 0;

    if (type === 'EKSPLOSIF' || type === 'CAMPURAN') {
      ashParticlesRef.current = Array.from({ length: 20 }, () => ({
        x: 250 + (Math.random() * 40 - 20),
        y: 220 + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 150,
        vy: -100 - Math.random() * 200,
        r: 5,
        growth: 20 + Math.random() * 40,
        opacity: 0.9
      }));
      bombsRef.current = Array.from({ length: 15 }, () => ({
        x: 245,
        y: 220,
        vx: (Math.random() - 0.5) * 400,
        vy: -300 - Math.random() * 300
      }));
    } else {
      ashParticlesRef.current = [];
      bombsRef.current = [];
    }
  }, [isErupting, silica, gas]);

  const resetSimulation = useCallback(() => {
    setIsErupting(false);
    setEruptionStage(0);
    setCurrentEruptionType(null);
    setMagmaHeight(0);
    setLavaFlowProgress(0);
    ashParticlesRef.current = [];
    bombsRef.current = [];
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isErupting || eruptionStage === 0) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;

      if (eruptionStage === 1) {
        const riseSpeed = currentEruptionType === 'EKSPLOSIF' ? 400 : 200;
        const newHeight = Math.min(290, elapsed * riseSpeed);
        setMagmaHeight(newHeight);

        if (newHeight >= 290) {
          setEruptionStage(2);
          startTimeRef.current = 0;
        }
      } else if (eruptionStage === 2) {
        if (currentEruptionType === 'EFUSIF' || currentEruptionType === 'CAMPURAN') {
          const flowProgress = Math.min(800, elapsed * 300);
          setLavaFlowProgress(flowProgress);
        }

        if (currentEruptionType === 'EKSPLOSIF' || currentEruptionType === 'CAMPURAN') {
          const dt = 0.016;
          ashParticlesRef.current = ashParticlesRef.current.map(p => ({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            r: Math.min(p.r + p.growth * dt, 60),
            opacity: Math.max(p.opacity - 0.2 * dt, 0)
          }));

          const gravity = 600;
          bombsRef.current = bombsRef.current.map(b => ({
            ...b,
            x: b.x + b.vx * dt,
            y: b.y + b.vy * dt,
            vy: b.vy + gravity * dt
          }));
        }

        if (elapsed > 4) {
          setEruptionStage(3);
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isErupting, eruptionStage, currentEruptionType]);

  const handleAnswer = (qIdx: number, oIdx: number) => {
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
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const score = userAnswers.reduce<number>((acc, a, i) => {
    if (a === quizData[i].answer) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-rose-400 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black border-2">GEOGRAFI & GEOLOGI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: VULKANISME
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menganalisis Tipe Erupsi Berdasarkan Sifat Magma & Tekanan Gas
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Dapur Magma
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="bg-orange-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-orange-800 uppercase text-[10px]">Kekentalan (Viskositas / Silika)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{getSilicaLabel(silica)}</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="10"
                value={silica}
                onChange={(e) => setSilica(Number(e.target.value))}
                disabled={isErupting}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Encer (Basaltik)</span>
                <span>Kental (Andesitik)</span>
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-800 uppercase text-[10px]">Tekanan Gas (Volatil)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{getGasLabel(gas)}</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="10"
                value={gas}
                onChange={(e) => setGas(Number(e.target.value))}
                disabled={isErupting}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Rendah</span>
                <span>Sangat Tinggi</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4 border-t-4 border-black pt-4">
              <button
                onClick={triggerEruption}
                disabled={isErupting}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-xl flex items-center justify-center gap-2 py-4 ${
                  isErupting
                    ? 'bg-rose-500/50 text-white/50 cursor-not-allowed translate-x-[4px] translate-y-[4px] shadow-none'
                    : 'bg-rose-500 text-white hover:bg-rose-400 cursor-pointer'
                }`}
              >
                🌋 LETUSKAN GUNUNG!
              </button>
              <button
                onClick={resetSimulation}
                disabled={!isErupting || eruptionStage !== 3}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2 py-2 ${
                  !isErupting || eruptionStage !== 3
                    ? 'bg-slate-200/50 text-black/50 cursor-not-allowed translate-x-[4px] translate-y-[4px] shadow-none'
                    : 'bg-slate-200 text-black hover:bg-slate-300 cursor-pointer'
                }`}
              >
                🔄 TENANGKAN GUNUNG
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#e0f2fe] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center justify-end w-full lg:w-1/3 min-h-[450px] overflow-hidden border-8 border-black">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Penampang Melintang
          </span>

          <div className={`w-full h-full relative z-10 flex items-end justify-center ${isErupting && (currentEruptionType === 'EKSPLOSIF' || currentEruptionType === 'CAMPURAN') && eruptionStage === 2 ? 'animate-pulse' : ''}`}>
            <svg viewBox="0 0 500 600" className="w-full h-full overflow-visible">
              <rect width="500" height="600" fill="#e0f2fe" />

              <circle cx="80" cy="80" r="40" fill="#facc15" stroke="#000" strokeWidth="6" className="magma-glow" style={{ filter: 'drop-shadow(0 0 10px #f97316)' }} />
              <path d="M 380 120 Q 380 90 410 90 Q 430 60 460 90 Q 490 90 480 120 Z" fill="#ffffff" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
              <path d="M 40 180 Q 40 160 60 160 Q 75 140 95 160 Q 115 160 110 180 Z" fill="#ffffff" stroke="#000" strokeWidth="5" strokeLinejoin="round" />

              {/* Ash Cloud */}
              {isErupting && (currentEruptionType === 'EKSPLOSIF' || currentEruptionType === 'CAMPURAN') && eruptionStage >= 2 && ashParticlesRef.current.map((p, i) => (
                <circle
                  key={`ash-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill={i % 2 === 0 ? '#475569' : '#64748b'}
                  stroke="#000"
                  strokeWidth="3"
                  opacity={p.opacity}
                />
              ))}

              {/* Volcanic Bombs */}
              {isErupting && (currentEruptionType === 'EKSPLOSIF' || currentEruptionType === 'CAMPURAN') && eruptionStage >= 2 && bombsRef.current.map((b, i) => (
                <rect
                  key={`bomb-${i}`}
                  x={b.x}
                  y={b.y}
                  width={8 + (i % 3) * 4}
                  height={8 + (i % 3) * 4}
                  rx="2"
                  fill={i % 2 === 0 ? '#ef4444' : '#1e293b'}
                  stroke="#000"
                  strokeWidth="2"
                />
              ))}

              {/* Mountain */}
              <g id="mountainGroup">
                <rect x="-20" y="500" width="540" height="120" fill="#1e293b" stroke="#000" strokeWidth="6" />
                <rect x="-20" y="450" width="540" height="50" fill="#334155" stroke="#000" strokeWidth="6" />

                {/* Lava Flow Paths */}
                <path
                  d="M 235 240 Q 180 300 120 400 Q 80 480 40 550"
                  fill="none"
                  stroke="#000"
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray="800"
                  strokeDashoffset={800 - (isErupting && (currentEruptionType === 'EFUSIF' || currentEruptionType === 'CAMPURAN') && eruptionStage >= 2 ? lavaFlowProgress : 0)}
                />
                <path
                  d="M 235 240 Q 180 300 120 400 Q 80 480 40 550"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="800"
                  strokeDashoffset={800 - (isErupting && (currentEruptionType === 'EFUSIF' || currentEruptionType === 'CAMPURAN') && eruptionStage >= 2 ? lavaFlowProgress : 0)}
                />

                <path
                  d="M 265 240 Q 320 300 380 400 Q 420 480 460 550"
                  fill="none"
                  stroke="#000"
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray="800"
                  strokeDashoffset={800 - (isErupting && (currentEruptionType === 'EFUSIF' || currentEruptionType === 'CAMPURAN') && eruptionStage >= 2 ? lavaFlowProgress : 0)}
                />
                <path
                  d="M 265 240 Q 320 300 380 400 Q 420 480 460 550"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="800"
                  strokeDashoffset={800 - (isErupting && (currentEruptionType === 'EFUSIF' || currentEruptionType === 'CAMPURAN') && eruptionStage >= 2 ? lavaFlowProgress : 0)}
                />

                <polygon points="20,500 83,400 235,400 235,500" fill="#475569" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
                <polygon points="83,400 146,300 235,300 235,400" fill="#64748b" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
                <polygon points="146,300 210,200 235,240 235,300" fill="#94a3b8" stroke="#000" strokeWidth="6" strokeLinejoin="round" />

                <polygon points="480,500 417,400 265,400 265,500" fill="#475569" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
                <polygon points="417,400 354,300 265,300 265,400" fill="#64748b" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
                <polygon points="354,300 290,200 265,240 265,300" fill="#94a3b8" stroke="#000" strokeWidth="6" strokeLinejoin="round" />

                <rect x="235" y="240" width="30" height="290" fill="#0f172a" />

                <path d="M 150 530 C 150 480, 350 480, 350 530 C 350 590, 150 590, 150 530 Z" fill="#0f172a" stroke="#000" strokeWidth="6" />

                {/* Magma rising */}
                <rect
                  x="235"
                  y={530 - magmaHeight}
                  width="30"
                  height={magmaHeight}
                  fill="#ef4444"
                />

                {/* Magma Chamber */}
                <path d="M 150 530 C 150 480, 350 480, 350 530 C 350 590, 150 590, 150 530 Z" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 10px #f97316)' }} />
                <path d="M 180 540 C 180 510, 320 510, 320 540 C 320 570, 180 570, 180 540 Z" fill="#f97316" />
                <circle cx="210" cy="530" r="10" fill="#fff" opacity="0.9" />
                <circle cx="280" cy="550" r="15" fill="#facc15" opacity="0.9" />

                {/* Crater */}
                <path d="M 190 170 L 310 170 L 265 240 L 235 240 Z" fill="#1e293b" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
                <path d="M 210 200 L 290 200 L 265 240 L 235 240 Z" fill="#0f172a" />
              </g>
            </svg>
          </div>

          {isErupting && eruptionStage < 3 && (
            <div className={`absolute bottom-6 px-4 py-2 border-2 border-white font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#facc15] z-30 transition-all ${eruptionStage === 1 ? 'bg-black text-white' : 'bg-rose-600 text-white'}`}>
              {eruptionStage === 1 ? 'ERUPSI DIMULAI!' : 'MENCAPAI PERMUKAAN!'}
            </div>
          )}
        </div>

        <div className="bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 left-6 bg-emerald-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Hasil Observasi
          </span>

          <div className="mt-2">
            <h4 className="font-black text-slate-500 text-[10px] uppercase mb-1 border-b-2 border-slate-700 pb-1">Tipe Erupsi</h4>
            <div className={`text-3xl font-black uppercase tracking-tight ${stats.eruptionClass}`}>{stats.eruptionType}</div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs font-mono mt-4">
            <div className="bg-slate-800 p-3 border-2 border-black flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase">Sifat Magma:</span>
              <span className="text-yellow-400 font-black">{stats.magmaTrait}</span>
            </div>
            <div className="bg-slate-800 p-3 border-2 border-black flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase">Material Keluar:</span>
              <span className="text-sky-400 font-black text-right w-1/2">{stats.material}</span>
            </div>
            <div className="bg-slate-800 p-3 border-2 border-black flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase">Bentuk Gunung:</span>
              <span className="text-emerald-400 font-black">{stats.mountainShape}</span>
            </div>
          </div>

          <div className="mt-auto p-3 bg-slate-800 border-2 border-dashed border-slate-500 text-center">
            <div className="text-xs font-bold text-slate-300 leading-relaxed">{stats.description}</div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          MEMAHAMI TIPE ERUPSI GUNUNG API 🌋
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-orange-600 border-b-4 border-black pb-1 mb-3">Erupsi Efusif (Meleleh)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Terjadi jika magma bersifat <b>encer (viskositas rendah)</b> dan tekanan gasnya <b>rendah</b>. Magma dapat mengalir keluar dengan tenang membentuk sungai lava.
            </p>
            <ul className="text-xs font-bold text-slate-700 list-disc list-inside mt-2 space-y-1">
              <li>Material utama: Lava cair.</li>
              <li>Membentuk gunung api tipe <b>Perisai (Shield)</b> yang landai.</li>
              <li>Contoh: Gunung di Kepulauan Hawaii.</li>
            </ul>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] text-white">
            <h4 className="font-black text-lg uppercase text-rose-500 border-b-4 border-white pb-1 mb-3">Erupsi Eksplosif (Meledak)</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-2">
              Terjadi jika magma sangat <b>kental (viskositas tinggi)</b> dan memiliki <b>tekanan gas yang tinggi</b>. Gas terjebak di dalam magma kental hingga akhirnya meledak dahsyat menghancurkan puncak gunung.
            </p>
            <ul className="text-xs font-bold text-slate-300 list-disc list-inside mt-2 space-y-1">
              <li>Material utama: Abu vulkanik, Lapili, Bom Vulkanik (Piroklastik).</li>
              <li>Membentuk gunung api tipe <b>Maar</b> (lubang kepundan/danau) atau <b>Strato</b>.</li>
              <li>Contoh: G. Krakatau, G. Tambora.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center p-4">
            EVALUASI GEOLOGI [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000] mb-4">
                <h4 className="font-bold mb-3 text-sm uppercase">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswer(qIdx, oIdx)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase transition-all text-left px-4 py-2 bg-white text-xs
                        ${quizSubmitted
                          ? oIdx === q.answer
                            ? 'bg-green-400 text-black'
                            : userAnswers[qIdx] === oIdx
                              ? 'bg-rose-400 text-black'
                              : ''
                          : userAnswers[qIdx] === oIdx
                            ? 'bg-black text-white translate-x-[4px] translate-y-[4px] shadow-none'
                            : 'hover:bg-slate-100'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {!quizSubmitted && userAnswers.every(a => a !== null) && (
              <button
                onClick={handleSubmit}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-3 px-10 text-xl w-full mt-4 bg-slate-900 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
              >
                KIRIM JAWABAN!
              </button>
            )}

            {quizSubmitted && (
              <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                <h4 className="text-3xl font-black text-black mb-2 uppercase">NILAI AKHIR: {score}/5</h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {score === 5 ? "Sempurna! Pengetahuan geologimu sangat tajam." : "Bagus! Coba bereksperimen lagi dengan berbagai tipe letusan."}
                </p>
                <br />
                <button
                  onClick={handleRetry}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-3 px-8 text-lg bg-black text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                >
                  ULANGI KUIS
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}