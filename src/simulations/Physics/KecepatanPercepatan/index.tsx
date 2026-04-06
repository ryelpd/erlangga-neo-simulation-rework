import { useState, useEffect, useRef, type ReactNode } from 'react';

const PIXELS_PER_METER = 4;
const START_X = 100;
const MAX_DISTANCE = 210;

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: "1. Apa ciri utama dari Gerak Lurus Beraturan (GLB)?",
    options: ["Kecepatan selalu nol", "Kecepatan benda selalu konstan karena percepatannya nol", "Posisi benda tidak berubah", "Percepatan terus bertambah"],
    answer: 1
  },
  {
    question: "2. Pada persamaan GLBB: x = v0t + 1/2at2, apa makna dari simbol 'a'?",
    options: ["Kecepatan Akhir", "Posisi Awal", "Percepatan", "Waktu"],
    answer: 2
  },
  {
    question: "3. Jika mobil bergerak dengan kecepatan awal (v0) positif, lalu Anda memberikan percepatan (a) yang bernilai negatif, apa yang akan terjadi?",
    options: ["Mobil akan semakin cepat", "Mobil akan mengalami perlambatan hingga berhenti, lalu bisa bergerak mundur", "Mobil akan langsung menghilang", "Mobil akan berbelok"],
    answer: 1
  },
  {
    question: "4. Bagaimana Anda tahu secara visual dari simulasi di atas bahwa mobil sedang mengalami GLB (Gerak Lurus Beraturan)?",
    options: ["Panjang panah vektor merah (a) sangat panjang", "Panah vektor merah (a) hilang/nol, dan panah biru (v) ukurannya tetap", "Roda mobil tidak berputar", "Mobil bergerak naik-turun"],
    answer: 1
  },
  {
    question: "5. Jika sebuah mobil memiliki v0 = 0 m/s dan a = 2 m/s2, berapakah kecepatannya setelah 5 detik berjalan?",
    options: ["5 m/s", "10 m/s", "12 m/s", "25 m/s"],
    answer: 1
  }
];

export default function KecepatanPercepatan(): ReactNode {
  const [v0, setV0] = useState(10);
  const [a, setA] = useState(2);
  const [t, setT] = useState(0);
  const [v, setV] = useState(10);
  const [x, setX] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const lastTimeRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const v0Ref = useRef(v0);
  const aRef = useRef(a);

  useEffect(() => {
    v0Ref.current = v0;
    aRef.current = a;
  }, [v0, a]);

  useEffect(() => {
    if (!isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      let dt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      if (dt > 0.1) dt = 0.1;

      setT(prev => {
        const newT = prev + dt;
        const currentV = v0Ref.current + (aRef.current * newT);
        const newX = (v0Ref.current * newT) + (0.5 * aRef.current * newT * newT);

        setV(currentV);
        setX(newX);

        if (newX > MAX_DISTANCE || newX < -20) {
          setIsRunning(false);
        }

        return newT;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]);

  const handlePlay = () => {
    if (!isRunning && x < MAX_DISTANCE) {
      setIsRunning(true);
      lastTimeRef.current = 0;
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setT(0);
    setX(0);
    setV(v0);
    lastTimeRef.current = 0;
  };

  const svgX = START_X + (x * PIXELS_PER_METER);
  const rotation = (x * PIXELS_PER_METER) * (360 / 75);

  const vLength = Math.abs(v) > 0.1 ? 20 + Math.abs(v) * 2 : 0;
  const aLength = Math.abs(a) > 0.1 ? 20 + Math.abs(a) * 4 : 0;

  const getStatusInfo = () => {
    if (!isRunning && t === 0) {
      return { text: "SIAP DIMULAI", className: "bg-slate-200" };
    } else if (!isRunning && t > 0) {
      return { text: "JEDA (PAUSE)", className: "bg-amber-300" };
    } else {
      if (a === 0) {
        return { text: "GERAK LURUS BERATURAN (GLB)", className: "bg-blue-300" };
      } else if ((a > 0 && v >= 0) || (a < 0 && v <= 0)) {
        return { text: "DIPERCEPAT (GLBB)", className: "bg-red-300" };
      }
      return { text: "DIPERLAMBAT (GLBB)", className: "bg-orange-300" };
    }
  };

  const statusInfo = getStatusInfo();

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
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-sky-800">FISIKA KINEMATIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
          LAB VIRTUAL: GLB & GLBB
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
          Menganalisis Hubungan Kecepatan, Percepatan, dan Posisi terhadap Waktu
        </p>
      </header>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl mb-8 flex flex-col gap-6 z-10 relative">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6 border-b-4 border-black border-dashed pb-6">
          <div className="w-full lg:w-1/2 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-blue-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              1. Kecepatan Awal (v0)
            </label>
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-xs uppercase text-blue-800">Meter per detik (m/s)</span>
                <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{v0} m/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={v0}
                onChange={(e) => {
                  if (!isRunning && t === 0) {
                    const newV0 = parseInt(e.target.value);
                    setV0(newV0);
                    setV(newV0);
                  }
                }}
                disabled={isRunning || t > 0}
                className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full disabled:opacity-50"
              />
              <div className="text-[10px] font-bold text-slate-500 text-center mt-1">Kecepatan saat waktu t = 0</div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-red-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              2. Percepatan (a)
            </label>
            <div className="bg-red-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-xs uppercase text-red-800">Meter per detik kuadrat (m/s2)</span>
                <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{a} m/s2</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={a}
                onChange={(e) => setA(parseInt(e.target.value))}
                className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="text-[10px] font-bold text-slate-500 text-center mt-1">(+) Gas / Percepatan | (-) Rem / Perlambatan</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {!isRunning ? (
            <button
              onClick={handlePlay}
              className="border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg bg-emerald-400 py-3 px-8 text-xl flex items-center gap-2 font-bold uppercase transition-all hover:bg-emerald-500 active:translate-x-1 active:translate-y-1 active:shadow-none w-full sm:w-auto justify-center"
            >
              MULAI
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg bg-amber-400 py-3 px-8 text-xl flex items-center gap-2 font-bold uppercase transition-all hover:bg-amber-500 active:translate-x-1 active:translate-y-1 active:shadow-none w-full sm:w-auto justify-center"
            >
              JEDA
            </button>
          )}
          <button
            onClick={handleReset}
            className="border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg bg-slate-200 py-3 px-8 text-xl flex items-center gap-2 font-bold uppercase transition-all hover:bg-slate-300 active:translate-x-1 active:translate-y-1 active:shadow-none w-full sm:w-auto justify-center"
          >
            RESET
          </button>
        </div>
      </div>

      <div className="bg-[#f8fafc] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-2 md:p-6 relative flex flex-col items-center w-full max-w-6xl z-10 mb-10 overflow-hidden">
        <div className="absolute top-4 left-4 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform -rotate-2">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-sky-700">LINTASAN KINEMATIKA</h2>
        </div>

        <div className="absolute top-4 right-4 z-30 bg-white/95 p-3 md:p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs md:text-sm font-bold uppercase w-60 md:w-80 backdrop-blur-sm">
          <h3 className="text-center font-black border-b-4 border-black pb-2 mb-1 text-slate-800">TELEMETRI KENDARAAN</h3>
          <div className="flex justify-between items-center mt-1">
            <span className="text-emerald-700">Waktu (t)</span>
            <span className="font-mono text-emerald-700 font-black text-lg">{t.toFixed(2)} s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-purple-700">Posisi (x)</span>
            <span className="font-mono text-purple-700 font-black text-lg">{x.toFixed(1)} m</span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-dashed border-slate-400 pt-2 mt-1">
            <span className="text-blue-700">Kecepatan (v)</span>
            <span className="font-mono text-blue-700 font-black text-lg">{v.toFixed(1)} m/s</span>
          </div>
          <div className={`mt-3 text-center p-2 border-2 border-black font-black leading-tight text-xs ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
        </div>

        <div className="mt-64 md:mt-24 relative w-full max-w-[1000px] h-[350px] bg-sky-50 border-4 border-black overflow-hidden shadow-[inset_0px_0px_20px_rgba(0,0,0,0.1)]">
          <svg viewBox="0 0 1000 350" className="w-full h-full relative z-20">
            <defs>
              <marker id="arrowHeadBlueKinematika" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                <polygon points="0,0 10,5 0,10" fill="#3b82f6" />
              </marker>
              <marker id="arrowHeadRedKinematika" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                <polygon points="0,0 10,5 0,10" fill="#ef4444" />
              </marker>
            </defs>

            <circle cx="900" cy="80" r="40" fill="#fef08a" stroke="#000" strokeWidth="4" />
            <path d="M 100 100 Q 130 70 160 100 Q 190 80 220 100 Q 250 110 220 120 L 100 120 Z" fill="#fff" stroke="#000" strokeWidth="3" />
            <path d="M 600 80 Q 630 50 660 80 Q 690 60 720 80 Q 750 90 720 100 L 600 100 Z" fill="#fff" stroke="#000" strokeWidth="3" />

            <rect x="0" y="250" width="1000" height="100" fill="#cbd5e1" stroke="#000" strokeWidth="4" />
            <line x1="0" y1="300" x2="1000" y2="300" stroke="#fff" strokeWidth="6" strokeDasharray="20 20" />

            <line x1="100" y1="230" x2="900" y2="230" stroke="#000" strokeWidth="4" />
            <g fontSize="12" fontWeight="bold" textAnchor="middle">
              <line x1="100" y1="220" x2="100" y2="240" stroke="#000" strokeWidth="3" /><text x="100" y="215">0m</text>
              <line x1="300" y1="225" x2="300" y2="235" stroke="#000" strokeWidth="2" /><text x="300" y="215">50m</text>
              <line x1="500" y1="220" x2="500" y2="240" stroke="#000" strokeWidth="3" /><text x="500" y="215">100m</text>
              <line x1="700" y1="225" x2="700" y2="235" stroke="#000" strokeWidth="2" /><text x="700" y="215">150m</text>
              <line x1="900" y1="220" x2="900" y2="240" stroke="#000" strokeWidth="3" /><text x="900" y="215">200m</text>
            </g>

            <g transform={`translate(${svgX}, 200)`}>
              {Math.abs(v) > 0.1 && (
                <>
                  <line
                    x1="40"
                    y1="-20"
                    x2={v > 0 ? 40 + vLength : 40 - vLength}
                    y2="-20"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    markerEnd="url(#arrowHeadBlueKinematika)"
                  />
                  <text
                    x={v > 0 ? 40 + vLength - 15 : 40 - vLength + 15}
                    y="-30"
                    fontWeight="900"
                    fill="#3b82f6"
                    fontSize="14"
                    textAnchor="middle"
                  >
                    v
                  </text>
                </>
              )}

              {Math.abs(a) > 0.1 && (
                <>
                  <line
                    x1="40"
                    y1="-50"
                    x2={a > 0 ? 40 + aLength : 40 - aLength}
                    y2="-50"
                    stroke="#ef4444"
                    strokeWidth="6"
                    markerEnd="url(#arrowHeadRedKinematika)"
                  />
                  <text
                    x={a > 0 ? 40 + aLength - 15 : 40 - aLength + 15}
                    y="-60"
                    fontWeight="900"
                    fill="#ef4444"
                    fontSize="14"
                    textAnchor="middle"
                  >
                    a
                  </text>
                </>
              )}

              <path d="M -40 20 L -30 -10 L 10 -10 L 30 20 L 50 20 L 50 40 L -50 40 L -50 20 Z" fill="#fcd34d" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
              <rect x="-20" y="-5" width="25" height="20" fill="#e0f2fe" stroke="#000" strokeWidth="3" />

              <g transform={`translate(-25, 40) rotate(${rotation})`}>
                <circle cx="0" cy="0" r="12" fill="#333" stroke="#000" strokeWidth="3" />
                <circle cx="0" cy="0" r="4" fill="#cbd5e1" />
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#fff" strokeWidth="2" />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#fff" strokeWidth="2" />
              </g>

              <g transform={`translate(25, 40) rotate(${rotation})`}>
                <circle cx="0" cy="0" r="12" fill="#333" stroke="#000" strokeWidth="3" />
                <circle cx="0" cy="0" r="4" fill="#cbd5e1" />
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#fff" strokeWidth="2" />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#fff" strokeWidth="2" />
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div className="bg-indigo-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform rotate-1 text-indigo-800 uppercase">
          KONSEP FISIKA: GLB & GLBB
        </h3>
        <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/70 p-4 border-2 border-black border-dashed">
          Kinematika mempelajari gerak benda tanpa memperdulikan gaya penyebabnya. Dua jenis gerak lurus yang paling dasar adalah <strong>Gerak Lurus Beraturan (GLB)</strong> dan <strong>Gerak Lurus Berubah Beraturan (GLBB)</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-blue-700 mb-2 border-b-4 border-black pb-2 uppercase">GLB (a = 0)</h4>
            <div className="bg-blue-50 p-4 border-2 border-black mb-3 text-center">
              <span className="font-mono text-xl font-black">v = Konstan | x = v x t</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Terjadi ketika percepatan (a) bernilai nol. Kecepatan benda tidak berubah seiring waktu. Vektor biru (kecepatan) akan tetap panjangnya selama simulasi berjalan.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-red-700 mb-2 border-b-4 border-black pb-2 uppercase">GLBB (a != 0)</h4>
            <div className="bg-red-50 p-4 border-2 border-black mb-3 text-center">
              <span className="font-mono font-black block">v = v0 + a x t</span>
              <span className="font-mono font-black block mt-1">x = v0 x t + 1/2 x a x t2</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Terjadi jika ada percepatan tetap. Kecepatan benda bertambah (di-gas) atau berkurang (di-rem) secara beraturan. Jika a positif searah v, mobil makin cepat. Jika a berlawanan arah v, mobil melambat.
            </p>
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
                {score === 5 ? "LUAR BIASA! PEMAHAMAN KINEMATIKAMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP GLB & GLBB DI ATAS."}
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