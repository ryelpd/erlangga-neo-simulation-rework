import { useState, useEffect, useRef, useCallback } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: '1. Komponen gaya berat manakah yang bertugas menarik balok meluncur ke bawah sepanjang bidang miring?',
    options: ['Gaya Normal (N)', 'W cos(θ)', 'W sin(θ)', 'Gaya Gesek (fs)'],
    answer: 2,
  },
  {
    question: '2. Apa yang terjadi pada Gaya Normal (N) jika sudut kemiringan (θ) bidang semakin diperbesar (semakin curam)?',
    options: ['Gaya Normal semakin KECIL', 'Gaya Normal semakin BESAR', 'Gaya Normal tetap konstan', 'Gaya Normal berubah menjadi nol seketika'],
    answer: 0,
  },
  {
    question: '3. Perhatikan simulasi! Jika balok dalam keadaan TERTAHAN DIAM di atas, berapakah besar Gaya Gesek (fs) yang bekerja saat itu?',
    options: ['Sama dengan W cos(θ)', 'Nol', 'Sama persis dengan tarikan W sin(θ)', 'Lebih besar dari W sin(θ)'],
    answer: 2,
  },
  {
    question: '4. Sebuah benda diletakkan di atas bidang miring yang sangat licin (μs = 0). Komponen apa yang satu-satunya menentukan percepatan turun benda?',
    options: ['Hanya Massa benda', 'Hanya Sudut Kemiringan bidang', 'Gaya Normal', 'Tidak ada, benda diam'],
    answer: 1,
  },
  {
    question: '5. Manakah kondisi matematis yang paling tepat untuk menyatakan balok berhasil lepas landas meluncur?',
    options: ['W sin(θ) < fs(max)', 'W cos(θ) > N', 'W sin(θ) = N', 'W sin(θ) > fs(max)'],
    answer: 3,
  },
];

const G = 9.8;
const BASE_Y = 450;
const RAMP_LENGTH = 550;
const PIVOT_X = 650;
const BLOCK_SIZE = 70;
const PIXELS_PER_METER = 60;

export default function BidangMiring() {
  const [angle, setAngle] = useState(30);
  const [mass, setMass] = useState(10);
  const [friction, setFriction] = useState(0.3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<'SIAP' | 'MELUNCUR' | 'TERTAHAN' | 'MENDARAT' | 'DIJEDA'>('SIAP');

  const blockPosRef = useRef(0);
  const blockVelRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const wedgePolyRef = useRef<SVGPolygonElement | null>(null);
  const wedgeTextureRef = useRef<SVGPolygonElement | null>(null);
  const blockGroupRef = useRef<SVGGElement | null>(null);
  const blockRectRef = useRef<SVGRectElement | null>(null);
  const blockMassTextRef = useRef<SVGTextElement | null>(null);
  const angleArcRef = useRef<SVGPathElement | null>(null);
  const angleLabelRef = useRef<SVGTextElement | null>(null);

  const vecWRef = useRef<SVGLineElement | null>(null);
  const vecWxRef = useRef<SVGLineElement | null>(null);
  const vecWyRef = useRef<SVGLineElement | null>(null);
  const vecNRef = useRef<SVGLineElement | null>(null);
  const vecFsRef = useRef<SVGLineElement | null>(null);
  const lblWRef = useRef<SVGTextElement | null>(null);
  const lblWxRef = useRef<SVGTextElement | null>(null);
  const lblWyRef = useRef<SVGTextElement | null>(null);
  const lblNRef = useRef<SVGTextElement | null>(null);
  const lblFsRef = useRef<SVGTextElement | null>(null);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const angleRad = (angle * Math.PI) / 180;
  const W = mass * G;
  const Wx = W * Math.sin(angleRad);
  const Wy = W * Math.cos(angleRad);
  const N = Wy;
  const fs_max = friction * N;

  const topX = PIVOT_X - RAMP_LENGTH * Math.cos(angleRad);
  const topY = BASE_Y - RAMP_LENGTH * Math.sin(angleRad);

  const resetSystem = useCallback(() => {
    setIsPlaying(false);
    blockPosRef.current = 0;
    blockVelRef.current = 0;
    setStatus('SIAP');
  }, []);

  const updateSimulation = useCallback(() => {
    const currentAngle = angle;
    const currentMass = mass;
    const currentFriction = friction;
    const currentAngleRad = (currentAngle * Math.PI) / 180;
    const currentMuK = currentFriction * 0.75;

    const currentW = currentMass * G;
    const currentWx = currentW * Math.sin(currentAngleRad);
    const currentWy = currentW * Math.cos(currentAngleRad);
    const currentN = currentWy;
    const currentFsMax = currentFriction * currentN;
    const currentFk = currentMuK * currentN;

    const currentTopX = PIVOT_X - RAMP_LENGTH * Math.cos(currentAngleRad);
    const currentTopY = BASE_Y - RAMP_LENGTH * Math.sin(currentAngleRad);

    if (wedgePolyRef.current) {
      wedgePolyRef.current.setAttribute('points', `${PIVOT_X},${BASE_Y} ${currentTopX},${currentTopY} ${currentTopX},${BASE_Y}`);
    }
    if (wedgeTextureRef.current) {
      wedgeTextureRef.current.setAttribute('points', `${PIVOT_X},${BASE_Y} ${currentTopX},${currentTopY} ${currentTopX},${BASE_Y}`);
      wedgeTextureRef.current.setAttribute('opacity', String(currentFriction));
    }

    if (currentAngle > 0) {
      if (angleArcRef.current) {
        const r = 80;
        const arcEndX = PIVOT_X - r * Math.cos(currentAngleRad);
        const arcEndY = BASE_Y - r * Math.sin(currentAngleRad);
        angleArcRef.current.setAttribute('d', `M ${PIVOT_X - r} ${BASE_Y} A ${r} ${r} 0 0 1 ${arcEndX} ${arcEndY}`);
        angleArcRef.current.style.opacity = '1';
      }
      if (angleLabelRef.current) {
        angleLabelRef.current.setAttribute('x', String(PIVOT_X - 105));
        angleLabelRef.current.setAttribute('y', String(BASE_Y - 15));
        angleLabelRef.current.style.opacity = '1';
      }
    } else {
      if (angleArcRef.current) angleArcRef.current.style.opacity = '0';
      if (angleLabelRef.current) angleLabelRef.current.style.opacity = '0';
    }

    const rampPosX = currentTopX + blockPosRef.current * Math.cos(currentAngleRad);
    const rampPosY = currentTopY + blockPosRef.current * Math.sin(currentAngleRad);

    const cx = rampPosX + (BLOCK_SIZE / 2) * Math.sin(currentAngleRad);
    const cy = rampPosY - (BLOCK_SIZE / 2) * Math.cos(currentAngleRad);

    if (blockGroupRef.current) {
      blockGroupRef.current.setAttribute('transform', `translate(${cx}, ${cy})`);
    }
    if (blockRectRef.current) {
      blockRectRef.current.setAttribute('transform', `rotate(${currentAngle})`);
    }
    if (blockMassTextRef.current) {
      blockMassTextRef.current.setAttribute('transform', `rotate(${currentAngle})`);
    }

    const vScale = 130 / currentW;

    if (vecWRef.current) {
      vecWRef.current.setAttribute('x1', String(cx));
      vecWRef.current.setAttribute('y1', String(cy));
      vecWRef.current.setAttribute('x2', String(cx));
      vecWRef.current.setAttribute('y2', String(cy + currentW * vScale));
    }
    if (lblWRef.current) {
      lblWRef.current.setAttribute('x', String(cx + 10));
      lblWRef.current.setAttribute('y', String(cy + currentW * vScale + 20));
    }

    if (vecWyRef.current) {
      vecWyRef.current.setAttribute('x1', String(cx));
      vecWyRef.current.setAttribute('y1', String(cy));
      vecWyRef.current.setAttribute('x2', String(cx + currentWy * vScale * Math.sin(currentAngleRad)));
      vecWyRef.current.setAttribute('y2', String(cy + currentWy * vScale * Math.cos(currentAngleRad)));
    }
    if (lblWyRef.current) {
      lblWyRef.current.setAttribute('x', String(cx + currentWy * vScale * Math.sin(currentAngleRad) + 10));
      lblWyRef.current.setAttribute('y', String(cy + currentWy * vScale * Math.cos(currentAngleRad) + 20));
    }

    if (vecWxRef.current) {
      vecWxRef.current.setAttribute('x1', String(cx));
      vecWxRef.current.setAttribute('y1', String(cy));
      vecWxRef.current.setAttribute('x2', String(cx + currentWx * vScale * Math.cos(currentAngleRad)));
      vecWxRef.current.setAttribute('y2', String(cy + currentWx * vScale * Math.sin(currentAngleRad)));
    }
    if (lblWxRef.current) {
      lblWxRef.current.setAttribute('x', String(cx + currentWx * vScale * Math.cos(currentAngleRad) + 10));
      lblWxRef.current.setAttribute('y', String(cy + currentWx * vScale * Math.sin(currentAngleRad) + 20));
    }

    if (vecNRef.current) {
      vecNRef.current.setAttribute('x1', String(cx));
      vecNRef.current.setAttribute('y1', String(cy));
      vecNRef.current.setAttribute('x2', String(cx - currentN * vScale * Math.sin(currentAngleRad)));
      vecNRef.current.setAttribute('y2', String(cy - currentN * vScale * Math.cos(currentAngleRad)));
    }
    if (lblNRef.current) {
      lblNRef.current.setAttribute('x', String(cx - currentN * vScale * Math.sin(currentAngleRad) - 25));
      lblNRef.current.setAttribute('y', String(cy - currentN * vScale * Math.cos(currentAngleRad) - 10));
    }

    let currentFrictionForce = 0;
    if (isPlaying && blockVelRef.current > 0) {
      currentFrictionForce = currentFk;
    } else {
      currentFrictionForce = Math.min(currentWx, currentFsMax);
    }

    if (currentFrictionForce > 0 && currentAngle > 0) {
      if (vecFsRef.current) {
        vecFsRef.current.style.display = 'block';
        const fsStartX = cx + (BLOCK_SIZE / 2) * Math.sin(currentAngleRad);
        const fsStartY = cy - (BLOCK_SIZE / 2) * Math.cos(currentAngleRad);
        vecFsRef.current.setAttribute('x1', String(fsStartX));
        vecFsRef.current.setAttribute('y1', String(fsStartY));
        vecFsRef.current.setAttribute('x2', String(fsStartX - currentFrictionForce * vScale * Math.cos(currentAngleRad)));
        vecFsRef.current.setAttribute('y2', String(fsStartY - currentFrictionForce * vScale * Math.sin(currentAngleRad)));
      }
      if (lblFsRef.current) {
        lblFsRef.current.style.display = 'block';
        const fsStartX = cx + (BLOCK_SIZE / 2) * Math.sin(currentAngleRad);
        const fsStartY = cy - (BLOCK_SIZE / 2) * Math.cos(currentAngleRad);
        lblFsRef.current.setAttribute('x', String(fsStartX - currentFrictionForce * vScale * Math.cos(currentAngleRad) - 20));
        lblFsRef.current.setAttribute('y', String(fsStartY - currentFrictionForce * vScale * Math.sin(currentAngleRad) - 15));
      }
    } else {
      if (vecFsRef.current) vecFsRef.current.style.display = 'none';
      if (lblFsRef.current) lblFsRef.current.style.display = 'none';
    }
  }, [angle, mass, friction, isPlaying]);

  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimestampRef.current) / 1000, 0.05);
      lastTimestampRef.current = timestamp;

      if (isPlaying && angle > 0) {
        const currentAngleRad = (angle * Math.PI) / 180;
        const currentW = mass * G;
        const currentWx = currentW * Math.sin(currentAngleRad);
        const currentWy = currentW * Math.cos(currentAngleRad);
        const currentFsMax = friction * currentWy;
        const currentFk = friction * 0.75 * currentWy;

        let netForce = 0;

        if (blockVelRef.current === 0) {
          if (currentWx > currentFsMax) {
            netForce = currentWx - currentFk;
          } else {
            setIsPlaying(false);
            setStatus('TERTAHAN');
          }
        } else {
          netForce = currentWx - currentFk;
        }

        if (netForce > 0 || blockVelRef.current > 0) {
          const acceleration = netForce / mass;
          blockVelRef.current += acceleration * dt;
          blockPosRef.current += blockVelRef.current * dt * PIXELS_PER_METER;

          const MAX_S = RAMP_LENGTH - BLOCK_SIZE;
          if (blockPosRef.current >= MAX_S) {
            blockPosRef.current = MAX_S;
            blockVelRef.current = 0;
            setIsPlaying(false);
            setStatus('MENDARAT');
          } else {
            setStatus('MELUNCUR');
          }
        }
      }

      updateSimulation();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, angle, mass, friction, updateSimulation]);

  useEffect(() => {
    resetSystem();
  }, [angle, mass, friction, resetSystem]);

  const togglePlay = () => {
    if (blockPosRef.current >= RAMP_LENGTH - BLOCK_SIZE) {
      blockPosRef.current = 0;
      blockVelRef.current = 0;
    }
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setStatus('MELUNCUR');
    } else {
      setStatus('DIJEDA');
    }
  };

  const selectAnswer = (qIndex: number, optIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIndex] = optIndex;
    setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
    let s = 0;
    userAnswers.forEach((ans, index) => {
      if (ans === quizData[index].answer) s++;
    });
    setScore(s);
    setQuizSubmitted(true);
  };

  const retryQuiz = () => {
    setUserAnswers(new Array(quizData.length).fill(null));
    setQuizSubmitted(false);
    setScore(0);
  };

  const getScoreMessage = () => {
    if (score === 5) return 'SEMPURNA! ANDA MENGUASAI KONSEP PENGURAIAN VEKTOR.';
    if (score >= 3) return 'CUKUP BAIK. COBA PERHATIKAN LAGI PANAH GAYA DI SIMULASI.';
    return 'YUK BACA MATERI DAN PERHATIKAN SIMULASI SEKALI LAGI.';
  };

  const getStatusColor = () => {
    switch (status) {
      case 'MELUNCUR': return 'bg-rose-500 text-white';
      case 'TERTAHAN': return 'bg-green-400';
      case 'MENDARAT': return 'bg-slate-400 text-white';
      case 'DIJEDA': return 'bg-slate-300';
      default: return 'bg-yellow-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8" style={{
      backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)',
      backgroundSize: '24px 24px',
    }}>
      <style>{`
        .neo-box {
          background-color: #ffffff;
          border: 4px solid #000000;
          box-shadow: 8px 8px 0px 0px #000000;
          border-radius: 12px;
        }
        .neo-btn {
          border: 4px solid #000000;
          box-shadow: 6px 6px 0px 0px #000000;
          border-radius: 8px;
          transition: all 0.1s ease-in-out;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
        }
        .neo-btn:active {
          transform: translate(6px, 6px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
        .neo-tag {
          border: 3px solid #000;
          box-shadow: 3px 3px 0px 0px #000;
        }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 28px;
          width: 28px;
          border: 4px solid #000000;
          border-radius: 0px;
          cursor: pointer;
          margin-top: -10px;
          box-shadow: 4px 4px 0px 0px #000000;
          transition: all 0.1s ease;
        }
        input[type=range]::-webkit-slider-thumb:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px 0px #000000;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 8px;
          cursor: pointer;
          background: #000000;
          border-radius: 4px;
        }
        .slider-yellow::-webkit-slider-thumb { background: #facc15; }
        .slider-blue::-webkit-slider-thumb { background: #60a5fa; }
        .slider-orange::-webkit-slider-thumb { background: #fb923c; }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8 neo-box bg-rose-300 p-6 relative">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 neo-tag font-bold text-sm transform -rotate-3">
            FISIKA KELAS X
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
            LAB VIRTUAL: BIDANG MIRING
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
            Mekanika Newton, Penguraian Vektor & Gesekan
          </p>
        </header>

        <div className="neo-box bg-white p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full bg-yellow-200 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
            <label className="flex justify-between text-sm font-bold text-black mb-4 uppercase">
              <span>Datar</span>
              <span>Sudut (θ)</span>
              <span>Curam</span>
            </label>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value))}
              className="slider-yellow"
            />
            <div className="text-center font-bold text-2xl mt-2">{angle}°</div>
          </div>

          <div className="flex-1 w-full bg-blue-200 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
            <label className="flex justify-between text-sm font-bold text-black mb-4 uppercase">
              <span>Ringan</span>
              <span>Massa (m)</span>
              <span>Berat</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={mass}
              onChange={(e) => setMass(parseInt(e.target.value))}
              className="slider-blue"
            />
            <div className="text-center font-bold text-2xl mt-2">{mass} kg</div>
          </div>

          <div className="flex-1 w-full bg-orange-200 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
            <label className="flex justify-between text-sm font-bold text-black mb-4 uppercase">
              <span>Licin</span>
              <span>Koef. Gesek (μs)</span>
              <span>Kasar</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={friction}
              onChange={(e) => setFriction(parseFloat(e.target.value))}
              className="slider-orange"
            />
            <div className="text-center font-bold text-2xl mt-2">{friction.toFixed(2)}</div>
          </div>
        </div>

        <div className="neo-box bg-slate-100 p-6 relative flex flex-col items-center mb-10 overflow-hidden">
          <div className="absolute top-6 left-6 z-30 flex flex-col gap-3 w-56">
            <button
              onClick={togglePlay}
              className={`neo-btn ${isPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-green-400 hover:bg-green-300'} text-black px-4 py-4 text-lg w-full flex items-center justify-center gap-2`}
            >
              <span className="text-2xl">{isPlaying ? '⏸' : '▶'}</span> {isPlaying ? 'JEDA (PAUSE)' : 'MULAI (PLAY)'}
            </button>
            <button
              onClick={resetSystem}
              className="neo-btn bg-white hover:bg-slate-200 text-black px-4 py-3 text-sm w-full flex items-center justify-center gap-2"
            >
              <span className="text-lg">🔄</span> KEMBALIKAN POSISI
            </button>

            <div className={`mt-2 px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] text-center transform -rotate-1 transition-colors ${getStatusColor()}`}>
              <h2 className="text-xl font-black uppercase tracking-widest">{status}</h2>
            </div>
          </div>

          <div className="absolute top-6 right-6 z-30 bg-white/95 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs font-bold uppercase w-64 backdrop-blur-sm">
            <h3 className="text-center font-black text-sm border-b-4 border-black pb-2 mb-1">MONITOR GAYA</h3>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 border-2 border-black"></div> Berat (W)</div>
              <span className="font-mono text-sm text-red-600">{W.toFixed(1)} N</span>
            </div>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 border-2 border-black"></div> W sin θ (Wx)</div>
              <span className="font-mono text-sm text-blue-600">{Wx.toFixed(1)} N</span>
            </div>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-cyan-400 border-2 border-black"></div> W cos θ (Wy)</div>
              <span className="font-mono text-sm text-cyan-600">{Wy.toFixed(1)} N</span>
            </div>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 border-2 border-black"></div> Normal (N)</div>
              <span className="font-mono text-sm text-green-600">{N.toFixed(1)} N</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 border-2 border-black"></div> Gesek Max (fs)</div>
              <span className="font-mono text-sm text-orange-600">{fs_max.toFixed(1)} N</span>
            </div>
          </div>

          <div className="relative w-full max-w-[800px] h-[550px] neo-box bg-white mt-40 md:mt-0 overflow-hidden border-8 border-black">
            <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <svg viewBox="0 0 800 550" className="w-full h-full relative z-20 overflow-visible">
              <defs>
                <marker id="arrowRed" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#ef4444" stroke="#000" strokeWidth="1"/>
                </marker>
                <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#3b82f6" stroke="#000" strokeWidth="1"/>
                </marker>
                <marker id="arrowCyan" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#22d3ee" stroke="#000" strokeWidth="1"/>
                </marker>
                <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#22c55e" stroke="#000" strokeWidth="1"/>
                </marker>
                <marker id="arrowOrange" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#f97316" stroke="#000" strokeWidth="1"/>
                </marker>
                <pattern id="roughTexture" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#000" opacity="0.4"/>
                  <circle cx="6" cy="6" r="1" fill="#000" opacity="0.3"/>
                </pattern>
              </defs>

              <line x1="0" y1="450" x2="800" y2="450" stroke="#000" strokeWidth="8" strokeLinecap="square"/>
              <rect x="0" y="450" width="800" height="100" fill="#f1f5f9" />

              <polygon ref={wedgePolyRef} points={`${PIVOT_X},${BASE_Y} ${topX},${topY} ${topX},${BASE_Y}`} fill="#e2e8f0" stroke="#000" strokeWidth="6" strokeLinejoin="round"/>
              <polygon ref={wedgeTextureRef} points={`${PIVOT_X},${BASE_Y} ${topX},${topY} ${topX},${BASE_Y}`} fill="url(#roughTexture)" opacity={friction} />

              <path ref={angleArcRef} d="" fill="none" stroke="#facc15" strokeWidth="6"/>
              <text ref={angleLabelRef} x="0" y="0" fontSize="22" fontWeight="900" fill="#000">θ</text>

              <g ref={blockGroupRef}>
                <rect ref={blockRectRef} x="-35" y="-35" width="70" height="70" fill="#a78bfa" stroke="#000" strokeWidth="6" rx="4"/>
                <text ref={blockMassTextRef} x="0" y="8" textAnchor="middle" fontSize="22" fontWeight="900" fill="#000">m</text>
              </g>

              <line ref={vecWRef} x1="0" y1="0" x2="0" y2="0" stroke="#ef4444" strokeWidth="6" markerEnd="url(#arrowRed)"/>
              <text ref={lblWRef} x="0" y="0" fontSize="18" fontWeight="900" fill="#ef4444">W</text>

              <line ref={vecWyRef} x1="0" y1="0" x2="0" y2="0" stroke="#22d3ee" strokeWidth="6" strokeDasharray="6 4" markerEnd="url(#arrowCyan)"/>
              <text ref={lblWyRef} x="0" y="0" fontSize="16" fontWeight="900" fill="#22d3ee">Wy</text>

              <line ref={vecWxRef} x1="0" y1="0" x2="0" y2="0" stroke="#3b82f6" strokeWidth="6" strokeDasharray="6 4" markerEnd="url(#arrowBlue)"/>
              <text ref={lblWxRef} x="0" y="0" fontSize="16" fontWeight="900" fill="#3b82f6">Wx</text>

              <line ref={vecNRef} x1="0" y1="0" x2="0" y2="0" stroke="#22c55e" strokeWidth="6" markerEnd="url(#arrowGreen)"/>
              <text ref={lblNRef} x="0" y="0" fontSize="16" fontWeight="900" fill="#22c55e">N</text>

              <line ref={vecFsRef} x1="0" y1="0" x2="0" y2="0" stroke="#f97316" strokeWidth="8" markerEnd="url(#arrowOrange)"/>
              <text ref={lblFsRef} x="0" y="0" fontSize="16" fontWeight="900" fill="#f97316">fs</text>
            </svg>
          </div>
        </div>

        <div className="bg-yellow-300 neo-box p-6 mb-10">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform -rotate-1">
            KONSEP FISIKA: ANALISIS GAYA
          </h3>
          <p className="text-black font-semibold text-md leading-relaxed mb-3 bg-white/60 p-3 border-2 border-black border-dashed">
            Gaya Berat (W = mg) selalu mengarah lurus ke pusat bumi (panah merah). Pada bidang miring, perhitungan menjadi jauh lebih mudah jika kita memutar sumbu koordinat searah kemiringan. Gaya berat dipecah menjadi komponen sumbu-X miring (<strong>Wx</strong>) dan sumbu-Y miring (<strong>Wy</strong>).
          </p>
          <p className="text-black font-semibold text-md leading-relaxed bg-white/60 p-3 border-2 border-black border-dashed">
            Benda hanya akan <strong>meluncur menuruni bidang</strong> apabila tarikan gravitasinya (Wx) berhasil menembus batas pertahanan <strong>Gaya Gesek Statis Maksimal (fs max)</strong>. Coba atur sudut menjadi sangat curam atau kurangi koefisien gesek untuk melihat balok meluncur!
          </p>
        </div>

        <div className="bg-blue-300 neo-box p-6 mb-10">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_#000]">
            PAPAN RUMUS MATEMATIS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="text-xl font-black text-blue-600 mb-4 border-b-4 border-black pb-2 uppercase">
                Penguraian Gaya Berat
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-blue-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">GAYA BERAT TOTAL</div>
                  <div className="text-2xl font-black text-black font-mono mt-2">W = m × g</div>
                  <p className="text-sm mt-1 font-semibold">g ≈ 9.8 m/s² (Percepatan Gravitasi)</p>
                </li>
                <li className="p-3 border-2 border-black bg-blue-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">KOMPONEN SEJAJAR & TEGAK LURUS</div>
                  <div className="text-xl font-black text-black font-mono mt-2">W<sub>x</sub> = W × sin(θ)</div>
                  <div className="text-xl font-black text-black font-mono mt-1">W<sub>y</sub> = W × cos(θ)</div>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="text-xl font-black text-orange-600 mb-4 border-b-4 border-black pb-2 uppercase">
                Hukum Newton & Gesekan
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-orange-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">GAYA NORMAL</div>
                  <div className="text-xl font-black text-black font-mono mt-2">N = W<sub>y</sub> = W × cos(θ)</div>
                  <p className="text-sm mt-1 font-semibold">Gaya sentuh dari permukaan agar benda tidak amblas.</p>
                </li>
                <li className="p-3 border-2 border-black bg-orange-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">SYARAT MELUNCUR</div>
                  <div className="text-xl font-black text-black font-mono mt-2">W<sub>x</sub> &gt; f<sub>s(max)</sub></div>
                  <p className="text-sm mt-1 font-semibold">Gaya Gesek Statis Maksimal: f<sub>s(max)</sub> = μ<sub>s</sub> × N</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-purple-300 neo-box p-6 mb-10">
          <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
            <h3 className="text-2xl font-black uppercase tracking-widest text-center">
              EVALUASI KONSEP [KUIS]
            </h3>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
            <div className="space-y-6">
              {quizData.map((q, qIndex) => (
                <div key={qIndex} className="bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                  <h4 className="font-bold text-black mb-4 text-lg bg-white inline-block px-2 border-2 border-black">
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                        disabled={quizSubmitted}
                        className={`neo-btn text-left px-4 py-3 ${
                          quizSubmitted
                            ? optIndex === q.answer
                              ? 'bg-green-400 text-black'
                              : userAnswers[qIndex] === optIndex
                                ? 'bg-rose-400 text-black line-through'
                                : 'bg-white opacity-50'
                            : userAnswers[qIndex] === optIndex
                              ? 'bg-black text-white'
                              : 'bg-white text-black hover:bg-yellow-200'
                        }`}
                        style={quizSubmitted ? { boxShadow: '2px 2px 0px 0px #000', transform: 'translate(2px, 2px)' } : {}}
                      >
                        {quizSubmitted && optIndex === q.answer && '[ BENAR ] '}
                        {quizSubmitted && userAnswers[qIndex] === optIndex && optIndex !== q.answer && '[ SALAH ] '}
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!quizSubmitted && userAnswers.every((a) => a !== null) && (
              <div className="text-center mt-8">
                <button
                  onClick={calculateScore}
                  className="neo-btn bg-indigo-400 text-black font-bold py-3 px-10 text-xl uppercase tracking-widest hover:bg-indigo-300"
                >
                  KIRIM JAWABAN!
                </button>
              </div>
            )}

            {quizSubmitted && (
              <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                <h4 className="text-3xl font-bold text-black mb-2 uppercase">
                  SKOR AKHIR: {score} / 5
                </h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {getScoreMessage()}
                </p>
                <br />
                <button
                  onClick={retryQuiz}
                  className="neo-btn bg-black text-white py-3 px-8 text-lg uppercase tracking-wider"
                >
                  ULANGI KUIS
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}