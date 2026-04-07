import type { ReactNode } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

const P1_KPA = 150.0;
const RHO = 1000;
const G = 10;
const BASE_Y = 250;
const X_TRANS_START = 300;
const X_TRANS_END = 500;
const X_END = 800;
const NUM_PARTICLES = 60;

interface Particle {
  x: number;
  relY: number;
}

interface PipeGeom {
  centerY: number;
  thickness: number;
  velocity: number;
}

function getPipeGeom(x: number, a1: number, a2: number, v1: number, h2Val: number, v2: number): PipeGeom {
  const h2_px = h2Val * 10;
  const R1_px = a1 * 1.5;
  const R2_px = a2 * 1.5;

  if (x <= X_TRANS_START) {
    return { centerY: BASE_Y, thickness: R1_px, velocity: v1 };
  } else if (x >= X_TRANS_END) {
    return { centerY: BASE_Y - h2_px, thickness: R2_px, velocity: v2 };
  } else {
    const t = (x - X_TRANS_START) / (X_TRANS_END - X_TRANS_START);
    const ease = (1 - Math.cos(t * Math.PI)) / 2;
    const centerY = BASE_Y - (h2_px * ease);
    const thickness = R1_px + (R2_px - R1_px) * ease;
    const velocity = v1 * (R1_px / thickness);
    return { centerY, thickness, velocity };
  }
}

const quizData = [
  {
    question: "1. Berdasarkan Asas Kontinuitas, apa yang terjadi pada kecepatan fluida ketika melewati pipa yang menyempit (A₂ < A₁)?",
    options: ["Kecepatan berkurang", "Kecepatan bertambah (mengalir lebih cepat)", "Kecepatan tetap sama", "Fluida berbalik arah"],
    answer: 1
  },
  {
    question: "2. Hukum Bernoulli menyatakan bahwa pada fluida yang mengalir secara horizontal, daerah dengan kecepatan aliran tinggi akan memiliki...",
    options: ["Tekanan yang lebih tinggi", "Tekanan yang lebih rendah", "Massa jenis yang lebih besar", "Suhu yang meningkat"],
    answer: 1
  },
  {
    question: "3. Perhatikan tabung Piezometer di simulasi. Ketinggian air di dalam tabung P₂ merepresentasikan besarnya...",
    options: ["Kecepatan aliran", "Ketinggian pipa (h₂)", "Tekanan statis di titik tersebut (P₂)", "Debit fluida"],
    answer: 2
  },
  {
    question: "4. Apa yang terjadi pada Tekanan (P₂) jika Anda menaikkan posisi pipa kanan (h₂) menjadi sangat tinggi?",
    options: ["Tekanan P₂ akan bertambah besar", "Tekanan P₂ akan menurun (bisa sampai vakum)", "Tekanan P₂ tidak terpengaruh oleh ketinggian", "Pipa akan meledak"],
    answer: 1
  },
  {
    question: "5. Fenomena Hukum Bernoulli ini dapat diaplikasikan pada teknologi apa di kehidupan nyata?",
    options: ["Gaya angkat sayap pesawat terbang", "Sistem pengereman hidrolik mobil (Hukum Pascal)", "Baterai listrik", "Lensa kacamata"],
    answer: 0
  }
];

export default function HukumBernoulli(): ReactNode {
  const [a1, setA1] = useState(50);
  const [a2, setA2] = useState(20);
  const [v1, setV1] = useState(2);
  const [h2, setH2] = useState(0);
  
  const v2 = (a1 / a2) * v1;
  const P1_Pa = P1_KPA * 1000;
  const P2_Pa = P1_Pa + 0.5 * RHO * (v1 * v1 - v2 * v2) - RHO * G * h2;
  const P2_KPA = P2_Pa / 1000;
  const deltaP_KPA = P1_KPA - P2_KPA;
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(null);
  const lastTimeRef = useRef(0);
  
  const initParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      newParticles.push({
        x: Math.random() * 800,
        relY: (Math.random() - 0.5) * 0.8
      });
    }
    setParticles(newParticles);
  }, []);
  
  useEffect(() => {
    initParticles();
  }, [initParticles]);
  
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;
      
      setParticles(prev => prev.map(p => {
        const geom = getPipeGeom(p.x, a1, a2, v1, h2, v2);
        const vx = geom.velocity * 40 * dt;
        let newX = p.x + vx;
        let newRelY = p.relY;
        
        if (newX > X_END) {
          newX = 0;
          newRelY = (Math.random() - 0.5) * 0.8;
        }
        
        return { x: newX, relY: newRelY };
      }));
      
      animRef.current = requestAnimationFrame(animate);
    };
    
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [a1, a2, v1, h2, v2]);
  
  const h2_px = h2 * 10;
  const R1 = a1 * 1.5;
  const R2 = a2 * 1.5;
  
  const topD = `M 0 ${BASE_Y - R1/2} L ${X_TRANS_START} ${BASE_Y - R1/2} L ${X_TRANS_END} ${BASE_Y - h2_px - R2/2} L ${X_END} ${BASE_Y - h2_px - R2/2}`;
  const botD = `M 0 ${BASE_Y + R1/2} L ${X_TRANS_START} ${BASE_Y + R1/2} L ${X_TRANS_END} ${BASE_Y - h2_px + R2/2} L ${X_END} ${BASE_Y - h2_px + R2/2}`;
  const waterD = `${topD} L ${X_END} ${BASE_Y - h2_px + R2/2} L ${X_TRANS_END} ${BASE_Y - h2_px + R2/2} L ${X_TRANS_START} ${BASE_Y + R1/2} L 0 ${BASE_Y + R1/2} Z`;
  
  const P_TO_PX = 100 / 150;
  const h1Water = Math.max(0, P1_KPA * P_TO_PX);
  const base1Y = BASE_Y - R1/2;
  
  const h2Water = Math.max(0, P2_KPA * P_TO_PX);
  
  const rightY = BASE_Y - h2_px;
  
  const velScale = 15;
  const arrow1Len = Math.min(100, v1 * velScale) - 30;
  const arrow2Len = Math.min(100, v2 * velScale) - 30;
  
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
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
  
  const particlePositions = particles.map(p => {
    const geom = getPipeGeom(p.x, a1, a2, v1, h2, v2);
    const y = geom.centerY + (p.relY * geom.thickness);
    return { x: p.x, y };
  });
  
  const isNegativePressure = P2_KPA < 0;
  
  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-7xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">FISIKA FLUIDA DINAMIS</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: HUKUM BERNOULLI
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menganalisis Hubungan Kecepatan Aliran dan Tekanan Fluida
        </p>
      </header>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Parameter Pipa
          </span>

          <div className="flex flex-col gap-4 mt-4 overflow-y-auto">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-800 uppercase text-[10px]">Luas Penampang Kiri (A₁)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{a1.toFixed(1)} cm²</span>
              </div>
              <input type="range" min="10" max="80" step="1" value={a1} onChange={(e) => setA1(Number(e.target.value))} className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
            </div>

            <div className="bg-cyan-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-cyan-800 uppercase text-[10px]">Luas Penampang Kanan (A₂)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{a2.toFixed(1)} cm²</span>
              </div>
              <input type="range" min="10" max="80" step="1" value={a2} onChange={(e) => setA2(Number(e.target.value))} className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
            </div>

            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-800 uppercase text-[10px]">Kecepatan Masuk (v₁)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{v1.toFixed(1)} m/s</span>
              </div>
              <input type="range" min="0.5" max="8" step="0.5" value={v1} onChange={(e) => setV1(Number(e.target.value))} className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Ketinggian Pipa Kanan (h₂)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{h2.toFixed(1)} m</span>
              </div>
              <input type="range" min="-5" max="5" step="0.5" value={h2} onChange={(e) => setH2(Number(e.target.value))} className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
              <span className="text-[8px] font-bold text-slate-500 uppercase mt-1">h₁ konstan = 0 m</span>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-2">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">DATA PENGUKURAN SENSOR</h4>
            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                <span className="text-slate-400">Kecepatan Keluar (v₂):</span>
                <span className="text-emerald-400 font-bold text-base">{v2.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                <span className="text-slate-400">Tekanan Kiri (P₁):</span>
                <span className="text-sky-400 font-bold">150.0 kPa</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                <span className="text-slate-400">Tekanan Kanan (P₂):</span>
                <span className={`${isNegativePressure ? 'text-red-500' : 'text-rose-400'} font-bold text-base`}>
                  {isNegativePressure ? 'VAKUM (<0)' : `${P2_KPA.toFixed(1)} kPa`}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white font-bold">Selisih Tekunan (ΔP):</span>
                <span className="text-yellow-400 font-black text-lg">{deltaP_KPA.toFixed(1)} kPa</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden border-8 border-black">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Visualisasi Aliran Fluida (Air)
          </span>

          <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible" style={{ filter: isNegativePressure ? 'sepia(0.5)' : 'none' }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              </pattern>
              <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#1e3a8a" />
              </marker>
            </defs>

            <rect width="800" height="500" fill="url(#grid)" />

            <line x1="0" y1="420" x2="800" y2="420" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="10 5" />
            <text x="10" y="440" fontSize="12" fontWeight="900" fill="#94a3b8">REFERENSI (h = 0)</text>

            {Math.abs(h2) > 0.1 && (
              <>
                <line x1="650" y1="420" x2="650" y2={rightY} stroke="#f43f5e" strokeWidth="3" strokeDasharray="6 4" />
                <text x="660" y={(420 + rightY) / 2} fontSize="14" fontWeight="900" fill="#f43f5e">h₂</text>
              </>
            )}

            <path d="M 135 50 L 135 250 M 165 50 L 165 250" stroke="#334155" strokeWidth="4" fill="none" />
            <text x="150" y="40" fontSize="14" fontWeight="900" fill="#0369a1" textAnchor="middle">P₁</text>
            <rect x="137" y={base1Y - h1Water} width="26" height={h1Water + 20} fill="#38bdf8" opacity="0.8" />
            <line x1="120" y1={base1Y - h1Water} x2="135" y2={base1Y - h1Water} stroke="#000" strokeWidth="2" />

            <g transform={`translate(0, ${-h2_px})`}>
              <path d="M 635 50 L 635 250 M 665 50 L 665 250" stroke="#334155" strokeWidth="4" fill="none" />
              <text x="650" y="40" fontSize="14" fontWeight="900" fill="#be123c" textAnchor="middle">P₂</text>
              <rect x="637" y={250 - R2/2 - h2Water} width="26" height={h2Water + 20} fill="#38bdf8" opacity="0.8" />
              <line x1="620" y1={250 - R2/2 - h2Water} x2="635" y2={250 - R2/2 - h2Water} stroke="#000" strokeWidth="2" />
            </g>

            <path d={waterD} fill="#bae6fd" opacity="0.8" stroke="none" />
            <path d={topD} fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d={botD} fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

            <line x1="150" y1={BASE_Y - R1/2} x2="150" y2={BASE_Y - R1/2 - 20} stroke="#1e3a8a" strokeWidth="2" strokeDasharray="4 2"/>
            <line x1="150" y1={BASE_Y + R1/2} x2="150" y2={BASE_Y + R1/2 + 20} stroke="#1e3a8a" strokeWidth="2" strokeDasharray="4 2"/>
            <text x="150" y="280" fontSize="16" fontWeight="900" fill="#1e3a8a" textAnchor="middle">A₁ , v₁</text>

            <g transform={`translate(0, ${-h2_px})`}>
              <line x1="650" y1={BASE_Y - R2/2} x2="650" y2={BASE_Y - R2/2 - 20} stroke="#be123c" strokeWidth="2" strokeDasharray="4 2"/>
              <line x1="650" y1={BASE_Y + R2/2} x2="650" y2={BASE_Y + R2/2 + 20} stroke="#be123c" strokeWidth="2" strokeDasharray="4 2"/>
              <text x="650" y="280" fontSize="16" fontWeight="900" fill="#be123c" textAnchor="middle">A₂ , v₂</text>
            </g>

            {particlePositions.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0284c7" stroke="#fff" strokeWidth="1" />
            ))}

            <g transform={`translate(150, ${BASE_Y})`}>
              <line x1="-30" y1="0" x2={arrow1Len} y2="0" stroke="#1e3a8a" strokeWidth="6" markerEnd="url(#arrowBlue)" />
            </g>
            <g transform={`translate(650, ${rightY})`}>
              <line x1="-30" y1="0" x2={arrow2Len} y2="0" stroke="#1e3a8a" strokeWidth="6" markerEnd="url(#arrowBlue)" />
            </g>
          </svg>

          <div className="absolute bottom-6 bg-white px-4 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000] z-20">
            Bintik Biru = Partikel Fluida. Amati Kecepatannya!
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-7xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          MEMAHAMI DINAMIKA FLUIDA
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Asas Kontinuitas (Kekekalan Massa)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Debit fluida yang masuk ke dalam pipa selalu sama dengan debit yang keluar (Q₁ = Q₂). Karena Debit (Q) adalah Luas (A) dikali Kecepatan (v), maka jika luas penampang pipa <b>menyempit</b>, fluida <b>harus mengalir lebih cepat</b> agar volume air yang lewat tetap sama.
            </p>
            <div className="bg-sky-100 px-2 py-1 border-2 border-black font-mono font-black block text-center">
              A₁ × v₁ = A₂ × v₂
            </div>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Prinsip Bernoulli (Kekekalan Energi)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Daniel Bernoulli menemukan hukum yang unik: Di dalam fluida yang mengalir, daerah dengan <b>kecepatan tinggi</b> justru memiliki <b>tekanan yang lebih rendah</b>.
            </p>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Perhatikan tinggi air pada tabung Piezometer (P₁ dan P₂). Jika air mengalir sangat cepat di pipa yang sempit (Kanan), tekanan di dinding pipa akan turun, sehingga kolom air di tabung P₂ akan lebih pendek!
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">PERSAMAAN BERNOULLI</h3>
            <div className="bg-white text-black p-4 border-4 border-yellow-400 text-xl md:text-2xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e]">
              P₁ + ½ρv₁² + ρgh₁ = P₂ + ½ρv₂² + ρgh₂
            </div>
            <p className="text-center mt-4 text-xs font-bold text-slate-300 leading-relaxed">
              Jumlah Tekanan Statis (P), Tekanan Dinamis (½ρv²), dan Tekanan Hidrostatis (ρgh) di setiap titik sepanjang pipa adalah konstan.
            </p>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">KETERANGAN BESARAN</h4>
            <ul className="text-[11px] font-bold space-y-2 uppercase">
              <li><span className="text-sky-400">P₁, P₂</span> = Tekanan Fluida (Pascal / Pa)</li>
              <li><span className="text-rose-400">v₁, v₂</span> = Kecepatan Aliran Fluida (m/s)</li>
              <li><span className="text-emerald-400">h₁, h₂</span> = Ketinggian Titik (m)</li>
              <li><span className="text-yellow-400">ρ (Rho)</span> = Massa Jenis Fluida (~1000 kg/m³ untuk air)</li>
              <li><span className="text-slate-300">g</span> = Percepatan Gravitasi (9.8 m/s²)</li>
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
                KIRIM JAWABAN!
              </button>
            )}
            
            {quizSubmitted && (
              <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                <h4 className="text-3xl font-black text-black mb-2 uppercase">NILAI AKHIR: {score}/5</h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {score === 5 ? 'SEMPURNA! Kamu menguasai Hukum Bernoulli!' : score >= 3 ? 'BAGUS! Terus belajar untuk hasil lebih baik!' : 'Perlu belajar lagi. Coba ulangi simulasi!'}
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