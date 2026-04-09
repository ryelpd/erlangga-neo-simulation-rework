import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const POPULATION = 1000;
const COLS = 40;
const ROWS = 25;
const CELL_W = 16;
const CELL_H = 16;
const CANVAS_WIDTH = 760;
const CANVAS_HEIGHT = 480;

interface Person {
  state: 'TP' | 'FN' | 'FP' | 'TN';
  color: string;
}

export default function TeoremaBayes(): ReactNode {
  const [prior, setPrior] = useState(1.0);
  const [tpr, setTpr] = useState(90);
  const [fpr, setFpr] = useState(9);
  const [isTesting, setIsTesting] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const [posterior, setPosterior] = useState(0);
  const [status, setStatus] = useState('SESUAIKAN SLIDER LALU KLIK LAKUKAN TES');
  const [statusColor, setStatusColor] = useState('text-white');
  const [statusBg, setStatusBg] = useState('bg-indigo-900');
  const [statusBorder, setStatusBorder] = useState('border-indigo-400');
  const [posteriorColor, setPosteriorColor] = useState('text-white');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const populationRef = useRef<Person[]>([]);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const paddingX = (CANVAS_WIDTH - (COLS * CELL_W)) / 2;
  const paddingY = (CANVAS_HEIGHT - (ROWS * CELL_H)) / 2;

  const calculateBayes = useCallback(() => {
    const priorDecimal = prior / 100;
    const tprDecimal = tpr / 100;
    const fprDecimal = fpr / 100;

    const sickTotal = Math.round(POPULATION * priorDecimal);
    const healthyTotal = POPULATION - sickTotal;

    const truePos = Math.round(sickTotal * tprDecimal);
    const falseNeg = sickTotal - truePos;
    const falsePos = Math.round(healthyTotal * fprDecimal);
    const trueNeg = healthyTotal - falsePos;

    const totalPositives = truePos + falsePos;
    const newPosterior = totalPositives > 0 ? (truePos / totalPositives) * 100 : 0;

    // Build population array
    const pop: Person[] = [];
    for (let i = 0; i < truePos; i++) pop.push({ state: 'TP', color: '#10b981' });
    for (let i = 0; i < falseNeg; i++) pop.push({ state: 'FN', color: '#f43f5e' });
    for (let i = 0; i < falsePos; i++) pop.push({ state: 'FP', color: '#facc15' });
    for (let i = 0; i < trueNeg; i++) pop.push({ state: 'TN', color: '#cbd5e1' });

    populationRef.current = pop;
    setPosterior(newPosterior);
  }, [prior, tpr, fpr]);

  const drawBlockOutline = useCallback((ctx: CanvasRenderingContext2D, startIdx: number, endIdx: number) => {
    if (startIdx > endIdx) return;

    const startRow = Math.floor(startIdx / COLS);
    const endRow = Math.floor(endIdx / COLS);

    const startX = paddingX + ((startIdx % COLS) * CELL_W);
    const startY = paddingY + (startRow * CELL_H);
    const endX = paddingX + (((endIdx % COLS) + 1) * CELL_W);
    const endY = paddingY + ((endRow + 1) * CELL_H);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 4]);

    if (startRow === endRow) {
      ctx.strokeRect(startX - 2, startY - 2, endX - startX + 4, CELL_H + 4);
    } else {
      const fullStartX = paddingX;
      const fullEndX = paddingX + (COLS * CELL_W);
      ctx.beginPath();
      ctx.moveTo(startX - 2, startY - 2);
      ctx.lineTo(fullEndX + 2, startY - 2);
      ctx.lineTo(fullEndX + 2, endY - CELL_H - 2);
      ctx.lineTo(endX + 2, endY - CELL_H - 2);
      ctx.lineTo(endX + 2, endY + 2);
      ctx.lineTo(fullStartX - 2, endY + 2);
      ctx.lineTo(fullStartX - 2, startY + CELL_H + 2);
      ctx.lineTo(startX - 2, startY + CELL_H + 2);
      ctx.closePath();
      ctx.stroke();
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < POPULATION; i++) {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      const x = paddingX + (col * CELL_W);
      const y = paddingY + (row * CELL_H);

      const person = populationRef.current[i];
      if (!person) continue;

      const dotThreshold = i / POPULATION;

      if (isTesting && animProgress < dotThreshold) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4);
        continue;
      }

      ctx.fillStyle = person.color;
      ctx.fillRect(x + 1, y + 1, CELL_W - 2, CELL_H - 2);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, CELL_W - 2, CELL_H - 2);
    }

    // Draw bounding boxes after animation
    if (!isTesting && animProgress >= 1.0) {
      ctx.save();
      let truePos = 0, falsePos = 0, falseNeg = 0;
      for (const p of populationRef.current) {
        if (p.state === 'TP') truePos++;
        else if (p.state === 'FP') falsePos++;
        else if (p.state === 'FN') falseNeg++;
      }

      drawBlockOutline(ctx, 0, truePos - 1);
      const startFP = truePos + falseNeg;
      const endFP = startFP + falsePos - 1;
      if (falsePos > 0) drawBlockOutline(ctx, startFP, endFP);

      ctx.restore();
    }
  }, [isTesting, animProgress, drawBlockOutline]);

  useEffect(() => {
    calculateBayes();
  }, [calculateBayes]);

  useEffect(() => {
    const loop = () => {
      if (isTesting) {
        setAnimProgress(prev => {
          const newProgress = prev + 0.02;
          if (newProgress >= 1.0) {
            setIsTesting(false);
            if (posterior < 10) {
              setStatusColor('text-rose-400');
              setStatusBg('bg-rose-900');
              setStatusBorder('border-rose-500');
              setPosteriorColor('text-rose-400');
              setStatus('Peluang Sakit Sangat Rendah (Mayoritas Positif Palsu)');
            } else if (posterior < 50) {
              setStatusColor('text-amber-400');
              setStatusBg('bg-amber-900');
              setStatusBorder('border-amber-500');
              setPosteriorColor('text-amber-400');
              setStatus('Peluang Sakit Menengah (Banyak Positif Palsu)');
            } else {
              setStatusColor('text-emerald-400');
              setStatusBg('bg-emerald-900');
              setStatusBorder('border-emerald-500');
              setPosteriorColor('text-emerald-400');
              setStatus('Peluang Sakit Tinggi (Tes Cukup Dipercaya)');
            }
            return 1.0;
          }
          return newProgress;
        });
      }

      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTesting, posterior, draw]);

  const handleTest = () => {
    setIsTesting(true);
    setAnimProgress(0);
    setStatus('MENGAMBIL SAMPEL POPULASI...');
    setStatusColor('text-white');
    setStatusBg('bg-black');
    setStatusBorder('border-indigo-500');
    setPosteriorColor('text-white');
  };

  const handleSliderChange = () => {
    if (!isTesting && animProgress >= 1) {
      setAnimProgress(0);
    }
    calculateBayes();
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">STATISTIK & PROBABILITAS</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: TEOREMA BAYES
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Simulasi Paradoks Positif Palsu (Base Rate Fallacy) pada Tes Medis
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#6366f1] text-md transform rotate-2 z-30 uppercase">
            Parameter Tes
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-900 uppercase text-[10px]">Peluang Awal / Prior (<span className="italic">P(A)</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-700">{prior.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="50"
                step="0.1"
                value={prior}
                onChange={(e) => { setPrior(parseFloat(e.target.value)); handleSliderChange(); }}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Penyakit Langka</span>
                <span>Wabah Umum (50%)</span>
              </div>
            </div>

            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-900 uppercase text-[10px]">Akurasi Tes (<span className="italic">P(B|A)</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-700">{tpr}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={tpr}
                onChange={(e) => { setTpr(parseInt(e.target.value)); handleSliderChange(); }}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Seperti Koin (50%)</span>
                <span>Sempurna (100%)</span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-amber-900 uppercase text-[10px]">Positif Palsu (<span className="italic">P(B|~A)</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-amber-700">{fpr}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={fpr}
                onChange={(e) => { setFpr(parseInt(e.target.value)); handleSliderChange(); }}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Tak Pernah Salah (0%)</span>
                <span>Sering Salah (30%)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-black pt-3">
              <button
                onClick={handleTest}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#312e81] rounded-lg bg-indigo-400 hover:bg-indigo-300 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                LAKUKAN TES MASAL
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-indigo-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">HASIL TEOREMA BAYES</h4>

            <div className="text-center mb-3">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Peluang Baru / Posterior (<span className="italic">P(A|B)</span>)</span><br />
              <span className={`text-4xl font-black tracking-tighter ${posteriorColor}`}>{posterior.toFixed(1)}%</span>
            </div>

            <div className={`${statusBg} p-3 border-2 border-dashed ${statusBorder} text-center flex flex-col items-center justify-center min-h-[60px] transition-colors duration-300 rounded`}>
              <span className="text-[9px] font-bold uppercase text-indigo-200 mb-1">Kesimpulan Logis:</span>
              <span className={`text-xs font-black text-white leading-tight ${statusColor}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden"
            style={{
              backgroundColor: '#f8fafc',
              backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.2) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-slate-900 font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Populasi 1.000 Orang
            </span>

            <div className="absolute top-4 right-4 bg-white border-2 border-black p-2 flex flex-col gap-1 z-20 shadow-[4px_4px_0px_0px_#000]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 border border-black"></div>
                <span className="text-[10px] font-bold text-black uppercase">Sakit, Tes Positif (Benar)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 border border-black"></div>
                <span className="text-[10px] font-bold text-black uppercase">Sakit, Tes Negatif (Luput)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-400 border border-black"></div>
                <span className="text-[10px] font-bold text-black uppercase">Sehat, Tes Positif (Palsu)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-300 border border-black"></div>
                <span className="text-[10px] font-bold text-black uppercase">Sehat, Tes Negatif (Aman)</span>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-full block p-4 pt-16"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-indigo-400 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Membedah Rumus Bayes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-rose-400 border-b-2 border-slate-600 pb-1 mb-2">1. Base Rate Fallacy</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Insting kita sering salah. Jika tes berakurasi 90% menyatakan Anda positif, Anda mungkin panik dan mengira peluang Anda sakit adalah 90%. Padahal, jika penyakitnya sangat langka (misal 1%), jumlah orang sehat yang mendapat <b>Positif Palsu</b> jauh melebihi jumlah orang sakit yang sebenarnya!
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">2. Visualisasi Kolom</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Perhatikan kotak yang disorot di kanvas. Kotak itu berisi <b>Semua Hasil Positif</b> (Sakit yang terdeteksi + Sehat yang salah didiagnosa). Teorema Bayes pada dasarnya hanya menanyakan: <i>"Dari semua titik di dalam kotak sorotan tersebut, berapa persen yang warnanya Hijau (Benar-benar sakit)?"</i>
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-center">
            <h4 className="font-black text-md uppercase text-indigo-400 border-b-2 border-slate-600 pb-1 mb-2 text-center">Rumus Bayes</h4>
            <div className="text-center bg-black p-2 border-2 border-slate-600 mt-2">
              <span className="text-sm font-bold text-white italic">P(A|B) = <span className="text-emerald-400">P(B|A)</span> · <span className="text-rose-400">P(A)</span> / <span className="text-yellow-300">P(B)</span></span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Posterior = (Akurasi × Prior) / Total Positif
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}