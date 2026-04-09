import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const SERVER_CAPACITY = 100;
const MAX_SERVERS = 10;
const NET_X = 60;
const LB_X = 320;
const SRV_X = 620;

interface Packet {
  x: number;
  y: number;
  targetY: number;
  phase: number;
  speed: number;
  isMalicious: boolean;
  serverTarget: number;
  trail: { x: number; y: number }[];
}

export default function CloudComputing(): ReactNode {
  const [baseTraffic, setBaseTraffic] = useState(100);
  const [currentTraffic, setCurrentTraffic] = useState(100);
  const [activeServers, setActiveServers] = useState(1);
  const [isAutoScaling, setIsAutoScaling] = useState(false);
  const [cpuLoad, setCpuLoad] = useState(0);
  const [droppedRequests, setDroppedRequests] = useState(0);
  const [status, setStatus] = useState('SISTEM SEHAT (HEALTHY)');
  const [statusColor, setStatusColor] = useState('text-emerald-400');
  const [statusBg, setStatusBg] = useState('bg-emerald-900');
  const [statusBorder, setStatusBorder] = useState('border-emerald-400');
  const [showOverload, setShowOverload] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const packetsRef = useRef<Packet[]>([]);
  const lbPulseRadiusRef = useRef(0);
  const timeRef = useRef(0);
  const stressActiveRef = useRef(false);
  const stressTimerRef = useRef(0);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const updateLogic = useCallback(() => {
    // Auto-scaling logic
    if (isAutoScaling) {
      const needed = Math.min(MAX_SERVERS, Math.max(1, Math.ceil(currentTraffic / (SERVER_CAPACITY * 0.75))));
      if (activeServers < needed && Math.random() < 0.2) setActiveServers(activeServers + 1);
      if (activeServers > needed && cpuLoad < 50 && Math.random() < 0.1) setActiveServers(activeServers - 1);
    }

    // Handle stress test
    if (stressActiveRef.current) {
      setCurrentTraffic(1100 + Math.random() * 300);
      stressTimerRef.current--;
      if (stressTimerRef.current <= 0) stressActiveRef.current = false;
    } else {
      setCurrentTraffic(prev => prev + (baseTraffic - prev) * 0.05);
    }

    // Calculate load
    const totalCapacity = activeServers * SERVER_CAPACITY;
    const load = (currentTraffic / totalCapacity) * 100;
    const cappedLoad = Math.min(100, load);
    setCpuLoad(cappedLoad);

    const isOverloaded = load > 100;
    if (isOverloaded) {
      const droppedRate = (currentTraffic - totalCapacity) * 0.15;
      setDroppedRequests(prev => prev + Math.floor(droppedRate));
    }

    // Update status
    if (isOverloaded) {
      setStatus('OVERLOAD (RESOURCE HABIS)');
      setStatusColor('text-rose-300');
      setStatusBg('bg-rose-900');
      setStatusBorder('border-rose-500');
      setShowOverload(true);
      setIsShaking(true);
    } else if (cappedLoad > 80) {
      setStatus('WARNING (BEBAN TINGGI)');
      setStatusColor('text-amber-300');
      setStatusBg('bg-amber-900');
      setStatusBorder('border-amber-500');
      setShowOverload(false);
      setIsShaking(false);
    } else {
      setStatus('SISTEM SEHAT (HEALTHY)');
      setStatusColor('text-emerald-400');
      setStatusBg('bg-emerald-900');
      setStatusBorder('border-emerald-400');
      setShowOverload(false);
      setIsShaking(false);
    }

    // Spawn packets
    const spawnRate = currentTraffic / 60;
    const spawnCount = Math.floor(spawnRate) + (Math.random() < (spawnRate % 1) ? 1 : 0);

    for (let i = 0; i < spawnCount; i++) {
      packetsRef.current.push({
        x: NET_X + 20,
        y: 275 + (Math.random() - 0.5) * 40,
        targetY: 275,
        phase: 0,
        speed: 6 + Math.random() * 4,
        isMalicious: stressActiveRef.current && Math.random() < 0.85,
        serverTarget: -1,
        trail: []
      });
    }

    // Update packets
    for (let i = packetsRef.current.length - 1; i >= 0; i--) {
      const p = packetsRef.current[i];
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 6) p.trail.shift();

      if (p.phase === 0) {
        p.x += p.speed;
        p.y += (p.targetY - p.y) * 0.1;
        if (p.x >= LB_X - 40) {
          lbPulseRadiusRef.current = 15;
          if (isOverloaded && Math.random() < ((currentTraffic - totalCapacity) / currentTraffic)) {
            p.phase = 4;
          } else {
            p.phase = 1;
            p.serverTarget = Math.floor(Math.random() * activeServers);
            const spacing = 480 / activeServers;
            p.targetY = 35 + (p.serverTarget * spacing) + spacing / 2;
          }
        }
      } else if (p.phase === 1) {
        p.x += p.speed * 0.4;
        if (p.x >= LB_X + 40) p.phase = 2;
      } else if (p.phase === 2) {
        p.x += p.speed * 1.5;
        p.y += (p.targetY - p.y) * 0.2;
        if (p.x >= SRV_X - 10) p.phase = 3;
      } else if (p.phase === 4) {
        p.y += p.speed * 1.5;
        p.x += Math.sin(timeRef.current + p.y) * 2;
        if (p.y > 600) p.phase = 3;
      }

      if (p.phase === 3) packetsRef.current.splice(i, 1);
    }

    if (lbPulseRadiusRef.current > 0) lbPulseRadiusRef.current -= 0.5;
    timeRef.current += 0.1;
  }, [isAutoScaling, currentTraffic, activeServers, cpuLoad, baseTraffic]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Network lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(NET_X + 40, 275);
    ctx.lineTo(LB_X - 40, 275);
    ctx.stroke();

    const spacing = 480 / activeServers;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    for (let i = 0; i < activeServers; i++) {
      const targetY = 35 + (i * spacing) + spacing / 2;
      ctx.beginPath();
      ctx.moveTo(LB_X + 40, 275);
      ctx.lineTo(LB_X + 100, 275);
      ctx.lineTo(SRV_X - 40, targetY);
      ctx.lineTo(SRV_X, targetY);
      ctx.stroke();
    }

    // Internet node
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(NET_X, 275, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#38bdf8';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌐', NET_X, 275);

    ctx.font = 'bold 12px "Space Grotesk"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('INTERNET', NET_X, 340);

    // Load balancer
    if (lbPulseRadiusRef.current > 0) {
      ctx.beginPath();
      ctx.arc(LB_X, 275, 50 + (15 - lbPulseRadiusRef.current) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(192, 132, 252, ${lbPulseRadiusRef.current / 15})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(LB_X - 35, 210, 70, 130);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.strokeRect(LB_X - 35, 210, 70, 130);

    ctx.fillStyle = '#334155';
    ctx.fillRect(LB_X - 25, 230, 50, 10);
    ctx.fillRect(LB_X - 25, 250, 50, 10);
    ctx.fillRect(LB_X - 25, 270, 50, 10);

    ctx.beginPath();
    ctx.moveTo(LB_X - 35, 275); ctx.lineTo(LB_X - 45, 275);
    ctx.moveTo(LB_X + 35, 275); ctx.lineTo(LB_X + 45, 275);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Space Grotesk"';
    ctx.textAlign = 'center';
    ctx.fillText('LOAD', LB_X, 180);
    ctx.fillText('BALANCER', LB_X, 195);

    // Servers
    ctx.fillStyle = '#020617';
    ctx.fillRect(SRV_X - 15, 25, 150, 500);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(SRV_X - 15, 25, 150, 500);

    for (let i = 0; i < MAX_SERVERS; i++) {
      const srvSpacing = 480 / MAX_SERVERS;
      const srvY = 35 + (i * srvSpacing);
      const srvH = srvSpacing - 8;

      if (i < activeServers) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(SRV_X, srvY, 120, srvH);

        let sColor = '#10b981';
        if (cpuLoad > 75) sColor = '#f59e0b';
        if (cpuLoad >= 100) sColor = '#e11d48';

        ctx.strokeStyle = sColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(SRV_X, srvY, 120, srvH);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(SRV_X + 10, srvY + 4, 70, srvH * 0.3);
        ctx.fillRect(SRV_X + 10, srvY + srvH - (srvH * 0.3) - 4, 70, srvH * 0.3);

        const blink = Math.random() > 0.3 && cpuLoad > 2;
        const netBlink = Math.random() > 0.5 && cpuLoad > 0;

        ctx.shadowColor = blink ? sColor : 'transparent';
        ctx.shadowBlur = blink ? 8 : 0;
        ctx.fillStyle = blink ? sColor : '#334155';
        ctx.beginPath();
        ctx.arc(SRV_X + 95, srvY + srvH / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = netBlink ? '#38bdf8' : 'transparent';
        ctx.fillStyle = netBlink ? '#38bdf8' : '#334155';
        ctx.beginPath();
        ctx.arc(SRV_X + 107, srvY + srvH / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#020617';
        ctx.fillRect(SRV_X, srvY, 120, srvH);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(SRV_X, srvY, 120, srvH);
      }
    }

    // Packets
    for (const p of packetsRef.current) {
      const pColor = p.phase === 4 ? '#f97316' : (p.isMalicious ? '#f43f5e' : '#38bdf8');

      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = pColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.4;
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = pColor;
      ctx.shadowColor = pColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [activeServers, cpuLoad]);

  useEffect(() => {
    const loop = () => {
      updateLogic();
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateLogic, draw]);

  const handleStress = () => {
    stressActiveRef.current = true;
    stressTimerRef.current = 200;
  };

  const cpuColor = cpuLoad < 60 ? 'text-emerald-400' : cpuLoad < 85 ? 'text-amber-400' : 'text-rose-500';
  const autoScaleLabel = isAutoScaling ? 'AKTIF' : 'NONAKTIF';
  const autoScaleColor = isAutoScaling ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-900 p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-200 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 w-full relative overflow-hidden">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] font-bold text-sm transform -rotate-3 z-10">INFRASTRUKTUR CLOUD</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight relative z-10">
          LAB VIRTUAL: CLOUD COMPUTING
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] relative z-10">
          Simulasi Load Balancing, Auto-Scaling, dan Manajemen Resource Server
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-slate-900 shadow-[4px_4px_0px_#38bdf8] text-md transform rotate-2 z-30 uppercase">
            Panel Kontrol Admin
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-sky-50 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-900 uppercase text-[10px]">Trafik Pengguna (Req/s)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-slate-900 text-sky-700 rounded">{Math.floor(currentTraffic)} Req</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={baseTraffic}
                onChange={(e) => setBaseTraffic(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#0f172a] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Sepi</span>
                <span>Viral (Padat)</span>
              </div>
            </div>

            <div className={`bg-emerald-50 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg transition-opacity ${isAutoScaling ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-900 uppercase text-[10px]">Jumlah Server Aktif</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-slate-900 text-emerald-700 rounded">{activeServers} Node</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={activeServers}
                onChange={(e) => setActiveServers(parseInt(e.target.value))}
                disabled={isAutoScaling}
                className="w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#0f172a] [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full disabled:opacity-50"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>1 Server</span>
                <span>10 Server (Cluster)</span>
              </div>
            </div>

            <div className="bg-indigo-50 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-indigo-900 uppercase text-[10px]">Fitur Auto-Scaling</span>
                <span className={`font-mono font-black text-sm bg-white px-2 border-2 border-slate-900 rounded ${autoScaleColor}`}>{autoScaleLabel}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAutoScaling}
                  onChange={(e) => setIsAutoScaling(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-900 after:border-4 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 border-4 border-slate-900"></div>
              </label>
              <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase leading-tight">Mendelegasikan AI untuk mengatur jumlah server otomatis sesuai trafik.</p>
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-slate-900 pt-4 mt-2">
              <button
                onClick={handleStress}
                className="border-4 border-slate-900 shadow-[4px_4px_0px_0px_#881337] rounded-lg bg-rose-500 text-white hover:bg-rose-400 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                SERANGAN DDoS (STRESS TEST)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-sky-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DASHBOARD KINERJA</h4>

            <div className="grid grid-cols-2 gap-3 text-center mb-4">
              <div className="bg-slate-800 p-3 border-2 border-slate-600 rounded-lg flex flex-col items-center shadow-inner">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Penggunaan CPU</span>
                <span className={`text-2xl font-black ${cpuColor}`}>{Math.floor(cpuLoad)}%</span>
              </div>
              <div className="bg-slate-800 p-3 border-2 border-slate-600 rounded-lg flex flex-col items-center relative overflow-hidden shadow-inner">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Req. Terbuang</span>
                <span className="text-2xl font-black text-rose-400 relative z-10">{droppedRequests}</span>
              </div>
            </div>

            <div className={`${statusBg} p-3 border-2 border-dashed ${statusBorder} rounded text-center flex flex-col items-center justify-center min-h-[48px] transition-colors duration-300`}>
              <span className={`text-xs font-black uppercase tracking-widest ${statusColor} ${showOverload ? 'glitch-text' : ''}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className={`border-8 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-0 relative flex flex-col items-center w-full h-[600px] lg:h-auto overflow-hidden ${isShaking ? 'shake' : ''}`}
            style={{
              backgroundColor: '#0f172a',
              backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-slate-900 font-black px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] text-[10px] transform -rotate-1 z-30 uppercase rounded">
              Topologi Jaringan Live
            </span>

            {showOverload && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-rose-600 text-white font-black px-8 py-5 border-8 border-slate-900 shadow-[8px_8px_0px_#0f172a] text-3xl uppercase z-40 tracking-widest pointer-events-none text-center leading-tight rounded-xl glitch-text">
                ⚠️ SERVER OVERLOAD! ⚠️
                <span className="text-sm block mt-2">LAYANAN DOWN (503 SERVICE UNAVAILABLE)</span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              className="w-full h-full block object-contain"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-sky-400 inline-block px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] mb-6 transform -rotate-1 uppercase text-black rounded">
          Infrastruktur Cloud & Jaringan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-emerald-400 border-b-2 border-slate-600 pb-2 mb-3">1. Load Balancer</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Bertindak sebagai "Polisi Lalu Lintas" di tengah jaringan. Ia menerima semua koneksi dari pengguna internet dan membaginya secara merata ke server-server yang tersedia di belakangnya agar tidak ada satu server yang bekerja terlalu berat.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-indigo-400 border-b-2 border-slate-600 pb-2 mb-3">2. Auto-Scaling</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Sistem awan cerdas (AWS, Google Cloud) dapat mendeteksi lonjakan trafik (misalnya saat <i>flash sale</i>). Daripada situs web mati (crash), sistem akan secara otomatis menyalakan server baru (Scaling Out) dan mematikannya saat sepi untuk menghemat biaya.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-rose-400 border-b-2 border-slate-600 pb-2 mb-3">3. Overload & DDoS</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Satu server memiliki batas maksimal CPU & RAM. Jika beban (Req/s) melampaui kapasitas total seluruh server, sistem akan melambat ekstrem atau menolak koneksi. Serangan DDoS sengaja membanjiri trafik ini untuk melumpuhkan layanan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}