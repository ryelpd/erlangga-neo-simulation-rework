import { useState, useRef, useEffect, useCallback } from 'react';

interface PhysicsResult {
  lift: number;
  drag: number;
  isStalled: boolean;
  cl: number;
}

const STALL_ANGLE = 16;

function calculateAerodynamics(aoa: number, speed: number): PhysicsResult {
  const v = speed / 100;
  let liftCoef = 0;
  let dragCoef = 0.05 + Math.pow(Math.abs(aoa) / 30, 2);

  if (aoa <= STALL_ANGLE) {
    liftCoef = (aoa + 4) * 0.1;
  } else {
    liftCoef = (STALL_ANGLE + 4) * 0.1 * Math.exp(-(aoa - STALL_ANGLE) * 0.2);
    dragCoef += (aoa - STALL_ANGLE) * 0.05;
  }

  const liftForce = 0.5 * Math.pow(v, 2) * liftCoef * 100;
  const dragForce = 0.5 * Math.pow(v, 2) * dragCoef * 100;

  return {
    lift: Math.max(0, Math.round(liftForce * 10)),
    drag: Math.round(dragForce * 10),
    isStalled: aoa > STALL_ANGLE,
    cl: liftCoef
  };
}

export default function Aerodinamika() {
  const [aoa, setAoa] = useState(0);
  const [speed, setSpeed] = useState(200);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSmoke, setShowSmoke] = useState(true);
  const [showPressure, setShowPressure] = useState(true);
  const [lift, setLift] = useState(0);
  const [drag, setDrag] = useState(0);
  const [isStalled, setIsStalled] = useState(false);
  const [statusText, setStatusText] = useState('Normal (Laminar)');
  const [statusColor, setStatusColor] = useState('text-emerald-400');

  const streamlinesGroupRef = useRef<SVGGElement>(null);
  const airfoilGroupRef = useRef<SVGGElement>(null);
  const pressureTopRef = useRef<SVGPathElement>(null);
  const pressureBottomRef = useRef<SVGPathElement>(null);
  const vecLiftRef = useRef<SVGLineElement>(null);
  const vecDragRef = useRef<SVGLineElement>(null);

  const renderStreamlines = useCallback((stalled: boolean, currentSpeed: number, currentAoa: number) => {
    const group = streamlinesGroupRef.current;
    if (!group) return;

    while (group.firstChild) {
      group.removeChild(group.firstChild);
    }

    const numLines = 12;
    const spacing = 40;
    const startX = 0;

    for (let i = 0; i < numLines; i++) {
      const startY = 50 + i * spacing;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#94a3b8');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-dasharray', '10 10');
      path.classList.add('anim-flow');

      const animSpeed = Math.max(0.2, 2.0 - (currentSpeed / 800) * 1.8);
      path.style.animationDuration = animSpeed + 's';
      path.style.animationPlayState = isPlaying ? 'running' : 'paused';

      let d = `M ${startX} ${startY} `;

      for (let x = 50; x <= 800; x += 50) {
        let y = startY;
        const dx = x - 400;
        const dy = startY - 250;
        const dist = Math.hypot(dx, dy);

        if (dist < 200) {
          const influence = (1 - dist / 200);
          if (stalled && dx > 0 && dy < 0) {
            y += (Math.random() - 0.5) * 30 * influence;
          } else {
            y += (currentAoa * 2.5) * influence * (dx / 200);
          }
          if (Math.abs(dy) < 30 && Math.abs(dx) < 150) {
            y = startY + (startY < 250 ? -40 : 40) * influence;
          }
        }
        d += `L ${x} ${y} `;
      }
      path.setAttribute('d', d);
      group.appendChild(path);
    }
  }, [isPlaying]);

  const updateSimulation = useCallback(() => {
    const physics = calculateAerodynamics(aoa, speed);

    setLift(physics.lift);
    setDrag(physics.drag);
    setIsStalled(physics.isStalled);

    if (physics.isStalled) {
      setStatusText('STALL (TURBULEN)');
      setStatusColor('text-rose-500');
    } else {
      setStatusText(aoa < 0 ? 'Menurun (Dive)' : 'Normal (Laminar)');
      setStatusColor('text-emerald-400');
    }

    if (airfoilGroupRef.current) {
      airfoilGroupRef.current.setAttribute('transform', `translate(400, 250) rotate(${-aoa})`);
    }

    if (vecLiftRef.current) {
      vecLiftRef.current.setAttribute('y2', String(-physics.lift / 10));
    }

    if (vecDragRef.current) {
      vecDragRef.current.setAttribute('x2', String(physics.drag / 10));
    }

    if (showPressure) {
      const pTopOp = Math.max(0, Math.min(0.6, physics.cl * 0.5));
      const pBotOp = Math.max(0.1, Math.min(0.5, (aoa + 10) / 40));

      if (pressureTopRef.current) {
        pressureTopRef.current.setAttribute('opacity', String(pTopOp));
      }
      if (pressureBottomRef.current) {
        pressureBottomRef.current.setAttribute('opacity', String(pBotOp));
      }

      const rad = -aoa * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const tx1 = 400 - 150 * cos;
      const ty1 = 250 - 150 * sin;
      const tx2 = 400 + 150 * cos;
      const ty2 = 250 + 150 * sin;

      const h = 80;
      if (pressureTopRef.current) {
        pressureTopRef.current.setAttribute('d', `M ${tx1} ${ty1} L ${tx2} ${ty2} L ${tx2 - h * sin} ${ty2 + h * cos} L ${tx1 - h * sin} ${ty1 + h * cos} Z`);
      }
      if (pressureBottomRef.current) {
        pressureBottomRef.current.setAttribute('d', `M ${tx1} ${ty1} L ${tx2} ${ty2} L ${tx2 + h * sin} ${ty2 - h * cos} L ${tx1 + h * sin} ${ty1 - h * cos} Z`);
      }
    } else {
      if (pressureTopRef.current) pressureTopRef.current.setAttribute('opacity', '0');
      if (pressureBottomRef.current) pressureBottomRef.current.setAttribute('opacity', '0');
    }

    renderStreamlines(physics.isStalled, speed, aoa);
  }, [aoa, speed, showPressure, renderStreamlines]);

  useEffect(() => {
    updateSimulation();
  }, [updateSimulation]);

  const handleAoaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAoa(parseInt(e.target.value));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(parseInt(e.target.value));
  };

  const handleReset = () => {
    setAoa(0);
    setSpeed(200);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">FISIKA FLUIDA & PENERBANGAN</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: AERODINAMIKA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Visualisasi Aliran Udara, Gaya Angkat (Lift), dan Kondisi Stall
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md transform rotate-2 z-30 uppercase">
            Terowongan Angin
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Sudut Serang (Angle of Attack)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{aoa}°</span>
              </div>
              <input type="range" min="-10" max="30" step="1" value={aoa} onChange={handleAoaChange} className="w-full" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Menukik (-10°)</span>
                <span>Datar (0°)</span>
                <span>Mendongak (30°)</span>
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-800 uppercase text-[10px]">Kecepatan Udara (Airspeed)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-600">{speed} km/h</span>
              </div>
              <input type="range" min="0" max="800" step="10" value={speed} onChange={handleSpeedChange} className="w-full" />
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Visualisasi Tambahan</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input type="checkbox" checked={showSmoke} onChange={(e) => setShowSmoke(e.target.checked)} className="w-4 h-4 accent-slate-800" /> Jalur Asap (Streamlines)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input type="checkbox" checked={showPressure} onChange={(e) => setShowPressure(e.target.checked)} className="w-4 h-4 accent-slate-800" /> Peta Tekanan (Warna)
                </label>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button onClick={handlePlayPause} className={`neo-btn py-3 text-sm flex-1 flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${isPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'}`}>
                {isPlaying ? 'JEDA SIMULASI' : 'LANJUTKAN'}
              </button>
              <button onClick={handleReset} className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
                RESET
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
            <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">SENSOR AERODINAMIKA</h4>
            
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Gaya Angkat (Lift)</span>
                <span className="text-xl font-black text-emerald-400">{lift} N</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Hambatan (Drag)</span>
                <span className="text-xl font-black text-rose-400">{drag} N</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-center flex flex-col items-center justify-center min-h-[60px] rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Aerodinamis:</span>
              <span className={`text-xs font-black uppercase tracking-widest ${statusColor}`}>{statusText}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box p-0 relative flex flex-col items-center w-full h-[500px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Penampang Sayap (NACA Airfoil)
            </span>

            {isStalled && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-rose-600 text-white font-black px-6 py-3 border-4 border-black shadow-[8px_8px_0px_#000] text-2xl uppercase z-40 animate-pulse">
                STALL!
              </div>
            )}

            <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-4 h-2 bg-blue-500 opacity-60"></div> Tekanan Rendah (Cepat)</div>
              <div className="flex items-center gap-2"><div className="w-4 h-2 bg-rose-500 opacity-60"></div> Tekanan Tinggi (Lambat)</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <style>{`
                @keyframes flow {
                  from { stroke-dashoffset: 100; }
                  to { stroke-dashoffset: 0; }
                }
                .anim-flow {
                  animation: flow 1s linear infinite;
                }
              `}</style>
              <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
                <path ref={pressureTopRef} d="" fill="url(#gradBlue)" opacity="0.3" className="transition-opacity duration-300" />
                <path ref={pressureBottomRef} d="" fill="url(#gradRed)" opacity="0.3" className="transition-opacity duration-300" />

                <defs>
                  <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                  </linearGradient>
                  <linearGradient id="gradRed" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 0 }} />
                    <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>

                <g ref={streamlinesGroupRef}></g>

                <g ref={airfoilGroupRef} transform="translate(400, 250) rotate(0)">
                  <path d="M -150 0 C -150 -50, 0 -60, 150 0 C 0 10, -150 10, -150 0 Z" fill="#f1f5f9" stroke="#000" strokeWidth="5" />
                  <line x1="-150" y1="0" x2="150" y2="0" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5" opacity={0.5} />
                  
                  <g opacity="0.8">
                    <line ref={vecLiftRef} x1="0" y1="0" x2="0" y2="-50" stroke="#10b981" strokeWidth="6" markerEnd="url(#arrowLift)" />
                    <text x="10" y="-40" fontWeight="bold" fontSize="12" fill="#059669">GAYA ANGKAT</text>
                    <line ref={vecDragRef} x1="0" y1="0" x2="40" y2="0" stroke="#f43f5e" strokeWidth="6" markerEnd="url(#arrowDrag)" />
                    <text x="45" y="15" fontWeight="bold" fontSize="12" fill="#e11d48">HAMBATAN</text>
                  </g>
                </g>

                <defs>
                  <marker id="arrowLift" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                  </marker>
                  <marker id="arrowDrag" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-sky-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black rounded-lg">
          Buku Panduan: Mengapa Pesawat Bisa Terbang?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Hukum Bernoulli</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Bentuk sayap (airfoil) melengkung di atas. Udara yang lewat di atas bergerak <b>lebih cepat</b> daripada di bawah. Berdasarkan Hukum Bernoulli, kecepatan tinggi menciptakan <b>tekanan rendah</b> (zona biru). Perbedaan tekanan antara bawah (tinggi) dan atas (rendah) inilah yang "menyedot" sayap ke atas.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Sudut Serang (AoA)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Selain bentuk, kemiringan sayap terhadap arah angin juga menghasilkan daya angkat. Udara menabrak bagian bawah sayap dan dibelokkan ke bawah (Hukum III Newton: Aksi-Reaksi). Semakin besar sudut dongak sayap, semakin besar gaya angkatnya... hingga batas tertentu.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-slate-800 border-b-2 border-black pb-1 mb-2">Kondisi Stall</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Jika sayap mendongak terlalu tajam (biasanya <b>&gt;15°</b>), aliran udara di atas sayap tidak lagi mulus menempel (laminar), melainkan terlepas dan menjadi <b>Turbulen</b>. Saat ini terjadi, Gaya Angkat hilang seketika dan pesawat akan jatuh. Cobalah geser slider ke 20°-30°!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}