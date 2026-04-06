import { useState, useRef, useCallback, useEffect } from 'react';

interface WaveData {
  t0: number;
  back: boolean;
}

const quizData = [
  { question: '1. Mengapa dalam rumus sonar, hasil perkalian v dan t harus dibagi 2?', options: ['Karena kecepatan bunyi berkurang', 'Karena bunyi menempuh jarak bolak-balik', 'Agar hasilnya lebih kecil', 'Hanya aturan matematika'], answer: 1 },
  { question: '2. Manakah medium yang merambatkan bunyi paling cepat?', options: ['Udara hampa', 'Udara (Gas)', 'Air (Zat Cair)', 'Baja (Zat Padat)'], answer: 3 },
  { question: '3. Jika waktu pantul sonar di air adalah 2 detik (v=1500), berapakah kedalaman lautnya?', options: ['3000 m', '1500 m', '750 m', '500 m'], answer: 1 },
  { question: '4. Fenomena pemantulan bunyi yang terdengar SETELAH bunyi asli selesai disebut...', options: ['Gaung', 'Gema', 'Resonansi', 'Disonansi'], answer: 1 },
  { question: '5. Alat Sonar biasanya digunakan oleh kapal untuk mendeteksi...', options: ['Suhu udara', 'Kecepatan angin', 'Kedalaman laut dan objek bawah air', 'Tekanan atmosfer'], answer: 2 },
];

const PIXELS_PER_METER = 0.5;

export default function GelombangEcho() {
  const [isAir, setIsAir] = useState(true);
  const [targetDistance, setTargetDistance] = useState(170);
  const [isPinging, setIsPinging] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const wavesRef = useRef<WaveData[]>([]);
  const startTimeRef = useRef(0);
  const animationRef = useRef<number>(0);
  const waveCountRef = useRef(0);

  const soundSpeed = isAir ? 340 : 1500;
  const roundTripTime = (2 * targetDistance) / soundSpeed;
  const visualY = 50 + targetDistance * PIXELS_PER_METER * 1.1;

  const hitTime = targetDistance / soundSpeed;

  const animate = useCallback(
    (timestamp: number) => {
      if (isPinging) {
        const elapsed = (timestamp - startTimeRef.current) / 1000;
        setElapsedTime(elapsed);

        if (Math.floor(elapsed * 20) > waveCountRef.current && elapsed < roundTripTime) {
          const isBack = elapsed > hitTime;
          wavesRef.current.push({ t0: elapsed, back: isBack });
          waveCountRef.current++;
        }

        if (elapsed >= roundTripTime) {
          setIsPinging(false);
          setFinalTime(roundTripTime);
          waveCountRef.current = 0;
          wavesRef.current = [];
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [isPinging, roundTripTime, hitTime]
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  const handlePing = useCallback(() => {
    if (isPinging) return;
    setIsPinging(true);
    setFinalTime(null);
    setElapsedTime(0);
    startTimeRef.current = performance.now();
    wavesRef.current = [];
    waveCountRef.current = 0;
  }, [isPinging]);

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
    if (score === 5) return 'LUAR BIASA! KAMU AHLI AKUSTIK!';
    if (score >= 3) return 'BAGUS! COBA PELAJARI PRINSIP PEMANTULAN LAGI.';
    return 'YUK PELAJARI LAGI KONSEP GEMA DAN SONAR.';
  };

  const displayTime = finalTime !== null ? finalTime : elapsedTime;

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black border-2 border-black">FISIKA BUNYI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: GEMA & SONAR
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Mengukur Jarak Menggunakan Pemantulan Gelombang Bunyi (Echo)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30 uppercase">
            Konfigurasi Alat
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="flex flex-col gap-2">
              <label className="font-black text-xs uppercase text-slate-500">Pilih Medium:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAir(true)}
                  className={`flex-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-3 text-xs font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${isAir ? 'bg-emerald-400 ring-4 ring-black' : 'bg-slate-100 text-slate-500'}`}
                >
                  Udara (340 m/s)
                </button>
                <button
                  onClick={() => setIsAir(false)}
                  className={`flex-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-3 text-xs font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${!isAir ? 'bg-emerald-400 ring-4 ring-black' : 'bg-slate-100 text-slate-500'}`}
                >
                  Air (1500 m/s)
                </button>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-rose-800 uppercase text-[10px]">Jarak Target (s)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{targetDistance}</span>
              </div>
              <input
                type="range"
                min="50"
                max="750"
                step="10"
                value={targetDistance}
                onChange={(e) => setTargetDistance(parseInt(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <span className="text-[8px] font-bold text-slate-500 uppercase">Satuan: meter</span>
            </div>

            <button
              onClick={handlePing}
              disabled={isPinging}
              className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-4 text-xl flex items-center justify-center gap-3 font-bold active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${isPinging ? 'bg-slate-300' : 'bg-yellow-400 hover:bg-yellow-300'}`}
            >
              KIRIM PING (SONAR)
            </button>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest text-center">DATA PENGUKURAN</h4>
            <div className="grid grid-cols-1 gap-3 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Waktu Tempuh (t):</span>
                <span className="text-sky-400 font-bold">{isPinging ? 'MENGUKUR...' : finalTime !== null ? `${finalTime.toFixed(3)} s` : '0.000 s'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Kecepatan Bunyi (v):</span>
                <span className="text-emerald-400 font-bold">{soundSpeed} m/s</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-white font-bold">Hasil Kalkulasi Jarak:</span>
                <span className="text-yellow-400 font-black text-lg">{finalTime !== null ? `${targetDistance} m` : '...'}</span>
              </div>
            </div>
            <div className="mt-4 p-2 bg-slate-800 border-2 border-dashed border-slate-600 text-center">
              <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Rumus:</div>
              <div className="text-[14px] font-black text-white leading-tight">s = (v x t) / 2</div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-2 z-30 uppercase">
            Radar Visualisasi
          </span>

          <div className="w-full h-full relative z-10">
            <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
              <rect x="0" y="0" width="800" height="500" fill={isAir ? '#f1f5f9' : '#0ea5e9'} />

              <g opacity="0.1">
                <line x1="0" y1="100" x2="800" y2="100" stroke="#000" />
                <line x1="0" y1="200" x2="800" y2="200" stroke="#000" />
                <line x1="0" y1="300" x2="800" y2="300" stroke="#000" />
                <line x1="0" y1="400" x2="800" y2="400" stroke="#000" />
              </g>

              <g>
                {wavesRef.current.map((wave, i) => {
                  const localT = elapsedTime - wave.t0;
                  const vVisual = isAir ? 150 : 400;
                  const r = localT * vVisual;
                  const opacity = Math.max(0, 1 - r / 600);
                  return (
                    <circle
                      key={i}
                      cx="400"
                      cy={wave.back ? visualY : 50}
                      r={r}
                      fill="none"
                      stroke={wave.back ? '#f43f5e' : '#000'}
                      strokeWidth="4"
                      strokeDasharray={wave.back ? '5 5' : 'none'}
                      opacity={opacity}
                    />
                  );
                })}
              </g>

              <g transform="translate(400, 50)">
                <rect x="-40" y="-20" width="80" height="40" fill="#334155" stroke="#000" strokeWidth="4" />
                <rect x="-20" y="-40" width="40" height="20" fill="#475569" stroke="#000" strokeWidth="4" />
                <circle cx="0" cy="20" r="10" fill="#facc15" />
                <text y="45" textAnchor="middle" fontWeight="900" fontSize="12" fill="#000">
                  {isAir ? 'SPEAKER' : 'KAPAL SONAR'}
                </text>
              </g>

              <g transform={`translate(400, ${visualY})`}>
                <rect x="-400" y="0" width="800" height="100" fill={isAir ? '#92400e' : '#1e293b'} stroke="#000" strokeWidth="4" />
                <text x="0" y="40" textAnchor="middle" fontWeight="900" fontSize="20" fill="#fff" style={{ textShadow: '2px 2px 0 #000' }}>
                  {isAir ? 'DINDING PANTUL' : 'DASAR LAUT'}
                </text>
              </g>
            </svg>
          </div>

          <div className="absolute top-6 right-6 bg-black text-white p-3 border-4 border-white shadow-[4px_4px_0px_#000] font-mono text-2xl">{displayTime.toFixed(3)}s</div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase">
          BAGAIMANA GEMA (ECHO) BEKERJA?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Prinsip Sonar</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Gelombang bunyi dikirimkan ke suatu arah. Ketika menabrak penghalang, gelombang tersebut <b>memantul kembali</b> ke sumbernya. Dengan mengetahui kecepatan bunyi (v) dan waktu tempuh (t), kita bisa tahu seberapa jauh benda tersebut.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Kenapa Dibagi Dua?</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Waktu (t) yang diukur sensor adalah waktu <b>bolak-balik</b> (dari kapal ke dasar lalu kembali ke kapal). Karena kita hanya butuh jarak satu arah saja, maka hasil perkalian kecepatan dan waktu harus dibagi 2.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI GELOMBANG PANTUL [KUIS]</h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
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
                            ? 'bg-red-400 text-black'
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
                KIRIM JAWABAN!
              </button>
            )}
          </div>

          {quizSubmitted && (
            <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR: {score} / 5</h4>
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