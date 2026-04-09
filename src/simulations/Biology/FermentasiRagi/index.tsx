import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const MAX_BUBBLES = 150;

interface Bubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  seed: number;
}

export default function FermentasiRagi(): ReactNode {
  const [initialSugar, setInitialSugar] = useState(50);
  const [currentSugar, setCurrentSugar] = useState(50);
  const [temperature, setTemperature] = useState(30);
  const [co2Volume, setCo2Volume] = useState(0);
  const [reactionRate, setReactionRate] = useState(0);
  const [isYeastAdded, setIsYeastAdded] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [status, setStatus] = useState('MENUNGGU RAGI DITAMBAHKAN');
  const [statusColor, setStatusColor] = useState('text-slate-300');
  const [statusBg, setStatusBg] = useState('bg-slate-800');
  const [statusBorder, setStatusBorder] = useState('border-slate-500');
  const [showDeadAlert, setShowDeadAlert] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const bubblesRef = useRef<Bubble[]>([]);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);
  const balloonScaleRef = useRef(0);

  const spawnBubble = useCallback(() => {
    const bx = 300 + Math.random() * 200;
    bubblesRef.current.push({
      x: bx,
      y: 470 + Math.random() * 10,
      radius: 2 + Math.random() * 4,
      speed: 1 + Math.random() * 2 + (temperature / 20),
      seed: Math.random() * 100
    });
  }, [temperature]);

  const updatePhysics = useCallback(() => {
    let rate = 0;
    let dead = isDead;

    if (isYeastAdded && !dead) {
      if (temperature >= 50) {
        dead = true;
        rate = 0;
        setShowDeadAlert(true);
      } else if (currentSugar > 0) {
        if (temperature > 5) {
          const optimumDiff = Math.abs(temperature - 35);
          const tempFactor = Math.max(0, 1 - (optimumDiff / 25));
          rate = tempFactor * 0.8;
        } else {
          rate = 0;
        }
      } else {
        rate = 0;
      }
    }

    setIsDead(dead);
    setReactionRate(rate);

    if (rate > 0) {
      setCurrentSugar(prev => {
        const newSugar = prev - rate * 0.05;
        return newSugar < 0 ? 0 : newSugar;
      });
      setCo2Volume(prev => prev + rate * 0.3);

      if (Math.random() < rate * 0.5 && bubblesRef.current.length < MAX_BUBBLES) {
        spawnBubble();
      }
    }

    // Update bubbles
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i];
      b.y -= b.speed;
      b.x += Math.sin(timeRef.current + b.seed) * 1.5;

      if (b.y <= 310 + Math.sin(b.x * 0.05 + timeRef.current) * 3) {
        bubblesRef.current.splice(i, 1);
      }
    }

    // Balloon scale
    balloonScaleRef.current = Math.min(1.5, co2Volume / 100);

    // Update status UI
    if (!isYeastAdded) {
      setStatus('MENUNGGU RAGI DITAMBAHKAN');
      setStatusColor('text-slate-300');
      setStatusBg('bg-slate-800');
      setStatusBorder('border-slate-500');
    } else if (dead) {
      setStatus('RAGI MATI (ENZIM RUSAK)');
      setStatusColor('text-rose-200');
      setStatusBg('bg-rose-900');
      setStatusBorder('border-rose-500');
    } else if (currentSugar <= 0) {
      setStatus('FERMENTASI BERHENTI (GULA HABIS)');
      setStatusColor('text-yellow-300');
      setStatusBg('bg-yellow-900');
      setStatusBorder('border-yellow-500');
    } else if (rate < 0.1) {
      setStatus('RAGI DORMAN (TERLALU DINGIN)');
      setStatusColor('text-sky-300');
      setStatusBg('bg-sky-900');
      setStatusBorder('border-sky-400');
    } else {
      setStatus('FERMENTASI AKTIF');
      setStatusColor('text-emerald-400');
      setStatusBg('bg-emerald-900');
      setStatusBorder('border-emerald-400');
    }

    timeRef.current += 0.1;
  }, [isYeastAdded, isDead, currentSugar, temperature, co2Volume, spawnBubble]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = 400;
    const attachY = 150;
    const currentRadius = 25 + (balloonScaleRef.current * 100);
    const balloonCenterY = attachY - currentRadius - (balloonScaleRef.current * 20);
    const wobble = Math.sin(timeRef.current * 3) * (reactionRate * 2);

    // Draw Balloon
    ctx.save();
    ctx.translate(centerX, attachY);
    ctx.rotate((wobble * Math.PI) / 180);
    ctx.translate(-centerX, -attachY);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(centerX - 42, attachY + 10);
    ctx.lineTo(centerX + 42, attachY + 10);
    ctx.lineTo(centerX + 35, attachY - 10);
    ctx.bezierCurveTo(
      centerX + currentRadius * 1.5, balloonCenterY,
      centerX - currentRadius * 1.5, balloonCenterY,
      centerX - 35, attachY - 10
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (balloonScaleRef.current > 0.1) {
      ctx.beginPath();
      ctx.ellipse(
        centerX - currentRadius * 0.3,
        balloonCenterY - currentRadius * 0.3,
        currentRadius * 0.2,
        currentRadius * 0.4,
        Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    }

    ctx.restore();

    // Draw Flask and Liquid
    const liqLevel = 310;
    const liqColor = isDead ? '#b45309' : isYeastAdded ? '#fcd34d' : '#fef08a';

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX - 35, 230);
    ctx.lineTo(centerX + 35, 230);
    ctx.lineTo(centerX + 140, 480);
    ctx.arcTo(centerX + 140, 490, centerX - 140, 490, 15);
    ctx.arcTo(centerX - 140, 490, centerX - 35, 230, 15);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = liqColor;
    ctx.beginPath();
    ctx.moveTo(0, 550);
    ctx.lineTo(0, liqLevel);

    const waveAmp = isYeastAdded && !isDead ? reactionRate * 3 : 1;
    for (let x = 0; x <= 800; x += 10) {
      ctx.lineTo(x, liqLevel + Math.sin(x * 0.05 + timeRef.current * 2) * waveAmp);
    }
    ctx.lineTo(800, 550);
    ctx.fill();

    // Bubbles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1;
    for (const b of bubblesRef.current) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Particles
    const particlesCount = isYeastAdded ? (currentSugar > 0 ? 50 : 20) : (initialSugar / 2);
    ctx.fillStyle = isYeastAdded ? (isDead ? '#78350f' : '#ca8a04') : '#ffffff';
    for (let i = 0; i < particlesCount; i++) {
      const px = 270 + ((i * 137) % 260);
      const py = 350 + ((i * 97) % 130) + Math.sin(timeRef.current + i) * 5;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Flask outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX - 40, 150);
    ctx.lineTo(centerX + 40, 150);
    ctx.moveTo(centerX - 35, 150);
    ctx.lineTo(centerX - 35, 230);
    ctx.moveTo(centerX + 35, 150);
    ctx.lineTo(centerX + 35, 230);
    ctx.beginPath();
    ctx.moveTo(centerX - 35, 230);
    ctx.lineTo(centerX - 140, 480);
    ctx.quadraticCurveTo(centerX - 145, 490, centerX, 490);
    ctx.quadraticCurveTo(centerX + 145, 490, centerX + 140, 480);
    ctx.lineTo(centerX + 35, 230);
    ctx.stroke();

    // Glass reflections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(centerX - 110, 420);
    ctx.lineTo(centerX - 50, 270);
    ctx.stroke();

    // Lab table
    ctx.fillStyle = '#334155';
    ctx.fillRect(100, 490, 600, 20);
    ctx.fillStyle = '#475569';
    ctx.fillRect(100, 510, 600, 40);
  }, [isDead, isYeastAdded, reactionRate, currentSugar, initialSugar]);

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

  const handleStart = () => {
    if (!isYeastAdded) {
      setIsYeastAdded(true);
    }
  };

  const handleReset = () => {
    setIsYeastAdded(false);
    setIsDead(false);
    setCo2Volume(0);
    setCurrentSugar(initialSugar);
    bubblesRef.current = [];
    setShowDeadAlert(false);
  };

  const tempColor = temperature < 15 ? '#2563eb' : temperature > 45 ? '#e11d48' : '#16a34a';

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-amber-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">BIOLOGI & BIOKIMIA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: FERMENTASI RAGI
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Simulasi Respirasi Anaerob & Produksi Gas Karbon Dioksida (CO₂)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f59e0b] text-md transform rotate-2 z-30 uppercase">
            Panel Reaksi
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-yellow-900 uppercase text-[10px]">Konsentrasi Gula (Substrat)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-yellow-700">{initialSugar} gram</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={initialSugar}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setInitialSugar(val);
                  if (!isYeastAdded) setCurrentSugar(val);
                }}
                disabled={isYeastAdded}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-yellow-300 [&::-webkit-slider-thumb]:rounded-full disabled:opacity-50"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Sedikit</span>
                <span>Banyak</span>
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
                max="65"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span className="text-blue-600">Dingin</span>
                <span className="text-emerald-600">Optimal (~35)</span>
                <span className="text-rose-600">Panas (&gt;50)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button
                onClick={handleStart}
                disabled={isYeastAdded}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#064e3b] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${isYeastAdded ? 'bg-slate-300 hover:bg-slate-200' : 'bg-emerald-400 hover:bg-emerald-300'}`}
              >
                {isYeastAdded ? 'RAGI SEDANG BEKERJA' : 'MASUKKAN RAGI (START)'}
              </button>
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                BERSIHKAN LABU (RESET)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-amber-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA TELEMETRI REAKSI</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-sky-400 mb-1">Volume CO₂</span>
                <span className="text-xl font-black text-white">{co2Volume.toFixed(1)} mL</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-emerald-400 mb-1">Laju Fermentasi</span>
                <span className="text-xl font-black text-white">{(reactionRate * 10).toFixed(1)} mL/s</span>
              </div>
            </div>

            <div className={`${statusBg} p-3 border-2 border-dashed ${statusBorder} text-center flex flex-col items-center justify-center min-h-[60px] transition-colors duration-300 rounded`}>
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Ragi:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${statusColor} ${isDead ? 'glitch-text' : ''}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden"
            style={{
              backgroundColor: '#fffbeb',
              backgroundImage: 'radial-gradient(rgba(217, 119, 6, 0.2) 2px, transparent 2px)',
              backgroundSize: '40px 40px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-amber-700 font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Meja Praktikum Biologi
            </span>

            {showDeadAlert && (
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white font-black px-6 py-2 border-4 border-black shadow-[6px_6px_0px_#000] text-xl uppercase z-40 tracking-widest pointer-events-none text-center animate-pulse">
                ENZIM TERDENATURASI (MATI)
              </div>
            )}

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
        <h3 className="text-xl font-bold bg-amber-500 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Prinsip Fermentasi Alkohol
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-yellow-400 border-b-2 border-slate-600 pb-1 mb-2">1. Glukosa sebagai Substrat</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Ragi (yeast) membutuhkan makanan berupa gula (glukosa/sukrosa) untuk menghasilkan energi. Melalui proses <b>Glikolisis</b> dalam kondisi tanpa oksigen (anaerob), ragi memecah molekul gula ini. Jika gula habis, reaksi akan otomatis berhenti.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">2. Produk: Gas CO₂ & Alkohol</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Hasil dari fermentasi ini adalah Etanol (alkohol) yang larut dalam air, dan gas <b>Karbon Dioksida (CO₂)</b>. Gelembung gas CO₂ yang dilepaskan akan naik ke atas labu dan membuat balon karet mengembang.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-rose-400 border-b-2 border-slate-600 pb-1 mb-2">3. Pengaruh Suhu (Sifat Enzim)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Reaksi ini dikatalisis oleh enzim (Zimase). Di suhu dingin, enzim bekerja lambat (dorman). Di suhu optimal (~35°C), enzim bekerja maksimal. Namun jika suhu terlalu panas (&gt;50°C), struktur protein enzim akan <b>rusak (Denaturasi)</b> secara permanen dan ragi mati.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}