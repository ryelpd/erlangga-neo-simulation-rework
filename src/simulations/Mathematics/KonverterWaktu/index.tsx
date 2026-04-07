import type { ReactNode } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

const quizData = [
  { 
    question: "1. Pada pukul tepat 03:00, berapakah sudut apit terkecil yang dibentuk oleh jarum jam dan jarum menit?", 
    options: ["45°", "90°", "180°", "120°"], 
    answer: 1 
  },
  { 
    question: "2. Jarum menit bergerak mengelilingi satu lingkaran penuh (360°) dalam 60 menit. Berapakah sudut yang ditempuh jarum menit dalam 1 menit?", 
    options: ["1°", "5°", "6°", "30°"], 
    answer: 2 
  },
  { 
    question: "3. Pada pukul 06:00, jarum jam dan jarum menit membentuk garis lurus. Berapa derajat sudut yang dibentuknya?", 
    options: ["0°", "90°", "180°", "360°"], 
    answer: 2 
  },
  { 
    question: "4. Coba atur waktu ke pukul 12:30. Mengapa sudut yang terbentuk TIDAK persis 180° (lurus ke bawah dan ke atas)?", 
    options: ["Karena jamnya rusak", "Karena jarum jam (pendek) sudah bergeser setengah jalan menuju angka 1", "Karena ada gravitasi", "Karena jarum detik ikut bergerak"], 
    answer: 1 
  },
  { 
    question: "5. Berapakah derajat pergerakan jarum JAM (pendek) setiap 1 menit berlalu?", 
    options: ["0.5°", "1°", "6°", "30°"], 
    answer: 0 
  }
];

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeMinorArc(x: number, y: number, radius: number, angle1: number, angle2: number) {
  let minAngle = Math.min(angle1, angle2);
  let maxAngle = Math.max(angle1, angle2);
  let diff = maxAngle - minAngle;

  if (diff > 180) {
    const start = polarToCartesian(x, y, radius, maxAngle);
    const end = polarToCartesian(x, y, radius, minAngle + 360);
    return `M ${x} ${y} L ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y} Z`;
  } else {
    const start = polarToCartesian(x, y, radius, minAngle);
    const end = polarToCartesian(x, y, radius, maxAngle);
    return `M ${x} ${y} L ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y} Z`;
  }
}

export default function KonverterWaktu(): ReactNode {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [second, setSecond] = useState(0);
  const [isRealtime, setIsRealtime] = useState(false);
  
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  const realtimeRef = useRef<ReturnType<typeof setInterval>>(null);

  const updateRealtime = useCallback(() => {
    const now = new Date();
    setHour(now.getHours());
    setMinute(now.getMinutes());
    setSecond(now.getSeconds());
  }, []);

  useEffect(() => {
    if (isRealtime) {
      updateRealtime();
      realtimeRef.current = setInterval(updateRealtime, 1000);
    } else {
      if (realtimeRef.current) clearInterval(realtimeRef.current);
    }
    return () => {
      if (realtimeRef.current) clearInterval(realtimeRef.current);
    };
  }, [isRealtime, updateRealtime]);

  const degS = second * 6;
  const degM = (minute * 6) + (second * 6 / 60);
  const h12 = hour % 12;
  const degH = (h12 * 30) + (minute * 30 / 60) + (second * 30 / 3600);

  let angleDiff = Math.abs(degH - degM);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;

  const arcPath = angleDiff > 0.5 ? describeMinorArc(200, 200, 60, degH, degM) : '';
  
  let midAngle: number;
  const max = Math.max(degH, degM);
  const min = Math.min(degH, degM);
  if (max - min > 180) {
    midAngle = ((max + min + 360) / 2) % 360;
  } else {
    midAngle = (max + min) / 2;
  }
  const lblPos = polarToCartesian(200, 200, 80, midAngle);

  const clockMarks = [];
  for (let i = 0; i < 60; i++) {
    const angle = i * 6;
    const rad = (angle - 90) * Math.PI / 180;
    
    if (i % 5 === 0) {
      const x1 = 200 + 160 * Math.cos(rad);
      const y1 = 200 + 160 * Math.sin(rad);
      const x2 = 200 + 140 * Math.cos(rad);
      const y2 = 200 + 140 * Math.sin(rad);
      clockMarks.push(
        <line key={`tick-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="4" />
      );
      
      const hourNum = i === 0 ? 12 : i / 5;
      const tx = 200 + 120 * Math.cos(rad);
      const ty = 200 + 120 * Math.sin(rad);
      clockMarks.push(
        <text key={`num-${i}`} x={tx} y={ty} fontSize="24" fontWeight="900" fill="#000" textAnchor="middle" dominantBaseline="central">{hourNum}</text>
      );
    } else {
      const x1 = 200 + 160 * Math.cos(rad);
      const y1 = 200 + 160 * Math.sin(rad);
      const x2 = 200 + 150 * Math.cos(rad);
      const y2 = 200 + 150 * Math.sin(rad);
      clockMarks.push(
        <line key={`tick-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="2" />
      );
    }
  }

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

  const fmt = (n: number) => n.toFixed(1);
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">MATEMATIKA DASAR</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: WAKTU & SUDUT
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menghitung Derajat Jarum Jam dan Sudut Apit Terkecil
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-5 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Panel Waktu
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex justify-between items-center bg-slate-100 p-3 border-4 border-black mb-2">
              <span className="font-black text-sm uppercase">Gunakan Waktu Nyata (Real-time)</span>
              <label className="relative inline-block w-[50px] h-[28px]">
                <input
                  type="checkbox"
                  checked={isRealtime}
                  onChange={(e) => setIsRealtime(e.target.checked)}
                  className="opacity-0 w-0 h-0"
                />
                <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 border-3 border-black transition-all rounded-full ${isRealtime ? 'bg-emerald-400' : 'bg-white'}`}>
                  <span className={`absolute content-[''] h-4 w-4 left-[3px] bottom-[3px] bg-black transition-all rounded-full ${isRealtime ? 'translate-x-[22px]' : ''}`}></span>
                </span>
              </label>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-800 uppercase text-[10px]">Jam (Hour)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{hour}</span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                step="1"
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                disabled={isRealtime}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded disabled:opacity-50"
              />
            </div>

            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-yellow-800 uppercase text-[10px]">Menit (Minute)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{minute}</span>
              </div>
              <input
                type="range"
                min="0"
                max="59"
                step="1"
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
                disabled={isRealtime}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded disabled:opacity-50"
              />
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Detik (Second)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{second}</span>
              </div>
              <input
                type="range"
                min="0"
                max="59"
                step="1"
                value={second}
                onChange={(e) => setSecond(Number(e.target.value))}
                disabled={isRealtime}
                className="w-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded disabled:opacity-50"
              />
            </div>

            <div className="flex justify-center mt-2 border-t-4 border-black pt-4">
              <div className="bg-black text-white px-4 py-2 border-4 border-white shadow-[4px_4px_0px_#38bdf8] font-mono text-3xl font-black tracking-widest">
                {pad(hour)}:{pad(minute)}:{pad(second)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[450px] overflow-hidden border-8 border-black">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Jam Analog
          </span>

          <div className="w-full h-full relative z-10 flex items-center justify-center p-4">
            <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible drop-shadow-[8px_8px_0px_rgba(0,0,0,0.2)]">
              <circle cx="200" cy="200" r="180" fill="#ffffff" stroke="#000000" strokeWidth="8" />
              <circle cx="200" cy="200" r="160" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />

              {clockMarks}

              {angleDiff > 0.5 && (
                <path d={arcPath} fill="#fecaca" stroke="#f43f5e" strokeWidth="3" opacity="0.8" />
              )}

              {angleDiff > 0.5 && (
                <>
                  <rect x={lblPos.x - 20} y={lblPos.y - 10} width="40" height="20" fill="#fff" stroke="#f43f5e" strokeWidth="2" rx="4" />
                  <text x={lblPos.x} y={lblPos.y} fontSize="12" fontWeight="900" fill="#e11d48" textAnchor="middle" dominantBaseline="central">{fmt(angleDiff)}°</text>
                </>
              )}

              <g style={{ transform: `rotate(${degH}deg)`, transformOrigin: '200px 200px', transition: isRealtime ? 'transform 0.05s linear' : 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)' }}>
                <line x1="200" y1="200" x2="200" y2="100" stroke="#1e3a8a" strokeWidth="12" strokeLinecap="round" />
                <polygon points="194,105 206,105 200,90" fill="#1e3a8a" />
              </g>

              <g style={{ transform: `rotate(${degM}deg)`, transformOrigin: '200px 200px', transition: isRealtime ? 'transform 0.05s linear' : 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)' }}>
                <line x1="200" y1="200" x2="200" y2="50" stroke="#000000" strokeWidth="8" strokeLinecap="round" />
                <polygon points="196,55 204,55 200,40" fill="#000000" />
              </g>

              <g style={{ transform: `rotate(${degS}deg)`, transformOrigin: '200px 200px', transition: isRealtime ? 'transform 0.05s linear' : 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)' }}>
                <line x1="200" y1="220" x2="200" y2="30" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
                <circle cx="200" cy="200" r="6" fill="#f43f5e" />
              </g>

              <circle cx="200" cy="200" r="10" fill="#000" stroke="#fff" strokeWidth="3" />
            </svg>
          </div>
          
          <div className="absolute bottom-4 right-4 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[10px] font-bold uppercase shadow-[2px_2px_0px_#000] z-20">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#1e3a8a]"></div> Jarum Jam</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#000]"></div> Jarum Menit</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#f43f5e]"></div> Jarum Detik</div>
          </div>
        </div>

        <div className="bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 left-6 bg-emerald-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Analisis Matematis
          </span>

          <div className="mt-4 flex flex-col gap-3 font-mono">
            <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Sudut J. Detik (0-360°):</span>
              <span className="text-rose-400 font-black text-xl">{fmt(degS)}°</span>
            </div>

            <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Sudut J. Menit (0-360°):</span>
              <span className="text-white font-black text-xl">{fmt(degM)}°</span>
            </div>

            <div className="bg-slate-800 p-3 border-2 border-slate-600 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Sudut J. Jam (0-360°):</span>
              <span className="text-blue-400 font-black text-xl">{fmt(degH)}°</span>
            </div>

            <div className="bg-slate-800 p-3 border-2 border-rose-500 flex flex-col gap-1 items-center mt-2 shadow-[4px_4px_0px_0px_#f43f5e] relative overflow-hidden">
              <span className="absolute top-0 left-0 bg-rose-500 text-white text-[8px] px-2 py-1 font-black">HASIL</span>
              <span className="text-xs font-bold uppercase text-rose-200 mt-3">Sudut Apit Terkecil (Jam & Menit):</span>
              <span className="text-yellow-400 font-black text-4xl mt-1">{fmt(angleDiff)}°</span>
            </div>
          </div>

          <div className="mt-auto bg-white text-black p-4 border-4 border-black text-center shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-xs uppercase text-slate-500 mb-2 border-b-2 border-black pb-1">TIPS KONVERSI (Per Menit)</h4>
            <div className="grid grid-cols-1 gap-2 text-[10px] font-bold font-mono text-left">
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-1"><span>Jarum Menit:</span> <span className="text-blue-600">Bergerak 6° per menit</span></div>
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-1"><span>Jarum Jam:</span> <span className="text-rose-600">Bergerak 0.5° per menit</span></div>
              <div className="text-center bg-yellow-200 p-1 mt-1 border border-black">Sudut Apit = | Sudut Jam - Sudut Menit |</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          MEMAHAMI SUDUT PADA JAM ⏱️
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Konsep Lingkaran Penuh</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Satu lingkaran penuh memiliki sudut <b>360 derajat (360°)</b>. Pada jam analog, lingkaran ini dibagi menjadi 12 bagian besar (jam) dan 60 bagian kecil (menit/detik).
            </p>
            <ul className="text-xs font-bold text-slate-700 list-disc list-inside mt-2 space-y-1">
              <li>Satu jam (1 angka ke angka lain) = 360° ÷ 12 = <b>30°</b>.</li>
              <li>Satu menit/detik (1 garis kecil) = 360° ÷ 60 = <b>6°</b>.</li>
            </ul>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Pergerakan Halus Jarum Jam</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Seringkali kita lupa bahwa <b>jarum jam juga ikut bergerak sedikit demi sedikit</b> seiring bertambahnya menit. Pada pukul 12:30, jarum jam tidak berada tepat di angka 12, melainkan sudah bergerak setengah jalan menuju angka 1.
            </p>
            <p className="text-xs font-bold text-rose-700 mt-2 bg-rose-50 p-2 border border-black">
              Pergerakan jarum jam = 30° / 60 menit = <b>0.5° per menit</b>.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP WAKTU & SUDUT [KUIS]
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
                <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {score === 5 ? "Sempurna! Anda sangat teliti dalam matematika jam." : "Bagus! Coba perhatikan lagi perhitungan pergeseran jarum jam per menitnya."}
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