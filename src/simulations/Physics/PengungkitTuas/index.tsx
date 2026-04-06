import { useState, type ReactNode } from 'react';

const PIXELS_PER_METER = 80;
const CENTER_X = 450;

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: "1. Syarat utama agar sebuah pengungkit (tuas) berada dalam keadaan seimbang mendatar adalah...",
    options: ["Gaya Kuasa harus lebih besar dari Gaya Beban", "Momen Gaya Kiri (Torsi Kiri) sama dengan Momen Gaya Kanan (Torsi Kanan)", "Lengan Kuasa dan Lengan Beban harus sama panjang", "Titik tumpu harus digeser ke pinggir"],
    answer: 1
  },
  {
    question: "2. Pada simulasi ini, jika Anda ingin mengangkat Beban yang sangat berat menggunakan Gaya (Dorongan) yang kecil, apa yang harus Anda atur?",
    options: ["Memperpendek Lengan Kuasa (Lf) mendekati titik tumpu", "Memperpanjang Lengan Kuasa (Lf) menjauhi titik tumpu", "Meningkatkan berat beban", "Membuang titik tumpunya"],
    answer: 1
  },
  {
    question: "3. Jika Beban Kiri beratnya 200 N dan diletakkan pada jarak 2 meter dari tumpuan. Berapa Gaya (Kuasa) yang dibutuhkan agar seimbang jika posisi Kuasa berada di jarak 4 meter?",
    options: ["100 N", "200 N", "400 N", "800 N"],
    answer: 0
  },
  {
    question: "4. Nilai Keuntungan Mekanis (KM) pada tuas didapatkan dari perbandingan antara...",
    options: ["Panjang tuas total dibagi berat beban", "Massa beban dikali gravitasi", "Lengan Kuasa dibagi Lengan Beban", "Gaya kuasa ditambah berat beban"],
    answer: 2
  },
  {
    question: "5. Jungkat-jungkit, gunting, dan tang adalah contoh aplikasi tuas jenis pertama. Apa ciri khas dari tuas jenis pertama?",
    options: ["Beban berada di antara titik tumpu dan kuasa", "Titik Tumpu berada di antara Beban dan Kuasa", "Kuasa berada di antara titik tumpu dan beban", "Tidak memiliki lengan beban"],
    answer: 1
  }
];

export default function PengungkitTuas(): ReactNode {
  const [W, setW] = useState(200);
  const [Lw, setLw] = useState(2.0);
  const [F, setF] = useState(100);
  const [Lf, setLf] = useState(4.0);
  const [showWarning, setShowWarning] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const tauLeft = W * Lw;
  const tauRight = F * Lf;
  const km = Lf / Lw;

  const diff = tauRight - tauLeft;
  let angle = 0;
  if (Math.abs(diff) < 1) {
    angle = 0;
  } else if (diff < 0) {
    angle = Math.max(-20, diff / 50);
  } else {
    angle = Math.min(20, diff / 50);
  }

  const getBalanceStatus = () => {
    if (Math.abs(diff) < 1) {
      return { text: "SEIMBANG", className: "bg-lime-300" };
    } else if (diff < 0) {
      return { text: "JATUH KE KIRI", className: "bg-rose-300" };
    }
    return { text: "JATUH KE KANAN", className: "bg-blue-300" };
  };

  const statusInfo = getBalanceStatus();

  const handleAutoBalanceF = () => {
    let idealF = Math.round((W * Lw) / Lf);
    if (idealF > 500) idealF = 500;
    if (idealF < 50) idealF = 50;
    setF(idealF);
  };

  const handleAutoBalanceLf = () => {
    let idealLf = (W * Lw) / F;
    if (idealLf > 4.0) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      idealLf = 4.0;
    } else if (idealLf < 0.5) {
      idealLf = 0.5;
    }
    idealLf = Math.round(idealLf * 2) / 2;
    setLf(idealLf);
  };

  const posXLoad = CENTER_X - (Lw * PIXELS_PER_METER);
  const posXForce = CENTER_X + (Lf * PIXELS_PER_METER);
  const boxSize = 40 + (W / 20);
  const arrowLength = 30 + (F / 5);
  const forceArrowD = `M 0 -40 L 0 -${40 + arrowLength} M -10 -${30 + arrowLength} L 0 -${40 + arrowLength} L 10 -${30 + arrowLength}`;

  const handleAnswerSelect = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (userAnswers.every(a => a !== null)) {
      setQuizSubmitted(true);
    }
  };

  const handleRetry = () => {
    setUserAnswers(new Array(5).fill(null));
    setQuizSubmitted(false);
  };

  const score = quizSubmitted
    ? userAnswers.reduce<number>((acc, ans, i) => (ans === quizData[i].answer ? acc + 1 : acc), 0)
    : 0;

  const allAnswered = userAnswers.every(a => a !== null);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-lime-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-green-700">FISIKA MEKANIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
          LAB VIRTUAL: PENGUNGKIT & TUAS
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
          Menganalisis Momen Gaya (Torsi) dan Keseimbangan Mekanis
        </p>
      </header>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl mb-8 flex flex-col gap-6 z-10 relative">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-rose-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              1. Area Beban (Kiri)
            </label>
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 h-full">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-xs uppercase text-rose-800">Gaya Berat (W)</span>
                  <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{W} N</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={W}
                  onChange={(e) => setW(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-lime-400 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-xs uppercase text-rose-800">Lengan Beban (Lw)</span>
                  <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{Lw.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.5"
                  value={Lw}
                  onChange={(e) => setLw(parseFloat(e.target.value))}
                  className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-lime-400 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              2. Aksi Keseimbangan
            </label>
            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 h-full justify-center">
              <p className="text-xs font-bold text-center text-slate-600 mb-1">Pilih aksi untuk menyeimbangkan tuas secara otomatis:</p>
              <button
                onClick={handleAutoBalanceF}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg py-2 flex items-center justify-center gap-2 font-bold uppercase text-sm transition-all active:translate-x-1 active:translate-y-1 active:shadow-none bg-yellow-300 ring-4 ring-black"
              >
                <span className="text-lg">⚖️</span> <span className="text-sm">Cari Gaya Kuasa (F) Ideal</span>
              </button>
              <button
                onClick={handleAutoBalanceLf}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg bg-white py-2 flex items-center justify-center gap-2 font-bold uppercase text-sm transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <span className="text-lg">📏</span> <span className="text-sm">Geser Jarak Kuasa (Lf) Ideal</span>
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-blue-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              3. Area Kuasa (Kanan)
            </label>
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 h-full">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-xs uppercase text-blue-800">Gaya Dorong (F)</span>
                  <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{F} N</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={F}
                  onChange={(e) => setF(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-lime-400 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-xs uppercase text-blue-800">Lengan Kuasa (Lf)</span>
                  <span className="font-mono font-black bg-white px-2 border-2 border-black text-sm">{Lf.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.5"
                  value={Lf}
                  onChange={(e) => setLf(parseFloat(e.target.value))}
                  className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-lime-400 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#f8fafc] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-2 md:p-6 relative flex flex-col items-center w-full max-w-6xl z-10 mb-10 overflow-hidden">
        <div className="absolute top-4 left-4 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform -rotate-2">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-green-700">VISUALISASI TUAS</h2>
        </div>

        <div className="absolute top-4 right-4 z-30 bg-white/95 p-3 md:p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs md:text-sm font-bold uppercase w-60 md:w-80 backdrop-blur-sm">
          <h3 className="text-center font-black border-b-4 border-black pb-2 mb-1 text-slate-800">STATUS MOMEN GAYA (TORSI)</h3>
          <div className="flex justify-between items-center mt-1">
            <span className="text-rose-700">Torsi Kiri (t1)</span>
            <span className="font-mono text-rose-700 font-black">{tauLeft.toFixed(0)} Nm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-700">Torsi Kanan (t2)</span>
            <span className="font-mono text-blue-700 font-black">{tauRight.toFixed(0)} Nm</span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-dashed border-slate-400 pt-2 mt-1">
            <span className="text-emerald-700">Keuntungan Mekanis</span>
            <span className="font-mono text-emerald-700 font-black">{km.toFixed(1)}</span>
          </div>
          <div className={`mt-3 text-center p-2 border-2 border-black font-black ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
        </div>

        {showWarning && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 bg-rose-500 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-4 font-black uppercase text-center">
            Gaya tidak cukup kuat! <br /> Butuh lengan yang lebih panjang.
          </div>
        )}

        <div className="mt-56 md:mt-16 relative w-full max-w-[900px] h-[400px] bg-white border-4 border-black overflow-hidden shadow-[inset_0px_0px_20px_rgba(0,0,0,0.1)]">
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '80px 80px', backgroundPosition: '50px 60px' }}></div>

          <svg viewBox="0 0 900 400" className="w-full h-full relative z-20">
            <line x1="130" y1="380" x2="770" y2="380" stroke="#000" strokeWidth="4" />
            <line x1="370" y1="375" x2="370" y2="385" stroke="#000" strokeWidth="3" /><text x="370" y="395" fontSize="12" fontWeight="bold" textAnchor="middle">1m</text>
            <line x1="290" y1="375" x2="290" y2="385" stroke="#000" strokeWidth="3" /><text x="290" y="395" fontSize="12" fontWeight="bold" textAnchor="middle">2m</text>
            <line x1="210" y1="375" x2="210" y2="385" stroke="#000" strokeWidth="3" /><text x="210" y="395" fontSize="12" fontWeight="bold" textAnchor="middle">3m</text>
            <line x1="130" y1="375" x2="130" y2="385" stroke="#000" strokeWidth="3" /><text x="130" y="395" fontSize="12" fontWeight="bold" textAnchor="middle">4m</text>
            <line x1="530" y1="375" x2="530" y2="385" stroke="#000" strokeWidth="3" /><text x="530" y="395" fontSize="12" fontWeight="bold" textAnchor="middle">1m</text>
            <line x1="610" y1="375" x2="610" y2="385" stroke="#000" strokeWidth="3" /><text x="610" y="395" fontSize="12" fontWeight="bold" textAnchor="middle">2m</text>
            <line x1="690" y1="375" x2="690" y2="385" stroke="#000" strokeWidth="3" /><text x="690" y="395" fontSize="12" fontWeight="bold" textAnchor="middle">3m</text>
            <line x1="770" y1="375" x2="770" y2="385" stroke="#000" strokeWidth="3" /><text x="770" y="395" fontSize="12" fontWeight="bold" textAnchor="middle">4m</text>
            <text x="450" y="395" fontSize="12" fontWeight="bold" textAnchor="middle">0</text>

            <polygon points="410,350 490,350 450,300" fill="#cbd5e1" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="450" cy="300" r="6" fill="#000" />

            <g style={{ transformOrigin: '450px 300px', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: `rotate(${angle}deg)` }}>
              <rect x="90" y="290" width="720" height="20" fill="#fcd34d" stroke="#000" strokeWidth="4" rx="10" />

              <g transform={`translate(${posXLoad}, 290)`}>
                <rect x={-(boxSize / 2)} y={-boxSize} width={boxSize} height={boxSize} fill="#f43f5e" stroke="#000" strokeWidth="4" rx="4" />
                <text x="0" y={-(boxSize / 2) + 6} fontSize="18" fontWeight="900" fill="#fff" textAnchor="middle">{W}N</text>
                <path d="M 0 -70 L 0 -110 M -10 -80 L 0 -70 L 10 -80" fill="none" stroke="#be123c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              <g transform={`translate(${posXForce}, 290)`}>
                <circle cx="0" cy="-20" r="20" fill="#60a5fa" stroke="#000" strokeWidth="4" />
                <text x="0" y="-14" fontSize="16" fontWeight="900" fill="#000" textAnchor="middle">F</text>
                <path d={forceArrowD} fill="none" stroke="#1d4ed8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                <text x="0" y={-(55 + arrowLength)} fontSize="14" fontWeight="900" fill="#1d4ed8" textAnchor="middle">{F}N</text>
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div className="bg-lime-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform rotate-1 text-green-800 uppercase">
          KONSEP FISIKA: HUKUM TUAS & MOMEN GAYA
        </h3>
        <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/70 p-4 border-2 border-black border-dashed">
          Pengungkit (Tuas) adalah pesawat sederhana yang digunakan untuk mempermudah usaha. Prinsip kerjanya bergantung pada <strong>Momen Gaya (Torsi)</strong>, yaitu gaya yang menyebabkan benda berputar terhadap suatu poros.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-rose-700 mb-2 border-b-4 border-black pb-2 uppercase">Syarat Keseimbangan</h4>
            <div className="bg-rose-50 p-4 border-2 border-black mb-3">
              <div className="text-2xl font-black text-center font-mono tracking-widest text-slate-800">
                Sum t = 0<br />
                <span className="text-lg">W x Lw = F x Lf</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Keterangan:<br />
              <strong>W (Beban):</strong> Gaya berat objek yang diangkat (Newton).<br />
              <strong>Lw (Lengan Beban):</strong> Jarak dari titik tumpu ke beban.<br />
              <strong>F (Kuasa):</strong> Gaya dorong/tarik yang kita berikan.<br />
              <strong>Lf (Lengan Kuasa):</strong> Jarak dari titik tumpu ke kuasa.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-blue-700 mb-2 border-b-4 border-black pb-2 uppercase">Keuntungan Mekanis (KM)</h4>
            <div className="bg-blue-50 p-4 border-2 border-black mb-3 flex items-center justify-center">
              <div className="text-3xl font-black text-center font-mono text-blue-800">
                KM = Lf / Lw
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Keuntungan mekanis menunjukkan seberapa besar alat ini melipatgandakan gaya Anda. Semakin panjang <strong>Lengan Kuasa (Lf)</strong> dibandingkan Lengan Beban, maka semakin kecil gaya (F) yang Anda butuhkan untuk mengangkat beban yang sangat berat!
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform -rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                <h4 className="font-bold text-black mb-4 text-base md:text-lg bg-white inline-block px-2 border-2 border-black">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIdx) => {
                    let btnClass = "border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg text-left px-4 py-3 text-sm md:text-base font-bold uppercase transition-all ";
                    if (quizSubmitted) {
                      if (oIdx === q.answer) {
                        btnClass += "bg-green-400 text-black";
                      } else if (userAnswers[qIdx] === oIdx) {
                        btnClass += "bg-rose-400 text-black opacity-80";
                      } else {
                        btnClass += "bg-slate-200 opacity-50";
                      }
                    } else {
                      btnClass += userAnswers[qIdx] === oIdx ? "bg-black text-white" : "bg-white text-black hover:bg-lime-200";
                    }
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswerSelect(qIdx, oIdx)}
                        disabled={quizSubmitted}
                        className={btnClass}
                      >
                        {quizSubmitted && oIdx === q.answer && "BENAR: "}
                        {quizSubmitted && userAnswers[qIdx] === oIdx && oIdx !== q.answer && "SALAH: "}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted && allAnswered && (
            <div className="text-center mt-8">
              <button
                onClick={handleSubmit}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-lime-500 text-black font-black py-4 px-10 text-xl md:text-2xl uppercase tracking-widest hover:bg-lime-600 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                CEK JAWABAN SAYA!
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? "LUAR BIASA! PEMAHAMAN MEKANIKAMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP MOMEN GAYA DI ATAS."}
              </p>
              <br />
              <button
                onClick={handleRetry}
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-black text-white py-3 px-8 text-lg uppercase tracking-wider font-bold hover:bg-slate-800 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
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