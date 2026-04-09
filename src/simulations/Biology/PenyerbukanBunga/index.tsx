import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

interface Flower {
  id: number;
  x: number;
  y: number;
  color: string;
  isPollinated: boolean;
  hasBee: boolean;
  swayOffset: number;
}

interface Bee {
  x: number;
  y: number;
  vx: number;
  vy: number;
  target: Flower | null;
  state: number;
  waitTimer: number;
  hasPollen: boolean;
  pollenSourceId: number;
  wobbleOffset: number;
}

interface PollenParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const NUM_FLOWERS = 6;
const FLOWER_COLORS = ['#f472b6', '#c084fc', '#38bdf8', '#f87171', '#a78bfa', '#fcd34d'];

export default function PenyerbukanBunga(): ReactNode {
  const [numBees, setNumBees] = useState(3);
  const [windSpeed, setWindSpeed] = useState(0);
  const [showTrails, setShowTrails] = useState(true);
  const [pollinatedCount, setPollinatedCount] = useState(0);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [status, setStatus] = useState('LEBAH MENCARI BUNGA MEKAR...');
  const [statusColor, setStatusColor] = useState('text-slate-300');
  const [statusBg, setStatusBg] = useState('bg-slate-800');
  const [statusBorder, setStatusBorder] = useState('border-slate-500');
  const [showSuccess, setShowSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowersRef = useRef<Flower[]>([]);
  const beesRef = useRef<Bee[]>([]);
  const pollenParticlesRef = useRef<PollenParticle[]>([]);
  const timeRef = useRef(0);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const createFlower = useCallback((id: number, spacing: number): Flower => {
    const fX = spacing * (id + 1) + (Math.random() - 0.5) * 30;
    const fY = 350 + Math.random() * 100;
    return {
      id,
      x: fX,
      y: fY,
      color: FLOWER_COLORS[id % FLOWER_COLORS.length],
      isPollinated: false,
      hasBee: false,
      swayOffset: Math.random() * Math.PI * 2
    };
  }, []);

  const createBee = useCallback((): Bee => ({
    x: Math.random() * 800,
    y: Math.random() * 200,
    vx: 0,
    vy: 0,
    target: null,
    state: 0,
    waitTimer: 0,
    hasPollen: false,
    pollenSourceId: -1,
    wobbleOffset: Math.random() * Math.PI * 2
  }), []);

  const initSimulation = useCallback(() => {
    flowersRef.current = [];
    beesRef.current = [];
    pollenParticlesRef.current = [];
    setPollinatedCount(0);
    setTotalTransfers(0);
    setShowSuccess(false);

    const spacing = 800 / (NUM_FLOWERS + 1);
    for (let i = 0; i < NUM_FLOWERS; i++) {
      flowersRef.current.push(createFlower(i, spacing));
    }

    for (let i = 0; i < numBees; i++) {
      beesRef.current.push(createBee());
    }
  }, [numBees, createFlower, createBee]);

  const spawnPollen = useCallback((x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      pollenParticlesRef.current.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1.0
      });
    }
  }, []);

  const updateBee = useCallback((bee: Bee) => {
    if (bee.state === 0 || bee.state === 2) {
      if (!bee.target) {
        const available = flowersRef.current.filter(f => !f.hasBee);
        
        if (bee.state === 2) {
          const validTargets = available.filter(f => !f.isPollinated && f.id !== bee.pollenSourceId);
          if (validTargets.length > 0) {
            bee.target = validTargets[Math.floor(Math.random() * validTargets.length)];
          } else if (available.length > 0) {
            bee.target = available[Math.floor(Math.random() * available.length)];
          }
        } else if (available.length > 0) {
          bee.target = available[Math.floor(Math.random() * available.length)];
        }

        if (bee.target) bee.target.hasBee = true;
      }

      if (bee.target) {
        const windSway = Math.sin(timeRef.current * 2 + bee.target.swayOffset) * (windSpeed * 3);
        const tx = bee.target.x + windSway;
        const ty = bee.target.y - 10;

        const dx = tx - bee.x;
        const dy = ty - bee.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 5) {
          bee.state = 1;
          bee.waitTimer = 60;
          bee.vx = 0;
          bee.vy = 0;
        } else {
          const speed = 3;
          bee.vx = (dx / dist) * speed;
          bee.vy = (dy / dist) * speed;
          bee.vx += windSpeed * 0.5;
          bee.vy += Math.sin(timeRef.current * 10 + bee.wobbleOffset) * 1.5;
        }
      } else {
        bee.vx = Math.sin(timeRef.current + bee.wobbleOffset) * 2;
        bee.vy = Math.cos(timeRef.current + bee.wobbleOffset) * 1;
      }
    } else if (bee.state === 1) {
      bee.waitTimer--;
      
      if (bee.target) {
        const windSway = Math.sin(timeRef.current * 2 + bee.target.swayOffset) * (windSpeed * 3);
        bee.x = bee.target.x + windSway;
        bee.y = bee.target.y - 10;
      }

      if (bee.waitTimer <= 0) {
        if (bee.target) {
          bee.target.hasBee = false;
          
          if (bee.hasPollen) {
            if (!bee.target.isPollinated && bee.target.id !== bee.pollenSourceId) {
              bee.target.isPollinated = true;
              setPollinatedCount(prev => prev + 1);
              setTotalTransfers(prev => prev + 1);
              spawnPollen(bee.x, bee.y, 10);
            }
            bee.hasPollen = false;
            bee.pollenSourceId = -1;
            bee.state = 0;
          } else {
            bee.hasPollen = true;
            bee.pollenSourceId = bee.target.id;
            bee.state = 2;
          }
          bee.target = null;
        }
        bee.vy = -4;
      }
    }

    if (bee.state !== 1) {
      bee.x += bee.vx;
      bee.y += bee.vy;

      if (bee.x < 0) bee.x = 800;
      if (bee.x > 800) bee.x = 0;
      if (bee.y < 0) bee.y = 0;
      if (bee.y > 550) bee.y = 550;
    }

    if (bee.hasPollen && showTrails && bee.state === 2) {
      if (Math.random() < 0.1 + (windSpeed * 0.05)) {
        spawnPollen(bee.x, bee.y, 1);
      }
    }
  }, [windSpeed, showTrails, spawnPollen]);

  const updatePhysics = useCallback(() => {
    timeRef.current += 0.05;

    // Adjust bee population
    while (beesRef.current.length < numBees) {
      beesRef.current.push(createBee());
    }
    while (beesRef.current.length > numBees) {
      beesRef.current.pop();
    }

    // Update bees
    for (const bee of beesRef.current) {
      updateBee(bee);
    }

    // Update pollen particles
    for (let i = pollenParticlesRef.current.length - 1; i >= 0; i--) {
      const p = pollenParticlesRef.current[i];
      p.x += p.vx + (windSpeed * 1.5);
      p.y += p.vy + 1;
      p.life -= 0.01;
      
      if (p.life <= 0 || p.y > 550) {
        pollenParticlesRef.current.splice(i, 1);
      }
    }

    // Update status
    const currentPollinated = flowersRef.current.filter(f => f.isPollinated).length;
    if (currentPollinated === NUM_FLOWERS) {
      setShowSuccess(true);
      setStatus('TAMAN BERKEMBANG BIAK!');
      setStatusColor('text-emerald-400');
      setStatusBg('bg-emerald-900');
      setStatusBorder('border-emerald-500');
    } else {
      const carryingBees = beesRef.current.filter(b => b.hasPollen).length;
      if (carryingBees > 0) {
        setStatus('LEBAH MEMBAWA SERBUK SARI...');
        setStatusColor('text-yellow-300');
        setStatusBg('bg-yellow-900');
        setStatusBorder('border-yellow-500');
      } else {
        setStatus('LEBAH MENCARI BUNGA MEKAR...');
        setStatusColor('text-slate-300');
        setStatusBg('bg-slate-800');
        setStatusBorder('border-slate-500');
      }
    }
  }, [numBees, windSpeed, showTrails, updateBee, createBee]);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Debug: log flower count
    // console.log('Drawing flowers:', flowersRef.current.length);

    // Sun
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(700, 80, 50, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const cloudOffset = (timeRef.current * (windSpeed + 1) * 10) % 1000;

    ctx.save();
    ctx.translate(200 + cloudOffset, 100);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.arc(30, -15, 35, 0, Math.PI * 2);
    ctx.arc(60, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(-200 + cloudOffset * 1.5, 150);
    ctx.scale(0.7, 0.7);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.arc(30, -15, 35, 0, Math.PI * 2);
    ctx.arc(60, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ground
    ctx.fillStyle = '#86efac';
    ctx.fillRect(0, 450, canvas.width, 100);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 470, canvas.width, 80);

    // Wind lines
    if (windSpeed > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < windSpeed * 3; i++) {
        const wx = (timeRef.current * windSpeed * 20 + i * 150) % 1000 - 100;
        const wy = 100 + (i * 40) % 300;
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + 40 + windSpeed * 10, wy);
      }
      ctx.stroke();
    }

    // Draw flowers
    for (const flower of flowersRef.current) {
      const windSway = Math.sin(timeRef.current * 2 + flower.swayOffset) * (windSpeed * 3);
      const topX = flower.x + windSway;
      const topY = flower.y;

      // Stem
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(flower.x, 550);
      ctx.quadraticCurveTo(flower.x, flower.y + 50, topX, topY);
      ctx.stroke();

      // Leaves
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(flower.x + 15, flower.y + 60, 20, 10, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(flower.x - 15, flower.y + 80, 20, 10, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Petals
      ctx.fillStyle = flower.color;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + (timeRef.current * 0.2);
        ctx.beginPath();
        ctx.ellipse(
          topX + Math.cos(angle) * 15,
          topY + Math.sin(angle) * 15,
          20, 10, angle, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
      }

      // Center
      ctx.beginPath();
      ctx.arc(topX, topY, 12, 0, Math.PI * 2);

      if (flower.isPollinated) {
        ctx.fillStyle = '#ea580c';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#431407';
        ctx.beginPath();
        ctx.arc(topX - 3, topY - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(topX + 3, topY + 3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Checkmark
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✓', topX, topY - 30);
      } else {
        ctx.fillStyle = '#fde047';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#a16207';
        for (let i = 0; i < 5; i++) {
          const pa = (i * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.arc(topX + Math.cos(pa) * 5, topY + Math.sin(pa) * 5, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw pollen particles
    ctx.fillStyle = '#fde047';
    for (const p of pollenParticlesRef.current) {
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw bees
    for (const bee of beesRef.current) {
      ctx.save();
      ctx.translate(bee.x, bee.y);

      if (bee.vx < 0) ctx.scale(-1, 1);

      // Pollen payload
      if (bee.hasPollen) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Body
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(5, 0, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stripes
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(2, -7);
      ctx.lineTo(2, 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, -6);
      ctx.lineTo(8, 6);
      ctx.stroke();

      // Head
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-8, -2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      const flap = bee.state === 1 ? 0 : Math.sin(timeRef.current * 30) * 10;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;

      ctx.save();
      ctx.translate(0, -5);
      ctx.rotate(flap * Math.PI / 180);
      ctx.beginPath();
      ctx.ellipse(5, -8, 8, 4, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
  }, [windSpeed, showTrails]);

  useEffect(() => {
    // Initialize on mount
    initSimulation();

    const loop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      updatePhysics();
      drawScene();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleReset = () => {
    initSimulation();
  };

  const windLabels = ['Tenang', 'Sepoi-sepoi', 'Sedang', 'Cukup Kencang', 'Kencang', 'Sangat Kencang'];
  const valTrailsColor = showTrails ? 'text-yellow-600' : 'text-slate-500';

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-900 p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-200 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 w-full relative overflow-hidden">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] font-bold text-sm transform -rotate-3 z-10">BIOLOGI & EKOLOGI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight relative z-10">
          LAB VIRTUAL: PENYERBUKAN
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] relative z-10">
          Simulasi Peran Lebah dalam Transfer Serbuk Sari Bunga
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-slate-900 shadow-[4px_4px_0px_#22c55e] text-md transform rotate-2 z-30 uppercase">
            Panel Lingkungan
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-yellow-50 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-yellow-900 uppercase text-[10px]">Populasi Lebah</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-slate-900 text-yellow-700 rounded">{numBees} Ekor</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={numBees}
                onChange={(e) => setNumBees(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#0f172a] [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Sedikit</span>
                <span>Koloni Padat</span>
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-900 uppercase text-[10px]">Kecepatan Angin</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-slate-900 text-sky-700 rounded">{windLabels[windSpeed]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={windSpeed}
                onChange={(e) => setWindSpeed(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#0f172a] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Tenang</span>
                <span className="text-sky-600">Berangin Kencang</span>
              </div>
            </div>

            <div className="bg-slate-100 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-slate-900 uppercase text-[10px]">Jalur Serbuk Sari</span>
                <span className={`font-mono font-black text-sm bg-white px-2 border-2 border-slate-900 rounded ${valTrailsColor}`}>{showTrails ? 'AKTIF' : 'NONAKTIF'}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrails}
                  onChange={(e) => setShowTrails(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-yellow-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-900 after:border-4 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-yellow-500 border-4 border-slate-900"></div>
              </label>
              <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase leading-tight">Menampilkan partikel serbuk sari yang jatuh saat lebah terbang.</p>
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-slate-900 pt-4 mt-2">
              <button
                onClick={handleReset}
                className="border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                RESET TAMAN (MUSIM BARU)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-yellow-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA REPRODUKSI TANAMAN</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-emerald-400 mb-1">Bunga Terserbuki</span>
                <span className="text-2xl font-black text-white">{pollinatedCount} / {NUM_FLOWERS}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center relative overflow-hidden">
                <span className="text-[9px] font-bold uppercase text-yellow-400 mb-1">Transfer Berhasil</span>
                <span className="text-2xl font-black text-yellow-400 relative z-10">{totalTransfers}</span>
              </div>
            </div>

            <div className={`${statusBg} p-3 border-2 border-dashed ${statusBorder} rounded text-center flex flex-col items-center justify-center min-h-[48px] transition-colors duration-300`}>
              <span className={`text-xs font-black uppercase tracking-widest ${statusColor}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="border-8 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-0 relative flex flex-col items-center w-full h-[600px] lg:h-auto overflow-hidden"
            style={{
              backgroundColor: '#f0fdf4',
              backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-slate-900 font-black px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] text-[10px] transform -rotate-1 z-40 uppercase rounded">
              Kamera Habitat
            </span>

            {showSuccess && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-black font-black px-6 py-3 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] text-xl uppercase z-40 tracking-widest text-center rounded">
                🌻 SEMUA BUNGA TERSERBUKI! 🌻
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              className="w-full h-full block object-cover transition-all duration-700"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-emerald-400 inline-block px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] mb-6 transform -rotate-1 uppercase text-black rounded">
          Mekanisme Penyerbukan (Polinasi)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-yellow-400 border-b-2 border-slate-600 pb-2 mb-3">1. Agen Penyerbuk</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Bunga tidak bisa bergerak untuk bereproduksi. Mereka mengandalkan agen luar (vektor) seperti angin, atau hewan (lebah, kupu-kupu, burung). Bunga memikat hewan ini dengan warna cerah dan nektar yang manis sebagai imbalan.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-amber-400 border-b-2 border-slate-600 pb-2 mb-3">2. Menempelnya Serbuk Sari</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Saat lebah hinggap untuk minum nektar, bulu-bulu di tubuhnya tanpa sengaja menyikat <b>Benang Sari (Stamen)</b> yang berisi Serbuk Sari (Pollen) jantan. Serbuk sari yang lengket ini menempel kuat di kaki dan perut lebah.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-emerald-400 border-b-2 border-slate-600 pb-2 mb-3">3. Transfer & Pembuahan</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Ketika lebah tersebut terbang dan hinggap di bunga <i>lain</i> dari spesies yang sama, serbuk sari tadi akan berjatuhan dan menempel pada <b>Putik (Pistil)</b> betina. Ini memicu pembuahan, yang kelak akan menghasilkan buah dan biji baru.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}