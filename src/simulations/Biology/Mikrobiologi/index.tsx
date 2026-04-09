import { useState, useRef, useEffect, useCallback } from 'react';

const MAX_BACTERIA = 1500;

type BacteriaType = 'NORMAL' | 'RESISTANT';

interface Bacteria {
  x: number;
  y: number;
  type: BacteriaType;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  age: number;
  energy: number;
  isDead: boolean;
  divisionCooldown: number;
}

interface DeadParticle {
  x: number;
  y: number;
}

function createBacteria(x: number, y: number, type: BacteriaType): Bacteria {
  return {
    x,
    y,
    type,
    radius: type === 'NORMAL' ? 3 : 3.5,
    color: type === 'NORMAL' ? '#10b981' : '#a855f7',
    vx: (Math.random() - 0.5) * 10,
    vy: (Math.random() - 0.5) * 10,
    age: 0,
    energy: 50 + Math.random() * 50,
    isDead: false,
    divisionCooldown: 2 + Math.random() * 3,
  };
}

export default function Mikrobiologi() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  
  const [currentMode, setCurrentMode] = useState<BacteriaType>('NORMAL');
  const [isPlaying, setIsPlaying] = useState(true);
  const [temperature, setTemperature] = useState(37);
  const [nutrients, setNutrients] = useState(100);
  const [popNormal, setPopNormal] = useState(0);
  const [popMutant, setPopMutant] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [envStatus, setEnvStatus] = useState('OPTIMAL: PERTUMBUHAN AKTIF');
  const [envStatusColor, setEnvStatusColor] = useState('text-emerald-400');
  const [canvasBgColor, setCanvasBgColor] = useState('#fef08a');
  
  const bacteriaListRef = useRef<Bacteria[]>([]);
  const deadParticlesRef = useRef<DeadParticle[]>([]);
  const nutrientsRef = useRef(100);
  const hasAntibioticRef = useRef(false);
  const temperatureRef = useRef(37);
  const canvasSizeRef = useRef({ width: 0, height: 0, centerX: 0, centerY: 0, petriRadius: 0 });

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const petriRadius = Math.min(canvas.width, canvas.height) / 2 - 5;
    
    canvasSizeRef.current = { width: canvas.width, height: canvas.height, centerX, centerY, petriRadius };
  }, []);

  const updateEnvironmentStatus = useCallback(() => {
    const temp = temperatureRef.current;
    const nutr = nutrientsRef.current;
    const anti = hasAntibioticRef.current;
    
    if (temp > 50) {
      setEnvStatus('KRITIS: SUHU MEMATIKAN');
      setEnvStatusColor('text-rose-500');
    } else if (anti) {
      setEnvStatus('AKTIF: ANTIBIOTIK BEKERJA');
      setEnvStatusColor('text-sky-500');
    } else if (nutr === 0) {
      setEnvStatus('KRITIS: KELAPARAN');
      setEnvStatusColor('text-slate-400');
    } else if (temp < 15) {
      setEnvStatus('DORMAN: TERLALU DINGIN');
      setEnvStatusColor('text-blue-300');
    } else {
      setEnvStatus('OPTIMAL: PERTUMBUHAN AKTIF');
      setEnvStatusColor('text-emerald-400');
    }
    
    if (anti) {
      setCanvasBgColor('#bae6fd');
    } else if (nutr > 50) {
      setCanvasBgColor('#fef08a');
    } else if (nutr > 10) {
      setCanvasBgColor('#fef9c3');
    } else {
      setCanvasBgColor('#f1f5f9');
    }
  }, []);

  const updateBacteria = useCallback((b: Bacteria, dt: number) => {
    if (b.isDead) return;
    
    const { centerX, centerY, petriRadius } = canvasSizeRef.current;
    const temp = temperatureRef.current;
    const anti = hasAntibioticRef.current;
    let nutr = nutrientsRef.current;
    
    b.age += dt;
    
    b.vx += (Math.random() - 0.5) * 2;
    b.vy += (Math.random() - 0.5) * 2;
    
    const tempFactor = Math.max(0.1, temp / 37);
    
    b.vx *= 0.9;
    b.vy *= 0.9;
    
    b.x += b.vx * tempFactor;
    b.y += b.vy * tempFactor;
    
    const dx = b.x - centerX;
    const dy = b.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist + b.radius > petriRadius) {
      const nx = dx / dist;
      const ny = dy / dist;
      b.x = centerX + nx * (petriRadius - b.radius);
      b.y = centerY + ny * (petriRadius - b.radius);
      b.vx *= -1;
      b.vy *= -1;
    }
    
    if (temp > 50) {
      if (Math.random() < 0.2 * dt) {
        b.isDead = true;
        deadParticlesRef.current.push({ x: b.x, y: b.y });
      }
      return;
    }
    
    if (temp < 10) return;
    
    if (anti && b.type === 'NORMAL') {
      if (Math.random() < 0.8 * dt) {
        b.isDead = true;
        deadParticlesRef.current.push({ x: b.x, y: b.y });
      }
      return;
    }
    
    if (nutr > 0) {
      const eatAmount = 0.5 * dt;
      nutr -= eatAmount * 0.05;
      nutrientsRef.current = Math.max(0, nutr);
      b.energy += eatAmount * 10;
      
      b.divisionCooldown -= dt * tempFactor;
      
      const isIdealTemp = temp > 25 && temp < 45;
      
      if (b.divisionCooldown <= 0 && b.energy > 100 && isIdealTemp && bacteriaListRef.current.length < MAX_BACTERIA) {
        b.energy /= 2;
        b.divisionCooldown = 2 + Math.random() * 3;
        
        const nx = b.x + (Math.random() - 0.5) * 10;
        const ny = b.y + (Math.random() - 0.5) * 10;
        bacteriaListRef.current.push(createBacteria(nx, ny, b.type));
      }
    } else {
      b.energy -= 20 * dt;
      if (b.energy <= 0) {
        b.isDead = true;
        deadParticlesRef.current.push({ x: b.x, y: b.y });
      }
    }
  }, []);

  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;
    
    if (isPlaying) {
      updateEnvironmentStatus();
      
      for (let i = bacteriaListRef.current.length - 1; i >= 0; i--) {
        const b = bacteriaListRef.current[i];
        updateBacteria(b, dt);
        if (b.isDead) {
          bacteriaListRef.current.splice(i, 1);
        }
      }
      
      setNutrients(Math.max(0, nutrientsRef.current));
      
      let normal = 0;
      let mutant = 0;
      bacteriaListRef.current.forEach(b => {
        if (b.type === 'NORMAL') normal++;
        else mutant++;
      });
      setPopNormal(normal);
      setPopMutant(mutant);
    }
    
    const { width, height } = canvasSizeRef.current;
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
    deadParticlesRef.current.forEach(dp => {
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    
    if (deadParticlesRef.current.length > 500) {
      deadParticlesRef.current.splice(0, deadParticlesRef.current.length - 500);
    }
    
    bacteriaListRef.current.forEach(b => {
      if (!b.isDead) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
      }
    });
    
    animationRef.current = requestAnimationFrame(drawFrame);
  }, [isPlaying, updateBacteria, updateEnvironmentStatus]);

  useEffect(() => {
    updateCanvasSize();
    
    const handleResize = () => updateCanvasSize();
    window.addEventListener('resize', handleResize);
    
    animationRef.current = requestAnimationFrame(drawFrame);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawFrame, updateCanvasSize]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number;
    let clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;
    
    const { centerX, centerY, petriRadius } = canvasSizeRef.current;
    const dx = clickX - centerX;
    const dy = clickY - centerY;
    
    if (Math.sqrt(dx * dx + dy * dy) <= petriRadius) {
      setShowHint(false);
      
      for (let i = 0; i < 5; i++) {
        if (bacteriaListRef.current.length < MAX_BACTERIA) {
          bacteriaListRef.current.push(createBacteria(
            clickX + (Math.random() - 0.5) * 20,
            clickY + (Math.random() - 0.5) * 20,
            currentMode
          ));
        }
      }
    }
  }, [currentMode]);

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const temp = parseInt(e.target.value);
    setTemperature(temp);
    temperatureRef.current = temp;
  };

  const handleRefill = () => {
    nutrientsRef.current = 100;
    setNutrients(100);
    hasAntibioticRef.current = false;
  };

  const handleAntibiotic = () => {
    hasAntibioticRef.current = true;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      lastTimeRef.current = 0;
    }
  };

  const handleReset = () => {
    bacteriaListRef.current = [];
    deadParticlesRef.current = [];
    nutrientsRef.current = 100;
    temperatureRef.current = 37;
    hasAntibioticRef.current = false;
    setNutrients(100);
    setTemperature(37);
    setPopNormal(0);
    setPopMutant(0);
    setShowHint(true);
    setEnvStatus('OPTIMAL: PERTUMBUHAN AKTIF');
    setEnvStatusColor('text-emerald-400');
    setCanvasBgColor('#fef08a');
  };

  const getModeButtonStyle = (mode: BacteriaType) => {
    const isActive = currentMode === mode;
    const base = "neo-btn py-2 px-1 text-[10px] font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all";
    if (isActive) {
      return `${base} ${mode === 'NORMAL' ? 'bg-emerald-400' : 'bg-purple-400'} text-black ring-4 ring-black`;
    }
    return `${base} bg-slate-200 text-slate-600`;
  };

  const getNutrientColorClass = () => {
    if (nutrients < 5) return 'text-rose-500';
    return 'text-yellow-300';
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">BIOLOGI & KESEHATAN</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: MIKROBIOLOGI
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Pertumbuhan Eksponensial, Medium Agar, dan Resistensi Antibiotik
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#10b981] text-md transform rotate-2 z-30 uppercase">
            Panel Inkubator
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Alat Inokulasi (Pilih & Klik Cawan)</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setCurrentMode('NORMAL')} className={getModeButtonStyle('NORMAL')}>
                  BAKTERI NORMAL
                </button>
                <button onClick={() => setCurrentMode('RESISTANT')} className={getModeButtonStyle('RESISTANT')}>
                  MUTAN RESISTEN
                </button>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Suhu Inkubator (C)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{temperature} C</span>
              </div>
              <input type="range" min="0" max="60" step="1" value={temperature} onChange={handleTemperatureChange} className="w-full" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Beku (0)</span>
                <span>Optimal (37)</span>
                <span>Panas (60)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-sky-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-sky-800 mb-1">Intervensi Zat Kimia</label>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={handleRefill} className="neo-btn bg-yellow-300 hover:bg-yellow-200 text-black py-3 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
                  TAMBAH NUTRISI (AGAR)
                </button>
                <button onClick={handleAntibiotic} className="neo-btn bg-sky-400 hover:bg-sky-300 text-black py-3 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
                  TETESKAN ANTIBIOTIK
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t-4 border-black pt-4 mt-2">
            <button onClick={handlePlayPause} className="neo-btn bg-yellow-400 hover:bg-yellow-300 py-3 text-sm flex-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
              {isPlaying ? 'JEDA WAKTU' : 'LANJUTKAN'}
            </button>
            <button onClick={handleReset} className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 text-xs border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
              GANTI CAWAN
            </button>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-slate-900 p-0 relative flex flex-col items-center w-full h-[500px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000000]">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Cawan Petri Digital
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 border border-black rounded-full"></div> Bakteri Normal (Rentan)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 border border-black rounded-full"></div> Bakteri Mutan (Resisten)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-400 border border-black rounded-full opacity-50"></div> Sel Mati</div>
            </div>

            {showHint && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <span className="bg-white/80 px-4 py-2 border-2 border-black font-black text-slate-600 rounded uppercase tracking-widest animate-pulse">
                  Klik pada agar untuk menanam bakteri
                </span>
              </div>
            )}

            <div className="w-full h-full flex justify-center items-center p-4 pt-12 relative z-10">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full block rounded-full border-8 border-slate-300 shadow-[0_0_50px_rgba(0,0,0,0.5)_inset] transition-colors duration-1000"
                style={{ backgroundColor: canvasBgColor, cursor: 'crosshair' }}
                onClick={handleCanvasClick}
                onTouchStart={(e) => { e.preventDefault(); handleCanvasClick(e); }}
              />
            </div>
          </div>

          <div className="neo-box bg-slate-900 text-white p-6 relative flex flex-col w-full border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-emerald-400 text-[12px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA POPULASI & LINGKUNGAN</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-800 p-2 border-2 border-emerald-500 rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Pop. Normal</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{popNormal}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-purple-500 rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Pop. Resisten</span>
                <span className="text-2xl font-black text-purple-400 font-mono">{popMutant}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-yellow-500 rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Sisa Nutrisi</span>
                <span className={`text-2xl font-black font-mono ${getNutrientColorClass()}`}>{nutrients.toFixed(1)}%</span>
              </div>
              <div className="bg-black p-2 border-2 border-dashed border-sky-500 rounded flex flex-col justify-center items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Status Lingkungan</span>
                <span className={`text-[10px] font-black uppercase leading-tight ${envStatusColor}`}>{envStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-emerald-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black rounded-lg">
          Buku Panduan: Siklus Hidup Bakteri
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">1. Pembelahan Biner</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Bakteri bereproduksi secara aseksual dengan membelah diri menjadi dua sel yang identik. Jika nutrisi melimpah dan suhu optimal (37C), populasi akan tumbuh secara <b>Eksponensial</b> (1 jadi 2, 2 jadi 4, 4 jadi 8, dst) dalam waktu yang sangat singkat.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-yellow-600 border-b-2 border-black pb-1 mb-2">2. Fase Kematian</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Pertumbuhan tidak bisa terjadi selamanya. Ketika <b>Nutrisi (Agar) habis</b>, atau lingkungan dipenuhi zat sisa beracun, bakteri akan mulai kelaparan dan mati. Selain itu, suhu ekstrem (terlalu panas) akan merusak protein bakteri dan membunuh mereka.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">3. Seleksi Alam & Resistensi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Antibiotik diciptakan untuk membunuh bakteri. Namun, mutasi genetik acak kadang menciptakan bakteri yang <b>resisten/kebal</b>. Saat antibiotik diberikan, bakteri normal akan musnah, tetapi bakteri resisten akan bertahan hidup, berkembang biak, dan mengambil alih seluruh sumber daya!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}