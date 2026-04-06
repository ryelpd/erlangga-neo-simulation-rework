import { useState, useEffect, useRef } from 'react';

export default function JamMatahari() {
  const [time, setTime] = useState(12);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);

  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const CX = 350;
  const CY = 350;
  const ORBIT_R = 250;
  const DIAL_R = 190;

  const hours = Math.floor(time);
  const mins = Math.round((time - hours) * 60);
  const timeDisplay = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

  const sunAngleDeg = (time - 6) * 15;
  const sunAngleRad = sunAngleDeg * (Math.PI / 180);

  const sunX = CX + ORBIT_R * Math.cos(sunAngleRad);
  const sunY = CY + ORBIT_R * Math.sin(sunAngleRad);

  const shadowAngleRad = sunAngleRad + Math.PI;

  const altRatio = 1 - Math.abs(time - 12) / 6;
  let shadowLen: number;
  if (altRatio < 0.1) {
    shadowLen = DIAL_R * 1.5;
  } else {
    shadowLen = 40 + (1 - altRatio) * (DIAL_R - 40) * 1.5;
  }
  shadowLen = Math.min(shadowLen, DIAL_R + 50);

  const shadowX = CX + shadowLen * Math.cos(shadowAngleRad);
  const shadowY = CY + shadowLen * Math.sin(shadowAngleRad);

  const baseW = 8;
  const bx1 = CX + baseW * Math.cos(shadowAngleRad + Math.PI / 2);
  const by1 = CY + baseW * Math.sin(shadowAngleRad + Math.PI / 2);
  const bx2 = CX + baseW * Math.cos(shadowAngleRad - Math.PI / 2);
  const by2 = CY + baseW * Math.sin(shadowAngleRad - Math.PI / 2);

  const sunDir = time < 9 ? "Timur" : time < 11.5 ? "Tenggara" : time <= 12.5 ? "Selatan (Puncak)" : time <= 15 ? "Barat Daya" : "Barat";
  const shadowDir = time < 9 ? "Barat" : time < 11.5 ? "Barat Laut" : time <= 12.5 ? "Utara" : time <= 15 ? "Timur Laut" : "Timur";
  const shadowLenText = time < 9 || time > 15 ? "Sangat Panjang" : time < 11.5 || time > 12.5 ? "Sedang" : "Paling Pendek";

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setTime(prev => {
          const val = prev + 0.1;
          return val > 18 ? 6 : val;
        });
      }, 50);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying]);

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const quizData = [
    {
      question: "1. Pada Pukul 06:00 pagi (Matahari Terbit di Timur), ke arah manakah bayangan jam matahari akan menunjuk?",
      options: ["Utara", "Timur", "Barat", "Selatan"],
      answer: 2
    },
    {
      question: "2. Mengapa panjang bayangan pada jam matahari berubah-ubah dari panjang menjadi pendek, lalu panjang lagi?",
      options: ["Karena matahari membesar dan mengecil", "Karena ketinggian (sudut elevasi) matahari di langit berubah sepanjang hari", "Karena tiang gnomonnya bisa memanjang sendiri", "Karena pergerakan bulan"],
      answer: 1
    },
    {
      question: "3. Kapan bayangan yang dihasilkan oleh tiang gnomon menjadi PALING PENDEK?",
      options: ["Saat Matahari terbit (06:00)", "Saat Matahari tepat berada di puncak langit (12:00 Siang)", "Saat Matahari terbenam (18:00)", "Saat tengah malam"],
      answer: 1
    },
    {
      question: "4. Apakah kelemahan terbesar menggunakan Jam Matahari dibandingkan Jam Digital modern?",
      options: ["Baterainya cepat habis", "Suaranya berisik", "Tidak dapat digunakan saat malam hari atau cuaca mendung", "Harganya sangat mahal"],
      answer: 2
    },
    {
      question: "5. Sebenarnya, pergerakan harian matahari yang kita lihat dari Timur ke Barat adalah akibat dari...",
      options: ["Matahari yang mengelilingi Bumi", "Rotasi Bumi pada porosnya", "Angin yang meniup awan", "Gravitasi dari planet Mars"],
      answer: 1
    }
  ];

  const selectAnswer = (qIndex: number, optIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIndex] = optIndex;
    setUserAnswers(newAnswers);
  };

  const getScore = (): number => {
    return userAnswers.reduce<number>((score, ans, idx) =>
      ans === quizData[idx].answer ? score + 1 : score, 0
    );
  };

  const resetQuiz = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-sky-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            FISIKA ASTRONOMI
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-center">
            LAB VIRTUAL: JAM MATAHARI
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black mx-auto block text-center">
            Mempelajari Rotasi Bumi dan Pembentukan Bayangan Berdasarkan Waktu
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            <div className="bg-white border-4 border-black p-6 flex flex-col gap-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                KONTROL WAKTU SIMULASI
              </label>
              
              <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 mt-2 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-yellow-700">Waktu Matahari</span>
                  <span className="font-mono font-black text-2xl bg-white px-3 border-2 border-black">{timeDisplay}</span>
                </div>
                
                <input 
                  type="range"
                  min="6"
                  max="18"
                  step="0.25"
                  value={time}
                  onChange={(e) => {
                    setIsAutoPlaying(false);
                    setTime(parseFloat(e.target.value));
                  }}
                  className="w-full h-2 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                  <span>☀️ Terbit (Timur)</span>
                  <span>Terbenam (Barat) 🌙</span>
                </div>
              </div>

              <button 
                onClick={toggleAutoPlay}
                className={`py-3 border-4 border-black text-center text-sm w-full mt-2 font-bold uppercase transition-all rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  isAutoPlaying 
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
                    : 'bg-emerald-400 text-black hover:bg-emerald-300'
                }`}
              >
                {isAutoPlaying ? '⏸️ JEDA OTOMATIS' : '▶️ PUTAR OTOMATIS'}
              </button>
            </div>

            <div className="bg-slate-900 border-4 border-black p-6 flex flex-col items-center gap-4 text-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-white text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000] transform rotate-2">
                <h3 className="font-black uppercase text-sm">TELEMETRI BAYANGAN</h3>
              </div>
              
              <div className="w-full bg-slate-800 p-4 border-4 border-white shadow-inner flex flex-col gap-3 font-mono text-sm">
                <div className="flex justify-between border-b-2 border-slate-600 pb-1">
                  <span className="text-slate-400">Arah Matahari:</span>
                  <span className="font-bold text-yellow-400">{sunDir}</span>
                </div>
                <div className="flex justify-between border-b-2 border-slate-600 pb-1">
                  <span className="text-slate-400">Arah Bayangan:</span>
                  <span className="font-bold text-slate-100">{shadowDir}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Panjang Bayangan:</span>
                  <span className="font-bold text-rose-400">{shadowLenText}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="bg-sky-100 border-4 border-black p-6 relative flex flex-col items-center justify-center min-h-[500px] overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <span className="absolute top-6 left-6 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] text-lg transform -rotate-2 z-30">
                SIMULASI TATA SURYA (TOP-DOWN)
              </span>

              <div className="absolute top-6 right-6 z-30 bg-white p-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-full w-16 h-16 flex items-center justify-center font-black text-xl">
                <div className="absolute -top-1">U</div>
                <div className="absolute -right-1">T</div>
                <div className="absolute -bottom-1">S</div>
                <div className="absolute -left-1">B</div>
                <div className="w-2 h-2 bg-black rounded-full"></div>
              </div>

              <div className="w-full max-w-[700px] aspect-square bg-[#f8fafc] border-8 border-black shadow-[8px_8px_0px_0px_#000] relative overflow-hidden rounded-full z-20 mt-8">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>
                
                <svg viewBox="0 0 700 700" className="w-full h-full relative z-10 overflow-visible">
                    
                  <circle cx="350" cy="350" r="200" fill="#e2e8f0" stroke="#0f172a" strokeWidth="8" />
                  <circle cx="350" cy="350" r="180" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="10 5" />
                  
                  <g>
                    <text x="140" y="355" fontSize="18" fontWeight="900" fill="#0f172a" textAnchor="middle">VI</text>
                    <text x="200" y="210" fontSize="18" fontWeight="900" fill="#0f172a" textAnchor="middle">IX</text>
                    <text x="350" y="140" fontSize="20" fontWeight="900" fill="#ef4444" textAnchor="middle">XII</text>
                    <text x="500" y="210" fontSize="18" fontWeight="900" fill="#0f172a" textAnchor="middle">III</text>
                    <text x="560" y="355" fontSize="18" fontWeight="900" fill="#0f172a" textAnchor="middle">VI</text>
                    
                    <line x1="150" y1="350" x2="170" y2="350" stroke="#000" strokeWidth="4"/>
                    <line x1="550" y1="350" x2="530" y2="350" stroke="#000" strokeWidth="4"/>
                    <line x1="350" y1="150" x2="350" y2="170" stroke="#ef4444" strokeWidth="6"/>
                    <line x1="208" y1="208" x2="222" y2="222" stroke="#000" strokeWidth="4"/>
                    <line x1="492" y1="208" x2="478" y2="222" stroke="#000" strokeWidth="4"/>
                  </g>

                  <polygon points={`${bx1},${by1} ${shadowX},${shadowY} ${bx2},${by2}`} fill="#334155" opacity="0.8" />

                  <circle cx="350" cy="350" r="10" fill="#ef4444" stroke="#000" strokeWidth="4" />
                  <circle cx="350" cy="350" r="4" fill="#000" />
                  
                  <path d="M 600 350 A 250 250 0 0 1 100 350" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="8 8" opacity="0.5"/>

                  <g transform={`translate(${sunX}, ${sunY})`}>
                    <circle cx="0" cy="0" r="30" fill="#facc15" stroke="#000" strokeWidth="4" className="sun-glow"/>
                    <path d="M 0 -35 L 0 -45 M 0 35 L 0 45 M 35 0 L 45 0 M -35 0 L -45 0" stroke="#facc15" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M 25 25 L 32 32 M -25 -25 L -32 -32 M 25 -25 L 32 -32 M -25 25 L -32 32" stroke="#facc15" strokeWidth="4" strokeLinecap="round"/>
                    <line 
                      x1="0" 
                      y1="0" 
                      x2={-ORBIT_R * Math.cos(sunAngleRad)} 
                      y2={-ORBIT_R * Math.sin(sunAngleRad)} 
                      stroke="#facc15" 
                      strokeWidth="4" 
                      opacity="0.3" 
                      strokeDasharray="10 5"
                    />
                  </g>

                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-100 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform -rotate-1">
            PENJELASAN KONSEP: CARA KERJA JAM MATAHARI ⏳
          </h3>
          
          <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/80 p-3 border-2 border-black border-dashed">
            Jam Matahari (Sundial) adalah instrumen penunjuk waktu kuno yang memanfaatkan <b>rotasi Bumi</b>. Meskipun seolah-olah Matahari yang bergerak mengelilingi kita dari Timur ke Barat, sebenarnya Bumi-lah yang berputar pada porosnya.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-slate-800 mb-2 border-b-4 border-black pb-1">🧭 ARAH BAYANGAN</h4>
              <p className="text-sm font-semibold">Gnomon (tiang jam) menghalangi cahaya matahari sehingga menciptakan bayangan. Karena cahaya merambat lurus, bayangan selalu jatuh ke <b>arah yang BERLAWANAN</b> dengan posisi matahari. Saat matahari terbit di Timur (pagi), bayangan akan jatuh ke arah Barat.</p>
            </div>
            
            <div className="bg-yellow-200 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-yellow-800 mb-2 border-b-4 border-black pb-1">📏 PANJANG BAYANGAN</h4>
              <p className="text-sm font-semibold">Panjang bayangan ditentukan oleh <b>Sudut Elevasi (Ketinggian) Matahari</b>. Saat pagi dan sore hari, matahari berada di sudut yang rendah (dekat horizon), sehingga bayangan menjadi <b>SANGAT PANJANG</b>. Saat siang hari (Pukul 12:00), matahari berada di titik tertingginya, sehingga bayangan menjadi <b>PALING PENDEK</b>.</p>
            </div>
          </div>
        </div>

        <div className="bg-fuchsia-300 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6 rounded-lg">
            <h3 className="text-2xl font-black uppercase tracking-widest text-center">
              EVALUASI KONSEP [KUIS]
            </h3>
          </div>
          
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] rounded-lg">
            <div className="space-y-6">
              {quizData.map((q, qIndex) => (
                <div key={qIndex} className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg">
                  <h4 className="font-bold text-black mb-4 text-lg bg-sky-200 inline-block px-2 border-2 border-black">
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                        disabled={quizSubmitted}
                        className={`text-left px-4 py-3 border-4 border-black font-bold transition-all rounded-lg ${
                          quizSubmitted
                            ? optIndex === q.answer
                              ? 'bg-green-400 text-black'
                              : userAnswers[qIndex] === optIndex
                                ? 'bg-rose-400 text-black line-through'
                                : 'bg-white opacity-50'
                            : userAnswers[qIndex] === optIndex
                              ? 'bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-slate-100 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
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

              {!quizSubmitted && userAnswers.every(a => a !== null) && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="bg-slate-900 text-white font-bold py-3 px-10 text-xl uppercase tracking-widest border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg"
                  >
                    KIRIM JAWABAN!
                  </button>
                </div>
              )}
            </div>

            {quizSubmitted && (() => {
              const score = getScore();
              return (
                <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg">
                  <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
                  <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                    {score === 5
                      ? "SEMPURNA! PEMAHAMAN ASTRONOMI ANDA SANGAT BAIK."
                      : score >= 3
                        ? "CUKUP BAIK. COBA PERHATIKAN ARAH BAYANGAN DI SIMULASI."
                        : "YUK BACA LAGI BAGIAN PENJELASAN KONSEP DI ATAS."}
                  </p>
                  <br />
                  <button
                    onClick={resetQuiz}
                    className="bg-black text-white py-3 px-8 text-lg uppercase tracking-wider font-bold border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg"
                  >
                    ULANGI KUIS
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      <style>{`
        .sun-glow {
          animation: sunPulse 2s infinite alternate;
        }
        @keyframes sunPulse {
          0% { filter: drop-shadow(0 0 10px #facc15); }
          100% { filter: drop-shadow(0 0 25px #f97316); }
        }
      `}</style>
    </div>
  );
}