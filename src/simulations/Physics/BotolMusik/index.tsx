import { useState, useRef, useEffect, useCallback } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: '1. Pada alat musik botol yang DIPUKUL menggunakan pemukul logam, komponen apa yang paling utama bergetar menghasilkan bunyi?',
    options: ['Kolom udara kosong di dalam botol', 'Kaca botol dan air di dalamnya', 'Hanya airnya saja', 'Pemukul logamnya saja'],
    answer: 1,
  },
  {
    question: '2. Saat kita memukul botol, botol mana yang akan menghasilkan nada PALING RENDAH (Bass)?',
    options: ['Botol yang paling kosong', 'Botol yang terisi air setengah', 'Botol yang terisi air penuh', 'Semua botol sama nadanya'],
    answer: 2,
  },
  {
    question: '3. Sebaliknya, saat kita MENIUP mulut botol, komponen apa yang beresonansi (bergetar)?',
    options: ['Kaca botol', 'Kolom udara kosong di atas air', 'Air di dasar botol', 'Bibir kita'],
    answer: 1,
  },
  {
    question: '4. Berdasarkan rumus frekuensi ditiup (f = v / 4L), apa yang terjadi jika botol diisi air semakin banyak (Nilai L mengecil)?',
    options: ['Frekuensi mengecil, nada menjadi rendah', 'Frekuensi membesar, nada menjadi tinggi', 'Tidak ada suara yang dihasilkan', 'Cepat rambat bunyi (v) berubah'],
    answer: 1,
  },
  {
    question: '5. Coba atur Botol 1 berisi SEDIKIT AIR dan Botol 5 berisi PENUH AIR. Kesimpulan apa yang BENAR dari simulasi ini?',
    options: ['Saat dipukul, Botol 5 nadanya lebih tinggi dari Botol 1', 'Saat ditiup, Botol 5 nadanya lebih rendah dari Botol 1', 'Sifat tangga nada saat ditiup BERKEBALIKAN dengan sifat saat dipukul', 'Air tidak berpengaruh sama sekali terhadap nada'],
    answer: 2,
  },
];

const COLORS = ['#f43f5e', '#0ea5e9', '#22c55e', '#facc15', '#c084fc'];
const BOTTLE_LABELS = ['1', '2', '3', '4', '5'];

export default function BotolMusik() {
  const [waterLevels, setWaterLevels] = useState([0.2, 0.4, 0.6, 0.8, 1.0]);
  const [currentMode, setCurrentMode] = useState<'HIT' | 'BLOW'>('HIT');
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [floatingNotes, setFloatingNotes] = useState<{ id: number; bottleIndex: number; color: string }[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noteIdRef = useRef(0);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsAudioReady(true);
  }, []);

  const calculateFrequency = useCallback((L: number) => {
    const f_min = 300;
    const f_max = 800;

    if (currentMode === 'HIT') {
      return f_max - L * (f_max - f_min);
    } else {
      return f_min + L * (f_max - f_min);
    }
  }, [currentMode]);

  const playSound = useCallback((frequency: number, bottleIndex: number) => {
    if (!audioCtxRef.current || !isAudioReady) return;

    const osc = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();

    osc.type = currentMode === 'HIT' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);

    gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);

    if (currentMode === 'HIT') {
      gainNode.gain.linearRampToValueAtTime(1.0, audioCtxRef.current.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 1.0);
      osc.start(audioCtxRef.current.currentTime);
      osc.stop(audioCtxRef.current.currentTime + 1.0);
    } else {
      gainNode.gain.linearRampToValueAtTime(0.8, audioCtxRef.current.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.8, audioCtxRef.current.currentTime + 0.3);
      gainNode.gain.linearRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.6);
      osc.start(audioCtxRef.current.currentTime);
      osc.stop(audioCtxRef.current.currentTime + 0.6);
    }

    osc.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    const id = noteIdRef.current++;
    setFloatingNotes(prev => [...prev, { id, bottleIndex, color: COLORS[bottleIndex] }]);
    setTimeout(() => {
      setFloatingNotes(prev => prev.filter(n => n.id !== id));
    }, 1000);
  }, [currentMode, isAudioReady]);

  const handleBottleClick = (index: number) => {
    if (!isAudioReady) {
      initAudio();
      return;
    }
    const freq = calculateFrequency(waterLevels[index]);
    playSound(freq, index);
  };

  const handleSliderChange = (index: number, value: number) => {
    const newLevels = [...waterLevels];
    newLevels[index] = value;
    setWaterLevels(newLevels);
  };

  const autoTune = () => {
    setWaterLevels([0.1, 0.3, 0.5, 0.7, 0.9]);
    
    if (isAudioReady && audioCtxRef.current) {
      const newLevels = [0.1, 0.3, 0.5, 0.7, 0.9];
      newLevels.forEach((level, i) => {
        setTimeout(() => {
          const freq = calculateFrequency(level);
          playSound(freq, i);
        }, i * 300);
      });
    }
  };

  const selectAnswer = (qIndex: number, optIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIndex] = optIndex;
    setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
    let s = 0;
    userAnswers.forEach((ans, index) => {
      if (ans === quizData[index].answer) s++;
    });
    setScore(s);
    setQuizSubmitted(true);
  };

  const retryQuiz = () => {
    setUserAnswers(new Array(quizData.length).fill(null));
    setQuizSubmitted(false);
    setScore(0);
  };

  const getScoreMessage = () => {
    if (score === 5) return 'SEMPURNA! KAMU PAHAM BETUL PRINSIP RESONANSI BUNYI.';
    if (score >= 3) return 'CUKUP BAIK. COBA MAIN-MAIN LAGI DENGAN BOTOLNYA UNTUK MEMBUKTIKAN.';
    return 'YUK BACA LAGI BAGIAN KONSEP FISIKA DI ATAS.';
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8" style={{
      backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)',
      backgroundSize: '24px 24px',
    }}>
      <style>{`
        .neo-box {
          background-color: #ffffff;
          border: 4px solid #000000;
          box-shadow: 8px 8px 0px 0px #000000;
          border-radius: 12px;
        }
        .neo-btn {
          border: 4px solid #000000;
          box-shadow: 6px 6px 0px 0px #000000;
          border-radius: 8px;
          transition: all 0.1s ease-in-out;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
        }
        .neo-btn:active {
          transform: translate(6px, 6px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
        .neo-tag {
          border: 3px solid #000;
          box-shadow: 3px 3px 0px 0px #000;
        }
        .bottle-btn {
          transition: transform 0.05s;
          cursor: pointer;
        }
        .bottle-btn:active {
          transform: scale(0.95) translateY(10px);
        }
        .slider-wrapper {
          border: 4px solid #000;
          background: #fff;
          padding: 10px;
          box-shadow: 4px 4px 0px 0px #000;
          border-radius: 8px;
        }
        input[type=range] {
          -webkit-appearance: none;
          width: 150px;
          height: 8px;
          background: #000;
          border-radius: 4px;
          cursor: pointer;
          transform: rotate(-90deg);
          transform-origin: center center;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border: 4px solid #000000;
          border-radius: 0px;
          cursor: pointer;
          box-shadow: 4px 4px 0px 0px #000000;
          background: #facc15;
        }
        input[type=range]::-webkit-slider-thumb:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px 0px #000000;
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 1; }
          100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
        }
        .note-bubble {
          animation: floatUp 1s ease-out forwards;
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8 neo-box bg-cyan-300 p-6 relative">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 neo-tag font-bold text-sm transform -rotate-3">
            FISIKA KELAS XI
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
            LAB VIRTUAL: BOTOL MUSIK
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
            Gelombang Bunyi, Frekuensi, & Resonansi Kolom Udara
          </p>
        </header>

        <div className="neo-box bg-white p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max">
              Mode Memainkan Alat Musik
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentMode('HIT')}
                className={`neo-btn flex-1 py-3 px-4 text-center ${currentMode === 'HIT' ? 'bg-rose-400 text-black' : 'bg-slate-100 text-slate-500'}`}
              >
                🔨 DIPUKUL (GETARAN KACA)
              </button>
              <button
                onClick={() => setCurrentMode('BLOW')}
                className={`neo-btn flex-1 py-3 px-4 text-center ${currentMode === 'BLOW' ? 'bg-sky-400 text-black' : 'bg-slate-100 text-slate-500'}`}
              >
                🌬️ DITIUP (KOLOM UDARA)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={initAudio}
              className={`neo-btn ${isAudioReady ? 'bg-slate-200 border-dashed' : 'bg-green-400 animate-bounce hover:animate-none'} text-black py-4 px-8 text-xl`}
              disabled={isAudioReady}
            >
              {isAudioReady ? '✅ AUDIO AKTIF' : '🔊 AKTIFKAN AUDIO'}
            </button>
            <button
              onClick={autoTune}
              className="neo-btn bg-indigo-300 text-black py-2 px-8 text-sm"
            >
              🎵 SETEL OTOMATIS (TANGGA NADA)
            </button>
          </div>
        </div>

        <div className="neo-box bg-slate-100 p-6 relative flex flex-col items-center mb-10 overflow-hidden">
          <div className="absolute top-6 left-6 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform -rotate-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">AREA EKSPERIMEN</h2>
          </div>

          <div className="w-full flex flex-wrap justify-center items-end gap-4 md:gap-8 mt-24 mb-8">
            {waterLevels.map((level, i) => (
              <div key={i} className="flex flex-col items-center gap-4">
                <div
                  className="relative w-[80px] md:w-[120px] h-[200px] md:h-[250px] bottle-btn group"
                  onClick={() => handleBottleClick(i)}
                >
                  <svg viewBox="0 0 100 250" className="w-full h-full overflow-visible drop-shadow-[4px_4px_0px_#000]">
                    <clipPath id={`bottleClip${i}`}>
                      <path d="M 35 10 L 65 10 L 65 80 L 90 110 L 90 240 L 10 240 L 10 110 L 35 80 Z"/>
                    </clipPath>
                    
                    <path d="M 35 10 L 65 10 L 65 80 L 90 110 L 90 240 L 10 240 L 10 110 L 35 80 Z" fill="#ffffff" stroke="#000" strokeWidth="6"/>
                    
                    <rect
                      x="0"
                      y={240 - level * 150}
                      width="100"
                      height={level * 150}
                      fill={COLORS[i]}
                      clipPath={`url(#bottleClip${i})`}
                    />
                    <line
                      x1="0"
                      y1={240 - level * 150}
                      x2="100"
                      y2={240 - level * 150}
                      stroke="#000"
                      strokeWidth="4"
                      clipPath={`url(#bottleClip${i})`}
                    />
                    
                    <path d="M 35 10 L 65 10 L 65 80 L 90 110 L 90 240 L 10 240 L 10 110 L 35 80 Z" fill="none" stroke="#000" strokeWidth="6" strokeLinejoin="round"/>
                    
                    <rect x="30" y="0" width="40" height="15" rx="3" fill="#ffffff" stroke="#000" strokeWidth="4"/>
                    
                    <rect x="35" y="150" width="30" height="30" fill="#fff" stroke="#000" strokeWidth="3" rx="4"/>
                    <text x="50" y="171" fontSize="20" fontWeight="900" textAnchor="middle" fill="#000">{BOTTLE_LABELS[i]}</text>
                  </svg>

                  {floatingNotes.filter(n => n.bottleIndex === i).map(note => (
                    <div
                      key={note.id}
                      className="note-bubble absolute font-black text-2xl"
                      style={{
                        color: note.color,
                        left: 'calc(50% - 10px)',
                        top: '20px',
                        textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                      }}
                    >
                      ♪
                    </div>
                  ))}
                </div>

                <div className="slider-wrapper w-[60px] h-[180px] flex flex-col justify-center items-center gap-2">
                  <div className="h-[140px] flex items-center justify-center">
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={level}
                      onChange={(e) => handleSliderChange(i, parseFloat(e.target.value))}
                      onMouseUp={() => handleBottleClick(i)}
                    />
                  </div>
                  <span className="text-xs font-bold font-mono">AIR</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-300 neo-box p-6 mb-10">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform -rotate-1">
            KONSEP FISIKA: MENGAPA NADANYA BERUBAH?
          </h3>
          <p className="text-black font-semibold text-md leading-relaxed mb-3 bg-white/60 p-3 border-2 border-black border-dashed">
            Bunyi dihasilkan oleh sesuatu yang <strong>bergetar</strong>. Tinggi-rendahnya nada ditentukan oleh <strong>Frekuensi</strong> (kecepatan getaran).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-rose-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="font-black uppercase text-rose-700 mb-2">🔨 JIKA BOTOL DIPUKUL</h4>
              <p className="text-sm font-semibold text-black">Yang bergetar adalah <strong>Kaca Botol dan Air di dalamnya</strong>. Semakin banyak air, semakin berat massa yang harus digetarkan. Akibatnya getaran menjadi lambat. <br /><br /><strong>Kesimpulan:</strong> Air BANYAK = Frekuensi Rendah = <strong>Nada RENDAH (Bass)</strong>.</p>
            </div>
            <div className="bg-sky-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="font-black uppercase text-sky-700 mb-2">🌬️ JIKA BOTOL DITIUP</h4>
              <p className="text-sm font-semibold text-black">Yang bergetar (resonansi) adalah <strong>Kolom Udara kosong</strong> di atas air. Semakin banyak air, ruang udaranya semakin pendek, sehingga udara bergetar lebih cepat. <br /><br /><strong>Kesimpulan:</strong> Air BANYAK (Udara Sedikit) = Frekuensi Tinggi = <strong>Nada TINGGI (Melengking)</strong>.</p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-300 neo-box p-6 mb-10">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_#000]">
            PAPAN RUMUS MATEMATIS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="text-xl font-black text-indigo-600 mb-4 border-b-4 border-black pb-2 uppercase">
                Resonansi Kolom Udara (Ditiup)
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-indigo-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">RUMUS FREKUENSI DASAR</div>
                  <div className="text-2xl font-black text-black font-mono mt-2">f = v / (4L)</div>
                  <p className="text-sm mt-1 font-semibold">Botol berperilaku seperti pipa organa ujung tertutup (air sebagai tutupnya).</p>
                </li>
                <li className="p-3 border-2 border-black bg-indigo-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">KETERANGAN RUMUS</div>
                  <div className="text-sm font-black text-black mt-2">
                    <strong>f</strong> = Frekuensi (Hz)<br />
                    <strong>v</strong> = Cepat rambat bunyi udara (±340 m/s)<br />
                    <strong>L</strong> = Panjang kolom udara kosong (m)
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="text-xl font-black text-rose-600 mb-4 border-b-4 border-black pb-2 uppercase">
                Getaran Massa (Dipukul)
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-rose-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">HUBUNGAN MASSA & FREKUENSI</div>
                  <div className="text-2xl font-black text-black font-mono mt-2">f ∝ 1 / √m</div>
                  <p className="text-sm mt-1 font-semibold">Frekuensi berbanding terbalik dengan akar massa total (kaca + air).</p>
                </li>
                <li className="p-3 border-2 border-black bg-rose-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">LOGIKA SEDERHANA</div>
                  <p className="text-sm font-black text-black mt-2">
                    Benda yang berat dan besar bergerak lebih lambat. Oleh karena itu, botol yang penuh air akan menghasilkan getaran yang lambat (Nada Rendah).
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-fuchsia-300 neo-box p-6 mb-10">
          <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
            <h3 className="text-2xl font-black uppercase tracking-widest text-center">
              EVALUASI KONSEP [KUIS]
            </h3>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
            <div className="space-y-6">
              {quizData.map((q, qIndex) => (
                <div key={qIndex} className="bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                  <h4 className="font-bold text-black mb-4 text-lg bg-white inline-block px-2 border-2 border-black">
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                        disabled={quizSubmitted}
                        className={`neo-btn text-left px-4 py-3 ${
                          quizSubmitted
                            ? optIndex === q.answer
                              ? 'bg-green-400 text-black'
                              : userAnswers[qIndex] === optIndex
                                ? 'bg-rose-400 text-black line-through'
                                : 'bg-white opacity-50'
                            : userAnswers[qIndex] === optIndex
                              ? 'bg-black text-white'
                              : 'bg-white text-black hover:bg-yellow-200'
                        }`}
                        style={quizSubmitted ? { boxShadow: '2px 2px 0px 0px #000', transform: 'translate(2px, 2px)' } : {}}
                      >
                        {quizSubmitted && optIndex === q.answer && '[ BENAR ] '}
                        {quizSubmitted && userAnswers[qIndex] === optIndex && optIndex !== q.answer && '[ SALAH ] '}
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!quizSubmitted && userAnswers.every((a) => a !== null) && (
              <div className="text-center mt-8">
                <button
                  onClick={calculateScore}
                  className="neo-btn bg-indigo-400 text-black font-bold py-3 px-10 text-xl uppercase tracking-widest hover:bg-indigo-300"
                >
                  KIRIM JAWABAN!
                </button>
              </div>
            )}

            {quizSubmitted && (
              <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                <h4 className="text-3xl font-bold text-black mb-2 uppercase">
                  SKOR AKHIR: {score} / 5
                </h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {getScoreMessage()}
                </p>
                <br />
                <button
                  onClick={retryQuiz}
                  className="neo-btn bg-black text-white py-3 px-8 text-lg uppercase tracking-wider"
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