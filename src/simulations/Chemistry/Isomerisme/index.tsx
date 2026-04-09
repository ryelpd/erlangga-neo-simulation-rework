import { useState, useEffect, useRef, type ReactNode } from 'react';

interface Atom {
  id: string;
  type: string;
  x: number;
  y: number;
  z: number;
}

interface Bond {
  0: string;
  1: string;
  2: number;
}

interface Isomer {
  id: string;
  name: string;
  type: string;
  bp: string;
  desc: string;
  atoms: Atom[];
  bonds: Bond[];
}

interface MoleculeData {
  name: string;
  isomers: Isomer[];
}

const MOLECULES: Record<string, MoleculeData> = {
  C4H10: {
    name: 'Butana (C₄H₁₀)',
    isomers: [
      {
        id: 'n-butane',
        name: 'n-Butana',
        type: 'Isomer Rantai',
        bp: '-0.5',
        desc: 'Rantai lurus. Luas permukaan kontak maksimal, gaya Van der Waals antar molekul paling kuat.',
        atoms: [
          { id: 'C1', type: 'CH3', x: -75, y: 25, z: 0 },
          { id: 'C2', type: 'CH2', x: -25, y: -25, z: 0 },
          { id: 'C3', type: 'CH2', x: 25, y: 25, z: 0 },
          { id: 'C4', type: 'CH3', x: 75, y: -25, z: 0 },
        ],
        bonds: [['C1', 'C2', 1], ['C2', 'C3', 1], ['C3', 'C4', 1]],
      },
      {
        id: 'iso-butane',
        name: 'Isobutana (2-metilpropana)',
        type: 'Isomer Rantai',
        bp: '-11.7',
        desc: 'Rantai bercabang 1. Bentuk lebih membulat sehingga luas sentuh berkurang, titik didih menurun.',
        atoms: [
          { id: 'C1', type: 'CH3', x: -50, y: 25, z: 0 },
          { id: 'C2', type: 'CH', x: 0, y: -25, z: 0 },
          { id: 'C3', type: 'CH3', x: 50, y: 25, z: 0 },
          { id: 'C4', type: 'CH3', x: 0, y: -45, z: 60 },
        ],
        bonds: [['C1', 'C2', 1], ['C2', 'C3', 1], ['C2', 'C4', 1]],
      },
    ],
  },
  C5H12: {
    name: 'Pentana (C₅H₁₂)',
    isomers: [
      {
        id: 'n-pentane',
        name: 'n-Pentana',
        type: 'Isomer Rantai',
        bp: '36.1',
        desc: 'Rantai karbon memanjang tanpa cabang. Gaya antar molekul sangat kuat dibanding isomernya.',
        atoms: [
          { id: 'C1', type: 'CH3', x: -100, y: 25, z: 0 },
          { id: 'C2', type: 'CH2', x: -50, y: -25, z: 0 },
          { id: 'C3', type: 'CH2', x: 0, y: 25, z: 0 },
          { id: 'C4', type: 'CH2', x: 50, y: -25, z: 0 },
          { id: 'C5', type: 'CH3', x: 100, y: 25, z: 0 },
        ],
        bonds: [['C1', 'C2', 1], ['C2', 'C3', 1], ['C3', 'C4', 1], ['C4', 'C5', 1]],
      },
      {
        id: 'iso-pentane',
        name: 'Isopentana (2-metilbutana)',
        type: 'Isomer Rantai',
        bp: '27.8',
        desc: 'Satu cabang metil. Sedikit lebih bulat dari n-pentana, menurunkan titik didihnya.',
        atoms: [
          { id: 'C1', type: 'CH3', x: -75, y: 25, z: 0 },
          { id: 'C2', type: 'CH', x: -25, y: -25, z: 0 },
          { id: 'C3', type: 'CH2', x: 25, y: 25, z: 0 },
          { id: 'C4', type: 'CH3', x: 75, y: -25, z: 0 },
          { id: 'C5', type: 'CH3', x: -25, y: -45, z: 60 },
        ],
        bonds: [['C1', 'C2', 1], ['C2', 'C3', 1], ['C3', 'C4', 1], ['C2', 'C5', 1]],
      },
      {
        id: 'neo-pentane',
        name: 'Neopentana (2,2-dimetilpropana)',
        type: 'Isomer Rantai',
        bp: '9.5',
        desc: 'Bercabang banyak, bentuk menyerupai bola (sferis). Luas permukaan sangat kecil, titik didih anjlok drastis.',
        atoms: [
          { id: 'C1', type: 'CH3', x: -50, y: 50, z: 50 },
          { id: 'C2', type: 'CH3', x: 50, y: -50, z: 50 },
          { id: 'C3', type: 'C', x: 0, y: 0, z: 0 },
          { id: 'C4', type: 'CH3', x: -50, y: -50, z: -50 },
          { id: 'C5', type: 'CH3', x: 50, y: 50, z: -50 },
        ],
        bonds: [['C3', 'C1', 1], ['C3', 'C2', 1], ['C3', 'C4', 1], ['C3', 'C5', 1]],
      },
    ],
  },
  C4H8: {
    name: 'Butena (C₄H₈)',
    isomers: [
      {
        id: '1-butene',
        name: '1-Butena',
        type: 'Isomer Posisi',
        bp: '-6.3',
        desc: 'Ikatan rangkap berada di ujung rantai (Posisi 1). Tidak memiliki isomer geometri (cis-trans).',
        atoms: [
          { id: 'C1', type: 'CH2', x: -75, y: 25, z: 0 },
          { id: 'C2', type: 'CH', x: -25, y: -25, z: 0 },
          { id: 'C3', type: 'CH2', x: 25, y: 25, z: 0 },
          { id: 'C4', type: 'CH3', x: 75, y: -25, z: 0 },
        ],
        bonds: [['C1', 'C2', 2], ['C2', 'C3', 1], ['C3', 'C4', 1]],
      },
      {
        id: 'cis-2-butene',
        name: 'Cis-2-Butena',
        type: 'Isomer Geometri',
        bp: '3.7',
        desc: 'Gugus besar (CH₃) berada di sisi yang SAMA dari ikatan rangkap. Molekul sedikit polar, titik didih lebih tinggi.',
        atoms: [
          { id: 'C1', type: 'CH3', x: -50, y: -50, z: 0 },
          { id: 'C2', type: 'CH', x: -25, y: 15, z: 0 },
          { id: 'C3', type: 'CH', x: 25, y: 15, z: 0 },
          { id: 'C4', type: 'CH3', x: 50, y: -50, z: 0 },
        ],
        bonds: [['C1', 'C2', 1], ['C2', 'C3', 2], ['C3', 'C4', 1]],
      },
      {
        id: 'trans-2-butene',
        name: 'Trans-2-Butena',
        type: 'Isomer Geometri',
        bp: '0.9',
        desc: 'Gugus besar (CH₃) berseberangan. Molekul simetris, momen dipol saling meniadakan (non-polar), titik didih lebih rendah.',
        atoms: [
          { id: 'C1', type: 'CH3', x: -50, y: 50, z: 0 },
          { id: 'C2', type: 'CH', x: -25, y: -15, z: 0 },
          { id: 'C3', type: 'CH', x: 25, y: 15, z: 0 },
          { id: 'C4', type: 'CH3', x: 50, y: -50, z: 0 },
        ],
        bonds: [['C1', 'C2', 1], ['C2', 'C3', 2], ['C3', 'C4', 1]],
      },
    ],
  },
};

const NODE_COLORS: Record<string, string> = {
  CH3: '#10b981',
  CH2: '#38bdf8',
  CH: '#facc15',
  C: '#f43f5e',
};

interface ProjectedAtom extends Atom {
  px: number;
  py: number;
  pz: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const quizData: QuizQuestion[] = [
  {
    question: '1. Isomer adalah molekul dengan...',
    options: ['Massa sama', 'Rumus molekul sama tapi struktur berbeda', 'Jumlah atom sama', 'Warna sama'],
    answer: 1,
  },
  {
    question: '2. Isomercis dan trans adalah contoh dari...',
    options: ['Isomer fungsi', 'Isomer geometri', 'Isomer rantai', 'Isomer posisi'],
    answer: 1,
  },
  {
    question: '3. Dari ketiga isomer pentana (n-pentana, isopentana, neopentana), mana yang memiliki titik didih tertinggi?',
    options: ['Neopentana', 'Isopentana', 'n-Pentana', 'Semua sama'],
    answer: 2,
  },
  {
    question: '4. Apa alasan utama titik didih neopentana lebih rendah dari n-pentana?',
    options: ['Neopentana lebih berat', 'Neopentana lebih bulat (kurang luas permukaan)', 'Neopentana lebih reaktif', 'Neopentana memiliki ikatan rangkap'],
    answer: 1,
  },
  {
    question: '5. Ikatan rangkap dua (C=C) pada alkena bersifat...',
    options: ['Fleksibel', 'Tidak bisa berputar', 'Merupakan ikatan tunggal', 'Dapat berputar bebas'],
    answer: 1,
  },
];

export default function Isomerisme(): ReactNode {
  const [currentFormula, setCurrentFormula] = useState<string>('C4H10');
  const [currentIsomerIdx, setCurrentIsomerIdx] = useState(0);
  const [angleX, setAngleX] = useState(0);
  const [angleY, setAngleY] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const animationRef = useRef<number | null>(null);
  const moleculeGroupRef = useRef<SVGGElement>(null);

  const rotate3D = (x: number, y: number, z: number, ax: number, ay: number) => {
    const cosX = Math.cos(ax);
    const sinX = Math.sin(ax);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;

    const cosY = Math.cos(ay);
    const sinY = Math.sin(ay);
    const x2 = x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;

    return { px: 250 + x2 * 1.5, py: 250 + y1 * 1.5, pz: z2 * 1.5 };
  };

  const drawMolecule = () => {
    if (!moleculeGroupRef.current) return;

    const isomer = MOLECULES[currentFormula].isomers[currentIsomerIdx];
    let currentAngleX = angleX;
    let currentAngleY = angleY;

    if (isPlaying) {
      currentAngleX += 0.005;
      currentAngleY += 0.015;
      setAngleX(currentAngleX);
      setAngleY(currentAngleY);
    }

    const projected = isomer.atoms.map((atom) => {
      const coords = rotate3D(atom.x, atom.y, atom.z, currentAngleX, currentAngleY);
      return { ...atom, ...coords };
    });

    const projectedDict: Record<string, ProjectedAtom> = {};
    projected.forEach((p) => {
      projectedDict[p.id] = p;
    });

    const renderBonds = isomer.bonds.map((bond) => {
      const a1 = projectedDict[bond[0]];
      const a2 = projectedDict[bond[1]];
      const avgZ = (a1.pz + a2.pz) / 2;
      return { a1, a2, order: bond[2], avgZ };
    });

    renderBonds.sort((a, b) => a.avgZ - b.avgZ).forEach((bond) => {
      if (bond.order === 1) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', bond.a1.px.toString());
        line.setAttribute('y1', bond.a1.py.toString());
        line.setAttribute('x2', bond.a2.px.toString());
        line.setAttribute('y2', bond.a2.py.toString());
        line.setAttribute('stroke', '#64748b');
        line.setAttribute('stroke-width', '8');
        line.setAttribute('stroke-linecap', 'round');
        moleculeGroupRef.current?.appendChild(line);
      } else if (bond.order === 2) {
        const dx = bond.a2.px - bond.a1.px;
        const dy = bond.a2.py - bond.a1.py;
        const len = Math.hypot(dx, dy);
        const nx = (-dy / len) * 6;
        const ny = (dx / len) * 6;

        const L1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        L1.setAttribute('x1', (bond.a1.px + nx).toString());
        L1.setAttribute('y1', (bond.a1.py + ny).toString());
        L1.setAttribute('x2', (bond.a2.px + nx).toString());
        L1.setAttribute('y2', (bond.a2.py + ny).toString());
        L1.setAttribute('stroke', '#1e293b');
        L1.setAttribute('stroke-width', '6');
        L1.setAttribute('stroke-linecap', 'round');
        moleculeGroupRef.current?.appendChild(L1);

        const L2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        L2.setAttribute('x1', (bond.a1.px - nx).toString());
        L2.setAttribute('y1', (bond.a1.py - ny).toString());
        L2.setAttribute('x2', (bond.a2.px - nx).toString());
        L2.setAttribute('y2', (bond.a2.py - ny).toString());
        L2.setAttribute('stroke', '#1e293b');
        L2.setAttribute('stroke-width', '6');
        L2.setAttribute('stroke-linecap', 'round');
        moleculeGroupRef.current?.appendChild(L2);
      }
    });

    projected.sort((a, b) => a.pz - b.pz).forEach((atom) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${atom.px}, ${atom.py})`);

      const scale = 1 + atom.pz / 400;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', (22 * scale).toString());
      circle.setAttribute('fill', NODE_COLORS[atom.type]);
      circle.setAttribute('stroke', '#0f172a');
      circle.setAttribute('stroke-width', (3 * scale).toString());
      g.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', (5 * scale).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', (14 * scale).toString());
      text.setAttribute('font-weight', '900');
      text.setAttribute('font-family', 'Space Grotesk, sans-serif');
      text.setAttribute('fill', '#ffffff');

      let displayText = atom.type;
      if (atom.type === 'CH3') displayText = 'CH₃';
      if (atom.type === 'CH2') displayText = 'CH₂';

      text.textContent = displayText;
      g.appendChild(text);

      moleculeGroupRef.current?.appendChild(g);
    });
  };

  useEffect(() => {
    const animate = () => {
      if (moleculeGroupRef.current) {
        moleculeGroupRef.current.innerHTML = '';
      }
      drawMolecule();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentFormula, currentIsomerIdx, angleX, angleY, isPlaying]);

  const setFormula = (formula: string) => {
    setCurrentFormula(formula);
    setCurrentIsomerIdx(0);
  };

  const handleAnswerSelect = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (userAnswers.every((a) => a !== null)) {
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

  const allAnswered = userAnswers.every((a) => a !== null);

  const isomer = MOLECULES[currentFormula].isomers[currentIsomerIdx];

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <style>{`
        .neo-box {
          background-color: #ffffff;
          border: 4px solid #000000;
          box-shadow: 8px 8px 0px 0px #000000;
          border-radius: 12px;
        }
        .neo-btn {
          border: 4px solid #000000;
          box-shadow: 4px 4px 0px 0px #000000;
          border-radius: 8px;
          transition: all 0.1s ease-in-out;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
        }
        .neo-btn:active, .neo-btn-pressed {
          transform: translate(4px, 4px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
      `}</style>

      {/* Header */}
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black font-bold text-sm transform -rotate-3 text-black">KIMIA ORGANIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: ISOMERISME
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Analisis Rantai Karbon, Isomer Struktur, dan Sifat Fisik
        </p>
      </header>

      {/* Main Workspace */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        
        {/* Controls */}
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#10b981] text-md transform rotate-2 z-30 uppercase">
            Navigasi Molekul
          </span>

          <div className="flex flex-col gap-4 mt-4">
            
            {/* Formula Selection */}
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Rumus Molekul (Keluarga)</label>
              <div className="grid grid-cols-1 gap-2">
                {['C4H10', 'C5H12', 'C4H8'].map((formula) => (
                  <button
                    key={formula}
                    onClick={() => setFormula(formula)}
                    className={`neo-btn py-2 px-3 text-xs font-bold text-left flex justify-between items-center ${currentFormula === formula ? 'bg-yellow-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                  >
                    <span>🧪 {formula}</span>
                    <span className="text-[9px] bg-white px-1 border border-black">
                      {formula === 'C4H8' ? 'Alkena (C=C)' : 'Alkana'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Isomer Selection */}
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Struktur Isomer</label>
              {MOLECULES[currentFormula].isomers.map((iso, idx) => (
                <button
                  key={iso.id}
                  onClick={() => setCurrentIsomerIdx(idx)}
                  className={`neo-btn py-2 px-3 text-xs font-bold text-left flex justify-between items-center ${currentIsomerIdx === idx ? 'bg-indigo-300 ring-4 ring-black' : 'bg-white text-slate-700'}`}
                >
                  <span>{iso.name}</span>
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1 border border-black">{iso.type}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`neo-btn py-3 text-sm flex-1 flex items-center justify-center gap-2 ${isPlaying ? 'bg-sky-400 hover:bg-sky-300' : 'bg-emerald-400 hover:bg-emerald-300'}`}
              >
                {isPlaying ? '⏸️ JEDA ROTASI' : '▶️ PUTAR MOLEKUL'}
              </button>
            </div>
          </div>

          {/* Telemetry */}
          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-emerald-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">SIFAT FISIK & STRUKTUR</h4>
            
            <div className="grid grid-cols-1 gap-2 mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Nama IUPAC</span>
                <span className="text-sm font-black text-white">{isomer.name}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Jenis Isomer</span>
                <span className="text-xs font-black text-yellow-300">{isomer.type}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Titik Didih</span>
                <div className="flex items-end gap-1">
                  <span className="text-lg font-black text-rose-400 font-mono">{isomer.bp}</span>
                  <span className="text-xs text-rose-400 font-bold mb-1">°C</span>
                </div>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-left">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Penjelasan:</span>
              <span className="text-xs font-bold text-slate-300 leading-tight block">{isomer.desc}</span>
            </div>
          </div>
        </div>

        {/* Simulation Area */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center w-full h-[600px] overflow-hidden border-8 border-black" style={{ background: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Visualisasi Model Bola & Tongkat (3D)
            </span>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <span className="border-b-2 border-slate-300 pb-1 mb-1 block">Derajat Karbon:</span>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"></div> CH₃ (Primer)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-400 border-2 border-black rounded-full"></div> CH₂ (Sekunder)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 border-2 border-black rounded-full"></div> CH (Tersier)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 border-2 border-black rounded-full"></div> C (Kuartener)</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
              <svg viewBox="0 0 500 500" className="w-full h-full overflow-visible">
                <g ref={moleculeGroupRef}></g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-2 bg-emerald-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Memahami Isomer 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-700 border-b-2 border-black pb-1 mb-2">Apa itu Isomer?</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Isomer adalah molekul-molekul yang memiliki <b>rumus kimia yang sama persis</b> (contoh: sama-sama punya 5 Karbon dan 12 Hidrogen), tetapi <b>susunan strukturnya berbeda</b> di ruang 3 dimensi. Perbedaan bentuk ini membuat sifat fisik (seperti titik didih/leleh) dan sifat kimianya juga ikut berubah.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-700 border-b-2 border-black pb-1 mb-2">Cabang vs Titik Didih</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Cobalah bandingkan <i>n-Pentana</i> (lurus) dengan <i>Neopentana</i> (bulat/bercabang banyak). Semakin banyak cabang, bentuk molekul semakin bulat seperti bola. Hal ini <b>mengurangi luas permukaan kontak</b> antar molekul, sehingga gaya tarik (Van der Waals) melemah, dan titik didihnya pun turun drastis.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-700 border-b-2 border-black pb-1 mb-2">Cis-Trans (Isomer Geometri)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Pilih C₄H₈ untuk melihat ini. Ikatan rangkap dua (C=C) itu <b>kaku dan tidak bisa berputar</b>. Akibatnya, dua gugus metil (CH₃) bisa terjebak di sisi yang sama (<i>Cis</i>) atau berseberangan (<i>Trans</i>). Cis biasanya lebih polar dan memiliki titik didih yang sedikit lebih tinggi.
            </p>
          </div>
        </div>
      </div>

      {/* Quiz */}
      <div className="mb-12 bg-amber-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
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
                      btnClass += userAnswers[qIdx] === oIdx ? "bg-black text-white" : "bg-white text-black hover:bg-sky-200";
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
                className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-sky-500 text-black font-black py-4 px-10 text-xl md:text-2xl uppercase tracking-widest hover:bg-sky-600 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                CEK JAWABAN SAYA!
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? "LUAR BIASA! PEMAHAMAN ISOMERMU SEMPURNA." : score >= 3 ? "KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI." : "JANGAN MENYERAH. BACA LAGI KONSEP ISOMER DI ATAS."}
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