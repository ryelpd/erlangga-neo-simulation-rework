import { useState, useEffect, useMemo } from 'react';

export default function PermutasiKombinasi() {
  const [n, setN] = useState(4);
  const [r, setR] = useState(2);
  const [mode, setMode] = useState<'P' | 'C'>('P');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);

  const OBJECTS = [
    { id: 'A', bg: 'bg-rose-500', text: 'text-white' },
    { id: 'B', bg: 'bg-blue-500', text: 'text-white' },
    { id: 'C', bg: 'bg-emerald-500', text: 'text-white' },
    { id: 'D', bg: 'bg-yellow-400', text: 'text-black' },
    { id: 'E', bg: 'bg-purple-500', text: 'text-white' }
  ];

  const factorial = (num: number): number => {
    if (num === 0 || num === 1) return 1;
    let result = 1;
    for (let i = 2; i <= num; i++) result *= i;
    return result;
  };

  const getCombinations = <T,>(arr: T[], r: number): T[][] => {
    const results: T[][] = [];
    const helper = (start: number, combo: T[]) => {
      if (combo.length === r) {
        results.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    };
    helper(0, []);
    return results;
  };

  const getPermutations = <T,>(arr: T[], r: number): T[][] => {
    const results: T[][] = [];
    const helper = (combo: T[], remaining: T[]) => {
      if (combo.length === r) {
        results.push([...combo]);
        return;
      }
      for (let i = 0; i < remaining.length; i++) {
        const nextItem = remaining[i];
        const nextRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
        combo.push(nextItem);
        helper(combo, nextRemaining);
        combo.pop();
      }
    };
    helper([], arr);
    return results;
  };

  const activePool = useMemo(() => OBJECTS.slice(0, n), [n]);

  const maxR = n;
  const currentR = Math.min(r, maxR);

  const generatedSets = useMemo(() => {
    return mode === 'P' 
      ? getPermutations(activePool, currentR)
      : getCombinations(activePool, currentR);
  }, [activePool, currentR, mode]);

  const totalCalculated = mode === 'P'
    ? factorial(n) / factorial(n - currentR)
    : factorial(n) / (factorial(currentR) * factorial(n - currentR));

  const formulaStr = mode === 'P'
    ? `P(${n},${currentR}) = ${n}! / (${n}-${currentR})!`
    : `C(${n},${currentR}) = ${n}! / (${currentR}!(${n}-${currentR})!)`;

  const quizData = [
    {
      question: "1. Manakah dari kasus berikut ini yang merupakan contoh penerapan PERMUTASI?",
      options: ["Memilih 3 orang teman untuk diajak makan siang bersama", "Menyusun password ATM 6 digit", "Mencampur cat warna merah dan biru", "Memilih buah-buahan untuk membuat salad"],
      answer: 1
    },
    {
      question: "2. Dalam Kombinasi, jika objek {A, B} dipilih, maka...",
      options: ["Susunan {A, B} dianggap BEDA dengan {B, A}", "Susunan {A, B} dianggap SAMA (dihitung 1 kali) dengan {B, A}", "Objek tidak dapat dicampur", "Harus menambahkan objek ketiga"],
      answer: 1
    },
    {
      question: "3. Coba atur slider ke n = 3 dan r = 2. Berapakah jumlah susunan jika menggunakan Permutasi P(3,2)?",
      options: ["3 Susunan", "6 Susunan", "9 Susunan", "2 Susunan"],
      answer: 1
    },
    {
      question: "4. Masih dengan n = 3 dan r = 2. Ubah mode menjadi Kombinasi C(3,2). Berapa total hasil yang didapat, dan mengapa bisa menyusut?",
      options: ["6, karena formulanya dikalikan", "3, karena susunan yang isinya sama seperti (AB dan BA) dicoret salah satunya", "0, karena tidak bisa dihitung", "1, karena ini himpunan kosong"],
      answer: 1
    },
    {
      question: "5. Nilai dari 0! (Nol Faktorial) secara matematis disepakati bernilai...",
      options: ["0", "1", "Tidak Terdefinisi", "-1"],
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

  useEffect(() => {
    if (r > n) {
      setR(n);
    }
  }, [n, r]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-emerald-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            MATEMATIKA PELUANG
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-center">
            LAB VIRTUAL: PERMUTASI & KOMBINASI
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black mx-auto block text-center">
            Kaidah Pencacahan, Susunan, dan Himpunan Bagian
          </p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
            
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                1. Atur Variabel
              </label>
              
              <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-black text-sky-800 uppercase">Total Objek (n)</span>
                  <span className="font-mono font-black text-xl bg-white px-2 border-2 border-black">{n}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={n}
                  onChange={(e) => setN(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-black text-yellow-800 uppercase">Objek Dipilih (r)</span>
                  <span className="font-mono font-black text-xl bg-white px-2 border-2 border-black">{currentR}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max={maxR}
                  step="1"
                  value={currentR}
                  onChange={(e) => setR(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <label className="text-sm font-bold text-black uppercase bg-rose-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                2. Pilih Jenis Susunan
              </label>
              <div className="flex flex-col md:flex-row gap-3 flex-1">
                <button 
                  onClick={() => setMode('P')}
                  className={`flex-1 py-4 border-4 border-black text-center flex flex-col items-center justify-center gap-1 font-bold uppercase transition-all rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    mode === 'P'
                      ? 'bg-rose-400 text-black ring-4 ring-black'
                      : 'bg-slate-100 text-slate-600 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <span className="text-xl">🔢 PERMUTASI (P)</span>
                  <span className="text-xs bg-white px-2 border border-black mt-1">URUTAN PENTING! (AB ≠ BA)</span>
                </button>
                <button 
                  onClick={() => setMode('C')}
                  className={`flex-1 py-4 border-4 border-black text-center flex flex-col items-center justify-center gap-1 font-bold uppercase transition-all rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    mode === 'C'
                      ? 'bg-sky-400 text-black ring-4 ring-black'
                      : 'bg-slate-100 text-slate-600 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <span className="text-xl">🥗 KOMBINASI (C)</span>
                  <span className="text-xs bg-white px-2 border border-black mt-1">URUTAN BEBAS (AB = BA)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
          <div className="absolute top-6 left-6 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">
              HASIL {mode === 'P' ? 'PERMUTASI' : 'KOMBINASI'}: {mode}({n}, {currentR})
            </h2>
          </div>

          <div className="absolute top-6 right-6 z-20 bg-yellow-300 p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-1 hidden md:block">
            <div className="text-center font-mono font-black text-xl border-b-4 border-black pb-2 mb-2">
              {formulaStr}
            </div>
            <div className="text-center font-black text-2xl">
              = {totalCalculated} Susunan
            </div>
          </div>

          <div className="mt-28 md:mt-24 w-full flex flex-col gap-6">
            
            <div className="flex flex-col items-center gap-2">
              <span className="text-white font-bold text-sm tracking-widest uppercase bg-black px-2 py-1">Kumpulan Objek Tersedia (n)</span>
              <div className="flex flex-wrap gap-3 p-4 bg-slate-700 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl justify-center min-h-[80px] w-full max-w-2xl">
                {activePool.map((item) => (
                  <div 
                    key={item.id}
                    className={`${item.bg} ${item.text} w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-black text-xl border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                  >
                    {item.id}
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full flex justify-center text-white font-black text-2xl my-2">⬇️ DIPILIH (r) ⬇️</div>

            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex justify-between w-full max-w-5xl items-end mb-2">
                <span className="text-white font-bold text-sm tracking-widest uppercase bg-black px-2 py-1">Daftar Kemungkinan Susunan</span>
                <span className="text-yellow-300 font-black text-xl md:hidden">Total: {totalCalculated}</span>
              </div>
              
              <div className="w-full max-w-5xl h-[350px] bg-[#f8fafc] border-8 border-black p-6 overflow-y-auto flex flex-wrap gap-4 content-start [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:border-l-4 [&::-webkit-scrollbar-track]:border-black [&::-webkit-scrollbar-thumb]:bg-black [&::-webkit-scrollbar-thumb]:rounded">
                {generatedSets.map((set, index) => (
                  <div 
                    key={index}
                    className="bg-white p-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-2 hover:scale-105 transition-transform cursor-default"
                    style={{ animation: `popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`, animationDelay: `${index * 0.02}s`, opacity: 0 }}
                  >
                    {set.map((item) => (
                      <div 
                        key={item.id}
                        className={`${item.bg} ${item.text} w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-black text-xl border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                      >
                        {item.id}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes popIn {
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 transform -rotate-1">
            PENJELASAN KONSEP: PERMUTASI vs KOMBINASI 🧠
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div className="bg-rose-100 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black text-xl uppercase text-rose-700 mb-2 border-b-4 border-black pb-2">🔢 PERMUTASI</h4>
              <p className="text-sm font-semibold mb-3">Permutasi digunakan ketika <b>URUTAN ITU PENTING</b>. Susunan AB dianggap berbeda dengan BA.</p>
              <div className="bg-white p-3 border-2 border-black border-dashed">
                <span className="font-black text-sm">Contoh Kasus:</span><br/>
                - Pemilihan Juara 1, 2, dan 3.<br/>
                - Menyusun password HP atau PIN Koper (Pin 1-2-3 beda dengan 3-2-1).<br/>
                - Menyusun buku di rak.
              </div>
              <div className="mt-3 text-center font-mono font-black bg-rose-200 border-2 border-black p-2">
                P(n, r) = n! / (n - r)!
              </div>
            </div>
            
            <div className="bg-sky-100 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black text-xl uppercase text-sky-700 mb-2 border-b-4 border-black pb-2">🥗 KOMBINASI</h4>
              <p className="text-sm font-semibold text-black mb-3">Kombinasi digunakan ketika <b>URUTAN TIDAK PENTING</b>. Himpunan {'{A, B}'} sama persis dengan {'{B, A}'}.</p>
              <div className="bg-white p-3 border-2 border-black border-dashed">
                <span className="font-black text-sm">Contoh Kasus:</span><br/>
                - Membuat jus buah (Apel + Jeruk rasanya sama dengan Jeruk + Apel).<br/>
                - Memilih 3 orang anggota tim perwakilan lomba.<br/>
                - Memilih 2 menu lauk makanan di kantin.
              </div>
              <div className="mt-3 text-center font-mono font-black bg-sky-200 border-2 border-black p-2">
                C(n, r) = n! / (r! × (n - r)!)
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white border-4 border-black text-center font-bold">
            💡 *Simbol seru (!) disebut Faktorial. Contoh: 4! = 4 × 3 × 2 × 1 = 24.*
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
                      ? "SEMPURNA! PEMAHAMAN MATEMATIKAMU SANGAT BAIK."
                      : score >= 3
                        ? "CUKUP BAIK. COBA PERHATIKAN LAGI HASIL SUSUNAN DI SIMULASI."
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