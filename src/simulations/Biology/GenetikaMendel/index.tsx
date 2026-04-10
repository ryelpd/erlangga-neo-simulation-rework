import { useState, useRef, useCallback, useEffect } from 'react';

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

interface FlowerState {
  el: SVGGElement | null;
  bg: SVGRectElement | null;
  bgColor: string;
  cx: number;
  cy: number;
}

export default function GenetikaMendel() {
  const [parent1, setParent1] = useState<string[]>(['P', 'P']);
  const [parent2, setParent2] = useState<string[]>(['p', 'p']);
  const [genotypeResult, setGenotypeResult] = useState<string>('-');
  const [phenotypeResult, setPhenotypeResult] = useState<string>('-');
  const [isAnimating, setIsAnimating] = useState(false);

  const animatedAllelesRef = useRef<SVGGElement>(null);
  const flowersLayerRef = useRef<SVGGElement>(null);
  const cellBackgroundsRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number>(0);
  const animationStartRef = useRef<number>(0);
  const activeAnimationsRef = useRef<AnimationState[]>([]);
  const finalFlowersRef = useRef<FlowerState[]>([]);
  const resultsRef = useRef<string[]>([]);

  const colorP = '#a855f7';
  const colorp = '#94a3b8';

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

  const createFlowerSVG = useCallback((color: string, cx: number, cy: number): SVGGElement | null => {
    if (!flowersLayerRef.current) return null;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${cx}, ${cy}) scale(0)`);

    for (let i = 0; i < 5; i++) {
      const angle = (i * 72) * Math.PI / 180;
      const px = Math.cos(angle) * 35;
      const py = Math.sin(angle) * 35;

      const petal = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      petal.setAttribute('cx', String(px));
      petal.setAttribute('cy', String(py));
      petal.setAttribute('r', '25');
      petal.setAttribute('fill', color);
      petal.setAttribute('stroke', '#000');
      petal.setAttribute('stroke-width', '3');
      g.appendChild(petal);
    }

    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('r', '20');
    center.setAttribute('fill', '#facc15');
    center.setAttribute('stroke', '#000');
    center.setAttribute('stroke-width', '4');
    g.appendChild(center);

    flowersLayerRef.current.appendChild(g);
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
    if (flowersLayerRef.current) flowersLayerRef.current.innerHTML = '';
    if (cellBackgroundsRef.current) cellBackgroundsRef.current.innerHTML = '';
    activeAnimationsRef.current = [];
    finalFlowersRef.current = [];
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

    let purpleCount = 0;
    let whiteCount = 0;
    resultsRef.current.forEach((res) => {
      if (res.includes('P')) purpleCount++;
      else whiteCount++;
    });

    const pStr: string[] = [];
    if (purpleCount > 0) pStr.push(`<span class="inline-block bg-purple-900 px-2 py-1 rounded text-purple-300 border border-purple-500">🌸 Ungu: ${purpleCount}</span>`);
    if (whiteCount > 0) pStr.push(`<span class="inline-block bg-slate-700 px-2 py-1 rounded text-slate-300 border border-slate-500">💮 Putih: ${whiteCount}</span>`);
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
        const targetY = TARGET_CELLS[row][col].y + 50;

        const animTop = createMovingAllele(pTop, TOP_SPAWNS[col].x, TOP_SPAWNS[col].y, txTop, targetY, pTop === 'P' ? colorP : colorp);
        const animLeft = createMovingAllele(pLeft, LEFT_SPAWNS[row].x, LEFT_SPAWNS[row].y, txLeft, targetY, pLeft === 'P' ? colorP : colorp);

        activeAnimationsRef.current.push(animTop, animLeft);

        const alleles = [pTop, pLeft];
        alleles.sort();
        const genotype = alleles.join('');
        resultsRef.current.push(genotype);

        const isPurple = genotype.includes('P');
        const flowerColor = isPurple ? '#c084fc' : '#f8fafc';
        const bgColor = isPurple ? '#faf5ff' : '#ffffff';

        const cx = TARGET_CELLS[row][col].x;
        const cy = TARGET_CELLS[row][col].y - 15;

        const flower = createFlowerSVG(flowerColor, cx, cy);

        finalFlowersRef.current.push({
          el: flower,
          bg,
          bgColor,
          cx,
          cy
        });
      }
    }

    animationStartRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animateCross);
  }, [isAnimating, parent1, parent2, clearCanvas, createCellBg, createMovingAllele, createFlowerSVG]);

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

      finalFlowersRef.current.forEach((f) => {
        if (f.el) {
          f.el.setAttribute('transform', `translate(${f.cx}, ${f.cy}) scale(${Math.max(0, easeBloom)})`);
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

    if (parent === '1') {
      setParent1((prev) => {
        const newParent = [...prev];
        newParent[pos] = newParent[pos] === 'P' ? 'p' : 'P';
        return newParent;
      });
    } else {
      setParent2((prev) => {
        const newParent = [...prev];
        newParent[pos] = newParent[pos] === 'P' ? 'p' : 'P';
        return newParent;
      });
    }

    clearCanvas();
    setGenotypeResult('-');
    setPhenotypeResult('-');
  };

  const getAlleleButtonClass = (allele: string) => {
    const baseClass = 'border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg flex-1 py-2 font-black text-2xl transition-all hover:scale-105';
    if (allele === 'P') {
      return `${baseClass} bg-purple-100 text-purple-700`;
    }
    return `${baseClass} bg-slate-100 text-slate-700`;
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-purple-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative mx-4 md:mx-auto mt-4">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm -rotate-3 text-black">BIOLOGI GENETIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: PERSILANGAN MENDEL
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Eksplorasi Alel Dominan, Resesif, dan Hukum Segregasi
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 mx-4 md:mx-auto items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#a855f7] text-md rotate-2 z-30 uppercase">
            Pengaturan Induk
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-rose-800 border-b-2 border-rose-200 pb-1">Genotipe Induk 1 (Atas)</label>
              <div className="flex gap-2 mt-1">
                <button onClick={() => toggleAllele('1', 0)} className={getAlleleButtonClass(parent1[0])}>
                  {parent1[0]}
                </button>
                <button onClick={() => toggleAllele('1', 1)} className={getAlleleButtonClass(parent1[1])}>
                  {parent1[1]}
                </button>
              </div>
              <div className="text-[10px] font-bold text-rose-600 italic">*Klik tombol huruf untuk mengubah alel</div>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-blue-800 border-b-2 border-blue-200 pb-1">Genotipe Induk 2 (Samping)</label>
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
              ℹ️ <b>Keterangan Karakter:</b><br />
              • <b>P (Warna Ungu):</b> Sifat Dominan<br />
              • <b>p (Warna Abu):</b> Sifat Resesif
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
            <h4 className="font-black text-purple-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">HASIL ANALISIS KETURUNAN (F1)</h4>

            <div className="flex flex-col gap-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Rasio Genotipe</span>
                <div
                  className="font-mono text-sm text-yellow-300 font-bold transition-all duration-300"
                  dangerouslySetInnerHTML={{ __html: genotypeResult }}
                />
              </div>

              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Rasio Fenotipe</span>
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

            <div className="absolute bottom-4 right-4 z-20 flex gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-slate-500 mb-1 bg-white px-1 border border-slate-300">Dominan (P)</span>
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="15" fill="#a855f7" stroke="#000" strokeWidth="2" />
                </svg>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-slate-500 mb-1 bg-white px-1 border border-slate-300">Resesif (p)</span>
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="15" fill="#ffffff" stroke="#000" strokeWidth="2" />
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

                <g ref={flowersLayerRef} />

                <g ref={animatedAllelesRef} />

                <g fontFamily="Space Grotesk" fontWeight="900" fontSize="36" textAnchor="middle" dominantBaseline="middle">
                  <rect x="150" y="10" width="100" height="60" rx="8" fill="#fecdd3" stroke="#e11d48" strokeWidth="3" />
                  <text x="200" y="45" fill="#be123c">{parent1[0]}</text>

                  <rect x="350" y="10" width="100" height="60" rx="8" fill="#fecdd3" stroke="#e11d48" strokeWidth="3" />
                  <text x="400" y="45" fill="#be123c">{parent1[1]}</text>

                  <rect x="10" y="150" width="60" height="100" rx="8" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="3" />
                  <text x="40" y="205" fill="#1e3a8a">{parent2[0]}</text>

                  <rect x="10" y="350" width="60" height="100" rx="8" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="3" />
                  <text x="40" y="405" fill="#1e3a8a">{parent2[1]}</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-indigo-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mx-4 md:mx-auto mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan: Hukum Pewarisan Sifat Mendel 🧬
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Hukum Segregasi</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Setiap individu memiliki dua alel untuk setiap sifat, dan alel ini <b>terpisah (segregasi)</b> saat pembentukan gamet. Setiap gamet hanya membawa satu alel dari pasangan alel induk.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-purple-600 border-b-2 border-black pb-1 mb-2">Alel Dominan & Resesif</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Alel <b>dominan (P)</b> akan "menutupi" alel resesif saat keduanya hadir bersama (heterozigot). Alel <b>resesif (p)</b> hanya akan tampil jika individu tidak memiliki alel dominan (homozigot resesif).
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Papan Punnett</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Alat diagram untuk memvisualisasikan semua kemungkinan kombinasi alel dari kedua induk. Setiap sel dalam papan Punnett mewakili <b>25% probabilitas</b> untuk kombinasi tersebut.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}