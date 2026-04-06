import { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

const quizData = [
  { question: '1. Jika sebuah pizza dipotong menjadi 8 bagian sama besar, angka 8 tersebut disebut sebagai apa?', options: ['Pembilang', 'Penyebut', 'Hasil bagi', 'Persentase'], answer: 1 },
  { question: '2. Andi mengambil 3 potong dari pizza yang dipotong 4. Bagaimana bentuk pecahannya?', options: ['4/3', '1/4', '3/4', '3/1'], answer: 2 },
  { question: '3. Manakah nilai pecahan yang setara dengan setengah (1/2) pizza?', options: ['2/8', '4/8', '1/4', '3/4'], answer: 1 },
  { question: '4. Jika pembilang sama dengan penyebut (misal 6/6), maka nilai pizza tersebut adalah...', options: ['Kosong', 'Setengah', 'Satu (Utuh)', 'Enam'], answer: 2 },
  { question: '5. Manakah yang nilainya PALING KECIL?', options: ['1/2', '1/4', '1/8', '1/12'], answer: 3 },
];

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0);
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, denominator: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  if (denominator === 1) {
    return `M ${x - radius} ${y} A ${radius} ${radius} 0 1 0 ${x + radius} ${y} A ${radius} ${radius} 0 1 0 ${x - radius} ${y}`;
  }

  return ['M', x, y, 'L', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y, 'Z'].join(' ');
}

export default function PizzaPecahan() {
  const [denominator, setDenominator] = useState(4);
  const [selectedSlices, setSelectedSlices] = useState<boolean[]>([true, false, false, false]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleDenominatorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDenom = parseInt(e.target.value);
    setDenominator(newDenom);
    setSelectedSlices((prev) => {
      if (prev.length < newDenom) {
        return [...prev, ...Array(newDenom - prev.length).fill(false)];
      }
      return prev.slice(0, newDenom);
    });
  }, []);

  const toggleSlice = useCallback((index: number) => {
    setSelectedSlices((prev) => {
      const newSlices = [...prev];
      newSlices[index] = !newSlices[index];
      return newSlices;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedSlices((prev) => prev.map(() => true));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedSlices((prev) => prev.map(() => false));
  }, []);

  const numerator = selectedSlices.filter((s) => s).length;
  const decimal = numerator / denominator;
  const percent = Math.round(decimal * 100);

  const angleStep = 360 / denominator;

  const slices = useMemo(() => {
    return Array.from({ length: denominator }, (_, i) => {
      const startAngle = i * angleStep;
      const endAngle = (i + 1) * angleStep;
      const isSelected = selectedSlices[i];

      const crustPath = describeArc(50, 50, 45, startAngle, endAngle, denominator);
      const innerPath = describeArc(50, 50, 40, startAngle, endAngle, denominator);

      const numToppings = Math.max(1, Math.floor(6 / (denominator / 4)));
      const toppings: ReactNode[] = [];

      if (isSelected) {
        for (let j = 0; j < numToppings; j++) {
          const randomOffset = Math.random() * 0.6 + 0.2;
          const centerAngle = (i + randomOffset) * angleStep;
          const rad = ((centerAngle - 90) * Math.PI) / 180;
          const dist = 10 + Math.random() * 25;
          const cx = 50 + dist * Math.cos(rad);
          const cy = 50 + dist * Math.sin(rad);

          toppings.push(
            <circle
              key={`pepperoni-${j}`}
              cx={cx}
              cy={cy}
              r="2.5"
              fill="#be123c"
              stroke="#7f1d1d"
              strokeWidth="0.3"
              style={{ pointerEvents: 'none' }}
            />
          );

          if (Math.random() > 0.5) {
            toppings.push(
              <rect
                key={`herb-${j}`}
                x={cx + 2}
                y={cy - 2}
                width="1"
                height="1.5"
                fill="#15803d"
                transform={`rotate(${Math.random() * 360}, ${cx + 2}, ${cy - 2})`}
                style={{ pointerEvents: 'none' }}
              />
            );
          }
        }
      }

      return (
        <g key={i} className="cursor-pointer transition-all hover:brightness-105 hover:scale-[1.02]" onClick={() => toggleSlice(i)}>
          <path d={crustPath} fill={isSelected ? '#b45309' : '#e2e8f0'} stroke="#000" strokeWidth="0.8" />
          <path d={innerPath} fill={isSelected ? '#fbbf24' : '#f1f5f9'} stroke={isSelected ? '#d97706' : '#cbd5e1'} strokeWidth="0.4" />
          {toppings}
        </g>
      );
    });
  }, [denominator, angleStep, selectedSlices, toggleSlice]);

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
    if (score === 5) return 'SEMPURNA! PEMAHAMAN PECAHAN ANDA SANGAT BAIK.';
    if (score >= 3) return 'CUKUP BAIK. TERUSLATIH DENGAN PIZZA!';
    return 'YUK BACA LAGI BAGIAN PENJELASAN KONSEP DI ATAS.';
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-orange-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black border-2 border-black">MATEMATIKA DASAR</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: PECAHAN PIZZA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Visualisasi Bagian dari Keseluruhan (Pembilang & Penyebut)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30">
            DAPUR PECAHAN
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-yellow-800 uppercase text-sm">Potongan Pizza (Penyebut)</span>
                <span className="font-mono font-black text-xl bg-white px-2 border-2 border-black">{denominator}</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={denominator}
                onChange={handleDenominatorChange}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                <span>1 Potong</span>
                <span>12 Potong</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="font-black text-xs uppercase text-slate-500">Aksi Cepat:</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={selectAll} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-emerald-400 py-2 text-xs font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  Pilih Semua
                </button>
                <button onClick={clearAll} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-rose-400 py-2 text-xs font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  Kosongkan
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Pecahan</span>
              <div className="flex flex-col items-center font-mono font-black text-3xl">
                <span className="text-orange-400">{numerator}</span>
                <div className="h-1 bg-white w-12 my-1"></div>
                <span>{denominator}</span>
              </div>
            </div>
            <div className="h-16 w-1 bg-slate-700"></div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Nilai</span>
              <div className="text-xl font-black text-emerald-400">{decimal.toFixed(2)}</div>
              <div className="text-sm font-bold text-sky-400">{percent}%</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-200 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-2 z-30 uppercase">
            Meja Saji Pizza
          </span>

          <div className="relative w-full max-w-[500px] aspect-square z-10 p-8">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              <defs>
                <filter id="toppingShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
                  <feOffset dx="0.5" dy="0.5" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx="50" cy="53" r="46" fill="rgba(0,0,0,0.15)" />
              <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#000" strokeWidth="2" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="1" />

              {slices}
            </svg>
          </div>

          <div className="absolute bottom-6 text-center bg-black text-white px-4 py-2 border-4 border-white font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_#facc15]">
            Klik pada potongan pizza untuk mengambil atau menaruh!
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1">
          APA ITU PECAHAN?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-orange-600 border-b-2 border-black pb-1 mb-2">Pembilang (Atas)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Angka yang berada di bagian atas. Ini menunjukkan <b>berapa banyak bagian</b> (potongan pizza) yang kita miliki atau yang kita pilih.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-slate-700 border-b-2 border-black pb-1 mb-2">Penyebut (Bawah)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Angka yang berada di bagian bawah. Ini menunjukkan <b>total seluruh potongan</b> yang ada dalam satu buah pizza utuh.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            TANTANGAN PECAHAN [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIndex) => (
              <div key={qIndex} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
                <h4 className="font-bold mb-3 text-sm uppercase tracking-tight">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, optIndex) => (
                    <button
                      key={optIndex}
                      onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold text-left px-4 py-2 text-xs transition-all ${
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
                SERAHKAN JAWABAN!
              </button>
            )}
          </div>

          {quizSubmitted && (
            <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-3xl font-black text-black mb-2 uppercase">NILAI AKHIR: {score} / 5</h4>
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