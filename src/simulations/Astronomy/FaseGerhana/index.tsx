import { useState, useRef, useCallback, useEffect } from 'react';

const quizData = [
  {
    question: '1. Syarat utama terjadinya Gerhana Matahari adalah Bulan harus berada pada fase...',
    options: ['Purnama (Full Moon)', 'Bulan Baru (New Moon)', 'Kuartal Pertama', 'Sabit Akhir'],
    answer: 1,
  },
  {
    question: '2. Saat gerhana bulan total terjadi, bulan tidak menghilang sepenuhnya melainkan tampak berwarna merah gelap (Blood Moon). Apa penyebabnya?',
    options: [
      'Cahaya matahari terhalang sepenuhnya',
      'Pembiasan cahaya matahari oleh atmosfer Bumi yang meneruskan cahaya merah ke arah bulan',
      'Suhu bulan meningkat drastis',
      'Bulan memancarkan cahayanya sendiri',
    ],
    answer: 1,
  },
  {
    question: '3. Area bayangan tergelap di mana cahaya matahari terhalang sepenuhnya disebut...',
    options: ['Penumbra', 'Korona', 'Umbra', 'Fotosfer'],
    answer: 2,
  },
  {
    question: '4. Mengapa Gerhana Matahari atau Bulan tidak terjadi setiap bulan, padahal selalu ada fase Bulan Baru dan Purnama?',
    options: [
      'Karena orbit bulan berbentuk lingkaran',
      'Karena bumi bergerak terlalu cepat',
      'Karena orbit Bulan miring sekitar 5 derajat terhadap bidang orbit Bumi mengelilingi Matahari',
      'Karena matahari kadang mati',
    ],
    answer: 2,
  },
  {
    question: '5. Jika Anda berada di Bumi dan masuk ke dalam area bayangan "Penumbra" bulan, fenomena apa yang akan Anda lihat?',
    options: [
      'Gerhana Matahari Total',
      'Malam hari yang sangat gelap',
      'Gerhana Matahari Sebagian (Matahari tampak tergigit)',
      'Bulan membesar',
    ],
    answer: 2,
  },
];

export default function FaseGerhana() {
  const [simMode, setSimMode] = useState<'SOLAR' | 'LUNAR'>('SOLAR');
  const [progress, setProgress] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  const EARTH_X = 400;
  const EARTH_Y = 150;
  const ORBIT_R = 150;

  const updateSimulation = useCallback(() => {
    if (simMode === 'SOLAR') {
      const mappedProg = 100 - progress;
      const angleDeg = 150 + (mappedProg / 100) * 60;
      const angleRad = (angleDeg * Math.PI) / 180;
      return {
        mx: EARTH_X + ORBIT_R * Math.cos(angleRad),
        my: EARTH_Y + ORBIT_R * Math.sin(angleRad),
      };
    } else {
      const angleDeg = -30 + (progress / 100) * 60;
      const angleRad = (angleDeg * Math.PI) / 180;
      return {
        mx: EARTH_X + ORBIT_R * Math.cos(angleRad),
        my: EARTH_Y + ORBIT_R * Math.sin(angleRad),
      };
    }
  }, [simMode, progress]);

  const pos = updateSimulation();
  const dy = pos.my - 150;

  const getStatus = () => {
    if (simMode === 'SOLAR') {
      if (Math.abs(dy) <= 10) {
        return { status: 'GERHANA MATAHARI TOTAL', desc: 'Bumi berada di dalam area Umbra Bulan. Langit menjadi gelap di siang hari.', color: 'text-rose-500' };
      } else if (Math.abs(dy) <= 30) {
        return { status: 'GERHANA MATAHARI SEBAGIAN', desc: 'Bumi berada di area Penumbra Bulan. Matahari tampak tergigit.', color: 'text-sky-500' };
      }
      return { status: 'TIDAK ADA GERHANA', desc: 'Bayangan bulan meleset dan tidak mengenai Bumi.', color: 'text-slate-400' };
    } else {
      if (Math.abs(dy) <= 15) {
        return { status: 'GERHANA BULAN TOTAL', desc: 'Bulan masuk sepenuhnya ke dalam Umbra Bumi. Tampak berwarna merah darah (Blood Moon).', color: 'text-rose-500' };
      } else if (Math.abs(dy) <= 25) {
        return { status: 'GERHANA BULAN SEBAGIAN', desc: 'Sebagian bulan berada di Umbra, sebagian di Penumbra.', color: 'text-sky-500' };
      } else if (Math.abs(dy) <= 45) {
        return { status: 'GERHANA PENUMBRA', desc: 'Bulan masuk ke area Penumbra Bumi. Cahayanya hanya meredup sedikit.', color: 'text-indigo-400' };
      }
      return { status: 'TIDAK ADA GERHANA', desc: 'Bulan berada di luar bayangan Bumi (Purnama biasa).', color: 'text-slate-400' };
    }
  };

  const statusInfo = getStatus();

  const getOrbitPath = () => {
    if (simMode === 'SOLAR') {
      const startA = (150 * Math.PI) / 180;
      const endA = (210 * Math.PI) / 180;
      return `M ${EARTH_X + ORBIT_R * Math.cos(startA)} ${EARTH_Y + ORBIT_R * Math.sin(startA)} A ${ORBIT_R} ${ORBIT_R} 0 0 0 ${EARTH_X + ORBIT_R * Math.cos(endA)} ${EARTH_Y + ORBIT_R * Math.sin(endA)}`;
    } else {
      const startA = (-30 * Math.PI) / 180;
      const endA = (30 * Math.PI) / 180;
      return `M ${EARTH_X + ORBIT_R * Math.cos(startA)} ${EARTH_Y + ORBIT_R * Math.sin(startA)} A ${ORBIT_R} ${ORBIT_R} 0 0 1 ${EARTH_X + ORBIT_R * Math.cos(endA)} ${EARTH_Y + ORBIT_R * Math.sin(endA)}`;
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }
    const loop = () => {
      setProgress((p) => {
        const next = p + 0.2;
        return next > 100 ? 0 : next;
      });
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying((p) => !p);

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

  const getSkyColor = () => {
    if (simMode === 'SOLAR') {
      if (Math.abs(dy) <= 10) return '#0f172a';
      if (Math.abs(dy) <= 30) return '#38bdf8';
      return '#7dd3fc';
    }
    return '#020617';
  };

  const getMoonColor = () => {
    if (simMode === 'LUNAR') {
      if (Math.abs(dy) <= 15) return '#991b1b';
      if (Math.abs(dy) <= 25) return '#ca8a04';
      if (Math.abs(dy) <= 45) return '#fde047';
      return '#fef08a';
    }
    return '#1e293b';
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">FISIKA ASTRONOMI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: FASE GERHANA</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Interaksi Posisi Bumi, Bulan, dan Matahari serta Bayangannya
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30 uppercase">
            Panel Observasi
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-slate-500">1. Pilih Fenomena</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSimMode('SOLAR')}
                  className={`neo-btn py-3 px-4 text-sm ring-4 text-left flex justify-between items-center ${
                    simMode === 'SOLAR' ? 'ring-black bg-yellow-300' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <span>☀️ Gerhana Matahari</span>
                  <span className="text-xs bg-white px-1 border border-black">Fase Bulan Baru</span>
                </button>
                <button
                  onClick={() => setSimMode('LUNAR')}
                  className={`neo-btn py-3 px-4 text-sm text-left flex justify-between items-center ${
                    simMode === 'LUNAR' ? 'ring-4 ring-black bg-yellow-300' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <span>🌕 Gerhana Bulan</span>
                  <span className="text-xs bg-white px-1 border border-black">Fase Purnama</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-800 uppercase text-[10px]">Pergeseran Orbit Bulan</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{progress.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={progress}
                onChange={(e) => {
                  if (isPlaying) setIsPlaying(false);
                  setProgress(parseFloat(e.target.value));
                }}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Awal Masuk</span>
                <span>Akhir Keluar</span>
              </div>
            </div>

            <button
              onClick={togglePlay}
              className={`border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-all font-bold cursor-pointer uppercase py-3 text-center text-md w-full active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${
                isPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'
              } text-black`}
            >
              {isPlaying ? '⏸️ JEDA WAKTU' : '▶️ PUTAR OTOMATIS'}
            </button>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-2 uppercase tracking-widest text-center">STATUS OBSERVASI BUMI</h4>
            <div className="p-3 bg-slate-800 border-2 border-dashed border-slate-600 text-center flex flex-col items-center justify-center min-h-[80px]">
              <span className={`font-black text-xl uppercase tracking-tight ${statusInfo.color}`}>{statusInfo.status}</span>
              <span className="text-[10px] text-slate-300 font-bold mt-1">{statusInfo.desc}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-900 p-0 relative flex flex-col items-center justify-center w-full min-h-[300px] overflow-hidden border-8 border-black rounded-xl" style={{ backgroundColor: '#0f172a', backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 4px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 3px), radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 4px), radial-gradient(rgba(255,255,255,.4), rgba(255,255,255,.1) 2px, transparent 3px)', backgroundSize: '550px 550px, 350px 350px, 250px 250px, 150px 150px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-1 z-30 uppercase">
              Pandangan Luar Angkasa (Top-Down)
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#0f172a] border border-black"></div> Umbra (Gelap Total)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#64748b] border border-black opacity-50"></div> Penumbra (Remang)
              </div>
            </div>

            <svg viewBox="0 0 800 300" className="w-full h-full overflow-visible">
              <g stroke="#fef08a" strokeWidth="2" opacity="0.2" strokeDasharray="10 5">
                <line x1="-100" y1="50" x2="800" y2="50" />
                <line x1="-100" y1="100" x2="800" y2="100" />
                <line x1="-100" y1="150" x2="800" y2="150" />
                <line x1="-100" y1="200" x2="800" y2="200" />
                <line x1="-100" y1="250" x2="800" y2="250" />
              </g>

              <circle cx="-50" cy="150" r="100" fill="#facc15" stroke="#ea580c" strokeWidth="4" style={{ filter: 'drop-shadow(0 0 15px #facc15)' }} />
              <text x="20" y="155" fontWeight="900" fontSize="14" fill="#000">MATAHARI</text>

              <g transform="translate(400, 150)">
                {simMode === 'LUNAR' && (
                  <>
                    <polygon points="0,-25 0,25 400,100 400,-100" fill="#64748b" opacity="0.4" />
                    <polygon points="0,-25 0,25 250,0" fill="#0f172a" opacity="0.8" />
                  </>
                )}
                <circle cx="0" cy="0" r="25" fill="#3b82f6" stroke="#000" strokeWidth="3" />
                <path d="M -10 -10 Q 0 -20 10 -10 Q 20 0 10 10 Q 0 0 -10 10 Z" fill="#22c55e" />
                <path d="M 0 -25 A 25 25 0 0 1 0 25 A 25 25 0 0 0 0 -25" fill="#000" opacity="0.5" />
              </g>

              <g transform={`translate(${pos.mx}, ${pos.my})`}>
                {simMode === 'SOLAR' && (
                  <>
                    <polygon points="0,-8 0,8 300,50 300,-50" fill="#64748b" opacity="0.4" />
                    <polygon points="0,-8 0,8 150,0" fill="#0f172a" opacity="0.8" />
                  </>
                )}
                <circle cx="0" cy="0" r="8" fill="#e2e8f0" stroke="#000" strokeWidth="2" />
                <path d="M 0 -8 A 8 8 0 0 1 0 8 A 8 8 0 0 0 0 -8" fill="#000" opacity="0.5" />
              </g>

              <path d={getOrbitPath()} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
            </svg>
          </div>

          <div className="bg-slate-900 p-0 relative overflow-hidden border-8 border-black rounded-xl flex-1 min-h-[200px] flex items-center justify-center">
            <span className="absolute top-4 left-4 bg-yellow-300 text-black font-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000] text-[10px] rotate-2 z-30 uppercase">
              🔭 Pandangan Langit dari Bumi
            </span>

            <div className="w-full max-w-[200px] aspect-square relative z-10 flex items-center justify-center p-4">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {simMode === 'SOLAR' ? (
                  <g>
                    <rect x="-50" y="-50" width="200" height="200" fill={getSkyColor()} />
                    <circle cx="50" cy="50" r="30" fill="#facc15" stroke="#ea580c" strokeWidth="2" />
                    <circle
                      cx={10 + (progress / 100) * 80}
                      cy={50 + dy * 0.8}
                      r="30.5"
                      fill="#1e293b"
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                  </g>
                ) : (
                  <g>
                    <rect x="-50" y="-50" width="200" height="200" fill={getSkyColor()} />
                    <circle cx="20" cy="20" r="1" fill="#fff" />
                    <circle cx="80" cy="80" r="1" fill="#fff" />
                    <circle cx="50" cy="50" r="45" fill="#450a0a" opacity="0.8" filter="blur(4px)" />
                    <circle cx="50" cy="50" r="70" fill="#0f172a" opacity="0.5" filter="blur(8px)" />
                    <circle
                      cx={10 + (progress / 100) * 80}
                      cy={50 + dy * 0.8}
                      r="15"
                      fill={getMoonColor()}
                      stroke="#d97706"
                      strokeWidth="1"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-7xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          MEMAHAMI ANATOMI BAYANGAN 🌑
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-slate-800 border-b-2 border-black pb-1 mb-2">UMBRA (Bayangan Inti)</h4>
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Umbra adalah bagian terdalam dan tergelap dari bayangan. Di area ini, sumber cahaya (Matahari) tertutup sepenuhnya oleh benda langit penghalang. Siapapun yang berada di dalam Umbra akan mengalami <b>Gerhana Total</b>.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-slate-500 border-b-2 border-black pb-1 mb-2">PENUMBRA (Bayangan Kabur)</h4>
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Penumbra adalah bayangan bagian luar yang lebih terang. Di area ini, hanya sebagian cahaya Matahari yang terhalang. Siapapun yang berada di dalam area Penumbra hanya akan melihat <b>Gerhana Sebagian (Parsial)</b>.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-rose-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <h4 className="font-black text-md uppercase text-rose-800 mb-2">Mengapa Gerhana Tidak Terjadi Setiap Bulan?</h4>
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            Meskipun Bulan melewati fase Bulan Baru dan Purnama setiap bulan, gerhana sangat jarang terjadi. Ini karena <b>orbit Bulan miring sekitar 5 derajat</b> terhadap orbit Bumi. Akibatnya, bayangan Bulan sering meleset (berada di atas atau di bawah Bumi). Gerhana hanya terjadi jika ketiganya benar-benar berada di satu garis lurus sempurna yang disebut <b>Syzygy</b>.
          </p>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-7xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI ASTRONOMI [KUIS]</h3>
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
                            ? 'bg-rose-400 text-black line-through'
                            : 'bg-white opacity-50'
                          : userAnswers[qIndex] === optIndex
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-yellow-200 text-black cursor-pointer'
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
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? 'Sempurna! Anda memahami fenomena langit dengan baik.' : 'Bagus! Coba mainkan lagi simulasi pergeseran orbitnya.'}
              </p>
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
