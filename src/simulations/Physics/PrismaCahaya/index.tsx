import { useState, useCallback, type ReactNode } from 'react';

interface ColorInfo {
  id: string;
  hex: string;
  name: string;
}

const COLORS: ColorInfo[] = [
  { id: "red", hex: "#ef4444", name: "Merah" },
  { id: "orange", hex: "#f97316", name: "Jingga" },
  { id: "yellow", hex: "#eab308", name: "Kuning" },
  { id: "green", hex: "#22c55e", name: "Hijau" },
  { id: "blue", hex: "#3b82f6", name: "Biru" },
  { id: "violet", hex: "#a855f7", name: "Ungu" }
];

interface MaterialInfo {
  id: string;
  name: string;
  n: number[];
}

const MATERIALS: Record<string, MaterialInfo> = {
  crown: { id: "crown", name: "Kaca Mahkota", n: [1.514, 1.518, 1.522, 1.528, 1.535, 1.545] },
  flint: { id: "flint", name: "Kaca Flint", n: [1.615, 1.625, 1.635, 1.650, 1.670, 1.695] },
  water: { id: "water", name: "Air", n: [1.331, 1.333, 1.335, 1.338, 1.342, 1.348] }
};

const BASE_PRISM = [
  { x: 450, y: 50 },
  { x: 320, y: 275 },
  { x: 580, y: 275 }
];
const PRISM_CENTER = { x: 450, y: 200 };
const LIGHT_ORIGIN = { x: 110, y: 200 };
const LIGHT_DIR = { x: 1, y: 0 };

interface Point {
  x: number;
  y: number;
}

interface Face {
  p1: Point;
  p2: Point;
  n: Point;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: "1. Fenomena terurainya cahaya putih menjadi berbagai spektrum warna saat melewati prisma disebut dengan peristiwa...",
    options: ["Refleksi Internal Sempurna", "Interferensi Cahaya", "Dispersi Cahaya", "Difraksi Cahaya"],
    answer: 2
  },
  {
    question: "2. Coba pilih 'Cahaya Putih'. Perhatikan layar penangkap, warna cahaya apa yang mengalami deviasi (pembelokan) paling tajam/paling jauh ke bawah?",
    options: ["Merah", "Kuning", "Hijau", "Ungu"],
    answer: 3
  },
  {
    question: "3. Menurut prinsip optika, mengapa cahaya bisa terurai saat masuk ke dalam material prisma kaca?",
    options: ["Karena setiap warna saling tarik menarik", "Karena material prisma memiliki indeks bias yang sedikit berbeda untuk setiap panjang gelombang", "Karena prisma sengaja dicat dengan warna pelangi di dalamnya", "Karena suhu di dalam prisma sangat panas"],
    answer: 1
  },
  {
    question: "4. Ubah Material Prisma dari 'Kaca Mahkota' ke 'Kaca Flint'. Apa yang terjadi pada lebar spektrum di layar?",
    options: ["Spektrum menghilang dan menjadi gelap", "Jarak antar warna (lebar spektrum) menjadi lebih lebar karena indeks biasnya lebih tinggi", "Warna merah menjadi warna ungu", "Semua warna bersatu kembali menjadi cahaya putih"],
    answer: 1
  },
  {
    question: "5. Jika posisi rotasi terlalu ekstrem (mendekati 40 derajat untuk kaca Flint), sinar tidak akan bisa keluar menembus prisma melainkan terpantul kembali ke dalam. Fenomena ini disebut...",
    options: ["Pemantulan Internal Sempurna (Total Internal Reflection)", "Superposisi Gelombang", "Fokus Absolut Prisma", "Absorpsi Gelombang Penuh"],
    answer: 0
  }
];

function rotatePoint(cx: number, cy: number, p: Point, angleDeg: number): Point {
  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: cos * (p.x - cx) - sin * (p.y - cy) + cx,
    y: sin * (p.x - cx) + cos * (p.y - cy) + cy
  };
}

function getNormal(p1: Point, p2: Point): Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  return { x: -dy / len, y: dx / len };
}

function lineIntersect(p0: Point, p1: Point, p2: Point, p3: Point): Point | null {
  const s1_x = p1.x - p0.x;
  const s1_y = p1.y - p0.y;
  const s2_x = p3.x - p2.x;
  const s2_y = p3.y - p2.y;

  const denom = (-s2_x * s1_y + s1_x * s2_y);
  if (Math.abs(denom) < 0.0001) return null;

  const s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / denom;
  const t = (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / denom;

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    return { x: p0.x + (t * s1_x), y: p0.y + (t * s1_y) };
  }
  return null;
}

function raySegmentIntersect(origin: Point, dir: Point, p1: Point, p2: Point): Point | null {
  const p3 = { x: origin.x + dir.x * 10000, y: origin.y + dir.y * 10000 };
  return lineIntersect(origin, p3, p1, p2);
}

function refract(I: Point, N: Point, n1: number, n2: number): Point | null {
  const r = n1 / n2;
  let c = -(I.x * N.x + I.y * N.y);
  
  let normal = N;
  if (c < 0) {
    normal = { x: -N.x, y: -N.y };
    c = -c;
  }
  
  const rad = 1 - r * r * (1 - c * c);
  if (rad < 0) return null;
  
  const coef = r * c - Math.sqrt(rad);
  return {
    x: r * I.x + coef * normal.x,
    y: r * I.y + coef * normal.y
  };
}

export default function PrismaCahaya(): ReactNode {
  const [rotation, setRotation] = useState(-20);
  const [material, setMaterial] = useState("crown");
  const [lightMode, setLightMode] = useState("white");
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const activeMat = MATERIALS[material];

  const rotatedPrism = BASE_PRISM.map(p => rotatePoint(PRISM_CENTER.x, PRISM_CENTER.y, p, rotation));
  const prismPoints = rotatedPrism.map(p => `${p.x},${p.y}`).join(' ');

  const faces: Face[] = [
    { p1: rotatedPrism[0], p2: rotatedPrism[1], n: getNormal(rotatedPrism[0], rotatedPrism[1]) },
    { p1: rotatedPrism[1], p2: rotatedPrism[2], n: getNormal(rotatedPrism[1], rotatedPrism[2]) },
    { p1: rotatedPrism[2], p2: rotatedPrism[0], n: getNormal(rotatedPrism[2], rotatedPrism[0]) }
  ];

  const calculateRays = useCallback(() => {
    const rays: { p1: Point; p2: Point; color: string; width: number; glow: boolean }[] = [];
    
    let hit1: Point | null = null;
    let face1: Face | null = null;
    for (const f of faces) {
      const hit = raySegmentIntersect(LIGHT_ORIGIN, LIGHT_DIR, f.p1, f.p2);
      if (hit && (LIGHT_DIR.x * f.n.x + LIGHT_DIR.y * f.n.y) < 0) {
        hit1 = hit;
        face1 = f;
        break;
      }
    }

    if (!hit1) {
      rays.push({ p1: LIGHT_ORIGIN, p2: { x: 900, y: 200 }, color: "#fff", width: 3, glow: true });
      return { rays, status: "missed", yPositions: [], spectrumWidth: 0 };
    }

    const initialColor = lightMode === 'red' ? '#ef4444' : lightMode === 'violet' ? '#a855f7' : '#ffffff';
    rays.push({ p1: LIGHT_ORIGIN, p2: hit1, color: initialColor, width: 4, glow: true });

    const yPositions: number[] = [];
    let isTIR = false;
    let hitRightSideCount = 0;

    COLORS.forEach((color, i) => {
      if (lightMode !== 'white' && lightMode !== color.id) return;

      const n_color = activeMat.n[i];
      
      const T1 = refract(LIGHT_DIR, face1!.n, 1.0, n_color);
      if (!T1) return;

      let hit2: Point | null = null;
      let face2: Face | null = null;
      for (const f of faces) {
        if (f === face1) continue;
        const hit = raySegmentIntersect(hit1!, T1!, f.p1, f.p2);
        if (hit && ((hit.x - hit1!.x) * T1!.x + (hit.y - hit1!.y) * T1!.y > 0.01)) {
          hit2 = hit;
          face2 = f;
          break;
        }
      }

      if (hit2) {
        const internalColor = color.hex;
        rays.push({ p1: hit1!, p2: hit2, color: internalColor, width: 2, glow: false });

        const T2 = refract(T1!, face2!.n, n_color, 1.0);
        
        if (T2) {
          hitRightSideCount++;
          if (T2.x > 0) {
            const tScreen = (800 - hit2.x) / T2.x;
            const hit3 = { x: 800, y: hit2.y + tScreen * T2.y };
            
            if (hit3.y > 0 && hit3.y < 400) {
              rays.push({ p1: hit2, p2: hit3, color: color.hex, width: 3, glow: true });
              yPositions.push(hit3.y);
            } else {
              const hitOut = { x: hit2.x + 1000 * T2.x, y: hit2.y + 1000 * T2.y };
              rays.push({ p1: hit2, p2: hitOut, color: color.hex, width: 3, glow: true });
            }
          }
        } else {
          isTIR = true;
        }
      }
    });

    let spectrumWidth = 0;
    if (yPositions.length > 1) {
      const minY = Math.min(...yPositions);
      const maxY = Math.max(...yPositions);
      spectrumWidth = maxY - minY;
    }

    let status = "normal";
    if (isTIR && hitRightSideCount === 0) {
      status = "tir";
    } else if (yPositions.length === 0) {
      status = "outOfScreen";
    }

    return { rays, status, yPositions, spectrumWidth };
  }, [rotation, material, lightMode, activeMat, faces]);

  const { rays, status, spectrumWidth } = calculateRays();

  const getStatusInfo = () => {
    if (status === "missed") {
      return { text: "SINAR MELESET DARI PRISMA", className: "bg-slate-300" };
    }
    if (status === "tir") {
      return { text: "TERJADI PEMANTULAN SEMPURNA (TIR)", className: "bg-rose-400" };
    }
    if (status === "outOfScreen") {
      return { text: "SINAR KELUAR ARENA LAYAR", className: "bg-yellow-300" };
    }
    return { text: "DISPERSI NORMAL", className: "bg-emerald-300" };
  };

  const statusInfo = getStatusInfo();

  const handleMaterialSelect = (mat: string) => {
    setMaterial(mat);
  };

  const handleLightSelect = (mode: string) => {
    setLightMode(mode);
  };

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
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-purple-700">FISIKA OPTIK KELAS XI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
          LAB VIRTUAL: DISPERSI CAHAYA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
          Mengamati Penguraian Cahaya Putih (Polikromatik) pada Prisma Optik
        </p>
      </header>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl mb-8 flex flex-col gap-6 z-10 relative">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-purple-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              1. Putar Prisma (Sudut Datang)
            </label>
            <div className="bg-purple-50 p-5 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-4 h-full justify-center">
              <div className="flex justify-between items-center">
                <span className="font-black text-sm uppercase">Rotasi</span>
                <span className="font-mono font-black text-lg bg-white px-2 border-2 border-black">{rotation} deg</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                step="1"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[4px_4px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="text-xs font-bold text-slate-500 text-center">Ubah posisi untuk membiaskan cahaya</div>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-emerald-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              2. Pilih Medium Prisma
            </label>
            <div className="grid grid-cols-1 gap-2 h-full">
              {Object.entries(MATERIALS).map(([key, mat]) => (
                <button
                  key={key}
                  onClick={() => handleMaterialSelect(key)}
                  className={`border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-lg py-2 flex justify-between px-4 items-center font-bold text-sm uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${
                    material === key ? 'bg-yellow-200 ring-4 ring-black' : 'bg-slate-100'
                  }`}
                >
                  <span className="text-xl">{key === 'crown' ? '🪟' : key === 'flint' ? '💎' : '💧'}</span>
                  <span className="font-bold text-sm">{mat.name}</span>
                  <span className="font-mono bg-white px-1 border border-black text-[10px]">n ~ {mat.n[2].toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
              3. Mode Cahaya (Laser)
            </label>
            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 h-full justify-center">
              <button
                onClick={() => handleLightSelect('white')}
                className={`border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-white py-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${
                  lightMode === 'white' ? 'ring-4 ring-black' : ''
                }`}
              >
                Cahaya Putih (Polikromatik)
              </button>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => handleLightSelect('red')}
                  className={`border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-rose-200 text-rose-800 py-2 text-xs font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${
                    lightMode === 'red' ? 'ring-4 ring-black' : ''
                  }`}
                >
                  Merah Saja
                </button>
                <button
                  onClick={() => handleLightSelect('violet')}
                  className={`border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-purple-200 text-purple-800 py-2 text-xs font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${
                    lightMode === 'violet' ? 'ring-4 ring-black' : ''
                  }`}
                >
                  Ungu Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f172a] border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-2 md:p-6 relative flex flex-col items-center w-full max-w-6xl z-10 mb-10 overflow-hidden">
        <div className="absolute top-4 left-4 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform -rotate-2">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-indigo-700">VISUALISASI OPTIK</h2>
        </div>

        <div className="absolute top-4 right-4 z-30 bg-white/95 p-3 md:p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs md:text-sm font-bold uppercase w-56 md:w-72 backdrop-blur-sm">
          <h3 className="text-center font-black border-b-4 border-black pb-2 mb-1 text-purple-700">STATUS SPEKTRUM</h3>
          <div className="flex justify-between items-center mt-1">
            <span>Medium Indeks (n)</span>
            <span className="font-mono text-purple-700">~{activeMat.n[2].toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Lebar Spektrum</span>
            <span className="font-mono text-emerald-600">{spectrumWidth > 0 ? `${spectrumWidth.toFixed(1)} px` : '0 px'}</span>
          </div>
          <div className={`mt-3 text-center p-2 border-2 border-black font-black ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
        </div>

        <div className="mt-48 md:mt-16 relative w-full max-w-[900px] h-[400px] bg-slate-900 border-4 border-white overflow-hidden shadow-[inset_0px_0px_20px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          <svg viewBox="0 0 900 400" className="w-full h-full relative z-20">
            <rect x="800" y="20" width="30" height="360" fill="#f1f5f9" stroke="#fff" strokeWidth="2" />
            <text x="815" y="390" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle" transform="rotate(-90, 815, 390)">LAYAR PENANGKAP</text>

            <g transform="translate(40, 185)">
              <rect x="0" y="0" width="60" height="30" fill="#94a3b8" stroke="#fff" strokeWidth="3" rx="4" />
              <rect x="60" y="5" width="10" height="20" fill="#f87171" stroke="#fff" strokeWidth="2" />
              <text x="30" y="20" fontSize="12" fontWeight="bold" fill="#fff" textAnchor="middle">LASER</text>
            </g>

            <polygon points={prismPoints} fill="#e0f2fe" fillOpacity="0.3" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />

            {rays.map((ray, i) => (
              <line
                key={i}
                x1={ray.p1.x}
                y1={ray.p1.y}
                x2={ray.p2.x}
                y2={ray.p2.y}
                stroke={ray.color}
                strokeWidth={ray.width}
                style={{ filter: ray.glow ? 'drop-shadow(0px 0px 4px currentColor)' : 'none' }}
              />
            ))}
          </svg>
        </div>
      </div>

      <div className="bg-cyan-200 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform rotate-1 uppercase">
          KONSEP FISIKA: PEMBIASAN & DISPERSI CAHAYA
        </h3>
        <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/70 p-4 border-2 border-black border-dashed">
          Ketika cahaya merambat melewati batas dua medium berbeda (contoh: dari Udara ke Kaca), cahaya tersebut akan berbelok. Peristiwa pembelokan ini disebut <strong>Pembiasan (Refraksi)</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-indigo-700 mb-2 border-b-4 border-black pb-2 uppercase">Penguraian Cahaya (Dispersi)</h4>
            <div className="bg-indigo-50 p-4 border-2 border-black mb-3">
              <p className="text-sm font-semibold text-slate-800 text-justify">
                Cahaya putih merupakan gabungan dari berbagai spektrum warna (Merah s/d Ungu). Setiap warna memiliki panjang gelombang (lambda) yang berbeda.
                <br /><br />
                Karena Hukum Snellius membuktikan sudut bias bergantung pada indeks bias material, dan indeks bias material sedikit <strong>berbeda-beda untuk setiap warna</strong>, maka warna-warna tersebut akan berbelok dengan sudut yang berbeda saat keluar dari prisma!
              </p>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="text-lg font-black text-rose-700 mb-2 border-b-4 border-black pb-2 uppercase">Siapa yang Membelok Paling Jauh?</h4>
            <ul className="space-y-3 mt-3 text-sm font-bold text-slate-700">
              <li className="flex items-center gap-3 bg-rose-50 p-2 border-2 border-black">
                <div className="w-4 h-4 bg-red-500 border border-black shrink-0"></div>
                <span><strong>Cahaya Merah:</strong> Memiliki panjang gelombang terpanjang, dibelokkan (deviasi) paling <strong>KECIL</strong>.</span>
              </li>
              <li className="flex items-center gap-3 bg-purple-50 p-2 border-2 border-black">
                <div className="w-4 h-4 bg-purple-500 border border-black shrink-0"></div>
                <span><strong>Cahaya Ungu:</strong> Memiliki panjang gelombang terpendek, dibelokkan (deviasi) paling <strong>TAJAM/BESAR</strong>.</span>
              </li>
              <li className="p-2 border-2 border-black bg-yellow-50 text-center">
                Jika sudut datang terlalu ekstrem, sinar akan memantul sempurna di dalam kaca <strong>(Total Internal Reflection)</strong>.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-rose-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
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
                      btnClass += userAnswers[qIdx] === oIdx ? "bg-black text-white" : "bg-white text-black hover:bg-purple-200";
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
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-purple-600 text-white font-black py-4 px-10 text-xl md:text-2xl uppercase tracking-widest hover:bg-purple-700 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                CEK JAWABAN SAYA!
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? "LUAR BIASA! PEMAHAMAN FISIKA OPTIKMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP PEMBIASAN DI ATAS."}
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