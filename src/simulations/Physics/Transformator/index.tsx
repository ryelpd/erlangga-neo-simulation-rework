import { useState, useEffect, useRef, useCallback } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_DATA: QuizQuestion[] = [
  {
    question: "1. Komponen utama apa yang menjembatani aliran energi dari kumparan primer ke sekunder tanpa adanya kabel yang terhubung langsung?",
    options: ["Sakelar", "Inti Besi (Iron Core) melalui medan magnet", "Resistor", "Lampu bohlam"],
    answer: 1,
  },
  {
    question: "2. Pada transformator Step-Down (penurun tegangan), pernyataan manakah yang benar?",
    options: ["Lilitan primer (Np) LEBIH SEDIKIT dari lilitan sekunder (Ns)", "Lilitan primer (Np) LEBIH BANYAK dari lilitan sekunder (Ns)", "Tegangan sekunder (Vs) lebih besar dari Vp", "Arus primer (Ip) lebih besar dari Is"],
    answer: 1,
  },
  {
    question: "3. Coba atur Np = 100, Ns = 200, dan Vp = 100 V. Berapakah nilai Tegangan Sekunder (Vs) yang dihasilkan?",
    options: ["50 V", "100 V", "200 V", "400 V"],
    answer: 2,
  },
  {
    question: "4. Berdasarkan Hukum Kekekalan Energi (mengabaikan rugi panas), jika tegangan sekunder (Vs) dinaikkan menjadi 2 kali lipat, apa yang terjadi pada arus sekunder (Is)?",
    options: ["Arus naik 2 kali lipat", "Arus tetap", "Arus menjadi SETENGAH (1/2) kalinya", "Arus menjadi nol"],
    answer: 2,
  },
  {
    question: "5. Mengapa transformator HANYA dapat beroperasi menggunakan sumber arus bolak-balik (AC) dan tidak bisa memakai baterai (DC)?",
    options: ["Karena arus DC terlalu berbahaya", "Karena trafo membutuhkan perubahan fluks magnetik yang terus-menerus untuk menghasilkan GGL induksi", "Karena baterai DC tidak memiliki tegangan", "Karena inti besi menolak arus DC"],
    answer: 1,
  },
];

const LOAD_RESISTANCE = 50;

export default function Transformator() {
  const [vPrimary, setVPrimary] = useState(100);
  const [nPrimary, setNPrimary] = useState(100);
  const [nSecondary, setNSecondary] = useState(50);
  const [isPowerOn, setIsPowerOn] = useState(true);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const simTimeRef = useRef(0);

  const calculations = {
    vSecondary: isPowerOn ? vPrimary * (nSecondary / nPrimary) : 0,
    iSecondary: 0,
    iPrimary: 0,
    power: 0,
  };

  if (isPowerOn) {
    calculations.iSecondary = calculations.vSecondary / LOAD_RESISTANCE;
    calculations.power = calculations.vSecondary * calculations.iSecondary;
    calculations.iPrimary = calculations.power / vPrimary;
  }

  const transformerType = nSecondary > nPrimary ? 'STEP-UP' : nSecondary < nPrimary ? 'STEP-DOWN' : 'ISOLASI';

  const drawCoilPath = useCallback((centerX: number, startY: number, endY: number, numTurns: number, isRight: boolean): string => {
    const coilWidth = 100;
    const leftX = centerX - coilWidth / 2;
    const rightX = centerX + coilWidth / 2;
    const stepY = (endY - startY) / numTurns;

    let path = '';
    if (isRight) {
      path = `M 640 200 L ${rightX} 200 L ${rightX} ${startY} `;
      for (let i = 0; i < numTurns; i++) {
        const y1 = startY + i * stepY;
        const y2 = startY + (i + 1) * stepY;
        path += `L ${leftX} ${y1 + stepY * 0.25} L ${rightX} ${y1 + stepY * 0.75} L ${leftX} ${y2} `;
      }
      path += `L ${rightX} ${endY} L ${rightX} 300 L 640 300`;
    } else {
      path = `M 160 200 L ${leftX} 200 L ${leftX} ${startY} `;
      for (let i = 0; i < numTurns; i++) {
        const y1 = startY + i * stepY;
        const y2 = startY + (i + 1) * stepY;
        path += `L ${rightX} ${y1 + stepY * 0.25} L ${leftX} ${y1 + stepY * 0.75} L ${rightX} ${y2} `;
      }
      path += `L ${leftX} ${endY} L ${leftX} 300 L 160 300`;
    }

    return path;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;

    const render = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cw = canvas.width;
      const ch = canvas.height;

      if (isPowerOn) {
        simTimeRef.current += dt;
      }

      const centerY = ch / 2;

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const ampP = (vPrimary / 220) * 70;
      ctx.moveTo(0, centerY - ampP * Math.sin(simTimeRef.current * 5));
      for (let x = 0; x <= cw; x += 5) {
        const t = simTimeRef.current * 5 + x / 40;
        ctx.lineTo(x, centerY - ampP * Math.sin(t));
      }
      ctx.stroke();

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const ampS = (calculations.vSecondary / 220) * 70;
      ctx.moveTo(0, centerY - ampS * Math.sin(simTimeRef.current * 5 + Math.PI));
      for (let x = 0; x <= cw; x += 5) {
        const t = simTimeRef.current * 5 + x / 40 + Math.PI;
        ctx.lineTo(x, centerY - ampS * Math.sin(t));
      }
      ctx.stroke();

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPowerOn, vPrimary, calculations.vSecondary]);

  const handleAnswerClick = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    if (userAnswers.every((a) => a !== null)) {
      setQuizSubmitted(true);
    }
  };

  const handleRetryQuiz = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const score = userAnswers.reduce<number>((acc, a, i) => {
    if (a === QUIZ_DATA[i].answer) return acc + 1;
    return acc;
  }, 0);

  const allAnswered = userAnswers.every((a) => a !== null);

  const visualTurnsP = Math.max(3, Math.round((nPrimary / 200) * 15));
  const visualTurnsS = Math.max(3, Math.round((nSecondary / 400) * 20));

  const brightness = Math.min(1, calculations.power / 500);
  const fluxOpacity = isPowerOn ? 0.8 : 0;

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform -rotate-3 text-black">
          FISIKA ELEKTROMAGNETIK
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: TRANSFORMATOR
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Induksi Elektromagnetik, Step-Up, & Step-Down
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Panel Kontrol
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-rose-800 uppercase text-[10px]">Tegangan Input (Vp) AC</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{vPrimary} V</span>
              </div>
              <input
                type="range"
                min="10"
                max="220"
                step="10"
                value={vPrimary}
                onChange={(e) => setVPrimary(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Tegangan Primer dari Sumber</span>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-blue-800 uppercase text-[10px]">Lilitan Primer (Np)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{nPrimary}</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                step="20"
                value={nPrimary}
                onChange={(e) => setNPrimary(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Jumlah lilitan di kumparan input</span>
            </div>

            <div className="bg-green-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-green-800 uppercase text-[10px]">Lilitan Sekunder (Ns)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{nSecondary}</span>
              </div>
              <input
                type="range"
                min="20"
                max="400"
                step="20"
                value={nSecondary}
                onChange={(e) => setNSecondary(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Jumlah lilitan di kumparan output</span>
            </div>
          </div>

          <button
            onClick={() => setIsPowerOn(!isPowerOn)}
            className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-3 text-lg font-black uppercase mt-4 flex items-center justify-center gap-2 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${
              isPowerOn ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-500 text-white hover:bg-emerald-400'
            }`}
          >
            <span>{isPowerOn ? '⚡' : '⭕'}</span>
            <span>SAKELAR: {isPowerOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden border-8 border-black rounded-xl">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Visualisasi Inti Besi & Kumparan
          </span>

          {!isPowerOn && (
            <div className="absolute bottom-6 bg-rose-500 text-white px-4 py-2 border-4 border-black font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_#000] z-20">
              SAKELAR TERBUKA (OFF)
            </div>
          )}

          <div className="w-full h-full relative z-10 flex items-center justify-center p-8">
            <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
                <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="1" />
                  <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="800" height="500" fill="url(#grid)" />

              <g>
                <rect x="200" y="100" width="400" height="300" rx="10" fill="#94a3b8" stroke="#334155" strokeWidth="8" />
                <rect x="280" y="180" width="240" height="140" rx="10" fill="#f8fafc" stroke="#334155" strokeWidth="8" />
                {[220, 240, 260, 540, 560, 580].map((x) => (
                  <line key={`v-${x}`} x1={x} y1="100" x2={x} y2="400" stroke="#cbd5e1" strokeWidth="2" />
                ))}
                {[120, 140, 160, 340, 360, 380].map((y) => (
                  <line key={`h-${y}`} x1="200" x2="600" y1={y} y2={y} stroke="#cbd5e1" strokeWidth="2" />
                ))}
              </g>

              <rect
                x="240"
                y="140"
                width="320"
                height="220"
                rx="15"
                fill="none"
                stroke="#22c55e"
                strokeWidth="6"
                style={{
                  strokeDasharray: '15 10',
                  opacity: fluxOpacity,
                  animation: isPowerOn ? 'fluxFlow 1s linear infinite' : 'none',
                }}
              />

              <path d="M 60 200 L 160 200" fill="none" stroke="#000" strokeWidth="6" />
              <path d="M 60 300 L 160 300" fill="none" stroke="#000" strokeWidth="6" />

              <circle cx="60" cy="250" r="40" fill="#fff" stroke="#000" strokeWidth="6" />
              <path d="M 35 250 Q 47 230 60 250 T 85 250" fill="none" stroke="#000" strokeWidth="4" />
              <text x="60" y="310" textAnchor="middle" fontSize="12" fontWeight="900" fill="#f43f5e">V_primer</text>

              <path d="M 640 200 L 720 200 L 720 230" fill="none" stroke="#000" strokeWidth="6" />
              <path d="M 640 300 L 720 300 L 720 270" fill="none" stroke="#000" strokeWidth="6" />

              <g transform="translate(720, 250)">
                <circle cx="0" cy="0" r="60" fill="url(#bulbGlow)" opacity={brightness * 0.8} />
                <path
                  d="M -20 -15 C -20 -40, 20 -40, 20 -15 C 20 0, 15 10, 15 20 L -15 20 C -15 10, -20 0, -20 -15 Z"
                  fill={brightness > 0.05 ? '#fef08a' : '#ffffff'}
                  stroke="#000"
                  strokeWidth="4"
                />
                <path d="M -10 20 L -5 0 L 0 -10 L 5 0 L 10 20" fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
                <rect x="-15" y="20" width="30" height="15" fill="#94a3b8" stroke="#000" strokeWidth="4" />
                <rect x="-10" y="35" width="20" height="10" fill="#475569" stroke="#000" strokeWidth="4" />
                <text x="0" y="60" textAnchor="middle" fontSize="12" fontWeight="900" fill="#22c55e">V_sekunder</text>
              </g>

              <path d={drawCoilPath(240, 160, 340, visualTurnsP, false)} fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinejoin="round" />
              <path d={drawCoilPath(560, 160, 340, visualTurnsS, true)} fill="none" stroke="#22c55e" strokeWidth="6" strokeLinejoin="round" />

              <style>{`
                @keyframes fluxFlow {
                  to { stroke-dashoffset: -50; }
                }
              `}</style>
            </svg>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 z-10">
        <div className="neo-box bg-slate-900 text-white p-6 relative flex flex-col gap-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute -top-4 left-6 bg-cyan-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Hasil Pengukuran
          </span>

          <div className="flex items-center justify-between border-b-2 border-slate-700 pb-2 mt-4">
            <span className="font-bold text-sm uppercase text-slate-400">Jenis Trafo</span>
            <span className={`font-black text-xl px-3 py-1 border-2 shadow-[2px_2px_0px] ${
              transformerType === 'STEP-UP' ? 'text-rose-400 border-rose-400' :
              transformerType === 'STEP-DOWN' ? 'text-yellow-400 border-yellow-400' :
              'text-sky-400 border-sky-400'
            }`}>
              {transformerType}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2 font-mono">
            <div className="bg-slate-800 p-4 border-2 border-slate-600 flex flex-col gap-2 text-center rounded-lg">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest border-b border-slate-600 pb-1">Primer (In)</span>
              <div>Vp = <span className="font-bold text-white text-lg">{vPrimary} V</span></div>
              <div>Np = <span className="font-bold text-white text-lg">{nPrimary} lilitan</span></div>
              <div>Ip = <span className="font-bold text-rose-400 text-lg">{calculations.iPrimary.toFixed(2)} A</span></div>
            </div>
            <div className="bg-slate-800 p-4 border-2 border-slate-600 flex flex-col gap-2 text-center rounded-lg">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-slate-600 pb-1">Sekunder (Out)</span>
              <div>Vs = <span className="font-bold text-white text-lg">{calculations.vSecondary.toFixed(0)} V</span></div>
              <div>Ns = <span className="font-bold text-white text-lg">{nSecondary} lilitan</span></div>
              <div>Is = <span className="font-bold text-rose-400 text-lg">{calculations.iSecondary.toFixed(2)} A</span></div>
            </div>
          </div>

          <div className="mt-auto bg-slate-100 text-black p-3 border-4 border-black text-center text-xs font-bold uppercase flex justify-between items-center rounded-lg">
            <span>Daya (P) = V x I</span>
            <span className="bg-black text-white px-2 py-1">P_in = P_out = <span className="text-yellow-400">{calculations.power.toFixed(1)} W</span></span>
          </div>
        </div>

        <div className="neo-box bg-white p-6 relative flex flex-col gap-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute -top-4 left-6 bg-rose-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Osiloskop (Gelombang AC)
          </span>

          <div className="w-full h-full bg-slate-900 border-4 border-black shadow-inner relative p-2 overflow-hidden mt-4 rounded-lg">
            <canvas ref={canvasRef} width={400} height={200} className="w-full h-full" />

            <div className="absolute top-2 left-2 flex flex-col gap-1 text-[10px] font-bold font-mono">
              <div className="flex items-center gap-1"><div className="w-3 h-1 bg-blue-500" /> V_primer</div>
              <div className="flex items-center gap-1"><div className="w-3 h-1 bg-green-500" /> V_sekunder</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          KONSEP FISIKA: BAGAIMANA TRAFO BEKERJA?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sm uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">1. Induksi Elektromagnetik</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Arus bolak-balik (AC) yang mengalir pada kumparan primer menghasilkan <b>medan magnet yang berubah-ubah</b>. Perubahan medan magnet ini dialirkan oleh inti besi menuju kumparan sekunder.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sm uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">2. Hukum Faraday</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Perubahan garis gaya magnet (fluks) yang memotong kumparan sekunder akan <b>menginduksi (menciptakan) GGL / Tegangan Listrik</b> pada kumparan tersebut. Itulah sebabnya energi bisa berpindah tanpa kabel terhubung langsung!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sm uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">3. Kekekalan Energi</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Trafo <b>TIDAK</b> menciptakan energi (Daya Input = Daya Output). Jika tegangan (V) dinaikkan (Step-Up), maka kuat arus (I) harus <b>TURUN</b>. Berlaku sebaliknya untuk Step-Down.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">PERSAMAAN TRANSFORMATOR IDEAL</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-3xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e] rounded-xl">
              Vp / Vs = Np / Ns = Is / Ip
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600 rounded-xl">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">KETERANGAN BESARAN</h4>
            <ul className="text-[11px] font-bold space-y-2">
              <li><span className="text-rose-400">V</span> = Tegangan (Volt)</li>
              <li><span className="text-blue-400">N</span> = Jumlah Lilitan Kumparan</li>
              <li><span className="text-yellow-400">I</span> = Kuat Arus (Ampere)</li>
              <li><span className="text-slate-400">p</span> = Primer (Input) | <span className="text-slate-400">s</span> = Sekunder (Output)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6 rounded-lg">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] rounded-xl">
          <div className="space-y-6">
            {QUIZ_DATA.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl">
                <h4 className="font-bold text-black mb-4 text-sm uppercase">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswerClick(qIdx, oIdx)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg text-left px-4 py-2 bg-white text-xs font-bold uppercase transition-all ${
                        quizSubmitted
                          ? oIdx === q.answer
                            ? 'bg-green-400 text-black'
                            : userAnswers[qIdx] === oIdx
                            ? 'bg-rose-400 text-black line-through'
                            : 'bg-slate-200 opacity-50'
                          : userAnswers[qIdx] === oIdx
                            ? 'bg-black text-white'
                            : 'bg-white hover:bg-indigo-200'
                      } ${!quizSubmitted ? 'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted && allAnswered && (
            <button
              onClick={handleSubmitQuiz}
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-900 text-white font-black py-3 px-10 text-xl w-full mt-4 uppercase tracking-widest hover:bg-slate-800 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              KIRIM JAWABAN!
            </button>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-xl ${score === 5 ? 'bg-emerald-400' : 'bg-yellow-300'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black rounded-lg">
                {score === 5 ? 'Sempurna! Anda menguasai konsep Transformator.' : 'Bagus! Coba perhatikan lagi perhitungan perbandingan lilitannya.'}
              </p>
              <br />
              <button
                onClick={handleRetryQuiz}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-black text-white py-3 px-8 text-lg uppercase tracking-wider hover:bg-slate-800 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
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