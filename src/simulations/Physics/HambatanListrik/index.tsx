import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const VOLTAGE = 12.0;
const BASE_BULB_R = 5.0;
const NUM_ELECTRONS = 40;

interface Material {
  name: string;
  rho: number;
  color: string;
}

interface Electron {
  progress: number;
}

interface PathSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  len: number;
}

const materials: Material[] = [
  { name: "Tembaga", rho: 1.68e-8, color: "#d97706" },
  { name: "Aluminium", rho: 2.82e-8, color: "#94a3b8" },
  { name: "Besi", rho: 1.00e-7, color: "#475569" },
  { name: "Karbon", rho: 3.50e-5, color: "#1e293b" }
];

export default function HambatanListrik(): ReactNode {
  const [lengthM, setLengthM] = useState(50);
  const [areaMm2, setAreaMm2] = useState(1.0);
  const [materialIndex, setMaterialIndex] = useState(0);
  const [showElectrons, setShowElectrons] = useState(true);
  const [resistance, setResistance] = useState(0);
  const [current, setCurrent] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const electronsRef = useRef<Electron[]>([]);
  const pathRef = useRef<PathSegment[]>([]);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const currentMaterial = materials[materialIndex];

  const initPath = useCallback(() => {
    pathRef.current = [
      { x1: 100, y1: 150, x2: 700, y2: 150, len: 600 },
      { x1: 700, y1: 150, x2: 700, y2: 400, len: 250 },
      { x1: 700, y1: 400, x2: 100, y2: 400, len: 600 },
      { x1: 100, y1: 400, x2: 100, y2: 150, len: 250 }
    ];

    electronsRef.current = [];
    for (let i = 0; i < NUM_ELECTRONS; i++) {
      electronsRef.current.push({ progress: i / NUM_ELECTRONS });
    }
  }, []);

  const updatePhysics = useCallback(() => {
    const areaM2 = areaMm2 * 1e-6;
    const rWire = currentMaterial.rho * (lengthM / areaM2);
    const rTotal = rWire + BASE_BULB_R;
    const iTotal = VOLTAGE / rTotal;

    setResistance(rWire);
    setCurrent(iTotal);
  }, [lengthM, areaMm2, currentMaterial]);

  const getPathCoord = useCallback((progress: number): { x: number; y: number } => {
    const totalLen = 1700;
    const targetDist = progress * totalLen;
    let currentDist = 0;

    for (const seg of pathRef.current) {
      if (targetDist <= currentDist + seg.len) {
        const ratio = (targetDist - currentDist) / seg.len;
        const x = seg.x1 + (seg.x2 - seg.x1) * ratio;
        const y = seg.y1 + (seg.y2 - seg.y1) * ratio;
        return { x, y };
      }
      currentDist += seg.len;
    }
    return { x: pathRef.current[0].x1, y: pathRef.current[0].y1 };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const visualWidth = 100 + ((lengthM - 1) / 199) * 500;
    const visualHeight = 4 + ((areaMm2 - 0.1) / 9.9) * 36;

    const wireX = 400 - visualWidth / 2;
    const wireY = 400;

    ctx.beginPath();
    ctx.moveTo(100, 150);
    ctx.lineTo(700, 150);
    ctx.lineTo(700, 400);
    ctx.lineTo(wireX + visualWidth, 400);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(wireX, 400);
    ctx.lineTo(100, 400);
    ctx.lineTo(100, 150);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = currentMaterial.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillRect(wireX, wireY - visualHeight / 2, visualWidth, visualHeight);
    ctx.strokeRect(wireX, wireY - visualHeight / 2, visualWidth, visualHeight);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px "Space Grotesk"';
    ctx.textAlign = 'center';
    ctx.fillText("Kawat Uji", 400, wireY + visualHeight / 2 + 20);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(70, 180, 60, 90);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(70, 150, 60, 30);
    ctx.fillStyle = '#000';
    ctx.strokeRect(70, 150, 60, 120);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText("+", 100, 172);
    ctx.fillText("-", 100, 260);
    ctx.font = 'bold 12px monospace';
    ctx.fillText("12V", 100, 220);

    const bulbX = 700;
    const bulbY = 150;

    const brightness = Math.min(1.0, current / 2.4);

    if (brightness > 0.05) {
      const glowGradient = ctx.createRadialGradient(bulbX, bulbY - 30, 10, bulbX, bulbY - 30, 80 * brightness);
      glowGradient.addColorStop(0, `rgba(250, 204, 21, ${brightness})`);
      glowGradient.addColorStop(1, 'rgba(250, 204, 21, 0)');

      ctx.beginPath();
      ctx.arc(bulbX, bulbY - 30, 80 * brightness, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(bulbX, bulbY - 30, 20, 0, Math.PI * 2);
    ctx.fillStyle = brightness > 0.05 ? '#fef08a' : '#e2e8f0';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.fillRect(bulbX - 10, bulbY - 10, 20, 20);
    ctx.strokeRect(bulbX - 10, bulbY - 10, 20, 20);

    if (showElectrons && current > 0.01) {
      const speed = current * 0.002;

      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;

      for (const e of electronsRef.current) {
        e.progress += speed;
        if (e.progress > 1) e.progress -= 1;

        const pos = getPathCoord(e.progress);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [lengthM, areaMm2, currentMaterial, current, showElectrons, getPathCoord]);

  useEffect(() => {
    initPath();
  }, [initPath]);

  useEffect(() => {
    updatePhysics();
  }, [updatePhysics]);

  useEffect(() => {
    const loop = () => {
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  const formatResistance = (r: number): string => {
    if (r > 1000) {
      return (r / 1000).toFixed(2) + " kΩ";
    }
    return r.toFixed(2) + " Ω";
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-amber-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">FISIKA DASAR (LISTRIK DINAMIS)</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: HAMBATAN KAWAT
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Pengaruh Panjang, Luas Penampang, dan Jenis Bahan terhadap Resistansi
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f59e0b] text-md transform rotate-2 z-30 uppercase">
            Panel Dimensi Kawat
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-900 uppercase text-[10px]">Panjang Kawat (<span className="italic">L</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-blue-600">{lengthM} m</span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                step="1"
                value={lengthM}
                onChange={(e) => setLengthM(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Pendek (1m)</span>
                <span>Panjang (200m)</span>
              </div>
            </div>

            <div className="bg-pink-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-pink-900 uppercase text-[10px]">Luas Penampang (<span className="italic">A</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-pink-600">{areaMm2.toFixed(1)} mm²</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                value={areaMm2}
                onChange={(e) => setAreaMm2(parseFloat(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Tipis</span>
                <span>Tebal</span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-amber-900 uppercase text-[10px]">Bahan Kawat (<span className="italic">ρ</span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black" style={{ color: currentMaterial.color }}>{currentMaterial.name}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={materialIndex}
                onChange={(e) => setMaterialIndex(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Tembaga</span>
                <span>Aluminium</span>
                <span>Besi</span>
                <span>Karbon</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Visualisasi Sirkuit</label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input
                  type="checkbox"
                  checked={showElectrons}
                  onChange={(e) => setShowElectrons(e.target.checked)}
                  className="w-4 h-4 accent-slate-800"
                />
                Animasi Aliran Elektron
              </label>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-amber-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">MULTIMETER DIGITAL</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Hambatan Kawat (<span className="italic">R</span>)</span>
                <span className="text-xl font-black text-amber-400">{formatResistance(resistance)}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Kuat Arus (<span className="italic">I</span>)</span>
                <span className="text-xl font-black text-sky-400">{current.toFixed(3)} A</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-center flex flex-col items-center justify-center min-h-[50px] rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Sumber Tegangan Baterai (<span className="italic">V</span>):</span>
              <span className="text-sm font-black text-white uppercase tracking-widest">12.0 Volt</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-[#f8fafc] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden" style={{ backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(148, 163, 184, 0.2) 2px, transparent 2px)', backgroundSize: '40px 40px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Meja Uji Sirkuit Tertutup
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
        <h3 className="text-xl font-bold bg-amber-500 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Hukum Ohm & Resistansi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-blue-400 border-b-2 border-slate-600 pb-1 mb-2">Panjang (L)</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Hambatan berbanding lurus dengan panjang kawat. Semakin panjang kawat penghantar, semakin jauh jarak yang harus ditempuh elektron, sehingga hambatan totalnya semakin besar (arus melemah).
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-pink-400 border-b-2 border-slate-600 pb-1 mb-2">Luas Penampang (A)</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Hambatan berbanding terbalik dengan luas penampang (ketebalan). Kabel yang lebih tebal memberikan lebih banyak "ruang" bagi elektron untuk mengalir, sehingga hambatannya mengecil (arus membesar).
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-amber-400 border-b-2 border-slate-600 pb-1 mb-2">Formula: R = ρ x L/A</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              ρ (Rho) adalah hambatan jenis bahan dasar. Tembaga memiliki ρ yang sangat kecil sehingga menjadi konduktor yang sangat baik. Karbon memiliki ρ ribuan kali lipat lebih besar, sering digunakan sebagai resistor penahan arus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}