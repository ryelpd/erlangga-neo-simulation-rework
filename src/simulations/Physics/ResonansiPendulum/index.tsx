import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

const G = 9.8;
const L1_BASE_X = 300;
const L2_BASE_X = 500;
const BASE_Y = 52;

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: "1. Berdasarkan simulasi, apa syarat utama agar energi dari Pendulum 1 dapat berpindah ke Pendulum 2?",
    options: ["Massa bola harus sama", "Panjang tali harus sama", "Tali penyangga harus sangat tebal", "Sudut simpangan harus sangat besar"],
    answer: 1
  },
  {
    question: "2. Apa yang dimaksud dengan fenomena resonansi?",
    options: ["Benda berhenti bergetar", "Benda ikut bergetar dengan frekuensi berbeda", "Ikut bergetarnya suatu benda karena pengaruh getaran benda lain dengan frekuensi yang sama", "Proses pendinginan benda"],
    answer: 2
  },
  {
    question: "3. Jika panjang tali (L) Pendulum diperpendek, apa yang terjadi pada frekuensi getarannya?",
    options: ["Frekuensi mengecil", "Frekuensi tetap", "Frekuensi membesar", "Frekuensi menjadi nol"],
    answer: 2
  },
  {
    question: "4. Apakah massa bola pendulum (m) memengaruhi frekuensi alami getarannya?",
    options: ["Ya, sangat memengaruhi", "Hanya jika massa sangat ringan", "Tidak memengaruhi sama sekali (berdasarkan rumus T)", "Hanya memengaruhi amplitudo"],
    answer: 2
  },
  {
    question: "5. Kenapa pada jembatan gantung kuno, tentara dilarang berjalan dengan langkah serempak (kompak)?",
    options: ["Agar jembatan tidak kotor", "Menghindari resonansi yang dapat membuat jembatan berayun liar dan roboh", "Supaya suara langkah kaki tidak berisik", "Agar jembatan tidak patah karena berat"],
    answer: 1
  }
];

export default function ResonansiPendulum(): ReactNode {
  const [l1, setL1] = useState(150);
  const [l2, setL2] = useState(100);
  const [isSimulating, setIsSimulating] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [p1Pos, setP1Pos] = useState({ x: L1_BASE_X, y: BASE_Y + 150 });
  const [p2Pos, setP2Pos] = useState({ x: L2_BASE_X, y: BASE_Y + 100 });
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const animationRef = useRef<number | null>(null);

  const calculateFrequency = useCallback((length: number): number => {
    const lengthInMeters = length / 100;
    return (1 / (2 * Math.PI)) * Math.sqrt(G / lengthInMeters);
  }, []);

  const f1 = calculateFrequency(l1);
  const f2 = calculateFrequency(l2);

  const getResonanceStatus = (): { text: string; className: string } => {
    const diff = Math.abs(f1 - f2);
    if (diff < 0.05) {
      return { text: "KONDISI RESONANSI: TRANSFER ENERGI MAKSIMAL!", className: "text-emerald-500" };
    } else if (diff < 0.2) {
      return { text: "RESONANSI PARSIAL: ENERGI SEDIKIT BERGETAR.", className: "text-yellow-500" };
    }
    return { text: "TIDAK RESONANSI: PANJANG TALI BERBEDA.", className: "text-rose-500" };
  };

  const status = getResonanceStatus();

  useEffect(() => {
    if (!isSimulating) {
      setP1Pos({ x: L1_BASE_X, y: BASE_Y + l1 });
      setP2Pos({ x: L2_BASE_X, y: BASE_Y + l2 });
      setStartTime(null);
      return;
    }

    const animate = (timestamp: number) => {
      if (startTime === null) {
        setStartTime(timestamp);
      }
      const elapsed = ((startTime ? timestamp - startTime : 0)) / 1000;

      const couplingFactor = Math.max(0, 1 - Math.abs(f1 - f2) * 5);
      const exchangePeriod = 10;
      const tExchange = (2 * Math.PI / exchangePeriod) * elapsed;

      const totalEnergy = 0.5;
      const amp1 = totalEnergy * Math.pow(Math.cos(tExchange * couplingFactor / 2), 2);
      const amp2 = totalEnergy * Math.pow(Math.sin(tExchange * couplingFactor / 2), 2);

      const theta1 = amp1 * Math.sin(2 * Math.PI * f1 * elapsed);
      const theta2 = amp2 * Math.sin(2 * Math.PI * f2 * elapsed);

      const x1 = L1_BASE_X + l1 * Math.sin(theta1);
      const y1 = BASE_Y + l1 * Math.cos(theta1);
      const x2 = L2_BASE_X + l2 * Math.sin(theta2);
      const y2 = BASE_Y + l2 * Math.cos(theta2);

      setP1Pos({ x: x1, y: y1 });
      setP2Pos({ x: x2, y: y2 });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSimulating, l1, l2, f1, f2, startTime]);

  const handleStart = () => {
    setIsSimulating(true);
    setStartTime(null);
  };

  const handleStop = () => {
    setIsSimulating(false);
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

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-400 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">FISIKA MEKANIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: RESONANSI PENDULUM
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menganalisis Transfer Energi Antar Getaran Melalui Tali Penyangga
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Konfigurasi Eksperimen
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-rose-800 uppercase text-[10px]">Panjang Tali 1 (L1)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{l1}</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="1"
                value={l1}
                onChange={(e) => setL1(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-rose-500"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Unit: cm</span>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-blue-800 uppercase text-[10px]">Panjang Tali 2 (L2)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{l2}</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="1"
                value={l2}
                onChange={(e) => setL2(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-blue-500"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Unit: cm</span>
            </div>

            <button
              onClick={handleStart}
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000000] rounded-lg bg-yellow-400 hover:bg-yellow-300 py-4 text-xl font-bold flex items-center justify-center gap-3 uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              GANGGU PENDULUM 1
            </button>
            <button
              onClick={handleStop}
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000000] rounded-lg bg-slate-200 hover:bg-slate-300 py-2 text-xs font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              BERHENTIKAN SEMUA
            </button>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">FREKUENSI ALAMI</h4>
            <div className="grid grid-cols-1 gap-3 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Frekuensi 1 (f1):</span>
                <span className="text-rose-400 font-bold">{f1.toFixed(2)} Hz</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Frekuensi 2 (f2):</span>
                <span className="text-sky-400 font-bold">{f2.toFixed(2)} Hz</span>
              </div>
              <div className="mt-2 text-center p-2 bg-slate-800 border-2 border-dashed border-slate-600 rounded">
                <div className={`text-[11px] font-black leading-tight uppercase ${status.className}`}>{status.text}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Visualisasi Dinamis
          </span>

          <div className="w-full h-full relative z-10">
            <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
              <line x1="100" y1="50" x2="700" y2="50" stroke="#000" strokeWidth="12" strokeLinecap="round" />
              <rect x="90" y="45" width="10" height="20" fill="#000" />
              <rect x="700" y="45" width="10" height="20" fill="#000" />
              <path d="M 100 50 Q 400 55 700 50" fill="none" stroke="#64748b" strokeWidth="2" />

              <g>
                <line x1={L1_BASE_X} y1={BASE_Y} x2={p1Pos.x} y2={p1Pos.y} stroke="#000" strokeWidth="3" />
                <circle cx={p1Pos.x} cy={p1Pos.y} r="18" fill="#f43f5e" stroke="#000" strokeWidth="4" />
                <text x={p1Pos.x} y={p1Pos.y + 5} textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">1</text>
              </g>

              <g>
                <line x1={L2_BASE_X} y1={BASE_Y} x2={p2Pos.x} y2={p2Pos.y} stroke="#000" strokeWidth="3" />
                <circle cx={p2Pos.x} cy={p2Pos.y} r="18" fill="#3b82f6" stroke="#000" strokeWidth="4" />
                <text x={p2Pos.x} y={p2Pos.y + 5} textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">2</text>
              </g>

              <text x="400" y="480" textAnchor="middle" fontSize="12" fontWeight="900" fill="#94a3b8" className="uppercase">Transfer Energi Melalui Tali Penyangga</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          BAGAIMANA RESONANSI TERJADI?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Frekuensi Alami</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Setiap pendulum memiliki "irama" alami yang hanya ditentukan oleh <strong>panjang talinya</strong>. Jika dua pendulum memiliki panjang yang sama, mereka akan berayun dengan kecepatan yang sama (sinkron).
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Transfer Energi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Resonansi adalah gejala ikut bergetarnya suatu benda karena pengaruh getaran benda lain. Syaratnya: <strong>Frekuensi keduanya harus sama</strong>. Pada simulasi ini, tali penyangga menjadi jembatan pengalir energi dari Pendulum 1 ke Pendulum 2.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">RUMUS PERIODE PENDULUM</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-2xl md:text-3xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e]">
              T = 2π √(L / g)
            </div>
            <p className="text-center mt-4 text-xs font-bold text-slate-300 italic">Frekuensi (f) = 1 / T</p>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600 rounded-lg">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">KETERANGAN</h4>
            <ul className="text-[11px] font-bold space-y-2 uppercase">
              <li><span className="text-rose-400">T</span> = Periode (detik per ayunan)</li>
              <li><span className="text-blue-400">L</span> = Panjang tali (meter)</li>
              <li><span className="text-emerald-400">g</span> = Gravitasi (±9.8 m/s²)</li>
              <li className="pt-2 text-slate-400 lowercase italic">Kesimpulan: Periode TIDAK dipengaruhi oleh massa atau sudut (kecil).</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI RESONANSI [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000] mb-4">
                <h4 className="font-bold mb-3 text-sm uppercase tracking-tight">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => {
                    let btnClass = "border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg text-left px-4 py-2 text-xs font-bold uppercase transition-all ";
                    if (quizSubmitted) {
                      if (oIdx === q.answer) {
                        btnClass += "bg-green-400 text-black";
                      } else if (userAnswers[qIdx] === oIdx) {
                        btnClass += "bg-rose-400 text-black";
                      } else {
                        btnClass += "bg-white text-black";
                      }
                    } else {
                      btnClass += userAnswers[qIdx] === oIdx ? "bg-black text-white" : "bg-white text-black hover:bg-slate-100";
                    }
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswerSelect(qIdx, oIdx)}
                        disabled={quizSubmitted}
                        className={btnClass}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted && allAnswered && (
            <button
              onClick={handleSubmit}
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-900 text-white font-bold py-3 px-10 text-xl w-full mt-4 uppercase transition-all hover:bg-slate-800 active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              SERAHKAN JAWABAN!
            </button>
          )}

          {quizSubmitted && (
            <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR: {score}/5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? "Luar biasa! Anda memahami konsep Resonansi." : "Bagus! Coba perhatikan lagi panjang tali simulasi."}
              </p>
              <br />
              <button
                onClick={handleRetry}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-black text-white py-3 px-8 text-lg uppercase tracking-wider font-bold transition-all hover:bg-slate-800 active:translate-x-1 active:translate-y-1 active:shadow-none"
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