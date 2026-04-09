import { useState, useRef, useEffect, useCallback } from 'react';

interface Virus {
  x: number;
  y: number;
  r: number;
  isDead: boolean;
  neutralized: boolean;
  vx: number;
  vy: number;
  replicationTimer: number;
  rot: number;
}

interface Macrophage {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  wobble: number;
}

interface BCell {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  shootTimer: number;
}

interface Antibody {
  x: number;
  y: number;
  r: number;
  speed: number;
  vx: number;
  vy: number;
  life: number;
}

export default function SistemImun() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [health, setHealth] = useState(100);
  const [isImmune, setIsImmune] = useState(false);
  const [learningProgress, setLearningProgress] = useState(0);
  const [virusCount, setVirusCount] = useState(0);
  const [antibodyCount, setAntibodyCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const virusesRef = useRef<Virus[]>([]);
  const macrophagesRef = useRef<Macrophage[]>([]);
  const bCellsRef = useRef<BCell[]>([]);
  const antibodiesRef = useRef<Antibody[]>([]);
  const virusesEatenRef = useRef(0);
  const animFrameIdRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef(0);
  const healthRef = useRef(100);
  const learningProgressRef = useRef(0);
  const isImmuneRef = useRef(false);

  useEffect(() => {
    healthRef.current = health;
  }, [health]);

  useEffect(() => {
    learningProgressRef.current = learningProgress;
  }, [learningProgress]);

  useEffect(() => {
    isImmuneRef.current = isImmune;
  }, [isImmune]);

  const createVirus = useCallback((x: number, y: number, isDead: boolean = false): Virus => ({
    x,
    y,
    r: 8,
    isDead,
    neutralized: false,
    vx: (Math.random() - 0.5) * 60,
    vy: (Math.random() - 0.5) * 60,
    replicationTimer: 0,
    rot: Math.random() * Math.PI * 2
  }), []);

  const createMacrophage = useCallback((canvasWidth: number, canvasHeight: number): Macrophage => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    r: 25,
    vx: (Math.random() - 0.5) * 40,
    vy: (Math.random() - 0.5) * 40,
    wobble: Math.random() * Math.PI * 2
  }), []);

  const createBCell = useCallback((canvasWidth: number, canvasHeight: number): BCell => ({
    x: canvasWidth / 2 + (Math.random() - 0.5) * 100,
    y: canvasHeight / 2 + (Math.random() - 0.5) * 100,
    r: 15,
    vx: (Math.random() - 0.5) * 20,
    vy: (Math.random() - 0.5) * 20,
    shootTimer: 0
  }), []);

  const createAntibody = useCallback((x: number, y: number): Antibody => ({
    x,
    y,
    r: 6,
    speed: 250,
    vx: (Math.random() - 0.5),
    vy: (Math.random() - 0.5),
    life: 5.0
  }), []);

  const initSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    virusesRef.current = [];
    macrophagesRef.current = [];
    bCellsRef.current = [];
    antibodiesRef.current = [];
    virusesEatenRef.current = 0;
    
    setHealth(100);
    healthRef.current = 100;
    setIsImmune(false);
    isImmuneRef.current = false;
    setLearningProgress(0);
    learningProgressRef.current = 0;

    for (let i = 0; i < 3; i++) {
      macrophagesRef.current.push(createMacrophage(canvas.width, canvas.height));
    }
  }, [createMacrophage]);

  const drawVirus = useCallback((ctx: CanvasRenderingContext2D, v: Virus) => {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.rot);

    if (v.isDead) {
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#64748b';
    } else if (v.neutralized) {
      ctx.fillStyle = '#fca5a5';
      ctx.strokeStyle = '#ef4444';
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#7f1d1d';
    }

    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const outerX = Math.cos(angle) * (v.r + 4);
      const outerY = Math.sin(angle) * (v.r + 4);
      const innerX = Math.cos(angle + 0.4) * v.r;
      const innerY = Math.sin(angle + 0.4) * v.r;
      if (i === 0) ctx.moveTo(outerX, outerY);
      else ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawMacrophage = useCallback((ctx: CanvasRenderingContext2D, m: Macrophage) => {
    ctx.save();
    ctx.translate(m.x, m.y);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (let i = 0; i < Math.PI * 2; i += 0.5) {
      const radius = m.r + Math.sin(m.wobble + i * 3) * 3;
      if (i === 0) ctx.moveTo(radius, 0);
      else ctx.lineTo(Math.cos(i) * radius, Math.sin(i) * radius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-5, -5, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();

    ctx.restore();
  }, []);

  const drawBCell = useCallback((ctx: CanvasRenderingContext2D, b: BCell) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -b.r); ctx.lineTo(0, -b.r - 5); ctx.lineTo(-4, -b.r - 9);
    ctx.moveTo(0, -b.r - 5); ctx.lineTo(4, -b.r - 9);
    ctx.moveTo(b.r, 0); ctx.lineTo(b.r + 5, 0); ctx.lineTo(b.r + 9, -4);
    ctx.moveTo(b.r + 5, 0); ctx.lineTo(b.r + 9, 4);
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawAntibody = useCallback((ctx: CanvasRenderingContext2D, a: Antibody) => {
    ctx.save();
    ctx.translate(a.x, a.y);
    
    const angle = Math.atan2(a.vy, a.vx);
    ctx.rotate(angle);

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(2, 0);
    ctx.lineTo(6, -4);
    ctx.moveTo(2, 0);
    ctx.lineTo(6, 4);
    ctx.stroke();

    ctx.restore();
  }, []);

  const updateSimulation = useCallback((dt: number, canvas: HTMLCanvasElement) => {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    if (!isImmuneRef.current && learningProgressRef.current >= 100) {
      setIsImmune(true);
      isImmuneRef.current = true;
      bCellsRef.current.push(createBCell(canvasWidth, canvasHeight));
    }

    const hasLiveVirus = virusesRef.current.some(v => !v.neutralized && !v.isDead);
    if (isImmuneRef.current && hasLiveVirus && bCellsRef.current.length < 3) {
      if (Math.random() < 0.5 * dt) {
        bCellsRef.current.push(createBCell(canvasWidth, canvasHeight));
      }
    }

    if (!hasLiveVirus) {
      healthRef.current = Math.min(100, healthRef.current + 2 * dt);
      setHealth(healthRef.current);
    }

    virusesRef.current.forEach(v => {
      if (v.neutralized) {
        v.vx *= 0.99;
        v.vy *= 0.99;
      } else {
        v.rot += dt;
      }

      v.x += v.vx * dt;
      v.y += v.vy * dt;

      if (v.x < v.r || v.x > canvasWidth - v.r) v.vx *= -1;
      if (v.y < v.r || v.y > canvasHeight - v.r) v.vy *= -1;

      if (!v.isDead && !v.neutralized) {
        v.replicationTimer += dt;
        if (v.replicationTimer > 4.0 && virusesRef.current.length < 80) {
          v.replicationTimer = 0;
          virusesRef.current.push(createVirus(v.x, v.y));
        }
        
        if (Math.random() < 0.02 * dt) {
          healthRef.current = Math.max(0, healthRef.current - 0.5);
          setHealth(healthRef.current);
        }
      }
    });

    macrophagesRef.current.forEach(m => {
      m.wobble += dt * 3;
      
      let nearest: Virus | null = null;
      let minDist = Infinity;
      
      for (const v of virusesRef.current) {
        if (!v.neutralized) {
          const d = Math.hypot(v.x - m.x, v.y - m.y);
          if (d < minDist) {
            minDist = d;
            nearest = v;
          }
        }
      }

      if (nearest && minDist < 150) {
        const dx = nearest.x - m.x;
        const dy = nearest.y - m.y;
        m.vx += (dx / minDist) * 10 * dt;
        m.vy += (dy / minDist) * 10 * dt;
      } else {
        m.vx += (Math.random() - 0.5) * 20 * dt;
        m.vy += (Math.random() - 0.5) * 20 * dt;
      }

      const speed = Math.hypot(m.vx, m.vy);
      if (speed > 50) {
        m.vx = (m.vx / speed) * 50;
        m.vy = (m.vy / speed) * 50;
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;

      if (m.x < m.r || m.x > canvasWidth - m.r) m.vx *= -1;
      if (m.y < m.r || m.y > canvasHeight - m.r) m.vy *= -1;

      for (let i = virusesRef.current.length - 1; i >= 0; i--) {
        const v = virusesRef.current[i];
        if (Math.hypot(v.x - m.x, v.y - m.y) < m.r) {
          virusesRef.current.splice(i, 1);
          virusesEatenRef.current++;
          learningProgressRef.current += v.isDead ? 10 : 5;
          setLearningProgress(learningProgressRef.current);
          m.r = Math.min(35, m.r + 1);
          setTimeout(() => { m.r = 25; }, 500);
        }
      }
    });

    bCellsRef.current.forEach(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x < b.r || b.x > canvasWidth - b.r) b.vx *= -1;
      if (b.y < b.r || b.y > canvasHeight - b.r) b.vy *= -1;

      if (virusesRef.current.some(v => !v.neutralized)) {
        b.shootTimer += dt;
        if (b.shootTimer > 0.5) {
          b.shootTimer = 0;
          antibodiesRef.current.push(createAntibody(b.x, b.y));
        }
      }
    });

    for (let i = antibodiesRef.current.length - 1; i >= 0; i--) {
      const a = antibodiesRef.current[i];
      a.life -= dt;
      if (a.life <= 0) {
        antibodiesRef.current.splice(i, 1);
        continue;
      }

      let nearest: Virus | null = null;
      let minDist = Infinity;
      
      for (const v of virusesRef.current) {
        if (!v.neutralized) {
          const d = Math.hypot(v.x - a.x, v.y - a.y);
          if (d < minDist) {
            minDist = d;
            nearest = v;
          }
        }
      }

      if (nearest) {
        const dx = nearest.x - a.x;
        const dy = nearest.y - a.y;
        const dist = Math.hypot(dx, dy);
        a.vx = dx / dist;
        a.vy = dy / dist;
      }

      a.x += a.vx * a.speed * dt;
      a.y += a.vy * a.speed * dt;

      for (const v of virusesRef.current) {
        if (!v.neutralized && Math.hypot(v.x - a.x, v.y - a.y) < v.r + a.r) {
          v.neutralized = true;
          antibodiesRef.current.splice(i, 1);
          healthRef.current = Math.min(100, healthRef.current + 2);
          setHealth(healthRef.current);
          
          setTimeout(() => {
            const idx = virusesRef.current.indexOf(v);
            if (idx > -1) virusesRef.current.splice(idx, 1);
          }, 2000);
          break;
        }
      }
    }

    setVirusCount(virusesRef.current.filter(v => !v.neutralized).length);
    setAntibodyCount(antibodiesRef.current.length);
  }, [createVirus, createBCell, createAntibody]);

  const drawSimulation = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    macrophagesRef.current.forEach(m => drawMacrophage(ctx, m));
    virusesRef.current.forEach(v => drawVirus(ctx, v));
    bCellsRef.current.forEach(b => drawBCell(ctx, b));
    antibodiesRef.current.forEach(a => drawAntibody(ctx, a));
  }, [drawMacrophage, drawVirus, drawBCell, drawAntibody]);

  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isPlaying) {
      updateSimulation(dt, canvas);
      drawSimulation(ctx);
    }

    animFrameIdRef.current = requestAnimationFrame(drawFrame);
  }, [isPlaying, updateSimulation, drawSimulation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    initSimulation();

    animFrameIdRef.current = requestAnimationFrame(drawFrame);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [initSimulation, drawFrame]);

  const handleInfect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    for (let i = 0; i < 5; i++) {
      virusesRef.current.push(createVirus(canvas.width / 2 + (Math.random() - 0.5) * 50, 50));
    }
  };

  const handleVaccine = () => {
    if (isImmune) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    for (let i = 0; i < 10; i++) {
      virusesRef.current.push(createVirus(Math.random() * canvas.width, 50, true));
    }
  };

  const handleReset = () => {
    initSimulation();
  };

  const getHealthColor = () => {
    if (health < 30) return 'bg-rose-600';
    if (health < 60) return 'bg-yellow-400';
    return 'bg-emerald-500';
  };

  const getImmuneStatus = () => {
    if (isImmune) {
      return { text: 'KEBAL (MEMILIKI SEL MEMORI)', color: 'text-emerald-400' };
    }
    if (learningProgress > 0) {
      return { text: `MEMPELAJARI ANTIGEN... (${Math.floor(learningProgress)}%)`, color: 'text-yellow-400' };
    }
    return { text: 'NAIF (BELUM MENGENAL)', color: 'text-slate-400' };
  };

  const immuneStatus = getImmuneStatus();

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-rose-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">BIOLOGI KESEHATAN</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: SISTEM IMUN
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Simulasi Respons Antibodi, Antigen, dan Efek Vaksinasi
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f43f5e] text-md transform rotate-2 z-30 uppercase">
            Panel Infeksi
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className={`flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg ${health < 30 ? 'animate-pulse' : ''}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-black uppercase text-slate-500">Kesehatan Tubuh</span>
                <span className="font-mono font-black text-sm">{Math.floor(health)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-4 border-2 border-black rounded overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getHealthColor()}`}
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Tindakan Medis</label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleInfect}
                  className="neo-btn bg-rose-400 hover:bg-rose-300 text-black py-3 text-xs flex justify-between items-center px-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <span>🦠 Paparkan Virus Hidup (Infeksi)</span>
                </button>
                <button
                  onClick={handleVaccine}
                  disabled={isImmune}
                  className="neo-btn bg-sky-400 hover:bg-sky-300 text-black py-3 text-xs flex justify-between items-center px-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <span>💉 Suntikkan Vaksin (Virus Mati)</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="neo-btn py-3 text-sm flex-1 flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                style={{ backgroundColor: isPlaying ? '#facc15' : '#34d399' }}
              >
                {isPlaying ? '⏸️ JEDA WAKTU' : '▶️ LANJUTKAN'}
              </button>
              <button
                onClick={handleReset}
                className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-4 text-xs border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔄 RESET TUBUH
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
            <h4 className="font-black text-rose-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA MIKROSKOPIS</h4>
            
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-rose-500 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Jumlah Virus</span>
                <span className="text-2xl font-black text-rose-400 font-mono">{virusCount}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-yellow-500 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Antibodi Aktif</span>
                <span className="text-2xl font-black text-yellow-400 font-mono">{antibodyCount}</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex flex-col items-center rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Sistem Imun Spesifik</span>
              <span className={`text-xs font-black uppercase tracking-widest ${immuneStatus.color}`}>{immuneStatus.text}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center w-full h-[600px] border-8 border-black overflow-hidden bg-rose-50 rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Jaringan Tubuh (Mikroskopis)
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-rose-500 border-2 border-black rounded-full"></div> Virus (Antigen)</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 bg-white border-2 border-black rounded-full"></div> Makrofag (Fagosit)</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 border-2 border-black rounded-full"></div> Sel B (Pabrik Antibodi)</div>
              <div className="flex items-center gap-2"><div className="text-yellow-500 font-black text-sm">Y</div> Antibodi</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-rose-100 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Pertahanan Tubuh 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-slate-700 border-b-2 border-black pb-1 mb-2">1. Pertahanan Bawaan (Makrofag)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Saat virus (<b>Antigen</b>) pertama kali masuk, sel darah putih seperti Makrofag (putih) bertindak sebagai penjaga gerbang. Mereka akan "memakan" (fagositosis) virus apa saja secara membabi buta. Namun, jika virus bereplikasi (berkembang biak) terlalu cepat, Makrofag akan kewalahan dan kesehatan tubuh menurun.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">2. Sistem Imun Spesifik (Sel B)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Setelah memakan virus, makrofag mengirimkan data struktur virus ke sistem imun spesifik. Jika tubuh belum pernah melihat virus ini (Naif), butuh waktu agak lama untuk "memprogram" <b>Sel B</b> (biru). Setelah siap, Sel B akan memproduksi <b>Antibodi</b> (Y kuning) secara masif.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">3. Vaksin & Sel Memori</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Vaksin berisi virus mati/lemah yang tidak berbahaya. Ini memungkinkan tubuh "belajar" dan menciptakan <b>Sel Memori</b> tanpa Anda harus jatuh sakit. Jika virus asli datang di masa depan, sistem imun sudah mengenalinya dan akan langsung menembakkan antibodi dengan sangat cepat, membunuh virus sebelum ia sempat berkembang biak!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}