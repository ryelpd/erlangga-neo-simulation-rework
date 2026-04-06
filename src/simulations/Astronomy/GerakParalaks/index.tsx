import { useState, useCallback, useMemo } from 'react';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const quizData = [
  { question: '1. Apa yang dimaksud dengan Gerak Paralaks dalam Astronomi?', options: ['Perubahan ukuran bintang secara nyata', 'Perubahan posisi semu bintang karena perpindahan posisi Bumi saat mengorbit', 'Tabrakan antara dua bintang', 'Cahaya bintang yang berkedip'], answer: 1 },
  { question: '2. Semakin JAUH jarak sebuah bintang dari Bumi, maka sudut paralaksnya akan...', options: ['Semakin besar', 'Semakin kecil', 'Tetap sama', 'Menjadi negatif'], answer: 1 },
  { question: '3. Untuk mengukur paralaks bintang, astronom biasanya melakukan pengamatan dalam interval waktu berapa lama?', options: ['1 Hari', '1 Minggu', '6 Bulan (jarak orbit terjauh)', '10 Tahun'], answer: 2 },
  { question: '4. Jika sebuah bintang memiliki sudut paralaks 0.5 detik busur, berapakah jaraknya dalam parsec?', options: ['0.5 pc', '1 pc', '2 pc (karena d = 1/0.5)', '5 pc'], answer: 2 },
  { question: '5. Manakah dari objek berikut yang memiliki paralaks paling besar jika diamati dari Bumi?', options: ['Bulan (paling dekat)', 'Planet Mars', 'Bintang Alpha Centauri', 'Galaksi Andromeda'], answer: 0 },
];

function generateBackgroundStars(count: number) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: 0.5 + Math.random(),
    delay: Math.random() * 5,
  }));
}

const bgStars = generateBackgroundStars(30);

export default function GerakParalaks() {
  const [month, setMonth] = useState(0);
  const [distance, setDistance] = useState(200);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const orbitAngle = (month / 12) * Math.PI * 2;
  const ex = 80 * Math.cos(orbitAngle);
  const ey = 80 * Math.sin(orbitAngle);

  const sy = -distance;

  const dx = 0 - ex;
  const dy = sy - ey;
  const t = (-400 - ey) / dy;
  const xInf = ex + t * dx;

  const shiftScale = 50;
  const xShift = (ex / distance) * shiftScale;

  const baselineAU = 1;
  const distPc = distance / 150;
  const parallaxArcsec = baselineAU / distPc;

  const distanceLabel = distance < 200 ? 'Dekat' : distance < 350 ? 'Jauh' : 'Sangat Jauh';

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMonth(parseInt(e.target.value));
  }, []);

  const handleDistanceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDistance(parseInt(e.target.value));
  }, []);

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

  const getScoreMessage = () => {
    if (score === 5) return 'SEMPURNA! PEMAHAMAN PARALAKS ANDA SANGAT BAIK.';
    if (score >= 3) return 'CUKUP BAIK. COBA PERHATIKAN LAGI SIMULASINYA.';
    return 'YUK BACA LAGI BAGIAN PENJELASAN KONSEP DI ATAS.';
  };

  const bgStarsElements = useMemo(() => {
    return bgStars.map((star, index) => (
      <circle
        key={index}
        cx={star.x}
        cy={star.y}
        r={star.r}
        fill="#fff"
        className="animate-pulse"
        style={{ animationDelay: `${star.delay}s`, animationDuration: '3s' }}
      />
    ));
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black border-2 border-black">ASTRONOMI & GEOMETRI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: GERAK PARALAKS
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Mengukur Jarak Bintang Menggunakan Pergeseran Sudut Pandang
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30">
            PENGATURAN OBSERVASI
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-blue-800 uppercase text-sm">Bulan Observasi</span>
                <span className="font-mono font-black text-xl bg-white px-2 border-2 border-black">{MONTHS[month]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="11"
                step="1"
                value={month}
                onChange={handleMonthChange}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                <span>Jan</span>
                <span>Apr</span>
                <span>Jul</span>
                <span>Okt</span>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-rose-800 uppercase text-sm">Jarak Bintang Target</span>
                <span className="font-mono font-black text-xl bg-white px-2 border-2 border-black">{distanceLabel}</span>
              </div>
              <input
                type="range"
                min="150"
                max="400"
                step="10"
                value={distance}
                onChange={handleDistanceChange}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                <span>Dekat</span>
                <span>Sangat Jauh</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-xs mb-3 uppercase tracking-widest">DATA GEOMETRI</h4>
            <div className="flex justify-between border-b border-slate-700 pb-2 mb-2">
              <span className="text-xs font-bold uppercase text-slate-400">Sudut Paralaks (p):</span>
              <span className="font-mono font-black text-lg">{parallaxArcsec.toFixed(2)}"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Estimasi Jarak:</span>
              <span className="font-mono font-black text-lg text-emerald-400">{distPc.toFixed(2)} pc</span>
            </div>
            <div className="mt-4 text-[10px] text-slate-500 italic leading-tight">
              *pc = parsec, unit jarak standar astronomi.
            </div>
          </div>
        </div>

        <div className="bg-[#020617] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-2 z-30 uppercase">
            Orbit Bumi & Target Bintang (Tampak Atas)
          </span>

          <svg viewBox="0 0 600 500" className="w-full h-full relative z-10">
            <defs>
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g transform="translate(300, 400)">
              <circle cx="0" cy="0" r="30" fill="url(#sunGlow)" />
              <circle cx="0" cy="0" r="15" fill="#facc15" stroke="#000" strokeWidth="3" />

              <circle cx="0" cy="0" r="80" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="5 5" />

              <line x1={ex} y1={ey} x2={xInf} y2={-400} stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />

              <g transform={`translate(${ex}, ${ey})`}>
                <circle cx="0" cy="0" r="10" fill="#3b82f6" stroke="#000" strokeWidth="2" />
                <path d="M -4 -4 Q 0 -8 4 -4" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.5" />
              </g>

              <g transform={`translate(0, ${sy})`}>
                <path d="M 0 -10 L 3 -3 L 10 0 L 3 3 L 0 10 L -3 3 L -10 0 L -3 -3 Z" fill="#ffffff" stroke="#000" strokeWidth="2" />
                <text y="-20" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff" style={{ textShadow: '2px 2px 0 #000' }}>BINTANG TARGET</text>
              </g>

              <text y="-380" x="0" textAnchor="middle" fontSize="10" fontWeight="900" fill="#64748b" className="uppercase">Latar Belakang Bintang Jauh (Sangat Jauh)</text>
            </g>
          </svg>

          <div className="absolute bottom-6 right-6 w-48 h-48 bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl z-30 overflow-hidden">
            <span className="absolute top-1 left-2 text-[8px] font-black text-white uppercase bg-black px-1">Pandangan Teleskop</span>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {bgStarsElements}
              <g transform={`translate(${-xShift}, 0)`}>
                <circle cx="50" cy="50" r="4" fill="#fff" stroke="#facc15" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="1" fill="#000" />
              </g>
              <line x1="50" y1="45" x2="50" y2="55" stroke="#ef4444" strokeWidth="0.5" opacity="0.5" />
              <line x1="45" y1="50" x2="55" y2="50" stroke="#ef4444" strokeWidth="0.5" opacity="0.5" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1">
          BAGAIMANA PARALAKS BEKERJA?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-indigo-700 border-b-2 border-black pb-1 mb-2">Konsep Dasar</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Paralaks adalah perubahan posisi semu suatu objek terhadap latar belakang yang jauh ketika pengamat berpindah posisi. Dalam astronomi, "perpindahan" ini dilakukan oleh Bumi yang mengorbit Matahari. Dengan mengamati bintang yang sama setiap 6 bulan, kita mendapatkan <b>sudut pergeseran (p)</b>.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-700 border-b-2 border-black pb-1 mb-2">Hukum Kebalikan Jarak</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Coba gerakkan <i>slider</i> Jarak Bintang. Anda akan melihat bahwa <b>semakin jauh</b> sebuah bintang, maka <b>semakin kecil</b> pergeseran posisinya di teleskop. Bintang yang sangat jauh tidak tampak bergerak sama sekali (paralaks mendekati nol).
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-yellow-400 mb-4 uppercase">RUMUS JARAK BINTANG</h3>
            <p className="text-sm font-bold text-slate-300 mb-4">Jika sudut paralaks (p) diukur dalam satuan detik busur (arcseconds), maka jarak (d) dalam parsec adalah:</p>
            <div className="bg-white text-black p-4 border-4 border-yellow-400 text-3xl font-mono font-black text-center shadow-[4px_4px_0px_#f43f5e]">
              d = 1 / p
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-emerald-400 mb-2 uppercase">UNIT PARSEC</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              1 parsec (pc) adalah jarak di mana bintang akan memiliki sudut paralaks tepat 1 detik busur.
              <br /><br />
              • 1 pc ≈ 3,26 Tahun Cahaya
              <br />
              • 1 pc ≈ 31 Triliun Kilometer
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-rose-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP PARALAKS [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIndex) => (
              <div key={qIndex} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
                <h4 className="font-bold mb-3 text-sm uppercase tracking-tight">{q.question}</h4>
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
                            ? 'bg-rose-400 text-black'
                            : 'bg-white'
                          : userAnswers[qIndex] === optIndex
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!quizSubmitted && userAnswers.every((a) => a !== null) && (
              <button onClick={calculateScore} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-900 text-white font-bold py-3 px-10 text-xl w-full mt-4 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                SERAHKAN JAWABAN!
              </button>
            )}
          </div>

          {quizSubmitted && (
            <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-3xl font-black text-black mb-2 uppercase">NILAI AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">{getScoreMessage()}</p>
              <br />
              <button onClick={retryQuiz} className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-black text-white font-bold py-3 px-8 text-lg uppercase tracking-wider active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                ULANGI KUIS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}