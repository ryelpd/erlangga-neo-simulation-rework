import type { ReactNode } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';

const G = 9.8;
const PX_PER_METER = 5;
const GROUND_Y = 450;
const LAUNCH_X = 50;

const quizData = [
  { 
    question: "1. Gerak parabola merupakan perpaduan dua gerak lurus yang saling tidak mempengaruhi (independen). Pada arah horizontal (Sumbu X), jenis gerak yang terjadi adalah...", 
    options: ["Gerak Lurus Berubah Beraturan (GLBB)", "Gerak Lurus Beraturan (GLB) dengan kecepatan konstan", "Gerak Jatuh Bebas", "Gerak Melingkar"], 
    answer: 1 
  },
  { 
    question: "2. Pada titik tertinggi (Y_max) dari sebuah lintasan parabola, berapakah nilai kecepatan vertikalnya (vy)?", 
    options: ["Maksimal", "Sama dengan kecepatan awal (v0)", "Nol (0 m/s)", "Minus"], 
    answer: 2 
  },
  { 
    question: "3. Untuk tembakan dari permukaan tanah (h0 = 0), sudut elevasi berapakah yang akan menghasilkan jarak tembak terjauh (X_max)?", 
    options: ["30 derajat", "45 derajat", "60 derajat", "90 derajat"], 
    answer: 1 
  },
  { 
    question: "4. Bagaimana pengaruh Ketinggian Awal (h0) jika dinaikkan menjadi 50m pada sudut elevasi 0 derajat (ditembak mendatar)?", 
    options: ["Proyektil langsung jatuh ke bawah", "Proyektil melayang ke atas", "Proyektil tetap bergerak maju (memiliki X_max) sambil jatuh karena punya waktu lebih lama di udara", "Tidak ada pengaruhnya"], 
    answer: 2 
  },
  { 
    question: "5. Mengapa lintasan ini berbentuk lengkungan parabola?", 
    options: ["Karena pengaruh gaya angin", "Karena bentuk meriamnya bulat", "Karena kecepatan horizontalnya (vx) tetap, sementara kecepatan vertikalnya (vy) terus berubah karena gaya gravitasi", "Hanya kebetulan geometris"], 
    answer: 2 
  }
];

export default function GerakParabola(): ReactNode {
  const [v0, setV0] = useState(20);
  const [angle, setAngle] = useState(45);
  const [h0, setH0] = useState(0);
  const [isFiring, setIsFiring] = useState(false);
  const [projectilePos, setProjectilePos] = useState({ x: -100, y: -100, visible: false });
  const [trajectoryPath, setTrajectoryPath] = useState("");
  const [historyPaths, setHistoryPaths] = useState<string[]>([]);
  const [hudData, setHudData] = useState({ t: 0, x: 0, y: 0, visible: false });
  const [vectors, setVectors] = useState({ vx: 0, vy: 0, visible: false });
  
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(null);
  const simTimeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const activeParamsRef = useRef({ v0x: 0, v0y: 0, h0: 0 });
  const livePathRef = useRef("");

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const angleRad = (angle * Math.PI) / 180;
  const v0x = v0 * Math.cos(angleRad);
  const v0y = v0 * Math.sin(angleRad);

  const tPuncak = v0y / G;
  const Ymax = h0 + (v0y * tPuncak) - (0.5 * G * tPuncak * tPuncak);
  
  let tTotal = 0;
  if (h0 === 0) {
    tTotal = (2 * v0y) / G;
  } else {
    tTotal = (v0y + Math.sqrt(v0y * v0y + 2 * G * h0)) / G;
  }
  const Xmax = v0x * tTotal;

  const h0_px = h0 * PX_PER_METER;

  const fireProjectile = useCallback(() => {
    if (isFiring) return;

    const currentAngleRad = (angle * Math.PI) / 180;
    activeParamsRef.current = {
      v0x: v0 * Math.cos(currentAngleRad),
      v0y: v0 * Math.sin(currentAngleRad),
      h0: h0
    };

    simTimeRef.current = 0;
    livePathRef.current = `M ${LAUNCH_X} ${GROUND_Y - (h0 * PX_PER_METER)}`;
    
    setIsFiring(true);
    setTrajectoryPath(livePathRef.current);
    setProjectilePos({ x: LAUNCH_X, y: GROUND_Y - h0_px, visible: true });
    setHudData({ t: 0, x: 0, y: h0, visible: true });
    setVectors({ vx: v0 * Math.cos(currentAngleRad), vy: v0 * Math.sin(currentAngleRad), visible: true });

    lastTimeRef.current = performance.now();
    
    const animate = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      simTimeRef.current += dt * 1.5;

      const { v0x: av0x, v0y: av0y, h0: ah0 } = activeParamsRef.current;
      
      const x = av0x * simTimeRef.current;
      const y = ah0 + (av0y * simTimeRef.current) - (0.5 * G * simTimeRef.current * simTimeRef.current);

      const x_px = LAUNCH_X + (x * PX_PER_METER);
      const y_px = GROUND_Y - (y * PX_PER_METER);

      const vyCurrent = av0y - (G * simTimeRef.current);

      livePathRef.current += ` L ${x_px} ${y_px}`;
      
      setProjectilePos({ x: x_px, y: y_px, visible: true });
      setTrajectoryPath(livePathRef.current);
      setHudData({ t: simTimeRef.current, x, y: Math.max(0, y), visible: true });
      setVectors({ vx: av0x, vy: vyCurrent, visible: true });

      if (y <= 0) {
        setIsFiring(false);
        setProjectilePos(prev => ({ ...prev, y: GROUND_Y }));
        setHudData(prev => ({ ...prev, visible: false }));
        setVectors(prev => ({ ...prev, visible: false }));
        setHistoryPaths(prev => [...prev, livePathRef.current]);
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [isFiring, v0, angle, h0, h0_px]);

  const handleClear = () => {
    if (isFiring) return;
    setHistoryPaths([]);
    setTrajectoryPath("");
    setProjectilePos({ x: -100, y: -100, visible: false });
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const clockMarks = [];
  for (let i = 1; i <= 7; i++) {
    clockMarks.push(
      <text key={`ymark-${i}`} x={10} y={450 - i * 50} fill="#94a3b8" fontSize="10" fontWeight="bold">{i * 10}m</text>
    );
  }
  for (let i = 1; i <= 7; i++) {
    clockMarks.push(
      <text key={`xmark-${i}`} x={50 + i * 100} y={470} fill="#94a3b8" fontSize="10" fontWeight="bold">{i * 20}m</text>
    );
  }

  const handleAnswer = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (userAnswers.every(a => a !== null)) {
      setQuizSubmitted(true);
    }
  };

  const handleRetry = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const score = userAnswers.reduce<number>((acc, a, i) => {
    if (a === quizData[i].answer) return acc + 1;
    return acc;
  }, 0);

  const VEC_SCALE = 2;

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-7xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">FISIKA MEKANIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: GERAK PARABOLA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Analisis Lintasan Proyektil, Sudut Elevasi, dan Kecepatan Awal
        </p>
      </header>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-5 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Parameter Meriam
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-800 uppercase text-[10px]">Kecepatan Awal (v₀)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{v0} m/s</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={v0}
                onChange={(e) => setV0(Number(e.target.value))}
                disabled={isFiring}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded disabled:opacity-50"
              />
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Sudut Elevasi (θ)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                disabled={isFiring}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded disabled:opacity-50"
              />
            </div>

            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-800 uppercase text-[10px]">Ketinggian Awal (h₀)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{h0} m</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={h0}
                onChange={(e) => setH0(Number(e.target.value))}
                disabled={isFiring}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={fireProjectile}
                disabled={isFiring}
                className="col-span-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:translate-x-[4px] disabled:translate-y-[4px] disabled:shadow-none py-4 text-lg font-black uppercase flex items-center justify-center gap-2 transition-all"
              >
                🚀 TEMBAK PROYEKTIL
              </button>
              <button
                onClick={handleClear}
                disabled={isFiring}
                className="col-span-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 text-xs font-bold uppercase transition-all"
              >
                🧹 Bersihkan Lintasan
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">PREDIKSI TEORITIS (g = 9.8 m/s²)</h4>
            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                <span className="text-slate-400">Jarak Maksimum (Xₘₐₓ):</span>
                <span className="text-sky-400 font-bold text-base">{Xmax.toFixed(1)} m</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                <span className="text-slate-400">Tinggi Maksimum (Yₘₐₓ):</span>
                <span className="text-rose-400 font-bold text-base">{Ymax.toFixed(1)} m</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-white font-bold">Waktu Udara (t):</span>
                <span className="text-yellow-400 font-black text-lg">{tTotal.toFixed(2)} s</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden border-8 border-black">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Area Peluncuran
          </span>

          <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[10px] font-bold uppercase shadow-[2px_2px_0px_#000]">
            <div className="flex items-center gap-1"><span className="text-rose-500 text-lg">●</span> Posisi Aktif</div>
            <div className="flex items-center gap-1"><div className="w-3 h-0 border-t-2 border-dashed border-slate-500"></div> Lintasan Udara</div>
          </div>

          <div className="w-full h-full relative z-10 flex items-center justify-center">
            <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                </pattern>
              </defs>

              <rect width="800" height="500" fill="url(#grid)" />

              {clockMarks}

              <line x1="0" y1={GROUND_Y} x2="800" y2={GROUND_Y} stroke="#0f172a" strokeWidth="4" />
              <rect x="0" y="452" width="800" height="48" fill="#e2e8f0" />

              <rect x={LAUNCH_X - 30} y={GROUND_Y - h0_px} width="60" height={h0_px} fill="#94a3b8" stroke="#000" strokeWidth="4" />

              {historyPaths.map((path, i) => (
                <path key={i} d={path} fill="none" stroke="#94a3b8" strokeWidth="2" />
              ))}

              {trajectoryPath && (
                <path d={trajectoryPath} fill="none" stroke="#facc15" strokeWidth="4" strokeDasharray="8 8" className="animate-[dash_1s_linear_infinite]" />
              )}

              <g transform={`translate(${LAUNCH_X}, ${GROUND_Y - h0_px})`}>
                <circle cx="0" cy="0" r="15" fill="#3b82f6" stroke="#000" strokeWidth="4" />
                <g transform={`rotate(${-angle})`}>
                  <rect x="0" y="-10" width="40" height="20" fill="#1e293b" stroke="#000" strokeWidth="4" rx="2" />
                  <rect x="35" y="-12" width="10" height="24" fill="#f43f5e" stroke="#000" strokeWidth="2" rx="2" />
                </g>
                <circle cx="0" cy="0" r="4" fill="#000" />
              </g>

              {projectilePos.visible && (
                <>
                  <circle cx={projectilePos.x} cy={projectilePos.y} r="8" fill="#f43f5e" stroke="#000" strokeWidth="3" />
                  
                  {vectors.visible && (
                    <>
                      <line x1={projectilePos.x} y1={projectilePos.y} x2={projectilePos.x + vectors.vx * VEC_SCALE} y2={projectilePos.y} stroke="#3b82f6" strokeWidth="3" strokeDasharray="4 2" />
                      <line x1={projectilePos.x} y1={projectilePos.y} x2={projectilePos.x} y2={projectilePos.y - vectors.vy * VEC_SCALE} stroke="#22c55e" strokeWidth="3" strokeDasharray="4 2" />
                      <line x1={projectilePos.x} y1={projectilePos.y} x2={projectilePos.x + vectors.vx * VEC_SCALE} y2={projectilePos.y - vectors.vy * VEC_SCALE} stroke="#facc15" strokeWidth="4" />
                    </>
                  )}
                </>
              )}
            </svg>
          </div>

          {hudData.visible && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 border-2 border-white font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#facc15] z-30 flex gap-4">
              <span>Waktu: <span className="text-yellow-400">{hudData.t.toFixed(1)}s</span></span>
              <span>X: <span className="text-sky-400">{hudData.x.toFixed(1)}m</span></span>
              <span>Y: <span className="text-rose-400">{hudData.y.toFixed(1)}m</span></span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-7xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          MEMAHAMI GERAK PARABOLA 🚀
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Sumbu X (Horizontal)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Pada arah horizontal (Mendatar), <b>tidak ada gaya</b> yang bekerja pada proyektil (mengabaikan hambatan udara). Oleh karena itu, kecepatannya selalu konstan. Ini disebut <b>Gerak Lurus Beraturan (GLB)</b>.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Sumbu Y (Vertikal)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Pada arah vertikal (Atas-Bawah), proyektil dipengaruhi oleh <b>Gravitasi Bumi (g)</b> yang menariknya ke bawah. Ini menyebabkan kecepatannya melambat saat naik, nol di titik puncak, dan makin cepat saat turun. Ini disebut <b>Gerak Lurus Berubah Beraturan (GLBB)</b>.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Sudut Optimal 45°</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Jika Anda menembak dari permukaan tanah (h₀ = 0), jarak terjauh (Xₘₐₓ) selalu dicapai pada <b>sudut elevasi tepat 45 derajat</b>. Sudut yang lebih besar atau lebih kecil dari 45° akan menghasilkan jarak tembak yang lebih pendek.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">PENGURAIAN KECEPATAN AWAL</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-xl md:text-2xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e]">
              <div>v₀ₓ = v₀ × cos(θ)</div>
              <div>v₀y = v₀ × sin(θ)</div>
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">POSISI SETIAP SAAT (t)</h4>
            <ul className="text-[11px] font-bold space-y-3 font-mono">
              <li className="bg-slate-700 p-2 border border-slate-500">
                Sumbu X (GLB):<br/>
                <span className="text-sky-300 text-sm">x(t) = v₀ₓ × t</span>
              </li>
              <li className="bg-slate-700 p-2 border border-slate-500">
                Sumbu Y (GLBB):<br/>
                <span className="text-rose-300 text-sm">y(t) = h₀ + (v₀y × t) - (½ × g × t²)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-7xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP [KUIS]
          </h3>
        </div>
        
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000] mb-4">
                <h4 className="font-bold mb-3 text-sm uppercase">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswer(qIdx, oIdx)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase transition-all text-left px-4 py-2 bg-white text-xs
                        ${quizSubmitted 
                          ? oIdx === q.answer 
                            ? 'bg-green-400 text-black' 
                            : userAnswers[qIdx] === oIdx 
                              ? 'bg-rose-400 text-black' 
                              : ''
                          : userAnswers[qIdx] === oIdx 
                            ? 'bg-black text-white translate-x-[4px] translate-y-[4px] shadow-none' 
                            : 'hover:bg-slate-100'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {!quizSubmitted && userAnswers.every(a => a !== null) && (
              <button
                onClick={handleSubmit}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-3 px-10 text-xl w-full mt-4 bg-slate-900 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
              >
                SERAHKAN JAWABAN!
              </button>
            )}
            
            {quizSubmitted && (
              <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                <h4 className="text-3xl font-black text-black mb-2 uppercase">NILAI AKHIR: {score}/5</h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {score === 5 ? "Luar biasa! Pemahaman mekanika Anda sangat baik." : "Bagus! Coba perhatikan lagi vektor kecepatan saat peluru melayang."}
                </p>
                <br />
                <button
                  onClick={handleRetry}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-3 px-8 text-lg bg-black text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
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