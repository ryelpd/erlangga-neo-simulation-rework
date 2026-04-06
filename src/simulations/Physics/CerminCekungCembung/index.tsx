import { useState, useCallback, useMemo } from 'react';

const MIRROR_X = 400;
const CENTER_Y = 250;
const OBJ_HEIGHT = 60;

const quizData = [
  { question: '1. Cermin yang memiliki sifat konvergen (mengumpulkan cahaya) adalah...', options: ['Cermin Datar', 'Cermin Cembung', 'Cermin Cekung', 'Cermin Ganda'], answer: 2 },
  { question: '2. Pada cermin cembung, sifat bayangan yang terbentuk akan selalu...', options: ['Nyata, Terbalik, Diperkecil', 'Maya, Tegak, Diperkecil', 'Maya, Tegak, Diperbesar', 'Nyata, Tegak, Diperbesar'], answer: 1 },
  { question: '3. Jika benda diletakkan tepat di titik fokus (F) cermin cekung, maka bayangan akan berada di...', options: ['Ruang IV', 'Titik Kelengkungan (C)', 'Titik Fokus (F)', 'Jauh tak terhingga'], answer: 3 },
  { question: '4. Sebuah benda di depan cermin cekung (f=10cm) berada pada jarak 15cm. Di mana letak bayangannya?', options: ['5 cm', '20 cm', '30 cm', '60 cm'], answer: 2 },
  { question: '5. Apa yang terjadi jika nilai perbesaran (M) bernilai negatif pada perhitungan?', options: ['Bayangan terbalik', 'Bayangan tegak', 'Bayangan maya', 'Cerminnya cembung'], answer: 0 },
];

export default function CerminCekungCembung() {
  const [isConcave, setIsConcave] = useState(true);
  const [distanceS, setDistanceS] = useState(150);
  const [distanceF, setDistanceF] = useState(60);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const activeF = isConcave ? distanceF : -distanceF;

  const fx = MIRROR_X - activeF;
  const cx = MIRROR_X - activeF * 2;

  const objX = MIRROR_X - distanceS;

  const sPrime = (activeF * distanceS) / (distanceS - activeF);
  const M = -sPrime / distanceS;
  const imgH = OBJ_HEIGHT * M;
  const imgX = MIRROR_X + sPrime;

  const isAtFocus = Math.abs(distanceS - activeF) < 1;

  const traits = useMemo(() => {
    if (isAtFocus) return 'Bayangan berada di jauh tak terhingga.';
    const traitType = sPrime > 0 ? 'Maya' : 'Nyata';
    const traitOrientation = M > 0 ? 'Tegak' : 'Terbalik';
    const traitSize = Math.abs(M) > 1 ? 'Diperbesar' : Math.abs(M) < 0.99 ? 'Diperkecil' : 'Sama Besar';
    return `${traitType}, ${traitOrientation}, ${traitSize}`;
  }, [isAtFocus, sPrime, M]);

  const ray1Path = useMemo(() => {
    if (isAtFocus) return '';
    return `M ${objX} ${CENTER_Y - OBJ_HEIGHT} L ${MIRROR_X} ${CENTER_Y - OBJ_HEIGHT} L ${imgX} ${CENTER_Y + imgH}`;
  }, [objX, imgX, imgH, isAtFocus]);

  const ray2Path = useMemo(() => {
    if (isAtFocus) return '';
    return `M ${objX} ${CENTER_Y - OBJ_HEIGHT} L ${MIRROR_X} ${CENTER_Y + imgH} L ${imgX} ${CENTER_Y + imgH}`;
  }, [objX, imgX, imgH, isAtFocus]);

  const ray3Path = useMemo(() => {
    if (isAtFocus) return '';
    const slope = (CENTER_Y - (CENTER_Y - OBJ_HEIGHT)) / (cx - objX);
    const yMirror = CENTER_Y - OBJ_HEIGHT + slope * (MIRROR_X - objX);
    return `M ${objX} ${CENTER_Y - OBJ_HEIGHT} L ${MIRROR_X} ${yMirror} L ${imgX} ${CENTER_Y + imgH}`;
  }, [objX, cx, imgX, imgH, isAtFocus]);

  const handleSChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDistanceS(parseInt(e.target.value));
  }, []);

  const handleFChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDistanceF(parseInt(e.target.value));
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
    if (score === 5) return 'SEMPURNA! PEMAHAMAN OPTIK ANDA SANGAT BAIK.';
    if (score >= 3) return 'CUKUP BAIK. AYO PELAJARI SIFAT BAYANGAN LAGI!';
    return 'YUK BACA LAGI BAGIAN PENJELASAN KONSEP DI ATAS.';
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black border-2 border-black">FISIKA OPTIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: CERMIN LENGKUNG
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Analisis Pembentukan Bayangan & Sinar Istimewa
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30 uppercase">
            Parameter Optik
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setIsConcave(true)}
                className={`flex-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-3 text-xs font-bold transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${isConcave ? 'bg-emerald-400 ring-4 ring-black' : 'bg-slate-100 text-slate-500'}`}
              >
                Cermin Cekung
              </button>
              <button
                onClick={() => setIsConcave(false)}
                className={`flex-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-3 text-xs font-bold transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${!isConcave ? 'bg-emerald-400 ring-4 ring-black' : 'bg-slate-100 text-slate-500'}`}
              >
                Cermin Cembung
              </button>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-blue-800 uppercase text-[10px]">Jarak Benda (s)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{distanceS}</span>
              </div>
              <input
                type="range"
                min="10"
                max="350"
                step="1"
                value={distanceS}
                onChange={handleSChange}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-rose-800 uppercase text-[10px]">Jarak Fokus (f)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{distanceF}</span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                step="1"
                value={distanceF}
                onChange={handleFChange}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest">HASIL PERHITUNGAN</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="border-b border-slate-700 pb-1">s&apos; (Bayangan):</div>
              <div className="text-right text-sky-400 font-bold">{isAtFocus ? 'Tak Hingga' : sPrime.toFixed(1)}</div>
              <div className="border-b border-slate-700 pb-1">M (Perbesaran):</div>
              <div className="text-right text-emerald-400 font-bold">{isAtFocus ? '-' : Math.abs(M).toFixed(2) + ' x'}</div>
            </div>
            <div className="mt-4 p-2 bg-slate-800 border-2 border-dashed border-slate-600">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Sifat Bayangan:</div>
              <div className="text-[11px] font-bold text-white leading-tight">{traits}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/3 min-h-[500px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs -rotate-2 z-30 uppercase">
            Diagram Sinar Optik
          </span>

          <div className="w-full h-full relative z-10">
            <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
              <line x1="0" y1={CENTER_Y} x2="800" y2={CENTER_Y} stroke="#000" strokeWidth="2" strokeDasharray="10 5" opacity="0.3" />

              <path
                d={isConcave ? `M ${MIRROR_X} 50 Q ${MIRROR_X - 50} ${CENTER_Y} ${MIRROR_X} 450` : `M ${MIRROR_X} 50 Q ${MIRROR_X + 50} ${CENTER_Y} ${MIRROR_X} 450`}
                stroke="#000"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />

              <circle cx={fx} cy={CENTER_Y} r="5" fill="#f43f5e" stroke="#000" strokeWidth="2" />
              <text x={fx} y={CENTER_Y + 25} textAnchor="middle" fontWeight="900" fontSize="14">F</text>
              <circle cx={cx} cy={CENTER_Y} r="5" fill="#3b82f6" stroke="#000" strokeWidth="2" />
              <text x={cx} y={CENTER_Y + 25} textAnchor="middle" fontWeight="900" fontSize="14">C</text>

              <g>
                <path d={ray1Path} stroke="#f97316" strokeWidth="2" fill="none" strokeDasharray="5 5" />
                <path d={ray2Path} stroke="#a855f7" strokeWidth="2" fill="none" strokeDasharray="5 5" />
                <path d={ray3Path} stroke="#22c55e" strokeWidth="2" fill="none" strokeDasharray="5 5" />
              </g>

              <g>
                <line x1={objX} y1={CENTER_Y} x2={objX} y2={CENTER_Y - OBJ_HEIGHT} stroke="#000" strokeWidth="6" />
                <rect x={objX - 15} y={CENTER_Y - OBJ_HEIGHT - 25} width="30" height="20" fill="#000" />
                <text x={objX} y={CENTER_Y - OBJ_HEIGHT - 10} textAnchor="middle" fill="#fff" fontWeight="900" fontSize="12">B</text>
              </g>

              {!isAtFocus && (
                <g opacity="1">
                  <line x1={imgX} y1={CENTER_Y} x2={imgX} y2={CENTER_Y + imgH} stroke="#fb7185" strokeWidth="4" />
                  <text x={imgX} y={CENTER_Y + imgH + (imgH > 0 ? 20 : -10)} textAnchor="middle" fill="#fb7185" fontWeight="900" fontSize="14">BAYANGAN</text>
                </g>
              )}

              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#000" />
                </marker>
                <marker id="arrowheadRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#fb7185" />
                </marker>
              </defs>
            </svg>
          </div>

          <div className="absolute bottom-6 bg-white px-4 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000]">
            Ruang I (Antara O-F) | Ruang II (F-C) | Ruang III (Di luar C) | Ruang IV (Belakang)
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase">
          HUKUM PEMANTULAN CAHAYA
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Cermin Cekung (Konkaf)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Bersifat <b>Konvergen</b> (mengumpulkan cahaya). Jarak fokus bernilai <b>Positif (+)</b>.
            </p>
            <ul className="text-[11px] font-bold list-disc list-inside space-y-1">
              <li>Sinar // sumbu utama dipantulkan melalui F.</li>
              <li>Sinar melalui F dipantulkan // sumbu utama.</li>
              <li>Sinar melalui C dipantulkan kembali melalui C.</li>
            </ul>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Cermin Cembung (Konveks)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Bersifat <b>Divergen</b> (menyebarkan cahaya). Jarak fokus bernilai <b>Negatif (-)</b>.
            </p>
            <ul className="text-[11px] font-bold list-disc list-inside space-y-1">
              <li>Sinar // sumbu utama dipantulkan seolah-olah dari F.</li>
              <li>Sinar menuju F dipantulkan // sumbu utama.</li>
              <li>Sinar menuju C dipantulkan kembali seolah-olah dari C.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            UJI PEMAHAMAN OPTIK [KUIS]
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