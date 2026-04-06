import { useState } from 'react';

export default function HukumPythagoras() {
  const [sideA, setSideA] = useState(3);
  const [sideB, setSideB] = useState(4);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);

  const SCALE = 18;
  const ORIGIN_X = 250;
  const ORIGIN_Y = 350;

  const a2 = sideA * sideA;
  const b2 = sideB * sideB;
  const c2 = a2 + b2;
  const c = Math.sqrt(c2);
  const isInteger = Number.isInteger(c);

  const aPx = sideA * SCALE;
  const bPx = sideB * SCALE;
  const cPx = c * SCALE;

  const xRight = ORIGIN_X + aPx;
  const yTop = ORIGIN_Y - bPx;

  const angleRad = Math.atan2(ORIGIN_Y - yTop, xRight - ORIGIN_X);
  const angleDeg = angleRad * (180 / Math.PI);

  const midCx = (ORIGIN_X + xRight) / 2;
  const midCy = (ORIGIN_Y + yTop) / 2;
  const offsetX = Math.sin(angleRad) * 20;
  const offsetY = -Math.cos(angleRad) * 20;

  const quizData = [
    {
      question: "1. Pada segitiga siku-siku, sisi terpanjang yang terletak di depan sudut 90 derajat disebut...",
      options: ["Sisi Alas", "Hipotenusa (Sisi Miring)", "Sisi Vertikal", "Garis Singgung"],
      answer: 1
    },
    {
      question: "2. Hukum Pythagoras menyatakan bahwa...",
      options: ["a + b = c", "a² - b² = c²", "a² + b² = c²", "a × b = c"],
      answer: 2
    },
    {
      question: "3. Jika sisi alas (a) = 6 dan sisi tegak (b) = 8, berapakah panjang sisi miring (c)?",
      options: ["10", "14", "100", "12"],
      answer: 0
    },
    {
      question: "4. Manakah dari kombinasi angka berikut yang BUKAN merupakan Triple Pythagoras (hasil akar tidak bulat)?",
      options: ["3, 4, 5", "5, 12, 13", "6, 8, 10", "4, 5, 6"],
      answer: 3
    },
    {
      question: "5. Jika diketahui panjang sisi miring (c) = 13 dan sisi alas (a) = 5. Bagaimanakah rumus yang tepat untuk mencari sisi tegak (b)?",
      options: ["b = √(13² + 5²)", "b = √(13² - 5²)", "b = 13 - 5", "b = √(5² - 13²)"],
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
        
        <div className="bg-emerald-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            MATEMATIKA GEOMETRI
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-center">
            LAB VIRTUAL: HUKUM PYTHAGORAS
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black mx-auto block text-center">
            Membuktikan Hubungan Sisi-Sisi pada Segitiga Siku-Siku (a² + b² = c²)
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            <div className="bg-white border-4 border-black p-6 flex flex-col gap-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                KONTROL SISI SEGITIGA
              </label>
              
              <div className="flex flex-col gap-4 mt-2">
                <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-rose-600">Sisi Alas (a)</span>
                    <span className="font-mono font-black bg-white px-2 border-2 border-black">{sideA}</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="15"
                    value={sideA}
                    onChange={(e) => setSideA(parseInt(e.target.value))}
                    className="w-full h-2 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
                
                <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-sky-600">Sisi Tegak (b)</span>
                    <span className="font-mono font-black bg-white px-2 border-2 border-black">{sideB}</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="15"
                    value={sideB}
                    onChange={(e) => setSideB(parseInt(e.target.value))}
                    className="w-full h-2 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border-4 border-black p-6 flex flex-col items-center gap-4 text-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-white text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000] transform rotate-2">
                <h3 className="font-black uppercase text-sm">PERSAMAAN LANGSUNG</h3>
              </div>
              
              <div className="w-full bg-slate-800 p-4 border-4 border-white shadow-inner flex flex-col items-center justify-center gap-2 font-mono text-lg">
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">{sideA}²</span> 
                  <span>+</span> 
                  <span className="text-sky-400 font-bold">{sideB}²</span> 
                  <span>=</span> 
                  <span className="text-yellow-400 font-bold">c²</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-400">{a2}</span> 
                  <span>+</span> 
                  <span className="text-sky-400">{b2}</span> 
                  <span>=</span> 
                  <span className="text-yellow-400">{c2}</span>
                </div>
                <div className="w-full border-t-2 border-dashed border-slate-500 my-2"></div>
                <div className="flex items-center gap-2 text-2xl">
                  <span>c = √{c2} = </span>
                  <span className={`font-black bg-slate-700 px-2 ${isInteger ? 'text-yellow-400' : 'text-green-400'}`}>
                    {isInteger ? c : c.toFixed(2)}
                  </span>
                </div>
              </div>
              
              {isInteger && (
                <div className="w-full bg-yellow-400 p-2 text-black font-bold text-center uppercase border-2 border-white rounded">
                  ✨ TRIPLE PYTHAGORAS! ✨
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="bg-slate-200 border-4 border-black p-6 relative flex flex-col items-center justify-center min-h-[500px] overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <span className="absolute top-6 left-6 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] text-lg transform -rotate-2 z-30">
                BUKTI GEOMETRIS (LUAS PERSEGI)
              </span>

              <div className="w-full max-w-[600px] aspect-square bg-[#f8fafc] border-8 border-black shadow-[8px_8px_0px_0px_#000] relative overflow-hidden rounded-xl z-20">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                  backgroundSize: '15px 15px'
                }}></div>
                
                <svg viewBox="0 0 700 700" className="w-full h-full relative z-10 overflow-visible">
                  <g transform="translate(50, 50)">
                    
                    <rect 
                      x={ORIGIN_X - bPx}
                      y={yTop}
                      width={bPx}
                      height={bPx}
                      fill="#bae6fd"
                      stroke="#0ea5e9"
                      strokeWidth="4"
                      opacity="0.6"
                    />
                    <text 
                      x={ORIGIN_X - bPx/2}
                      y={ORIGIN_Y - bPx/2}
                      fontSize="20"
                      fontWeight="900"
                      fill="#0369a1"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {b2}
                    </text>

                    <rect 
                      x={ORIGIN_X}
                      y={ORIGIN_Y}
                      width={aPx}
                      height={aPx}
                      fill="#fecdd3"
                      stroke="#f43f5e"
                      strokeWidth="4"
                      opacity="0.6"
                    />
                    <text 
                      x={ORIGIN_X + aPx/2}
                      y={ORIGIN_Y + aPx/2}
                      fontSize="20"
                      fontWeight="900"
                      fill="#be123c"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {a2}
                    </text>

                    <g transform={`translate(${ORIGIN_X}, ${yTop}) rotate(${angleDeg})`}>
                      <rect 
                        x={0}
                        y={-cPx}
                        width={cPx}
                        height={cPx}
                        fill="#fef08a"
                        stroke="#eab308"
                        strokeWidth="4"
                        opacity="0.6"
                      />
                      <text 
                        x={cPx/2}
                        y={-cPx/2}
                        fontSize="24"
                        fontWeight="900"
                        fill="#854d0e"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {c2}
                      </text>
                    </g>

                    <polygon 
                      points={`${ORIGIN_X},${ORIGIN_Y} ${xRight},${ORIGIN_Y} ${ORIGIN_X},${yTop}`}
                      fill="#ffffff"
                      stroke="#000000"
                      strokeWidth="6"
                      strokeLinejoin="round"
                    />
                    
                    <rect 
                      x={ORIGIN_X}
                      y={ORIGIN_Y - 15}
                      width={15}
                      height={15}
                      fill="none"
                      stroke="#000000"
                      strokeWidth="3"
                    />

                    <rect x={ORIGIN_X + aPx/2 - 25} y={ORIGIN_Y + 2} width="50" height="20" fill="#fff" stroke="#000" strokeWidth="2" rx="4"/>
                    <text 
                      x={ORIGIN_X + aPx/2}
                      y={ORIGIN_Y + 12}
                      fontSize="18"
                      fontWeight="900"
                      fill="#e11d48"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      a={sideA}
                    </text>
                    
                    <rect x={ORIGIN_X - 45} y={ORIGIN_Y - bPx/2 - 10} width="50" height="20" fill="#fff" stroke="#000" strokeWidth="2" rx="4"/>
                    <text 
                      x={ORIGIN_X - 20}
                      y={ORIGIN_Y - bPx/2}
                      fontSize="18"
                      fontWeight="900"
                      fill="#0284c7"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      b={sideB}
                    </text>
                    
                    <rect x={midCx + offsetX - 25} y={midCy + offsetY - 10} width="50" height="20" fill="#fff" stroke="#000" strokeWidth="2" rx="4"/>
                    <text 
                      x={midCx + offsetX}
                      y={midCy + offsetY}
                      fontSize="18"
                      fontWeight="900"
                      fill="#ca8a04"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      c={isInteger ? c : c.toFixed(1)}
                    </text>
                    
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-100 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform -rotate-1">
            PENJELASAN KONSEP: TEOREMA PYTHAGORAS 📐
          </h3>
          
          <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/80 p-3 border-2 border-black border-dashed">
            Hukum Pythagoras berbunyi: <i>"Pada sebuah segitiga siku-siku, kuadrat panjang sisi miring (hipotenusa) selalu sama dengan jumlah kuadrat panjang dari dua sisi lainnya."</i> Aturan ini HANYA berlaku untuk segitiga yang memiliki sudut 90 derajat.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-slate-800 mb-2 border-b-4 border-black pb-1">🔲 BUKTI GEOMETRIS</h4>
              <p className="text-sm font-semibold">Simulasi di atas membuktikannya secara visual. Jika Anda membuat sebuah persegi dari panjang sisi <b>a</b> dan persegi dari sisi <b>b</b>, maka total luas kedua persegi tersebut (kotak merah muda + biru) akan <b>TEPAT SAMA (MUAT)</b> untuk mengisi luas persegi yang terbentuk dari sisi miring <b>c</b> (kotak kuning).</p>
            </div>
            
            <div className="bg-yellow-200 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-yellow-800 mb-2 border-b-4 border-black pb-1">✨ TRIPLE PYTHAGORAS</h4>
              <p className="text-sm font-semibold">Kadang kala perhitungan c = √(a² + b²) menghasilkan angka desimal. Namun ada kombinasi angka spesial di mana a, b, dan c semuanya adalah <b>bilangan bulat (tanpa koma)</b>. Ini disebut <i>Triple Pythagoras</i>. Contoh yang paling terkenal adalah kombinasi <b>3-4-5</b> dan <b>5-12-13</b>. Coba temukan di simulasi!</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-300 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_#000]">
            PAPAN RUMUS MATEMATIS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] text-center flex flex-col justify-center rounded-lg">
              <h4 className="font-black uppercase text-yellow-600 mb-2 text-sm">Mencari Sisi Miring (c)</h4>
              <div className="text-2xl font-black font-mono mt-2 bg-slate-100 p-2 border-2 border-black">c = √(a² + b²)</div>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] text-center flex flex-col justify-center rounded-lg">
              <h4 className="font-black uppercase text-rose-600 mb-2 text-sm">Mencari Sisi Alas (a)</h4>
              <div className="text-2xl font-black font-mono mt-2 bg-slate-100 p-2 border-2 border-black">a = √(c² - b²)</div>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] text-center flex flex-col justify-center rounded-lg">
              <h4 className="font-black uppercase text-sky-600 mb-2 text-sm">Mencari Sisi Tegak (b)</h4>
              <div className="text-2xl font-black font-mono mt-2 bg-slate-100 p-2 border-2 border-black">b = √(c² - a²)</div>
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
                  <h4 className="font-bold text-black mb-4 text-lg bg-emerald-200 inline-block px-2 border-2 border-black">
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
                      ? "SEMPURNA! PEMAHAMAN GEOMETRI ANDA SANGAT BAIK."
                      : score >= 3
                        ? "CUKUP BAIK. COBA PERHATIKAN LAGI RUMUSNYA."
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
    </div>
  );
}