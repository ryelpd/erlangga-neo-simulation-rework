import { useState, useRef, useCallback, useEffect } from 'react';

type Mode = 'BASIC' | 'TRAIT';
type TraitStatus = 'NORMAL' | 'CARRIER' | 'AFFECTED';

interface Stats {
  boy: number;
  girl: number;
  normal: number;
  carrier: number;
  affected: number;
}

interface Position {
  x: number;
  y: number;
}

const POS = {
  dad: [{ x: 130, y: 167 }, { x: 170, y: 167 }],
  mom: [{ x: 430, y: 167 }, { x: 470, y: 167 }],
  sperm: { x: 255, y: 250 },
  egg: { x: 350, y: 250 },
  baby1: { x: 287, y: 320 },
  baby2: { x: 313, y: 320 }
};

export default function PewarisanKromosomSeksManusia() {
  const [currentMode, setCurrentMode] = useState<Mode>('BASIC');
  const [isAnimating, setIsAnimating] = useState(false);
  const [dadGenotype, setDadGenotype] = useState<'NORMAL' | 'AFFECTED'>('NORMAL');
  const [momGenotype, setMomGenotype] = useState<'NORMAL' | 'CARRIER' | 'AFFECTED'>('NORMAL');
  const [stats, setStats] = useState<Stats>({ boy: 0, girl: 0, normal: 0, carrier: 0, affected: 0 });
  const [animStatus, setAnimStatus] = useState({ text: 'Menunggu...', color: 'slate' });
  const [showGametes, setShowGametes] = useState(false);
  const [showBaby, setShowBaby] = useState(false);
  const [babyData, setBabyData] = useState<{
    isBoy: boolean;
    traitStatus: TraitStatus;
    dadAllele: string;
    momAllele: string;
    dadColor: string;
    momColor: string;
  } | null>(null);

  const animatedAllelesRef = useRef<SVGGElement>(null);
  const spermGroupRef = useRef<SVGGElement>(null);
  const eggGroupRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number>(0);

  const getDadAlleles = useCallback(() => {
    if (currentMode === 'BASIC') {
      return [
        { text: 'X', color: '#0284c7' },
        { text: 'Y', color: '#0284c7' }
      ];
    }
    if (dadGenotype === 'AFFECTED') {
      return [
        { text: 'Xᶜ', color: '#ef4444' },
        { text: 'Y', color: '#0284c7' }
      ];
    }
    return [
      { text: 'X', color: '#0284c7' },
      { text: 'Y', color: '#0284c7' }
    ];
  }, [currentMode, dadGenotype]);

  const getMomAlleles = useCallback(() => {
    if (currentMode === 'BASIC') {
      return [
        { text: 'X', color: '#be123c' },
        { text: 'X', color: '#be123c' }
      ];
    }
    if (momGenotype === 'NORMAL') {
      return [
        { text: 'X', color: '#be123c' },
        { text: 'X', color: '#be123c' }
      ];
    }
    if (momGenotype === 'CARRIER') {
      return [
        { text: 'X', color: '#be123c' },
        { text: 'Xᶜ', color: '#f59e0b' }
      ];
    }
    return [
      { text: 'Xᶜ', color: '#ef4444' },
      { text: 'Xᶜ', color: '#ef4444' }
    ];
  }, [currentMode, momGenotype]);

  const dadAlleles = getDadAlleles();
  const momAlleles = getMomAlleles();

  const animateElement = (el: SVGGElement, start: Position, end: Position, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      let startTime: number | null = null;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        const currX = start.x + (end.x - start.x) * ease;
        const currY = start.y + (end.y - start.y) * ease;

        el.setAttribute('transform', `translate(${currX}, ${currY})`);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      animationRef.current = requestAnimationFrame(step);
    });
  };

  const createMovingAllele = (text: string, color: string, startPos: Position): SVGGElement => {
    if (!animatedAllelesRef.current) throw new Error('No animated alleles group');

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${startPos.x}, ${startPos.y})`);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '-12');
    rect.setAttribute('y', '-12');
    rect.setAttribute('width', '24');
    rect.setAttribute('height', '24');
    rect.setAttribute('fill', '#fff');
    rect.setAttribute('stroke', '#000');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '4');

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', '0');
    txt.setAttribute('y', '6');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('fill', color);
    txt.setAttribute('font-family', 'Space Grotesk, sans-serif');
    txt.setAttribute('font-weight', '900');
    txt.setAttribute('font-size', '20');
    txt.textContent = text;

    g.appendChild(rect);
    g.appendChild(txt);
    animatedAllelesRef.current.appendChild(g);
    return g;
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runFertilization = useCallback(async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowGametes(false);
    setShowBaby(false);
    setBabyData(null);

    if (animatedAllelesRef.current) {
      animatedAllelesRef.current.innerHTML = '';
    }

    setAnimStatus({ text: '1. MEIOSIS (PEMBENTUKAN GAMET)', color: 'yellow' });

    const dadIdx = Math.random() < 0.5 ? 0 : 1;
    const momIdx = Math.random() < 0.5 ? 0 : 1;

    const dadAlleleData = dadAlleles[dadIdx];
    const momAlleleData = momAlleles[momIdx];

    await sleep(600);

    if (!animatedAllelesRef.current || !spermGroupRef.current || !eggGroupRef.current) {
      setIsAnimating(false);
      return;
    }

    const animDad = createMovingAllele(dadAlleleData.text, dadAlleleData.color, POS.dad[dadIdx]);
    const animMom = createMovingAllele(momAlleleData.text, momAlleleData.color, POS.mom[momIdx]);

    setShowGametes(true);

    await Promise.all([
      animateElement(animDad, POS.dad[dadIdx], POS.sperm, 800),
      animateElement(animMom, POS.mom[momIdx], POS.egg, 800)
    ]);

    setAnimStatus({ text: '2. FERTILISASI (PEMBUAHAN)', color: 'sky' });
    await sleep(600);

    animateElement(spermGroupRef.current, { x: 250, y: 250 }, { x: 300, y: 350 }, 800);
    animateElement(eggGroupRef.current, { x: 350, y: 250 }, { x: 300, y: 350 }, 800);

    await Promise.all([
      animateElement(animDad, POS.sperm, POS.baby1, 800),
      animateElement(animMom, POS.egg, POS.baby2, 800)
    ]);

    setAnimStatus({ text: '3. SIFAT KETURUNAN (HASIL)', color: 'emerald' });

    setShowGametes(false);
    if (animatedAllelesRef.current) {
      animatedAllelesRef.current.innerHTML = '';
    }

    spermGroupRef.current.setAttribute('transform', 'translate(250, 250)');
    eggGroupRef.current.setAttribute('transform', 'translate(350, 250)');

    const isBoy = dadAlleleData.text === 'Y';

    let traitStatus: TraitStatus = 'NORMAL';
    if (currentMode === 'TRAIT') {
      const hasNormalX = dadAlleleData.text === 'X' || momAlleleData.text === 'X';
      const hasMutantX = dadAlleleData.text === 'Xᶜ' || momAlleleData.text === 'Xᶜ';

      if (isBoy) {
        traitStatus = hasMutantX ? 'AFFECTED' : 'NORMAL';
      } else {
        if (hasNormalX && hasMutantX) traitStatus = 'CARRIER';
        else if (hasMutantX && !hasNormalX) traitStatus = 'AFFECTED';
        else traitStatus = 'NORMAL';
      }
    }

    setBabyData({
      isBoy,
      traitStatus,
      dadAllele: dadAlleleData.text,
      momAllele: momAlleleData.text,
      dadColor: dadAlleleData.color,
      momColor: momAlleleData.color
    });

    setShowBaby(true);

    setStats((prev) => {
      const newStats = { ...prev };
      if (isBoy) newStats.boy++;
      else newStats.girl++;

      if (currentMode === 'TRAIT') {
        if (traitStatus === 'NORMAL') newStats.normal++;
        else if (traitStatus === 'CARRIER') newStats.carrier++;
        else newStats.affected++;
      }

      return newStats;
    });

    await sleep(500);
    setIsAnimating(false);
  }, [isAnimating, currentMode, dadAlleles, momAlleles]);

  const setMode = (mode: Mode) => {
    if (isAnimating) return;
    setCurrentMode(mode);
    setShowGametes(false);
    setShowBaby(false);
    setBabyData(null);
    setAnimStatus({ text: 'Menunggu...', color: 'slate' });
  };

  const resetStats = () => {
    setStats({ boy: 0, girl: 0, normal: 0, carrier: 0, affected: 0 });
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getStatusColorClass = () => {
    if (animStatus.color === 'yellow') return 'bg-yellow-100 text-yellow-700 border-yellow-400';
    if (animStatus.color === 'sky') return 'bg-sky-100 text-sky-700 border-sky-400';
    if (animStatus.color === 'emerald') return 'bg-emerald-100 text-emerald-700 border-emerald-400';
    return 'bg-white text-slate-500 border-slate-300';
  };

  const getTraitStatusText = () => {
    if (!babyData) return { text: 'XX / XY', color: '#64748b' };
    if (currentMode === 'BASIC') return { text: 'XX / XY', color: '#64748b' };

    if (babyData.traitStatus === 'NORMAL') {
      return { text: 'NORMAL (SEHAT)', color: '#10b981' };
    }
    if (babyData.traitStatus === 'CARRIER') {
      return { text: 'PEMBAWA (CARRIER)', color: '#d97706' };
    }
    return { text: 'BUTA WARNA', color: '#ef4444' };
  };

  const traitInfo = getTraitStatusText();

  return (
    <div className="min-h-screen bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-pink-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative mx-4 md:mx-auto mt-4">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm -rotate-3 text-black">BIOLOGI GENETIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: KROMOSOM SEKS
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Pewarisan Jenis Kelamin (XX/XY) dan Sifat Taut Kromosom X (Buta Warna)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 mx-4 md:mx-auto items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f472b6] text-md rotate-2 z-30 uppercase">
            Pengaturan Genetik
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Mode Simulasi</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setMode('BASIC')}
                  disabled={isAnimating}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 px-3 text-xs font-bold text-left flex justify-between items-center transition-all ${
                    currentMode === 'BASIC'
                      ? 'bg-pink-400 text-white ring-4 ring-black'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>👶 PENENTUAN GENDER</span>
                  <span className="text-[9px] bg-white text-black px-1 border border-black">XX / XY</span>
                </button>
                <button
                  onClick={() => setMode('TRAIT')}
                  disabled={isAnimating}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 px-3 text-xs font-bold text-left flex justify-between items-center transition-all ${
                    currentMode === 'TRAIT'
                      ? 'bg-pink-400 text-white ring-4 ring-black'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>👁️ PEWARISAN BUTA WARNA</span>
                  <span className="text-[9px] bg-white text-black px-1 border border-black">Taut X</span>
                </button>
              </div>
            </div>

            {currentMode === 'TRAIT' && (
              <div className="flex flex-col gap-3 p-4 border-4 border-black bg-yellow-50 shadow-[4px_4px_0px_0px_#000]">
                <label className="text-[11px] font-black uppercase text-yellow-800 border-b-2 border-yellow-200 pb-1">Genotipe Orang Tua</label>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-sky-700">Genotipe Ayah (XY)</span>
                  <select
                    value={dadGenotype}
                    onChange={(e) => setDadGenotype(e.target.value as 'NORMAL' | 'AFFECTED')}
                    disabled={isAnimating}
                    className="border-3 border-black shadow-[3px_3px_0px_0px_#000] rounded p-2 text-sm bg-white font-bold outline-none"
                  >
                    <option value="NORMAL">Normal (X Y)</option>
                    <option value="AFFECTED">Buta Warna (Xᶜ Y)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[10px] font-bold text-rose-700">Genotipe Ibu (XX)</span>
                  <select
                    value={momGenotype}
                    onChange={(e) => setMomGenotype(e.target.value as 'NORMAL' | 'CARRIER' | 'AFFECTED')}
                    disabled={isAnimating}
                    className="border-3 border-black shadow-[3px_3px_0px_0px_#000] rounded p-2 text-sm bg-white font-bold outline-none"
                  >
                    <option value="NORMAL">Normal (X X)</option>
                    <option value="CARRIER">Pembawa / Carrier (X Xᶜ)</option>
                    <option value="AFFECTED">Buta Warna (Xᶜ Xᶜ)</option>
                  </select>
                </div>

                <div className="text-[9px] font-bold text-slate-500 mt-1 leading-tight">
                  *Keterangan: <span className="text-rose-500 font-black">Xᶜ</span> adalah kromosom X pembawa gen resesif buta warna.
                </div>
              </div>
            )}

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={runFertilization}
                disabled={isAnimating}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-4 text-sm flex-1 flex items-center justify-center gap-2 transition-all font-bold ${
                  isAnimating ? 'bg-slate-300 text-slate-500' : 'bg-emerald-400 hover:bg-emerald-300 text-black'
                }`}
              >
                💖 SIMULASIKAN FERTILISASI
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-pink-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">STATISTIK KETURUNAN (HISTORI)</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-sky-900 p-2 border-2 border-sky-500 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold uppercase text-sky-300 mb-1">Laki-Laki (XY)</span>
                <span className="text-2xl font-black text-sky-400 font-mono">{stats.boy}</span>
              </div>
              <div className="bg-rose-900 p-2 border-2 border-rose-500 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold uppercase text-rose-300 mb-1">Perempuan (XX)</span>
                <span className="text-2xl font-black text-rose-400 font-mono">{stats.girl}</span>
              </div>
            </div>

            {currentMode === 'TRAIT' && (
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="bg-emerald-900 p-1 border-2 border-emerald-600 rounded">
                  <span className="text-[8px] font-bold uppercase text-emerald-400 block">Normal</span>
                  <span className="text-sm font-black text-white">{stats.normal}</span>
                </div>
                <div className="bg-yellow-900 p-1 border-2 border-yellow-600 rounded">
                  <span className="text-[8px] font-bold uppercase text-yellow-400 block">Carrier</span>
                  <span className="text-sm font-black text-white">{stats.carrier}</span>
                </div>
                <div className="bg-red-900 p-1 border-2 border-red-600 rounded">
                  <span className="text-[8px] font-bold uppercase text-red-400 block">Buta Warna</span>
                  <span className="text-sm font-black text-white">{stats.affected}</span>
                </div>
              </div>
            )}

            <div className="mt-3">
              <button
                onClick={resetStats}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-700 hover:bg-slate-600 text-white py-1 px-3 text-[10px] w-full font-bold transition-all"
              >
                Hapus Histori
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="bg-white border-8 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-0 relative flex flex-col items-center w-full h-[600px] overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)',
              backgroundSize: '20px 20px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">
              Animasi Seluler: Meiosis & Fertilisasi
            </span>

            <div className={`absolute top-4 right-4 z-30 px-3 py-1 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] ${getStatusColorClass()}`}>
              {animStatus.text}
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
              <svg viewBox="0 0 600 500" className="w-full h-full overflow-visible" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <g stroke="#94a3b8" strokeWidth="3" strokeDasharray="8 6" opacity="0.4">
                  <path d="M 150 150 Q 150 250 250 250" fill="none" />
                  <path d="M 450 150 Q 450 250 350 250" fill="none" />
                  <path d="M 250 250 Q 300 250 300 350" fill="none" />
                  <path d="M 350 250 Q 300 250 300 350" fill="none" />
                </g>

                <g transform="translate(150, 100)">
                  <rect x="-60" y="-40" width="120" height="80" rx="10" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="4" />
                  <text x="0" y="-10" textAnchor="middle" fontSize="28">👨</text>
                  <text x="0" y="25" textAnchor="middle" fontWeight="900" fontSize="14" fill="#0284c7">AYAH</text>

                  <g transform="translate(0, 60)" fontWeight="900" fontSize="24">
                    <rect x="-35" y="-15" width="30" height="30" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                    <text x="-20" y="7" textAnchor="middle" fill={dadAlleles[0].color}>{dadAlleles[0].text}</text>

                    <rect x="5" y="-15" width="30" height="30" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                    <text x="20" y="7" textAnchor="middle" fill={dadAlleles[1].color}>{dadAlleles[1].text}</text>
                  </g>
                </g>

                <g transform="translate(450, 100)">
                  <rect x="-60" y="-40" width="120" height="80" rx="10" fill="#fce7f3" stroke="#e11d48" strokeWidth="4" />
                  <text x="0" y="-10" textAnchor="middle" fontSize="28">👩</text>
                  <text x="0" y="25" textAnchor="middle" fontWeight="900" fontSize="14" fill="#be123c">IBU</text>

                  <g transform="translate(0, 60)" fontWeight="900" fontSize="24">
                    <rect x="-35" y="-15" width="30" height="30" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                    <text x="-20" y="7" textAnchor="middle" fill={momAlleles[0].color}>{momAlleles[0].text}</text>

                    <rect x="5" y="-15" width="30" height="30" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                    <text x="20" y="7" textAnchor="middle" fill={momAlleles[1].color}>{momAlleles[1].text}</text>
                  </g>
                </g>

                <g opacity={showGametes ? 1 : 0}>
                  <g ref={spermGroupRef} transform="translate(250, 250)">
                    <path d="M -15 0 Q -30 -10 -45 0 T -75 0" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                    <ellipse cx="0" cy="0" rx="15" ry="10" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="3" />
                    <circle cx="5" cy="0" r="14" fill="#fff" stroke="#000" strokeWidth="2" strokeDasharray="2 2" />
                  </g>

                  <g ref={eggGroupRef} transform="translate(350, 250)">
                    <circle cx="0" cy="0" r="25" fill="#fce7f3" stroke="#e11d48" strokeWidth="4" />
                    <circle cx="0" cy="0" r="14" fill="#fff" stroke="#000" strokeWidth="2" strokeDasharray="2 2" />
                  </g>
                </g>

                <g ref={animatedAllelesRef} fontWeight="900" fontSize="20" />

                {showBaby && babyData && (
                  <g transform="translate(300, 380)" opacity={1}>
                    <rect
                      x="-70"
                      y="-45"
                      width="140"
                      height="90"
                      rx="10"
                      fill={babyData.isBoy ? '#e0f2fe' : '#fce7f3'}
                      stroke={babyData.isBoy ? '#0ea5e9' : '#e11d48'}
                      strokeWidth="5"
                    />
                    <text x="0" y="-10" textAnchor="middle" fontSize="36">{babyData.isBoy ? '👦' : '👧'}</text>
                    <text x="0" y="25" textAnchor="middle" fontWeight="900" fontSize="16" fill={babyData.isBoy ? '#0284c7' : '#be123c'}>
                      {babyData.isBoy ? 'LAKI-LAKI' : 'PEREMPUAN'}
                    </text>
                    <text x="0" y="40" textAnchor="middle" fontWeight="bold" fontSize="10" fill={traitInfo.color}>
                      {traitInfo.text}
                    </text>

                    <g transform="translate(0, -65)" fontWeight="900" fontSize="20">
                      <rect x="-25" y="-12" width="24" height="24" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                      <text x="-13" y="5" textAnchor="middle" fill={babyData.dadColor}>{babyData.dadAllele}</text>

                      <rect x="1" y="-12" width="24" height="24" fill="#fff" stroke="#000" strokeWidth="2" rx="4" />
                      <text x="13" y="5" textAnchor="middle" fill={babyData.momColor}>{babyData.momAllele}</text>
                    </g>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-pink-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mx-4 md:mx-auto mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan: Membaca Kode Genetik 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-700 border-b-2 border-black pb-1 mb-2">Penentuan Gender</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Setiap manusia memiliki dua kromosom seks. Ibu <b>selalu menyumbang kromosom X</b> (karena ia XX). Ayah bisa menyumbang <b>X atau Y</b> (karena ia XY). Oleh karena itu, sperma ayahlah yang secara biologis menentukan jenis kelamin bayi. Peluangnya selalu matematis: 50% Laki-laki, 50% Perempuan.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-700 border-b-2 border-black pb-1 mb-2">Taut Kromosom X (Buta Warna)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Gen penglihatan warna berada di kromosom X. Gen buta warna bersifat <b>Resesif (<span className="text-rose-500 font-bold">Xᶜ</span>)</b>. Jika seorang perempuan memiliki satu <span className="text-rose-500 font-bold">Xᶜ</span> dan satu X normal, ia akan menjadi "Carrier" (Penglihatan normal, tapi membawa gen tersebut).
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-700 border-b-2 border-black pb-1 mb-2">Mengapa Pria Lebih Rentan?</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Laki-laki hanya memiliki satu kromosom X (XY). Jika ia mewarisi kromosom <span className="text-rose-500 font-bold">Xᶜ</span> dari ibunya, ia <b>pasti buta warna</b> karena kromosom Y yang kecil tidak memiliki gen "cadangan" untuk menutupinya. Perempuan butuh dua <span className="text-rose-500 font-bold">Xᶜ</span> (dari ayah dan ibu) untuk menjadi buta warna.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}