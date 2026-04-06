import { useState, useEffect, useRef, useCallback } from 'react';

export default function TeleponKabel() {
  const [material, setMaterial] = useState<'cotton' | 'nylon' | 'wire'>('cotton');
  const [tension, setTension] = useState(100);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeVolume, setActiveVolume] = useState<'low' | 'med' | 'high' | null>(null);
  const [receivedAmp, setReceivedAmp] = useState(0);
  const [statusText, setStatusText] = useState("MENUNGGU SUARA...");
  const [statusColor, setStatusColor] = useState("bg-slate-50");
  const [panelColor, setPanelColor] = useState("bg-white/95");
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const pulseTimerRef = useRef<number>(0);
  const pulsesRef = useRef<Array<{
    progress: number;
    initAmp: number;
    currentAmp: number;
    active: boolean;
  }>>([]);
  const receivedAmpRef = useRef<number>(0);

  const MATERIALS = {
    cotton: { color: "#eab308", speed: 1.0, damping: 0.015, thickness: 4 },
    nylon: { color: "#38bdf8", speed: 1.8, damping: 0.005, thickness: 3 },
    wire: { color: "#94a3b8", speed: 3.0, damping: 0.001, thickness: 2 }
  };

  const VOLUMES = {
    low: { amp: 15, color: "#64748b" },
    med: { amp: 30, color: "#f43f5e" },
    high: { amp: 60, color: "#b91c1c" }
  };

  const quizData = [
    {
      question: "1. Pada simulasi di atas, apa fungsi utama dari Tali/Benang dalam telepon kaleng?",
      options: ["Sebagai hiasan agar alat terlihat panjang", "Sebagai Medium Rambatan untuk memindahkan energi mekanik (getaran)", "Sebagai penguat suara elektronik", "Sebagai penyerap suara dari luar"],
      answer: 1
    },
    {
      question: "2. Coba perhatikan simulasi. Mengapa material 'Kawat Besi' mampu mengirimkan suara berbisik (Amplitudo Kecil) dengan sangat jelas dibandingkan 'Benang Kasur'?",
      options: ["Karena kawat besi harganya lebih mahal", "Karena kawat besi tidak bisa melengkung", "Karena kawat memiliki massa jenis dan keterikatan partikel kuat sehingga Redamannya (Damping) sangat rendah", "Karena kawat memantulkan cahaya"],
      answer: 2
    },
    {
      question: "3. Berdasarkan rumus v = √(F/μ), apa yang terjadi pada kecepatan rambat suara jika Tali dikendorkan (Gaya Tegangan / F diturunkan menuju 0)?",
      options: ["Kecepatan akan membesar tak terhingga", "Kecepatan suara akan melambat drastis bahkan berhenti merambat", "Kecepatan suara tetap sama, hanya suaranya yang membesar", "Tali akan putus"],
      answer: 1
    },
    {
      question: "4. Fenomena di mana amplitudo gelombang suara semakin menyusut dan menghilang seiring berjalannya jarak disebut...",
      options: ["Pemantulan (Refleksi)", "Pembiasan (Refraksi)", "Redaman (Damping)", "Resonansi"],
      answer: 2
    },
    {
      question: "5. Jika Anda menggunakan Benang Kasur (Redaman Tinggi) dan talinya Sedikit Kendor, apa cara satu-satunya agar suara Anda bisa sampai ke kaleng penerima?",
      options: ["Memotong benangnya menjadi setengah", "BERTERIAK (Meningkatkan Amplitudo Awal yang sangat besar) agar sisa energinya masih ada saat sampai", "Berbisik sepelan mungkin", "Mengisi kaleng dengan air"],
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

  const cy = 175 + ((100 - tension) * 1.5);

  const getBezierData = (t: number, sx: number, sy: number, cx: number, cy: number, ex: number, ey: number) => {
    const x = Math.pow(1 - t, 2) * sx + 2 * (1 - t) * t * cx + Math.pow(t, 2) * ex;
    const y = Math.pow(1 - t, 2) * sy + 2 * (1 - t) * t * cy + Math.pow(t, 2) * ey;
    const dx = 2 * (1 - t) * (cx - sx) + 2 * t * (ex - cx);
    const dy = 2 * (1 - t) * (cy - sy) + 2 * t * (ey - cy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    return { x, y, angle };
  };

  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    const mat = MATERIALS[material];

    if (isSpeaking && activeVolume) {
      pulseTimerRef.current += dt;
      const spawnRate = activeVolume === 'high' ? 0.1 : (activeVolume === 'med' ? 0.15 : 0.2);

      if (pulseTimerRef.current > spawnRate) {
        pulseTimerRef.current = 0;
        const volData = VOLUMES[activeVolume];

        pulsesRef.current.push({
          progress: 0,
          initAmp: volData.amp,
          currentAmp: volData.amp,
          active: true
        });
      }
    }

    let maxReceivedAmpThisFrame = 0;
    let currentlyReceiving = false;

    for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
      const p = pulsesRef.current[i];
      if (!p.active) continue;

      if (tension < 10) {
        p.currentAmp -= 50 * dt;
      } else {
        const v = mat.speed * (0.2 + (tension / 100) * 0.8);
        p.progress += v * dt;

        const slackPenalty = 1 + ((100 - tension) / 100) * 5;
        p.currentAmp -= p.initAmp * mat.damping * slackPenalty * dt * 50;
      }

      if (p.currentAmp <= 2) {
        p.active = false;
        pulsesRef.current.splice(i, 1);
        continue;
      }

      if (p.progress >= 1.0) {
        currentlyReceiving = true;
        if (p.currentAmp > maxReceivedAmpThisFrame) maxReceivedAmpThisFrame = p.currentAmp;
        p.active = false;
        pulsesRef.current.splice(i, 1);
        continue;
      }
    }

    if (currentlyReceiving) {
      receivedAmpRef.current = maxReceivedAmpThisFrame;
      setReceivedAmp(maxReceivedAmpThisFrame);

      if (maxReceivedAmpThisFrame > 40) {
        setPanelColor("bg-green-100");
        setStatusText("SANGAT JELAS! LANTANG!");
        setStatusColor("bg-green-300");
      } else if (maxReceivedAmpThisFrame > 15) {
        setPanelColor("bg-yellow-100");
        setStatusText("TERDENGAR NORMAL");
        setStatusColor("bg-yellow-300");
      } else {
        setPanelColor("bg-rose-100");
        setStatusText("SAYUP-SAYUP / BERBISIK");
        setStatusColor("bg-rose-300");
      }
    } else {
      if (receivedAmpRef.current > 0) {
        receivedAmpRef.current -= 50 * dt;
        if (receivedAmpRef.current < 0) {
          receivedAmpRef.current = 0;
          setReceivedAmp(0);
          setStatusText("MENUNGGU SUARA...");
          setStatusColor("bg-slate-50");
          setPanelColor("bg-white/95");
        } else {
          setReceivedAmp(receivedAmpRef.current);
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [material, tension, isSpeaking, activeVolume]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const handleSpeakStart = (vol: 'low' | 'med' | 'high') => {
    setIsSpeaking(true);
    setActiveVolume(vol);
  };

  const handleSpeakEnd = () => {
    setIsSpeaking(false);
    setActiveVolume(null);
  };

  const mat = MATERIALS[material];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-rose-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            FISIKA AKUSTIK & MATERIAL
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-center">
            LAB VIRTUAL: TELEPON KALENG v2.0
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black mx-auto block text-center">
            Menganalisis Redaman Gelombang (Damping) pada Berbagai Material Padat
          </p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
            
            <div className="w-full lg:w-1/3 flex flex-col gap-3">
              <label className="text-sm font-bold text-black uppercase bg-cyan-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                1. Pilih Material Tali
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { key: 'cotton', icon: '🧵', name: 'Benang Kasur', damping: 'Redaman Tinggi' },
                  { key: 'nylon', icon: '🎣', name: 'Senar Nilon', damping: 'Redaman Sedang' },
                  { key: 'wire', icon: '🎸', name: 'Kawat Besi', damping: 'Redaman Rendah' }
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMaterial(m.key as 'cotton' | 'nylon' | 'wire')}
                    className={`py-3 px-4 text-sm flex justify-between items-center border-4 border-black font-bold uppercase transition-all rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                      material === m.key
                        ? 'bg-yellow-300 text-black ring-4 ring-black ring-offset-2'
                        : 'bg-slate-100 text-slate-500 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <span>{m.icon} {m.name}</span>
                    <span className="text-xs opacity-70">{m.damping}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-1/3 flex flex-col gap-3">
              <label className="text-sm font-bold text-black uppercase bg-emerald-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                2. Atur Ketegangan (Tension)
              </label>
              <div className="bg-emerald-50 p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 justify-center rounded-lg flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-black text-lg text-emerald-800 uppercase">Tegangan</span>
                  <span className="font-mono font-black text-xl bg-white px-2 border-2 border-black">{tension}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={tension}
                  onChange={(e) => setTension(parseInt(e.target.value))}
                  className="w-full h-3 bg-black rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:h-9 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{ 
                    background: `linear-gradient(to right, ${mat.color} ${tension}%, #000 ${tension}%)`
                  }}
                />
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                  <span>Kendor</span>
                  <span>Tegang</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/3 flex flex-col gap-3">
              <label className="text-sm font-bold text-black uppercase bg-rose-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                3. Aksi Komunikasi
              </label>
              <div className="grid grid-cols-1 gap-2 flex-1">
                {[
                  { vol: 'low', icon: '🤫', text: 'BERBISIK', amp: 'Amp Kecil', bg: 'bg-slate-100' },
                  { vol: 'med', icon: '🗣️', text: 'BICARA NORMAL', amp: 'Amp Sedang', bg: 'bg-rose-200' },
                  { vol: 'high', icon: '🗯️', text: 'BERTERIAK', amp: 'Amp Besar', bg: 'bg-rose-500 text-white' }
                ].map((v) => (
                  <button
                    key={v.vol}
                    onMouseDown={() => handleSpeakStart(v.vol as 'low' | 'med' | 'high')}
                    onMouseUp={handleSpeakEnd}
                    onMouseLeave={handleSpeakEnd}
                    onTouchStart={(e) => { e.preventDefault(); handleSpeakStart(v.vol as 'low' | 'med' | 'high'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleSpeakEnd(); }}
                    className={`py-2 border-4 border-black text-center text-sm font-bold uppercase transition-all rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                      isSpeaking && activeVolume === v.vol
                        ? 'translate-x-[4px] translate-y-[4px] shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] ring-4 ring-black'
                        : ''
                    } ${v.bg}`}
                  >
                    {v.icon} {v.text} ({v.amp})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
          <div className="absolute top-6 left-6 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">MONITOR GELOMBANG AKUSTIK</h2>
          </div>

          <div className={`absolute top-6 right-6 z-30 ${panelColor} p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 text-xs font-bold uppercase w-64 backdrop-blur-sm transition-colors duration-300 rounded-lg hidden md:block`}>
            <h3 className="text-center font-black text-sm border-b-4 border-black pb-2 mb-1">HASIL DI TELINGA PENERIMA</h3>
            <div className="flex items-center justify-between">
              <span>Amplitudo Tiba</span>
              <span className="font-mono text-sm text-slate-600">{receivedAmp.toFixed(1)}</span>
            </div>
            <div className={`mt-2 text-center p-2 border-2 border-dashed border-slate-400 ${statusColor} transition-colors`}>
              {statusText}
            </div>
          </div>

          <div className="mt-20 md:mt-10 relative w-full max-w-[900px] h-[350px] bg-[#f8fafc] border-8 border-black overflow-hidden rounded-xl mx-auto">
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
            
            <svg viewBox="0 0 900 350" className="w-full h-full relative z-20 overflow-visible">
                
              <path 
                d={`M 200 175 Q 450 ${cy} 700 175`} 
                fill="none" 
                stroke={mat.color}
                strokeWidth={mat.thickness}
                strokeLinecap="round"
              />
              
              <g opacity={isSpeaking ? 1 : 0} transform="translate(90, 175)">
                <path d="M 30 -20 Q 40 0 30 20" fill="none" stroke={activeVolume ? VOLUMES[activeVolume].color : '#ef4444'} strokeWidth="4" strokeLinecap="round"/>
                <path d="M 45 -35 Q 65 0 45 35" fill="none" stroke={activeVolume ? VOLUMES[activeVolume].color : '#ef4444'} strokeWidth="4" strokeLinecap="round"/>
                <path d="M 60 -50 Q 90 0 60 50" fill="none" stroke={activeVolume ? VOLUMES[activeVolume].color : '#ef4444'} strokeWidth="4" strokeLinecap="round"/>
              </g>

              {pulsesRef.current.filter(p => p.active).map((p, i) => {
                const pos = getBezierData(p.progress, 200, 175, 450, cy, 700, 175);
                const opacity = p.currentAmp / p.initAmp;
                return (
                  <rect
                    key={i}
                    width="30"
                    height={p.currentAmp}
                    rx="15"
                    fill={mat.color}
                    stroke="#000"
                    strokeWidth="2"
                    opacity={opacity}
                    transform={`translate(${pos.x - 15}, ${pos.y - p.currentAmp / 2}) rotate(${pos.angle}, 15, ${p.currentAmp / 2})`}
                  />
                );
              })}

              <g transform="translate(120, 125)">
                <circle cx="80" cy="50" r="4" fill="#000"/>
                <path d="M 0 0 L 80 0 L 80 100 L 0 100 Z" fill="#cbd5e1" stroke="#000" strokeWidth="6" strokeLinejoin="round"/>
                <rect x="15" y="0" width="50" height="100" fill="#ef4444" stroke="#000" strokeWidth="4"/>
                <text x="40" y="55" fontSize="16" fontWeight="900" textAnchor="middle" fill="#fff" transform="rotate(-90 40 55)">BICARA</text>
              </g>

              <g transform="translate(700, 125)">
                <circle cx="0" cy="50" r="4" fill="#000"/>
                <path d="M 0 0 L 80 0 L 80 100 L 0 100 Z" fill="#cbd5e1" stroke="#000" strokeWidth="6" strokeLinejoin="round"/>
                <rect x="15" y="0" width="50" height="100" fill="#3b82f6" stroke="#000" strokeWidth="4"/>
                <text x="40" y="55" fontSize="16" fontWeight="900" textAnchor="middle" fill="#fff" transform="rotate(90 40 55)">DENGAR</text>
              </g>

              <line x1="200" y1="320" x2="700" y2="320" stroke="#000" strokeWidth="2" strokeDasharray="10 5"/>
              <line x1="200" y1="310" x2="200" y2="330" stroke="#000" strokeWidth="4"/>
              <line x1="700" y1="310" x2="700" y2="330" stroke="#000" strokeWidth="4"/>
              <text x="450" y="340" fontSize="14" fontWeight="900" fill="#000" textAnchor="middle">JARAK MERAMBAT (s)</text>

            </svg>
          </div>
        </div>

        <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 transform -rotate-1">
            KONSEP FISIKA: REDAMAN & KECEPATAN RAMBAT 📉
          </h3>
          <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/60 p-3 border-2 border-black border-dashed">
            Kenapa suara bisa hilang di tengah jalan? Ini terjadi karena energi gelombang mengalami <b>Redaman (Damping)</b>. Energi suara diserap oleh material medium dan diubah menjadi panas skala mikro.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-yellow-600 mb-2">🧵 Benang Kasur</h4>
              <p className="text-sm font-semibold">Tingkat redamannya <b>SANGAT TINGGI</b>. Serat kain menyerap banyak energi getaran. Suara bisikan tidak akan pernah sampai. Hanya teriakan kuat yang bisa menembus ujung benang kasur yang panjang.</p>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-blue-600 mb-2">🎣 Senar Nilon</h4>
              <p className="text-sm font-semibold text-black">Redaman <b>SEDANG</b>. Senar pancing lebih padat dan elastis dari kapas, sehingga getaran bisa merambat lebih cepat dan lebih jauh tanpa banyak energi yang hilang.</p>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="font-black uppercase text-slate-600 mb-2">🎸 Kawat Besi</h4>
              <p className="text-sm font-semibold text-black">Redaman <b>SANGAT RENDAH</b>. Partikel logam saling terikat kuat (kerapatan tinggi). Gelombang suara dapat merambat dengan kecepatan sangat tinggi dan hampir tidak ada volume suara yang hilang!</p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            PAPAN RUMUS MATEMATIS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="text-xl font-black text-slate-800 mb-4 border-b-4 border-black pb-2 uppercase">
                Kehilangan Amplitudo (Damping)
              </h4>
              <ul className="space-y-3">
                <li className="p-3 border-2 border-black bg-rose-50 flex flex-col gap-2">
                  <div className="text-2xl font-black text-center font-mono">A(x) = A₀ × e<sup>-γx</sup></div>
                  <span className="text-sm font-semibold text-slate-700">
                    <b>A₀</b> = Amplitudo awal (Seberapa keras Anda teriak).<br/>
                    <b>γ</b> (gamma) = Koefisien redaman material.<br/>
                    <b>x</b> = Jarak rambat.<br/>
                    Amplitudo menyusut secara eksponensial semakin jauh ia merambat.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
              <h4 className="text-xl font-black text-slate-800 mb-4 border-b-4 border-black pb-2 uppercase">
                Kecepatan Gelombang Tali
              </h4>
              <ul className="space-y-3">
                <li className="p-3 border-2 border-black bg-sky-50 flex flex-col gap-2">
                  <div className="text-2xl font-black text-center font-mono">v = √(F / μ)</div>
                  <span className="text-sm font-semibold text-slate-700">
                    <b>v</b> = Cepat rambat gelombang.<br/>
                    <b>F</b> = Gaya Tegangan tali (Tension).<br/>
                    <b>μ</b> = Massa jenis linier tali.<br/>
                    <b>Kesimpulan:</b> Semakin ditarik tegang (F membesar), suara merambat semakin cepat! Jika kendor (F=0), gelombang mati.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-emerald-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
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
                      ? "SEMPURNA! PEMAHAMANMU TENTANG MATERIAL & REDAMAN SANGAT BAIK."
                      : score >= 3
                        ? "CUKUP BAIK. COBA MAIN-MAIN LAGI DENGAN JENIS TALI."
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