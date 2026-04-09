import { useState, useRef, useEffect, useCallback } from 'react';

interface Complex {
  re: number;
  im: number;
}

interface Polar {
  r: number;
  deg: number;
  rad: number;
}

const SCALE = 30;

function toPolar(z: Complex): Polar {
  const r = Math.hypot(z.re, z.im);
  const thetaRad = Math.atan2(z.im, z.re);
  let thetaDeg = thetaRad * (180 / Math.PI);
  if (thetaDeg < 0) thetaDeg += 360;
  return { r, deg: thetaDeg, rad: thetaRad };
}

function formatCartesian(z: Complex): string {
  const sign = z.im >= 0 ? '+' : '-';
  return `${z.re.toFixed(1)} ${sign} ${Math.abs(z.im).toFixed(1)}i`;
}

function formatPolar(p: Polar): string {
  return `${p.r.toFixed(2)} ∠ ${p.deg.toFixed(1)}°`;
}

function mapX(x: number): number { return x * SCALE; }
function mapY(y: number): number { return -y * SCALE; }
function unmapX(px: number): number { return px / SCALE; }
function unmapY(py: number): number { return -py / SCALE; }

function calculateResult(z1: Complex, z2: Complex, op: string): Complex {
  if (op === 'ADD') {
    return { re: z1.re + z2.re, im: z1.im + z2.im };
  } else if (op === 'SUB') {
    return { re: z1.re - z2.re, im: z1.im - z2.im };
  } else if (op === 'MUL') {
    return { re: (z1.re * z2.re) - (z1.im * z2.im), im: (z1.re * z2.im) + (z1.im * z2.re) };
  } else if (op === 'DIV') {
    const den = z2.re * z2.re + z2.im * z2.im || 0.0001;
    return { re: ((z1.re * z2.re) + (z1.im * z2.im)) / den, im: ((z1.im * z2.re) - (z1.re * z2.im)) / den };
  }
  return { re: 0, im: 0 };
}

export default function BilanganKompleks() {
  const [currentOp, setCurrentOp] = useState('ADD');
  const [z1, setZ1] = useState<Complex>({ re: 3, im: 4 });
  const [z2, setZ2] = useState<Complex>({ re: 5, im: 1 });
  const [zRes, setZRes] = useState<Complex>({ re: 0, im: 0 });
  const [draggedNode, setDraggedNode] = useState<'Z1' | 'Z2' | null>(null);
  
  const canvasRef = useRef<SVGSVGElement>(null);

  const getResultLabel = () => {
    switch (currentOp) {
      case 'ADD': return 'Z₁ + Z₂';
      case 'SUB': return 'Z₁ - Z₂';
      case 'MUL': return 'Z₁ × Z₂';
      case 'DIV': return 'Z₁ ÷ Z₂';
      default: return 'Z₁ + Z₂';
    }
  };

  const updateResult = useCallback(() => {
    setZRes(calculateResult(z1, z2, currentOp));
  }, [z1, z2, currentOp]);

  useEffect(() => {
    updateResult();
  }, [updateResult]);

  const getMousePos = useCallback((evt: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const scaleY = 600 / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in evt && evt.touches.length > 0) {
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    } else if ('clientX' in evt) {
      clientX = evt.clientX;
      clientY = evt.clientY;
    }

    const svgX = (clientX - rect.left) * scaleX - 300;
    const svgY = (clientY - rect.top) * scaleY - 300;

    return {
      x: unmapX(svgX),
      y: unmapY(svgY)
    };
  }, []);

  const handlePointerDown = useCallback((evt: React.MouseEvent | React.TouchEvent) => {
    const pos = getMousePos(evt);
    const distZ1 = Math.hypot(pos.x - z1.re, pos.y - z1.im);
    const distZ2 = Math.hypot(pos.x - z2.re, pos.y - z2.im);

    if (distZ1 < 1.0) {
      setDraggedNode('Z1');
    } else if (distZ2 < 1.0) {
      setDraggedNode('Z2');
    }
  }, [getMousePos, z1, z2]);

  const handlePointerMove = useCallback((evt: React.MouseEvent | React.TouchEvent) => {
    if (!draggedNode) return;
    
    const pos = getMousePos(evt);
    const newRe = Math.max(-9.5, Math.min(9.5, pos.x));
    const newIm = Math.max(-9.5, Math.min(9.5, pos.y));

    if (draggedNode === 'Z1') {
      setZ1({ re: newRe, im: newIm });
    } else {
      setZ2({ re: newRe, im: newIm });
    }
  }, [draggedNode, getMousePos]);

  const handlePointerUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const handleReset = () => {
    setZ1({ re: 3, im: 4 });
    setZ2({ re: 5, im: 1 });
    setCurrentOp('ADD');
  };

  const pZ1 = toPolar(z1);
  const pZ2 = toPolar(z2);
  const pRes = toPolar(zRes);

  const pxZ1 = mapX(z1.re);
  const pyZ1 = mapY(z1.im);
  const pxZ2 = mapX(z2.re);
  const pyZ2 = mapY(z2.im);
  const pxRes = mapX(zRes.re);
  const pyRes = mapY(zRes.im);

  const renderGrid = () => {
    const elements: React.ReactNode[] = [];
    for (let i = -10; i <= 10; i++) {
      if (i === 0) continue;
      
      elements.push(
        <line
          key={`v-${i}`}
          x1={mapX(i)}
          y1={mapY(10)}
          x2={mapX(i)}
          y2={mapY(-10)}
          stroke={i % 5 === 0 ? '#94a3b8' : '#e2e8f0'}
          strokeWidth={i % 5 === 0 ? 2 : 1}
        />
      );
      
      elements.push(
        <line
          key={`h-${i}`}
          x1={mapX(-10)}
          y1={mapY(i)}
          x2={mapX(10)}
          y2={mapY(i)}
          stroke={i % 5 === 0 ? '#94a3b8' : '#e2e8f0'}
          strokeWidth={i % 5 === 0 ? 2 : 1}
        />
      );
      
      if (i % 5 === 0) {
        elements.push(
          <text key={`tx-${i}`} x={mapX(i)} y={15} fontSize={10} textAnchor="middle" fill="#64748b">{i}</text>
        );
        elements.push(
          <text key={`ty-${i}`} x={5} y={mapY(i) + 4} fontSize={10} fill="#64748b">{i}i</text>
        );
      }
    }
    return elements;
  };

  const drawArc = (r: number, startAngleRad: number, endAngleRad: number, color: string, isDashed: boolean = false) => {
    const startX = r * Math.cos(startAngleRad);
    const startY = -r * Math.sin(startAngleRad);
    const endX = r * Math.cos(endAngleRad);
    const endY = -r * Math.sin(endAngleRad);

    let diff = endAngleRad - startAngleRad;
    while (diff < 0) diff += 2 * Math.PI;
    const largeArcFlag = diff > Math.PI ? 1 : 0;
    const sweepFlag = 0;

    const d = `M ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

    return (
      <path
        key={`arc-${r}-${color}`}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={isDashed ? '4 4' : undefined}
      />
    );
  };

  const renderHelpers = () => {
    const elements: React.ReactNode[] = [];

    if (currentOp === 'ADD') {
      elements.push(
        <line
          key="h1"
          x1={pxZ1}
          y1={pyZ1}
          x2={pxRes}
          y2={pyRes}
          stroke="#0ea5e9"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      );
      elements.push(
        <line
          key="h2"
          x1={pxZ2}
          y1={pyZ2}
          x2={pxRes}
          y2={pyRes}
          stroke="#f43f5e"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      );
    } else if (currentOp === 'SUB') {
      const negZ2px = mapX(-z2.re);
      const negZ2py = mapY(-z2.im);

      elements.push(
        <line
          key="ghost"
          x1={0}
          y1={0}
          x2={negZ2px}
          y2={negZ2py}
          stroke="#0ea5e9"
          strokeWidth={2}
          strokeDasharray="4 4"
          opacity={0.5}
        />
      );
      elements.push(
        <line
          key="h1"
          x1={pxZ1}
          y1={pyZ1}
          x2={pxRes}
          y2={pyRes}
          stroke="#0ea5e9"
          strokeWidth={2}
          strokeDasharray="6 4"
          opacity={0.5}
        />
      );
      elements.push(
        <line
          key="h2"
          x1={negZ2px}
          y1={negZ2py}
          x2={pxRes}
          y2={pyRes}
          stroke="#f43f5e"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      );
    } else if (currentOp === 'MUL') {
      elements.push(drawArc(30, 0, pZ1.rad, '#f43f5e'));
      elements.push(drawArc(40, pZ1.rad, pRes.rad, '#0ea5e9', true));
      elements.push(drawArc(50, 0, pRes.rad, '#10b981'));
    } else if (currentOp === 'DIV') {
      elements.push(drawArc(30, 0, pZ1.rad, '#f43f5e'));
      elements.push(drawArc(40, pRes.rad, pZ1.rad, '#0ea5e9', true));
      elements.push(drawArc(50, 0, pRes.rad, '#10b981'));
    }

    return elements;
  };

  const opButtons = [
    { id: 'ADD', label: '➕ PENJUMLAHAN', color: 'bg-emerald-400' },
    { id: 'SUB', label: '➖ PENGURANGAN', color: 'bg-slate-200' },
    { id: 'MUL', label: '✖️ PERKALIAN', color: 'bg-slate-200' },
    { id: 'DIV', label: '➗ PEMBAGIAN', color: 'bg-slate-200' }
  ];

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">MATEMATIKA LANJUTAN</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: BILANGAN KOMPLEKS
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Eksplorasi Bidang Argand dan Operasi Bilangan Imajiner (<span className="font-bold italic">i</span> = √-1)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#818cf8] text-md transform rotate-2 z-30 uppercase">
            Panel Operasi
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-yellow-100 border-4 border-black p-3 text-xs font-bold shadow-[4px_4px_0px_0px_#000] rounded-lg">
              💡 <b>Instruksi:</b> DRAG (Geser) titik vektor <span className="text-rose-600">Z₁</span> dan <span className="text-sky-600">Z₂</span> pada bidang kanvas di sebelah kanan.
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Operasi Aljabar</label>
              <div className="grid grid-cols-2 gap-2">
                {opButtons.map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setCurrentOp(btn.id)}
                    className={`neo-btn py-2 px-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${currentOp === btn.id ? 'bg-emerald-400 text-black ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-black pt-4">
              <button
                onClick={handleReset}
                className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔄 KEMBALIKAN KE POSISI AWAL
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
            <h4 className="font-black text-indigo-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA KOORDINAT & POLAR</h4>
            
            <div className="flex flex-col gap-2 mb-3">
              <div className="bg-slate-800 p-2 border-2 border-rose-500 rounded flex justify-between items-center">
                <span className="text-[10px] font-bold text-rose-300">Z₁</span>
                <div className="text-right">
                  <div className="font-mono font-black text-sm text-white">{formatCartesian(z1)}</div>
                  <div className="font-mono text-[9px] text-rose-300">{formatPolar(pZ1)}</div>
                </div>
              </div>
              
              <div className="bg-slate-800 p-2 border-2 border-sky-500 rounded flex justify-between items-center">
                <span className="text-[10px] font-bold text-sky-300">Z₂</span>
                <div className="text-right">
                  <div className="font-mono font-black text-sm text-white">{formatCartesian(z2)}</div>
                  <div className="font-mono text-[9px] text-sky-300">{formatPolar(pZ2)}</div>
                </div>
              </div>

              <div className="bg-black p-2 border-2 border-emerald-500 rounded flex justify-between items-center mt-2 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">{getResultLabel()}</span>
                <div className="text-right">
                  <div className="font-mono font-black text-lg text-emerald-400">{formatCartesian(zRes)}</div>
                  <div className="font-mono text-[10px] text-emerald-300">{formatPolar(pRes)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col w-full h-[600px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Bidang Kompleks (Diagram Argand)
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
              <div className="flex items-center gap-2"><div className="w-4 h-1 bg-rose-500"></div> Vektor Z₁</div>
              <div className="flex items-center gap-2"><div className="w-4 h-1 bg-sky-500"></div> Vektor Z₂</div>
              <div className="flex items-center gap-2"><div className="w-4 h-1 bg-emerald-400 border-t border-b border-black"></div> Vektor Hasil</div>
            </div>

            <div className="w-full h-full flex justify-center items-center">
              <svg
                ref={canvasRef}
                viewBox="0 0 600 600"
                className="w-full h-full overflow-visible bg-white/50"
                style={{ cursor: draggedNode ? 'grabbing' : 'crosshair' }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              >
                <defs>
                  <marker id="arrowRose" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#f43f5e" />
                  </marker>
                  <marker id="arrowSky" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#0ea5e9" />
                  </marker>
                  <marker id="arrowEmerald" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                  </marker>
                </defs>

                <g transform="translate(300, 300)">
                  <g id="gridGroup" stroke="#cbd5e1" strokeWidth="1">
                    {renderGrid()}
                  </g>

                  <line x1="-300" y1="0" x2="300" y2="0" stroke="#0f172a" strokeWidth="3" />
                  <text x="280" y="15" fontFamily="Space Grotesk" fontWeight="900" fontSize="12" fill="#0f172a">Re</text>
                  
                  <line x1="0" y1="-300" x2="0" y2="300" stroke="#0f172a" strokeWidth="3" />
                  <text x="10" y="-280" fontFamily="Space Grotesk" fontWeight="900" fontSize="12" fill="#0f172a">Im (i)</text>

                  <g id="helpersGroup">
                    {renderHelpers()}
                  </g>

                  <line
                    id="vecRes"
                    x1={0}
                    y1={0}
                    x2={pxRes}
                    y2={pyRes}
                    stroke="#10b981"
                    strokeWidth={5}
                    markerEnd="url(#arrowEmerald)"
                    opacity={Math.hypot(zRes.re, zRes.im) > 20 ? 0.3 : 1}
                  />
                  
                  <line
                    id="vecZ1"
                    x1={0}
                    y1={0}
                    x2={pxZ1}
                    y2={pyZ1}
                    stroke="#f43f5e"
                    strokeWidth={4}
                    markerEnd="url(#arrowRose)"
                  />
                  
                  <line
                    id="vecZ2"
                    x1={0}
                    y1={0}
                    x2={pxZ2}
                    y2={pyZ2}
                    stroke="#0ea5e9"
                    strokeWidth={4}
                    markerEnd="url(#arrowSky)"
                  />

                  <circle
                    id="nodeZ1"
                    cx={pxZ1}
                    cy={pyZ1}
                    r={7}
                    fill="#f43f5e"
                    stroke="#000"
                    strokeWidth={2}
                    style={{ cursor: 'grab' }}
                  />
                  <text
                    id="lblZ1"
                    x={pxZ1 + 12}
                    y={pyZ1 - 12}
                    fontFamily="Space Grotesk"
                    fontWeight="900"
                    fontSize="14"
                    fill="#e11d48"
                  >
                    Z₁
                  </text>

                  <circle
                    id="nodeZ2"
                    cx={pxZ2}
                    cy={pyZ2}
                    r={7}
                    fill="#0ea5e9"
                    stroke="#000"
                    strokeWidth={2}
                    style={{ cursor: 'grab' }}
                  />
                  <text
                    id="lblZ2"
                    x={pxZ2 + 12}
                    y={pyZ2 - 12}
                    fontFamily="Space Grotesk"
                    fontWeight="900"
                    fontSize="14"
                    fill="#0284c7"
                  >
                    Z₂
                  </text>

                  <circle cx={0} cy={0} r={4} fill="#000" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-indigo-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Dimensi Imajiner 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-slate-800 border-b-2 border-black pb-1 mb-2">Angka Imajiner (<span className="font-bold italic">i</span>)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Bagaimana cara mencari akar dari -1? Ahli matematika mendefinisikan angka baru <span className="font-bold italic">i = √-1</span>. Jika angka nyata (Real) adalah sumbu Horizontal (X), maka angka imajiner adalah sumbu Vertikal (Y).
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Penjumlahan (+)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Sangat geometris! Tambahkan bagian Real dengan Real, Imajiner dengan Imajiner. Secara visual, ini menciptakan <b>Jajar Genjang (Parallelogram)</b> di mana hasil vektornya berada di sudut berlawanan.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Perkalian (×)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Perkalian kompleks paling mudah dipahami dalam bentuk Polar (Sudut & Jarak). <b>Panjangnya dikalikan</b> (<span className="font-bold italic">r₁ × r₂</span>), sedangkan <b>Sudutnya dijumlahkan</b> (<span className="font-bold italic">θ₁ + θ₂</span>). Ini adalah fondasi dari rotasi 2D!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-sm uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Pembagian (÷)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Kebalikan dari perkalian. Dalam bentuk Polar, <b>Panjangnya dibagi</b> (<span className="font-bold italic">r₁ / r₂</span>), sedangkan <b>Sudutnya dikurangkan</b> (<span className="font-bold italic">θ₁ - θ₂</span>). Arah putarannya menjadi terbalik.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}