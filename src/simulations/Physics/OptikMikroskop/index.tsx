import { useState, useMemo, type ReactNode } from 'react';

const LENS_OBJ_X = 200;
const LENS_OK_X = 600;
const AXIS_Y = 250;
const OBJ_HEIGHT_PX = 40;
const SCALE = 40;
const FOK_CM = 5.0;

export default function OptikMikroskop(): ReactNode {
  const [sObCm, setSObCm] = useState(2.5);
  const [fObCm, setFObCm] = useState(2.0);
  const [showRays, setShowRays] = useState(true);

  const validSObCm = sObCm <= fObCm ? fObCm + 0.1 : sObCm;

  const optics = useMemo(() => {
    const fObPx = fObCm * SCALE;
    const sObPx = validSObCm * SCALE;
    const sObAksenCm = 1 / ((1 / fObCm) - (1 / validSObCm));
    const sObAksenPx = sObAksenCm * SCALE;
    const MOb = Math.abs(sObAksenCm / validSObCm);

    const xObj = LENS_OBJ_X - sObPx;
    let xImg1 = LENS_OBJ_X + sObAksenPx;
    let img1Height = OBJ_HEIGHT_PX * MOb;

    if (xImg1 >= LENS_OK_X) {
      xImg1 = LENS_OK_X - 10;
      img1Height = OBJ_HEIGHT_PX * ((LENS_OK_X - LENS_OBJ_X - 10) / sObPx);
    }

    const sOkPx = LENS_OK_X - xImg1;
    const sOkCm = sOkPx / SCALE;

    let sOkAksenCm: number;
    let MOk: number;

    if (Math.abs(sOkCm - FOK_CM) < 0.01) {
      sOkAksenCm = -Infinity;
      MOk = 25 / FOK_CM;
    } else {
      sOkAksenCm = 1 / ((1 / FOK_CM) - (1 / sOkCm));
      MOk = Math.abs(sOkAksenCm / sOkCm);
    }

    const MTot = MOb * MOk;
    const fOkPx = FOK_CM * SCALE;

    return {
      fObPx,
      fOkPx,
      xObj,
      xImg1,
      img1Height,
      MOb,
      MOk,
      MTot,
      sOkAksenCm,
      sOkPx,
      sOkCm
    };
  }, [validSObCm, fObCm]);

  const handleReset = () => {
    setSObCm(2.5);
    setFObCm(2.0);
  };

  const calculateYIntercept = (x1: number, y1: number, x2: number, y2: number, targetX: number): number => {
    if (x2 - x1 === 0) return y1;
    const m = (y2 - y1) / (x2 - x1);
    const c = y1 - m * x1;
    return m * targetX + c;
  };

  const yObjTop = AXIS_Y - OBJ_HEIGHT_PX;
  const yImg1Top = AXIS_Y + optics.img1Height - 10;

  const rays: { x1: number; y1: number; x2: number; y2: number; x3: number; y3: number; color: string; dash?: boolean }[] = [];

  if (showRays) {
    const y1End1 = calculateYIntercept(LENS_OBJ_X, yObjTop, LENS_OBJ_X + optics.fObPx, AXIS_Y, LENS_OK_X);
    rays.push({ x1: optics.xObj, y1: yObjTop, x2: LENS_OBJ_X, y2: yObjTop, x3: LENS_OK_X, y3: y1End1, color: '#38bdf8' });

    const y1End2 = calculateYIntercept(LENS_OBJ_X, AXIS_Y, optics.xImg1, yImg1Top, LENS_OK_X);
    rays.push({ x1: optics.xObj, y1: yObjTop, x2: LENS_OBJ_X, y2: AXIS_Y, x3: LENS_OK_X, y3: y1End2, color: '#38bdf8' });

    const y2End1 = calculateYIntercept(LENS_OK_X, yImg1Top, LENS_OK_X + optics.fOkPx, AXIS_Y, 800);
    rays.push({ x1: optics.xImg1, y1: yImg1Top, x2: LENS_OK_X, y2: yImg1Top, x3: 800, y3: y2End1, color: '#10b981' });

    const y2End2 = calculateYIntercept(optics.xImg1, yImg1Top, LENS_OK_X, AXIS_Y, 800);
    rays.push({ x1: optics.xImg1, y1: yImg1Top, x2: LENS_OK_X, y2: AXIS_Y, x3: 800, y3: y2End2, color: '#10b981' });

    if (optics.sOkAksenCm !== -Infinity && optics.sOkAksenCm * SCALE > -1000) {
      const xImg2 = LENS_OK_X + optics.sOkAksenCm * SCALE;
      const img2Height = Math.min(optics.img1Height * optics.MOk, 400);
      const yImg2Top = AXIS_Y + img2Height - 20;

      rays.push({ x1: LENS_OK_X, y1: yImg1Top, x2: xImg2, y2: yImg2Top, x3: xImg2, y3: yImg2Top, color: '#8b5cf6', dash: true });
      rays.push({ x1: LENS_OK_X, y1: AXIS_Y, x2: xImg2, y2: yImg2Top, x3: xImg2, y3: yImg2Top, color: '#8b5cf6', dash: true });
    }
  }

  const img2Visible = optics.sOkAksenCm !== -Infinity && optics.sOkAksenCm * SCALE > -1000;
  const xImg2 = img2Visible ? LENS_OK_X + optics.sOkAksenCm * SCALE : 0;
  const img2Height = img2Visible ? Math.min(optics.img1Height * optics.MOk, 400) : 0;
  const yImg2Top = AXIS_Y + img2Height - 20;

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-purple-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">FISIKA OPTIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: MIKROSKOP
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Mekanisme Perbesaran Bayangan oleh Lensa Objektif & Okuler
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#a855f7] text-md transform rotate-2 z-30 uppercase">
            Panel Mikroskop
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-900 uppercase text-[10px]">Jarak Objek (<span className="italic">S<sub>ob</sub></span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-blue-600">{validSObCm.toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min={fObCm + 0.1}
                max="4.0"
                step="0.1"
                value={validSObCm}
                onChange={(e) => setSObCm(parseFloat(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Dekat Lensa</span>
                <span>Jauh</span>
              </div>
            </div>

            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-900 uppercase text-[10px]">Fokus Objektif (<span className="italic">f<sub>ob</sub></span>)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-700">{fObCm.toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={fObCm}
                onChange={(e) => setFObCm(parseFloat(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Kuat (Pendek)</span>
                <span>Lemah (Panjang)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Tampilan</label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input
                  type="checkbox"
                  checked={showRays}
                  onChange={(e) => setShowRays(e.target.checked)}
                  className="w-4 h-4 accent-slate-800"
                />
                Tampilkan Sinar Cahaya
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                RESET POSISI
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-purple-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA PERBESARAN (M)</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Objektif (<span className="italic">M<sub>ob</sub></span>)</span>
                <span className="text-xl font-black text-sky-400">{optics.MOb.toFixed(1)}x</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Okuler (<span className="italic">M<sub>ok</sub></span>)</span>
                <span className="text-xl font-black text-emerald-400">{optics.MOk.toFixed(1)}x</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-purple-500 text-center flex flex-col items-center justify-center min-h-[60px] rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Total Perbesaran (<span className="italic">M<sub>tot</sub></span>):</span>
              <span className="text-xl font-black text-purple-400 uppercase tracking-widest">{optics.MTot.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-[#f8fafc] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Diagram Sinar Mikroskop (Tidak Skala Penuh)
            </span>

            <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
              <line x1="0" y1={AXIS_Y} x2="800" y2={AXIS_Y} stroke="#475569" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" />

              {rays.map((ray, i) => (
                <path
                  key={i}
                  d={`M ${ray.x1} ${ray.y1} L ${ray.x2} ${ray.y2} L ${ray.x3} ${ray.y3}`}
                  fill="none"
                  stroke={ray.color}
                  strokeWidth="1.5"
                  strokeDasharray={ray.dash ? "4 4" : "none"}
                  opacity={ray.dash ? 0.5 : 0.7}
                />
              ))}

              <g id="objLensGroup">
                <line x1={LENS_OBJ_X} y1="50" x2={LENS_OBJ_X} y2="450" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                <path d={`M ${LENS_OBJ_X} 100 Q ${LENS_OBJ_X - 20} 250 ${LENS_OBJ_X} 400 Q ${LENS_OBJ_X + 20} 250 ${LENS_OBJ_X} 100 Z`} fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" opacity="0.8" style={{ filter: 'drop-shadow(0px 0px 8px rgba(56, 189, 248, 0.5))' }} />
                <text x={LENS_OBJ_X} y="80" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0369a1">Lensa Objektif</text>
                <circle cx={LENS_OBJ_X - optics.fObPx} cy={AXIS_Y} r="4" fill="#ef4444" />
                <text x={LENS_OBJ_X - optics.fObPx} y={AXIS_Y + 20} textAnchor="middle" fontSize="10" fontWeight="bold" fontStyle="italic" fill="#ef4444">F_ob</text>
                <circle cx={LENS_OBJ_X + optics.fObPx} cy={AXIS_Y} r="4" fill="#ef4444" />
                <text x={LENS_OBJ_X + optics.fObPx} y={AXIS_Y + 20} textAnchor="middle" fontSize="10" fontWeight="bold" fontStyle="italic" fill="#ef4444">F_ob</text>
              </g>

              <g id="okLensGroup">
                <line x1={LENS_OK_X} y1="50" x2={LENS_OK_X} y2="450" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                <path d={`M ${LENS_OK_X} 50 Q ${LENS_OK_X - 30} 250 ${LENS_OK_X} 450 Q ${LENS_OK_X + 30} 250 ${LENS_OK_X} 50 Z`} fill="#ecfdf5" stroke="#10b981" strokeWidth="2" opacity="0.8" style={{ filter: 'drop-shadow(0px 0px 8px rgba(16, 185, 129, 0.5))' }} />
                <text x={LENS_OK_X} y="30" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#047857">Lensa Okuler</text>
                <circle cx={LENS_OK_X - optics.fOkPx} cy={AXIS_Y} r="4" fill="#f59e0b" />
                <text x={LENS_OK_X - optics.fOkPx} y={AXIS_Y + 20} textAnchor="middle" fontSize="10" fontWeight="bold" fontStyle="italic" fill="#b45309">F_ok</text>
              </g>

              <g id="eye" transform="translate(700, 250)">
                <path d="M 0 0 Q 30 -30 60 0 Q 30 30 0 0 Z" fill="none" stroke="#000" strokeWidth="2" />
                <circle cx="20" cy="0" r="10" fill="#0f172a" />
                <text x="30" y="45" textAnchor="middle" fontSize="10" fontWeight="bold">Mata</text>
              </g>

              <g id="objectGroup">
                <line x1={optics.xObj} y1={AXIS_Y} x2={optics.xObj} y2={yObjTop + 10} stroke="#000" strokeWidth="4" />
                <polygon points={`${optics.xObj},${yObjTop} ${optics.xObj - 5},${yObjTop + 15} ${optics.xObj + 5},${yObjTop + 15}`} fill="#000" />
                <text x={optics.xObj} y={yObjTop - 10} textAnchor="middle" fontSize="10" fontWeight="bold">Objek</text>
              </g>

              <g id="image1Group">
                <line x1={optics.xImg1} y1={AXIS_Y} x2={optics.xImg1} y2={yImg1Top} stroke="#3b82f6" strokeWidth="3" strokeDasharray="2 2" />
                <polygon points={`${optics.xImg1},${yImg1Top + 10} ${optics.xImg1 - 5},${yImg1Top - 5} ${optics.xImg1 + 5},${yImg1Top - 5}`} fill="#3b82f6" />
                <text x={optics.xImg1} y={yImg1Top + 25} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">Bayangan 1</text>
              </g>

              {img2Visible && (
                <g id="image2Group">
                  <line x1={xImg2} y1={AXIS_Y} x2={xImg2} y2={yImg2Top} stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                  <polygon points={`${xImg2},${yImg2Top + 10} ${xImg2 - 10},${yImg2Top - 20} ${xImg2 + 10},${yImg2Top - 20}`} fill="#8b5cf6" opacity="0.6" />
                  <text x={xImg2} y={yImg2Top + 30} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#8b5cf6">Bayangan Akhir (Maya)</text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-purple-600 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-white">
          Panduan Optik Mikroskop
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">Lensa Objektif</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Lensa yang dekat dengan preparat (objek). Objek diletakkan sedikit di luar titik fokus objektif (f<sub>ob</sub> &lt; s<sub>ob</sub> &lt; 2f<sub>ob</sub>). Ini membentuk Bayangan Pertama yang bersifat nyata, terbalik, dan diperbesar di dalam tabung mikroskop.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-400 border-b-2 border-slate-600 pb-1 mb-2">Lensa Okuler</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Lensa yang dekat dengan mata. Berfungsi seperti lup (kaca pembesar). Bayangan pertama tadi jatuh di dalam titik fokus okuler (s<sub>ok</sub> &le; f<sub>ok</sub>). Ini menciptakan Bayangan Akhir yang bersifat maya, tegak (terhadap bayangan 1), dan sangat diperbesar.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-purple-400 border-b-2 border-slate-600 pb-1 mb-2">Perbesaran Total</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Sifat bayangan akhir mikroskop adalah Maya, Terbalik (terhadap objek asli), dan Diperbesar. Perbesaran total mikroskop (M<sub>tot</sub>) adalah hasil kali antara perbesaran lensa objektif (M<sub>ob</sub>) dan perbesaran lensa okuler (M<sub>ok</sub>). Rumus: M<sub>tot</sub> = M<sub>ob</sub> x M<sub>ok</sub>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}