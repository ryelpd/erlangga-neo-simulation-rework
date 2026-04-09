import { useState, useEffect, useRef } from 'react';

type PlateMode = 'DIVERGEN' | 'SUBDUKSI' | 'KOLISI' | 'TRANSFORM';

export default function TektonikLempeng() {
  const [mode, setMode] = useState<PlateMode>('DIVERGEN');
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const quakeTimerRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const setModeHandler = (newMode: PlateMode) => {
    setMode(newMode);
    setProgress(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (progress >= 100) return;
    setIsPlaying(!isPlaying);
    lastTimeRef.current = performance.now();
  };

  const handleReset = () => {
    setModeHandler(mode);
  };

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        let newProgress = progress + dt / 100;
        if (newProgress >= 100) {
          newProgress = 100;
          setIsPlaying(false);
        }
        setProgress(newProgress);

        if (quakeTimerRef.current > 0) {
          quakeTimerRef.current -= dt / 1000;
          if (quakeTimerRef.current < 0) quakeTimerRef.current = 0;
        }

        const rand = Math.random();
        if (
          (mode === 'TRANSFORM' && (newProgress % 33) / 33 > 0.88 && (newProgress % 33) / 33 < 0.92) ||
          ((mode === 'SUBDUKSI' || mode === 'KOLISI') && newProgress > 20 && rand < 0.02)
        ) {
          quakeTimerRef.current = 0.5;
          if (containerRef.current) {
            containerRef.current.classList.add('quake-shake');
            setTimeout(() => containerRef.current?.classList.remove('quake-shake'), 500);
          }
        }
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, progress, mode]);

  const getLandform = () => {
    switch (mode) {
      case 'DIVERGEN': return 'Pematang Samudra (Mid-Ocean Ridge)';
      case 'SUBDUKSI': return 'Palung Laut & Gunung Berapi';
      case 'KOLISI': return 'Pegunungan Lipatan Tinggi';
      case 'TRANSFORM': return 'Patahan/Sesar Terlihat (Offset)';
    }
  };

  const getVolcano = () => {
    switch (mode) {
      case 'DIVERGEN': return 'Tinggi (Lava Leleran)';
      case 'SUBDUKSI': return 'Sangat Tinggi (Eksplosif)';
      case 'KOLISI': return 'Tidak Ada';
      case 'TRANSFORM': return 'Tidak Ada Magma';
    }
  };

  const getQuake = () => {
    switch (mode) {
      case 'DIVERGEN': return 'Rendah - Sedang (Dangkal)';
      case 'SUBDUKSI': return 'Tinggi (Megathrust)';
      case 'KOLISI': return 'Sangat Tinggi (Merusak)';
      case 'TRANSFORM': return 'Sangat Tinggi (Dangkal & Merusak)';
    }
  };

  const years = Math.floor(progress * 100000);

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3">
          ILMU BUMI & GEOLOGI
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: TEKTONIK LEMPENG
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Interaksi Batas Divergen, Konvergen, dan Transform
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#10b981] text-md transform rotate-2 z-30 uppercase">
            Panel Kendali
          </span>

          <div className="flex flex-col gap-4 mt-4 h-[500px] overflow-y-auto pr-2">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-xl">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-2">Pilih Jenis Batas Lempeng</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setModeHandler('DIVERGEN')}
                  className={`neo-btn py-3 px-3 text-xs font-bold text-left flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                    mode === 'DIVERGEN' ? 'bg-yellow-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>⬅️ DIVERGEN ➡️</span>
                  <span className="text-[9px] bg-white px-1 border border-black">Samudra - Samudra</span>
                </button>
                <button
                  onClick={() => setModeHandler('SUBDUKSI')}
                  className={`neo-btn py-3 px-3 text-xs font-bold text-left flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                    mode === 'SUBDUKSI' ? 'bg-yellow-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>➡️ KONVERGEN (SUBDUKSI) ⬅️</span>
                  <span className="text-[9px] bg-white px-1 border border-black">Samudra - Benua</span>
                </button>
                <button
                  onClick={() => setModeHandler('KOLISI')}
                  className={`neo-btn py-3 px-3 text-xs font-bold text-left flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                    mode === 'KOLISI' ? 'bg-yellow-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>➡️ KONVERGEN (KOLISI) ⬅️</span>
                  <span className="text-[9px] bg-white px-1 border border-black">Benua - Benua</span>
                </button>
                <button
                  onClick={() => setModeHandler('TRANSFORM')}
                  className={`neo-btn py-3 px-3 text-xs font-bold text-left flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                    mode === 'TRANSFORM' ? 'bg-yellow-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>⬆️ TRANSFORM ⬇️</span>
                  <span className="text-[9px] bg-white px-1 border border-black">Geseran Sesar</span>
                </button>
              </div>
            </div>

            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-800 uppercase text-[10px]">Waktu Geologis Berjalan</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-600">
                  {years.toLocaleString('id-ID')} Tahun
                </span>
              </div>
              <div className="w-full bg-slate-300 h-2 border border-black rounded">
                <div className="bg-emerald-500 h-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t-4 border-black pt-4 mt-2">
            <button
              onClick={handlePlayPause}
              className={`neo-btn py-3 text-xs flex-1 flex items-center justify-center gap-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                isPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'
              }`}
            >
              {isPlaying ? '⏸️ JEDA WAKTU' : progress >= 100 ? '✅ EVOLUSI SELESAI' : '▶️ JALANKAN WAKTU'}
            </button>
            <button
              onClick={handleReset}
              className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-3 text-xs flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000]"
            >
              🔄 RESET ALAM
            </button>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            ref={containerRef}
            className="bg-slate-100 border-8 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-0 relative flex flex-col items-center w-full h-[400px] overflow-hidden"
          >
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              {mode === 'TRANSFORM'
                ? 'Tampak Atas (Top-Down)'
                : 'Penampang Samping (Cross-Section)'}
            </span>

            <svg viewBox="0 0 800 400" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="magmaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.8" />
                </linearGradient>
                <pattern id="crustPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1.5" fill="#000" opacity="0.2" />
                  <circle cx="4" cy="4" r="1" fill="#000" opacity="0.1" />
                </pattern>
              </defs>

              {mode !== 'TRANSFORM' && (
                <g>
                  <rect x="0" y="200" width="800" height="200" fill="url(#magmaGrad)" />
                  <path d="M 200 250 A 50 50 0 1 0 300 250" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="10 5" opacity="0.3" />
                  <path d="M 600 250 A 50 50 0 1 1 500 250" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="10 5" opacity="0.3" />
                </g>
              )}

              {mode === 'DIVERGEN' && (
                <g>
                  <rect x="0" y="50" width="800" height="100" fill="url(#oceanGrad)" />
                  <g transform={`translate(${(progress / 100) * -40}, 0)`}>
                    <path d="M -100 150 L 398 150 L 398 220 L -100 220 Z" fill="#64748b" stroke="#1e293b" strokeWidth="3" />
                    <rect x="-100" y="150" width="498" height="70" fill="url(#crustPattern)" />
                  </g>
                  <g transform={`translate(${(progress / 100) * 40}, 0)`}>
                    <path d="M 402 150 L 900 150 L 900 220 L 402 220 Z" fill="#64748b" stroke="#1e293b" strokeWidth="3" />
                    <rect x="402" y="150" width="498" height="70" fill="url(#crustPattern)" />
                  </g>
                  <g transform={`translate(400, 220) scale(${1 + (progress / 100) * 1.5}, ${(progress / 100) * 1.2})`}>
                    <path d="M -30 0 C -10 -40, 10 -40, 30 0 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 10px #ef4444)' }} />
                  </g>
                </g>
              )}

              {mode === 'SUBDUKSI' && (
                <g>
                  <rect x="0" y="50" width="450" height="100" fill="url(#oceanGrad)" />
                  <g
                    transform={`translate(${(progress / 100) * 50}, 0) rotate(${(progress / 100) * 20}, 350, 150)`}
                  >
                    <path d="M -200 150 L 400 150 L 400 200 L -200 200 Z" fill="#475569" stroke="#0f172a" strokeWidth="3" />
                    <rect x="-200" y="150" width="600" height="50" fill="url(#crustPattern)" />
                  </g>
                  <g>
                    <path d="M 380 150 L 800 150 L 800 250 L 380 250 Z" fill="#a3e635" stroke="#3f6212" strokeWidth="3" />
                    <rect x="380" y="150" width="420" height="100" fill="url(#crustPattern)" />
                    <rect x="380" y="145" width="420" height="10" fill="#4ade80" />
                    {progress > 30 && (
                      <g transform={`translate(500, 145) scale(${1 + ((progress - 30) / 70) * 0.2}, ${(progress - 30) / 70})`}>
                        <path d="M -80 0 L -20 -100 L 20 -100 L 80 0 Z" fill="#713f12" stroke="#3f6212" strokeWidth="3" />
                        <path d="M -20 -100 L 0 -80 L 20 -100 Z" fill="#facc15" />
                      </g>
                    )}
                  </g>
                </g>
              )}

              {mode === 'KOLISI' && (
                <g>
                  <rect x="0" y="0" width="800" height="150" fill="#e0f2fe" opacity="0.5" />
                  <g transform={`translate(${(progress / 100) * 50}, 0)`}>
                    <path d="M -100 150 L 400 150 L 400 250 L -100 250 Z" fill="#a3e635" stroke="#3f6212" strokeWidth="3" />
                    <rect x="-100" y="150" width="500" height="100" fill="url(#crustPattern)" />
                    <rect x="-100" y="145" width="500" height="10" fill="#4ade80" />
                  </g>
                  <g transform={`translate(${(progress / 100) * -50}, 0)`}>
                    <path d="M 400 150 L 900 150 L 900 250 L 400 250 Z" fill="#bef264" stroke="#4d7c0f" strokeWidth="3" />
                    <rect x="400" y="150" width="500" height="100" fill="url(#crustPattern)" />
                    <rect x="400" y="145" width="500" height="10" fill="#84cc16" />
                  </g>
                  <g transform={`translate(400, 145) scale(${1 - progress / 500}, ${(progress / 100) * 1.5})`}>
                    <path d="M -150 0 Q -75 -120 0 -20 Q 75 -120 150 0 Z" fill="#84cc16" stroke="#3f6212" strokeWidth="4" />
                    <path d="M -110 -65 Q -75 -120 -40 -65 Q -75 -60 -110 -65 Z" fill="#fff" />
                    <path d="M 40 -65 Q 75 -120 110 -65 Q 75 -60 40 -65 Z" fill="#fff" />
                  </g>
                </g>
              )}

              {mode === 'TRANSFORM' && (
                <g>
                  <g transform={`translate(${(progress % 33) / 33 < 0.9 ? (progress % 33) / 33 * 5 : 40 + Math.floor(progress / 33) * 40}, 0)`}>
                    <rect x="-100" y="0" width="1000" height="200" fill="#84cc16" stroke="#3f6212" strokeWidth="4" />
                    <rect x="-100" y="0" width="1000" height="200" fill="url(#crustPattern)" opacity="0.3" />
                    <rect x="380" y="0" width="40" height="200" fill="#475569" />
                    <line x1="400" y1="0" x2="400" y2="200" stroke="#facc15" strokeWidth="2" strokeDasharray="10 10" />
                  </g>
                  <g transform={`translate(${(progress % 33) / 33 < 0.9 ? (progress % 33) / 33 * 5 : 40 + Math.floor(progress / 33) * 40}, 0)`}>
                    <rect x="-100" y="200" width="1000" height="200" fill="#a3e635" stroke="#4d7c0f" strokeWidth="4" />
                    <rect x="-100" y="200" width="1000" height="200" fill="url(#crustPattern)" opacity="0.3" />
                    <rect x="380" y="200" width="40" height="200" fill="#475569" />
                    <line x1="400" y1="200" x2="400" y2="400" stroke="#facc15" strokeWidth="2" strokeDasharray="10 10" />
                  </g>
                  <line x1="-100" y1="200" x2="900" y2="200" stroke="#000" strokeWidth="8" />
                </g>
              )}
            </svg>
          </div>

          <div className="bg-slate-900 text-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-emerald-400 text-[12px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">
              HASIL & DAMPAK GEOLOGIS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-800 p-3 border-2 border-sky-500 rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Bentuk Permukaan (Bentang Alam)</span>
                <span className="text-sm font-black text-sky-300">{getLandform()}</span>
              </div>
              <div className="bg-slate-800 p-3 border-2 border-rose-500 rounded">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Aktivitas Vulkanik (Magma)</span>
                <span className="text-sm font-black text-rose-400">{getVolcano()}</span>
              </div>
              <div className="bg-slate-800 p-3 border-2 border-yellow-500 rounded flex flex-col justify-center items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Aktivitas Seismik (Gempa)</span>
                <span className="text-sm font-black text-yellow-400">{getQuake()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-emerald-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Teori Tektonik Lempeng 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-yellow-600 border-b-2 border-black pb-1 mb-2">Batas Divergen (Saling Menjauh)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Lempeng bergerak saling menjauh akibat arus konveksi mantel. Celah diisi oleh magma yang naik, mendingin, dan membentuk <b>kerak samudra baru</b> (Mid-Ocean Ridge).
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="font-black text-lg uppercase text-slate-600 border-b-2 border-black pb-1 mb-2">Batas Transform (Saling Bergesekan)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Lempeng bergeser menyamping. Gesekan membangun tegangan hingga bebatuan patah, melepaskan energi sebagai <b>Gempa Bumi dahsyat</b>.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] col-span-1 md:col-span-2 rounded-xl">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Batas Konvergen (Saling Mendekat)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <b className="text-rose-700">Subduksi (Samudra vs Benua):</b> Lempeng samudra menunjam ke bawah lempeng benua. Gesekan memanaskan dan meleleh menjadi magma. Magma naik membentuk <b>Gunung Berapi</b> dan <b>Palung Laut</b>.
              </div>
              <div>
                <b className="text-emerald-700">Kolisi (Benua vs Benua):</b> Keduanya bertabrakan dan melipat ke atas, membentuk <b>Pegunungan Lipatan</b> seperti Himalaya. Gempa tinggi, tanpa gunung berapi.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
