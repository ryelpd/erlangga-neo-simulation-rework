import { useState, useEffect, useRef, useCallback } from 'react';

interface Particle {
  el: SVGCircleElement;
  x: number;
  y: number;
}

interface Bubble {
  el: SVGCircleElement;
  x: number;
  y: number;
  vy: number;
  wobble: number;
}

interface Steam {
  el: SVGCircleElement;
  x: number;
  y: number;
  vy: number;
  life: number;
  decay: number;
}

interface FallingParticle {
  el: SVGRectElement;
  x: number;
  y: number;
  vy: number;
  rot: number;
  vrot: number;
}

function calculateSolubility(solute: string, temp: number) {
  if (solute === 'NaCl') {
    return 35 + (temp * 0.05);
  } else if (solute === 'KNO3') {
    return 13 + (temp * 0.5) + (Math.pow(temp, 2) * 0.015);
  }
  return 30;
}

export default function Kelarutan() {
  const [currentSolute, setCurrentSolute] = useState<'NaCl' | 'KNO3'>('NaCl');
  const [currentTemp, setCurrentTemp] = useState(25);
  const [addedMass, setAddedMass] = useState(0);
  const [dissolvedMass, setDissolvedMass] = useState(0);
  const [precipitateMass, setPrecipitateMass] = useState(0);
  const [maxSolubility, setMaxSolubility] = useState(0);

  const dissolvedGroupRef = useRef<SVGGElement>(null);
  const precipitateShapeRef = useRef<SVGPathElement>(null);
  const thermoLiquidRef = useRef<SVGRectElement>(null);
  const flameGroupRef = useRef<SVGGElement>(null);
  const bubblesGroupRef = useRef<SVGGElement>(null);
  const steamGroupRef = useRef<SVGGElement>(null);
  const fallingParticlesGroupRef = useRef<SVGGElement>(null);

  const particlesRef = useRef<Particle[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const steamsRef = useRef<Steam[]>([]);
  const fallingRef = useRef<FallingParticle[]>([]);
  const animationRef = useRef<number>(0);

  const calculateState = useCallback(() => {
    const max = calculateSolubility(currentSolute, currentTemp);
    setMaxSolubility(max);

    if (addedMass <= max) {
      setDissolvedMass(addedMass);
      setPrecipitateMass(0);
    } else {
      setDissolvedMass(max);
      setPrecipitateMass(addedMass - max);
    }
  }, [currentSolute, currentTemp, addedMass]);

  useEffect(() => {
    calculateState();
  }, [calculateState]);

  useEffect(() => {
    const targetVisualCount = Math.floor(dissolvedMass / 2);
    const currentCount = particlesRef.current.length;

    if (currentCount > targetVisualCount) {
      while (particlesRef.current.length > targetVisualCount) {
        const p = particlesRef.current.pop();
        if (p && p.el) p.el.remove();
      }
    } else if (currentCount < targetVisualCount) {
      while (particlesRef.current.length < targetVisualCount) {
        if (!dissolvedGroupRef.current) continue;
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('r', '2.5');
        el.setAttribute('fill', currentSolute === 'NaCl' ? '#ffffff' : '#94a3b8');
        el.setAttribute('opacity', '0.6');
        
        const startX = -80 + Math.random() * 160;
        const startY = -50 + Math.random() * 180;
        
        el.setAttribute('cx', String(startX));
        el.setAttribute('cy', String(startY));

        dissolvedGroupRef.current.appendChild(el);
        particlesRef.current.push({ el, x: startX, y: startY });
      }
    }

    if (precipitateShapeRef.current) {
      let pHeight = Math.min(60, precipitateMass * 0.5); 
      if (precipitateMass <= 0) pHeight = 0;
      const yTop = 140 - pHeight;
      let pPath = `M -94 140 L 94 140 L 94 ${yTop} Q 0 ${yTop - 10} -94 ${yTop} Z`;
      if (pHeight === 0) pPath = `M -94 140 L 94 140 L 94 140 L -94 140 Z`;
      precipitateShapeRef.current.setAttribute('d', pPath);
      precipitateShapeRef.current.setAttribute('fill', currentSolute === 'NaCl' ? '#f8fafc' : '#e2e8f0');
    }

    if (thermoLiquidRef.current) {
      const thermoHeight = 10 + (currentTemp / 100 * 220);
      const thermoY = 120 - thermoHeight;
      thermoLiquidRef.current.setAttribute('height', String(thermoHeight + 10));
      thermoLiquidRef.current.setAttribute('y', String(thermoY));
    }

    if (flameGroupRef.current) {
      if (currentTemp > 25) {
        flameGroupRef.current.setAttribute('opacity', '1');
        const scale = 0.5 + ((currentTemp - 25) / 75) * 0.7;
        flameGroupRef.current.setAttribute('transform', `scale(${scale} ${scale})`);
      } else {
        flameGroupRef.current.setAttribute('opacity', '0');
      }
    }
  }, [dissolvedMass, precipitateMass, currentSolute, currentTemp]);

  const animateDissolved = () => {
    particlesRef.current.forEach(p => {
      if (Math.random() < 0.05) {
        const newX = -80 + Math.random() * 160;
        const newY = -50 + Math.random() * (180 - (precipitateMass*0.5));
        p.el.setAttribute('cx', String(newX));
        p.el.setAttribute('cy', String(newY));
      }
    });
  };

  const handleBoilingEffects = () => {
    if (currentTemp > 40) {
      const bubbleChance = (currentTemp - 40) / 60 * 0.3;
      if (Math.random() < bubbleChance && bubblesGroupRef.current) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('r', String(1 + Math.random() * 3));
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', '#ffffff');
        el.setAttribute('stroke-width', '1.5');
        el.setAttribute('opacity', '0.7');
        bubblesGroupRef.current.appendChild(el);
        bubblesRef.current.push({
          el,
          x: -80 + Math.random() * 160,
          y: 130,
          vy: -1 - Math.random() * 2 - (currentTemp / 100 * 2),
          wobble: Math.random() * Math.PI * 2
        });
      }
    }
    
    if (currentTemp > 70) {
      const steamChance = (currentTemp - 70) / 30 * 0.2;
      if (Math.random() < steamChance && steamGroupRef.current) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('r', String(5 + Math.random() * 15));
        el.setAttribute('fill', '#ffffff');
        el.setAttribute('opacity', '0.5');
        steamGroupRef.current.appendChild(el);
        steamsRef.current.push({
          el,
          x: -60 + Math.random() * 120,
          y: 0,
          vy: -1 - Math.random() * 1.5,
          life: 1,
          decay: 0.01 + Math.random() * 0.02
        });
      }
    }
  };

  const spawnFallingParticles = () => {
    if (!fallingParticlesGroupRef.current) return;
    for (let i = 0; i < 15; i++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      el.setAttribute('width', '4');
      el.setAttribute('height', '4');
      el.setAttribute('fill', currentSolute === 'NaCl' ? '#ffffff' : '#cbd5e1');
      el.setAttribute('stroke', '#000');
      el.setAttribute('stroke-width', '0.5');
      
      fallingParticlesGroupRef.current.appendChild(el);
      fallingRef.current.push({
        el,
        x: 230 + Math.random() * 40,
        y: 100 + Math.random() * 20,
        vy: 2 + Math.random() * 2,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 10
      });
    }
  };

  useEffect(() => {
    const loop = () => {
      animateDissolved();
      handleBoilingEffects();

      for (let i = fallingRef.current.length - 1; i >= 0; i--) {
        let p = fallingRef.current[i];
        p.y += p.vy;
        p.vy += 0.2;
        p.rot += p.vrot;
        p.el.setAttribute('transform', `translate(${p.x}, ${p.y}) rotate(${p.rot})`);

        if (p.y > 220 + Math.random()*20) {
          p.el.remove();
          fallingRef.current.splice(i, 1);
        }
      }

      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        let b = bubblesRef.current[i];
        b.y += b.vy;
        b.wobble += 0.1;
        let currentX = b.x + Math.sin(b.wobble) * 2;
        b.el.setAttribute('cx', String(currentX));
        b.el.setAttribute('cy', String(b.y));

        if (b.y < -70) {
          b.el.remove();
          bubblesRef.current.splice(i, 1);
        }
      }

      for (let i = steamsRef.current.length - 1; i >= 0; i--) {
        let s = steamsRef.current[i];
        s.y += s.vy;
        s.life -= s.decay;
        s.el.setAttribute('cx', String(s.x));
        s.el.setAttribute('cy', String(s.y));
        s.el.setAttribute('opacity', String(s.life * 0.4));

        if (s.life <= 0) {
          s.el.remove();
          steamsRef.current.splice(i, 1);
        }
      }

      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [currentTemp]);

  const handleAddSolute = () => {
    setAddedMass(prev => prev + 10);
    spawnFallingParticles();
  };

  const resetSim = () => {
    setAddedMass(0);
    setCurrentTemp(25);
    fallingRef.current.forEach(p => p.el.remove());
    fallingRef.current = [];
    bubblesRef.current.forEach(p => p.el.remove());
    bubblesRef.current = [];
    steamsRef.current.forEach(p => p.el.remove());
    steamsRef.current = [];
    particlesRef.current.forEach(p => p.el.remove());
    particlesRef.current = [];
  };

  const setSoluteMode = (mode: 'NaCl' | 'KNO3') => {
    if (addedMass > 0) {
      const confirmChange = confirm("Ganti zat terlarut akan mengosongkan glasses. Lanjutkan?");
      if (!confirmChange) return;
      resetSim();
    }
    setCurrentSolute(mode);
  };

  const getStatusText = () => {
    if (addedMass === 0) return "LARUTAN MURNI (AIR)";
    if (precipitateMass > 0.1) return "LEWAT JENUH (ADA ENDAPAN)";
    if (Math.abs(addedMass - maxSolubility) < 1) return "TEPAT JENUH (MAKSIMAL)";
    return "BELUM JENUH (TERLARUT TOTAL)";
  };

  const getStatusClass = () => {
    if (addedMass === 0) return "text-sm font-black text-sky-400 uppercase tracking-widest";
    if (precipitateMass > 0.1) return "text-sm font-black text-rose-500 uppercase tracking-widest";
    if (Math.abs(addedMass - maxSolubility) < 1) return "text-sm font-black text-emerald-400 uppercase tracking-widest";
    return "text-sm font-black text-blue-300 uppercase tracking-widest";
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center font-sans">
      <style>{`
        body { font-family: 'Space Grotesk', sans-serif; background-color: #fdfbf7; background-image: radial-gradient(#000000 1.5px, transparent 1.5px); background-size: 24px 24px; }
        .neo-box { background-color: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0px 0px #000000; border-radius: 12px; }
        .neo-btn { border: 4px solid #000000; box-shadow: 4px 4px 0px 0px #000000; border-radius: 8px; transition: all 0.1s ease-in-out; font-weight: bold; cursor: pointer; text-transform: uppercase; }
        .neo-btn:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0px 0px #000000; }
        .neo-tag { border: 3px solid #000; box-shadow: 3px 3px 0px 0px #000; }
        .bg-pattern-dot { background-color: #f8fafc; background-image: radial-gradient(#cbd5e1 2px, transparent 2px); background-size: 20px 20px; }
        input[type=range]::-webkit-slider-thumb { height: 32px; width: 32px; border: 4px solid #000000; border-radius: 50%; cursor: pointer; margin-top: -12px; box-shadow: 4px 4px 0px 0px #000000; transition: transform 0.1s ease; background: #ef4444; }
        .flame-anim { animation: flicker 0.1s infinite alternate; transform-origin: bottom center; }
        @keyframes flicker { 0% { transform: scale(1) skewX(2deg); opacity: 0.9; } 100% { transform: scale(1.05) skewX(-2deg); opacity: 1; } }
        .dissolved-particle { transition: cx 2s ease-in-out, cy 2s ease-in-out; }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-blue-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 neo-tag font-bold text-sm transform -rotate-3 text-black border-2 border-black">KIMIA FISIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: KELARUTAN</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Dinamika Pelarutan, Kejenuhan, dan Efek Suhu</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#60a5fa] text-md transform rotate-2 z-30 uppercase">Panel Eksperimen</span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Zat Terlarut (Solute)</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setSoluteMode('NaCl')} className={`neo-btn py-2 px-2 text-xs font-bold w-full ${currentSolute === 'NaCl' ? 'bg-yellow-300 text-black ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}>
                  🧂 Garam (NaCl)
                </button>
                <button onClick={() => setSoluteMode('KNO3')} className={`neo-btn py-2 px-2 text-xs font-bold w-full ${currentSolute === 'KNO3' ? 'bg-yellow-300 text-black ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}>
                  💥 Kalium Nitrat (KNO₃)
                </button>
              </div>
              <button onClick={handleAddSolute} className="neo-btn bg-indigo-500 hover:bg-indigo-400 text-white py-3 mt-2 text-sm w-full">➕ TAMBAH 10 GRAM ZAT</button>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Suhu Pelarut (Air 100 mL)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{currentTemp} °C</span>
              </div>
              <input type="range" min="0" max="100" step="1" value={currentTemp} onChange={(e) => setCurrentTemp(parseFloat(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>0 °C (Es)</span>
                <span>100 °C (Mendidih)</span>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button onClick={resetSim} className="neo-btn bg-slate-200 hover:bg-slate-300 py-3 px-4 w-full text-sm flex items-center justify-center gap-2">🔄 KOSONGKAN GELAS KIMIA</button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-blue-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA KONSENTRASI</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded text-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Total Zat Masuk</span>
                <span className="text-xl font-black text-white">{addedMass.toFixed(1)}</span> <span className="text-xs">g</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded text-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Kapasitas Maks.</span>
                <span className="text-xl font-black text-emerald-400">{maxSolubility.toFixed(1)}</span> <span className="text-xs">g</span>
              </div>
            </div>

            <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center mb-2">
              <span className="text-[9px] font-bold uppercase text-slate-400">Berhasil Melarut</span>
              <span className="text-md font-black text-sky-300">{dissolvedMass.toFixed(1)} g</span>
            </div>
            <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center mb-3">
              <span className="text-[9px] font-bold uppercase text-slate-400">Zat Mengendap</span>
              <span className="text-md font-black text-rose-400">{precipitateMass.toFixed(1)} g</span>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-center">
              <span className={getStatusClass()}>{getStatusText()}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-pattern-dot p-0 relative flex flex-col items-center w-full h-[600px] overflow-hidden border-8 border-black">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">Visualisasi: Gelas Kimia 100 mL Air</span>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-10">
              <svg viewBox="0 0 500 500" className="w-full h-full overflow-visible">
                <g transform="translate(250, 420)">
                  <rect x="-15" y="0" width="30" height="60" fill="#94a3b8" stroke="#000" strokeWidth="4" />
                  <rect x="-25" y="60" width="50" height="15" fill="#475569" stroke="#000" strokeWidth="4" />
                  <rect x="-10" y="20" width="20" height="5" fill="#000" />
                  <g ref={flameGroupRef} className="flame-anim" opacity="0">
                    <path d="M 0 0 Q -25 -40 0 -80 Q 25 -40 0 0 Z" fill="#ef4444" stroke="#f97316" strokeWidth="2" />
                    <path d="M 0 0 Q -15 -20 0 -50 Q 15 -20 0 0 Z" fill="#facc15" />
                    <path d="M 0 0 Q -5 -10 0 -25 Q 5 -10 0 0 Z" fill="#ffffff" />
                  </g>
                </g>

                <path d="M 170 420 L 140 500" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round"/>
                <path d="M 330 420 L 360 500" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round"/>
                <line x1="160" y1="420" x2="340" y2="420" stroke="#000" strokeWidth="6" strokeLinecap="round" />
                <line x1="165" y1="416" x2="335" y2="416" stroke="#94a3b8" strokeWidth="4" strokeDasharray="4" />

                <g transform="translate(250, 270)">
                  <path d="M -96 140 L 96 140 L 96 -70 Q 0 -80 -96 -70 Z" fill="#bae6fd" opacity="0.6" />
                  <path ref={precipitateShapeRef} d="M -94 140 L 94 140 L 94 140 L -94 140 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                  <g ref={bubblesGroupRef}></g>
                  <g ref={dissolvedGroupRef}></g>
                </g>

                <g transform="translate(250, 270)">
                  <path d="M -100 -120 L -100 130 Q -100 150 -80 150 L 80 150 Q 100 150 100 130 L 100 -120" fill="none" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                  <line x1="-110" y1="-120" x2="-90" y2="-120" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                  <line x1="90" y1="-120" x2="110" y2="-120" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                  <line x1="80" y1="50" x2="100" y2="50" stroke="#000" strokeWidth="3" />
                  <text x="65" y="54" fontSize="12" fontWeight="bold">50</text>
                  <line x1="80" y1="-50" x2="100" y2="-50" stroke="#000" strokeWidth="3" />
                  <text x="60" y="-46" fontSize="12" fontWeight="bold">100</text>
                </g>

                <g transform="translate(120, 270)">
                  <rect x="-8" y="-180" width="16" height="300" rx="8" fill="#f8fafc" stroke="#000" strokeWidth="4" />
                  <circle cx="0" cy="130" r="16" fill="#ef4444" stroke="#000" strokeWidth="4" />
                  <rect ref={thermoLiquidRef} x="-4" y="-10" width="8" height="130" fill="#ef4444" />
                  <line x1="8" y1="100" x2="15" y2="100" stroke="#000" strokeWidth="2"/>
                  <text x="20" y="103" fontSize="10" fontWeight="bold">0°C</text>
                  <line x1="8" y1="-10" x2="15" y2="-10" stroke="#000" strokeWidth="2"/>
                  <text x="20" y="-7" fontSize="10" fontWeight="bold">50°C</text>
                  <line x1="8" y1="-120" x2="15" y2="-120" stroke="#000" strokeWidth="2"/>
                  <text x="20" y="-117" fontSize="10" fontWeight="bold">100°C</text>
                </g>

                <g ref={steamGroupRef} transform="translate(250, 200)"></g>
                <g ref={fallingParticlesGroupRef}></g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-sky-100 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">Buku Panduan: Membaca Kondisi Larutan 📖</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">1. BELUM JENUH</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">Jumlah zat terlarut yang dimasukkan <b>masih di bawah</b> batas kapasitas maksimal.</p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">2. TEPAT JENUH</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">Jumlah zat terlarut <b>sama persis</b> dengan kapasitas maksimalnya.</p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">3. LEWAT JENUH</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">Jumlah zat yang dimasukkan <b>melebihi</b> kapasitas pelarut, sehingga terbentuk <b>Endapan</b>.</p>
          </div>
        </div>

        <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <h4 className="font-black text-md uppercase text-yellow-300 mb-2">Mengapa Suhu Sangat Berpengaruh?</h4>
          <p className="text-sm font-semibold leading-relaxed text-slate-300">Pemanasan memberikan <b>energi kinetik</b> tambahan, membuat molekul air merenggang menciptakan lebih banyak ruang untuk zat terlarut. Kelarutan <b>NaCl</b> hampir datar, sedangkan <b>KNO₃</b> meroket tajam!</p>
        </div>
      </div>
    </div>
  );
}
