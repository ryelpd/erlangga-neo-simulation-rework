import { useState, useEffect, useRef, useCallback } from 'react';

export default function SelVolta() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressVal, setProgressVal] = useState(0);
  const [massZn, setMassZn] = useState(50.0);
  const [massCu, setMassCu] = useState(50.0);
  const [voltage, setVoltage] = useState(0.00);

  const particlesGroupRef = useRef<SVGGElement>(null);
  const switchLineRef = useRef<SVGLineElement>(null);
  const voltNeedleRef = useRef<SVGLineElement>(null);
  const electrodeZnRef = useRef<SVGRectElement>(null);
  const electrodeCuRef = useRef<SVGRectElement>(null);
  const liquidCuRef = useRef<SVGPathElement>(null);
  
  const electronsRef = useRef<{ el: SVGCircleElement; stage: number; x: number; y: number; speed: number }[]>([]);
  const ionsRef = useRef<{ el: SVGGElement; type: string; x: number; y: number; life: number; maxLife: number; vx: number; vy: number }[]>([]);
  const lastTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  const MAX_TIME = 30000;

  const spawnElectron = useCallback(() => {
    if (!particlesGroupRef.current) return;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    el.setAttribute('r', '4');
    el.setAttribute('fill', '#facc15');
    el.setAttribute('stroke', '#000');
    el.setAttribute('stroke-width', '1');
    el.style.filter = 'drop-shadow(0 0 4px #facc15)';
    particlesGroupRef.current.appendChild(el);

    electronsRef.current.push({
      el: el,
      stage: 0,
      x: 150,
      y: 150 + (Math.random() * 50),
      speed: 1.5 + Math.random() * 1.0
    });
  }, []);

  const spawnIon = useCallback((type: string, startX: number, startY: number) => {
    if (!particlesGroupRef.current) return;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '12');
    circle.setAttribute('stroke', '#000');
    circle.setAttribute('stroke-width', '1.5');
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '3');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '8');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-family', 'Space Grotesk');
    
    if (type === 'Zn2+') {
      circle.setAttribute('fill', '#94a3b8');
      text.setAttribute('fill', '#000');
      text.textContent = 'Zn²⁺';
    } else if (type === 'Cu2+') {
      circle.setAttribute('fill', '#3b82f6');
      text.setAttribute('fill', '#fff');
      text.textContent = 'Cu²⁺';
    }

    g.appendChild(circle);
    g.appendChild(text);
    particlesGroupRef.current.appendChild(g);

    ionsRef.current.push({
      el: g,
      type: type,
      x: startX,
      y: startY,
      life: 0,
      maxLife: 200 + Math.random() * 100,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1 + 0.5
    });
  }, []);

  const updateVisuals = useCallback(() => {
    const znShrink = (50 - massZn) / 2;
    if (electrodeZnRef.current) {
      electrodeZnRef.current.setAttribute('width', String(Math.max(2, 30 - znShrink)));
      electrodeZnRef.current.setAttribute('x', String(-15 + znShrink/2));
    }

    const cuGrow = (massCu - 50) / 2;
    if (electrodeCuRef.current) {
      electrodeCuRef.current.setAttribute('width', String(30 + cuGrow));
      electrodeCuRef.current.setAttribute('x', String(-15 - cuGrow/2));
    }

    if (liquidCuRef.current) {
      const cuOpacity = Math.max(0.1, 0.6 - (progressVal / 100 * 0.5));
      liquidCuRef.current.setAttribute('opacity', String(cuOpacity));
    }
  }, [massZn, massCu, progressVal]);

  const resetSimulation = useCallback(() => {
    setIsPlaying(false);
    setProgressVal(0);
    setMassZn(50.0);
    setMassCu(50.0);
    setVoltage(0.00);
    lastTimeRef.current = 0;

    electronsRef.current.forEach(e => e.el.remove());
    electronsRef.current = [];
    ionsRef.current.forEach(i => i.el.remove());
    ionsRef.current = [];

    updateVisuals();
    if (switchLineRef.current) {
      switchLineRef.current.setAttribute('x2', '30');
      switchLineRef.current.setAttribute('y2', '-20');
    }
    if (voltNeedleRef.current) {
      voltNeedleRef.current.setAttribute('transform', 'rotate(0)');
    }
    if (liquidCuRef.current) {
      liquidCuRef.current.setAttribute('opacity', '0.6');
    }
  }, [updateVisuals]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (isPlaying && progressVal < 100) {
        const newProgress = progressVal + (dt / MAX_TIME) * 100;
        setProgressVal(prev => Math.min(prev + (dt / MAX_TIME) * 100, 100));

        const newMassZn = 50.0 - (Math.min(newProgress, 100) / 100 * 20);
        const newMassCu = 50.0 + (Math.min(newProgress, 100) / 100 * 19.5);
        const newVoltage = 1.10 - (Math.min(newProgress, 100) / 100 * 0.1);
        
        setMassZn(newMassZn);
        setMassCu(newMassCu);
        setVoltage(newProgress >= 100 ? 0.00 : newVoltage);

        if (Math.random() < 0.2) spawnElectron();

        for (let i = electronsRef.current.length - 1; i >= 0; i--) {
          let e = electronsRef.current[i];
          if (!e) continue;
          
          if (e.stage === 0) {
            e.y -= e.speed;
            if (e.y <= 70) { e.y = 70; e.stage = 1; }
          } else if (e.stage === 1) {
            e.x += e.speed;
            if (e.x >= 350) { e.x = 350; e.stage = 2; }
          } else if (e.stage === 2) {
            e.y += e.speed;
            if (e.y >= 150 + Math.random()*50) {
              e.el.remove();
              electronsRef.current.splice(i, 1);
            }
          }

          if (electronsRef.current[i]) {
            electronsRef.current[i].el.setAttribute('cx', String(electronsRef.current[i].x));
            electronsRef.current[i].el.setAttribute('cy', String(electronsRef.current[i].y));
          }
        }

        if (Math.random() < 0.05) spawnIon('Zn2+', 150, 200);
        
        for (let i = ionsRef.current.length - 1; i >= 0; i--) {
          let ion = ionsRef.current[i];
          if (!ion) continue;
          ion.x += ion.vx;
          ion.y += ion.vy;
          ion.life++;

          if (ion.y > 280) ion.vy *= -1;
          if (ion.x < 110 || ion.x > 190) ion.vx *= -1;

          ion.el.setAttribute('transform', `translate(${ion.x}, ${ion.y})`);

          if (ion.life > ion.maxLife) {
            ion.el.setAttribute('opacity', String(1 - (ion.life - ion.maxLife)/50));
            if (ion.life > ion.maxLife + 50) {
              ion.el.remove();
              ionsRef.current.splice(i, 1);
            }
          }
        }

        if (newProgress >= 100) {
          setIsPlaying(false);
          if (switchLineRef.current) {
            switchLineRef.current.setAttribute('x2', '30');
            switchLineRef.current.setAttribute('y2', '-20');
          }
          if (voltNeedleRef.current) {
            voltNeedleRef.current.setAttribute('transform', 'rotate(0)');
          }
        }
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, progressVal, spawnElectron, spawnIon]);

  useEffect(() => {
    updateVisuals();
  }, [massZn, massCu, progressVal, updateVisuals]);

  const getPlayText = () => {
    if (progressVal >= 100) return "✅ REAKSI SELESAI (SEL MATI)";
    if (isPlaying) return "⏸️ BUKA SAKLAR (JEDA)";
    return "▶️ TUTUP SAKLAR (MULAI)";
  };

  const getPlayClass = () => {
    if (progressVal >= 100) return "neo-btn bg-slate-300 hover:bg-slate-400 py-3 text-sm flex-1 flex items-center justify-center gap-2";
    if (isPlaying) return "neo-btn bg-rose-400 hover:bg-rose-300 py-3 text-sm flex-1 flex items-center justify-center gap-2";
    return "neo-btn bg-yellow-400 hover:bg-yellow-300 py-3 text-sm flex-1 flex items-center justify-center gap-2";
  };

  const handlePlayClick = () => {
    if (progressVal >= 100) return;
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      if (switchLineRef.current) {
        switchLineRef.current.setAttribute('x2', '30');
        switchLineRef.current.setAttribute('y2', '0');
      }
      if (voltNeedleRef.current) {
        voltNeedleRef.current.setAttribute('transform', 'rotate(45)');
      }
      setVoltage(1.10 - (progressVal / 100 * 0.1));
      lastTimeRef.current = performance.now();
    } else {
      if (switchLineRef.current) {
        switchLineRef.current.setAttribute('x2', '30');
        switchLineRef.current.setAttribute('y2', '-20');
      }
      if (voltNeedleRef.current) {
        voltNeedleRef.current.setAttribute('transform', 'rotate(0)');
      }
      setVoltage(0.00);
    }
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
        .electron-glow { filter: drop-shadow(0 0 4px #facc15); }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-emerald-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 neo-tag font-bold text-sm transform -rotate-3 text-black border-2 border-black">ELEKTROKIMIA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: SEL VOLTA (REDOKS)</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Mengubah Energi Kimia Menjadi Energi Listrik (Baterai Alami)</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#34d399] text-md transform rotate-2 z-30 uppercase">Panel Kendali</span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Setengah Reaksi Redoks</label>
              <div className="bg-rose-100 border-2 border-black p-2 mb-1">
                <span className="text-[9px] font-black uppercase text-rose-800 block">Anoda (-) • Oksidasi</span>
                <span className="font-mono text-sm font-bold">Zn(s) → Zn²⁺(aq) + 2e⁻</span>
              </div>
              <div className="bg-sky-100 border-2 border-black p-2">
                <span className="text-[9px] font-black uppercase text-sky-800 block">Katoda (+) • Reduksi</span>
                <span className="font-mono text-sm font-bold">Cu²⁺(aq) + 2e⁻ → Cu(s)</span>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button onClick={handlePlayClick} className={getPlayClass()}>{getPlayText()}</button>
              <button onClick={resetSimulation} className="neo-btn bg-slate-200 hover:bg-slate-300 py-3 px-4 text-sm flex items-center justify-center">🔄 RESET</button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-emerald-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">TELEMETRI SEL</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded text-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Massa Zn (Anoda)</span>
                <span className="text-xl font-black text-rose-400">{massZn.toFixed(2)}</span> <span className="text-xs">g</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded text-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Massa Cu (Katoda)</span>
                <span className="text-xl font-black text-sky-400">{massCu.toFixed(2)}</span> <span className="text-xs">g</span>
              </div>
            </div>

            <div className="bg-slate-800 p-3 border-2 border-slate-600 rounded flex flex-col justify-center items-center">
              <span className="text-xs font-black text-slate-400 uppercase mb-1">Tegangan (Beda Potensial)</span>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-yellow-400">{voltage.toFixed(2)}</span>
                <span className="text-lg font-bold text-yellow-400 mb-1">V</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-pattern-dot p-0 relative flex flex-col items-center w-full h-[500px] overflow-hidden border-8 border-black">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">Rangkaian Sel Volta Seng-Tembaga</span>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
              <svg viewBox="0 0 500 400" className="w-full h-full overflow-visible">
                <path d="M 150 150 L 150 70 L 350 70 L 350 150" fill="none" stroke="#1e293b" strokeWidth="4" />
                
                <g transform="translate(150, 70)">
                  <circle cx="0" cy="0" r="4" fill="#ef4444" stroke="#000" strokeWidth="2"/>
                  <line ref={switchLineRef} x1="0" y1="0" x2="30" y2="-20" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="30" cy="0" r="4" fill="#ef4444" stroke="#000" strokeWidth="2"/>
                </g>

                <g transform="translate(250, 70)">
                  <circle cx="0" cy="0" r="30" fill="#f8fafc" stroke="#000" strokeWidth="4" />
                  <text x="0" y="20" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="10" fill="#64748b">VOLT</text>
                  <text x="0" y="-12" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="14" fill="#000">V</text>
                  <line ref={voltNeedleRef} x1="0" y1="5" x2="-15" y2="-10" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                </g>

                <path d="M 180 200 L 180 130 Q 180 110 200 110 L 300 110 Q 320 110 320 130 L 320 200" fill="none" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="square" />
                <path d="M 180 200 L 180 130 Q 180 110 200 110 L 300 110 Q 320 110 320 130 L 320 200" fill="none" stroke="#cbd5e1" strokeWidth="16" strokeLinecap="square" />
                <text x="250" y="105" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#475569">Jembatan Garam (KNO₃)</text>
                <ellipse cx="180" cy="200" rx="8" ry="4" fill="#f8fafc" stroke="#000" strokeWidth="1" />
                <ellipse cx="320" cy="200" rx="8" ry="4" fill="#f8fafc" stroke="#000" strokeWidth="1" />

                <g transform="translate(150, 250)">
                  <path d="M -50 -50 L -50 70 Q -50 80 -40 80 L 40 80 Q 50 80 50 70 L 50 -50 Z" fill="#f1f5f9" opacity="0.8" />
                  <path d="M -50 -50 Q 0 -45 50 -50" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                  <rect ref={electrodeZnRef} x="-15" y="-100" width="30" height="150" fill="#94a3b8" stroke="#000" strokeWidth="3" rx="2" />
                  <text x="0" y="-110" textAnchor="middle" fontWeight="900" fontSize="14" fill="#000">Zn (-)</text>
                  <text x="0" y="60" textAnchor="middle" fontWeight="bold" fontSize="10" fill="#64748b">ZnSO₄ (aq)</text>
                  <path d="M -50 -80 L -50 70 Q -50 80 -40 80 L 40 80 Q 50 80 50 70 L 50 -80" fill="none" stroke="#000" strokeWidth="4" />
                </g>

                <g transform="translate(350, 250)">
                  <path ref={liquidCuRef} d="M -50 -50 L -50 70 Q -50 80 -40 80 L 40 80 Q 50 80 50 70 L 50 -50 Z" fill="#3b82f6" opacity="0.6" />
                  <path d="M -50 -50 Q 0 -45 50 -50" fill="none" stroke="#60a5fa" strokeWidth="2" />
                  <rect ref={electrodeCuRef} x="-15" y="-100" width="30" height="150" fill="#f59e0b" stroke="#000" strokeWidth="3" rx="2" />
                  <text x="0" y="-110" textAnchor="middle" fontWeight="900" fontSize="14" fill="#000">Cu (+)</text>
                  <text x="0" y="60" textAnchor="middle" fontWeight="bold" fontSize="10" fill="#1e3a8a">CuSO₄ (aq)</text>
                  <path d="M -50 -80 L -50 70 Q -50 80 -40 80 L 40 80 Q 50 80 50 70 L 50 -80" fill="none" stroke="#000" strokeWidth="4" />
                </g>

                <g ref={particlesGroupRef}></g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-emerald-100 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">Buku Panduan: Memahami Sel Volta 📖</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">1. ANODA (Kutub Negatif)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">Logam Seng (Zn) lebih reaktif. Ia mengalami <b>Oksidasi</b> (melepas elektron). Atom Zn berubah menjadi ion Zn²⁺ dan larut.</p>
          </div>
          
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-yellow-500 border-b-2 border-black pb-1 mb-2">2. KABEL & VOLTMETER</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">Elektron (e⁻) mengalir melalui kabel menuju elektroda Cu. Voltmeter mengukur beda potensial (1.10 V untuk sel Zn-Cu).</p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">3. KATODA (Kutub Positif)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">Elektron tiba di Cu. Ion Cu²⁺ menangkap elektron (<b>Reduksi</b>) dan berubah menjadi endapan Cu padat.</p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-slate-600 border-b-2 border-black pb-1 mb-2">4. JEMBATAN GARAM</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">Menetralkan muatan. Mengalirkan ion negatif ke kiri dan ion positif ke kanan.</p>
          </div>
        </div>

        <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] text-center">
          <h4 className="font-black text-lg uppercase text-emerald-400 mb-1">Jembatan Keledai: KRAO</h4>
          <p className="text-sm font-bold tracking-widest">
            <span className="text-sky-400">K</span>atoda = <span className="text-sky-400">R</span>eduksi &nbsp;&nbsp;|&nbsp;&nbsp; <span className="text-rose-400">A</span>noda = <span className="text-rose-400">O</span>ksidasi
          </p>
        </div>
      </div>
    </div>
  );
}
