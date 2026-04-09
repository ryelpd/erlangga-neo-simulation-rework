import { useState, useRef, useEffect, useCallback } from 'react';

const CX = 400;
const CY = 250;
const V_STEP = 4;
const C_GRAVITY = 1.5 * V_STEP;

type RayStatus = 'LOLOS' | 'TERSERAP' | 'ORBIT';

interface RayResult {
  pathData: string;
  status: RayStatus;
}

function calculateRay(startY: number, Rs: number): RayResult {
  let x = 0;
  let y = startY;
  let vx = 1;
  let vy = 0;

  let pathData = `M ${x} ${y}`;
  let status: RayStatus = 'LOLOS';
  const maxSteps = 1500;
  let steps = 0;

  while (steps < maxSteps) {
    const dx = CX - x;
    const dy = CY - y;
    const r2 = dx * dx + dy * dy;
    const r = Math.sqrt(r2);

    if (r <= Rs) {
      status = 'TERSERAP';
      pathData += ` L ${x} ${y}`;
      break;
    }

    const force = (Rs * C_GRAVITY) / r2;

    vx += (dx / r) * force;
    vy += (dy / r) * force;

    const vmag = Math.sqrt(vx * vx + vy * vy);
    vx /= vmag;
    vy /= vmag;

    x += vx * V_STEP;
    y += vy * V_STEP;

    pathData += ` L ${x} ${y}`;

    if (x < -100 || x > 900 || y < -200 || y > 700) {
      break;
    }

    steps++;
  }

  if (steps >= maxSteps && status !== 'TERSERAP') {
    status = 'ORBIT';
  }

  return { pathData, status };
}

export default function LubangHitam() {
  const [mass, setMass] = useState(40);
  const [rayPosition, setRayPosition] = useState(150);
  const [showBackground, setShowBackground] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [heroStatusText, setHeroStatusText] = useState('LOLOS TERBENGKOKKAN');
  const [heroStatusColor, setHeroStatusColor] = useState('text-cyan-400');
  const [showAbsorbAlert, setShowAbsorbAlert] = useState(false);

  const bgRaysGroupRef = useRef<SVGGElement>(null);
  const heroRayGroupRef = useRef<SVGGElement>(null);
  const eventHorizonRef = useRef<SVGCircleElement>(null);
  const bhHaloRef = useRef<SVGCircleElement>(null);
  const photonSphereRef = useRef<SVGCircleElement>(null);
  const psLabelRef = useRef<SVGTextElement>(null);
  const ehLabelRef = useRef<SVGTextElement>(null);

  const renderRayPath = useCallback((dPath: string, status: RayStatus, isHero: boolean) => {
    const heroGroup = heroRayGroupRef.current;
    const bgGroup = bgRaysGroupRef.current;

    if (isHero && heroGroup) {
      while (heroGroup.firstChild) {
        heroGroup.removeChild(heroGroup.firstChild);
      }

      const pathBase = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathBase.setAttribute('d', dPath);
      pathBase.setAttribute('fill', 'none');
      pathBase.setAttribute('stroke', status === 'TERSERAP' ? '#ef4444' : '#06b6d4');
      pathBase.setAttribute('stroke-width', '3');
      pathBase.setAttribute('filter', 'url(#photonGlow)');
      heroGroup.appendChild(pathBase);

      if (showAnimation) {
        const pathAnim = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathAnim.setAttribute('d', dPath);
        pathAnim.setAttribute('fill', 'none');
        pathAnim.setAttribute('stroke', '#ffffff');
        pathAnim.setAttribute('stroke-width', '3');
        pathAnim.setAttribute('stroke-dasharray', '5 40');
        pathAnim.classList.add('anim-photon');
        heroGroup.appendChild(pathAnim);
      }
    } else if (!isHero && bgGroup) {
      const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      bgPath.setAttribute('d', dPath);
      bgPath.setAttribute('fill', 'none');
      bgPath.setAttribute('stroke', '#64748b');
      bgPath.setAttribute('stroke-width', '1');
      if (status === 'TERSERAP') bgPath.setAttribute('opacity', '0.2');
      bgGroup.appendChild(bgPath);
    }
  }, [showAnimation]);

  const drawRay = useCallback((startY: number, Rs: number, isHero: boolean) => {
    const result = calculateRay(startY, Rs);
    renderRayPath(result.pathData, result.status, isHero);

    if (isHero) {
      if (result.status === 'TERSERAP') {
        setHeroStatusText('TERSERAP (MELEWATI EVENT HORIZON)');
        setHeroStatusColor('text-red-500');
        setShowAbsorbAlert(true);
      } else if (result.status === 'ORBIT') {
        setHeroStatusText('TERJEBAK DI ORBIT FOTON');
        setHeroStatusColor('text-amber-400');
        setShowAbsorbAlert(false);
      } else {
        setHeroStatusText('LOLOS TERBENGKOKKAN');
        setHeroStatusColor('text-cyan-400');
        setShowAbsorbAlert(false);
      }
    }
  }, [renderRayPath]);

  const updateSimulation = useCallback(() => {
    const Rs = mass;
    const Ps = 1.5 * Rs;
    const yHero = 250 - rayPosition;

    if (eventHorizonRef.current) eventHorizonRef.current.setAttribute('r', String(Rs));
    if (bhHaloRef.current) bhHaloRef.current.setAttribute('r', String(Rs + 5));
    if (photonSphereRef.current) photonSphereRef.current.setAttribute('r', String(Ps));
    if (psLabelRef.current) psLabelRef.current.setAttribute('y', String(CY - Ps - 10));
    if (ehLabelRef.current) {
      ehLabelRef.current.style.display = Rs >= 30 ? 'block' : 'none';
    }

    if (bgRaysGroupRef.current) {
      while (bgRaysGroupRef.current.firstChild) {
        bgRaysGroupRef.current.removeChild(bgRaysGroupRef.current.firstChild);
      }
    }

    if (showBackground && bgRaysGroupRef.current) {
      for (let y = 10; y <= 490; y += 20) {
        if (Math.abs(y - yHero) < 5) continue;
        drawRay(y, Rs, false);
      }
    }

    drawRay(yHero, Rs, true);
  }, [mass, rayPosition, showBackground, drawRay]);

  useEffect(() => {
    updateSimulation();
  }, [updateSimulation]);

  const handleMassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMass(parseInt(e.target.value));
  };

  const handleRayPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRayPosition(parseInt(e.target.value));
  };

  const Rs = mass;
  const Ps = 1.5 * Rs;

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">ASTROFISIKA (RELATIVITAS UMUM)</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: LUBANG HITAM
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Simulasi Pembengkokan Cahaya (Gravitational Lensing)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#8b5cf6] text-md transform rotate-2 z-30 uppercase">
            Panel Kendali
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-violet-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-violet-900 uppercase text-[10px]">Massa Lubang Hitam (M)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-violet-600">{mass} M&#9737;</span>
              </div>
              <input type="range" min="20" max="100" step="1" value={mass} onChange={handleMassChange} className="w-full" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Kecil</span>
                <span>Supermasif</span>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-cyan-900 uppercase text-[10px]">Posisi Sinar Foton (Sumbu-Y)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-cyan-600">{rayPosition} px</span>
              </div>
              <input type="range" min="10" max="240" step="1" value={rayPosition} onChange={handleRayPositionChange} className="w-full" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Mendekat (Pusat)</span>
                <span>Menjauh (Tepi)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Visualisasi Ruang-Waktu</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input type="checkbox" checked={showBackground} onChange={(e) => setShowBackground(e.target.checked)} className="w-4 h-4 accent-slate-800" /> Tampilkan Sinar Latar Belakang
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input type="checkbox" checked={showAnimation} onChange={(e) => setShowAnimation(e.target.checked)} className="w-4 h-4 accent-slate-800" /> Animasi Foton Utama
                </label>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-violet-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-violet-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA TELEMETRI</h4>
            
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Radius E.H (R<sub>s</sub>)</span>
                <span className="text-lg font-black text-white">{Rs.toFixed(0)} px</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Orbit Foton</span>
                <span className="text-lg font-black text-white">{Ps.toFixed(0)} px</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-center flex flex-col items-center justify-center min-h-[60px] rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Cahaya Utama:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${heroStatusColor}`}>{heroStatusText}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box p-0 relative flex flex-col items-center w-full h-[550px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundColor: '#0f172a', backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            <span className="absolute top-4 left-4 bg-black text-white font-black px-3 py-1 border-4 border-white shadow-[4px_4px_0px_#fff] text-[10px] transform -rotate-1 z-30 uppercase">
              Pemandangan Teleskop
            </span>

            {showAbsorbAlert && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white font-black px-6 py-2 border-4 border-black shadow-[4px_4px_0px_#000] text-lg uppercase z-40 tracking-widest animate-pulse">
                FOTON TERSERAP!
              </div>
            )}

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <style>{`
                @keyframes photonFlow {
                  from { stroke-dashoffset: 40; }
                  to { stroke-dashoffset: 0; }
                }
                .anim-photon {
                  animation: photonFlow 0.8s linear infinite;
                }
              `}</style>
              <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
                <line x1="0" y1="250" x2="800" y2="250" stroke="#334155" strokeWidth="1" strokeDasharray="10 10" opacity={0.5} />
                <line x1="400" y1="0" x2="400" y2="500" stroke="#334155" strokeWidth="1" strokeDasharray="10 10" opacity={0.5} />

                <defs>
                  <filter id="bhGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="photonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <g ref={bgRaysGroupRef} opacity="0.4"></g>

                <circle ref={photonSphereRef} cx="400" cy="250" r="60" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8 8" opacity="0.8" />
                <text ref={psLabelRef} x="400" y="180" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle" opacity="0.8">ORBIT FOTON (1.5 R_s)</text>

                <g ref={heroRayGroupRef}></g>

                <g>
                  <circle ref={bhHaloRef} cx="400" cy="250" r="45" fill="none" stroke="#a855f7" strokeWidth="8" opacity="0.3" filter="url(#bhGlow)" />
                  <circle ref={eventHorizonRef} cx="400" cy="250" r="40" fill="#000000" stroke="#c084fc" strokeWidth="2" filter="url(#bhGlow)" />
                  <text ref={ehLabelRef} x="400" y="255" fill="#a855f7" fontSize="12" fontWeight="900" textAnchor="middle" opacity="0.5">EVENT HORIZON</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-white rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-violet-600 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-white rounded-lg">
          Ensiklopedia Kosmik
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-violet-400 border-b-2 border-slate-600 pb-1 mb-2">Event Horizon (R<sub>s</sub>)</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Batas absolut dari sebuah lubang hitam. Di dalam radius ini (Radius Schwarzschild), kecepatan lepas melebihi kecepatan cahaya. Tidak ada informasi, materi, atau cahaya yang dapat melarikan diri begitu melewati batas berwarna hitam pekat ini.
            </p>
          </div>
          
          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-amber-400 border-b-2 border-slate-600 pb-1 mb-2">Orbit Foton</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Terletak tepat pada jarak <b>1.5 x R<sub>s</sub></b>. Pada radius ini, gravitasi tepat cukup kuat untuk memaksa partikel cahaya (foton) bergerak dalam lintasan melingkar sempurna mengelilingi lubang hitam. Jika posisinya pas, Anda bisa melihat bagian belakang kepala Anda sendiri!
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-5 shadow-[4px_4px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-cyan-400 border-b-2 border-slate-600 pb-1 mb-2">Gravitational Lensing</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed mb-3">
              Menurut Einstein, massa masif melengkungkan jaring ruang-waktu. Cahaya tidak benar-benar ditarik, melainkan ia berjalan lurus mengikuti jalan ruang-waktu yang sudah bengkok. Inilah mengapa lubang hitam bertindak layaknya "lensa kosmik" yang membelokkan cahaya bintang di belakangnya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}