import { useState, useRef, useCallback, useEffect } from 'react';

const ELEMENTS = [
  { symbol: '?', name: 'KOSONG' },
  { symbol: 'H', name: 'Hidrogen' },
  { symbol: 'He', name: 'Helium' },
  { symbol: 'Li', name: 'Litium' },
  { symbol: 'Be', name: 'Berilium' },
  { symbol: 'B', name: 'Boron' },
  { symbol: 'C', name: 'Karbon' },
  { symbol: 'N', name: 'Nitrogen' },
  { symbol: 'O', name: 'Oksigen' },
  { symbol: 'F', name: 'Fluorin' },
  { symbol: 'Ne', name: 'Neon' },
];

const quizData = [
  { question: '1. Jalur lintasan tempat elektron bergerak mengitari inti disebut...', options: ['Orbital', 'Orbit', 'Awan', 'Aura'], answer: 1 },
  { question: '2. Apa yang menentukan nama sebuah unsur?', options: ['Neutron', 'Elektron', 'Proton', 'Massa'], answer: 2 },
  { question: '3. Kulit pertama (terdalam) maksimal menampung berapa elektron?', options: ['2', '8', '18', 'Tidak terbatas'], answer: 0 },
  { question: '4. Atom dengan 3 proton dan 2 elektron disebut...', options: ['Ion Negatif', 'Atom Netral', 'Ion Positif', 'Isotop'], answer: 2 },
  { question: '5. Neutron berfungsi sebagai apa di dalam inti?', options: ['Memancarkan cahaya', 'Perekat agar proton tidak tolak-menolak', 'Mempercepat elektron', 'Pendingin atom'], answer: 1 },
];

export default function MembangunAtom() {
  const [pCount, setPCount] = useState(0);
  const [nCount, setNCount] = useState(0);
  const [eCount, setECount] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const autoPlayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mass = pCount + nCount;
  const charge = pCount - eCount;

  const element = pCount > 0 && pCount <= 10 ? ELEMENTS[pCount] : ELEMENTS[0];

  const changeParticle = useCallback((type: 'P' | 'N' | 'E', delta: number) => {
    if (type === 'P') setPCount((p) => Math.max(0, Math.min(10, p + delta)));
    if (type === 'N') setNCount((n) => Math.max(0, Math.min(12, n + delta)));
    if (type === 'E') setECount((e) => Math.max(0, Math.min(10, e + delta)));
  }, []);

  const resetAtom = useCallback(() => {
    setPCount(0);
    setNCount(0);
    setECount(0);
    setIsAutoPlaying(false);
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => {
      if (!prev) {
        autoPlayIntervalRef.current = setInterval(() => {
          setPCount((p) => Math.min(10, p + 1));
          setNCount((n) => Math.min(10, n + 1));
          setECount((e) => Math.min(10, e + 1));
        }, 800);
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
    if (pCount >= 10 && eCount >= 10 && isAutoPlaying) {
      setIsAutoPlaying(false);
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    }
  }, [pCount, eCount, isAutoPlaying]);

  useEffect(() => {
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, []);

  const renderNucleus = useCallback(() => {
    const particles: ('P' | 'N')[] = [];
    for (let i = 0; i < pCount; i++) particles.push('P');
    for (let i = 0; i < nCount; i++) particles.push('N');
    particles.sort(() => Math.random() - 0.5);

    return particles.map((type, index) => {
      const phi = 137.5 * (Math.PI / 180);
      const r = 7 * Math.sqrt(index);
      const theta = index * phi;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);

      return (
        <g key={index} transform={`translate(${x}, ${y})`}>
          <circle r="8.5" stroke="#000" strokeWidth="2" fill={type === 'P' ? '#f43f5e' : '#94a3b8'} />
          {type === 'P' && (
            <text y="3" fontSize="10" fontWeight="900" fill="#fff" textAnchor="middle">+</text>
          )}
        </g>
      );
    });
  }, [pCount, nCount]);

  const renderShell1 = useCallback(() => {
    const s1Count = Math.min(eCount, 2);
    if (s1Count === 0) return null;

    const electrons = [];
    for (let i = 0; i < s1Count; i++) {
      const a = (i / s1Count) * Math.PI * 2;
      electrons.push(
        <g key={i} transform={`translate(${70 * Math.cos(a)}, ${70 * Math.sin(a)})`}>
          <circle r="7" fill="#38bdf8" stroke="#000" strokeWidth="2" />
          <text y="2.5" fontSize="10" fontWeight="900" fill="#fff" textAnchor="middle">-</text>
        </g>
      );
    }

    return (
      <>
        <circle r="70" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 8" />
        {electrons}
      </>
    );
  }, [eCount]);

  const renderShell2 = useCallback(() => {
    const s2Count = Math.max(0, Math.min(eCount - 2, 8));
    if (s2Count === 0) return null;

    const rots = [0, 45, 90, 135];
    const groups = [];

    for (let i = 0; i < s2Count; i++) {
      groups.push(
        <g key={i} transform={`rotate(${rots[Math.floor(i / 2)]})`}>
          <ellipse rx="140" ry="50" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 8" />
          <g transform={`translate(${i % 2 === 0 ? 140 : -140}, 0)`}>
            <circle r="7" fill="#38bdf8" stroke="#000" strokeWidth="2" />
            <text y="2.5" fontSize="10" fontWeight="900" fill="#fff" textAnchor="middle">-</text>
          </g>
        </g>
      );
    }

    return groups;
  }, [eCount]);

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
    if (score === 5) return 'SEMPURNA! PEMAHAMAN ATOM ANDA SANGAT BAIK.';
    if (score >= 3) return 'CUKUP BAIK. COBA PERHATIKAN LAGI SIMULASINYA.';
    return 'YUK BACA LAGI BAGIAN PENJELASAN KONSEP DI ATAS.';
  };

  const isEmpty = pCount === 0 && nCount === 0 && eCount === 0;

  const getChargeBadgeClass = () => {
    if (charge === 0) return 'bg-green-400';
    if (charge > 0) return 'bg-rose-400';
    return 'bg-sky-400';
  };

  const getChargeText = () => {
    if (charge === 0) return pCount > 0 ? 'ATOM NETRAL' : 'KOSONG';
    return charge > 0 ? 'ION POSITIF' : 'ION NEGATIF';
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black border-2 border-black">FISIKA & KIMIA ATOM</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: MEMBANGUN ATOM
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Visualisasi Model Bohr: Elektron Mengunci pada Lintasan Orbit
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30">
            KONTROL PARTIKEL
          </span>

          <div className="bg-rose-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <span className="font-black text-rose-700 text-lg uppercase flex items-center gap-2">
                <div className="w-5 h-5 bg-rose-500 rounded-full border-2 border-black flex items-center justify-center text-[10px] text-white font-bold">+</div>
                Proton
              </span>
              <span className="font-mono font-black text-2xl bg-white px-2 border-2 border-black">{pCount}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => changeParticle('P', -1)} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-white hover:bg-slate-200 flex-1 py-2 text-xl font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">-</button>
              <button onClick={() => changeParticle('P', 1)} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-rose-400 hover:bg-rose-300 text-white flex-1 py-2 text-xl font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">+</button>
            </div>
          </div>

          <div className="bg-slate-200 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <span className="font-black text-slate-700 text-lg uppercase flex items-center gap-2">
                <div className="w-5 h-5 bg-slate-400 rounded-full border-2 border-black"></div>
                Neutron
              </span>
              <span className="font-mono font-black text-2xl bg-white px-2 border-2 border-black">{nCount}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => changeParticle('N', -1)} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-white hover:bg-slate-300 flex-1 py-2 text-xl font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">-</button>
              <button onClick={() => changeParticle('N', 1)} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-500 hover:bg-slate-400 text-white flex-1 py-2 text-xl font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">+</button>
            </div>
          </div>

          <div className="bg-sky-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <span className="font-black text-sky-700 text-lg uppercase flex items-center gap-2">
                <div className="w-5 h-5 bg-sky-400 rounded-full border-2 border-black flex items-center justify-center text-[14px] font-black text-white">-</div>
                Elektron
              </span>
              <span className="font-mono font-black text-2xl bg-white px-2 border-2 border-black">{eCount}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => changeParticle('E', -1)} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-white hover:bg-slate-200 flex-1 py-2 text-xl font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">-</button>
              <button onClick={() => changeParticle('E', 1)} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-sky-400 hover:bg-sky-300 text-white flex-1 py-2 text-xl font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">+</button>
            </div>
          </div>

          <button onClick={resetAtom} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-yellow-300 hover:bg-yellow-200 text-black py-3 mt-2 text-sm border-2 border-dashed border-black font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
            KOSONGKAN SEMUA
          </button>
        </div>

        <div className="bg-[#020617] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[500px] overflow-hidden">
          <svg viewBox="0 0 400 400" className="w-full h-full absolute inset-0 z-10">
            <g transform="translate(200, 200)">
              <g className="animate-[rotateOrbit_20s_linear_infinite]" style={{ transformOrigin: 'center' }}>
                {renderShell2()}
              </g>
              <g className="animate-[rotateOrbit_12s_linear_infinite]" style={{ transformOrigin: 'center' }}>
                {renderShell1()}
              </g>
              <g className={isEmpty ? '' : 'animate-[nucleusJitter_0.15s_infinite_ease-in-out]'}>
                {renderNucleus()}
              </g>
            </g>
          </svg>

          {isEmpty && (
            <div className="absolute z-20 text-center pointer-events-none">
              <span className="bg-white text-black font-black px-4 py-2 border-4 border-black text-xl">ATOM KOSONG</span>
              <br />
              <span className="text-slate-500 font-bold text-xs mt-3 block uppercase tracking-widest">Gunakan [+] untuk mengisi</span>
            </div>
          )}

          <button onClick={toggleAutoPlay} className={`absolute bottom-4 z-30 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 px-6 text-xs font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${isAutoPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'} text-black`}>
            {isAutoPlaying ? 'HENTIKAN OTOMATIS' : 'PUTAR OTOMATIS'}
          </button>
        </div>

        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 left-6 bg-emerald-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md -rotate-2 z-30">
            PROPERTI ELEMEN
          </span>

          <div className="w-full flex justify-center mt-2">
            <div className="w-36 h-40 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] flex flex-col items-center justify-center p-2 relative">
              <span className="absolute top-1 left-2 font-black text-xl">{pCount > 0 ? pCount : '-'}</span>
              <span className="absolute top-1 right-2 font-black text-sm text-slate-400">{mass > 0 ? mass : '-'}</span>
              <h2 className="text-6xl font-black font-mono mt-2">{element.symbol}</h2>
              <span className="text-xs font-black mt-2 uppercase text-center px-1">{element.name}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="bg-slate-50 p-3 border-2 border-black flex justify-between items-center">
              <span className="font-bold text-xs uppercase text-slate-500">Massa (P + N)</span>
              <span className="font-black text-xl bg-white px-3 border-2 border-black">{mass}</span>
            </div>

            <div className="bg-slate-50 p-3 border-2 border-black flex justify-between items-center">
              <span className="font-bold text-xs uppercase text-slate-500">Muatan (P - E)</span>
              <span className="font-black text-xl bg-white px-3 border-2 border-black min-w-[3.5rem] text-center">{charge > 0 ? `+${charge}` : charge}</span>
            </div>

            <div className={`p-4 border-4 border-black text-center mt-3 ${getChargeBadgeClass()}`}>
              <span className="font-black text-lg uppercase tracking-widest">{getChargeText()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1">
          APA ITU ORBIT ELEKTRON?
        </h3>
        <p className="text-sm font-semibold text-slate-800 leading-relaxed bg-white/60 p-4 border-2 border-black border-dashed">
          Model ini menggunakan <b>Model Atom Bohr</b>. Elektron tidak berterbangan bebas secara acak, melainkan "terkunci" pada lintasan tertentu yang disebut <b>Orbit</b>. Bayangkan seperti planet yang mengitari matahari; mereka tetap berada di jalur orbitnya karena gaya tarik elektromagnetik dari inti atom.
        </p>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP ATOM [KUIS]
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

      <style>{`
        @keyframes nucleusJitter {
          0% { transform: translate(0, 0); }
          25% { transform: translate(0.5px, -0.5px); }
          50% { transform: translate(-0.5px, 0.5px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes rotateOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}