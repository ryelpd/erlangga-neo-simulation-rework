import { useState, useEffect, useRef, useCallback } from 'react';

const PX_PER_METER = 20;
const GROUND_Y = 250;

export default function MomentumTumbukan() {
  const [m1, setM1] = useState(2);
  const [v1, setV1] = useState(5);
  const [m2, setM2] = useState(2);
  const [v2, setV2] = useState(-3);
  const [e, setE] = useState(1);

  const [x1, setX1] = useState(200);
  const [x2, setX2] = useState(600);
  const [currentV1, setCurrentV1] = useState(5);
  const [currentV2, setCurrentV2] = useState(-3);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCollided, setHasCollided] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [impulse, setImpulse] = useState(0);

  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  const calcSize = (mass: number) => 40 + mass * 8;

  const handleReset = useCallback(() => {
    setX1(200);
    setX2(600);
    setCurrentV1(v1);
    setCurrentV2(v2);
    setIsPlaying(false);
    setHasCollided(false);
    setIsFinished(false);
    setImpulse(0);
  }, [v1, v2]);

  useEffect(() => {
    if (!isPlaying || isFinished) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const safeDt = Math.min(dt, 0.1);

      let newX1 = x1 + currentV1 * PX_PER_METER * safeDt;
      let newX2 = x2 + currentV2 * PX_PER_METER * safeDt;

      const size1 = calcSize(m1);
      const size2 = calcSize(m2);
      const dist = newX2 - newX1;
      const minDist = size1 / 2 + size2 / 2;

      if (!hasCollided && dist <= minDist) {
        setHasCollided(true);
        const overlap = minDist - dist;
        newX1 -= overlap / 2;
        newX2 += overlap / 2;

        const v1Final = ((m1 - e * m2) * currentV1 + (1 + e) * m2 * currentV2) / (m1 + m2);
        const v2Final = ((m2 - e * m1) * currentV2 + (1 + e) * m1 * currentV1) / (m1 + m2);

        setCurrentV1(v1Final);
        setCurrentV2(v2Final);

        const imp = m1 * (v1Final - currentV1);
        setImpulse(imp);

        if (newX1 < -100 && newX2 > 900) {
          setIsFinished(true);
          setIsPlaying(false);
        }
      }

      setX1(newX1);
      setX2(newX2);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, isFinished, hasCollided, x1, x2, currentV1, currentV2, m1, m2, e]);

  const handlePlayPause = () => {
    if (isFinished) return;
    setIsPlaying(!isPlaying);
    lastTimeRef.current = performance.now();
  };

  const handleSliderChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    if (isPlaying || hasCollided) return;
    setter(value);
  };

  const size1 = calcSize(m1);
  const size2 = calcSize(m2);

  const p1 = m1 * currentV1;
  const p2 = m2 * currentV2;
  const pTot = p1 + p2;

  const simStatusText = hasCollided
    ? "TUMBUKAN TERJADI! (SESUDAH TABRAKAN)"
    : "Menunggu Simulasi (Sebelum Tumbukan)";
  const simStatusClass = hasCollided
    ? "bg-slate-900 text-yellow-300 border-yellow-300"
    : "bg-white text-black border-black";

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3">
          MEKANIKA KLASIK
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: MOMENTUM & TUMBUKAN
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Hukum Kekekalan Momentum, Impuls, dan Koefisien Restitusi
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md transform rotate-2 z-30 uppercase">
            Panel Variabel
          </span>

          <div className="flex flex-col gap-4 mt-4 h-[500px] overflow-y-auto pr-2">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 rounded-xl">
              <h4 className="font-black text-rose-700 uppercase border-b-2 border-rose-200 pb-1">🟥 Benda 1 (Merah)</h4>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[10px] text-rose-800">Massa (m₁)</span>
                  <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{m1} kg</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={m1}
                  onChange={(e) => handleSliderChange(setM1, parseFloat(e.target.value))}
                  disabled={isPlaying || hasCollided}
                  className="w-full appearance-none bg-transparent cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-300 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[10px] text-rose-800">Kecepatan Awal (v₁)</span>
                  <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{v1} m/s</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={v1}
                  onChange={(e) => handleSliderChange(setV1, parseFloat(e.target.value))}
                  disabled={isPlaying || hasCollided}
                  className="w-full appearance-none bg-transparent cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 rounded-xl">
              <h4 className="font-black text-blue-700 uppercase border-b-2 border-blue-200 pb-1">🟦 Benda 2 (Biru)</h4>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[10px] text-blue-800">Massa (m₂)</span>
                  <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-blue-600">{m2} kg</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={m2}
                  onChange={(e) => handleSliderChange(setM2, parseFloat(e.target.value))}
                  disabled={isPlaying || hasCollided}
                  className="w-full appearance-none bg-transparent cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-300 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[10px] text-blue-800">Kecepatan Awal (v₂)</span>
                  <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-blue-600">{v2} m/s</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={v2}
                  onChange={(e) => handleSliderChange(setV2, parseFloat(e.target.value))}
                  disabled={isPlaying || hasCollided}
                  className="w-full appearance-none bg-transparent cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
                />
              </div>
            </div>

            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-800 uppercase text-[10px]">Koefisien Restitusi (e)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-600">{e.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={e}
                onChange={(e) => handleSliderChange(setE, parseFloat(e.target.value))}
                disabled={isPlaying || hasCollided}
                className="w-full appearance-none bg-transparent cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>0 (Tidak Lenting)</span>
                <span>1 (Lenting Sempurna)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t-4 border-black pt-4 mt-2">
            <button
              onClick={handlePlayPause}
              className={`neo-btn py-3 text-xs flex-1 flex items-center justify-center gap-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                isPlaying ? 'bg-rose-400 hover:bg-rose-300' : 'bg-emerald-400 hover:bg-emerald-300'
              }`}
            >
              {isPlaying ? '⏸️ JEDA' : '▶️ JALANKAN'}
            </button>
            <button
              onClick={handleReset}
              className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 text-xs flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000]"
            >
              🔄 KEMBALIKAN
            </button>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 border-8 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-0 relative flex flex-col items-center w-full h-[400px] overflow-hidden">
            <span className={`absolute top-4 left-4 font-black px-3 py-1 border-4 shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase ${simStatusClass}`}>
              {simStatusText}
            </span>

            <svg viewBox="0 0 800 400" className="w-full h-full overflow-visible">
              <defs>
                <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                  <path d="M 0 0 L 6 3 L 0 6 z" fill="#ef4444" />
                </marker>
                <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                  <path d="M 0 0 L 6 3 L 0 6 z" fill="#3b82f6" />
                </marker>
              </defs>

              <line x1="0" y1="250" x2="800" y2="250" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
              <path d="M 0 253 L 800 253 L 800 400 L 0 400 Z" fill="#e2e8f0" opacity="0.5" />

              {hasCollided && (
                <circle cx={x1 + size1 / 2} cy="220" r="60" fill="transparent" stroke="#facc15" strokeWidth="10" opacity="0.8">
                  <animate attributeName="r" from="10" to="80" dur="0.3s" fill="freeze" />
                  <animate attributeName="opacity" from="1" to="0" dur="0.3s" fill="freeze" />
                </circle>
              )}

              <g transform={`translate(${x1}, ${GROUND_Y})`}>
                {Math.abs(currentV1) > 0.5 && (
                  <line
                    x1="0"
                    y1="-80"
                    x2={currentV1 * 10}
                    y2="-80"
                    stroke="#ef4444"
                    strokeWidth="4"
                    markerEnd="url(#arrowRed)"
                  />
                )}
                <rect
                  x={-size1 / 2}
                  y={-size1}
                  width={size1}
                  height={size1}
                  fill="#fecdd3"
                  stroke="#e11d48"
                  strokeWidth="4"
                  rx="4"
                />
                <text x="0" y={-size1 / 2 + 5} textAnchor="middle" fontSize="16" fontWeight="900" fill="#be123c">
                  {m1} kg
                </text>
                <text x="0" y="-95" textAnchor="middle" fontSize="14" fontWeight="900" fill="#ef4444">
                  v₁ = {currentV1.toFixed(1)} m/s
                </text>
              </g>

              <g transform={`translate(${x2}, ${GROUND_Y})`}>
                {Math.abs(currentV2) > 0.5 && (
                  <line
                    x1="0"
                    y1="-80"
                    x2={currentV2 * 10}
                    y2="-80"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    markerEnd="url(#arrowBlue)"
                  />
                )}
                <rect
                  x={-size2 / 2}
                  y={-size2}
                  width={size2}
                  height={size2}
                  fill="#bfdbfe"
                  stroke="#1d4ed8"
                  strokeWidth="4"
                  rx="4"
                />
                <text x="0" y={-size2 / 2 + 5} textAnchor="middle" fontSize="16" fontWeight="900" fill="#1e3a8a">
                  {m2} kg
                </text>
                <text x="0" y="-95" textAnchor="middle" fontSize="14" fontWeight="900" fill="#3b82f6">
                  v₂ = {currentV2.toFixed(1)} m/s
                </text>
              </g>
            </svg>
          </div>

          <div className="bg-slate-900 text-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-sky-400 text-[12px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">
              TELEMETRI MOMENTUM ( P = m × v )
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-800 p-3 border-2 border-rose-500 rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Momentum Benda 1 (p₁)</span>
                <span className="text-2xl font-black text-rose-400 font-mono">{p1.toFixed(1)}</span> <span className="text-xs">kg·m/s</span>
              </div>
              <div className="bg-slate-800 p-3 border-2 border-blue-500 rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Momentum Benda 2 (p₂)</span>
                <span className="text-2xl font-black text-blue-400 font-mono">{p2.toFixed(1)}</span> <span className="text-xs">kg·m/s</span>
              </div>
              <div className="bg-black p-3 border-2 border-emerald-500 rounded flex flex-col justify-center items-center">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">Σ Momentum Total (Sistem)</span>
                <span className="text-3xl font-black text-white font-mono">{pTot.toFixed(1)}</span> <span className="text-xs">kg·m/s</span>
              </div>
            </div>

            {hasCollided && (
              <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-700">
                <div className="flex justify-center items-center gap-4">
                  <span className="text-xs font-bold uppercase text-yellow-300">Impuls Terjadi (Perubahan Momentum):</span>
                  <span className="text-lg font-black text-yellow-400 font-mono">{impulse.toFixed(2)} kg·m/s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 bg-sky-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Hukum Kekekalan 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-slate-800 border-b-2 border-black pb-1 mb-2">Hukum Kekekalan Momentum</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Momentum total sebuah sistem tertutup sebelum tumbukan <b>selalu sama</b> dengan momentum total setelah tumbukan. Perhatikan bahwa angka <span className="text-emerald-600 font-bold">Momentum Total</span> di panel bawah tidak akan pernah berubah sebelum maupun sesudah tabrakan!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Koefisien Restitusi (e)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Mengukur tingkat kelentingan tumbukan.
              <br />
              • <b>e = 1 (Lenting Sempurna):</b> Benda memantul sempurna tanpa energi kinetik yang hilang.
              <br />
              • <b>e = 0 (Tidak Lenting Sama Sekali):</b> Benda menempel jadi satu dan bergerak bersama.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-yellow-600 border-b-2 border-black pb-1 mb-2">Impuls (J)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Impuls adalah gaya yang bekerja pada benda dalam waktu yang sangat singkat saat tabrakan terjadi. Besarnya Impuls sama dengan <b>Perubahan Momentum</b> dari salah satu benda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
