import { useState, useRef, useEffect, useCallback } from 'react';

export default function PembiasanLensa() {
  const [lensShape, setLensShape] = useState(30);
  const [refractiveIndex, setRefractiveIndex] = useState(1.50);
  const [showAnimation, setShowAnimation] = useState(true);
  const [showVirtual, setShowVirtual] = useState(true);
  const [focalLength, setFocalLength] = useState<number | null>(null);
  const [lensType, setLensType] = useState('KONVERGEN (Mengumpulkan)');
  const [lensTypeColor, setLensTypeColor] = useState('text-sky-400');

  const realRaysGroupRef = useRef<SVGGElement>(null);
  const virtualRaysGroupRef = useRef<SVGGElement>(null);
  const lensBodyRef = useRef<SVGPathElement>(null);
  const f1DotRef = useRef<SVGCircleElement>(null);
  const f1TextRef = useRef<SVGTextElement>(null);
  const f2DotRef = useRef<SVGCircleElement>(null);
  const f2TextRef = useRef<SVGTextElement>(null);

  const drawRays = useCallback((f: number | null) => {
    const realGroup = realRaysGroupRef.current;
    const virtualGroup = virtualRaysGroupRef.current;
    if (!realGroup || !virtualGroup) return;

    while (realGroup.firstChild) {
      realGroup.removeChild(realGroup.firstChild);
    }
    while (virtualGroup.firstChild) {
      virtualGroup.removeChild(virtualGroup.firstChild);
    }

    for (let y = 100; y <= 400; y += 30) {
      let yEnd = y;

      if (f !== null && Math.abs(f) < 400) {
        const m = (250 - y) / f;
        yEnd = y + m * 400;
      }

      const dPath = `M 0 ${y} L 400 ${y} L 800 ${yEnd}`;

      const pathBase = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathBase.setAttribute('d', dPath);
      pathBase.setAttribute('fill', 'none');
      pathBase.setAttribute('stroke', '#ef4444');
      pathBase.setAttribute('stroke-width', '2');
      pathBase.setAttribute('opacity', '0.4');
      realGroup.appendChild(pathBase);

      if (showAnimation) {
        const pathAnim = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathAnim.setAttribute('d', dPath);
        pathAnim.setAttribute('fill', 'none');
        pathAnim.setAttribute('stroke', '#fca5a5');
        pathAnim.setAttribute('stroke-width', '3');
        pathAnim.setAttribute('stroke-dasharray', '15 30');
        pathAnim.classList.add('anim-ray');
        realGroup.appendChild(pathAnim);
      } else {
        const pathSolid = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathSolid.setAttribute('d', dPath);
        pathSolid.setAttribute('fill', 'none');
        pathSolid.setAttribute('stroke', '#f87171');
        pathSolid.setAttribute('stroke-width', '2');
        realGroup.appendChild(pathSolid);
      }

      if (f !== null && f < 0 && showVirtual) {
        const virtualPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        virtualPath.setAttribute('d', `M 400 ${y} L ${400 + f} 250`);
        virtualPath.setAttribute('fill', 'none');
        virtualPath.setAttribute('stroke', '#94a3b8');
        virtualPath.setAttribute('stroke-width', '2');
        virtualPath.setAttribute('stroke-dasharray', '5 5');
        virtualGroup.appendChild(virtualPath);
      }
    }
  }, [showAnimation, showVirtual]);

  const updateSimulation = useCallback(() => {
    const S = lensShape;
    const n = refractiveIndex;

    let f: number | null = null;
    if (S !== 0 && n > 1.0) {
      f = 4500 / ((n - 1) * S);
    }

    if (f !== null && Math.abs(f) < 400) {
      setFocalLength(f);

      if (f > 0) {
        setLensType('KONVERGEN (Mengumpulkan)');
        setLensTypeColor('text-sky-400');
      } else {
        setLensType('DIVERGEN (Menyebarkan)');
        setLensTypeColor('text-rose-400');
      }

      if (f1DotRef.current) f1DotRef.current.setAttribute('cx', String(400 + f));
      if (f1TextRef.current) f1TextRef.current.setAttribute('x', String(400 + f - 8));
      if (f2DotRef.current) f2DotRef.current.setAttribute('cx', String(400 - f));
      if (f2TextRef.current) f2TextRef.current.setAttribute('x', String(400 - f - 8));
    } else {
      setFocalLength(null);
      setLensType('KACA DATAR (Diteruskan)');
      setLensTypeColor('text-slate-400');
    }

    if (lensBodyRef.current) {
      if (S >= 0) {
        const wOffset = S * 0.8;
        lensBodyRef.current.setAttribute('d', `M 380 50 Q ${380 - wOffset} 250 380 450 L 420 450 Q ${420 + wOffset} 250 420 50 Z`);
      } else {
        const wOffset = Math.abs(S) * 0.5;
        lensBodyRef.current.setAttribute('d', `M 360 50 Q ${360 + wOffset} 250 360 450 L 440 450 Q ${440 - wOffset} 250 440 50 Z`);
      }
    }

    drawRays(f);
  }, [lensShape, refractiveIndex, drawRays]);

  useEffect(() => {
    updateSimulation();
  }, [updateSimulation]);

  const handleReset = () => {
    setLensShape(30);
    setRefractiveIndex(1.50);
    setShowAnimation(true);
    setShowVirtual(true);
  };

  const getLensShapeLabel = () => {
    if (lensShape > 0) return 'Cembung (+)';
    if (lensShape < 0) return 'Cekung (-)';
    return 'Datar';
  };

  const formatFocalLength = () => {
    if (focalLength === null) return '∞';
    const f_cm = focalLength / 10;
    const sign = f_cm > 0 ? '+' : '';
    return sign + f_cm.toFixed(1) + ' cm';
  };

  const formatLensPower = () => {
    if (focalLength === null) return '0.00 D';
    const f_cm = focalLength / 10;
    const P = 100 / f_cm;
    const sign = P > 0 ? '+' : '';
    return sign + P.toFixed(2) + ' D';
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-purple-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">FISIKA OPTIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: PEMBIASAN LENSA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Simulasi Jejak Sinar pada Lensa Cembung dan Cekung
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#a855f7] text-md transform rotate-2 z-30 uppercase">
            Panel Kendali
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-800 uppercase text-[10px]">Bentuk Lensa</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-blue-600">{getLensShapeLabel()}</span>
              </div>
              <input type="range" min="-50" max="50" step="1" value={lensShape} onChange={(e) => setLensShape(parseInt(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span className="text-rose-600">Cekung (-)</span>
                <span>Datar</span>
                <span className="text-blue-600">Cembung (+)</span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-amber-800 uppercase text-[10px]">Indeks Bias (n)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-amber-600">{refractiveIndex.toFixed(2)}</span>
              </div>
              <input type="range" min="1.0" max="2.5" step="0.05" value={refractiveIndex} onChange={(e) => setRefractiveIndex(parseFloat(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Udara (1.0)</span>
                <span>Kaca (1.5)</span>
                <span>Intan (2.4)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Visualisasi Tambahan</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input type="checkbox" checked={showAnimation} onChange={(e) => setShowAnimation(e.target.checked)} className="w-4 h-4 accent-slate-800" /> Animasi Foton Cahaya
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input type="checkbox" checked={showVirtual} onChange={(e) => setShowVirtual(e.target.checked)} className="w-4 h-4 accent-slate-800" /> Tampilkan Sinar Maya (Fokus Semu)
                </label>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button onClick={handleReset} className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 w-full text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
                KEMBALIKAN KE AWAL
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-purple-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA OPTIK</h4>
            
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Jarak Fokus (f)</span>
                <span className="text-lg font-black text-white">{formatFocalLength()}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Kekuatan (P)</span>
                <span className="text-lg font-black text-white">{formatLensPower()}</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-center flex flex-col items-center justify-center min-h-[60px] rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Sifat Lensa:</span>
              <span className={`text-sm font-black uppercase tracking-widest ${lensTypeColor}`}>{lensType}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box p-0 relative flex flex-col items-center w-full h-[550px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundColor: '#1e293b', backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Ruang Optik (Laser Merah)
            </span>

            {lensShape === 0 && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black font-black px-6 py-2 border-4 border-black shadow-[4px_4px_0px_#000] text-sm uppercase z-40">
                Kaca Datar - Cahaya Diteruskan
              </div>
            )}

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <style>{`
                @keyframes rayFlow {
                  from { stroke-dashoffset: 20; }
                  to { stroke-dashoffset: 0; }
                }
                .anim-ray {
                  animation: rayFlow 0.5s linear infinite;
                }
              `}</style>
              <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
                <line x1="0" y1="250" x2="800" y2="250" stroke="#475569" strokeWidth="2" strokeDasharray="5 5" opacity={0.6} />
                <line x1="400" y1="0" x2="400" y2="500" stroke="#475569" strokeWidth="1" opacity={0.4} />

                <g ref={virtualRaysGroupRef} opacity="0.7"></g>
                <g ref={realRaysGroupRef}></g>

                <path ref={lensBodyRef} d="" fill="url(#lensGrad)" stroke="#38bdf8" strokeWidth="4" opacity="0.85" style={{ filter: 'drop-shadow(0px 0px 8px rgba(56, 189, 248, 0.5))' }} />

                <defs>
                  <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#e0f2fe', stopOpacity: 0.6 }} />
                    <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.9 }} />
                    <stop offset="100%" style={{ stopColor: '#bae6fd', stopOpacity: 0.6 }} />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <g>
                  <circle ref={f1DotRef} cx="550" cy="250" r="6" fill="#fbbf24" stroke="#000" strokeWidth="3" style={{ display: focalLength !== null && Math.abs(focalLength) < 400 ? 'block' : 'none' }} />
                  <text ref={f1TextRef} x="545" y="275" fontWeight="900" fontSize="14" fill="#f8fafc" style={{ display: focalLength !== null && Math.abs(focalLength) < 400 ? 'block' : 'none' }}>F1</text>
                  
                  <circle ref={f2DotRef} cx="250" cy="250" r="6" fill="#fbbf24" stroke="#000" strokeWidth="3" style={{ display: focalLength !== null && Math.abs(focalLength) < 400 ? 'block' : 'none' }} />
                  <text ref={f2TextRef} x="245" y="275" fontWeight="900" fontSize="14" fill="#f8fafc" style={{ display: focalLength !== null && Math.abs(focalLength) < 400 ? 'block' : 'none' }}>F2</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-purple-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black rounded-lg">
          Buku Panduan Optika
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Lensa Cembung (+)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Bentuknya tebal di tengah dan tipis di ujung. Lensa ini bersifat <b>Konvergen</b> (mengumpulkan cahaya). Sinar yang datang sejajar sumbu utama akan dibiaskan menuju satu <b>Titik Fokus (F)</b> sejati di belakang lensa. Digunakan pada kacamata rabun dekat (Hipermetropi) dan kaca pembesar.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Lensa Cekung (-)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Bentuknya tipis di tengah dan tebal di pinggir. Bersifat <b>Divergen</b> (menyebarkan cahaya). Sinar yang datang sejajar akan menyebar seolah-olah berasal dari satu titik fokus semu (F) di depan lensa. Digunakan pada kacamata penderita rabun jauh (Miopi).
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-slate-800 border-b-2 border-black pb-1 mb-2">Faktor Pembiasan</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Jarak titik fokus (f) bergantung pada <b>Ketebalan/Kelengkungan</b> lensa dan <b>Indeks Bias</b> materialnya. Semakin melengkung lensa, atau semakin padat materialnya (indeks bias besar), pembiasan akan semakin kuat sehingga jarak fokus (f) menjadi semakin pendek.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}