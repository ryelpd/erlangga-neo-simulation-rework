import { useState, useRef, useEffect } from 'react';

const quizData = [
  {
    question: '1. Darah kaya CO2 dari seluruh tubuh kembali ke jantung melalui...?',
    options: ['Aorta', 'Vena Cava', 'Arteri Pulmonalis', 'Vena Pulmonalis'],
    answer: 1,
  },
  {
    question: '2. Sirkulasi yang membawa darah dari jantung ke paru-paru adalah...?',
    options: ['Sistemik', 'Pulmonal', 'Koroner', 'Portal'],
    answer: 1,
  },
  {
    question: '3. Di bagian jantung mana terjadi pertukaran gas yang sebenarnya?',
    options: ['Di dalam jantung', 'Di paru-paru', 'Di aorta', 'Di vena cava'],
    answer: 1,
  },
  {
    question: '4. Pembuluh darah yang membawa darah BERSIH (kaya O2) dari paru-paru kembali ke jantung adalah...?',
    options: ['Arteri Pulmonalis', 'Vena Pulmonalis', 'Vena Cava', 'Aorta'],
    answer: 1,
  },
  {
    question: '5. Bilik jantung yang memompa darah ke seluruh tubuh adalah...?',
    options: ['Serambi Kanan', 'Bilik Kanan', 'Bilik Kiri', 'Serambi Kiri'],
    answer: 2,
  },
];

export default function SistemPeradaranDarah() {
  const [bpm, setBpm] = useState(75);
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'ALL' | 'PULMONAL' | 'SISTEMIK'>('ALL');
  const [pulseScale, setPulseScale] = useState(1);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const lastTimeRef = useRef(0);
  const reqRef = useRef<number>(0);
  const cellsRef = useRef<{segment: number; progress: number; element: SVGCircleElement}[]>([]);

  const cardiacOutput = (bpm * 70) / 1000;

  const getStatus = () => {
    if (bpm < 60) return { text: 'Bradikardia (Lambat)', color: 'text-blue-400' };
    if (bpm > 100) return { text: 'Takikardia (Cepat)', color: 'text-rose-500' };
    return { text: 'Normal', color: 'text-emerald-400' };
  };

  const status = getStatus();

  useEffect(() => {
    const svg = document.getElementById('bloodCirculation');
    if (!svg) return;

    const paths = [
      'path_rv_lungs', 'path_lungs_la', 'path_la_lv', 
      'path_lv_body', 'path_body_ra', 'path_ra_rv'
    ];
    
    const pathElements = paths.map(id => document.getElementById(id) as unknown as SVGPathElement);

    cellsRef.current = [];
    const group = document.getElementById('particlesGroup');
    if (group) group.innerHTML = '';

    for (let i = 0; i < 50; i++) {
      const segment = i % 6;
      const progress = Math.random();
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '6');
      circle.setAttribute('stroke', '#000');
      circle.setAttribute('stroke-width', '2');
      if (group) group.appendChild(circle);

      cellsRef.current.push({ segment, progress, element: circle });
    }

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        const pulseFreq = (bpm / 60) * Math.PI * 2;
        const scale = 1 + 0.05 * Math.sin((timestamp / 1000) * pulseFreq);
        setPulseScale(scale);

        const baseSpeed = (bpm / 60) * 80;

        cellsRef.current.forEach(cell => {
          const pathEl = pathElements[cell.segment];
          if (!pathEl) return;
          
          const len = pathEl.getTotalLength();
          const distanceToMove = baseSpeed * (dt / 1000);
          cell.progress += distanceToMove / len;

          if (cell.progress >= 1) {
            cell.progress -= 1;
            cell.segment = (cell.segment + 1) % 6;
          }

          const point = pathEl.getPointAtLength(cell.progress * len);
          
          let isVisible = true;
          if (viewMode === 'PULMONAL' && (cell.segment === 3 || cell.segment === 4)) isVisible = false;
          if (viewMode === 'SISTEMIK' && (cell.segment === 0 || cell.segment === 1)) isVisible = false;

          if (isVisible) {
            cell.element.setAttribute('cx', String(point.x));
            cell.element.setAttribute('cy', String(point.y));
            const colors = ['#3b82f6', '#ef4444', '#ef4444', '#ef4444', '#3b82f6', '#3b82f6'];
            cell.element.setAttribute('fill', colors[cell.segment]);
            cell.element.style.display = 'block';
          } else {
            cell.element.style.display = 'none';
          }
        });
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [bpm, isPlaying, viewMode]);

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
      <header className="text-center mb-8 max-w-6xl bg-rose-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">ANATOMI & FISIOLOGI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: SISTEM KARDIOVASKULAR</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Sirkulasi Pulmonal dan Sistemik
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f43f5e] text-md rotate-2 z-30 uppercase">
            Panel Kontrol
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Detak Jantung</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min="40"
                max="180"
                step="1"
                value={bpm}
                onChange={(e) => setBpm(parseFloat(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Fokus Sirkulasi</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { mode: 'ALL', label: 'Tampilkan Semua', icon: '🔄' },
                  { mode: 'PULMONAL', label: 'Sirkulasi Pulmonal', icon: '🫁' },
                  { mode: 'SISTEMIK', label: 'Sirkulasi Sistemik', icon: '🚶' },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setViewMode(item.mode as any)}
                    className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 px-3 text-xs text-left transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${
                      viewMode === item.mode 
                        ? 'ring-4 ring-black bg-yellow-300' 
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-all font-bold cursor-pointer uppercase py-3 text-sm w-full active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${
                isPlaying ? 'bg-yellow-400' : 'bg-emerald-400'
              } text-black`}
            >
              {isPlaying ? '⏸️ JEDA DETAK' : '▶️ LANJUTKAN DETAK'}
            </button>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-rose-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA FISIOLOGIS</h4>
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Curah Jantung</span>
                <span className="text-xl font-black text-sky-400">{cardiacOutput.toFixed(1)} L/m</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Status</span>
                <span className={`text-xs font-black uppercase ${status.color}`}>{status.text}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 p-0 relative flex w-full h-[600px] overflow-hidden border-8 border-black rounded-xl" style={{ backgroundColor: '#f8fafc', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">
              Peta Peradaran Darah
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 border border-black rounded-full"></div> Darah Kaya O2</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 border border-black rounded-full"></div> Darah Kaya CO2</div>
            </div>

            <svg id="bloodCirculation" viewBox="0 0 600 600" className="w-full h-full overflow-visible pt-8">
              <defs>
                <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#fecdd3" />
                </marker>
                <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#bfdbfe" />
                </marker>
              </defs>

              <g id="groupPulmonal" style={{ opacity: viewMode === 'SISTEMIK' ? 0.1 : 1 }} className="transition-opacity duration-300">
                <rect x="220" y="50" width="160" height="80" rx="40" fill="#fbcfe8" stroke="#000" strokeWidth="4" />
                <text x="300" y="95" textAnchor="middle" fontWeight="900" fontSize="16" fill="#be185d">PARU-PARU</text>
                
                <path id="path_rv_lungs" d="M 270 280 C 120 280, 120 90, 220 90" fill="none" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="round"/>
                <path d="M 270 280 C 120 280, 120 90, 220 90" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
                <text x="100" y="180" fontSize="10" fontWeight="bold" fill="#3b82f6" transform="rotate(-45 100 180)">Arteri Pulmonalis</text>

                <path id="path_lungs_la" d="M 380 90 C 480 90, 480 230, 330 230" fill="none" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="round"/>
                <path d="M 380 90 C 480 90, 480 230, 330 230" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
                <text x="410" y="150" fontSize="10" fontWeight="bold" fill="#ef4444" transform="rotate(45 410 150)">Vena Pulmonalis</text>
              </g>

              <g id="groupSistemik" style={{ opacity: viewMode === 'PULMONAL' ? 0.1 : 1 }} className="transition-opacity duration-300">
                <rect x="220" y="450" width="160" height="80" rx="20" fill="#fef08a" stroke="#000" strokeWidth="4" />
                <text x="300" y="495" textAnchor="middle" fontWeight="900" fontSize="16" fill="#854d0e">SELURUH TUBUH</text>

                <path id="path_lv_body" d="M 330 310 C 480 310, 480 490, 380 490" fill="none" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="round"/>
                <path d="M 330 310 C 480 310, 480 490, 380 490" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
                <text x="440" y="400" fontSize="10" fontWeight="bold" fill="#ef4444" transform="rotate(-45 440 400)">Aorta</text>

                <path id="path_body_ra" d="M 220 490 C 120 490, 120 230, 270 230" fill="none" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="round"/>
                <path d="M 220 490 C 120 490, 120 230, 270 230" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
                <text x="100" y="380" fontSize="10" fontWeight="bold" fill="#3b82f6" transform="rotate(45 100 380)">Vena Cava</text>
              </g>

              <g transform={`translate(300, 270) scale(${pulseScale})`}>
                <path d="M 0 -35 C -35 -75, -85 -55, -85 -10 C -85 30, -35 60, 0 80 Z" fill="#bfdbfe" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
                <path d="M 0 -35 C 35 -75, 85 -55, 85 -10 C 85 30, 35 60, 0 80 Z" fill="#fecdd3" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
                <line x1="0" y1="-35" x2="0" y2="80" stroke="#000" strokeWidth="6" strokeLinecap="round" />
                <line x1="-75" y1="10" x2="75" y2="10" stroke="#000" strokeWidth="5" strokeDasharray="10 6" strokeLinecap="round" />
                
                <text x="-40" y="-10" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1e3a8a">Serambi Kanan</text>
                <text x="-40" y="35" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1e3a8a">Bilik Kanan</text>
                <text x="40" y="-10" textAnchor="middle" fontSize="11" fontWeight="900" fill="#881337">Serambi Kiri</text>
                <text x="40" y="35" textAnchor="middle" fontSize="11" fontWeight="900" fill="#881337">Bilik Kiri</text>
              </g>

              <path id="path_ra_rv" d="M 270 230 L 270 280" fill="none" stroke="none" />
              <path id="path_la_lv" d="M 330 230 L 330 310" fill="none" stroke="none" />

              <g id="particlesGroup"></g>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-blue-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan: Lalu Lintas Darah 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Peredarann Sistemik</h4>
            <ol className="text-xs list-decimal pl-4 font-bold text-slate-700 space-y-1">
              <li>Darah kaya O2 dari <b>Bilik Kiri</b></li>
              <li>Lewati Aorta ke Seluruh Tubuh</li>
              <li>Di tubuh: O2 ditukar dengan CO2</li>
              <li>Darah kotor ke <b>Serambi Kanan</b> via Vena Cava</li>
            </ol>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Peredarann Pulmonal</h4>
            <ol className="text-xs list-decimal pl-4 font-bold text-slate-700 space-y-1">
              <li>Darah kotor dari <b>Bilik Kanan</b></li>
              <li>Lewati Arteri Pulmonalis ke Paru</li>
              <li>Di paru: CO2 dibuang, O2 diikat</li>
              <li>Darah bersih ke <b>Serambi Kiri</b> via Vena Pulmonalis</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <h4 className="font-black text-md uppercase text-yellow-300 mb-2">Pengecualian Anatomi!</h4>
          <p className="text-sm font-semibold leading-relaxed">
            <span className="text-rose-400">Arteri Pulmonalis</span> membawa darah KOTOR (kebalikan dari arteri normal). 
            <span className="text-blue-400">Vena Pulmonalis</span> membawa darah BERSIH (kebalikan dari vena normal). 
            Penamaan didasarkan pada arah aliran, bukan isi darah.
          </p>
        </div>
      </div>

      <div className="mb-12 bg-rose-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI PERADARAN DARAH [KUIS]</h3>
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
                {score === 5 ? 'Sempurna! Anda mengerti sistem peredaran darah!' : 'Bagus! Coba eksplorasi lagi sirkulasinya.'}
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
