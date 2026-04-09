import { useState, useEffect, useRef, useCallback } from 'react';

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function IkatanKimia() {
  const [currentMode, setCurrentMode] = useState<'IONIK' | 'KOVALEN' | 'LOGAM'>('IONIK');
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const naElectronRef = useRef<SVGCircleElement>(null);
  const naShellRef = useRef<SVGCircleElement>(null);
  const naChargeRef = useRef<SVGTextElement>(null);
  const clChargeRef = useRef<SVGTextElement>(null);
  const clEmptySpotRef = useRef<SVGCircleElement>(null);
  const h1GroupRef = useRef<SVGGElement>(null);
  const h2GroupRef = useRef<SVGGElement>(null);
  const oShareLeftRef = useRef<SVGCircleElement>(null);
  const oShareRightRef = useRef<SVGCircleElement>(null);
  const seaOfElectronsRef = useRef<SVGGElement>(null);
  
  const metallicElectronsRef = useRef<{ el: SVGCircleElement; x: number; y: number; vx: number; vy: number }[]>([]);
  const animationRef = useRef<number>(0);

  const initMetallicElectrons = useCallback(() => {
    if (!seaOfElectronsRef.current) return;
    seaOfElectronsRef.current.innerHTML = '';
    metallicElectronsRef.current = [];
    
    for (let i = 0; i < 35; i++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      el.setAttribute('r', '4');
      el.setAttribute('fill', '#facc15');
      el.setAttribute('stroke', '#000');
      el.setAttribute('stroke-width', '1');
      seaOfElectronsRef.current.appendChild(el);

      metallicElectronsRef.current.push({
        el: el,
        x: 110 + Math.random() * 280,
        y: 50 + Math.random() * 250,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4
      });
    }
  }, []);

  const updateIonikVisuals = (p: number) => {
    const easeP = easeOutCubic(p);
    if (naElectronRef.current) {
      const currentX = lerp(210, 290, easeP);
      naElectronRef.current.setAttribute('cx', String(currentX));
    }
    if (naShellRef.current) {
      naShellRef.current.setAttribute('opacity', String(1 - easeP));
    }
    if (naChargeRef.current && clChargeRef.current && clEmptySpotRef.current) {
      if (p > 0.8) {
        const fade = (p - 0.8) / 0.2;
        naChargeRef.current.setAttribute('opacity', String(fade));
        clChargeRef.current.setAttribute('opacity', String(fade));
        clEmptySpotRef.current.setAttribute('opacity', String(1 - fade));
      } else {
        naChargeRef.current.setAttribute('opacity', '0');
        clChargeRef.current.setAttribute('opacity', '0');
        clEmptySpotRef.current.setAttribute('opacity', '1');
      }
    }
  };

  const updateKovalenVisuals = (p: number) => {
    const easeP = easeOutCubic(p);
    if (h1GroupRef.current) {
      const h1X = lerp(100, 190, easeP);
      h1GroupRef.current.setAttribute('transform', `translate(${h1X}, 175)`);
    }
    if (h2GroupRef.current) {
      const h2X = lerp(400, 310, easeP);
      h2GroupRef.current.setAttribute('transform', `translate(${h2X}, 175)`);
    }
    if (oShareLeftRef.current) {
      const oLeftX = lerp(-60, -38, easeP);
      oShareLeftRef.current.setAttribute('cx', String(oLeftX));
    }
    if (oShareRightRef.current) {
      const oRightX = lerp(60, 38, easeP);
      oShareRightRef.current.setAttribute('cx', String(oRightX));
    }
  };

  const updateLogamVisuals = () => {
    metallicElectronsRef.current.forEach(e => {
      e.x += e.vx;
      e.y += e.vy;

      if (e.x <= 105) { e.x = 105; e.vx *= -1; }
      if (e.x >= 395) { e.x = 395; e.vx *= -1; }
      if (e.y <= 45) { e.y = 45; e.vy *= -1; }
      if (e.y >= 305) { e.y = 305; e.vy *= -1; }

      e.el.setAttribute('cx', String(e.x));
      e.el.setAttribute('cy', String(e.y));
    });
  };

  const resetVisuals = useCallback(() => {
    setProgress(0);
    setIsPlaying(false);
    updateIonikVisuals(0);
    updateKovalenVisuals(0);
  }, []);

  const setMode = useCallback((mode: 'IONIK' | 'KOVALEN' | 'LOGAM') => {
    setCurrentMode(mode);
    resetVisuals();
  }, [resetVisuals]);

  useEffect(() => {
    const loop = () => {
      if (isPlaying) {
        if (currentMode === 'IONIK' || currentMode === 'KOVALEN') {
          setProgress(prev => {
            const next = prev + 0.005;
            if (next >= 1) {
              setIsPlaying(false);
              return 1;
            }
            return next;
          });
        }
      }

      if (currentMode === 'LOGAM') {
        updateLogamVisuals();
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, currentMode]);

  useEffect(() => {
    if (currentMode === 'IONIK') updateIonikVisuals(progress);
    if (currentMode === 'KOVALEN') updateKovalenVisuals(progress);
  }, [progress, currentMode]);

  useEffect(() => {
    if (currentMode === 'LOGAM') {
      initMetallicElectrons();
    }
  }, [currentMode, initMetallicElectrons]);

  const getButtonClass = (mode: 'IONIK' | 'KOVALEN' | 'LOGAM') => {
    const base = "mode-btn neo-btn py-3 px-3 text-sm text-left font-bold flex justify-between items-center w-full";
    const active = currentMode === mode;
    return `${base} ${active 
      ? 'bg-yellow-300 text-black ring-4 ring-black' 
      : 'bg-slate-200 text-slate-600'}`;
  };

  const getPlayButtonClass = () => {
    if (progress >= 1) return "neo-btn bg-slate-300 hover:bg-slate-400 py-3 text-sm flex-1 flex items-center justify-center gap-2";
    if (isPlaying) return "neo-btn bg-yellow-400 hover:bg-yellow-300 py-3 text-sm flex-1 flex items-center justify-center gap-2";
    return "neo-btn bg-emerald-400 hover:bg-emerald-300 py-3 text-sm flex-1 flex items-center justify-center gap-2";
  };

  const getPlayText = () => {
    if (progress >= 1) return "✅ REAKSI SELESAI";
    if (isPlaying) return "⏸️ JEDA REAKSI";
    return "▶️ MULAI REAKSI (ANIMASI)";
  };

  const getCanvasTitle = () => {
    if (currentMode === 'IONIK') return "Kamera Mikroskopik: Interaksi Na & Cl";
    if (currentMode === 'KOVALEN') return "Kamera Mikroskopik: Molekul H₂O (Air)";
    return "Kamera Mikroskopik: Kisi Kristal Besi (Fe)";
  };

  const getDataDesc = () => {
    if (currentMode === 'IONIK') return "Transfer elektron (serah terima) dari atom Logam ke Non-Logam membentuk ion positif dan negatif.";
    if (currentMode === 'KOVALEN') return "Penggunaan pasangan elektron secara bersama-sama (sharing) antar atom Non-Logam agar kulit penuh.";
    return "Elektron valensi terdelokalisasi bergerak bebas mengelilingi ion inti positif membentuk 'Lautan Elektron'.";
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center font-sans">
      <style>{`
        body {
          font-family: 'Space Grotesk', sans-serif;
          background-color: #fdfbf7;
          background-image: radial-gradient(#000000 1.5px, transparent 1.5px);
          background-size: 24px 24px;
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
        .neo-btn:active {
          transform: translate(4px, 4px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
        .neo-tag {
          border: 3px solid #000;
          box-shadow: 3px 3px 0px 0px #000;
        }
        .bg-pattern-dot {
          background-color: #f8fafc;
          background-image: radial-gradient(#cbd5e1 2px, transparent 2px);
          background-size: 20px 20px;
        }
        .electron-glow {
          animation: pulseGlow 2s infinite alternate;
        }
        @keyframes pulseGlow {
          0% { filter: drop-shadow(0 0 2px #facc15); }
          100% { filter: drop-shadow(0 0 6px #facc15); }
        }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-sky-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 neo-tag font-bold text-sm transform -rotate-3 text-black border-2 border-black">KIMIA DASAR</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: IKATAN KIMIA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Mekanisme Interaksi Atom: Ionik, Kovalen, dan Logam
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md transform rotate-2 z-30 uppercase">
            Panel Reaksi
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Jenis Ikatan</label>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => setMode('IONIK')} className={getButtonClass('IONIK')}>
                  <span>⚡ IKATAN IONIK</span>
                  <span className="text-[10px] bg-white px-1 border border-black">Na + Cl</span>
                </button>
                <button onClick={() => setMode('KOVALEN')} className={getButtonClass('KOVALEN')}>
                  <span>💧 IKATAN KOVALEN</span>
                  <span className="text-[10px] bg-white px-1 border border-black">H₂O</span>
                </button>
                <button onClick={() => setMode('LOGAM')} className={getButtonClass('LOGAM')}>
                  <span>🔩 IKATAN LOGAM</span>
                  <span className="text-[10px] bg-white px-1 border border-black">Besi (Fe)</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              {currentMode !== 'LOGAM' && (
                <button onClick={() => {
                  if (progress >= 1) return;
                  setIsPlaying(!isPlaying);
                }} className={getPlayButtonClass()}>
                  {getPlayText()}
                </button>
              )}
              <button onClick={resetVisuals} className="neo-btn bg-rose-400 hover:bg-rose-300 py-3 px-4 text-sm flex items-center justify-center">
                🔄 RESET
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">STATUS REAKSI</h4>
            <div className="bg-slate-800 p-3 border-2 border-slate-600 rounded flex flex-col justify-center min-h-[80px]">
              <span className="text-xs font-black text-slate-400 uppercase mb-1">Mekanisme Utama</span>
              <span className="text-md font-bold text-white leading-tight">{getDataDesc()}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-pattern-dot p-0 relative flex flex-col items-center w-full h-[500px] overflow-hidden border-8 border-black">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              {getCanvasTitle()}
            </span>

            <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-300 border-2 border-black rounded-full"></div> Elektron Valensi (e⁻)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-transparent border-2 border-dashed border-slate-500 rounded-full"></div> Kulit Atom (Orbit)</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <svg viewBox="0 0 500 350" className="w-full h-full overflow-visible">
                <g display={currentMode === 'IONIK' ? 'block' : 'none'}>
                  <g transform="translate(150, 175)">
                    <circle ref={naShellRef} cx="0" cy="0" r="60" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" className="svg-anim" />
                    <circle cx="0" cy="0" r="25" fill="#fcd34d" stroke="#000" strokeWidth="3" />
                    <text x="0" y="5" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="14" fill="#000">Na</text>
                    <text ref={naChargeRef} x="18" y="-18" fontFamily="Space Grotesk" fontWeight="900" fontSize="16" fill="#ef4444" opacity="0">+</text>
                  </g>
                  <circle ref={naElectronRef} cx="210" cy="175" r="5" fill="#facc15" stroke="#000" strokeWidth="2" className="electron-glow" />

                  <g transform="translate(350, 175)">
                    <circle cx="0" cy="0" r="60" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" />
                    <circle cx="0" cy="0" r="30" fill="#4ade80" stroke="#000" strokeWidth="3" />
                    <text x="0" y="5" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="14" fill="#000">Cl</text>
                    <text ref={clChargeRef} x="22" y="-22" fontFamily="Space Grotesk" fontWeight="900" fontSize="18" fill="#3b82f6" opacity="0">-</text>
                    <circle cx="0" cy="-60" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle cx="42" cy="-42" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle cx="60" cy="0" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle cx="42" cy="42" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle cx="0" cy="60" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle cx="-42" cy="42" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle cx="-42" cy="-42" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle ref={clEmptySpotRef} cx="-60" cy="0" r="5" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2" />
                  </g>
                </g>

                <g display={currentMode === 'KOVALEN' ? 'block' : 'none'}>
                  <g transform="translate(250, 175)">
                    <circle cx="0" cy="0" r="60" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" />
                    <circle cx="0" cy="0" r="30" fill="#f87171" stroke="#000" strokeWidth="3" />
                    <text x="0" y="5" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="14" fill="#000">O</text>
                    <circle cx="-20" cy="-56" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle cx="20" cy="-56" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle cx="-20" cy="56" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle cx="20" cy="56" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <circle ref={oShareLeftRef} cx="-60" cy="15" r="5" fill="#facc15" stroke="#000" strokeWidth="2" className="electron-glow" />
                    <circle ref={oShareRightRef} cx="60" cy="15" r="5" fill="#facc15" stroke="#000" strokeWidth="2" className="electron-glow" />
                  </g>

                  <g ref={h1GroupRef} transform="translate(100, 175)">
                    <circle cx="0" cy="0" r="40" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" />
                    <circle cx="0" cy="0" r="15" fill="#38bdf8" stroke="#000" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="12" fill="#000">H</text>
                    <circle cx="40" cy="-15" r="5" fill="#facc15" stroke="#000" strokeWidth="2" className="electron-glow" />
                  </g>

                  <g ref={h2GroupRef} transform="translate(400, 175)">
                    <circle cx="0" cy="0" r="40" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" />
                    <circle cx="0" cy="0" r="15" fill="#38bdf8" stroke="#000" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="12" fill="#000">H</text>
                    <circle cx="-40" cy="-15" r="5" fill="#facc15" stroke="#000" strokeWidth="2" className="electron-glow" />
                  </g>
                </g>

                <g display={currentMode === 'LOGAM' ? 'block' : 'none'}>
                  <rect x="100" y="40" width="300" height="270" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="4" strokeDasharray="8" />
                  <g>
                    <g transform="translate(150, 90)"><circle cx="0" cy="0" r="25" fill="#cbd5e1" stroke="#000" strokeWidth="3"/><text x="0" y="4" textAnchor="middle" fontWeight="900" fontSize="12">Fe⁺</text></g>
                    <g transform="translate(250, 90)"><circle cx="0" cy="0" r="25" fill="#cbd5e1" stroke="#000" strokeWidth="3"/><text x="0" y="4" textAnchor="middle" fontWeight="900" fontSize="12">Fe⁺</text></g>
                    <g transform="translate(350, 90)"><circle cx="0" cy="0" r="25" fill="#cbd5e1" stroke="#000" strokeWidth="3"/><text x="0" y="4" textAnchor="middle" fontWeight="900" fontSize="12">Fe⁺</text></g>
                    <g transform="translate(150, 175)"><circle cx="0" cy="0" r="25" fill="#cbd5e1" stroke="#000" strokeWidth="3"/><text x="0" y="4" textAnchor="middle" fontWeight="900" fontSize="12">Fe⁺</text></g>
                    <g transform="translate(250, 175)"><circle cx="0" cy="0" r="25" fill="#cbd5e1" stroke="#000" strokeWidth="3"/><text x="0" y="4" textAnchor="middle" fontWeight="900" fontSize="12">Fe⁺</text></g>
                    <g transform="translate(350, 175)"><circle cx="0" cy="0" r="25" fill="#cbd5e1" stroke="#000" strokeWidth="3"/><text x="0" y="4" textAnchor="middle" fontWeight="900" fontSize="12">Fe⁺</text></g>
                    <g transform="translate(150, 260)"><circle cx="0" cy="0" r="25" fill="#cbd5e1" stroke="#000" strokeWidth="3"/><text x="0" y="4" textAnchor="middle" fontWeight="900" fontSize="12">Fe⁺</text></g>
                    <g transform="translate(250, 260)"><circle cx="0" cy="0" r="25" fill="#cbd5e1" stroke="#000" strokeWidth="3"/><text x="0" y="4" textAnchor="middle" fontWeight="900" fontSize="12">Fe⁺</text></g>
                    <g transform="translate(350, 260)"><circle cx="0" cy="0" r="25" fill="#cbd5e1" stroke="#000" strokeWidth="3"/><text x="0" y="4" textAnchor="middle" fontWeight="900" fontSize="12">Fe⁺</text></g>
                  </g>
                  <g ref={seaOfElectronsRef}></g>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Memahami Ikatan Kimia 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-yellow-600 border-b-2 border-black pb-1 mb-2">⚡ Ikatan Ionik</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Terjadi antara atom <b>Logam</b> dan <b>Non-Logam</b>.
            </p>
            <p className="text-xs font-medium text-slate-700">
              Satu atom "menyumbangkan" elektronnya ke atom lain. Atom yang kehilangan elektron menjadi ion positif (Kation), dan yang menerima menjadi ion negatif (Anion).<br/><i>Contoh: Garam Dapur (NaCl).</i>
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">💧 Ikatan Kovalen</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Terjadi antar sesama atom <b>Non-Logam</b>.
            </p>
            <p className="text-xs font-medium text-slate-700">
              Karena tidak ada atom yang mau "melepaskan" elektronnya, mereka memutuskan untuk <b>memakai elektron secara bersama-sama</b> (sharing) agar kulit terluarnya penuh.<br/><i>Contoh: Air (H₂O), Oksigen (O₂).</i>
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-slate-600 border-b-2 border-black pb-1 mb-2">🔩 Ikatan Logam</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Terjadi pada kumpulan atom <b>Logam</b> yang sama.
            </p>
            <p className="text-xs font-medium text-slate-700">
              Elektron valensi pada logam sangat mudah lepas dan bergerak bebas mengelilingi inti-inti atom positif. Ini menciptakan <b>"Lautan Elektron"</b> yang menahan ion logam agar tidak terpencar.<br/><i>Contoh: Besi, Tembaga, Emas.</i>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
