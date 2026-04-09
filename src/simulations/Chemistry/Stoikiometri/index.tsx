import { useState, useEffect, useRef, type ReactNode } from 'react';

interface Particle {
  el: SVGGElement;
  type: 'R1' | 'R2' | 'P';
  actualType: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  state: 'FREE' | 'REACTING' | 'MERGED';
  reactionBatchId: number | null;
  targetX: number;
  targetY: number;
}

type ReactionMode = 'WATER' | 'AMMONIA';

interface ReactionData {
  label: string;
  r1: { id: string; name: string; color: string; coef: number; iconColor: string };
  r2: { id: string; name: string; color: string; coef: number; iconColor: string };
  p: { id: string; name: string; coef: number };
}

const REACTIONS: Record<ReactionMode, ReactionData> = {
  WATER: {
    label: 'Wadah Reaksi (2H₂ + O₂ → 2H₂O)',
    r1: { id: 'H2', name: 'Hidrogen (H₂)', color: '#38bdf8', coef: 2, iconColor: 'bg-sky-400' },
    r2: { id: 'O2', name: 'Oksigen (O₂)', color: '#ef4444', coef: 1, iconColor: 'bg-rose-500' },
    p: { id: 'H2O', name: 'Air (H₂O)', coef: 2 },
  },
  AMMONIA: {
    label: 'Wadah Reaksi (N₂ + 3H₂ → 2NH₃)',
    r1: { id: 'N2', name: 'Nitrogen (N₂)', color: '#818cf8', coef: 1, iconColor: 'bg-indigo-400' },
    r2: { id: 'H2', name: 'Hidrogen (H₂)', color: '#38bdf8', coef: 3, iconColor: 'bg-sky-400' },
    p: { id: 'NH3', name: 'Amonia (NH₃)', coef: 2 },
  },
};

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: "1. Pereaksi pembatas adalah...",
    options: ["Zat yang paling banyak", "Zat yang habis lebih dulu", "Zat yang tidak bereaksi", "Zat produk"],
    answer: 1,
  },
  {
    question: "2. Dalam reaksi 2H₂ + O₂ → 2H₂O, jika ada 4 H₂ dan 1 O₂, berapa H₂O yang terbentuk?",
    options: ["1 molekul", "2 molekul", "4 molekul", "6 molekul"],
    answer: 1,
  },
  {
    question: "3. Koefisien reaksi menunjukkan...",
    options: ["Massa zat", "Perbandingan mol", "Volume gas", "Energi reaksi"],
    answer: 1,
  },
  {
    question: "4. Jika pereaksi pembatas habis, reaksi akan...",
    options: ["Terus berlangsung", "Berhenti", "Mundur", "Meledak"],
    answer: 1,
  },
  {
    question: "5. Pereaksi sisa adalah zat yang...",
    options: ["Habis sepenuhnya", "Masih tersisa setelah reaksi", "Tidak ikut reaksi", "Menjadi katalis"],
    answer: 1,
  },
];

export default function Stoikiometri(): ReactNode {
  const [currentMode, setCurrentMode] = useState<ReactionMode>('WATER');
  const [countR1, setCountR1] = useState(0);
  const [countR2, setCountR2] = useState(0);
  const [countP, setCountP] = useState(0);
  const [isReacting, setIsReacting] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const particlesLayerRef = useRef<SVGGElement>(null);
  const fxLayerRef = useRef<SVGGElement>(null);

  const MAX_PARTICLES = 30;

  // Create molecule SVG
  const createMoleculeSVG = (type: string): SVGGElement => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('molecule');

    const createCircle = (cx: number, cy: number, r: number, fill: string) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx.toString());
      c.setAttribute('cy', cy.toString());
      c.setAttribute('r', r.toString());
      c.setAttribute('fill', fill);
      c.setAttribute('stroke', '#000');
      return c;
    };

    if (type === 'H2') {
      g.appendChild(createCircle(-5, 0, 5, '#38bdf8'));
      g.appendChild(createCircle(5, 0, 5, '#38bdf8'));
    } else if (type === 'O2') {
      g.appendChild(createCircle(-7, 0, 7, '#ef4444'));
      g.appendChild(createCircle(7, 0, 7, '#ef4444'));
    } else if (type === 'H2O') {
      g.appendChild(createCircle(0, -2, 8, '#ef4444'));
      g.appendChild(createCircle(-7, 6, 5, '#38bdf8'));
      g.appendChild(createCircle(7, 6, 5, '#38bdf8'));
    } else if (type === 'N2') {
      g.appendChild(createCircle(-8, 0, 8, '#818cf8'));
      g.appendChild(createCircle(8, 0, 8, '#818cf8'));
    } else if (type === 'NH3') {
      g.appendChild(createCircle(0, -3, 9, '#818cf8'));
      g.appendChild(createCircle(-8, 7, 5, '#38bdf8'));
      g.appendChild(createCircle(8, 7, 5, '#38bdf8'));
      g.appendChild(createCircle(0, 9, 5, '#38bdf8'));
    }

    return g;
  };

  // Add particle
  const addParticle = (type: 'R1' | 'R2' | 'P') => {
    if (!particlesLayerRef.current) return;
    
    const rx = REACTIONS[currentMode];
    const actualType = type === 'R1' ? rx.r1.id : type === 'R2' ? rx.r2.id : rx.p.id;

    const el = createMoleculeSVG(actualType);
    particlesLayerRef.current.appendChild(el);

    particlesRef.current.push({
      el,
      type,
      actualType,
      x: 50 + Math.random() * 500,
      y: 50 + Math.random() * 400,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 5,
      state: 'FREE',
      reactionBatchId: null,
      targetX: 0,
      targetY: 0,
    });
  };

  // Remove particle
  const removeParticle = (type: 'R1' | 'R2') => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      if (particlesRef.current[i].type === type && particlesRef.current[i].state === 'FREE') {
        particlesRef.current[i].el.remove();
        particlesRef.current.splice(i, 1);
        return;
      }
    }
  };

  // Calculate stoichiometry
  const calculateStoichiometry = () => {
    const rx = REACTIONS[currentMode];
    const maxReactionsFromR1 = Math.floor(countR1 / rx.r1.coef);
    const maxReactionsFromR2 = Math.floor(countR2 / rx.r2.coef);
    const possibleReactions = Math.min(maxReactionsFromR1, maxReactionsFromR2);

    let limiting = '-';
    let excessType = '-';
    let excessCount = 0;

    if (countR1 === 0 && countR2 === 0) {
      // Empty
    } else if (maxReactionsFromR1 < maxReactionsFromR2) {
      limiting = rx.r1.name;
      excessType = rx.r2.name;
      excessCount = countR2 - possibleReactions * rx.r2.coef;
    } else if (maxReactionsFromR2 < maxReactionsFromR1) {
      limiting = rx.r2.name;
      excessType = rx.r1.name;
      excessCount = countR1 - possibleReactions * rx.r1.coef;
    } else if (maxReactionsFromR1 === maxReactionsFromR2 && possibleReactions > 0) {
      limiting = 'TIDAK ADA (REAKSI PAS/HABIS)';
      excessType = 'TIDAK ADA';
    }

    return { possibleReactions, limiting, excessType, excessCount };
  };

  // Spawn flash effect
  const spawnFlash = (x: number, y: number) => {
    if (!fxLayerRef.current) return;

    const flashG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    flashG.setAttribute('transform', `translate(${x}, ${y})`);

    const flash = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    flash.setAttribute('cx', '0');
    flash.setAttribute('cy', '0');
    flash.setAttribute('r', '15');
    flash.classList.add('flash-anim');

    flashG.appendChild(flash);
    fxLayerRef.current.appendChild(flashG);
    setTimeout(() => flashG.remove(), 400);
  };

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const safeDt = Math.min(dt, 0.1);

      const rx = REACTIONS[currentMode];
      const batchesProgress: Record<number, { total: number; merged: number; x: number; y: number }> = {};

      particlesRef.current.forEach((p) => {
        if (p.state === 'FREE') {
          p.x += p.vx * 60 * safeDt;
          p.y += p.vy * 60 * safeDt;
          p.rot += p.vrot * 60 * safeDt;

          if (p.x < 15 || p.x > 585) p.vx *= -1;
          if (p.y < 15 || p.y > 485) p.vy *= -1;
        } else if (p.state === 'REACTING' || p.state === 'MERGED') {
          if (p.state === 'REACTING') {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.hypot(dx, dy);
            const moveDist = 150 * safeDt;

            if (dist <= moveDist || dist < 5) {
              p.x = p.targetX;
              p.y = p.targetY;
              p.state = 'MERGED';
            } else {
              p.x += (dx / dist) * moveDist;
              p.y += (dy / dist) * moveDist;
              p.rot += 15;
            }
          }

          if (p.reactionBatchId !== null) {
            if (!batchesProgress[p.reactionBatchId]) {
              batchesProgress[p.reactionBatchId] = {
                total: 0,
                merged: 0,
                x: p.targetX,
                y: p.targetY,
              };
            }
            batchesProgress[p.reactionBatchId].total++;
            if (p.state === 'MERGED') batchesProgress[p.reactionBatchId].merged++;
          }
        }

        p.el.setAttribute('transform', `translate(${p.x}, ${p.y}) rotate(${p.rot})`);
      });

      // Check completed batches
      Object.keys(batchesProgress).forEach((batchIdStr) => {
        const batchId = parseInt(batchIdStr);
        const b = batchesProgress[batchId];
        if (b.merged === b.total) {
          spawnFlash(b.x, b.y);

          // Remove merged reactants
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            if (particlesRef.current[i].reactionBatchId === batchId) {
              particlesRef.current[i].el.remove();
              particlesRef.current.splice(i, 1);
            }
          }

          // Spawn products
          for (let i = 0; i < rx.p.coef; i++) {
            addParticle('P');
            const newP = particlesRef.current[particlesRef.current.length - 1];
            newP.x = b.x;
            newP.y = b.y;
            newP.vx = (Math.random() - 0.5) * 6;
            newP.vy = (Math.random() - 0.5) * 6;
            setCountP((prev) => prev + 1);
          }
        }
      });

      // Check if reaction is done by verifying no REACTING particles remain
      const stillReacting = particlesRef.current.some(p => p.state === 'REACTING');
      if (isReacting && !stillReacting) {
        setIsReacting(false);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentMode]);

  // Trigger reaction
  const triggerReaction = () => {
    if (isReacting) return;

    const { possibleReactions: numBatches } = calculateStoichiometry();
    const rx = REACTIONS[currentMode];

    if (numBatches === 0) {
      alert('Zat reaktan tidak cukup untuk melakukan reaksi sesuai koefisien!');
      return;
    }

    setIsReacting(true);

    const unassignedR1 = particlesRef.current.filter((p) => p.type === 'R1' && p.state === 'FREE');
    const unassignedR2 = particlesRef.current.filter((p) => p.type === 'R2' && p.state === 'FREE');

    for (let b = 0; b < numBatches; b++) {
      const batchId = Date.now() + b;
      const targetX = 100 + Math.random() * 400;
      const targetY = 100 + Math.random() * 300;

      for (let i = 0; i < rx.r1.coef; i++) {
        const p = unassignedR1.pop();
        if (p) {
          p.state = 'REACTING';
          p.reactionBatchId = batchId;
          p.targetX = targetX;
          p.targetY = targetY;
        }
      }

      for (let i = 0; i < rx.r2.coef; i++) {
        const p = unassignedR2.pop();
        if (p) {
          p.state = 'REACTING';
          p.reactionBatchId = batchId;
          p.targetX = targetX;
          p.targetY = targetY;
        }
      }
    }

    setCountR1((prev) => prev - numBatches * rx.r1.coef);
    setCountR2((prev) => prev - numBatches * rx.r2.coef);
  };

  // Reset simulation
  const resetSim = () => {
    if (isReacting) return;

    particlesRef.current.forEach((p) => p.el.remove());
    particlesRef.current = [];

    setCountR1(0);
    setCountR2(0);
    setCountP(0);
  };

  // Set mode
  const setMode = (mode: ReactionMode) => {
    if (isReacting) return;
    setCurrentMode(mode);
    resetSim();
  };

  // Quiz handlers
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

  const { limiting, excessType, excessCount } = calculateStoichiometry();
  const rx = REACTIONS[currentMode];

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <style>{`
        @keyframes explodeFlash {
          0% { transform: scale(0); opacity: 1; fill: #fef08a; stroke: #eab308; stroke-width: 10px;}
          100% { transform: scale(3); opacity: 0; fill: #ffffff; stroke: #facc15; stroke-width: 0px;}
        }
        .flash-anim {
          animation: explodeFlash 0.4s ease-out forwards;
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
          background-color: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          transform: translate(4px, 4px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
      `}</style>

      {/* Header */}
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black font-bold text-sm transform -rotate-3 text-black">KIMIA DASAR</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: STOIKIOMETRI
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Hukum Kekekalan Massa &amp; Konsep Pereaksi Pembatas
        </p>
      </header>

      {/* Main Workspace */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        
        {/* Controls */}
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#10b981] text-md transform rotate-2 z-30 uppercase">
            Panel Reaktor
          </span>

          <div className="flex flex-col gap-4 mt-4">
            
            {/* Reaction Selection */}
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Persamaan Reaksi</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setMode('WATER')}
                  className={`neo-btn py-2 px-3 text-xs font-bold text-left flex justify-between items-center ${currentMode === 'WATER' ? 'bg-emerald-400 ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                >
                  <span>💧 PEMBENTUKAN AIR</span>
                  <span className="text-[10px] bg-white px-1 border border-black font-mono">2H₂ + O₂ → 2H₂O</span>
                </button>
                <button
                  onClick={() => setMode('AMMONIA')}
                  className={`neo-btn py-2 px-3 text-xs font-bold text-left flex justify-between items-center ${currentMode === 'AMMONIA' ? 'bg-emerald-400 ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                >
                  <span>🧪 SINTESIS AMONIA</span>
                  <span className="text-[10px] bg-white px-1 border border-black font-mono">N₂ + 3H₂ → 2NH₃</span>
                </button>
              </div>
            </div>

            {/* Input Molecules */}
            <div className="bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1 border-b-2 border-slate-300 pb-1">Tambah Reaktan (Zat Pereaksi)</label>
              
              {/* Reactant 1 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 border-black ${rx.r1.iconColor}`}></div>
                  <span className="font-bold text-sm font-mono">{rx.r1.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { if (countR1 > 0 && !isReacting) { setCountR1(countR1 - 1); removeParticle('R1'); } }}
                    disabled={isReacting || countR1 === 0}
                    className="neo-btn bg-rose-400 text-white w-6 h-6 flex items-center justify-center text-lg font-black disabled:opacity-50"
                  >-</button>
                  <span className="font-black text-lg w-6 text-center">{countR1}</span>
                  <button
                    onClick={() => { if (countR1 < MAX_PARTICLES && !isReacting) { setCountR1(countR1 + 1); addParticle('R1'); } }}
                    disabled={isReacting || countR1 >= MAX_PARTICLES}
                    className="neo-btn bg-emerald-400 text-white w-6 h-6 flex items-center justify-center text-lg font-black disabled:opacity-50"
                  >+</button>
                </div>
              </div>

              {/* Reactant 2 */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 border-black ${rx.r2.iconColor}`}></div>
                  <span className="font-bold text-sm font-mono">{rx.r2.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { if (countR2 > 0 && !isReacting) { setCountR2(countR2 - 1); removeParticle('R2'); } }}
                    disabled={isReacting || countR2 === 0}
                    className="neo-btn bg-rose-400 text-white w-6 h-6 flex items-center justify-center text-lg font-black disabled:opacity-50"
                  >-</button>
                  <span className="font-black text-lg w-6 text-center">{countR2}</span>
                  <button
                    onClick={() => { if (countR2 < MAX_PARTICLES && !isReacting) { setCountR2(countR2 + 1); addParticle('R2'); } }}
                    disabled={isReacting || countR2 >= MAX_PARTICLES}
                    className="neo-btn bg-emerald-400 text-white w-6 h-6 flex items-center justify-center text-lg font-black disabled:opacity-50"
                  >+</button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={triggerReaction}
                disabled={isReacting}
                className={`neo-btn py-4 text-sm flex-1 flex items-center justify-center gap-2 ${isReacting ? 'bg-slate-300' : 'bg-yellow-400 hover:bg-yellow-300'}`}
              >
                {isReacting ? '⏳ REAKSI SEDANG BERLANGSUNG...' : '🔥 REAKSIKAN SEKARANG!'}
              </button>
              <button
                onClick={resetSim}
                disabled={isReacting}
                className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-4 px-4 text-xs disabled:opacity-50"
              >
                🔄 RESET
              </button>
            </div>
          </div>

          {/* Telemetry */}
          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-emerald-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">HASIL STOIKIOMETRI</h4>
            
            <div className="grid grid-cols-2 gap-2 mb-3 text-center">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Molekul Produk</span>
                <span className="text-xl font-black text-emerald-400">{countP}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Pereaksi Sisa</span>
                <span className="text-xl font-black text-yellow-300">{excessCount}</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Pereaksi Pembatas:</span>
                <span className="text-xs font-black text-rose-400 uppercase">{limiting}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Molekul Sisa:</span>
                <span className="text-xs font-black text-yellow-300 uppercase">{excessType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Area */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center w-full h-[600px] border-8 border-black overflow-hidden" style={{ background: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              {rx.label}
            </span>

            <div className="w-full h-full relative z-10 flex items-center justify-center p-8">
              <svg viewBox="0 0 600 500" className="w-full h-full overflow-visible bg-white/50 border-4 border-slate-300 shadow-inner rounded-xl">
                <g ref={fxLayerRef}></g>
                <g ref={particlesLayerRef}></g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-2 bg-emerald-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Analisis Reaksi Kimia 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-700 border-b-2 border-black pb-1 mb-2">Koefisien Reaksi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Angka besar di depan rumus molekul (misal: <b>2</b>H₂O) disebut koefisien. Ini adalah "Resep Masakan" alam semesta. <br />
              Resep Air: Anda butuh tepat <b>2 molekul H₂</b> dan <b>1 molekul O₂</b> untuk membuat 2 molekul H₂O.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-700 border-b-2 border-black pb-1 mb-2">Pereaksi Pembatas</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              <i>(Limiting Reactant)</i>. Zat yang <b>habis bereaksi lebih dulu</b>. Bayangkan membuat roti lapis (2 Roti + 1 Keju). Jika Anda punya 10 Roti tapi hanya 2 Keju, maka Keju akan habis duluan. Keju adalah pereaksi pembatas yang menentukan berapa banyak roti lapis yang bisa dibuat (hanya 2).
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-yellow-700 border-b-2 border-black pb-1 mb-2">Pereaksi Sisa</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              <i>(Excess Reactant)</i>. Zat yang masih tersisa setelah reaksi berhenti karena temannya (pereaksi pembatas) sudah habis. Menggunakan contoh di atas, tersisa 6 lembar Roti yang tidak punya pasangan Keju. Roti adalah pereaksi sisa.
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
                {score === 5 ? "LUAR BIASA! PEMAHAMAN STOIKIOMETRIMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP REAKSI KIMIA DI ATAS."}
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
