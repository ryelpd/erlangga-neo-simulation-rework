import { useState, useRef, useEffect, useCallback } from 'react';

const EARTH_RADIUS_KM = 6371;
const GRAVITY_CONSTANT_MU = 398600;
const SVG_CENTER_X = 300;
const SVG_CENTER_Y = 300;
const SVG_EARTH_RADIUS_PX = 30;
const SCALE_PX_PER_KM = 250 / (EARTH_RADIUS_KM + 35786);

const quizData = [
  {
    question: '1. Apa singkatan dari LEO dalam klasifikasi orbit satelit?',
    options: ['Low Earth Orbit', 'Long Earth Orbit', 'Large Earth Object', 'Low Energy Operation'],
    answer: 0,
  },
  {
    question: '2. Satelit GPS mengorbit pada ketinggian sekitar...',
    options: ['400 km', '2.000 km', '20.200 km', '35.786 km'],
    answer: 2,
  },
  {
    question: '3. Mengapa satelit GEO tampak "diam" di langit ketika dilihat dari Bumi?',
    options: ['Satelit berhenti bergerak', 'Satelit mengorbit dengan kecepatan sudut yang sama dengan rotasi Bumi', 'Gravitasi Bumi menghentikan satelit', 'Bumi tidak berputar'],
    answer: 1,
  },
  {
    question: '4. Jika ketinggian orbit dinaikkan, apa yang terjadi pada kecepatan satelit?',
    options: ['Tidak berubah', 'Bertambah besar', 'Menjadi lebih kecil', 'Menjadi nol'],
    answer: 2,
  },
  {
    question: '5. Jenis orbit yang paling cocok untuk satelit komunikasi TV adalah...',
    options: ['LEO', 'MEO', 'GEO', 'Orbit Polar'],
    answer: 2,
  },
];

export default function OrbitSatelit() {
  const [altitude, setAltitude] = useState(400);
  const [isPlaying, setIsPlaying] = useState(true);
  const [angle, setAngle] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const calculatePhysics = useCallback((altKm: number) => {
    const rKm = EARTH_RADIUS_KM + altKm;
    const speed = Math.sqrt(GRAVITY_CONSTANT_MU / rKm);
    const periodSec = 2 * Math.PI * Math.sqrt(Math.pow(rKm, 3) / GRAVITY_CONSTANT_MU);
    const periodHour = periodSec / 3600;
    const coveragePercent = (altKm / (2 * rKm)) * 100;
    return { rKm, speed, periodHour, coveragePercent };
  }, []);

  const physics = calculatePhysics(altitude);

  const getPreset = () => {
    if (altitude <= 2000) return 'LEO';
    if (altitude >= 20000 && altitude <= 21000) return 'MEO';
    if (altitude >= 35000) return 'GEO';
    return 'CUSTOM';
  };

  const drawFrame = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    if (isPlaying) {
      const visualOmegaRadPerMs = (2 * Math.PI) / (physics.periodHour * 3000);
      setAngle((prev) => {
        const next = prev + visualOmegaRadPerMs * dt;
        return next > 2 * Math.PI ? next - 2 * Math.PI : next;
      });
    }
    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [isPlaying, physics.periodHour]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawFrame]);

  const radiusPx = Math.max(SVG_EARTH_RADIUS_PX + 10, physics.rKm * SCALE_PX_PER_KM);
  const satX = SVG_CENTER_X + radiusPx * Math.cos(angle);
  const satY = SVG_CENTER_Y + radiusPx * Math.sin(angle);
  const rotDeg = (angle * 180 / Math.PI) + 90;

  const angleOffset = Math.asin(SVG_EARTH_RADIUS_PX / radiusPx);
  const tanAngle1 = angle + Math.PI + angleOffset;
  const tanAngle2 = angle + Math.PI - angleOffset;
  const t1X = SVG_CENTER_X + SVG_EARTH_RADIUS_PX * Math.cos(tanAngle1);
  const t1Y = SVG_CENTER_Y + SVG_EARTH_RADIUS_PX * Math.sin(tanAngle1);
  const t2X = SVG_CENTER_X + SVG_EARTH_RADIUS_PX * Math.cos(tanAngle2);
  const t2Y = SVG_CENTER_Y + SVG_EARTH_RADIUS_PX * Math.sin(tanAngle2);

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
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">FISIKA SATELIT</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: ORBIT SATELIT</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Hubungan Ketinggian, Kecepatan, dan Cakupan Sinyal
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30 uppercase">
            Panel Kendali
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-slate-500">1. Klasifikasi Orbit</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setAltitude(400)}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 px-3 text-sm text-left flex justify-between items-center transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${
                    getPreset() === 'LEO' ? 'ring-4 ring-black bg-emerald-300' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <span>🌍 LEO (Rendah)</span>
                  <span className="text-[10px] bg-white px-1 border border-black">400 km</span>
                </button>
                <button
                  onClick={() => setAltitude(20200)}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 px-3 text-sm text-left flex justify-between items-center transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${
                    getPreset() === 'MEO' ? 'ring-4 ring-black bg-emerald-300' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <span>📡 MEO (Menengah)</span>
                  <span className="text-[10px] bg-white px-1 border border-black">20.200 km</span>
                </button>
                <button
                  onClick={() => setAltitude(35786)}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 px-3 text-sm text-left flex justify-between items-center transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${
                    getPreset() === 'GEO' ? 'ring-4 ring-black bg-emerald-300' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <span>🛰️ GEO (Geostasioner)</span>
                  <span className="text-[10px] bg-white px-1 border border-black">35.786 km</span>
                </button>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Atur Ketinggian (Altitude)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{altitude.toLocaleString('id-ID')} km</span>
              </div>
              <input
                type="range"
                min="400"
                max="35786"
                step="100"
                value={altitude}
                onChange={(e) => setAltitude(parseFloat(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Dekat Bumi</span>
                <span>Sangat Jauh</span>
              </div>
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-all font-bold cursor-pointer uppercase py-3 text-center text-md w-full active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${
                isPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'
              } text-black`}
            >
              {isPlaying ? '⏸️ JEDA WAKTU' : '▶️ LANJUTKAN SIMULASI'}
            </button>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-emerald-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA TELEMETRI (HUKUM KEPLER)</h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Kecepatan Orbit</div>
                <div className="text-xl font-black text-yellow-300">{physics.speed.toFixed(2)}</div>
                <div className="text-[8px]">km/detik</div>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Periode Orbit</div>
                <div className="text-xl font-black text-sky-300">{physics.periodHour.toFixed(2)}</div>
                <div className="text-[8px]">Jam</div>
              </div>
              <div className="col-span-2 bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Luas Cakupan Sinyal ke Bumi</div>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-2xl font-black text-rose-400">{physics.coveragePercent.toFixed(1)}</div>
                  <span className="text-sm font-bold text-rose-400">%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 mt-1 border border-black rounded overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all" style={{ width: `${physics.coveragePercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-900 p-0 relative flex flex-col items-center justify-center w-full min-h-[450px] overflow-hidden border-8 border-black rounded-xl" style={{ backgroundColor: '#0f172a', backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 4px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 3px), radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 4px)', backgroundSize: '550px 550px, 350px 350px, 250px 250px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-1 z-30 uppercase">
              Radarscope: Area Equatorial
            </span>

            <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-300 border border-black opacity-40"></div> Area Cakupan (Line of Sight)
              </div>
            </div>

            <svg viewBox="0 0 600 600" className="w-full h-full overflow-visible max-h-[500px]">
              <defs>
                <radialGradient id="earthGrad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </radialGradient>
              </defs>

              <polygon points={`${satX},${satY} ${t1X},${t1Y} ${t2X},${t2Y}`} fill="#facc15" opacity="0.3" />
              <line x1={satX} y1={satY} x2={t1X} y2={t1Y} stroke="#eab308" strokeWidth="1" strokeDasharray="4" opacity="0.8" />
              <line x1={satX} y1={satY} x2={t2X} y2={t2Y} stroke="#eab308" strokeWidth="1" strokeDasharray="4" opacity="0.8" />

              <circle cx="300" cy="300" r={radiusPx} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.4" />

              <g transform="translate(300, 300)">
                <circle cx="0" cy="0" r="32" fill="none" stroke="#7dd3fc" strokeWidth="4" opacity="0.3" />
                <circle cx="0" cy="0" r="30" fill="url(#earthGrad)" stroke="#000" strokeWidth="2" />
                <path d="M -15 -20 Q -5 -25 5 -15 Q 15 -5 20 -10 Q 28 5 15 15 Q 5 25 -10 15 Q -25 5 -15 -20 Z" fill="#22c55e" stroke="#064e3b" strokeWidth="1" />
                <path d="M 10 20 Q 20 25 25 15 Z" fill="#22c55e" />
                <path d="M 0 -30 A 30 30 0 0 1 0 30 A 30 30 0 0 0 0 -30" fill="#000" opacity="0.4" />
              </g>

              <g transform={`translate(${satX}, ${satY}) rotate(${rotDeg})`}>
                <rect x="-12" y="-4" width="8" height="8" fill="#3b82f6" stroke="#000" strokeWidth="1.5" />
                <rect x="4" y="-4" width="8" height="8" fill="#3b82f6" stroke="#000" strokeWidth="1.5" />
                <rect x="-4" y="-6" width="8" height="12" fill="#f8fafc" stroke="#000" strokeWidth="2" rx="2" />
                <circle cx="0" cy="0" r="2" fill="#f43f5e" />
                <path d="M -8 0 Q 0 8 8 0" fill="none" stroke="#000" strokeWidth="1" opacity="0.5" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-100 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-900 border-b-2 border-black pb-1 mb-2">LEO (Low Earth Orbit)</h4>
            <div className="text-[10px] bg-white px-2 py-1 border-2 border-black font-bold mb-2 inline-block">400 - 2.000 km</div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Orbit paling dekat dengan Bumi. Bergerak sangat cepat (sekitar 1.5 jam untuk satu keliling). Digunakan untuk Satelit Mata-mata, ISS, dan internet satelit (Starlink).
            </p>
          </div>

          <div className="bg-blue-100 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-blue-900 border-b-2 border-black pb-1 mb-2">MEO (Medium Earth Orbit)</h4>
            <div className="text-[10px] bg-white px-2 py-1 border-2 border-black font-bold mb-2 inline-block">2.000 - 35.000 km</div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Orbit pertengahan. Periode sekitar 12 jam. Digunakan oleh Satelit Navigasi GPS, Galileo, dan GLONASS. Cakupan cukup luas.
            </p>
          </div>

          <div className="bg-rose-100 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-900 border-b-2 border-black pb-1 mb-2">GEO (Geostationary Orbit)</h4>
            <div className="text-[10px] bg-white px-2 py-1 border-2 border-black font-bold mb-2 inline-block">35.786 km</div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Kecepatan sudut sama dengan rotasi Bumi (24 jam). Tampak "diam" di atas satu titik. Sempurna untuk satelit komunikasi, parabola TV, dan cuaca.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <h4 className="font-black text-md uppercase text-black mb-2">Fisika di Balik Layar: Hukum Kepler</h4>
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            Semakin jauh satelit dari Bumi, <b>pengaruh gravitasi semakin lemah</b>. Satelit GEO bergerak lebih lambat (~3 km/detik) dibanding LEO (~7.6 km/detik). Kecepatan harus dihitung presisi agar tidak terlempar atau jatuh.
          </p>
        </div>
      </div>

      <div className="mb-12 bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI SATELIT [KUIS]</h3>
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
                {score === 5 ? 'Sempurna! Anda ahli tentang satelit!' : 'Bagus! Coba eksplorasi lagi simulasi orbitnya.'}
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
