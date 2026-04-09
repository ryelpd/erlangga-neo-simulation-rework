import { useState, useEffect, useRef, type ReactNode } from 'react';

interface Monomer {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  color: string;
}

interface MaterialData {
  name: string;
  monomer: string;
  crosslink: string;
  use: string;
  color: string;
  isCrosslinked: boolean;
}

const MATERIALS: Record<string, MaterialData> = {
  PE: {
    name: 'Polietilena (PE)',
    monomer: 'Etena (Etilena)',
    crosslink: 'TIDAK ADA',
    use: 'Kantong plastik, botol plastik, jas hujan',
    color: '#38bdf8',
    isCrosslinked: false,
  },
  KARET_ALAMI: {
    name: 'Karet Alami',
    monomer: 'Isoprena',
    crosslink: 'TIDAK ADA',
    use: 'Sarung tangan lateks, gelang karet',
    color: '#4ade80',
    isCrosslinked: false,
  },
  VULKANISIR: {
    name: 'Karet Vulkanisir',
    monomer: 'Isoprena + Sulfur',
    crosslink: 'ADA (Jembatan Sulfur)',
    use: 'Ban kendaraan, sol sepatu',
    color: '#334155',
    isCrosslinked: true,
  },
};

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: '1. Polimer terbentuk dari penggabungan molekul-molekul kecil yang disebut...',
    options: ['Polimer', 'Monomer', 'Katalis', 'Zat Aditif'],
    answer: 1,
  },
  {
    question: '2. Termoplastik dapat dilelehkan kembali karena...',
    options: ['Memiliki ikatan silang banyak', 'Rantai polimer tidak saling terikat', 'Berat molekulnya besar', 'Berubah menjadi gas saat dipanaskan'],
    answer: 1,
  },
  {
    question: '3. Proses vulkanisasi pada karet bertujuan untuk...',
    options: ['Melunakkan karet', 'Menambah ikatan silang (cross-link)', 'Menghilangkan warna', 'Memperbesar massa jenis'],
    answer: 1,
  },
  {
    question: '4. Ban kendaraan dibuat dari karet vulkanisir karena...',
    options: ['Mudah dibentuk', 'Kuat dan elastic', 'Murah', 'Tidak tahan panas'],
    answer: 1,
  },
  {
    question: '5. Apa yang terjadi jika Polietilena (PE) dipanaskan?',
    options: ['Menjadi seperti kaca', 'Meleleh (bisa didaur ulang)', 'Menyala terbakar', 'Menjadi lebih keras'],
    answer: 1,
  },
];

export default function PolimerPlastik(): ReactNode {
  const [currentMaterial, setCurrentMaterial] = useState<string>('PE');
  const [simState, setSimState] = useState<'MONOMER' | 'POLYMERIZING' | 'POLYMER' | 'HEATING'>('MONOMER');
  const [monomers, setMonomers] = useState<Monomer[]>([]);
  const [chains, setChains] = useState<Monomer[][]>([]);
  const [crosslinks, setCrosslinks] = useState<{ m1: Monomer; m2: Monomer }[]>([]);
  const [heatIntensity, setHeatIntensity] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const moleculeGroupRef = useRef<SVGGElement>(null);
  const burnerGroupRef = useRef<SVGGElement>(null);
  const flameGroupRef = useRef<SVGGElement>(null);
  const bgHeatRef = useRef<SVGRectElement>(null);

  const initSimulation = () => {
    const mat = MATERIALS[currentMaterial];
    const newMonomers: Monomer[] = [];
    const newChains: Monomer[][] = [];
    const newCrosslinks: { m1: Monomer; m2: Monomer }[] = [];

    const rows = 3;
    const cols = 12;

    for (let r = 0; r < rows; r++) {
      const chainArr: Monomer[] = [];
      for (let c = 0; c < cols; c++) {
        const targetX = 80 + c * 40;
        const targetY = 150 + r * 80;
        const x = 50 + Math.random() * 500;
        const y = 50 + Math.random() * 350;

        const monomer: Monomer = {
          id: `${r}-${c}`,
          row: r,
          col: c,
          x,
          y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          targetX,
          targetY,
          color: mat.color,
        };
        newMonomers.push(monomer);
        chainArr.push(monomer);
      }
      newChains.push(chainArr);
    }

    if (mat.isCrosslinked) {
      for (let c = 2; c < cols - 1; c += 3) {
        newCrosslinks.push({ m1: newChains[0][c], m2: newChains[1][c] });
        newCrosslinks.push({ m1: newChains[1][c + 1], m2: newChains[2][c + 1] });
      }
    }

    setMonomers(newMonomers);
    setChains(newChains);
    setCrosslinks(newCrosslinks);
    setSimState('MONOMER');
    setHeatIntensity(0);
  };

  useEffect(() => {
    initSimulation();
  }, [currentMaterial]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const mat = MATERIALS[currentMaterial];

      const updateMonomers = () => {
        if (simState === 'MONOMER') {
          setMonomers((prev) =>
            prev.map((m) => {
              let newX = m.x + m.vx;
              let newY = m.y + m.vy;
              if (newX < 20 || newX > 580) m.vx *= -1;
              if (newY < 20 || newY > 450) m.vy *= -1;
              return { ...m, x: newX, y: newY };
            })
          );
        } else if (simState === 'POLYMERIZING') {
          setMonomers((prev) =>
            prev.map((m) => {
              const dx = m.targetX - m.x;
              const dy = m.targetY - m.y;
              const dist = Math.hypot(dx, dy);
              if (dist > 2) {
                return {
                  ...m,
                  x: m.x + dx * 2 * dt,
                  y: m.y + dy * 2 * dt,
                };
              }
              return { ...m, x: m.targetX, y: m.targetY };
            })
          );

          const allArrived = monomers.every(
            (m) => Math.hypot(m.targetX - m.x) < 2 && Math.hypot(m.targetY - m.y) < 2
          );
          if (allArrived) {
            setSimState((prev) => (prev === 'POLYMERIZING' ? 'POLYMER' : prev));
          }
        } else if (simState === 'POLYMER') {
          setMonomers((prev) =>
            prev.map((m) => ({
              ...m,
              x: m.targetX + (Math.random() - 0.5) * 1,
              y: m.targetY + (Math.random() - 0.5) * 1,
            }))
          );
        } else if (simState === 'HEATING') {
          setHeatIntensity((prev) => Math.min(1, prev + dt * 0.5));

          if (!mat.isCrosslinked) {
            setMonomers((prev) =>
              prev.map((m) => {
                const chainIdx = chains.findIndex((chain) => chain.some((cm) => cm.id === m.id));
                const shiftDir = chainIdx % 2 === 0 ? 1 : -1;
                const shiftSpeed = 20 * heatIntensity * shiftDir;
                const newTargetX = m.targetX + shiftSpeed * dt;
                return {
                  ...m,
                  targetX: newTargetX,
                  x: newTargetX + (Math.random() - 0.5) * 4 * heatIntensity,
                  y: m.targetY + (Math.random() - 0.5) * 4 * heatIntensity,
                };
              })
            );
          } else {
            const jiggle = 10 * heatIntensity;
            const newColor = heatIntensity > 0.8 ? '#0f172a' : mat.color;
            setMonomers((prev) =>
              prev.map((m) => ({
                ...m,
                x: m.targetX + (Math.random() - 0.5) * jiggle,
                y: m.targetY + (Math.random() - 0.5) * jiggle,
                color: newColor,
              }))
            );
          }
        }
      };

      updateMonomers();

      // Render SVG
      if (moleculeGroupRef.current) {
        moleculeGroupRef.current.innerHTML = '';

        if (simState !== 'MONOMER' && mat.isCrosslinked) {
          crosslinks.forEach((link) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', link.m1.x.toString());
            line.setAttribute('y1', link.m1.y.toString());
            line.setAttribute('x2', link.m2.x.toString());
            line.setAttribute('y2', link.m2.y.toString());
            line.setAttribute('stroke', '#facc15');
            line.setAttribute('stroke-width', '6');
            moleculeGroupRef.current?.appendChild(line);

            const sText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            sText.setAttribute('x', ((link.m1.x + link.m2.x) / 2).toString());
            sText.setAttribute('y', ((link.m1.y + link.m2.y) / 2 + 4).toString());
            sText.setAttribute('text-anchor', 'middle');
            sText.setAttribute('font-size', '10');
            sText.setAttribute('font-weight', 'bold');
            sText.setAttribute('fill', '#000');
            sText.textContent = 'S';
            moleculeGroupRef.current?.appendChild(sText);
          });
        }

        if (simState !== 'MONOMER') {
          chains.forEach((chain) => {
            for (let i = 0; i < chain.length - 1; i++) {
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('x1', chain[i].x.toString());
              line.setAttribute('y1', chain[i].y.toString());
              line.setAttribute('x2', chain[i + 1].x.toString());
              line.setAttribute('y2', chain[i + 1].y.toString());
              line.setAttribute('stroke', '#1e293b');
              line.setAttribute('stroke-width', '8');
              moleculeGroupRef.current?.appendChild(line);
            }
          });
        }

        monomers.forEach((m) => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', m.x.toString());
          circle.setAttribute('cy', m.y.toString());
          circle.setAttribute('r', '12');
          circle.setAttribute('fill', m.color);
          circle.setAttribute('stroke', '#000');
          circle.setAttribute('stroke-width', '2');
          moleculeGroupRef.current?.appendChild(circle);

          if (simState === 'MONOMER') {
            const doubleBond = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            doubleBond.setAttribute('x', m.x.toString());
            doubleBond.setAttribute('y', (m.y + 4).toString());
            doubleBond.setAttribute('text-anchor', 'middle');
            doubleBond.setAttribute('font-size', '12');
            doubleBond.setAttribute('font-weight', 'bold');
            doubleBond.setAttribute('fill', '#fff');
            doubleBond.textContent = '=';
            moleculeGroupRef.current?.appendChild(doubleBond);
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentMaterial, simState, heatIntensity, monomers, chains, crosslinks]);

  const handlePolymerize = () => {
    if (simState === 'MONOMER') {
      setSimState('POLYMERIZING');
    }
  };

  const handleHeat = () => {
    if (simState === 'POLYMER') {
      setSimState('HEATING');
      if (burnerGroupRef.current) {
        burnerGroupRef.current.style.transform = 'translate(300px, 420px)';
      }
      setTimeout(() => {
        if (flameGroupRef.current) flameGroupRef.current.setAttribute('opacity', '1');
        if (bgHeatRef.current) {
          bgHeatRef.current.setAttribute('opacity', '0.4');
          bgHeatRef.current.classList.add('heat-glow');
        }
      }, 500);
    }
  };

  const setMaterial = (matKey: string) => {
    setCurrentMaterial(matKey);
    initSimulation();
  };

  const handleAnswerSelect = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (userAnswers.every((a) => a !== null)) {
      setQuizSubmitted(true);
    }
  };

  const handleRetry = () => {
    setUserAnswers(new Array(5).fill(null));
    setQuizSubmitted(false);
  };

  const score = quizSubmitted
    ? userAnswers.reduce<number>((acc, ans, i) => (ans === quizData[i].answer ? acc + 1 : acc), 0)
    : 0;

  const allAnswered = userAnswers.every((a) => a !== null);

  const mat = MATERIALS[currentMaterial];

  const getStatus = () => {
    if (simState === 'MONOMER') return { text: 'GAS / CAIRAN (MONOMER BEBAS)', class: 'text-sky-400' };
    if (simState === 'POLYMERIZING') return { text: 'BEREAKSI (MEMBENTUK IKATAN)...', class: 'text-orange-400' };
    if (simState === 'POLYMER') return { text: 'PADAT (STABIL)', class: 'text-emerald-400' };
    if (simState === 'HEATING') {
      if (!mat.isCrosslinked) return { text: 'MELELEH (RANTAI SALING BERGESER)', class: 'text-yellow-500' };
      if (heatIntensity < 0.9) return { text: 'MEMPERTAHANKAN BENTUK', class: 'text-emerald-500' };
      return { text: 'HANGUS / TERBAKAR', class: 'text-rose-500' };
    }
    return { text: '', class: '' };
  };

  const status = getStatus();

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <style>{`
        @keyframes flicker {
          0% { transform: scale(1) skewX(2deg); opacity: 0.8; }
          100% { transform: scale(1.1) skewX(-2deg); opacity: 1; }
        }
        .flame-anim {
          animation: flicker 0.15s infinite alternate;
          transform-origin: center bottom;
        }
        @keyframes heatPulse {
          0% { filter: drop-shadow(0 0 5px #ef4444); }
          100% { filter: drop-shadow(0 0 20px #f97316); }
        }
        .heat-glow {
          animation: heatPulse 1s infinite alternate;
        }
        .neo-box {
          background-color: #ffffff;
          border: 4px solid #000000;
          box-shadow: 8px 8px 0px 0px #000000;
          border-radius: 12px;
        }
        .neo-btn {
          border: 4px solid #000000;
          box-shadow: 4px 4px 0px 0px #000000;
          border-radius: 8px;
          transition: all 0.1s ease-in-out;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
        }
        .neo-btn:active, .neo-btn-pressed {
          transform: translate(4px, 4px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
        .neo-btn:disabled {
          background-color: #e2e8f0 !important;
          color: #94a3b8 !important;
          cursor: not-allowed;
          transform: translate(4px, 4px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
      `}</style>

      {/* Header */}
      <header className="text-center mb-8 max-w-6xl bg-sky-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black font-bold text-sm transform -rotate-3 text-black">KIMIA MATERIAL</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: POLIMER & PLASTIK
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Sintesis Polimer, Termoplastik vs Termoseting, dan Vulkanisasi
        </p>
      </header>

      {/* Main Workspace */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        
        {/* Controls */}
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md transform rotate-2 z-30 uppercase">
            Panel Material
          </span>

          <div className="flex flex-col gap-4 mt-4">
            
            {/* Material Selection */}
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Material Dasar</label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(MATERIALS).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setMaterial(key)}
                    className={`neo-btn py-2 px-3 text-xs font-bold text-left flex justify-between items-center ${currentMaterial === key ? 'bg-sky-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                  >
                    <span>{key === 'PE' ? '🛍️ Polietilena (PE)' : key === 'KARET_ALAMI' ? '🌳 Karet Alami' : '🛞 Karet Vulkanisir'}</span>
                    <span className="text-[9px] bg-white px-1 border border-black">
                      {value.isCrosslinked ? 'Termoseting' : 'Termoplastik'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 border-t-4 border-black pt-4">
              <button
                onClick={handlePolymerize}
                disabled={simState !== 'MONOMER'}
                className={`neo-btn py-3 text-sm flex items-center justify-center gap-2 ${simState !== 'MONOMER' ? 'opacity-50' : 'bg-emerald-400 hover:bg-emerald-300'}`}
              >
                🔗 POLIMERISASI (GABUNG)
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleHeat}
                  disabled={simState !== 'POLYMER'}
                  className={`neo-btn py-3 px-2 text-xs flex-1 flex items-center justify-center gap-1 ${simState !== 'POLYMER' ? 'opacity-50' : 'bg-rose-400 hover:bg-rose-300 text-black'}`}
                >
                  🔥 UJI PANASKAN
                </button>
                <button
                  onClick={() => { setMaterial(currentMaterial); }}
                  className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-2 text-xs flex-1 flex items-center justify-center gap-1"
                >
                  🔄 KEMBALI
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry */}
          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">SIFAT MATERIAL</h4>
            
            <div className="grid grid-cols-1 gap-2 mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Bahan Monomer</span>
                <span className="text-sm font-black text-white">{mat.monomer}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Ikatan Silang</span>
                <span className={`text-sm font-black ${mat.isCrosslinked ? 'text-yellow-500' : 'text-rose-400'}`}>
                  {mat.crosslink}
                </span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Kegunaan</span>
                <span className="text-xs font-black text-yellow-300 text-right w-1/2">{mat.use}</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Status Saat Dipanaskan:</span>
              <span className={`text-sm font-black leading-tight block uppercase ${status.class}`}>
                {status.text}
              </span>
            </div>
          </div>
        </div>

        {/* Simulation Area */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center w-full h-[600px] overflow-hidden border-8 border-black" style={{ background: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Visualisasi Makromolekul
            </span>

            {/* Legend */}
            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-400 border-2 border-black rounded-full"></div> Unit Monomer</div>
              <div className="flex items-center gap-2"><div className="w-4 h-1 bg-slate-800"></div> Ikatan Rantai Utama</div>
              <div className="flex items-center gap-2"><div className="w-4 h-1 bg-yellow-400 border-t border-b border-black"></div> Ikatan Silang (Sulfur)</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
              <svg viewBox="0 0 600 500" className="w-full h-full overflow-visible bg-white/60">
                <rect ref={bgHeatRef} x="0" y="0" width="600" height="500" fill="#fca5a5" opacity="0" className="transition-opacity duration-500" />
                
                <g ref={moleculeGroupRef}></g>

                <g ref={burnerGroupRef} transform="translate(300, 480)" className="transition-transform duration-500" style={{ transform: 'translate(300px, 560px)' }}>
                  <rect x="-15" y="0" width="30" height="40" fill="#94a3b8" stroke="#000" strokeWidth="3" />
                  <rect x="-25" y="40" width="50" height="10" fill="#475569" stroke="#000" strokeWidth="3" />
                  <g ref={flameGroupRef} className="flame-anim" opacity="0">
                    <path d="M 0 0 Q -30 -50 0 -100 Q 30 -50 0 0 Z" fill="#ef4444" stroke="#f97316" strokeWidth="2" />
                    <path d="M 0 0 Q -15 -30 0 -60 Q 15 -30 0 0 Z" fill="#facc15" />
                    <path d="M 0 0 Q -5 -15 0 -30 Q 5 -15 0 0 Z" fill="#ffffff" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-2 bg-sky-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Dunia Plastik & Karet 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Polimerisasi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Polimer terbentuk ketika ratusan hingga ribuan molekul kecil (<b>Monomer</b>) bereaksi dan menyambang membentuk rantai raksasa. Contohnya, gas Etena (C₂H₄) menyambang menjadi padatan Polietilena (plastik bungkus).
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Termoplastik</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Plastik tipe ini terdiri dari rantai-rantai lurus panjang yang <b>tidak saling terikat</b>. Ketika dipanaskan, rantai-rantai ini bergeser dan saling melewati (meleleh). Karena bisa dilelehkan berulang kali, termoplastik sangat mudah didaur ulang.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Termoseting & Vulkanisasi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Polimer ini memiliki jembatan penghubung antar rantainya (<b>Cross-link</b>). Pada ban mobil, karet alami dicampur belerang (Sulfur) dalam proses <b>Vulkanisasi</b>. Hasilnya, karet menjadi kuat, elastis, dan <b>tidak bisa dilelehkan</b> (jika terlalu panas akan hangus).
            </p>
          </div>
        </div>
      </div>

      {/* Quiz */}
      <div className="mb-12 bg-amber-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform -rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                <h4 className="font-bold text-black mb-4 text-base md:text-lg bg-white inline-block px-2 border-2 border-black">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIdx) => {
                    let btnClass = "border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg text-left px-4 py-3 text-sm md:text-base font-bold uppercase transition-all ";
                    if (quizSubmitted) {
                      if (oIdx === q.answer) {
                        btnClass += "bg-green-400 text-black";
                      } else if (userAnswers[qIdx] === oIdx) {
                        btnClass += "bg-rose-400 text-black opacity-80";
                      } else {
                        btnClass += "bg-slate-200 opacity-50";
                      }
                    } else {
                      btnClass += userAnswers[qIdx] === oIdx ? "bg-black text-white" : "bg-white text-black hover:bg-sky-200";
                    }
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswerSelect(qIdx, oIdx)}
                        disabled={quizSubmitted}
                        className={btnClass}
                      >
                        {quizSubmitted && oIdx === q.answer && "BENAR: "}
                        {quizSubmitted && userAnswers[qIdx] === oIdx && oIdx !== q.answer && "SALAH: "}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted && allAnswered && (
            <div className="text-center mt-8">
              <button
                onClick={handleSubmit}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-sky-500 text-black font-black py-4 px-10 text-xl md:text-2xl uppercase tracking-widest hover:bg-sky-600 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                CEK JAWABAN SAYA!
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? "LUAR BIASA! PEMAHAMAN POLIMERMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP POLIMER DI ATAS."}
              </p>
              <br />
              <button
                onClick={handleRetry}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-black text-white py-3 px-8 text-lg uppercase tracking-wider font-bold hover:bg-slate-800 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                ULANGI KUIS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}