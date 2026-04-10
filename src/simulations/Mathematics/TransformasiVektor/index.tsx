import type { ReactNode } from 'react';
import { useState, useCallback, useMemo } from 'react';

type TransformType = 'none' | 'translate' | 'scale' | 'rotate' | 'reflect' | 'shear';

interface Vector {
  x: number;
  y: number;
}

interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
}

const transformMatrix: Record<TransformType, (params: { tx: number; ty: number; sx: number; sy: number; angle: number; axis: string; kx: number; ky: number }) => Matrix> = {
  none: () => ({ a: 1, b: 0, c: 0, d: 1 }),
  translate: ({ tx, ty }) => ({ a: 1, b: 0, c: tx, d: ty }),
  scale: ({ sx, sy }) => ({ a: sx, b: 0, c: 0, d: sy }),
  rotate: ({ angle }) => {
    const rad = (angle * Math.PI) / 180;
    return { a: Math.cos(rad), b: -Math.sin(rad), c: Math.sin(rad), d: Math.cos(rad) };
  },
  reflect: ({ axis }) => {
    if (axis === 'x') return { a: 1, b: 0, c: 0, d: -1 };
    if (axis === 'y') return { a: -1, b: 0, c: 0, d: 1 };
    return { a: 0, b: 1, c: 1, d: 0 };
  },
  shear: ({ kx, ky }) => ({ a: 1, b: kx, c: ky, d: 1 }),
};

function applyMatrix(v: Vector, m: Matrix): Vector {
  return { x: v.x * m.a + v.y * m.b, y: v.x * m.c + v.y * m.d };
}

function addVectors(v1: Vector, v2: Vector): Vector {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

const GRID_SIZE = 400;
const SCALE = 20;
const CENTER = GRID_SIZE / 2;

function toSvgCoords(v: Vector): { x: number; y: number } {
  return { x: CENTER + v.x * SCALE, y: CENTER - v.y * SCALE };
}

function toMathCoords(svgX: number, svgY: number): Vector {
  return { x: (svgX - CENTER) / SCALE, y: -(svgY - CENTER) / SCALE };
}

export default function TransformasiVektor(): ReactNode {
  const [transformType, setTransformType] = useState<TransformType>('none');
  const [tx, setTx] = useState(2);
  const [ty, setTy] = useState(1);
  const [sx, setSx] = useState(1.5);
  const [sy, setSy] = useState(1.5);
  const [angle, setAngle] = useState(45);
  const [reflectAxis, setReflectAxis] = useState('x');
  const [kx, setKx] = useState(0.5);
  const [ky, setKy] = useState(0);
  const [vector1, setVector1] = useState<Vector>({ x: 3, y: 2 });
  const [vector2, setVector2] = useState<Vector>({ x: 1, y: 4 });
  const [showSum, setShowSum] = useState(true);

  const params = useMemo(() => ({ tx, ty, sx, sy, angle, axis: reflectAxis, kx, ky }), [tx, ty, sx, sy, angle, reflectAxis, kx, ky]);

  const matrix = useMemo(() => transformMatrix[transformType](params), [transformType, params]);

  const transformedV1 = useMemo(() => {
    const result = applyMatrix(vector1, matrix);
    if (transformType === 'translate') return addVectors(result, { x: tx, y: ty });
    return result;
  }, [vector1, matrix, transformType, tx, ty]);

  const transformedV2 = useMemo(() => {
    const result = applyMatrix(vector2, matrix);
    if (transformType === 'translate') return addVectors(result, { x: tx, y: ty });
    return result;
  }, [vector2, matrix, transformType, tx, ty]);

  const sumVector = useMemo(() => addVectors(vector1, vector2), [vector1, vector2]);
  const transformedSum = useMemo(() => {
    const result = applyMatrix(sumVector, matrix);
    if (transformType === 'translate') return addVectors(result, { x: tx, y: ty });
    return result;
  }, [sumVector, matrix, transformType, tx, ty]);

  const renderGrid = useCallback(() => {
    const elements = [];
    
    for (let i = -10; i <= 10; i++) {
      const x = CENTER + i * SCALE;
      elements.push(
        <line key={`grid-v-${i}`} x1={x} y1={0} x2={x} y2={GRID_SIZE} stroke={i === 0 ? '#000' : '#e2e8f0'} strokeWidth={i === 0 ? 2 : 1} />
      );
    }
    
    for (let i = -10; i <= 10; i++) {
      const y = CENTER + i * SCALE;
      elements.push(
        <line key={`grid-h-${i}`} x1={0} y1={y} x2={GRID_SIZE} y2={y} stroke={i === 0 ? '#000' : '#e2e8f0'} strokeWidth={i === 0 ? 2 : 1} />
      );
    }
    
    for (let i = -10; i <= 10; i++) {
      if (i === 0) continue;
      const x = CENTER + i * SCALE;
      elements.push(
        <text key={`label-x-${i}`} x={x} y={CENTER + 15} fontSize="10" fontWeight="bold" fill="#000" textAnchor="middle">{i}</text>
      );
    }
    
    for (let i = -10; i <= 10; i++) {
      if (i === 0) continue;
      const y = CENTER - i * SCALE;
      elements.push(
        <text key={`label-y-${i}`} x={CENTER - 15} y={y + 4} fontSize="10" fontWeight="bold" fill="#000" textAnchor="middle">{i}</text>
      );
    }

    return elements;
  }, []);

  const renderVector = (v: Vector, color: string, label: string, dashed: boolean = false) => {
    const svgCoords = toSvgCoords(v);
    const arrowSize = 8;
    const angleRad = Math.atan2(-v.y, v.x);
    
    const arrowPoints = [
      `${svgCoords.x},${svgCoords.y}`,
      `${svgCoords.x - arrowSize * Math.cos(angleRad - 0.4)},${svgCoords.y - arrowSize * Math.sin(angleRad - 0.4)}`,
      `${svgCoords.x - arrowSize * Math.cos(angleRad + 0.4)},${svgCoords.y - arrowSize * Math.sin(angleRad + 0.4)}`,
    ].join(' ');

    return (
      <g key={label}>
        <line
          x1={CENTER}
          y1={CENTER}
          x2={svgCoords.x}
          y2={svgCoords.y}
          stroke={color}
          strokeWidth="4"
          strokeDasharray={dashed ? "8 4" : "none"}
        />
        <polygon points={arrowPoints} fill={color} />
        <text x={svgCoords.x + 10} y={svgCoords.y - 10} fontSize="12" fontWeight="black" fill={color}>{label}</text>
        <circle cx={svgCoords.x} cy={svgCoords.y} r="5" fill={color} stroke="#000" strokeWidth="2" />
      </g>
    );
  };

  const quizData = [
    {
      question: "1. Transformasi yang mengubah ukuran vektor tanpa mengubah arahnya adalah...",
      options: ["Translasi", "Rotasi", "Skala (Dilatasi)", "Refleksi"],
      answer: 2,
    },
    {
      question: "2. Matriks rotasi 90° berlawanan arah jarum jam adalah...",
      options: [
        "[[1, 0], [0, 1]]",
        "[[0, -1], [1, 0]]",
        "[[-1, 0], [0, -1]]",
        "[[0, 1], [-1, 0]]"
      ],
      answer: 1,
    },
    {
      question: "3. Refleksi terhadap garis y = x akan mengubah vektor (3, 2) menjadi...",
      options: ["(-3, -2)", "(3, -2)", "(-2, -3)", "(2, 3)"],
      answer: 3,
    },
    {
      question: "4. Translasi vektor (2, 3) dengan T = (1, -2) menghasilkan...",
      options: ["(1, 1)", "(3, 1)", "(3, 5)", "(1, 5)"],
      answer: 1,
    },
    {
      question: "5. Matriks skala dengan faktor sx = 2 dan sy = 0.5 adalah...",
      options: [
        "[[2, 0], [0, 0.5]]",
        "[[0.5, 0], [0, 2]]",
        "[[2, 0.5], [0, 1]]",
        "[[1, 0], [2, 0.5]]"
      ],
      answer: 0,
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

  const formatMatrix = (m: Matrix) => {
    return `[[${m.a.toFixed(2)}, ${m.b.toFixed(2)}], [${m.c.toFixed(2)}, ${m.d.toFixed(2)}]]`;
  };

  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-violet-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">MATEMATIKA LINEAR</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: TRANSFORMASI VEKTOR
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Eksplorasi Translasi, Skala, Rotasi, Refleksi & Shear pada Vektor 2D
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-5 w-full lg:w-1/3">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Panel Kontrol
          </span>

          <div className="mt-4 flex flex-col gap-4">
            <div className="bg-violet-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <label className="font-black uppercase text-xs">Jenis Transformasi:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'translate', 'scale', 'rotate', 'reflect', 'shear'] as TransformType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTransformType(t)}
                    className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 font-bold text-xs uppercase transition-all
                      ${transformType === t 
                        ? 'bg-violet-400 text-white translate-x-[4px] translate-y-[4px] shadow-none' 
                        : 'bg-white text-black'
                      }`}
                  >
                    {t === 'none' ? 'IDENTITY' : t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {transformType === 'translate' && (
              <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
                <label className="font-black uppercase text-xs text-blue-800">Parameter Translasi:</label>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">Tx (X)</span>
                    <span className="font-mono font-black text-xs bg-white px-2 border-2 border-black">{tx}</span>
                  </div>
                  <input type="range" min="-5" max="5" step="0.5" value={tx} onChange={(e) => setTx(Number(e.target.value))}
                    className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">Ty (Y)</span>
                    <span className="font-mono font-black text-xs bg-white px-2 border-2 border-black">{ty}</span>
                  </div>
                  <input type="range" min="-5" max="5" step="0.5" value={ty} onChange={(e) => setTy(Number(e.target.value))}
                    className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
                </div>
              </div>
            )}

            {transformType === 'scale' && (
              <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
                <label className="font-black uppercase text-xs text-emerald-800">Parameter Skala:</label>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">Sx (X)</span>
                    <span className="font-mono font-black text-xs bg-white px-2 border-2 border-black">{sx.toFixed(1)}</span>
                  </div>
                  <input type="range" min="0.1" max="3" step="0.1" value={sx} onChange={(e) => setSx(Number(e.target.value))}
                    className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">Sy (Y)</span>
                    <span className="font-mono font-black text-xs bg-white px-2 border-2 border-black">{sy.toFixed(1)}</span>
                  </div>
                  <input type="range" min="0.1" max="3" step="0.1" value={sy} onChange={(e) => setSy(Number(e.target.value))}
                    className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
                </div>
              </div>
            )}

            {transformType === 'rotate' && (
              <div className="bg-amber-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
                <label className="font-black uppercase text-xs text-amber-800">Parameter Rotasi:</label>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">Angle (°)</span>
                    <span className="font-mono font-black text-xs bg-white px-2 border-2 border-black">{angle}°</span>
                  </div>
                  <input type="range" min="-180" max="180" step="5" value={angle} onChange={(e) => setAngle(Number(e.target.value))}
                    className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
                </div>
                <div className="text-xs font-bold bg-white p-2 border-2 border-black">Rotasi berlawanan arah jarum jam (CCW)</div>
              </div>
            )}

            {transformType === 'reflect' && (
              <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
                <label className="font-black uppercase text-xs text-rose-800">Sumbu Refleksi:</label>
                <div className="flex gap-2">
                  {(['x', 'y', 'xy'] as const).map((axis) => (
                    <button
                      key={axis}
                      onClick={() => setReflectAxis(axis)}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 px-4 font-bold text-xs uppercase transition-all
                        ${reflectAxis === axis 
                          ? 'bg-rose-400 text-white translate-x-[4px] translate-y-[4px] shadow-none' 
                          : 'bg-white text-black'
                        }`}
                    >
                      {axis === 'xy' ? 'y=x' : `_${axis}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {transformType === 'shear' && (
              <div className="bg-cyan-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
                <label className="font-black uppercase text-xs text-cyan-800">Parameter Shear:</label>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">Kx (X shear)</span>
                    <span className="font-mono font-black text-xs bg-white px-2 border-2 border-black">{kx.toFixed(1)}</span>
                  </div>
                  <input type="range" min="-2" max="2" step="0.1" value={kx} onChange={(e) => setKx(Number(e.target.value))}
                    className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">Ky (Y shear)</span>
                    <span className="font-mono font-black text-xs bg-white px-2 border-2 border-black">{ky.toFixed(1)}</span>
                  </div>
                  <input type="range" min="-2" max="2" step="0.1" value={ky} onChange={(e) => setKy(Number(e.target.value))}
                    className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded" />
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
              <label className="font-black uppercase text-xs">Vektor Input:</label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-xs text-sky-600">V1 (x, y):</span>
                  <input type="number" step="0.5" value={vector1.x} onChange={(e) => setVector1({ ...vector1, x: Number(e.target.value) })}
                    className="w-16 p-1 border-2 border-black font-bold text-xs" />
                  <input type="number" step="0.5" value={vector1.y} onChange={(e) => setVector1({ ...vector1, y: Number(e.target.value) })}
                    className="w-16 p-1 border-2 border-black font-bold text-xs" />
                </div>
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-xs text-rose-600">V2 (x, y):</span>
                  <input type="number" step="0.5" value={vector2.x} onChange={(e) => setVector2({ ...vector2, x: Number(e.target.value) })}
                    className="w-16 p-1 border-2 border-black font-bold text-xs" />
                  <input type="number" step="0.5" value={vector2.y} onChange={(e) => setVector2({ ...vector2, y: Number(e.target.value) })}
                    className="w-16 p-1 border-2 border-black font-bold text-xs" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                  <input type="checkbox" checked={showSum} onChange={(e) => setShowSum(e.target.checked)} className="w-4 h-4 accent-violet-500" />
                  Tampilkan V1 + V2
                </label>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-2">
              <h4 className="font-black text-violet-400 text-xs mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">MATRIKS TRANSFORMASI</h4>
              
              <div className="bg-slate-800 p-3 border-2 border-violet-500 flex flex-col items-center">
                <span className="text-sm font-mono font-black text-violet-400">{formatMatrix(matrix)}</span>
                <span className="text-xs text-slate-400 mt-1">Determinant: <span className="text-yellow-400 font-bold">{determinant.toFixed(2)}</span></span>
              </div>

              <div className="mt-3 text-xs">
                <div className="flex justify-between items-center bg-slate-800 p-2 border-2 border-sky-500 mb-2">
                  <span className="text-sky-400 font-bold">V1 asal:</span>
                  <span className="font-mono">({vector1.x}, {vector1.y})</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800 p-2 border-2 border-sky-500 mb-2">
                  <span className="text-sky-400 font-bold">V1 hasil:</span>
                  <span className="font-mono text-white">({transformedV1.x.toFixed(2)}, {transformedV1.y.toFixed(2)})</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800 p-2 border-2 border-rose-500 mb-2">
                  <span className="text-rose-400 font-bold">V2 asal:</span>
                  <span className="font-mono">({vector2.x}, {vector2.y})</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800 p-2 border-2 border-rose-500">
                  <span className="text-rose-400 font-bold">V2 hasil:</span>
                  <span className="font-mono text-white">({transformedV2.x.toFixed(2)}, {transformedV2.y.toFixed(2)})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-4 relative flex flex-col w-full lg:w-2/3">
          <span className="absolute -top-4 left-6 bg-violet-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Canvas Vektor 2D
          </span>

          <div className="mt-4 w-full flex items-center justify-center">
            <svg viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`} className="w-full max-w-[500px] border-4 border-black bg-slate-50">
              {renderGrid()}
              
              {renderVector(vector1, '#38bdf8', 'V1', false)}
              {renderVector(vector2, '#f472b6', 'V2', false)}
              
              {showSum && renderVector(sumVector, '#a78bfa', 'V1+V2', false)}
              
              {transformType !== 'none' && (
                <>
                  {renderVector(transformedV1, '#0369a1', "V1'", true)}
                  {renderVector(transformedV2, '#be185d', "V2'", true)}
                  {showSum && renderVector(transformedSum, '#7c3aed', "(V1+V2)'", true)}
                </>
              )}
              
              <circle cx={CENTER} cy={CENTER} r="4" fill="#000" />
              <text x={CENTER + 10} y={CENTER - 5} fontSize="10" fontWeight="bold" fill="#000">(0,0)</text>
            </svg>
          </div>

          <div className="mt-4 bg-slate-100 p-3 border-4 border-black flex flex-wrap gap-2 justify-center">
            <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-black">
              <div className="w-4 h-4 bg-sky-400"></div>
              <span className="font-bold text-xs">V1 Asal</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-black">
              <div className="w-4 h-4 bg-rose-400"></div>
              <span className="font-bold text-xs">V2 Asal</span>
            </div>
            {showSum && (
              <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-black">
                <div className="w-4 h-4 bg-violet-400"></div>
                <span className="font-bold text-xs">V1+V2</span>
              </div>
            )}
            {transformType !== 'none' && (
              <>
                <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-black">
                  <div className="w-4 h-4 bg-sky-700" style={{ borderStyle: 'dashed' }}></div>
                  <span className="font-bold text-xs">V1' (hasil)</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-black">
                  <div className="w-4 h-4 bg-rose-700" style={{ borderStyle: 'dashed' }}></div>
                  <span className="font-bold text-xs">V2' (hasil)</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl bg-violet-50 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 mb-10 z-10 relative text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase">
          Panduan Transformasi Vektor
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Translasi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Memindahkan vektor ke posisi baru tanpa mengubah bentuk. Dinyatakan dengan penambahan vektor translasi T.
            </p>
            <div className="bg-blue-100 p-2 border-2 border-black text-xs font-mono font-bold">
              V' = V + T = (x+tx, y+ty)
            </div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Skala (Dilatasi)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Mengubah ukuran vektor dengan faktor sx dan sy. Determinant matriks = sx * sy.
            </p>
            <div className="bg-emerald-100 p-2 border-2 border-black text-xs font-mono font-bold">
              M = [[sx, 0], [0, sy]]
            </div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-amber-600 border-b-2 border-black pb-1 mb-2">Rotasi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Memutar vektor dengan sudut θ (berlawanan jarum jam). Determinant = 1.
            </p>
            <div className="bg-amber-100 p-2 border-2 border-black text-xs font-mono font-bold">
              M = [[cosθ, -sinθ], [sinθ, cosθ]]
            </div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Refleksi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Mencerminkan vektor terhadap sumbu x, y, atau garis y=x. Determinant = -1.
            </p>
            <div className="bg-rose-100 p-2 border-2 border-black text-xs font-mono font-bold">
              _x: [[1,0],[0,-1]] _y: [[-1,0],[0,1]]
            </div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-cyan-600 border-b-2 border-black pb-1 mb-2">Shear</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              "Miringkan" vektor dengan faktor kx atau ky. Determinant = 1.
            </p>
            <div className="bg-cyan-100 p-2 border-2 border-black text-xs font-mono font-bold">
              M = [[1, kx], [ky, 1]]
            </div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-violet-600 border-b-2 border-black pb-1 mb-2">Penjumlahan Vektor</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Vektor dapat ditambahkan secara komponen-per-komponen. Transformasi matriks bersifat linear.
            </p>
            <div className="bg-violet-100 p-2 border-2 border-black text-xs font-mono font-bold">
              V1+V2 = (x1+x2, y1+y2)
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl bg-slate-800 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 mb-10 z-10 relative">
        <button onClick={() => setShowQuiz(!showQuiz)}
          className="w-full bg-yellow-400 text-black px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-black uppercase text-lg hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all">
          {showQuiz ? 'TUTUP KUIS' : 'UJI PENGETAHUAN ANDA (KUIS)'}
        </button>

        {showQuiz && (
          <div className="mt-6 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] text-black">
            <div className="bg-black text-white p-3 mb-4 font-black uppercase text-center">
              EVALUASI KONSEP TRANSFORMASI VEKTOR
            </div>
            <div className="space-y-4">
              {quizData.map((q, qIdx) => (
                <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
                  <h4 className="font-bold mb-3 text-sm uppercase">{q.question}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <button key={oIdx} onClick={() => handleAnswer(qIdx, oIdx)} disabled={quizSubmitted}
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
                          }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!quizSubmitted && userAnswers.every(a => a !== null) && (
                <button onClick={handleSubmit}
                  className="w-full border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-black uppercase py-3 px-10 text-xl mt-4 bg-slate-900 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all">
                  KIRIM JAWABAN
                </button>
              )}

              {quizSubmitted && (
                <div className="mt-4 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                  <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR: {score}/5</h4>
                  <p className="text-black font-semibold text-lg mb-4 bg-white inline-block px-4 py-1 border-2 border-black">
                    {score === 5 ? "Sempurna! Master Transformasi Vektor!" : "Bagus! Pelajari lagi matriks transformasi."}
                  </p>
                  <button onClick={handleRetry}
                    className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-black uppercase py-3 px-8 text-lg bg-black text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all">
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