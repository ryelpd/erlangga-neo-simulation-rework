import { useState, useRef, useEffect, useCallback } from 'react';

interface Particle {
  el: SVGCircleElement | SVGRectElement;
  pathId: string;
  progress: number;
  speed: number;
}

interface PathConfig {
  el: SVGPathElement;
  length: number;
}

export default function SistemEndokrin() {
  const [currentMode, setCurrentMode] = useState<'SUGAR' | 'THYROID'>('SUGAR');
  const [isPlaying, setIsPlaying] = useState(true);
  const [glucose, setGlucose] = useState(90);
  const [insulin, setInsulin] = useState(0);
  const [glucagon, setGlucagon] = useState(0);
  const [bodyTemp, setBodyTemp] = useState(37.0);
  const [trh, setTrh] = useState(0);
  const [tsh, setTsh] = useState(0);
  const [t4, setT4] = useState(0);
  const [activeHormone, setActiveHormone] = useState('Seimbang');
  const [statusText, setStatusText] = useState('Homeostasis (Normal)');

  const svgRef = useRef<SVGSVGElement>(null);
  const pathsGroupRef = useRef<SVGGElement>(null);
  const nodesGroupRef = useRef<SVGGElement>(null);
  const particlesGroupRef = useRef<SVGGElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pathsConfigRef = useRef<{ [key: string]: PathConfig }>({});
  const animFrameIdRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef(0);
  
  const glucoseRef = useRef(90);
  const insulinRef = useRef(0);
  const glucagonRef = useRef(0);
  const bodyTempRef = useRef(37.0);
  const trhRef = useRef(0);
  const tshRef = useRef(0);
  const t4Ref = useRef(0);

  useEffect(() => { glucoseRef.current = glucose; }, [glucose]);
  useEffect(() => { insulinRef.current = insulin; }, [insulin]);
  useEffect(() => { glucagonRef.current = glucagon; }, [glucagon]);
  useEffect(() => { bodyTempRef.current = bodyTemp; }, [bodyTemp]);
  useEffect(() => { trhRef.current = trh; }, [trh]);
  useEffect(() => { tshRef.current = tsh; }, [tsh]);
  useEffect(() => { t4Ref.current = t4; }, [t4]);

  const drawNode = useCallback((id: string, x: number, y: number, width: number, height: number, title: string, subtitle: string, bgColor: string) => {
    if (!nodesGroupRef.current) return;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = `node_${id}`;
    g.setAttribute('transform', `translate(${x}, ${y})`);

    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    shadow.setAttribute('x', '4');
    shadow.setAttribute('y', '4');
    shadow.setAttribute('width', width.toString());
    shadow.setAttribute('height', height.toString());
    shadow.setAttribute('rx', '8');
    shadow.setAttribute('fill', '#000');
    g.appendChild(shadow);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.id = `rect_${id}`;
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', width.toString());
    rect.setAttribute('height', height.toString());
    rect.setAttribute('rx', '8');
    rect.setAttribute('fill', bgColor);
    rect.setAttribute('stroke', '#000');
    rect.setAttribute('stroke-width', '4');
    g.appendChild(rect);

    const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleEl.setAttribute('x', (width / 2).toString());
    titleEl.setAttribute('y', (height / 2 - 2).toString());
    titleEl.setAttribute('text-anchor', 'middle');
    titleEl.setAttribute('font-family', 'Space Grotesk');
    titleEl.setAttribute('font-weight', '900');
    titleEl.setAttribute('font-size', '16');
    titleEl.setAttribute('fill', '#000');
    titleEl.textContent = title;
    g.appendChild(titleEl);

    const subEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subEl.setAttribute('x', (width / 2).toString());
    subEl.setAttribute('y', (height / 2 + 15).toString());
    subEl.setAttribute('text-anchor', 'middle');
    subEl.setAttribute('font-family', 'Space Grotesk');
    subEl.setAttribute('font-weight', 'bold');
    subEl.setAttribute('font-size', '10');
    subEl.setAttribute('fill', '#334155');
    subEl.textContent = subtitle;
    g.appendChild(subEl);

    nodesGroupRef.current.appendChild(g);
  }, []);

  const drawPath = useCallback((id: string, dStr: string, isFeedback: boolean = false) => {
    if (!pathsGroupRef.current) return;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.id = id;
    path.setAttribute('d', dStr);
    path.setAttribute('fill', 'none');

    if (isFeedback) {
      path.setAttribute('stroke', '#ef4444');
      path.setAttribute('stroke-width', '4');
      path.setAttribute('stroke-dasharray', '8 4');
    } else {
      path.setAttribute('stroke', '#94a3b8');
      path.setAttribute('stroke-width', '6');
    }

    pathsGroupRef.current.appendChild(path);
    pathsConfigRef.current[id] = {
      el: path,
      length: path.getTotalLength()
    };
  }, []);

  const setupGraphSugar = useCallback(() => {
    if (!pathsGroupRef.current || !nodesGroupRef.current || !particlesGroupRef.current) return;

    pathsGroupRef.current.innerHTML = '';
    nodesGroupRef.current.innerHTML = '';
    particlesGroupRef.current.innerHTML = '';
    particlesRef.current = [];
    pathsConfigRef.current = {};

    drawNode('pancreas', 100, 100, 160, 60, 'PANKREAS', '(Kelenjar)', '#f8fafc');
    drawNode('blood', 320, 250, 160, 60, 'ALIRAN DARAH', '(Kadar Glukosa)', '#fecdd3');
    drawNode('liver', 540, 100, 160, 60, 'HATI (LIVER)', '(Target Organ)', '#f8fafc');

    drawPath('path_pancreas_blood', 'M 180 160 Q 180 280 320 280');
    drawPath('path_blood_liver', 'M 480 280 Q 620 280 620 160');
    drawPath('path_liver_blood', 'M 620 160 Q 620 250 480 250');
    drawPath('path_blood_pancreas', 'M 320 250 Q 180 250 180 160', true);
  }, [drawNode, drawPath]);

  const setupGraphThyroid = useCallback(() => {
    if (!pathsGroupRef.current || !nodesGroupRef.current || !particlesGroupRef.current) return;

    pathsGroupRef.current.innerHTML = '';
    nodesGroupRef.current.innerHTML = '';
    particlesGroupRef.current.innerHTML = '';
    particlesRef.current = [];
    pathsConfigRef.current = {};

    drawNode('hypo', 320, 30, 160, 60, 'HIPOTALAMUS', '(Otak)', '#f8fafc');
    drawNode('pituitary', 320, 150, 160, 60, 'PITUITARI', '(Kelenjar Master)', '#f8fafc');
    drawNode('thyroid', 320, 270, 160, 60, 'TIROID', '(Leher)', '#f8fafc');
    drawNode('body', 320, 390, 160, 60, 'SEL TUBUH', '(Metabolisme)', '#fecdd3');

    drawPath('path_hypo_pit', 'M 400 90 L 400 145');
    drawPath('path_pit_thyroid', 'M 400 210 L 400 265');
    drawPath('path_thyroid_body', 'M 400 330 L 400 385');
    drawPath('path_feedback_hypo', 'M 480 420 Q 600 420 600 220 Q 600 60 480 60', true);
    drawPath('path_feedback_pit', 'M 600 220 Q 600 180 480 180', true);
  }, [drawNode, drawPath]);

  const spawnParticle = useCallback((pathId: string, color: string, shape: 'circle' | 'rect' = 'circle') => {
    if (!particlesGroupRef.current || !pathsConfigRef.current[pathId]) return;

    const el = document.createElementNS('http://www.w3.org/2000/svg', shape);

    if (shape === 'rect') {
      el.setAttribute('width', '8');
      el.setAttribute('height', '8');
      el.setAttribute('x', '-4');
      el.setAttribute('y', '-4');
    } else {
      el.setAttribute('r', '5');
    }

    el.setAttribute('fill', color);
    el.setAttribute('stroke', '#000');
    el.setAttribute('stroke-width', '1.5');
    particlesGroupRef.current.appendChild(el);

    particlesRef.current.push({
      el,
      pathId,
      progress: 0,
      speed: 0.4 + Math.random() * 0.2
    });
  }, []);

  const updateSugarSystem = useCallback((dt: number) => {
    let newGlucose = glucoseRef.current - 2 * dt;
    let newInsulin = insulinRef.current;
    let newGlucagon = glucagonRef.current;

    const pancreasRect = document.getElementById('rect_pancreas');

    if (glucoseRef.current > 100) {
      newInsulin += (glucoseRef.current - 100) * 0.2 * dt;
      if (Math.random() < 0.2) spawnParticle('path_pancreas_blood', '#3b82f6', 'rect');
      pancreasRect?.classList.add('node-glow-insulin');
      pancreasRect?.classList.remove('node-glow-glucagon');
      setActiveHormone('Insulin (Menyimpan Gula)');
      setStatusText('PANKREAS MERESPON: MELEPAS INSULIN');
    } else if (glucoseRef.current < 80) {
      newGlucagon += (80 - glucoseRef.current) * 0.2 * dt;
      if (Math.random() < 0.2) spawnParticle('path_pancreas_blood', '#f97316', 'rect');
      pancreasRect?.classList.add('node-glow-glucagon');
      pancreasRect?.classList.remove('node-glow-insulin');
      setActiveHormone('Glukagon (Memecah Cadangan)');
      setStatusText('PANKREAS MERESPON: MELEPAS GLUKAGON');
    } else {
      pancreasRect?.classList.remove('node-glow-insulin', 'node-glow-glucagon');
      setActiveHormone('Seimbang');
      setStatusText('HOMEOSTASIS (SEIMBANG)');
    }

    if (newInsulin > 0 && Math.random() < 0.1) spawnParticle('path_blood_liver', '#3b82f6', 'rect');
    if (newGlucagon > 0 && Math.random() < 0.1) spawnParticle('path_blood_liver', '#f97316', 'rect');

    if (newInsulin > 1) {
      newGlucose -= newInsulin * 0.1 * dt;
      newInsulin -= 10 * dt;
      if (Math.random() < 0.1) spawnParticle('path_blood_pancreas', '#22c55e');
    }
    if (newGlucagon > 1) {
      newGlucose += newGlucagon * 0.1 * dt;
      newGlucagon -= 10 * dt;
      if (Math.random() < 0.3) spawnParticle('path_liver_blood', '#22c55e');
    }

    if (Math.random() < 0.05) spawnParticle('path_blood_pancreas', '#22c55e');

    newGlucose = Math.max(40, Math.min(200, newGlucose));
    newInsulin = Math.max(0, newInsulin);
    newGlucagon = Math.max(0, newGlucagon);

    setGlucose(newGlucose);
    setInsulin(newInsulin);
    setGlucagon(newGlucagon);
  }, [spawnParticle]);

  const updateThyroidSystem = useCallback((dt: number) => {
    let newBodyTemp = bodyTempRef.current - 0.05 * dt;
    let newTrh = trhRef.current;
    let newTsh = tshRef.current;
    let newT4 = t4Ref.current;

    const hypoRect = document.getElementById('rect_hypo');
    const pitRect = document.getElementById('rect_pituitary');
    const thyroidRect = document.getElementById('rect_thyroid');

    if (bodyTempRef.current < 37.0 && t4Ref.current < 40) {
      newTrh += 15 * dt;
      if (Math.random() < 0.2) spawnParticle('path_hypo_pit', '#a855f7');
      hypoRect?.classList.add('node-glow-thyroid');
    } else {
      hypoRect?.classList.remove('node-glow-thyroid');
    }

    if (newTrh > 10 && t4Ref.current < 40) {
      newTsh += 15 * dt;
      if (Math.random() < 0.2) spawnParticle('path_pit_thyroid', '#0ea5e9');
      pitRect?.classList.add('node-glow-thyroid');
    } else {
      pitRect?.classList.remove('node-glow-thyroid');
    }

    if (newTsh > 10) {
      newT4 += 20 * dt;
      if (Math.random() < 0.3) spawnParticle('path_thyroid_body', '#facc15');
      thyroidRect?.classList.add('node-glow-thyroid');
    } else {
      thyroidRect?.classList.remove('node-glow-thyroid');
    }

    if (newT4 > 10) {
      newBodyTemp += newT4 * 0.005 * dt;
    }

    if (newT4 > 40) {
      if (Math.random() < 0.2) spawnParticle('path_feedback_hypo', '#ef4444', 'rect');
      if (Math.random() < 0.2) spawnParticle('path_feedback_pit', '#ef4444', 'rect');
      hypoRect?.classList.add('node-glow-inhibit');
      pitRect?.classList.add('node-glow-inhibit');
      setStatusText('UMPAN BALIK NEGATIF AKTIF (MENCEGAH OVERHEAT)');
    } else {
      hypoRect?.classList.remove('node-glow-inhibit');
      pitRect?.classList.remove('node-glow-inhibit');
      if (newBodyTemp < 36.5) {
        setStatusText('KEDINGINAN: KASKADE HORMON DIMULAI');
      } else {
        setStatusText('HOMEOSTASIS (NORMAL)');
      }
    }

    newTrh = Math.max(0, newTrh - 5 * dt);
    newTsh = Math.max(0, newTsh - 5 * dt);
    newT4 = Math.max(0, newT4 - 5 * dt);
    newBodyTemp = Math.max(35.0, Math.min(39.0, newBodyTemp));

    setTrh(newTrh);
    setTsh(newTsh);
    setT4(newT4);
    setBodyTemp(newBodyTemp);
  }, [spawnParticle]);

  const drawFrame = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    if (isPlaying) {
      if (currentMode === 'SUGAR') {
        updateSugarSystem(dt);
      } else {
        updateThyroidSystem(dt);
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.progress += p.speed * dt;

        if (p.progress >= 1) {
          p.el.remove();
          particlesRef.current.splice(i, 1);
          continue;
        }

        const pathConfig = pathsConfigRef.current[p.pathId];
        if (pathConfig) {
          const point = pathConfig.el.getPointAtLength(p.progress * pathConfig.length);
          p.el.setAttribute('transform', `translate(${point.x}, ${point.y})`);
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(drawFrame);
  }, [isPlaying, currentMode, updateSugarSystem, updateThyroidSystem]);

  useEffect(() => {
    if (currentMode === 'SUGAR') {
      setupGraphSugar();
    } else {
      setupGraphThyroid();
    }
  }, [currentMode, setupGraphSugar, setupGraphThyroid]);

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [drawFrame]);

  const handleModeChange = (mode: 'SUGAR' | 'THYROID') => {
    setCurrentMode(mode);
    particlesRef.current.forEach(p => p.el.remove());
    particlesRef.current = [];

    if (mode === 'SUGAR') {
      setGlucose(90);
      setInsulin(0);
      setGlucagon(0);
    } else {
      setBodyTemp(37.0);
      setTrh(0);
      setTsh(0);
      setT4(0);
    }
  };

  const handleMakan = () => setGlucose(prev => Math.min(200, prev + 60));
  const handleOlahraga = () => setGlucose(prev => Math.max(40, prev - 40));
  const handleDingin = () => setBodyTemp(prev => Math.max(35, prev - 1.0));

  const getGlucoseColor = () => {
    if (glucose > 120) return 'text-rose-400';
    if (glucose < 70) return 'text-orange-400';
    return 'text-emerald-400';
  };

  const getTempColor = () => {
    if (bodyTemp < 36.5) return 'text-sky-400';
    if (bodyTemp > 37.5) return 'text-rose-400';
    return 'text-emerald-400';
  };

  const getT4Status = () => {
    if (t4 > 40) return 'TINGGI';
    if (t4 > 10) return 'CUKUP';
    return 'RENDAH';
  };

  const getStatusColor = () => {
    if (statusText.includes('INSULIN')) return 'text-blue-400';
    if (statusText.includes('GLUKAGON')) return 'text-orange-400';
    if (statusText.includes('NEGATIF')) return 'text-rose-500';
    if (statusText.includes('KEDINGINAN')) return 'text-sky-400';
    return 'text-emerald-400';
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">BIOLOGI & FISIOLOGI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: SISTEM ENDOKRIN
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Kelenjar, Regulasi Hormon, dan Umpan Balik Negatif (Feedback Loop)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#818cf8] text-md transform rotate-2 z-30 uppercase">
            Panel Stimulus
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Mekanisme Regulasi</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleModeChange('SUGAR')}
                  className={`neo-btn py-3 px-2 text-xs font-bold flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${currentMode === 'SUGAR' ? 'bg-emerald-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                >
                  <span>🩸 GULA DARAH</span>
                  <span className="text-[9px] bg-white px-1 border border-black">Pankreas</span>
                </button>
                <button
                  onClick={() => handleModeChange('THYROID')}
                  className={`neo-btn py-3 px-2 text-xs font-bold flex justify-between items-center border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${currentMode === 'THYROID' ? 'bg-emerald-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}
                >
                  <span>🌡️ METABOLISME</span>
                  <span className="text-[9px] bg-white px-1 border border-black">Kelenjar Tiroid</span>
                </button>
              </div>
            </div>

            {currentMode === 'SUGAR' && (
              <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Aksi Eksternal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleMakan}
                    className="neo-btn bg-rose-300 hover:bg-rose-200 text-black py-3 text-xs flex flex-col items-center justify-center gap-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    <span className="text-xl">🍔</span>
                    <span>Makan (Glukosa Naik)</span>
                  </button>
                  <button
                    onClick={handleOlahraga}
                    className="neo-btn bg-sky-300 hover:bg-sky-200 text-black py-3 text-xs flex flex-col items-center justify-center gap-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    <span className="text-xl">🏃‍♂️</span>
                    <span>Olahraga (Glukosa Turun)</span>
                  </button>
                </div>
              </div>
            )}

            {currentMode === 'THYROID' && (
              <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Aksi Eksternal</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={handleDingin}
                    className="neo-btn bg-sky-200 hover:bg-sky-100 text-black py-3 text-xs flex justify-between items-center px-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    <span>❄️ Paparan Suhu Dingin (Suhu Turun)</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="neo-btn py-3 text-sm flex-1 flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                style={{ backgroundColor: isPlaying ? '#facc15' : '#34d399' }}
              >
                {isPlaying ? '⏸️ JEDA SISTEM' : '▶️ LANJUTKAN'}
              </button>
              <button
                onClick={() => handleModeChange(currentMode)}
                className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-4 text-xs border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔄 RESET
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
            <h4 className="font-black text-indigo-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">TELEMETRI HOMEOSTASIS</h4>
            
            {currentMode === 'SUGAR' && (
              <div className="grid grid-cols-2 gap-2 text-center mb-2">
                <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Glukosa Darah</span>
                  <div className="flex items-end justify-center gap-1">
                    <span className={`text-2xl font-black font-mono ${getGlucoseColor()}`}>{Math.floor(glucose)}</span>
                    <span className="text-[9px] text-slate-400 mb-1">mg/dL</span>
                  </div>
                </div>
                <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Hormon Aktif</span>
                  <span className={`text-sm font-black ${activeHormone === 'Seimbang' ? 'text-emerald-400' : activeHormone.includes('Insulin') ? 'text-blue-400' : 'text-orange-400'}`}>{activeHormone}</span>
                </div>
              </div>
            )}

            {currentMode === 'THYROID' && (
              <div className="grid grid-cols-2 gap-2 text-center mb-2">
                <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Suhu Tubuh</span>
                  <div className="flex items-end justify-center gap-1">
                    <span className={`text-2xl font-black font-mono ${getTempColor()}`}>{bodyTemp.toFixed(1)}</span>
                    <span className="text-[9px] text-slate-400 mb-1">°C</span>
                  </div>
                </div>
                <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Hormon Tiroksin (T4)</span>
                  <span className="text-lg font-black text-purple-400 font-mono">{getT4Status()}</span>
                </div>
              </div>
            )}

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex flex-col items-center rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Feedback Loop</span>
              <span className={`text-xs font-black uppercase tracking-widest text-center ${getStatusColor()}`}>{statusText}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col items-center w-full h-[600px] border-8 border-black overflow-hidden bg-slate-50 rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              {currentMode === 'SUGAR' ? 'Diagram Rantai: Regulasi Gula Darah' : 'Diagram Rantai: Regulasi Kelenjar Tiroid'}
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
              {currentMode === 'SUGAR' ? (
                <>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full border border-black"></div> Glukosa (Gula)</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm border border-black"></div> Insulin (Menurunkan Gula)</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded-sm border border-black"></div> Glukagon (Menaikkan Gula)</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-1 border-t-2 border-red-500 border-dashed"></div> Sinyal Umpan Balik</div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-full border border-black"></div> TRH (Hormon Pemicu)</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-500 rounded-full border border-black"></div> TSH (Hormon Stimulasi)</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-full border border-black"></div> T4 (Tiroksin)</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm border border-black"></div> Sinyal Inhibisi (Stop)</div>
                </>
              )}
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
              <svg ref={svgRef} viewBox="0 0 800 500" className="w-full h-full overflow-visible">
                <defs>
                  <style>
                    {`
                      .node-glow-insulin { filter: drop-shadow(0 0 10px #3b82f6); }
                      .node-glow-glucagon { filter: drop-shadow(0 0 10px #f97316); }
                      .node-glow-thyroid { filter: drop-shadow(0 0 10px #a855f7); }
                      .node-glow-inhibit { filter: drop-shadow(0 0 15px #ef4444); }
                    `}
                  </style>
                </defs>
                <g id="pathsGroup" ref={pathsGroupRef}></g>
                <g id="nodesGroup" ref={nodesGroupRef}></g>
                <g id="particlesGroup" ref={particlesGroupRef}></g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-indigo-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Sistem Komunikasi Tubuh 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-slate-800 border-b-2 border-black pb-1 mb-2">1. Apa itu Hormon?</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Berbeda dengan sistem saraf yang menggunakan sinyal listrik kilat, sistem endokrin menggunakan <b>Hormon (pembawa pesan kimiawi)</b> yang dilepaskan ke dalam aliran darah. Hormon mengalir ke seluruh tubuh tetapi hanya bereaksi pada organ target yang memiliki "reseptor" yang cocok (seperti gembok dan kunci).
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-indigo-600 border-b-2 border-black pb-1 mb-2">2. Kaskade (Reaksi Berantai)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Seringkali, kelenjar tidak bekerja sendiri. Otak (Hipotalamus) bertindak sebagai CEO yang mengirimkan hormon perintah (TRH) ke Manajer (Pituitari), yang kemudian mengirimkan hormon perintah lain (TSH) ke Pabrik (Kelenjar Tiroid) untuk memproduksi produk akhir (Tiroksin).
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">3. Umpan Balik Negatif</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              <b>(Negative Feedback Loop)</b> adalah cara tubuh mencegah produksi hormon berlebihan. Ketika kadar hormon akhir (misal: Tiroksin) atau hasil kerjanya (Suhu/Gula Darah) sudah cukup tinggi di dalam darah, ia akan mengirim sinyal "Berhenti!" kembali ke kelenjar pusat agar produksi dihentikan. Ini menjaga keseimbangan <b>(Homeostasis)</b>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}