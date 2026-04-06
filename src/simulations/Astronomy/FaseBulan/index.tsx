import { useState, useRef, useCallback, useEffect } from 'react';

const SYNODIC_MONTH = 29.53;
const ORBIT_R = 120;

const quizData = [
  {
    question: '1. Apa yang menjadi penyebab utama terjadinya fase-fase bulan yang kita lihat dari Bumi?',
    options: ['Bulan masuk ke dalam bayangan Bumi', 'Perubahan sudut pandang dari Bumi terhadap bagian bulan yang disinari Matahari', 'Bentuk bulan yang berubah-ubah ukurannya', 'Awan yang menutupi bulan'],
    answer: 1,
  },
  {
    question: '2. Berdasarkan simulasi, pada saat fase Bulan Baru (New Moon), di manakah posisi Bulan berada?',
    options: ['Di antara Bumi dan Matahari', 'Di belakang Bumi (Bumi di antara Bulan dan Matahari)', 'Sangat jauh dari tata surya', 'Di atas kutub utara Bumi'],
    answer: 0,
  },
  {
    question: '3. Saat fase Purnama (Full Moon), berapakah persentase bagian bulan yang menghadap bumi yang tersinari oleh matahari?',
    options: ['0%', '50%', '100%', '25%'],
    answer: 2,
  },
  {
    question: '4. Perhatikan simulasi dari Bumi. Pada fase Sabit Awal (Waxing Crescent), bagian mana dari bulan yang terlihat terang?',
    options: ['Sisi Kiri', 'Seluruh permukaannya', 'Hanya bagian atasnya', 'Sisi Kanan (sebagian kecil)'],
    answer: 3,
  },
  {
    question: '5. Berapa lama kira-kira waktu yang dibutuhkan Bulan untuk menyelesaikan satu siklus fase penuh (Siklus Sinodis)?',
    options: ['24 Jam', '365 Hari', 'Sekitar 29,5 Hari', '7 Hari'],
    answer: 2,
  },
];

export default function FaseBulan() {
  const [day, setDay] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const autoPlayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseRatio = day / SYNODIC_MONTH;

  const getPhaseInfo = useCallback(() => {
    const ratio = phaseRatio;
    let phaseName = '';
    let positionDesc = '';

    if (ratio < 0.03 || ratio > 0.97) {
      phaseName = 'Bulan Baru (New Moon)';
      positionDesc = 'Di antara Bumi & Matahari';
    } else if (ratio < 0.22) {
      phaseName = 'Sabit Awal (Waxing Crescent)';
      positionDesc = 'Bergerak menjauhi Matahari';
    } else if (ratio < 0.28) {
      phaseName = 'Paruh Awal (First Quarter)';
      positionDesc = 'Tegak lurus terhadap Matahari';
    } else if (ratio < 0.47) {
      phaseName = 'Cembung Awal (Waxing Gibbous)';
      positionDesc = 'Bergerak menuju oposisi';
    } else if (ratio < 0.53) {
      phaseName = 'Purnama (Full Moon)';
      positionDesc = 'Bumi di antara Bulan & Matahari';
    } else if (ratio < 0.72) {
      phaseName = 'Cembung Akhir (Waning Gibbous)';
      positionDesc = 'Bergerak mendekati Matahari';
    } else if (ratio < 0.78) {
      phaseName = 'Paruh Akhir (Third Quarter)';
      positionDesc = 'Tegak lurus terhadap Matahari';
    } else {
      phaseName = 'Sabit Akhir (Waning Crescent)';
      positionDesc = 'Bergerak mendekati Matahari';
    }

    const illumination = Math.round(((1 - Math.cos(ratio * 2 * Math.PI)) / 2) * 100);

    return { phaseName, positionDesc, illumination };
  }, [phaseRatio]);

  const phaseInfo = getPhaseInfo();

  const angleRad = phaseRatio * Math.PI * 2;
  const moonX = ORBIT_R * Math.cos(angleRad);
  const moonY = -ORBIT_R * Math.sin(angleRad);

  const isWaxing = phaseRatio < 0.5;
  const moonHalfPath = isWaxing
    ? 'M 50 5 A 45 45 0 0 1 50 95 Z'
    : 'M 50 5 A 45 45 0 0 0 50 95 Z';

  let ellipseRx = 0;
  let ellipseColor = '#1e293b';

  if (phaseRatio < 0.25) {
    ellipseRx = 45 * (1 - phaseRatio / 0.25);
    ellipseColor = '#1e293b';
  } else if (phaseRatio < 0.5) {
    ellipseRx = 45 * ((phaseRatio - 0.25) / 0.25);
    ellipseColor = '#facc15';
  } else if (phaseRatio < 0.75) {
    ellipseRx = 45 * (1 - (phaseRatio - 0.5) / 0.25);
    ellipseColor = '#facc15';
  } else {
    ellipseRx = 45 * ((phaseRatio - 0.75) / 0.25);
    ellipseColor = '#1e293b';
  }

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => {
      if (!prev) {
        autoPlayIntervalRef.current = setInterval(() => {
          setDay((d) => {
            const next = d + 0.05;
            return next > SYNODIC_MONTH ? 0 : next;
          });
        }, 30);
        return true;
      } else {
        if (autoPlayIntervalRef.current) {
          clearInterval(autoPlayIntervalRef.current);
          autoPlayIntervalRef.current = null;
        }
        return false;
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAutoPlaying) {
      toggleAutoPlay();
    }
    setDay(parseFloat(e.target.value));
  };

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
    if (score === 5) return 'SEMPURNA! PEMAHAMAN ASTRONOMI ANDA SANGAT BAIK.';
    if (score >= 3) return 'CUKUP BAIK. COBA PERHATIKAN LAGI SIMULASINYA.';
    return 'YUK BACA LAGI BAGIAN PENJELASAN KONSEP DI ATAS.';
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">FISIKA ASTRONOMI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: FASE BULAN
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Mengamati Siklus Sinodis dan Penampakan Bulan dari Bumi
        </p>
      </header>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl mb-8 flex flex-col lg:flex-row items-stretch justify-between gap-6 z-10 relative">
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black shadow-[2px_2px_0px_#000]">
            KONTROL WAKTU (SIKLUS LUNAR)
          </label>
          <div className="bg-indigo-50 p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 mt-2 h-full justify-center">
            <div className="flex justify-between items-center mb-2">
              <span className="font-black text-indigo-800 uppercase">Waktu Berlalu</span>
              <span className="font-mono font-black text-2xl bg-white px-3 py-1 border-2 border-black">Hari ke-{day.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={SYNODIC_MONTH}
              step="0.1"
              value={day}
              onChange={handleSliderChange}
              className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
            />
            <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
              <span>Bulan Baru</span>
              <span>Purnama</span>
              <span>Bulan Baru</span>
            </div>
            <button
              onClick={toggleAutoPlay}
              className={`border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-all font-bold cursor-pointer uppercase py-3 text-center text-md w-full mt-2 active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${
                isAutoPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'
              } text-black`}
            >
              {isAutoPlaying ? 'JEDA OTOMATIS' : 'PUTAR OTOMATIS'}
            </button>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <label className="text-sm font-bold text-black uppercase bg-rose-300 inline-block px-2 border-2 border-black shadow-[2px_2px_0px_#000]">
            STATUS OBSERVASI
          </label>
          <div className="bg-slate-900 p-6 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 text-white h-full justify-center">
            <div className="flex justify-between border-b-2 border-slate-600 pb-2">
              <span className="text-slate-400 font-bold uppercase">Nama Fase:</span>
              <span className="font-black text-yellow-400 text-xl">{phaseInfo.phaseName}</span>
            </div>
            <div className="flex justify-between border-b-2 border-slate-600 pb-2">
              <span className="text-slate-400 font-bold uppercase">Persentase Terang:</span>
              <span className="font-mono font-black text-white text-xl">{phaseInfo.illumination}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase">Posisi Relatif:</span>
              <span className="font-bold text-sky-400 text-md text-right">{phaseInfo.positionDesc}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10">
        <div className="bg-slate-900 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col items-center justify-center w-full lg:w-1/2 min-h-[400px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-sm -rotate-2 z-30">
            PANDANGAN LUAR ANGKASA
          </span>
          <div className="w-full max-w-[400px] aspect-square relative z-20 mt-8">
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            <svg viewBox="0 0 400 400" className="w-full h-full relative z-10 overflow-visible">
              <g stroke="#facc15" strokeWidth="4" strokeDasharray="15 10" opacity="0.3">
                <line x1="400" y1="50" x2="0" y2="50" />
                <line x1="400" y1="150" x2="0" y2="150" />
                <line x1="400" y1="250" x2="0" y2="250" />
                <line x1="400" y1="350" x2="0" y2="350" />
              </g>
              <text x="380" y="20" fontSize="14" fontWeight="900" fill="#facc15" textAnchor="end">Cahaya Matahari</text>
              <circle cx="200" cy="200" r={ORBIT_R} fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="8 4" />
              <g transform="translate(200, 200)">
                <circle cx="0" cy="0" r="25" fill="#3b82f6" stroke="#000" strokeWidth="4" />
                <path d="M -10 -10 Q 0 -20 10 -10 Q 20 0 10 10 Q 0 0 -10 10 Z" fill="#22c55e" />
                <path d="M -15 5 Q -20 15 -10 20" fill="#22c55e" strokeWidth="2" />
              </g>
              <g transform={`translate(${200 + moonX}, ${200 + moonY})`}>
                <line x1={-moonX} y1={-moonY} x2="0" y2="0" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                <circle cx="0" cy="0" r="15" fill="#1e293b" stroke="#000" strokeWidth="3" />
                <path d="M 0 -15 A 15 15 0 0 1 0 15 Z" fill="#facc15" />
              </g>
            </svg>
          </div>
        </div>

        <div className="bg-[#0f172a] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col items-center justify-center w-full lg:w-1/2 min-h-[400px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-yellow-300 text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-sm rotate-2 z-30">
            PANDANGAN DARI BUMI
          </span>
          <div className="w-full max-w-[300px] aspect-square relative z-20 mt-8">
            <div className="absolute inset-0 z-0 opacity-60 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '50px 50px', backgroundPosition: '25px 25px' }}></div>
            <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-visible drop-shadow-[0_0_15px_rgba(250,204,21,0.2)]">
              <circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#000" strokeWidth="2" />
              <g>
                <path d={moonHalfPath} fill="#facc15" />
                <ellipse cx="50" cy="50" rx={ellipseRx} ry="45" fill={ellipseColor} />
              </g>
              <circle cx="50" cy="50" r="45" fill="none" stroke="#000" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-indigo-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 -rotate-1">
          PENJELASAN KONSEP: MENGAPA BENTUK BULAN BERUBAH?
        </h3>
        <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/80 p-3 border-2 border-black border-dashed">
          Bulan tidak memancarkan cahaya sendiri; ia hanya memantulkan cahaya dari Matahari. Pada kenyataannya, <b>selalu ada tepat SATU TENGGAH bagian bulan yang terang</b> (menghadap matahari) dan setengah bagian yang gelap. Fase bulan terjadi karena <b>perubahan sudut pandang kita di Bumi</b> terhadap bagian bulan yang terang tersebut saat ia mengorbit.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-slate-800 mb-2 border-b-4 border-black pb-1">Bulan Baru</h4>
            <p className="text-xs font-semibold">Posisi Bulan berada di antara Bumi dan Matahari. Sisi yang terang menghadap menjauhi Bumi, sehingga bulan terlihat gelap total dari pandangan kita.</p>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-sky-700 mb-2 border-b-4 border-black pb-1">Fase Kuartal (Paruh)</h4>
            <p className="text-xs font-semibold">Bulan telah menempuh 1/4 atau 3/4 orbitnya. Garis pandang kita tegak lurus dengan arah cahaya matahari, sehingga kita melihat tepat separuh bagian bulan yang terang.</p>
          </div>
          <div className="bg-yellow-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-yellow-700 mb-2 border-b-4 border-black pb-1">Bulan Purnama</h4>
            <p className="text-xs font-semibold">Bumi berada di antara Bulan dan Matahari. Seluruh sisi bulan yang menghadap ke Bumi sedang disinari penuh oleh Matahari.</p>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-rose-700 mb-2 border-b-4 border-black pb-1">Siklus Sinodis</h4>
            <p className="text-xs font-semibold">Waktu yang dibutuhkan Bulan untuk menyelesaikan satu siklus fase penuh (dari Bulan Baru kembali ke Bulan Baru) adalah sekitar <b>29,5 hari</b>.</p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-fuchsia-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP [KUIS]
          </h3>
        </div>
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIndex) => (
              <div key={qIndex} className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                <h4 className="font-bold text-black mb-4 text-lg bg-sky-200 inline-block px-2 border-2 border-black">
                  {q.question}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, optIndex) => (
                    <button
                      key={optIndex}
                      onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold text-left px-4 py-3 transition-all ${
                        quizSubmitted
                          ? optIndex === q.answer
                            ? 'bg-green-400 text-black'
                            : userAnswers[qIndex] === optIndex
                            ? 'bg-rose-400 text-black line-through'
                            : 'bg-white opacity-50'
                          : userAnswers[qIndex] === optIndex
                          ? 'bg-black text-white'
                          : 'bg-slate-100 hover:bg-yellow-200 text-black cursor-pointer'
                      }`}
                    >
                      {quizSubmitted && optIndex === q.answer && '[ BENAR ] '}
                      {quizSubmitted && userAnswers[qIndex] === optIndex && optIndex !== q.answer && '[ SALAH ] '}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!quizSubmitted && userAnswers.every((a) => a !== null) && (
              <div className="text-center mt-8">
                <button
                  onClick={calculateScore}
                  className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg bg-slate-900 text-white font-bold py-3 px-10 text-xl uppercase tracking-widest hover:bg-slate-800 active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
                >
                  KIRIM JAWABAN!
                </button>
              </div>
            )}
          </div>
          {quizSubmitted && (
            <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">{getScoreMessage()}</p>
              <br />
              <button
                onClick={retryQuiz}
                className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg bg-black text-white font-bold py-3 px-8 text-lg uppercase tracking-wider active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
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