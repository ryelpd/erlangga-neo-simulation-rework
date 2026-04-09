import { useState, useEffect, useRef } from 'react';

interface Atom {
  id: string;
  elem: string;
  color: string;
  r: number;
  x: number;
  y: number;
  z: number;
  isLP?: boolean;
  textCol?: string;
}

interface MoleculeData {
  name: string;
  shape: string;
  angle: string;
  peb: number;
  legend: { name: string; color: string }[];
  atoms: Atom[];
  bonds: [string, string, number][];
  lewisSVG: string;
}

const MOLECULES: Record<string, MoleculeData> = {
  'CO2': {
    name: 'Karbon Dioksida (CO₂)', shape: 'Linear', angle: '180°', peb: 0,
    legend: [ {name: 'Karbon (C)', color: '#475569'}, {name: 'Oksigen (O)', color: '#ef4444'} ],
    atoms: [
      { id: 'C', elem: 'C', color: '#475569', r: 35, x: 0, y: 0, z: 0 },
      { id: 'O1', elem: 'O', color: '#ef4444', r: 30, x: -110, y: 0, z: 0 },
      { id: 'O2', elem: 'O', color: '#ef4444', r: 30, x: 110, y: 0, z: 0 }
    ],
    bonds: [ ['C', 'O1', 2], ['C', 'O2', 2] ],
    lewisSVG: `
      <text x="250" y="260" text-anchor="middle" font-size="40" font-weight="900" fill="#000">C</text>
      <text x="130" y="260" text-anchor="middle" font-size="40" font-weight="900" fill="#ef4444">O</text>
      <text x="370" y="260" text-anchor="middle" font-size="40" font-weight="900" fill="#ef4444">O</text>
      <line x1="165" y1="240" x2="225" y2="240" stroke="#000" stroke-width="4"/>
      <line x1="165" y1="255" x2="225" y2="255" stroke="#000" stroke-width="4"/>
      <line x1="275" y1="240" x2="335" y2="240" stroke="#000" stroke-width="4"/>
      <line x1="275" y1="255" x2="335" y2="255" stroke="#000" stroke-width="4"/>
      <circle cx="95" cy="240" r="4" fill="#000"/>
      <circle cx="95" cy="255" r="4" fill="#000"/>
      <circle cx="130" cy="215" r="4" fill="#000"/>
      <circle cx="145" cy="215" r="4" fill="#000"/>
      <circle cx="405" cy="240" r="4" fill="#000"/>
      <circle cx="405" cy="255" r="4" fill="#000"/>
      <circle cx="355" cy="215" r="4" fill="#000"/>
      <circle cx="370" cy="215" r="4" fill="#000"/>
    `
  },
  'H2O': {
    name: 'Air (H₂O)', shape: 'Bengkok (Bent / V-Shape)', angle: '104.5°', peb: 2,
    legend: [ {name: 'Oksigen (O)', color: '#ef4444'}, {name: 'Hidrogen (H)', color: '#38bdf8'}, {name: 'Awan PEB', color: '#facc15'} ],
    atoms: [
      { id: 'O', elem: 'O', color: '#ef4444', r: 35, x: 0, y: -20, z: 0 },
      { id: 'H1', elem: 'H', color: '#38bdf8', r: 20, x: -70, y: 60, z: 0 },
      { id: 'H2', elem: 'H', color: '#38bdf8', r: 20, x: 70, y: 60, z: 0 },
      { id: 'LP1', elem: '••', color: 'rgba(250, 204, 21, 0.4)', textCol: '#000', r: 40, x: 0, y: -60, z: 60, isLP: true },
      { id: 'LP2', elem: '••', color: 'rgba(250, 204, 21, 0.4)', textCol: '#000', r: 40, x: 0, y: -60, z: -60, isLP: true }
    ],
    bonds: [ ['O', 'H1', 1], ['O', 'H2', 1], ['O', 'LP1', 0], ['O', 'LP2', 0] ],
    lewisSVG: `
      <text x="250" y="260" text-anchor="middle" font-size="40" font-weight="900" fill="#ef4444">O</text>
      <text x="130" y="260" text-anchor="middle" font-size="35" font-weight="900" fill="#38bdf8">H</text>
      <text x="370" y="260" text-anchor="middle" font-size="35" font-weight="900" fill="#38bdf8">H</text>
      <line x1="165" y1="245" x2="225" y2="245" stroke="#000" stroke-width="4"/>
      <line x1="275" y1="245" x2="335" y2="245" stroke="#000" stroke-width="4"/>
      <circle cx="240" cy="210" r="4" fill="#000"/>
      <circle cx="260" cy="210" r="4" fill="#000"/>
      <circle cx="240" cy="280" r="4" fill="#000"/>
      <circle cx="260" cy="280" r="4" fill="#000"/>
    `
  },
  'CH4': {
    name: 'Metana (CH₄)', shape: 'Tetrahedral', angle: '109.5°', peb: 0,
    legend: [ {name: 'Karbon (C)', color: '#475569'}, {name: 'Hidrogen (H)', color: '#38bdf8'} ],
    atoms: [
      { id: 'C', elem: 'C', color: '#475569', r: 35, x: 0, y: 0, z: 0 },
      { id: 'H1', elem: 'H', color: '#38bdf8', r: 20, x: 60, y: -60, z: -60 },
      { id: 'H2', elem: 'H', color: '#38bdf8', r: 20, x: -60, y: -60, z: 60 },
      { id: 'H3', elem: 'H', color: '#38bdf8', r: 20, x: -60, y: 60, z: -60 },
      { id: 'H4', elem: 'H', color: '#38bdf8', r: 20, x: 60, y: 60, z: 60 }
    ],
    bonds: [ ['C', 'H1', 1], ['C', 'H2', 1], ['C', 'H3', 1], ['C', 'H4', 1] ],
    lewisSVG: `
      <text x="250" y="260" text-anchor="middle" font-size="40" font-weight="900" fill="#475569">C</text>
      <text x="130" y="260" text-anchor="middle" font-size="35" font-weight="900" fill="#38bdf8">H</text>
      <text x="370" y="260" text-anchor="middle" font-size="35" font-weight="900" fill="#38bdf8">H</text>
      <text x="250" y="140" text-anchor="middle" font-size="35" font-weight="900" fill="#38bdf8">H</text>
      <text x="250" y="380" text-anchor="middle" font-size="35" font-weight="900" fill="#38bdf8">H</text>
      <line x1="165" y1="245" x2="225" y2="245" stroke="#000" stroke-width="4"/>
      <line x1="275" y1="245" x2="335" y2="245" stroke="#000" stroke-width="4"/>
      <line x1="250" y1="155" x2="250" y2="215" stroke="#000" stroke-width="4"/>
      <line x1="250" y1="275" x2="250" y2="335" stroke="#000" stroke-width="4"/>
    `
  },
  'NH3': {
    name: 'Amonia (NH₃)', shape: 'Piramida Trigonal', angle: '107°', peb: 1,
    legend: [ {name: 'Nitrogen (N)', color: '#818cf8'}, {name: 'Hidrogen (H)', color: '#38bdf8'}, {name: 'Awan PEB', color: '#facc15'} ],
    atoms: [
      { id: 'N', elem: 'N', color: '#818cf8', r: 35, x: 0, y: 10, z: 0 },
      { id: 'H1', elem: 'H', color: '#38bdf8', r: 20, x: 0, y: 70, z: 60 },
      { id: 'H2', elem: 'H', color: '#38bdf8', r: 20, x: -70, y: 70, z: -40 },
      { id: 'H3', elem: 'H', color: '#38bdf8', r: 20, x: 70, y: 70, z: -40 },
      { id: 'LP1', elem: '••', color: 'rgba(250, 204, 21, 0.4)', textCol: '#000', r: 45, x: 0, y: -70, z: 0, isLP: true }
    ],
    bonds: [ ['N', 'H1', 1], ['N', 'H2', 1], ['N', 'H3', 1], ['N', 'LP1', 0] ],
    lewisSVG: `
      <text x="250" y="260" text-anchor="middle" font-size="40" font-weight="900" fill="#818cf8">N</text>
      <text x="130" y="260" text-anchor="middle" font-size="35" font-weight="900" fill="#38bdf8">H</text>
      <text x="370" y="260" text-anchor="middle" font-size="35" font-weight="900" fill="#38bdf8">H</text>
      <text x="250" y="380" text-anchor="middle" font-size="35" font-weight="900" fill="#38bdf8">H</text>
      <line x1="165" y1="245" x2="220" y2="245" stroke="#000" stroke-width="4"/>
      <line x1="280" y1="245" x2="335" y2="245" stroke="#000" stroke-width="4"/>
      <line x1="250" y1="275" x2="250" y2="335" stroke="#000" stroke-width="4"/>
      <circle cx="240" cy="210" r="4" fill="#000"/>
      <circle cx="260" cy="210" r="4" fill="#000"/>
    `
  }
};

function rotate3D(x: number, y: number, z: number, ax: number, ay: number) {
  let cosX = Math.cos(ax), sinX = Math.sin(ax);
  let y1 = y * cosX - z * sinX;
  let z1 = y * sinX + z * cosX;

  let cosY = Math.cos(ay), sinY = Math.sin(ay);
  let x2 = x * cosY + z1 * sinY;
  let z2 = -x * sinY + z1 * cosY;

  return { px: 250 + x2, py: 250 + y1, pz: z2 };
}

export default function GeometriMolekul() {
  const [currentMol, setCurrentMol] = useState<string>('CO2');
  const [currentMode, setCurrentMode] = useState<'2D' | '3D'>('3D');
  const [angleX, setAngleX] = useState(0);
  const [angleY, setAngleY] = useState(0);

  const svgCanvasRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>(0);

  const currentMolecule = MOLECULES[currentMol];

  useEffect(() => {
    const loop = () => {
      if (currentMode === '3D') {
        setAngleX(prev => prev + 0.01);
        setAngleY(prev => prev + 0.015);
      }
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [currentMode]);

  useEffect(() => {
    if (!svgCanvasRef.current) return;

    if (currentMode === '2D') {
      svgCanvasRef.current.innerHTML = currentMolecule.lewisSVG;
    } else {
      const m = currentMolecule;
      const svg = svgCanvasRef.current;
      svg.innerHTML = '';

      const projected = m.atoms.map(atom => {
        let coords = rotate3D(atom.x, atom.y, atom.z, angleX, angleY);
        return { ...atom, ...coords };
      });

      projected.sort((a, b) => a.pz - b.pz);

      m.bonds.forEach(bond => {
        const a1 = projected.find(a => a.id === bond[0]);
        const a2 = projected.find(a => a.id === bond[1]);
        
        if (!a1 || !a2) return;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(a1.px));
        line.setAttribute('y1', String(a1.py));
        line.setAttribute('x2', String(a2.px));
        line.setAttribute('y2', String(a2.py));
        
        if (bond[2] === 0) {
          line.setAttribute('stroke', '#cbd5e1');
          line.setAttribute('stroke-width', '4');
          line.setAttribute('stroke-dasharray', '6 4');
        } else {
          line.setAttribute('stroke', '#1e293b');
          line.setAttribute('stroke-width', bond[2] === 2 ? '12' : '6');
        }
        svg.appendChild(line);

        if (bond[2] === 2) {
          const inner = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          inner.setAttribute('x1', String(a1.px));
          inner.setAttribute('y1', String(a1.py));
          inner.setAttribute('x2', String(a2.px));
          inner.setAttribute('y2', String(a2.py));
          inner.setAttribute('stroke', '#f8fafc');
          inner.setAttribute('stroke-width', '4');
          svg.appendChild(inner);
        }
      });

      projected.forEach(atom => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const scale = 1 + (atom.pz / 300); 

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(atom.px));
        circle.setAttribute('cy', String(atom.py));
        circle.setAttribute('r', String(atom.r * scale));
        circle.setAttribute('fill', atom.color);
        
        if (atom.isLP) {
          circle.setAttribute('stroke', '#eab308');
          circle.setAttribute('stroke-width', '2');
          circle.setAttribute('stroke-dasharray', '4 4');
        } else {
          circle.setAttribute('stroke', '#000');
          circle.setAttribute('stroke-width', '3');
        }

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(atom.px));
        text.setAttribute('y', String(atom.py + (atom.isLP ? 4 : 5) * scale));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', String((atom.isLP ? 20 : 16) * scale));
        text.setAttribute('font-weight', '900');
        text.setAttribute('fill', atom.textCol || '#fff');
        text.textContent = atom.elem;

        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
      });
    }
  }, [currentMode, currentMolecule, angleX, angleY]);

  const setMolMode = (mol: string) => {
    setCurrentMol(mol);
  };

  const getButtonClass = (mol: string) => {
    return `mol-btn neo-btn py-2 px-2 text-xs font-bold w-full ${currentMol === mol 
      ? 'bg-yellow-300 text-black ring-4 ring-black' 
      : 'bg-slate-200 text-slate-600'}`;
  };

  const getLegend = () => {
    if (currentMode === '3D') {
      return currentMolecule.legend.map(item => (
        <div key={item.name} className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-black rounded-full" style={{ backgroundColor: item.color }}></div> 
          {item.name}
        </div>
      ));
    } else {
      return (
        <>
          <div className="flex items-center gap-2"><div className="w-4 h-0 border-t-4 border-black"></div> Ikatan Kovalen (2e⁻)</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-black rounded-full"></div> Elektron Bebas</div>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center font-sans">
      <style>{`
        body { font-family: 'Space Grotesk', sans-serif; background-color: #fdfbf7; background-image: radial-gradient(#000000 1.5px, transparent 1.5px); background-size: 24px 24px; }
        .neo-box { background-color: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0px 0px #000000; border-radius: 12px; }
        .neo-btn { border: 4px solid #000000; box-shadow: 4px 4px 0px 0px #000000; border-radius: 8px; transition: all 0.1s ease-in-out; font-weight: bold; cursor: pointer; text-transform: uppercase; }
        .neo-btn:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0px 0px #000000; }
        .neo-tag { border: 3px solid #000; box-shadow: 3px 3px 0px 0px #000; }
        .bg-pattern-dot { background-color: #f8fafc; background-image: radial-gradient(#cbd5e1 2px, transparent 2px); background-size: 20px 20px; }
        .lone-pair-cloud { animation: pulseCloud 2s infinite alternate; }
        @keyframes pulseCloud { 0% { transform: scale(0.95); opacity: 0.6; } 100% { transform: scale(1.05); opacity: 0.8; } }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-indigo-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 neo-tag font-bold text-sm transform -rotate-3 text-black border-2 border-black">KIMIA IKATAN</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: GEOMETRI MOLEKUL</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Struktur Lewis 2D dan Visualisasi VSEPR 3D</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#818cf8] text-md transform rotate-2 z-30 uppercase">Panel Kontrol</span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Molekul</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMolMode('CO2')} className={getButtonClass('CO2')}>💨 CO₂</button>
                <button onClick={() => setMolMode('H2O')} className={getButtonClass('H2O')}>💧 H₂O</button>
                <button onClick={() => setMolMode('CH4')} className={getButtonClass('CH4')}>🔥 CH₄</button>
                <button onClick={() => setMolMode('NH3')} className={getButtonClass('NH3')}>🧴 NH₃</button>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Mode Visualisasi</label>
              <div className="flex gap-2">
                <button onClick={() => setCurrentMode('2D')} className={`mode-btn neo-btn py-2 px-2 text-xs font-bold flex-1 ${currentMode === '2D' ? 'bg-indigo-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}>
                  LEWIS 2D
                </button>
                <button onClick={() => setCurrentMode('3D')} className={`mode-btn neo-btn py-2 px-2 text-xs font-bold flex-1 ${currentMode === '3D' ? 'bg-indigo-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}>
                  VSEPR 3D
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-indigo-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA STRUKTUR</h4>
            
            <div className="grid grid-cols-1 gap-2 mb-2">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Nama Senyawa</span>
                <span className="text-sm font-black text-white">{currentMolecule.name}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Bentuk Geometri</span>
                <span className="text-sm font-black text-emerald-400">{currentMolecule.shape}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Sudut Ikatan</span>
                <span className="text-sm font-black text-yellow-300">{currentMolecule.angle}</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase text-slate-400">Pasangan Elektron Bebas (PEB)</span>
              <span className="text-lg font-black text-rose-400">{currentMolecule.peb}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-pattern-dot p-0 relative flex flex-col items-center w-full h-[500px] overflow-hidden border-8 border-black">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              {currentMode === '3D' ? 'Proyeksi VSEPR 3D: Berputar' : 'Struktur Lewis 2D: Diam / Statis'}
            </span>

            <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              {getLegend()}
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-5">
              <svg ref={svgCanvasRef} viewBox="0 0 500 500" className="w-full h-full overflow-visible"></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-indigo-100 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">Buku Panduan: Teori VSEPR & Lewis 📖</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-indigo-600 border-b-2 border-black pb-1 mb-2">Struktur Lewis (2D)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">Menunjukkan bagaimana elektron valensi didistribusikan di sekitar atom-atom dalam molekul. Setiap garis mewakili sepasang elektron ikatan.</p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Teori VSEPR (3D)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed"><i>Valence Shell Electron Pair Repulsion</i>. Elektron bermuatan negatif akan saling tolak-menolak mengambil posisi sejauh mungkin dalam ruang 3D.</p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Pasangan Elektron Bebas (PEB)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">Daya tolak dari PEB lebih besar dibandingkan pasangan elektron ikatan. Akibatnya, pada H₂O, PEB "menekan" ikatan H-O-H.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
