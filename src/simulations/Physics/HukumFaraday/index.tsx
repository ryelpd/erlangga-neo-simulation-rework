import { useState, useEffect, useRef, useCallback } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_DATA: QuizQuestion[] = [
  {
    question: "1. Berdasarkan Hukum Faraday, apa syarat UTAMA agar arus listrik dapat mengalir pada kumparan?",
    options: ["Terdapat magnet berukuran besar di dekat kumparan", "Kumparan terhubung ke baterai DC", "Terjadi PERUBAHAN fluks magnetik (magnet bergerak mendekat/menjauh)", "Menggunakan kawat tembaga murni"],
    answer: 2,
  },
  {
    question: "2. Coba letakkan magnet DIAM di tengah-tengah kumparan. Apa yang terjadi pada jarum Galvanometer?",
    options: ["Jarum menunjuk angka maksimum karena magnet di tengah", "Jarum menunjuk angka 0 (Nol) karena tidak ada pergerakan/perubahan fluks", "Jarum bergerak bolak-balik", "Lampu menyala sangat terang"],
    answer: 1,
  },
  {
    question: "3. Apa pengaruh penambahan 'Jumlah Lilitan Kumparan (N)' pada slider terhadap hasil simulasi?",
    options: ["Mengurangi GGL Induksi yang dihasilkan", "Lampu menjadi redup", "Meningkatkan GGL Induksi (tegangan) yang dihasilkan saat digerakkan", "Magnet menjadi lebih berat"],
    answer: 2,
  },
  {
    question: "4. Saat kutub Utara (U) digerakkan MENDEKATI kumparan, jarum galvanometer menyimpang ke kanan. Sesuai Hukum Lenz, jika kutub Utara (U) ditarik MENJAUHI kumparan, maka jarum akan...",
    options: ["Tetap menyimpang ke kanan", "Menyimpang ke arah berlawanan (kiri)", "Diam saja", "Berputar 360 derajat"],
    answer: 1,
  },
  {
    question: "5. Di dunia nyata, prinsip Hukum Faraday ini digunakan sebagai dasar kerja alat apa?",
    options: ["Baterai dan Aki", "Lampu Pijar biasa", "Generator (Pembangkit Listrik) dan Dinamo", "Kompor Listrik"],
    answer: 2,
  },
];

const MAG_STRENGTH_LABELS: Record<number, string> = {
  1: "Lemah",
  2: "Sedang",
  3: "Kuat",
};

const COIL_CENTER_X = 400;

export default function HukumFaraday() {
  const [nCoils, setNCoils] = useState(4);
  const [magStrength, setMagStrength] = useState(2);
  const [isReversed, setIsReversed] = useState(false);
  const [magX, setMagX] = useState(600);
  const [lastMagX, setLastMagX] = useState(600);
  const [dPhiDt, setDPhiDt] = useState(0);
  const [emf, setEmf] = useState(0);
  const [currentDir, setCurrentDir] = useState("");
  const [needleAngle, setNeedleAngle] = useState(0);
  const [brightness, setBrightness] = useState(0);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const isDraggingRef = useRef(false);
  const lastTimeRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const calculateFlux = useCallback((x: number): number => {
    const sigma = 80;
    const B = magStrength * 10;
    const sign = isReversed ? -1 : 1;
    return sign * B * Math.exp(-Math.pow(x - COIL_CENTER_X, 2) / (2 * sigma * sigma));
  }, [magStrength, isReversed]);

  useEffect(() => {
    const physicsLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      let dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (dt === 0) dt = 0.016;
      if (dt > 0.1) dt = 0.1;

      const currentFlux = calculateFlux(magX);
      const lastFlux = calculateFlux(lastMagX);

      const fluxRate = (currentFlux - lastFlux) / dt;
      setLastMagX(magX);

      const scalingFactor = 0.05;
      let calculatedEmf = -nCoils * fluxRate * scalingFactor;

      if (Math.abs(calculatedEmf) < 0.1) {
        calculatedEmf = 0;
        setDPhiDt(0);
      } else {
        setDPhiDt(fluxRate);
      }

      setEmf(calculatedEmf);

      if (calculatedEmf > 0.1) {
        setCurrentDir("Searah Jarum Jam");
      } else if (calculatedEmf < -0.1) {
        setCurrentDir("Berlawanan Arah");
      } else {
        setCurrentDir("-");
      }

      let angle = calculatedEmf * 6;
      if (angle > 60) angle = 60;
      if (angle < -60) angle = -60;
      setNeedleAngle(angle);

      let bright = Math.abs(calculatedEmf) / 10;
      if (bright > 1) bright = 1;
      setBrightness(bright);
    };

    const intervalId = setInterval(() => {
      physicsLoop(performance.now());
    }, 16);

    return () => clearInterval(intervalId);
  }, [magX, lastMagX, nCoils, magStrength, isReversed, calculateFlux]);

  const getMouseX = useCallback((e: React.MouseEvent | React.TouchEvent): number => {
    if (!svgRef.current) return magX;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    let clientX = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else if ('clientX' in e) {
      clientX = e.clientX;
    }
    return (clientX - rect.left) * scaleX;
  }, [magX]);

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    let newX = getMouseX(e);
    if (newX < 100) newX = 100;
    if (newX > 700) newX = 700;
    setMagX(newX);
  }, [getMouseX]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    let newX = getMouseX(e);
    if (newX < 100) newX = 100;
    if (newX > 700) newX = 700;
    setMagX(newX);
  }, [getMouseX]);

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleFlip = () => {
    setIsReversed(prev => !prev);
  };

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

  const coilElements = [];
  const startX = 300;
  const endX = 500;
  const step = (endX - startX) / nCoils;

  for (let i = 0; i < nCoils; i++) {
    const cx = startX + i * step + step / 2;
    coilElements.push(
      <ellipse
        key={`coil-${i}`}
        cx={cx}
        cy={300}
        rx={step / 2}
        ry={60}
        fill="none"
        stroke="#d97706"
        strokeWidth="8"
      />
    );
    coilElements.push(
      <ellipse
        key={`coil-inner-${i}`}
        cx={cx}
        cy={300}
        rx={step / 2}
        ry={60}
        fill="none"
        stroke="#fcd34d"
        strokeWidth="2"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-emerald-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform -rotate-3 text-black">
          FISIKA ELEKTROMAGNETIK
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: INDUKSI FARADAY
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menghasilkan Listrik dari Medan Magnet yang Bergerak
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Parameter Alat
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-blue-800 uppercase text-[10px]">Jumlah Lilitan Kumparan (N)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{nCoils}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={nCoils}
                onChange={(e) => setNCoils(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Semakin banyak = Semakin sensitif</span>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-rose-800 uppercase text-[10px]">Kekuatan Magnet (B)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{MAG_STRENGTH_LABELS[magStrength]}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={magStrength}
                onChange={(e) => setMagStrength(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <button
              onClick={handleFlip}
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 hover:bg-slate-300 py-3 text-sm mt-2 flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              BALIK KUTUB MAGNET
            </button>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-xl">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">SENSOR GGL INDUKSI</h4>
            <div className="grid grid-cols-1 gap-2 text-[10px] md:text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                <span className="whitespace-nowrap">Laju Fluks (dPhi/dt):</span>
                <span className="text-sky-400 font-bold text-right w-24 shrink-0">{dPhiDt.toFixed(1)} Wb/s</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                <span className="whitespace-nowrap">GGL Induksi (E):</span>
                <span className="text-emerald-400 font-black text-base text-right w-24 shrink-0">{emf.toFixed(2)} V</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="whitespace-nowrap">Arah Arus Listrik:</span>
                <span className={`font-bold text-right w-32 shrink-0 ${currentDir === "Searah Jarum Jam" ? "text-sky-400" : currentDir === "Berlawanan Arah" ? "text-rose-400" : "text-slate-500"}`}>
                  {currentDir}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Meja Eksperimen
          </span>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000] text-center z-20">
            Tarik & Geser Magnet Keluar-Masuk Kumparan secara Berulang!
          </div>

          <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
            <svg
              ref={svgRef}
              viewBox="0 0 800 500"
              className="w-full h-full overflow-visible"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
                <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="1" />
                  <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="800" height="500" fill="url(#grid)" />

              <path d="M 400 130 L 400 60 L 550 60 L 550 200 L 520 200" fill="none" stroke="#334155" strokeWidth="6" />
              <path d="M 400 130 L 400 160 L 520 160 L 520 200 L 280 200 L 280 160 L 400 160" fill="none" stroke="#334155" strokeWidth="6" />
              <path d="M 280 200 L 280 160 L 150 160 L 150 200" fill="none" stroke="#334155" strokeWidth="6" />
              <path d="M 550 60 L 150 60 L 150 200" fill="none" stroke="#334155" strokeWidth="6" />

              <g transform="translate(550, 100)">
                <circle cx="0" cy="-20" r="60" fill="url(#bulbGlow)" opacity={brightness.toFixed(2)} />
                <path d="M -20 -20 C -20 -50, 20 -50, 20 -20 C 20 0, 15 10, 15 20 L -15 20 C -15 10, -20 0, -20 -20 Z" fill="#ffffff" stroke="#000" strokeWidth="4" />
                <path d="M -10 20 L -5 0 L 0 -10 L 5 0 L 10 20" fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
                <rect x="-15" y="20" width="30" height="15" fill="#94a3b8" stroke="#000" strokeWidth="4" />
                <rect x="-10" y="35" width="20" height="10" fill="#475569" stroke="#000" strokeWidth="4" />
              </g>

              <g transform="translate(400, 120)">
                <circle cx="0" cy="0" r="45" fill="#fff" stroke="#000" strokeWidth="6" />
                <line x1="0" y1="-35" x2="0" y2="-45" stroke="#000" strokeWidth="3" />
                <line x1="-25" y1="-25" x2="-32" y2="-32" stroke="#000" strokeWidth="3" />
                <line x1="25" y1="-25" x2="32" y2="-32" stroke="#000" strokeWidth="3" />
                <text x="0" y="-15" fontWeight="900" fontSize="12" textAnchor="middle">0</text>
                <text x="-20" y="-5" fontWeight="900" fontSize="10" textAnchor="middle" fill="#f43f5e">-</text>
                <text x="20" y="-5" fontWeight="900" fontSize="10" textAnchor="middle" fill="#3b82f6">+</text>
                <text x="0" y="30" fontWeight="900" fontSize="16" textAnchor="middle">G</text>
                <g style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: '0 10px' }}>
                  <line x1="0" y1="10" x2="0" y2="-30" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="0" cy="10" r="5" fill="#000" />
                </g>
              </g>

              <g>
                <path d="M 280 200 L 300 200 L 300 250" fill="none" stroke="#b45309" strokeWidth="6" />
                {coilElements}
                <path d="M 500 250 L 500 200 L 520 200" fill="none" stroke="#b45309" strokeWidth="6" />
              </g>

              <g
                className="cursor-grab active:cursor-grabbing"
                transform={`translate(${magX}, 300)`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
              >
                <g opacity="0.3" style={{ transform: `scale(${1 + magStrength * 0.2})`, transformOrigin: '0 0' }}>
                  <ellipse cx="0" cy="0" rx="150" ry="80" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="10 5" />
                  <ellipse cx="0" cy="0" rx="100" ry="50" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="10 5" />
                </g>

                <rect
                  x="-75"
                  y="-25"
                  width="75"
                  height="50"
                  fill={isReversed ? "#3b82f6" : "#f43f5e"}
                  stroke="#000"
                  strokeWidth="4"
                />
                <text x="-37.5" y="10" fontSize="24" fontWeight="900" fill="#fff" textAnchor="middle">
                  {isReversed ? "S" : "U"}
                </text>

                <rect
                  x="0"
                  y="-25"
                  width="75"
                  height="50"
                  fill={isReversed ? "#f43f5e" : "#3b82f6"}
                  stroke="#000"
                  strokeWidth="4"
                />
                <text x="37.5" y="10" fontSize="24" fontWeight="900" fill="#fff" textAnchor="middle">
                  {isReversed ? "U" : "S"}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          KONSEP FISIKA: HUKUM FARADAY & LENZ
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Hukum Faraday</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              "Gaya Gerak Listrik (GGL) induksi yang timbul pada ujung-ujung suatu kumparan sebanding dengan <b>laju perubahan fluks magnetik</b> yang memotong kumparan tersebut."
              <br /><br />
              Artinya, listrik tidak dihasilkan dari keberadaan magnet yang diam di dalam kumparan, melainkan dari <b>PERGERAKAN</b> magnet tersebut. Semakin cepat Anda menggeser magnet, semakin terang lampunya!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Hukum Lenz (Tanda Minus)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              "Arah arus induksi selalu sedemikian rupa sehingga <b>menentang</b> penyebab perubahannya."
              <br /><br />
              Perhatikan jarum Galvanometer. Saat kutub Utara (U) mendekat, arah arus akan menolak. Saat kutub (U) dijauhkan, arah arus berbalik untuk menahannya. Ini adalah alasan mengapa ada tanda <b>negatif (-)</b> pada rumus Faraday.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">PERSAMAAN GGL INDUKSI</h3>
            <div className="bg-white text-black p-6 border-4 border-yellow-400 text-3xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e] rounded-xl">
              E = -N x (DeltaPhi / Deltat)
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600 rounded-xl">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">KETERANGAN BESARAN</h4>
            <ul className="text-[11px] font-bold space-y-2 text-white">
              <li><span className="text-yellow-400">E (Epsilon)</span> = GGL Induksi / Tegangan (Volt)</li>
              <li><span className="text-blue-400">N</span> = Jumlah lilitan kumparan</li>
              <li><span className="text-emerald-400">DeltaPhi (Delta Fluks)</span> = Perubahan garis gaya magnet (Weber)</li>
              <li><span className="text-rose-400">Deltat</span> = Selang waktu pergerakan (sekon)</li>
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
                            ? 'bg-rose-400 text-black'
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
                {score === 5 ? 'Sempurna! Kamu telah memahami Hukum Faraday dengan baik.' : 'Bagus! Silakan mainkan simulasinya lagi untuk memperkuat konsep.'}
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