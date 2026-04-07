import type { ReactNode } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  color: string;
}

const quizData = [
  {
    question: "1. Apa yang dimaksud dengan proses Difusi?",
    options: ["Perpindahan zat dari area bersuhu rendah ke suhu tinggi", "Pergerakan bersih partikel dari daerah konsentrasi tinggi ke konsentrasi rendah", "Pergerakan partikel yang membutuhkan energi listrik", "Perpindahan pelarut melalui membran semipermeabel"],
    answer: 1
  },
  {
    question: "2. Coba naikkan Suhu (T) pada simulasi. Apa dampaknya terhadap proses difusi?",
    options: ["Partikel bergerak lebih cepat sehingga difusi terjadi lebih cepat", "Partikel membeku dan difusi berhenti", "Partikel berubah warna", "Tidak ada pengaruhnya"],
    answer: 0
  },
  {
    question: "3. Jika Anda memiliki dua jenis gas: Gas A (massa ringan) dan Gas B (massa berat) pada suhu yang sama. Gas manakah yang akan berdifusi lebih cepat?",
    options: ["Keduanya sama cepat", "Gas B (Massa berat)", "Gas A (Massa ringan)", "Gas yang berwarna lebih gelap"],
    answer: 2
  },
  {
    question: "4. Apa yang terjadi pada 'Kesetimbangan Dinamis'?",
    options: ["Semua partikel berhenti bergerak total", "Konsentrasi partikel berkumpul semua di sebelah kanan", "Partikel tetap bergerak, tetapi jumlah partikel yang pindah ke kiri dan ke kanan seimbang", "Sekat pembatas tertutup otomatis"],
    answer: 2
  },
  {
    question: "5. Fenomena sehari-hari manakah yang merupakan contoh peristiwa difusi?",
    options: ["Air mendidih menjadi uap", "Aroma parfum yang menyebar ke seluruh penjuru ruangan", "Es batu yang mencair di dalam gelas", "Besi yang ditarik oleh magnet"],
    answer: 1
  }
];

export default function Difusi(): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(null);
  
  const [particleCount, setParticleCount] = useState(100);
  const [temperature, setTemperature] = useState(300);
  const [mass, setMass] = useState(4);
  const [barrierOpen, setBarrierOpen] = useState(false);
  const [leftCount, setLeftCount] = useState(100);
  const [rightCount, setRightCount] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [status, setStatus] = useState<'isolated' | 'diffusing' | 'equilibrium'>('isolated');
  
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const baseSpeed = Math.sqrt(temperature / mass) * 0.35;

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const CW = canvas.width;
    const CH = canvas.height;
    const BARRIER_X = CW / 2;
    const r = 4 + (mass * 0.5);
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const x = r + Math.random() * (BARRIER_X - 20 - r);
      const y = r + Math.random() * (CH - 2 * r);
      const angle = Math.random() * Math.PI * 2;
      const speed = baseSpeed * (0.5 + Math.random());
      const hues = [38, 45, 190, 200];
      newParticles.push({
        x,
        y,
        r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: `hsl(${hues[Math.floor(Math.random() * hues.length)]}, 80%, 60%)`
      });
    }
    particlesRef.current = newParticles;
  }, [particleCount, mass, baseSpeed]);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const CW = canvas.width;
    const CH = canvas.height;
    const BARRIER_X = CW / 2;
    const currentBaseSpeed = Math.sqrt(temperature / mass) * 0.35;
    
    const animate = () => {
      ctx.clearRect(0, 0, CW, CH);
      
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CW, CH);
      
      if (!barrierOpen) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(BARRIER_X - 5, 0, 10, CH);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let y = 0; y < CH; y += 15) {
          ctx.moveTo(BARRIER_X - 5, y);
          ctx.lineTo(BARRIER_X + 5, y + 10);
        }
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(BARRIER_X, 0);
        ctx.lineTo(BARRIER_X, CH);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      let left = 0;
      let right = 0;
      let totalSpeed = 0;
      const currentR = 4 + (mass * 0.5);
      
      particlesRef.current.forEach(p => {
        p.r = currentR;
        
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const desiredSpeed = currentBaseSpeed * (0.5 + Math.random() * 0.5);
        if (currentSpeed > 0) {
          p.vx = (p.vx / currentSpeed) * (currentSpeed * 0.95 + desiredSpeed * 0.05);
          p.vy = (p.vy / currentSpeed) * (currentSpeed * 0.95 + desiredSpeed * 0.05);
        }
        
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x - p.r < 0) {
          p.x = p.r;
          p.vx *= -1;
        }
        if (p.x + p.r > CW) {
          p.x = CW - p.r;
          p.vx *= -1;
        }
        if (p.y - p.r < 0) {
          p.y = p.r;
          p.vy *= -1;
        }
        if (p.y + p.r > CH) {
          p.y = CH - p.r;
          p.vy *= -1;
        }
        
        if (!barrierOpen) {
          if (p.x + p.r > BARRIER_X - 5 && p.x < BARRIER_X) {
            p.x = BARRIER_X - 5 - p.r;
            p.vx *= -1;
          } else if (p.x - p.r < BARRIER_X + 5 && p.x > BARRIER_X) {
            p.x = BARRIER_X + 5 + p.r;
            p.vx *= -1;
          }
        }
        
        if (p.x < BARRIER_X) left++;
        else right++;
        totalSpeed += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      
      setLeftCount(left);
      setRightCount(right);
      setAvgSpeed(totalSpeed / particlesRef.current.length);
      
      const total = particlesRef.current.length;
      const ratio = Math.abs(left - right) / total;
      if (!barrierOpen) {
        setStatus('isolated');
      } else if (ratio < 0.1) {
        setStatus('equilibrium');
      } else {
        setStatus('diffusing');
      }
      
      animRef.current = requestAnimationFrame(animate);
    };
    
    animRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [barrierOpen, temperature, mass]);

  const handleReset = () => {
    setBarrierOpen(false);
    initParticles();
  };

  const handleBarrier = () => {
    if (!barrierOpen) {
      setBarrierOpen(true);
    } else {
      particlesRef.current.forEach(p => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const BARRIER_X = canvas.width / 2;
        if (p.x > BARRIER_X) {
          p.x = BARRIER_X - p.r - 5;
          p.vx = -Math.abs(p.vx);
        }
      });
      setBarrierOpen(false);
    }
  };

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

  const getMassLabel = (m: number) => m < 4 ? 'Ringan' : m > 7 ? 'Berat' : 'Sedang';

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">FISIKA & KIMIA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: DIFUSI PARTIKEL
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Mengamati Perpindahan Zat dari Konsentrasi Tinggi ke Rendah
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Parameter Lingkungan
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-800 uppercase text-[10px]">Jumlah Partikel</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{particleCount}</span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={particleCount}
                onChange={(e) => setParticleCount(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Suhu Sistem (T)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{temperature} K</span>
              </div>
              <input
                type="range"
                min="50"
                max="600"
                step="10"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                <span>Dingin</span>
                <span>Panas</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-800 uppercase text-[10px]">Massa Partikel (m)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{getMassLabel(mass)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                <span>Ringan</span>
                <span>Berat</span>
              </div>
            </div>

            <div className="mt-2 border-t-4 border-black pt-4 flex flex-col gap-3">
              <button
                onClick={handleBarrier}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-4 text-lg flex items-center justify-center gap-2 transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none ${barrierOpen ? 'bg-rose-400' : 'bg-yellow-400 hover:bg-yellow-300'}`}
              >
                {barrierOpen ? '🔒 TUTUP SEKAT' : '🔓 BUKA SEKAT PEMBATAS'}
              </button>
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 hover:bg-slate-300 font-bold uppercase py-2 text-xs flex items-center justify-center gap-2 transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none"
              >
                🔄 RESET POSISI PARTIKEL
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[450px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Wadah Pengamatan
          </span>

          <canvas
            ref={canvasRef}
            width={500}
            height={400}
            className="w-full max-w-[500px] aspect-[5/4] border-8 border-black rounded-xl shadow-[8px_8px_0px_0px_#000]"
            style={{ backgroundColor: '#0f172a' }}
          />

          <div className="absolute bottom-6 bg-white px-4 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000] text-center">
            Partikel bergerak acak akibat energi kinetik termal
          </div>
        </div>

        <div className="bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 left-6 bg-rose-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Data Telemetri
          </span>

          <div className="grid grid-cols-2 gap-4 mt-4 text-center">
            <div className="bg-slate-800 p-4 border-4 border-emerald-400 shadow-[4px_4px_0px_0px_#34d399]">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Ruang Kiri</span>
              <span className="font-mono font-black text-4xl text-white">{leftCount}</span>
            </div>
            <div className="bg-slate-800 p-4 border-4 border-sky-400 shadow-[4px_4px_0px_0px_#38bdf8]">
              <span className="text-[10px] font-bold text-sky-400 uppercase block mb-1">Ruang Kanan</span>
              <span className="font-mono font-black text-4xl text-white">{rightCount}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 flex-1 font-mono">
            <div className="bg-black p-3 border-2 border-slate-700 flex justify-between items-center">
              <span className="text-slate-400 text-xs font-bold uppercase">Kecepatan Rata-rata (v):</span>
              <span className="text-yellow-400 font-black text-lg">{avgSpeed.toFixed(1)} unit/s</span>
            </div>
            
            <div className="bg-black p-3 border-2 border-slate-700 mt-2 flex flex-col items-center justify-center min-h-[80px]">
              <span className="text-slate-400 text-xs font-bold uppercase mb-2">STATUS SISTEM:</span>
              <span className={`font-black text-xl uppercase px-3 py-1 border-2 ${
                status === 'isolated' 
                  ? 'text-rose-500 bg-rose-100 border-rose-500' 
                  : status === 'equilibrium' 
                    ? 'text-emerald-500 bg-emerald-100 border-emerald-500' 
                    : 'text-sky-500 bg-sky-100 border-sky-500'
              }`}>
                {status === 'isolated' ? 'TERISOLASI' : status === 'equilibrium' ? 'KESETIMBANGAN DINAMIS' : 'BERDIFUSI...'}
              </span>
            </div>
            
            <div className="mt-auto bg-slate-800 border-2 border-dashed border-slate-500 p-3 text-center">
              <p className="text-[10px] font-bold text-slate-300 leading-relaxed uppercase">
                Difusi akan terus berlangsung hingga jumlah partikel di kedua ruang menjadi hampir sama (Kesetimbangan Dinamis).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          MEMAHAMI KONSEP DIFUSI 🌬️
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Apa itu Difusi?</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Difusi adalah perpindahan partikel dari daerah yang konsentrasinya tinggi ke daerah yang konsentrasinya rendah. Proses ini terjadi secara spontan karena partikel gas atau zat cair terus bergerak secara acak menabrak satu sama lain.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Faktor Suhu & Massa</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Suhu berbanding lurus dengan Energi Kinetik. Semakin panas, partikel bergerak semakin cepat, sehingga difusi semakin cepat. Sebaliknya, partikel yang bermassa berat (besar) akan bergerak lebih lambat dibandingkan partikel ringan pada suhu yang sama.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Kesetimbangan Dinamis</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Saat jumlah partikel di sisi kiri dan kanan sudah hampir sama, difusi seolah-olah "berhenti". Kenyataannya, partikel tetap bergerak menyeberang, namun jumlah yang ke kanan sama dengan jumlah yang ke kiri (Netto = 0).
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI PEMAHAMAN [KUIS]
          </h3>
        </div>
        
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000] mb-4">
                <h4 className="font-bold mb-3 text-sm uppercase tracking-tight">{q.question}</h4>
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
                <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {score === 5 ? "Sempurna! Kamu memahami termodinamika dasar dengan baik." : "Bagus! Coba bereksperimen lagi dengan suhu dan massa."}
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