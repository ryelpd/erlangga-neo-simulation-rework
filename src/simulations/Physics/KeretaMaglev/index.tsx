import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const TRAIN_MASS = 50000;
const GRAVITY = 9.8;
const FRICTION_COEF = 0.03;
const AIR_DENSITY = 1.225;
const TRAIN_AREA = 10;

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  speedMult: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const INITIAL_SPEED_LINES: SpeedLine[] = Array.from({ length: 30 }, () => ({
  x: Math.random() * 800,
  y: Math.random() * 250,
  length: 20 + Math.random() * 50,
  speedMult: 0.5 + Math.random() * 1.5
}));

export default function KeretaMaglev(): ReactNode {
  const [isLevitating, setIsLevitating] = useState(false);
  const [thrustKN, setThrustKN] = useState(0);
  const [dragCoef, setDragCoef] = useState(1.0);
  const [aeroLevel, setAeroLevel] = useState(1);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [frictionForce, setFrictionForce] = useState(0);
  const [dragForce, setDragForce] = useState(0);
  const [status, setStatus] = useState('KERETA BERHENTI');
  const [statusColor, setStatusColor] = useState('text-slate-400');
  const [statusBg, setStatusBg] = useState('bg-slate-800');
  const [statusBorder, setStatusBorder] = useState('border-slate-500');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const velocityRef = useRef(0);
  const positionRef = useRef(0);
  const visualTrackOffsetRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const speedLinesRef = useRef<SpeedLine[]>(INITIAL_SPEED_LINES);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const updatePhysics = useCallback(() => {
    const thrustN = thrustKN * 1000;
    const velocity = velocityRef.current;

    // Drag force
    const dragN = 0.5 * AIR_DENSITY * (velocity * velocity) * dragCoef * TRAIN_AREA;
    const dragKN = dragN / 1000;
    setDragForce(dragKN);

    // Friction force (only when not levitating and moving)
    let frictionN = 0;
    if (!isLevitating && velocity > 0) {
      frictionN = FRICTION_COEF * TRAIN_MASS * GRAVITY;
    }
    const frictionKN = frictionN / 1000;
    setFrictionForce(frictionKN);

    // Net force and acceleration
    let netForceN = thrustN - dragN - frictionN;

    if (velocity <= 0.1 && thrustN === 0) {
      netForceN = 0;
      velocityRef.current = 0;
      setFrictionForce(0);
    }

    const acceleration = netForceN / TRAIN_MASS;
    velocityRef.current += acceleration * (1 / 60);
    if (velocityRef.current < 0) velocityRef.current = 0;

    positionRef.current += velocityRef.current * (1 / 60);
    setDistance(positionRef.current / 1000);

    // Visual track offset
    visualTrackOffsetRef.current += velocityRef.current * 0.2;
    if (visualTrackOffsetRef.current > 100) visualTrackOffsetRef.current -= 100;

    // Update speed display
    setSpeed(velocityRef.current * 3.6);

    // Status update
    if (velocityRef.current < 1 && thrustKN === 0) {
      setStatus('KERETA BERHENTI');
      setStatusColor('text-slate-400');
      setStatusBg('bg-slate-800');
      setStatusBorder('border-slate-500');
    } else if (netForceN > 0) {
      setStatus('BERAKSELERASI');
      setStatusColor('text-emerald-400');
      setStatusBg('bg-emerald-900');
      setStatusBorder('border-emerald-400');
    } else if (netForceN < -100) {
      setStatus('DESELERASI (MELAMBAT)');
      setStatusColor('text-amber-400');
      setStatusBg('bg-amber-900');
      setStatusBorder('border-amber-400');
    } else {
      setStatus('KECEPATAN STABIL (CRUISING)');
      setStatusColor('text-sky-400');
      setStatusBg('bg-sky-900');
      setStatusBorder('border-sky-400');
    }

    // Particle effects (sparks if friction)
    if (!isLevitating && velocityRef.current > 10) {
      if (Math.random() < velocityRef.current / 100) {
        particlesRef.current.push({
          x: 250 + Math.random() * 100,
          y: 430,
          vx: -2 - Math.random() * 5,
          vy: -1 - Math.random() * 3,
          life: 1.0
        });
      }
    }

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.05;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  }, [isLevitating, thrustKN, dragCoef]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background - City silhouette
    ctx.fillStyle = '#1e293b';
    const bgOffset = (positionRef.current * 0.01) % 800;
    for (let i = 0; i < 3; i++) {
      const x = i * 400 - bgOffset;
      ctx.fillRect(x, 200, 80, 150);
      ctx.fillRect(x + 90, 150, 60, 200);
      ctx.fillRect(x + 160, 250, 120, 100);
      ctx.fillRect(x + 290, 100, 70, 250);
    }

    // Speed lines
    if (velocityRef.current > 10) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const line of speedLinesRef.current) {
        line.x -= (velocityRef.current * 0.5) * line.speedMult;
        if (line.x < -100) {
          line.x = 850 + Math.random() * 100;
          line.y = Math.random() * 350;
        }
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + line.length, line.y);
      }
      ctx.stroke();
    }

    // Track
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 440, 800, 110);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 450, 800, 100);

    // Electromagnetic coils
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;

    for (let x = -visualTrackOffsetRef.current; x < 800; x += 100) {
      ctx.fillRect(x, 430, 60, 15);
      ctx.strokeRect(x, 430, 60, 15);

      if (thrustKN > 0 && x > 150 && x < 500) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(x + 5, 435, 50, 5);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#94a3b8';
      }
    }

    // Train
    const trainX = 150;
    const levOffset = isLevitating ? -12 : 0;
    const trainY = 350 + levOffset;
    const trainW = 400;
    const trainH = 80;

    ctx.save();

    // Levitation glow
    if (isLevitating) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(trainX + 20, 435, trainW - 20, 5);
      ctx.shadowBlur = 0;
    }

    // Train body
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;

    ctx.beginPath();

    if (aeroLevel === 1) {
      ctx.moveTo(trainX, trainY);
      ctx.lineTo(trainX + trainW, trainY);
      ctx.lineTo(trainX + trainW, trainY + trainH);
      ctx.lineTo(trainX, trainY + trainH);
    } else if (aeroLevel === 2) {
      ctx.moveTo(trainX, trainY);
      ctx.lineTo(trainX + trainW - 60, trainY);
      ctx.quadraticCurveTo(trainX + trainW, trainY, trainX + trainW, trainY + trainH);
      ctx.lineTo(trainX, trainY + trainH);
    } else {
      ctx.moveTo(trainX, trainY);
      ctx.lineTo(trainX + trainW - 150, trainY);
      ctx.quadraticCurveTo(trainX + trainW, trainY, trainX + trainW, trainY + trainH - 10);
      ctx.lineTo(trainX + trainW, trainY + trainH);
      ctx.lineTo(trainX, trainY + trainH);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Windows
    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(trainX + 30 + (i * 60), trainY + 20, 40, 25);
    }

    // Front window
    if (aeroLevel > 1) {
      ctx.beginPath();
      ctx.moveTo(trainX + 270, trainY + 20);
      ctx.lineTo(trainX + 300, trainY + 20);
      if (aeroLevel === 2) {
        ctx.quadraticCurveTo(trainX + 330, trainY + 20, trainX + 330, trainY + 45);
      } else {
        ctx.quadraticCurveTo(trainX + 360, trainY + 20, trainX + 360, trainY + 45);
      }
      ctx.lineTo(trainX + 270, trainY + 45);
      ctx.fill();
    }

    // Stripe
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(trainX, trainY + 55, trainW - (aeroLevel === 3 ? 50 : 0), 8);

    // Undercarriage
    ctx.fillStyle = '#334155';
    ctx.fillRect(trainX + 20, trainY + trainH, trainW - 40, 15);
    ctx.strokeRect(trainX + 20, trainY + trainH, trainW - 40, 15);

    ctx.restore();

    // Friction sparks
    if (!isLevitating && particlesRef.current.length > 0) {
      for (const p of particlesRef.current) {
        ctx.fillStyle = `rgba(250, 204, 21, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Air drag visualization
    if (velocityRef.current > 20) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;

      const startX = trainX + trainW + 20;
      const startY = trainY + 40;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      if (aeroLevel === 1) {
        ctx.quadraticCurveTo(startX - 20, startY - 50, startX - 100, startY - 80);
        ctx.moveTo(startX, startY + 20);
        ctx.quadraticCurveTo(startX - 20, startY + 70, startX - 100, startY + 100);
      } else if (aeroLevel === 3) {
        ctx.lineTo(startX - 150, startY - 30);
        ctx.moveTo(startX, startY + 20);
        ctx.lineTo(startX - 150, startY + 40);
      }
      ctx.stroke();
    }
  }, [isLevitating, thrustKN, aeroLevel]);

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

  const handleLevitationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLevitating(e.target.checked);
  };

  const handleThrustChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThrustKN(parseFloat(e.target.value));
  };

  const handleAeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const level = parseInt(e.target.value);
    setAeroLevel(level);
    if (level === 1) setDragCoef(1.0);
    else if (level === 2) setDragCoef(0.5);
    else setDragCoef(0.15);
  };

  const handleBrake = () => {
    setThrustKN(0);
    setIsLevitating(false);
  };

  const aeroLabels = ['Kotak (C_d: 1.0)', 'Lengkung (C_d: 0.5)', 'Peluru (C_d: 0.15)'];

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">FISIKA ELEKTROMAGNETIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: KERETA MAGLEV
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Simulasi Daya Dorong Linear dan Levitasi Tanpa Gesekan
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md transform rotate-2 z-30 uppercase">
            Kokpit Masinis
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-indigo-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-indigo-900 uppercase text-[10px]">Sistem Levitasi Magnetik</span>
                <span className={`font-mono font-black text-sm bg-white px-2 border-2 border-black ${isLevitating ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isLevitating ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLevitating}
                  onChange={handleLevitationToggle}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-black after:border-4 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-400 border-4 border-black"></div>
              </label>
              <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Aktifkan untuk melayang dan menghilangkan gesekan roda.</p>
            </div>

            <div className="bg-amber-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-amber-900 uppercase text-[10px]">Daya Dorong (Thrust)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-amber-700">{thrustKN} kN</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={thrustKN}
                onChange={handleThrustChange}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Netral (0)</span>
                <span>Maksimal (500 kN)</span>
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-900 uppercase text-[10px]">Desain Moncong Kereta</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-700">{aeroLabels[aeroLevel - 1]}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={aeroLevel}
                onChange={handleAeroChange}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Kotak/Berat</span>
                <span>Peluru/Aero</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-black pt-4">
              <button
                onClick={handleBrake}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#881337] rounded-lg bg-rose-500 text-white hover:bg-rose-400 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                REM DARURAT (BERHENTI)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-sky-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">TELEMETRI KERETA</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Kecepatan Relatif</span>
                <span className="text-2xl font-black text-emerald-400">{speed.toFixed(0)} <span className="text-sm">km/h</span></span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Jarak Tempuh</span>
                <span className="text-2xl font-black text-white">{distance.toFixed(2)} <span className="text-sm">km</span></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-1 border-2 border-slate-700 rounded flex flex-col items-center">
                <span className="text-[8px] font-bold uppercase text-slate-400">Gaya Gesek Roda</span>
                <span className="text-xs font-black text-rose-400">-{frictionForce.toFixed(1)} kN</span>
              </div>
              <div className="bg-slate-800 p-1 border-2 border-slate-700 rounded flex flex-col items-center">
                <span className="text-[8px] font-bold uppercase text-slate-400">Hambatan Udara</span>
                <span className="text-xs font-black text-sky-400">-{dragForce.toFixed(1)} kN</span>
              </div>
            </div>

            <div className={`${statusBg} p-2 border-2 border-dashed ${statusBorder} text-center flex flex-col items-center justify-center min-h-[40px] transition-colors duration-300 rounded`}>
              <span className={`text-xs font-black uppercase tracking-widest ${statusColor}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden"
            style={{
              backgroundColor: '#0f172a',
              backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.15) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-slate-900 font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Kamera Pemantau Jalur
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
        <h3 className="text-xl font-bold bg-sky-400 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Prinsip Fisika Kereta Maglev
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-indigo-400 border-b-2 border-slate-600 pb-1 mb-2">1. Levitasi (Menghilangkan Gesekan)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Kereta konvensional tertahan oleh gaya gesek antara roda dan rel baja. Kereta Maglev menggunakan elektromagnet superkuat untuk mengangkat tubuh kereta melayang sekitar 1-10 cm di atas rel. Tanpa roda yang menyentuh rel, <b>gaya gesek padat menjadi NOL</b>.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-amber-400 border-b-2 border-slate-600 pb-1 mb-2">2. Propulsi (Motor Linear)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Alih-alih mesin berputar, Maglev ditarik ke depan menggunakan koil elektromagnetik di sepanjang jalur panduan (guideway). Kutub utara dan selatan magnet pada rel berubah-ubah dengan sangat cepat, secara konstan menarik dan mendorong kereta ke depan.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">3. Hambatan Udara (Aerodinamika)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Karena tidak ada gesekan rel, musuh terbesar Maglev adalah udara. Gaya hambat udara (Drag) meningkat secara <b>kuadratik</b> seiring kecepatan (F_d ∝ v²). Inilah mengapa kereta super cepat memiliki moncong yang sangat panjang dan runcing untuk membelah udara.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}