import { useState } from 'react';

export default function CahayaDanPigmen() {
  const [mode, setMode] = useState<'LIGHT' | 'PIGMENT'>('LIGHT');
  const [rgb, setRgb] = useState({ r: 255, g: 255, b: 255 });
  const [cmy, setCmy] = useState({ c: 100, m: 100, y: 100 });
  
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);

  const quizData = [
    {
      question: "1. Layar smartphone Anda menggunakan prinsip pencampuran warna apa?",
      options: ["Subtraktif (Pigmen)", "Aditif (Cahaya RGB)", "Pewarnaan Kimia", "Hanya Hitam dan Putih"],
      answer: 1
    },
    {
      question: "2. Pada mode Cahaya (Aditif), jika Anda mencampurkan 100% Cahaya Merah dan 100% Cahaya Hijau di ruang gelap, warna apa yang terbentuk di tengah?",
      options: ["Biru", "Cyan", "Kuning", "Hitam"],
      answer: 2
    },
    {
      question: "3. Saat Anda menge-print gambar di atas kertas putih, tinta apa saja (warna primer subtraktif) yang digunakan printer tersebut?",
      options: ["Merah, Hijau, Biru", "Hitam dan Putih", "Cyan, Magenta, Kuning (CMY)", "Ungu, Oranye, Hijau"],
      answer: 2
    },
    {
      question: "4. Perhatikan mode Pigmen Tinta! Jika Anda mencampur cat Cyan (100%) dan Kuning (100%), warna sekunder apa yang dihasilkan?",
      options: ["Merah", "Hijau", "Biru Tua", "Putih"],
      answer: 1
    },
    {
      question: "5. Mengapa pencampuran semua warna primer pada cat/pigmen menghasilkan warna Hitam (Gelap), sedangkan pada cahaya menghasilkan warna Putih?",
      options: [
        "Karena cat memantulkan semua cahaya, sedangkan lampu menyerapnya.",
        "Karena pigmen cat menyerap (mengurangi) pantulan cahaya, sedangkan lampu memancarkan dan menambahkan spektrum cahaya.",
        "Karena cat terbuat dari bahan kimia yang rusak jika dicampur.",
        "Keduanya salah, pencampuran keduanya sama-sama menghasilkan warna abu-abu."
      ],
      answer: 1
    }
  ];

  const updateRgb = (channel: 'r' | 'g' | 'b', value: number) => {
    setRgb(prev => ({ ...prev, [channel]: value }));
  };

  const updateCmy = (channel: 'c' | 'm' | 'y', value: number) => {
    setCmy(prev => ({ ...prev, [channel]: value }));
  };

  const selectAnswer = (qIndex: number, optIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIndex] = optIndex;
    setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const getScore = (): number => {
    return userAnswers.reduce<number>((score, ans, idx) => 
      ans === quizData[idx].answer ? score + 1 : score, 0
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="bg-fuchsia-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            FISIKA SMP/SMA
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-center">
            LAB VIRTUAL: OPTIKA & WARNA
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black mx-auto block text-center">
            Pencampuran Cahaya (Aditif) vs Pigmen Tinta (Subtraktif)
          </p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            
            <div className="w-full md:w-1/3 flex flex-col gap-3">
              <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max">
                Pilih Mode Percobaan
              </label>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setMode('LIGHT')}
                  className={`py-3 px-4 border-4 border-black text-center font-bold uppercase transition-all rounded-lg ${
                    mode === 'LIGHT' 
                      ? 'bg-slate-900 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-slate-100 text-slate-500 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  💡 CAHAYA (RGB)
                </button>
                <button 
                  onClick={() => setMode('PIGMENT')}
                  className={`py-3 px-4 border-4 border-black text-center font-bold uppercase transition-all rounded-lg ${
                    mode === 'PIGMENT' 
                      ? 'bg-white text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-slate-100 text-slate-500 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  🎨 PIGMEN TINTA (CMY)
                </button>
              </div>
              
              <div className="mt-2 text-sm font-bold text-slate-600 p-2 border-2 border-dashed border-slate-400 bg-slate-50">
                {mode === 'LIGHT' 
                  ? "Pencampuran pancaran cahaya di ruangan gelap (layar monitor)."
                  : "Pencampuran tinta atau cat di atas kertas putih (menyerap cahaya)."}
              </div>
            </div>

            <div className="w-full md:w-2/3">
              {mode === 'LIGHT' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-red-100 p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                    <span className="font-black text-red-600 w-24">MERAH</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="255" 
                      value={rgb.r}
                      onChange={(e) => updateRgb('r', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <span className="font-mono font-bold w-12 text-right">{rgb.r}</span>
                  </div>
                  <div className="flex items-center gap-4 bg-green-100 p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                    <span className="font-black text-green-600 w-24">HIJAU</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="255" 
                      value={rgb.g}
                      onChange={(e) => updateRgb('g', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <span className="font-mono font-bold w-12 text-right">{rgb.g}</span>
                  </div>
                  <div className="flex items-center gap-4 bg-blue-100 p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                    <span className="font-black text-blue-600 w-24">BIRU</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="255" 
                      value={rgb.b}
                      onChange={(e) => updateRgb('b', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <span className="font-mono font-bold w-12 text-right">{rgb.b}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-cyan-100 p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                    <span className="font-black text-cyan-600 w-24">CYAN</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={cmy.c}
                      onChange={(e) => updateCmy('c', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <span className="font-mono font-bold w-16 text-right">{cmy.c}%</span>
                  </div>
                  <div className="flex items-center gap-4 bg-pink-100 p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                    <span className="font-black text-pink-600 w-24">MAGENTA</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={cmy.m}
                      onChange={(e) => updateCmy('m', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <span className="font-mono font-bold w-16 text-right">{cmy.m}%</span>
                  </div>
                  <div className="flex items-center gap-4 bg-yellow-100 p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                    <span className="font-black text-yellow-600 w-24">KUNING</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={cmy.y}
                      onChange={(e) => updateCmy('y', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <span className="font-mono font-bold w-16 text-right">{cmy.y}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-200 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
          <div className="absolute top-6 left-6 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">HASIL PENCAMPURAN (VENN DIAGRAM)</h2>
          </div>

          <div className={`mt-20 w-full max-w-[450px] aspect-square border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden transition-colors duration-500 rounded-xl mx-auto ${
            mode === 'LIGHT' ? 'bg-black' : 'bg-white'
          }`}>
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
            
            {mode === 'LIGHT' ? (
              <>
                <div 
                  className="absolute w-[55%] h-[55%] rounded-full top-[10%] left-[15%]"
                  style={{
                    backgroundColor: `rgb(${rgb.r}, 0, 0)`,
                    mixBlendMode: 'screen'
                  }}
                ></div>
                <div 
                  className="absolute w-[55%] h-[55%] rounded-full top-[10%] right-[15%]"
                  style={{
                    backgroundColor: `rgb(0, ${rgb.g}, 0)`,
                    mixBlendMode: 'screen'
                  }}
                ></div>
                <div 
                  className="absolute w-[55%] h-[55%] rounded-full bottom-[10%] left-1/2 transform -translate-x-1/2"
                  style={{
                    backgroundColor: `rgb(0, 0, ${rgb.b})`,
                    mixBlendMode: 'screen'
                  }}
                ></div>
              </>
            ) : (
              <>
                <div 
                  className="absolute w-[55%] h-[55%] rounded-full top-[10%] left-[15%]"
                  style={{
                    backgroundColor: `rgb(${Math.round(255 * (1 - cmy.c / 100))}, 255, 255)`,
                    mixBlendMode: 'multiply'
                  }}
                ></div>
                <div 
                  className="absolute w-[55%] h-[55%] rounded-full top-[10%] right-[15%]"
                  style={{
                    backgroundColor: `rgb(255, ${Math.round(255 * (1 - cmy.m / 100))}, 255)`,
                    mixBlendMode: 'multiply'
                  }}
                ></div>
                <div 
                  className="absolute w-[55%] h-[55%] rounded-full bottom-[10%] left-1/2 transform -translate-x-1/2"
                  style={{
                    backgroundColor: `rgb(255, 255, ${Math.round(255 * (1 - cmy.y / 100))})`,
                    mixBlendMode: 'multiply'
                  }}
                ></div>
              </>
            )}
          </div>
        </div>

        <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 transform -rotate-1">
            KONSEP FISIKA: ADITIF vs SUBTRAKTIF 🌈
          </h3>
          <p className="text-black font-semibold text-md leading-relaxed mb-3 bg-white/60 p-3 border-2 border-black border-dashed">
            Mata manusia memiliki reseptor cahaya (sel kerucut) yang sensitif terhadap <b>Merah, Hijau, dan Biru (RGB)</b>. Jika ada dua cara berbeda dalam menciptakan warna yang kita lihat:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-slate-900 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white rounded-lg">
              <h4 className="font-black uppercase text-yellow-300 mb-2">💡 PENCAMPURAN ADITIF (CAHAYA)</h4>
              <p className="text-sm font-semibold">Digunakan oleh layar TV, Monitor, dan Proyektor. Dimulai dari kegelapan (hitam). Saat warna primer cahaya (Red, Green, Blue) ditambahkan dan dicampur semua, hasilnya akan menjadi <b>PUTIH</b> (gabungan seluruh spektrum cahaya).</p>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-rose-600 mb-2">🎨 PENCAMPURAN SUBTRAKTIF (PIGMEN)</h4>
              <p className="text-sm font-semibold text-black">Digunakan pada Cat, Tinta, dan Printer. Dimulai dari kertas putih (memantulkan semua cahaya). Pigmen <i>menyerap (mengurangi)</i> cahaya. Semakin banyak pigmen (Cyan, Magenta, Yellow) dicampur, warnanya menjadi semakin <b>GELAP / HITAM</b>.</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            RUMUS PENCAMPURAN WARNA
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="text-xl font-black text-slate-800 mb-4 border-b-4 border-black pb-2 uppercase">
                Cahaya (RGB)
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-yellow-100 flex items-center justify-between rounded">
                  <span className="font-bold">Merah + Hijau</span> <span className="font-black text-xl">= KUNING</span>
                </li>
                <li className="p-3 border-2 border-black bg-pink-100 flex items-center justify-between rounded">
                  <span className="font-bold">Merah + Biru</span> <span className="font-black text-xl text-fuchsia-600">= MAGENTA</span>
                </li>
                <li className="p-3 border-2 border-black bg-cyan-100 flex items-center justify-between rounded">
                  <span className="font-bold">Hijau + Biru</span> <span className="font-black text-xl text-cyan-600">= CYAN</span>
                </li>
                <li className="p-3 border-4 border-black bg-white flex items-center justify-between mt-4 rounded">
                  <span className="font-bold">R + G + B</span> <span className="font-black text-xl border-2 border-black px-2">PUTIH</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="text-xl font-black text-slate-800 mb-4 border-b-4 border-black pb-2 uppercase">
                Pigmen Tinta (CMY)
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-blue-100 flex items-center justify-between rounded">
                  <span className="font-bold">Cyan + Magenta</span> <span className="font-black text-xl text-blue-600">= BIRU</span>
                </li>
                <li className="p-3 border-2 border-black bg-green-100 flex items-center justify-between rounded">
                  <span className="font-bold">Cyan + Kuning</span> <span className="font-black text-xl text-green-600">= HIJAU</span>
                </li>
                <li className="p-3 border-2 border-black bg-red-100 flex items-center justify-between rounded">
                  <span className="font-bold">Magenta + Kuning</span> <span className="font-black text-xl text-red-600">= MERAH</span>
                </li>
                <li className="p-3 border-4 border-black bg-slate-900 flex items-center justify-between mt-4 rounded">
                  <span className="font-bold text-white">C + M + Y</span> <span className="font-black text-xl bg-white px-2">HITAM</span>
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
                    onClick={calculateScore}
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
                      ? "SEMPURNA! KAMU PAHAM BETUL PERBEDAAN ADITIF DAN SUBTRAKTIF."
                      : score >= 3
                        ? "CUKUP BAIK. COBA MAIN-MAIN LAGI DENGAN SLIDER WARNANYA."
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