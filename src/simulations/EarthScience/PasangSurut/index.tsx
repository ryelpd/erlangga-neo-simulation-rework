import type { ReactNode } from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';

const quizData = [
  {
    question: "1. Mengapa gaya tarik Bulan lebih mendominasi pasang surut di Bumi dibandingkan gaya tarik Matahari?",
    options: ["Karena Bulan lebih besar dari Matahari", "Karena Bulan memiliki medan magnet lebih kuat", "Karena jarak Bulan jauh lebih dekat ke Bumi dibandingkan Matahari", "Karena Bulan terbuat dari air"],
    answer: 2
  },
  {
    question: "2. Pasang Purnama (Spring Tide) yang mengakibatkan pasang naik tertinggi terjadi pada fase bulan apa saja?",
    options: ["Bulan Paruh (Kuartal)", "Hanya saat Bulan Purnama saja", "Bulan Baru (New Moon) dan Bulan Purnama (Full Moon)", "Setiap hari Senin"],
    answer: 2
  },
  {
    question: "3. Perhatikan visualisasi vektor gaya. Saat terjadi Pasang Perbani (Neap Tide), bagaimana orientasi vektor gaya Bulan dan Matahari?",
    options: ["Saling sejajar (membentuk garis lurus)", "Saling tegak lurus (membentuk sudut 90 derajat)", "Saling meniadakan menjadi nol", "Matahari berhenti menarik"],
    answer: 1
  },
  {
    question: "4. Perhatikan simulasi saat Anda memutar waktu (Rotasi Bumi). Jika Anda berdiri di pantai seharian penuh (24 jam), rata-rata berapa kali Anda akan mengalami Pasang Naik?",
    options: ["1 kali", "2 kali (karena melewati dua sisi tonjolan air)", "4 kali", "Tidak ada pasang naik"],
    answer: 1
  },
  {
    question: "5. Tonjolan air laut (bulge) di Bumi tidak hanya terjadi pada sisi yang menghadap Bulan, tetapi juga pada sisi yang berlawanan arah dengan Bulan. Mengapa bisa demikian?",
    options: ["Akibat gaya dorong angin surya", "Karena air ketakutan melihat Bulan", "Akibat efek sentrifugal dari putaran sistem Bumi-Bulan yang 'terlempar' ke luar", "Karena pengaruh es di kutub"],
    answer: 2
  }
];

const EARTH_R = 45;
const BASE_WATER_R = 52;
const MOON_PULL = 22;
const SUN_PULL = 10;
const ORBIT_R = 160;

function formatTime(hoursFloat: number): string {
  const h = Math.floor(hoursFloat);
  const m = Math.round((hoursFloat - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getMoonPhaseName(angle: number): string {
  const a = ((angle % 360) + 360) % 360;
  if (a < 20 || a > 340) return "Bulan Baru (New Moon)";
  if (a >= 20 && a < 80) return "Sabit Awal (Crescent)";
  if (a >= 80 && a < 100) return "Paruh Awal (1st Quarter)";
  if (a >= 100 && a < 160) return "Cembung Awal (Gibbous)";
  if (a >= 160 && a < 200) return "Bulan Purnama (Full Moon)";
  if (a >= 200 && a < 260) return "Cembung Akhir (Gibbous)";
  if (a >= 260 && a < 280) return "Paruh Akhir (3rd Quarter)";
  return "Sabit Akhir (Crescent)";
}

export default function PasangSurut(): ReactNode {
  const [moonAngle, setMoonAngle] = useState(0);
  const [earthTime, setEarthTime] = useState(12);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVectors, setShowVectors] = useState(true);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const moonRad = (moonAngle * Math.PI) / 180;
  const earthDeg = 180 - (earthTime / 24) * 360;

  const mx = ORBIT_R * Math.cos(moonRad);
  const my = -ORBIT_R * Math.sin(moonRad);

  const generateWaterBulgePath = useCallback(() => {
    let pathD = "";
    for (let i = 0; i <= 360; i += 2) {
      const thetaRad = (i * Math.PI) / 180;
      const r = BASE_WATER_R
        + MOON_PULL * Math.cos(2 * (thetaRad - moonRad))
        + SUN_PULL * Math.cos(2 * (thetaRad - 0));

      const x = r * Math.cos(thetaRad);
      const y = -r * Math.sin(thetaRad);

      if (i === 0) pathD += `M ${x} ${y} `;
      else pathD += `L ${x} ${y} `;
    }
    return pathD + "Z";
  }, [moonRad]);

  const getObserverWaterR = useCallback(() => {
    const earthRadValue = (earthDeg * Math.PI) / 180;
    return BASE_WATER_R
      + MOON_PULL * Math.cos(2 * (-earthRadValue - moonRad))
      + SUN_PULL * Math.cos(2 * (-earthRadValue - 0));
  }, [earthDeg, moonRad]);

  const getTideAnalysis = useCallback(() => {
    const diffDeg = Math.abs(((moonAngle % 180) + 180) % 180);
    if (diffDeg < 30 || diffDeg > 150) {
      return {
        type: "PASANG PURNAMA (SPRING)",
        typeColor: "text-rose-400",
        borderColor: "border-rose-400",
        shadowColor: "shadow-[4px_4px_0px_0px_#fb7185]",
        description: "Vektor Gaya Matahari dan Bulan SEJAJAR. Saling menguatkan. Pasang naik sangat tinggi, pasang surut sangat rendah.",
        descColor: "text-rose-300"
      };
    } else if (diffDeg > 60 && diffDeg < 120) {
      return {
        type: "PASANG PERBANI (NEAP)",
        typeColor: "text-sky-400",
        borderColor: "border-sky-400",
        shadowColor: "shadow-[4px_4px_0px_0px_#38bdf8]",
        description: "Vektor Gaya Matahari dan Bulan TEGAK LURUS. Saling melemahkan. Perbedaan pasang dan surut sangat kecil.",
        descColor: "text-sky-300"
      };
    } else {
      return {
        type: "TRANSISI (NORMAL)",
        typeColor: "text-yellow-400",
        borderColor: "border-yellow-400",
        shadowColor: "shadow-[4px_4px_0px_0px_#facc15]",
        description: "Fase transisi orientasi vektor dari Purnama ke Perbani atau sebaliknya.",
        descColor: "text-yellow-300"
      };
    }
  }, [moonAngle]);

  const getLocalTideStatus = useCallback(() => {
    const observerWaterR = getObserverWaterR();
    const absMin = BASE_WATER_R - MOON_PULL - SUN_PULL;
    const absMax = BASE_WATER_R + MOON_PULL + SUN_PULL;
    const percent = ((observerWaterR - absMin) / (absMax - absMin)) * 100;

    if (percent > 65) {
      return { text: "PASANG NAIK (HIGH TIDE)", color: "text-emerald-400", borderColor: "border-emerald-400", shadowColor: "shadow-[4px_4px_0px_0px_#34d399]" };
    } else if (percent < 35) {
      return { text: "PASANG SURUT (LOW TIDE)", color: "text-rose-400", borderColor: "border-rose-400", shadowColor: "shadow-[4px_4px_0px_0px_#fb7185]" };
    } else {
      return { text: "KETINGGIAN NORMAL", color: "text-white", borderColor: "border-slate-400", shadowColor: "shadow-[4px_4px_0px_0px_#94a3b8]" };
    }
  }, [getObserverWaterR]);

  const getWaterLevelPercent = useCallback(() => {
    const observerWaterR = getObserverWaterR();
    const absMin = BASE_WATER_R - MOON_PULL - SUN_PULL;
    const absMax = BASE_WATER_R + MOON_PULL + SUN_PULL;
    return Math.round(((observerWaterR - absMin) / (absMax - absMin)) * 100);
  }, [getObserverWaterR]);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      setEarthTime(prev => {
        let newTime = prev + dt * 2;
        if (newTime >= 24) newTime -= 24;
        return newTime;
      });

      setMoonAngle(prev => {
        let newAngle = prev + (dt * 2) * (360 / (24 * 29.5));
        if (newAngle >= 360) newAngle -= 360;
        return newAngle;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  const tideAnalysis = getTideAnalysis();
  const localTide = getLocalTideStatus();
  const waterLevel = getWaterLevelPercent();
  const waterBulgePath = generateWaterBulgePath();

  const handleAnswer = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (userAnswers.every(a => a !== null)) {
      setQuizSubmitted(true);
    }
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
      <header className="text-center mb-8 max-w-7xl bg-sky-400 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black border-2">GEOGRAFI & FISIKA BUMI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: PASANG SURUT V2
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Analisis Vektor Gravitasi Bulan & Matahari Terhadap Pasang Air Laut
        </p>
      </header>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Panel Waktu & Posisi
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 relative">
              <span className="absolute -top-3 -left-2 bg-slate-800 text-white font-black px-2 py-0.5 text-[10px] border-2 border-black">ORBIT BULAN</span>
              <div className="flex justify-between items-center mb-1 mt-2">
                <span className="font-black text-slate-800 uppercase text-xs">Fase / Sudut (Revolusi)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{moonAngle.toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={moonAngle}
                onChange={(e) => { if (isPlaying) setIsPlaying(false); setMoonAngle(Number(e.target.value)); }}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-400 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 relative">
              <span className="absolute -top-3 -left-2 bg-blue-600 text-white font-black px-2 py-0.5 text-[10px] border-2 border-black">ROTASI BUMI</span>
              <div className="flex justify-between items-center mb-1 mt-2">
                <span className="font-black text-blue-800 uppercase text-xs">Waktu Lokal Pengamat</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{earthTime.toFixed(1)} Jam</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="0.5"
                value={earthTime}
                onChange={(e) => { if (isPlaying) setIsPlaying(false); setEarthTime(Number(e.target.value)); }}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                <span>Malam (00:00)</span>
                <span>Siang (12:00)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2 border-t-4 border-black pt-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-lg flex items-center justify-center gap-2 py-4 ${
                  isPlaying ? 'bg-rose-400 hover:bg-rose-300' : 'bg-emerald-400 hover:bg-emerald-300'
                }`}
              >
                {isPlaying ? '⏸️ JEDA SIMULASI' : '▶️ JALANKAN SIMULASI ALAM'}
              </button>
              <div className="flex items-center justify-between bg-slate-100 p-3 border-2 border-black">
                <span className="font-black text-[10px] uppercase">Tampilkan Vektor Gaya</span>
                <label className="relative inline-block w-10 h-5">
                  <input
                    type="checkbox"
                    checked={showVectors}
                    onChange={(e) => setShowVectors(e.target.checked)}
                    className="opacity-0 w-0 h-0 peer"
                  />
                  <span className="absolute cursor-pointer inset-0 bg-white border-2 border-black rounded-full transition-colors duration-300 peer-checked:bg-yellow-400 before:absolute before:content-[''] before:h-3 before:w-3 before:left-1 before:bottom-0.5 before:bg-black before:rounded-full before:transition-transform peer-checked:before:translate-x-5"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[500px] overflow-hidden border-8 border-black">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Tampak Atas (Kutub Utara)
          </span>

          <div className="w-full h-full relative z-10 flex items-center justify-center">
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '40px 40px', backgroundPosition: '20px 20px' }} />

            <svg viewBox="0 0 600 500" className="w-full h-full overflow-visible relative z-10">
              <defs>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                </radialGradient>
                <marker id="arrowMoon" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#cbd5e1" />
                </marker>
                <marker id="arrowSun" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#facc15" />
                </marker>
              </defs>

              <g transform="translate(500, 250)">
                <circle cx="100" cy="0" r="150" fill="url(#sunGlow)" className="animate-pulse" />
                <text x="70" y="-5" fontSize="24" fontWeight="900" fill="#facc15" transform="rotate(-90 70 -5)" style={{ textShadow: '2px 2px 0 #000' }}>MATAHARI</text>
              </g>

              <g transform="translate(300, 250)">
                <circle cx="0" cy="0" r={ORBIT_R} fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="8 4" />

                {showVectors && (
                  <g>
                    <line x1="0" y1="0" x2="100" y2="0" stroke="#facc15" strokeWidth="4" markerEnd="url(#arrowSun)" opacity="0.8" />
                    <text x="100" y="-10" fontSize="12" fontWeight="bold" fill="#facc15">F.Matahari</text>

                    <line x1="0" y1="0" x2={90 * Math.cos(moonRad)} y2={-90 * Math.sin(moonRad)} stroke="#cbd5e1" strokeWidth="5" markerEnd="url(#arrowMoon)" />
                    <text x={(90 + 15) * Math.cos(moonRad)} y={-(90 + 15) * Math.sin(moonRad)} fontSize="12" fontWeight="bold" fill="#cbd5e1" textAnchor="middle">F.Bulan</text>
                  </g>
                )}

                <path d={waterBulgePath} fill="#0ea5e9" opacity="0.6" stroke="#38bdf8" strokeWidth="4" />

                <g transform={`rotate(${-earthDeg})`}>
                  <circle cx="0" cy="0" r={EARTH_R} fill="#1d4ed8" stroke="#000" strokeWidth="4" />
                  <path d="M -15 -35 Q 0 -20 15 -35 Z" fill="#22c55e" />
                  <path d="M 20 -10 Q 35 0 20 20 Q 5 10 10 -5 Z" fill="#22c55e" />
                  <path d="M -30 10 Q -15 25 -25 40 Q -40 25 -30 10 Z" fill="#22c55e" />
                  <path d="M -5 -5 Q 5 10 -5 15 Z" fill="#22c55e" />
                </g>

                <g transform={`rotate(${-earthDeg})`}>
                  <line x1="0" y1="0" x2="45" y2="0" stroke="#ef4444" strokeWidth="3" strokeDasharray="4 2" />
                  <circle cx="45" cy="0" r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" />
                  <text x="60" y="5" fontSize="12" fontWeight="900" fill="#fff" style={{ textShadow: '2px 2px 0 #000' }}>PENGAMAT</text>
                </g>

                <g transform={`translate(${mx}, ${my})`}>
                  <circle cx="0" cy="0" r="25" fill="#facc15" opacity="0.1" />
                  <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#000" strokeWidth="3" />
                  <path d="M 0 -16 A 16 16 0 0 1 0 16 Z" fill="#facc15" />
                  <text x="0" y="-25" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" style={{ textShadow: '2px 2px 0 #000' }}>BULAN</text>
                </g>
              </g>
            </svg>
          </div>
        </div>

        <div className="bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 left-6 bg-emerald-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Data Telemetri
          </span>

          <div className={`bg-black p-4 border-4 ${tideAnalysis.borderColor} text-center ${tideAnalysis.shadowColor} mt-2 transition-colors duration-300`}>
            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block mb-1">Tipe Pasang Surut Global</span>
            <span className={`font-black text-2xl ${tideAnalysis.typeColor} uppercase`}>{tideAnalysis.type}</span>
          </div>

          <div className={`bg-slate-800 p-4 border-4 ${localTide.borderColor} text-center ${localTide.shadowColor} mt-2 transition-colors duration-300`}>
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">Ketinggian Air di Area Pengamat</span>
            <span className={`font-black text-3xl ${localTide.color} uppercase`}>{localTide.text}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs font-mono mt-4 flex-1">
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400 font-bold uppercase">Fase Bulan:</span>
              <span className="text-emerald-400 font-black text-sm">{getMoonPhaseName(moonAngle)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400 font-bold uppercase">Waktu Pengamat:</span>
              <span className="text-sky-400 font-black text-sm">{formatTime(earthTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase">Tinggi Air Relatif:</span>
              <span className="text-rose-400 font-black text-2xl">{waterLevel}%</span>
            </div>
          </div>

          <div className="mt-auto p-3 bg-slate-800 border-2 border-dashed border-slate-500 text-center">
            <div className={`text-[11px] font-bold ${tideAnalysis.descColor} leading-relaxed uppercase`}>
              {tideAnalysis.description}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-sky-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-7xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          BAGAIMANA PASANG SURUT TERJADI? 🌊
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Tonjolan Air (Water Bulge)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Gaya gravitasi Bulan (F.Bulan) menarik air laut ke arahnya, membuat tonjolan air di sisi Bumi yang menghadap Bulan. Secara bersamaan, sisi Bumi yang <b>berlawanan</b> juga menonjol ke luar karena gaya sentrifugal dari putaran sistem Bumi-Bulan. Bumi seolah berputar di dalam selimut air yang berbentuk lonjong!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-yellow-600 border-b-2 border-black pb-1 mb-2">Peran Matahari</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Meskipun jauh, Matahari sangat masif sehingga gravitasinya (F.Matahari) ikut menarik air laut (kekuatannya sekitar setengah dari tarikan Bulan). Perpaduan vektor kedua gaya inilah yang menentukan seberapa lonjong bentuk air di Bumi.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl z-10 relative bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-black mb-4 uppercase">PURNAWA VS PERBANI</h3>
            <div className="bg-white text-black p-6 border-4 border-black text-xl font-bold shadow-[4px_4px_0px_#000] leading-relaxed">
              Setiap 1 hari (24 Jam) saat Bumi berotasi, sebuah tempat di pantai rata-rata akan melewati tonjolan air sehingga mengalami <span className="bg-blue-200 px-1 border border-black">2 kali pasang naik</span> dan <span className="bg-rose-200 px-1 border border-black">2 kali pasang surut</span>.
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-white mb-2 uppercase border-b border-slate-500 pb-1">SIKLUS BULANAN</h4>
            <ul className="text-xs font-bold space-y-4 text-white">
              <li className="flex items-start gap-2">
                <span className="bg-rose-500 text-white px-2 py-1 border border-black whitespace-nowrap">PASANG PURNAMA (SPRING TIDE)</span>
                <span className="text-slate-300">Terjadi saat Bulan Baru atau Bulan Purnama (Sudut 0° / 180°). Vektor gaya Bulan dan Matahari <b>SEJAJAR</b> dan saling menguatkan. Pasang naik sangat tinggi, pasang surut sangat rendah.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-500 text-white px-2 py-1 border border-black whitespace-nowrap">PASANG PERBANI (NEAP TIDE)</span>
                <span className="text-slate-300">Terjadi saat fase Bulan Paruh (Sudut 90° / 270°). Vektor gaya saling <b>TEGAK LURUS</b> dan melemahkan. Perbedaan tinggi air pasang dan surut menjadi sangat kecil.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-7xl z-10 relative">
        <div className="bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center p-4">
            EVALUASI KONSEP [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000] mb-4">
                <h4 className="font-bold mb-3 text-sm uppercase">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswer(qIdx, oIdx)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase transition-all text-left px-4 py-2 bg-white text-xs
                        ${quizSubmitted
                          ? oIdx === q.answer
                            ? 'bg-green-400 text-black'
                            : userAnswers[qIdx] === oIdx
                              ? 'bg-rose-400 text-black'
                              : ''
                          : userAnswers[qIdx] === oIdx
                            ? 'bg-black text-white translate-x-[4px] translate-y-[4px] shadow-none'
                            : 'hover:bg-slate-100'
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
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-3 px-10 text-xl w-full mt-4 bg-slate-900 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
              >
                KIRIM JAWABAN!
              </button>
            )}

            {quizSubmitted && (
              <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                <h4 className="text-3xl font-black text-black mb-2 uppercase">NILAI AKHIR: {score}/5</h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {score === 5 ? "Sempurna! Pengetahuan ilmu bumi Anda sangat luas." : "Bagus! Coba interaksi tarik Bulan di simulasi untuk memahaminya lebih lanjut."}
                </p>
                <br />
                <button
                  onClick={handleRetry}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-3 px-8 text-lg bg-black text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
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