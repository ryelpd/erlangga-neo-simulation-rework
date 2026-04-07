import type { ReactNode } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';

type ScenarioKey = 'normal' | 'drought' | 'hunt' | 'pest';

interface Population {
  r: number;
  b: number;
  t: number;
  k: number;
  u: number;
  e: number;
}

interface Scenario {
  target: Population;
  desc: string;
  status: string;
  statusColor: 'sky' | 'rose' | 'yellow' | 'purple';
}

const SCENARIOS: Record<ScenarioKey, Scenario> = {
  normal: {
    target: { r: 100, b: 100, t: 100, k: 100, u: 100, e: 100 },
    desc: "Ekosistem dalam keadaan normal. Produsen menghasilkan energi yang cukup untuk menopang seluruh tingkatan konsumen di atasnya secara seimbang.",
    status: "STABIL",
    statusColor: "sky"
  },
  drought: {
    target: { r: 20, b: 30, t: 40, k: 20, u: 30, e: 20 },
    desc: "Kemarau panjang membunuh sebagian besar Rumput (Produsen turun). Akibatnya, makanan tidak cukup bagi seluruh konsumen, sehingga seluruh populasi ekosistem menyusut drastis.",
    status: "KRISIS PANGAN",
    statusColor: "rose"
  },
  hunt: {
    target: { r: 150, b: 40, t: 40, k: 180, u: 200, e: 0 },
    desc: "Elang diburu habis. Akibatnya, predator tingkat bawah (Ular & Katak) meledak populasinya. Karena Ular & Katak terlalu banyak, mangsa mereka (Tikus & Belalang) diburu hingga hampir habis. Akibatnya Rumput tumbuh subur tak terkendali. (Trophic Cascade).",
    status: "TIDAK SEIMBANG",
    statusColor: "yellow"
  },
  pest: {
    target: { r: 10, b: 30, t: 250, k: 80, u: 180, e: 150 },
    desc: "Tikus berkembang biak dengan cepat. Rumput habis dimakan Tikus, sehingga Belalang kelaparan. Ular dan Elang berpesta pora karena makanan berlimpah, populasinya pun naik.",
    status: "LEDAKAN HAMA",
    statusColor: "purple"
  }
};

const BASE_R: Population = { r: 40, b: 35, t: 35, k: 35, u: 35, e: 35 };

const quizData = [
  {
    question: "1. Organisme yang dapat membuat makanannya sendiri (seperti rumput) menggunakan energi matahari disebut...",
    options: ["Konsumen Tingkat I", "Produsen", "Pengurai (Dekomposer)", "Predator Puncak"],
    answer: 1
  },
  {
    question: "2. Berdasarkan Aturan 10% Piramida Energi, jika Rumput memiliki energi 1.000 kalori, berapakah perkiraan energi yang tersimpan dan dapat dimanfaatkan oleh Konsumen I (Belalang)?",
    options: ["1.000 kalori", "500 kalori", "100 kalori", "10 kalori"],
    answer: 2
  },
  {
    question: "3. Perhatikan simulasi 'Perburuan Elang'. Mengapa populasi Rumput justru MENINGKAT tajam ketika Elang punah?",
    options: ["Karena rumput tumbuh lebih cepat tanpa elang", "Elang punah -> Ular & Katak bertambah -> Tikus & Belalang habis dimakan -> Rumput tidak ada yang memakan sehingga tumbuh subur", "Karena elang biasanya memakan rumput", "Hanya kebetulan saja"],
    answer: 1
  },
  {
    question: "4. Mengapa Jaring Makanan (Food Web) membuat ekosistem lebih stabil dibandingkan Rantai Makanan (Food Chain) tunggal?",
    options: ["Karena lebih banyak hewan yang saling bertarung", "Karena jika satu sumber makanan hilang, konsumen memiliki alternatif sumber makanan lain dari jalur yang berbeda", "Karena jaring makanan mengurung hewan agar tidak lari", "Semua salah"],
    answer: 1
  },
  {
    question: "5. Manakah dari hewan berikut yang menduduki Tingkat Trofik paling tinggi pada simulasi di atas?",
    options: ["Belalang", "Ular", "Elang", "Katak"],
    answer: 2
  }
];

export default function JaringMakanan(): ReactNode {
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('normal');
  const [population, setPopulation] = useState<Population>({ r: 100, b: 100, t: 100, k: 100, u: 100, e: 100 });

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const animFrameRef = useRef<number | null>(null);

  const activeTarget = SCENARIOS[activeScenario];

  useEffect(() => {
    const animate = () => {
      setPopulation(prev => {
        const newPop: Population = { r: 0, b: 0, t: 0, k: 0, u: 0, e: 0 };

        for (const key of Object.keys(prev) as (keyof Population)[]) {
          const diff = activeTarget.target[key] - prev[key];
          if (Math.abs(diff) > 0.5) {
            newPop[key] = prev[key] + diff * 0.05;
          } else {
            newPop[key] = activeTarget.target[key];
          }
        }

        return newPop;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [activeTarget]);

  const getNodeRadius = useCallback((key: keyof Population, pop: number): number => {
    if (pop <= 1) return 0;
    const scale = pop / 100;
    const newR = BASE_R[key] * Math.sqrt(scale);
    return Math.max(15, newR);
  }, []);

  const getNodeFill = useCallback((key: keyof Population, pop: number): string => {
    if (pop <= 1) return '#94a3b8';
    switch (key) {
      case 'r': return '#4ade80';
      case 'b':
      case 't': return '#fde047';
      case 'k':
      case 'u': return '#fdba74';
      case 'e': return '#fca5a5';
      default: return '#94a3b8';
    }
  }, []);

  const getStatusClasses = useCallback((color: string): { border: string; shadow: string; text: string } => {
    switch (color) {
      case 'rose':
        return { border: 'border-rose-400', shadow: 'shadow-[4px_4px_0px_0px_#fb7185]', text: 'text-rose-400' };
      case 'yellow':
        return { border: 'border-yellow-400', shadow: 'shadow-[4px_4px_0px_0px_#facc15]', text: 'text-yellow-400' };
      case 'purple':
        return { border: 'border-purple-400', shadow: 'shadow-[4px_4px_0px_0px_#c084fc]', text: 'text-purple-400' };
      default:
        return { border: 'border-sky-400', shadow: 'shadow-[4px_4px_0px_0px_#38bdf8]', text: 'text-sky-400' };
    }
  }, []);

  const statusClasses = getStatusClasses(activeTarget.statusColor);

  const k1Avg = (population.b + population.t) / 2;
  const k2Avg = (population.k + population.u) / 2;

  const setScenario = (key: ScenarioKey) => {
    setActiveScenario(key);
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
      <header className="text-center mb-8 max-w-7xl bg-emerald-400 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black border-2">BIOLOGI & EKOLOGI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white" style={{ textShadow: '3px 3px 0px #000' }}>
          LAB VIRTUAL: JARING MAKANAN
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Menganalisis Keseimbangan Populasi dan Aliran Energi Ekosistem
        </p>
      </header>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-5 w-full lg:w-1/4 justify-start">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Skenario Ekosistem
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <label className="text-[11px] font-black uppercase text-slate-500 bg-slate-100 p-2 border-2 border-dashed border-slate-300">
              Pilih gangguan lingkungan untuk melihat efek domino (Trophic Cascade) pada jaring makanan.
            </label>

            <div className="grid grid-cols-1 gap-3 mt-2">
              <button
                onClick={() => setScenario('normal')}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-xs py-3 px-4 ${
                  activeScenario === 'normal' ? 'bg-emerald-300 ring-4 ring-black' : 'bg-emerald-300'
                }`}
              >
                🌱 EKOSISTEM SEIMBANG
              </button>
              <button
                onClick={() => setScenario('drought')}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-xs py-3 px-4 ${
                  activeScenario === 'drought' ? 'bg-amber-200 ring-4 ring-black' : 'bg-amber-200'
                }`}
              >
                ☀️ KEMARAU PANJANG
              </button>
              <button
                onClick={() => setScenario('hunt')}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-xs py-3 px-4 ${
                  activeScenario === 'hunt' ? 'bg-rose-400 ring-4 ring-black' : 'bg-rose-400'
                }`}
              >
                🦅 PERBURUAN ELANG
              </button>
              <button
                onClick={() => setScenario('pest')}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold text-xs py-3 px-4 ${
                  activeScenario === 'pest' ? 'bg-purple-300 ring-4 ring-black' : 'bg-purple-300'
                }`}
              >
                🐀 WABAH TIKUS BESAR
              </button>
            </div>
          </div>

          <div className="mt-auto bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-yellow-400 text-[10px] mb-2 uppercase tracking-widest border-b border-slate-700 pb-1">DESKRIPSI SKENARIO</h4>
            <p className="text-xs font-semibold leading-relaxed text-slate-300">{activeTarget.desc}</p>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center justify-center w-full lg:w-2/4 min-h-[500px] overflow-hidden border-8 border-black">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Visualisasi Jaring Makanan
          </span>

          <div className="w-full h-full relative z-10 flex items-center justify-center pt-8 pb-4">
            <svg viewBox="0 0 600 500" className="w-full h-full overflow-visible">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
                <marker id="arrowYellow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#facc15" />
                </marker>
              </defs>

              <rect width="600" height="500" fill="url(#grid)" />

              <rect x="0" y="380" width="600" height="120" fill="#22c55e" opacity="0.1" />
              <text x="10" y="490" fontSize="10" fontWeight="900" fill="#16a34a" className="uppercase">Tingkat 1: Produsen</text>

              <rect x="0" y="240" width="600" height="140" fill="#facc15" opacity="0.1" />
              <text x="10" y="370" fontSize="10" fontWeight="900" fill="#ca8a04" className="uppercase">Tingkat 2: Konsumen I (Herbivora)</text>

              <rect x="0" y="120" width="600" height="120" fill="#f97316" opacity="0.1" />
              <text x="10" y="230" fontSize="10" fontWeight="900" fill="#c2410c" className="uppercase">Tingkat 3: Konsumen II (Karnivora Kecil)</text>

              <rect x="0" y="0" width="600" height="120" fill="#ef4444" opacity="0.1" />
              <text x="10" y="110" fontSize="10" fontWeight="900" fill="#b91c1c" className="uppercase">Tingkat 4: Konsumen Puncak (Apex)</text>

              <g stroke="#facc15" strokeWidth="4" markerEnd="url(#arrowYellow)" className="[stroke-dasharray:12_8] animate-[flow_1s_linear_infinite]" style={{ '@keyframes flow': { to: { strokeDashoffset: -20 } } } as React.CSSProperties}>
                <path d="M 300 420 L 180 300" fill="none" />
                <path d="M 300 420 L 420 300" fill="none" />
                <path d="M 180 300 L 180 180" fill="none" />
                <path d="M 420 300 L 420 180" fill="none" />
                <path d="M 180 180 L 420 180" fill="none" />
                <path d="M 180 180 L 300 60" fill="none" />
                <path d="M 420 180 L 300 60" fill="none" />
              </g>

              <g>
                <g transform="translate(300, 420)">
                  <circle cx="0" cy="0" r={getNodeRadius('r', population.r)} fill={getNodeFill('r', population.r)} stroke="#000" strokeWidth="4" className="transition-all duration-200" />
                  <text x="0" y="10" fontSize="30" textAnchor="middle">🌱</text>
                  <rect x="-30" y="45" width="60" height="18" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                  <text x="0" y="57" fontSize="10" fontWeight="900" textAnchor="middle">RUMPUT</text>
                </g>

                <g transform="translate(180, 300)">
                  <circle cx="0" cy="0" r={getNodeRadius('b', population.b)} fill={getNodeFill('b', population.b)} stroke="#000" strokeWidth="4" className="transition-all duration-200" />
                  <text x="0" y="10" fontSize="26" textAnchor="middle">🦗</text>
                  <rect x="-35" y="40" width="70" height="18" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                  <text x="0" y="52" fontSize="10" fontWeight="900" textAnchor="middle">BELALANG</text>
                </g>

                <g transform="translate(420, 300)">
                  <circle cx="0" cy="0" r={getNodeRadius('t', population.t)} fill={getNodeFill('t', population.t)} stroke="#000" strokeWidth="4" className="transition-all duration-200" />
                  <text x="0" y="10" fontSize="26" textAnchor="middle">🐁</text>
                  <rect x="-25" y="40" width="50" height="18" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                  <text x="0" y="52" fontSize="10" fontWeight="900" textAnchor="middle">TIKUS</text>
                </g>

                <g transform="translate(180, 180)">
                  <circle cx="0" cy="0" r={getNodeRadius('k', population.k)} fill={getNodeFill('k', population.k)} stroke="#000" strokeWidth="4" className="transition-all duration-200" />
                  <text x="0" y="10" fontSize="26" textAnchor="middle">🐸</text>
                  <rect x="-25" y="40" width="50" height="18" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                  <text x="0" y="52" fontSize="10" fontWeight="900" textAnchor="middle">KATAK</text>
                </g>

                <g transform="translate(420, 180)">
                  <circle cx="0" cy="0" r={getNodeRadius('u', population.u)} fill={getNodeFill('u', population.u)} stroke="#000" strokeWidth="4" className="transition-all duration-200" />
                  <text x="0" y="10" fontSize="26" textAnchor="middle">🐍</text>
                  <rect x="-25" y="40" width="50" height="18" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                  <text x="0" y="52" fontSize="10" fontWeight="900" textAnchor="middle">ULAR</text>
                </g>

                <g transform="translate(300, 60)">
                  <circle cx="0" cy="0" r={getNodeRadius('e', population.e)} fill={getNodeFill('e', population.e)} stroke="#000" strokeWidth="4" className="transition-all duration-200" />
                  <text x="0" y="10" fontSize="26" textAnchor="middle">🦅</text>
                  <rect x="-25" y="40" width="50" height="18" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                  <text x="0" y="52" fontSize="10" fontWeight="900" textAnchor="middle">ELANG</text>
                </g>
              </g>
            </svg>
          </div>

          <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-2 border-2 border-black font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#000] z-20">
            Arah Panah = Arah Aliran Energi (Dimakan Oleh)
          </div>
        </div>

        <div className="bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-4 w-full lg:w-1/4 justify-start">
          <span className="absolute -top-4 left-6 bg-sky-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Dinamika Populasi
          </span>

          <div className={`bg-black p-4 border-4 ${statusClasses.border} text-center ${statusClasses.shadow} mt-2 transition-colors duration-300`}>
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">Status Keseimbangan</span>
            <span className={`font-black text-2xl uppercase ${statusClasses.text}`}>{activeTarget.status}</span>
          </div>

          <div className="mt-4 flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold uppercase text-rose-400">
                <span>Konsumen III (Elang)</span>
                <span>{Math.round(population.e)}%</span>
              </div>
              <div className="w-full h-4 bg-slate-800 border-2 border-black">
                <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${Math.min(100, (population.e / 250) * 100)}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold uppercase text-orange-400">
                <span>Konsumen II (Ular, Katak)</span>
                <span>{Math.round(k2Avg)}%</span>
              </div>
              <div className="w-full h-4 bg-slate-800 border-2 border-black">
                <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${Math.min(100, (k2Avg / 250) * 100)}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold uppercase text-yellow-400">
                <span>Konsumen I (Tikus, Blg)</span>
                <span>{Math.round(k1Avg)}%</span>
              </div>
              <div className="w-full h-4 bg-slate-800 border-2 border-black">
                <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${Math.min(100, (k1Avg / 250) * 100)}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold uppercase text-emerald-400">
                <span>Produsen (Rumput)</span>
                <span>{Math.round(population.r)}%</span>
              </div>
              <div className="w-full h-4 bg-slate-800 border-2 border-black">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${Math.min(100, (population.r / 250) * 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-auto p-3 bg-slate-800 border-2 border-dashed border-slate-500 text-center">
            <div className="text-[10px] font-bold text-slate-300 leading-relaxed uppercase">
              Grafik di atas menunjukkan populasi relatif terhadap kapasitas normal (100%).
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-7xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          KONSEP EKOLOGI: RANTAI VS JARING MAKANAN 🕸️
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Produsen & Konsumen</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              <b>Produsen</b> (Tumbuhan) adalah dasar ekosistem yang membuat makanan sendiri lewat fotosintesis. Mereka dimakan oleh <b>Konsumen Tingkat I</b> (Herbivora), yang kemudian dimakan oleh <b>Konsumen Tingkat II & III</b> (Karnivora/Omnivora).
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Jaring Makanan Lebih Stabil</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Rantai makanan adalah satu jalur lurus. <b>Jaring Makanan</b> adalah gabungan banyak rantai yang saling bersilangan. Semakin kompleks jaringnya, ekosistem semakin stabil. Jika Katak punah, Ular masih bisa bertahan hidup dengan memakan Tikus.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Efek Domino (Trophic Cascade)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Gangguan pada satu spesies akan berdampak pada seluruh jaring. Contoh: Jika Elang (Predator Puncak) diburu manusia hingga punah, populasi Ular dan Katak akan meledak, yang berakibat habisnya populasi Tikus, Belalang, dan merusak keseimbangan Rumput.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl z-10 relative bg-emerald-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black text-black mb-4 uppercase">PIRAMIDA ENERGI (ATURAN 10%)</h3>
            <div className="bg-white text-black p-6 border-4 border-black text-lg font-bold shadow-[4px_4px_0px_#000] leading-relaxed">
              Setiap kali energi berpindah ke tingkat trofik yang lebih tinggi (dari yang dimakan ke yang memakan), <b>hanya sekitar 10% energi yang tersimpan</b> sebagai biomassa. Sisa 90% hilang sebagai panas atau energi gerak.
            </div>
          </div>
          <div className="bg-slate-800 p-6 border-2 border-dashed border-slate-600">
            <h4 className="font-black text-white mb-2 uppercase border-b border-slate-500 pb-1">CONTOH ALIRAN ENERGI</h4>
            <ul className="text-sm font-bold space-y-3 text-white font-mono mt-4">
              <li className="flex justify-between items-center bg-rose-500 px-3 py-1 border border-black w-2/4 mx-auto"><span>Elang</span> <span>10 kcal</span></li>
              <li className="flex justify-between items-center bg-orange-500 px-3 py-1 border border-black w-3/4 mx-auto"><span>Ular / Katak</span> <span>100 kcal</span></li>
              <li className="flex justify-between items-center bg-yellow-500 text-black px-3 py-1 border border-black w-full mx-auto"><span>Tikus / Belalang</span> <span>1,000 kcal</span></li>
              <li className="flex justify-between items-center bg-emerald-500 px-3 py-1 border border-black w-full mx-auto mt-2 scale-105"><span>Rumput (Produsen)</span> <span>10,000 kcal</span></li>
            </ul>
            <p className="text-[10px] text-slate-400 mt-4 text-center italic">Inilah sebabnya jumlah predator puncak di alam sangat sedikit dibandingkan jumlah mangsanya!</p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-7xl z-10 relative">
        <div className="bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center p-4">
            EVALUASI KONSEP [KUIS]
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
                  {score === 5 ? "Luar biasa! Pemahaman ekologimu sangat tajam." : "Bagus! Coba jalankan lagi skenario 'Perburuan Elang' untuk mengamati Trophic Cascade."}
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