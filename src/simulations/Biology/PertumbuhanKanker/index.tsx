import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const MAX_CELLS = 800;
const NORMAL_RADIUS = 7;
const CANCER_RADIUS = 8;
const NORMAL_DIV_TIME = 150;
const CANCER_DIV_TIME = 60;
const MAX_NEIGHBORS_NORMAL = 5;

interface Cell {
  x: number;
  y: number;
  type: 'normal' | 'cancer';
  r: number;
  age: number;
  divTimer: number;
  markedForDeath: boolean;
  offsetAngle: number;
  irregularity: number;
}

interface ImmuneCell {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  target: Cell | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const immuneLabels = ["Tertekan (0)", "Sangat Lemah (1)", "Aktif (2)", "Kuat (3)", "Agresif (4)", "Maksimal (5)"];

export default function PertumbuhanKanker(): ReactNode {
  const [mutationRate, setMutationRate] = useState(1);
  const [immuneStrength, setImmuneStrength] = useState(2);
  const [normalCount, setNormalCount] = useState(0);
  const [cancerCount, setCancerCount] = useState(0);
  const [status, setStatus] = useState('JARINGAN SEHAT');
  const [statusColor, setStatusColor] = useState('text-sky-400');
  const [showAlert, setShowAlert] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<Cell[]>([]);
  const immuneCellsRef = useRef<ImmuneCell[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const createCell = useCallback((x: number, y: number, type: 'normal' | 'cancer'): Cell => {
    return {
      x,
      y,
      type,
      r: type === 'normal' ? NORMAL_RADIUS : CANCER_RADIUS,
      age: 0,
      divTimer: Math.random() * (type === 'normal' ? NORMAL_DIV_TIME : CANCER_DIV_TIME),
      markedForDeath: false,
      offsetAngle: Math.random() * Math.PI * 2,
      irregularity: type === 'cancer' ? Math.random() * 3 : 0
    };
  }, []);

  const createImmuneCell = useCallback((x: number, y: number): ImmuneCell => {
    return {
      x,
      y,
      r: 6,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      target: null
    };
  }, []);

  const createDeathParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        color
      });
    }
  }, []);

  const initSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    cellsRef.current = [];
    immuneCellsRef.current = [];
    particlesRef.current = [];
    setShowAlert(false);

    for (let i = 0; i < 30; i++) {
      cellsRef.current.push(
        createCell(
          canvas.width / 2 + (Math.random() - 0.5) * 100,
          canvas.height / 2 + (Math.random() - 0.5) * 100,
          'normal'
        )
      );
    }
  }, [createCell]);

  const updatePhysics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mutationRateValue = mutationRate / 100;

    // Adjust immune cell count
    const targetImmuneCount = immuneStrength * 3;
    while (immuneCellsRef.current.length < targetImmuneCount) {
      immuneCellsRef.current.push(createImmuneCell(Math.random() * canvas.width, Math.random() * canvas.height));
    }
    while (immuneCellsRef.current.length > targetImmuneCount) {
      immuneCellsRef.current.pop();
    }

    const cells = cellsRef.current;

    for (let i = 0; i < cells.length; i++) {
      let neighbors = 0;
      for (let j = i + 1; j < cells.length; j++) {
        const dx = cells[i].x - cells[j].x;
        const dy = cells[i].y - cells[j].y;
        const distSq = dx * dx + dy * dy;
        const minDist = cells[i].r + cells[j].r;

        if (distSq < minDist * minDist) {
          neighbors++;
          const pushFactor = cells[i].type === 'cancer' || cells[j].type === 'cancer' ? 0.3 : 0.1;
          let dist = Math.sqrt(distSq);
          if (dist === 0) dist = 0.1;

          const overlap = minDist - dist;
          const fx = (dx / dist) * overlap * pushFactor;
          const fy = (dy / dist) * overlap * pushFactor;

          cells[i].x += fx;
          cells[i].y += fy;
          cells[j].x -= fx;
          cells[j].y -= fy;
        } else if (distSq < (minDist * 3) * (minDist * 3)) {
          neighbors++;
        }
      }

      cells[i].x = Math.max(10, Math.min(canvas.width - 10, cells[i].x));
      cells[i].y = Math.max(10, Math.min(canvas.height - 10, cells[i].y));

      // Update cell logic
      cells[i].age++;
      cells[i].divTimer++;

      if (cells[i].type === 'normal') {
        if (cells[i].divTimer > NORMAL_DIV_TIME && neighbors < MAX_NEIGHBORS_NORMAL) {
          // Divide
          if (cells.length < MAX_CELLS) {
            cells[i].divTimer = 0;
            const offsetDist = cells[i].r * 1.5;
            const angle = Math.random() * Math.PI * 2;
            let nx = cells[i].x + Math.cos(angle) * offsetDist;
            let ny = cells[i].y + Math.sin(angle) * offsetDist;
            nx = Math.max(20, Math.min(canvas.width - 20, nx));
            ny = Math.max(20, Math.min(canvas.height - 20, ny));

            let newType: 'normal' | 'cancer' = 'normal';
            if (Math.random() < mutationRateValue) {
              newType = 'cancer';
            }
            cells.push(createCell(nx, ny, newType));
          }
        }
        if (cells[i].age > 1000 && Math.random() < 0.01) {
          cells[i].markedForDeath = true;
        }
      } else if (cells[i].type === 'cancer') {
        if (cells[i].divTimer > CANCER_DIV_TIME) {
          if (cells.length < MAX_CELLS) {
            cells[i].divTimer = 0;
            const offsetDist = cells[i].r * 1.5;
            const angle = Math.random() * Math.PI * 2;
            let nx = cells[i].x + Math.cos(angle) * offsetDist;
            let ny = cells[i].y + Math.sin(angle) * offsetDist;
            nx = Math.max(20, Math.min(canvas.width - 20, nx));
            ny = Math.max(20, Math.min(canvas.height - 20, ny));
            cells.push(createCell(nx, ny, 'cancer'));
          }
        }
      }
    }

    // Update immune cells
    for (const ic of immuneCellsRef.current) {
      if (!ic.target || ic.target.markedForDeath) {
        let minDist = 150;
        ic.target = null;
        for (const c of cells) {
          if (c.type === 'cancer' && !c.markedForDeath) {
            const d = Math.hypot(ic.x - c.x, ic.y - c.y);
            if (d < minDist) {
              minDist = d;
              ic.target = c;
            }
          }
        }
      }

      if (ic.target) {
        const dx = ic.target.x - ic.x;
        const dy = ic.target.y - ic.y;
        const dist = Math.hypot(dx, dy);
        ic.vx = (dx / dist) * 1.5;
        ic.vy = (dy / dist) * 1.5;

        if (dist < ic.r + CANCER_RADIUS) {
          ic.target.markedForDeath = true;
          createDeathParticles(ic.target.x, ic.target.y, '#e11d48');
          ic.target = null;
        }
      } else {
        if (Math.random() < 0.05) {
          ic.vx += (Math.random() - 0.5);
          ic.vy += (Math.random() - 0.5);
        }
        const speed = Math.hypot(ic.vx, ic.vy);
        if (speed > 1) {
          ic.vx /= speed;
          ic.vy /= speed;
        }
      }

      ic.x += ic.vx;
      ic.y += ic.vy;

      if (ic.x < 10 || ic.x > canvas.width - 10) ic.vx *= -1;
      if (ic.y < 10 || ic.y > canvas.height - 10) ic.vy *= -1;
    }

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    // Remove dead cells
    cellsRef.current = cells.filter(c => !c.markedForDeath);

    // Update counts
    let normal = 0;
    let cancer = 0;
    for (const c of cellsRef.current) {
      if (c.type === 'normal') normal++;
      else cancer++;
    }
    setNormalCount(normal);
    setCancerCount(cancer);

    const total = normal + cancer;
    if (total > 0) {
      const ratio = cancer / total;
      if (cancer === 0) {
        setStatus('JARINGAN SEHAT');
        setStatusColor('text-sky-400');
        setShowAlert(false);
      } else if (ratio < 0.3) {
        setStatus('TUMOR JINAK TERDETEKSI');
        setStatusColor('text-yellow-400');
        setShowAlert(false);
      } else {
        setStatus('KANKER GANAS / METASTASIS');
        setStatusColor('text-rose-200');
        if (cancer > 100) setShowAlert(true);
      }
    }
  }, [mutationRate, immuneStrength, createCell, createImmuneCell, createDeathParticles]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw normal cells
    for (const c of cellsRef.current) {
      if (c.type === 'normal') {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0284c7';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#0c4a6e';
        ctx.fill();
      }
    }

    // Draw cancer cells
    for (const c of cellsRef.current) {
      if (c.type === 'cancer') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = c.offsetAngle + (i / 6) * Math.PI * 2;
          const rad = c.r + (i % 2 === 0 ? c.irregularity : -c.irregularity);
          const px = c.x + Math.cos(a) * rad;
          const py = c.y + Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#e11d48';
        ctx.strokeStyle = '#881337';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#4c0519';
        ctx.fill();
      }
    }

    // Draw immune cells
    for (const ic of immuneCellsRef.current) {
      ctx.beginPath();
      ctx.rect(ic.x - ic.r, ic.y - ic.r, ic.r * 2, ic.r * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 10;
      ctx.strokeRect(ic.x - ic.r, ic.y - ic.r, ic.r * 2, ic.r * 2);
      ctx.shadowBlur = 0;
    }

    // Draw particles
    for (const p of particlesRef.current) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }, []);

  useEffect(() => {
    initSimulation();
  }, [initSimulation]);

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

  const handleMutate = () => {
    const normals = cellsRef.current.filter(c => c.type === 'normal');
    for (let i = 0; i < 3; i++) {
      if (normals.length > 0) {
        const idx = Math.floor(Math.random() * normals.length);
        normals[idx].type = 'cancer';
        normals[idx].r = CANCER_RADIUS;
        createDeathParticles(normals[idx].x, normals[idx].y, '#fef08a');
        normals.splice(idx, 1);
      }
    }
  };

  const handleTherapy = () => {
    for (const c of cellsRef.current) {
      if (c.type === 'cancer') {
        if (Math.random() < 0.6) {
          c.markedForDeath = true;
          createDeathParticles(c.x, c.y, '#e11d48');
        }
      } else {
        if (Math.random() < 0.2) {
          c.markedForDeath = true;
          createDeathParticles(c.x, c.y, '#38bdf8');
        }
      }
    }
  };

  const handleReset = () => {
    setMutationRate(1);
    setImmuneStrength(2);
    initSimulation();
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-rose-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">BIOLOGI SEL & ONKOLOGI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: PERTUMBUHAN KANKER
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Simulasi Mutasi Sel, Kehilangan Inhibisi Kontak, dan Respon Imun
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f43f5e] text-md transform rotate-2 z-30 uppercase">
            Panel Intervensi
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-900 uppercase text-[10px]">Laju Mutasi Spontan</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{mutationRate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={mutationRate}
                onChange={(e) => setMutationRate(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Stabil (0%)</span>
                <span>Sangat Karsinogenik (10%)</span>
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-900 uppercase text-[10px]">Kekuatan Sistem Imun</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-600">{immuneLabels[immuneStrength]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={immuneStrength}
                onChange={(e) => setImmuneStrength(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span className="text-rose-600">Tertekan (0)</span>
                <span className="text-sky-600">Sangat Agresif (5)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button
                onClick={handleMutate}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#854d0e] rounded-lg bg-yellow-400 hover:bg-yellow-300 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                PAPARKAN RADIASI (PICU MUTASI)
              </button>
              <button
                onClick={handleTherapy}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#064e3b] rounded-lg bg-emerald-400 text-black hover:bg-emerald-300 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                KEMOTERAPI (BUNUH SEL AKTIF)
              </button>
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-2 px-3 w-full text-xs mt-2 flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                RESET JARINGAN
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-rose-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">ANALISIS BIOPSI REAL-TIME</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-sky-400 mb-1">Sel Normal (Sehat)</span>
                <span className="text-xl font-black text-sky-300">{normalCount}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-rose-900 rounded flex flex-col items-center relative overflow-hidden">
                <span className="text-[9px] font-bold uppercase text-rose-400 mb-1">Sel Kanker (Mutan)</span>
                <span className="text-xl font-black text-rose-500 relative z-10">{cancerCount}</span>
              </div>
            </div>

            <div className={`p-2 border-2 border-dashed text-center flex flex-col items-center justify-center min-h-[50px] transition-colors duration-300 rounded ${cancerCount > 0 && cancerCount / (normalCount + cancerCount) >= 0.3 ? 'bg-rose-900 border-rose-500' : 'bg-black border-sky-500'}`}>
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Jaringan:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${statusColor}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className={`bg-[#fdf2f8] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden ${showAlert ? 'animate-pulse' : ''}`} style={{ backgroundImage: 'radial-gradient(rgba(244, 63, 94, 0.15) 3px, transparent 3px)', backgroundSize: '40px 40px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Cawan Petri (In Vitro)
            </span>

            {showAlert && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white font-black px-8 py-4 border-8 border-black shadow-[8px_8px_0px_#000] text-3xl uppercase z-40 tracking-widest pointer-events-none text-center leading-tight animate-pulse">
                TUMOR GANAS!
                <br />
                <span className="text-sm">PERTUMBUHAN TIDAK TERKENDALI</span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              className="w-full h-full block cursor-crosshair"
            />

            <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-400 border border-black"></div> Sel Normal</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-600 border border-black"></div> Sel Kanker</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-black"></div> Sel Imun</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-rose-500 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan Biologi Sel
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">Inhibisi Kontak</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              <b>Sel Normal</b> memiliki mekanisme "Inhibisi Kontak". Saat mereka membelah dan ruang mulai penuh (menyentuh sel lain), mereka akan otomatis berhenti membelah. Mereka juga mengalami Apoptosis (mati otomatis) jika usianya sudah tua untuk menjaga keseimbangan.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-400 border-b-2 border-slate-600 pb-1 mb-2">Mutasi & Tumor</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Akibat radiasi atau genetik, DNA sel dapat rusak. <b>Sel Kanker</b> kehilangan kemampuan Inhibisi Kontak. Mereka membelah sangat cepat tanpa peduli sekitarnya, menumpuk, dan mendesak sel normal hingga membentuk gumpalan massa yang disebut Tumor.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-400 border-b-2 border-slate-600 pb-1 mb-2">Respon Imun & Terapi</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Tubuh memiliki Sel Imun (Makrofag/Sel T) yang berpatroli memburu sel mutan. Namun, jika mutasi terlalu agresif, imun akan kewalahan. <b>Kemoterapi</b> bekerja dengan membunuh sel yang sedang aktif membelah (terutama sel kanker, namun sel normal juga bisa terkena dampaknya).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}