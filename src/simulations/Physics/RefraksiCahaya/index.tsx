import type { ReactNode } from 'react';
import { useState, useMemo, useCallback } from 'react';

const quizData = [
  {
    question: "1. Cahaya merambat dari Udara (n=1.0) ke Kaca (n=1.5). Sesuai Hukum Snellius, bagaimana arah pembiasan cahayanya?",
    options: ["Lurus tidak berbelok", "Dibelokkan menjauhi garis normal", "Dibelokkan mendekati garis normal", "Dipantulkan seluruhnya kembali ke udara"],
    answer: 2
  },
  {
    question: "2. Syarat utama agar dapat terjadi Pemantulan Sempurna (Total Internal Reflection) adalah...",
    options: ["Cahaya harus dari medium kurang rapat ke medium lebih rapat (contoh: Udara ke Air)", "Cahaya harus dari medium lebih rapat ke medium kurang rapat (contoh: Kaca ke Udara)", "Kedua medium harus memiliki indeks bias yang sama persis", "Sudut datang harus 0 derajat (tegak lurus)"],
    answer: 1
  },
  {
    question: "3. Coba atur Medium 1 = 1.50 (Kaca) dan Medium 2 = 1.00 (Udara). Saat sudut datang (i) diperbesar, pada sudut berapakah cahaya akan dipantulkan sempurna kembali ke dalam kaca?",
    options: ["Sekitar 30°", "Sekitar 42°", "Sekitar 60°", "Sekitar 90°"],
    answer: 1
  },
  {
    question: "4. Di dunia nyata, fenomena Pemantulan Sempurna ini sangat krusial karena digunakan sebagai prinsip dasar kerja teknologi apa?",
    options: ["Kabel Serat Optik (Fiber Optic) untuk internet", "Kaca Spion Mobil", "Lensa Kacamata Minus", "Teleskop Luar Angkasa"],
    answer: 0
  },
  {
    question: "5. Apa yang terjadi jika Indeks Bias Medium 1 persis sama dengan Indeks Bias Medium 2 (misal keduanya n = 1.33)?",
    options: ["Terjadi pemantulan sempurna di semua sudat", "Cahaya akan berhenti merambat", "Cahaya diteruskan lurus tanpa mengalami pembelokan sedikitpun", "Sudut bias menjadi 90 derajat"],
    answer: 2
  }
];

function getMediumName(n: number): string {
  if (n === 1.0) return "Udara";
  if (n >= 1.33 && n <= 1.35) return "Air";
  if (n >= 1.45 && n <= 1.6) return "Kaca";
  if (n > 2.0) return "Berlian";
  return "Fluida X";
}

function getMediumColor(n: number): string {
  const lightness = 95 - ((n - 1.0) / 1.5) * 65;
  return `hsl(200, 70%, ${lightness}%)`;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = angleInDegrees * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.sin(angleInRadians)),
    y: centerY + (radius * Math.cos(angleInRadians))
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, isTop: boolean): string {
  let sA: number, eA: number;
  if (isTop) {
    sA = 180 - endAngle;
    eA = 180 - startAngle;
  } else {
    sA = startAngle;
    eA = endAngle;
  }

  const start = polarToCartesian(x, y, radius, eA);
  const end = polarToCartesian(x, y, radius, sA);
  const largeArcFlag = eA - sA <= 180 ? "0" : "1";

  return `M ${x} ${y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

const CX = 300;
const CY = 250;
const RAY_LENGTH = 250;

export default function RefraksiCahaya(): ReactNode {
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.33);
  const [angleI, setAngleI] = useState(45);
  const [showAngles, setShowAngles] = useState(true);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const physics = useMemo(() => {
    const radI = angleI * Math.PI / 180;
    const sinR = (n1 / n2) * Math.sin(radI);

    let isTIR = false;
    let angleR = 0;
    let radR = 0;

    if (sinR >= 1.0) {
      isTIR = true;
    } else {
      radR = Math.asin(sinR);
      angleR = radR * 180 / Math.PI;
    }

    let criticalAngle: number | null = null;
    if (n1 > n2) {
      const critRad = Math.asin(n2 / n1);
      criticalAngle = critRad * 180 / Math.PI;
    }

    return { radI, radR, angleR, isTIR, criticalAngle };
  }, [n1, n2, angleI]);

  const getStatus = useCallback(() => {
    if (physics.isTIR) {
      return { text: "PEMANTULAN SEMPURNA (TIR)", color: "text-rose-400", border: "border-rose-500" };
    }
    if (n1 > n2) {
      return { text: "DIBIASKAN MENJAUHI NORMAL", color: "text-yellow-400", border: "border-yellow-500" };
    }
    if (n1 < n2) {
      return { text: "DIBIASKAN MENDEKATI NORMAL", color: "text-sky-400", border: "border-sky-500" };
    }
    return { text: "CAHAYA DITERUSKAN LURUS", color: "text-slate-400", border: "border-slate-500" };
  }, [physics.isTIR, n1, n2]);

  const status = getStatus();

  const incX = CX - RAY_LENGTH * Math.sin(physics.radI);
  const incY = CY - RAY_LENGTH * Math.cos(physics.radI);

  const laserDist = RAY_LENGTH - 20;
  const lx = CX - laserDist * Math.sin(physics.radI);
  const ly = CY - laserDist * Math.cos(physics.radI);

  const reflX = CX + RAY_LENGTH * Math.sin(physics.radI);
  const reflY = CY - RAY_LENGTH * Math.cos(physics.radI);

  const refX = CX + RAY_LENGTH * Math.sin(physics.radR);
  const refY = CY + RAY_LENGTH * Math.cos(physics.radR);

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
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">FISIKA OPTIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: REFRAKSI CAHAYA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Hukum Snellius & Pemantulan Sempurna (Total Internal Reflection)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Parameter Optik
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-800 uppercase text-[10px]">Indeks Bias Medium 1 (n₁)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{n1.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={n1}
                onChange={(e) => setN1(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Udara (1.0)</span>
                <span>Berlian (2.4)</span>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-cyan-800 uppercase text-[10px]">Indeks Bias Medium 2 (n₂)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{n2.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={n2}
                onChange={(e) => setN2(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Udara (1.0)</span>
                <span>Berlian (2.4)</span>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Sudut Datang (θ₁)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{angleI}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="89"
                step="1"
                value={angleI}
                onChange={(e) => setAngleI(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-100 p-3 border-4 border-black mt-2">
              <span className="font-black text-xs uppercase text-slate-700">Tampilkan Busur Sudut</span>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={showAngles}
                  onChange={(e) => setShowAngles(e.target.checked)}
                  className="opacity-0 w-0 h-0 peer"
                />
                <span className="absolute cursor-pointer inset-0 bg-white border-2 border-black rounded-full transition-colors duration-300 peer-checked:bg-emerald-400 before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-0.5 before:bg-black before:rounded-full before:transition-transform peer-checked:before:translate-x-6"></span>
              </label>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">DATA SENSOR OPTIK</h4>
            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                <span className="text-slate-400">Sudut Bias (θ₂):</span>
                <span className="text-sky-400 font-bold text-lg">{physics.isTIR ? "-" : physics.angleR.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                <span className="text-slate-400">Sudut Pantul (θᵣ):</span>
                <span className="text-rose-400 font-bold text-lg">{angleI.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white font-bold">Sudut Kritis (θc):</span>
                <span className="text-yellow-400 font-black text-lg">{physics.criticalAngle ? physics.criticalAngle.toFixed(1) + "°" : "-"}</span>
              </div>
            </div>

            <div className={`mt-4 p-2 bg-slate-800 border-2 border-dashed ${status.border} text-center`}>
              <div className={`text-[11px] font-black ${status.color} uppercase leading-tight`}>{status.text}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden border-8 border-black">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Visualisasi Antarmuka Medium
          </span>

          <div className="absolute top-6 right-6 z-20 text-right">
            <div className="bg-white/90 px-3 py-1 border-2 border-black font-bold text-xs uppercase shadow-[2px_2px_0px_#000] mb-1 inline-block">
              Medium 1 <span className="text-blue-600">({getMediumName(n1)})</span>
            </div>
          </div>
          <div className="absolute bottom-6 right-6 z-20 text-right">
            <div className="bg-white/90 px-3 py-1 border-2 border-black font-bold text-xs uppercase shadow-[2px_2px_0px_#000] inline-block">
              Medium 2 <span className="text-cyan-600">({getMediumName(n2)})</span>
            </div>
          </div>

          <div className="w-full h-full relative z-10 flex items-center justify-center">
            <svg viewBox="0 0 600 500" className="w-full h-full overflow-visible">
              <defs>
                <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" stroke-width="0.5"/>
                </pattern>
              </defs>

              <rect x="0" y="0" width="600" height="250" fill={getMediumColor(n1)} className="transition-all duration-300" />
              <rect x="0" y="250" width="600" height="250" fill={getMediumColor(n2)} className="transition-all duration-300" />

              <rect x="0" y="0" width="600" height="500" fill="url(#gridPattern)" opacity="0.5" pointer-events="none"/>

              <line x1="0" y1="250" x2="600" y2="250" stroke="#000" stroke-width="4" />

              <line x1="300" y1="50" x2="300" y2="450" stroke="#64748b" stroke-width="2" stroke-dasharray="10 5" />
              <text x="310" y="70" fontSize="12" fontWeight="bold" fill="#64748b">Garis Normal</text>

              {showAngles && angleI > 0 && (
                <>
                  <path d={describeArc(CX, CY, 60, 0, angleI, true)} fill="none" stroke="#f43f5e" stroke-width="2" opacity="0.5" />
                  <text x={CX - 35 * Math.sin(physics.radI / 2)} y={CY - 35 * Math.cos(physics.radI / 2)} fontSize="14" fontWeight="900" fill="#e11d48" opacity="1">i</text>
                </>
              )}

              {showAngles && !physics.isTIR && angleI > 0 && (
                <>
                  <path d={describeArc(CX, CY, 60, 0, physics.angleR, false)} fill="none" stroke="#22c55e" stroke-width="2" opacity="0.5" />
                  <text x={CX + 35 * Math.sin(physics.radR / 2)} y={CY + 35 * Math.cos(physics.radR / 2)} fontSize="14" fontWeight="900" fill="#15803d" opacity="1">r</text>
                </>
              )}

              {showAngles && physics.isTIR && (
                <>
                  <path d={`M ${CX} ${CY} L ${polarToCartesian(CX, CY, 50, 180).x} ${polarToCartesian(CX, CY, 50, 180).y} A 50 50 0 0 1 ${polarToCartesian(CX, CY, 50, 180 + angleI).x} ${polarToCartesian(CX, CY, 50, 180 + angleI).y} Z`} fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.5" />
                  <text x={CX + 25 * Math.sin(physics.radI / 2)} y={CY - 25 * Math.cos(physics.radI / 2)} fontSize="14" fontWeight="900" fill="#1d4ed8" opacity="1">r&apos;</text>
                </>
              )}

              <line x1={incX} y1={incY} x2={CX} y2={CY} stroke="#ef4444" stroke-width="6" className="filter drop-shadow-[0_0_8px_#ef4444] drop-shadow-[0_0_12px_#f43f5e]" strokeLinecap="round" />

              {!physics.isTIR && (
                <line x1={CX} y1={CY} x2={refX} y2={refY} stroke="#ef4444" stroke-width="6" className="filter drop-shadow-[0_0_8px_#ef4444] drop-shadow-[0_0_12px_#f43f5e]" strokeLinecap="round" opacity="1" />
              )}

              <line x1={CX} y1={CY} x2={reflX} y2={reflY} stroke="#ef4444" stroke-width={physics.isTIR ? 6 : 4} className="filter drop-shadow-[0_0_8px_#ef4444] drop-shadow-[0_0_12px_#f43f5e]" strokeLinecap="round" opacity={physics.isTIR ? 1 : 0.2} />

              <g transform={`translate(${lx}, ${ly}) rotate(${angleI})`}>
                <rect x="-25" y="-15" width="50" height="30" fill="#1e293b" stroke="#000" stroke-width="3" rx="4" />
                <rect x="25" y="-5" width="10" height="10" fill="#f43f5e" stroke="#000" stroke-width="2" />
                <circle cx="-10" cy="0" r="5" fill="#facc15" />
              </g>
            </svg>
          </div>

          <div className="absolute bottom-4 left-4 bg-white px-4 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000]">
            Sumber Cahaya (Laser)
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          KONSEP FISIKA: PEMBIASAN & HUKUM SNELLIUS 📐
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Mengapa Cahaya Membelok?</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Ketika cahaya merambat dari satu medium ke medium lain yang berbeda kerapatannya, <b>kecepatannya berubah</b>. Jika memasuki medium yang lebih rapat (indeks bias n lebih besar), cahaya melambat dan arahnya <b>dibelokkan mendekati garis normal</b>.
            </p>
            <div className="bg-sky-50 border border-sky-200 p-2 mt-2 text-xs font-bold text-sky-800 text-center">
              n₁ &lt; n₂ → Sudut Bias (r) &lt; Sudut Datang (i)
            </div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Pemantulan Sempurna (TIR)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Jika cahaya bergerak dari medium <b>rapat ke kurang rapat</b> (n₁ &gt; n₂), ia membelok menjauhi garis normal. Jika sudut datang terus diperbesar, suatu saat sudut bias akan mencapai 90° (menyusuri permukaan). Sudut datang pada saat itu disebut <b>Sudut Kritis</b>. Jika melebihi sudut kritis, seluruh cahaya dipantulkan kembali!
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">PERSAMAAN HUKUM SNELLIUS</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-3xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e]">
              n₁ × sin(i) = n₂ × sin(r)
            </div>
            <p className="text-center mt-4 text-sm font-bold text-slate-300">
              Syarat Sudut Kritis (θc): <br />
              <span className="text-emerald-400 font-mono text-xl bg-slate-800 px-3 py-1 border border-slate-600 inline-block mt-2">sin(θc) = n₂ / n₁</span> (dimana n₁ &gt; n₂)
            </p>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">KETERANGAN BESARAN</h4>
            <ul className="text-[11px] font-bold space-y-2 uppercase">
              <li><span className="text-blue-400">n₁, n₂</span> = Indeks Bias Medium 1 & Medium 2</li>
              <li><span className="text-rose-400">i</span> = Sudut Datang (Diukur dari Garis Normal)</li>
              <li><span className="text-green-400">r</span> = Sudut Bias (Refraksi)</li>
              <li className="pt-2 text-slate-400 normal-case italic">Semakin besar Indeks Bias (n), semakin rapat secara optik medium tersebut. Air (n≈1.33), Kaca (n≈1.5), Intan (n≈2.4).</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI OPTIKA GEOMETRI [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000] mb-4">
                <h4 className="font-bold mb-3 text-sm uppercase tracking-tight">{q.question}</h4>
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
                  {score === 5 ? "Luar biasa! Pemahaman optika Anda sangat tajam." : "Bagus! Coba geser-geser lagi indeks bias mediumnya."}
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