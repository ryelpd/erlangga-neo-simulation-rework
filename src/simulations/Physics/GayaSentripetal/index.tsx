import { useState, useRef, useCallback, useEffect } from 'react';

const quizData = [
  { question: '1. Ke arah manakah gaya sentripetal selalu bekerja pada benda yang bergerak melingkar?', options: ['Keluar lintasan', 'Menuju pusat lingkaran', 'Searah dengan kecepatan benda', 'Berlawanan dengan kecepatan benda'], answer: 1 },
  { question: '2. Apa yang terjadi pada gaya sentripetal jika kecepatan sudut (ω) dijadikan dua kali lipat (massa dan jari-jari tetap)?', options: ['Tetap sama', 'Menjadi 2 kali lipat', 'Menjadi 4 kali lipat', 'Menjadi setengahnya'], answer: 2 },
  { question: '3. Gaya manakah yang berfungsi sebagai gaya sentripetal saat Bulan mengelilingi Bumi?', options: ['Gaya Magnet', 'Gaya Gesek', 'Gaya Gravitasi', 'Gaya Pegas'], answer: 2 },
  { question: '4. Sebuah benda diikat tali dan diputar. Jika tali tiba-tiba putus, ke arah mana benda tersebut akan meluncur?', options: ['Menuju pusat', 'Lurus menjauhi pusat', 'Lurus sesuai arah garis singgung lintasan (tangen)', 'Berhenti seketika'], answer: 2 },
  { question: '5. Manakah faktor yang TIDAK memengaruhi besarnya percepatan sentripetal?', options: ['Jari-jari lintasan', 'Massa benda', 'Kecepatan linear', 'Kecepatan sudut'], answer: 1 },
];

export default function GayaSentripetal() {
  const [mass, setMass] = useState(5);
  const [radius, setRadius] = useState(1.5);
  const [omega, setOmega] = useState(2);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const angleRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationRef = useRef<number>(0);

  const v = omega * radius;
  const a_s = omega * omega * radius;
  const F_s = mass * a_s;

  const visualR = radius * 100;
  const bobSize = 10 + mass * 2;

  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      angleRef.current += omega * dt;

      animationRef.current = requestAnimationFrame(animate);
    },
    [omega]
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  const x = visualR * Math.cos(angleRef.current);
  const y = visualR * Math.sin(angleRef.current);

  const fsMag = Math.min(F_s * 0.5, visualR * 0.8);
  const fsX2 = -x * (fsMag / visualR);
  const fsY2 = -y * (fsMag / visualR);

  const vMag = Math.min(v * 20, 100);
  const vx2 = -y * (vMag / visualR);
  const vy2 = x * (vMag / visualR);

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
    if (score === 5) return 'LUAR BIASA! KAMU MENGUASAI DINAMIKA GERAK MELINGKAR!';
    if (score >= 3) return 'BAGUS! COBA PELAJARI LAGI HUBUNGAN ANTARA GAYA DAN KECEPATAN.';
    return 'YUK PELAJARI LAGI KONSEP GAYA SENTRIPETAL.';
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-yellow-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black border-2 border-black">FISIKA MEKANIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: GAYA SENTRIPETAL
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menganalisis Gerak Melingkar Beraturan & Gaya Penarik ke Pusat
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
                <span className="font-black text-rose-800 uppercase text-[10px]">Massa Beban (m)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{mass.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={mass}
                onChange={(e) => setMass(parseFloat(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Satuan: kg</span>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-blue-800 uppercase text-[10px]">Jari-jari Lintasan (r)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{radius.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Satuan: meter</span>
            </div>

            <div className="bg-lime-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-lime-800 uppercase text-[10px]">Kecepatan Sudut (ω)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{omega.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="0.1"
                value={omega}
                onChange={(e) => setOmega(parseFloat(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-lime-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Satuan: rad/s</span>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">ANALISIS GAYA</h4>
            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Percepatan (as):</span>
                <span className="text-sky-400 font-bold">{a_s.toFixed(2)} m/s²</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Gaya Sentripetal (Fs):</span>
                <span className="text-emerald-400 font-black text-lg">{F_s.toFixed(2)} N</span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Kecepatan Linear (v):</span>
                <span className="text-yellow-400 font-bold">{v.toFixed(2)} m/s</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-2 z-30 uppercase">
            Visualisasi Gerak Melingkar
          </span>

          <div className="w-full h-full relative z-10 flex items-center justify-center">
            <svg viewBox="0 0 800 500" className="w-full h-full">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="500" fill="url(#grid)" />

              <g transform="translate(400, 250)">
                <circle cx="0" cy="0" r={visualR} fill="none" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 8" />

                <circle cx="0" cy="0" r="6" fill="#000" />
                <text y="20" x="10" fontSize="10" fontWeight="900">
                  PUSAT ROTASI
                </text>

                <line x1="0" y1="0" x2={x} y2={y} stroke="#000" strokeWidth="2" />

                <g transform={`translate(${x}, ${y})`}>
                  <circle cx="0" cy="0" r={bobSize} fill="#f43f5e" stroke="#000" strokeWidth="4" />

                  <line x1="0" y1="0" x2={fsX2} y2={fsY2} stroke="#10b981" strokeWidth="6" />
                  <text x={fsX2 / 2} y={fsY2 / 2 - 5} fontSize="12" fontWeight="900" fill="#059669">
                    Fs
                  </text>

                  <line x1="0" y1="0" x2={vx2} y2={vy2} stroke="#f59e0b" strokeWidth="4" />
                  <text x={vx2} y={vy2 - 5} fontSize="12" fontWeight="900" fill="#d97706">
                    v
                  </text>
                </g>
              </g>

              <defs>
                <marker id="arrowFs" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <marker id="arrowV" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
              </defs>
            </svg>
          </div>

          <div className="absolute bottom-6 bg-white px-4 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000]">
            Arah Gaya Sentripetal Selalu Menuju Pusat Lingkaran
          </div>
        </div>
      </div>

      <div className="mt-2 bg-emerald-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase">
          KONSEP GAYA SENTRIPETAL
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Mengapa Benda Berbelok?</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Sesuai Hukum Newton I (Inersia), benda cenderung bergerak lurus. Agar benda dapat bergerak melingkar, harus ada gaya yang terus-menerus menariknya ke <b>pusat lingkaran</b>. Gaya inilah yang disebut Gaya Sentripetal.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Vektor Kecepatan vs Gaya</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Perhatikan panah kuning di simulasi! Kecepatan (v) selalu tegak lurus (tangen) terhadap lintasan. Gaya (Fs) hanya mengubah <b>arah</b> gerak benda, bukan besarnya laju benda (jika geraknya beraturan).
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">PERSAMAAN MATEMATIS</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-3xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e]">
              Fs = m x ω² x r
            </div>
            <p className="text-center mt-4 text-xs font-bold text-slate-300">
              Atau menggunakan kecepatan linear: <span className="text-yellow-400">Fs = mv²/r</span>
            </p>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">KETERANGAN</h4>
            <ul className="text-[11px] font-bold space-y-2">
              <li>
                <span className="text-rose-400">m</span> = Massa benda (kg)
              </li>
              <li>
                <span className="text-blue-400">r</span> = Jari-jari lintasan lingkaran (m)
              </li>
              <li>
                <span className="text-lime-400">ω</span> = Kecepatan sudut (rad/s)
              </li>
              <li>
                <span className="text-emerald-400">Fs</span> = Gaya Sentripetal (Newton)
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