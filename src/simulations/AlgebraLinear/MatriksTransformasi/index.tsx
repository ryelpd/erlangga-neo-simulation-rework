import { useState, useEffect, useRef, useCallback } from 'react';

interface Matrix {
  a: number; b: number;
  c: number; d: number;
  tx: number; ty: number;
}

const PRESETS: Record<string, Matrix> = {
  'IDENTITAS': { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
  'SKALA_2X': { a: 2, b: 0, c: 0, d: 2, tx: 0, ty: 0 },
  'ROTASI_90': { a: 0, b: -1, c: 1, d: 0, tx: 0, ty: 0 },
  'SHEAR_X': { a: 1, b: 1, c: 0, d: 1, tx: 0, ty: 0 },
  'REFLEKSI_Y': { a: -1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
  'ROTASI_45': { a: 0.707, b: -0.707, c: 0.707, d: 0.707, tx: 2, ty: 3 },
};

const BASE_SHAPE = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 1, y: 3 },
  { x: 0, y: 2 }
];

export default function MatriksTransformasi() {
  const [matrix, setMatrix] = useState<Matrix>({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });
  const [targetMatrix, setTargetMatrix] = useState<Matrix>({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  
  const animFrameRef = useRef<number | null>(null);
  const SCALE = 25;

  const mapX = useCallback((x: number) => x * SCALE, []);
  const mapY = useCallback((y: number) => -y * SCALE, []);

  const det = matrix.a * matrix.d - matrix.b * matrix.c;

  const transformPoint = useCallback((pt: { x: number; y: number }, mat: Matrix) => ({
    x: mat.a * pt.x + mat.b * pt.y + mat.tx,
    y: mat.c * pt.x + mat.d * pt.y + mat.ty
  }), []);

  const getTransformedShapePath = useCallback(() => {
    let path = "";
    BASE_SHAPE.forEach((pt, i) => {
      const tPt = transformPoint(pt, matrix);
      path += (i === 0 ? "M " : "L ") + mapX(tPt.x) + " " + mapY(tPt.y) + " ";
    });
    path += "Z";
    return path;
  }, [matrix, transformPoint, mapX, mapY]);

  const getOriginalShapePath = useCallback(() => {
    let path = "";
    BASE_SHAPE.forEach((pt, i) => {
      path += (i === 0 ? "M " : "L ") + mapX(pt.x) + " " + mapY(pt.y) + " ";
    });
    path += "Z";
    return path;
  }, [mapX, mapY]);

  const getBasisVector = (vec: { x: number; y: number }) => {
    const origin = transformPoint({ x: 0, y: 0 }, matrix);
    const tPt = transformPoint(vec, matrix);
    return { origin, tPt };
  };

  const getDynamicGridLines = useCallback(() => {
    const lines = [];
    for (let i = -5; i <= 5; i++) {
      if (i === 0) continue;
      const p1v = transformPoint({ x: i, y: 10 }, matrix);
      const p2v = transformPoint({ x: i, y: -10 }, matrix);
      lines.push(
        <line key={`v${i}`} x1={mapX(p1v.x)} y1={mapY(p1v.y)} x2={mapX(p2v.x)} y2={mapY(p2v.y)} />
      );
      const p1h = transformPoint({ x: -10, y: i }, matrix);
      const p2h = transformPoint({ x: 10, y: i }, matrix);
      lines.push(
        <line key={`h${i}`} x1={mapX(p1h.x)} y1={mapY(p1h.y)} x2={mapX(p2h.x)} y2={mapY(p2h.y)} />
      );
    }
    return lines;
  }, [matrix, transformPoint, mapX, mapY]);

  const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  const animateToMatrix = (target: Matrix) => {
    setTargetMatrix(target);
    setAnimProgress(0);
    setIsAnimating(true);
  };

  useEffect(() => {
    if (!isAnimating) return;

    const animate = () => {
      setAnimProgress(prev => {
        const next = prev + 0.03;
        if (next >= 1) {
          setIsAnimating(false);
          setMatrix(targetMatrix);
          return 1;
        }
        return next;
      });
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAnimating, targetMatrix]);

  useEffect(() => {
    if (!isAnimating) return;
    const eased = easeInOutQuad(animProgress);
    setMatrix({
      a: matrix.a + (targetMatrix.a - matrix.a) * eased,
      b: matrix.b + (targetMatrix.b - matrix.b) * eased,
      c: matrix.c + (targetMatrix.c - matrix.c) * eased,
      d: matrix.d + (targetMatrix.d - matrix.d) * eased,
      tx: matrix.tx + (targetMatrix.tx - matrix.tx) * eased,
      ty: matrix.ty + (targetMatrix.ty - matrix.ty) * eased,
    });
  }, [animProgress]);

  const iVec = getBasisVector({ x: 1, y: 0 });
  const jVec = getBasisVector({ x: 0, y: 1 });

  const getDetStatus = () => {
    if (Math.abs(det) < 0.01) {
      return { text: "Singular (Dimensi Kolaps)", color: "text-rose-500" };
    } else if (det < 0) {
      return { text: "Terbalik (Refleksi)", color: "text-purple-400" };
    } else if (det > 1.01 || det < 0.99) {
      return { text: `Skala Berubah (Luas x${det.toFixed(1)})`, color: "text-sky-400" };
    }
    return { text: "Mempertahankan Luas Asli", color: "text-emerald-400" };
  };

  const detStatus = getDetStatus();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="text-center mb-8 bg-teal-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_#000] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_#000]">
            ALJABAR LINEAR
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
            LAB VIRTUAL: MATRIKS TRANSFORMASI
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
            Membengkokkan Ruang 2D dengan Vektor & Matriks
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          
          <div className="w-full lg:w-1/3 bg-white border-4 border-black p-6 flex flex-col gap-6 rounded-xl shadow-[8px_8px_0px_0px_#000] relative">
            <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_0px_#14b8a6] text-md transform rotate-2">
              Input Matriks
            </span>

            <div className="flex flex-col gap-4 mt-2">
              
              <div className="bg-teal-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 rounded-lg">
                <div className="text-[11px] font-black uppercase text-teal-800 mb-1 border-b-2 border-teal-200 pb-1">Komponen Matriks 2x2 (A)</div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span><span className="italic text-sm">a</span> (Scale X)</span>
                      <span className="bg-white border-2 border-black px-1">{matrix.a.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" min="-3" max="3" step="0.1" value={matrix.a}
                      onChange={(e) => {
                        if (isAnimating) setIsAnimating(false);
                        setMatrix(prev => ({ ...prev, a: parseFloat(e.target.value) }));
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span><span className="italic text-sm">b</span> (Shear X)</span>
                      <span className="bg-white border-2 border-black px-1">{matrix.b.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" min="-3" max="3" step="0.1" value={matrix.b}
                      onChange={(e) => {
                        if (isAnimating) setIsAnimating(false);
                        setMatrix(prev => ({ ...prev, b: parseFloat(e.target.value) }));
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span><span className="italic text-sm">c</span> (Shear Y)</span>
                      <span className="bg-white border-2 border-black px-1">{matrix.c.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" min="-3" max="3" step="0.1" value={matrix.c}
                      onChange={(e) => {
                        if (isAnimating) setIsAnimating(false);
                        setMatrix(prev => ({ ...prev, c: parseFloat(e.target.value) }));
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span><span className="italic text-sm">d</span> (Scale Y)</span>
                      <span className="bg-white border-2 border-black px-1">{matrix.d.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" min="-3" max="3" step="0.1" value={matrix.d}
                      onChange={(e) => {
                        if (isAnimating) setIsAnimating(false);
                        setMatrix(prev => ({ ...prev, d: parseFloat(e.target.value) }));
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 rounded-lg">
                <div className="text-[11px] font-black uppercase text-rose-800 mb-1 border-b-2 border-rose-200 pb-1">Vektor Translasi (T)</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span><span className="italic text-sm">tx</span> (Geser X)</span>
                      <span className="bg-white border-2 border-black px-1">{matrix.tx}</span>
                    </div>
                    <input 
                      type="range" min="-8" max="8" step="1" value={matrix.tx}
                      onChange={(e) => {
                        if (isAnimating) setIsAnimating(false);
                        setMatrix(prev => ({ ...prev, tx: parseInt(e.target.value) }));
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span><span className="italic text-sm">ty</span> (Geser Y)</span>
                      <span className="bg-white border-2 border-black px-1">{matrix.ty}</span>
                    </div>
                    <input 
                      type="range" min="-8" max="8" step="1" value={matrix.ty}
                      onChange={(e) => {
                        if (isAnimating) setIsAnimating(false);
                        setMatrix(prev => ({ ...prev, ty: parseInt(e.target.value) }));
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-500">Preset Animasi Transformasi</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRESETS).map(([key, mat]) => (
                    <button 
                      key={key}
                      onClick={() => animateToMatrix(mat)}
                      className="bg-white py-1 text-[10px] font-bold border-4 border-black shadow-[2px_2px_0px_0px_#000] rounded active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                      {key.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
              <h4 className="font-black text-teal-400 text-[10px] mb-2 uppercase tracking-widest border-b-2 border-slate-700 pb-1">PERSAMAAN TRANSFORMASI</h4>
              
              <div className="flex justify-center items-center gap-2 font-mono text-lg font-bold bg-slate-800 py-2 border-2 border-slate-600 rounded mb-2 flex-wrap">
                <div className="flex flex-col items-center">
                  <span>x'</span>
                  <span>y'</span>
                </div>
                <span className="text-xl">=</span>
                <span className="text-3xl text-teal-300">[</span>
                <div className="flex flex-col items-center text-teal-300">
                  <span>{matrix.a.toFixed(1)}</span>
                  <span>{matrix.c.toFixed(1)}</span>
                </div>
                <div className="flex flex-col items-center text-teal-300">
                  <span>{matrix.b.toFixed(1)}</span>
                  <span>{matrix.d.toFixed(1)}</span>
                </div>
                <span className="text-3xl text-teal-300">]</span>
                <div className="flex flex-col items-center">
                  <span>x</span>
                  <span>y</span>
                </div>
                <span className="text-xl">+</span>
                <span className="text-3xl text-rose-300">[</span>
                <div className="flex flex-col items-center text-rose-300">
                  <span>{matrix.tx}</span>
                  <span>{matrix.ty}</span>
                </div>
                <span className="text-3xl text-rose-300">]</span>
              </div>

              <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex justify-between items-center rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400">Determinan:</span>
                <span className="text-md font-black text-yellow-300 font-mono">{det.toFixed(2)}</span>
              </div>
              <span className={`text-[9px] font-bold block mt-1 text-right uppercase ${detStatus.color}`}>
                {detStatus.text}
              </span>
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            <div className="bg-pattern-dot p-0 relative flex flex-col w-full h-[600px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000]">
              <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30">
                Ruang Vektor 2D
              </span>

              <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 border-2 border-slate-500 border-dashed"></div> Objek Asli</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-teal-400 border-2 border-black"></div> Objek Tertransformasi</div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-rose-500"></div> Vektor Basis i (1,0)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-blue-500"></div> Vektor Basis j (0,1)</div>
              </div>

              <div className="w-full h-full flex justify-center items-center">
                
                <svg viewBox="0 0 500 500" className="w-full h-full overflow-visible">
                  <defs>
                    <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                      <path d="M 0 0 L 6 3 L 0 6 z" fill="#ef4444" />
                    </marker>
                    <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                      <path d="M 0 0 L 6 3 L 0 6 z" fill="#3b82f6" />
                    </marker>
                  </defs>

                  <g transform="translate(250, 250)">
                    
                    <g stroke="#cbd5e1" strokeWidth="1">
                      {Array.from({ length: 21 }, (_, i) => i - 10).filter(i => i !== 0).map(i => (
                        <g key={`static-${i}`}>
                          <line x1={mapX(i)} y1={mapY(10)} x2={mapX(i)} y2={mapY(-10)} />
                          <line x1={mapX(-10)} y1={mapY(i)} x2={mapX(10)} y2={mapY(i)} />
                        </g>
                      ))}
                    </g>
                    
                    <g stroke="#99f6e4" strokeWidth="1.5" opacity="0.4">
                      {getDynamicGridLines()}
                    </g>

                    <line x1={mapX(-10)} y1={mapY(0)} x2={mapX(10)} y2={mapY(0)} stroke="#1e293b" strokeWidth="3" />
                    <line x1={mapX(0)} y1={mapY(-10)} x2={mapX(0)} y2={mapY(10)} stroke="#1e293b" strokeWidth="3" />

                    <path d={getOriginalShapePath()} fill="#e2e8f0" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" opacity={0.6} />

                    <path d={getTransformedShapePath()} fill="#2dd4bf" fillOpacity={0.8} stroke="#0f172a" strokeWidth="3" strokeLinejoin="round" />
                    
                    <line 
                      x1={mapX(iVec.origin.x)} y1={mapY(iVec.origin.y)} 
                      x2={mapX(iVec.tPt.x)} y2={mapY(iVec.tPt.y)} 
                      stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrowRed)" 
                    />
                    <line 
                      x1={mapX(jVec.origin.x)} y1={mapY(jVec.origin.y)} 
                      x2={mapX(jVec.tPt.x)} y2={mapY(jVec.tPt.y)} 
                      stroke="#3b82f6" strokeWidth="4" markerEnd="url(#arrowBlue)" 
                    />

                    <text x={mapX(iVec.tPt.x) + 5} y={mapY(iVec.tPt.y) - 5} fontWeight="900" fontSize="12" fill="#ef4444">i</text>
                    <text x={mapX(jVec.tPt.x) + 5} y={mapY(jVec.tPt.y) - 5} fontWeight="900" fontSize="12" fill="#3b82f6">j</text>

                    <circle cx={mapX(0)} cy={mapY(0)} r="4" fill="#000" />
                  </g>
                </svg>
              </div>

            </div>

          </div>
        </div>

        <div className="bg-teal-50 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_#000] mb-10">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1">
            Buku Panduan: Transformasi Linear
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-teal-700 border-b-2 border-black pb-1 mb-2">1. Vektor Basis ( i and j )</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
                Transformasi matriks pada dasarnya memberi tahu kita ke mana perangnya vektor basis. Vektor merah (i) yang awalnya di (1,0) akan mendarat di koordinat (a, c). Vektor biru (j) di (0,1) akan mendarat di (b, d). Seluruh titik lain dalam ruang akan mengikuti pergeseran ini secara proporsional.
              </p>
              <div className="bg-teal-100 p-2 border-2 border-teal-300 text-xs font-bold text-teal-900 font-mono text-center rounded">
                [x', y'] = [a*x + b*y, c*x + d*y]
              </div>
            </div>
            
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">2. Makna Determinan</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
                Determinan (ad - bc) mengukur perubahan luas (scaling factor) dari ruang tersebut. 
              </p>
              <ul className="text-xs list-disc pl-4 font-bold text-slate-700 space-y-1">
                <li><b>Det = 1:</b> Luas ruang tetap (Rotasi / Shear).</li>
                <li><b>Det greater than 1:</b> Ruang membesar (Scaling).</li>
                <li><b>Det less than 0:</b> Ruang terbalik/tercermin (Refleksi).</li>
                <li><b>Det = 0:</b> Ruang hancur menjadi garis (Dimensi menyusut).</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
