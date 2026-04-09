import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const POS_SOURCE = 0;
const POS_POL1 = 250;
const POS_POL2 = 550;
const POS_SCREEN = 800;
const MAX_AMPLITUDE = 60;

export default function PolarisasiCahaya(): ReactNode {
  const [theta1, setTheta1] = useState(0);
  const [theta2, setTheta2] = useState(45);
  const [animate, setAnimate] = useState(true);
  const [finalIntensity, setFinalIntensity] = useState(25);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timePhaseRef = useRef(0);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const project3D = useCallback((x: number, y: number, z: number, canvasHeight: number): { px: number; py: number } => {
    const cx = x + z * 0.4;
    const cy = canvasHeight / 2 - y + z * 0.2;
    return { px: cx, py: cy };
  }, []);

  const renderSineWave = useCallback((
    ctx: CanvasRenderingContext2D,
    startX: number,
    endX: number,
    amplitude: number,
    angleDeg: number,
    phaseOffset: number,
    canvasHeight: number
  ) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    ctx.beginPath();

    for (let x = startX; x <= endX; x += 3) {
      const wavePhase = x * 0.03 - phaseOffset;
      const displacement = amplitude * Math.sin(wavePhase);

      const dy = displacement * Math.cos(angleRad);
      const dz = displacement * Math.sin(angleRad);

      const proj = project3D(x, dy, dz, canvasHeight);

      if (x === startX) ctx.moveTo(proj.px, proj.py);
      else ctx.lineTo(proj.px, proj.py);
    }
    ctx.stroke();
  }, [project3D]);

  const drawWave = useCallback((
    ctx: CanvasRenderingContext2D,
    startX: number,
    endX: number,
    amplitude: number,
    angleDeg: number,
    color: string,
    isUnpolarized: boolean,
    canvasHeight: number
  ) => {
    const startPhase = timePhaseRef.current;

    if (isUnpolarized) {
      const angles = [0, 45, 90, 135];
      angles.forEach((ang, index) => {
        ctx.strokeStyle = `rgba(148, 163, 184, ${0.4 + index * 0.1})`;
        ctx.lineWidth = 2;
        renderSineWave(ctx, startX, endX, amplitude * 0.7, ang, startPhase, canvasHeight);
      });
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      renderSineWave(ctx, startX, endX, amplitude, angleDeg, startPhase, canvasHeight);
    }
  }, [renderSineWave]);

  const drawFilter = useCallback((
    ctx: CanvasRenderingContext2D,
    xCenter: number,
    angleDeg: number,
    label: string,
    color: string,
    canvasHeight: number
  ) => {
    const radius = 70;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
      const y = radius * Math.cos(t);
      const z = radius * Math.sin(t);
      const proj = project3D(xCenter, y, z, canvasHeight);

      if (t === 0) ctx.moveTo(proj.px, proj.py);
      else ctx.lineTo(proj.px, proj.py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const aRad = (angleDeg * Math.PI) / 180;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;

    for (let offset = -40; offset <= 40; offset += 20) {
      const pRad = aRad + Math.PI / 2;
      const oy = offset * Math.cos(pRad);
      const oz = offset * Math.sin(pRad);

      const L = Math.sqrt(radius * radius - offset * offset) * 0.9;

      const y1 = oy + L * Math.cos(aRad);
      const z1 = oz + L * Math.sin(aRad);
      const proj1 = project3D(xCenter, y1, z1, canvasHeight);

      const y2 = oy - L * Math.cos(aRad);
      const z2 = oz - L * Math.sin(aRad);
      const proj2 = project3D(xCenter, y2, z2, canvasHeight);

      ctx.beginPath();
      ctx.moveTo(proj1.px, proj1.py);
      ctx.lineTo(proj2.px, proj2.py);
      ctx.stroke();
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Space Grotesk"';
    ctx.textAlign = 'center';
    const labelProj = project3D(xCenter, -90, 0, canvasHeight);
    ctx.fillText(label, labelProj.px, labelProj.py);

    ctx.fillStyle = color;
    const angleProj = project3D(xCenter, -110, 0, canvasHeight);
    ctx.fillText(angleDeg + "°", angleProj.px, angleProj.py);
  }, [project3D]);

  const drawTargetScreen = useCallback((
    ctx: CanvasRenderingContext2D,
    intensity: number,
    canvasHeight: number
  ) => {
    const radius = 80;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
      const y = radius * Math.cos(t);
      const z = radius * Math.sin(t);
      const proj = project3D(POS_SCREEN - 50, y, z, canvasHeight);

      if (t === 0) ctx.moveTo(proj.px, proj.py);
      else ctx.lineTo(proj.px, proj.py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const intensityFactor = intensity / 100;
    if (intensityFactor > 0.01) {
      const centerProj = project3D(POS_SCREEN - 50, 0, 0, canvasHeight);
      const glowGrad = ctx.createRadialGradient(
        centerProj.px, centerProj.py, 10,
        centerProj.px, centerProj.py, 80 * intensityFactor
      );
      glowGrad.addColorStop(0, `rgba(236, 72, 153, ${intensityFactor})`);
      glowGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');

      ctx.beginPath();
      ctx.arc(centerProj.px, centerProj.py, 80 * intensityFactor, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();
    }
  }, [project3D]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasHeight = canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    const startProj = project3D(POS_SOURCE, 0, 0, canvasHeight);
    const endProj = project3D(POS_SCREEN, 0, 0, canvasHeight);
    ctx.moveTo(startProj.px, startProj.py);
    ctx.lineTo(endProj.px, endProj.py);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    drawWave(ctx, POS_SOURCE, POS_POL1, MAX_AMPLITUDE, 0, '#fff', true, canvasHeight);

    drawFilter(ctx, POS_POL1, theta1, "POLARISATOR", "#6366f1", canvasHeight);

    const A1 = MAX_AMPLITUDE * 0.707;
    drawWave(ctx, POS_POL1, POS_POL2, A1, theta1, '#818cf8', false, canvasHeight);

    drawFilter(ctx, POS_POL2, theta2, "ANALISATOR", "#ec4899", canvasHeight);

    const deltaTheta = Math.abs(theta1 - theta2);
    const radDelta = (deltaTheta * Math.PI) / 180;
    const A2 = A1 * Math.abs(Math.cos(radDelta));

    if (A2 > 0.5) {
      drawWave(ctx, POS_POL2, POS_SCREEN - 50, A2, theta2, '#f472b6', false, canvasHeight);
    }

    drawTargetScreen(ctx, finalIntensity, canvasHeight);

    if (animate) {
      timePhaseRef.current += 0.15;
    }
  }, [theta1, theta2, animate, finalIntensity, drawWave, drawFilter, drawTargetScreen, project3D]);

  const updatePhysics = useCallback(() => {
    const deltaTheta = Math.abs(theta1 - theta2);
    const radDelta = (deltaTheta * Math.PI) / 180;
    const I1 = 50;
    const I2 = I1 * Math.pow(Math.cos(radDelta), 2);
    setFinalIntensity(I2);
  }, [theta1, theta2]);

  useEffect(() => {
    updatePhysics();
  }, [updatePhysics]);

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

  const handleReset = () => {
    setTheta1(0);
    setTheta2(45);
  };

  const deltaTheta = Math.abs(theta1 - theta2);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">FISIKA GELOMBANG (OPTIK FISIS)</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: POLARISASI CAHAYA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Penyaringan Gelombang Cahaya & Hukum Malus
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#6366f1] text-md transform rotate-2 z-30 uppercase">
            Panel Filter Polaroid
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-indigo-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-indigo-900 uppercase text-[10px]">Sudut Polarisator (<span className="italic">θ₁</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-indigo-600">{theta1}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={theta1}
                onChange={(e) => setTheta1(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Vertikal (0°)</span>
                <span>Horizontal (90°)</span>
                <span>Vertikal (180°)</span>
              </div>
            </div>

            <div className="bg-pink-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-pink-900 uppercase text-[10px]">Sudut Analisator (<span className="italic">θ₂</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-pink-600">{theta2}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={theta2}
                onChange={(e) => setTheta2(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Vertikal (0°)</span>
                <span>Horizontal (90°)</span>
                <span>Vertikal (180°)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Pengaturan Simulasi</label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input
                  type="checkbox"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                  className="w-4 h-4 accent-slate-800"
                />
                Jalankan Animasi Gelombang
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                RESET SUDUT
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-pink-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-pink-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">SENSOR INTENSITAS CAHAYA</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Intensitas Awal (<span className="italic">I₀</span>)</span>
                <span className="text-xl font-black text-white">100%</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-pink-600 transition-opacity duration-300"
                  style={{ opacity: finalIntensity / 100 * 0.2 }}
                />
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1 relative z-10">Intensitas Akhir (<span className="italic">I₂</span>)</span>
                <span className={`text-xl font-black relative z-10 ${finalIntensity < 1 ? 'text-red-500' : 'text-pink-400'}`}>
                  {finalIntensity.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-center flex flex-col items-center justify-center min-h-[50px] rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Beda Sudut (<span className="italic">Δθ = |θ₁ - θ₂|</span>):</span>
              <span className="text-sm font-black text-cyan-400 uppercase tracking-widest">{deltaTheta}°</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-[#0f172a] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden" style={{ backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.15) 2px, transparent 2px), linear-gradient(90deg, rgba(99, 102, 241, 0.15) 2px, transparent 2px)', backgroundSize: '40px 40px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Kamera Perekam Ruang 3D
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
        <h3 className="text-xl font-bold bg-indigo-500 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-white">
          Konsep Polarisasi Cahaya
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-cyan-400 border-b-2 border-slate-600 pb-1 mb-2">Cahaya Tak Terpolarisasi</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Cahaya alami (seperti dari matahari atau lampu bohlam) adalah gelombang transversal yang bergetar ke segala arah secara acak yang tegak lurus dengan arah rambatnya. Di kanvas, ini digambarkan sebagai kumpulan gelombang dengan berbagai sudut.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-indigo-400 border-b-2 border-slate-600 pb-1 mb-2">Filter Polarisator (I₁)</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Saat cahaya melewati filter pertama (Polarisator), hanya gelombang yang searah dengan celah filter yang diloloskan. Cahaya kini menjadi terpolarisasi linier. Intensitas cahaya selalu turun menjadi setengah dari awalnya (I₁ = ½ I₀).
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-pink-400 border-b-2 border-slate-600 pb-1 mb-2">Hukum Malus (I₂)</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Jika cahaya terpolarisasi melewati filter kedua (Analisator), intensitas akhirnya dihitung dengan Hukum Malus: I₂ = I₁ × cos²(Δθ). Jika celah kedua filter saling tegak lurus (Δθ = 90°), cahaya akan terblokir total (0%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}