import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';

const polyNames: Record<number, string> = {
  3: "Segitiga Sama Sisi (Trigon)",
  4: "Persegi (Tetragon)",
  5: "Segilima (Pentagon)",
  6: "Segienam (Heksagon)",
  7: "Segitujuh (Heptagon)",
  8: "Segidelapan (Oktagon)",
  9: "Sembilan Sisi (Nonagon)",
  10: "Sepuluh Sisi (Dekagon)",
  11: "Sebelas Sisi (Hendekagon)",
  12: "Dua Belas Sisi (Dodekagon)",
  20: "Dua Puluh Sisi (Ikosagon)"
};

function getPolyName(n: number): string {
  return polyNames[n] || `Poligon-${n} Sisi`;
}

const quizData = [
  { 
    question: "1. Berapakah total jumlah sudut dalam pada sebuah segitiga (n = 3)?", 
    options: ["90 derajat", "180 derajat", "360 derajat", "Tergantung ukuran segitiganya"], 
    answer: 1 
  },
  { 
    question: "2. Poligon beraturan dengan 8 sisi dinamakan...", 
    options: ["Pentagon", "Heksagon", "Heptagon", "Oktagon"], 
    answer: 3 
  },
  { 
    question: "3. Berapakah jumlah garis diagonal yang dimiliki oleh sebuah Segitiga?", 
    options: ["0 (Nol)", "1", "3", "Sama dengan jumlah sisinya"], 
    answer: 0 
  },
  { 
    question: "4. Sesuai rumus (n-2) × 180°, berapakah total sudut dalam dari sebuah Segiempat (n = 4)?", 
    options: ["180°", "270°", "360°", "400°"], 
    answer: 2 
  },
  { 
    question: "5. Semakin banyak jumlah sisi (n) yang ditambahkan pada sebuah poligon beraturan, maka bentuknya akan semakin menyerupai...", 
    options: ["Segitiga", "Bintang", "Lingkaran", "Persegi Panjang"], 
    answer: 2 
  }
];

export default function PoligonInteraktif(): ReactNode {
  const [sides, setSides] = useState(3);
  const [radius, setRadius] = useState(150);
  const [showDiagonals, setShowDiagonals] = useState(false);
  const [showCircle, setShowCircle] = useState(false);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const sumAngle = (sides - 2) * 180;
  const intAngle = sumAngle / sides;
  const extAngle = 360 / sides;
  const diagonals = (sides * (sides - 3)) / 2;

  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const step = (Math.PI * 2) / sides;
    const offset = -Math.PI / 2;
    
    for (let i = 0; i < sides; i++) {
      const angle = offset + i * step;
      pts.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      });
    }
    return pts;
  }, [sides, radius]);

  const pointsStr = points.map(p => `${p.x},${p.y}`).join(" ");

  const diagonalLines = useMemo(() => {
    if (!showDiagonals || sides <= 3) return [];
    
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < sides; i++) {
      for (let j = i + 2; j < sides; j++) {
        if (i === 0 && j === sides - 1) continue;
        lines.push({
          x1: points[i].x,
          y1: points[i].y,
          x2: points[j].x,
          y2: points[j].y
        });
      }
    }
    return lines;
  }, [showDiagonals, sides, points]);

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

  const fmt = (num: number) => Number.isInteger(num) ? num : num.toFixed(2);

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">MATEMATIKA GEOMETRI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: POLIGON BERATURAN
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Mengeksplorasi Sifat, Sudut, dan Diagonal Segi-n
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Panel Bentuk
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-blue-800 uppercase text-[10px]">Jumlah Sisi (n)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{sides}</span>
              </div>
              <input
                type="range"
                min="3"
                max="20"
                step="1"
                value={sides}
                onChange={(e) => setSides(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Segitiga (3)</span>
                <span>Ikosagon (20)</span>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-rose-800 uppercase text-[10px]">Ukuran (Jari-jari Luar)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{radius} px</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="flex flex-col gap-3 mt-2 border-t-4 border-black pt-4">
              <div className="flex justify-between items-center bg-slate-100 p-3 border-2 border-black">
                <span className="font-black text-[10px] uppercase">Tampilkan Garis Diagonal</span>
                <label className="relative inline-block w-[50px] h-[28px]">
                  <input
                    type="checkbox"
                    checked={showDiagonals}
                    onChange={(e) => setShowDiagonals(e.target.checked)}
                    className="opacity-0 w-0 h-0"
                  />
                  <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 border-3 border-black transition-all rounded-full ${showDiagonals ? 'bg-emerald-400' : 'bg-white'}`}>
                    <span className={`absolute content-[''] h-4 w-4 left-[3px] bottom-[3px] bg-black transition-all rounded-full ${showDiagonals ? 'translate-x-[22px]' : ''}`}></span>
                  </span>
                </label>
              </div>
              <div className="flex justify-between items-center bg-slate-100 p-3 border-2 border-black">
                <span className="font-black text-[10px] uppercase">Lingkaran Luar (Circumcircle)</span>
                <label className="relative inline-block w-[50px] h-[28px]">
                  <input
                    type="checkbox"
                    checked={showCircle}
                    onChange={(e) => setShowCircle(e.target.checked)}
                    className="opacity-0 w-0 h-0"
                  />
                  <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 border-3 border-black transition-all rounded-full ${showCircle ? 'bg-emerald-400' : 'bg-white'}`}>
                    <span className={`absolute content-[''] h-4 w-4 left-[3px] bottom-[3px] bg-black transition-all rounded-full ${showCircle ? 'translate-x-[22px]' : ''}`}></span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[500px] overflow-hidden border-8 border-black">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Kanvas Geometri
          </span>

          <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
            <svg viewBox="0 0 500 500" className="w-full h-full overflow-visible">
              <defs>
                <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="500" height="500" fill="url(#grid)" />

              <line x1="0" y1="250" x2="500" y2="250" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />
              <line x1="250" y1="0" x2="250" y2="500" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />

              <g transform="translate(250, 250)">
                {showCircle && (
                  <circle cx={0} cy={0} r={radius} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="8 4" />
                )}
                
                {diagonalLines.map((line, i) => (
                  <line
                    key={i}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="#f43f5e"
                    strokeWidth="1"
                    opacity={sides > 10 ? 0.2 : 0.5}
                  />
                ))}

                <polygon
                  points={pointsStr}
                  fill="#facc15"
                  fillOpacity="0.5"
                  stroke="#000"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                
                <circle cx={0} cy={0} r="4" fill="#000" />
                
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="#ef4444"
                    stroke="#000"
                    strokeWidth="2"
                  />
                ))}
              </g>
            </svg>
          </div>
          
          <div className="absolute bottom-6 bg-white px-4 py-2 border-2 border-black font-bold text-[12px] shadow-[4px_4px_0px_#000] z-20 text-center uppercase">
            {getPolyName(sides)}
          </div>
        </div>

        <div className="bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 left-6 bg-emerald-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Analisis Matematis
          </span>

          <div className="mt-4 flex flex-col gap-3 font-mono">
            <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-400">Total Sudut Dalam:</span>
              <span className="text-yellow-400 font-black text-xl">{sumAngle}°</span>
            </div>
            
            <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-400">Satu Sudut Dalam:</span>
              <span className="text-emerald-400 font-black text-xl">{fmt(intAngle)}°</span>
            </div>

            <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-400">Sudut Luar / Pusat:</span>
              <span className="text-sky-400 font-black text-xl">{fmt(extAngle)}°</span>
            </div>

            <div className="bg-slate-800 p-3 border-2 border-rose-500 flex justify-between items-center mt-2 shadow-[2px_2px_0px_0px_#f43f5e]">
              <span className="text-xs font-bold uppercase text-rose-200">Jumlah Diagonal:</span>
              <span className="text-rose-400 font-black text-3xl">{diagonals}</span>
            </div>
          </div>

          <div className="mt-auto bg-white text-black p-4 border-4 border-black text-center shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-xs uppercase text-slate-500 mb-2 border-b-2 border-black pb-1">PAPAN RUMUS</h4>
            <div className="grid grid-cols-1 gap-2 text-[10px] font-bold font-mono text-left">
              <div>Σ Sudut Dalam = (n - 2) × 180°</div>
              <div>1 Sudut Dalam = Σ / n</div>
              <div>1 Sudut Luar = 360° / n</div>
              <div className="text-rose-600 border-t-2 border-dashed border-black pt-1 mt-1">Diagonal = n × (n - 3) / 2</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          MEMAHAMI POLIGON BERATURAN 🛑
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Definisi</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Poligon beraturan adalah bangun datar tertutup yang memiliki <b>semua sisi sama panjang</b> (ekuilateral) dan <b>semua sudut dalam sama besar</b> (ekiangular).
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Mendekati Lingkaran</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Coba geser slider ke n = 20. Anda akan melihat bahwa semakin banyak sisinya, bentuk poligon beraturan akan <b>semakin menyerupai sebuah lingkaran</b> yang sempurna.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-purple-600 border-b-2 border-black pb-1 mb-2">Garis Diagonal</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Garis diagonal adalah garis yang menghubungkan dua titik sudut yang tidak saling bersebelahan. Segitiga tidak memiliki diagonal, tetapi bentuk dengan sisi banyak memiliki diagonal yang sangat banyak!
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI GEOMETRI [KUIS]
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
                <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {score === 5 ? "Sempurna! Pemahaman geometri Anda sangat baik." : "Bagus! Coba mainkan lagi slider di atas."}
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