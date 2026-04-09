import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const STAGE_EGG = 0;
const STAGE_LARVA = 1;
const STAGE_PUPA = 2;
const STAGE_IMAGO = 3;

interface Butterfly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
}

const stageInfo = [
  { name: '1. TELUR (EGG)', color: 'text-emerald-300', bg: 'bg-emerald-900', border: 'border-emerald-400', desc: 'Embrio menempel kuat pada permukaan daun pelindung.', containerBg: '#f0fdf4' },
  { name: '2. LARVA (ULAT)', color: 'text-sky-300', bg: 'bg-sky-900', border: 'border-sky-400', desc: 'Fase makan aktif. Ulat memakan daun dengan cepat untuk mengumpulkan massa tubuh cadangan energi.', containerBg: '#f0f9ff' },
  { name: '3. PUPA (KEPOMPONG)', color: 'text-amber-300', bg: 'bg-amber-900', border: 'border-amber-400', desc: 'Fase puasa dan istirahat luar. Di dalam, tubuh lama hancur dan tubuh kupu-kupu baru sedang dirakit.', containerBg: '#fffbeb' },
  { name: '4. IMAGO (KUPU-KUPU)', color: 'text-rose-300', bg: 'bg-rose-900', border: 'border-rose-400', desc: 'Dewasa sempurna. Bersiap mencari nektar bunga dan pasangan untuk memulai siklus kehidupan baru.', containerBg: '#fff1f2' }
];

export default function MetamorfosisKupuKupu(): ReactNode {
  const [day, setDay] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [stage, setStage] = useState(STAGE_EGG);
  const [showAlert, setShowAlert] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const lastStageRef = useRef(-1);
  const alertTimerRef = useRef(0);
  const butterflyRef = useRef<Butterfly>({
    x: 400,
    y: 275,
    vx: 2,
    vy: -1,
    targetX: 400,
    targetY: 275
  });
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const drawBranchAndLeaf = useCallback((ctx: CanvasRenderingContext2D, isEaten: boolean) => {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(100, 150);
    ctx.quadraticCurveTo(300, 180, 700, 100);
    ctx.stroke();

    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(400, 150);
    ctx.quadraticCurveTo(450, 250, 400, 300);
    ctx.stroke();

    ctx.save();
    ctx.translate(380, 280);
    ctx.rotate(Math.PI / 6);

    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(0, 0);

    if (isEaten) {
      ctx.bezierCurveTo(30, 20, 80, 30, 100, 10);
      ctx.arc(110, 5, 10, Math.PI, 0, true);
      ctx.bezierCurveTo(140, -10, 180, -20, 200, -80);
      ctx.bezierCurveTo(150, -70, 100, -60, 80, -50);
      ctx.arc(70, -45, 12, 0, Math.PI, true);
      ctx.bezierCurveTo(30, -30, 10, -10, 0, 0);
    } else {
      ctx.bezierCurveTo(50, 50, 150, 50, 200, -80);
      ctx.bezierCurveTo(150, -100, 50, -50, 0, 0);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(100, -10, 190, -75);
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawEggs = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;

    const positions = [
      { x: 420, y: 260 }, { x: 435, y: 255 }, { x: 425, y: 275 },
      { x: 445, y: 265 }, { x: 410, y: 250 }, { x: 455, y: 250 }
    ];

    for (const pos of positions) {
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, 6, 8, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pos.x - 2, pos.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
    }
  }, []);

  const drawCaterpillar = useCallback((ctx: CanvasRenderingContext2D, progress: number, time: number) => {
    const startX = 480;
    const endX = 350;
    const baseX = startX - (startX - endX) * progress;
    const baseY = 230 + progress * 40;

    const segments = 8;
    const segRadius = 12;

    for (let i = segments; i >= 0; i--) {
      const wave = Math.sin(time * 3 - i * 0.5);
      const segX = baseX + i * (segRadius * 1.2);
      const segY = baseY + wave * 4 - i * 5;

      ctx.beginPath();
      ctx.arc(segX, segY, segRadius, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#4ade80' : '#a3e635';
      ctx.fill();
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (i > 1 && i < segments - 1) {
        ctx.beginPath();
        ctx.moveTo(segX - 4, segY + segRadius);
        ctx.lineTo(segX - 4, segY + segRadius + 5);
        ctx.moveTo(segX + 4, segY + segRadius);
        ctx.lineTo(segX + 4, segY + segRadius + 5);
        ctx.stroke();
      }

      if (i === 0) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(segX - 5, segY - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(segX - 5, segY - segRadius);
        ctx.lineTo(segX - 10, segY - segRadius - 8);
        ctx.stroke();
      }
    }
  }, []);

  const drawPupa = useCallback((ctx: CanvasRenderingContext2D, progress: number, time: number) => {
    const anchorX = 400;
    const anchorY = 300;

    const r = 34 + progress * 50;
    const g = 197 - progress * 100;
    const b = 94 - progress * 50;

    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(anchorX, anchorY + 20);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(anchorX, anchorY + 20);
    ctx.rotate(Math.sin(time) * 0.05);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-30, 20, -40, 80, 0, 120);
    ctx.bezierCurveTo(40, 80, 30, 20, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-15, 30); ctx.lineTo(15, 30);
    ctx.moveTo(-25, 60); ctx.lineTo(25, 60);
    ctx.moveTo(-20, 90); ctx.lineTo(20, 90);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.stroke();

    if (progress > 0.7) {
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.bezierCurveTo(-20, 50, -25, 90, 0, 100);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
      ctx.fill();
    }

    ctx.restore();
  }, []);

  const drawButterfly = useCallback((ctx: CanvasRenderingContext2D, butterfly: Butterfly, time: number) => {
    const flap = Math.sin(time * 15);
    const wingWidthScale = Math.abs(flap);

    ctx.save();
    ctx.translate(butterfly.x, butterfly.y);

    const angle = Math.atan2(butterfly.vy, butterfly.vx);
    ctx.rotate(angle + Math.PI / 2);

    ctx.save();
    ctx.scale(wingWidthScale, 1);
    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-60, -60, -100, 20, -10, 20);
    ctx.bezierCurveTo(-60, 30, -40, 80, 0, 40);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.arc(-30, -10, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-20, 40, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.scale(wingWidthScale, 1);
    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(60, -60, 100, 20, 10, 20);
    ctx.bezierCurveTo(60, 30, 40, 80, 0, 40);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.arc(30, -10, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, 40, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(0, 10, 5, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -15, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -20); ctx.quadraticCurveTo(-10, -35, -20, -30);
    ctx.moveTo(2, -20); ctx.quadraticCurveTo(10, -35, 20, -30);
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawFlowers = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();

    const drawFlower = (fx: number, fy: number, scale: number, color: string) => {
      ctx.translate(fx, fy);
      ctx.scale(scale, scale);
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.rotate(Math.PI * 2 / 5);
        ctx.beginPath();
        ctx.ellipse(0, -20, 15, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#eab308';
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.scale(1 / scale, 1 / scale);
      ctx.translate(-fx, -fy);
    };

    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(150, 550); ctx.quadraticCurveTo(100, 450, 150, 350); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(650, 550); ctx.quadraticCurveTo(700, 450, 650, 350); ctx.stroke();

    drawFlower(150, 350, 1.2, '#fbcfe8');
    drawFlower(650, 350, 0.9, '#bfdbfe');

    ctx.restore();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isEaten = day >= 10;

    if (day < 25) {
      drawBranchAndLeaf(ctx, isEaten);
    } else {
      drawFlowers(ctx);
    }

    if (day < 5) {
      drawEggs(ctx);
    } else if (day < 15) {
      const progress = (day - 5) / 10;
      drawCaterpillar(ctx, progress, timeRef.current);
    } else if (day < 25) {
      const progress = (day - 15) / 10;
      drawPupa(ctx, progress, timeRef.current);
    } else {
      drawButterfly(ctx, butterflyRef.current, timeRef.current);
    }
  }, [day, drawBranchAndLeaf, drawEggs, drawCaterpillar, drawPupa, drawButterfly, drawFlowers]);

  const updatePhysics = useCallback(() => {
    if (autoPlay) {
      setDay(prev => {
        const newDay = prev + 0.05;
        return newDay > 30 ? 30 : newDay;
      });
    }

    timeRef.current += 0.1;

    const currentStage = day < 5 ? STAGE_EGG : day < 15 ? STAGE_LARVA : day < 25 ? STAGE_PUPA : STAGE_IMAGO;

    if (currentStage !== lastStageRef.current && lastStageRef.current !== -1) {
      setShowAlert(true);
      alertTimerRef.current = 60;
    }
    lastStageRef.current = currentStage;
    setStage(currentStage);

    if (alertTimerRef.current > 0) {
      alertTimerRef.current--;
      if (alertTimerRef.current <= 0) setShowAlert(false);
    }

    if (currentStage === STAGE_IMAGO) {
      const butterfly = butterflyRef.current;
      if (Math.random() < 0.02) {
        butterfly.targetX = 100 + Math.random() * (800 - 200);
        butterfly.targetY = 100 + Math.random() * (550 - 200);
      }

      const dx = butterfly.targetX - butterfly.x;
      const dy = butterfly.targetY - butterfly.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 10) {
        butterfly.vx += (dx / dist) * 0.1;
        butterfly.vy += (dy / dist) * 0.1;
      }

      butterfly.vx += (Math.random() - 0.5) * 1.5;
      butterfly.vy += (Math.random() - 0.5) * 1.5;

      const speed = Math.hypot(butterfly.vx, butterfly.vy);
      if (speed > 4) {
        butterfly.vx = (butterfly.vx / speed) * 4;
        butterfly.vy = (butterfly.vy / speed) * 4;
      }

      butterfly.x += butterfly.vx;
      butterfly.y += butterfly.vy;

      if (butterfly.x < 50 || butterfly.x > 800 - 50) butterfly.vx *= -1;
      if (butterfly.y < 50 || butterfly.y > 550 - 50) butterfly.vy *= -1;
    } else {
      butterflyRef.current.x = 400;
      butterflyRef.current.y = 350;
    }
  }, [autoPlay, day]);

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

  const handleReset = () => {
    setDay(0);
    setAutoPlay(false);
  };

  const info = stageInfo[stage];

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">BIOLOGI & SIKLUS HIDUP</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: METAMORFOSIS
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Tahapan Perkembangan Sempurna (Holometabola) Kupu-Kupu
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#10b981] text-md transform rotate-2 z-30 uppercase">
            Panel Kendali Waktu
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-900 uppercase text-[10px]">Waktu Perkembangan</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-700">Hari ke-{Math.floor(day)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.1"
                value={day}
                onChange={(e) => setDay(parseFloat(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Awal (Telur)</span>
                <span>Akhir (Dewasa)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Pengaturan Simulasi</label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-emerald-600">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                Animasi Waktu Otomatis
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                KEMBALI KE FASE TELUR
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-emerald-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA FASE SAAT INI</h4>

            <div className="text-center mb-3">
              <span className="text-[9px] font-bold uppercase text-sky-400 mb-1">Tahap Metamorfosis:</span><br />
              <span className={`text-2xl font-black ${info.color}`}>{info.name}</span>
            </div>

            <div className={`${info.bg} p-3 border-2 border-dashed ${info.border} text-center flex flex-col items-center justify-center min-h-[60px] transition-colors duration-300 rounded`}>
              <span className="text-xs font-bold text-emerald-100 leading-tight">{info.desc}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden"
            style={{
              backgroundColor: info.containerBg,
              backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.2) 2px, transparent 2px)',
              backgroundSize: '40px 40px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-emerald-700 font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Kamera Pengamatan Habitat
            </span>

            {showAlert && (
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-black font-black px-6 py-2 border-4 border-black shadow-[6px_6px_0px_#000] text-xl uppercase z-40 tracking-widest pointer-events-none text-center animate-pulse">
                FASE BERUBAH
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
        <h3 className="text-xl font-bold bg-emerald-500 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Tahapan Metamorfosis Sempurna (Holometabola)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-emerald-400 border-b-2 border-slate-600 pb-1 mb-2">1. Telur (Hari 0-4)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Siklus dimulai ketika kupu-kupu betina meletakkan telurnya pada daun tanaman inang. Telur ini sangat kecil dan memiliki cangkang keras pelindung. Di dalamnya, embrio ulat mulai terbentuk.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">2. Larva / Ulat (Hari 5-14)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Ulat menetas dan memiliki satu tujuan: MENGAMBIL NUTRISI. Mereka akan makan daun dengan rakus, tumbuh membesar, dan mengalami pergantian kulit (molting) beberapa kali selama fase ini.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-amber-400 border-b-2 border-slate-600 pb-1 mb-2">3. Pupa (Hari 15-24)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Ulat menggantung terbalik dan membentuk kepompong (chrysalis) keras. Di dalam cangkang ini, tubuh ulat hancur menjadi cairan seluler dan dirakit ulang secara radikal membentuk anatomi kupu-kupu.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-rose-400 border-b-2 border-slate-600 pb-1 mb-2">4. Imago (Hari 25-30+)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Kupu-kupu dewasa keluar dari kepompong. Sayapnya awalnya basah dan terlipat, sehingga ia harus memompakan cairan (hemolimfa) ke sayapnya agar mengembang sebelum bisa terbang bebas untuk bereproduksi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}