import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';

type RockState = 'MAGMA' | 'IGNEOUS' | 'SEDIMENT' | 'SEDIMENTARY' | 'METAMORPHIC';

interface StateData {
  name: string;
  desc: string;
  temp: string;
  pres: string;
  trait: string;
  status: string;
  statusBg: string;
  labelColor: string;
}

const STATE_DATA: Record<RockState, StateData> = {
  MAGMA: {
    name: 'MAGMA',
    desc: 'Batu cair yang sangat panas di bawah permukaan bumi. Bersuhu antara 700°C hingga 1300°C.',
    temp: 'Sangat Panas (> 700°C)',
    pres: 'Beragam',
    trait: 'Cair berpijar',
    status: 'MAGMA CAIR',
    statusBg: 'bg-rose-500',
    labelColor: 'text-rose-500'
  },
  IGNEOUS: {
    name: 'BATUAN BEKU',
    desc: 'Terbentuk saat magma atau lava mendingin dan memadat menjadi kristal solid yang keras.',
    temp: 'Normal (Suhu Lingkungan)',
    pres: 'Rendah (Permukaan)',
    trait: 'Keras, Kristalin, Tanpa Fosil',
    status: 'BATUAN BEKU SOLID',
    statusBg: 'bg-slate-700',
    labelColor: 'text-slate-600'
  },
  SEDIMENT: {
    name: 'SEDIMEN (SERPIHAN)',
    desc: 'Pecahan batuan, pasir, lumpur, dan sisa organik yang hancur akibat angin, air, dan cuaca.',
    temp: 'Normal',
    pres: 'Rendah',
    trait: 'Lepas, Terurai, Butiran',
    status: 'MATERIAL SEDIMEN LEPAS',
    statusBg: 'bg-yellow-500',
    labelColor: 'text-orange-500'
  },
  SEDIMENTARY: {
    name: 'BATUAN SEDIMEN',
    desc: 'Terbentuk dari sedimen yang menumpuk, tertekan (kompaksi), dan merekat (sementasi) selama jutaan tahun.',
    temp: 'Normal',
    pres: 'Meningkat (Tekanan Lapisan)',
    trait: 'Berlapis (Strata), Berfosil',
    status: 'BATUAN SEDIMEN KOMPAK',
    statusBg: 'bg-orange-500',
    labelColor: 'text-orange-500'
  },
  METAMORPHIC: {
    name: 'BATUAN METAMORF',
    desc: 'Batuan yang berubah struktur dan mineralnya akibat suhu dan tekanan sangat tinggi di kerak bumi, tanpa meleleh.',
    temp: 'Tinggi (Ratusan °C)',
    pres: 'Sangat Tinggi (Tekanan Tektonik)',
    trait: 'Beresolusi/Pita (Foliasi), Keras',
    status: 'BATUAN METAMORF',
    statusBg: 'bg-purple-600',
    labelColor: 'text-purple-400'
  }
};

const quizData = [
  {
    question: "1. Proses apakah yang mengubah Magma menjadi Batuan Beku?",
    options: ["Pelapukan dan erosi oleh air hujan", "Pendinginan dan kristalisasi", "Kompaksi (ditekan kuat)", "Pelelehan"],
    answer: 1
  },
  {
    question: "2. Batuan yang terbentuk dari hancuran batuan lain (sedimen) yang mengendap dan mengeras selama jutaan tahun disebut...",
    options: ["Batuan Beku", "Magma", "Batuan Sedimen", "Batuan Metamorf"],
    answer: 2
  },
  {
    question: "3. Berdasarkan simulasi, apa yang HARUS terjadi agar batuan jenis apapun (Beku/Sedimen/Metamorf) dapat berubah kembali menjadi Magma?",
    options: ["Harus dihancurkan menjadi pasir", "Harus didinginkan di kutub", "Harus mengalami Pelelehan (Melting) akibat suhu yang sangat panas", "Harus diletakkan di permukaan bumi"],
    answer: 2
  },
  {
    question: "4. Batuan Metamorf (seperti Marmer dari Batu Kapur) terbentuk akibat pengaruh...",
    options: ["Hanya suhu dingin", "Suhu (Panas) dan Tekanan yang sangat tinggi di dalam bumi", "Tetesan air hujan terus-menerus", "Magma yang langsung membeku"],
    answer: 1
  },
  {
    question: "5. Apakah Batuan Metamorf bisa hancur kembali menjadi sedimen lepas?",
    options: ["Bisa, jika mengalami pelapukan dan erosi di permukaan bumi", "Tidak bisa, karena ia sangat keras dan abadi", "Bisa, tapi hanya jika dipanaskan", "Tidak bisa, ia hanya bisa menjadi magma"],
    answer: 0
  }
];

export default function SiklusBatuan(): ReactNode {
  const [currentState, setCurrentState] = useState<RockState>('MAGMA');
  const [effectType, setEffectType] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const data = STATE_DATA[currentState];

  const getAvailableActions = useCallback((state: RockState) => {
    switch (state) {
      case 'MAGMA':
        return ['cooling'];
      case 'IGNEOUS':
        return ['weathering', 'metamorphism', 'melting'];
      case 'SEDIMENT':
        return ['compaction'];
      case 'SEDIMENTARY':
        return ['weathering', 'metamorphism', 'melting'];
      case 'METAMORPHIC':
        return ['weathering', 'melting'];
      default:
        return [];
    }
  }, []);

  const availableActions = getAvailableActions(currentState);

  const transitionTo = useCallback((newState: RockState, effect: string) => {
    setIsTransitioning(true);
    setEffectType(effect);

    setTimeout(() => {
      setCurrentState(newState);
      setTimeout(() => {
        setIsTransitioning(false);
        setEffectType(null);
      }, 500);
    }, 1000);
  }, []);

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

  const renderRock = () => {
    switch (currentState) {
      case 'MAGMA':
        return (
          <g opacity={isTransitioning ? 0 : 1} className={effectType === 'melt' ? 'animate-pulse' : ''}>
            <path d="M -50 -40 C -20 -70, 20 -70, 50 -40 C 80 -10, 60 50, 0 60 C -60 50, -80 -10, -50 -40 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="4" />
            <path d="M -30 -20 C -10 -40, 10 -40, 30 -20 C 50 0, 40 30, 0 40 C -40 30, -50 0, -30 -20 Z" fill="#f97316" />
            <circle cx="-10" cy="-10" r="8" fill="#facc15" />
            <circle cx="20" cy="15" r="5" fill="#facc15" />
          </g>
        );
      case 'IGNEOUS':
        return (
          <g opacity={isTransitioning ? 0 : 1}>
            <defs>
              <pattern id="patIgneous" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#334155" />
                <path d="M 0 10 L 10 0 M 10 20 L 20 10" stroke="#1e293b" strokeWidth="2" fill="none" />
                <circle cx="5" cy="15" r="2" fill="#0f172a" />
                <circle cx="15" cy="5" r="1.5" fill="#f8fafc" opacity="0.5" />
              </pattern>
            </defs>
            <path d="M -60 -30 L -20 -70 L 40 -50 L 70 10 L 30 70 L -40 60 Z" fill="url(#patIgneous)" stroke="#0f172a" strokeWidth="6" strokeLinejoin="round" />
            <path d="M -50 -20 L -20 -55 L 30 -40" fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          </g>
        );
      case 'SEDIMENT':
        return (
          <g opacity={isTransitioning ? 0 : 1}>
            {[
              { cx: -40, cy: 30, r: 15, fill: '#d97706', stroke: '#78350f' },
              { cx: -10, cy: 40, r: 20, fill: '#f59e0b', stroke: '#92400e' },
              { cx: 30, cy: 35, r: 12, fill: '#b45309', stroke: '#78350f' },
              { cx: -50, cy: 0, r: 18, fill: '#fbbf24', stroke: '#b45309' },
              { cx: -15, cy: 5, r: 14, fill: '#d97706', stroke: '#78350f' },
              { cx: 25, cy: -5, r: 22, fill: '#f59e0b', stroke: '#92400e' },
              { cx: 50, cy: 10, r: 16, fill: '#b45309', stroke: '#78350f' },
              { cx: -30, cy: -30, r: 10, fill: '#fbbf24', stroke: '#b45309' },
              { cx: 0, cy: -25, r: 15, fill: '#d97706', stroke: '#78350f' },
              { cx: 30, cy: -35, r: 12, fill: '#f59e0b', stroke: '#92400e' },
            ].map((c, i) => (
              <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill} stroke={c.stroke} strokeWidth="3" />
            ))}
          </g>
        );
      case 'SEDIMENTARY':
        return (
          <g opacity={isTransitioning ? 0 : 1}>
            <defs>
              <pattern id="patSedimentary" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(5)">
                <rect width="40" height="10" y="0" fill="#d97706" />
                <rect width="40" height="10" y="10" fill="#f59e0b" />
                <rect width="40" height="10" y="20" fill="#b45309" />
                <rect width="40" height="10" y="30" fill="#fbbf24" />
                <circle cx="10" cy="5" r="2" fill="#78350f" opacity="0.5" />
                <circle cx="30" cy="25" r="3" fill="#78350f" opacity="0.3" />
              </pattern>
            </defs>
            <rect x="-60" y="-50" width="120" height="100" rx="10" fill="url(#patSedimentary)" stroke="#78350f" strokeWidth="6" />
          </g>
        );
      case 'METAMORPHIC':
        return (
          <g opacity={isTransitioning ? 0 : 1}>
            <defs>
              <pattern id="patMetamorphic" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <rect width="30" height="30" fill="#c084fc" />
                <path d="M 0 5 Q 15 15 30 5 M 0 15 Q 15 25 30 15 M 0 25 Q 15 35 30 25" fill="none" stroke="#a855f7" strokeWidth="3" />
                <path d="M 0 10 Q 15 0 30 10 M 0 20 Q 15 10 30 20" fill="none" stroke="#e9d5ff" strokeWidth="2" />
              </pattern>
            </defs>
            <path d="M -70 0 C -70 -50, -30 -80, 20 -70 C 60 -60, 80 -20, 60 30 C 40 70, -20 80, -50 50 C -80 20, -70 30, -70 0 Z" fill="url(#patMetamorphic)" stroke="#4c1d95" strokeWidth="6" strokeLinejoin="round" />
            <path d="M -50 10 C -30 -20, 10 -40, 40 -10" fill="none" stroke="#fff" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
          </g>
        );
    }
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-orange-400 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black border-2">GEOLOGI & ILMU BUMI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: SIKLUS BATUAN
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menganalisis Perubahan Wujud Batuan Akibat Proses Geologis
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Aksi Geologis
          </span>

          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => transitionTo('IGNEOUS', 'cool')}
              disabled={!availableActions.includes('cooling') || isTransitioning}
              className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-sm text-left flex items-center justify-between py-3 px-4 ${
                availableActions.includes('cooling') && !isTransitioning
                  ? 'bg-sky-300 text-black hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-pointer'
                  : 'bg-sky-300/50 text-black/50 cursor-not-allowed translate-x-[4px] translate-y-[4px] shadow-none'
              }`}
            >
              <span>❄️ Pendinginan & Kristalisasi</span>
              <span className="text-xs bg-white px-1 border border-black">→ Beku</span>
            </button>

            <button
              onClick={() => transitionTo('SEDIMENT', 'weather')}
              disabled={!availableActions.includes('weathering') || isTransitioning}
              className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-sm text-left flex items-center justify-between py-3 px-4 ${
                availableActions.includes('weathering') && !isTransitioning
                  ? 'bg-yellow-300 text-black hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-pointer'
                  : 'bg-yellow-300/50 text-black/50 cursor-not-allowed translate-x-[4px] translate-y-[4px] shadow-none'
              }`}
            >
              <span>🌧️ Pelapukan & Erosi</span>
              <span className="text-xs bg-white px-1 border border-black">→ Sedimen</span>
            </button>

            <button
              onClick={() => transitionTo('SEDIMENTARY', 'compact')}
              disabled={!availableActions.includes('compaction') || isTransitioning}
              className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-sm text-left flex items-center justify-between py-3 px-4 ${
                availableActions.includes('compaction') && !isTransitioning
                  ? 'bg-emerald-400 text-black hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-pointer'
                  : 'bg-emerald-400/50 text-black/50 cursor-not-allowed translate-x-[4px] translate-y-[4px] shadow-none'
              }`}
            >
              <span>🧱 Kompaksi & Sementasi</span>
              <span className="text-xs bg-white px-1 border border-black">→ B. Sedimen</span>
            </button>

            <button
              onClick={() => transitionTo('METAMORPHIC', 'metamorph')}
              disabled={!availableActions.includes('metamorphism') || isTransitioning}
              className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-sm text-left flex items-center justify-between py-3 px-4 ${
                availableActions.includes('metamorphism') && !isTransitioning
                  ? 'bg-purple-400 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-pointer'
                  : 'bg-purple-400/50 text-white/50 cursor-not-allowed translate-x-[4px] translate-y-[4px] shadow-none'
              }`}
            >
              <span>⚙️ Panas & Tekanan Tinggi</span>
              <span className="text-xs bg-slate-900 px-1 border border-white text-white">→ Metamorf</span>
            </button>

            <button
              onClick={() => transitionTo('MAGMA', 'melt')}
              disabled={!availableActions.includes('melting') || isTransitioning}
              className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-sm text-left flex items-center justify-between py-3 px-4 ${
                availableActions.includes('melting') && !isTransitioning
                  ? 'bg-rose-500 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-pointer'
                  : 'bg-rose-500/50 text-white/50 cursor-not-allowed translate-x-[4px] translate-y-[4px] shadow-none'
              }`}
            >
              <span>🌋 Pelelehan (Melting)</span>
              <span className="text-xs bg-black px-1 border border-white text-white">→ Magma</span>
            </button>
          </div>

          <div className="mt-4 p-3 bg-slate-100 border-2 border-dashed border-slate-400 text-xs font-bold text-slate-600 text-center">
            Pilih aksi geologis yang tersedia untuk mengubah jenis material batuan di sebelahnya.
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[450px] overflow-hidden border-8 border-black">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Ruang Observasi
          </span>

          <div className="w-full h-full relative z-10 flex items-center justify-center">
            {effectType && (
              <div className={`absolute inset-0 flex items-center justify-center z-20 transition-opacity duration-500 ${
                effectType === 'cool' ? 'bg-blue-500/20' :
                effectType === 'weather' ? 'bg-slate-500/30' :
                effectType === 'compact' ? 'bg-emerald-500/20' :
                effectType === 'metamorph' ? 'bg-purple-500/30' :
                effectType === 'melt' ? 'bg-rose-500/40' : ''
              }`}>
                <div className="text-6xl opacity-50">
                  {effectType === 'cool' && '❄️'}
                  {effectType === 'weather' && '🌧️ 💨'}
                  {effectType === 'compact' && '🧱 ⬇️'}
                  {effectType === 'metamorph' && '⚙️ 🔥'}
                  {effectType === 'melt' && '🌋 🔥'}
                </div>
              </div>
            )}

            <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible z-10 relative">
              <g transform="translate(200, 200)" className={isTransitioning ? 'animate-pulse' : ''}>
                {renderRock()}
              </g>
            </svg>
          </div>

          <div className={`absolute bottom-6 text-white px-4 py-2 border-2 border-white font-bold text-sm uppercase tracking-widest shadow-[4px_4px_0px_#facc15] z-30 transition-all ${data.statusBg}`}>
            {data.status}
          </div>
        </div>

        <div className="bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 left-6 bg-emerald-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Data Petrologi
          </span>

          <div className="mt-4">
            <h4 className="font-black text-slate-500 text-[10px] uppercase mb-1 border-b-2 border-slate-700 pb-1">Identifikasi Wujud</h4>
            <div className={`text-3xl font-black uppercase tracking-tight ${data.labelColor}`}>{data.name}</div>
          </div>

          <div className="mt-2">
            <h4 className="font-black text-slate-500 text-[10px] uppercase mb-1 border-b-2 border-slate-700 pb-1">Karakteristik Fisik</h4>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed">{data.desc}</p>
          </div>

          <div className="mt-auto grid grid-cols-1 gap-2 font-mono text-xs">
            <div className="bg-slate-800 p-3 border-2 border-black flex justify-between items-center">
              <span className="text-rose-400 font-bold uppercase">Suhu Formasi:</span>
              <span className="text-white font-black">{data.temp}</span>
            </div>
            <div className="bg-slate-800 p-3 border-2 border-black flex justify-between items-center">
              <span className="text-sky-400 font-bold uppercase">Kerapatan / Tekanan:</span>
              <span className="text-white font-black">{data.pres}</span>
            </div>
            <div className="bg-slate-800 p-3 border-2 border-black flex justify-between items-center">
              <span className="text-emerald-400 font-bold uppercase">Ciri Utama:</span>
              <span className="text-white font-black text-right w-1/2">{data.trait}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          MEMAHAMI 3 JENIS BATUAN UTAMA 🏔️
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-200 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-slate-800 border-b-2 border-black pb-1 mb-2">1. Batuan Beku (Igneous)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Terbentuk dari <b>magma atau lava yang mendingin</b> dan memadat. Tidak memiliki fosil dan biasanya tersusun dari kristal-kristal mineral. (Contoh: Basalt, Granit, Obsidian, Batu Apung).
            </p>
          </div>

          <div className="bg-orange-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-orange-800 border-b-2 border-black pb-1 mb-2">2. Batuan Sedimen</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Terbentuk dari <b>endapan serpihan (sedimen)</b> yang mengalami kompaksi (tekanan) dan sementasi selama jutaan tahun. Ciri khasnya adalah memiliki lapisan (strata) dan sering mengandung fosil. (Contoh: Batu Pasir, Batu Gamping/Kapur).
            </p>
          </div>

          <div className="bg-purple-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-purple-800 border-b-2 border-black pb-1 mb-2">3. Batuan Metamorf</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Batuan jenis apa saja yang wujudnya berubah total karena <b>panas dan tekanan ekstrem</b> di dalam bumi, tanpa sampai meleleh. Ciri khasnya sering memiliki pita-pita warna (foliasi) yang bergelombang. (Contoh: Marmer, Sabak/Slate, Kuarsit).
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl z-10 relative bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-8 mb-10">
        <h3 className="text-2xl font-black text-black mb-4 uppercase text-center bg-white border-4 border-black py-2 shadow-[4px_4px_0px_0px_#000] w-max mx-auto px-6 transform rotate-1">
          PROSES TRANSISI GEOLOGIS 🔄
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-6">
          <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-emerald-600 mb-2 uppercase">Siklus Tak Berujung</h4>
            <p className="text-sm text-slate-800 leading-relaxed font-bold">
              Dalam geologi, tidak ada awal atau akhir yang mutlak. Batuan beku bisa hancur menjadi sedimen, sedimen bisa tertekan menjadi batuan metamorf, batuan metamorf bisa meleleh kembali menjadi magma, dan seterusnya.<br /><br />
              Setiap jenis batu bisa berubah menjadi jenis batu lainnya jika lingkungan (suhu, tekanan, cuaca) mendukungnya. Proses ini memakan waktu jutaan tahun!
            </p>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600 text-white font-mono text-xs">
            <ul className="space-y-4">
              <li className="flex items-center gap-2"><span className="bg-sky-400 text-black px-2 font-black">DINGIN</span> Mengubah Magma → Batuan Beku</li>
              <li className="flex items-center gap-2"><span className="bg-yellow-400 text-black px-2 font-black">CUACA/EROSI</span> Mengubah Batu (Apa Saja) → Sedimen Lepas</li>
              <li className="flex items-center gap-2"><span className="bg-emerald-400 text-black px-2 font-black">KOMPAKSI</span> Mengubah Sedimen → Batuan Sedimen</li>
              <li className="flex items-center gap-2"><span className="bg-purple-400 text-black px-2 font-black">P + T TINGGI</span> Mengubah Batu (Beku/Sedimen) → Metamorf</li>
              <li className="flex items-center gap-2"><span className="bg-rose-500 text-white px-2 font-black">LELEH</span> Mengubah Batu (Apa Saja) → Magma</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center p-4">
            EVALUASI KONSEP GEOLOGI [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000] mb-4">
                <h4 className="font-bold mb-3 text-sm uppercase tracking-tight">{q.question}</h4>
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
                  {score === 5 ? "Luar biasa! Pemahaman geologimu sangat mantap." : "Bagus! Coba ulangi siklus di atas."}
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