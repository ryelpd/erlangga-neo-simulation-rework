import { useRef, useEffect, useCallback, useState } from 'react';

interface Element {
  z: number;
  sym: string;
  name: string;
  mass: string;
  col: number;
  row: number;
  cat: string;
  group: string;
}

const ELEMENTS_RAW: [number, string, string, string, number, number, string, string][] = [
  [1, "H", "Hidrogen", "1.008", 1, 1, "nonmetal", "1"],
  [2, "He", "Helium", "4.002", 18, 1, "noble", "18"],
  [3, "Li", "Litium", "6.94", 1, 2, "alkali", "1"],
  [4, "Be", "Berilium", "9.012", 2, 2, "alkaline", "2"],
  [5, "B", "Boron", "10.81", 13, 2, "metalloid", "13"],
  [6, "C", "Karbon", "12.011", 14, 2, "nonmetal", "14"],
  [7, "N", "Nitrogen", "14.007", 15, 2, "nonmetal", "15"],
  [8, "O", "Oksigen", "15.999", 16, 2, "nonmetal", "16"],
  [9, "F", "Fluor", "18.998", 17, 2, "halogen", "17"],
  [10, "Ne", "Neon", "20.180", 18, 2, "noble", "18"],
  [11, "Na", "Natrium", "22.990", 1, 3, "alkali", "1"],
  [12, "Mg", "Magnesium", "24.305", 2, 3, "alkaline", "2"],
  [13, "Al", "Aluminium", "26.982", 13, 3, "post-transition", "13"],
  [14, "Si", "Silikon", "28.085", 14, 3, "metalloid", "14"],
  [15, "P", "Fosfor", "30.974", 15, 3, "nonmetal", "15"],
  [16, "S", "Belerang", "32.06", 16, 3, "nonmetal", "16"],
  [17, "Cl", "Klorin", "35.45", 17, 3, "halogen", "17"],
  [18, "Ar", "Argon", "39.95", 18, 3, "noble", "18"],
  [19, "K", "Kalium", "39.098", 1, 4, "alkali", "1"],
  [20, "Ca", "Kalsium", "40.078", 2, 4, "alkaline", "2"],
  [21, "Sc", "Skandium", "44.956", 3, 4, "transition", "3"],
  [22, "Ti", "Titanium", "47.867", 4, 4, "transition", "4"],
  [23, "V", "Vanadium", "50.942", 5, 4, "transition", "5"],
  [24, "Cr", "Kromium", "51.996", 6, 4, "transition", "6"],
  [25, "Mn", "Mangan", "54.938", 7, 4, "transition", "7"],
  [26, "Fe", "Besi", "55.845", 8, 4, "transition", "8"],
  [27, "Co", "Kobalt", "58.933", 9, 4, "transition", "9"],
  [28, "Ni", "Nikel", "58.693", 10, 4, "transition", "10"],
  [29, "Cu", "Tembaga", "63.546", 11, 4, "transition", "11"],
  [30, "Zn", "Seng", "65.38", 12, 4, "transition", "12"],
  [31, "Ga", "Galium", "69.723", 13, 4, "post-transition", "13"],
  [32, "Ge", "Germanium", "72.630", 14, 4, "metalloid", "14"],
  [33, "As", "Arsenik", "74.922", 15, 4, "metalloid", "15"],
  [34, "Se", "Selenium", "78.971", 16, 4, "nonmetal", "16"],
  [35, "Br", "Bromin", "79.904", 17, 4, "halogen", "17"],
  [36, "Kr", "Kripton", "83.798", 18, 4, "noble", "18"],
  [37, "Rb", "Rubidium", "85.468", 1, 5, "alkali", "1"],
  [38, "Sr", "Stronsium", "87.62", 2, 5, "alkaline", "2"],
  [39, "Y", "Itrium", "88.906", 3, 5, "transition", "3"],
  [40, "Zr", "Zirkonium", "91.224", 4, 5, "transition", "4"],
  [41, "Nb", "Niobium", "92.906", 5, 5, "transition", "5"],
  [42, "Mo", "Molibdenum", "95.95", 6, 5, "transition", "6"],
  [43, "Tc", "Teknesium", "(98)", 7, 5, "transition", "7"],
  [44, "Ru", "Rutenium", "101.07", 8, 5, "transition", "8"],
  [45, "Rh", "Rodium", "102.91", 9, 5, "transition", "9"],
  [46, "Pd", "Paladium", "106.42", 10, 5, "transition", "10"],
  [47, "Ag", "Perak", "107.87", 11, 5, "transition", "11"],
  [48, "Cd", "Kadmium", "112.41", 12, 5, "transition", "12"],
  [49, "In", "Indium", "114.82", 13, 5, "post-transition", "13"],
  [50, "Sn", "Timah", "118.71", 14, 5, "post-transition", "14"],
  [51, "Sb", "Antimon", "121.76", 15, 5, "metalloid", "15"],
  [52, "Te", "Telurium", "127.60", 16, 5, "metalloid", "16"],
  [53, "I", "Iodium", "126.90", 17, 5, "halogen", "17"],
  [54, "Xe", "Xenon", "131.29", 18, 5, "noble", "18"],
  [55, "Cs", "Sesium", "132.91", 1, 6, "alkali", "1"],
  [56, "Ba", "Barium", "137.33", 2, 6, "alkaline", "2"],
  [57, "La", "Lantanum", "138.91", 4, 8, "lanthanide", "-"],
  [58, "Ce", "Serium", "140.12", 5, 8, "lanthanide", "-"],
  [59, "Pr", "Praseodimium", "140.91", 6, 8, "lanthanide", "-"],
  [60, "Nd", "Neodimium", "144.24", 7, 8, "lanthanide", "-"],
  [61, "Pm", "Prometium", "(145)", 8, 8, "lanthanide", "-"],
  [62, "Sm", "Samarium", "150.36", 9, 8, "lanthanide", "-"],
  [63, "Eu", "Europium", "151.96", 10, 8, "lanthanide", "-"],
  [64, "Gd", "Gadolinium", "157.25", 11, 8, "lanthanide", "-"],
  [65, "Tb", "Terbium", "158.93", 12, 8, "lanthanide", "-"],
  [66, "Dy", "Disprosium", "162.50", 13, 8, "lanthanide", "-"],
  [67, "Ho", "Holmium", "164.93", 14, 8, "lanthanide", "-"],
  [68, "Er", "Erbium", "167.26", 15, 8, "lanthanide", "-"],
  [69, "Tm", "Tulium", "168.93", 16, 8, "lanthanide", "-"],
  [70, "Yb", "Iterbium", "173.05", 17, 8, "lanthanide", "-"],
  [71, "Lu", "Lutetium", "174.97", 18, 8, "lanthanide", "-"],
  [72, "Hf", "Hafnium", "178.49", 4, 6, "transition", "4"],
  [73, "Ta", "Tantalum", "180.95", 5, 6, "transition", "5"],
  [74, "W", "Tungsten", "183.84", 6, 6, "transition", "6"],
  [75, "Re", "Renium", "186.21", 7, 6, "transition", "7"],
  [76, "Os", "Osmium", "190.23", 8, 6, "transition", "8"],
  [77, "Ir", "Iridium", "192.22", 9, 6, "transition", "9"],
  [78, "Pt", "Platina", "195.08", 10, 6, "transition", "10"],
  [79, "Au", "Emas", "196.97", 11, 6, "transition", "11"],
  [80, "Hg", "Raksa", "200.59", 12, 6, "transition", "12"],
  [81, "Tl", "Talium", "204.38", 13, 6, "post-transition", "13"],
  [82, "Pb", "Timbal", "207.2", 14, 6, "post-transition", "14"],
  [83, "Bi", "Bismut", "208.98", 15, 6, "post-transition", "15"],
  [84, "Po", "Polonium", "(209)", 16, 6, "metalloid", "16"],
  [85, "At", "Astatin", "(210)", 17, 6, "halogen", "17"],
  [86, "Rn", "Radon", "(222)", 18, 6, "noble", "18"],
  [87, "Fr", "Fransium", "(223)", 1, 7, "alkali", "1"],
  [88, "Ra", "Radium", "(226)", 2, 7, "alkaline", "2"],
  [89, "Ac", "Aktinium", "(227)", 4, 9, "actinide", "-"],
  [90, "Th", "Torium", "232.04", 5, 9, "actinide", "-"],
  [91, "Pa", "Protaktinium", "231.04", 6, 9, "actinide", "-"],
  [92, "U", "Uranium", "238.03", 7, 9, "actinide", "-"],
  [93, "Np", "Neptunium", "(237)", 8, 9, "actinide", "-"],
  [94, "Pu", "Plutonium", "(244)", 9, 9, "actinide", "-"],
  [95, "Am", "Amerisium", "(243)", 10, 9, "actinide", "-"],
  [96, "Cm", "Kurium", "(247)", 11, 9, "actinide", "-"],
  [97, "Bk", "Berkelium", "(247)", 12, 9, "actinide", "-"],
  [98, "Cf", "Kalifornium", "(251)", 13, 9, "actinide", "-"],
  [99, "Es", "Einsteinium", "(252)", 14, 9, "actinide", "-"],
  [100, "Fm", "Fermium", "(257)", 15, 9, "actinide", "-"],
  [101, "Md", "Mendelevium", "(258)", 16, 9, "actinide", "-"],
  [102, "No", "Nobelium", "(259)", 17, 9, "actinide", "-"],
  [103, "Lr", "Lawrensium", "(266)", 18, 9, "actinide", "-"],
  [104, "Rf", "Rutherfordium", "(267)", 4, 7, "transition", "4"],
  [105, "Db", "Dubnium", "(268)", 5, 7, "transition", "5"],
  [106, "Sg", "Seaborgium", "(269)", 6, 7, "transition", "6"],
  [107, "Bh", "Bohrium", "(270)", 7, 7, "transition", "7"],
  [108, "Hs", "Hassium", "(277)", 8, 7, "transition", "8"],
  [109, "Mt", "Meitnerium", "(278)", 9, 7, "transition", "9"],
  [110, "Ds", "Darmstadtium", "(281)", 10, 7, "transition", "10"],
  [111, "Rg", "Roentgenium", "(282)", 11, 7, "transition", "11"],
  [112, "Cn", "Kopernisium", "(285)", 12, 7, "transition", "12"],
  [113, "Nh", "Nihonium", "(286)", 13, 7, "post-transition", "13"],
  [114, "Fl", "Flerovium", "(289)", 14, 7, "post-transition", "14"],
  [115, "Mc", "Moscovium", "(290)", 15, 7, "post-transition", "15"],
  [116, "Lv", "Livermorium", "(293)", 16, 7, "post-transition", "16"],
  [117, "Ts", "Tenesin", "(294)", 17, 7, "halogen", "17"],
  [118, "Og", "Oganeson", "(294)", 18, 7, "noble", "18"],
];

const ELEMENTS: Element[] = ELEMENTS_RAW.map(data => ({
  z: data[0], sym: data[1], name: data[2], mass: data[3],
  col: data[4], row: data[5], cat: data[6], group: data[7]
}));

const CAT_LABELS: Record<string, string> = {
  'alkali': 'Logam Alkali', 'alkaline': 'Logam Alkali Tanah', 'transition': 'Logam Transisi',
  'post-transition': 'Logam Pasca-Transisi', 'metalloid': 'Metaloid', 'nonmetal': 'Non-Logam Reaktif',
  'halogen': 'Halogen', 'noble': 'Gas Mulia', 'lanthanide': 'Lantanida', 'actinide': 'Aktinida', 'unknown': 'Sifat Tidak Diketahui'
};

const CAT_COLORS: Record<string, string> = {
  'alkali': '#fca5a5', 'alkaline': '#fdba74', 'transition': '#fef08a', 'post-transition': '#6ee7b7',
  'metalloid': '#5eead4', 'nonmetal': '#7dd3fc', 'halogen': '#93c5fd', 'noble': '#c4b5fd',
  'lanthanide': '#f9a8d4', 'actinide': '#d8b4fe', 'unknown': '#e2e8f0'
};

function getElectronShells(z: number): number[] {
  const shells: number[] = [];
  let remaining = z;

  if (z <= 20) {
    if (remaining > 0) { shells.push(Math.min(2, remaining)); remaining -= Math.min(2, remaining); }
    if (remaining > 0) { shells.push(Math.min(8, remaining)); remaining -= Math.min(8, remaining); }
    if (remaining > 0) { shells.push(Math.min(8, remaining)); remaining -= Math.min(8, remaining); }
    if (remaining > 0) { shells.push(remaining); }
    return shells;
  }

  const maxCapacities = [2, 8, 18, 32, 32, 18, 8];
  let s = 0;
  while (remaining > 0 && s < maxCapacities.length) {
    const take = Math.min(remaining, maxCapacities[s]);
    shells.push(take);
    remaining -= take;
    s++;
  }
  if (remaining > 0) shells.push(remaining);

  if (shells.length > 2 && shells[shells.length - 1] > 8) {
    const diff = shells[shells.length - 1] - 8;
    shells[shells.length - 1] = 8;
    shells[shells.length - 2] += diff;
  }

  return shells;
}

export default function TabelPeriodik() {
  const [selectedElement, setSelectedElement] = useState<Element>(ELEMENTS[5]);
  const [filter, setFilter] = useState<string>('all');

  const atomCanvasRef = useRef<SVGSVGElement>(null);

  const drawAtomBohr = useCallback((z: number, symbol: string, catColor: string) => {
    const svg = atomCanvasRef.current;
    if (!svg) return;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const shells = getElectronShells(z);
    const cx = 120;
    const cy = 120;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="heavyGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    `;
    svg.appendChild(defs);

    const bgGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgGlow.setAttribute('cx', String(cx));
    bgGlow.setAttribute('cy', String(cy));
    bgGlow.setAttribute('r', '100');
    bgGlow.setAttribute('fill', catColor);
    bgGlow.setAttribute('opacity', '0.1');
    bgGlow.setAttribute('filter', 'url(#heavyGlow)');
    svg.appendChild(bgGlow);

    const nGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nGroup.style.color = catColor;

    const nRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    nRing.setAttribute('cx', String(cx));
    nRing.setAttribute('cy', String(cy));
    nRing.setAttribute('r', '18');
    nRing.setAttribute('fill', 'none');
    nRing.setAttribute('stroke', catColor);
    nRing.setAttribute('stroke-width', '2');
    nRing.setAttribute('stroke-dasharray', '6 4');
    nRing.innerHTML = `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="8s" repeatCount="indefinite"/>`;
    nGroup.appendChild(nRing);

    const nBody = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    nBody.setAttribute('cx', String(cx));
    nBody.setAttribute('cy', String(cy));
    nBody.setAttribute('r', '14');
    nBody.setAttribute('fill', '#000');
    nBody.setAttribute('stroke', catColor);
    nBody.setAttribute('stroke-width', '2');
    nGroup.appendChild(nBody);

    const nText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nText.setAttribute('x', String(cx));
    nText.setAttribute('y', String(cy + 4));
    nText.setAttribute('text-anchor', 'middle');
    nText.setAttribute('font-size', '12');
    nText.setAttribute('font-weight', '900');
    nText.setAttribute('fill', '#fff');
    nText.textContent = symbol;
    nGroup.appendChild(nText);

    svg.appendChild(nGroup);

    shells.forEach((eCount, idx) => {
      let radius = 32 + (idx * 14);
      if (radius > 110) radius = 110;

      const orbit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      orbit.setAttribute('cx', String(cx));
      orbit.setAttribute('cy', String(cy));
      orbit.setAttribute('r', String(radius));
      orbit.setAttribute('fill', 'none');
      orbit.setAttribute('stroke', '#334155');
      orbit.setAttribute('stroke-width', '1');
      orbit.setAttribute('stroke-dasharray', '2 4');
      svg.appendChild(orbit);

      const eGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const duration = 3 + (idx * 2.5);
      const dir = idx % 2 === 0 ? '0 120 120' : '360 120 120';
      const dirTo = idx % 2 === 0 ? '360 120 120' : '0 120 120';
      eGroup.innerHTML = `<animateTransform attributeName="transform" type="rotate" from="${dir}" to="${dirTo}" dur="${duration}s" repeatCount="indefinite"/>`;

      for (let e = 0; e < eCount; e++) {
        const angle = (e / eCount) * Math.PI * 2;
        const ex = cx + Math.cos(angle) * radius;
        const ey = cy + Math.sin(angle) * radius;

        const electron = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        electron.setAttribute('cx', String(ex));
        electron.setAttribute('cy', String(ey));
        electron.setAttribute('r', '3');
        electron.setAttribute('fill', '#38bdf8');
        electron.setAttribute('filter', 'url(#glow)');
        eGroup.appendChild(electron);
      }
      svg.appendChild(eGroup);
    });
  }, []);

  useEffect(() => {
    drawAtomBohr(selectedElement.z, selectedElement.sym, CAT_COLORS[selectedElement.cat]);
  }, [selectedElement, drawAtomBohr]);

  const shells = getElectronShells(selectedElement.z);
  const labels = ['K (1)', 'L (2)', 'M (3)', 'N (4)', 'O (5)', 'P (6)', 'Q (7)'];
  const realPeriod = selectedElement.row === 8 ? 6 : selectedElement.row === 9 ? 7 : selectedElement.row;

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">KIMIA DASAR</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: TABEL PERIODIK</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Sifat Unsur, Konfigurasi Elektron & Reaktor Atom 3D</p>
      </header>

      <div className="w-full max-w-[1400px] flex flex-col xl:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full xl:w-[400px] shrink-0">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md rotate-2 z-30 uppercase">Data Unsur</span>

          <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] mt-4">
            <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pindai Kategori (Filter)</label>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full p-2 border-2 border-black font-bold font-mono text-sm bg-white outline-none cursor-pointer shadow-[2px_2px_0px_#000] hover:bg-sky-50 transition-colors">
              <option value="all">Tampilkan Semua</option>
              <option value="alkali">Logam Alkali</option>
              <option value="alkaline">Logam Alkali Tanah</option>
              <option value="transition">Logam Transisi</option>
              <option value="post-transition">Logam Pasca-Transisi</option>
              <option value="metalloid">Metaloid</option>
              <option value="nonmetal">Non-Logam Reaktif</option>
              <option value="halogen">Halogen</option>
              <option value="noble">Gas Mulia</option>
              <option value="lanthanide">Lantanida</option>
              <option value="actinide">Aktinida</option>
            </select>
          </div>

          <div className="flex flex-col flex-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] bg-slate-900 text-white p-4">
            <div className="flex justify-between items-start border-b-2 border-slate-700 pb-4 mb-4 relative">
              <div className="flex flex-col z-10 w-2/3">
                <span className="text-3xl font-black uppercase text-white truncate" title={selectedElement.name}>{selectedElement.name}</span>
                <span className="text-[10px] font-bold px-2 py-1 mt-1 inline-block border-2 border-black text-black w-max shadow-[2px_2px_0px_#000]" style={{ backgroundColor: CAT_COLORS[selectedElement.cat] }}>{CAT_LABELS[selectedElement.cat]}</span>
              </div>
              <div className="w-20 h-20 border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center text-black shrink-0 rotate-3 z-20 transition-colors duration-300" style={{ backgroundColor: CAT_COLORS[selectedElement.cat] }}>
                <span className="absolute top-1 left-1 text-[10px] font-bold">{selectedElement.z}</span>
                <span className="text-4xl font-black leading-none">{selectedElement.sym}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm font-mono mb-4">
              <div className="bg-black p-2 border-2 border-slate-700 shadow-[2px_2px_0px_#38bdf8] flex justify-between items-center">
                <span className="text-[9px] text-slate-400 uppercase font-sans font-bold">Nomor (Z)</span>
                <span className="font-black text-sky-400 text-lg">{selectedElement.z}</span>
              </div>
              <div className="bg-black p-2 border-2 border-slate-700 shadow-[2px_2px_0px_#facc15] flex justify-between items-center">
                <span className="text-[9px] text-slate-400 uppercase font-sans font-bold">Massa</span>
                <span className="font-black text-yellow-300 text-lg">{selectedElement.mass}</span>
              </div>
              <div className="bg-black p-2 border-2 border-slate-700 shadow-[2px_2px_0px_#a855f7] flex justify-between items-center">
                <span className="text-[9px] text-slate-400 uppercase font-sans font-bold">Golongan</span>
                <span className="font-black text-purple-400 text-lg">{selectedElement.group !== "-" ? selectedElement.group : "L/A"}</span>
              </div>
              <div className="bg-black p-2 border-2 border-slate-700 shadow-[2px_2px_0px_#f43f5e] flex justify-between items-center">
                <span className="text-[9px] text-slate-400 uppercase font-sans font-bold">Periode</span>
                <span className="font-black text-rose-400 text-lg">{realPeriod}</span>
              </div>
            </div>

            <div className="mb-4 bg-slate-800 p-3 border-2 border-slate-700">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-2 block">Distribusi Elektron (Kulit)</span>
              <div className="flex flex-col gap-1">
                {shells.map((eCount, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="w-8 text-sky-400 font-bold">{labels[idx]}</span>
                    <div className="flex-1 bg-slate-900 h-2 rounded border border-slate-600 overflow-hidden">
                      <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${(eCount / 32) * 100}%` }} />
                    </div>
                    <span className="w-4 text-right text-white">{eCount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-black border-2 border-slate-700 relative overflow-hidden min-h-[220px] rounded-lg shadow-inner">
              <span className="absolute top-2 left-2 text-[9px] font-bold uppercase text-slate-500 bg-black/50 px-1">Reaktor Atom Live</span>
              <svg ref={atomCanvasRef} viewBox="0 0 240 240" className="w-full h-full max-h-[260px] drop-shadow-2xl" />
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[calc(100%-424px)] flex flex-col gap-6">
          <div className="bg-slate-900 border-8 border-black rounded-xl relative w-full h-[800px] xl:h-[850px] overflow-x-auto overflow-y-hidden flex items-center justify-start xl:justify-center p-6" style={{ backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">Sistem Periodik Unsur Interaktif</span>

            <div className="grid gap-1.5 shrink-0 pt-12 pb-24 px-4" style={{ gridTemplateColumns: 'repeat(18, minmax(45px, 1fr))', gridTemplateRows: 'repeat(10, minmax(45px, 1fr))', width: '100%', minWidth: '950px', height: '100%' }}>
              <div className="flex items-center justify-center font-bold text-lg text-white" style={{ gridColumn: '3', gridRow: '6' }}>*</div>
              <div className="flex items-center justify-center font-bold text-lg text-white" style={{ gridColumn: '3', gridRow: '7' }}>**</div>

              {ELEMENTS.map(el => (
                <div
                  key={el.z}
                  onClick={() => setSelectedElement(el)}
                  className={`border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all cursor-pointer flex flex-col justify-center items-center relative p-1 text-center rounded-sm ${selectedElement.z === el.z ? 'scale-125 z-40 shadow-[0px_0px_15px_5px_currentColor,4px_4px_0px_0px_#000] border-4' : ''} ${filter !== 'all' && filter !== el.cat ? 'opacity-15 grayscale scale-95 shadow-[1px_1px_0px_0px_#000]' : ''}`}
                  style={{ gridColumn: el.col, gridRow: el.row, backgroundColor: CAT_COLORS[el.cat], color: selectedElement.z === el.z ? CAT_COLORS[el.cat] : undefined }}
                >
                  <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-70">{el.z}</span>
                  <span className="font-black text-lg leading-none mt-2">{el.sym}</span>
                  <span className="text-[7px] font-bold leading-tight mt-1 truncate w-full px-1 opacity-80">{el.name}</span>
                </div>
              ))}
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/90 backdrop-blur border-2 border-sky-400 p-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase shadow-[4px_4px_0px_#000] text-white">
              <div className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: CAT_COLORS['alkali'] }}></div> Alkali</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: CAT_COLORS['alkaline'] }}></div> Alkali Tanah</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: CAT_COLORS['transition'] }}></div> Transisi</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: CAT_COLORS['post-transition'] }}></div> Pasca-Transisi</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: CAT_COLORS['metalloid'] }}></div> Metaloid</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: CAT_COLORS['nonmetal'] }}></div> Non-Logam</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: CAT_COLORS['halogen'] }}></div> Halogen</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: CAT_COLORS['noble'] }}></div> Gas Mulia</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: CAT_COLORS['lanthanide'] }}></div> Lantanida</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: CAT_COLORS['actinide'] }}></div> Aktinida</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}