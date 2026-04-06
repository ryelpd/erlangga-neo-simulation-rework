import { useState, type ReactNode } from 'react';

const SCALE = 3;
const CX1 = 250;
const CY = 250;
const HO = 10;

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: "1. Pada mikroskop, bayangan yang dibentuk oleh Lensa Objektif (Lensa 1) berfungsi sebagai...",
    options: ["Bayangan akhir yang dilihat mata", "Benda nyata untuk lensa okuler (Lensa 2)", "Fokus buatan", "Cermin pemantul"],
    answer: 1
  },
  {
    question: "2. Apa syarat utama sifat bayangan akhir pada mikroskop jika diamati oleh mata normal (tanpa akomodasi)?",
    options: ["Nyata, Tegak, Diperbesar", "Maya, Terbalik, Diperbesar", "Nyata, Terbalik, Sama Besar", "Maya, Tegak, Diperkecil"],
    answer: 1
  },
  {
    question: "3. Rumus perbesaran total (M_total) pada sistem 2 lensa adalah...",
    options: ["M1 + M2", "M1 - M2", "M1 x M2", "M1 / M2"],
    answer: 2
  },
  {
    question: "4. Coba preset 'Teleskop'. Mengapa jarak fokus lensa objektif (f1) teleskop dibuat jauh lebih besar daripada fokus okulernya (f2)?",
    options: ["Agar mikroskop menjadi berat", "Untuk mengumpulkan cahaya sebanyak mungkin dari benda astronomi yang sangat jauh", "Agar bayangan akhirnya mengecil", "Untuk membalikkan warna"],
    answer: 1
  },
  {
    question: "5. Jika s2' (posisi bayangan akhir) bernilai negatif, maka secara geometris bayangan tersebut bersifat...",
    options: ["Nyata, jatuh di belakang lensa 2", "Maya, jatuh di depan lensa 2", "Hilang tak terhingga", "Tegak lurus"],
    answer: 1
  }
];

function safeCalcLens(s: number, f: number): { sp: number; m: number } {
  if (Math.abs(s - f) < 0.1) {
    s += 0.2;
  }
  const sp = (s * f) / (s - f);
  const m = -sp / s;
  return { sp, m };
}

export default function Optik2Lensa(): ReactNode {
  const [s1, setS1] = useState(30);
  const [f1, setF1] = useState(20);
  const [d, setD] = useState(100);
  const [f2, setF2] = useState(20);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const actualF1 = f1 === 0 ? 1 : f1;
  const actualF2 = f2 === 0 ? 1 : f2;

  const res1 = safeCalcLens(s1, actualF1);
  const s1p = res1.sp;
  const m1 = res1.m;
  const h1 = HO * m1;

  const s2 = d - s1p;
  const res2 = safeCalcLens(s2, actualF2);
  const s2p = res2.sp;
  const m2 = res2.m;
  const h2 = h1 * m2;
  const mTotal = m1 * m2;

  const CX2 = CX1 + (d * SCALE);
  const objX = CX1 - (s1 * SCALE);
  const objY = -HO * SCALE;
  const img1X = CX1 + (s1p * SCALE);
  const img1Y = -h1 * SCALE;
  const img2X = CX2 + (s2p * SCALE);
  const img2Y = -h2 * SCALE;

  const getStatusInfo = () => {
    const sifat1 = s2p > 0 ? "NYATA" : "MAYA";
    const sifat2 = mTotal > 0 ? "TEGAK" : "TERBALIK";
    const sifat3 = Math.abs(mTotal) > 1 ? "DIPERBESAR" : Math.abs(mTotal) < 1 ? "DIPERKECIL" : "SAMA BESAR";
    return `${sifat1}, ${sifat2}, ${sifat3}`;
  };

  const statusInfo = getStatusInfo();

  const handlePreset = (type: string) => {
    if (type === 'microscope') {
      setS1(15);
      setF1(10);
      setD(80);
      setF2(30);
    } else if (type === 'telescope') {
      setS1(80);
      setF1(40);
      setD(60);
      setF2(15);
    }
  };

  const rays1: { x1: number; y1: number; x2: number; y2: number; dash?: boolean }[] = [];
  const rays2: { x1: number; y1: number; x2: number; y2: number; dash?: boolean }[] = [];
  const rays3: { x1: number; y1: number; x2: number; y2: number; dash?: boolean }[] = [];

  // Sinar Lensa 1
  rays1.push({ x1: objX, y1: CY + objY, x2: CX1, y2: CY + objY });
  if (s1p > 0) {
    rays1.push({ x1: CX1, y1: CY + objY, x2: img1X, y2: CY + img1Y });
  } else {
    const slope1 = (img1Y - objY) / (img1X - CX1);
    rays1.push({ x1: CX1, y1: CY + objY, x2: CX1 + 500, y2: CY + objY + slope1 * 500 });
    rays1.push({ x1: CX1, y1: CY + objY, x2: img1X, y2: CY + img1Y, dash: true });
  }

  if (s1p > 0) {
    rays1.push({ x1: objX, y1: CY + objY, x2: img1X, y2: CY + img1Y });
  } else {
    const slope2 = objY / -s1;
    rays1.push({ x1: objX, y1: CY + objY, x2: CX1 + 500, y2: CY + slope2 * 500 });
    rays1.push({ x1: CX1, y1: CY, x2: img1X, y2: CY + img1Y, dash: true });
  }

  // Sinar Lensa 2
  rays2.push({ x1: img1X, y1: CY + img1Y, x2: CX2, y2: CY + img1Y });
  if (s2p > 0) {
    rays3.push({ x1: CX2, y1: CY + img1Y, x2: img2X, y2: CY + img2Y });
  } else {
    const slope3 = (img2Y - img1Y) / (img2X - CX2);
    rays3.push({ x1: CX2, y1: CY + img1Y, x2: CX2 + 500, y2: CY + img1Y + slope3 * 500 });
    rays3.push({ x1: CX2, y1: CY + img1Y, x2: img2X, y2: CY + img2Y, dash: true });
  }

  if (s2p > 0) {
    rays2.push({ x1: img1X, y1: CY + img1Y, x2: img2X, y2: CY + img2Y });
  } else {
    const slope4 = img1Y / (img1X - CX2);
    rays3.push({ x1: img1X, y1: CY + img1Y, x2: CX2 + 500, y2: CY + img1Y + slope4 * (CX2 + 500 - img1X) });
    rays3.push({ x1: CX2, y1: CY, x2: img2X, y2: CY + img2Y, dash: true });
  }

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

  const getMarkerStart = (f: number) => f > 0 ? "url(#arrowUpCembung)" : "url(#arrowUpCekung)";
  const getMarkerEnd = (f: number) => f > 0 ? "url(#arrowDownCembung)" : "url(#arrowDownCekung)";

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-purple-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-purple-800">FISIKA OPTIK GEOMETRI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
          LAB VIRTUAL: SISTEM 2 LENSA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
          Menganalisis Pembentukan Bayangan pada Mikroskop & Teleskop Sederhana
        </p>
      </header>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl mb-8 flex flex-col gap-6 z-10 relative">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6 border-b-4 border-black border-dashed pb-6">
          <div className="w-full lg:w-1/2 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-emerald-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              1. Posisi Benda (s1)
            </label>
            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-xs uppercase text-emerald-800">Jarak ke Lensa 1 (cm)</span>
                <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{s1} cm</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="1"
                value={s1}
                onChange={(e) => setS1(parseInt(e.target.value))}
                className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-cyan-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              2. Fokus Lensa 1 (f1)
            </label>
            <div className="bg-cyan-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-xs uppercase text-cyan-800">Panjang Fokus (cm)</span>
                <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{f1} cm</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                step="5"
                value={f1}
                onChange={(e) => setF1(parseInt(e.target.value))}
                className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="text-[10px] font-bold text-slate-500 text-center mt-1">(+) Cembung | (-) Cekung</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              3. Jarak Antar Lensa (d)
            </label>
            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] h-full">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-xs uppercase text-yellow-800">Jarak L1 - L2 (cm)</span>
                <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{d} cm</span>
              </div>
              <input
                type="range"
                min="30"
                max="150"
                step="5"
                value={d}
                onChange={(e) => setD(parseInt(e.target.value))}
                className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-rose-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              4. Fokus Lensa 2 (f2)
            </label>
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] h-full">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-xs uppercase text-rose-800">Panjang Fokus (cm)</span>
                <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{f2} cm</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                step="5"
                value={f2}
                onChange={(e) => setF2(parseInt(e.target.value))}
                className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-purple-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              5. Preset Alat Optik
            </label>
            <div className="bg-purple-50 p-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 h-full justify-center">
              <button
                onClick={() => handlePreset('microscope')}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg py-2 text-xs font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none bg-purple-200 ring-4 ring-black"
              >
                Mikroskop (f1 &lt; f2)
              </button>
              <button
                onClick={() => handlePreset('telescope')}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg bg-white py-2 text-xs font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Teleskop (f1 &gt; f2)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#f8fafc] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-2 md:p-6 relative flex flex-col items-center w-full max-w-6xl z-10 mb-10 overflow-hidden">
        <div className="absolute top-4 left-4 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform -rotate-2">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-purple-700">MEJA OPTIK VIRTUAL</h2>
        </div>

        <div className="absolute top-4 right-4 z-30 bg-white/95 p-3 md:p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs md:text-sm font-bold uppercase w-60 md:w-80 backdrop-blur-sm">
          <h3 className="text-center font-black border-b-4 border-black pb-2 mb-1 text-slate-800">HASIL BAYANGAN AKHIR</h3>
          <div className="flex justify-between items-center mt-1">
            <span className="text-cyan-700">Posisi Akhir (s2')</span>
            <span className="font-mono text-cyan-700 font-black">
              {Math.abs(s2p) > 1000 ? "Tak Terhingga" : `${s2p.toFixed(1)} cm`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-rose-700">Perbesaran Total (M)</span>
            <span className="font-mono text-rose-700 font-black">{Math.abs(mTotal).toFixed(2)} x</span>
          </div>
          <div className={`mt-3 text-center p-2 border-2 border-black font-black leading-tight text-xs ${s2p > 0 ? 'bg-emerald-300' : 'bg-rose-300'}`}>
            Sifat: {statusInfo}
          </div>
        </div>

        <div className="mt-56 md:mt-24 relative w-full max-w-[1000px] h-[500px] bg-white border-4 border-black overflow-hidden shadow-[inset_0px_0px_20px_rgba(0,0,0,0.1)]">
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: 'center center' }}></div>

          <svg viewBox="0 0 1000 500" className="w-full h-full relative z-20">
            <defs>
              <marker id="arrowUpCembung" markerWidth="10" markerHeight="10" refX="5" refY="0" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 10 L 5 0 L 10 10 Z" fill="#000" />
              </marker>
              <marker id="arrowDownCembung" markerWidth="10" markerHeight="10" refX="5" refY="10" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 5 10 L 10 0 Z" fill="#000" />
              </marker>
              <marker id="arrowUpCekung" markerWidth="10" markerHeight="10" refX="5" refY="0" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 5 10 L 10 0 Z" fill="#000" />
              </marker>
              <marker id="arrowDownCekung" markerWidth="10" markerHeight="10" refX="5" refY="10" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 10 L 5 0 L 10 10 Z" fill="#000" />
              </marker>
              <marker id="arrowHeadOptik" markerWidth="10" markerHeight="10" refX="5" refY="0" orient="auto">
                <path d="M 0 10 L 5 0 L 10 10 Z" fill="currentColor" />
              </marker>
            </defs>

            <line x1="0" y1="250" x2="1000" y2="250" stroke="#000" strokeWidth="2" strokeDasharray="10 5" />

            {rays1.map((ray, i) => (
              <line key={`r1-${i}`} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} stroke="rgba(239, 68, 68, 0.6)" strokeWidth="3" strokeDasharray={ray.dash ? "5 5" : "10 5"} />
            ))}
            {rays2.map((ray, i) => (
              <line key={`r2-${i}`} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} stroke="rgba(59, 130, 246, 0.6)" strokeWidth="3" strokeDasharray={ray.dash ? "5 5" : "10 5"} />
            ))}
            {rays3.map((ray, i) => (
              <line key={`r3-${i}`} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} stroke="rgba(59, 130, 246, 0.6)" strokeWidth="3" strokeDasharray={ray.dash ? "5 5" : "10 5"} />
            ))}

            <g transform={`translate(${objX}, ${CY})`}>
              <line x1="0" y1="0" x2="0" y2={objY} stroke="#ef4444" strokeWidth="6" style={{ color: '#ef4444' }} markerEnd="url(#arrowHeadOptik)" />
              <text x="0" y={objY - 10} fill="#ef4444" fontWeight="900" textAnchor="middle" fontSize="14">BENDA</text>
            </g>

            <g transform={`translate(${img1X}, ${CY})`} opacity="0.6">
              <line x1="0" y1="0" x2="0" y2={img1Y} stroke="#3b82f6" strokeWidth="4" style={{ color: '#3b82f6' }} markerEnd="url(#arrowHeadOptik)" />
              <text x="0" y={img1Y > 0 ? img1Y + 20 : img1Y - 10} fill="#3b82f6" fontWeight="900" textAnchor="middle" fontSize="12">BAYANGAN 1</text>
            </g>

            <g transform={`translate(${img2X}, ${CY})`}>
              <line x1="0" y1="0" x2="0" y2={img2Y} stroke="#10b981" strokeWidth="8" style={{ color: '#10b981' }} markerEnd="url(#arrowHeadOptik)" />
              <text x="0" y={img2Y > 0 ? img2Y + 20 : img2Y - 10} fill="#10b981" fontWeight="900" textAnchor="middle" fontSize="16">BAYANGAN AKHIR</text>
            </g>

            <g transform={`translate(${CX1}, ${CY})`}>
              <line x1="0" y1="-150" x2="0" y2="150" stroke="#000" strokeWidth="4" markerStart={getMarkerStart(actualF1)} markerEnd={getMarkerEnd(actualF1)} />
              <text x="0" y="170" fontWeight="900" textAnchor="middle" fontSize="14">LENSA 1 (OBYEKTIF)</text>
              <circle cx={-Math.abs(actualF1) * SCALE} cy="0" r="4" fill="#06b6d4" />
              <text x={-Math.abs(actualF1) * SCALE} y="-10" fontSize="10" fill="#06b6d4" textAnchor="middle">F1</text>
              <circle cx={Math.abs(actualF1) * SCALE} cy="0" r="4" fill="#06b6d4" />
              <text x={Math.abs(actualF1) * SCALE} y="-10" fontSize="10" fill="#06b6d4" textAnchor="middle">F1</text>
            </g>

            <g transform={`translate(${CX2}, ${CY})`}>
              <line x1="0" y1="-180" x2="0" y2="180" stroke="#000" strokeWidth="4" markerStart={getMarkerStart(actualF2)} markerEnd={getMarkerEnd(actualF2)} />
              <text x="0" y="200" fontWeight="900" textAnchor="middle" fontSize="14">LENSA 2 (OKULER)</text>
              <circle cx={-Math.abs(actualF2) * SCALE} cy="0" r="4" fill="#f43f5e" />
              <text x={-Math.abs(actualF2) * SCALE} y="-10" fontSize="10" fill="#f43f5e" textAnchor="middle">F2</text>
              <circle cx={Math.abs(actualF2) * SCALE} cy="0" r="4" fill="#f43f5e" />
              <text x={Math.abs(actualF2) * SCALE} y="-10" fontSize="10" fill="#f43f5e" textAnchor="middle">F2</text>
            </g>
          </svg>
        </div>
      </div>

      <div className="bg-purple-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform rotate-1 text-purple-800 uppercase">
          KONSEP FISIKA: SISTEM LENSA MAJEMUK
        </h3>
        <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/70 p-4 border-2 border-black border-dashed">
          Alat optik seperti Mikroskop dan Teleskop menggunakan kombinasi dua lensa. Prinsip dasarnya: <strong>Bayangan yang dibentuk oleh Lensa 1 bertindak sebagai Benda untuk Lensa 2.</strong>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-rose-700 mb-2 border-b-4 border-black pb-2 uppercase">Persamaan Lensa Tipis</h4>
            <div className="bg-rose-50 p-4 border-2 border-black mb-3">
              <div className="text-2xl font-black text-center font-mono tracking-widest text-slate-800">
                1/f = 1/s + 1/s'
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              <strong>f</strong> = Jarak Fokus (Positif untuk Cembung, Negatif untuk Cekung)<br />
              <strong>s</strong> = Jarak Benda<br />
              <strong>s'</strong> = Jarak Bayangan (Positif = Nyata/Di belakang lensa, Negatif = Maya/Di depan lensa)
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-cyan-700 mb-2 border-b-4 border-black pb-2 uppercase">Perbesaran Total (M)</h4>
            <div className="bg-cyan-50 p-4 border-2 border-black mb-3 flex items-center justify-center">
              <div className="text-2xl font-black text-center font-mono tracking-widest text-slate-800">
                M_total = M1 x M2
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Perbesaran tiap lensa adalah rasio jarak bayangan terhadap jarak benda <strong>(|s'/s|)</strong>. Pada mikroskop, lensa obyektif membentuk bayangan nyata yang diperbesar, kemudian lensa okuler (berfungsi seperti lup) memperbesarnya lagi menjadi bayangan maya yang sangat besar.
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
                      btnClass += userAnswers[qIdx] === oIdx ? "bg-black text-white" : "bg-white text-black hover:bg-purple-200";
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
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-purple-500 text-black font-black py-4 px-10 text-xl md:text-2xl uppercase tracking-widest hover:bg-purple-600 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                CEK JAWABAN SAYA!
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? "LUAR BIASA! PEMAHAMAN OPTIKMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP PEMBIASAN DI ATAS."}
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