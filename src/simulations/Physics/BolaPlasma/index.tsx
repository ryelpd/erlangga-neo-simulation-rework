import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const CX = 400;
const CY = 275;
const SPHERE_RADIUS = 200;
const CORE_RADIUS = 20;

interface GasColor {
  name: string;
  base: string;
  glow: string;
  core: string;
}

interface Tendril {
  angle: number;
  angularVelocity: number;
  life: number;
  thickness: number;
}

const gasColors: GasColor[] = [
  { name: "Neon (Ne)", base: "#f97316", glow: "#f87171", core: "#fff" },
  { name: "Argon (Ar)", base: "#a855f7", glow: "#818cf8", core: "#e0e7ff" },
  { name: "Xenon (Xe)", base: "#06b6d4", glow: "#bae6fd", core: "#fff" }
];

export default function BolaPlasma(): ReactNode {
  const [voltage, setVoltage] = useState(5.0);
  const [gasIndex, setGasIndex] = useState(0);
  const [forceTouch, setForceTouch] = useState(false);
  const [isPowerOn, setIsPowerOn] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tendrilsRef = useRef<Tendril[]>([]);
  const mouseRef = useRef({ x: 400, y: 275, isTouching: false });
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const currentColor = gasColors[gasIndex];

  const updatePhysics = useCallback(() => {
    const targetTendrilCount = isPowerOn ? Math.floor(voltage * 3) : 0;

    while (tendrilsRef.current.length < targetTendrilCount) {
      tendrilsRef.current.push({
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.05,
        life: Math.random(),
        thickness: 1 + Math.random() * 2
      });
    }
    while (tendrilsRef.current.length > targetTendrilCount) {
      tendrilsRef.current.pop();
    }
  }, [voltage, isPowerOn]);

  const drawTendril = useCallback((
    ctx: CanvasRenderingContext2D,
    t: Tendril,
    touchX: number,
    touchY: number,
    isTouched: boolean
  ) => {
    let endX: number, endY: number;
    let isFocused = false;

    if (isTouched && Math.random() < 0.6) {
      endX = touchX;
      endY = touchY;
      isFocused = true;
    } else {
      endX = CX + SPHERE_RADIUS * Math.cos(t.angle);
      endY = CY + SPHERE_RADIUS * Math.sin(t.angle);
    }

    const dx = endX - CX;
    const dy = endY - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const segments = Math.floor(dist / 15) + 5;

    ctx.beginPath();
    ctx.moveTo(CX, CY);

    for (let i = 1; i <= segments; i++) {
      const ratio = i / segments;
      const baseX = CX + dx * ratio;
      const baseY = CY + dy * ratio;

      const perpX = -dy / dist;
      const perpY = dx / dist;

      const wobbleFactor = Math.sin(ratio * Math.PI);
      let wobbleAmt = (Math.random() - 0.5) * (30 + voltage) * wobbleFactor;

      if (isFocused) wobbleAmt *= 0.5;

      const nx = baseX + perpX * wobbleAmt;
      const ny = baseY + perpY * wobbleAmt;

      if (Math.random() < 0.1 && ratio < 0.8 && !isFocused) {
        ctx.lineTo(nx, ny);
        const bx = nx + (Math.random() - 0.5) * 30;
        const by = ny + (Math.random() - 0.5) * 30;
        ctx.lineTo(bx, by);
        ctx.moveTo(nx, ny);
      }

      ctx.lineTo(nx, ny);
    }

    ctx.shadowColor = currentColor.glow;
    ctx.shadowBlur = isFocused ? 25 : 15;
    ctx.strokeStyle = isFocused ? currentColor.core : currentColor.base;
    ctx.lineWidth = isFocused ? t.thickness * 1.5 : t.thickness;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = currentColor.core;
    ctx.lineWidth = isFocused ? 2 : 1;
    ctx.stroke();

    t.angle += t.angularVelocity;
    if (Math.random() < 0.02) t.angularVelocity = (Math.random() - 0.5) * 0.1;

    t.life -= 0.05;
    if (t.life <= 0) {
      t.angle = Math.random() * Math.PI * 2;
      t.life = 0.5 + Math.random() * 0.5;
    }
  }, [voltage, currentColor]);

  const drawSphere = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.3)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.beginPath();
    ctx.arc(CX, CY, SPHERE_RADIUS, 0, Math.PI * 2);

    const glassGrad = ctx.createRadialGradient(CX - 50, CY - 50, 10, CX, CY, SPHERE_RADIUS);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    glassGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.0)');
    glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

    ctx.fillStyle = glassGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(CX - 40, CY + SPHERE_RADIUS - 10);
    ctx.lineTo(CX + 40, CY + SPHERE_RADIUS - 10);
    ctx.lineTo(CX + 80, CY + SPHERE_RADIUS + 60);
    ctx.lineTo(CX - 80, CY + SPHERE_RADIUS + 60);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#334155';
    ctx.fillRect(CX - 10, CY, 20, SPHERE_RADIUS);

    ctx.beginPath();
    ctx.arc(CX, CY, CORE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = isPowerOn ? currentColor.base : '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (isPowerOn) {
      const coreGrad = ctx.createRadialGradient(CX, CY, CORE_RADIUS * 0.5, CX, CY, CORE_RADIUS * 2);
      coreGrad.addColorStop(0, currentColor.core);
      coreGrad.addColorStop(0.5, currentColor.base);
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(CX, CY, CORE_RADIUS * 2, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.globalCompositeOperation = 'screen';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [isPowerOn, currentColor]);

  const drawTouchPoint = useCallback((ctx: CanvasRenderingContext2D, touchX: number, touchY: number) => {
    if (!isPowerOn) return;

    ctx.shadowColor = currentColor.glow;
    ctx.shadowBlur = 20;
    ctx.fillStyle = currentColor.core;

    ctx.beginPath();
    ctx.arc(touchX, touchY, 8 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = currentColor.base;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(touchX, touchY, 15 + Math.random() * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [isPowerOn, currentColor]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updatePhysics();

    drawSphere(ctx);

    const mouse = mouseRef.current;
    const isTouched = forceTouch || mouse.isTouching;

    if (forceTouch && !mouse.isTouching) {
      mouse.x = CX + SPHERE_RADIUS * Math.cos(-Math.PI / 4);
      mouse.y = CY + SPHERE_RADIUS * Math.sin(-Math.PI / 4);
    }

    if (isPowerOn) {
      ctx.globalCompositeOperation = 'screen';
      for (const t of tendrilsRef.current) {
        drawTendril(ctx, t, mouse.x, mouse.y, isTouched);
      }
      ctx.globalCompositeOperation = 'source-over';

      if (isTouched) {
        drawTouchPoint(ctx, mouse.x, mouse.y);
      }
    }
  }, [updatePhysics, drawSphere, drawTendril, drawTouchPoint, forceTouch, isPowerOn]);

  useEffect(() => {
    const loop = () => {
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  const handlePointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x = (clientX - rect.left) * (canvas.width / rect.width);
    let y = (clientY - rect.top) * (canvas.height / rect.height);

    const dx = x - CX;
    const dy = y - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const mouse = mouseRef.current;

    if (dist <= SPHERE_RADIUS + 20) {
      mouse.isTouching = true;
      if (dist > SPHERE_RADIUS) {
        x = CX + (dx / dist) * SPHERE_RADIUS;
        y = CY + (dy / dist) * SPHERE_RADIUS;
      }
      mouse.x = x;
      mouse.y = y;
    } else {
      mouse.isTouching = false;
    }
  }, []);

  const tendrilCount = isPowerOn ? Math.floor(voltage * 3) : 0;
  const frequency = isPowerOn ? Math.floor(30 + voltage) : 0;

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-amber-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">ELEKTROMAGNETISME</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: BOLA PLASMA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Simulasi Gas Terionisasi (Wujud Zat Keempat) dalam Medan Listrik
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f59e0b] text-md transform rotate-2 z-30 uppercase">
            Panel Kendali
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-amber-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-amber-900 uppercase text-[10px]">Tegangan Listrik (<span className="italic">V</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-amber-600">{voltage.toFixed(1)} kV</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="15.0"
                step="0.5"
                value={voltage}
                onChange={(e) => setVoltage(parseFloat(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Lemah (Sedikit)</span>
                <span>Kuat (Banyak)</span>
              </div>
            </div>

            <div className="bg-purple-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-purple-900 uppercase text-[10px]">Campuran Gas</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black" style={{ color: currentColor.base }}>{currentColor.name}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={gasIndex}
                onChange={(e) => setGasIndex(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Neon</span>
                <span>Argon</span>
                <span>Xenon</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Interaksi Fisik</label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input
                  type="checkbox"
                  checked={forceTouch}
                  onChange={(e) => setForceTouch(e.target.checked)}
                  className="w-4 h-4 accent-slate-800"
                />
                Fokuskan Plasma (Sentuhan)
              </label>
              <p className="text-[9px] text-slate-500 font-medium italic mt-1 leading-tight">
                *Anda juga dapat menggerakkan mouse/jari di atas kanvas bola untuk menyentuhnya secara langsung.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button
                onClick={() => setIsPowerOn(!isPowerOn)}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${isPowerOn ? 'bg-emerald-400 text-black hover:bg-emerald-300' : 'bg-rose-500 text-white hover:bg-rose-400'}`}
              >
                {isPowerOn ? 'SAKLAR DAYA: ON' : 'SAKLAR DAYA: OFF'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-amber-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">STATUS IONISASI</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Jalur Plasma</span>
                <span className="text-xl font-black text-white">{tendrilCount}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center relative overflow-hidden">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Frekuensi</span>
                <span className="text-xl font-black text-amber-400 relative z-10">{frequency} kHz</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-center flex flex-col items-center justify-center min-h-[50px] rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Kondisi Gas:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${isPowerOn ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isPowerOn ? 'PLASMA TERBENTUK' : 'DAYA MATI'}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-[#020617] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden cursor-crosshair" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
            <span className="absolute top-4 left-4 bg-black text-white font-black px-3 py-1 border-4 border-white shadow-[4px_4px_0px_#fff] text-[10px] transform -rotate-1 z-30 uppercase">
              Ruang Hampa (Tekanan Rendah)
            </span>

            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              className="w-full h-full block"
              onMouseMove={(e) => handlePointer(e.clientX, e.clientY)}
              onMouseLeave={() => { mouseRef.current.isTouching = false; }}
              onTouchMove={(e) => {
                e.preventDefault();
                if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchEnd={() => { mouseRef.current.isTouching = false; }}
            />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-amber-500 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan Fisika Plasma
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-amber-400 border-b-2 border-slate-600 pb-1 mb-2">Apa itu Plasma?</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Plasma sering disebut wujud zat keempat (setelah padat, cair, dan gas). Saat gas dipanaskan atau diberi tegangan listrik ekstrem, elektron-elektron akan terlepas dari atomnya. Gas ini menjadi sup "ion positif" dan "elektron bebas" yang dapat menghantarkan listrik.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-purple-400 border-b-2 border-slate-600 pb-1 mb-2">Tegangan & Gas Mulia</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Koil Tesla kecil di tengah bola menghasilkan tegangan sangat tinggi berfrekuensi tinggi (Ribuan Volt, ~35 kHz). Tabung diisi dengan gas mulia (Neon, Argon, dsb.) pada tekanan rendah. Percikan cahaya terjadi saat elektron kembali ke orbit atomnya (memancarkan foton).
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-cyan-400 border-b-2 border-slate-600 pb-1 mb-2">Efek Sentuhan</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Tubuh manusia adalah konduktor listrik alami. Saat Anda menyentuh kaca, Anda menciptakan jalur dengan hambatan yang lebih rendah (kapasitansi) menuju tanah (Ground). Arus listrik frekuensi tinggi menembus kaca dan mengalir melalui Anda, memfokuskan plasma ke arah sentuhan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}