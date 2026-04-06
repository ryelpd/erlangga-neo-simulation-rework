import { useState, useEffect, useRef, useCallback } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: '1. Prinsip utama fisika yang menjelaskan naiknya balon udara adalah...',
    options: ['Hukum Newton', 'Hukum Pascal', 'Hukum Archimedes', 'Hukum Ohm'],
    answer: 2,
  },
  {
    question: '2. Mengapa balon harus dipanaskan menggunakan burner?',
    options: ['Agar kain balon tidak membeku di atas', 'Meningkatkan massa jenis udara di dalam balon', 'Mengurangi massa jenis udara di dalam balon', 'Agar udara di luar balon menjadi panas'],
    answer: 2,
  },
  {
    question: '3. Berdasarkan papan rumus, syarat mutlak agar balon udara dapat naik adalah...',
    options: ['Fa = W (Gaya Apung sama dengan Berat)', 'Fa < W (Gaya Apung lebih kecil dari Berat)', 'Fa > W (Gaya Apung lebih besar dari Berat)', 'Suhu udara luar lebih panas dari suhu dalam'],
    answer: 2,
  },
  {
    question: '4. Perhatikan panah simulasi gaya. Saat balon sedang bergerak turun (sink), manakah panah yang lebih panjang?',
    options: ['Panah Gaya Berat (Merah)', 'Panah Gaya Apung (Hijau)', 'Keduanya sama panjang', 'Tidak ada panah'],
    answer: 0,
  },
  {
    question: '5. Apa hubungan antara suhu gas (T) dan massa jenisnya (ρ) berdasarkan teori gas ideal?',
    options: ['Berbanding lurus', 'Berbanding terbalik', 'Suhu tidak memengaruhi massa jenis', 'Massa jenis sama dengan suhu'],
    answer: 1,
  },
];

const GROUND_Y = 350;
const MAX_ALTITUDE_Y = 100;
const W_WEIGHT = 50;

export default function BalonUdara() {
  const [isBurnerOn, setIsBurnerOn] = useState(false);
  const [heatValue, setHeatValue] = useState(1);
  const [altitude, setAltitude] = useState(0);

  const balloonYRef = useRef(GROUND_Y);
  const velocityRef = useRef(0);
  const currentTempRef = useRef(0);
  const faBuoyancyRef = useRef(50);
  const animationFrameId = useRef<number | null>(null);

  const balloonGroupRef = useRef<SVGGElement | null>(null);
  const flameGroupRef = useRef<SVGGElement | null>(null);
  const arrowFaRef = useRef<SVGLineElement | null>(null);
  const textFaRef = useRef<SVGTextElement | null>(null);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const toggleBurner = () => {
    setIsBurnerOn(!isBurnerOn);
  };

  const animatePhysics = useCallback(() => {
    const targetTemp = isBurnerOn ? heatValue * 10 : 0;
    currentTempRef.current += (targetTemp - currentTempRef.current) * 0.05;

    if (flameGroupRef.current) {
      if (isBurnerOn) {
        flameGroupRef.current.setAttribute('opacity', '1');
        const scale = 0.5 + heatValue * 0.5;
        const flickerScale = scale + (Math.random() * 0.1 - 0.05);
        flameGroupRef.current.setAttribute('transform', `translate(0, -30) scale(${flickerScale})`);
      } else {
        flameGroupRef.current.setAttribute('opacity', '0');
      }
    }

    faBuoyancyRef.current = 40 + currentTempRef.current * 1.5;

    const baseArrowLength = 70;
    const faArrowLength = baseArrowLength * (faBuoyancyRef.current / W_WEIGHT);
    
    if (arrowFaRef.current) {
      arrowFaRef.current.setAttribute('y2', String(-80 - faArrowLength));
    }
    if (textFaRef.current) {
      textFaRef.current.setAttribute('y', String(-80 - faArrowLength - 10));
    }

    const netForce = faBuoyancyRef.current - W_WEIGHT;
    velocityRef.current += netForce * 0.015;
    velocityRef.current *= 0.92;

    balloonYRef.current -= velocityRef.current;

    if (balloonYRef.current >= GROUND_Y) {
      balloonYRef.current = GROUND_Y;
      if (velocityRef.current < 0) velocityRef.current = 0;
    } else if (balloonYRef.current <= MAX_ALTITUDE_Y) {
      balloonYRef.current = MAX_ALTITUDE_Y;
      if (velocityRef.current > 0) velocityRef.current = 0;
    }

    if (balloonGroupRef.current) {
      balloonGroupRef.current.setAttribute('transform', `translate(400, ${balloonYRef.current})`);
    }

    const altitudeRatio = (GROUND_Y - balloonYRef.current) / (GROUND_Y - MAX_ALTITUDE_Y);
    setAltitude(Math.round(altitudeRatio * 1500));

    animationFrameId.current = requestAnimationFrame(animatePhysics);
  }, [isBurnerOn, heatValue]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animatePhysics);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [animatePhysics]);

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
    if (score === 5) return 'SEMPURNA! KAMU SUDAH MENGUASAI HUKUM ARCHIMEDES.';
    if (score >= 3) return 'CUKUP BAIK. TERUS BERLATIH DAN PERHATIKAN SIMULASI.';
    return 'YUK BACA MATERINYA LAGI DENGAN LEBIH TELITI.';
  };

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
        }
        .neo-btn:active {
          transform: translate(6px, 6px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
        .neo-tag {
          border: 3px solid #000;
          box-shadow: 3px 3px 0px 0px #000;
        }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 28px;
          width: 28px;
          background: #ef4444;
          border: 4px solid #000000;
          border-radius: 0px;
          cursor: pointer;
          margin-top: -10px;
          box-shadow: 4px 4px 0px 0px #000000;
          transition: all 0.1s ease;
        }
        input[type=range]::-webkit-slider-thumb:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px 0px #000000;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 8px;
          cursor: pointer;
          background: #000000;
          border-radius: 4px;
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10 neo-box bg-cyan-300 p-6 relative">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 neo-tag font-bold text-sm transform -rotate-3">
            FISIKA KELAS XI
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 uppercase tracking-tight">
            LAB VIRTUAL: BALON UDARA
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
            Hukum Archimedes & Konsep Massa Jenis Gas (Fluida Statis)
          </p>
        </header>

        <div className="neo-box bg-white p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <button
            onClick={toggleBurner}
            className={`neo-btn ${isBurnerOn ? 'bg-orange-500 text-white' : 'bg-slate-300 text-black'} text-xl py-3 px-8 flex items-center gap-3`}
          >
            <span>{isBurnerOn ? '🔥' : '❄️'}</span>
            <span>BURNER [{isBurnerOn ? 'MENYALA' : 'MATI'}]</span>
          </button>

          <div className={`flex-1 w-full max-w-md bg-orange-200 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] ${!isBurnerOn ? 'opacity-50' : ''}`}>
            <label className="flex justify-between text-sm font-bold text-black mb-4 uppercase">
              <span className="bg-white px-2 border-2 border-black">Kecil</span>
              <span>Intensitas Api (Suhu)</span>
              <span className="bg-white px-2 border-2 border-black">Besar</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={heatValue}
              onChange={(e) => setHeatValue(parseFloat(e.target.value))}
              disabled={!isBurnerOn}
            />
          </div>

          <div className="hidden md:flex flex-col items-center justify-center bg-white p-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] w-48">
            <span className="text-xs font-bold uppercase mb-1">Status Ketinggian</span>
            <span className="text-2xl font-black font-mono">{altitude} m</span>
          </div>
        </div>

        <div className="neo-box bg-sky-200 p-6 relative flex flex-col items-center mb-10 overflow-hidden">
          <div className="bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] absolute top-6 left-6 z-20 transform -rotate-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">AREA SIMULASI</h2>
          </div>

          <div className="absolute top-6 right-6 z-20 bg-white/90 p-3 border-2 border-black flex flex-col gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500 border border-black"></div> Gaya Apung (Fa)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-500 border border-black"></div> Gaya Berat (W)
            </div>
          </div>

          <div className="relative w-full max-w-[800px] h-[500px] neo-box bg-white mt-12 md:mt-0 overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-16 bg-lime-400 border-t-4 border-black z-10"></div>

            <svg viewBox="0 0 800 500" className="w-full h-full relative z-20 overflow-visible">
              <g fill="#fff" stroke="#000" strokeWidth="3">
                <path d="M100 100 Q120 80 140 100 Q160 80 180 100 Q190 120 180 140 L100 140 Q80 120 100 100 Z" opacity="0.8"/>
                <path d="M600 150 Q630 120 660 150 Q690 120 720 150 Q740 180 720 210 L600 210 Q570 180 600 150 Z" opacity="0.6"/>
              </g>

              <g ref={balloonGroupRef} transform="translate(400, 350)">
                <line ref={arrowFaRef} x1="0" y1="-80" x2="0" y2="-150" stroke="#22c55e" strokeWidth="8" markerEnd="url(#arrowheadGreen)"/>
                <text ref={textFaRef} x="15" y="-120" fontSize="16" fontWeight="bold" fill="#000">Fa</text>

                <line x1="0" y1="20" x2="0" y2="90" stroke="#ef4444" strokeWidth="8" markerEnd="url(#arrowheadRed)"/>
                <text x="15" y="60" fontSize="16" fontWeight="bold" fill="#000">W</text>

                <line x1="-20" y1="0" x2="-40" y2="-60" stroke="#000" strokeWidth="3"/>
                <line x1="20" y1="0" x2="40" y2="-60" stroke="#000" strokeWidth="3"/>

                <rect x="-25" y="0" width="50" height="35" fill="#fcd34d" stroke="#000" strokeWidth="4" rx="2"/>
                <line x1="-25" y1="12" x2="25" y2="12" stroke="#000" strokeWidth="2"/>
                <line x1="-25" y1="24" x2="25" y2="24" stroke="#000" strokeWidth="2"/>

                <rect x="-10" y="-30" width="20" height="10" fill="#9ca3af" stroke="#000" strokeWidth="2"/>

                <g ref={flameGroupRef} opacity="0" transform="translate(0, -30)">
                  <path d="M0 0 Q-15 -20 0 -40 Q15 -20 0 0 Z" fill="#f97316" stroke="#000" strokeWidth="2"/>
                  <path d="M0 -5 Q-8 -15 0 -25 Q8 -15 0 -5 Z" fill="#fef08a"/>
                </g>

                <path d="M0 -150 C -80 -150, -90 -60, -30 -30 L -15 -30 L 15 -30 L 30 -30 C 90 -60, 80 -150, 0 -150 Z" fill="#f43f5e" stroke="#000" strokeWidth="4"/>
                <path d="M0 -150 Q-30 -100 -20 -30" fill="none" stroke="#000" strokeWidth="2" opacity="0.3"/>
                <path d="M0 -150 Q30 -100 20 -30" fill="none" stroke="#000" strokeWidth="2" opacity="0.3"/>
              </g>

              <defs>
                <marker id="arrowheadGreen" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#22c55e" />
                </marker>
                <marker id="arrowheadRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>

        <div className="bg-yellow-300 neo-box p-6 mb-10">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform -rotate-1">
            KONSEP FISIKA: MENGAPA BALON BISA TERBANG?
          </h3>
          <p className="text-black font-semibold text-md leading-relaxed mb-3 bg-white/60 p-3 border-2 border-black border-dashed">
            Balon udara bekerja berdasarkan <strong>Hukum Archimedes</strong>. Hukum ini menyatakan bahwa benda yang dicelupkan ke dalam fluida (dalam hal ini udara) akan mengalami <strong>Gaya Apung (Fa)</strong> ke atas sebesar berat fluida yang dipindahkan.
          </p>
          <p className="text-black font-semibold text-md leading-relaxed bg-white/60 p-3 border-2 border-black border-dashed">
            Saat pemanas (burner) dinyalakan, udara di dalam balon menjadi panas. Udara panas memuai sehingga <strong>massa jenisnya lebih kecil</strong> dibandingkan udara dingin di luar. Hal ini membuat Gaya Apung (Fa) menjadi lebih besar dari Gaya Berat (W), sehingga balon bergerak naik!
          </p>
        </div>

        <div className="bg-indigo-300 neo-box p-6 mb-10">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_#000]">
            PAPAN RUMUS MATEMATIS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="text-xl font-bold text-green-600 mb-4 border-b-4 border-black pb-2 uppercase">
                Hukum Archimedes (Gaya Apung)
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-green-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">GAYA APUNG KE ATAS</div>
                  <div className="text-2xl font-bold text-black font-mono mt-2">F<sub>a</sub> = ρ<sub>u</sub> × V × g</div>
                  <p className="text-sm mt-1 font-semibold">ρ<sub>u</sub> = Massa jenis udara luar, V = Volume balon, g = Gravitasi</p>
                </li>
                <li className="p-3 border-2 border-black bg-green-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">SYARAT TERBANG</div>
                  <div className="text-xl font-bold text-black font-mono mt-2">F<sub>a</sub> &gt; W<sub>total</sub></div>
                  <p className="text-sm mt-1 font-semibold">Balon naik jika Gaya Apung lebih besar dari Berat Total.</p>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="text-xl font-bold text-orange-500 mb-4 border-b-4 border-black pb-2 uppercase">
                Hukum Gas (Suhu & Kerapatan)
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-orange-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">HUBUNGAN MASSA JENIS</div>
                  <div className="text-2xl font-bold text-black font-mono mt-2">ρ ∝ 1 / T</div>
                  <p className="text-sm mt-1 font-semibold">Massa jenis (ρ) berbanding terbalik dengan Suhu (T).</p>
                </li>
                <li className="p-3 border-2 border-black bg-orange-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">BERAT TOTAL (W)</div>
                  <div className="text-2xl font-bold text-black font-mono mt-2">W = m<sub>beban</sub> + m<sub>udara_dalam</sub></div>
                  <p className="text-sm mt-1 font-semibold">Semakin panas suhu dalam balon, massanya menyusut.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-fuchsia-300 neo-box p-6 mb-10">
          <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
            <h3 className="text-2xl font-bold uppercase tracking-widest text-center">
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

        <div className="neo-box bg-white p-5 mb-10 text-sm font-semibold border-dashed">
          <h4 className="font-bold text-black mb-2 uppercase bg-black text-white inline-block px-2 py-1">
            REFERENSI MATERI:
          </h4>
          <ol className="list-decimal list-inside space-y-2 mt-2">
            <li><a href="#" className="hover:text-blue-600 underline">Modul Fisika Kelas XI Kemdikbud: Fluida Statis (Hukum Archimedes).</a></li>
            <li><a href="#" className="hover:text-blue-600 underline">Ruangguru. Konsep Gaya Apung dan Penerapannya pada Balon Udara.</a></li>
            <li><a href="#" className="hover:text-blue-600 underline">Zenius Education. Hubungan Suhu dan Kerapatan Gas.</a></li>
          </ol>
        </div>
      </div>
    </div>
  );
}