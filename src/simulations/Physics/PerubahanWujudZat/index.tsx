import { useState, useEffect, useRef, useCallback } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_DATA: QuizQuestion[] = [
  {
    question: "1. Apa yang terjadi pada gerak partikel air saat dipanaskan (suhu naik)?",
    options: ["Partikel berhenti bergerak", "Partikel bergerak lebih lambat dan merapat", "Partikel bergerak semakin cepat dan saling menjauh (memuai)", "Partikel berubah bentuk menjadi kotak"],
    answer: 2,
  },
  {
    question: "2. Proses perubahan wujud dari Gas langsung menjadi Padat (seperti terbentuknya salju di awan) disebut...",
    options: ["Menyublim", "Mengkristal (Deposisi)", "Membeku", "Mengembun"],
    answer: 1,
  },
  {
    question: "3. Karbon Dioksida (Es Kering) pada tekanan atmosfer normal (1 atm) tidak memiliki fase cair. Ia akan langsung berubah dari Padat menjadi Gas. Proses ini disebut...",
    options: ["Mencair", "Menguap", "Menyublim", "Kondensasi"],
    answer: 2,
  },
  {
    question: "4. Fase wujud manakah yang molekul/partikelnya tersusun rapi dalam struktur kaku dan hanya bergetar di tempat?",
    options: ["Gas", "Cair", "Plasma", "Padat"],
    answer: 3,
  },
  {
    question: "5. Proses apa saja yang MEMERLUKAN KALOR (menyerap panas) untuk dapat terjadi?",
    options: ["Membeku, Mengembun, Mengkristal", "Mencair, Menguap, Menyublim", "Hanya Menguap", "Mencair dan Membeku"],
    answer: 1,
  },
];

interface Substance {
  name: string;
  meltPoint: number | null;
  boilPoint: number | null;
  sublimePoint: number | null;
  colorSolid: string;
  colorLiquid: string | null;
  colorGas: string;
}

const SUBSTANCES: Record<string, Substance> = {
  water: {
    name: "Air (H2O)",
    meltPoint: 0,
    boilPoint: 100,
    sublimePoint: null,
    colorSolid: "#bfdbfe",
    colorLiquid: "#3b82f6",
    colorGas: "#94a3b8",
  },
  co2: {
    name: "Karbon Dioksida (CO2)",
    meltPoint: null,
    boilPoint: null,
    sublimePoint: -78.5,
    colorSolid: "#e2e8f0",
    colorLiquid: null,
    colorGas: "#cbd5e1",
  },
};

interface Particle {
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function PerubahanWujudZat() {
  const [substance, setSubstance] = useState<'water' | 'co2'>('water');
  const [temperature, setTemperature] = useState(-20);
  const [phase, setPhase] = useState<'SOLID' | 'LIQUID' | 'GAS'>('SOLID');
  const [processName, setProcessName] = useState<string | null>(null);
  const [showProcess, setShowProcess] = useState(false);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const prevPhaseRef = useRef<'SOLID' | 'LIQUID' | 'GAS'>('SOLID');
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    const cols = 10;
    const rows = 10;
    const cw = 300;
    const ch = 350;
    const startX = (cw - cols * 20) / 2;
    const startY = ch - rows * 20 - 10;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        particles.push({
          gridX: startX + c * 20 + 10,
          gridY: startY + r * 20 + 10,
          x: startX + c * 20 + 10,
          y: startY + r * 20 + 10,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
        });
      }
    }
    particlesRef.current = particles;
  }, []);

  const determinePhase = useCallback((temp: number, sub: string): 'SOLID' | 'LIQUID' | 'GAS' => {
    const data = SUBSTANCES[sub];
    if (sub === 'water') {
      if (temp < (data.meltPoint ?? 0)) return 'SOLID';
      if (temp >= (data.meltPoint ?? 0) && temp < (data.boilPoint ?? 100)) return 'LIQUID';
      return 'GAS';
    } else {
      if (temp < (data.sublimePoint ?? -78.5)) return 'SOLID';
      return 'GAS';
    }
  }, []);

  const showProcessAlert = useCallback((from: 'SOLID' | 'LIQUID' | 'GAS', to: 'SOLID' | 'LIQUID' | 'GAS') => {
    let name = "";
    if (from === 'SOLID' && to === 'LIQUID') name = "MENCAIR";
    else if (from === 'LIQUID' && to === 'SOLID') name = "MEMBEKU";
    else if (from === 'LIQUID' && to === 'GAS') name = "MENGUAP";
    else if (from === 'GAS' && to === 'LIQUID') name = "MENGEMBUN";
    else if (from === 'SOLID' && to === 'GAS') name = "MENYUBLIM";
    else if (from === 'GAS' && to === 'SOLID') name = "MENGKRISTAL";

    if (name) {
      setProcessName(name);
      setShowProcess(true);
      setTimeout(() => setShowProcess(false), 2500);
    }
  }, []);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

  useEffect(() => {
    const newPhase = determinePhase(temperature, substance);
    if (newPhase !== phase) {
      prevPhaseRef.current = phase;
      showProcessAlert(phase, newPhase);
      setPhase(newPhase);
    }
  }, [temperature, substance, phase, determinePhase, showProcessAlert]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    const physicsLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, cw, ch);

      const speedScale = Math.max(0.1, (temperature + 100) / 50);
      const data = SUBSTANCES[substance];
      let pColor = data.colorSolid;
      if (phase === 'LIQUID') pColor = data.colorLiquid ?? data.colorSolid;
      if (phase === 'GAS') pColor = data.colorGas;

      ctx.fillStyle = pColor;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;

      particlesRef.current.forEach((p) => {
        if (phase === 'SOLID') {
          const k = 15;
          const damp = 0.8;
          const fx = (p.gridX - p.x) * k;
          const fy = (p.gridY - p.y) * k;
          p.vx = (p.vx + fx * dt) * damp + (Math.random() - 0.5) * speedScale * 0.5;
          p.vy = (p.vy + fy * dt) * damp + (Math.random() - 0.5) * speedScale * 0.5;
        } else if (phase === 'LIQUID') {
          const gravity = 500;
          p.vy += gravity * dt;
          p.vx += (Math.random() - 0.5) * speedScale * 20;
          p.vy += (Math.random() - 0.5) * speedScale * 20;
          p.vx *= 0.95;
          p.vy *= 0.95;
          const poolHeight = ch - 150;
          if (p.y < poolHeight) {
            p.vy += 50;
          }
        } else if (phase === 'GAS') {
          p.vx += (Math.random() - 0.5) * speedScale * 30;
          p.vy += (Math.random() - 0.5) * speedScale * 30;
          if (Math.abs(p.vx) < speedScale) p.vx *= 1.1;
          if (Math.abs(p.vy) < speedScale) p.vy *= 1.1;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const r = 8;
        if (p.x < r) { p.x = r; p.vx *= -0.8; }
        if (p.x > cw - r) { p.x = cw - r; p.vx *= -0.8; }
        if (p.y < r) { p.y = r; p.vy *= -0.8; }
        if (p.y > ch - r) { p.y = ch - r; p.vy *= -0.8; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(physicsLoop);
    };

    animationRef.current = requestAnimationFrame(physicsLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, temperature, substance]);

  const handleAnswerClick = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    if (userAnswers.every((a) => a !== null)) {
      setQuizSubmitted(true);
    }
  };

  const handleRetryQuiz = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const score = userAnswers.reduce<number>((acc, a, i) => {
    if (a === QUIZ_DATA[i].answer) return acc + 1;
    return acc;
  }, 0);

  const allAnswered = userAnswers.every((a) => a !== null);

  const data = SUBSTANCES[substance];
  const minT = -100;
  const maxT = 150;
  const pct = ((temperature - minT) / (maxT - minT)) * 100;
  let tColor = "#3b82f6";
  if (temperature > 80) tColor = "#ef4444";
  else if (temperature > 20) tColor = "#22c55e";

  let glowClass = "bg-white";
  if (temperature > 60) glowClass = "bg-rose-100";
  else if (temperature < 0) glowClass = "bg-blue-100";

  let burnerActive = false;
  let coolerActive = false;
  if (temperature > 30) burnerActive = true;
  else if (temperature < 0) coolerActive = true;

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform -rotate-3 text-black">
          FISIKA TERMODINAMIKA
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: PERUBAHAN WUJUD ZAT
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Pengaruh Kalor terhadap Gerak Partikel dan Fase Benda
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Panel Pemanas & Pendingin
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-slate-500">1. Pilih Zat Uji</label>
              <select
                value={substance}
                onChange={(e) => setSubstance(e.target.value as 'water' | 'co2')}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-white text-black py-3 px-4 text-sm w-full outline-none font-bold uppercase"
              >
                <option value="water">Air (H2O) - Padat, Cair, Gas</option>
                <option value="co2">Karbon Dioksida (CO2) - Menyublim</option>
              </select>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 mt-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Atur Suhu (T)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{temperature} C</span>
              </div>
              <input
                type="range"
                min="-100"
                max="150"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Sangat Dingin</span>
                <span>Sangat Panas</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => setTemperature(-20)}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-blue-300 hover:bg-blue-200 py-2 text-xs font-bold uppercase active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                Bekukan
              </button>
              <button
                onClick={() => setTemperature(25)}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-emerald-300 hover:bg-emerald-200 py-2 text-xs font-bold uppercase active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                Cairkan
              </button>
              <button
                onClick={() => setTemperature(120)}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-orange-400 hover:bg-orange-300 py-2 text-xs font-bold uppercase col-span-2 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                Panaskan (Uap)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-xl">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">STATUS SISTEM</h4>
            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span className="text-slate-400">Titik Leleh (Mencair):</span>
                <span className="text-sky-400 font-bold">
                  {substance === 'water' ? '0 C' : `${data.sublimePoint} C (Menyublim)`}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span className="text-slate-400">Titik Didih (Menguap):</span>
                <span className="text-rose-400 font-bold">
                  {substance === 'water' ? '100 C' : '- (Langsung Gas)'}
                </span>
              </div>
              <div className="flex justify-between mt-2 items-center">
                <span className="text-white font-bold">Wujud Saat Ini:</span>
                <span className="text-black font-black text-lg bg-yellow-400 px-2 py-1 border-2 border-white">
                  {phase === 'SOLID' ? 'PADAT' : phase === 'LIQUID' ? 'CAIR' : 'GAS'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden border-8 border-black rounded-xl">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Visualisasi Partikel
          </span>

          {showProcess && processName && (
            <div className={`absolute top-6 right-6 z-30 ${
              processName === 'MENCAIR' ? 'bg-sky-500' :
              processName === 'MEMBEKU' ? 'bg-blue-600' :
              processName === 'MENGUAP' ? 'bg-rose-500' :
              processName === 'MENGEMBUN' ? 'bg-indigo-400' :
              processName === 'MENYUBLIM' ? 'bg-orange-500' :
              'bg-emerald-500'
            } text-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform rotate-2 transition-all duration-300`}>
              <span className="font-black text-lg uppercase tracking-widest">{processName}</span>
            </div>
          )}

          <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 flex flex-col items-center gap-2">
            <div className="w-6 h-48 bg-white border-4 border-black rounded-t-full relative overflow-hidden flex items-end p-0.5">
              <div
                className="w-full rounded-b-sm transition-all duration-300"
                style={{ height: `${pct}%`, backgroundColor: tColor }}
              />
            </div>
            <div
              className="w-10 h-10 border-4 border-black rounded-full -mt-4 z-10"
              style={{ backgroundColor: tColor }}
            />
          </div>

          <div className="w-full h-full relative z-10 flex items-center justify-center p-8 ml-10">
            <div className="relative w-[300px] h-[350px] border-x-8 border-b-8 border-black bg-white rounded-b-3xl overflow-hidden shadow-[8px_8px_0px_0px_#000]">
              <div className={`absolute inset-0 opacity-50 transition-colors duration-500 ${glowClass}`} />
              <canvas ref={canvasRef} width={300} height={350} className="absolute inset-0 z-10" />
            </div>
          </div>

          <div className="absolute bottom-4 z-20 flex flex-col items-center">
            <div className="w-32 h-8 bg-slate-800 border-4 border-black rounded-t-lg relative">
              {burnerActive && (
                <>
                  <div className="absolute bottom-full left-4 w-6 h-8 bg-rose-500 border-2 border-black rounded-full" />
                  <div className="absolute bottom-full left-12 w-8 h-10 bg-orange-400 border-2 border-black rounded-full" />
                  <div className="absolute bottom-full right-4 w-6 h-8 bg-rose-500 border-2 border-black rounded-full" />
                </>
              )}
              {coolerActive && (
                <>
                  <div className="absolute bottom-full left-6 text-xl">❄️</div>
                  <div className="absolute bottom-full right-6 text-xl">❄️</div>
                </>
              )}
            </div>
            <span className="bg-white px-2 border-2 border-black text-[10px] font-bold mt-1 uppercase">
              {burnerActive ? 'PEMANAS AKTIF 🔥' : coolerActive ? 'PENDINGIN AKTIF ❄️' : 'ALAT MATI'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          6 PROSES PERUBAHAN WUJUD BENDA
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-rose-50 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-4 border-black pb-1 mb-3">Memerlukan Kalor (Menyerap Panas)</h4>
            <ul className="text-sm font-semibold text-slate-800 leading-relaxed space-y-3">
              <li><span className="bg-rose-200 px-2 border border-black font-black">1. MENCAIR (Melebur):</span> Padat ke Cair. Panas merusak ikatan kaku antar partikel es sehingga bisa mengalir.</li>
              <li><span className="bg-orange-200 px-2 border border-black font-black">2. MENGUAP:</span> Cair ke Gas. Partikel air mendapat energi sangat besar hingga lepas ke udara menjadi uap.</li>
              <li><span className="bg-rose-400 text-white px-2 border border-black font-black">3. MENYUBLIM:</span> Padat ke Gas. (Misal: Es Kering/Kapur Barus). Partikel langsung melompat dari padat ke gas tanpa mencair.</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-4 border-black pb-1 mb-3">Melepaskan Kalor (Didinginkan)</h4>
            <ul className="text-sm font-semibold text-slate-800 leading-relaxed space-y-3">
              <li><span className="bg-sky-200 px-2 border border-black font-black">4. MEMBEKU:</span> Cair ke Padat. Kehilangan energi membuat partikel air melambat dan merapat membentuk kristal es.</li>
              <li><span className="bg-indigo-200 px-2 border border-black font-black">5. MENGEMBUN:</span> Gas ke Cair. Uap air yang dingin melambat dan berkumpul menjadi embun (titik air).</li>
              <li><span className="bg-blue-400 text-white px-2 border border-black font-black">6. MENGKRISTAL (Deposisi):</span> Gas ke Padat. Uap langsung membeku menjadi padat (contoh: terbentuknya salju di awan).</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-emerald-400 mb-4 uppercase">TEORI KINETIK PARTIKEL</h3>
            <p className="text-sm font-bold text-slate-300 leading-relaxed mb-4">
              Suhu sebenarnya adalah ukuran dari <b>rata-rata energi kinetik (gerak)</b> partikel-partikel di dalam suatu benda.
            </p>
            <div className="bg-white text-black p-4 border-4 border-emerald-400 text-xl font-black text-center shadow-[4px_4px_0px_#10b981] rounded-xl">
              Suhu Panas = Gerak Partikel Cepat & Menjauh
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600 rounded-xl">
            <h4 className="font-black text-yellow-400 mb-3 uppercase">Karakteristik Wujud</h4>
            <ul className="text-[12px] font-bold space-y-3 font-mono">
              <li className="flex items-start gap-2"><span className="text-rose-400">PADAT:</span> Partikel tersusun rapat dalam pola grid/kristal kaku. Hanya bergetar di tempat. Volume dan bentuk tetap.</li>
              <li className="flex items-start gap-2"><span className="text-sky-400">CAIR:</span> Partikel berdekatan tapi bisa saling menggeser (mengalir). Bentuk mengikuti wadah, volume tetap.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400">GAS:</span> Partikel bergerak sangat cepat, acak, dan saling berjauhan. Bentuk dan volume memenuhi seluruh wadah.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6 rounded-lg">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] rounded-xl">
          <div className="space-y-6">
            {QUIZ_DATA.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl">
                <h4 className="font-bold text-black mb-4 text-sm uppercase">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswerClick(qIdx, oIdx)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg text-left px-4 py-2 bg-white text-xs font-bold uppercase transition-all ${
                        quizSubmitted
                          ? oIdx === q.answer
                            ? 'bg-green-400 text-black'
                            : userAnswers[qIdx] === oIdx
                            ? 'bg-rose-400 text-black line-through'
                            : 'bg-slate-200 opacity-50'
                          : userAnswers[qIdx] === oIdx
                            ? 'bg-black text-white'
                            : 'bg-white hover:bg-indigo-200'
                      } ${!quizSubmitted ? 'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted && allAnswered && (
            <button
              onClick={handleSubmitQuiz}
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-900 text-white font-black py-3 px-10 text-xl w-full mt-4 uppercase tracking-widest hover:bg-slate-800 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              KIRIM JAWABAN!
            </button>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-xl ${score === 5 ? 'bg-emerald-400' : 'bg-yellow-300'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black rounded-lg">
                {score === 5 ? 'Sempurna! Kamu master Termodinamika!' : 'Bagus! Coba bereksperimen lagi dengan suhu ekstrem.'}
              </p>
              <br />
              <button
                onClick={handleRetryQuiz}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-black text-white py-3 px-8 text-lg uppercase tracking-wider hover:bg-slate-800 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                ULANGI KUIS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}