import { useState, useRef, useEffect } from 'react';

const PAIRS: Record<string, { partner: string; colorMain: string; colorPartner: string; bonds: number }> = {
  A: { partner: 'T', colorMain: '#ef4444', colorPartner: '#3b82f6', bonds: 2 },
  T: { partner: 'A', colorMain: '#3b82f6', colorPartner: '#ef4444', bonds: 2 },
  C: { partner: 'G', colorMain: '#10b981', colorPartner: '#eab308', bonds: 3 },
  G: { partner: 'C', colorMain: '#eab308', colorPartner: '#10b981', bonds: 3 },
};

const quizData = [
  {
    question: '1. Basa nitrogen yang selalu berpasangan dengan Adenin (A) adalah...',
    options: ['Sitosin (C)', 'Timin (T)', 'Guanin (G)', 'Urasil (U)'],
    answer: 1,
  },
  {
    question: '2. Pasangan basa yang memiliki 3 ikatan hidrogen adalah...',
    options: ['A - T', 'T - A', 'C - G', 'G - C'],
    answer: 2,
  },
  {
    question: '3. Apa nama tulang punggung (backbone) DNA?',
    options: ['Protein dan Lipid', 'Gula Deoksiribosa dan Fosfat', 'Asam Amino', 'Lemak dan Kolesterol'],
    answer: 1,
  },
  {
    question: '4. Mengapa DNA berbentuk double helix (pilinan ganda)?',
    options: ['Agar terlihat indah', 'Untuk melindungi basa nitrogen dari kerusakan', 'Untuk efisien secara ruang dan stabil', 'Karena sifat magnetik molekul'],
    answer: 2,
  },
  {
    question: '5. Jika sebuah rantai DNA memiliki sekuens "AGCT", berapa persentase kandungan Guanin-nya?',
    options: ['25%', '50%', '75%', '0%'],
    answer: 0,
  },
];

export default function StrukturDNA() {
  const [dnaSequence, setDnaSequence] = useState<{main: string; partner: string; colorMain: string; colorPartner: string; bonds: number}[]>([]);
  const [isHelixMode, setIsHelixMode] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const reqRef = useRef<number>(0);

  const CENTER_X = 200;
  const LADDER_WIDTH = 120;
  const Y_SPACING = 35;
  const MAX_VISIBLE_BASES = 14;

  const addBase = (base: string) => {
    setDnaSequence((prev) => {
      const newSeq = [
        {
          main: base,
          partner: PAIRS[base].partner,
          colorMain: PAIRS[base].colorMain,
          colorPartner: PAIRS[base].colorPartner,
          bonds: PAIRS[base].bonds,
        },
        ...prev,
      ].slice(0, MAX_VISIBLE_BASES);
      return newSeq;
    });
  };

  const generateRandom = () => {
    const bases = ['A', 'T', 'C', 'G'];
    const newSeq = [];
    for (let i = 0; i < MAX_VISIBLE_BASES; i++) {
      const b = bases[Math.floor(Math.random() * bases.length)];
      newSeq.push({
        main: b,
        partner: PAIRS[b].partner,
        colorMain: PAIRS[b].colorMain,
        colorPartner: PAIRS[b].colorPartner,
        bonds: PAIRS[b].bonds,
      });
    }
    setDnaSequence(newSeq);
  };

  const resetDNA = () => setDnaSequence([]);

  const gcPercentage = dnaSequence.length > 0
    ? Math.round(((dnaSequence.filter(p => p.main === 'G' || p.main === 'C').length) / dnaSequence.length) * 100)
    : 0;

  const sequenceStr = dnaSequence.map(p => p.main).join('');

  useEffect(() => {
    const bases = ['A', 'T', 'G', 'C', 'A', 'A'];
    setDnaSequence(bases.map(b => ({
      main: b,
      partner: PAIRS[b].partner,
      colorMain: PAIRS[b].colorMain,
      colorPartner: PAIRS[b].colorPartner,
      bonds: PAIRS[b].bonds,
    })));
  }, []);

  useEffect(() => {
    const loop = () => {
      setAnimationTime((prev) => prev + (isHelixMode ? 0.02 : (0 - prev) * 0.1));
      reqRef.current = requestAnimationFrame(loop);
    };
    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [isHelixMode]);

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

  const renderDNA = () => {
    return dnaSequence.map((pair, i) => {
      const yPos = 30 + i * Y_SPACING;
      const twistRate = isHelixMode ? 0.35 : 0;
      const angleOffset = isHelixMode ? animationTime + i * twistRate : 0;
      const sinVal = Math.sin(angleOffset);
      const cosVal = Math.cos(angleOffset);
      const xLeft = CENTER_X - LADDER_WIDTH * cosVal;
      const xRight = CENTER_X + LADDER_WIDTH * cosVal;
      const zLeft = sinVal;
      const zRight = -sinVal;
      const apparentWidth = Math.abs(xRight - xLeft) / 2;

      const drawBases = () => (
        <>
          <rect
            x={Math.min(xLeft, CENTER_X)}
            y={yPos - 8}
            width={apparentWidth}
            height={16}
            fill={cosVal > 0 ? pair.colorMain : pair.colorPartner}
            stroke="#000"
            strokeWidth="2"
          />
          <rect
            x={Math.min(CENTER_X, xRight)}
            y={yPos - 8}
            width={apparentWidth}
            height={16}
            fill={cosVal > 0 ? pair.colorPartner : pair.colorMain}
            stroke="#000"
            strokeWidth="2"
          />
          {!isHelixMode && apparentWidth > 40 && (
            <>
              {[1, 2].slice(0, pair.bonds).map((b) => (
                <line
                  key={b}
                  x1={CENTER_X - 10}
                  x2={CENTER_X + 10}
                  y1={yPos - 8 + (16 / (pair.bonds + 1)) * b}
                  y2={yPos - 8 + (16 / (pair.bonds + 1)) * b}
                  stroke="#fff"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />
              ))}
              <text x={CENTER_X - 30} y={yPos + 4} fill="#fff" fontWeight="bold" fontSize="12">{pair.main}</text>
              <text x={CENTER_X + 20} y={yPos + 4} fill="#fff" fontWeight="bold" fontSize="12">{pair.partner}</text>
            </>
          )}
        </>
      );

      const drawNode = (x: number, idx: number) => {
        const s = 10;
        const points = `${x},${yPos - s} ${x + s},${yPos} ${x + s / 2},${yPos + s} ${x - s / 2},${yPos + s} ${x - s},${yPos}`;
        return (
          <g key={`node-${idx}`}>
            <polygon points={points} fill="#cbd5e1" stroke="#0f172a" strokeWidth="3" />
            {i < dnaSequence.length - 1 && (
              <path
                d={`M ${x} ${yPos + s} Q ${x} ${yPos + Y_SPACING / 2} ${x} ${yPos + Y_SPACING - s}`}
                stroke="#0f172a"
                strokeWidth="4"
                fill="none"
              />
            )}
          </g>
        );
      };

      if (zLeft < zRight) {
        return (
          <g key={i}>
            {drawNode(xLeft, i * 2)}
            {drawBases()}
            {drawNode(xRight, i * 2 + 1)}
          </g>
        );
      }
      return (
        <g key={i}>
          {drawNode(xRight, i * 2 + 1)}
          {drawBases()}
          {drawNode(xLeft, i * 2)}
        </g>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-purple-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">GENETIKA MOLEKULER</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: STRUKTUR DNA</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Merakit Basa Nitrogen dan Simulasi Double Helix
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#c084fc] text-md rotate-2 z-30 uppercase">
            Mesin Sintesis DNA
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Tambahkan Pasangan Basa</label>
              <div className="grid grid-cols-2 gap-3">
                {['A', 'T', 'C', 'G'].map((base) => (
                  <button
                    key={base}
                    onClick={() => addBase(base)}
                    className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-3 px-2 text-xs flex flex-col items-center justify-center transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${
                      base === 'A' ? 'bg-red-50 hover:bg-red-100' :
                      base === 'T' ? 'bg-blue-50 hover:bg-blue-100' :
                      base === 'C' ? 'bg-green-50 hover:bg-green-100' :
                      'bg-yellow-50 hover:bg-yellow-100'
                    }`}
                  >
                    <span className={`font-black text-lg ${
                      base === 'A' ? 'text-red-600' :
                      base === 'T' ? 'text-blue-600' :
                      base === 'C' ? 'text-green-600' :
                      'text-yellow-600'
                    }`}>
                      {base} - {PAIRS[base].partner}
                    </span>
                    <span className="text-[9px] font-bold text-slate-600">
                      {base === 'A' ? 'Adenin - Timin' :
                       base === 'T' ? 'Timin - Adenin' :
                       base === 'C' ? 'Sitosin - Guanin' : 'Guanin - Sitosin'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-black pt-4">
              <button
                onClick={() => setIsHelixMode(!isHelixMode)}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-3 text-sm w-full transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${
                  isHelixMode ? 'bg-slate-800 text-white' : 'bg-fuchsia-400 text-black'
                }`}
              >
                {isHelixMode ? '⏸️ KEMBALI KE MODE DATAR' : '🧬 UBAH MODE: DOUBLE HELIX 3D'}
              </button>
              <div className="flex gap-2 w-full">
                <button
                  onClick={generateRandom}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer uppercase py-2 text-xs flex-1 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                >
                  🎲 RAKIT ACAK
                </button>
                <button
                  onClick={resetDNA}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 hover:bg-slate-300 font-bold cursor-pointer uppercase py-2 px-4 text-xs text-black transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                >
                  🧹 HAPUS
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-fuchsia-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">PROFIL RANTAI DNA</h4>
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Panjang Rantai</span>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-white">{dnaSequence.length}</span>
                  <span className="text-[10px] text-slate-400 mb-1">bp</span>
                </div>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Kandungan G-C</span>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-emerald-400">{gcPercentage}</span>
                  <span className="text-[10px] text-slate-400 mb-1">%</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 p-2 border-2 border-dashed border-slate-600">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Sekuens 5' → 3'</span>
              <span className="text-sm font-mono font-black text-fuchsia-300 break-all leading-tight">
                {sequenceStr || 'Kosong'}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 p-0 relative flex w-full h-[500px] overflow-hidden border-8 border-black rounded-xl" style={{ backgroundColor: '#f1f5f9', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">
              {isHelixMode ? 'Visualisasi: Double Helix 3D' : 'Visualisasi: Tangga 2D'}
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 border border-black"></div> Adenin (A)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 border border-black"></div> Timin (T)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 border border-black"></div> Sitosin (C)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 border border-black"></div> Guanin (G)</div>
            </div>

            <svg viewBox="0 0 400 500" className="w-full h-full overflow-visible pt-10">
              {renderDNA()}
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-purple-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan: Anatomi Kode Kehidupan 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-purple-600 border-b-2 border-black pb-1 mb-2">Pasangan Abadi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              <b>A selalu berpasangan dengan T</b>, dan <b>C selalu berpasangan dengan G</b>. Ini disebut Aturan Chargaff.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-slate-800 border-b-2 border-black pb-1 mb-2">Kekuatan Ikatan</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Pasangan A-T memiliki <b>2 ikatan hidrogen</b>, sedangkan C-G memiliki <b>3 ikatan hidrogen</b>. DNA dengan G-C lebih stabil.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Backbone</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Tulang punggung DNA tersusun dari <b>Gula Deoksiribosa dan Fosfat</b>, melindungi basa nitrogen di dalam.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <h4 className="font-black text-md uppercase text-fuchsia-400 mb-2">Fakta Double Helix</h4>
          <p className="text-sm font-semibold leading-relaxed text-slate-300">
            Struktur double helix ditemukan oleh Watson dan Crick pada 1953. Bentuk pilinan efisien secara matematis dan melindungi informasi genetik.
          </p>
        </div>
      </div>

      <div className="mb-12 bg-purple-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI DNA [KUIS]</h3>
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
                {score === 5 ? 'Sempurna! Anda mengerti DNA!' : 'Bagus! Coba eksplorasi lagi struktur DNA-nya.'}
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
