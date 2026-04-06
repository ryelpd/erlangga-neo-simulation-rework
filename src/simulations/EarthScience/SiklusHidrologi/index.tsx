import { useState, useEffect, useRef, useCallback } from 'react';

export default function SiklusHidrologi() {
  const [sunIntensity, setSunIntensity] = useState(20);
  const [cloudCooling, setCloudCooling] = useState(0);
  const [sunRotation, setSunRotation] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const sunRotationRef = useRef(0);

  const quizData = [
    {
      question: "1. Proses berubahnya air laut menjadi uap air karena pemanasan matahari disebut...",
      options: ["Presipitasi", "Kondensasi", "Evaporasi", "Infiltrasi"],
      answer: 2
    },
    {
      question: "2. Berdasarkan simulasi, apa yang terjadi pada awan saat Slider Pendinginan (Kondensasi) ditingkatkan?",
      options: ["Awan menghilang tertiup angin", "Awan menjadi abu-abu gelap (mendung) dan jenuh air", "Awan berubah menjadi matahari", "Awan menyerap air dari gunung"],
      answer: 1
    },
    {
      question: "3. Peristiwa jatuhnya titik-titik air atau kristal salju dari awan ke permukaan bumi disebut...",
      options: ["Evaporasi", "Presipitasi", "Transpirasi", "Sublimasi"],
      answer: 1
    },
    {
      question: "4. Ke mana perginya air hujan (Run-off) yang jatuh ke area pegunungan dan daratan tinggi?",
      options: ["Terbang kembali ke luar angkasa", "Mengalir ke tempat yang lebih rendah menuju sungai dan laut", "Berubah menjadi batuan", "Langsung membeku menjadi es"],
      answer: 1
    },
    {
      question: "5. Apa mesin penggerak utama yang memastikan siklus hidrologi ini terus berjalan tanpa henti?",
      options: ["Gaya Magnet Bumi", "Energi Panas Matahari", "Angin Topan", "Inti Bumi"],
      answer: 1
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

  const evapParticlesRef = useRef<Array<{x: number, y: number, speed: number, baseY: number}>>([]);
  const rainParticlesRef = useRef<Array<{x: number, y: number, speed: number, startY: number}>>([]);
  const runoffParticlesRef = useRef<Array<{progress: number, speed: number}>>([]);

  useEffect(() => {
    evapParticlesRef.current = Array.from({length: 15}, () => ({
      x: 480 + Math.random() * 250,
      y: 380 + Math.random() * 200,
      speed: 0.5 + Math.random() * 1.5,
      baseY: 380 + Math.random() * 200
    }));

    rainParticlesRef.current = Array.from({length: 25}, () => ({
      x: 160 + Math.random() * 190,
      y: 150 + Math.random() * 250,
      speed: 2 + Math.random() * 3,
      startY: 150
    }));

    runoffParticlesRef.current = Array.from({length: 10}, () => ({
      progress: Math.random(),
      speed: 1 + Math.random() * 2
    }));
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    sunRotationRef.current += (sunIntensity * 0.02) * dt * 60;
    setSunRotation(sunRotationRef.current);

    evapParticlesRef.current.forEach(p => {
      p.y -= p.speed * (sunIntensity/50) * dt * 60;
      if (p.y < 150) p.y = 380;
    });

    const cloudSaturation = cloudCooling;
    const rainActive = cloudSaturation > 60;
    const rainIntensity = rainActive ? (cloudSaturation - 60) / 40 : 0;

    rainParticlesRef.current.forEach(p => {
      p.y += p.speed * dt * 60 * (1 + rainIntensity);
      if (p.y > 450) p.y = p.startY;
    });

    if (rainActive) {
      runoffParticlesRef.current.forEach(p => {
        p.progress += (p.speed * 0.005) * dt * 60;
        if (p.progress > 1) p.progress = 0;
      });
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [sunIntensity, cloudCooling]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const cloudSaturation = cloudCooling;
  const w = 255 - Math.round(cloudSaturation * 1.8);
  const cloudColor = `rgb(${w}, ${w}, ${w + 20})`;

  const rainActive = cloudSaturation > 60;
  const rainIntensity = rainActive ? (cloudSaturation - 60) / 40 : 0;

  const getEvapStatus = () => {
    if (sunIntensity > 70) return { text: "TINGGI", color: "text-rose-600" };
    if (sunIntensity > 40) return { text: "SEDANG", color: "text-yellow-600" };
    if (sunIntensity > 10) return { text: "RENDAH", color: "text-yellow-600" };
    return { text: "TERHENTI", color: "text-slate-400" };
  };

  const getRainStatus = () => {
    if (cloudSaturation > 85) return { text: "DERAS", color: "text-blue-600" };
    if (cloudSaturation > 60) return { text: "GERIMIS", color: "text-blue-600" };
    return { text: "TIDAK ADA", color: "text-slate-400" };
  };

  const evapStatus = getEvapStatus();
  const rainStatus = getRainStatus();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="bg-emerald-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            GEOGRAFI & FISIKA LINGKUNGAN
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-center">
            LAB VIRTUAL: SIKLUS HIDROLOGI
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black mx-auto block text-center">
            Mempelajari Perjalanan Air di Bumi (Evaporasi, Kondensasi, Presipitasi)
          </p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max">
                Interaksi Lingkungan
              </label>
              <div className="text-sm font-bold text-slate-700 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-emerald-50 rounded-lg">
                💡 Gunakan <i>slider</i> di samping untuk memanipulasi cuaca. Tingkatkan panas matahari untuk menguapkan air, lalu dinginkan awan untuk meneteskan hujan!
              </div>
            </div>

            <div className="w-full md:w-2/3 flex flex-col gap-6">
              <div className="bg-yellow-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-black text-lg text-yellow-700 uppercase">☀️ Panas Matahari (Evaporasi)</span>
                  <span className="font-mono font-black text-xl bg-white px-3 border-2 border-black">{sunIntensity}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={sunIntensity}
                  onChange={(e) => setSunIntensity(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:h-9 [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="bg-slate-200 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-black text-lg text-slate-700 uppercase">☁️ Pendinginan Udara (Kondensasi)</span>
                  <span className="font-mono font-black text-xl bg-white px-3 border-2 border-black">{cloudCooling}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={cloudCooling}
                  onChange={(e) => setCloudCooling(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:h-9 [&::-webkit-slider-thumb]:bg-slate-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-sky-200 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
          <div className="absolute top-6 left-6 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">AREA SIMULASI ALAM</h2>
          </div>

          <div className="absolute top-6 right-6 z-30 bg-white/95 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3 text-xs font-bold uppercase w-56 backdrop-blur-sm rounded-lg hidden md:block">
            <h3 className="text-center font-black text-sm border-b-4 border-black pb-2 mb-1">STATUS SIKLUS</h3>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <span>Evaporasi</span>
              <span className={`font-black ${evapStatus.color}`}>{evapStatus.text}</span>
            </div>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <span>Kondensasi Awan</span>
              <span className="font-black text-slate-600">{cloudSaturation}%</span>
            </div>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <span>Presipitasi (Hujan)</span>
              <span className={`font-black ${rainStatus.color}`}>{rainStatus.text}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Infiltrasi/Runoff</span>
              <span className={`font-black ${rainActive ? 'text-green-600' : 'text-slate-400'}`}>
                {rainActive ? 'MENGALIR' : 'TIDAK ADA'}
              </span>
            </div>
          </div>

          <div className="mt-20 md:mt-0 relative w-full max-w-[800px] h-[500px] bg-[#e0f2fe] border-8 border-black overflow-hidden rounded-xl mx-auto">
            
            <svg viewBox="0 0 800 500" className="w-full h-full relative z-20 overflow-visible">
                
              <defs>
                <marker id="arrowUp" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <polygon points="0 6, 3 0, 6 6" fill="#0ea5e9" stroke="#000" strokeWidth="1"/>
                </marker>
                <marker id="arrowDown" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <polygon points="0 0, 3 6, 6 0" fill="#3b82f6" stroke="#000" strokeWidth="1"/>
                </marker>
              </defs>

              <g transform="translate(650, 100)">
                <circle cx="0" cy="0" r="45" fill="#facc15" stroke="#000" strokeWidth="6"/>
                <g transform={`rotate(${sunRotation})`} opacity={0.2 + (sunIntensity / 100) * 0.8}>
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                    const rad = angle * (Math.PI / 180);
                    return (
                      <line
                        key={i}
                        x1={Math.cos(rad) * 55}
                        y1={Math.sin(rad) * 55}
                        x2={Math.cos(rad) * 80}
                        y2={Math.sin(rad) * 80}
                        stroke="#facc15"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </g>
                <circle cx="-15" cy="-10" r="5" fill="#000"/>
                <circle cx="15" cy="-10" r="5" fill="#000"/>
                <path d="M -15 10 Q 0 25 15 10" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round"/>
              </g>

              <path d="M -100 550 L 150 200 L 450 550 Z" fill="#4ade80" stroke="#000" strokeWidth="8" strokeLinejoin="round"/>
              <path d="M 100 550 L 250 300 L 550 550 Z" fill="#22c55e" stroke="#000" strokeWidth="8" strokeLinejoin="round"/>
              <path d="M 105 250 L 150 200 L 195 250 L 170 270 L 150 240 L 130 270 Z" fill="#ffffff" stroke="#000" strokeWidth="6" strokeLinejoin="round"/>

              <rect x="0" y="450" width="450" height="50" fill="#8b5cf6" stroke="#000" strokeWidth="8"/>
              <text x="20" y="482" fontSize="16" fontWeight="900" fill="#fff" style={{textShadow: '2px 2px 0 #000'}}>AIR TANAH (AQUIFER)</text>

              <rect x="450" y="380" width="400" height="120" fill="#0ea5e9" stroke="#000" strokeWidth="8"/>
              <path d="M 450 380 Q 500 360 550 380 T 650 380 T 750 380 T 850 380" fill="none" stroke="#000" strokeWidth="8"/>
              <text x="550" y="440" fontSize="20" fontWeight="900" fill="#fff" style={{textShadow: '2px 2px 0 #000'}}>LAUTAN</text>

              <g opacity={sunIntensity / 100}>
                {evapParticlesRef.current.map((p, i) => (
                  <line
                    key={`evap-${i}`}
                    x1={p.x}
                    y1={p.y}
                    x2={p.x}
                    y2={p.y - 15}
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeDasharray="8 4"
                    markerEnd="url(#arrowUp)"
                  />
                ))}
              </g>

              <g opacity={rainIntensity}>
                {rainParticlesRef.current.map((p, i) => (
                  <line
                    key={`rain-${i}`}
                    x1={p.x}
                    y1={p.y}
                    x2={p.x - 5}
                    y2={p.y + 15}
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeDasharray="10 5"
                  />
                ))}
              </g>

              <g opacity={rainIntensity}>
                {runoffParticlesRef.current.map((p, i) => {
                  const startX = 250;
                  const startY = 300;
                  const endX = 500;
                  const endY = 500;
                  const curX = startX + (endX - startX) * p.progress;
                  const curY = startY + (endY - startY) * p.progress;
                  return (
                    <line
                      key={`runoff-${i}`}
                      x1={curX}
                      y1={curY}
                      x2={curX + 15}
                      y2={curY + 12}
                      stroke="#2563eb"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>

              <g transform="translate(150, 80)">
                <path 
                  d="M 50 40 Q 50 0 100 0 Q 140 0 150 20 Q 190 10 220 40 Q 250 50 250 80 Q 250 120 200 120 L 60 120 Q 10 120 10 80 Q 10 40 50 40 Z" 
                  fill={cloudColor}
                  stroke="#000" 
                  strokeWidth="8" 
                  strokeLinejoin="round"
                />
                <circle cx="100" cy="70" r="6" fill="#000"/>
                <circle cx="160" cy="70" r="6" fill="#000"/>
                <path d="M 110 90 Q 130 105 150 90" fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round"/>
              </g>

              {sunIntensity > 10 && (
                <>
                  <rect x="550" y="240" width="130" height="30" fill="#facc15" stroke="#000" strokeWidth="3" rx="4"/>
                  <text x="560" y="260" fontSize="14" fontWeight="900" fill="#000">1. EVAPORASI</text>
                </>
              )}

              {cloudSaturation > 20 && (
                <>
                  <rect x="180" y="30" width="140" height="30" fill="#94a3b8" stroke="#000" strokeWidth="3" rx="4"/>
                  <text x="190" y="50" fontSize="14" fontWeight="900" fill="#fff">2. KONDENSASI</text>
                </>
              )}

              {rainActive && (
                <>
                  <rect x="20" y="160" width="140" height="30" fill="#3b82f6" stroke="#000" strokeWidth="3" rx="4"/>
                  <text x="30" y="180" fontSize="14" fontWeight="900" fill="#fff">3. PRESIPITASI</text>
                </>
              )}

              {rainActive && (
                <>
                  <rect x="300" y="320" width="110" height="30" fill="#22c55e" stroke="#000" strokeWidth="3" rx="4"/>
                  <text x="310" y="340" fontSize="14" fontWeight="900" fill="#000">4. RUN-OFF</text>
                </>
              )}

            </svg>
          </div>
        </div>

        <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 transform -rotate-1">
            KONSEP MATERI: BAGAIMANA SIKLUS INI BEKERJA? 🌍
          </h3>
          <p className="text-black font-semibold text-md leading-relaxed mb-3 bg-white/60 p-3 border-2 border-black border-dashed">
            Air di bumi tidak pernah hilang atau bertambah secara signifikan, melainkan terus berputar melalui tahapan-tahapan yang disebut <b>Siklus Hidrologi</b>. Mesin utama penggerak siklus ini adalah <b>Panas Matahari</b>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-rose-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-rose-700 mb-2">☀️ 1. Evaporasi & Transpirasi</h4>
              <p className="text-sm font-semibold">Panas matahari memanaskan air di laut, sungai, dan danau, mengubah wujudnya dari cair menjadi gas (uap air) yang naik ke atmosfer. Penguapan dari tumbuhan disebut <i>Transpirasi</i>.</p>
            </div>
            <div className="bg-slate-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-slate-700 mb-2">☁️ 2. Kondensasi</h4>
              <p className="text-sm font-semibold text-black">Saat uap air naik ke tempat yang tinggi, suhu udara menjadi lebih dingin. Uap air ini mendingin dan berubah kembali menjadi titik-titik air kecil yang berkumpul membentuk <b>Awan</b>.</p>
            </div>
            <div className="bg-sky-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-sky-700 mb-2">🌧️ 3. Presipitasi</h4>
              <p className="text-sm font-semibold text-black">Ketika awan sudah terlalu padat dan jenuh oleh air (awan menjadi gelap/mendung), awan tidak sanggup lagi menahan beban airnya. Air pun jatuh ke bumi sebagai <b>Hujan atau Salju</b>.</p>
            </div>
            <div className="bg-green-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-green-700 mb-2">🏞️ 4. Infiltrasi & Run-off</h4>
              <p className="text-sm font-semibold text-black">Air hujan yang jatuh ke daratan akan meresap ke dalam tanah menjadi air tanah (<b>Infiltrasi</b>) atau mengalir di permukaan tanah menuju sungai dan kembali ke laut (<b>Run-off</b>).</p>
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
                      ? "SEMPURNA! PEMAHAMANMU TENTANG SIKLUS AIR SANGAT BAIK."
                      : score >= 3
                        ? "CUKUP BAIK. COBA PERHATIKAN LAGI ANIMASI SIMULASI SAAT HUJAN."
                        : "YUK BACA LAGI BAGIAN KONSEP MATERI DI ATAS."}
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