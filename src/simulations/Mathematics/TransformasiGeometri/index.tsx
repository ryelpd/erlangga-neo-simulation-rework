import { useState, useRef, useEffect, useCallback } from 'react';

interface Point {
  id: string;
  x: number;
  y: number;
}

const SCALE = 25;

const ORIG_POINTS: Point[] = [
  { id: 'A', x: 2, y: 2 },
  { id: 'B', x: 5, y: 2 },
  { id: 'C', x: 3, y: 5 }
];

function mapX(x: number): number { return x * SCALE; }
function mapY(y: number): number { return -y * SCALE; }

export default function TransformasiGeometri() {
  const [currentMode, setCurrentMode] = useState<'TRANS' | 'REFL' | 'ROT' | 'DIL'>('TRANS');
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [angle, setAngle] = useState(0);
  const [scale, setScale] = useState(1);
  const [reflAxis, setReflAxis] = useState('x');
  const [targetPoints, setTargetPoints] = useState<Point[]>([...ORIG_POINTS]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([...ORIG_POINTS]);

  const animFrameIdRef = useRef<number | undefined>(undefined);
  const animProgressRef = useRef(1);
  const targetPointsRef = useRef<Point[]>([...ORIG_POINTS]);

  useEffect(() => {
    targetPointsRef.current = targetPoints;
  }, [targetPoints]);

  const calculateTransformation = useCallback(() => {
    let mat = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

    if (currentMode === 'TRANS') {
      mat.tx = tx;
      mat.ty = ty;
    } else if (currentMode === 'REFL') {
      if (reflAxis === 'x') {
        mat.d = -1;
      } else if (reflAxis === 'y') {
        mat.a = -1;
      } else if (reflAxis === 'yx') {
        mat.a = 0; mat.b = 1; mat.c = 1; mat.d = 0;
      } else if (reflAxis === 'ynx') {
        mat.a = 0; mat.b = -1; mat.c = -1; mat.d = 0;
      } else if (reflAxis === 'origin') {
        mat.a = -1; mat.d = -1;
      }
    } else if (currentMode === 'ROT') {
      const thetaRad = angle * (Math.PI / 180);
      let cosT = Math.cos(thetaRad);
      let sinT = Math.sin(thetaRad);
      if (Math.abs(cosT) < 0.001) cosT = 0;
      if (Math.abs(sinT) < 0.001) sinT = 0;
      mat.a = cosT; mat.b = -sinT;
      mat.c = sinT; mat.d = cosT;
    } else if (currentMode === 'DIL') {
      mat.a = scale; mat.d = scale;
    }

    const newTargetPoints = ORIG_POINTS.map(p => ({
      id: p.id,
      x: mat.a * p.x + mat.b * p.y + mat.tx,
      y: mat.c * p.x + mat.d * p.y + mat.ty
    }));

    setTargetPoints(newTargetPoints);
    animProgressRef.current = 0;
  }, [currentMode, tx, ty, angle, scale, reflAxis]);

  useEffect(() => {
    calculateTransformation();
  }, [calculateTransformation]);

  useEffect(() => {
    const animate = () => {
      animProgressRef.current += 0.05;
      if (animProgressRef.current > 1) animProgressRef.current = 1;

      const ease = 1 - Math.pow(1 - animProgressRef.current, 3);

      const newCurrentPoints = ORIG_POINTS.map((orig, i) => {
        const targ = targetPointsRef.current[i];
        return {
          id: orig.id,
          x: orig.x + (targ.x - orig.x) * ease,
          y: orig.y + (targ.y - orig.y) * ease
        };
      });

      setCurrentPoints(newCurrentPoints);

      if (animProgressRef.current < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [targetPoints]);

  const handleReset = () => {
    setTx(0);
    setTy(0);
    setAngle(0);
    setScale(1);
    setReflAxis('x');
  };

  const getMirrorLine = () => {
    if (currentMode !== 'REFL' || reflAxis === 'origin') return null;

    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

    if (reflAxis === 'x') {
      x1 = mapX(-12); y1 = mapY(0);
      x2 = mapX(12); y2 = mapY(0);
    } else if (reflAxis === 'y') {
      x1 = mapX(0); y1 = mapY(12);
      x2 = mapX(0); y2 = mapY(-12);
    } else if (reflAxis === 'yx') {
      x1 = mapX(-12); y1 = mapY(-12);
      x2 = mapX(12); y2 = mapY(12);
    } else if (reflAxis === 'ynx') {
      x1 = mapX(-12); y1 = mapY(12);
      x2 = mapX(12); y2 = mapY(-12);
    }

    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#ef4444"
        strokeWidth={3}
        strokeDasharray="8 4"
      />
    );
  };

  const getMatrixDisplay = () => {
    if (currentMode === 'TRANS') {
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-emerald-400">T =</span>
          <div className="flex flex-col items-center text-white font-mono text-sm">
            <span>1</span>
            <span>0</span>
          </div>
          <div className="flex flex-col items-center text-white font-mono text-sm pl-2">
            <span>0</span>
            <span>1</span>
          </div>
          <span className="text-xl">+</span>
          <div className="flex flex-col items-center text-white font-mono text-sm">
            <span>{tx}</span>
            <span>{ty}</span>
          </div>
        </div>
      );
    }

    let m00 = '1', m01 = '0', m10 = '0', m11 = '1';

    if (currentMode === 'REFL') {
      if (reflAxis === 'x') {
        m00 = '1'; m11 = '-1';
      } else if (reflAxis === 'y') {
        m00 = '-1'; m11 = '1';
      } else if (reflAxis === 'yx') {
        m00 = '0'; m01 = '1'; m10 = '1'; m11 = '0';
      } else if (reflAxis === 'ynx') {
        m00 = '0'; m01 = '-1'; m10 = '-1'; m11 = '0';
      } else if (reflAxis === 'origin') {
        m00 = '-1'; m11 = '-1';
      }
    } else if (currentMode === 'ROT') {
      const thetaRad = angle * (Math.PI / 180);
      let cosT = Math.cos(thetaRad);
      let sinT = Math.sin(thetaRad);
      if (Math.abs(cosT) < 0.001) cosT = 0;
      if (Math.abs(sinT) < 0.001) sinT = 0;
      m00 = cosT.toFixed(cosT % 1 === 0 ? 0 : 2);
      m01 = (-sinT).toFixed(sinT % 1 === 0 ? 0 : 2);
      m10 = sinT.toFixed(sinT % 1 === 0 ? 0 : 2);
      m11 = cosT.toFixed(cosT % 1 === 0 ? 0 : 2);
    } else if (currentMode === 'DIL') {
      m00 = scale.toString();
      m11 = scale.toString();
    }

    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold text-emerald-400">M =</span>
        <div className="flex flex-col items-center text-white font-mono text-sm">
          <span>{m00}</span>
          <span>{m10}</span>
        </div>
        <div className="flex flex-col items-center text-white font-mono text-sm pl-2">
          <span>{m01}</span>
          <span>{m11}</span>
        </div>
      </div>
    );
  };

  const formatCoord = (p: Point): string => {
    const xStr = p.x % 1 === 0 ? p.x.toString() : p.x.toFixed(1);
    const yStr = p.y % 1 === 0 ? p.y.toString() : p.y.toFixed(1);
    return `${p.id} (${xStr}, ${yStr})`;
  };

  const formatTargetCoord = (p: Point): string => {
    const xStr = p.x % 1 === 0 ? p.x.toString() : p.x.toFixed(1);
    const yStr = p.y % 1 === 0 ? p.y.toString() : p.y.toFixed(1);
    return `${p.id}' (${xStr}, ${yStr})`;
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-blue-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">MATEMATIKA GEOMETRI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: TRANSFORMASI 2D
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Translasi, Refleksi, Rotasi, dan Dilatasi Bangun Datar
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#3b82f6] text-md transform rotate-2 z-30 uppercase">
            Panel Transformasi
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Jenis Transformasi</label>
              <div className="grid grid-cols-2 gap-2">
                {['TRANS', 'REFL', 'ROT', 'DIL'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setCurrentMode(mode as 'TRANS' | 'REFL' | 'ROT' | 'DIL')}
                    className={`neo-btn py-2 px-1 text-[10px] font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${currentMode === mode ? 'bg-blue-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {mode === 'TRANS' && '➡️ TRANSLASI'}
                    {mode === 'REFL' && '🪞 REFLEKSI'}
                    {mode === 'ROT' && '🔄 ROTASI'}
                    {mode === 'DIL' && '🔍 DILATASI'}
                  </button>
                ))}
              </div>
            </div>

            {currentMode === 'TRANS' && (
              <div className="flex flex-col gap-3 p-4 border-4 border-black bg-blue-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-blue-800 border-b-2 border-blue-200 pb-1">Vektor Geser (T)</label>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span>Sumbu X (a)</span>
                    <span className="bg-white border-2 border-black px-2 py-0.5">{tx}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={tx}
                    onChange={(e) => setTx(parseInt(e.target.value))}
                    className="w-full cursor-pointer"
                    style={{ accentColor: '#3b82f6' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span>Sumbu Y (b)</span>
                    <span className="bg-white border-2 border-black px-2 py-0.5">{ty}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={ty}
                    onChange={(e) => setTy(parseInt(e.target.value))}
                    className="w-full cursor-pointer"
                    style={{ accentColor: '#3b82f6' }}
                  />
                </div>
              </div>
            )}

            {currentMode === 'REFL' && (
              <div className="flex flex-col gap-2 p-4 border-4 border-black bg-rose-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-rose-800 border-b-2 border-rose-200 pb-1">Cermin (Sumbu Refleksi)</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { axis: 'x', label: 'Sumbu X (y=0)' },
                    { axis: 'y', label: 'Sumbu Y (x=0)' },
                    { axis: 'yx', label: 'Garis y = x' },
                    { axis: 'ynx', label: 'Garis y = -x' },
                    { axis: 'origin', label: 'Titik Asal (0,0)' }
                  ].map(item => (
                    <button
                      key={item.axis}
                      onClick={() => setReflAxis(item.axis)}
                      className={`neo-btn py-2 text-xs border-4 border-black shadow-[2px_2px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${reflAxis === item.axis ? 'bg-rose-200 text-rose-900 ring-2 ring-black' : 'bg-white text-slate-700'} ${item.axis === 'origin' ? 'col-span-2' : ''}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentMode === 'ROT' && (
              <div className="flex flex-col gap-3 p-4 border-4 border-black bg-yellow-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-yellow-800 border-b-2 border-yellow-200 pb-1">Rotasi Pusat (0,0)</label>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span>Sudut Putar (θ)</span>
                    <span className="bg-white border-2 border-black px-2 py-0.5">{angle}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="15"
                    value={angle}
                    onChange={(e) => setAngle(parseInt(e.target.value))}
                    className="w-full cursor-pointer"
                    style={{ accentColor: '#f59e0b' }}
                  />
                </div>
              </div>
            )}

            {currentMode === 'DIL' && (
              <div className="flex flex-col gap-3 p-4 border-4 border-black bg-emerald-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-emerald-800 border-b-2 border-emerald-200 pb-1">Skala Pusat (0,0)</label>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span>Faktor Skala (k)</span>
                    <span className="bg-white border-2 border-black px-2 py-0.5">{scale}</span>
                  </div>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.5"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full cursor-pointer"
                    style={{ accentColor: '#10b981' }}
                  />
                </div>
              </div>
            )}

            <div className="flex border-t-4 border-black pt-4 mt-1">
              <button
                onClick={handleReset}
                className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 text-sm w-full border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔄 RESET POSISI AWAL
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
            <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA KOORDINAT & MATRIKS</h4>
            
            <div className="grid grid-cols-2 gap-2 mb-3 text-center">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Titik Asli</span>
                {ORIG_POINTS.map(p => (
                  <span key={p.id} className="text-xs font-mono">{formatCoord(p)}</span>
                ))}
              </div>
              <div className="bg-slate-800 p-2 border-2 border-sky-500 rounded flex flex-col">
                <span className="text-[9px] font-bold uppercase text-sky-300 mb-1">Titik Bayangan</span>
                {targetPoints.map(p => (
                  <span key={p.id} className="text-xs font-mono font-bold text-sky-400">{formatTargetCoord(p)}</span>
                ))}
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex flex-col items-center justify-center rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Representasi Matriks</span>
              {getMatrixDisplay()}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center w-full h-[600px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Bidang Kartesius
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
              <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-slate-500 border-dashed"></div> Bangun Asli (A,B,C)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-400 border-2 border-black"></div> Bangun Bayangan (A',B',C')</div>
              <div className="flex items-center gap-2"><div className="w-4 h-1 border-t-2 border-rose-500 border-dashed"></div> Cermin / Refleksi</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
              <svg viewBox="0 0 600 600" className="w-full h-full overflow-visible bg-white/50">
                <g transform="translate(300, 300)">
                  <g stroke="#cbd5e1" strokeWidth="1">
                    {Array.from({ length: 25 }, (_, i) => i - 12).map(i => {
                      if (i === 0) return null;
                      return (
                        <g key={i}>
                          <line x1={mapX(i)} y1={mapY(12)} x2={mapX(i)} y2={mapY(-12)} stroke={i % 5 === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={i % 5 === 0 ? 2 : 1} />
                          <line x1={mapX(-12)} y1={mapY(i)} x2={mapX(12)} y2={mapY(i)} stroke={i % 5 === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={i % 5 === 0 ? 2 : 1} />
                          {i % 2 === 0 && (
                            <>
                              <text x={mapX(i)} y={15} fontSize="10" textAnchor="middle" fill="#94a3b8">{i}</text>
                              <text x={5} y={mapY(i) + 3} fontSize="10" fill="#94a3b8">{i}</text>
                            </>
                          )}
                        </g>
                      );
                    })}
                  </g>

                  <line x1="-300" y1="0" x2="300" y2="0" stroke="#0f172a" strokeWidth="3" />
                  <text x="280" y="15" fontFamily="Space Grotesk" fontWeight="900" fontSize="12" fill="#0f172a">X</text>
                  
                  <line x1="0" y1="-300" x2="0" y2="300" stroke="#0f172a" strokeWidth="3" />
                  <text x="10" y="-280" fontFamily="Space Grotesk" fontWeight="900" fontSize="12" fill="#0f172a">Y</text>

                  {getMirrorLine()}

                  <polygon
                    points={ORIG_POINTS.map(p => `${mapX(p.x)},${mapY(p.y)}`).join(' ')}
                    fill="rgba(148, 163, 184, 0.2)"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {ORIG_POINTS.map(p => (
                    <g key={p.id}>
                      <text x={mapX(p.x) + 8} y={mapY(p.y) - 8} fontFamily="Space Grotesk" fontWeight="bold" fontSize="12" fill="#475569">{p.id}</text>
                      <circle cx={mapX(p.x)} cy={mapY(p.y)} r="3" fill="#64748b" />
                    </g>
                  ))}

                  <polygon
                    points={currentPoints.map(p => `${mapX(p.x)},${mapY(p.y)}`).join(' ')}
                    fill="rgba(56, 189, 248, 0.6)"
                    stroke="#0284c7"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />

                  {currentPoints.map(p => (
                    <g key={p.id}>
                      <text x={mapX(p.x) + 8} y={mapY(p.y) - 8} fontFamily="Space Grotesk" fontWeight="900" fontSize="14" fill="#0369a1">{p.id}'</text>
                      <circle cx={mapX(p.x)} cy={mapY(p.y)} r="3" fill="#0284c7" />
                    </g>
                  ))}

                  <circle cx="0" cy="0" r="4" fill="#000" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-blue-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Teori Transformasi 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">➡️ Translasi</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-2">
              <b>Pergeseran.</b> Memindahkan bangun ke arah tertentu tanpa mengubah bentuk, ukuran, maupun orientasinya.
            </p>
            <div className="bg-slate-100 p-1 text-[10px] font-mono text-center font-bold">x' = x + a<br />y' = y + b</div>
          </div>
          
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">🪞 Refleksi</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-2">
              <b>Pencerminan.</b> Membalikkan bangun melewati suatu garis (cermin). Bentuk dan ukuran tetap, namun orientasinya berlawanan (terbalik).
            </p>
            <div className="bg-slate-100 p-1 text-[10px] font-mono text-center font-bold">Terhadap Sb X:<br />(x, y) → (x, -y)</div>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-yellow-600 border-b-2 border-black pb-1 mb-2">🔄 Rotasi</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-2">
              <b>Perputaran.</b> Memutar bangun sebesar sudut θ berpusat di titik tertentu (0,0). Sudut positif berlawanan arah jarum jam.
            </p>
            <div className="bg-slate-100 p-1 text-[10px] font-mono text-center font-bold">x' = x cosθ - y sinθ<br />y' = x sinθ + y cosθ</div>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">🔍 Dilatasi</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-2">
              <b>Perkalian Skala.</b> Mengubah ukuran bangun (diperbesar atau diperkecil) dengan faktor k. Jika k negatif, bangun juga akan terbalik.
            </p>
            <div className="bg-slate-100 p-1 text-[10px] font-mono text-center font-bold">x' = k × x<br />y' = k × y</div>
          </div>
        </div>
      </div>
    </div>
  );
}