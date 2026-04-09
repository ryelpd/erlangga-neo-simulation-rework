import { useState, useRef, useEffect, useCallback } from 'react';

const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

const DAY_MAR_EQUINOX = 79;
const DAY_JUN_SOLSTICE = 171;
const DAY_SEP_EQUINOX = 265;
const DAY_DEC_SOLSTICE = 355;

const quizData = [
  {
    question: '1. Apa penyebab utama adanya pergantian musim di Bumi?',
    options: ['Jarak Bumi ke Matahari yang berubah sepanjang tahun', 'Kemiringan sumbu Bumi sebesar 23.5° terhadap bidang orbit', 'Perubahan ukuran Matahari', 'Gerakan Matahari mengelilingi Bumi'],
    answer: 1,
  },
  {
    question: '2. Pada posisi Solstis Juni (21 Juni), apa yang terjadi?',
    options: ['Kutub Utara condong MENJAUHI Matahari', 'Kutub Utara condong MENUJU Matahari', 'Bumi berada di posisi terdekat dengan Matahari', 'Tidak ada bayangan di kutub'],
    answer: 1,
  },
  {
    question: '3. Apa yang terjadi jika sumbu Bumi tidak miring (0°)?',
    options: ['Musim menjadi lebih ekstrem', 'Tidak akan ada pergantian musim', 'Hanya ada dua musim', 'Matahari menjadi lebih panas'],
    answer: 1,
  },
  {
    question: '4. Pada saat Ekuinoks (Maret/September), apa karakteristik utamanya?',
    options: ['Siang lebih panjang dari malam di seluruh dunia', 'Malam lebih panjang dari siang di seluruh dunia', 'Durasi siang dan malam hampir sama di seluruh dunia', 'Kutub mengalami siang 24 jam'],
    answer: 2,
  },
  {
    question: '5. Garis Balik Utara (Tropic of Cancer) terletak pada garis lintang...',
    options: ['0° (Khatulistiwa)', '23.5° Lintang Utara', '23.5° Lintang Selatan', '66.5° Lintang Utara'],
    answer: 1,
  },
];

export default function MusimKemiringanBumi() {
  const [day, setDay] = useState(171);
  const [isTilted, setIsTilted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const dayToDateString = (dayIndex: number) => {
    let tempDay = dayIndex;
    let m = 0;
    while (tempDay >= daysInMonths[m] && m < 11) {
      tempDay -= daysInMonths[m];
      m++;
    }
    return `${Math.floor(tempDay) + 1} ${monthNames[m]}`;
  };

  const orbitProgress = (day - DAY_JUN_SOLSTICE) / 365.25;
  const orbitAngleRad = orbitProgress * 2 * Math.PI;

  const cx = 300, cy = 140;
  const rx = 220, ry = 100;
  const earthX = cx + rx * Math.cos(orbitAngleRad);
  const earthY = cy + ry * Math.sin(orbitAngleRad);

  const angleToSun = Math.atan2(cy - earthY, cx - earthX) * (180 / Math.PI);

  let effectiveTilt = 0;
  if (isTilted) {
    effectiveTilt = -23.5 * Math.cos(orbitAngleRad);
  }

  const getSeasonStatus = () => {
    if (!isTilted) {
      return { utara: 'Ekuinoks / Stabil', selatan: 'Ekuinoks / Stabil', sudut: 'Tegak Lurus' };
    }
    if (effectiveTilt < -10) {
      return { utara: 'Musim Panas', selatan: 'Musim Dingin', sudut: 'Condong ke Utara' };
    } else if (effectiveTilt > 10) {
      return { utara: 'Musim Dingin', selatan: 'Musim Panas', sudut: 'Condong ke Selatan' };
    }
    const season = orbitAngleRad > 0 && orbitAngleRad < Math.PI ? 'Musim Gugur' : 'Musim Semi';
    return { utara: season, selatan: orbitAngleRad > 0 && orbitAngleRad < Math.PI ? 'Musim Semi' : 'Musim Gugur', sudut: 'Tegak Lurus' };
  };

  const status = getSeasonStatus();

  const drawFrame = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    if (isPlaying) {
      setDay((prev) => {
        const next = prev + (dt / 50);
        return next > 364 ? 0 : next;
      });
    }
    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [isPlaying]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawFrame]);

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

  const getPreset = () => {
    if (Math.abs(day - DAY_MAR_EQUINOX) < 5) return 'MAR';
    if (Math.abs(day - DAY_JUN_SOLSTICE) < 5) return 'JUN';
    if (Math.abs(day - DAY_SEP_EQUINOX) < 5) return 'SEP';
    if (Math.abs(day - DAY_DEC_SOLSTICE) < 5) return 'DES';
    return 'CUSTOM';
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-orange-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">ILMU BUMI & ANTARIKSA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: SIKLUS MUSIM</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Misteri Kemiringan 23.5° dan Dampaknya Pada Iklim Bumi
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md rotate-2 z-30 uppercase">
            Panel Waktu
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Eksperimen Kemiringan</label>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Sumbu Bumi Miring 23.5°</span>
                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input
                    type="checkbox"
                    checked={isTilted}
                    onChange={(e) => setIsTilted(e.target.checked)}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-black appearance-none cursor-pointer z-10 transition-transform duration-200 checked:translate-x-6"
                  />
                  <label className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 border-4 border-black cursor-pointer"></label>
                </div>
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-800 uppercase text-[10px]">Perjalanan Waktu (Hari)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{dayToDateString(day)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="364"
                step="1"
                value={day}
                onChange={(e) => setDay(parseFloat(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Jan</span>
                <span>Des</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDay(DAY_MAR_EQUINOX)}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 text-xs flex items-center justify-center gap-1 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${getPreset() === 'MAR' ? 'ring-4 ring-black bg-emerald-200' : 'bg-emerald-100'}`}
              >
                🌸 Ekuinoks Mar
              </button>
              <button
                onClick={() => setDay(DAY_JUN_SOLSTICE)}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 text-xs flex items-center justify-center gap-1 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${getPreset() === 'JUN' ? 'ring-4 ring-black bg-rose-300' : 'bg-rose-100'}`}
              >
                ☀️ Solstis Jun
              </button>
              <button
                onClick={() => setDay(DAY_SEP_EQUINOX)}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 text-xs flex items-center justify-center gap-1 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${getPreset() === 'SEP' ? 'ring-4 ring-black bg-orange-300' : 'bg-orange-100'}`}
              >
                🍂 Ekuinoks Sep
              </button>
              <button
                onClick={() => setDay(DAY_DEC_SOLSTICE)}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 text-xs flex items-center justify-center gap-1 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${getPreset() === 'DES' ? 'ring-4 ring-black bg-sky-200' : 'bg-sky-100'}`}
              >
                ❄️ Solstis Des
              </button>
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
            <h4 className="font-black text-orange-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">STATUS IKLIM GLOBAL</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Utara (Poles)</span>
                <span className={`text-sm font-black uppercase bg-slate-900 px-2 py-1 border border-slate-700 ${status.utara === 'Musim Panas' ? 'text-rose-400' : status.utara === 'Musim Dingin' ? 'text-sky-400' : 'text-emerald-400'}`}>
                  {status.utara}
                </span>
              </div>
              <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Selatan (Poles)</span>
                <span className={`text-sm font-black uppercase bg-slate-900 px-2 py-1 border border-slate-700 ${status.selatan === 'Musim Panas' ? 'text-rose-400' : status.selatan === 'Musim Dingin' ? 'text-sky-400' : 'text-emerald-400'}`}>
                  {status.selatan}
                </span>
              </div>
              <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Sudut Sinar ke Bumi</span>
                <span className="text-sm font-black text-yellow-300">{status.sudut}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-900 p-0 relative flex flex-col items-center justify-center w-full min-h-[500px] overflow-hidden border-8 border-black rounded-xl" style={{ backgroundColor: '#0f172a', backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 4px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 3px)', backgroundSize: '550px 550px, 350px 350px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-1 z-30 uppercase">
              Simulator Antariksa 2D
            </span>

            <svg viewBox="0 0 600 600" className="w-full h-full overflow-visible max-h-[600px]">
              <g transform="translate(0, 0)">
                <line x1="0" y1="280" x2="600" y2="280" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
                <text x="10" y="270" fill="#94a3b8" fontSize="10" fontWeight="bold">Tampak Atas (Orbit Bumi)</text>

                <ellipse cx="300" cy="140" rx="220" ry="100" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.4" />

                <circle cx="300" cy="140" r="25" fill="#facc15" style={{ filter: 'drop-shadow(0 0 15px rgba(250, 204, 21, 0.6))' }} />
                <circle cx="300" cy="140" r="22" fill="#eab308" />

                <text x="530" y="145" fill="#64748b" fontSize="10" fontWeight="bold">JUN</text>
                <text x="50" y="145" fill="#64748b" fontSize="10" fontWeight="bold">DES</text>
                <text x="290" y="25" fill="#64748b" fontSize="10" fontWeight="bold">MAR</text>
                <text x="290" y="260" fill="#64748b" fontSize="10" fontWeight="bold">SEP</text>

                <g transform={`translate(${earthX}, ${earthY})`}>
                  <g transform={`rotate(${angleToSun + 90})`}>
                    <path d="M 0 -12 A 12 12 0 0 1 0 12 A 12 12 0 0 0 0 -12" fill="#000" opacity="0.6" />
                  </g>
                  <circle cx="0" cy="0" r="12" fill="#3b82f6" stroke="#000" strokeWidth="1.5" />
                  {isTilted && (
                    <>
                      <line x1="-15" y1="15" x2="15" y2="-15" stroke="#ef4444" strokeWidth="2" strokeDasharray="2" />
                      <circle cx="15" cy="-15" r="2" fill="#ef4444" />
                    </>
                  )}
                </g>
              </g>

              <g transform="translate(0, 300)">
                <text x="10" y="20" fill="#94a3b8" fontSize="10" fontWeight="bold">Tampak Samping (Penyinaran Matahari)</text>

                <g stroke="#fef08a" strokeWidth="2" opacity="0.3" strokeDasharray="10 5">
                  <line x1="50" y1="150" x2="350" y2="150" />
                  <line x1="50" y1="90" x2="360" y2="90" />
                  <line x1="50" y1="210" x2="360" y2="210" />
                </g>
                <path d="M 0 50 Q 50 150 0 250 Z" fill="#facc15" opacity="0.8" />
                <text x="10" y="155" fill="#000" fontSize="14" fontWeight="bold">MATAHARI</text>

                <g transform="translate(450, 150)">
                  <g transform={`rotate(${effectiveTilt})`}>
                    <circle cx="0" cy="0" r="80" fill="#3b82f6" stroke="#000" strokeWidth="2" />
                    <path d="M -40 -50 Q -10 -60 20 -30 Q 40 0 10 30 Q -20 60 -50 20 Z" fill="#22c55e" opacity="0.8" />
                    <line x1="-80" y1="0" x2="80" y2="0" stroke="#ef4444" strokeWidth="3" strokeDasharray="4" />
                    <text x="85" y="4" fill="#ef4444" fontSize="10" fontWeight="bold">Ekuator</text>
                    <line x1="-74" y1="-32" x2="74" y2="-32" stroke="#fff" strokeWidth="1" strokeDasharray="2" />
                    <line x1="-74" y1="32" x2="74" y2="32" stroke="#fff" strokeWidth="1" strokeDasharray="2" />
                    <circle cx="0" cy="-80" r="4" fill="#fff" stroke="#000" />
                    <circle cx="0" cy="80" r="4" fill="#fff" stroke="#000" />
                    <line x1="0" y1="-110" x2="0" y2="110" stroke="#fff" strokeWidth="2" strokeDasharray="5" />
                  </g>
                  <path d="M 0 -80 A 80 80 0 0 1 0 80 A 80 80 0 0 0 0 -80" fill="#000" opacity="0.6" />
                  <line x1="0" y1="-80" x2="0" y2="80" stroke="#000" strokeWidth="2" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan: Mengapa Ada Musim? 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-rose-100 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-900 border-b-2 border-black pb-1 mb-2">Solstis (Titik Balik)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Terjadi di bulan <b>Juni</b> dan <b>Desember</b>. Pada saat ini, sumbu Bumi condong paling maksimal ke arah/menjauhi Matahari.
            </p>
            <ul className="text-xs list-disc pl-4 font-medium text-slate-700">
              <li><b>Juni:</b> Kutub Utara condong ke matahari. Belahan utara mengalami musim panas.</li>
              <li><b>Desember:</b> Kutub Selatan condong ke matahari. Belahan utara mengalami musim dingin.</li>
            </ul>
          </div>

          <div className="bg-emerald-100 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-900 border-b-2 border-black pb-1 mb-2">Ekuinoks (Hari Setara)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Terjadi di bulan <b>Maret</b> dan <b>September</b>. Sumbu bumi tidak condong ke arah maupun menjauhi matahari.
            </p>
            <p className="text-xs font-medium text-slate-700">
              Sinar matahari jatuh tepat tegak lurus di Khatulistiwa. Durasi siang dan malam hampir sama di seluruh dunia.
            </p>
          </div>

          <div className="bg-slate-200 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-slate-900 border-b-2 border-black pb-1 mb-2">Tanpa Kemiringan (0°)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              <i>Coba matikan toggle Kemiringan di panel!</i><br /><br />
              Jika sumbu Bumi tegak lurus (0°), <b>tidak akan pernah ada pergantian musim</b>. Setiap hari adalah ekuinoks.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-orange-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI MUSIM [KUIS]</h3>
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
                {score === 5 ? 'Sempurna! Anda ahli tentang musim!' : 'Bagus! Coba eksplorasi lagi simulasi musimnya.'}
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
