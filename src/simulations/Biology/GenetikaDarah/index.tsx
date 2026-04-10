import { useState, useRef, useCallback, useEffect } from 'react';

const ALLELES = ['A', 'B', 'O'];

const TARGET_CELLS = [
  [{ x: 200, y: 200 }, { x: 400, y: 200 }],
  [{ x: 200, y: 400 }, { x: 400, y: 400 }]
];

const TOP_SPAWNS = [{ x: 200, y: 40 }, { x: 400, y: 40 }];
const LEFT_SPAWNS = [{ x: 40, y: 200 }, { x: 40, y: 400 }];

const ANIM_DURATION = 2000;

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

interface AnimationState {
  el: SVGGElement | null;
  text: string;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
}

interface DropState {
  el: SVGGElement | null;
  bg: SVGRectElement | null;
  bgColor: string;
  cx: number;
  cy: number;
}

export default function GenetikaDarah() {
  const [parent1, setParent1] = useState<string[]>(['A', 'O']);
  const [parent2, setParent2] = useState<string[]>(['B', 'O']);
  const [genotypeResult, setGenotypeResult] = useState<string>('-');
  const [phenotypeResult, setPhenotypeResult] = useState<string>('-');
  const [isAnimating, setIsAnimating] = useState(false);

  const animatedAllelesRef = useRef<SVGGElement>(null);
  const dropsLayerRef = useRef<SVGGElement>(null);
  const cellBackgroundsRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number>(0);
  const animationStartRef = useRef<number>(0);
  const activeAnimationsRef = useRef<AnimationState[]>([]);
  const finalDropsRef = useRef<DropState[]>([]);
  const resultsRef = useRef<string[]>([]);

  const getAlleleColor = (val: string): string => {
    if (val === 'A') return '#ef4444';
    if (val === 'B') return '#3b82f6';
    return '#64748b';
  };

  const createMovingAllele = useCallback(
    (text: string, startX: number, startY: number, targetX: number, targetY: number, color: string): AnimationState => {
      if (!animatedAllelesRef.current) return { el: null, text, sx: startX, sy: startY, tx: targetX, ty: targetY };

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '-20');
      rect.setAttribute('y', '-25');
      rect.setAttribute('width', '40');
      rect.setAttribute('height', '40');
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', '#fff');
      rect.setAttribute('stroke', '#000');
      rect.setAttribute('stroke-width', '2');

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', '0');
      textEl.setAttribute('y', '5');
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('font-family', 'Space Grotesk, sans-serif');
      textEl.setAttribute('font-weight', '900');
      textEl.setAttribute('font-size', '28');
      textEl.setAttribute('fill', color);
      textEl.textContent = text;

      g.appendChild(rect);
      g.appendChild(textEl);
      g.setAttribute('transform', `translate(${startX}, ${startY})`);
      animatedAllelesRef.current.appendChild(g);

      return { el: g, text, sx: startX, sy: startY, tx: targetX, ty: targetY };
    },
    []
  );

  const createBloodDropSVG = useCallback((phenotype: string, color: string, cx: number, cy: number): SVGGElement | null => {
    if (!dropsLayerRef.current) return null;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${cx}, ${cy}) scale(0)`);

    const drop = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    drop.setAttribute('d', 'M 0 -25 C 20 -5, 25 10, 25 20 A 25 25 0 0 1 -25 20 C -25 10, -20 -5, 0 -25 Z');
    drop.setAttribute('fill', color);
    drop.setAttribute('stroke', '#000');
    drop.setAttribute('stroke-width', '3');
    g.appendChild(drop);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '13');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-family', 'Space Grotesk, sans-serif');
    text.setAttribute('font-weight', '900');
    text.setAttribute('font-size', '16');
    text.setAttribute('fill', '#fff');
    text.textContent = phenotype;
    g.appendChild(text);

    dropsLayerRef.current.appendChild(g);
    return g;
  }, []);

  const createCellBg = useCallback((x: number, y: number, w: number, h: number): SVGRectElement | null => {
    if (!cellBackgroundsRef.current) return null;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(w));
    rect.setAttribute('height', String(h));
    rect.setAttribute('fill', '#ffffff');
    rect.setAttribute('opacity', '0');
    cellBackgroundsRef.current.appendChild(rect);
    return rect;
  }, []);

  const clearCanvas = useCallback(() => {
    if (animatedAllelesRef.current) animatedAllelesRef.current.innerHTML = '';
    if (dropsLayerRef.current) dropsLayerRef.current.innerHTML = '';
    if (cellBackgroundsRef.current) cellBackgroundsRef.current.innerHTML = '';
    activeAnimationsRef.current = [];
    finalDropsRef.current = [];
    resultsRef.current = [];
  }, []);

  const calculateRatios = useCallback(() => {
    const counts: Record<string, number> = {};
    resultsRef.current.forEach((res) => {
      counts[res] = (counts[res] || 0) + 1;
    });

    const keys = Object.keys(counts).sort();
    const gStr = keys.map(k => `<span class="inline-block bg-slate-800 px-2 py-1 rounded text-white border border-slate-600">${k}: ${counts[k]}</span>`);
    setGenotypeResult(`<div class="flex gap-2 flex-wrap">${gStr.join('')}</div>`);

    const phenoCounts: Record<string, number> = { A: 0, B: 0, AB: 0, O: 0 };
    resultsRef.current.forEach((res) => {
      if (res === 'AA' || res === 'AO') phenoCounts['A']++;
      else if (res === 'BB' || res === 'BO') phenoCounts['B']++;
      else if (res === 'AB') phenoCounts['AB']++;
      else phenoCounts['O']++;
    });

    const pStr: string[] = [];
    if (phenoCounts['A'] > 0) pStr.push(`<span class="inline-block bg-red-100 px-2 py-1 rounded text-red-700 border border-red-500">Tipe A: ${phenoCounts['A']}</span>`);
    if (phenoCounts['B'] > 0) pStr.push(`<span class="inline-block bg-blue-100 px-2 py-1 rounded text-blue-700 border border-blue-500">Tipe B: ${phenoCounts['B']}</span>`);
    if (phenoCounts['AB'] > 0) pStr.push(`<span class="inline-block bg-purple-100 px-2 py-1 rounded text-purple-700 border border-purple-500">Tipe AB: ${phenoCounts['AB']}</span>`);
    if (phenoCounts['O'] > 0) pStr.push(`<span class="inline-block bg-slate-200 px-2 py-1 rounded text-slate-700 border border-slate-500">Tipe O: ${phenoCounts['O']}</span>`);
    setPhenotypeResult(`<div class="flex gap-2 flex-wrap">${pStr.join('')}</div>`);
  }, []);

  const performCross = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    clearCanvas();
    setGenotypeResult('Menghitung...');
    setPhenotypeResult('Menghitung...');

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const pTop = parent1[col];
        const pLeft = parent2[row];

        const bg = createCellBg(
          TARGET_CELLS[row][col].x - 100,
          TARGET_CELLS[row][col].y - 100,
          200,
          200
        );

        const txTop = TARGET_CELLS[row][col].x - 22;
        const txLeft = TARGET_CELLS[row][col].x + 22;
        const targetY = TARGET_CELLS[row][col].y + 60;

        const animTop = createMovingAllele(pTop, TOP_SPAWNS[col].x, TOP_SPAWNS[col].y, txTop, targetY, getAlleleColor(pTop));
        const animLeft = createMovingAllele(pLeft, LEFT_SPAWNS[row].x, LEFT_SPAWNS[row].y, txLeft, targetY, getAlleleColor(pLeft));

        activeAnimationsRef.current.push(animTop, animLeft);

        const alleles = [pTop, pLeft];
        alleles.sort();
        const genotype = alleles.join('');
        resultsRef.current.push(genotype);

        let phenotype = '';
        let dropColor = '';
        let bgColor = '';

        if (genotype === 'AA' || genotype === 'AO') {
          phenotype = 'A';
          dropColor = '#ef4444';
          bgColor = '#fef2f2';
        } else if (genotype === 'BB' || genotype === 'BO') {
          phenotype = 'B';
          dropColor = '#3b82f6';
          bgColor = '#eff6ff';
        } else if (genotype === 'AB') {
          phenotype = 'AB';
          dropColor = '#a855f7';
          bgColor = '#faf5ff';
        } else {
          phenotype = 'O';
          dropColor = '#cbd5e1';
          bgColor = '#f8fafc';
        }

        const cx = TARGET_CELLS[row][col].x;
        const cy = TARGET_CELLS[row][col].y - 15;

        const drop = createBloodDropSVG(phenotype, dropColor, cx, cy);

        finalDropsRef.current.push({
          el: drop,
          bg,
          bgColor,
          cx,
          cy
        });
      }
    }

    animationStartRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animateCross);
  }, [isAnimating, parent1, parent2, clearCanvas, createCellBg, createMovingAllele, createBloodDropSVG]);

  const animateCross = useCallback((timestamp: number) => {
    const elapsed = timestamp - animationStartRef.current;
    const progress = Math.min(elapsed / ANIM_DURATION, 1);

    const slideProgress = Math.min(progress / 0.5, 1);
    const easeSlide = 1 - Math.pow(1 - slideProgress, 3);

    activeAnimationsRef.current.forEach((anim) => {
      if (!anim.el) return;
      const currentX = anim.sx + (anim.tx - anim.sx) * easeSlide;
      const currentY = anim.sy + (anim.ty - anim.sy) * easeSlide;
      anim.el.setAttribute('transform', `translate(${currentX}, ${currentY})`);
    });

    if (progress > 0.5) {
      const bloomProgress = (progress - 0.5) / 0.5;
      const easeBloom = easeOutBack(bloomProgress);

      finalDropsRef.current.forEach((f) => {
        if (f.el) {
          f.el.setAttribute('transform', `translate(${f.cx}, ${f.cy}) scale(${Math.max(0, easeBloom * 1.5)})`);
        }
        if (f.bg) {
          f.bg.setAttribute('fill', f.bgColor);
          f.bg.setAttribute('opacity', String(bloomProgress));
        }
      });
    }

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animateCross);
    } else {
      setIsAnimating(false);
      calculateRatios();
    }
  }, [calculateRatios]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const toggleAllele = (parent: '1' | '2', pos: number) => {
    if (isAnimating) return;

    const getNextAllele = (current: string) => {
      return ALLELES[(ALLELES.indexOf(current) + 1) % 3];
    };

    if (parent === '1') {
      setParent1((prev) => {
        const newParent = [...prev];
        newParent[pos] = getNextAllele(newParent[pos]);
        return newParent;
      });
    } else {
      setParent2((prev) => {
        const newParent = [...prev];
        newParent[pos] = getNextAllele(newParent[pos]);
        return newParent;
      });
    }

    clearCanvas();
    setGenotypeResult('-');
    setPhenotypeResult('-');
  };

  const getAlleleButtonClass = (allele: string) => {
    const baseClass = 'border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg flex-1 py-2 font-black text-2xl transition-all hover:scale-105';
    if (allele === 'A') {
      return `${baseClass} bg-red-100 text-red-600`;
    } else if (allele === 'B') {
      return `${baseClass} bg-blue-100 text-blue-600`;
    }
    return `${baseClass} bg-slate-100 text-slate-600`;
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-rose-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative mx-4 md:mx-auto mt-4">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm -rotate-3 text-black">BIOLOGI GENETIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: GENETIKA DARAH
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Eksplorasi Alel Ganda, Kodominansi, dan Probabilitas Keturunan (Sistem ABO)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 mx-4 md:mx-auto items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#f43f5e] text-md rotate-2 z-30 uppercase">
            Pengaturan Induk
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-rose-800 border-b-2 border-rose-200 pb-1">Genotipe Ayah (Atas)</label>
              <div className="flex gap-2 mt-1">
                <button onClick={() => toggleAllele('1', 0)} className={getAlleleButtonClass(parent1[0])}>
                  {parent1[0]}
                </button>
                <button onClick={() => toggleAllele('1', 1)} className={getAlleleButtonClass(parent1[1])}>
                  {parent1[1]}
                </button>
              </div>
              <div className="text-[10px] font-bold text-rose-600 italic">*Klik tombol huruf untuk mengubah alel (A, B, O)</div>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-blue-800 border-b-2 border-blue-200 pb-1">Genotipe Ibu (Samping)</label>
              <div className="flex gap-2 mt-1">
                <button onClick={() => toggleAllele('2', 0)} className={getAlleleButtonClass(parent2[0])}>
                  {parent2[0]}
                </button>
                <button onClick={() => toggleAllele('2', 1)} className={getAlleleButtonClass(parent2[1])}>
                  {parent2[1]}
                </button>
              </div>
            </div>

            <div className="bg-yellow-100 border-4 border-black p-3 text-xs font-bold shadow-[4px_4px_0px_0px_#000] leading-relaxed">
              ℹ️ <b>Keterangan Alel:</b><br />
              • <b>A & B:</b> Dominan / Kodominan<br />
              • <b>O:</b> Resesif (Hanya muncul jika OO)
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={performCross}
                disabled={isAnimating}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold cursor-pointer uppercase py-3 text-sm flex-1 flex items-center justify-center gap-2 ${
                  isAnimating ? 'bg-slate-400 text-slate-700' : 'bg-emerald-400 hover:bg-emerald-300 text-black'
                }`}
              >
                🧬 SILANGKAN
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-rose-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">HASIL ANALISIS KETURUNAN (F1)</h4>

            <div className="flex flex-col gap-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Kemungkinan Genotipe</span>
                <div
                  className="font-mono text-sm text-yellow-300 font-bold transition-all duration-300"
                  dangerouslySetInnerHTML={{ __html: genotypeResult }}
                />
              </div>

              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Kemungkinan Golongan Darah (Fenotipe)</span>
                <div
                  className="font-mono text-sm text-emerald-400 font-bold transition-all duration-300"
                  dangerouslySetInnerHTML={{ __html: phenotypeResult }}
                />
              </div>
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
              Kanvas Papan Punnett Animasi
            </span>

            <div className="absolute bottom-4 right-4 z-20 flex gap-2 bg-white/90 p-2 border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="flex flex-col items-center mx-1">
                <span className="text-[8px] font-black uppercase text-slate-500 mb-1">Tipe A</span>
                <svg width="24" height="24" viewBox="0 0 40 40">
                  <path d="M 20 0 C 35 15, 40 25, 40 30 A 20 20 0 0 1 0 30 C 0 25, 5 15, 20 0 Z" fill="#ef4444" stroke="#000" strokeWidth="2" />
                </svg>
              </div>
              <div className="flex flex-col items-center mx-1">
                <span className="text-[8px] font-black uppercase text-slate-500 mb-1">Tipe B</span>
                <svg width="24" height="24" viewBox="0 0 40 40">
                  <path d="M 20 0 C 35 15, 40 25, 40 30 A 20 20 0 0 1 0 30 C 0 25, 5 15, 20 0 Z" fill="#3b82f6" stroke="#000" strokeWidth="2" />
                </svg>
              </div>
              <div className="flex flex-col items-center mx-1">
                <span className="text-[8px] font-black uppercase text-slate-500 mb-1">Tipe AB</span>
                <svg width="24" height="24" viewBox="0 0 40 40">
                  <path d="M 20 0 C 35 15, 40 25, 40 30 A 20 20 0 0 1 0 30 C 0 25, 5 15, 20 0 Z" fill="#a855f7" stroke="#000" strokeWidth="2" />
                </svg>
              </div>
              <div className="flex flex-col items-center mx-1">
                <span className="text-[8px] font-black uppercase text-slate-500 mb-1">Tipe O</span>
                <svg width="24" height="24" viewBox="0 0 40 40">
                  <path d="M 20 0 C 35 15, 40 25, 40 30 A 20 20 0 0 1 0 30 C 0 25, 5 15, 20 0 Z" fill="#cbd5e1" stroke="#000" strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div className="w-full h-full max-w-[500px] relative z-10 flex items-center justify-center">
              <svg viewBox="0 0 500 500" className="w-full h-full overflow-visible" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <g stroke="#1e293b" strokeWidth="6" strokeLinecap="round">
                  <line x1="100" y1="100" x2="500" y2="100" />
                  <line x1="100" y1="300" x2="500" y2="300" />
                  <line x1="100" y1="100" x2="100" y2="500" />
                  <line x1="300" y1="100" x2="300" y2="500" />
                </g>

                <text x="50" y="60" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="24" fill="#94a3b8">♂/♀</text>

                <g ref={cellBackgroundsRef} />

                <g ref={dropsLayerRef} />

                <g ref={animatedAllelesRef} />

                <g fontFamily="Space Grotesk" fontWeight="900" fontSize="36" textAnchor="middle" dominantBaseline="middle">
                  <rect x="150" y="10" width="100" height="60" rx="8" fill="#ffe4e6" stroke="#e11d48" strokeWidth="3" />
                  <text x="200" y="45" fill={getAlleleColor(parent1[0])}>{parent1[0]}</text>

                  <rect x="350" y="10" width="100" height="60" rx="8" fill="#ffe4e6" stroke="#e11d48" strokeWidth="3" />
                  <text x="400" y="45" fill={getAlleleColor(parent1[1])}>{parent1[1]}</text>

                  <rect x="10" y="150" width="60" height="100" rx="8" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="3" />
                  <text x="40" y="205" fill={getAlleleColor(parent2[0])}>{parent2[0]}</text>

                  <rect x="10" y="350" width="60" height="100" rx="8" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="3" />
                  <text x="40" y="405" fill={getAlleleColor(parent2[1])}>{parent2[1]}</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-rose-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mx-4 md:mx-auto mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan: Pewarisan Golongan Darah 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Alel Ganda</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Berbeda dengan kacang ercis Mendel yang hanya punya 2 variasi (Ungu/Putih), golongan darah manusia ditentukan oleh <b>3 alel</b> yang berbeda: <b>Iᴬ (A)</b>, <b>Iᴮ (B)</b>, dan <b>i (O)</b>. Namun, setiap orang tetap hanya bisa memiliki sepasang (2 buah) alel dalam tubuhnya.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-purple-600 border-b-2 border-black pb-1 mb-2">Kodominansi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Alel A dan B sama-sama kuat (Dominan). Jika seorang anak mewarisi alel A dari ayah dan B dari ibu, tidak ada yang mau mengalah. Keduanya akan diekspresikan bersamaan, menciptakan golongan darah baru: <b>Tipe AB</b>.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-slate-600 border-b-2 border-black pb-1 mb-2">Alel Resesif (O)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Alel O bersifat resesif (lemah). Jika ia berpasangan dengan A atau B (seperti AO atau BO), sifat O akan tertutupi, sehingga darahnya menjadi tipe A atau B. Darah akan menjadi <b>Tipe O</b> murni HANYA JIKA anak mewarisi alel O dari kedua orang tuanya (OO).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}