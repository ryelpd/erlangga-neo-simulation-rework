import { useState, useEffect, useRef, useCallback } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: '1. Jika berbagai bentuk tabung (bejana berhubungan) diisi air, bagaimanakah keadaan permukaan air di semua tabung tersebut saat diam?',
    options: ['Berbeda-beda mengikuti bentuk tabungnya', 'Membentuk sudut kemiringan tertentu', 'Sejajar dan mendatar pada ketinggian yang sama', 'Berpusar di tengah'],
    answer: 2,
  },
  {
    question: '2. Pada Pipa U, Garis Isobar ditarik pada batas bawah pertemuan dua cairan. Apa sifat utama titik-titik pada garis ini?',
    options: ['Memiliki volume yang sama', 'Memiliki tekanan hidrostatis yang persis sama', 'Memiliki massa jenis rata-rata', 'Gaya apungnya nol'],
    answer: 1,
  },
  {
    question: '3. Perhatikan simulasi! Jika massa jenis cairan kuning (ρ₂) lebih KECIL dari air, maka ketinggian kolom kuning (h₂) akan selalu...',
    options: ['Lebih tinggi dari kolom air (h₁)', 'Lebih rendah dari kolom air (h₁)', 'Sama tinggi persis dengan kolom air', 'Menyusut menjadi setengah'],
    answer: 0,
  },
  {
    question: '4. Sebuah pipa U diisi air (ρ = 1000 kg/m³). Jika dituangkan minyak (ρ = 800 kg/m³) setinggi 10 cm, berapakah tinggi kolom air (h₁) yang naik diukur dari garis batas?',
    options: ['10 cm', '12,5 cm', '8 cm', '80 cm'],
    answer: 2,
  },
  {
    question: '5. Mengapa gravitasi (g) tidak muncul pada rumus akhir praktis ρ₁ × h₁ = ρ₂ × h₂ ?',
    options: ['Karena gravitasi tidak mempengaruhi cairan', 'Karena Pipa U diletakkan di ruang hampa', 'Karena dicoret; nilai g di kaki kiri dan kanan sama besar', 'Karena gravitasi diserap oleh bentuk U pipa'],
    answer: 2,
  },
];

const RHO_1 = 1000;
const BASE_WATER_LEVEL = 350;

export default function BejanaBerhubungan() {
  const [h2Value, setH2Value] = useState(100);
  const [rho2Value, setRho2Value] = useState(800);

  const fluid1Ref = useRef<SVGPathElement | null>(null);
  const fluid2Ref = useRef<SVGPathElement | null>(null);
  const isobarLineRef = useRef<SVGLineElement | null>(null);
  const isobarLabelBgRef = useRef<SVGRectElement | null>(null);
  const isobarLabelTextRef = useRef<SVGTextElement | null>(null);
  const h1TopLineRef = useRef<SVGLineElement | null>(null);
  const h1ArrowRef = useRef<SVGLineElement | null>(null);
  const h1TextBgRef = useRef<SVGRectElement | null>(null);
  const h1TextRef = useRef<SVGTextElement | null>(null);
  const h2TopLineRef = useRef<SVGLineElement | null>(null);
  const h2ArrowRef = useRef<SVGLineElement | null>(null);
  const h2TextBgRef = useRef<SVGRectElement | null>(null);
  const h2TextRef = useRef<SVGTextElement | null>(null);
  const pointARef = useRef<SVGCircleElement | null>(null);
  const labelABgRef = useRef<SVGRectElement | null>(null);
  const labelATextRef = useRef<SVGTextElement | null>(null);
  const pointBRef = useRef<SVGCircleElement | null>(null);
  const labelBBgRef = useRef<SVGRectElement | null>(null);
  const labelBTextRef = useRef<SVGTextElement | null>(null);

  const h1DisplayRef = useRef<HTMLSpanElement | null>(null);

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const updateSimulation = useCallback(() => {
    const h2_visual = h2Value;
    const rho2 = rho2Value;

    const delta_y = (rho2 / (2 * RHO_1)) * h2_visual;

    const y_interface = BASE_WATER_LEVEL + delta_y;
    const y_left_top = BASE_WATER_LEVEL - delta_y;
    const y_right_top = y_interface - h2_visual;

    const h1_visual = 2 * delta_y;
    const h1_cm = h1_visual / 10;

    if (h1DisplayRef.current) {
      h1DisplayRef.current.textContent = h1_cm.toFixed(1);
    }

    if (fluid1Ref.current) {
      fluid1Ref.current.setAttribute('d', `M 260 ${y_left_top} L 260 480 L 540 480 L 540 ${y_interface} L 460 ${y_interface} L 460 400 L 340 400 L 340 ${y_left_top} Z`);
    }

    if (fluid2Ref.current) {
      if (h2_visual === 0) {
        fluid2Ref.current.setAttribute('d', `M 460 ${y_interface} L 540 ${y_interface} L 540 ${y_interface} L 460 ${y_interface} Z`);
      } else {
        fluid2Ref.current.setAttribute('d', `M 460 ${y_right_top} L 540 ${y_right_top} L 540 ${y_interface} L 460 ${y_interface} Z`);
      }
    }

    if (isobarLineRef.current) {
      isobarLineRef.current.setAttribute('y1', String(y_interface));
      isobarLineRef.current.setAttribute('y2', String(y_interface));
    }
    if (isobarLabelBgRef.current) {
      isobarLabelBgRef.current.setAttribute('y', String(y_interface - 15));
    }
    if (isobarLabelTextRef.current) {
      isobarLabelTextRef.current.setAttribute('y', String(y_interface + 5));
    }

    if (pointARef.current) {
      pointARef.current.setAttribute('cy', String(y_interface));
    }
    if (labelABgRef.current) {
      labelABgRef.current.setAttribute('y', String(y_interface - 15));
    }
    if (labelATextRef.current) {
      labelATextRef.current.setAttribute('y', String(y_interface + 3));
    }

    if (pointBRef.current) {
      pointBRef.current.setAttribute('cy', String(y_interface));
    }
    if (labelBBgRef.current) {
      labelBBgRef.current.setAttribute('y', String(y_interface - 15));
    }
    if (labelBTextRef.current) {
      labelBTextRef.current.setAttribute('y', String(y_interface + 3));
    }

    if (h1TopLineRef.current) {
      h1TopLineRef.current.setAttribute('y1', String(y_left_top));
      h1TopLineRef.current.setAttribute('y2', String(y_left_top));
    }
    if (h1ArrowRef.current) {
      h1ArrowRef.current.setAttribute('y1', String(y_left_top));
      h1ArrowRef.current.setAttribute('y2', String(y_interface));
      (h1ArrowRef.current as SVGLineElement).style.opacity = h1_visual < 10 ? '0' : '1';
    }
    const mid_h1 = (y_left_top + y_interface) / 2;
    if (h1TextBgRef.current) {
      h1TextBgRef.current.setAttribute('y', String(mid_h1 - 15));
      (h1TextBgRef.current as SVGRectElement).style.opacity = h1_visual < 10 ? '0' : '1';
    }
    if (h1TextRef.current) {
      h1TextRef.current.setAttribute('y', String(mid_h1 + 5));
      (h1TextRef.current as SVGTextElement).style.opacity = h1_visual < 10 ? '0' : '1';
    }

    if (h2TopLineRef.current) {
      h2TopLineRef.current.setAttribute('y1', String(y_right_top));
      h2TopLineRef.current.setAttribute('y2', String(y_right_top));
    }
    if (h2ArrowRef.current) {
      h2ArrowRef.current.setAttribute('y1', String(y_right_top));
      h2ArrowRef.current.setAttribute('y2', String(y_interface));
      (h2ArrowRef.current as SVGLineElement).style.opacity = h2_visual < 10 ? '0' : '1';
    }
    const mid_h2 = (y_right_top + y_interface) / 2;
    if (h2TextBgRef.current) {
      h2TextBgRef.current.setAttribute('y', String(mid_h2 - 15));
      (h2TextBgRef.current as SVGRectElement).style.opacity = h2_visual < 10 ? '0' : '1';
    }
    if (h2TextRef.current) {
      h2TextRef.current.setAttribute('y', String(mid_h2 + 5));
      (h2TextRef.current as SVGTextElement).style.opacity = h2_visual < 10 ? '0' : '1';
    }
  }, [h2Value, rho2Value]);

  useEffect(() => {
    updateSimulation();
  }, [updateSimulation]);

  const selectAnswer = (qIndex: number, optIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIndex] = optIndex;
    setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
    let s = 0;
    userAnswers.forEach((ans, index) => {
      if (ans === quizData[index].answer) s++;
    });
    setScore(s);
    setQuizSubmitted(true);
  };

  const retryQuiz = () => {
    setUserAnswers(new Array(quizData.length).fill(null));
    setQuizSubmitted(false);
    setScore(0);
  };

  const getScoreMessage = () => {
    if (score === 5) return 'SEMPURNA! KAMU SUDAH MENGUASAI HUKUM POKOK HIDROSTATIKA.';
    if (score >= 3) return 'CUKUP BAIK. COBA GESER SLIDER SIMULASI LAGI UNTUK LEBIH PAHAM.';
    return 'YUK BACA MATERI DAN PERHATIKAN PENGUKURAN DI SIMULASI.';
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8" style={{
      backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)',
      backgroundSize: '24px 24px',
    }}>
      <style>{`
        .neo-box {
          background-color: #ffffff;
          border: 4px solid #000000;
          box-shadow: 8px 8px 0px 0px #000000;
          border-radius: 12px;
        }
        .neo-btn {
          border: 4px solid #000000;
          box-shadow: 6px 6px 0px 0px #000000;
          border-radius: 8px;
          transition: all 0.1s ease-in-out;
          font-weight: bold;
          cursor: pointer;
        }
        .neo-btn:active {
          transform: translate(6px, 6px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
        .neo-tag {
          border: 3px solid #000;
          box-shadow: 3px 3px 0px 0px #000;
        }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 28px;
          width: 28px;
          border: 4px solid #000000;
          border-radius: 0px;
          cursor: pointer;
          margin-top: -10px;
          box-shadow: 4px 4px 0px 0px #000000;
          transition: all 0.1s ease;
        }
        input[type=range]::-webkit-slider-thumb:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px 0px #000000;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 8px;
          cursor: pointer;
          background: #000000;
          border-radius: 4px;
        }
        .slider-yellow::-webkit-slider-thumb { background: #facc15; }
        .slider-purple::-webkit-slider-thumb { background: #c084fc; }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10 neo-box bg-emerald-300 p-6 relative">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 neo-tag font-bold text-sm transform -rotate-3">
            FISIKA KELAS XI
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 uppercase tracking-tight">
            LAB VIRTUAL: PIPA U
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
            Prinsip Bejana Berhubungan & Hukum Pokok Hidrostatika
          </p>
        </header>

        <div className="neo-box bg-white p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full bg-yellow-200 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
            <label className="flex justify-between text-sm font-bold text-black mb-4 uppercase">
              <span className="bg-white px-2 border-2 border-black text-xs">Sedikit</span>
              <span>Tuang Cairan 2 (h₂)</span>
              <span className="bg-white px-2 border-2 border-black text-xs">Banyak</span>
            </label>
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={h2Value}
              onChange={(e) => setH2Value(parseInt(e.target.value))}
              className="slider-yellow"
            />
          </div>

          <div className="flex-1 w-full bg-purple-200 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
            <label className="flex justify-between text-sm font-bold text-black mb-4 uppercase">
              <span className="bg-white px-2 border-2 border-black text-xs">Ringan</span>
              <span>Massa Jenis Cairan 2 (ρ₂)</span>
              <span className="bg-white px-2 border-2 border-black text-xs">Berat</span>
            </label>
            <input
              type="range"
              min="400"
              max="1600"
              step="50"
              value={rho2Value}
              onChange={(e) => setRho2Value(parseInt(e.target.value))}
              className="slider-purple"
            />
          </div>

          <div className="hidden lg:flex flex-col gap-2 w-48">
            <div className="bg-white p-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] text-center">
              <span className="text-[10px] font-bold uppercase block">Massa Jenis ρ₂</span>
              <span className="text-xl font-black font-mono">{rho2Value}</span><span className="text-xs font-bold"> kg/m³</span>
            </div>
          </div>
        </div>

        <div className="neo-box bg-sky-200 p-6 relative flex flex-col items-center mb-10 overflow-hidden">
          <div className="bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] absolute top-6 left-6 z-20 transform -rotate-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">AREA SIMULASI PIPA U</h2>
          </div>

          <div className="absolute top-6 right-6 z-20 bg-white/90 p-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-sky-400 border-2 border-black"></div> Cairan 1 (Air): ρ₁ = 1000 kg/m³
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 border-2 border-black"></div> Cairan 2 (Uji): Variabel ρ₂
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-20 bg-white p-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] text-center">
            <span className="text-xs font-bold uppercase block text-sky-600">Tinggi Air (h₁)</span>
            <span ref={h1DisplayRef} className="text-2xl font-black font-mono">8.0</span><span className="text-sm font-bold"> cm</span>
          </div>
          <div className="absolute bottom-6 right-6 z-20 bg-white p-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] text-center">
            <span className="text-xs font-bold uppercase block text-yellow-600">Tinggi Cairan 2 (h₂)</span>
            <span className="text-2xl font-black font-mono">{(h2Value / 10).toFixed(1)}</span><span className="text-sm font-bold"> cm</span>
          </div>

          <div className="relative w-full max-w-[800px] h-[550px] neo-box bg-white mt-16 md:mt-0 overflow-hidden border-8 border-black">
            <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <svg viewBox="0 0 800 550" className="w-full h-full relative z-20 overflow-visible">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#000" />
                </marker>
                <marker id="arrowheadStart" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="10 0, 0 3.5, 10 7" fill="#000" />
                </marker>
              </defs>

              <path ref={fluid1Ref} d="M 260 200 L 260 480 L 540 480 L 540 300 L 460 300 L 460 400 L 340 400 L 340 200 Z" fill="#38bdf8" stroke="#000" strokeWidth="4" strokeLinejoin="miter"/>
              
              <path ref={fluid2Ref} d="M 460 200 L 540 200 L 540 300 L 460 300 Z" fill="#facc15" stroke="#000" strokeWidth="4" strokeLinejoin="miter"/>

              <path d="M 260 50 L 260 480 L 540 480 L 540 50 M 460 50 L 460 400 L 340 400 L 340 50" fill="none" stroke="#000" strokeWidth="8" strokeLinejoin="miter" strokeLinecap="square"/>
              <line x1="260" y1="50" x2="340" y2="50" stroke="#000" strokeWidth="8" strokeDasharray="8 8" />
              <line x1="460" y1="50" x2="540" y2="50" stroke="#000" strokeWidth="8" strokeDasharray="8 8" />

              <line ref={isobarLineRef} x1="180" y1="300" x2="620" y2="300" stroke="#ef4444" strokeWidth="4" strokeDasharray="10 6" />
              <rect ref={isobarLabelBgRef} x="630" y="285" width="120" height="30" fill="#ef4444" stroke="#000" strokeWidth="2"/>
              <text ref={isobarLabelTextRef} x="640" y="305" fontSize="14" fontWeight="bold" fill="#fff">GARIS ISOBAR</text>

              <line ref={h1TopLineRef} x1="180" y1="200" x2="340" y2="200" stroke="#000" strokeWidth="3" strokeDasharray="6 4" />
              <line ref={h1ArrowRef} x1="220" y1="200" x2="220" y2="300" stroke="#000" strokeWidth="4" markerEnd="url(#arrowhead)" markerStart="url(#arrowheadStart)"/>
              <rect ref={h1TextBgRef} x="180" y="235" width="30" height="30" fill="#fff" stroke="#000" strokeWidth="2"/>
              <text ref={h1TextRef} x="187" y="255" fontSize="16" fontWeight="bold" fill="#000">h₁</text>

              <line ref={h2TopLineRef} x1="460" y1="200" x2="620" y2="200" stroke="#000" strokeWidth="3" strokeDasharray="6 4" />
              <line ref={h2ArrowRef} x1="580" y1="200" x2="580" y2="300" stroke="#000" strokeWidth="4" markerEnd="url(#arrowhead)" markerStart="url(#arrowheadStart)"/>
              <rect ref={h2TextBgRef} x="590" y="235" width="30" height="30" fill="#fff" stroke="#000" strokeWidth="2"/>
              <text ref={h2TextRef} x="597" y="255" fontSize="16" fontWeight="bold" fill="#000">h₂</text>

              <circle ref={pointARef} cx="300" cy="300" r="8" fill="#ef4444" stroke="#000" strokeWidth="3"/>
              <rect ref={labelABgRef} x="315" y="285" width="24" height="24" fill="#fff" stroke="#000" strokeWidth="2"/>
              <text ref={labelATextRef} x="322" y="303" fontSize="14" fontWeight="bold" fill="#000">A</text>

              <circle ref={pointBRef} cx="500" cy="300" r="8" fill="#ef4444" stroke="#000" strokeWidth="3"/>
              <rect ref={labelBBgRef} x="460" y="285" width="24" height="24" fill="#fff" stroke="#000" strokeWidth="2"/>
              <text ref={labelBTextRef} x="467" y="303" fontSize="14" fontWeight="bold" fill="#000">B</text>
            </svg>
          </div>
        </div>

        <div className="bg-yellow-300 neo-box p-6 mb-10">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform -rotate-1">
            KONSEP FISIKA: HUKUM POKOK HIDROSTATIKA
          </h3>
          <p className="text-black font-semibold text-md leading-relaxed mb-3 bg-white/60 p-3 border-2 border-black border-dashed">
            Prinsip Bejana Berhubungan menyatakan bahwa zat cair sejenis dalam tabung yang saling berhubungan akan selalu mencapai <strong>ketinggian permukaan yang mendatar/sama</strong>, tidak peduli apa bentuk tabungnya.
          </p>
          <p className="text-black font-semibold text-md leading-relaxed bg-white/60 p-3 border-2 border-black border-dashed">
            Namun, jika kita memasukkan cairan kedua yang massa jenisnya berbeda (seperti pada Pipa U di atas), permukaannya tidak akan sejajar. Titik A dan Titik B pada <strong>Garis Isobar</strong> memiliki <strong>tekanan hidrostatis yang persis sama</strong> (PA = PB). Akibatnya, cairan yang <strong>lebih ringan</strong> (massa jenisnya kecil) akan memiliki kolom (h) yang <strong>lebih tinggi</strong> untuk menghasilkan tekanan yang sama dengan cairan yang berat!
          </p>
        </div>

        <div className="bg-rose-300 neo-box p-6 mb-10">
          <h3 className="text-2xl font-bold text-black mb-6 text-center uppercase tracking-widest bg-white border-4 border-black py-2 mx-auto max-w-md shadow-[4px_4px_0px_0px_#000]">
            PAPAN RUMUS MATEMATIS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="text-xl font-bold text-rose-600 mb-4 border-b-4 border-black pb-2 uppercase">
                Kesetimbangan Tekanan Dasar
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-rose-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">TEKANAN DI GARIS ISOBAR</div>
                  <div className="text-2xl font-bold text-black font-mono mt-2">P<sub>A</sub> = P<sub>B</sub></div>
                  <p className="text-sm mt-1 font-semibold">Titik pada kedalaman dan jenis fluida yang sama memiliki tekanan yang sama.</p>
                </li>
                <li className="p-3 border-2 border-black bg-rose-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">TEKANAN HIDROSTATIS (Ph)</div>
                  <div className="text-2xl font-bold text-black font-mono mt-2">P = ρ × g × h</div>
                  <p className="text-sm mt-1 font-semibold">ρ = Massa Jenis, g = Gravitasi, h = Tinggi Kolom.</p>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="text-xl font-bold text-sky-600 mb-4 border-b-4 border-black pb-2 uppercase">
                Persamaan Pipa U
              </h4>
              <ul className="space-y-4">
                <li className="p-3 border-2 border-black bg-sky-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">PENURUNAN RUMUS</div>
                  <div className="text-lg font-bold text-black font-mono mt-2">ρ₁ × g × h₁ = ρ₂ × g × h₂</div>
                  <p className="text-sm mt-1 font-semibold">Karena gravitasi (g) di kedua sisi sama, g dapat dicoret.</p>
                </li>
                <li className="p-3 border-2 border-black bg-sky-50 relative mt-4">
                  <div className="absolute -top-3 -left-2 bg-black text-white text-xs px-2 py-1 font-bold">RUMUS PRAKTIS PIPA U</div>
                  <div className="text-2xl font-bold text-black font-mono mt-2">ρ₁ × h₁ = ρ₂ × h₂</div>
                  <p className="text-sm mt-1 font-semibold">Gunakan rumus ini untuk mencari salah satu nilai yang tidak diketahui.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-purple-300 neo-box p-6 mb-10">
          <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
            <h3 className="text-2xl font-bold uppercase tracking-widest text-center">
              EVALUASI KONSEP [KUIS]
            </h3>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
            <div className="space-y-6">
              {quizData.map((q, qIndex) => (
                <div key={qIndex} className="bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                  <h4 className="font-bold text-black mb-4 text-lg bg-white inline-block px-2 border-2 border-black">
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                        disabled={quizSubmitted}
                        className={`neo-btn text-left px-4 py-3 ${
                          quizSubmitted
                            ? optIndex === q.answer
                              ? 'bg-green-400 text-black'
                              : userAnswers[qIndex] === optIndex
                                ? 'bg-rose-400 text-black line-through'
                                : 'bg-white opacity-50'
                            : userAnswers[qIndex] === optIndex
                              ? 'bg-black text-white'
                              : 'bg-white text-black hover:bg-yellow-200'
                        }`}
                        style={quizSubmitted ? { boxShadow: '2px 2px 0px 0px #000', transform: 'translate(2px, 2px)' } : {}}
                      >
                        {quizSubmitted && optIndex === q.answer && '[ BENAR ] '}
                        {quizSubmitted && userAnswers[qIndex] === optIndex && optIndex !== q.answer && '[ SALAH ] '}
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!quizSubmitted && userAnswers.every((a) => a !== null) && (
              <div className="text-center mt-8">
                <button
                  onClick={calculateScore}
                  className="neo-btn bg-indigo-400 text-black font-bold py-3 px-10 text-xl uppercase tracking-widest hover:bg-indigo-300"
                >
                  KIRIM JAWABAN!
                </button>
              </div>
            )}

            {quizSubmitted && (
              <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                <h4 className="text-3xl font-bold text-black mb-2 uppercase">
                  SKOR AKHIR: {score} / 5
                </h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {getScoreMessage()}
                </p>
                <br />
                <button
                  onClick={retryQuiz}
                  className="neo-btn bg-black text-white py-3 px-8 text-lg uppercase tracking-wider"
                >
                  ULANGI KUIS
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="neo-box bg-white p-5 mb-10 text-sm font-semibold border-dashed">
          <h4 className="font-bold text-black mb-2 uppercase bg-black text-white inline-block px-2 py-1">
            REFERENSI MATERI:
          </h4>
          <ol className="list-decimal list-inside space-y-2 mt-2">
            <li><a href="#" className="hover:text-blue-600 underline">Modul Fisika Kelas XI Kemdikbud: Fluida Statis (Hukum Pokok Hidrostatika).</a></li>
            <li><a href="#" className="hover:text-blue-600 underline">Ruangguru. Tekanan Hidrostatis dan Prinsip Pipa U.</a></li>
            <li><a href="#" className="hover:text-blue-600 underline">Zenius Education. Penerapan Hukum Pokok Hidrostatika pada Bejana Berhubungan.</a></li>
          </ol>
        </div>
      </div>
    </div>
  );
}