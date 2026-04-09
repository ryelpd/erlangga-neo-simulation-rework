import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const SVG_W = 800;
const SVG_H = 400;
const MARGIN_BOTTOM = 50;
const MARGIN_LEFT = 40;
const MARGIN_RIGHT = 40;
const GRAPH_W = SVG_W - MARGIN_LEFT - MARGIN_RIGHT;
const GRAPH_H = SVG_H - MARGIN_BOTTOM;
const MIN_X = -10;
const MAX_X = 10;
const RANGE_X = MAX_X - MIN_X;
const Y_MAX = 1.05;
const NUM_BINS = 50;
const BIN_WIDTH = RANGE_X / NUM_BINS;

export default function DistribusiNormal() {
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  const [showEmpirical, setShowEmpirical] = useState(false);
  const [sampleData, setSampleData] = useState<number[]>([]);
  
  const binsRef = useRef<number[]>(new Array(NUM_BINS).fill(0));

  const mapX = useCallback((x: number) => MARGIN_LEFT + ((x - MIN_X) / RANGE_X) * GRAPH_W, []);
  const mapY = useCallback((y: number) => GRAPH_H - (y / Y_MAX) * (GRAPH_H - 20), []);

  const normalPDF = useCallback((x: number, mean: number, stdDev: number) => {
    const variance = stdDev * stdDev;
    const exponent = -Math.pow(x - mean, 2) / (2 * variance);
    const coefficient = 1 / Math.sqrt(2 * Math.PI * variance);
    return coefficient * Math.exp(exponent);
  }, []);

  const randomNormal = useCallback((mean: number, stdDev: number) => {
    let u = 1 - Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }, []);

  const getCurvePath = useCallback((closePath = false) => {
    let d = "";
    for (let x = MIN_X; x <= MAX_X + 0.01; x += 0.1) {
      const y = normalPDF(x, mu, sigma);
      const px = mapX(x);
      const py = mapY(y);
      d += (d === "" ? "M " : "L ") + px + " " + py + " ";
    }
    if (closePath) {
      d += `L ${mapX(MAX_X)} ${GRAPH_H} L ${mapX(MIN_X)} ${GRAPH_H} Z`;
    }
    return d;
  }, [mu, sigma, normalPDF, mapX, mapY]);

  const addSamples = useCallback((count: number) => {
    const newSamples: number[] = [];
    for (let i = 0; i < count; i++) {
      newSamples.push(randomNormal(mu, sigma));
    }
    setSampleData(prev => [...prev, ...newSamples]);
  }, [mu, sigma, randomNormal]);

  const clearSamples = useCallback(() => {
    setSampleData([]);
    binsRef.current = new Array(NUM_BINS).fill(0);
  }, []);

  useEffect(() => {
    const bins = new Array(NUM_BINS).fill(0);
    sampleData.forEach(val => {
      if (val >= MIN_X && val < MAX_X) {
        const binIndex = Math.floor((val - MIN_X) / BIN_WIDTH);
        if (binIndex >= 0 && binIndex < NUM_BINS) {
          bins[binIndex]++;
        }
      }
    });
    binsRef.current = bins;
  }, [sampleData]);

  const histogramRects = useMemo(() => {
    const rects = [];
    const bins = binsRef.current;
    const areaFactor = sampleData.length * BIN_WIDTH;
    
    for (let i = 0; i < NUM_BINS; i++) {
      if (bins[i] > 0) {
        const density = bins[i] / areaFactor;
        const svgY = mapY(density);
        const svgHeight = GRAPH_H - svgY;
        const svgX = mapX(MIN_X + (i * BIN_WIDTH));
        const svgWidth = (BIN_WIDTH / RANGE_X) * GRAPH_W - 1;
        
        rects.push(
          <rect
            key={i}
            x={svgX}
            y={svgY}
            width={svgWidth}
            height={svgHeight}
            fill="#34d399"
            stroke="#064e3b"
            strokeWidth="1"
            opacity={0.7}
          />
        );
      }
    }
    return rects;
  }, [sampleData, mapX, mapY]);

  const gridTicks = useMemo(() => {
    const ticks = [];
    for (let x = -10; x <= 10; x += 2) {
      ticks.push(
        <g key={x}>
          <line 
            x1={mapX(x)} y1={GRAPH_H} 
            x2={mapX(x)} y2={GRAPH_H + 5} 
            stroke="#1e293b" strokeWidth="2" 
          />
          <text 
            x={mapX(x)} y={GRAPH_H + 20} 
            textAnchor="middle" fontSize="12" fontWeight="bold" fill="#475569"
          >
            {x}
          </text>
        </g>
      );
    }
    return ticks;
  }, [mapX, GRAPH_H]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="text-center mb-8 bg-purple-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_#000] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_#000]">
            MATEMATIKA TERAPAN
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
            LAB VIRTUAL: DISTRIBUSI STATISTIK
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black">
            Distribusi Normal (Kurva Lonceng) & Sampling Acak
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          
          <div className="w-full lg:w-1/3 bg-white border-4 border-black p-6 flex flex-col gap-6 rounded-xl shadow-[8px_8px_0px_0px_#000] relative">
            <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_0px_#a855f7] text-md transform rotate-2">
              Parameter Populasi
            </span>

            <div className="flex flex-col gap-5 mt-4">
              
              <div className="bg-purple-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-purple-800 uppercase text-[10px]">Rata-rata (Mean / μ)</span>
                  <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-purple-600">{mu.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="-5" max="5" step="0.1" value={mu}
                  onChange={(e) => setMu(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                  <span>-5</span>
                  <span>0</span>
                  <span>+5</span>
                </div>
              </div>

              <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-rose-800 uppercase text-[10px]">Simpangan Baku (σ)</span>
                  <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">{sigma.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0.4" max="3" step="0.1" value={sigma}
                  onChange={(e) => setSigma(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                  <span>0.4 (Runcing)</span>
                  <span>3.0 (Datar)</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-slate-500">Opsi Visualisasi</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-indigo-600">
                    <input 
                      type="checkbox" 
                      checked={showEmpirical} 
                      onChange={(e) => setShowEmpirical(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500"
                    /> 
                    Area 68-95-99.7%
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t-4 border-black">
                <label className="text-[11px] font-black uppercase text-slate-500">Simulasi Pengambilan Sampel</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => addSamples(100)}
                    className="bg-emerald-300 hover:bg-emerald-200 text-black py-2 px-2 text-xs font-bold border-4 border-black shadow-[2px_2px_0px_0px_#000] rounded active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    🎲 +100 SAMPEL
                  </button>
                  <button 
                    onClick={() => addSamples(1000)}
                    className="bg-teal-300 hover:bg-teal-200 text-black py-2 px-2 text-xs font-bold border-4 border-black shadow-[2px_2px_0px_0px_#000] rounded active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    🎲 +1000 SAMPEL
                  </button>
                </div>
                <button 
                  onClick={clearSamples}
                  className="bg-slate-800 hover:bg-slate-700 text-white py-2 mt-1 text-xs font-bold border-4 border-black shadow-[2px_2px_0px_0px_#000] rounded active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  🧹 HAPUS DATA SAMPEL
                </button>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
              <h4 className="font-black text-purple-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">STATISTIK DATA (HISTOGRAM)</h4>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Total Sampel (N)</span>
                  <span className="text-xl font-black text-white font-mono">{sampleData.length}</span>
                </div>
                <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Varians (σ²)</span>
                  <span className="text-xl font-black text-rose-400 font-mono">{(sigma * sigma).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-black p-2 border-2 border-dashed border-slate-500 text-center mt-2 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Persamaan PDF</span>
                <span className="text-xs font-mono text-emerald-300">
                  f(x) = (1 / σ√2π) * e<sup>-½((x-μ)/σ)²</sup>
                </span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            <div className="bg-pattern-dot p-0 relative flex flex-col w-full h-[600px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000]">
              <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30">
                Grafik Distribusi
              </span>

              <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-purple-600 border border-black"></div> Kurva Teoritis</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-400 border border-black opacity-70"></div> Histogram</div>
                <div className="flex items-center gap-2"><div className="w-1 h-3 bg-rose-500 border-l border-black"></div> Rata-rata (μ)</div>
              </div>

              <div className="w-full h-full flex justify-center items-end pb-8 px-4 pt-16">
                
                <svg viewBox="0 0 800 400" className="w-full h-full overflow-visible">
                  <g>
                    <line x1="0" y1={GRAPH_H} x2={SVG_W} y2={GRAPH_H} stroke="#1e293b" strokeWidth="4" strokeLinecap="round"/>
                    <line x1={MARGIN_LEFT} y1="20" x2={MARGIN_LEFT} y2="360" stroke="#1e293b" strokeWidth="2" />
                    
                    {gridTicks}

                    {showEmpirical && (
                      <>
                        <path d={getCurvePath(true)} fill="#818cf8" opacity={0.3} />
                        <path d={getCurvePath(true)} fill="#60a5fa" opacity={0.2} />
                        <path d={getCurvePath(true)} fill="#94a3b8" opacity={0.2} />
                        <text x={mapX(mu)} y={mapY(normalPDF(mu, mu, sigma) * 0.5)} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#4338ca">68.2%</text>
                        <text x={mapX(mu)} y={mapY(normalPDF(mu, mu, sigma) * 0.2)} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2563eb">95.4%</text>
                      </>
                    )}

                    {histogramRects}

                    <path d={getCurvePath(false)} fill="none" stroke="#7e22ce" strokeWidth="5" strokeLinejoin="round" />
                    <path d={getCurvePath(true)} fill="#d8b4fe" opacity={0.2} />

                    <line x1={mapX(mu)} y1="20" x2={mapX(mu)} y2={GRAPH_H} stroke="#e11d48" strokeWidth="3" strokeDasharray="8 4" />
                    <text x={mapX(mu)} y="15" textAnchor="middle" fontSize="14" fontWeight="900" fill="#e11d48">μ</text>
                  </g>
                </svg>
              </div>

            </div>

          </div>
        </div>

        <div className="bg-purple-50 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_#000] mb-10">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1">
            Buku Panduan: Distribusi Normal
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-purple-700 border-b-2 border-black pb-1 mb-2">1. Bentuk Simetris</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
                Distribusi normal selalu simetris di sekitar pusatnya. Nilai Rata-rata (Mean), Median, dan Modus semuanya berada di titik puncak yang sama.
              </p>
            </div>
            
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">2. Simpangan Baku (σ)</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
                Jika σ kecil: Data berkerumun rapat (kurva tinggi & sempit).<br/>
                Jika σ besar: Data tersebar luas (kurva pendek & landai).
              </p>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-indigo-600 border-b-2 border-black pb-1 mb-2">3. Aturan Empiris</h4>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
                ~68% data dalam jarak ±1σ.<br/>
                ~95% data dalam jarak ±2σ.<br/>
                ~99.7% data dalam jarak ±3σ.
              </p>
            </div>
          </div>

          <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-md uppercase text-emerald-400 mb-2">Hukum Bilangan Besar</h4>
            <p className="text-sm font-semibold leading-relaxed">
              Cobalah tekan tombol <b>"+100 Sampel"</b>. Saat Anda menambahkan lebih banyak sampel, histogram akan semakin mendekati bentuk kurva teoritis.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
