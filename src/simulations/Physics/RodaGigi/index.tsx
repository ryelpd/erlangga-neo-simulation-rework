import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const MODULE = 10;
const ADDENDUM = 6;
const DEDENDUM = 8;

const quizData = [
  { question: '1. Jika roda gigi Driver memiliki 10 gigi dan Driven memiliki 20 gigi, berapakah Gear Ratio-nya?', options: ['0.5 : 1', '1 : 1', '2 : 1', '4 : 1'], answer: 2 },
  { question: '2. Jika roda penggerak (Driver) berputar searah jarum jam, ke arah mana roda yang digerakkan (Driven) berputar?', options: ['Searah jarum jam', 'Berlawanan jarum jam', 'Diam saja', 'Bolak-balik'], answer: 1 },
  { question: '3. Manakah konfigurasi yang menghasilkan TORSI (daya dorong) paling besar pada roda output?', options: ['Roda Driver kecil menggerakkan Driven besar', 'Roda Driver besar menggerakkan Driven kecil', 'Kedua roda berukuran sama', 'Roda Driver tanpa gigi'], answer: 0 },
  { question: '4. Pada gir sepeda, saat kita memindahkan rantai ke gir belakang yang lebih besar, apa yang kita rasakan?', options: ['Gowesan lebih berat tapi cepat', 'Gowesan lebih ringan tapi lambat', 'Gowesan tetap sama', 'Sepeda berhenti'], answer: 1 },
  { question: '5. Mengapa kecepatan linear (v) pada titik sentuh kedua roda gigi harus sama?', options: ['Agar warna roda tidak pudar', 'Agar gigi-gigi tidak patah dan saling mengunci dengan pas', 'Hanya aturan visual simulasi', 'Karena pengaruh gravitasi'], answer: 1 },
];

function createGearPath(teeth: number): string {
  const r_pitch = (teeth * MODULE) / 2;
  const r_outer = r_pitch + ADDENDUM;
  const r_inner = r_pitch - DEDENDUM;

  let path = '';
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const a_next = (i + 1) * step;

    const p1x = r_inner * Math.cos(a);
    const p1y = r_inner * Math.sin(a);

    const p2x = r_outer * Math.cos(a + step * 0.25);
    const p2y = r_outer * Math.sin(a + step * 0.25);

    const p3x = r_outer * Math.cos(a + step * 0.75);
    const p3y = r_outer * Math.sin(a + step * 0.75);

    const p4x = r_inner * Math.cos(a_next);
    const p4y = r_inner * Math.sin(a_next);

    if (i === 0) path += `M ${p1x} ${p1y} `;
    path += `L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y} `;
  }
  path += 'Z';
  return path;
}

export default function RodaGigi() {
  const [n1, setN1] = useState(12);
  const [n2, setN2] = useState(24);
  const [speed, setSpeed] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const angle1Ref = useRef(0);
  const angle2Ref = useRef(0);
  const lastTimeRef = useRef(0);
  const animationRef = useRef<number>(0);

  const ratio = n2 / n1;
  const w2 = speed / ratio;

  const r1 = (n1 * MODULE) / 2;
  const r2 = (n2 * MODULE) / 2;
  const offset = 360 / n2 / 2;

  const gear1Path = useMemo(() => createGearPath(n1), [n1]);
  const gear2Path = useMemo(() => createGearPath(n2), [n2]);

  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isRunning) {
        const w1 = speed * 50;
        angle1Ref.current += w1 * dt;
        angle2Ref.current -= (n1 / n2) * w1 * dt;
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [isRunning, speed, n1, n2]
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

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
    if (score === 5) return 'LUAR BIASA! KAMU AHLI MEKANIKA!';
    if (score >= 3) return 'BAGUS! COBA PELAJARI LAGI TENTANG GEAR RATIO.';
    return 'YUK PELAJARI LAGI KONSEP RODA GIGI.';
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-orange-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black border-2 border-black">TEKNIK MEKANIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: RODA GIGI (GEARS)
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menganalisis Transmisi Daya, Gear Ratio, dan Kecepatan Putar
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30 uppercase">
            Konfigurasi Transmisi
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-rose-800 uppercase text-[10px]">Jumlah Gigi Driver (N1)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{n1}</span>
              </div>
              <input
                type="range"
                min="8"
                max="24"
                step="1"
                value={n1}
                onChange={(e) => setN1(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-blue-800 uppercase text-[10px]">Jumlah Gigi Driven (N2)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{n2}</span>
              </div>
              <input
                type="range"
                min="8"
                max="48"
                step="1"
                value={n2}
                onChange={(e) => setN2(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-emerald-800 uppercase text-[10px]">Kecepatan Input (w1)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{speed.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <button
              onClick={() => setIsRunning((prev) => !prev)}
              className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-4 text-xl flex items-center justify-center gap-3 font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${isRunning ? 'bg-rose-400' : 'bg-yellow-400 hover:bg-yellow-300'}`}
            >
              {isRunning ? 'HENTIKAN MOTOR' : 'MULAI MOTOR'}
            </button>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">DATA MEKANIS</h4>
            <div className="grid grid-cols-1 gap-3 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Gear Ratio (N2/N1):</span>
                <span className="text-sky-400 font-bold">{ratio.toFixed(2)} : 1</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Kecepatan Output (w2):</span>
                <span className="text-emerald-400 font-bold">{w2.toFixed(2)} rad/s</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-white font-bold">Keuntungan Mekanis:</span>
                <span className="text-yellow-400 font-black text-lg">Torsi x {ratio.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-2 z-30 uppercase">
            Visualisasi Mesin
          </span>

          <div className="absolute bottom-20 left-10 z-20 flex flex-col gap-2">
            <div className="bg-rose-500 text-white px-2 py-1 text-[10px] font-bold border-2 border-black">GEAR 1: DRIVER</div>
            <div className="bg-blue-500 text-white px-2 py-1 text-[10px] font-bold border-2 border-black">GEAR 2: DRIVEN</div>
          </div>

          <div className="w-full h-full relative z-10 flex items-center justify-center">
            <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="500" fill="url(#grid)" />

              <circle cx="400" cy="250" r="4" fill="#000" />

              <g>
                <g transform={`translate(${400 - r1}, 250) rotate(${angle1Ref.current})`}>
                  <path d={gear1Path} fill="#f43f5e" stroke="#000" strokeWidth="3" />
                  <circle cx="0" cy="0" r="15" fill="#fff" stroke="#000" strokeWidth="3" />
                  <rect x="-2" y="-30" width="4" height="20" fill="#000" />
                </g>

                <g transform={`translate(${400 + r2}, 250) rotate(${angle2Ref.current + offset})`}>
                  <path d={gear2Path} fill="#3b82f6" stroke="#000" strokeWidth="3" />
                  <circle cx="0" cy="0" r="20" fill="#fff" stroke="#000" strokeWidth="3" />
                  <rect x="-2" y="-40" width="4" height="30" fill="#000" />
                </g>
              </g>
            </svg>
          </div>

          <div className="absolute bottom-6 bg-white px-4 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000]">
            Tangensial Velocity (v1) = Tangensial Velocity (v2)
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase">
          BAGAIMANA RODA GIGI BEKERJA?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Transmisi & Arah</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Roda gigi berfungsi memindahkan daya rotasi. Ketika dua roda gigi luar bersentuhan, arah putaran keduanya akan <b>berlawanan</b>. Jika roda penggerak berputar searah jarum jam, roda yang digerakkan akan berputar berlawanan jarum jam.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Kecepatan vs Torsi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Ada hukum pertukaran dalam roda gigi: Jika Anda memperlambat putaran menggunakan roda gigi yang lebih besar (N2 &gt; N1), Anda akan mendapatkan <b>Torsi (Gaya Putar)</b> yang lebih besar. Sebaliknya, roda gigi kecil yang menggerakkan roda besar akan melambat tapi lebih kuat menanjak.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">PERSAMAAN RODA GIGI</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-3xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e]">
              w1 . N1 = w2 . N2
            </div>
            <p className="text-center mt-4 text-xs font-bold text-slate-300">
              Gear Ratio (GR) = <span className="text-yellow-400">N2 / N1</span>
            </p>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">KETERANGAN</h4>
            <ul className="text-[11px] font-bold space-y-2">
              <li>
                <span className="text-rose-400">N</span> = Jumlah mata gigi
              </li>
              <li>
                <span className="text-blue-400">w (omega)</span> = Kecepatan sudut (RPM / rad/s)
              </li>
              <li>
                <span className="text-emerald-400">Torsi1 / Torsi2</span> = N1 / N2 (Torsi berbanding lurus dengan jumlah gigi)
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI MEKANIKA [KUIS]</h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
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