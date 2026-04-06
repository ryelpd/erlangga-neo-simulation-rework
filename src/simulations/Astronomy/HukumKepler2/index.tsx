import { useState, useEffect, useRef, useCallback } from 'react';

export default function HukumKepler2() {
  const [eccentricity, setEccentricity] = useState(0.5);
  const [semiMajorAxis, setSemiMajorAxis] = useState(200);
  const [isPaused, setIsPaused] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const simTimeRef = useRef<number>(0);
  const positionHistoryRef = useRef<Array<{x: number, y: number}>>([]);

  const CX = 450;
  const CY = 275;
  const AREA_HISTORY_FRAMES = 60;

  const quizData = [
    {
      question: "1. Menurut Hukum Kepler I, bagaimana bentuk lintasan orbit planet, dan di manakah letak Matahari?",
      options: ["Berbentuk Lingkaran, Matahari di pusatnya", "Berbentuk Elips, Matahari terletak di salah satu titik fokus", "Berbentuk Oval, Matahari selalu berpindah-pindah", "Berbentuk Gelombang, Matahari diam"],
      answer: 1
    },
    {
      question: "2. Coba atur slider Eksentrisitas menjadi 0. Apa yang terjadi pada bentuk orbit planet tersebut?",
      options: ["Menjadi garis lurus", "Menjadi sangat lonjong / pipih", "Menjadi lingkaran sempurna", "Orbitnya menghilang"],
      answer: 2
    },
    {
      question: "3. Berdasarkan Hukum Kepler II, perhatikan kecepatan planet. Kapan planet bergerak dengan kecepatan PALING TINGGI?",
      options: ["Saat berada di Aphelion (titik terjauh dari Matahari)", "Kecepatannya selalu konstan tidak pernah berubah", "Saat berada di titik tengah orbit", "Saat berada di Perihelion (titik terdekat dengan Matahari)"],
      answer: 3
    },
    {
      question: "4. Aktifkan fitur 'Jejak Luas Sapuan'. Hukum Kepler II menyatakan bahwa dalam interval waktu yang TEPAT SAMA, area berwarna hijau yang disapu oleh planet tersebut akan...",
      options: ["Berubah-ubah ukurannya", "Selalu memiliki LUAS YANG SAMA meskipun bentuknya berbeda", "Semakin besar saat menjauhi matahari", "Hanya muncul saat eksentrisitas 0"],
      answer: 1
    },
    {
      question: "5. Sesuai Hukum Kepler III, jika Anda MEMPERBESAR Jarak Orbit (Sumbu Semimayor), apa dampaknya terhadap Periode Orbit (Tahun planet tersebut)?",
      options: ["Periode orbitnya semakin singkat (cepat)", "Periode orbitnya menjadi semakin LAMA", "Periodenya tidak berubah karena T²/a³ adalah konstan", "Planet akan jatuh ke Matahari"],
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

  const solveKepler = (M: number, e: number): number => {
    let E = M;
    const tolerance = 1e-6;
    const maxIter = 10;
    
    for (let i = 0; i < maxIter; i++) {
      const deltaE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= deltaE;
      if (Math.abs(deltaE) < tolerance) break;
    }
    return E;
  };

  const b = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
  const c = semiMajorAxis * eccentricity;
  const sunX = CX + c;
  const sunY = CY;

  const period = Math.sqrt(0.0001 * Math.pow(semiMajorAxis, 3));
  const keplerConstant = (period * period) / Math.pow(semiMajorAxis, 3);

  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    if (!isPaused) {
      simTimeRef.current += dt;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isPaused]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    positionHistoryRef.current = [];
  }, [eccentricity, semiMajorAxis]);

  const M = (2 * Math.PI / period) * simTimeRef.current;
  const E = solveKepler(M, eccentricity);
  const planetXRel = semiMajorAxis * Math.cos(E);
  const planetYRel = b * Math.sin(E);
  const planetX = CX + planetXRel;
  const planetY = CY + planetYRel;

  const r = Math.sqrt(Math.pow(planetX - sunX, 2) + Math.pow(planetY - sunY, 2));
  const GM_sim = 50000;
  const velocity = Math.sqrt(GM_sim * (2 / r - 1 / semiMajorAxis));

  if (!isPaused) {
    positionHistoryRef.current.push({ x: planetX, y: planetY });
    if (positionHistoryRef.current.length > AREA_HISTORY_FRAMES) {
      positionHistoryRef.current.shift();
    }
  }

  const sweptAreaPath = showArea && positionHistoryRef.current.length > 1
    ? `M ${sunX} ${sunY} L ${positionHistoryRef.current[0].x} ${positionHistoryRef.current[0].y} ` +
      positionHistoryRef.current.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z'
    : '';

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-indigo-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            FISIKA ASTRONOMI
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-center">
            LAB VIRTUAL: HUKUM KEPLER
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black mx-auto block text-center">
            Mekanika Orbit Planet, Eksentrisitas, dan Periode Revolusi
          </p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
            
            <div className="w-full lg:w-1/3 flex flex-col gap-3">
              <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                1. Bentuk Orbit (Eksentrisitas / e)
              </label>
              <div className="bg-yellow-50 p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 justify-center rounded-lg flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-black text-lg text-yellow-800 uppercase">Eksentrisitas</span>
                  <span className="font-mono font-black text-xl bg-white px-2 border-2 border-black">{eccentricity.toFixed(2)}</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="0.85"
                  step="0.01"
                  value={eccentricity}
                  onChange={(e) => setEccentricity(parseFloat(e.target.value))}
                  className="w-full h-3 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:h-9 [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                  <span>Lingkaran (0)</span>
                  <span>Sangat Lonjong (0.85)</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/3 flex flex-col gap-3">
              <label className="text-sm font-bold text-black uppercase bg-sky-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                2. Ukuran Orbit (Sumbu Semimayor / a)
              </label>
              <div className="bg-sky-50 p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 justify-center rounded-lg flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-black text-lg text-sky-800 uppercase">Jarak Orbit</span>
                  <span className="font-mono font-black text-xl bg-white px-2 border-2 border-black">{semiMajorAxis} AU</span>
                </div>
                <input 
                  type="range"
                  min="100"
                  max="300"
                  step="5"
                  value={semiMajorAxis}
                  onChange={(e) => setSemiMajorAxis(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:h-9 [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                  <span>Dekat</span>
                  <span>Jauh</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/3 flex flex-col gap-3">
              <label className="text-sm font-bold text-black uppercase bg-rose-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                3. Analisis Visual (Hukum II)
              </label>
              <div className="flex flex-col gap-3 flex-1">
                <button 
                  onClick={() => setShowArea(!showArea)}
                  className={`py-4 border-4 border-black text-center text-sm font-bold uppercase transition-all rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    showArea 
                      ? 'bg-rose-400 text-black' 
                      : 'bg-emerald-400 text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  👁️ {showArea ? 'SEMBUNYIKAN' : 'TAMPILKAN'} JEJAK LUAS SAPUAN
                </button>
                <button 
                  onClick={() => {
                    setIsPaused(!isPaused);
                    if (!isPaused) lastTimeRef.current = performance.now();
                  }}
                  className={`py-4 border-4 border-black text-center text-sm font-bold uppercase transition-all rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    isPaused 
                      ? 'bg-yellow-400 text-black' 
                      : 'bg-slate-200 text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {isPaused ? '▶️ LANJUTKAN' : '⏸️ JEDA'} SIMULASI
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
          <div className="absolute top-6 left-6 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">AREA ORBIT TATA SURYA</h2>
          </div>

          <div className="absolute top-6 right-6 z-30 bg-white/95 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 text-xs font-bold uppercase w-64 backdrop-blur-sm rounded-lg hidden md:block">
            <h3 className="text-center font-black text-sm border-b-4 border-black pb-2 mb-2">TELEMETRI PLANET</h3>
            
            <div className="flex items-center justify-between bg-slate-100 p-1 border-2 border-slate-300">
              <span>Jarak ke Matahari (r)</span>
              <span className="font-mono text-sm text-rose-600">{r.toFixed(1)} AU</span>
            </div>
            
            <div className="flex items-center justify-between bg-slate-100 p-1 border-2 border-slate-300 mt-1">
              <span>Kecepatan Planet (v)</span>
              <span className="font-mono text-sm text-sky-600">{velocity.toFixed(1)} km/s</span>
            </div>
            
            <div className="flex items-center justify-between bg-slate-100 p-1 border-2 border-slate-300 mt-1">
              <span>Periode Orbit (T)</span>
              <span className="font-mono text-sm text-green-600">{period.toFixed(2)} Tahun</span>
            </div>

            <div className="mt-2 text-center p-2 border-2 border-dashed border-slate-400 bg-emerald-50">
              <div className="text-[10px] text-slate-500 mb-1">KONSTANTA KEPLER (T² / a³)</div>
              <div className="font-mono text-lg font-black text-emerald-700">{keplerConstant.toFixed(6)}</div>
            </div>
          </div>

          <div className="mt-28 md:mt-10 relative w-full max-w-[900px] h-[550px] bg-[#0f172a] border-8 border-black overflow-hidden rounded-xl mx-auto">
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}></div>
            
            <svg viewBox="0 0 900 550" className="w-full h-full relative z-20 overflow-visible">
                
              <ellipse 
                cx={CX} 
                cy={CY} 
                rx={semiMajorAxis} 
                ry={b}
                fill="none" 
                stroke="#64748b" 
                strokeWidth="3" 
                strokeDasharray="10 5"
              />
              
              <line x1={CX - semiMajorAxis} y1={CY} x2={CX + semiMajorAxis} y2={CY} stroke="#94a3b8" strokeWidth="1" opacity="0.5"/>
              <line x1={CX} y1={CY - b} x2={CX} y2={CY + b} stroke="#94a3b8" strokeWidth="1" opacity="0.5"/>

              {showArea && sweptAreaPath && (
                <path d={sweptAreaPath} fill="#22c55e" opacity="0.5" stroke="#16a34a" strokeWidth="2"/>
              )}

              <g transform={`translate(${sunX}, ${sunY})`}>
                <circle cx="0" cy="0" r="20" fill="#facc15" stroke="#000" strokeWidth="4"/>
                <path d="M 0 -25 L 0 -35 M 0 25 L 0 35 M 25 0 L 35 0 M -25 0 L -35 0" stroke="#facc15" strokeWidth="4" strokeLinecap="round"/>
                <path d="M 18 18 L 25 25 M -18 -18 L -25 -25 M 18 -18 L 25 -25 M -18 18 L -25 25" stroke="#facc15" strokeWidth="4" strokeLinecap="round"/>
                <text x="0" y="45" fontSize="12" fontWeight="900" fill="#fff" textAnchor="middle" style={{textShadow: '1px 1px 0 #000'}}>MATAHARI</text>
              </g>

              <line x1={sunX} y1={sunY} x2={planetX} y2={planetY} stroke="#f43f5e" strokeWidth="3" strokeDasharray="6 4"/>

              <g transform={`translate(${planetX}, ${planetY})`}>
                <circle cx="0" cy="0" r="12" fill="#38bdf8" stroke="#000" strokeWidth="4"/>
                <path d="M -8 -4 Q 0 -8 8 -4" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
                <text x="0" y="-20" fontSize="14" fontWeight="900" fill="#fff" textAnchor="middle" style={{textShadow: '1px 1px 0 #000'}}>PLANET</text>
              </g>

              <g>
                <circle cx={CX - semiMajorAxis} cy={CY} r="4" fill="#fff"/>
                <text x={CX - semiMajorAxis} y={CY + 20} fontSize="10" fontWeight="900" fill="#94a3b8" textAnchor="middle">APHELION (Terjauh)</text>
              </g>
              <g>
                <circle cx={CX + semiMajorAxis} cy={CY} r="4" fill="#fff"/>
                <text x={CX + semiMajorAxis} y={CY + 20} fontSize="10" fontWeight="900" fill="#94a3b8" textAnchor="middle">PERIHELION (Terdekat)</text>
              </g>

            </svg>
          </div>
        </div>

        <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 transform -rotate-1">
            PENJELASAN 3 HUKUM KEPLER 🪐
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-rose-600 mb-2 border-b-2 border-black pb-1">HUKUM I (Bentuk Orbit)</h4>
              <p className="text-sm font-semibold">"Lintasan setiap planet ketika mengelilingi matahari berbentuk <b>elips</b>, di mana matahari terletak pada salah satu titik fokusnya (foci)." <br/><br/>Coba geser slider <b>Eksentrisitas</b>. Jika 0, orbit menjadi lingkaran sempurna. Jika mendekati 1, orbit sangat lonjong.</p>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-emerald-600 mb-2 border-b-2 border-black pb-1">HUKUM II (Luas Sapuan)</h4>
              <p className="text-sm font-semibold text-black">"Garis khayal yang menghubungkan planet dengan matahari menyapu <b>luas daerah yang sama</b> dalam interval waktu yang sama." <br/><br/>Aktifkan <b>Jejak Luas Sapuan</b>. Perhatikan! Planet bergerak <b>LEBIH CEPAT</b> saat dekat matahari (Perihelion) dan <b>LEBIH LAMBAT</b> saat jauh (Aphelion).</p>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-sky-600 mb-2 border-b-2 border-black pb-1">HUKUM III (Harmonik)</h4>
              <p className="text-sm font-semibold text-black">"Kuadrat periode orbit (T²) sebanding dengan pangkat tiga jarak rata-rata ke matahari (a³)." <br/><br/>Lihat <b>Konstanta Kepler</b> di panel telemetri. Walaupun Anda mengubah ukuran orbit (a) menjadi berapapun, perbandingan T² / a³ akan selalu menghasilkan angka yang sama (konstan)!</p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            PAPAN RUMUS MATEMATIS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="text-xl font-black text-slate-800 mb-4 border-b-4 border-black pb-2 uppercase">
                Parameter Orbit Elips
              </h4>
              <ul className="space-y-3">
                <li className="p-3 border-2 border-black bg-rose-50 flex flex-col gap-2">
                  <div className="text-lg font-black text-center font-mono">b = a × √(1 - e²)</div>
                  <span className="text-sm font-semibold text-slate-700">
                    <b>a</b> = Sumbu Semimayor (Jari-jari panjang).<br/>
                    <b>b</b> = Sumbu Semiminor (Jari-jari pendek).<br/>
                    <b>e</b> = Eksentrisitas (Kelonjongan).
                  </span>
                </li>
                <li className="p-3 border-2 border-black bg-rose-50 flex flex-col gap-2">
                  <div className="text-lg font-black text-center font-mono">r = a × (1 - e × cos(E))</div>
                  <span className="text-sm font-semibold text-slate-700">
                    Rumus untuk menghitung jarak aktual planet (<b>r</b>) ke matahari di setiap titik posisinya.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="text-xl font-black text-slate-800 mb-4 border-b-4 border-black pb-2 uppercase">
                Persamaan Hukum III Kepler
              </h4>
              <ul className="space-y-3">
                <li className="p-3 border-2 border-black bg-sky-50 flex flex-col gap-2">
                  <div className="text-3xl font-black text-center font-mono">T² / a³ = k</div>
                  <span className="text-sm font-semibold text-slate-700">
                    <b>T</b> = Periode Revolusi (Waktu 1 putaran penuh).<br/>
                    <b>a</b> = Sumbu Semimayor.<br/>
                    <b>k</b> = Konstanta (Nilainya tetap untuk semua planet yang mengelilingi bintang yang sama).
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-emerald-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
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
                      ? "SEMPURNA! PEMAHAMAN ASTRONOMIMU SANGAT BAIK."
                      : score >= 3
                        ? "CUKUP BAIK. COBA PERHATIKAN LAGI LUAS SAPUAN DI SIMULASI."
                        : "YUK BACA LAGI BAGIAN PENJELASAN HUKUM DI ATAS."}
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