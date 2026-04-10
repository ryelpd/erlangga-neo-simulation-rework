import { useState, useCallback, useEffect, useRef } from 'react';

type GateType = 'AND' | 'OR' |'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

interface GateData {
  path: string;
  eq: string;
  color: string;
  logic: (a: number, b: number) => number;
  inputs: 1 | 2;
  circle?: { cx: number; cy: number };
  extraPath?: string;
}

const GATES: Record<GateType, GateData> = {
  'AND': {
    path: 'M 0 10 L 50 10 A 50 50 0 0 1 50 110 L 0 110 Z',
    eq: 'Q = A . B',
    color: '#34d399',
    logic: (a, b) => a & b,
    inputs: 2
  },
  'OR': {
    path: 'M 0 10 Q 20 60 0 110 Q 60 110 100 60 Q 60 10 0 10 Z',
    eq: 'Q = A + B',
    color: '#38bdf8',
    logic: (a, b) => a | b,
    inputs: 2
  },
  'NOT': {
    path: 'M 0 20 L 80 60 L 0 100 Z',
    circle: { cx: 90, cy: 60 },
    eq: "Q = A'",
    color: '#f43f5e',
    logic: (a, _b) => a === 1 ? 0 : 1,
    inputs: 1
  },
  'NAND': {
    path: 'M 0 10 L 50 10 A 50 50 0 0 1 50 110 L 0 110 Z',
    circle: { cx: 110, cy: 60 },
    eq: "Q = (A . B)'",
    color: '#facc15',
    logic: (a, b) => !(a & b) ? 1 : 0,
    inputs: 2
  },
  'NOR': {
    path: 'M 0 10 Q 20 60 0 110 Q 60 110 100 60 Q 60 10 0 10 Z',
    circle: { cx: 110, cy: 60 },
    eq: "Q = (A + B)'",
    color: '#a855f7',
    logic: (a, b) => !(a | b) ? 1 : 0,
    inputs: 2
  },
  'XOR': {
    path: 'M 15 10 Q 35 60 15 110 Q 75 110 100 60 Q 75 10 15 10 Z',
    extraPath: 'M 0 10 Q 20 60 0 110',
    eq: 'Q = A (+) B',
    color: '#fb923c',
    logic: (a, b) => a ^ b,
    inputs: 2
  },
  'XNOR': {
    path: 'M 15 10 Q 35 60 15 110 Q 75 110 100 60 Q 75 10 15 10 Z',
    extraPath: 'M 0 10 Q 20 60 0 110',
    circle: { cx: 110, cy: 60 },
    eq: "Q = (A (+) B)'",
    color: '#64748b',
    logic: (a, b) => !(a ^ b) ? 1 : 0,
    inputs: 2
  }
};

export default function GerbangLogika() {
  const [selectedGate, setSelectedGate] = useState<GateType>('AND');
  const [inputA, setInputA] = useState(0);
  const [inputB, setInputB] = useState(0);

  const gateGroupRef = useRef<SVGGElement>(null);

  const gate = GATES[selectedGate];
  const outputQ = gate.logic(inputA, inputB);

  const isTwoInputs = gate.inputs === 2;

  const drawGateSymbol = useCallback(() => {
    const svg = gateGroupRef.current;
    if (!svg) return;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    if (gate.extraPath) {
      const ex = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      ex.setAttribute('d', gate.extraPath);
      ex.setAttribute('fill', 'none');
      ex.setAttribute('stroke', '#000');
      ex.setAttribute('stroke-width', '4');
      svg.appendChild(ex);
    }

    const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    body.setAttribute('d', gate.path);
    body.setAttribute('fill', gate.color);
    body.setAttribute('stroke', '#000');
    body.setAttribute('stroke-width', '4');
    svg.appendChild(body);

    if (gate.circle) {
      const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circ.setAttribute('cx', String(gate.circle.cx));
      circ.setAttribute('cy', String(gate.circle.cy));
      circ.setAttribute('r', '10');
      circ.setAttribute('fill', '#fff');
      circ.setAttribute('stroke', '#000');
      circ.setAttribute('stroke-width', '4');
      svg.appendChild(circ);
    }
  }, [gate]);

  useEffect(() => {
    drawGateSymbol();
  }, [drawGateSymbol]);

  const toggleA = () => setInputA(prev => prev === 1 ? 0 : 1);
  const toggleB = () => setInputB(prev => prev === 1 ? 0 : 1);
  const handleReset = () => {
    setInputA(0);
    setInputB(0);
    setSelectedGate('AND');
  };

  const truthTableData = isTwoInputs
    ? [
        [0, 0, GATES[selectedGate].logic(0, 0)],
        [0, 1, GATES[selectedGate].logic(0, 1)],
        [1, 0, GATES[selectedGate].logic(1, 0)],
        [1, 1, GATES[selectedGate].logic(1, 1)],
      ]
    : [
        [0, 0, GATES[selectedGate].logic(0, 0)],
        [1, 0, GATES[selectedGate].logic(1, 0)],
      ];

  const wireAPos = isTwoInputs ? 100 : 150;
  const outX = gate.circle ? 370 : 350;

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">ILMU KOMPUTER & ELEKTRONIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: GERBANG LOGIKA</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Aljabar Boolean, Sirkuit Digital, dan Tabel Kebenaran</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#34d399] text-md rotate-2 z-30 uppercase">Panel Sirkuit</span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Jenis Gerbang (Logic Gate)</label>
              <select value={selectedGate} onChange={e => setSelectedGate(e.target.value as GateType)} className="w-full p-3 border-4 border-black font-black text-lg bg-white outline-none cursor-pointer shadow-[4px_4px_0px_#000] focus:bg-yellow-100 transition-colors">
                <option value="AND">Gerbang AND</option>
                <option value="OR">Gerbang OR</option>
                <option value="NOT">Gerbang NOT (Inverter)</option>
                <option value="NAND">Gerbang NAND</option>
                <option value="NOR">Gerbang NOR</option>
                <option value="XOR">Gerbang XOR (Exclusive OR)</option>
                <option value="XNOR">Gerbang XNOR</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1 border-b-2 border-slate-300 pb-1">Kontrol Sinyal Masukan (Input)</label>
              
              <div className="flex justify-between items-center bg-blue-50 p-2 border-2 border-black rounded">
                <span className="font-black text-blue-800 text-lg">Input A</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-2xl text-slate-400">{inputA}</span>
                  <button onClick={toggleA} className={`w-16 h-8 rounded-full border-2 border-black relative cursor-pointer focus:outline-none overflow-hidden transition-colors ${inputA === 1 ? 'bg-green-100' : 'bg-slate-300'}`}>
                    <div className={`w-8 h-8 bg-white border-2 border-black rounded-full absolute -top-0.5 flex justify-center items-center font-bold text-[10px] transition-transform ${inputA === 1 ? 'translate-x-8 bg-emerald-400 text-black' : 'text-slate-500'}`}>{inputA === 1 ? 'ON' : 'OFF'}</div>
                  </button>
                </div>
              </div>

              <div className={`flex justify-between items-center bg-rose-50 p-2 border-2 border-black rounded transition-opacity ${!isTwoInputs ? 'opacity-30' : ''}`}>
                <span className="font-black text-rose-800 text-lg">Input B</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-2xl text-slate-400">{inputB}</span>
                  <button onClick={toggleB} disabled={!isTwoInputs} className={`w-16 h-8 rounded-full border-2 border-black relative cursor-pointer focus:outline-none overflow-hidden transition-colors ${!isTwoInputs ? 'cursor-not-allowed' : ''} ${inputB === 1 && isTwoInputs ? 'bg-green-100' : 'bg-slate-300'}`}>
                    <div className={`w-8 h-8 bg-white border-2 border-black rounded-full absolute -top-0.5 flex justify-center items-center font-bold text-[10px] transition-transform ${inputB === 1 && isTwoInputs ? 'translate-x-8 bg-emerald-400 text-black' : 'text-slate-500'}`}>{inputB === 1 ? 'ON' : 'OFF'}</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button onClick={handleReset} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 text-sm w-full flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">RESET SIRKUIT</button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-emerald-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">HASIL OPERASI BOOLEAN</h4>
            
            <div className="bg-black p-3 border-2 border-dashed border-emerald-500 rounded flex flex-col justify-center items-center min-h-[80px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 mb-1">Persamaan Logika (Q)</span>
              <span className="text-xl font-black text-emerald-400 font-mono tracking-widest">{gate.eq}</span>
            </div>
            
            <div className="mt-3 flex justify-between items-center bg-slate-800 p-2 border-2 border-slate-600">
              <span className="text-[10px] font-bold uppercase text-slate-400">Sinyal Keluaran (Output):</span>
              <span className={`text-2xl font-black font-mono bg-black px-3 py-1 border transition-all ${outputQ === 1 ? 'text-emerald-400 border-emerald-500 shadow-[0_0_10px_#10b981]' : 'text-slate-500 border-slate-700'}`}>{outputQ}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 border-8 border-black rounded-xl relative flex flex-col w-full h-[600px] overflow-hidden" style={{ backgroundColor: '#f8fafc', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">Visualisasi Skematik Sirkuit</span>

            <div className="w-full h-2/3 relative z-10 flex items-center justify-center p-4 pt-12 border-b-4 border-black bg-slate-800">
              <svg viewBox="0 0 600 300" className="w-full h-full overflow-visible">
                <g stroke="#334155" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={`M 50 ${wireAPos} L 250 ${wireAPos}`} />
                  {isTwoInputs && <path d="M 50 200 L 250 200" />}
                  <path d={`M ${outX} 150 L 500 150`} />
                </g>

                <g strokeWidth="4" strokeLinecap="round" fill="none">
                  <path d={`M 50 ${wireAPos} L 250 ${wireAPos}`} className={inputA === 1 ? 'text-green-500' : 'text-slate-400'} stroke={inputA === 1 ? '#22c55e' : '#94a3b8'} style={inputA === 1 ? { filter: 'drop-shadow(0 0 5px #4ade80)', strokeDasharray: '10 10', animation: 'flow 0.5s linear infinite' } : undefined} />
                  {isTwoInputs && <path d="M 50 200 L 250 200" className={inputB === 1 ? 'text-green-500' : 'text-slate-400'} stroke={inputB === 1 ? '#22c55e' : '#94a3b8'} style={inputB === 1 ? { filter: 'drop-shadow(0 0 5px #4ade80)', strokeDasharray: '10 10', animation: 'flow 0.5s linear infinite' } : undefined} />}
                  <path d={`M ${outX} 150 L 500 150`} stroke={outputQ === 1 ? '#22c55e' : '#94a3b8'} style={outputQ === 1 ? { filter: 'drop-shadow(0 0 5px #4ade80)', strokeDasharray: '10 10', animation: 'flow 0.5s linear infinite' } : undefined} />
                </g>

                <g fontFamily="Space Grotesk" fontWeight="900" fontSize="24">
                  <rect x="10" y={wireAPos - 20} width="40" height="40" rx="8" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="3" />
                  <text x="30" y={wireAPos + 8} textAnchor="middle" fill="#0284c7">A</text>
                  <text x="30" y={wireAPos - 30} textAnchor="middle" fontSize="16" fill="#38bdf8" fontFamily="monospace">{inputA}</text>

                  {isTwoInputs && (
                    <g>
                      <rect x="10" y="180" width="40" height="40" rx="8" fill="#ffe4e6" stroke="#e11d48" strokeWidth="3" />
                      <text x="30" y="208" textAnchor="middle" fill="#be123c">B</text>
                      <text x="30" y="170" textAnchor="middle" fontSize="16" fill="#fb7185" fontFamily="monospace">{inputB}</text>
                    </g>
                  )}
                </g>

                <g ref={gateGroupRef} transform={`translate(250, ${isTwoInputs ? 90 : 90})`}>
                  <text x={selectedGate === 'NOT' ? 25 : selectedGate === 'XOR' || selectedGate === 'XNOR' ? 45 : 40} y="65" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="16" fill="#000">{selectedGate}</text>
                </g>

                <g transform="translate(500, 150)">
                  <path d="M 0 -5 L 10 -5 L 10 5 L 0 5 Z" fill="#94a3b8" stroke="#000" strokeWidth="2"/>
                  <path d="M 10 -15 C 40 -15, 40 15, 10 15 Z" fill={outputQ === 1 ? '#fef08a' : '#f8fafc'} stroke={outputQ === 1 ? '#ca8a04' : '#000'} strokeWidth="3" style={outputQ === 1 ? { filter: 'drop-shadow(0 0 15px #facc15) drop-shadow(0 0 30px #fef08a)' } : undefined} />
                  <path d="M 10 -5 L 20 -10 L 25 0 L 20 10 L 10 5" fill="none" stroke={outputQ === 1 ? '#ef4444' : '#475569'} strokeWidth="2"/>
                  <text x="45" y="6" fontFamily="Space Grotesk" fontWeight="900" fontSize="20" fill="#fff">Q</text>
                </g>
              </svg>
            </div>

            <div className="w-full h-1/3 bg-white p-4 flex flex-col items-center justify-center">
              <h3 className="font-black text-sm uppercase text-slate-500 mb-2">Tabel Kebenaran (Truth Table)</h3>
              
              <table className="w-full max-w-sm border-collapse border-4 border-black text-center font-mono font-bold shadow-[4px_4px_0px_0px_#000]">
                <thead>
                  <tr className="bg-slate-200 border-b-4 border-black">
                    <th className="p-2 border-r-4 border-black w-1/3 text-blue-700">Input A</th>
                    {isTwoInputs && <th className="p-2 border-r-4 border-black w-1/3 text-rose-700">Input B</th>}
                    <th className="p-2 w-1/3 text-emerald-700">Output Q</th>
                  </tr>
                </thead>
                <tbody>
                  {truthTableData.map(([a, b, q], idx) => {
                    const isCurrent = isTwoInputs
                      ? inputA === a && inputB === b
                      : inputA === a;
                    return (
                      <tr key={idx} className={`${isCurrent ? 'bg-yellow-200 border-b-4 border-black' : 'bg-white border-b-4 border-slate-300'}`}>
                        <td className="p-2 border-r-4 border-black">{a}</td>
                        {isTwoInputs && <td className="p-2 border-r-4 border-black">{b}</td>}
                        <td className={`p-2 font-black ${q === 1 ? 'text-emerald-600' : 'text-slate-400'}`}>{q}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-emerald-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">Buku Panduan: Dasar Komputasi Digital</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">AND (Dan)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-1">Output bernilai 1 <b>HANYA JIKA</b> semua input bernilai 1.</p>
            <p className="text-[10px] text-slate-500 italic">Analogi: Dua sakelar seri. Harus ditekan keduanya agar lampu menyala.</p>
          </div>
          
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">OR (Atau)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-1">Output bernilai 1 <b>JIKA SALAH SATU</b> atau semua input bernilai 1.</p>
            <p className="text-[10px] text-slate-500 italic">Analogi: Dua sakelar paralel. Tekan salah satu saja lampu sudah menyala.</p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">NOT (Pembalikan)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-1">Membalikkan keadaan. Jika input 1, output 0. Jika input 0, output 1.</p>
            <p className="text-[10px] text-slate-500 italic">Analogi: Tombol sakelar terbalik (Normally Closed).</p>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-orange-600 border-b-2 border-black pb-1 mb-2">XOR (Eksklusif OR)</h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-1">Output 1 <b>HANYA JIKA</b> inputnya <b>berbeda</b> (1 dan 0).</p>
            <p className="text-[10px] text-slate-500 italic">Analogi: Sakelar lampu tangga dua arah.</p>
          </div>
        </div>

        <div className="mt-4 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <h4 className="font-black text-md uppercase text-yellow-300 mb-1">Tahukah Anda?</h4>
          <p className="text-sm font-semibold leading-relaxed text-slate-300">
            Gerbang <b>NAND</b> dan <b>NOR</b> disebut sebagai <i>Universal Gates</i> (Gerbang Universal). Artinya, Anda bisa membangun prosesor komputer sekompleks apapun di dunia ini hanya dengan menggunakan jutaan gerbang NAND saja!
          </p>
        </div>
      </div>

      <style>{`
        @keyframes flow {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </div>
  );
}