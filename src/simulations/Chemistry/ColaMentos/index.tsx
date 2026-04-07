import { useState, useEffect, useRef, useCallback } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_DATA: QuizQuestion[] = [
  {
    question: "1. Fenomena menyemburnya soda saat dicampur Mentos merupakan contoh dari reaksi...",
    options: ["Reaksi Kimia (terbentuk zat baru)", "Reaksi Fisika (Nukleasi)", "Reaksi Asam Basa", "Reaksi Nuklir"],
    answer: 1,
  },
  {
    question: "2. Apa fungsi dari permukaan permen Mentos yang berpori-pori mikroskopis dalam eksperimen ini?",
    options: ["Menambah rasa manis pada soda", "Menyerap air soda hingga kering", "Bertindak sebagai situs nukleasi untuk pembentukan gelembung gas CO2 dengan cepat", "Mendinginkan suhu soda secara drastis"],
    answer: 2,
  },
  {
    question: "3. Berdasarkan hasil simulasi, apa yang terjadi pada tinggi semburan geyser jika Anda memanaskan suhu soda (misal ke 45C)?",
    options: ["Semburan menjadi lebih RENDAH", "Semburan menjadi lebih TINGGI", "Tidak ada perubahan", "Botolnya meleleh"],
    answer: 1,
  },
  {
    question: "4. Mengapa soda yang hangat (suhu tinggi) menghasilkan semburan yang lebih dahsyat?",
    options: ["Karena gas CO2 lebih sulit larut dalam air hangat, sehingga ia sangat ingin melepaskan diri", "Karena airnya mendidih", "Karena permennya mencair lebih cepat", "Karena tekanannya menyusut"],
    answer: 0,
  },
  {
    question: "5. Manakah faktor di bawah ini yang TIDAK secara langsung mempengaruhi tinggi semburan Cola dan Mentos?",
    options: ["Jumlah Mentos yang dijatuhkan", "Suhu minuman soda", "Warna label botol soda", "Jumlah gas CO2 yang terlarut dalam soda"],
    answer: 2,
  },
];

export default function ColaMentos() {
  const [mentosCount, setMentosCount] = useState(3);
  const [temperature, setTemperature] = useState(25);
  const [isErupting, setIsErupting] = useState(false);
  const [hasErupted, setHasErupted] = useState(false);
  const [eruptionHeight, setEruptionHeight] = useState(0);
  const [maxEruptionHeight, setMaxEruptionHeight] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'nucleating' | 'erupting' | 'done'>('waiting');

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const nucleationSites = mentosCount * 1500;
  const tempFactor = 0.5 + temperature / 50;
  const pressure = Math.round((mentosCount * 10) * tempFactor * 10);

  const calculateMaxHeight = useCallback(() => {
    const height = Math.min(9.5, (mentosCount * 1.2) * tempFactor);
    return height;
  }, [mentosCount, tempFactor]);

  const handleDrop = () => {
    if (hasErupted || isErupting) return;

    const maxH = calculateMaxHeight();
    setMaxEruptionHeight(maxH);
    setStatus('nucleating');

    setTimeout(() => {
      setIsErupting(true);
      setStatus('erupting');
      startTimeRef.current = 0;
    }, 550);
  };

  const handleReset = () => {
    setHasErupted(false);
    setIsErupting(false);
    setEruptionHeight(0);
    setMaxEruptionHeight(0);
    setStatus('waiting');
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    if (!isErupting) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;

      const maxPx = maxEruptionHeight * 50;
      let currentHeight = 0;

      if (elapsed < 0.5) {
        const progress = elapsed / 0.5;
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentHeight = maxPx * easeOut;
      } else if (elapsed < 1.5) {
        currentHeight = maxPx + Math.sin(elapsed * 20) * 10;
      } else if (elapsed < 3.0) {
        const progress = (elapsed - 1.5) / 1.5;
        const easeIn = progress * progress;
        currentHeight = maxPx * (1 - easeIn);
      } else {
        setIsErupting(false);
        setHasErupted(true);
        setStatus('done');
        setEruptionHeight(0);
        return;
      }

      if (currentHeight < 0) currentHeight = 0;
      setEruptionHeight(currentHeight / 50);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isErupting, maxEruptionHeight]);

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

  const fallingMentos = [];
  for (let i = 0; i < mentosCount; i++) {
    const offsetX = 8 + Math.random() * 4 - 2;
    fallingMentos.push(
      <rect
        key={`mentos-${i}`}
        x={offsetX}
        y={-50 - i * 15}
        width="16"
        height="10"
        rx="5"
        fill="#fff"
        stroke="#94a3b8"
        strokeWidth="2"
        style={{
          transform: hasErupted || isErupting ? 'translateY(450px)' : 'translateY(0)',
          transition: 'transform 0.5s ease-in',
        }}
      />
    );
  }

  const geyserHeightPx = eruptionHeight * 50;
  const bubbles = [];
  if (isErupting && geyserHeightPx > 0) {
    for (let i = 0; i < 20; i++) {
      const bx = Math.random() * 30 - 15;
      const by = -Math.random() * geyserHeightPx;
      bubbles.push(
        <circle
          key={`bubble-${i}`}
          cx={bx}
          cy={by}
          r={2 + Math.random() * 3}
          fill="#facc15"
          opacity="0.6"
        />
      );
    }
  }

  const displayHeight = isErupting ? eruptionHeight.toFixed(1) : hasErupted ? maxEruptionHeight.toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-amber-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform -rotate-3 text-black">
          KIMIA FISIK
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: COLA & MENTOS
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menganalisis Fenomena Nukleasi & Pelepasan Gas CO2
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Parameter Reaksi
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-blue-800 uppercase text-[10px]">Jumlah Mentos</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{mentosCount} Butir</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={mentosCount}
                onChange={(e) => setMentosCount(parseInt(e.target.value))}
                disabled={hasErupted || isErupting}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>1 Butir</span>
                <span>6 Butir</span>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-rose-800 uppercase text-[10px]">Suhu Minuman Soda</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{temperature} C</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value))}
                disabled={hasErupted || isErupting}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Dingin (Kelarutan Gas Tinggi)</span>
                <span>Panas (Gas Mudah Lepas)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4 border-t-4 border-black pt-4">
            <button
              onClick={handleDrop}
              disabled={hasErupted || isErupting}
              className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-rose-500 text-white hover:bg-rose-400 py-4 text-xl font-bold uppercase transition-all active:translate-x-[6px] active:translate-y-[6px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              JATUHKAN MENTOS
            </button>
            <button
              onClick={handleReset}
              disabled={!hasErupted}
              className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-slate-200 text-black hover:bg-slate-300 py-2 text-xs font-bold uppercase transition-all active:translate-x-[6px] active:translate-y-[6px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ganti Botol Baru
            </button>
          </div>
        </div>

        <div className="neo-box bg-[#e0f2fe] p-0 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[500px] overflow-hidden border-8 border-black rounded-xl">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Area Uji Coba
          </span>

          <div className="w-full h-full relative z-10 flex items-end justify-center pb-4">
            <svg viewBox="0 0 300 600" className="w-full h-full overflow-visible">
              <g opacity="0.2">
                <line x1="50" y1="50" x2="300" y2="50" stroke="#000" strokeWidth="2" strokeDasharray="5 5" />
                <text x="40" y="55" fontSize="12" fontWeight="bold" textAnchor="end">8m</text>
                <line x1="50" y1="150" x2="300" y2="150" stroke="#000" strokeWidth="2" strokeDasharray="5 5" />
                <text x="40" y="155" fontSize="12" fontWeight="bold" textAnchor="end">6m</text>
                <line x1="50" y1="250" x2="300" y2="250" stroke="#000" strokeWidth="2" strokeDasharray="5 5" />
                <text x="40" y="255" fontSize="12" fontWeight="bold" textAnchor="end">4m</text>
                <line x1="50" y1="350" x2="300" y2="350" stroke="#000" strokeWidth="2" strokeDasharray="5 5" />
                <text x="40" y="355" fontSize="12" fontWeight="bold" textAnchor="end">2m</text>
              </g>
              <line x1="50" y1="50" x2="50" y2="500" stroke="#000" strokeWidth="4" />

              <g transform="translate(150, 430)">
                <rect x="-20" y="0" width="40" height={geyserHeightPx} fill="#92400e" stroke="#000" strokeWidth="4" rx="10" transform="rotate(180)" />
                {bubbles}
              </g>

              <g transform="translate(150, 500)">
                <path d="M -30 -70 C -30 -100, -15 -110, -10 -130 L 10 -130 C 15 -110, 30 -100, 30 -70 L 30 0 C 30 10, -30 10, -30 0 Z" fill="#1e293b" stroke="#000" strokeWidth="6" />
                <rect x="-30" y="-50" width="60" height="30" fill="#ef4444" stroke="#000" strokeWidth="2" />
                <text x="0" y="-32" fontSize="10" fontWeight="900" fill="#fff" textAnchor="middle" transform="scale(0.8)">DIET COLA</text>
                <rect x="-12" y="-140" width="24" height="10" fill="#cbd5e1" stroke="#000" strokeWidth="4" rx="2" />
              </g>

              <g transform="translate(150, 0)">
                {fallingMentos}
              </g>
            </svg>
          </div>
        </div>

        <div className="neo-box bg-slate-900 text-white p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute -top-4 left-6 bg-emerald-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Sensor Semburan
          </span>

          <div className={`bg-black p-4 border-4 text-center shadow-[4px_4px_0px_0px] mt-2 transition-colors duration-300 ${
            status === 'waiting' ? 'border-emerald-400 shadow-emerald-400' :
            status === 'nucleating' ? 'border-rose-500 shadow-rose-500' :
            status === 'erupting' ? 'border-rose-500 shadow-rose-500' :
            'border-slate-400 shadow-slate-400'
          }`}>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Status Reaksi</span>
            <span className={`font-black text-2xl uppercase ${
              status === 'waiting' ? 'text-white' :
              status === 'nucleating' ? 'text-rose-400' :
              status === 'erupting' ? 'text-rose-400' :
              'text-white'
            }`}>
              {status === 'waiting' ? 'MENUNGGU' :
               status === 'nucleating' ? 'NUKLEASI TERJADI!' :
               status === 'erupting' ? 'MELETUS!' :
               'SELESAI'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs font-mono mt-4">
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400 font-bold uppercase">Situs Nukleasi (Luas Permukaan):</span>
              <span className="text-sky-400 font-black text-lg">{nucleationSites.toLocaleString()} unit</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400 font-bold uppercase">Tekanan Gas CO2 Lepas:</span>
              <span className="text-yellow-400 font-black text-lg">{hasErupted || isErupting ? pressure : 0} kPa</span>
            </div>
            <div className="flex justify-between bg-slate-800 p-2 border-2 border-slate-600 mt-2">
              <span className="text-white font-bold uppercase">Tinggi Semburan Max:</span>
              <span className="text-rose-400 font-black text-2xl">{displayHeight} m</span>
            </div>
          </div>

          <div className="mt-auto p-3 bg-slate-800 border-2 border-dashed border-slate-500 text-center rounded-lg">
            <div className="text-xs font-bold text-slate-300 leading-relaxed">
              Semburan bukan reaksi kimia, melainkan pelepasan gas secara fisik akibat perusakan tegangan permukaan air.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          MENGAPA BISA MENYEMBUR?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sm uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">1. Nukleasi (Fisika, bukan Kimia)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Permukaan Mentos terlihat mulus, tapi di mikroskop penuh dengan lubang-lubang kecil berpori (kawah). Lubang ini menjadi <b>Situs Nukleasi</b> yang sempurna bagi gas CO2 dalam soda untuk berkumpul dan membentuk gelembung secara instan.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sm uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">2. Peran Suhu (Kelarutan Gas)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Gas (seperti CO2) lebih mudah larut dalam air bersuhu <b>dingin</b>. Ketika soda <b>panas/hangat</b>, gas tersebut "ingin" keluar dari cairan. Menjatuhkan Mentos ke soda hangat memicu pelepasan gas yang jauh lebih dahsyat dan cepat!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sm uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">3. Berat Mentos</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Mentos cukup berat untuk tenggelam dengan cepat ke dasar botol. Saat ia jatuh, gelembung CO2 tercipta di sepanjang jalurnya, mendorong cairan di atasnya keluar melewati leher botol yang sempit seperti gunung berapi.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6 rounded-lg">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI PEMAHAMAN [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] rounded-xl">
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
                {score === 5 ? 'Sempurna! Kamu memahami konsep nukleasi dengan sangat baik.' : 'Bagus! Coba bereksperimen lagi dengan suhu soda.'}
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