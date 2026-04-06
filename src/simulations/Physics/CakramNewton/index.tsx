import { useState, useEffect, useRef, useCallback } from 'react';

export default function CakramNewton() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [rotationDegree, setRotationDegree] = useState(0);
  
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const quizData = [
    {
      question: "1. Eksperimen Cakram Newton bertujuan untuk membuktikan bahwa...",
      options: ["Cahaya putih tidak memiliki warna", "Cahaya putih adalah gabungan dari semua spektrum warna", "Warna hanya bisa dihasilkan oleh cat/pigmen", "Benda yang berputar akan berubah warna"],
      answer: 1
    },
    {
      question: "2. Apa nama fenomena pada mata manusia yang menyebabkan warna-warna pada cakram menyatu menjadi warna putih saat diputar cepat?",
      options: ["Dispersi Cahaya", "Pembiasan (Refraksi)", "Persistensi Penglihatan (Ketegaran Mata)", "Ilusi Optik Fatamorgana"],
      answer: 2
    },
    {
      question: "3. Berdasarkan simulasi, apa yang terjadi jika cakram hanya diputar sangat lambat?",
      options: ["Warna-warna berubah menjadi hitam", "Mata kita tetap bisa melihat warna-warnanya terpisah", "Cakram seketika terlihat putih cemerlang", "Cakram memantulkan cahaya pelangi ke ruangan"],
      answer: 1
    },
    {
      question: "4. Urutan warna spektrum cahaya tampak (pelangi) yang benar pada Cakram Newton adalah...",
      options: ["Merah, Hijau, Biru, Kuning, Hitam, Putih", "Merah, Jingga, Kuning, Hijau, Biru, Nila, Ungu", "Cyan, Magenta, Kuning, Hitam", "Ungu, Pink, Biru, Tosca, Kuning"],
      answer: 1
    },
    {
      question: "5. Mengapa pada layar komputer/HP (seperti simulasi ini), memutar roda warna terlalu cepat tanpa trik khusus justru akan membuatnya terlihat patah-patah atau berputar mundur?",
      options: ["Karena warna-warna di layar tidak asli", "Karena keterbatasan refresh rate layar monitor (misal 60Hz) yang tidak secepat mata memproses dunia nyata", "Karena komputer tidak kuat memutar objek bundar", "Karena efek gravitasi digital"],
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

  const toggleSpin = () => {
    setIsSpinning(prev => !prev);
    if (!isSpinning && speed === 0) {
      setSpeed(50);
    }
  };

  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const targetSpeed = isSpinning ? speed : 0;
    
    setCurrentSpeed(prev => {
      const diff = targetSpeed - prev;
      return prev + diff * 0.05;
    });

    setRotationDegree(prev => {
      const rotationSpeedDegPerSec = (currentSpeed / 100) * 2000;
      return prev + rotationSpeedDegPerSec * (deltaTime / 1000);
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [isSpinning, speed, currentSpeed]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const simulatedRPM = Math.round((currentSpeed / 100) * 3000);
  
  let blurOpacity = 0;
  let whiteOpacity = 0;

  if (currentSpeed > 20) {
    blurOpacity = (currentSpeed - 20) / 40;
    if (blurOpacity > 0.8) blurOpacity = 0.8;
    
    if (currentSpeed > 50) {
      whiteOpacity = (currentSpeed - 50) / 50;
      whiteOpacity *= 0.85;
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="bg-cyan-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            FISIKA OPTIK
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-center">
            LAB VIRTUAL: CAKRAM NEWTON
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black mx-auto block text-center">
            Membuktikan Cahaya Putih adalah Gabungan Spektrum Warna
          </p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max">
                Kontrol Motor Pemutar
              </label>
              
              <button 
                onClick={toggleSpin}
                className={`py-4 px-6 border-4 border-black text-center text-xl flex items-center justify-center gap-2 font-bold uppercase transition-all rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                  isSpinning 
                    ? 'bg-rose-400 text-black' 
                    : 'bg-green-400 text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <span>{isSpinning ? '⏹️' : '▶️'}</span>
                <span>{isSpinning ? 'HENTIKAN CAKRAM' : 'PUTAR CAKRAM'}</span>
              </button>
              
              <div className="mt-2 text-xs font-bold text-slate-600 p-3 border-2 border-dashed border-slate-400 bg-slate-50">
                Atur kecepatan putar menggunakan <i>slider</i> di sebelah kanan untuk melihat fenomena penggabungan warna.
              </div>
            </div>

            <div className="w-full md:w-2/3 flex flex-col gap-4">
              <div className="bg-rose-100 p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-black text-xl text-rose-600 uppercase">Kecepatan Putar (RPM)</span>
                  <span className="font-mono font-black text-2xl bg-white px-3 border-2 border-black">{simulatedRPM}</span>
                </div>
                
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:h-9 [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                
                <div className="flex justify-between text-sm font-bold uppercase text-slate-500">
                  <span>Lambat (Warna Terpisah)</span>
                  <span>Cepat (Menyatu/Putih)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-200 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
          <div className="absolute top-6 left-6 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">AREA EKSPERIMEN</h2>
          </div>

          <div className="mt-20 mb-8 w-full flex justify-center relative">
            
            <div className="absolute bottom-[-20px] w-32 h-16 bg-slate-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-t-lg"></div>
            <div className="absolute bottom-10 w-8 h-40 bg-slate-800 border-4 border-black"></div>

            <div className="relative w-64 h-64 md:w-96 md:h-96 rounded-full border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white z-10">
                
              <div 
                className="absolute inset-0 rounded-full origin-center"
                style={{
                  transform: `rotate(${rotationDegree}deg)`,
                  background: `conic-gradient(
                    #ef4444 0% 14.28%,
                    #f97316 14.28% 28.57%,
                    #eab308 28.57% 42.85%,
                    #22c55e 42.85% 57.14%,
                    #3b82f6 57.14% 71.42%,
                    #4f46e5 71.42% 85.71%,
                    #a855f7 85.71% 100%
                  )`
                }}
              ></div>
              
              <div 
                className="absolute inset-0 rounded-full bg-white pointer-events-none mix-blend-screen transition-opacity duration-100"
                style={{ opacity: blurOpacity }}
              ></div>
              
              <div 
                className="absolute inset-0 rounded-full bg-[#f8fafc] pointer-events-none transition-opacity duration-100"
                style={{ opacity: whiteOpacity }}
              ></div>

              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 border-2 border-white rounded-full shadow-inner"></div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 transform -rotate-1">
            KONSEP FISIKA: MENGAPA BISA BERUBAH PUTIH? 🌈➡️⚪
          </h3>
          <p className="text-black font-semibold text-md leading-relaxed mb-3 bg-white/60 p-3 border-2 border-black border-dashed">
            Pada abad ke-17, <b>Sir Isaac Newton</b> melakukan eksperimen menggunakan prisma kaca untuk memecah cahaya putih matahari menjadi spektrum pelangi. Untuk membuktikan sebaliknya (bahwa cahaya putih adalah gabungan warna tersebut), ia menciptakan <b>Cakram Newton</b>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-rose-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-rose-700 mb-2">👁️ Persistensi Penglihatan</h4>
              <p className="text-sm font-semibold">Mata manusia memiliki keterbatasan yang disebut <i>Persistence of Vision</i> (Ketegaran Mata). Bayangan suatu benda akan menetap di retina mata kita selama sepersekian detik (sekitar 1/16 detik) setelah benda itu hilang.</p>
            </div>
            <div className="bg-sky-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-sky-700 mb-2">🌀 Proses Penggabungan</h4>
              <p className="text-sm font-semibold text-black">Saat cakram diputar sangat cepat, warna-warna (Merah, Jingga, Kuning, Hijau, Biru, Nila, Ungu) berkelebat di depan mata lebih cepat dari kemampuan otak memprosesnya satu per satu. Akibatnya, otak "mencampur" ketujuh sinyal warna tersebut secara aditif menjadi kesan warna <b>PUTIH (atau Abu-abu terang)</b>.</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            PAPAN KONSEP & FAKTA
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="text-xl font-black text-slate-800 mb-4 border-b-4 border-black pb-2 uppercase">
                Spektrum Warna Cahaya (Dispersi)
              </h4>
              <ul className="space-y-3">
                <li 
                  className="p-2 border-2 border-black flex items-center justify-start gap-3 font-black text-xl tracking-widest text-center w-full"
                  style={{
                    background: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #4f46e5, #a855f7)',
                    color: 'white',
                    textShadow: '1px 1px 0 #000'
                  }}
                >
                  ME - JI - KU - HI - BI - NI - U
                </li>
                <li className="p-3 border-2 border-black bg-slate-50 mt-2 text-sm font-bold text-slate-700 text-center">
                  Cahaya putih adalah <i>Cahaya Polikromatik</i> (terdiri dari banyak warna). Warna-warna pelangi adalah <i>Cahaya Monokromatik</i> (warna tunggal).
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="text-xl font-black text-slate-800 mb-4 border-b-4 border-black pb-2 uppercase">
                Trik Layar Digital (Aliasing)
              </h4>
              <ul className="space-y-3">
                <li className="p-3 border-2 border-black bg-yellow-100 flex flex-col gap-2">
                  <span className="font-black text-sm uppercase">Keterbatasan Monitor (Hz)</span>
                  <span className="text-xs font-semibold text-slate-700">Layar komputer/HP biasanya hanya melakukan <i>refresh</i> 60 kali per detik (60Hz). Jika objek di layar berputar lebih cepat dari itu, roda akan terlihat patah-patah atau berputar mundur (Efek Roda Kereta / <i>Wagon-wheel effect</i>).</span>
                </li>
                <li className="p-3 border-2 border-black bg-cyan-100 flex flex-col gap-2">
                  <span className="font-black text-sm uppercase">Ilusi pada Simulasi Ini</span>
                  <span className="text-xs font-semibold text-slate-700">Untuk memberikan efek edukasi yang benar, saat <i>slider</i> kecepatan maksimal, simulasi ini memprogram warna agar perlahan pudar (<i>fade</i>) menjadi putih mereplikasi apa yang terjadi di dunia nyata pada mata Anda.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-indigo-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transform rotate-1 mb-6 rounded-lg">
            <h3 className="text-2xl font-black uppercase tracking-widest text-center">
              EVALUASI KONSEP [KUIS]
            </h3>
          </div>
          
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <div className="space-y-6">
              {quizData.map((q, qIndex) => (
                <div key={qIndex} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                  <h4 className="font-bold text-black mb-4 text-lg bg-white inline-block px-2 border-2 border-black">
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
                              : 'bg-white text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
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
                <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                  <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
                  <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                    {score === 5
                      ? "SEMPURNA! PEMAHAMANMU TENTANG SPEKTRUM CAHAYA SANGAT BAIK."
                      : score >= 3
                        ? "CUKUP BAIK. COBA BACA LAGI BAGIAN TRIK LAYAR DIGITAL."
                        : "YUK BACA LAGI BAGIAN KONSEP FISIKA DI ATAS."}
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
    </div>
  );
}