import { useState, useEffect, useRef, type ReactNode } from 'react';

const Y_BASE = 360;
const PX_PER_LITER = 4;
const PARTICLES_COUNT = 40;

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
    question: "1. Pada simulasi ini, ketika Suhu (T) gas dinaikkan secara perlahan, apa yang terjadi pada piston jika beban tetap?",
    options: ["Piston bergerak turun", "Piston bergerak naik karena volume gas memuai", "Piston meledak", "Piston tidak bergerak sama sekali"],
    answer: 1
  },
  {
    question: "2. Hukum yang menyatakan bahwa Volume Gas berbanding lurus dengan Suhu Mutlaknya (pada tekanan konstan) adalah...",
    options: ["Hukum Newton", "Hukum Pascal", "Hukum Charles", "Hukum Archimedes"],
    answer: 2
  },
  {
    question: "3. Berdasarkan Teori Kinetik Gas, MENGAPA gas memuai saat dipanaskan?",
    options: ["Karena partikel gas saling menjauh karena magnet", "Karena energi kinetik partikel bertambah, bergerak lebih cepat, dan menumbuk piston lebih kuat sehingga mendesaknya naik", "Karena partikel gas meleleh", "Karena gas menyerap panas dan berubah menjadi cairan"],
    answer: 1
  },
  {
    question: "4. Coba geser 'Beban Piston (P)' menjadi 3.0 atm. Apa dampak penambahan tekanan luar ini terhadap volume gas di dalam?",
    options: ["Volume gas terkompresi (menyusut) menjadi lebih kecil", "Volume gas meledak", "Suhu gas berubah menjadi 0 Kelvin", "Tidak ada perubahan pada volume"],
    answer: 0
  },
  {
    question: "5. Apa yang terjadi pada energi kinetik (kecepatan) partikel gas jika suhu diturunkan hingga mencapai Titik Beku (0 derajatC / 273K)?",
    options: ["Partikel bergerak secepat cahaya", "Partikel terbakar", "Gerakan partikel melambat dan volume menyusut tajam", "Piston akan terdorong keluar tabung"],
    answer: 2
  }
];

export default function PemuaianUdara(): ReactNode {
  const [Tc, setTc] = useState(25);
  const [P, setP] = useState(1.0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const animationRef = useRef<number | null>(null);
  const pistonYRef = useRef(240);

  const Tk = Tc + 273;
  const k = 0.1;
  const V = k * (Tk / P);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < PARTICLES_COUNT; i++) {
      newParticles.push({
        x: 360 + Math.random() * 180,
        y: 250 + Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const heightPx = V * PX_PER_LITER;
    let pistonY = Y_BASE - heightPx;
    if (pistonY < 100) pistonY = 100;
    if (pistonY > 340) pistonY = 340;
    pistonYRef.current = pistonY;
  }, [V]);

  useEffect(() => {
    const animate = () => {
      const speedMultiplier = Math.sqrt(Tk) / 10;
      
      setParticles(prev => prev.map(p => {
        let newX = p.x + p.vx * speedMultiplier;
        let newY = p.y + p.vy * speedMultiplier;
        let newVx = p.vx;
        let newVy = p.vy;

        if (newX <= 355) { newX = 355; newVx *= -1; }
        if (newX >= 545) { newX = 545; newVx *= -1; }
        if (newY >= 355) { newY = 355; newVy *= -1; }

        const pistonBottomBound = pistonYRef.current + 25;
        if (newY <= pistonBottomBound) {
          newY = pistonBottomBound;
          newVy = Math.abs(newVy);
        }

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [Tk]);

  const heightPx = V * PX_PER_LITER;
  let currentPistonY = Y_BASE - heightPx;
  if (currentPistonY < 100) currentPistonY = 100;
  if (currentPistonY > 340) currentPistonY = 340;
  pistonYRef.current = currentPistonY;

  const fireScale = Tc / 200 > 1.5 ? 1.5 : Tc / 200;

  const numBoxes = Math.floor(P * 2) - 1;
  const weights = [];
  for (let i = 0; i < numBoxes; i++) {
    weights.push(i);
  }

  const getStatusInfo = () => {
    if (Tc > 150) {
      return { text: "GAS MEMUAI (EKSPANSI)", className: "bg-rose-300" };
    } else if (Tc < 50) {
      return { text: "GAS MENYUSUT (KOMPRESI)", className: "bg-blue-300" };
    }
    return { text: "SUHU RUANGAN NORMAL", className: "bg-sky-300" };
  };

  const statusInfo = getStatusInfo();

  const handleSetTemperature = (temp: number) => {
    setTc(temp);
  };

  const getParticleColor = () => {
    if (Tc > 150) return "#ef4444";
    if (Tc < 50) return "#3b82f6";
    return "#f59e0b";
  };

  const particleColor = getParticleColor();

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

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-sky-800">FISIKA TERMODINAMIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
          LAB VIRTUAL: PEMUAIAN GAS
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
          Menganalisis Hukum Charles, Teori Kinetik Gas, dan Hubungan Suhu-Volume
        </p>
      </header>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl mb-8 flex flex-col gap-6 z-10 relative">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-rose-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              1. Suhu Pemanas (T)
            </label>
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 h-full justify-center">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-xs uppercase text-rose-800">Suhu Gas (degC)</span>
                  <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{Tc} degC</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={Tc}
                  onChange={(e) => setTc(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
              <div className="text-xs font-bold text-slate-500 text-center border-t-2 border-dashed border-rose-300 pt-2">
                Suhu Mutlak (Kelvin) = Suhu degC + 273
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-slate-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              2. Beban Piston (P)
            </label>
            <div className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 h-full justify-center">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-xs uppercase text-slate-800">Tekanan/Beban (atm)</span>
                  <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{P.toFixed(1)} atm</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.5"
                  value={P}
                  onChange={(e) => setP(parseFloat(e.target.value))}
                  className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
              <div className="text-xs font-bold text-slate-500 text-center border-t-2 border-dashed border-slate-300 pt-2">
                Menekan gas ke bawah (Memperkecil Volume awal)
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-sky-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              3. Aksi Cepat
            </label>
            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 h-full justify-center">
              <button
                onClick={() => handleSetTemperature(300)}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg py-2 flex items-center justify-center gap-2 font-bold uppercase text-sm transition-all active:translate-x-1 active:translate-y-1 active:shadow-none bg-sky-200 ring-4 ring-black"
              >
                <span className="text-lg">🔥</span> <span className="text-sm">Panaskan Maksimal (300 degC)</span>
              </button>
              <button
                onClick={() => handleSetTemperature(0)}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg bg-white py-2 flex items-center justify-center gap-2 font-bold uppercase text-sm transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <span className="text-lg">❄️</span> <span className="text-sm">Dinginkan ke Titik Beku (0 degC)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#f8fafc] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-2 md:p-6 relative flex flex-col items-center w-full max-w-6xl z-10 mb-10 overflow-hidden">
        <div className="absolute top-4 left-4 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform -rotate-2">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-sky-700">VISUALISASI TABUNG GAS</h2>
        </div>

        <div className="absolute top-4 right-4 z-30 bg-white/95 p-3 md:p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs md:text-sm font-bold uppercase w-60 md:w-80 backdrop-blur-sm">
          <h3 className="text-center font-black border-b-4 border-black pb-2 mb-1 text-slate-800">PARAMETER GAS IDEAL</h3>
          <div className="flex justify-between items-center mt-1">
            <span className="text-rose-700">Suhu Mutlak (T)</span>
            <span className="font-mono text-rose-700 font-black">{Tk} K</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Tekanan Tetap (P)</span>
            <span className="font-mono text-slate-700 font-black">{P.toFixed(1)} atm</span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-dashed border-slate-400 pt-2 mt-1">
            <span className="text-sky-700">Volume Gas (V)</span>
            <span className="font-mono text-sky-700 font-black">{V.toFixed(1)} L</span>
          </div>
          <div className={`mt-3 text-center p-2 border-2 border-black font-black ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
        </div>

        <div className="mt-56 md:mt-16 relative w-full max-w-[900px] h-[450px] bg-white border-4 border-black overflow-hidden shadow-[inset_0px_0px_20px_rgba(0,0,0,0.1)]">
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          <svg viewBox="0 0 900 450" className="w-full h-full relative z-20">
            <defs>
              <linearGradient id="fireGradPemuaian" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
            </defs>

            <rect x="250" y="380" width="400" height="20" fill="#475569" stroke="#000" strokeWidth="4" rx="4" />

            <g transform="translate(450, 380)">
              <rect x="-30" y="0" width="60" height="40" fill="#94a3b8" stroke="#000" strokeWidth="4" />
              <rect x="-10" y="-10" width="20" height="10" fill="#cbd5e1" stroke="#000" strokeWidth="3" />
              {fireScale > 0 && (
                <g transform={`scale(${fireScale})`}>
                  <path d="M -15 -10 Q -25 -40 0 -70 Q 25 -40 15 -10 Z" fill="url(#fireGradPemuaian)" stroke="#000" strokeWidth="2" style={{ transformOrigin: 'bottom center', animation: 'flickerAnim 0.3s infinite alternate ease-in-out' }} />
                </g>
              )}
            </g>

            <path d="M 350 80 L 350 360 L 550 360 L 550 80" fill="none" stroke="#64748b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 350 80 L 350 360 L 550 360 L 550 80" fill="rgba(224, 242, 254, 0.3)" stroke="none" />
            <line x1="330" y1="360" x2="570" y2="360" stroke="#000" strokeWidth="6" />

            {particles.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="5" fill={particleColor} stroke="#7f1d1d" strokeWidth="1" />
            ))}

            <g style={{ transform: `translate(0px, ${currentPistonY}px)`, transition: 'transform 0.2s ease-out' }}>
              <rect x="354" y="0" width="192" height="20" fill="#94a3b8" stroke="#000" strokeWidth="4" />
              <rect x="440" y="-120" width="20" height="120" fill="#cbd5e1" stroke="#000" strokeWidth="4" />
              <rect x="400" y="-130" width="100" height="10" fill="#475569" stroke="#000" strokeWidth="4" />
              <g transform="translate(450, -130)">
                {weights.map((_, i) => (
                  <g key={i}>
                    <rect x="-25" y={-20 - i * 20} width="50" height="20" fill="#0f172a" stroke="#fff" strokeWidth="2" />
                    <text x="0" y={-5 - i * 20} fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">m</text>
                  </g>
                ))}
              </g>
            </g>

            <g stroke="#94a3b8" strokeWidth="2" fontSize="12" fontWeight="bold" fill="#64748b">
              <line x1="570" y1="360" x2="590" y2="360" /><text x="600" y="364">0 L</text>
              <line x1="570" y1="280" x2="585" y2="280" /><text x="595" y="284">20 L</text>
              <line x1="570" y1="200" x2="590" y2="200" /><text x="600" y="204">40 L</text>
              <line x1="570" y1="120" x2="585" y2="120" /><text x="595" y="124">60 L</text>
            </g>
          </svg>
        </div>
      </div>

      <div className="bg-sky-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform rotate-1 text-sky-800 uppercase">
          KONSEP FISIKA: PEMUAIAN GAS & HUKUM CHARLES
        </h3>
        <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/70 p-4 border-2 border-black border-dashed">
          Gas merespons perubahan suhu dengan sangat cepat. Saat dipanaskan, partikel-partikel gas mendapatkan tambahan energi kinetik sehingga bergerak lebih agresif, saling menumbuk dinding wadah, dan <strong>memaksa wadah (piston) berekspansi ke atas</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-rose-700 mb-2 border-b-4 border-black pb-2 uppercase">Hukum Charles (Isobarik)</h4>
            <div className="bg-rose-50 p-4 border-2 border-black mb-3">
              <div className="text-2xl font-black text-center font-mono tracking-widest text-slate-800">
                V ~ T<br />
                <span className="text-lg">V1 / T1 = V2 / T2</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Hukum Charles menyatakan: <i>"Jika tekanan (P) gas dijaga konstan/isobarik, maka Volume (V) gas berbanding lurus dengan Suhu Mutlaknya (Kelvin)."</i>
              <br /><br />Artinya, jika suhu digandakan, volume gas juga akan memuai menjadi dua kali lipat!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-sky-700 mb-2 border-b-4 border-black pb-2 uppercase">Teori Kinetik Partikel</h4>
            <ul className="space-y-3 mt-3 text-sm font-bold text-slate-700">
              <li className="flex items-center gap-3 bg-sky-50 p-3 border-2 border-black">
                <span className="text-xl">❄️</span>
                <span><strong>Suhu Rendah:</strong> Energi kinetik rendah. Partikel bergerak lambat. Volume gas menyusut.</span>
              </li>
              <li className="flex items-center gap-3 bg-rose-50 p-3 border-2 border-black">
                <span className="text-xl">🔥</span>
                <span><strong>Suhu Tinggi:</strong> Energi kinetik tinggi. Partikel bergerak dan menumbuk dinding sangat cepat. Volume gas memuai mendesak piston.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

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
                {score === 5 ? "LUAR BIASA! PEMAHAMAN TERMODINAMIKAMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP HUKUM CHARLES DI ATAS."}
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