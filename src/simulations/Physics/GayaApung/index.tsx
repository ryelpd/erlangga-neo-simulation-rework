import { useState, useCallback, useMemo } from 'react';

const TANK_FLOOR = 450;
const WATER_LEVEL = 300;
const TANK_CENTER_X = 400;
const G = 10;

const quizData = [
  { question: '1. Apa bunyi Hukum Archimedes?', options: ['Tekanan fluida berbanding lurus dengan kedalaman', 'Gaya apung sama dengan berat fluida yang dipindahkan', 'Benda akan selalu mengapung di air', 'Massa jenis benda selalu tetap'], answer: 1 },
  { question: '2. Benda dikatakan TENGGELAM jika...', options: ['ρ benda < ρ fluida', 'ρ benda = ρ fluida', 'ρ benda > ρ fluida', 'W benda = Fa'], answer: 2 },
  { question: '3. Jika sebuah balok kayu mengapung di air, maka gaya apung (Fa) yang bekerja padanya adalah...', options: ['Nol', 'Lebih kecil dari beratnya', 'Sama dengan beratnya', 'Lebih besar dari beratnya'], answer: 2 },
  { question: '4. Cairan manakah yang memiliki gaya apung paling besar untuk volume benda yang sama?', options: ['Air (1000 kg/m³)', 'Madu (1400 kg/m³)', 'Bensin (700 kg/m³)', 'Alkohol (800 kg/m³)'], answer: 1 },
  { question: '5. Kapal laut yang terbuat dari besi bisa mengapung karena...', options: ['Besi lebih ringan dari air', 'Kapal memiliki rongga udara sehingga volume total besar dan massa jenis rata-rata kecil', 'Kapal memiliki mesin pendorong', 'Gaya gravitasi di laut lebih kecil'], answer: 1 },
];

export default function GayaApung() {
  const [fluidDensity, setFluidDensity] = useState(1000);
  const [objectMass, setObjectMass] = useState(5);
  const [objectVolume, setObjectVolume] = useState(10);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const W = objectMass * G;
  const objectDensity = (objectMass / objectVolume) * 1000;

  const side = 60 + objectVolume * 4;

  const { Fa, status, statusColor, blockY } = useMemo(() => {
    let Fa = 0;
    let status = '';
    let statusColor = '';
    let blockY = 0;

    if (objectDensity < fluidDensity) {
      status = 'Status: MENGAPUNG';
      statusColor = 'text-blue-500';
      Fa = W;
      const v_sub = objectMass / (fluidDensity / 1000);
      const sub_ratio = v_sub / objectVolume;
      blockY = WATER_LEVEL - side + side * sub_ratio;
    } else if (Math.abs(objectDensity - fluidDensity) < 10) {
      status = 'Status: MELAYANG';
      statusColor = 'text-emerald-500';
      Fa = W;
      blockY = WATER_LEVEL + 50;
    } else {
      status = 'Status: TENGGELAM';
      statusColor = 'text-rose-500';
      Fa = (fluidDensity * G * objectVolume) / 1000;
      blockY = TANK_FLOOR;
    }

    return { Fa, status, statusColor, blockY };
  }, [objectDensity, fluidDensity, W, objectVolume, objectMass, side]);

  const handleDensityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFluidDensity(parseInt(e.target.value));
  }, []);

  const handleMassChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setObjectMass(parseFloat(e.target.value));
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setObjectVolume(parseInt(e.target.value));
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
    if (score === 5) return 'HEBAT! KAMU MENGUASAI PRINSIP ARCHIMEDES!';
    if (score >= 3) return 'BAGUS! COBA PERHATIKAN LAGI SYARAT BENDA MENGAPUNG.';
    return 'YUK PELAJARI LAGI KONSEP GAYA APUNG.';
  };

  const centerY = blockY - side / 2;

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-cyan-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black border-2 border-black">FISIKA FLUIDA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: GAYA APUNG
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Analisis Hukum Archimedes: Mengapa Benda Bisa Mengapung?
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30 uppercase">
            Parameter Eksperimen
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-blue-800 uppercase text-[10px]">Massa Jenis Fluida (ρ)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{fluidDensity}</span>
              </div>
              <input
                type="range"
                min="500"
                max="2000"
                step="50"
                value={fluidDensity}
                onChange={handleDensityChange}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Bensin</span>
                <span>Madu</span>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-rose-800 uppercase text-[10px]">Massa Benda (m)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{objectMass}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={objectMass}
                onChange={handleMassChange}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-orange-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-orange-800 uppercase text-[10px]">Volume Benda (V)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{objectVolume}</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={objectVolume}
                onChange={handleVolumeChange}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-orange-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">ANALISIS GAYA</h4>
            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Berat Benda (W):</span>
                <span className="text-rose-400 font-bold">{W.toFixed(1)} N</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Gaya Apung (Fa):</span>
                <span className="text-emerald-400 font-bold">{Fa.toFixed(1)} N</span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Massa Jenis Benda:</span>
                <span className="text-orange-400 font-bold">{Math.round(objectDensity)} kg/m³</span>
              </div>
            </div>
            <div className="mt-4 p-2 bg-slate-800 border-2 border-dashed border-slate-600 text-center">
              <div className={`text-[11px] font-black uppercase leading-tight ${statusColor}`}>{status}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-2 z-30 uppercase">
            Tangki Eksperimen Fluida
          </span>

          <div className="absolute top-4 right-4 z-30 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[8px] font-bold uppercase">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500"></div> Gaya Apung (Fa)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500"></div> Berat Benda (W)
            </div>
          </div>

          <div className="w-full h-full relative z-10 flex items-center justify-center">
            <svg viewBox="0 0 800 500" className="w-full h-full">
              <rect x="150" y="100" width="500" height="350" fill="#fff" stroke="#000" strokeWidth="8" />

              <path d="M 150 300 Q 400 300 650 300 L 650 450 L 150 450 Z" fill="#38bdf8" opacity="0.6" stroke="#0ea5e9" strokeWidth="2" />

              <g>
                <rect x={TANK_CENTER_X - side / 2} y={blockY - side} width={side} height={side} fill="#facc15" stroke="#000" strokeWidth="4" />

                <line x1={TANK_CENTER_X} y1={centerY} x2={TANK_CENTER_X} y2={centerY + W * 5} stroke="#ef4444" strokeWidth="6" />
                <line x1={TANK_CENTER_X} y1={centerY} x2={TANK_CENTER_X} y2={centerY - Fa * 5} stroke="#22c55e" strokeWidth="6" />
              </g>

              <defs>
                <marker id="arrowheadRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
                </marker>
                <marker id="arrowheadGreen" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#22c55e" />
                </marker>
              </defs>
            </svg>
          </div>

          <div className="absolute bottom-6 bg-white px-4 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000]">
            Gravitasi (g) = 10 m/s²
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          PRINSIP ARCHIMEDES
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Mengapung</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Terjadi jika massa jenis benda <b>lebih kecil</b> dari massa jenis fluida (ρb &lt; ρf). Gaya apung sama dengan berat benda, tetapi hanya sebagian volume yang tercelup.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Melayang</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Terjadi jika massa jenis benda <b>sama dengan</b> massa jenis fluida (ρb = ρf). Seluruh bagian benda tercelup tetapi tidak sampai ke dasar.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Tenggelam</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Terjadi jika massa jenis benda <b>lebih besar</b> dari massa jenis fluida (ρb &gt; ρf). Gaya berat lebih besar dari gaya apung maksimal.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">PERSAMAAN GAYA APUNG</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-2xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e]">
              Fa = ρ x g x V_tercelup
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">KETERANGAN</h4>
            <ul className="text-[11px] font-bold space-y-2">
              <li>
                <span className="text-yellow-400">ρ</span> = Massa Jenis Fluida (kg/m³)
              </li>
              <li>
                <span className="text-blue-400">V_tercelup</span> = Volume benda yang masuk ke fluida
              </li>
              <li>
                <span className="text-emerald-400">Fa</span> = Gaya Apung / Ke atas (Newton)
              </li>
              <li>
                <span className="text-rose-400">W</span> = Gaya Berat / Ke bawah (m x g)
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI KONSEP [KUIS]</h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIndex) => (
              <div key={qIndex} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
                <h4 className="font-bold mb-3 text-sm uppercase">{q.question}</h4>
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
                KIRIM JAWABAN!
              </button>
            )}
          </div>

          {quizSubmitted && (
            <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR: {score} / 5</h4>
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