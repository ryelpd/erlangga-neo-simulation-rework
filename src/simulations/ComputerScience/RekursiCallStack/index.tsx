import { useState, useEffect, useRef } from 'react';

interface NodeData {
  id: string;
  text: string;
  parentId: string | null;
  children: string[];
  depth: number;
  status: 'WAITING' | 'CALLING' | 'RETURNED';
  value: number | null;
  x: number;
  y: number;
}

interface TraceAction {
  type: 'CALL' | 'RETURN';
  id: string;
  n?: number;
  value?: number;
}

const MAX_N = 5;

export default function RekursiCallStack() {
  const [currentMode, setCurrentMode] = useState<'FACT' | 'FIB'>('FACT');
  const [inputN, setInputN] = useState(4);
  const [trace, setTrace] = useState<TraceAction[]>([]);
  const [nodesData, setNodesData] = useState<Record<string, NodeData>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [maxDepth, setMaxDepth] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  const edgesGroupRef = useRef<SVGGElement>(null);
  const nodesGroupRef = useRef<SVGGElement>(null);
  const returnsGroupRef = useRef<SVGGElement>(null);
  const playIntervalRef = useRef<number | null>(null);

  const prepareSimulation = () => {
    if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    setIsPlaying(false);
    setResult(null);

    const newNodes: Record<string, NodeData> = {};
    const newTrace: TraceAction[] = [];
    let nextId = 1;
    let depthTracker = 0;

    const traceFact = (n: number, parentId: string | null, depth: number): number => {
      const id = `n${nextId++}`;
      if (depth > depthTracker) depthTracker = depth;
      
      newNodes[id] = { 
        id, text: `fact(${n})`, parentId, children: [], depth, status: 'WAITING', value: null, x: 0, y: 0 
      };
      if (parentId) newNodes[parentId].children.push(id);
      newTrace.push({ type: 'CALL', id, n });

      let res;
      if (n <= 1) res = 1;
      else res = n * traceFact(n - 1, id, depth + 1);

      newNodes[id].value = res;
      newTrace.push({ type: 'RETURN', id, value: res });
      return res;
    };

    const traceFib = (n: number, parentId: string | null, depth: number): number => {
      const id = `n${nextId++}`;
      if (depth > depthTracker) depthTracker = depth;

      newNodes[id] = { 
        id, text: `fib(${n})`, parentId, children: [], depth, status: 'WAITING', value: null, x: 0, y: 0 
      };
      if (parentId) newNodes[parentId].children.push(id);
      newTrace.push({ type: 'CALL', id, n });

      let res;
      if (n <= 1) res = n;
      else {
        const left = traceFib(n - 1, id, depth + 1);
        const right = traceFib(n - 2, id, depth + 1);
        res = left + right;
      }

      newNodes[id].value = res;
      newTrace.push({ type: 'RETURN', id, value: res });
      return res;
    };

    if (currentMode === 'FACT') traceFact(inputN, null, 1);
    else traceFib(inputN, null, 1);

    // Layout Calculation
    const layoutNodes = () => {
      const rootId = Object.keys(newNodes).find(id => !newNodes[id].parentId);
      if (!rootId) return;

      const startY = 40;
      const ySpacing = 80;

      if (currentMode === 'FACT') {
        let currentId: string | undefined = rootId;
        let y = startY;
        while (currentId) {
          newNodes[currentId].x = 400;
          newNodes[currentId].y = y;
          y += ySpacing;
          currentId = newNodes[currentId].children[0];
        }
      } else {
        const layoutNode = (nodeId: string, x: number, y: number, hOffset: number) => {
          newNodes[nodeId].x = x;
          newNodes[nodeId].y = y;
          const children = newNodes[nodeId].children;
          if (children.length === 1) {
            layoutNode(children[0], x, y + ySpacing, hOffset);
          } else if (children.length === 2) {
            layoutNode(children[0], x - hOffset, y + ySpacing, hOffset / 1.8);
            layoutNode(children[1], x + hOffset, y + ySpacing, hOffset / 1.8);
          }
        };
        layoutNode(rootId, 400, startY, 200);
      }
    };

    layoutNodes();
    setNodesData(newNodes);
    setTrace(newTrace);
    setCurrentStep(0);
    setMaxDepth(depthTracker);
    setResult(null);

    // Clear SVG
    if (edgesGroupRef.current) edgesGroupRef.current.innerHTML = '';
    if (nodesGroupRef.current) nodesGroupRef.current.innerHTML = '';
    if (returnsGroupRef.current) returnsGroupRef.current.innerHTML = '';
  };

  useEffect(() => {
    prepareSimulation();
  }, [currentMode, inputN]);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(executeStep, 800);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => { if (playIntervalRef.current) clearInterval(playIntervalRef.current); };
  }, [isPlaying, currentStep, nodesData]);

  const executeStep = () => {
    if (currentStep >= trace.length) {
      setIsPlaying(false);
      const rootId = trace[0].id;
      setResult(nodesData[rootId].value);
      return;
    }

    const action = trace[currentStep];
    const node = nodesData[action.id];

    if (!nodesGroupRef.current || !edgesGroupRef.current || !returnsGroupRef.current) return;

    if (action.type === 'CALL') {
      if (node.parentId) {
        const parent = nodesData[node.parentId];
        setNodesData(prev => ({
          ...prev,
          [node.parentId!]: { ...parent, status: 'WAITING' }
        }));
        drawEdge(node.parentId, action.id);
      }
      drawNode(action.id);
    } else {
      setNodesData(prev => ({
        ...prev,
        [action.id]: { ...node, status: 'RETURNED' }
      }));
      drawReturnFloat(action.id);
      if (node.parentId) {
        const parentNode = nodesData[node.parentId];
        const pid = node.parentId;
        setNodesData(prev => ({
          ...prev,
          [pid]: { ...parentNode, status: 'CALLING' }
        }));
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const drawEdge = (fromId: string, toId: string) => {
    const from = nodesData[fromId];
    const to = nodesData[toId];
    if (!from || !to || !edgesGroupRef.current) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(from.x));
    line.setAttribute("y1", String(from.y + 15));
    line.setAttribute("x2", String(to.x));
    line.setAttribute("y2", String(to.y - 15));
    line.setAttribute("stroke", "#1e293b");
    line.setAttribute("stroke-width", "3");
    edgesGroupRef.current.appendChild(line);
  };

  const drawNode = (id: string) => {
    const node = nodesData[id];
    if (!node || !nodesGroupRef.current) return;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
    g.classList.add("node-enter");
    g.id = `g-${id}`;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "-35");
    rect.setAttribute("y", "-15");
    rect.setAttribute("width", "70");
    rect.setAttribute("height", "30");
    rect.setAttribute("rx", "6");
    rect.setAttribute("fill", "#fde047");
    rect.setAttribute("stroke", "#000");
    rect.setAttribute("stroke-width", "3");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "0");
    text.setAttribute("y", "5");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-weight", "900");
    text.setAttribute("font-size", "14");
    text.setAttribute("fill", "#000");
    text.textContent = node.text;

    g.appendChild(rect);
    g.appendChild(text);
    nodesGroupRef.current.appendChild(g);

    setNodesData(prev => ({
      ...prev,
      [id]: { ...node, status: 'CALLING' }
    }));
  };

  const drawReturnFloat = (id: string) => {
    const node = nodesData[id];
    if (!node || !node.parentId || !returnsGroupRef.current) return;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${node.x}, ${node.y - 20})`);
    g.classList.add("value-float");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "-15");
    rect.setAttribute("y", "-10");
    rect.setAttribute("width", "30");
    rect.setAttribute("height", "20");
    rect.setAttribute("rx", "4");
    rect.setAttribute("fill", "#fff");
    rect.setAttribute("stroke", "#000");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "0");
    text.setAttribute("y", "4");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-weight", "900");
    text.setAttribute("font-size", "12");
    text.textContent = String(node.value);

    g.appendChild(rect);
    g.appendChild(text);
    returnsGroupRef.current.appendChild(g);

    setTimeout(() => g.remove(), 800);
  };

  const handleModeChange = (mode: 'FACT' | 'FIB') => {
    setCurrentMode(mode);
  };

  const handlePlay = () => {
    if (currentStep >= trace.length) prepareSimulation();
    setIsPlaying(!isPlaying);
  };

  const getCurrentActionText = () => {
    if (currentStep >= trace.length) return "Eksekusi Selesai!";
    const action = trace[currentStep];
    const node = nodesData[action.id];
    if (!node) return "";
    if (action.type === 'CALL') return `Mengeksekusi ${node.text}`;
    return `Mengembalikan ${action.value} dari ${node.text}`;
  };

  const getStatusClass = () => {
    if (currentStep >= trace.length) return "text-emerald-400";
    const action = trace[currentStep];
    if (!action) return "text-yellow-300";
    return action.type === 'CALL' ? "text-yellow-300" : "text-emerald-400";
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center font-sans">
      <style>{`
        body { font-family: 'Space Grotesk', sans-serif; background-color: #fdfbf7; background-image: radial-gradient(#000000 1.5px, transparent 1.5px); background-size: 24px 24px; }
        .neo-box { background-color: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0px 0px #000000; border-radius: 12px; }
        .neo-btn { border: 4px solid #000000; box-shadow: 4px 4px 0px 0px #000000; border-radius: 8px; transition: all 0.1s ease-in-out; font-weight: bold; cursor: pointer; text-transform: uppercase; }
        .neo-btn:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0px 0px #000000; }
        .neo-btn:disabled { background-color: #e2e8f0 !important; color: #94a3b8 !important; cursor: not-allowed; transform: translate(4px, 4px); box-shadow: 0px 0px 0px 0px #000000; }
        .neo-input { border: 4px solid #000; box-shadow: 4px 4px 0px 0px #000; font-family: 'Space Grotesk', sans-serif; font-weight: bold; }
        .bg-pattern-dot { background-color: #f8fafc; background-image: radial-gradient(#cbd5e1 2px, transparent 2px); background-size: 20px 20px; }
        .node-enter { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .value-float { animation: floatUp 0.8s ease-in forwards; }
        @keyframes floatUp { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-40px) scale(1.2); opacity: 0; } }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-fuchsia-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 text-black">ILMU KOMPUTER</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: REKURSI & CALL TREE</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Visualisasi Eksekusi Fungsi yang Memanggil Dirinya Sendiri</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#e879f9] text-md transform rotate-2 z-30 uppercase">Parameter Fungsi</span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Algoritma Rekursif</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleModeChange('FACT')} className={`mode-btn neo-btn py-2 px-2 text-xs font-bold w-full ${currentMode === 'FACT' ? 'bg-fuchsia-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}>❗️ FAKTORIAL</button>
                <button onClick={() => handleModeChange('FIB')} className={`mode-btn neo-btn py-2 px-2 text-xs font-bold w-full ${currentMode === 'FIB' ? 'bg-fuchsia-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}>🐚 FIBONACCI</button>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Nilai Input (N)</label>
              <input 
                type="number" 
                value={inputN} 
                onChange={(e) => setInputN(Math.min(MAX_N, Math.max(1, parseInt(e.target.value) || 1)))}
                className="neo-input px-3 py-2 w-full text-center text-xl" 
                min="1" 
                max={MAX_N}
              />
              <span className="text-[9px] font-bold text-rose-500 mt-1">*Maksimal N={MAX_N} agar pohon tidak meledak.</span>
            </div>

            <div className="grid grid-cols-1 gap-2 border-t-4 border-black pt-4">
              <button onClick={handlePlay} className={`neo-btn py-4 text-sm flex items-center justify-center gap-2 ${isPlaying ? 'bg-rose-400 hover:bg-rose-300' : (currentStep >= trace.length ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-emerald-400 hover:bg-emerald-300')}`}>
                {currentStep >= trace.length ? "✅ SELESAI" : (isPlaying ? "⏸️ JEDA (PAUSE)" : "▶️ MULAI SIMULASI")}
              </button>
              <div className="flex gap-2">
                <button onClick={() => { if (!isPlaying) executeStep(); }} disabled={isPlaying || currentStep >= trace.length} className="neo-btn bg-yellow-300 hover:bg-yellow-200 py-2 text-xs flex-1 flex justify-center items-center">⏭️ LANGKAH (STEP)</button>
                <button onClick={prepareSimulation} className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-2 text-xs flex-1">🔄 RESET</button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-fuchsia-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">CALL STACK TRACE</h4>
            
            <div className="bg-slate-800 p-3 border-2 border-slate-600 rounded flex flex-col justify-center items-center text-center mb-2 min-h-[60px]">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Aksi Saat Ini</span>
              <span className={`text-sm font-black leading-tight ${getStatusClass()}`}>{getCurrentActionText()}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Kedalaman Maks</span>
                <div className="text-xl font-black text-white">{maxDepth}</div>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Hasil Akhir</span>
                <div className="text-xl font-black text-emerald-400">{result !== null ? result : '?'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-pattern-dot p-0 relative flex flex-col items-center w-full h-[600px] border-8 border-black overflow-hidden">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">Visualisasi: Pohon Eksekusi</span>

            <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-300 border-2 border-black"></div> Memanggil / Menghitung</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 border-2 border-black"></div> Menunggu Anak (Child)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-400 border-2 border-black"></div> Selesai & Mengembalikan Nilai</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center p-4 pt-12 overflow-auto">
              <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
                <g ref={edgesGroupRef}></g>
                <g ref={nodesGroupRef}></g>
                <g ref={returnsGroupRef}></g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-100 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">Buku Panduan: Anatomi Rekursi 📖</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-xl uppercase text-fuchsia-600 border-b-2 border-black pb-1 mb-2">❗️ FAKTORIAL N!</h4>
            <pre className="bg-slate-900 text-green-400 p-3 font-mono text-xs font-bold border-2 border-black mb-3 overflow-x-auto">
function fact(n) {'{'}
  if (n === 1) return 1; 
  return n * fact(n - 1); 
{'}'}
            </pre>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Faktorial menggunakan pola rekursi linear. Ia menumpuk pemanggilan fungsi hingga mencapai dasar, kemudian mengalikan hasilnya saat berjalan mundur.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-xl uppercase text-slate-600 border-b-2 border-black pb-1 mb-2">🐚 FIBONACCI</h4>
            <pre className="bg-slate-900 text-sky-400 p-3 font-mono text-xs font-bold border-2 border-black mb-3 overflow-x-auto">
function fib(n) {'{'}
  if (n {'<='} 1) return n; 
  return fib(n-1) + fib(n-2); 
{'}'}
            </pre>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Fibonacci menggunakan rekursi bercabang (Tree Recursion). Setiap fungsi memanggil dua fungsi baru. Pertumbuhan eksponensial (O(2^N)).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
