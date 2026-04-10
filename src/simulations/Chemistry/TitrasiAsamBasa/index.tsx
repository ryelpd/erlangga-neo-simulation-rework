import { useRef, useEffect, useCallback } from 'react';

const VOL_ANALYTE = 25.0;
const MAX_TITRANT = 50.0;
const KA_WEAK_ACID = 1.8e-5;
const KW = 1e-14;

const GRAPH_W = 350;
const GRAPH_H = 280;

function mapVolToX(v: number) { return 30 + (v / MAX_TITRANT) * GRAPH_W; }
function mapPHToY(ph: number) { return 280 - (ph / 14.0) * GRAPH_H; }

interface PlotPoint { v: number; ph: number }

export default function TitrasiAsamBasa() {
  const stateRef = useRef({
    acidType: 'STRONG' as 'STRONG' | 'WEAK',
    ma: 0.10,
    mt: 0.10,
    vt: 0.0,
    currentPH: 1.0,
    vEq: 25.0,
    dripRate: 0,
    plotPoints: [{ v: 0, ph: 1.0 }] as PlotPoint[],
    dropTimer: 0,
    lastTime: 0,
  });

  const sliderMaRef = useRef<HTMLInputElement>(null);
  const sliderMtRef = useRef<HTMLInputElement>(null);
  const valMaRef = useRef<HTMLSpanElement>(null);
  const valMtRef = useRef<HTMLSpanElement>(null);
  const dataVolumeRef = useRef<HTMLSpanElement>(null);
  const dataPHRef = useRef<HTMLSpanElement>(null);
  const dataEqStatusRef = useRef<HTMLSpanElement>(null);

  const buretLiquidRef = useRef<SVGRectElement>(null);
  const stopcockHandleRef = useRef<SVGRectElement>(null);
  const dropLayerRef = useRef<SVGGElement>(null);
  const flaskLiquidRef = useRef<SVGPathElement>(null);
  const stirBarRef = useRef<SVGRectElement>(null);
  const plotCurveRef = useRef<SVGPathElement>(null);
  const ghostCurveRef = useRef<SVGPathElement>(null);
  const currentPointRef = useRef<SVGCircleElement>(null);
  const eqMarkerRef = useRef<SVGGElement>(null);

  const btnStrongAcidRef = useRef<HTMLButtonElement>(null);
  const btnWeakAcidRef = useRef<HTMLButtonElement>(null);
  const btnValveClosedRef = useRef<HTMLButtonElement>(null);
  const btnValveSlowRef = useRef<HTMLButtonElement>(null);
  const btnValveFastRef = useRef<HTMLButtonElement>(null);

  const calculatePH = useCallback((v_t: number) => {
    const state = stateRef.current;
    const nAcid = VOL_ANALYTE * state.ma;
    const nBase = v_t * state.mt;
    const vTot = VOL_ANALYTE + v_t;

    if (Math.abs(nAcid - nBase) < 1e-8) {
      if (state.acidType === 'STRONG') {
        return 7.0;
      } else {
        const mSalt = nAcid / vTot;
        const oh_conc = Math.sqrt((KW / KA_WEAK_ACID) * mSalt);
        const pOH = -Math.log10(oh_conc);
        return 14.0 - pOH;
      }
    }

    if (state.acidType === 'STRONG') {
      if (nAcid > nBase) {
        const h_conc = (nAcid - nBase) / vTot;
        return -Math.log10(h_conc);
      } else {
        const oh_conc = (nBase - nAcid) / vTot;
        return 14.0 + Math.log10(oh_conc);
      }
    } else {
      if (v_t === 0) {
        const h_conc = Math.sqrt(KA_WEAK_ACID * state.ma);
        return -Math.log10(h_conc);
      } else if (nAcid > nBase) {
        const pKa = -Math.log10(KA_WEAK_ACID);
        return pKa + Math.log10(nBase / (nAcid - nBase));
      } else {
        const oh_conc = (nBase - nAcid) / vTot;
        return 14.0 + Math.log10(oh_conc);
      }
    }
  }, []);

  const calculateVeq = useCallback(() => {
    const state = stateRef.current;
    return (VOL_ANALYTE * state.ma) / state.mt;
  }, []);

  const getIndicatorColor = useCallback((ph: number) => {
    if (ph < 8.0) {
      return 'rgba(224, 242, 254, 0.8)';
    } else if (ph < 10.0) {
      const ratio = (ph - 8.0) / 2.0;
      return `rgba(244, 114, 182, ${0.2 + ratio * 0.6})`;
    } else {
      return 'rgba(190, 24, 93, 0.9)';
    }
  }, []);

  const generateGhostCurve = useCallback(() => {
    const state = stateRef.current;
    let path = "";
    for (let v = 0; v <= MAX_TITRANT; v += 0.5) {
      const ph = calculatePH(v);
      const x = mapVolToX(v);
      const y = mapPHToY(ph);
      path += (v === 0 ? "M " : "L ") + x + " " + y + " ";
    }
    if (ghostCurveRef.current) {
      ghostCurveRef.current.setAttribute('d', path);
    }

    const epX = mapVolToX(state.vEq);
    const epY = mapPHToY(calculatePH(state.vEq));
    if (eqMarkerRef.current) {
      eqMarkerRef.current.setAttribute('transform', `translate(${epX}, ${epY})`);
    }
  }, [calculatePH]);

  const spawnDrop = useCallback(() => {
    if (!dropLayerRef.current) return;
    const drop = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    drop.setAttribute('cx', '0');
    drop.setAttribute('cy', '0');
    drop.setAttribute('r', '3');
    drop.setAttribute('fill', '#d1fae5');
    drop.style.animation = 'fall 0.3s ease-in forwards';
    dropLayerRef.current.appendChild(drop);
    setTimeout(() => { if (drop.parentNode) drop.remove(); }, 300);
  }, []);

  const updateVisuals = useCallback(() => {
    const state = stateRef.current;

    if (sliderMaRef.current) state.ma = parseFloat(sliderMaRef.current.value);
    if (sliderMtRef.current) state.mt = parseFloat(sliderMtRef.current.value);
    if (valMaRef.current) valMaRef.current.textContent = state.ma.toFixed(2) + " M";
    if (valMtRef.current) valMtRef.current.textContent = state.mt.toFixed(2) + " M";

    state.vEq = calculateVeq();
    state.currentPH = calculatePH(state.vt);

    if (dataVolumeRef.current) dataVolumeRef.current.textContent = state.vt.toFixed(1);
    if (dataPHRef.current) dataPHRef.current.textContent = state.currentPH.toFixed(2);

    if (dataEqStatusRef.current) {
      if (state.vt > 0 && Math.abs(state.vt - state.vEq) < 0.5) {
        dataEqStatusRef.current.textContent = "TERCAPAI!";
        dataEqStatusRef.current.className = "text-xs font-black text-yellow-400 uppercase tracking-widest";
        if (eqMarkerRef.current) eqMarkerRef.current.setAttribute('opacity', '1');
      } else if (state.vt > state.vEq + 0.5) {
        dataEqStatusRef.current.textContent = "LEWAT (OVER-TITRATED)";
        dataEqStatusRef.current.className = "text-xs font-black text-rose-500 uppercase tracking-widest";
        if (eqMarkerRef.current) eqMarkerRef.current.setAttribute('opacity', '0.5');
      } else {
        dataEqStatusRef.current.textContent = "BELUM TERCAPAI";
        dataEqStatusRef.current.className = "text-xs font-black text-slate-500 uppercase tracking-widest";
        if (eqMarkerRef.current) eqMarkerRef.current.setAttribute('opacity', '0');
      }
    }

    const buretDropRatio = state.vt / MAX_TITRANT;
    const bY = 20 + (buretDropRatio * 300);
    const bH = 300 - (buretDropRatio * 300);
    if (buretLiquidRef.current) {
      buretLiquidRef.current.setAttribute('y', String(bY));
      buretLiquidRef.current.setAttribute('height', String(Math.max(0, bH)));
    }

    const fRise = buretDropRatio * 20;
    const fY = -40 - fRise;
    const fW = 30 - (fRise / 40) * 15;
    const flaskPath = `M -40 0 L 40 0 L ${fW} ${fY} L ${-fW} ${fY} Z`;
    if (flaskLiquidRef.current) {
      flaskLiquidRef.current.setAttribute('d', flaskPath);
      flaskLiquidRef.current.style.fill = getIndicatorColor(state.currentPH);
    }

    if (stopcockHandleRef.current) {
      if (state.dripRate === 0) stopcockHandleRef.current.setAttribute('transform', 'rotate(0)');
      else if (state.dripRate === 0.5) stopcockHandleRef.current.setAttribute('transform', 'rotate(-45)');
      else stopcockHandleRef.current.setAttribute('transform', 'rotate(-90)');
    }

    if (stirBarRef.current) {
      if (state.dripRate > 0) {
        stirBarRef.current.classList.add('animate-spin');
      } else {
        stirBarRef.current.classList.remove('animate-spin');
      }
    }

    const pX = mapVolToX(state.vt);
    const pY = mapPHToY(state.currentPH);
    if (currentPointRef.current) {
      currentPointRef.current.setAttribute('cx', String(pX));
      currentPointRef.current.setAttribute('cy', String(pY));
    }

    let pathD = "";
    state.plotPoints.forEach((p, i) => {
      pathD += (i === 0 ? "M " : "L ") + mapVolToX(p.v) + " " + mapPHToY(p.ph) + " ";
    });
    if (plotCurveRef.current) plotCurveRef.current.setAttribute('d', pathD);
  }, [calculatePH, calculateVeq, getIndicatorColor]);

  const setMode = useCallback((mode: 'STRONG' | 'WEAK') => {
    const state = stateRef.current;
    if (state.vt > 0) {
      if (!window.confirm("Mengganti jenis asam akan mereset proses titrasi. Lanjutkan?")) return;
    }
    state.acidType = mode;

    if (btnStrongAcidRef.current && btnWeakAcidRef.current) {
      btnStrongAcidRef.current.classList.remove('ring-4', 'ring-black', 'bg-sky-300');
      btnStrongAcidRef.current.classList.add('bg-slate-200', 'text-slate-600');
      btnWeakAcidRef.current.classList.remove('ring-4', 'ring-black', 'bg-sky-300');
      btnWeakAcidRef.current.classList.add('bg-slate-200', 'text-slate-600');

      if (mode === 'STRONG') {
        btnStrongAcidRef.current.classList.add('ring-4', 'ring-black', 'bg-sky-300');
        btnStrongAcidRef.current.classList.remove('bg-slate-200', 'text-slate-600');
      } else {
        btnWeakAcidRef.current.classList.add('ring-4', 'ring-black', 'bg-sky-300');
        btnWeakAcidRef.current.classList.remove('bg-slate-200', 'text-slate-600');
      }
    }

    resetSim();
  }, []);

  const setValve = useCallback((rate: number) => {
    const state = stateRef.current;
    state.dripRate = rate;

    const btns = [btnValveClosedRef.current, btnValveSlowRef.current, btnValveFastRef.current];
    btns.forEach(btn => {
      if (!btn) return;
      btn.classList.remove('ring-4', 'ring-black', 'bg-rose-400', 'text-white', 'bg-sky-400');
      btn.classList.add('bg-white', 'text-slate-700');
    });

    const activeBtn = rate === 0 ? btnValveClosedRef.current : rate === 0.5 ? btnValveSlowRef.current : btnValveFastRef.current;
    if (activeBtn) {
      const colorClass = rate === 0 ? 'bg-rose-400' : 'bg-sky-400';
      activeBtn.classList.add('ring-4', 'ring-black', colorClass, 'text-white');
      activeBtn.classList.remove('bg-white', 'text-slate-700');
    }
  }, []);

  const resetSim = useCallback(() => {
    const state = stateRef.current;
    state.vt = 0;
    state.plotPoints = [{ v: 0, ph: calculatePH(0) }];
    setValve(0);
    generateGhostCurve();
    updateVisuals();
  }, [calculatePH, setValve, generateGhostCurve, updateVisuals]);

  useEffect(() => {
    const state = stateRef.current;

    const animate = (timestamp: number) => {
      if (!state.lastTime) state.lastTime = timestamp;
      const dt = (timestamp - state.lastTime) / 1000;
      state.lastTime = timestamp;

      if (state.dripRate > 0 && state.vt < MAX_TITRANT) {
        state.vt += state.dripRate * dt;
        if (state.vt > MAX_TITRANT) state.vt = MAX_TITRANT;

        if (state.plotPoints.length === 0 || (state.vt - state.plotPoints[state.plotPoints.length - 1].v) >= 0.2) {
          state.plotPoints.push({ v: state.vt, ph: calculatePH(state.vt) });
        }

        state.dropTimer += dt;
        const dropInterval = state.dripRate === 0.5 ? 0.3 : 0.05;
        if (state.dropTimer > dropInterval) {
          spawnDrop();
          state.dropTimer = 0;
        }
      }

      updateVisuals();
      requestAnimationFrame(animate);
    };

    generateGhostCurve();
    updateVisuals();
    requestAnimationFrame(animate);
  }, [calculatePH, generateGhostCurve, updateVisuals, spawnDrop]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <style>{`
        .stir-bar { animation: spin 0.2s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(180deg); } }
        .drop-anim { animation: fall 0.3s ease-in forwards; }
        @keyframes fall { 0% { transform: translateY(0); opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(120px); opacity: 0; } }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 28px; width: 28px; border: 3px solid #000; border-radius: 50%; cursor: pointer; margin-top: -10px; box-shadow: 3px 3px 0px 0px #000; transition: transform 0.1s; }
        input[type=range]::-webkit-slider-thumb:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px 0px #000; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 8px; cursor: pointer; background: #000; border-radius: 4px; }
        #sliderMa::-webkit-slider-thumb { background: #3b82f6; }
        #sliderMt::-webkit-slider-thumb { background: #10b981; }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-pink-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">KIMIA ANALITIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: TITRASI ASAM BASA</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Analisis Volumetri, Kurva Titrasi, dan Indikator Fenolftalein (PP)</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#ec4899] text-md rotate-2 z-30 uppercase">Panel Persiapan</span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Sampel Analit (Erlenmeyer)</label>
              <div className="grid grid-cols-2 gap-2">
                <button ref={btnStrongAcidRef} onClick={() => setMode('STRONG')} className="neo-btn bg-sky-300 text-black py-2 px-2 text-xs font-bold ring-4 ring-black border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">ASAM KUAT (HCl)</button>
                <button ref={btnWeakAcidRef} onClick={() => setMode('WEAK')} className="neo-btn bg-slate-200 text-slate-600 py-2 px-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">ASAM LEMAH (CHCOOH)</button>
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-800 uppercase text-[10px]">Molaritas Analit (M<sub>a</sub>)</span>
                <span ref={valMaRef} className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-600">0.10 M</span>
              </div>
              <input ref={sliderMaRef} id="sliderMa" type="range" min="0.01" max="0.50" step="0.01" defaultValue="0.10" className="w-full" onChange={updateVisuals} />
              <div className="text-[9px] font-bold text-slate-500 mt-1">*Volume tetap: 25 mL</div>
            </div>

            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-800 uppercase text-[10px]">Molaritas Titran NaOH (M<sub>t</sub>)</span>
                <span ref={valMtRef} className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-600">0.10 M</span>
              </div>
              <input ref={sliderMtRef} id="sliderMt" type="range" min="0.01" max="0.50" step="0.01" defaultValue="0.10" className="w-full" onChange={updateVisuals} />
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-pink-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-pink-800 mb-1 border-b-2 border-pink-200 pb-1">Kontrol Keran Buret</label>
              <div className="grid grid-cols-3 gap-2">
                <button ref={btnValveClosedRef} onClick={() => setValve(0)} className="neo-btn bg-rose-400 text-white py-2 text-xs font-bold ring-4 ring-black border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">TUTUP</button>
                <button ref={btnValveSlowRef} onClick={() => setValve(0.5)} className="neo-btn bg-white text-slate-700 py-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">LAMBAT</button>
                <button ref={btnValveFastRef} onClick={() => setValve(2.5)} className="neo-btn bg-white text-slate-700 py-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">CEPAT</button>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button onClick={resetSim} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 text-sm w-full flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">BUANG CAMPURAN & RESET</button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-pink-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA PENGUKURAN (pH METER)</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Titran Ditambahkan</span>
                <div className="flex items-end gap-1">
                  <span ref={dataVolumeRef} className="text-xl font-black text-emerald-400 font-mono">0.0</span>
                  <span className="text-[10px] text-slate-500 font-bold mb-1">mL</span>
                </div>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Tingkat pH Aktif</span>
                <div className="flex items-end gap-1">
                  <span ref={dataPHRef} className="text-2xl font-black text-pink-400 font-mono">1.00</span>
                </div>
              </div>
            </div>
            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase text-slate-400">Status Titik Ekivalen:</span>
              <span ref={dataEqStatusRef} className="text-xs font-black text-slate-500 uppercase tracking-widest">BELUM TERCAPAI</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 border-8 border-black rounded-xl relative flex flex-col md:flex-row w-full h-[650px] overflow-hidden" style={{ backgroundColor: '#f1f5f9', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">Meja Laboratorium</span>

            <div className="w-full md:w-5/12 h-full relative z-10 flex items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black bg-white/50">
              <svg viewBox="0 0 300 600" className="w-full h-full overflow-visible pt-12 pb-4">
                <rect x="30" y="550" width="100" height="20" fill="#475569" stroke="#000" strokeWidth="4"/>
                <rect x="70" y="50" width="10" height="500" fill="#94a3b8" stroke="#000" strokeWidth="3"/>
                <path d="M 80 200 L 130 200 Q 150 200 150 220 Q 150 240 130 240 L 80 240 Z" fill="#64748b" stroke="#000" strokeWidth="3"/>

                <g transform="translate(180, 50)">
                  <rect ref={buretLiquidRef} x="-10" y="20" width="20" height="300" fill="#d1fae5" opacity="0.8" />
                  <rect x="-10" y="0" width="20" height="380" fill="none" stroke="#000" strokeWidth="4"/>
                  <polygon points="-10,380 10,380 4,420 -4,420" fill="none" stroke="#000" strokeWidth="4"/>
                  <g stroke="#000" strokeWidth="2">
                    <line x1="-10" y1="20" x2="-2" y2="20" /> <text x="-25" y="23" fontSize="10" fontWeight="bold">0</text>
                    <line x1="-10" y1="80" x2="-5" y2="80" />
                    <line x1="-10" y1="140" x2="-2" y2="140" /> <text x="-25" y="143" fontSize="10" fontWeight="bold">20</text>
                    <line x1="-10" y1="200" x2="-5" y2="200" />
                    <line x1="-10" y1="260" x2="-2" y2="260" /> <text x="-25" y="263" fontSize="10" fontWeight="bold">40</text>
                    <line x1="-10" y1="320" x2="-2" y2="320" /> <text x="-25" y="323" fontSize="10" fontWeight="bold">50</text>
                  </g>
                  <rect x="-15" y="390" width="30" height="10" fill="#cbd5e1" stroke="#000" strokeWidth="3"/>
                  <rect ref={stopcockHandleRef} x="-20" y="385" width="8" height="20" fill="#ef4444" stroke="#000" strokeWidth="3" rx="2" style={{ transition: 'transform 0.3s' }} />
                  <g ref={dropLayerRef} transform="translate(0, 420)"></g>
                </g>

                <rect x="130" y="520" width="100" height="30" fill="#e2e8f0" stroke="#000" strokeWidth="4" rx="4"/>
                <circle cx="150" cy="535" r="5" fill="#ef4444" />
                <circle cx="170" cy="535" r="5" fill="#22c55e" />

                <g transform="translate(180, 520)">
                  <path ref={flaskLiquidRef} d="M -40 0 L 40 0 L 30 -40 L -30 -40 Z" fill="#e0f2fe" opacity="0.8" style={{ transition: 'fill 0.5s' }} />
                  <path d="M -50 0 L 50 0 Q 55 -10 45 -30 L 15 -100 L 15 -140 L -15 -140 L -15 -100 L -45 -30 Q -55 -10 -50 0 Z" fill="none" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
                  <line x1="-20" y1="-140" x2="20" y2="-140" stroke="#000" strokeWidth="5" strokeLinecap="round"/>
                  <rect ref={stirBarRef} x="-15" y="-6" width="30" height="4" fill="#f8fafc" stroke="#000" strokeWidth="2" rx="2" />
                  <path d="M 25 -180 L 25 -20 L 30 -10 L 20 -10 L 25 -20 Z" fill="#94a3b8" stroke="#000" strokeWidth="3"/>
                  <circle cx="25" cy="-5" r="5" fill="#facc15" stroke="#000" strokeWidth="2"/>
                  <path d="M 25 -180 Q 80 -250 150 -100" fill="none" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 4"/>
                </g>
              </svg>
            </div>

            <div className="w-full md:w-7/12 h-full flex flex-col p-4 bg-slate-900 relative">
              <span className="text-white font-black text-[10px] uppercase mb-2 border-b-2 border-slate-700 pb-1">Kurva Titrasi (pH vs Volume NaOH)</span>
              <div className="absolute top-10 right-6 flex flex-col gap-1 text-[8px] font-bold text-slate-400 text-right bg-black/50 p-2 rounded border border-slate-700 z-20">
                <span>Rentang PP (8.2 - 10.0)</span>
                <div className="w-full h-2 rounded bg-gradient-to-r from-transparent to-pink-500 border border-slate-600"></div>
              </div>

              <div className="flex-1 w-full relative">
                <svg viewBox="0 0 400 300" className="w-full h-full overflow-visible">
                  <g stroke="#334155" strokeWidth="1" strokeDasharray="2 4">
                    <line x1="30" y1="280" x2="380" y2="280" />
                    <line x1="30" y1="140" x2="380" y2="140" stroke="#475569" strokeDasharray="none" strokeWidth="2"/>
                    <line x1="30" y1="0" x2="380" y2="0" />
                    <line x1="30" y1="0" x2="30" y2="280" stroke="#475569" strokeDasharray="none" strokeWidth="2"/>
                    <line x1="100" y1="0" x2="100" y2="280" />
                    <line x1="170" y1="0" x2="170" y2="280" />
                    <line x1="240" y1="0" x2="240" y2="280" />
                    <line x1="310" y1="0" x2="310" y2="280" />
                    <line x1="380" y1="0" x2="380" y2="280" />
                  </g>
                  <rect x="30" y="80" width="350" height="36" fill="#ec4899" opacity="0.15" />
                  <text x="15" y="284" fontSize="10" fontWeight="bold" fill="#94a3b8">0</text>
                  <text x="15" y="144" fontSize="10" fontWeight="bold" fill="#94a3b8">7</text>
                  <text x="10" y="10" fontSize="10" fontWeight="bold" fill="#94a3b8">14</text>
                  <text x="100" y="295" fontSize="10" fontWeight="bold" fill="#94a3b8" textAnchor="middle">10</text>
                  <text x="170" y="295" fontSize="10" fontWeight="bold" fill="#94a3b8" textAnchor="middle">20</text>
                  <text x="240" y="295" fontSize="10" fontWeight="bold" fill="#94a3b8" textAnchor="middle">30</text>
                  <text x="310" y="295" fontSize="10" fontWeight="bold" fill="#94a3b8" textAnchor="middle">40</text>
                  <text x="380" y="295" fontSize="10" fontWeight="bold" fill="#94a3b8" textAnchor="middle">50</text>
                  <path ref={ghostCurveRef} d="" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" opacity="0.5"/>
                  <path ref={plotCurveRef} d="" fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <g ref={eqMarkerRef} opacity="0" style={{ transition: 'opacity 0.5s' }}>
                    <circle cx="0" cy="0" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <line x1="0" y1="0" x2="0" y2="280" stroke="#facc15" strokeWidth="1" strokeDasharray="4 2" />
                    <text x="10" y="-10" fontSize="10" fontWeight="bold" fill="#facc15">Titik Ekivalen</text>
                  </g>
                  <circle ref={currentPointRef} cx="30" cy="280" r="4" fill="#38bdf8" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-pink-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">Buku Panduan: Analisis Kurva Titrasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Asam Kuat vs Asam Lemah</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              <b>Asam Kuat (HCl):</b> pH awal rendah (~1.0). Kurva datar di awal, lonjakan drastis saat titik ekivalen (pH 7.0).<br/>
              <b>Asam Lemah (CHCOOH):</b> pH awal lebih tinggi (~2.8). Daerah penyangga (Buffer) sebelum lonjakan. Titik ekivalen di atas 7 karena hidrolisis garam.
            </p>
          </div>
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Titik Ekivalen</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Titik mol asam tepat habis bereaksi dengan mol basa (<b>M<sub>a</sub> x V<sub>a</sub> = M<sub>t</sub> x V<sub>t</sub></b>). Tengah garis lonjakan vertikal. Tetesan kecil mengubah pH ekstrem!
            </p>
          </div>
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-pink-600 border-b-2 border-black pb-1 mb-2">Titik Akhir & Indikator</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              <b>Fenolftalein (PP)</b> tidak berwarna dalam asam, berubah <b>merah muda</b> pada pH 8.2-10.0. Hentikan keran saat warna muncul permanen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}