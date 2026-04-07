import { useState, useMemo } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_DATA: QuizQuestion[] = [
  {
    question: "1. Pada rangkaian SERI, jika kita menambah jumlah lampu, apa yang akan terjadi pada nyala setiap lampunya?",
    options: ["Semakin terang", "Semakin redup", "Tetap sama", "Mati"],
    answer: 1,
  },
  {
    question: "2. Nilai tegangan (Volt) pada setiap cabang dalam rangkaian PARALEL adalah...",
    options: ["Berbeda-beda tergantung posisi", "Sama besar dengan tegangan sumber baterai", "Terbagi rata sejumlah cabang", "Menjadi nol"],
    answer: 1,
  },
  {
    question: "3. Mengapa instalasi listrik di rumah kita menggunakan sistem rangkaian PARALEL, bukan SERI?",
    options: ["Agar hemat kabel", "Karena lebih mudah dipasang", "Agar jika satu lampu dimatikan, lampu ruangan lain tetap bisa menyala (arus tidak terputus)", "Agar tegangan menurun"],
    answer: 2,
  },
  {
    question: "4. Berdasarkan Hukum Ohm (V = I x R), jika tegangan baterai (V) dinaikkan sedangkan hambatan (R) tetap, maka kuat arus (I) akan...",
    options: ["Mengecil", "Membesar", "Tetap konstan", "Menjadi negatif"],
    answer: 1,
  },
  {
    question: "5. Pada simulasi rangkaian PARALEL 2 Lampu, coba lihat 'Arus Total Sistem (I_tot)'. Dari mana asalnya angka tersebut?",
    options: ["Pengurangan arus cabang 1 dan 2", "Perkalian tegangan dan hambatan", "Penjumlahan arus dari cabang lampu 1 dan arus cabang lampu 2 (Hukum Kirchhoff I)", "Hanya kebetulan"],
    answer: 2,
  },
];

const R_BULB = 10;

export default function RangkaianListrik() {
  const [circuitType, setCircuitType] = useState<'series' | 'parallel'>('series');
  const [voltage, setVoltage] = useState(12);
  const [numBulbs, setNumBulbs] = useState(2);
  const [isSwitchOn, setIsSwitchOn] = useState(true);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const calculations = useMemo(() => {
    let R_tot = 0;
    let I_tot = 0;
    const bulbData: { v: number; i: number; p: number }[] = [];

    if (circuitType === 'series') {
      R_tot = numBulbs * R_BULB;
      I_tot = isSwitchOn && voltage > 0 ? voltage / R_tot : 0;

      for (let i = 0; i < numBulbs; i++) {
        const i_bulb = I_tot;
        const v_bulb = i_bulb * R_BULB;
        const p_bulb = v_bulb * i_bulb;
        bulbData.push({ v: v_bulb, i: i_bulb, p: p_bulb });
      }
    } else {
      R_tot = R_BULB / numBulbs;
      I_tot = isSwitchOn && voltage > 0 ? voltage / R_tot : 0;

      for (let i = 0; i < numBulbs; i++) {
        const v_bulb = isSwitchOn ? voltage : 0;
        const i_bulb = v_bulb / R_BULB;
        const p_bulb = v_bulb * i_bulb;
        bulbData.push({ v: v_bulb, i: i_bulb, p: p_bulb });
      }
    }

    return { R_tot, I_tot, bulbData };
  }, [circuitType, voltage, numBulbs, isSwitchOn]);

  const { R_tot, I_tot, bulbData } = calculations;

  const animDuration = Math.max(0.2, Math.min(3, 1.5 / Math.max(I_tot, 0.01)));

  const renderSeriesCircuit = () => {
    const startX = 150;
    const endX = 400;
    const spacing = (endX - startX) / (numBulbs + 1);
    const elements: React.ReactNode[] = [];

    for (let i = 1; i <= numBulbs; i++) {
      const bx = startX + i * spacing;
      const brightness = bulbData[i - 1]?.p / 30 || 0;
      const bulbBrightness = Math.min(1, brightness);

      elements.push(
        <g key={`bulb-${i}`} transform={`translate(${bx}, 60)`}>
          <circle cx="0" cy="0" r="25" fill={isSwitchOn && voltage > 0 && bulbBrightness > 0.1 ? '#fef08a' : '#ffffff'} stroke="#000" strokeWidth="4" />
          <circle cx="0" cy="0" r="40" fill="url(#glowGrad)" opacity={isSwitchOn && voltage > 0 ? bulbBrightness.toFixed(2) : 0} />
          <path d="M -10 25 L -5 5 L 5 5 L 10 25" fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
          <rect x="-15" y="25" width="30" height="15" fill="#94a3b8" stroke="#000" strokeWidth="4" />
          <rect x="-10" y="40" width="20" height="10" fill="#475569" stroke="#000" strokeWidth="4" />
          <text x="35" y="5" fontSize="12" fontWeight="900" fill="#000">L{i}</text>
        </g>
      );
    }

    return elements;
  };

  const renderParallelCircuit = () => {
    const startX = 200;
    const spacing = 70;
    const elements: React.ReactNode[] = [];

    for (let i = 1; i <= numBulbs; i++) {
      const bx = startX + (i - 1) * spacing;
      const brightness = bulbData[i - 1]?.p / 30 || 0;
      const bulbBrightness = Math.min(1, brightness);

      elements.push(
        <g key={`parallel-bulb-${i}`}>
          <path d={`M ${bx} 100 L ${bx} 400`} fill="none" stroke="#000" strokeWidth="6" />
          <path
            d={`M ${bx} 100 L ${bx} 400`}
            fill="none"
            stroke="#facc15"
            strokeWidth="4"
            className="animate-pulse"
            style={{
              strokeDasharray: '12 12',
              opacity: isSwitchOn && voltage > 0 ? 1 : 0,
              animation: `dash ${animDuration}s linear infinite`,
            }}
          />
          <g transform={`translate(${bx}, 210)`}>
            <circle cx="0" cy="0" r="25" fill={isSwitchOn && voltage > 0 && bulbBrightness > 0.1 ? '#fef08a' : '#ffffff'} stroke="#000" strokeWidth="4" />
            <circle cx="0" cy="0" r="40" fill="url(#glowGrad)" opacity={isSwitchOn && voltage > 0 ? bulbBrightness.toFixed(2) : 0} />
            <path d="M -10 25 L -5 5 L 5 5 L 10 25" fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
            <rect x="-15" y="25" width="30" height="15" fill="#94a3b8" stroke="#000" strokeWidth="4" />
            <rect x="-10" y="40" width="20" height="10" fill="#475569" stroke="#000" strokeWidth="4" />
            <text x="35" y="5" fontSize="12" fontWeight="900" fill="#000">L{i}</text>
          </g>
        </g>
      );
    }

    return elements;
  };

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

  const flowPath = circuitType === 'series'
    ? 'M 100 220 L 100 100 L 400 100 L 400 400 L 100 400 L 100 280'
    : `M 100 220 L 100 100 L ${200 + (numBulbs - 1) * 70} 100 M 100 280 L 100 400 L ${200 + (numBulbs - 1) * 70} 400`;

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform -rotate-3 text-black">
          FISIKA LISTRIK DINAMIS
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: RANGKAIAN LISTRIK
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menganalisis Rangkaian Seri (Berderet) dan Paralel (Bercabang)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Panel Kontrol
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-slate-500">1. Jenis Rangkaian</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCircuitType('series')}
                  className={`border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg flex-1 py-3 text-sm font-bold uppercase transition-all active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${
                    circuitType === 'series' ? 'bg-sky-400 text-black ring-4 ring-black' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  SERI (Berderet)
                </button>
                <button
                  onClick={() => setCircuitType('parallel')}
                  className={`border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg flex-1 py-3 text-sm font-bold uppercase transition-all active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${
                    circuitType === 'parallel' ? 'bg-sky-400 text-black ring-4 ring-black' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  PARALEL (Bercabang)
                </button>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 mt-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Tegangan Sumber (V)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{voltage} V</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="2"
                value={voltage}
                onChange={(e) => setVoltage(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Kekuatan Baterai Pendorong Arus</span>
            </div>

            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-yellow-800 uppercase text-[10px]">Jumlah Lampu (R = 10 Ohm/Lampu)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{numBulbs}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNumBulbs(Math.max(1, numBulbs - 1))}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-white hover:bg-slate-200 flex-1 py-2 text-xl font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                >
                  -
                </button>
                <button
                  onClick={() => setNumBulbs(Math.min(3, numBulbs + 1))}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black flex-1 py-2 text-xl font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t-4 border-black">
              <button
                onClick={() => setIsSwitchOn(!isSwitchOn)}
                className={`border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg py-4 text-lg w-full flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${
                  isSwitchOn ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-rose-500 text-white hover:bg-rose-400'
                }`}
              >
                <span className="text-2xl">{isSwitchOn ? '⚡' : '⭕'}</span>
                <span>SAKELAR: {isSwitchOn ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[500px] overflow-hidden border-8 border-black rounded-xl">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Papan Rangkaian
          </span>

          {!isSwitchOn && (
            <div className="absolute bottom-6 bg-rose-500 text-white px-4 py-2 border-4 border-black font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_#000] z-20">
              ALIRAN TERPUTUS
            </div>
          )}

          <div className="w-full h-full relative z-10 flex items-center justify-center">
            <svg viewBox="0 0 500 500" className="w-full h-full overflow-visible">
              <defs>
                <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="500" height="500" fill="url(#grid)" />

              <path d="M 100 280 L 100 400 L 250 400" fill="none" stroke="#000" strokeWidth="6" />
              <path d="M 250 400 L 400 400 L 400 250" fill="none" stroke="#000" strokeWidth="6" />
              <path d="M 100 220 L 100 100 L 400 100" fill="none" stroke="#000" strokeWidth="6" />

              <path
                d={flowPath}
                fill="none"
                stroke="#facc15"
                strokeWidth="4"
                style={{
                  strokeDasharray: '12 12',
                  opacity: isSwitchOn && voltage > 0 ? 1 : 0,
                  animation: `dash ${animDuration}s linear infinite`,
                }}
              />

              <g transform="translate(60, 220)">
                <rect x="0" y="0" width="80" height="60" fill="#fff" stroke="#000" strokeWidth="4" />
                <rect x="0" y="0" width="80" height="15" fill="#f43f5e" stroke="#000" strokeWidth="4" />
                <rect x="30" y="-10" width="20" height="10" fill="#fff" stroke="#000" strokeWidth="4" />
                <text x="40" y="13" textAnchor="middle" fontWeight="900" fill="#000">+</text>
                <text x="40" y="50" textAnchor="middle" fontWeight="900" fontSize="24" fill="#000">-</text>
                <text x="-25" y="35" textAnchor="middle" fontWeight="900" fontSize="14" fill="#000">{voltage}V</text>
              </g>

              <g transform="translate(250, 400)">
                <circle cx="-20" cy="0" r="5" fill="#000" />
                <circle cx="20" cy="0" r="5" fill="#000" />
                <line
                  x1="-20"
                  y1="0"
                  x2="20"
                  y2="0"
                  stroke="#ef4444"
                  strokeWidth="6"
                  strokeLinecap="round"
                  style={{
                    transform: isSwitchOn ? 'rotate(0deg)' : 'rotate(-30deg)',
                    transformOrigin: '-20px 0px',
                    transition: 'transform 0.2s',
                  }}
                />
                <text x="0" y="25" textAnchor="middle" fontWeight="900" fontSize="12">SAKELAR</text>
              </g>

              {circuitType === 'series' ? renderSeriesCircuit() : renderParallelCircuit()}
            </svg>
          </div>
        </div>

        <div className="neo-box bg-slate-900 text-white p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute -top-4 left-6 bg-sky-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Data Sensor
          </span>

          <div className="bg-black p-4 border-4 border-sky-400 text-center shadow-[4px_4px_0px_0px_#38bdf8] mt-2 rounded-lg">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">ARUS TOTAL SISTEM (I_tot)</span>
            <span className="font-mono font-black text-5xl text-white flex justify-center items-center gap-2">
              <span>{I_tot.toFixed(2)}</span>
              <span className="text-2xl text-sky-400">A</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs mt-2 font-mono">
            <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center rounded-lg">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Tegangan Total (V)</span>
              <span className="text-rose-400 font-bold text-lg">{voltage} V</span>
            </div>
            <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center rounded-lg">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Hambatan Total (R_tot)</span>
              <span className="text-yellow-400 font-bold text-lg">{R_tot.toFixed(1)} Ohm</span>
            </div>
          </div>

          <div className="mt-2 bg-slate-100 text-black p-3 border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col gap-2 rounded-xl">
            <h4 className="font-black text-xs uppercase border-b-2 border-black pb-1 mb-1">DATA PER LAMPU (R = 10 Ohm)</h4>
            <div className="flex flex-col gap-2">
              {bulbData.map((d, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-2 border-2 border-black rounded-lg">
                  <span className="font-black text-rose-500">L{idx + 1}</span>
                  <span>V: <b>{d.v.toFixed(1)}V</b></span>
                  <span>I: <b>{d.i.toFixed(2)}A</b></span>
                  <span className="text-emerald-600 font-bold">P: {d.p.toFixed(1)}W</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto text-center text-[10px] text-slate-400 font-bold italic leading-tight">
            Hukum Ohm: V = I x R <br />
            Daya (Kecerahan): P = V x I
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          MEMAHAMI KARAKTERISTIK RANGKAIAN
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-2 mb-3">RANGKAIAN SERI</h4>
            <ul className="text-xs font-semibold text-slate-800 leading-relaxed list-disc list-inside space-y-2">
              <li>Disusun <b>berderet</b> dalam satu jalur kabel.</li>
              <li><b>Arus (I) sama besar</b> di setiap lampu. Elektron tidak punya jalan lain.</li>
              <li><b>Tegangan (V) terbagi</b>. Jika ada 2 lampu, tegangan baterai dibagi 2. Akibatnya lampu lebih redup.</li>
              <li>Jika satu lampu putus, <b>semua lampu akan mati</b> karena jalur terputus.</li>
              <li>Hambatan total membesar: R_tot = R1 + R2 + ...</li>
            </ul>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-2 mb-3">RANGKAIAN PARALEL</h4>
            <ul className="text-xs font-semibold text-slate-800 leading-relaxed list-disc list-inside space-y-2">
              <li>Disusun <b>bercabang</b>. Masing-masing lampu punya jalur langsung ke baterai.</li>
              <li><b>Tegangan (V) sama besar</b> di setiap lampu, sama dengan tegangan baterai. Lampu menyala terang maksimal!</li>
              <li><b>Arus (I) terbagi</b>. Arus total dari baterai sangat besar lalu memecah ke tiap cabang.</li>
              <li>Jika satu lampu putus, <b>yang lain tetap menyala</b>. Ini adalah sistem listrik di rumah kita!</li>
              <li>Hambatan total mengecil: 1/R_tot = 1/R1 + 1/R2 + ...</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">HUKUM OHM & DAYA</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-3xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e] rounded-xl">
              V = I x R
            </div>
            <p className="text-center mt-4 text-xs font-bold text-slate-800 bg-white p-2 border-2 border-black uppercase rounded-lg">
              Kecerahan Lampu (Daya/Watt): P = V x I
            </p>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600 text-white rounded-xl">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">ATURAN KIRCHHOFF</h4>
            <ul className="text-[11px] font-bold space-y-3 font-mono">
              <li className="bg-slate-700 p-2 border border-slate-500 rounded">Hukum I (Titik Cabang):<br />Jumlah arus masuk = Jumlah arus keluar</li>
              <li className="bg-slate-700 p-2 border border-slate-500 rounded">Hukum II (Loop Tertutup):<br />Jumlah aljabar tegangan dan penurunan tegangan dalam satu loop tertutup adalah nol.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-fuchsia-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6 rounded-lg">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP KELISTRIKAN [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] rounded-xl">
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
                            : 'bg-white hover:bg-fuchsia-200'
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
                {score === 5 ? 'Sempurna! Pemahaman kelistrikan Anda sangat baik.' : 'Cukup baik. Coba perhatikan lagi data sensor saat lampu ditambah.'}
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

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -24;
          }
        }
      `}</style>
    </div>
  );
}