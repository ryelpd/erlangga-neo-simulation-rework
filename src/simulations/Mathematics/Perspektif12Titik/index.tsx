import type { ReactNode } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';

type PerspectiveMode = 'one-point' | 'two-point';

interface VanishingPoint {
  x: number;
  y: number;
}

interface CornerPoint {
  x: number;
  y: number;
  label: string;
}

export default function Perspektif12Titik(): ReactNode {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<PerspectiveMode>('one-point');
  const [horizonY, setHorizonY] = useState(200);
  const [vp1, setVp1] = useState<VanishingPoint>({ x: 400, y: 200 });
  const [vp2, setVp2] = useState<VanishingPoint>({ x: 150, y: 200 });
  const [showGrid, setShowGrid] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [objectDepth, setObjectDepth] = useState(100);
  const [objectWidth, setObjectWidth] = useState(120);
  const [objectHeight, setObjectHeight] = useState(80);
  const [objectX, setObjectX] = useState(300);
  const [objectY, setObjectY] = useState(280);

  const [isDraggingVp1, setIsDraggingVp1] = useState(false);
  const [isDraggingVp2, setIsDraggingVp2] = useState(false);
  const [isDraggingHorizon, setIsDraggingHorizon] = useState(false);

  const SVG_WIDTH = 600;
  const SVG_HEIGHT = 400;

  const calculatePerspectivePoint = useCallback((
    baseX: number, 
    baseY: number, 
    depthOffset: number,
    vanishingPoint: VanishingPoint
  ): { x: number; y: number } => {
    const t = depthOffset / 200;
    const x = baseX + (vanishingPoint.x - baseX) * t;
    const y = baseY + (vanishingPoint.y - baseY) * t;
    return { x, y };
  }, []);

  const getOnePointShape = useCallback(() => {
    const frontFace = [
      { x: objectX, y: objectY },
      { x: objectX + objectWidth, y: objectY },
      { x: objectX + objectWidth, y: objectY + objectHeight },
      { x: objectX, y: objectY + objectHeight },
    ];

    const backFace = frontFace.map(p => 
      calculatePerspectivePoint(p.x, p.y, objectDepth, vp1)
    );

    return { frontFace, backFace };
  }, [objectX, objectY, objectWidth, objectHeight, objectDepth, vp1, calculatePerspectivePoint]);

  const getTwoPointShape = useCallback(() => {
    const baseY = objectY;
    const height = objectHeight;
    const leftWidth = objectWidth / 2;
    const rightWidth = objectWidth / 2;
    
    const bottomLeft = { x: objectX - leftWidth, y: baseY };
    const bottomRight = { x: objectX + rightWidth, y: baseY };
    const topLeft = { x: bottomLeft.x, y: baseY - height };
    const topRight = { x: bottomRight.x, y: baseY - height };

    const backBottomLeft = calculatePerspectivePoint(bottomLeft.x, bottomLeft.y, objectDepth, vp2);
    const backBottomRight = calculatePerspectivePoint(bottomRight.x, bottomRight.y, objectDepth, vp1);
    const backTopLeft = { x: backBottomLeft.x, y: backBottomLeft.y - height * (1 - objectDepth / 300) };
    const backTopRight = { x: backBottomRight.x, y: backBottomRight.y - height * (1 - objectDepth / 300) };

    return {
      frontPoints: [bottomLeft, topLeft, topRight, bottomRight],
      backPoints: [backBottomLeft, backTopLeft, backTopRight, backBottomRight],
      leftPoints: [bottomLeft, topLeft, backTopLeft, backBottomLeft],
      rightPoints: [bottomRight, topRight, backTopRight, backBottomRight],
    };
  }, [objectX, objectY, objectWidth, objectHeight, objectDepth, vp1, vp2, calculatePerspectivePoint]);

  const handleMouseDown = (e: React.MouseEvent, type: 'vp1' | 'vp2' | 'horizon') => {
    e.preventDefault();
    if (type === 'vp1') setIsDraggingVp1(true);
    else if (type === 'vp2') setIsDraggingVp2(true);
    else setIsDraggingHorizon(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_WIDTH / rect.width;
    const scaleY = SVG_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (isDraggingVp1) {
      setVp1({ x: Math.max(50, Math.min(SVG_WIDTH - 50, x)), y: Math.max(50, Math.min(SVG_HEIGHT - 50, y)) });
      if (mode === 'one-point') setHorizonY(y);
    }
    if (isDraggingVp2) {
      setVp2({ x: Math.max(50, Math.min(SVG_WIDTH - 50, x)), y: Math.max(50, Math.min(SVG_HEIGHT - 50, y)) });
      setHorizonY(y);
    }
    if (isDraggingHorizon) {
      const newY = Math.max(50, Math.min(SVG_HEIGHT - 50, y));
      setHorizonY(newY);
      setVp1(prev => ({ ...prev, y: newY }));
      if (mode === 'two-point') setVp2(prev => ({ ...prev, y: newY }));
    }
  }, [isDraggingVp1, isDraggingVp2, isDraggingHorizon, mode]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingVp1(false);
    setIsDraggingVp2(false);
    setIsDraggingHorizon(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (mode === 'one-point') {
      setVp1({ x: 400, y: horizonY });
    } else {
      setVp1({ x: 550, y: horizonY });
      setVp2({ x: 50, y: horizonY });
    }
  }, [mode, horizonY]);

  const renderOnePoint = () => {
    const { frontFace, backFace } = getOnePointShape();

    return (
      <>
        {showLines && frontFace.map((p, i) => (
          <line
            key={`line-${i}`}
            x1={p.x}
            y1={p.y}
            x2={vp1.x}
            y2={vp1.y}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        ))}
        
        <polygon
          points={frontFace.map(p => `${p.x},${p.y}`).join(' ')}
          fill="#38bdf8"
          stroke="#000"
          strokeWidth="3"
        />
        
        <polygon
          points={backFace.map(p => `${p.x},${p.y}`).join(' ')}
          fill="#0ea5e9"
          stroke="#000"
          strokeWidth="3"
          opacity="0.7"
        />
        
        {frontFace.map((p, i) => (
          <line
            key={`edge-${i}`}
            x1={p.x}
            y1={p.y}
            x2={backFace[i].x}
            y2={backFace[i].y}
            stroke="#000"
            strokeWidth="3"
          />
        ))}
      </>
    );
  };

  const renderTwoPoint = () => {
    const shape = getTwoPointShape();

    return (
      <>
        {showLines && (
          <>
            {shape.frontPoints.map((p, i) => (
              <line
                key={`vp1-line-${i}`}
                x1={p.x}
                y1={p.y}
                x2={vp1.x}
                y2={vp1.y}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
            ))}
            {shape.frontPoints.map((p, i) => (
              <line
                key={`vp2-line-${i}`}
                x1={p.x}
                y1={p.y}
                x2={vp2.x}
                y2={vp2.y}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
            ))}
          </>
        )}
        
        <polygon
          points={shape.rightPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="#38bdf8"
          stroke="#000"
          strokeWidth="3"
        />
        
        <polygon
          points={shape.leftPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="#f472b6"
          stroke="#000"
          strokeWidth="3"
        />
        
        <polygon
          points={[
            shape.rightPoints[1],
            shape.leftPoints[1],
            shape.backPoints[2],
            shape.backPoints[1]
          ].map(p => `${p.x},${p.y}`).join(' ')}
          fill="#a78bfa"
          stroke="#000"
          strokeWidth="3"
          opacity="0.7"
        />
      </>
    );
  };

  const quizData = [
    {
      question: "1. Dalam perspektif 1 titik, semua garis yang mengarah ke kedalaman (depth) akan menuju ke satu titik yang disebut...",
      options: ["Titik fokus", "Vanishing point", "Horizon line", "Eye level"],
      answer: 1,
    },
    {
      question: "2. Garis horizon (horizon line) mewakili posisi...",
      options: ["Kaki penggambar", "Tinggi mata penggambar", "Posisi objek", "Lantai ruangan"],
      answer: 1,
    },
    {
      question: "3. Dalam perspektif 2 titik, kita menggunakan 2 vanishing point untuk objek yang...",
      options: ["Menghadap langsung ke penggambar", "Berada di sudut/angle", "Memiliki hanya 1 sisi visible", "Berbentuk lingkaran"],
      answer: 1,
    },
    {
      question: "4. Apa yang terjadi jika vanishing point diletakkan di luar kanvas?",
      options: ["Gambar menjadi rusak", "Objek terlihat lebih datar", "Perspektif tetap berfungsi normal", "Garis tidak akan konvergen"],
      answer: 2,
    },
    {
      question: "5. Garis yang tidak menuju vanishing point (tetap horizontal/vertical) dalam perspektif disebut...",
      options: ["Diagonal lines", "Orthogonal lines", "Transversal lines", "Perspective lines"],
      answer: 2,
    },
  ];

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleAnswer = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (userAnswers.every(a => a !== null)) setQuizSubmitted(true);
  };

  const handleRetry = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const score = userAnswers.reduce<number>((acc, a, i) => {
    if (a === quizData[i].answer) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-amber-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">MATEMATIKA & SENI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: PERSPEKTIF 1 & 2 TITIK
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Memahami Teknik Gambar Perspektif dengan Vanishing Point
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-5 w-full lg:w-1/3">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Panel Kontrol
          </span>

          <div className="mt-4 flex flex-col gap-4">
            <div className="bg-indigo-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <label className="font-black uppercase text-xs">Mode Perspektif:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('one-point')}
                  className={`flex-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 font-bold text-xs uppercase transition-all
                    ${mode === 'one-point' 
                      ? 'bg-sky-400 text-white translate-x-[4px] translate-y-[4px] shadow-none' 
                      : 'bg-white text-black'
                    }`}
                >
                  1 TITIK
                </button>
                <button
                  onClick={() => setMode('two-point')}
                  className={`flex-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 font-bold text-xs uppercase transition-all
                    ${mode === 'two-point' 
                      ? 'bg-purple-400 text-white translate-x-[4px] translate-y-[4px] shadow-none' 
                      : 'bg-white text-black'
                    }`}
                >
                  2 TITIK
                </button>
              </div>
            </div>

            <div className="bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <label className="font-black uppercase text-xs">Tampilan:</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  Grid Panduan
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={showLines}
                    onChange={(e) => setShowLines(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  Garis Konvergen
                </label>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
              <label className="font-black uppercase text-xs text-rose-800">Properti Objek:</label>
              
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs">Kedalaman (Depth)</span>
                  <span className="font-mono font-black text-xs bg-white px-2 border-2 border-black">{objectDepth}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={objectDepth}
                  onChange={(e) => setObjectDepth(Number(e.target.value))}
                  className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs">Lebar</span>
                  <span className="font-mono font-black text-xs bg-white px-2 border-2 border-black">{objectWidth}</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={objectWidth}
                  onChange={(e) => setObjectWidth(Number(e.target.value))}
                  className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs">Tinggi</span>
                  <span className="font-mono font-black text-xs bg-white px-2 border-2 border-black">{objectHeight}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="150"
                  value={objectHeight}
                  onChange={(e) => setObjectHeight(Number(e.target.value))}
                  className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
                />
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-2">
              <h4 className="font-black text-yellow-400 text-xs mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">KOORDINAT VANISHING POINT</h4>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-800 p-2 border-2 border-sky-500 flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">VP1 (X, Y)</span>
                  <span className="text-lg font-black text-sky-400 font-mono">{vp1.x}, {vp1.y}</span>
                </div>
                {mode === 'two-point' && (
                  <div className="bg-slate-800 p-2 border-2 border-purple-500 flex flex-col items-center">
                    <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">VP2 (X, Y)</span>
                    <span className="text-lg font-black text-purple-400 font-mono">{vp2.x}, {vp2.y}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-800 p-2 border-2 border-amber-500 mt-2 flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">HORIZON LINE (Y)</span>
                <span className="text-lg font-black text-amber-400 font-mono">{horizonY}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-4 relative flex flex-col w-full lg:w-2/3">
          <span className="absolute -top-4 left-6 bg-amber-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Canvas Perspektif
          </span>

          <div className="absolute top-4 right-4 z-20 bg-yellow-300 p-2 border-4 border-black shadow-[4px_4px_0px_#000] font-black text-[10px] uppercase">
            Drag Vanishing Points untuk Mengubah Perspektif
          </div>

          <div ref={containerRef} className="mt-4 w-full aspect-[3/2] relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="w-full h-full border-4 border-black bg-slate-50"
              style={{ touchAction: 'none' }}
            >
              {showGrid && (
                <>
                  {Array.from({ length: 12 }, (_, i) => (
                    <line
                      key={`grid-v-${i}`}
                      x1={i * 50}
                      y1={0}
                      x2={i * 50}
                      y2={SVG_HEIGHT}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  ))}
                  {Array.from({ length: 8 }, (_, i) => (
                    <line
                      key={`grid-h-${i}`}
                      x1={0}
                      y1={i * 50}
                      x2={SVG_WIDTH}
                      y2={i * 50}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  ))}
                </>
              )}

              <line
                x1={0}
                y1={horizonY}
                x2={SVG_WIDTH}
                y2={horizonY}
                stroke="#f59e0b"
                strokeWidth="4"
                strokeDasharray="10 5"
              />
              
              <text x={10} y={horizonY - 10} fontSize="12" fontWeight="bold" fill="#f59e0b">HORIZON LINE</text>

              {mode === 'one-point' && renderOnePoint()}
              {mode === 'two-point' && renderTwoPoint()}

              <circle
                cx={vp1.x}
                cy={vp1.y}
                r="12"
                fill="#38bdf8"
                stroke="#000"
                strokeWidth="4"
                className="cursor-grab"
                onMouseDown={(e) => handleMouseDown(e, 'vp1')}
              />
              <text x={vp1.x - 20} y={vp1.y + 25} fontSize="14" fontWeight="black" fill="#0369a1">VP1</text>

              {mode === 'two-point' && (
                <>
                  <circle
                    cx={vp2.x}
                    cy={vp2.y}
                    r="12"
                    fill="#a855f7"
                    stroke="#000"
                    strokeWidth="4"
                    className="cursor-grab"
                    onMouseDown={(e) => handleMouseDown(e, 'vp2')}
                  />
                  <text x={vp2.x - 20} y={vp2.y + 25} fontSize="14" fontWeight="black" fill="#7c3aed">VP2</text>
                </>
              )}

              <rect
                x={0}
                y={horizonY - 5}
                width={SVG_WIDTH}
                height="10"
                fill="transparent"
                stroke="transparent"
                className="cursor-grab"
                onMouseDown={(e) => handleMouseDown(e, 'horizon')}
              />

              <circle cx={objectX} cy={objectY} r="4" fill="#000" />
              <text x={objectX + 10} y={objectY - 10} fontSize="10" fontWeight="bold" fill="#000">Base Point</text>
            </svg>
          </div>

          <div className="mt-4 bg-slate-100 p-3 border-4 border-black flex flex-wrap gap-2 justify-center">
            <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-black">
              <div className="w-4 h-4 bg-amber-400 border-2 border-black"></div>
              <span className="font-bold text-xs">Horizon Line</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-black">
              <div className="w-4 h-4 bg-sky-400 border-2 border-black rounded-full"></div>
              <span className="font-bold text-xs">VP1</span>
            </div>
            {mode === 'two-point' && (
              <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-black">
                <div className="w-4 h-4 bg-purple-400 border-2 border-black rounded-full"></div>
                <span className="font-bold text-xs">VP2</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-black">
              <div className="w-4 h-4 bg-slate-400 border-2 border-black" style={{ borderStyle: 'dashed' }}></div>
              <span className="font-bold text-xs">Garis Konvergen</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl bg-indigo-50 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 mb-10 z-10 relative text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase">
          Panduan Perspektif Gambar
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Perspektif 1 Titik</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Digunakan ketika objek <b>menghadap langsung</b> ke penonton. Hanya satu sisi objek yang terlihat, dan semua garis yang menuju kedalaman akan <b>konvergen ke satu vanishing point</b> di garis horizon.
            </p>
            <div className="bg-sky-100 p-2 border-2 border-black text-xs font-bold">
              Contoh: Koridor, rel kereta, jalan lurus
            </div>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-purple-600 border-b-2 border-black pb-1 mb-2">Perspektif 2 Titik</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Digunakan ketika objek berada di <b>angle/sudut</b>, sehingga dua sisi terlihat. Garis horizontal dari kedua sisi akan menuju ke <b>dua vanishing point</b> yang berbeda di garis horizon.
            </p>
            <div className="bg-purple-100 p-2 border-2 border-black text-xs font-bold">
              Contoh: Gedung dari sudut, kubus di angle
            </div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-amber-600 border-b-2 border-black pb-1 mb-2">Garis Horizon</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Garis horizon mewakili <b>tinggi mata penggambar</b>. Jika horizon rendah, objek terlihat dari bawah. Jika horizon tinggi, objek terlihat dari atas (bird's eye view).
            </p>
            <div className="bg-amber-100 p-2 border-2 border-black text-xs font-bold">
              Horizon = Eye Level penggambar
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl bg-slate-800 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 mb-10 z-10 relative">
        <button
          onClick={() => setShowQuiz(!showQuiz)}
          className="w-full bg-yellow-400 text-black px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-black uppercase text-lg hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
        >
          {showQuiz ? 'TUTUP KUIS' : 'UJI PENGETAHUAN ANDA (KUIS)'}
        </button>

        {showQuiz && (
          <div className="mt-6 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] text-black">
            <div className="bg-black text-white p-3 mb-4 font-black uppercase text-center">
              EVALUASI KONSEP PERSPEKTIF
            </div>
            <div className="space-y-4">
              {quizData.map((q, qIdx) => (
                <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
                  <h4 className="font-bold mb-3 text-sm uppercase">{q.question}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswer(qIdx, oIdx)}
                        disabled={quizSubmitted}
                        className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold text-xs transition-all px-3 py-2
                          ${quizSubmitted 
                            ? oIdx === q.answer 
                              ? 'bg-green-400 text-black' 
                              : userAnswers[qIdx] === oIdx 
                                ? 'bg-rose-400 text-black' 
                                : 'bg-white'
                            : userAnswers[qIdx] === oIdx 
                              ? 'bg-black text-white translate-x-[4px] translate-y-[4px] shadow-none' 
                              : 'bg-white hover:bg-slate-100'
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!quizSubmitted && userAnswers.every(a => a !== null) && (
                <button
                  onClick={handleSubmit}
                  className="w-full border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-black uppercase py-3 px-10 text-xl mt-4 bg-slate-900 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                >
                  KIRIM JAWABAN
                </button>
              )}

              {quizSubmitted && (
                <div className="mt-4 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                  <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR: {score}/5</h4>
                  <p className="text-black font-semibold text-lg mb-4 bg-white inline-block px-4 py-1 border-2 border-black">
                    {score === 5 ? "Sempurna! Master Perspektif!" : "Bagus! Pelajari lagi konsep vanishing point."}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-black uppercase py-3 px-8 text-lg bg-black text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                  >
                    ULANGI KUIS
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}