import { useState, useCallback, type ReactNode } from 'react';

const GRAVITY = 10;
const Y_BASE = 200;
const Y_BOTTOM_FLUID = 350;
const CENTER_X1 = 200;
const CENTER_X2 = 700;
const MAX_DISPLACEMENT_LEFT = 80;
const BOTTOM_INNER = Y_BOTTOM_FLUID - 40;
const TOP_BOUNDARY = 50;

interface LoadOption {
  mass: number;
  emoji: string;
  label: string;
}

const loadOptions: LoadOption[] = [
  { mass: 50, emoji: '📦', label: 'Paket Kardus' },
  { mass: 200, emoji: '🏍️', label: 'Sepeda Motor' },
  { mass: 1000, emoji: '🚗', label: 'Mobil Sedan' },
];

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: "1. Berdasarkan simulasi di atas, apa prinsip utama dari Hukum Pascal?",
    options: ["Tekanan zat cair bertambah sesuai dengan kedalamannya", "Tekanan yang diberikan pada fluida di ruang tertutup diteruskan sama besar ke segala arah", "Massa jenis fluida menentukan besarnya gaya angkat", "Luas penampang tidak berpengaruh pada gaya"],
    answer: 1
  },
  {
    question: "2. Bagaimana cara paling efektif untuk memperbesar Keuntungan Mekanis (KM) pada pompa hidrolik?",
    options: ["Memperbesar gaya input (F1)", "Memperkecil Piston Besar (A2)", "Memperbesar Piston Besar (A2) dan memperkecil Piston Kecil (A1)", "Mengganti cairan hidrolik dengan air biasa"],
    answer: 2
  },
  {
    question: "3. Jika Luas Piston Kecil (A1) = 20 cm² dan Luas Piston Besar (A2) = 200 cm². Berapa gaya (F1) yang dibutuhkan untuk mengangkat beban seberat 1000 N?",
    options: ["100 N", "200 N", "500 N", "1000 N"],
    answer: 0
  },
  {
    question: "4. Apa yang terjadi pada simulasi jika Gaya Angkat (F2) yang dihasilkan masih lebih kecil (<) dari Berat Beban (W)?",
    options: ["Piston besar akan meledak", "Piston besar tetap terangkat perlahan", "Piston besar tidak akan bergerak naik / beban tidak terangkat", "Piston kecil akan tertarik ke atas"],
    answer: 2
  },
  {
    question: "5. Berikut ini adalah alat dalam kehidupan sehari-hari yang MENGGUNAKAN prinsip Pompa Hidrolik (Hukum Pascal), KECUALI...",
    options: ["Dongkrak Mobil", "Rem Cakram Kendaraan", "Mesin Pengepres Hidrolik", "Kipas Angin"],
    answer: 3
  }
];

export default function PompaHidrolik(): ReactNode {
  const [a1, setA1] = useState(20);
  const [a2, setA2] = useState(200);
  const [f1, setF1] = useState(0);
  const [selectedLoad, setSelectedLoad] = useState(1);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const mass = loadOptions[selectedLoad].mass;
  const w = mass * GRAVITY;
  const km = a2 / a1;
  const f2 = f1 * km;
  const p = f1 / a1;

  const getLiftStatus = useCallback(() => {
    if (f1 === 0) {
      return { text: "MENUNGGU GAYA INPUT...", className: "bg-slate-200 text-slate-500", showPressure: false };
    }
    if (f2 >= w) {
      const overForce = f2 > w * 1.5;
      if (overForce) {
        return { text: "OBJEK TERANGKAT CEPAT!", className: "bg-emerald-400 text-black", showPressure: true };
      }
      return { text: "OBJEK TERANGKAT!", className: "bg-emerald-300 text-black", showPressure: true };
    }
    return { text: "GAYA KURANG BESAR", className: "bg-rose-300 text-black", showPressure: true };
  }, [f1, f2, w]);

  const liftStatus = getLiftStatus();
  const isLifted = f2 >= w;

  const w1Visual = 40 + ((a1 - 10) / 40) * 60;
  const w2Visual = 100 + ((a2 - 100) / 900) * 180;

  const L1_left = CENTER_X1 - w1Visual / 2;
  const L1_right = CENTER_X1 + w1Visual / 2;
  const R2_left = CENTER_X2 - w2Visual / 2;
  const R2_right = CENTER_X2 + w2Visual / 2;

  let dy_left = 0;
  let dy_right = 0;

  if (isLifted) {
    dy_left = MAX_DISPLACEMENT_LEFT;
    const visualRatio = (w1Visual / w2Visual) * 1.5;
    dy_right = -(dy_left * visualRatio);
  } else if (f1 > 0) {
    dy_left = (f1 / (w / km)) * 10;
    dy_right = -(dy_left * (w1Visual / w2Visual) * 0.5);
  }

  const currentY1 = Y_BASE + dy_left;
  const currentY2 = Y_BASE + dy_right;

  const handleLoadSelect = (index: number) => {
    setSelectedLoad(index);
    setF1(0);
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

  const loadBoxWidth = mass === 50 ? 60 : mass === 200 ? 80 : 120;
  const loadBoxX = -loadBoxWidth / 2;

  const pathOuter = `M ${L1_left} ${TOP_BOUNDARY} L ${L1_left} ${Y_BOTTOM_FLUID} L ${R2_right} ${Y_BOTTOM_FLUID} L ${R2_right} ${TOP_BOUNDARY}`;
  const pathInner = `M ${L1_right} ${TOP_BOUNDARY} L ${L1_right} ${BOTTOM_INNER} L ${R2_left} ${BOTTOM_INNER} L ${R2_left} ${TOP_BOUNDARY}`;

  const arrowF1Color = f1 > 0 ? "#ef4444" : "#64748b";

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-blue-700">FISIKA FLUIDA STATIS</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
          LAB VIRTUAL: POMPA HIDROLIK
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
          Menganalisis Hukum Pascal & Keuntungan Mekanis pada Sistem Hidrolik
        </p>
      </header>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl mb-8 flex flex-col gap-6 z-10 relative">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              1. Piston Kecil (A1)
            </label>
            <div className="bg-yellow-50 p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 h-full justify-center">
              <div className="flex justify-between items-center">
                <span className="font-black text-sm uppercase">Luas (A1)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{a1} cm2</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={a1}
                onChange={(e) => setA1(parseInt(e.target.value))}
                className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="text-xs font-bold text-slate-500 text-center">Gunakan tuas untuk merubah ukuran</div>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-emerald-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              2. Piston Besar (A2)
            </label>
            <div className="bg-emerald-50 p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 h-full justify-center">
              <div className="flex justify-between items-center">
                <span className="font-black text-sm uppercase">Luas (A2)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{a2} cm2</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={a2}
                onChange={(e) => setA2(parseInt(e.target.value))}
                className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="text-xs font-bold text-slate-500 text-center">Menentukan Keuntungan Mekanis</div>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-rose-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              3. Beban yang Diangkat
            </label>
            <div className="grid grid-cols-1 gap-2 h-full">
              {loadOptions.map((load, index) => (
                <button
                  key={load.mass}
                  onClick={() => handleLoadSelect(index)}
                  className={`border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg py-2 flex justify-between px-4 items-center font-bold text-sm uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${
                    selectedLoad === index ? 'bg-yellow-200 ring-4 ring-black' : 'bg-slate-100'
                  }`}
                >
                  <span className="text-xl">{load.emoji}</span>
                  <span className="font-bold text-sm">{load.label}</span>
                  <span className="font-mono bg-white px-1 border border-black text-xs">{load.mass} kg</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t-4 border-black border-dashed flex flex-col md:flex-row gap-6 items-center bg-blue-50 p-4 shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <div className="w-full md:w-1/3 text-center md:text-left">
            <h3 className="text-xl font-black uppercase text-blue-800">4. Berikan Gaya (F1)</h3>
            <p className="text-xs font-bold text-slate-600">Tekan tuas untuk mendorong cairan hidrolik.</p>
          </div>
          <div className="w-full md:w-2/3 flex items-center gap-4">
            <span className="font-bold text-sm">0 N</span>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={f1}
              onChange={(e) => setF1(parseInt(e.target.value))}
              className="flex-grow h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full"
            />
            <span className="font-mono font-black text-xl bg-white px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] text-blue-600 w-28 text-center">{f1} N</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-100 border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-2 md:p-6 relative flex flex-col items-center w-full max-w-6xl z-10 mb-10 overflow-hidden">
        <div className="absolute top-4 left-4 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform -rotate-2">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-blue-700">VISUALISASI SISTEM</h2>
        </div>

        <div className="absolute top-4 right-4 z-30 bg-white/95 p-3 md:p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs md:text-sm font-bold uppercase w-56 md:w-72 backdrop-blur-sm">
          <h3 className="text-center font-black border-b-4 border-black pb-2 mb-1 text-rose-600">STATUS PENGANGKATAN</h3>
          <div className="flex justify-between items-center mt-1">
            <span>Berat Beban (W)</span>
            <span className="font-mono text-rose-600">{w} N</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Gaya Angkat (F2)</span>
            <span className="font-mono text-emerald-600">{f2.toFixed(1)} N</span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-dashed border-slate-400 pt-2 mt-1">
            <span>Tekanan Fluida (P)</span>
            <span className="font-mono text-blue-600">{p.toFixed(2)} N/cm2</span>
          </div>
          <div className={`mt-3 text-center p-2 border-2 border-black font-black ${liftStatus.className}`}>
            {liftStatus.text}
          </div>
        </div>

        <div className="mt-48 md:mt-16 relative w-full max-w-[900px] h-[400px] bg-white border-4 border-black overflow-hidden shadow-[inset_0px_0px_20px_rgba(0,0,0,0.1)]">
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          <svg viewBox="0 0 900 400" className="w-full h-full relative z-20">
            <rect x={L1_left} y={BOTTOM_INNER} width={R2_right - L1_left} height={Y_BOTTOM_FLUID - BOTTOM_INNER} fill="#38bdf8" stroke="none" />
            <rect x={L1_left + 4} width={w1Visual - 8} y={currentY1} height={BOTTOM_INNER - currentY1 + 2} fill="#38bdf8" stroke="none" />
            <rect x={R2_left + 4} width={w2Visual - 8} y={currentY2} height={BOTTOM_INNER - currentY2 + 2} fill="#38bdf8" stroke="none" />

            <path d={pathOuter} fill="none" stroke="#000" strokeWidth="8" strokeLinejoin="round" />
            <path d={pathInner} fill="none" stroke="#000" strokeWidth="8" strokeLinejoin="round" />

            <g transform={`translate(0, ${currentY1 - 20})`}>
              <rect x={L1_left + 2} width={w1Visual - 4} height="20" fill="#64748b" stroke="#000" strokeWidth="4" />
              <g transform={`translate(${CENTER_X1}, 0)`}>
                <path d="M 0 -40 L 0 -10 M -10 -20 L 0 -5 L 10 -20" fill="none" stroke={arrowF1Color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <text x="15" y="-25" fontWeight="900" fontSize="16" fill={arrowF1Color}>F1</text>
              </g>
            </g>

            <g transform={`translate(0, ${currentY2 - 20})`}>
              <rect x={R2_left + 2} width={w2Visual - 4} height="20" fill="#64748b" stroke="#000" strokeWidth="4" />
              <g transform={`translate(${CENTER_X2}, -60)`}>
                <rect x={loadBoxX} y="0" width={loadBoxWidth} height="60" fill="#facc15" stroke="#000" strokeWidth="4" rx="4" />
                <text x="0" y="40" fontSize="32" textAnchor="middle">{loadOptions[selectedLoad].emoji}</text>
              </g>
              <g transform={`translate(${CENTER_X2}, 0)`}>
                <path d="M 0 0 L 0 -80 M -10 -70 L 0 -85 L 10 -70" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity={f1 > 0 ? 1 : 0} />
                <text x="20" y="-40" fontWeight="900" fontSize="16" fill="#10b981" opacity={f1 > 0 ? 1 : 0}>F2 = {f2.toFixed(0)}N</text>
              </g>
            </g>

            <g opacity={liftStatus.showPressure ? 1 : 0}>
              <text x="450" y="360" fontWeight="900" fontSize="20" fill="#0284c7" textAnchor="middle" letterSpacing="4">P1 = P2</text>
              <circle cx="200" cy="300" r="15" fill="none" stroke="#0284c7" strokeWidth="3" strokeDasharray="4 4" />
              <circle cx="700" cy="300" r="15" fill="none" stroke="#0284c7" strokeWidth="3" strokeDasharray="4 4" />
            </g>
          </svg>
        </div>
      </div>

      <div className="bg-cyan-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform rotate-1 uppercase">
          KONSEP FISIKA: HUKUM PASCAL & KEUNTUNGAN MEKANIS
        </h3>
        <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/70 p-4 border-2 border-black border-dashed">
          Hukum Pascal menyatakan bahwa tekanan yang diberikan pada zat cair dalam ruang tertutup akan diteruskan ke segala arah dengan <strong>sama besar</strong>. Oleh karena itu, gaya kecil yang diberikan pada piston kecil dapat diubah menjadi gaya angkat yang sangat besar pada piston besar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-blue-700 mb-2 border-b-4 border-black pb-2 uppercase">Persamaan Pascal</h4>
            <div className="bg-blue-50 p-4 border-2 border-black mb-3">
              <div className="text-2xl font-black text-center font-mono tracking-widest text-slate-800">
                P1 = P2<br />
                <span className="text-xl">F1 / A1 = F2 / A2</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Keterangan:<br />
              <strong>P</strong> = Tekanan Cairan (N/m2 atau Pascal)<br />
              <strong>F1</strong> = Gaya Input (Dorongan Anda)<br />
              <strong>F2</strong> = Gaya Output (Gaya Angkat)<br />
              <strong>A1, A2</strong> = Luas Penampang Piston
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-emerald-700 mb-2 border-b-4 border-black pb-2 uppercase">Keuntungan Mekanis (KM)</h4>
            <div className="bg-emerald-50 p-4 border-2 border-black mb-3 flex items-center justify-center">
              <div className="text-3xl font-black text-center font-mono text-emerald-800">
                KM = {km.toFixed(1)}
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Keuntungan Mekanis adalah perbandingan gaya angkat (F2) terhadap gaya input (F1). Semakin besar beda ukuran piston (A2 jauh lebih besar dari A1), semakin ringan dorongan yang dibutuhkan untuk mengangkat beban berat.
              <br /><br /><strong>Rumus: KM = A2 / A1</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-rose-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
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
                      btnClass += userAnswers[qIdx] === oIdx ? "bg-black text-white" : "bg-white text-black hover:bg-rose-200";
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
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-blue-600 text-white font-black py-4 px-10 text-xl md:text-2xl uppercase tracking-widest hover:bg-blue-700 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                CEK JAWABAN SAYA!
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? "LUAR BIASA! PEMAHAMAN FISIKA FLUIDAMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP HUKUM PASCAL DI ATAS."}
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