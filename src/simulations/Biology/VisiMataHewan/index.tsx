import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
}

interface Butterfly {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  flap: number;
}

interface Apple {
  x: number;
  y: number;
}

interface Flower {
  x: number;
  y: number;
  color: string;
}

const INITIAL_CLOUDS: Cloud[] = [
  { x: 100, y: 100, scale: 1, speed: 0.2 },
  { x: 500, y: 50, scale: 0.8, speed: 0.15 },
  { x: -100, y: 150, scale: 1.2, speed: 0.25 }
];

const APPLES: Apple[] = [
  { x: 600, y: 160 }, { x: 550, y: 220 }, { x: 650, y: 230 },
  { x: 580, y: 260 }, { x: 620, y: 190 }
];

const FLOWERS: Flower[] = [
  { x: 150, y: 450, color: '#e11d48' },
  { x: 250, y: 480, color: '#9333ea' },
  { x: 350, y: 430, color: '#ea580c' },
  { x: 100, y: 400, color: '#2563eb' }
];

type VisionMode = 'HUMAN' | 'DOG' | 'BIRD';

interface Cone {
  name: string;
  color: string;
  shadow: string;
}

const CONES: Cone[] = [
  { name: 'UV-Cone (Ultraviolet)', color: 'bg-fuchsia-500', shadow: '#d946ef' },
  { name: 'S-Cone (Biru)', color: 'bg-blue-500', shadow: '#3b82f6' },
  { name: 'M-Cone (Hijau)', color: 'bg-green-500', shadow: '#22c55e' },
  { name: 'L-Cone (Merah)', color: 'bg-red-500', shadow: '#ef4444' }
];

const MODE_CONFIG: Record<VisionMode, {
  statusText: string;
  statusBg: string;
  statusBorder: string;
  statusTextCol: string;
  activeCones: boolean[];
  filterClass: string;
  showUVAlert: boolean;
}> = {
  HUMAN: {
    statusText: 'SPEKTRUM PENUH (TRICROMATIC)',
    statusBg: 'bg-emerald-900',
    statusBorder: 'border-emerald-500',
    statusTextCol: 'text-emerald-300',
    activeCones: [false, true, true, true],
    filterClass: '',
    showUVAlert: false
  },
  DOG: {
    statusText: 'BUTA WARNA MERAH-HIJAU (DICHROMATIC)',
    statusBg: 'bg-amber-900',
    statusBorder: 'border-amber-500',
    statusTextCol: 'text-amber-300',
    activeCones: [false, true, true, false],
    filterClass: 'filter-dichromatic',
    showUVAlert: false
  },
  BIRD: {
    statusText: 'SPEKTRUM ULTRAVIOLET (TETRACHROMATIC)',
    statusBg: 'bg-fuchsia-900',
    statusBorder: 'border-fuchsia-500',
    statusTextCol: 'text-fuchsia-300',
    activeCones: [true, true, true, true],
    filterClass: 'filter-tetrachromatic',
    showUVAlert: true
  }
};

export default function VisiMataHewan(): ReactNode {
  const [mode, setMode] = useState<VisionMode>('HUMAN');
  const [time, setTime] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cloudsRef = useRef<Cloud[]>(INITIAL_CLOUDS);
  const butterflyRef = useRef<Butterfly>({
    x: 200, y: 400,
    targetX: 400, targetY: 300,
    vx: 0, vy: 0,
    flap: 0
  });
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const updatePhysics = useCallback(() => {
    setTime(prev => prev + 0.05);

    // Move clouds
    for (const c of cloudsRef.current) {
      c.x += c.speed;
      if (c.x > 900) c.x = -200;
    }

    // Move butterfly
    const butterfly = butterflyRef.current;
    if (Math.random() < 0.02) {
      if (Math.random() > 0.5) {
        butterfly.targetX = 200 + Math.random() * 150;
        butterfly.targetY = 350 + Math.random() * 100;
      } else {
        butterfly.targetX = 600 + Math.random() * 100;
        butterfly.targetY = 200 + Math.random() * 100;
      }
    }

    const dx = butterfly.targetX - butterfly.x;
    const dy = butterfly.targetY - butterfly.y;
    butterfly.vx += dx * 0.001;
    butterfly.vy += dy * 0.001;

    const spd = Math.hypot(butterfly.vx, butterfly.vy);
    if (spd > 2) {
      butterfly.vx = (butterfly.vx / spd) * 2;
      butterfly.vy = (butterfly.vy / spd) * 2;
    }

    butterfly.x += butterfly.vx + Math.sin(time * 10) * 0.5;
    butterfly.y += butterfly.vy + Math.cos(time * 12) * 0.5;
    butterfly.flap = Math.sin(time * 20);
  }, [time]);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Sky
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(700, 100, 60, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    ctx.fillStyle = '#ffffff';
    for (const c of cloudsRef.current) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.arc(25, -15, 35, 0, Math.PI * 2);
      ctx.arc(50, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Distant Mountains
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(0, 350);
    ctx.lineTo(200, 200);
    ctx.lineTo(450, 350);
    ctx.lineTo(800, 150);
    ctx.lineTo(800, 550);
    ctx.lineTo(0, 550);
    ctx.fill();

    // Ground Grass
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 350, canvas.width, 200);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 400, canvas.width, 150);

    // Apple Tree - Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(580, 250, 40, 200);

    // Leaves
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(600, 200, 80, 0, Math.PI * 2);
    ctx.arc(540, 250, 70, 0, Math.PI * 2);
    ctx.arc(660, 250, 70, 0, Math.PI * 2);
    ctx.fill();

    // Apples
    for (const a of APPLES) {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(a.x, a.y, 12, 0, Math.PI * 2);
      ctx.fill();

      if (mode === 'BIRD') {
        ctx.strokeStyle = '#d946ef';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 14, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(a.x - 4, a.y - 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Flowers
    for (const f of FLOWERS) {
      // Stem
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x, f.y + 100);
      ctx.stroke();

      // Petals
      ctx.fillStyle = f.color;
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.ellipse(f.x + Math.cos(angle) * 15, f.y + Math.sin(angle) * 15, 15, 10, angle, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // UV patterns for bird mode
      if (mode === 'BIRD') {
        ctx.strokeStyle = '#f0abfc';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI * 2) / 10;
          ctx.beginPath();
          ctx.moveTo(f.x + Math.cos(angle) * 5, f.y + Math.sin(angle) * 5);
          ctx.lineTo(f.x + Math.cos(angle) * 25, f.y + Math.sin(angle) * 25);
          ctx.stroke();
        }
        ctx.fillStyle = '#d946ef';
        ctx.beginPath();
        ctx.arc(f.x, f.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Butterfly
    const butterfly = butterflyRef.current;
    ctx.save();
    ctx.translate(butterfly.x, butterfly.y);

    const angle = Math.atan2(butterfly.vy, butterfly.vx);
    ctx.rotate(angle + Math.PI / 2);

    const flapScale = Math.max(0.1, Math.abs(butterfly.flap));

    ctx.fillStyle = '#f97316';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // Wing left
    ctx.save();
    ctx.scale(flapScale, 1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-30, -30, -20, 0);
    ctx.quadraticCurveTo(-30, 20, 0, 10);
    ctx.fill();
    ctx.stroke();

    if (mode === 'BIRD') {
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(-10, -5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Wing right
    ctx.save();
    ctx.scale(flapScale, 1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(30, -30, 20, 0);
    ctx.quadraticCurveTo(30, 20, 0, 10);
    ctx.fill();
    ctx.stroke();

    if (mode === 'BIRD') {
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(10, -5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Body
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [mode]);

  useEffect(() => {
    const loop = () => {
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
  }, [updatePhysics, drawScene]);

  const config = MODE_CONFIG[mode];

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-900 p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      {/* SVG Color Matrix Filter for dog vision */}
      <svg width="0" height="0" className="absolute hidden">
        <filter id="dog-vision">
          <feColorMatrix type="matrix" values="
            0.625 0.375 0 0 0
            0.70  0.30  0 0 0
            0     0.30  0.70 0 0
            0     0     0 1 0
          "/>
        </filter>
      </svg>

      <style>{`
        .filter-dichromatic {
          filter: url('#dog-vision');
        }
        .filter-tetrachromatic {
          filter: contrast(1.3) saturate(1.5);
        }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-rose-200 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 w-full relative overflow-hidden">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] font-bold text-sm transform -rotate-3 z-10">BIOLOGI & OPTIK FISIS</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight relative z-10">
          LAB VIRTUAL: VISI MATA HEWAN
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] relative z-10">
          Simulasi Penglihatan Trikromatik, Dikromatik, dan Tetrakromatik
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-slate-900 shadow-[4px_4px_0px_#f43f5e] text-md transform rotate-2 z-30 uppercase">
            Pemilih Spesies
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Pilih Lensa Pengamatan:</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setMode('HUMAN')}
                className={`border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-between gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${mode === 'HUMAN' ? 'bg-emerald-400 text-black hover:bg-emerald-300' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
              >
                <span>👨 MANUSIA (Trikromatik)</span>
                <span className={`text-xs px-2 py-1 rounded ${mode === 'HUMAN' ? 'bg-black text-white' : 'bg-slate-400 text-white'}`}>3 Sel Kerucut</span>
              </button>
              <button
                onClick={() => setMode('DOG')}
                className={`border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-between gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${mode === 'DOG' ? 'bg-emerald-400 text-black hover:bg-emerald-300' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
              >
                <span>🐕 ANJING (Dikromatik)</span>
                <span className={`text-xs px-2 py-1 rounded ${mode === 'DOG' ? 'bg-black text-white' : 'bg-slate-400 text-white'}`}>2 Sel Kerucut</span>
              </button>
              <button
                onClick={() => setMode('BIRD')}
                className={`border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-between gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${mode === 'BIRD' ? 'bg-emerald-400 text-black hover:bg-emerald-300' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
              >
                <span>🦅 BURUNG (Tetrakromatik)</span>
                <span className={`text-xs px-2 py-1 rounded ${mode === 'BIRD' ? 'bg-black text-white' : 'bg-fuchsia-500 text-white'}`}>4 Sel Kerucut</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-rose-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">SEL FOTORESEPTOR AKTIF</h4>

            <div className="flex flex-col gap-2 mb-3">
              {CONES.map((cone, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between bg-slate-800 p-2 border-2 border-slate-600 rounded transition-all duration-300 ${config.activeCones[i] ? '' : 'opacity-30 grayscale'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cone.color}`} style={{ boxShadow: `0 0 8px ${cone.shadow}` }}></div>
                    <span className="text-xs font-bold uppercase">{cone.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${config.activeCones[i] ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {config.activeCones[i] ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              ))}
            </div>

            <div className={`${config.statusBg} p-3 border-2 border-dashed ${config.statusBorder} rounded text-center flex flex-col items-center justify-center min-h-[48px] transition-colors duration-300`}>
              <span className={`text-xs font-black uppercase tracking-widest ${config.statusTextCol}`}>
                {config.statusText}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="border-8 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-0 relative flex flex-col items-center w-full h-[600px] lg:h-auto overflow-hidden"
            style={{
              backgroundColor: '#f8fafc',
              backgroundImage: 'linear-gradient(rgba(244, 63, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(244, 63, 94, 0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-slate-900 font-black px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] text-[10px] transform -rotate-1 z-40 uppercase rounded">
              Lensa Kamera (Simulasi Visual)
            </span>

            {config.showUVAlert && (
              <div className="absolute top-4 right-4 bg-fuchsia-600 text-white font-black px-4 py-2 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] text-xs uppercase z-40 glitch-text tracking-widest text-center rounded">
                ✨ SINAR ULTRAVIOLET TERDETEKSI
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              className={`w-full h-full block object-cover transition-all duration-700 ${config.filterClass}`}
            />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-rose-400 inline-block px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] mb-6 transform -rotate-1 uppercase text-black rounded">
          Bagaimana Mata Melihat Warna?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-emerald-400 border-b-2 border-slate-600 pb-2 mb-3">1. Trikromatik (Manusia)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Manusia memiliki 3 jenis sel fotoreseptor yang disebut <b>Sel Kerucut (Cones)</b> di retinanya. Sel ini sensitif terhadap panjang gelombang Biru (Short), Hijau (Medium), dan Merah (Long). Kombinasi ketiganya memungkinkan kita melihat jutaan gradasi warna.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-sky-400 border-b-2 border-slate-600 pb-2 mb-3">2. Dikromatik (Anjing & Kucing)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Hewan mamalia lain rata-rata hanya memiliki 2 sel kerucut (Biru dan Kuning/Hijau). Mereka mengalami kondisi yang identik dengan <i>Buta Warna Merah-Hijau (Deuteranopia)</i> pada manusia. Sebuah apel merah di pohon hijau akan tampak menyatu dengan warna kecoklatan/kuning kusam.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-fuchsia-400 border-b-2 border-slate-600 pb-2 mb-3">3. Tetrakromatik (Burung & Lebah)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Beberapa burung dan serangga memiliki 4 jenis sel kerucut. Sel keempat ini mampu mendeteksi sinar <b>Ultraviolet (UV)</b> yang tidak kasat mata bagi manusia. Alam merespons ini: banyak bunga memiliki pola garis-garis "landasan pacu" ber-UV tinggi untuk memandu lebah ke nektar!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}