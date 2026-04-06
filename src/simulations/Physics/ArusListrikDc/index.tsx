import { useState, useEffect, useRef, useCallback } from 'react';

const NUM_ELECTRONS = 18;
const ELECTRON_RADIUS = 6;

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: '1. Pada arus searah (DC), bagaimana karakteristik aliran muatan listriknya?',
    options: ['Berosilasi secara periodik', 'Mengalir stabil dalam satu arah', 'Tegangannya berubah-ubah', 'Mengalir dari positif ke negatif di animasi'],
    answer: 1,
  },
  {
    question: '2. Nilai tegangan listrik PLN yang diukur menggunakan voltmeter merupakan nilai...',
    options: ['Tegangan Sesaat', 'Tegangan Maksimum (Vmax)', 'Tegangan Efektif (Vrms)', 'Tegangan Puncak'],
    answer: 2,
  },
  {
    question: '3. Arus listrik konvensional secara teoritis disepakati mengalir dari...',
    options: ['Kutub Negatif (-) ke Positif (+)', 'Kutub Positif (+) ke Negatif (-)', 'Neutron ke Proton', 'Tidak berarah'],
    answer: 1,
  },
  {
    question: '4. Persamaan manakah yang merepresentasikan Hukum Ohm?',
    options: ['P = V × I', 'V(t) = Vmax × sin(ωt)', 'V = I × R', 'I = V × P'],
    answer: 2,
  },
  {
    question: '5. Titik animasi pada rangkaian di atas memvisualisasikan arah partikel...',
    options: ['Proton', 'Neutron', 'Foton', 'Elektron'],
    answer: 3,
  },
];

export default function ArusListrikDc() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const animationTime = useRef(0);
  const lastTime = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  const pathDCRef = useRef<SVGPathElement | null>(null);
  const pathACRef = useRef<SVGPathElement | null>(null);
  const groupDCRef = useRef<SVGGElement | null>(null);
  const groupACRef = useRef<SVGGElement | null>(null);
  const bulbDCRef = useRef<SVGCircleElement | null>(null);
  const bulbACRef = useRef<SVGCircleElement | null>(null);

  const electronsDCRef = useRef<SVGCircleElement[]>([]);
  const electronsACRef = useRef<SVGCircleElement[]>([]);
  const pathLengthDC = useRef(0);
  const pathLengthAC = useRef(0);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!pathDCRef.current || !pathACRef.current) return;

    pathLengthDC.current = pathDCRef.current.getTotalLength();
    pathLengthAC.current = pathACRef.current.getTotalLength();

    electronsDCRef.current = [];
    electronsACRef.current = [];

    if (groupDCRef.current) {
      groupDCRef.current.innerHTML = '';
      for (let i = 0; i < NUM_ELECTRONS; i++) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('r', String(ELECTRON_RADIUS));
        el.setAttribute('fill', '#ffffff');
        el.setAttribute('stroke', '#000000');
        el.setAttribute('stroke-width', '3');
        groupDCRef.current.appendChild(el);
        electronsDCRef.current.push(el);
      }
    }

    if (groupACRef.current) {
      groupACRef.current.innerHTML = '';
      for (let i = 0; i < NUM_ELECTRONS; i++) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('r', String(ELECTRON_RADIUS));
        el.setAttribute('fill', '#ffffff');
        el.setAttribute('stroke', '#000000');
        el.setAttribute('stroke-width', '3');
        groupACRef.current.appendChild(el);
        electronsACRef.current.push(el);
      }
    }
  }, []);

  const updatePositions = useCallback((time: number) => {
    const lenDC = pathLengthDC.current;
    const lenAC = pathLengthAC.current;

    if (pathDCRef.current) {
      electronsDCRef.current.forEach((el, index) => {
        const spacing = lenDC / NUM_ELECTRONS;
        let currentPos = (index * spacing + time * 60 * speed) % lenDC;
        if (currentPos < 0) currentPos += lenDC;
        const pt = pathDCRef.current!.getPointAtLength(currentPos);
        el.setAttribute('cx', String(pt.x));
        el.setAttribute('cy', String(pt.y));
      });
    }

    if (pathACRef.current) {
      electronsACRef.current.forEach((el, index) => {
        const spacing = lenAC / NUM_ELECTRONS;
        const basePos = index * spacing;
        const oscillation = Math.sin(time * 3 * speed) * 50;
        let currentPos = (basePos + oscillation) % lenAC;
        if (currentPos < 0) currentPos += lenAC;
        const pt = pathACRef.current!.getPointAtLength(currentPos);
        el.setAttribute('cx', String(pt.x));
        el.setAttribute('cy', String(pt.y));
      });
    }

    if (bulbDCRef.current) {
      bulbDCRef.current.setAttribute('fill', isRunning ? '#facc15' : '#ffffff');
    }

    if (bulbACRef.current) {
      if (isRunning) {
        const pulse = Math.abs(Math.sin(time * 3 * speed));
        bulbACRef.current.setAttribute('fill', pulse > 0.3 ? '#facc15' : '#ffffff');
      } else {
        bulbACRef.current.setAttribute('fill', '#ffffff');
      }
    }
  }, [speed, isRunning]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      const deltaTime = (timestamp - lastTime.current) / 1000;
      lastTime.current = timestamp;

      if (isRunning) {
        animationTime.current += deltaTime;
      }

      updatePositions(animationTime.current);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    lastTime.current = performance.now();
    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isRunning, speed, updatePositions]);

  const toggleRunning = () => {
    setIsRunning(!isRunning);
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
    if (score === 5) return 'SEMPURNA! PEMAHAMAN KONSEP FISIKA ANDA SOLID.';
    if (score >= 3) return 'CUKUP BAIK. ANDA MEMAHAMI DASAR AC & DC.';
    return 'WAJIB BACA ULANG MATERI DAN EVALUASI KEMBALI.';
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
          background: #fbbf24;
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
        <header className="text-center mb-10 neo-box bg-yellow-300 p-6 relative">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 neo-tag font-bold text-sm transform -rotate-6">
            FISIKA KELAS XII
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 uppercase tracking-tight">
            LAB VIRTUAL: Arus AC & DC
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
            Karakteristik pergerakan elektron & parameter kelistrikan.
          </p>
        </header>

        <div className="neo-box bg-white p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <button
            onClick={toggleRunning}
            className={`neo-btn ${isRunning ? 'bg-green-400' : 'bg-rose-400'} text-black text-xl py-3 px-8 flex items-center gap-3`}
          >
            <div className={`w-4 h-4 rounded-full ${isRunning ? 'bg-white border-black' : 'bg-black border-white'} border-2`} />
            <span>SAKELAR [{isRunning ? 'ON' : 'OFF'}]</span>
          </button>

          <div className="flex-1 w-full max-w-md bg-sky-200 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
            <label className="flex justify-between text-sm font-bold text-black mb-4 uppercase">
              <span className="bg-white px-2 border-2 border-black">Rendah</span>
              <span>Frekuensi Simulasi</span>
              <span className="bg-white px-2 border-2 border-black">Tinggi</span>
            </label>
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          <div className="neo-box bg-rose-300 p-6 relative flex flex-col items-center">
            <div className="bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] -mt-10 mb-4 transform -rotate-2">
              <h2 className="text-2xl font-bold uppercase tracking-tight">ARUS SEARAH (DC)</h2>
            </div>
            <p className="text-center text-sm font-semibold text-black bg-white/80 p-3 border-2 border-black mb-6">
              Muatan listrik mengalir dalam satu arah konstan. Tegangan bernilai tetap terhadap waktu. Disuplai oleh baterai atau adaptor.
            </p>

            <div className="relative w-full max-w-[400px] aspect-[4/3] neo-box bg-white p-2">
              <svg viewBox="0 0 400 300" className="w-full h-full overflow-visible">
                <path
                  ref={pathDCRef}
                  d="M 100 200 L 100 70 A 20 20 0 0 1 120 50 L 280 50 A 20 20 0 0 1 300 70 L 300 200 A 20 20 0 0 1 280 220 L 120 220 A 20 20 0 0 1 100 200 Z"
                  fill="none"
                  stroke="#000"
                  strokeWidth="12"
                  strokeLinecap="square"
                />
                <path
                  d="M 100 200 L 100 70 A 20 20 0 0 1 120 50 L 280 50 A 20 20 0 0 1 300 70 L 300 200 A 20 20 0 0 1 280 220 L 120 220 A 20 20 0 0 1 100 200 Z"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="4"
                  strokeLinecap="square"
                />
                <g ref={groupDCRef}></g>
                <g transform="translate(75, 110)">
                  <rect x="0" y="20" width="50" height="60" fill="#fff" stroke="#000" strokeWidth="4"/>
                  <rect x="0" y="20" width="50" height="15" fill="#f43f5e" stroke="#000" strokeWidth="4"/>
                  <rect x="15" y="10" width="20" height="10" fill="#fff" stroke="#000" strokeWidth="4"/>
                  <text x="25" y="33" fontSize="14" fontWeight="bold" fill="#000" textAnchor="middle">+</text>
                  <text x="25" y="70" fontSize="20" fontWeight="bold" fill="#000" textAnchor="middle">-</text>
                  <rect x="-45" y="42" width="30" height="20" fill="#fff" stroke="#000" strokeWidth="2"/>
                  <text x="-30" y="56" fontSize="12" fontWeight="bold" fill="#000" textAnchor="middle">DC</text>
                </g>
                <g transform="translate(275, 115)">
                  <path d="M 15 50 L 35 50 L 30 70 L 20 70 Z" fill="#9ca3af" stroke="#000" strokeWidth="4"/>
                  <path d="M 20 50 L 20 30 L 22 20 L 25 35 L 28 20 L 30 30 L 30 50" fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round"/>
                  <circle ref={bulbDCRef} cx="25" cy="25" r="25" fill="#ffffff" stroke="#000" strokeWidth="4"/>
                  <rect x="60" y="42" width="30" height="20" fill="#fff" stroke="#000" strokeWidth="2"/>
                  <text x="75" y="56" fontSize="12" fontWeight="bold" fill="#000" textAnchor="middle">R</text>
                </g>
              </svg>
            </div>
          </div>

          <div className="neo-box bg-cyan-300 p-6 relative flex flex-col items-center">
            <div className="bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] -mt-10 mb-4 transform rotate-2">
              <h2 className="text-2xl font-bold uppercase tracking-tight">ARUS BOLAK-BALIK (AC)</h2>
            </div>
            <p className="text-center text-sm font-semibold text-black bg-white/80 p-3 border-2 border-black mb-6">
              Muatan listrik berosilasi bolak-balik akibat perubahan polaritas. Gelombang sinusoidal. Digunakan pada listrik PLN.
            </p>

            <div className="relative w-full max-w-[400px] aspect-[4/3] neo-box bg-white p-2">
              <svg viewBox="0 0 400 300" className="w-full h-full overflow-visible">
                <path
                  ref={pathACRef}
                  d="M 100 200 L 100 70 A 20 20 0 0 1 120 50 L 280 50 A 20 20 0 0 1 300 70 L 300 200 A 20 20 0 0 1 280 220 L 120 220 A 20 20 0 0 1 100 200 Z"
                  fill="none"
                  stroke="#000"
                  strokeWidth="12"
                  strokeLinecap="square"
                />
                <path
                  d="M 100 200 L 100 70 A 20 20 0 0 1 120 50 L 280 50 A 20 20 0 0 1 300 70 L 300 200 A 20 20 0 0 1 280 220 L 120 220 A 20 20 0 0 1 100 200 Z"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="4"
                  strokeLinecap="square"
                />
                <g ref={groupACRef}></g>
                <g transform="translate(70, 115)">
                  <circle cx="30" cy="30" r="30" fill="#fff" stroke="#000" strokeWidth="4"/>
                  <path d="M 10 30 Q 15 10 20 30 T 30 30 T 40 30 T 50 30" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round"/>
                  <rect x="-45" y="42" width="30" height="20" fill="#fff" stroke="#000" strokeWidth="2"/>
                  <text x="-30" y="56" fontSize="12" fontWeight="bold" fill="#000" textAnchor="middle">AC</text>
                </g>
                <g transform="translate(275, 115)">
                  <path d="M 15 50 L 35 50 L 30 70 L 20 70 Z" fill="#9ca3af" stroke="#000" strokeWidth="4"/>
                  <path d="M 20 50 L 20 30 L 22 20 L 25 35 L 28 20 L 30 30 L 30 50" fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round"/>
                  <circle ref={bulbACRef} cx="25" cy="25" r="25" fill="#ffffff" stroke="#000" strokeWidth="4"/>
                  <rect x="60" y="42" width="30" height="20" fill="#fff" stroke="#000" strokeWidth="2"/>
                  <text x="75" y="56" fontSize="12" fontWeight="bold" fill="#000" textAnchor="middle">R</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <div className="neo-box bg-lime-300 p-6 mb-10">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform -rotate-1">
            KONSEP FISIKA: ARUS VS ELEKTRON
          </h3>
          <p className="text-black font-semibold text-md leading-relaxed mb-3 bg-white/60 p-3 border-2 border-black border-dashed">
            Dalam kesepakatan fisika, <strong>Arus Listrik Konvensional (I)</strong> mengalir dari kutub potensial tinggi (+) menuju potensial rendah (-).
          </p>
          <p className="text-black font-semibold text-md leading-relaxed bg-white/60 p-3 border-2 border-black border-dashed">
            Faktanya, partikel yang bergerak dalam konduktor padat adalah <strong>Elektron</strong>. Simulasi titik putih di atas memvisualisasikan <strong>Arah Aliran Elektron</strong> (mengalir dari - ke +).
          </p>
        </div>

        <div className="neo-box bg-indigo-300 p-6 mb-10">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_#000]">
            PAPAN RUMUS MATEMATIS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="text-xl font-bold text-rose-500 mb-4 border-b-4 border-black pb-2 uppercase">
                Arus Searah (DC)
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-rose-50 relative">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">HUKUM OHM</div>
                  <div className="text-2xl font-bold text-black font-mono mt-2">V = I × R</div>
                  <p className="text-sm mt-1 font-semibold">V = Tegangan, I = Arus, R = Hambatan</p>
                </li>
                <li className="p-3 border-2 border-black bg-rose-50 relative">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">DAYA DISIPASI</div>
                  <div className="text-2xl font-bold text-black font-mono mt-2">P = V × I</div>
                  <p className="text-sm mt-1 font-semibold">P = Daya Listrik (Watt)</p>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="text-xl font-bold text-cyan-500 mb-4 border-b-4 border-black pb-2 uppercase">
                Arus Bolak-balik (AC)
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-cyan-50 relative">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">TEGANGAN SESAAT</div>
                  <div className="text-2xl font-bold text-black font-mono mt-2">V(t) = V<sub>max</sub> × sin(ωt)</div>
                  <p className="text-sm mt-1 font-semibold">ω = 2πf (Kecepatan Sudut)</p>
                </li>
                <li className="p-3 border-2 border-black bg-cyan-50 relative">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">NILAI EFEKTIF (RMS)</div>
                  <div className="text-2xl font-bold text-black font-mono mt-2">V<sub>rms</sub> = V<sub>max</sub> / √2</div>
                  <p className="text-sm mt-1 font-semibold">Tegangan yang terbaca voltmeter AC.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="neo-box bg-fuchsia-300 p-6 mb-10">
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
            <li><a href="#" className="hover:text-blue-600 underline">Kementerian Pendidikan RI. Modul Fisika Kelas XII: Rangkaian AC & DC.</a></li>
            <li><a href="#" className="hover:text-blue-600 underline">Quipper. Rangkaian Arus Searah: Pengertian & Pembahasan.</a></li>
            <li><a href="#" className="hover:text-blue-600 underline">Gramedia Literasi. Arus Bolak-Balik: Konsep dan Pemanfaatannya.</a></li>
          </ol>
        </div>
      </div>
    </div>
  );
}