import { useState, useCallback } from 'react';

const SUBSTANCES = [
  { name: 'Jus Lemon', ph: 2.0, color: 'bg-rose-100' },
  { name: 'Jus Tomat', ph: 4.0, color: 'bg-orange-100' },
  { name: 'Air Murni', ph: 7.0, color: 'bg-green-100' },
  { name: 'Sabun Tangan', ph: 10.0, color: 'bg-sky-100' },
  { name: 'Pemutih', ph: 12.0, color: 'bg-indigo-100' },
  { name: 'Pembersih', ph: 14.0, color: 'bg-purple-100' },
];

const PH_COLORS = [
  '#ef4444', '#f87171', '#fb923c', '#facc15', '#fde047', '#bef264',
  '#a3e635', '#22c55e', '#34d399', '#2dd4bf', '#38bdf8', '#60a5fa',
  '#818cf8', '#a78bfa', '#c084fc',
];

const quizData = [
  { question: '1. Berapakah nilai pH untuk larutan yang bersifat netral pada suhu kamar?', options: ['0', '7', '14', 'Tidak tentu'], answer: 1 },
  { question: '2. Cairan pembersih saluran biasanya bersifat basa kuat. Manakah pH yang mungkin?', options: ['pH 1', 'pH 5', 'pH 7', 'pH 13'], answer: 3 },
  { question: '3. Jika konsentrasi ion hidrogen [H+] meningkat, maka nilai pH akan...', options: ['Meningkat (lebih basa)', 'Menurun (lebih asam)', 'Tetap sama', 'Menjadi nol'], answer: 1 },
  { question: '4. Jus lemon memiliki pH sekitar 2.0. Ini berarti jus lemon adalah...', options: ['Asam', 'Basa', 'Netral', 'Garam'], answer: 0 },
  { question: '5. Berapakah nilai pH + pOH dalam suatu larutan air?', options: ['0', '7', '10', '14'], answer: 3 },
];

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function getPhColor(ph: number): string {
  const low = Math.floor(ph);
  const high = Math.ceil(ph);
  if (low === high) return PH_COLORS[low] || PH_COLORS[0];

  const fraction = ph - low;
  const c1 = hexToRgb(PH_COLORS[low] || '#22c55e');
  const c2 = hexToRgb(PH_COLORS[high] || '#22c55e');

  const r = Math.round(c1.r + (c2.r - c1.r) * fraction);
  const g = Math.round(c1.g + (c2.g - c1.g) * fraction);
  const b = Math.round(c1.b + (c2.b - c1.b) * fraction);

  return `rgb(${r}, ${g}, ${b})`;
}

export default function SkalaPh() {
  const [ph, setPh] = useState(7.0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const color = getPhColor(ph);

  const hPlus = Math.pow(10, -ph);
  const ohMinus = Math.pow(10, -(14 - ph));

  const hPlusDisplay = hPlus.toExponential(1) + ' M';
  const ohMinusDisplay = ohMinus.toExponential(1) + ' M';

  const statusInfo = {
    text: ph < 6.5 ? 'ASAM' : ph > 7.5 ? 'BASA' : 'NETRAL',
    bgColor: ph < 6.5 ? 'bg-rose-400' : ph > 7.5 ? 'bg-indigo-400' : 'bg-green-400',
    textColor: ph > 7.5 ? 'text-white' : 'text-black',
  };

  const hCount = Math.max(1, Math.round((14 - ph) * 0.8));
  const ohCount = Math.max(1, Math.round(ph * 0.8));

  const handleSubstanceClick = useCallback((substancePh: number) => {
    setPh(substancePh);
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPh(parseFloat(e.target.value));
  }, []);

  const selectAnswer = (qIndex: number, optIndex: number) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[qIndex] = optIndex;
      return newAnswers;
    });
  };

  const calculateScore = () => {
    setQuizSubmitted(true);
    let s = 0;
    userAnswers.forEach((ans, index) => {
      if (ans === quizData[index].answer) s++;
    });
    setScore(s);
  };

  const retryQuiz = () => {
    setUserAnswers(new Array(quizData.length).fill(null));
    setQuizSubmitted(false);
    setScore(0);
  };

  const getScoreMessage = () => {
    if (score === 5) return 'SEMPURNA! PEMAHAMAN pH ANDA SANGAT BAIK.';
    if (score >= 3) return 'CUKUP BAIK. COBA PERHATIKAN LAGI SIMULASINYA.';
    return 'YUK BACA LAGI BAGIAN PENJELASAN KONSEP DI ATAS.';
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black border-2 border-black uppercase">Kimia Larutan</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: SKALA pH
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Mengukur Tingkat Asam-Basa dan Konsentrasi Ion Hidrogen
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30">
            INPUT LARUTAN
          </span>

          <div className="flex flex-col gap-4 mt-2">
            <label className="font-black text-sm uppercase tracking-widest">Pilih Zat Uji:</label>
            <div className="grid grid-cols-2 gap-2">
              {SUBSTANCES.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => handleSubstanceClick(sub.ph)}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg text-xs py-2 font-bold ${sub.color} hover:opacity-80 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`}
                >
                  {sub.name}
                </button>
              ))}
            </div>

            <div className="mt-4 border-t-4 border-black pt-4">
              <label className="font-black text-sm uppercase tracking-widest flex justify-between">
                Atur pH Manual: <span className="text-xl">{ph.toFixed(1)}</span>
              </label>
              <div className="mt-4 mb-2 bg-gradient-to-r from-[#ef4444] via-[#facc15] via-[#22c55e] via-[#38bdf8] to-[#c084fc] border-4 border-black h-10 rounded-lg relative">
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="0.1"
                  value={ph}
                  onChange={handleSliderChange}
                  className="w-full appearance-none bg-transparent cursor-pointer absolute inset-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-10 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[4px_0px_0px_#000]"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-yellow-400 mb-1">KOMPOSISI ION</h4>
            <div className="flex justify-between text-xs font-mono">
              <span>[H+] :</span>
              <span>{hPlusDisplay}</span>
            </div>
            <div className="flex justify-between text-xs font-mono mt-1">
              <span>[OH-] :</span>
              <span>{ohMinusDisplay}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[500px] overflow-hidden">
          <svg viewBox="0 0 400 500" className="w-full h-full relative z-10">
            <line x1="0" y1="100" x2="400" y2="100" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="0" y1="200" x2="400" y2="200" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="0" y1="300" x2="400" y2="300" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="0" y1="400" x2="400" y2="400" stroke="#cbd5e1" strokeWidth="1" />

            <g transform="translate(100, 150)">
              <path d="M 10 300 L 10 100 L 190 100 L 190 300 C 190 310, 10 310, 10 300 Z" fill={color} className="transition-all duration-500" />
              <path d="M 0 0 L 0 300 C 0 330, 200 330, 200 300 L 200 0" fill="none" stroke="#000" strokeWidth="8" strokeLinecap="round" />
              <line x1="200" y1="50" x2="170" y2="50" stroke="#000" strokeWidth="3" />
              <line x1="200" y1="150" x2="170" y2="150" stroke="#000" strokeWidth="3" />
              <line x1="200" y1="250" x2="170" y2="250" stroke="#000" strokeWidth="3" />
            </g>

            <g transform="translate(180, 50)">
              <rect x="0" y="0" width="40" height="200" fill="#334155" stroke="#000" strokeWidth="4" rx="4" />
              <rect x="5" y="10" width="30" height="40" fill="#fff" stroke="#000" strokeWidth="2" />
              <text x="20" y="40" textAnchor="middle" fontSize="16" fontWeight="900" fontFamily="monospace">{ph.toFixed(1)}</text>
              <rect x="15" y="200" width="10" height="50" fill="#94a3b8" stroke="#000" strokeWidth="2" />
            </g>
          </svg>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
            <div className={`${statusInfo.bgColor} px-6 py-2 border-4 border-black shadow-[4px_4px_0px_#000] font-black uppercase text-xl ${statusInfo.textColor}`}>
              {statusInfo.text}
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 left-6 bg-yellow-300 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md -rotate-2 z-30">
            INDIKATOR VISUAL
          </span>

          <div className="mt-4 space-y-6">
            <div className="flex flex-col items-center gap-2">
              <span className="font-black text-xs uppercase text-slate-500">Warna Indikator Universal</span>
              <div
                className="w-full h-24 border-4 border-black shadow-[6px_6px_0px_0px_#000] flex items-center justify-center text-4xl font-black transition-colors duration-500"
                style={{ backgroundColor: color }}
              >
                {Math.round(ph)}
              </div>
            </div>

            <div className="bg-slate-50 border-4 border-black p-4 relative overflow-hidden">
              <span className="font-black text-[10px] uppercase bg-black text-white px-2 py-1 absolute top-0 left-0">Mikroskopis</span>
              <div className="h-32 flex items-center justify-center gap-2 mt-2 overflow-hidden">
                {Array.from({ length: hCount }).map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-black text-[8px] bg-rose-500 text-white animate-bounce"
                    style={{ animationDuration: `${Math.random() * 2 + 1}s` }}
                  >
                    H+
                  </div>
                ))}
                {Array.from({ length: ohCount }).map((_, i) => (
                  <div
                    key={`oh-${i}`}
                    className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-black text-[8px] bg-sky-400 text-white animate-bounce"
                    style={{ animationDuration: `${Math.random() * 2 + 1}s` }}
                  >
                    OH-
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 border-2 border-black p-3 text-xs font-bold leading-tight">
              "Semakin kecil angka pH, semakin tinggi konsentrasi ion H+ (Asam). Setiap perubahan 1 angka pH berarti perubahan konsentrasi 10 kali lipat."
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1">
          PENJELASAN SAINS: APA ITU pH?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-rose-50 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
            <h4 className="font-black text-lg uppercase text-rose-700 border-b-2 border-black pb-1">ASAM (pH &lt; 7)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">Zat yang melepaskan ion Hidrogen (H+) dalam air. Memiliki rasa masam dan dapat merusak logam. Contoh: Aki, Asam Lambung, Cuka.</p>
          </div>

          <div className="bg-green-50 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
            <h4 className="font-black text-lg uppercase text-green-700 border-b-2 border-black pb-1">NETRAL (pH = 7)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">Keseimbangan sempurna antara ion H+ dan OH-. Air murni pada suhu kamar adalah contoh zat netral yang paling stabil.</p>
          </div>

          <div className="bg-indigo-50 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
            <h4 className="font-black text-lg uppercase text-indigo-700 border-b-2 border-black pb-1">BASA (pH &gt; 7)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">Zat yang menerima ion H+ atau melepaskan OH-. Terasa licin di kulit dan biasanya pahit. Contoh: Sabun, Antasida, Amonia.</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">MATEMATIKA pH</h3>
            <p className="text-sm font-bold text-slate-300 mb-4">Nilai pH dihitung menggunakan logaritma negatif dari aktivitas ion hidrogen:</p>
            <div className="bg-white text-black p-4 border-4 border-yellow-400 text-2xl font-mono font-black text-center">
              pH = -log [H+]
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-emerald-400 mb-2">HUBUNGAN [H+] &amp; [OH-]</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dalam larutan air, hasil kali konsentrasi ion hidrogen dan hidroksida selalu konstan pada suhu 25°C (Kw):
              <br /><br />
              <span className="text-lg font-mono">[H+] x [OH-] = 10-14</span>
              <br /><br />
              Oleh karena itu: <span className="font-bold">pH + pOH = 14</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP pH [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIndex) => (
              <div key={qIndex} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
                <h4 className="font-bold mb-3">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, optIndex) => (
                    <button
                      key={optIndex}
                      onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold text-left px-4 py-2 transition-all ${
                        quizSubmitted
                          ? optIndex === q.answer
                            ? 'bg-green-400 text-black'
                            : userAnswers[qIndex] === optIndex
                            ? 'bg-red-400 text-black'
                            : 'bg-white'
                          : userAnswers[qIndex] === optIndex
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!quizSubmitted && userAnswers.every((a) => a !== null) && (
              <button onClick={calculateScore} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-900 text-white font-bold py-3 px-10 text-xl w-full mt-4 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                KIRIM JAWABAN!
              </button>
            )}
          </div>

          {quizSubmitted && (
            <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-3xl font-black text-black mb-2 uppercase">NILAI: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">{getScoreMessage()}</p>
              <br />
              <button onClick={retryQuiz} className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-black text-white font-bold py-3 px-8 text-lg uppercase tracking-wider active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                ULANGI KUIS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}