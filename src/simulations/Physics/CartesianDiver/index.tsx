import { useState, useEffect, useRef, useCallback } from 'react';

export default function CartesianDiver() {
  const [pressure, setPressure] = useState(0);
  const [diverY, setDiverY] = useState(-120);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const diverYRef = useRef(-120);
  const velocityYRef = useRef(0);

  const quizData = [
    {
      question: "1. Mengapa penyelam cartesian tenggelam saat botol diremas keras?",
      options: ["Karena air menjadi lebih berat", "Karena tekanan mengecilkan volume udara, sehingga gaya apung berkurang", "Karena botolnya menjadi sempit", "Karena gravitasi bumi tiba-tiba meningkat"],
      answer: 1
    },
    {
      question: "2. Hukum fisika apa yang menjelaskan bahwa tekanan tangan kita pada botol disebarkan secara merata ke seluruh air hingga menekan gelembung?",
      options: ["Hukum Newton", "Hukum Boyle", "Hukum Pascal", "Hukum Archimedes"],
      answer: 2
    },
    {
      question: "3. Berdasarkan simulasi, apa yang terjadi pada 'Panah Hijau' (Gaya Apung / Fa) saat tekanan botol ditambah (diremas)?",
      options: ["Panahnya memanjang ke atas", "Panahnya memendek menyusut", "Berubah menjadi merah", "Tidak ada perubahan"],
      answer: 1
    },
    {
      question: "4. Bagaimana cara membuat penyelam yang sedang tenggelam di dasar botol naik kembali ke atas?",
      options: ["Melepaskan remasan (mengurangi tekanan)", "Membalik botolnya", "Menambah tekanan lebih kuat lagi", "Menambahkan air ke dalam botol"],
      answer: 0
    },
    {
      question: "5. Sesuai Hukum Archimedes, syarat sebuah benda bisa melayang/tenggelam di dalam air berkaitan dengan...",
      options: ["Kecepatan benda", "Bentuk botolnya", "Volume air yang dipindahkan oleh benda tersebut", "Suhu ruangan"],
      answer: 2
    }
  ];

  const selectAnswer = (qIndex: number, optIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIndex] = optIndex;
    setUserAnswers(newAnswers);
  };

  const getScore = (): number => {
    return userAnswers.reduce<number>((score, ans, idx) =>
      ans === quizData[idx].answer ? score + 1 : score, 0
    );
  };

  const resetQuiz = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const BASE_AIR_HEIGHT = 60;
  const MAX_Y = 160;
  const MIN_Y = -120;

  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    const pressureNormalized = pressure / 100;
    
    const bubbleScale = 1.0 - (pressureNormalized * 0.6);
    
    const W = 100;
    const Fa = 120 * bubbleScale;
    
    const netForce = W - Fa;
    const mass = 10;
    const acceleration = netForce / mass;

    velocityYRef.current += acceleration * dt * 50;
    velocityYRef.current *= 0.92;
    
    diverYRef.current += velocityYRef.current * dt * 50;

    if (diverYRef.current <= MIN_Y) {
      diverYRef.current = MIN_Y;
      if (velocityYRef.current < 0) velocityYRef.current = 0;
    } else if (diverYRef.current >= MAX_Y) {
      diverYRef.current = MAX_Y;
      if (velocityYRef.current > 0) velocityYRef.current = 0;
    }

    setDiverY(diverYRef.current);

    animationRef.current = requestAnimationFrame(animate);
  }, [pressure]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const squeezeScale = 1 - (pressure / 100) * 0.05;
  const pressureNormalized = pressure / 100;
  const bubbleScale = 1.0 - (pressureNormalized * 0.6);
  const currentAirHeight = BASE_AIR_HEIGHT * bubbleScale;
  
  const W = 100;
  const Fa = 120 * bubbleScale;
  const faArrowLength = (Fa / 100) * 60;

  const getStatus = () => {
    if (diverY <= MIN_Y) return { text: "MENGAPUNG", color: "text-blue-600 bg-blue-100" };
    if (diverY >= MAX_Y) return { text: "TENGGELAM", color: "text-red-600 bg-red-100" };
    return { text: "MELAYANG", color: "text-green-600 bg-green-100" };
  };

  const getFaText = () => {
    if (Fa > W + 5) return "BESAR (>W)";
    if (Fa < W - 5) return "KECIL (<W)";
    return "SEIMBANG (=W)";
  };

  const getPressureText = () => {
    if (pressureNormalized > 0.7) return "TINGGI";
    if (pressureNormalized > 0.1) return "NAIK";
    return "NORMAL";
  };

  const status = getStatus();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="bg-sky-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            FISIKA FLUIDA
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-center">
            LAB VIRTUAL: PENYELAM CARTESIAN
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black mx-auto block text-center">
            Hukum Archimedes, Boyle, dan Pascal dalam Satu Botol!
          </p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max">
                Interaksi
              </label>
              <div className="text-sm font-bold text-slate-700 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-rose-50 rounded-lg">
                💡 Geser <i>slider</i> di samping untuk mensimulasikan tangan Anda yang sedang <b>meremas botol plastik</b>. Perhatikan gelembung udara di dalam penyelam!
              </div>
            </div>

            <div className="w-full md:w-2/3 flex flex-col gap-4">
              <div className="bg-blue-100 p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-black text-xl text-blue-700 uppercase">Tekanan Tangan (Remas)</span>
                  <span className="font-mono font-black text-2xl bg-white px-3 border-2 border-black">{pressure}%</span>
                </div>
                
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={pressure}
                  onChange={(e) => setPressure(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:h-9 [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                
                <div className="flex justify-between text-sm font-bold uppercase text-slate-500">
                  <span>0% (Dilepas)</span>
                  <span>100% (Diremas Kuat)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-200 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
          <div className="absolute top-6 left-6 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">AREA EKSPERIMEN</h2>
          </div>

          <div className="absolute top-6 right-6 z-30 bg-white/95 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3 text-xs font-bold uppercase w-64 backdrop-blur-sm rounded-lg hidden md:block">
            <h3 className="text-center font-black text-sm border-b-4 border-black pb-2 mb-1">MONITOR PENYELAM</h3>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <span>Tekanan Air (P)</span>
              <span className="font-mono text-sm text-rose-600">{getPressureText()}</span>
            </div>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <span>Volume Udara (V)</span>
              <span className="font-mono text-sm text-sky-600">{Math.round(bubbleScale * 100)}%</span>
            </div>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <span>Berat Penyelam (W)</span>
              <span className="font-mono text-sm text-red-600">Tetap</span>
            </div>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <span>Gaya Apung (Fa)</span>
              <span className="font-mono text-sm text-green-600">{getFaText()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className={`font-black text-sm px-2 py-1 border-2 border-black ${status.color}`}>{status.text}</span>
            </div>
          </div>

          <div className="mt-20 md:mt-0 relative w-full max-w-[800px] h-[600px] bg-white border-8 border-black overflow-hidden rounded-xl mx-auto">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
            
            <svg viewBox="0 0 800 600" className="w-full h-full relative z-20 overflow-visible">
                
              <defs>
                <marker id="arrowUp" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <polygon points="0 8, 4 0, 8 8" fill="#22c55e" stroke="#000" strokeWidth="1"/>
                </marker>
                <marker id="arrowDown" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <polygon points="0 0, 4 8, 8 0" fill="#ef4444" stroke="#000" strokeWidth="1"/>
                </marker>
              </defs>

              <g transform={`translate(400, 300) scale(${squeezeScale}, 1)`}>
                <rect x="-120" y="-200" width="240" height="450" rx="30" fill="#bae6fd" stroke="#000" strokeWidth="8"/>
                
                <rect x="-40" y="-260" width="80" height="60" fill="#bae6fd" stroke="#000" strokeWidth="8"/>
                <rect x="-50" y="-280" width="100" height="30" rx="5" fill="#ef4444" stroke="#000" strokeWidth="8"/>
                
                <rect x="-36" y="-240" width="72" height="40" fill="#7dd3fc"/>
                <rect x="-36" y="-256" width="72" height="16" fill="#f8fafc"/>
                
                <path d="M -90 -150 L -90 200" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity="0.6"/>
                <path d="M 90 -150 L 90 200" stroke="#0ea5e9" strokeWidth="10" strokeLinecap="round" opacity="0.4"/>
                
                <g transform={`translate(0, ${diverY})`}>
                  
                  <path d="M -20 -40 L 20 -40 L 20 60 C 20 70, -20 70, -20 60 Z" fill="#7dd3fc" stroke="none"/>
                  
                  <rect x="-16" y="-36" width="32" height={currentAirHeight} fill="#ffffff" rx="10"/>
                  
                  <path d="M -20 -40 L 20 -40 L 20 60 C 20 70, -20 70, -20 60 Z" fill="none" stroke="#000" strokeWidth="6"/>
                  <path d="M -20 -40 C -20 -60, 20 -60, 20 -40" fill="#facc15" stroke="#000" strokeWidth="6"/>
                  
                  <circle cx="0" cy="75" r="15" fill="#a855f7" stroke="#000" strokeWidth="6"/>
                  <circle cx="0" cy="60" r="5" fill="#000"/>

                  <line x1="45" y1="20" x2="45" y2={20 - faArrowLength} stroke="#22c55e" strokeWidth="6" markerEnd="url(#arrowUp)"/>
                  <text x="55" y="-10" fontSize="16" fontWeight="900" fill="#22c55e">Fa</text>

                  <line x1="-45" y1="20" x2="-45" y2="80" stroke="#ef4444" strokeWidth="6" markerEnd="url(#arrowDown)"/>
                  <text x="-70" y="60" fontSize="16" fontWeight="900" fill="#ef4444">W</text>
                </g>
              </g>

              <g opacity={pressureNormalized}>
                <line x1="180" y1="200" x2="230" y2="200" stroke="#ef4444" strokeWidth="8"/>
                <line x1="180" y1="300" x2="230" y2="300" stroke="#ef4444" strokeWidth="8"/>
                <line x1="180" y1="400" x2="230" y2="400" stroke="#ef4444" strokeWidth="8"/>
                <line x1="620" y1="200" x2="570" y2="200" stroke="#ef4444" strokeWidth="8"/>
                <line x1="620" y1="300" x2="570" y2="300" stroke="#ef4444" strokeWidth="8"/>
                <line x1="620" y1="400" x2="570" y2="400" stroke="#ef4444" strokeWidth="8"/>
              </g>

            </svg>
          </div>
        </div>

        <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 transform -rotate-1">
            KONSEP FISIKA: 3 HUKUM DALAM 1 BOTOL 🤯
          </h3>
          <p className="text-black font-semibold text-md leading-relaxed mb-3 bg-white/60 p-3 border-2 border-black border-dashed">
            Eksperimen klasik ini sangat brilian karena mendemonstrasikan tiga hukum fisika utama sekaligus:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-rose-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-rose-700 mb-2">1. Hukum Pascal</h4>
              <p className="text-sm font-semibold">Saat botol diremas, tekanan tangan Anda diteruskan ke air di dalam botol. Air meneruskan tekanan ini <b>ke segala arah dengan sama besar</b>, termasuk ke dalam celah penyelam.</p>
            </div>
            <div className="bg-sky-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-sky-700 mb-2">2. Hukum Boyle</h4>
              <p className="text-sm font-semibold text-black">Air tidak bisa dimampatkan, tetapi udara BISA! Tekanan dari air menekan gelembung udara di dalam penyelam. <b>Tekanan naik = Volume mengecil</b> (gelembung udara menyusut, air masuk ke dalam pipa).</p>
            </div>
            <div className="bg-green-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-green-700 mb-2">3. Hk. Archimedes</h4>
              <p className="text-sm font-semibold text-black">Karena gelembung udaranya mengecil, <i>volume air yang dipindahkan</i> oleh penyelam menjadi lebih sedikit. Akibatnya, <b>Gaya Apung (Fa) mengecil</b>. Saat Fa &lt; W (Berat), penyelam tenggelam!</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            PAPAN RUMUS MATEMATIS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="text-xl font-black text-slate-800 mb-4 border-b-4 border-black pb-2 uppercase">
                Kompresi Gas (Hukum Boyle)
              </h4>
              <ul className="space-y-3">
                <li className="p-3 border-2 border-black bg-sky-100 flex flex-col gap-2">
                  <span className="font-black text-2xl font-mono text-center">P₁ × V₁ = P₂ × V₂</span>
                  <span className="text-sm font-semibold text-slate-700 text-center">Jika Tekanan (P) naik saat botol diremas, maka Volume gelembung udara (V) PASTI turun.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="text-xl font-black text-slate-800 mb-4 border-b-4 border-black pb-2 uppercase">
                Gaya Apung (Hk. Archimedes)
              </h4>
              <ul className="space-y-3">
                <li className="p-3 border-2 border-black bg-green-100 flex flex-col gap-2">
                  <span className="font-black text-2xl font-mono text-center">Fₐ = ρ × g × V<sub className="text-sm">celup</sub></span>
                  <span className="text-sm font-semibold text-slate-700 text-center">Volume (V) udara menyusut = Fₐ mengecil.<br/>Jika <b>Fₐ &lt; W</b> (Gaya Apung lebih kecil dari Berat), benda akan tenggelam.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-indigo-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transform rotate-1 mb-6 rounded-lg">
            <h3 className="text-2xl font-black uppercase tracking-widest text-center">
              EVALUASI KONSEP [KUIS]
            </h3>
          </div>
          
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <div className="space-y-6">
              {quizData.map((q, qIndex) => (
                <div key={qIndex} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                  <h4 className="font-bold text-black mb-4 text-lg bg-white inline-block px-2 border-2 border-black">
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                        disabled={quizSubmitted}
                        className={`text-left px-4 py-3 border-4 border-black font-bold transition-all rounded-lg ${
                          quizSubmitted
                            ? optIndex === q.answer
                              ? 'bg-green-400 text-black'
                              : userAnswers[qIndex] === optIndex
                                ? 'bg-rose-400 text-black line-through'
                                : 'bg-white opacity-50'
                            : userAnswers[qIndex] === optIndex
                              ? 'bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-white text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
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

              {!quizSubmitted && userAnswers.every(a => a !== null) && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="bg-slate-900 text-white font-bold py-3 px-10 text-xl uppercase tracking-widest border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg"
                  >
                    KIRIM JAWABAN!
                  </button>
                </div>
              )}
            </div>

            {quizSubmitted && (() => {
              const score = getScore();
              return (
                <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                  <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
                  <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                    {score === 5
                      ? "SEMPURNA! PEMAHAMANMU TENTANG FLUIDA SANGAT BAIK."
                      : score >= 3
                        ? "CUKUP BAIK. COBA PERHATIKAN LAGI PANAH GAYA SAAT DITEKAN."
                        : "YUK BACA LAGI BAGIAN KONSEP FISIKA DI ATAS."}
                  </p>
                  <br />
                  <button
                    onClick={resetQuiz}
                    className="bg-black text-white py-3 px-8 text-lg uppercase tracking-wider font-bold border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg"
                  >
                    ULANGI KUIS
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}