import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';

const quizData = [
  { 
    question: "1. Jika Anda mengatur nilai Merah (R), Hijau (G), dan Biru (B) semuanya menjadi maksimal (255) pada model Aditif, warna apakah yang dihasilkan pada layar?", 
    options: ["Hitam", "Abu-abu", "Cokelat", "Putih"], 
    answer: 3 
  },
  { 
    question: "2. Pada model warna cetak (CMYK), jika kita mencampur tinta Cyan, Magenta, dan Yellow 100%, secara teori warna apa yang seharusnya terbentuk?", 
    options: ["Hitam", "Putih", "Biru Tua", "Merah Terang"], 
    answer: 0 
  },
  { 
    question: "3. Mengapa mesin printer mencetak warna di atas kertas putih menggunakan konsep 'Subtraktif'?", 
    options: ["Karena tinta memancarkan cahayanya sendiri dalam gelap", "Karena tinta berfungsi menyerap (mengurangi) cahaya dari spektrum putih agar warna lain bisa terlihat oleh mata", "Karena itu standar lama dari televisi tabung", "Karena kertas tidak bisa menyerap warna"], 
    answer: 1 
  },
  { 
    question: "4. Berdasarkan rumus konversi, apa nilai Red (R) jika kita mengatur warna Cyan (C) di angka 100% dan nilai lainnya 0?", 
    options: ["0 (karena Cyan menyerap seluruh cahaya Merah)", "255", "128", "Tidak terdefinisi"], 
    answer: 0 
  },
  { 
    question: "5. Huruf 'K' dalam CMYK adalah singkatan dari Key, yang mewakili warna tinta Hitam. Mengapa warna hitam perlu ditambahkan secara terpisah?", 
    options: ["Untuk membuat gambar mengkilap", "Karena warna Cyan, Magenta, dan Yellow di dunia nyata tidak bisa menghasilkan warna hitam yang sempurna/pekat", "Karena warna hitam memantulkan cahaya", "Agar printer tidak cepat rusak"], 
    answer: 1 
  }
];

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();
}

export default function KonverterRgbCmyk(): ReactNode {
  const [r, setR] = useState(59);
  const [g, setG] = useState(130);
  const [b, setB] = useState(246);
  const [c, setC] = useState(76);
  const [m, setM] = useState(47);
  const [y, setY] = useState(0);
  const [k, setK] = useState(4);
  const [showCopyMsg, setShowCopyMsg] = useState(false);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const updateFromRGB = useCallback((newR: number, newG: number, newB: number) => {
    let newC = 0, newM = 0, newY = 0, newK = 0;

    if (newR === 0 && newG === 0 && newB === 0) {
      newK = 100;
    } else {
      const rP = newR / 255;
      const gP = newG / 255;
      const bP = newB / 255;

      const maxRGB = Math.max(rP, gP, bP);
      newK = 1 - maxRGB;
      newC = (1 - rP - newK) / (1 - newK);
      newM = (1 - gP - newK) / (1 - newK);
      newY = (1 - bP - newK) / (1 - newK);

      newC = Math.round(newC * 100);
      newM = Math.round(newM * 100);
      newY = Math.round(newY * 100);
      newK = Math.round(newK * 100);
    }

    setC(newC);
    setM(newM);
    setY(newY);
    setK(newK);
  }, []);

  const updateFromCMYK = useCallback((newC: number, newM: number, newY: number, newK: number) => {
    const cP = newC / 100;
    const mP = newM / 100;
    const yP = newY / 100;
    const kP = newK / 100;

    const newR = Math.round(255 * (1 - cP) * (1 - kP));
    const newG = Math.round(255 * (1 - mP) * (1 - kP));
    const newB = Math.round(255 * (1 - yP) * (1 - kP));

    setR(newR);
    setG(newG);
    setB(newB);
  }, []);

  const handleRChange = (val: number) => {
    setR(val);
    updateFromRGB(val, g, b);
  };

  const handleGChange = (val: number) => {
    setG(val);
    updateFromRGB(r, val, b);
  };

  const handleBChange = (val: number) => {
    setB(val);
    updateFromRGB(r, g, val);
  };

  const handleCChange = (val: number) => {
    setC(val);
    updateFromCMYK(val, m, y, k);
  };

  const handleMChange = (val: number) => {
    setM(val);
    updateFromCMYK(c, val, y, k);
  };

  const handleYChange = (val: number) => {
    setY(val);
    updateFromCMYK(c, m, val, k);
  };

  const handleKChange = (val: number) => {
    setK(val);
    updateFromCMYK(c, m, y, val);
  };

  const hex = rgbToHex(r, g, b);

  const copyHex = () => {
    navigator.clipboard.writeText(hex);
    setShowCopyMsg(true);
    setTimeout(() => setShowCopyMsg(false), 1000);
  };

  const handleAnswer = (qIdx: number, oIdx: number) => {
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
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const score = userAnswers.reduce<number>((acc, a, i) => {
    if (a === quizData[i].answer) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-7xl bg-pink-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">DESAIN GRAFIS & OPTIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: KONVERTER RGB & CMYK
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Transkripsi Warna Layar (Aditif) menjadi Tinta Cetak (Subtraktif)
        </p>
      </header>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Model Cahaya (RGB)
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="bg-red-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-red-700 uppercase text-xs">Red (Merah)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black w-16 text-center">{r}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                step="1"
                value={r}
                onChange={(e) => handleRChange(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-green-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-green-700 uppercase text-xs">Green (Hijau)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black w-16 text-center">{g}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                step="1"
                value={g}
                onChange={(e) => handleGChange(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-700 uppercase text-xs">Blue (Biru)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black w-16 text-center">{b}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                step="1"
                value={b}
                onChange={(e) => handleBChange(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>
          </div>
          
          <div className="mt-auto bg-slate-100 p-3 border-2 border-dashed border-slate-400 text-xs font-bold text-slate-600 text-center">
            Rentang Nilai: 0 - 255 (Standar 8-bit)
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[450px] overflow-hidden border-8 border-black">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Pratinjau Warna
          </span>

          <div className="w-full flex-1 flex flex-col items-center justify-center mt-8 gap-6">
            <div 
              className="p-2 border-8 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl w-48 h-48 sm:w-64 sm:h-64"
              style={{
                backgroundImage: 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
            >
              <div 
                className="w-full h-full rounded-md border-4 border-black"
                style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
              />
            </div>

            <div className="flex flex-col items-center">
              <span className="font-bold text-xs uppercase text-slate-500 mb-1">KODE HEX (WEB)</span>
              <button
                onClick={copyHex}
                className="text-4xl font-black font-mono bg-yellow-300 px-6 py-2 border-4 border-black shadow-[4px_4px_0px_#000] cursor-pointer hover:bg-yellow-200 transition-all"
              >
                {hex}
              </button>
              <span className={`text-xs font-bold text-emerald-600 mt-2 transition-opacity ${showCopyMsg ? 'opacity-100' : 'opacity-0'}`}>
                Tersalin ke clipboard!
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 left-6 bg-emerald-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Model Tinta (CMYK)
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-cyan-50 p-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-cyan-700 uppercase text-xs">Cyan (Biru Muda)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black w-16 text-center">{c}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={c}
                onChange={(e) => handleCChange(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-pink-50 p-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-pink-700 uppercase text-xs">Magenta (Merah Muda)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black w-16 text-center">{m}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={m}
                onChange={(e) => handleMChange(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-yellow-50 p-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-yellow-700 uppercase text-xs">Yellow (Kuning)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black w-16 text-center">{y}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={y}
                onChange={(e) => handleYChange(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>

            <div className="bg-slate-100 p-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-slate-800 uppercase text-xs">Key (Hitam)</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black w-16 text-center">{k}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={k}
                onChange={(e) => handleKChange(Number(e.target.value))}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-slate-700 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
            </div>
          </div>
          
          <div className="mt-auto bg-slate-100 p-3 border-2 border-dashed border-slate-400 text-xs font-bold text-slate-600 text-center">
            Rentang Nilai: 0% - 100% (Kerapatan Tinta)
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-8">
          <h3 className="text-2xl font-black uppercase mb-4 border-b-4 border-slate-700 pb-2 text-sky-400">Model Warna RGB (Aditif) 💡</h3>
          <p className="font-semibold text-slate-300 leading-relaxed text-sm">
            RGB adalah singkatan dari <b>Red, Green, Blue</b>. Model ini digunakan pada perangkat pemancar cahaya seperti monitor, TV, dan layar ponsel. Konsepnya bersifat <b>Aditif (Penambahan)</b>. Dimulai dari layar gelap (Hitam), dan seiring ditambahkan intensitas cahaya merah, hijau, dan biru, warnanya akan semakin terang. Jika ketiganya digabung dengan intensitas 100% (255), akan menghasilkan cahaya <b>Putih</b> murni.
          </p>
        </div>

        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-8">
          <h3 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2 text-rose-600">Model Warna CMYK (Subtraktif) 🖨️</h3>
          <p className="font-semibold text-slate-700 leading-relaxed text-sm">
            CMYK singkatan dari <b>Cyan, Magenta, Yellow, dan Key (Black)</b>. Model ini digunakan untuk media cetak/printer di atas kertas. Konsepnya bersifat <b>Subtraktif (Pengurangan)</b>. Dimulai dari kertas putih (yang memantulkan seluruh cahaya). Tinta berfungsi menyerap (mengurangi) spektrum cahaya. Jika semua tinta dicampur, akan menghasilkan warna <b>Hitam/Gelap</b>.
          </p>
        </div>
      </div>

      <div className="w-full max-w-7xl z-10 relative bg-emerald-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-black mb-4 uppercase">RUMUS KONVERSI MATEMATIS</h3>
            <div className="bg-white text-black p-4 border-4 border-black font-mono font-black shadow-[4px_4px_0px_#10b981] flex flex-col gap-2 text-sm md:text-base">
              <div className="text-slate-500 text-[10px] uppercase">Langkah 1: Normalisasi RGB (0 - 1)</div>
              <div>R&apos; = R/255, G&apos; = G/255, B&apos; = B/255</div>
              <div className="border-t-2 border-dashed border-black my-1"></div>
              <div className="text-slate-500 text-[10px] uppercase">Langkah 2: Cari K (Key/Black)</div>
              <div>K = 1 - max(R&apos;, G&apos;, B&apos;)</div>
              <div className="border-t-2 border-dashed border-black my-1"></div>
              <div className="text-slate-500 text-[10px] uppercase">Langkah 3: Cari CMY</div>
              <div>C = (1 - R&apos; - K) / (1 - K)</div>
              <div>M = (1 - G&apos; - K) / (1 - K)</div>
              <div>Y = (1 - B&apos; - K) / (1 - K)</div>
            </div>
          </div>
          <div className="bg-white p-6 border-4 border-black shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-emerald-600 mb-2 uppercase">Kenapa butuh warna Hitam (K)?</h4>
            <p className="text-xs text-slate-800 leading-relaxed font-bold">
              Secara teori, mencampur Cyan, Magenta, dan Yellow 100% seharusnya menghasilkan warna Hitam sempurna. Namun, di dunia nyata, tinta tidak ada yang sempurna. Pencampuran ketiganya hanya akan menghasilkan warna cokelat keabu-abuan berlumpur (muddy brown).
              <br /><br />
              Oleh karena itu, tinta Hitam murni (Key) ditambahkan di mesin cetak untuk memberikan kedalaman warna gelap, menghemat tinta warna, dan mempercepat waktu pengeringan kertas.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-7xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP WARNA [KUIS]
          </h3>
        </div>
        
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000] mb-4">
                <h4 className="font-bold mb-3 text-sm uppercase">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswer(qIdx, oIdx)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase transition-all text-left px-4 py-2 bg-white text-xs
                        ${quizSubmitted 
                          ? oIdx === q.answer 
                            ? 'bg-green-400 text-black' 
                            : userAnswers[qIdx] === oIdx 
                              ? 'bg-rose-400 text-black' 
                              : ''
                          : userAnswers[qIdx] === oIdx 
                            ? 'bg-black text-white translate-x-[4px] translate-y-[4px] shadow-none' 
                            : 'hover:bg-slate-100'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {!quizSubmitted && userAnswers.every(a => a !== null) && (
              <button
                onClick={handleSubmit}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-3 px-10 text-xl w-full mt-4 bg-slate-900 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
              >
                KIRIM JAWABAN!
              </button>
            )}
            
            {quizSubmitted && (
              <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                <h4 className="text-3xl font-black text-black mb-2 uppercase">NILAI AKHIR: {score}/5</h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {score === 5 ? "Sempurna! Pemahaman Anda tentang teori warna sangat baik." : "Bagus! Coba mainkan lagi slider warnanya untuk mengeksplorasi."}
                </p>
                <br />
                <button
                  onClick={handleRetry}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-3 px-8 text-lg bg-black text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                >
                  ULANGI KUIS
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}