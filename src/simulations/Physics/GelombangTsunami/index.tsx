import { useState, useRef, useEffect, useCallback } from 'react';

const GRAVITY = 9.81;
const MAX_DEPTH = 4000;
const SURFACE_Y = 200;

export default function GelombangTsunami() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const waveXRef = useRef(-100);
  const isWaveActiveRef = useRef(false);
  
  const [depth, setDepth] = useState(4000);
  const [energyBase, setEnergyBase] = useState(5);
  const [waveSpeed, setWaveSpeed] = useState(712);
  const [waveHeight, setWaveHeight] = useState(0.5);
  const [coastStatus, setCoastStatus] = useState('AMAN (GELOMBANG RENDAH)');
  const [statusColor, setStatusColor] = useState('text-cyan-400');
  const [showTsunamiAlert, setShowTsunamiAlert] = useState(false);

  const calculatePhysics = useCallback((d: number, energy: number) => {
    const v_ms = Math.sqrt(GRAVITY * d);
    const v_kmh = v_ms * 3.6;
    
    const baseAmplitude = energy * 0.1;
    const logicalAmplitude = baseAmplitude * Math.pow((MAX_DEPTH / d), 0.25);
    
    return { speed: v_kmh, amplitude: logicalAmplitude };
  }, []);

  const updateTelemetry = useCallback(() => {
    const { speed, amplitude } = calculatePhysics(depth, energyBase);
    
    setWaveSpeed(Math.floor(speed));
    setWaveHeight(amplitude);
    
    if (amplitude < 1.0) {
      setCoastStatus('AMAN (GELOMBANG RENDAH)');
      setStatusColor('text-cyan-400');
      setShowTsunamiAlert(false);
    } else if (amplitude < 3.0) {
      setCoastStatus('WASPADA (PERAIRAN DANGKAL)');
      setStatusColor('text-amber-400');
      setShowTsunamiAlert(false);
    } else {
      setCoastStatus('BAHAYA TSUNAMI PESISIR!');
      setStatusColor('text-rose-100');
      if (isWaveActiveRef.current && waveXRef.current > 100) {
        setShowTsunamiAlert(true);
      }
    }
  }, [depth, energyBase, calculatePhysics]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const seabedY = SURFACE_Y + 50 + (depth / MAX_DEPTH) * 200;
    
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(0, seabedY);
    ctx.lineTo(canvas.width, seabedY);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, seabedY);
    ctx.lineTo(canvas.width, seabedY);
    ctx.stroke();
    
    const { amplitude: logicalAmplitude } = calculatePhysics(depth, energyBase);
    const visualSpeed = Math.sqrt(depth) * 0.15 + 1;
    
    if (isWaveActiveRef.current) {
      waveXRef.current += visualSpeed;
      if (waveXRef.current > canvas.width + 200) {
        waveXRef.current = -100;
      }
    }
    
    const visualWavelength = Math.sqrt(depth) * 3 + 50;
    const visualAmplitude = logicalAmplitude * 20;
    
    ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    for (let x = 0; x <= canvas.width; x += 5) {
      let y = SURFACE_Y;
      
      if (isWaveActiveRef.current) {
        const dx = x - waveXRef.current;
        const exponent = -(dx * dx) / (2 * visualWavelength * visualWavelength);
        const displacement = visualAmplitude * Math.exp(exponent);
        
        const drawback = (dx > 0 && dx < visualWavelength * 2)
          ? (visualAmplitude * 0.3) * Math.sin(Math.PI * dx / (visualWavelength * 1.5))
          : 0;
        
        y = y - displacement + drawback;
      }
      
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 5) {
      let y = SURFACE_Y;
      if (isWaveActiveRef.current) {
        const dx = x - waveXRef.current;
        const exponent = -(dx * dx) / (2 * visualWavelength * visualWavelength);
        y = y - (visualAmplitude * Math.exp(exponent));
        const drawback = (dx > 0 && dx < visualWavelength * 2)
          ? (visualAmplitude * 0.3) * Math.sin(Math.PI * dx / (visualWavelength * 1.5))
          : 0;
        y += drawback;
      }
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    const buoyX = 400;
    let buoyY = SURFACE_Y;
    
    if (isWaveActiveRef.current) {
      const dx = buoyX - waveXRef.current;
      const exponent = -(dx * dx) / (2 * visualWavelength * visualWavelength);
      buoyY = buoyY - (visualAmplitude * Math.exp(exponent));
      const drawback = (dx > 0 && dx < visualWavelength * 2)
        ? (visualAmplitude * 0.3) * Math.sin(Math.PI * dx / (visualWavelength * 1.5))
        : 0;
      buoyY += drawback;
    }
    
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(buoyX - 5, buoyY - 10, 10, 10);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(buoyX - 5, buoyY - 15, 10, 5);
    
    ctx.beginPath();
    ctx.moveTo(buoyX, buoyY);
    ctx.lineTo(buoyX, seabedY);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [depth, energyBase, calculatePhysics]);

  const loop = useCallback(() => {
    updateTelemetry();
    draw();
    animationRef.current = requestAnimationFrame(loop);
  }, [updateTelemetry, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    
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
  }, [loop]);

  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepth(parseInt(e.target.value));
  };

  const handleEnergyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnergyBase(parseInt(e.target.value));
  };

  const handleFire = () => {
    isWaveActiveRef.current = true;
    waveXRef.current = -100;
    setShowTsunamiAlert(false);
  };

  const handleReset = () => {
    setDepth(4000);
    setEnergyBase(5);
    isWaveActiveRef.current = false;
    waveXRef.current = -100;
    setShowTsunamiAlert(false);
  };

  const getStatusPanelClass = () => {
    if (waveHeight >= 3.0) {
      return 'bg-rose-900 p-2 border-2 border-dashed border-rose-500 text-center flex flex-col items-center justify-center min-h-[60px] transition-colors duration-300';
    }
    if (waveHeight >= 1.0) {
      return 'bg-black p-2 border-2 border-dashed border-amber-500 text-center flex flex-col items-center justify-center min-h-[60px] transition-colors duration-300';
    }
    return 'bg-black p-2 border-2 border-dashed border-cyan-500 text-center flex flex-col items-center justify-center min-h-[60px] transition-colors duration-300';
  };

  const getTempColor = () => {
    if (waveHeight >= 3.0) return 'text-rose-500';
    if (waveHeight >= 1.0) return 'text-amber-400';
    return 'text-white';
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-cyan-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">OSEANOGRAFI FISIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: GELOMBANG TSUNAMI
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Simulasi Kecepatan Rambat & Tinggi Gelombang Berdasarkan Kedalaman Laut
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#0ea5e9] text-md transform rotate-2 z-30 uppercase">
            Panel Parameter Laut
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-cyan-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-cyan-900 uppercase text-[10px]">Kedalaman Laut (h)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-cyan-600">{depth} m</span>
              </div>
              <input type="range" min="10" max="4000" step="10" value={depth} onChange={handleDepthChange} className="w-full" dir="rtl" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span className="text-blue-800">Palung/Tengah Laut</span>
                <span className="text-amber-700">Pesisir Pantai</span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-amber-900 uppercase text-[10px]" title="Magnitudo patahan tektonik">Energi Gempa (Basis)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-amber-700">Skala {energyBase}</span>
              </div>
              <input type="range" min="1" max="10" step="1" value={energyBase} onChange={handleEnergyChange} className="w-full" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Kecil</span>
                <span className="text-red-600">Megathrust</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button onClick={handleFire} className="neo-btn bg-cyan-400 hover:bg-cyan-300 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
                PICU GEMPA BAWAH LAUT
              </button>
              <button onClick={handleReset} className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
                RESET SIMULASI
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-cyan-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA TELEMETRI GELOMBANG</h4>
            
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1" title="v = sqrt(g * h)">Kecepatan (v)</span>
                <span className="text-xl font-black text-sky-400">{waveSpeed} km/j</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Amplitudo (A)</span>
                <span className={`text-xl font-black ${getTempColor()}`}>{waveHeight.toFixed(1)} m</span>
              </div>
            </div>

            <div className={getStatusPanelClass()}>
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Pesisir:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${statusColor}`}>{coastStatus}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box p-0 relative flex flex-col items-center w-full h-[550px] border-8 border-black overflow-hidden rounded-xl" style={{ backgroundColor: '#e0f2fe', backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Penampang Melintang Lautan
            </span>

            {showTsunamiAlert && (
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white font-black px-8 py-4 border-8 border-black shadow-[8px_8px_0px_#000] text-3xl uppercase z-40 tracking-widest pointer-events-none text-center leading-tight animate-pulse">
                BAHAYA TSUNAMI!
                <br />
                <span className="text-sm">EFEK SHOALING KRITIS DI PESISIR</span>
              </div>
            )}

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-white rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-cyan-600 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-white rounded-lg">
          Buku Panduan Oseanografi
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-cyan-400 border-b-2 border-slate-600 pb-1 mb-2">Asal Usul Tsunami</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Berbeda dengan ombak biasa yang disebabkan oleh angin, tsunami terjadi akibat perpindahan volume air raksasa secara mendadak (misalnya gempa tektonik di dasar laut, letusan gunung berapi, atau longsor bawah laut). Energinya menjalar menembus seluruh kolom air.
            </p>
          </div>
          
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-emerald-400 border-b-2 border-slate-600 pb-1 mb-2">Fisika Kecepatan (v = g  h)</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Di laut lepas, gelombang tsunami termasuk gelombang perairan dangkal (secara matematis) karena panjang gelombangnya sangat ekstrim. Kecepatannya (v) berbanding lurus dengan akar kedalaman laut (h). Di laut sedalam 4000m, tsunami bisa melaju secepat pesawat terbang jet (&gt;700 km/jam)!
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-rose-400 border-b-2 border-slate-600 pb-1 mb-2">Efek Shoaling (Pembesaran)</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Hukum kekekalan energi menyatakan energi tidak hilang. Saat gelombang memasuki pesisir yang dangkal, bagian bawah gelombang bergesekan dengan dasar laut sehingga kecepatannya merosot tajam. Karena melambat, air "bertumpuk" di belakangnya, mengubah energi kinetik menjadi energi potensial (ketinggian mematikan).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}