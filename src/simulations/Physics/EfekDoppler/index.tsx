import { useState, useRef, useCallback, useEffect } from 'react';

const V_SOUND = 340;
const F_SOURCE = 440;

interface Wave {
  x: number;
  r: number;
}

const quizData = [
  { question: '1. Mengapa frekuensi bunyi membesar saat sumber mendekati pendengar?', options: ['Kecepatan bunyi bertambah', 'Panjang gelombang memendek', 'Amplitudo membesar', 'Sumber bunyi berteriak'], answer: 1 },
  { question: '2. Dalam Efek Doppler, tanda vp bernilai POSITIF (+) jika pendengar...', options: ['Diam', 'Menjauhi sumber', 'Mendekati sumber', 'Meninggalkan sumber'], answer: 2 },
  { question: '3. Frekuensi asli sirine adalah 440 Hz. Jika ambulans menjauh, frekuensi yang didengar mungkin bernilai...', options: ['440 Hz', '500 Hz', '400 Hz', '600 Hz'], answer: 2 },
  { question: '4. Apa yang terjadi jika kecepatan sumber sama dengan kecepatan bunyi?', options: ['Bunyi hilang', 'Efek Doppler berhenti', 'Terjadi penumpukan gelombang (Sonic Boom)', 'Bunyi melambat'], answer: 2 },
  { question: '5. Efek Doppler juga terjadi pada cahaya. Cahaya bintang yang menjauh tampak kemerahan, disebut...', options: ['Redshift', 'Blueshift', 'Blackshift', 'Greenshift'], answer: 0 },
];

export default function EfekDoppler() {
  const [vs, setVs] = useState(40);
  const [vp, setVp] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const sourceXRef = useRef(100);
  const observerXRef = useRef(600);
  const wavesRef = useRef<Wave[]>([]);
  const waveTimerRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationRef = useRef<number>(0);

  const fp = F_SOURCE * ((V_SOUND + vp) / (V_SOUND - vs));

  const vsLabel = vs > 0 ? `${vs} (Mendekat)` : vs < 0 ? `${Math.abs(vs)} (Menjauh)` : '0';
  const vpLabel = vp > 0 ? `${vp} (Mendekat)` : vp < 0 ? `${Math.abs(vp)} (Menjauh)` : '0';

  const toneStatus = fp > F_SOURCE + 5 ? 'NADA TINGGI (MELENGKING)' : fp < F_SOURCE - 5 ? 'NADA RENDAH (BERAT)' : 'NADA NORMAL';
  const toneColor = fp > F_SOURCE + 5 ? 'text-rose-500' : fp < F_SOURCE - 5 ? 'text-blue-500' : 'text-slate-500';

  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isRunning) {
        sourceXRef.current += vs * 0.8 * dt * 50;
        observerXRef.current -= vp * 0.8 * dt * 50;

        if (sourceXRef.current > 900) sourceXRef.current = -100;
        if (sourceXRef.current < -100) sourceXRef.current = 900;
        if (observerXRef.current > 900) observerXRef.current = -100;
        if (observerXRef.current < -100) observerXRef.current = 900;

        waveTimerRef.current += dt;
        if (waveTimerRef.current > 0.15) {
          wavesRef.current.push({ x: sourceXRef.current, r: 0 });
          waveTimerRef.current = 0;
        }

        for (let i = wavesRef.current.length - 1; i >= 0; i--) {
          wavesRef.current[i].r += 180 * dt;
          if (wavesRef.current[i].r > 500) {
            wavesRef.current.splice(i, 1);
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [isRunning, vs, vp]
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  const handlePlay = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    sourceXRef.current = 100;
    observerXRef.current = 600;
    wavesRef.current = [];
    waveTimerRef.current = 0;
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
    if (score === 5) return 'LUAR BIASA! KAMU AHLI AKUSTIK!';
    if (score >= 3) return 'BAGUS! COBA LAGI UNTUK SKOR SEMPURNA.';
    return 'YUK PELAJARI LAGI KONSEP EFEK DOPPLER.';
  };

  const sourceX = sourceXRef.current;
  const observerX = observerXRef.current;
  const waves = wavesRef.current;

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-yellow-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black border-2 border-black">FISIKA GELOMBANG</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: EFEK DOPPLER
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Perubahan Frekuensi Akibat Gerak Relatif Sumber & Pendengar
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30 uppercase">
            Parameter Gerak
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-rose-800 uppercase text-[10px]">Kecepatan Sumber (vs)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{vsLabel}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={vs}
                onChange={(e) => setVs(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Menjauhi Pendengar</span>
                <span>Mendekati</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-blue-800 uppercase text-[10px]">Kecepatan Pendengar (vp)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{vpLabel}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={vp}
                onChange={(e) => setVp(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Menjauhi Sumber</span>
                <span>Mendekati</span>
              </div>
            </div>

            <button
              onClick={handlePlay}
              className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-3 text-sm mt-2 font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${isRunning ? 'bg-amber-400' : 'bg-emerald-400'}`}
            >
              {isRunning ? 'Jeda Simulasi' : 'Mulai Simulasi'}
            </button>
            <button onClick={handleReset} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 py-3 text-sm font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
              Atur Ulang
            </button>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">PERHITUNGAN REAL-TIME</h4>
            <div className="flex flex-col gap-3 font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span className="text-xs">Frekuensi Sumber (fs):</span>
                <span className="text-rose-400 font-bold">440 Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Frekuensi Terdengar (fp):</span>
                <span className="text-emerald-400 font-black text-xl">{Math.round(fp)} Hz</span>
              </div>
            </div>
            <div className="mt-4 p-2 bg-slate-800 border-2 border-dashed border-slate-600 text-center">
              <div className={`text-[11px] font-black uppercase leading-tight ${toneColor}`}>{toneStatus}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-2 z-30 uppercase">
            Visualisasi Gelombang Bunyi
          </span>

          <div className="w-full h-full relative z-10 bg-slate-100">
            <svg viewBox="0 0 800 500" className="w-full h-full">
              <rect x="0" y="400" width="800" height="100" fill="#cbd5e1" />
              <line x1="0" y1="400" x2="800" y2="400" stroke="#000" strokeWidth="6" />
              <line x1="0" y1="450" x2="800" y2="450" stroke="#fff" strokeWidth="4" strokeDasharray="40 40" opacity="0.5" />

              <g>
                {waves.map((wave, i) => (
                  <circle
                    key={i}
                    cx={wave.x}
                    cy={360}
                    r={wave.r}
                    fill="none"
                    stroke="#000"
                    strokeWidth="1.5"
                    opacity={Math.max(0, 1 - wave.r / 500) * 0.4}
                  />
                ))}
              </g>

              <g transform={`translate(${sourceX}, 360)`}>
                <rect x="-5" y="-45" width="20" height="10" fill={isRunning ? '#facc15' : '#94a3b8'} stroke="#000" strokeWidth="2" />
                <path d="M -45 -35 L 20 -35 L 45 -10 L 45 10 L -45 10 Z" fill="#ffffff" stroke="#000" strokeWidth="3" />
                <rect x="-45" y="-10" width="90" height="10" fill="#f43f5e" stroke="#000" strokeWidth="2" />
                <g transform="translate(-15, -15) scale(0.6)">
                  <rect x="-2" y="-10" width="4" height="20" fill="#f43f5e" />
                  <rect x="-10" y="-2" width="20" height="4" fill="#f43f5e" />
                </g>
                <rect x="-35" y="-30" width="25" height="15" fill="#38bdf8" stroke="#000" strokeWidth="2" />
                <path d="M 0 -30 L 15 -30 L 30 -15 L 0 -15 Z" fill="#38bdf8" stroke="#000" strokeWidth="2" />
                <g transform="translate(-25, 10)">
                  <circle r="12" fill="#000" />
                  <circle r="6" fill="#64748b" stroke="#fff" strokeWidth="2" />
                </g>
                <g transform="translate(25, 10)">
                  <circle r="12" fill="#000" />
                  <circle r="6" fill="#64748b" stroke="#fff" strokeWidth="2" />
                </g>
                <text y="-55" textAnchor="middle" fontWeight="900" fontSize="10" fill="#f43f5e" className="uppercase">Ambulans</text>
              </g>

              <g transform={`translate(${observerX}, 360)`}>
                <rect x="-12" y="-20" width="24" height="40" fill="#3b82f6" stroke="#000" strokeWidth="3" rx="4" />
                <circle cx="0" cy="-35" r="12" fill="#ffedd5" stroke="#000" strokeWidth="3" />
                <path d="M -15 -35 A 15 15 0 0 1 15 -35" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
                <rect x="-16" y="-40" width="6" height="12" fill="#000" rx="2" />
                <rect x="10" y="-40" width="6" height="12" fill="#000" rx="2" />
                <line x1="-12" y1="-10" x2="-20" y2="10" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                <line x1="12" y1="-10" x2="20" y2="10" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                <rect x="-10" y="20" width="8" height="15" fill="#1e293b" stroke="#000" strokeWidth="2" />
                <rect x="2" y="20" width="8" height="15" fill="#1e293b" stroke="#000" strokeWidth="2" />
                <text y="-60" textAnchor="middle" fontWeight="900" fontSize="10" fill="#3b82f6" className="uppercase">Pendengar</text>
              </g>
            </svg>
          </div>

          <div className="absolute bottom-6 bg-white px-4 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000]">
            v_bunyi = 340 m/s | f_sumber = 440 Hz (A4)
          </div>
        </div>
      </div>

      <div className="mt-2 bg-emerald-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase">
          BAGAIMANA BUNYI BERUBAH?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Mendekat</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Bayangkan gelombang bunyi sebagai pegas. Saat ambulans mendekat, gelombang "tergencet" menjadi lebih rapat. Akibatnya, lebih banyak gelombang masuk ke telinga dalam satu detik.
            </p>
            <p className="text-xs font-black text-rose-500 mt-2">HASIL: NADA TINGGI / MELENGKING</p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Menjauh</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Saat ambulans menjauh, ia seolah-olah "menarik" gelombang bunyi sehingga menjadi lebih renggang (panjang gelombang membesar). Sedikit gelombang yang masuk ke telinga per detiknya.
            </p>
            <p className="text-xs font-black text-blue-500 mt-2">HASIL: NADA RENDAH / BERAT</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">RUMUS EFEK DOPPLER</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-3xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e]">
              fp = fs x (v + vp) / (v - vs)
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">ATURAN TANDA</h4>
            <ul className="text-[11px] font-bold space-y-2">
              <li>
                <span className="text-blue-400">vp (+)</span> Mendekati sumber | <span className="text-blue-400">vp (-)</span> Menjauhi
              </li>
              <li>
                <span className="text-rose-400">vs (-)</span> Mendekati pendengar | <span className="text-rose-400">vs (+)</span> Menjauhi
              </li>
              <li className="pt-2 text-slate-400 italic text-[10px]">Tips: Hafalkan "Pendengar Mendekat itu Positif" (+vp).</li>
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