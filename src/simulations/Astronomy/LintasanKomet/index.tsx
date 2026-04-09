import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const CX = 200;
const CY = 275;
const GM = 10000;
const DT = 0.05;
const SUB_STEPS = 10;
const MAX_TRAIL = 400;

interface CometState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

export default function LintasanKomet(): ReactNode {
  const [eccentricity, setEccentricity] = useState(0.8);
  const [semimajor, setSemimajor] = useState(250);
  const [showTail, setShowTail] = useState(true);
  const [showPath, setShowPath] = useState(true);
  const [velocity, setVelocity] = useState(0);
  const [distance, setDistance] = useState(0);
  const [phase, setPhase] = useState('MENDEKATI MATAHARI (PERIHELION)');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cometRef = useRef<CometState>({ x: 0, y: 0, vx: 0, vy: 0 });
  const pathTrailRef = useRef<TrailPoint[]>([]);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const initOrbit = useCallback((a: number, e: number) => {
    const rp = a * (1 - e);
    cometRef.current = {
      x: CX - rp,
      y: CY,
      vx: 0,
      vy: Math.sqrt(GM * (2 / rp - 1 / a))
    };
    pathTrailRef.current = [];
  }, []);

  const updatePhysics = useCallback(() => {
    const comet = cometRef.current;
    for (let step = 0; step < SUB_STEPS; step++) {
      const dx = comet.x - CX;
      const dy = comet.y - CY;
      const r2 = dx * dx + dy * dy;
      let r = Math.sqrt(r2);
      if (r < 5) r = 5;

      const a_mag = -GM / (r2 * r);
      const ax = a_mag * dx;
      const ay = a_mag * dy;

      comet.x += comet.vx * DT + 0.5 * ax * DT * DT;
      comet.y += comet.vy * DT + 0.5 * ay * DT * DT;

      const dx_new = comet.x - CX;
      const dy_new = comet.y - CY;
      const r2_new = dx_new * dx_new + dy_new * dy_new;
      let r_new = Math.sqrt(r2_new);
      if (r_new < 5) r_new = 5;

      const a_mag_new = -GM / (r2_new * r_new);
      const ax_new = a_mag_new * dx_new;
      const ay_new = a_mag_new * dy_new;

      comet.vx += 0.5 * (ax + ax_new) * DT;
      comet.vy += 0.5 * (ay + ay_new) * DT;

      if (step === 0 && showPath) {
        pathTrailRef.current.push({ x: comet.x, y: comet.y });
        if (pathTrailRef.current.length > MAX_TRAIL) {
          pathTrailRef.current.shift();
        }
      }
    }
  }, [showPath]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const comet = cometRef.current;

    if (showPath && pathTrailRef.current.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pathTrailRef.current[0].x, pathTrailRef.current[0].y);
      for (let i = 1; i < pathTrailRef.current.length; i++) {
        ctx.lineTo(pathTrailRef.current[i].x, pathTrailRef.current[i].y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const dx = comet.x - CX;
    const dy = comet.y - CY;
    const r = Math.sqrt(dx * dx + dy * dy);

    if (showTail) {
      const tailDirX = dx / r;
      const tailDirY = dy / r;
      const tailLen = Math.min(300, 15000 / r);

      const tailEndX = comet.x + tailDirX * tailLen;
      const tailEndY = comet.y + tailDirY * tailLen;

      const grad = ctx.createLinearGradient(comet.x, comet.y, tailEndX, tailEndY);
      grad.addColorStop(0, 'rgba(103, 232, 249, 0.8)');
      grad.addColorStop(1, 'rgba(103, 232, 249, 0)');

      const perpX = -tailDirY * 4;
      const perpY = tailDirX * 4;

      ctx.beginPath();
      ctx.moveTo(comet.x + perpX, comet.y + perpY);
      ctx.lineTo(comet.x - perpX, comet.y - perpY);
      ctx.lineTo(tailEndX, tailEndY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    const sunGrad = ctx.createRadialGradient(CX, CY, 5, CX, CY, 40);
    sunGrad.addColorStop(0, 'rgba(253, 224, 71, 1)');
    sunGrad.addColorStop(0.3, 'rgba(234, 179, 8, 0.8)');
    sunGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');

    ctx.beginPath();
    ctx.arc(CX, CY, 40, 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(CX, CY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(comet.x, comet.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(comet.x, comet.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
  }, [showTail, showPath]);

  const updateTelemetry = useCallback(() => {
    const comet = cometRef.current;
    const dx = comet.x - CX;
    const dy = comet.y - CY;
    const r = Math.sqrt(dx * dx + dy * dy);
    const vel = Math.sqrt(comet.vx * comet.vx + comet.vy * comet.vy);

    setVelocity(vel * 10);
    setDistance(r / 50);

    const dotProduct = comet.vx * dx + comet.vy * dy;
    if (dotProduct > 0) {
      setPhase('MENJAUHI MATAHARI (APHELION)');
    } else {
      setPhase('MENDEKATI MATAHARI (PERIHELION)');
    }
  }, []);

  useEffect(() => {
    initOrbit(semimajor, eccentricity);
  }, [semimajor, eccentricity, initOrbit]);

  useEffect(() => {
    const loop = () => {
      updatePhysics();
      updateTelemetry();
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updatePhysics, updateTelemetry, draw]);

  const handleReset = () => {
    initOrbit(semimajor, eccentricity);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">ASTROFISIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: LINTASAN KOMET
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Simulasi Orbit Elips & Hukum Kepler
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#06b6d4] text-md transform rotate-2 z-30 uppercase">
            Panel Orbital
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-cyan-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-cyan-900 uppercase text-[10px]">Eksentrisitas (<span className="italic">e</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-cyan-600">{eccentricity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.9"
                step="0.05"
                value={eccentricity}
                onChange={(e) => setEccentricity(parseFloat(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Lingkaran (0)</span>
                <span>Sangat Lonjong (0.9)</span>
              </div>
            </div>

            <div className="bg-violet-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-violet-900 uppercase text-[10px]">Sumbu Semimayor (<span className="italic">a</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-violet-700">{semimajor.toFixed(0)} AU</span>
              </div>
              <input
                type="range"
                min="100"
                max="350"
                step="10"
                value={semimajor}
                onChange={(e) => setSemimajor(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Dekat (Kecil)</span>
                <span>Jauh (Besar)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Visualisasi Ruang</label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input
                  type="checkbox"
                  checked={showTail}
                  onChange={(e) => setShowTail(e.target.checked)}
                  className="w-4 h-4 accent-slate-800"
                />
                Tampilkan Ekor Komet
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input
                  type="checkbox"
                  checked={showPath}
                  onChange={(e) => setShowPath(e.target.checked)}
                  className="w-4 h-4 accent-slate-800"
                />
                Gambarkan Jejak Orbit
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                KEMBALIKAN KE PERIHELION
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-cyan-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">TELEMETRI REAL-TIME</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Kecepatan (<span className="italic">v</span>)</span>
                <span className="text-xl font-black text-sky-400">{velocity.toFixed(1)} km/s</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Jarak dari Sun (<span className="italic">r</span>)</span>
                <span className="text-xl font-black text-violet-400">{distance.toFixed(2)} AU</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-cyan-500 text-center flex flex-col items-center justify-center min-h-[60px] rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Posisi:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${phase.includes('MENJAUHI') ? 'text-violet-400' : 'text-cyan-400'}`}>
                {phase}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-[#020617] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Teleskop Bidang Pandang Luas
            </span>

            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              className="w-full h-full block"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-cyan-600 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-white">
          Buku Panduan Astrofisika
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">Hukum Kepler I</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Setiap benda langit bergerak mengelilingi matahari dalam lintasan berbentuk Elips, dengan matahari berada di salah satu titik fokusnya. Komet biasanya memiliki orbit yang sangat lonjong (eksentrisitas tinggi mendekati 1).
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-violet-400 border-b-2 border-slate-600 pb-1 mb-2">Hukum Kepler II</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Garis hubung benda langit dan matahari menyapu luasan yang sama dalam waktu yang sama. Artinya, komet akan melesat sangat cepat saat berada di titik terdekat dengan matahari (Perihelion) dan bergerak lambat di titik terjauh (Aphelion).
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-yellow-400 border-b-2 border-slate-600 pb-1 mb-2">Ekor Komet</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Saat mendekati matahari, panas menyebabkan material es komet menyublim. Angin matahari dan tekanan radiasi meniup gas dan debu tersebut, sehingga ekor komet selalu menjauhi arah matahari, terlepas dari arah gerak komet itu sendiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}