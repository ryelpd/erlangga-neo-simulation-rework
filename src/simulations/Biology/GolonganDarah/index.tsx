import { useState, useRef, useCallback } from 'react';

interface Patient {
  name: string;
  type: string;
  rh: string;
}

const INITIAL_PATIENTS: Patient[] = [
  { name: "Pasien 1", type: "A", rh: "+" },
  { name: "Pasien 2", type: "B", rh: "-" },
  { name: "Pasien 3", type: "AB", rh: "+" },
  { name: "Pasien 4", type: "O", rh: "-" },
  { name: "Pasien Acak", type: "O", rh: "+" }
];

const REAGENTS = {
  A: { x: 150, color: '#38bdf8', label: 'Anti-A' },
  B: { x: 300, color: '#facc15', label: 'Anti-B' },
  Rh: { x: 450, color: '#e2e8f0', label: 'Anti-Rh' }
};

export default function GolonganDarah() {
  const [currentPatientIdx, setCurrentPatientIdx] = useState(0);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [tested, setTested] = useState({ A: false, B: false, Rh: false });
  const [testResults, setTestResults] = useState({ A: null as boolean | null, B: null as boolean | null, Rh: null as boolean | null });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const bloodARef = useRef<SVGCircleElement>(null);
  const bloodBRef = useRef<SVGCircleElement>(null);
  const bloodRhRef = useRef<SVGCircleElement>(null);
  const clumpsARef = useRef<SVGGElement>(null);
  const clumpsBRef = useRef<SVGGElement>(null);
  const clumpsRhRef = useRef<SVGGElement>(null);
  const dropperRef = useRef<SVGGElement>(null);
  const dropperLiquidRef = useRef<SVGRectElement>(null);
  const fallingDropRef = useRef<SVGCircleElement>(null);

  const getRandomType = useCallback(() => {
    const types = ['A', 'B', 'AB', 'O'];
    const rhs = ['+', '-'];
    return {
      type: types[Math.floor(Math.random() * types.length)],
      rh: rhs[Math.floor(Math.random() * rhs.length)]
    };
  }, []);

  const checkAgglutination = useCallback((patient: Patient, reagentType: string): boolean => {
    if (reagentType === 'A') {
      return patient.type === 'A' || patient.type === 'AB';
    } else if (reagentType === 'B') {
      return patient.type === 'B' || patient.type === 'AB';
    } else if (reagentType === 'Rh') {
      return patient.rh === '+';
    }
    return false;
  }, []);

  const drawClumps = useCallback((groupElement: SVGGElement | null) => {
    if (!groupElement) return;
    groupElement.innerHTML = '';

    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 32;
      const cx = Math.cos(angle) * radius;
      const cy = Math.sin(angle) * radius;
      const r = 2 + Math.random() * 4;

      const clump = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      clump.setAttribute('cx', String(cx));
      clump.setAttribute('cy', String(cy));
      clump.setAttribute('r', String(r));
      clump.setAttribute('fill', '#4c0519');
      clump.setAttribute('opacity', '0.8');
      clump.style.animation = `clump 0.5s ease-out forwards`;
      clump.style.animationDelay = `${Math.random() * 0.3}s`;
      clump.style.transform = 'scale(0)';
      clump.style.transformOrigin = `${cx}px ${cy}px`;
      
      groupElement.appendChild(clump);
    }
  }, []);

  const resetBoard = useCallback(() => {
    if (bloodARef.current) bloodARef.current.setAttribute('fill', '#ef4444');
    if (bloodBRef.current) bloodBRef.current.setAttribute('fill', '#ef4444');
    if (bloodRhRef.current) bloodRhRef.current.setAttribute('fill', '#ef4444');
    
    if (clumpsARef.current) clumpsARef.current.innerHTML = '';
    if (clumpsBRef.current) clumpsBRef.current.innerHTML = '';
    if (clumpsRhRef.current) clumpsRhRef.current.innerHTML = '';

    setTested({ A: false, B: false, Rh: false });
    setTestResults({ A: null, B: null, Rh: null });
    setShowResult(false);
  }, []);

  const selectPatient = useCallback((idx: number) => {
    if (isAnimating) return;

    if (idx === 4) {
      const random = getRandomType();
      setPatients(prev => {
        const newPatients = [...prev];
        newPatients[4] = { name: "Pasien Acak", type: random.type, rh: random.rh };
        return newPatients;
      });
    }

    setCurrentPatientIdx(idx);
    resetBoard();
  }, [isAnimating, getRandomType, resetBoard]);

  const processDrop = useCallback((type: 'A' | 'B' | 'Rh') => {
    if (isAnimating || tested[type]) return;
    setIsAnimating(true);

    const patientData = patients[currentPatientIdx];
    const willClump = checkAgglutination(patientData, type);
    const rData = REAGENTS[type];

    if (dropperRef.current) {
      dropperRef.current.setAttribute('transform', `translate(${rData.x}, 90)`);
      dropperRef.current.setAttribute('opacity', '1');
    }
    if (dropperLiquidRef.current) {
      dropperLiquidRef.current.setAttribute('fill', rData.color);
    }
    if (fallingDropRef.current) {
      fallingDropRef.current.setAttribute('fill', rData.color);
    }

    setTimeout(() => {
      if (fallingDropRef.current) {
        fallingDropRef.current.style.animation = 'dropFall 0.6s ease-in forwards';
      }

      setTimeout(() => {
        if (fallingDropRef.current) {
          fallingDropRef.current.style.animation = '';
          fallingDropRef.current.style.opacity = '0';
        }
        if (dropperRef.current) {
          dropperRef.current.setAttribute('opacity', '0');
          dropperRef.current.setAttribute('transform', 'translate(150, -50)');
        }

        setTested(prev => ({ ...prev, [type]: true }));
        setTestResults(prev => ({ ...prev, [type]: willClump }));

        const bloodRef = type === 'A' ? bloodARef : type === 'B' ? bloodBRef : bloodRhRef;
        const clumpsRef = type === 'A' ? clumpsARef : type === 'B' ? clumpsBRef : clumpsRhRef;

        if (bloodRef.current) {
          bloodRef.current.setAttribute('fill', willClump ? '#9f1239' : '#dc2626');
        }

        if (willClump && clumpsRef.current) {
          drawClumps(clumpsRef.current);
        }

        setIsAnimating(false);
      }, 600);
    }, 500);
  }, [isAnimating, tested, patients, currentPatientIdx, checkAgglutination, drawClumps]);

  const analyzeResult = useCallback(() => {
    setShowResult(true);
  }, []);

  const getStatusLabel = (type: 'A' | 'B' | 'Rh') => {
    if (!tested[type]) return { text: '-', className: 'text-[10px] bg-white px-1 border border-black' };
    if (testResults[type]) {
      return { text: 'MENGGUMPAL (+)', className: 'text-[10px] bg-rose-200 text-rose-800 px-1 border border-black font-black' };
    }
    return { text: 'MULUS (-)', className: 'text-[10px] bg-slate-200 text-slate-600 px-1 border border-black font-bold' };
  };

  const getResultExplanation = () => {
    const patient = patients[currentPatientIdx];
    let explanation = `Darah pasien ini `;

    if (patient.type === 'A') explanation += `menggumpal pada Anti-A, menunjukkan adanya Antigen A. `;
    else if (patient.type === 'B') explanation += `menggumpal pada Anti-B, menunjukkan adanya Antigen B. `;
    else if (patient.type === 'AB') explanation += `menggumpal pada Anti-A dan Anti-B, menunjukkan adanya Antigen A dan B. `;
    else if (patient.type === 'O') explanation += `tidak menggumpal pada Anti-A maupun Anti-B, menunjukkan tidak ada antigen (Tipe O). `;

    if (patient.rh === '+') explanation += `Serta menggumpal pada Anti-Rh, berarti Rhesus Positif (+).`;
    else explanation += `Serta tidak menggumpal pada Anti-Rh, berarti Rhesus Negatif (-).`;

    return explanation;
  };

  const allTested = tested.A && tested.B && tested.Rh;

  return (
    <div className="min-h-screen bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <style>{`
        @keyframes dropFall {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          80% { transform: translateY(40px) scale(1); opacity: 1; }
          100% { transform: translateY(50px) scale(2); opacity: 0; }
        }
        @keyframes clump {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-rose-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative mx-4 md:mx-auto mt-4">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm -rotate-3 text-black">BIOLOGI & MEDIS</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: UJI GOLONGAN DARAH
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Analisis Aglutinasi dengan Reagen Anti-A, Anti-B, dan Anti-Rh (D)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 mx-4 md:mx-auto items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f43f5e] text-md rotate-2 z-30 uppercase">
            Panel Laboratorium
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-rose-800 border-b-2 border-rose-200 pb-1">Pilih Sampel Pasien</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => selectPatient(idx)}
                    disabled={isAnimating}
                    className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 font-bold text-xs transition-all ${
                      currentPatientIdx === idx
                        ? 'bg-rose-200 ring-4 ring-black'
                        : 'bg-white hover:bg-rose-100'
                    }`}
                  >
                    Pasien {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => selectPatient(4)}
                  disabled={isAnimating}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 font-bold text-xs col-span-2 transition-all ${
                    currentPatientIdx === 4
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  🎲 Sampel Acak (Ujian)
                </button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-blue-800 border-b-2 border-blue-200 pb-1">Teteskan Reagen (Antibodi)</label>
              <div className="flex flex-col gap-2 mt-1">
                {(['A', 'B', 'Rh'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => processDrop(type)}
                    disabled={isAnimating || tested[type]}
                    className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 font-bold text-xs flex justify-between px-3 items-center transition-all ${
                      tested[type]
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : type === 'A'
                        ? 'bg-sky-300 hover:bg-sky-200 text-black'
                        : type === 'B'
                        ? 'bg-yellow-300 hover:bg-yellow-200 text-black'
                        : 'bg-slate-200 hover:bg-slate-100 text-black'
                    }`}
                  >
                    <span>💧 Teteskan {REAGENTS[type].label}</span>
                    <span className={getStatusLabel(type).className}>{getStatusLabel(type).text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={analyzeResult}
                disabled={!allTested}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-3 text-sm flex-1 flex items-center justify-center gap-2 transition-all ${
                  allTested
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-black cursor-pointer'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                🔬 ANALISIS HASIL
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-rose-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">KESIMPULAN DIAGNOSIS</h4>

            <div className="flex flex-col gap-3 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Golongan Darah Pasien:</span>
              <div className="bg-black p-3 border-2 border-dashed border-slate-500 rounded">
                <span className="font-mono text-4xl font-black text-emerald-400 tracking-widest">
                  {showResult ? `${patients[currentPatientIdx].type}${patients[currentPatientIdx].rh}` : '?'}
                </span>
              </div>
              <span className={`text-[10px] font-bold leading-relaxed ${showResult ? 'text-white' : 'text-slate-300 italic'}`}>
                {showResult ? getResultExplanation() : 'Teteskan ketiga reagen untuk mengetahui hasil.'}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="bg-white border-8 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col items-center justify-center w-full h-[600px] overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)',
              backgroundSize: '20px 20px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">
              Kartu Uji Darah (Blood Typing Card)
            </span>

            <div className="absolute bottom-4 right-4 z-20 flex gap-2 bg-white/90 p-2 border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="flex flex-col items-center mx-1 text-[8px] font-black uppercase text-slate-500">
                <div className="w-6 h-6 bg-rose-500 border-2 border-black rounded-full mb-1"></div>
                Mulus (Negatif)
              </div>
              <div className="flex flex-col items-center mx-1 text-[8px] font-black uppercase text-slate-500">
                <div className="w-6 h-6 bg-rose-800 border-2 border-black rounded-full mb-1 relative overflow-hidden">
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#4c0519 2px, transparent 2px)', backgroundSize: '6px 6px' }}></div>
                </div>
                Menggumpal (Positif)
              </div>
            </div>

            <div className="w-full h-full max-w-[600px] relative z-10 flex items-center justify-center">
              <svg viewBox="0 0 600 400" className="w-full h-full overflow-visible" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <rect x="50" y="100" width="500" height="220" rx="20" fill="#f8fafc" stroke="#1e293b" strokeWidth="6" />

                <text x="300" y="130" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="16" fill="#64748b">KARTU UJI GOLONGAN DARAH</text>

                <g transform="translate(150, 210)">
                  <circle cx="0" cy="0" r="45" fill="#ffffff" stroke="#94a3b8" strokeWidth="4" strokeDasharray="4 4" />
                  <circle ref={bloodARef} cx="0" cy="0" r="40" fill="#ef4444" stroke="#9f1239" strokeWidth="2" />
                  <g ref={clumpsARef} />
                  <text x="0" y="70" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="bold" fontSize="14" fill="#0f172a">Anti-A</text>
                </g>

                <g transform="translate(300, 210)">
                  <circle cx="0" cy="0" r="45" fill="#ffffff" stroke="#94a3b8" strokeWidth="4" strokeDasharray="4 4" />
                  <circle ref={bloodBRef} cx="0" cy="0" r="40" fill="#ef4444" stroke="#9f1239" strokeWidth="2" />
                  <g ref={clumpsBRef} />
                  <text x="0" y="70" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="bold" fontSize="14" fill="#0f172a">Anti-B</text>
                </g>

                <g transform="translate(450, 210)">
                  <circle cx="0" cy="0" r="45" fill="#ffffff" stroke="#94a3b8" strokeWidth="4" strokeDasharray="4 4" />
                  <circle ref={bloodRhRef} cx="0" cy="0" r="40" fill="#ef4444" stroke="#9f1239" strokeWidth="2" />
                  <g ref={clumpsRhRef} />
                  <text x="0" y="70" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="bold" fontSize="14" fill="#0f172a">Anti-Rh (D)</text>
                </g>

                <g ref={dropperRef} transform="translate(150, -50)" opacity="0">
                  <path d="M -5 -20 L 5 -20 L 5 20 L 2 40 L -2 40 L -5 20 Z" fill="#e2e8f0" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M -10 -40 L 10 -40 L 15 -20 L -15 -20 Z" fill="#0f172a" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
                  <rect ref={dropperLiquidRef} x="-3" y="0" width="6" height="20" fill="#38bdf8" />
                  <circle ref={fallingDropRef} cx="0" cy="45" r="5" fill="#38bdf8" opacity="0" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-rose-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mx-4 md:mx-auto mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan: Membaca Hasil Uji Darah 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Antigen & Antibodi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Golongan darah ditentukan oleh <b>Antigen</b> (protein penanda) di permukaan sel darah merah. Cairan reagen yang kita teteskan mengandung <b>Antibodi</b> yang dirancang untuk menyerang antigen spesifik.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-purple-600 border-b-2 border-black pb-1 mb-2">Aglutinasi (Penggumpalan)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Jika darah <b>menggumpal (bercak gelap)</b> setelah ditetesi reagen, itu berarti darah tersebut POSITIF memiliki antigen itu.
              <br />• Gumpal di Anti-A = Darah punya Antigen A.
              <br />• Gumpal di Anti-B = Darah punya Antigen B.
              <br />• Gumpal di keduanya = Golongan darah AB.
              <br />• Tidak gumpal sama sekali = Golongan darah O.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-slate-600 border-b-2 border-black pb-1 mb-2">Faktor Rhesus (Rh)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Sumur ketiga (Anti-Rh atau Anti-D) menentukan apakah darah positif (+) atau negatif (-).
              <br />• Jika menggumpal = <b>Positif (+)</b>.
              <br />• Jika tetap mulus = <b>Negatif (-)</b>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}