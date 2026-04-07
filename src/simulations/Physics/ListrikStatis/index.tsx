import { useState, useEffect, useRef, useCallback } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_DATA: QuizQuestion[] = [
  {
    question: "1. Saat Anda menggesekkan balon ke baju (sweater), apa yang sebenarnya berpindah dari baju ke balon?",
    options: ["Proton", "Neutron", "Elektron", "Atom keseluruhan"],
    answer: 2,
  },
  {
    question: "2. Setelah digesekkan, balon menjadi bermuatan negatif dan baju bermuatan positif. Mengapa balon kemudian tertarik kembali ke arah baju saat dilepaskan?",
    options: ["Karena gravitasi bumi", "Karena muatan yang berbeda jenis (+ dan -) akan saling tarik-menarik", "Karena adanya angin di laboratorium", "Karena magnet di dalam balon"],
    answer: 1,
  },
  {
    question: "3. Perhatikan dinding di sebelah kanan! Dinding bersifat netral. Namun saat balon negatif didekatkan, elektron (-) di dinding terlihat bergerak menjauh. Fenomena ini disebut...",
    options: ["Polarisasi", "Ionisasi", "Kondensasi", "Radiasi"],
    answer: 0,
  },
  {
    question: "4. Berdasarkan Hukum Coulomb, bagaimana pengaruh JARAK terhadap gaya elektrostatis (tarik-menarik) antara balon dan baju?",
    options: ["Semakin jauh, gaya tariknya semakin KECIL (melemah)", "Semakin jauh, gaya tariknya semakin BESAR (menguat)", "Jarak tidak memengaruhi gaya", "Gaya berubah menjadi gaya tolak"],
    answer: 0,
  },
  {
    question: "5. Jika Anda memiliki dua balon yang sama-sama sudah digesekkan ke baju (keduanya bermuatan negatif), apa yang terjadi jika kedua balon tersebut didekatkan?",
    options: ["Akan saling tarik-menarik", "Akan meledak", "Akan saling tolak-menolak karena muatannya sejenis", "Tidak terjadi apa-apa"],
    answer: 2,
  },
];

interface Charge {
  id: number;
  type: 1 | -1;
  host: 'sweater' | 'balloon' | 'wall';
  baseX: number;
  baseY: number;
  lx: number;
  ly: number;
}

const BALLOON_RADIUS = 60;
const SWEATER_BOUNDS = { x: 50, y: 100, w: 170, h: 200 };
const WALL_X = 650;

type ViewMode = 'ALL' | 'NET' | 'NONE';

export default function ListrikStatis() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [balloonX, setBalloonX] = useState(400);
  const [balloonY, setBalloonY] = useState(250);
  const [balloonVX, setBalloonVX] = useState(0);
  const [balloonVY, setBalloonVY] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('ALL');
  const [sparkEffects, setSparkEffects] = useState<{ id: number; x: number; y: number }[]>([]);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const isDraggingRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const chargeIdRef = useRef(0);

  const initCharges = useCallback(() => {
    const newCharges: Charge[] = [];
    chargeIdRef.current = 0;

    for (let i = 0; i < 30; i++) {
      const lx = 20 + Math.random() * 120;
      const ly = 20 + Math.random() * 260;
      newCharges.push({ id: chargeIdRef.current++, type: 1, host: 'sweater', baseX: lx, baseY: ly, lx, ly });
      newCharges.push({ id: chargeIdRef.current++, type: -1, host: 'sweater', baseX: lx, baseY: ly, lx, ly });
    }

    for (let i = 0; i < 35; i++) {
      const lx = 20 + Math.random() * 110;
      const ly = 20 + Math.random() * 460;
      newCharges.push({ id: chargeIdRef.current++, type: 1, host: 'wall', baseX: lx, baseY: ly, lx, ly });
      newCharges.push({ id: chargeIdRef.current++, type: -1, host: 'wall', baseX: lx, baseY: ly, lx, ly });
    }

    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (BALLOON_RADIUS - 10);
      const lx = r * Math.cos(angle);
      const ly = r * Math.sin(angle);
      newCharges.push({ id: chargeIdRef.current++, type: 1, host: 'balloon', baseX: lx, baseY: ly, lx, ly });
      newCharges.push({ id: chargeIdRef.current++, type: -1, host: 'balloon', baseX: lx, baseY: ly, lx, ly });
    }

    setCharges(newCharges);
    setBalloonX(400);
    setBalloonY(250);
    setBalloonVX(0);
    setBalloonVY(0);
  }, []);

  useEffect(() => {
    initCharges();
  }, [initCharges]);

  const getMouseCoords = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: balloonX, y: balloonY };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 500 / rect.height;
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [balloonX, balloonY]);

  const createSpark = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    const randX = x + (Math.random() * 40 - 20);
    const randY = y + (Math.random() * 40 - 20);
    setSparkEffects(prev => [...prev, { id, x: randX, y: randY }]);
    setTimeout(() => {
      setSparkEffects(prev => prev.filter(s => s.id !== id));
    }, 300);
  }, []);

  const checkRubbing = useCallback((bX: number, bY: number, currentCharges: Charge[]) => {
    const overSweaterX = bX > SWEATER_BOUNDS.x && bX < SWEATER_BOUNDS.x + SWEATER_BOUNDS.w;
    const overSweaterY = bY > SWEATER_BOUNDS.y && bY < SWEATER_BOUNDS.y + SWEATER_BOUNDS.h;

    if (overSweaterX && overSweaterY) {
      const sweaterElectrons = currentCharges.filter(c => c.host === 'sweater' && c.type === -1);

      if (sweaterElectrons.length > 0 && Math.random() < 0.2) {
        const electron = sweaterElectrons[0];
        const angle = Math.PI / 2 + Math.random() * Math.PI;
        const r = BALLOON_RADIUS * 0.8;

        const updatedCharges = currentCharges.map(c => {
          if (c.id === electron.id) {
            return {
              ...c,
              host: 'balloon' as const,
              lx: r * Math.cos(angle),
              ly: r * Math.sin(angle),
            };
          }
          return c;
        });

        createSpark(bX, bY);
        return updatedCharges;
      }
    }
    return currentCharges;
  }, [createSpark]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCharges(prevCharges => {
        let updated = [...prevCharges];

        const balloonNet = updated.filter(c => c.host === 'balloon').reduce((sum, c) => sum + c.type, 0);
        const distToWall = WALL_X - balloonX;

        updated = updated.map(c => {
          if (c.host === 'wall' && c.type === -1) {
            let force = 0;
            if (balloonNet < 0) {
              const rawForce = (Math.abs(balloonNet) * 50000) / (distToWall * distToWall + 100);
              force = Math.min(80, rawForce);
            }
            return { ...c, lx: c.baseX + force };
          }
          return c;
        });

        return updated;
      });

      if (!isDraggingRef.current) {
        const balloonNet = charges.filter(c => c.host === 'balloon').reduce((sum, c) => sum + c.type, 0);
        const sweaterNet = charges.filter(c => c.host === 'sweater').reduce((sum, c) => sum + c.type, 0);
        const distToWall = WALL_X - balloonX;

        let ax = 0;
        let ay = 0;

        if (balloonNet < 0 && sweaterNet > 0) {
          const dx = (SWEATER_BOUNDS.x + SWEATER_BOUNDS.w / 2) - balloonX;
          const dy = (SWEATER_BOUNDS.y + SWEATER_BOUNDS.h / 2) - balloonY;
          const distSq = dx * dx + dy * dy;

          if (distSq > 100) {
            const fMag = (Math.abs(balloonNet * sweaterNet) * 50) / distSq;
            const dist = Math.sqrt(distSq);
            ax += fMag * (dx / dist);
            ay += fMag * (dy / dist);
          }
        }

        if (balloonNet < 0 && distToWall < 150) {
          const fMag = (Math.abs(balloonNet) * 1000) / (distToWall * distToWall);
          ax += fMag;
        }

        setBalloonVX(prev => {
          const newV = (prev + ax) * 0.9;
          return Math.max(-20, Math.min(20, newV));
        });
        setBalloonVY(prev => {
          const newV = (prev + ay) * 0.9;
          return Math.max(-20, Math.min(20, newV));
        });

        setBalloonX(prev => {
          let newX = prev + balloonVX;
          if (newX > WALL_X - BALLOON_RADIUS) newX = WALL_X - BALLOON_RADIUS;
          if (newX < BALLOON_RADIUS) newX = BALLOON_RADIUS;
          return newX;
        });

        setBalloonY(prev => {
          let newY = prev + balloonVY;
          if (newY < BALLOON_RADIUS) newY = BALLOON_RADIUS;
          if (newY > 500 - BALLOON_RADIUS) newY = 500 - BALLOON_RADIUS;
          return newY;
        });
      }
    }, 16);

    return () => clearInterval(intervalId);
  }, [charges, balloonX, balloonY, balloonVX, balloonVY]);

  const handleMouseDown = () => {
    isDraggingRef.current = true;
    setBalloonVX(0);
    setBalloonVY(0);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();

    let pos = getMouseCoords(e);

    if (pos.x > WALL_X - BALLOON_RADIUS) pos.x = WALL_X - BALLOON_RADIUS;
    if (pos.x < BALLOON_RADIUS) pos.x = BALLOON_RADIUS;
    if (pos.y < BALLOON_RADIUS) pos.y = BALLOON_RADIUS;
    if (pos.y > 500 - BALLOON_RADIUS) pos.y = 500 - BALLOON_RADIUS;

    setBalloonX(pos.x);
    setBalloonY(pos.y);

    setCharges(prev => checkRubbing(pos.x, pos.y, prev));
  }, [getMouseCoords, checkRubbing]);

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const balloonNet = charges.filter(c => c.host === 'balloon').reduce((sum, c) => sum + c.type, 0);
  const sweaterNet = charges.filter(c => c.host === 'sweater').reduce((sum, c) => sum + c.type, 0);

  const handleAnswerClick = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    if (userAnswers.every((a) => a !== null)) {
      setQuizSubmitted(true);
    }
  };

  const handleRetryQuiz = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const score = userAnswers.reduce<number>((acc, a, i) => {
    if (a === QUIZ_DATA[i].answer) return acc + 1;
    return acc;
  }, 0);

  const allAnswered = userAnswers.every((a) => a !== null);

  const shouldShowCharge = (charge: Charge): boolean => {
    if (viewMode === 'ALL') return true;
    if (viewMode === 'NONE') return false;

    const hostCharges = charges.filter(c => c.host === charge.host);
    const pCount = hostCharges.filter(c => c.type === 1).length;
    const eCount = hostCharges.filter(c => c.type === -1).length;
    const net = pCount - eCount;

    if (net > 0 && charge.type === 1) {
      const positives = hostCharges.filter(c => c.type === 1);
      const idx = positives.findIndex(c => c.id === charge.id);
      return idx < net;
    }
    if (net < 0 && charge.type === -1) {
      const negatives = hostCharges.filter(c => c.type === -1);
      const idx = negatives.findIndex(c => c.id === charge.id);
      return idx < Math.abs(net);
    }
    return false;
  };

  const stringWobbleX = -balloonVX * 4;

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform -rotate-3 text-black">
          FISIKA ELEKTROMAGNETIK
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: LISTRIK STATIS
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Efek Triboelektrik, Interaksi Muatan, dan Polarisasi
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Panel Interaksi
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 rounded-xl">
              <span className="font-black text-blue-800 uppercase text-[10px] border-b-2 border-black pb-1">TAMPILAN MUATAN</span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setViewMode('ALL')}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 text-xs font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${viewMode === 'ALL' ? 'bg-emerald-400 text-black ring-4 ring-black' : 'bg-slate-100 text-slate-500'}`}
                >
                  Tampilkan Semua Muatan (+/-)
                </button>
                <button
                  onClick={() => setViewMode('NET')}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 text-xs font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${viewMode === 'NET' ? 'bg-emerald-400 text-black ring-4 ring-black' : 'bg-slate-100 text-slate-500'}`}
                >
                  Hanya Tampilkan Selisih (Netto)
                </button>
                <button
                  onClick={() => setViewMode('NONE')}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 text-xs font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${viewMode === 'NONE' ? 'bg-emerald-400 text-black ring-4 ring-black' : 'bg-slate-100 text-slate-500'}`}
                >
                  Sembunyikan Semua Muatan
                </button>
              </div>
            </div>

            <button
              onClick={initCharges}
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-rose-400 hover:bg-rose-300 py-3 text-sm mt-2 flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              RESET SIMULASI
            </button>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-xl">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">ANALISIS MUATAN NETTO</h4>
            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Muatan Balon:</span>
                <span className="text-sky-400 font-bold">{balloonNet > 0 ? `+${balloonNet}` : balloonNet}</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Muatan Baju (Sweater):</span>
                <span className="text-rose-400 font-bold">{sweaterNet > 0 ? `+${sweaterNet}` : sweaterNet}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Status Balon:</span>
                <span className={`font-bold ${balloonNet < 0 ? 'text-sky-400' : 'text-yellow-400'}`}>
                  {balloonNet < 0 ? 'Bermuatan Negatif' : 'Netral'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Ruang Uji Coba
          </span>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000] text-center z-20 w-max max-w-[90%]">
            Gesekkan balon kuning ke baju untuk mentransfer elektron, lalu dekatkan ke dinding!
          </div>

          <div className="w-full h-full relative z-10 flex items-center justify-center">
            <svg
              ref={svgRef}
              viewBox="0 0 800 500"
              className="w-full h-full overflow-visible select-none"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              <defs>
                <pattern id="brick" width="40" height="20" patternUnits="userSpaceOnUse">
                  <rect width="40" height="20" fill="#cbd5e1" />
                  <rect width="38" height="18" fill="#94a3b8" />
                  <path d="M 20 0 L 20 10" stroke="#cbd5e1" strokeWidth="2" />
                  <path d="M 0 10 L 0 20" stroke="#cbd5e1" strokeWidth="2" />
                </pattern>
              </defs>

              <g transform="translate(650, 0)">
                <rect x="0" y="0" width="150" height="500" fill="url(#brick)" stroke="#000" strokeWidth="6" />
                {charges.filter(c => c.host === 'wall' && shouldShowCharge(c)).map(charge => (
                  <g key={charge.id} transform={`translate(${charge.lx}, ${charge.ly})`} className="transition-transform duration-200">
                    <circle r="8" fill={charge.type === 1 ? '#ef4444' : '#3b82f6'} stroke="#000" strokeWidth="2" />
                    <text y="4" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff">{charge.type === 1 ? '+' : '-'}</text>
                  </g>
                ))}
              </g>

              <g transform="translate(50, 100)">
                <path d="M 100 20 C 130 20, 140 40, 150 50 L 220 90 L 200 130 L 160 100 L 150 280 L 50 280 L 40 100 L 0 130 L -20 90 L 50 50 C 60 40, 70 20, 100 20 Z" fill="#6366f1" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
                <path d="M 80 20 Q 100 40 120 20" fill="none" stroke="#000" strokeWidth="4" />
                <line x1="-20" y1="90" x2="0" y2="130" stroke="#000" strokeWidth="4" />
                <line x1="220" y1="90" x2="200" y2="130" stroke="#000" strokeWidth="4" />
                <path d="M 60 50 L 140 50 M 60 100 L 140 100 M 60 150 L 140 150 M 60 200 L 140 200 M 60 250 L 140 250" stroke="#000" strokeWidth="3" opacity="0.2" strokeDasharray="10 5" />
                {charges.filter(c => c.host === 'sweater' && shouldShowCharge(c)).map(charge => (
                  <g key={charge.id} transform={`translate(${charge.lx}, ${charge.ly})`} className="transition-transform duration-200">
                    <circle r="8" fill={charge.type === 1 ? '#ef4444' : '#3b82f6'} stroke="#000" strokeWidth="2" />
                    <text y="4" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff">{charge.type === 1 ? '+' : '-'}</text>
                  </g>
                ))}
              </g>

              <g
                className="cursor-grab active:cursor-grabbing"
                transform={`translate(${balloonX}, ${balloonY})`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
              >
                <path d={`M 0 65 Q ${stringWobbleX} 100 ${stringWobbleX * 1.5} 150`} fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                <path d="M 0 65 C -60 65, -60 -65, 0 -65 C 60 -65, 60 65, 0 65 Z" fill="#facc15" stroke="#000" strokeWidth="5" />
                <path d="M -5 65 L 5 65 L 8 75 L -8 75 Z" fill="#facc15" stroke="#000" strokeWidth="3" />
                <path d="M -30 -20 A 30 30 0 0 1 -10 -45" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
                {charges.filter(c => c.host === 'balloon' && shouldShowCharge(c)).map(charge => (
                  <g key={charge.id} transform={`translate(${charge.lx}, ${charge.ly})`} className="transition-transform duration-200">
                    <circle r="8" fill={charge.type === 1 ? '#ef4444' : '#3b82f6'} stroke="#000" strokeWidth="2" />
                    <text y="4" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff">{charge.type === 1 ? '+' : '-'}</text>
                  </g>
                ))}
              </g>

              {sparkEffects.map(spark => (
                <path
                  key={spark.id}
                  d="M 0 -15 L 5 -2 L 15 0 L 5 2 L 0 15 L -5 2 L -15 0 L -5 -2 Z"
                  fill="#facc15"
                  stroke="#000"
                  strokeWidth="2"
                  className="animate-ping"
                  transform={`translate(${spark.x}, ${spark.y})`}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-emerald-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          BAGAIMANA LISTRIK STATIS BEKERJA?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">1. Efek Triboelektrik</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Semua benda terbuat dari atom yang memiliki <b>Proton (+)</b> yang diam di tempat, dan <b>Elektron (-)</b> yang bisa berpindah. Saat balon karet digesekkan ke baju wol, elektron dari baju akan "terlepas" dan berpindah menempel ke balon.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">2. Gaya Tarik Menarik</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Setelah digesek, balon memiliki kelebihan elektron (bermuatan Negatif), sedangkan baju kehilangan elektron (bermuatan Positif). Karena muatannya <b>berbeda jenis (+ dan -)</b>, balon dan baju akan saling tarik-menarik.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-yellow-600 border-b-2 border-black pb-1 mb-2">3. Polarisasi (Menempel di Dinding)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Dinding bermuatan netral. Namun, saat balon negatif didekatkan, elektron (-) di dalam dinding akan <b>tertolak menjauh</b>. Ini menyisakan permukaan dinding yang positif (+). Akibatnya, balon negatif akan tertarik dan menempel pada dinding!
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">HUKUM COULOMB</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-2xl md:text-3xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e] rounded-xl">
              F = k x (|q1 x q2| / r2)
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600 rounded-xl">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">KETERANGAN BESARAN</h4>
            <ul className="text-[11px] font-bold space-y-2 text-white">
              <li><span className="text-yellow-400">F</span> = Gaya Elektrostatis (Tarik/Tolak) dalam Newton</li>
              <li><span className="text-blue-400">k</span> = Konstanta Coulomb (9 x 10^9 N.m2/C2)</li>
              <li><span className="text-emerald-400">q1, q2</span> = Besaran muatan objek 1 dan 2 (Coulomb)</li>
              <li><span className="text-rose-400">r</span> = Jarak antara kedua muatan (meter)</li>
              <li className="text-slate-400 italic mt-2">*Gaya mengecil secara kuadrat seiring bertambahnya jarak.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-fuchsia-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6 rounded-lg">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] rounded-xl">
          <div className="space-y-6">
            {QUIZ_DATA.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl">
                <h4 className="font-bold text-black mb-4 text-sm uppercase">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswerClick(qIdx, oIdx)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg text-left px-4 py-2 bg-white text-xs font-bold uppercase transition-all ${
                        quizSubmitted
                          ? oIdx === q.answer
                            ? 'bg-green-400 text-black'
                            : userAnswers[qIdx] === oIdx
                            ? 'bg-rose-400 text-black line-through'
                            : 'bg-slate-200 opacity-50'
                          : userAnswers[qIdx] === oIdx
                            ? 'bg-black text-white'
                            : 'bg-white hover:bg-fuchsia-200'
                      } ${!quizSubmitted ? 'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted && allAnswered && (
            <button
              onClick={handleSubmitQuiz}
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-900 text-white font-black py-3 px-10 text-xl w-full mt-4 uppercase tracking-widest hover:bg-slate-800 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              KIRIM JAWABAN!
            </button>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-xl ${score === 5 ? 'bg-emerald-400' : 'bg-yellow-300'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black rounded-lg">
                {score === 5 ? 'Sempurna! Kamu memahami konsep listrik statis dengan sangat baik.' : 'Bagus! Coba bereksperimen lagi dengan balonnya.'}
              </p>
              <br />
              <button
                onClick={handleRetryQuiz}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-black text-white py-3 px-8 text-lg uppercase tracking-wider hover:bg-slate-800 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                ULANGI KUIS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}