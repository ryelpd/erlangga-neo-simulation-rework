import { useState, useRef, useEffect, useCallback } from 'react';

const MID_X = 300;
const WATER_COUNT = 150;

const quizData = [
  {
    question: '1. Apa yang dimaksud dengan membran semi-permeabel?',
    options: ['Membran yang tidak bisa dilalui apapun', 'Membran yang hanya dapat dilalui partikel besar', 'Membran yang dapat dilalui air tetapi tidak dapat dilalui zat terlarut tertentu', 'Membran yang membuat zat terlarut berpindah'],
    answer: 2,
  },
  {
    question: '2. Apa yang terjadi jika sel ditempatkan dalam larutan hipertonis?',
    options: ['Sel akan membengkak dan pecah', 'Air akan masuk ke dalam sel', 'Air akan keluar dari sel dan sel mengerut', 'Tidak ada perubahan'],
    answer: 2,
  },
  {
    question: '3. Larutan hipotonis adalah larutan yang...',
    options: ['Konsentrasi zat terlarutnya lebih tinggi', 'Konsentrasi zat terlarutnya lebih rendah', 'Konsentrasi zat terlarutnya sama', 'Tidak mengandung air'],
    answer: 1,
  },
  {
    question: '4. Dalam simulasi ini, mengapa zat terlarut tidak bisa melewati membran?',
    options: ['Karena membran terbuka', 'Karena zat terlarut terlalu besar untuk melewati pori-pori membran', 'Karena air lebih berat', 'Karena tekanan udara'],
    answer: 1,
  },
  {
    question: '5. Jika sisi A memiliki konsentrasi 80M dan sisi B 20M, ke mana arah aliran air bersih?',
    options: ['Dari A ke B', 'Dari B ke A', 'Tidak ada aliran (seimbang)', 'Air berhenti bergerak'],
    answer: 1,
  },
];

export default function Osmosis() {
  const [soluteA, setSoluteA] = useState(50);
  const [soluteB, setSoluteB] = useState(50);
  const [isRunning, setIsRunning] = useState(true);
  const [waterLevelA, setWaterLevelA] = useState(50);
  const [waterLevelB, setWaterLevelB] = useState(50);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const lastTimeRef = useRef(0);
  const particlesRef = useRef<{type: string; x: number; y: number; vx: number; vy: number; rot: number}[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const getPixelsFromPercentage = (perc: number) => 300 - ((perc / 100) * (300 - 70));

  const getTargetLevels = useCallback(() => {
    const diff = soluteB - soluteA;
    return {
      targetA: 50 - diff * 0.4,
      targetB: 50 + diff * 0.4,
    };
  }, [soluteA, soluteB]);

  const initParticles = useCallback(() => {
    const particles: {type: string; x: number; y: number; vx: number; vy: number; rot: number}[] = [];
    const topA = getPixelsFromPercentage(waterLevelA);
    const topB = getPixelsFromPercentage(waterLevelB);

    for (let i = 0; i < WATER_COUNT; i++) {
      const side = Math.random() > 0.5 ? 'A' : 'B';
      const x = side === 'A' ? 110 + Math.random() * 180 : 310 + Math.random() * 180;
      const top = side === 'A' ? topA : topB;
      const y = top + 10 + Math.random() * (280 - top);
      particles.push({
        type: 'water',
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        rot: 0,
      });
    }

    let countA = Math.floor(soluteA / 2);
    for (let i = 0; i < countA; i++) {
      particles.push({
        type: 'soluteA',
        x: 110 + Math.random() * 170,
        y: topA + 15 + Math.random() * (270 - topA),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        rot: Math.random() * 360,
      });
    }

    let countB = Math.floor(soluteB / 2);
    for (let i = 0; i < countB; i++) {
      particles.push({
        type: 'soluteB',
        x: 310 + Math.random() * 170,
        y: topB + 15 + Math.random() * (270 - topB),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        rot: Math.random() * 360,
      });
    }

    particlesRef.current = particles;
  }, [soluteA, soluteB, waterLevelA, waterLevelB]);

  useEffect(() => {
    initParticles();
  }, [soluteA, soluteB]);

  const drawFrame = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    lastTimeRef.current = timestamp;

    if (isRunning) {
      const { targetA, targetB } = getTargetLevels();
      setWaterLevelA((prev) => prev + (targetA - prev) * 0.02);
      setWaterLevelB((prev) => prev + (targetB - prev) * 0.02);
    }

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [isRunning, getTargetLevels]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawFrame]);

  const particles = particlesRef.current;
  const yA = getPixelsFromPercentage(waterLevelA);
  const yB = getPixelsFromPercentage(waterLevelB);

  const updateParticles = particles.map((p) => {
    let newP = { ...p };
    if (isRunning) {
      newP.x += newP.vx;
      newP.y += newP.vy;
      if (newP.type.startsWith('solute')) newP.rot += newP.vx * 3;
    } else {
      newP.x += (Math.random() - 0.5) * 1.0;
      newP.y += (Math.random() - 0.5) * 1.0;
    }

    let topY = 300;
    if (p.type === 'water') {
      const isRightSide = p.x > MID_X;
      topY = isRightSide ? getPixelsFromPercentage(waterLevelB) + 5 : getPixelsFromPercentage(waterLevelA) + 5;
      if (p.x <= 105) { newP.x = 105; newP.vx = Math.abs(newP.vx); }
      if (p.x >= 495) { newP.x = 495; newP.vx = -Math.abs(newP.vx); }
    } else if (p.type === 'soluteA') {
      topY = getPixelsFromPercentage(waterLevelA) + 8;
      if (p.x <= 108) { newP.x = 108; newP.vx = Math.abs(newP.vx); }
      if (p.x >= MID_X - 10) { newP.x = MID_X - 10; newP.vx = -Math.abs(newP.vx); }
    } else if (p.type === 'soluteB') {
      topY = getPixelsFromPercentage(waterLevelB) + 8;
      if (p.x >= 492) { newP.x = 492; newP.vx = -Math.abs(newP.vx); }
      if (p.x <= MID_X + 10) { newP.x = MID_X + 10; newP.vx = Math.abs(newP.vx); }
    }

    if (newP.y <= topY) { newP.y = topY; newP.vy = Math.abs(newP.vy); }
    if (newP.y >= 295) { newP.y = 295; newP.vy = -Math.abs(newP.vy); }

    return newP;
  });

  const getStatus = () => {
    if (soluteA > soluteB) return { a: 'HIPERTONIS', b: 'HIPOTONIS', flow: '← MENGALIR KE KIRI' };
    if (soluteA < soluteB) return { a: 'HIPOTONIS', b: 'HIPERTONIS', flow: 'MENGALIR KE KANAN →' };
    return { a: 'ISOTONIS', b: 'ISOTONIS', flow: 'DIAM (SEIMBANG)' };
  };

  const status = getStatus();

  const selectAnswer = (qIndex: number, optIndex: number) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[qIndex] = optIndex;
      return newAnswers;
    });
  };

  const calculateScore = () => {
    setQuizSubmitted(true);
    let s = 0;
    userAnswers.forEach((ans, index) => {
      if (ans === quizData[index].answer) s++;
    });
    setScore(s);
  };

  const retryQuiz = () => {
    setUserAnswers(new Array(quizData.length).fill(null));
    setQuizSubmitted(false);
    setScore(0);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">BIOLOGI SEL</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: DINAMIKA OSMOSIS</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Perpindahan Molekul Air Melalui Membran Semi-Permeabel
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#22c55e] text-md rotate-2 z-30 uppercase">
            Panel Variabel
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Zat Terlarut - KIRI (A)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{soluteA} M</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={soluteA}
                onChange={(e) => setSoluteA(parseFloat(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-purple-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-purple-800 uppercase text-[10px]">Zat Terlarut - KANAN (B)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-purple-600">{soluteB} M</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={soluteB}
                onChange={(e) => setSoluteB(parseFloat(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="flex gap-2 mt-2 border-t-4 border-black pt-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-all font-bold cursor-pointer uppercase py-3 text-sm flex-1 active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${
                  isRunning ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'
                } text-black`}
              >
                {isRunning ? '⏸️ JEDA REAKSI' : '▶️ MULAI REAKSI'}
              </button>
              <button
                onClick={() => { setSoluteA(50); setSoluteB(50); setWaterLevelA(50); setWaterLevelB(50); setIsRunning(true); }}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 hover:bg-slate-300 font-bold cursor-pointer uppercase py-3 px-4 text-sm text-black"
              >
                🔄 RESET
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-300 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">HASIL OBSERVASI</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Status Sisi Kiri (A)</span>
                <span className={`text-sm font-black uppercase bg-slate-900 px-2 py-1 border border-slate-700 ${status.a === 'HIPERTONIS' ? 'text-rose-400' : status.a === 'HIPOTONIS' ? 'text-sky-400' : 'text-emerald-400'}`}>
                  {status.a}
                </span>
              </div>
              <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Status Sisi Kanan (B)</span>
                <span className={`text-sm font-black uppercase bg-slate-900 px-2 py-1 border border-slate-700 ${status.b === 'HIPERTONIS' ? 'text-purple-400' : status.b === 'HIPOTONIS' ? 'text-sky-400' : 'text-emerald-400'}`}>
                  {status.b}
                </span>
              </div>
              <div className="bg-slate-800 p-3 border-2 border-slate-600 flex flex-col items-center justify-center gap-1 text-center mt-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">Arah Aliran Air Bersih</span>
                <span className={`text-md font-black uppercase tracking-widest ${isRunning ? (status.flow.includes('←') ? 'text-rose-400' : status.flow.includes('→') ? 'text-purple-400' : 'text-slate-400') : 'text-slate-500'}`}>
                  {isRunning ? status.flow : 'REAKSI DIHENTIKAN'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 p-0 relative flex flex-col items-center justify-center w-full min-h-[500px] overflow-hidden border-8 border-black rounded-xl" style={{ backgroundColor: '#f1f5f9', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-1 z-30 uppercase">
              Tabung U-Tube Mikroskopis
            </span>

            <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-2 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#38bdf8] border border-black rounded-full"></div> Molekul Air</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#f43f5e] border border-black rotate-45"></div> Zat Terlarut A</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#a855f7] border border-black rotate-45"></div> Zat Terlarut B</div>
            </div>

            <svg viewBox="0 0 600 400" className="w-full h-full overflow-visible max-h-[400px]">
              <rect x="100" y="50" width="400" height="250" fill="#ffffff" stroke="#000" strokeWidth="4" opacity="0.8" />
              <line x1="80" y1="70" x2="100" y2="70" stroke="#94a3b8" strokeWidth="2" strokeDasharray="2" />
              <text x="50" y="74" fill="#94a3b8" fontSize="10" fontWeight="bold">MAX</text>

              <rect x="100" y={yA} width="200" height={300 - yA} fill="#bae6fd" opacity="0.7" />
              <rect x="300" y={yB} width="200" height={300 - yB} fill="#bae6fd" opacity="0.7" />

              <line x1="300" y1="50" x2="300" y2="300" stroke="#1e293b" strokeWidth="6" strokeDasharray="10 8" />
              <rect x="296" y="46" width="8" height="258" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="4" opacity="0.5" />
              <text x="260" y="38" fill="#1e293b" fontSize="10" fontWeight="bold">MEMBRAN</text>

              {updateParticles.map((p, i) =>
                p.type === 'water' ? (
                  <circle key={`water-${i}`} cx={p.x} cy={p.y} r="3" fill="#0284c7" stroke="#000" strokeWidth="1" />
                ) : p.type === 'soluteA' ? (
                  <rect key={`soluteA-${i}`} x={p.x - 4} y={p.y - 4} width="8" height="8" fill="#f43f5e" stroke="#000" strokeWidth="1.5" transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
                ) : (
                  <rect key={`soluteB-${i}`} x={p.x - 4} y={p.y - 4} width="8" height="8" fill="#a855f7" stroke="#000" strokeWidth="1.5" transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
                )
              )}

              <rect x="100" y="50" width="400" height="250" fill="none" stroke="#000" strokeWidth="6" />
              <rect x="150" y="300" width="100" height="30" fill="#f43f5e" stroke="#000" strokeWidth="4" />
              <text x="175" y="320" fill="#fff" fontSize="14" fontWeight="bold">SISI A</text>
              <rect x="350" y="300" width="100" height="30" fill="#a855f7" stroke="#000" strokeWidth="4" />
              <text x="375" y="320" fill="#fff" fontSize="14" fontWeight="bold">SISI B</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan: Konsep Tonisitas 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">HIPERTONIS</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Larutan dengan konsentrasi zat terlarut <b>lebih tinggi</b>. Akan <b>menarik air</b> dari sisi lain.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">HIPOTONIS</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Larutan dengan konsentrasi zat terlarut <b>lebih rendah</b>. Akan <b>kehilangan air</b> ke sisi lain.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">ISOTONIS</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Kedua larutan memiliki konsentrasi <b>sama/seimbang</b>. Air tetap berpindah tetapi <b>seimbang</b>.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <h4 className="font-black text-md uppercase text-yellow-300 mb-2">Mengapa Zat Terlarut Tidak Pindah?</h4>
          <p className="text-sm font-semibold leading-relaxed">
            Membran <b>Semi-Permeabel</b> memiliki pori-pori mikroskopis. Partikel air (H₂O) kecil bisa menembus, tetapi partikel zat terlarut terlalu besar sehingga terperangkap di sisi asalnya.
          </p>
        </div>
      </div>

      <div className="mb-12 bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI OSMOSIS [KUIS]</h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIndex) => (
              <div key={qIndex} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
                <h4 className="font-bold mb-3 text-sm uppercase">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, optIndex) => (
                    <button
                      key={optIndex}
                      onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold text-left px-4 py-2 text-xs transition-all ${
                        quizSubmitted
                          ? optIndex === q.answer
                            ? 'bg-green-400 text-black'
                            : userAnswers[qIndex] === optIndex
                            ? 'bg-rose-400 text-black line-through'
                            : 'bg-white opacity-50'
                          : userAnswers[qIndex] === optIndex
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-yellow-200 text-black cursor-pointer'
                      }`}
                    >
                      {quizSubmitted && optIndex === q.answer && '[ BENAR ] '}
                      {quizSubmitted && userAnswers[qIndex] === optIndex && optIndex !== q.answer && '[ SALAH ] '}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!quizSubmitted && userAnswers.every((a) => a !== null) && (
              <div className="text-center mt-8">
                <button
                  onClick={calculateScore}
                  className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg bg-slate-900 text-white font-bold py-3 px-10 text-xl uppercase tracking-widest hover:bg-slate-800 active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
                >
                  KIRIM JAWABAN!
                </button>
              </div>
            )}
          </div>
          {quizSubmitted && (
            <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? 'Sempurna! Anda mengerti osmosis!' : 'Bagus! Coba eksplorasi lagi simulasi osmosisnya.'}
              </p>
              <br />
              <button
                onClick={retryQuiz}
                className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg bg-black text-white font-bold py-3 px-8 text-lg uppercase tracking-wider active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
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
