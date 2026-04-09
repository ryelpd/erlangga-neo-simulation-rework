import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const MAX_PARTICLES = 200;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

function calculateSolubility(temp: number): number {
  return 180 + (temp * 1.5) + (Math.pow(temp, 2) * 0.015);
}

export default function KristalisasiGula(): ReactNode {
  const [totalSugar, setTotalSugar] = useState(250);
  const [temperature, setTemperature] = useState(80);
  const [hasSeed, setHasSeed] = useState(false);
  const [dissolvedSugar, setDissolvedSugar] = useState(250);
  const [crystalMass, setCrystalMass] = useState(0);
  const [saturationPercent, setSaturationPercent] = useState(0);
  const [status, setStatus] = useState('BELUM JENUH (UNSATURATED)');
  const [statusColor, setStatusColor] = useState('text-sky-300');
  const [statusBg, setStatusBg] = useState('bg-slate-800');
  const [statusBorder, setStatusBorder] = useState('border-sky-400');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.push({
        x: 250 + Math.random() * 300,
        y: 250 + Math.random() * 230,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 1 + Math.random() * 2
      });
    }
    particlesRef.current = particles;
  }, []);

  const updatePhysics = useCallback(() => {
    const maxSolubility = calculateSolubility(temperature);

    if (hasSeed) {
      if (dissolvedSugar > maxSolubility) {
        const crystallizationRate = (dissolvedSugar - maxSolubility) * 0.02;
        setCrystalMass(prev => prev + crystallizationRate);
        setDissolvedSugar(prev => prev - crystallizationRate);
      } else if (dissolvedSugar < maxSolubility && crystalMass > 0) {
        const dissolutionRate = Math.min((maxSolubility - dissolvedSugar) * 0.05, crystalMass);
        setCrystalMass(prev => prev - dissolutionRate);
        setDissolvedSugar(prev => prev + dissolutionRate);
      }
    } else {
      if (totalSugar <= maxSolubility) {
        setDissolvedSugar(totalSugar);
        setCrystalMass(0);
      } else {
        if (crystalMass === 0 && dissolvedSugar < totalSugar) {
          setCrystalMass(totalSugar - dissolvedSugar);
        } else if (dissolvedSugar < maxSolubility && crystalMass > 0) {
          const dissolutionRate = Math.min((maxSolubility - dissolvedSugar) * 0.1, crystalMass);
          setCrystalMass(prev => prev - dissolutionRate);
          setDissolvedSugar(prev => prev + dissolutionRate);
        }
      }
    }

    if (dissolvedSugar + crystalMass > totalSugar) {
      setDissolvedSugar(totalSugar - crystalMass);
    }

    const satPercent = Math.max(0, (dissolvedSugar / maxSolubility) * 100);
    setSaturationPercent(satPercent);

    // Update status UI
    const ratio = dissolvedSugar / maxSolubility;
    if (ratio > 1.05) {
      setStatus('LEWAT JENUH (SUPERSATURATED)' + (!hasSeed ? ' - TIDAK STABIL' : ''));
      setStatusColor('text-rose-300');
      setStatusBg('bg-rose-900');
      setStatusBorder('border-rose-400');
    } else if (ratio >= 0.95) {
      setStatus('TEPAT JENUH (SATURATED)');
      setStatusColor('text-amber-300');
      setStatusBg('bg-amber-900');
      setStatusBorder('border-amber-400');
    } else {
      setStatus('BELUM JENUH (UNSATURATED)');
      setStatusColor('text-sky-300');
      setStatusBg('bg-slate-800');
      setStatusBorder('border-sky-400');
    }

    // Update particles
    const targetParticles = Math.min(MAX_PARTICLES, (dissolvedSugar / 500) * MAX_PARTICLES);
    const speedMult = 0.2 + (temperature / 50);

    for (let i = 0; i < Math.min(targetParticles, particlesRef.current.length); i++) {
      const p = particlesRef.current[i];
      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;

      if (Math.random() < 0.1) {
        p.vx += (Math.random() - 0.5) * 0.5;
        p.vy += (Math.random() - 0.5) * 0.5;
      }

      if (p.x < 260) { p.x = 260; p.vx *= -1; }
      if (p.x > 540) { p.x = 540; p.vx *= -1; }
      if (p.y < 230) { p.y = 230; p.vy *= -1; }
      if (p.y > 480) { p.y = 480; p.vy *= -1; }

      if (hasSeed && satPercent > 100 && crystalMass > 0) {
        const dx = 400 - p.x;
        const dy = 360 - p.y;
        p.vx += dx * 0.001;
        p.vy += dy * 0.001;
      }
    }

    timeRef.current += 0.1;
  }, [temperature, totalSugar, hasSeed, dissolvedSugar, crystalMass]);

  const drawBeakerAndLiquid = useCallback((ctx: CanvasRenderingContext2D) => {
    const centerX = 400;

    // Beaker back rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(centerX, 150, 150, 15, 0, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Liquid clip
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX - 150, 220);
    ctx.lineTo(centerX + 150, 220);
    ctx.lineTo(centerX + 150, 480);
    ctx.arcTo(centerX + 150, 500, centerX - 150, 500, 20);
    ctx.arcTo(centerX - 150, 500, centerX - 150, 220, 20);
    ctx.closePath();
    ctx.clip();

    // Liquid color based on sugar concentration
    const sugarRatio = Math.min(1.0, dissolvedSugar / 500);
    const r = Math.floor(186 + sugarRatio * 50);
    const g = Math.floor(230 + sugarRatio * 10);
    const b = Math.floor(253 - sugarRatio * 100);

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
    ctx.beginPath();
    ctx.moveTo(0, 550);
    ctx.lineTo(0, 220);

    const waveAmp = temperature > 80 ? 3 : 1;
    for (let x = 0; x <= 800; x += 20) {
      ctx.lineTo(x, 220 + Math.sin(x * 0.05 + timeRef.current) * waveAmp);
    }
    ctx.lineTo(800, 550);
    ctx.fill();

    // Draw dissolved particles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const displayCount = Math.min(MAX_PARTICLES, (dissolvedSugar / 500) * MAX_PARTICLES);
    for (let i = 0; i < displayCount; i++) {
      const p = particlesRef.current[i];
      if (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw un-dissolved sludge
    if (!hasSeed && totalSugar > calculateSolubility(temperature) && crystalMass > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const sludgeHeight = (crystalMass / 400) * 50;
      ctx.beginPath();
      ctx.ellipse(centerX, 490, 140, 10 + sludgeHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Beaker front glass
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.ellipse(centerX, 150, 150, 15, 0, 0, Math.PI);
    ctx.moveTo(centerX - 150, 150);
    ctx.lineTo(centerX - 150, 480);
    ctx.arcTo(centerX - 150, 500, centerX + 150, 500, 20);
    ctx.arcTo(centerX + 150, 500, centerX + 150, 480, 20);
    ctx.lineTo(centerX + 150, 150);
    ctx.moveTo(centerX - 150, 150);
    ctx.quadraticCurveTo(centerX - 170, 140, centerX - 140, 135);
    ctx.stroke();

    // Measurement lines
    ctx.lineWidth = 2;
    for (let y = 200; y <= 400; y += 50) {
      ctx.beginPath();
      ctx.moveTo(centerX - 150, y);
      ctx.lineTo(centerX - 130, y);
      ctx.stroke();
    }

    // Glass reflections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(centerX - 120, 460);
    ctx.lineTo(centerX - 120, 200);
    ctx.stroke();
  }, [dissolvedSugar, temperature, hasSeed, totalSugar, crystalMass]);

  const drawCrystal = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!hasSeed) return;

    const centerX = 400;

    // String/stick
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(centerX, 50);
    ctx.lineTo(centerX, 420);
    ctx.stroke();

    // Crossbar
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(centerX - 160, 40, 320, 15);
    ctx.strokeRect(centerX - 160, 40, 320, 15);

    // Crystal formations
    const baseSize = 5;
    const growthFactor = crystalMass / 5;
    const totalCrystals = Math.max(1, Math.floor(crystalMass / 10) + 3);

    ctx.save();
    ctx.translate(centerX, 320);

    ctx.fillStyle = 'rgba(207, 250, 254, 0.8)';
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 2;

    for (let i = 0; i < totalCrystals; i++) {
      let scale = baseSize + (growthFactor * (1 - (i / totalCrystals) * 0.5));
      if (crystalMass === 0) scale = baseSize;

      const yPos = (i * 27) % 180 - 90;
      const xPos = Math.sin(i * 45) * scale * 0.5;
      const angle = i * 37;

      ctx.save();
      ctx.translate(xPos, yPos);
      ctx.rotate(angle * Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(0, -scale);
      ctx.lineTo(scale * 0.6, -scale * 0.5);
      ctx.lineTo(scale * 0.6, scale * 0.5);
      ctx.lineTo(0, scale);
      ctx.lineTo(-scale * 0.6, scale * 0.5);
      ctx.lineTo(-scale * 0.6, -scale * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -scale);
      ctx.lineTo(0, scale);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }, [hasSeed, crystalMass]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Heat plate
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(200, 500, 400, 30);

    // Heat glow
    if (temperature > 30) {
      const heatIntensity = (temperature - 30) / 70;
      const heatGlow = ctx.createLinearGradient(0, 500, 0, 480);
      heatGlow.addColorStop(0, `rgba(239, 68, 68, ${heatIntensity})`);
      heatGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = heatGlow;
      ctx.fillRect(200, 480, 400, 20);
    }

    drawBeakerAndLiquid(ctx);
    drawCrystal(ctx);
  }, [temperature, drawBeakerAndLiquid, drawCrystal]);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

  useEffect(() => {
    const loop = () => {
      updatePhysics();
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updatePhysics, draw]);

  const handleSeed = () => {
    if (!hasSeed) {
      setHasSeed(true);
    }
  };

  const handleReset = () => {
    setHasSeed(false);
    setCrystalMass(0);
    setDissolvedSugar(totalSugar);
    initParticles();
  };

  const tempColor = temperature < 30 ? '#2563eb' : temperature > 70 ? '#e11d48' : '#d97706';
  const heatOpacity = Math.max(0, Math.min(0.5, (temperature - 20) / 100));

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-cyan-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">KIMIA FISIK & MATERIAL</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: KRISTALISASI
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Proses Pembentukan Kristal Gula dari Larutan Lewat Jenuh
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#06b6d4] text-md transform rotate-2 z-30 uppercase">
            Panel Reaksi
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-slate-900 uppercase text-[10px]">Massa Gula Total</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-slate-700">{totalSugar} gram</span>
              </div>
              <input
                type="range"
                min="50"
                max="450"
                step="10"
                value={totalSugar}
                onChange={(e) => setTotalSugar(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-slate-300 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Sedikit (Encer)</span>
                <span>Sangat Banyak (Pekat)</span>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-900 uppercase text-[10px]">Suhu Larutan (°C)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black" style={{ color: tempColor }}>{temperature} °C</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span className="text-blue-600">Dingin (0°C)</span>
                <span className="text-amber-600">Hangat</span>
                <span className="text-rose-600">Mendidih (100°C)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button
                onClick={handleSeed}
                disabled={hasSeed}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#0891b2] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${hasSeed ? 'bg-slate-300 hover:bg-slate-200' : 'bg-cyan-400 hover:bg-cyan-300'}`}
              >
                {hasSeed ? 'BENIH KRISTAL AKTIF' : 'MASUKKAN BENIH KRISTAL (NUKLEASI)'}
              </button>
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                BUAT LARUTAN BARU (RESET)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-cyan-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">TELEMETRI KELARUTAN (Per 100mL)</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-sky-400 mb-1">Tingkat Kejenuhan</span>
                <span className="text-xl font-black text-white">{saturationPercent.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-emerald-400 mb-1">Massa Kristal Padat</span>
                <span className="text-xl font-black text-white">{crystalMass.toFixed(1)} g</span>
              </div>
            </div>

            <div className={`${statusBg} p-3 border-2 border-dashed ${statusBorder} text-center flex flex-col items-center justify-center min-h-[60px] transition-colors duration-300 rounded`}>
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Kondisi Larutan:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${statusColor}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden"
            style={{
              backgroundColor: heatOpacity > 0 ? `rgba(244, 63, 94, ${heatOpacity})` : '#f0fdfa',
              backgroundImage: 'radial-gradient(rgba(20, 184, 166, 0.2) 2px, transparent 2px)',
              backgroundSize: '40px 40px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-cyan-700 font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Kamera Gelas Kimia (Beaker)
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
        <h3 className="text-xl font-bold bg-cyan-400 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Prinsip Pembentukan Kristal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-rose-400 border-b-2 border-slate-600 pb-1 mb-2">1. Suhu & Kelarutan (Solubility)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Air panas dapat melarutkan gula jauh lebih banyak daripada air dingin. Saat Anda memanaskan larutan dan menambahkan gula dalam jumlah besar, semua gula akan terlarut berkat energi kinetik air yang tinggi.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-amber-400 border-b-2 border-slate-600 pb-1 mb-2">2. Larutan Lewat Jenuh</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Ketika larutan panas tersebut <b>didinginkan secara perlahan</b>, kapasitas air untuk menahan gula menurun drastis. Gula yang berlebih tersebut kini berada dalam kondisi "Lewat Jenuh" (Supersaturated), kondisi yang sangat tidak stabil dan ingin kembali menjadi padat.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-cyan-400 border-b-2 border-slate-600 pb-1 mb-2">3. Nukleasi & Pertumbuhan</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Molekul gula berlebih membutuhkan tempat untuk berikatan (Nukleasi). Memasukkan benda bertekstur atau <b>Benih Kristal</b> ke dalam larutan lewat jenuh akan memicu molekul gula untuk menempel dan menumpuk, membentuk struktur kristal geometris yang membesar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}