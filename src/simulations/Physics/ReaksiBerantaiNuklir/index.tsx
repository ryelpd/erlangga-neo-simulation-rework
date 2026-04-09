import { useState, useRef, useEffect, useCallback } from 'react';

interface Atom {
  x: number;
  y: number;
  active: boolean;
}

interface Neutron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface Flash {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

const ATOM_RADIUS = 12;
const NEUTRON_RADIUS = 3;
const NEUTRON_SPEED = 6;
const MAX_NEUTRONS = 400;
const ROD_COUNT = 5;
const ROD_WIDTH = 24;
const MAX_ROD_HEIGHT = 450;
const BASE_TEMP = 300;
const MELTDOWN_TEMP = 3000;

export default function ReaksiBerantaiNuklir() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  const atomsRef = useRef<Atom[]>([]);
  const neutronsRef = useRef<Neutron[]>([]);
  const flashesRef = useRef<Flash[]>([]);
  const temperatureRef = useRef(BASE_TEMP);
  const rodLevelRef = useRef(50);
  const isMeltdownRef = useRef(false);
  
  const [uraniumCount, setUraniumCount] = useState(100);
  const [rodLevel, setRodLevel] = useState(50);
  const [temperature, setTemperature] = useState(BASE_TEMP);
  const [neutronCount, setNeutronCount] = useState(0);
  const [reactorStatus, setReactorStatus] = useState('SUBKELOMPOK (AMAN)');
  const [statusColor, setStatusColor] = useState('text-emerald-400');
  const [isMeltdown, setIsMeltdown] = useState(false);
  const [showMeltdownAlert, setShowMeltdownAlert] = useState(false);

  const spawnAtom = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const x = Math.random() * (canvas.width - ATOM_RADIUS * 2) + ATOM_RADIUS;
    const y = Math.random() * (canvas.height - 100) + 100;
    
    atomsRef.current.push({ x, y, active: true });
  }, []);

  const initReactor = useCallback((uranium: number) => {
    atomsRef.current = [];
    neutronsRef.current = [];
    flashesRef.current = [];
    temperatureRef.current = BASE_TEMP;
    isMeltdownRef.current = false;
    
    setIsMeltdown(false);
    setShowMeltdownAlert(false);
    setTemperature(BASE_TEMP);
    setNeutronCount(0);
    
    for (let i = 0; i < uranium; i++) {
      spawnAtom();
    }
  }, [spawnAtom]);

  const fireNeutron = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isMeltdownRef.current) return;
    
    neutronsRef.current.push({
      x: 10,
      y: canvas.height / 2 + (Math.random() * 100 - 50),
      vx: NEUTRON_SPEED,
      vy: (Math.random() - 0.5) * 2,
      active: true
    });
  }, []);

  const handleFission = useCallback((atomX: number, atomY: number) => {
    flashesRef.current.push({ x: atomX, y: atomY, radius: 10, alpha: 1 });
    
    temperatureRef.current += 45;
    
    if (neutronsRef.current.length < MAX_NEUTRONS) {
      const numNewNeutrons = Math.random() > 0.5 ? 2 : 3;
      for (let i = 0; i < numNewNeutrons; i++) {
        const angle = Math.random() * Math.PI * 2;
        neutronsRef.current.push({
          x: atomX,
          y: atomY,
          vx: Math.cos(angle) * NEUTRON_SPEED,
          vy: Math.sin(angle) * NEUTRON_SPEED,
          active: true
        });
      }
    }
  }, []);

  const triggerMeltdown = useCallback(() => {
    isMeltdownRef.current = true;
    setIsMeltdown(true);
    setShowMeltdownAlert(true);
    setReactorStatus('MELTDOWN TERCAPAI!');
    setStatusColor('text-red-100');
  }, []);

  const updatePhysics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isMeltdownRef.current) return;
    
    const rodHeight = (rodLevelRef.current / 100) * MAX_ROD_HEIGHT;
    const spacing = canvas.width / (ROD_COUNT + 1);
    
    for (let i = neutronsRef.current.length - 1; i >= 0; i--) {
      const n = neutronsRef.current[i];
      if (!n.active) continue;
      
      n.x += n.vx;
      n.y += n.vy;
      
      if (n.x < 0 || n.x > canvas.width) {
        n.vx *= -1;
        n.x = Math.max(0, Math.min(canvas.width, n.x));
      }
      if (n.y < 0 || n.y > canvas.height) {
        n.vy *= -1;
        n.y = Math.max(0, Math.min(canvas.height, n.y));
      }
      
      let absorbed = false;
      for (let j = 0; j < ROD_COUNT; j++) {
        const rodX = (j + 1) * spacing - ROD_WIDTH / 2;
        if (n.x > rodX && n.x < rodX + ROD_WIDTH && n.y < rodHeight) {
          absorbed = true;
          break;
        }
      }
      
      if (absorbed) {
        n.active = false;
        continue;
      }
      
      for (let k = atomsRef.current.length - 1; k >= 0; k--) {
        const a = atomsRef.current[k];
        if (!a.active) continue;
        
        const dx = n.x - a.x;
        const dy = n.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < ATOM_RADIUS + NEUTRON_RADIUS) {
          n.active = false;
          a.active = false;
          handleFission(a.x, a.y);
          break;
        }
      }
    }
    
    neutronsRef.current = neutronsRef.current.filter(n => n.active);
    atomsRef.current = atomsRef.current.filter(a => a.active);
    
    if (temperatureRef.current > BASE_TEMP) {
      temperatureRef.current -= 0.5 + (rodLevelRef.current / 100) * 1.5;
    }
    if (temperatureRef.current < BASE_TEMP) temperatureRef.current = BASE_TEMP;
    
    if (temperatureRef.current >= MELTDOWN_TEMP && !isMeltdownRef.current) {
      triggerMeltdown();
    }
    
    setTemperature(Math.floor(temperatureRef.current));
    setNeutronCount(neutronsRef.current.length);
  }, [handleFission, triggerMeltdown]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const rodHeight = (rodLevelRef.current / 100) * MAX_ROD_HEIGHT;
    const spacing = canvas.width / (ROD_COUNT + 1);
    
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    
    for (let i = 0; i < ROD_COUNT; i++) {
      const rx = (i + 1) * spacing - ROD_WIDTH / 2;
      ctx.fillRect(rx, 0, ROD_WIDTH, rodHeight);
      ctx.strokeRect(rx, 0, ROD_WIDTH, rodHeight);
      
      ctx.fillStyle = '#475569';
      ctx.fillRect(rx + 4, 0, 4, rodHeight - 4);
      ctx.fillStyle = '#334155';
    }
    
    for (const a of atomsRef.current) {
      if (!a.active) continue;
      
      const gradient = ctx.createRadialGradient(a.x, a.y, 2, a.x, a.y, ATOM_RADIUS);
      gradient.addColorStop(0, '#6ee7b7');
      gradient.addColorStop(1, '#059669');
      
      ctx.beginPath();
      ctx.arc(a.x, a.y, ATOM_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#022c22';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(a.x, a.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#064e3b';
      ctx.fill();
    }
    
    for (let i = flashesRef.current.length - 1; i >= 0; i--) {
      const f = flashesRef.current[i];
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(252, 211, 77, ${f.alpha})`;
      ctx.fill();
      
      f.radius += 2;
      f.alpha -= 0.05;
      if (f.alpha <= 0) flashesRef.current.splice(i, 1);
    }
    
    ctx.fillStyle = '#fde047';
    for (const n of neutronsRef.current) {
      if (!n.active) continue;
      
      ctx.beginPath();
      ctx.arc(n.x, n.y, NEUTRON_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(n.x, n.y);
      ctx.lineTo(n.x - n.vx * 2, n.y - n.vy * 2);
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, []);

  const updateTelemetry = useCallback(() => {
    if (isMeltdownRef.current) return;
    
    if (temperatureRef.current < 600) {
      setReactorStatus('STABIL (NORMAL)');
      setStatusColor('text-emerald-400');
    } else if (temperatureRef.current < 1500) {
      setReactorStatus('KRITIS (DAYA TINGGI)');
      setStatusColor('text-yellow-400');
    } else {
      setReactorStatus('SUPERKRITIS (PERINGATAN!)');
      setStatusColor('text-rose-200');
    }
  }, []);

  const loop = useCallback(() => {
    updatePhysics();
    draw();
    updateTelemetry();
    
    animationRef.current = requestAnimationFrame(loop);
  }, [updatePhysics, draw, updateTelemetry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    
    initReactor(uraniumCount);
    animationRef.current = requestAnimationFrame(loop);
    
    const handleResize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [uraniumCount, initReactor, loop]);

  useEffect(() => {
    rodLevelRef.current = rodLevel;
  }, [rodLevel]);

  const handleUraniumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value);
    setUraniumCount(count);
    
    while (atomsRef.current.length < count) spawnAtom();
    while (atomsRef.current.length > count) atomsRef.current.pop();
  };

  const handleRodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRodLevel(parseInt(e.target.value));
  };

  const handleFire = () => {
    fireNeutron();
  };

  const handleScram = () => {
    setRodLevel(100);
    rodLevelRef.current = 100;
    initReactor(uraniumCount);
  };

  const getTempColor = () => {
    if (temperature < 600) return 'text-white';
    if (temperature < 1500) return 'text-yellow-400';
    return 'text-rose-500';
  };

  const getStatusPanelClass = () => {
    if (isMeltdown) return 'bg-red-600 p-2 border-2 border-dashed border-white text-center flex flex-col items-center justify-center min-h-[60px] animate-pulse';
    if (temperature < 600) return 'bg-black p-2 border-2 border-dashed border-emerald-500 text-center flex flex-col items-center justify-center min-h-[60px] transition-colors duration-300';
    if (temperature < 1500) return 'bg-black p-2 border-2 border-dashed border-yellow-500 text-center flex flex-col items-center justify-center min-h-[60px] transition-colors duration-300';
    return 'bg-rose-900 p-2 border-2 border-dashed border-rose-500 text-center flex flex-col items-center justify-center min-h-[60px] transition-colors duration-300';
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">FISIKA INTI & KUANTUM</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: REAKSI NUKLIR
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Simulasi Pembelahan Inti Atom dan Reaksi Berantai (Fisi)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#10b981] text-md transform rotate-2 z-30 uppercase">
            Panel Kendali Reaktor
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-900 uppercase text-[10px]">Populasi Uranium-235</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-600">{uraniumCount} Atom</span>
              </div>
              <input type="range" min="20" max="250" step="10" value={uraniumCount} onChange={handleUraniumChange} className="w-full" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Renggang</span>
                <span>Sangat Padat</span>
              </div>
            </div>

            <div className="bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-slate-800 uppercase text-[10px]" title="Batang Boron/Kadmium untuk menyerap Neutron">Posisi Batang Kendali</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-slate-700">{rodLevel}% Turun</span>
              </div>
              <input type="range" min="0" max="100" step="1" value={rodLevel} onChange={handleRodChange} className="w-full" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span className="text-rose-600">Terbuka (0%)</span>
                <span className="text-emerald-600">Tertutup (100%)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button onClick={handleFire} disabled={isMeltdown} className="neo-btn bg-amber-400 hover:bg-amber-300 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none disabled:bg-slate-300 disabled:cursor-not-allowed">
                TEMBAKKAN NEUTRON (START)
              </button>
              <button onClick={handleScram} className="neo-btn bg-red-600 text-white hover:bg-red-500 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#450a0a] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
                SCRAM (RESET REAKTOR)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-emerald-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">SENSOR TERMODINAMIKA</h4>
            
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Suhu Teras Reaktor</span>
                <span className={`text-lg font-black ${getTempColor()}`}>{temperature} C</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Neutron Aktif</span>
                <span className="text-lg font-black text-white">{neutronCount}</span>
              </div>
            </div>

            <div className={getStatusPanelClass()}>
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Reaktivitas:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${statusColor}`}>{reactorStatus}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className={`neo-box p-0 relative flex flex-col items-center w-full h-[550px] border-8 border-black overflow-hidden rounded-xl ${isMeltdown ? 'animate-pulse' : ''}`} style={{ backgroundColor: '#020617', backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            <span className="absolute top-4 left-4 bg-black text-white font-black px-3 py-1 border-4 border-emerald-500 shadow-[4px_4px_0px_#10b981] text-[10px] transform -rotate-1 z-30 uppercase">
              Teras Reaktor (Kamera Internal)
            </span>

            {showMeltdownAlert && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white font-black px-8 py-4 border-8 border-black shadow-[8px_8px_0px_#000] text-3xl uppercase z-40 tracking-widest pointer-events-none text-center leading-tight animate-pulse">
                MELTDOWN!
                <br />
                <span className="text-sm">SUHU KRITIS TERCAPAI</span>
              </div>
            )}

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-white rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-emerald-600 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-white rounded-lg">
          Buku Panduan Operator Reaktor
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-amber-400 border-b-2 border-slate-600 pb-1 mb-2">Fisi Nuklir</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Proses di mana inti atom yang berat (seperti Uranium-235) ditembak dengan sebuah partikel neutron. Inti atom tersebut menjadi tidak stabil dan <b>terbelah</b> menjadi dua inti yang lebih ringan, memancarkan energi panas yang sangat besar, serta melepaskan 2-3 neutron baru.
            </p>
          </div>
          
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-emerald-400 border-b-2 border-slate-600 pb-1 mb-2">Reaksi Berantai</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Neutron baru yang dihasilkan dari pembelahan pertama akan melesat dan menabrak atom Uranium lainnya, menyebabkannya terbelah juga. Reaksi ini berlipat ganda secara eksponensial. Jika tidak dikendalikan, panas yang dihasilkan dapat melelehkan reaktor (Meltdown).
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">Batang Kendali</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Terbuat dari bahan seperti Boron atau Kadmium yang berfungsi sebagai "spons" <b>penyerap neutron</b>. Dengan menurunkan batang kendali ke dalam teras reaktor, operator dapat menyerap neutron bebas, sehingga menghentikan reaksi berantai dan menurunkan suhu reaktor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}