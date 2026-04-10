import { useRef, useEffect, useCallback } from 'react';

type SortMode = 'BUBBLE' | 'SELECTION' | 'INSERTION';
type BarState = 0 | 1 | 2 | 3 | 4;

const BASE_Y = 440;

export default function AlgoritmaSorting() {
  const stateRef = useRef({
    currentMode: 'BUBBLE' as SortMode,
    arraySize: 15,
    animationSpeed: 50,
    array: [] as number[],
    barStates: [] as BarState[],
    comparisons: 0,
    swaps: 0,
    isPlaying: false,
    isSorted: false,
    sortGenerator: null as Generator<string, void, unknown> | null,
    lastFrameTime: 0,
    animationId: 0,
  });

  const btnBubbleRef = useRef<HTMLButtonElement>(null);
  const btnSelectionRef = useRef<HTMLButtonElement>(null);
  const btnInsertionRef = useRef<HTMLButtonElement>(null);

  const sliderSizeRef = useRef<HTMLInputElement>(null);
  const sliderSpeedRef = useRef<HTMLInputElement>(null);
  const valSizeRef = useRef<HTMLSpanElement>(null);
  const valSpeedRef = useRef<HTMLSpanElement>(null);

  const btnPlayRef = useRef<HTMLButtonElement>(null);
  const btnStepRef = useRef<HTMLButtonElement>(null);
  const btnShuffleRef = useRef<HTMLButtonElement>(null);

  const dataCompsRef = useRef<HTMLSpanElement>(null);
  const dataSwapsRef = useRef<HTMLSpanElement>(null);
  const dataStatusRef = useRef<HTMLSpanElement>(null);

  const barsGroupRef = useRef<SVGGElement>(null);

  const updateTelemetry = useCallback(() => {
    const state = stateRef.current;
    if (dataCompsRef.current) dataCompsRef.current.textContent = String(state.comparisons);
    if (dataSwapsRef.current) dataSwapsRef.current.textContent = String(state.swaps);
  }, []);

  const updatePlayButtonUI = useCallback(() => {
    const state = stateRef.current;
    if (!btnPlayRef.current || !btnStepRef.current) return;

    if (state.isSorted) {
      btnPlayRef.current.innerHTML = 'SELESAI';
      btnPlayRef.current.className = 'border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-300 text-slate-600 py-3 text-sm flex-1 flex items-center justify-center gap-2 font-bold uppercase transition-all';
      btnPlayRef.current.disabled = true;
      btnStepRef.current.disabled = true;
    } else if (state.isPlaying) {
      btnPlayRef.current.innerHTML = 'JEDA SORTING';
      btnPlayRef.current.className = 'border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-yellow-400 hover:bg-yellow-300 py-3 text-sm flex-1 flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none';
      btnPlayRef.current.disabled = false;
      btnStepRef.current.disabled = true;
    } else {
      btnPlayRef.current.innerHTML = 'MULAI SORTING';
      btnPlayRef.current.className = 'border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-emerald-400 hover:bg-emerald-300 py-3 text-sm flex-1 flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none';
      btnPlayRef.current.disabled = false;
      btnStepRef.current.disabled = false;
    }
  }, []);

  const drawArray = useCallback(() => {
    const state = stateRef.current;
    if (!barsGroupRef.current) return;

    while (barsGroupRef.current.firstChild) {
      barsGroupRef.current.removeChild(barsGroupRef.current.firstChild);
    }

    const totalWidth = 760;
    const marginX = 20;
    const barSpacing = totalWidth / state.arraySize;
    const barWidth = Math.max(2, barSpacing * 0.8);

    const maxVal = Math.max(...state.array, 1);
    const heightScale = 380 / maxVal;

    for (let i = 0; i < state.arraySize; i++) {
      const val = state.array[i];
      const barState = state.barStates[i];

      const px = marginX + (i * barSpacing) + (barSpacing / 2) - (barWidth / 2);
      const pHeight = val * heightScale;
      const py = BASE_Y - pHeight;

      let fillColor = '#cbd5e1';
      let strokeColor = '#475569';

      if (barState === 1) {
        fillColor = '#fb7185';
        strokeColor = '#e11d48';
      } else if (barState === 2) {
        fillColor = '#38bdf8';
        strokeColor = '#0284c7';
      } else if (barState === 3) {
        fillColor = '#34d399';
        strokeColor = '#047857';
      } else if (barState === 4) {
        fillColor = '#facc15';
        strokeColor = '#a16207';
      }

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(px));
      rect.setAttribute('y', String(py));
      rect.setAttribute('width', String(barWidth));
      rect.setAttribute('height', String(pHeight));
      rect.setAttribute('fill', fillColor);
      rect.setAttribute('stroke', strokeColor);
      rect.setAttribute('stroke-width', state.arraySize > 30 ? '1' : '2');
      rect.style.transition = 'height 0.1s ease, y 0.1s ease, fill 0.1s ease';

      barsGroupRef.current.appendChild(rect);

      if (state.arraySize <= 25) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(px + barWidth / 2));
        text.setAttribute('y', String(py - 5));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-size', state.arraySize <= 15 ? '12' : '9');
        text.setAttribute('fill', barState === 3 ? '#047857' : '#0f172a');
        text.textContent = String(val);
        barsGroupRef.current.appendChild(text);
      }
    }
  }, []);

  const initArray = useCallback(() => {
    const state = stateRef.current;
    state.arraySize = sliderSizeRef.current ? parseInt(sliderSizeRef.current.value) : 15;
    if (valSizeRef.current) valSizeRef.current.textContent = state.arraySize + ' Balok';

    state.array = [];
    state.barStates = [];

    for (let i = 0; i < state.arraySize; i++) {
      state.array.push(Math.floor(Math.random() * 90) + 10);
      state.barStates.push(0);
    }

    state.comparisons = 0;
    state.swaps = 0;
    state.isSorted = false;
    state.sortGenerator = null;

    updateTelemetry();
    drawArray();
    updatePlayButtonUI();

    if (dataStatusRef.current) {
      dataStatusRef.current.textContent = 'SIAP (DATA ACAK)';
      dataStatusRef.current.className = 'text-xs font-black text-yellow-300 uppercase tracking-widest';
    }
  }, [updateTelemetry, drawArray, updatePlayButtonUI]);

  const resetColors = useCallback(() => {
    const state = stateRef.current;
    for (let i = 0; i < state.barStates.length; i++) {
      if (state.barStates[i] !== 3) state.barStates[i] = 0;
    }
  }, []);

  function* bubbleSortGen() {
    const state = stateRef.current;
    const n = state.array.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        resetColors();
        state.barStates[j] = 1;
        state.barStates[j + 1] = 1;
        state.comparisons++;
        yield 'compare';

        if (state.array[j] > state.array[j + 1]) {
          state.barStates[j] = 2;
          state.barStates[j + 1] = 2;

          const temp = state.array[j];
          state.array[j] = state.array[j + 1];
          state.array[j + 1] = temp;

          state.swaps++;
          yield 'swap';
        }
      }
      state.barStates[n - i - 1] = 3;
    }
    state.barStates[0] = 3;
    yield 'done';
  }

  function* selectionSortGen() {
    const state = stateRef.current;
    const n = state.array.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      state.barStates[minIdx] = 4;

      for (let j = i + 1; j < n; j++) {
        resetColors();
        state.barStates[minIdx] = 4;
        state.barStates[j] = 1;
        state.comparisons++;
        yield 'compare';

        if (state.array[j] < state.array[minIdx]) {
          state.barStates[minIdx] = 0;
          minIdx = j;
          state.barStates[minIdx] = 4;
          yield 'new_min';
        }
      }

      if (minIdx !== i) {
        resetColors();
        state.barStates[i] = 2;
        state.barStates[minIdx] = 2;

        const temp = state.array[i];
        state.array[i] = state.array[minIdx];
        state.array[minIdx] = temp;

        state.swaps++;
        yield 'swap';
      }
      resetColors();
      state.barStates[i] = 3;
    }
    state.barStates[n - 1] = 3;
    yield 'done';
  }

  function* insertionSortGen() {
    const state = stateRef.current;
    const n = state.array.length;
    state.barStates[0] = 3;

    for (let i = 1; i < n; i++) {
      const key = state.array[i];
      let j = i - 1;

      resetColors();
      state.barStates[i] = 2;
      yield 'select_key';

      state.comparisons++;
      state.barStates[j] = 1;
      yield 'compare';

      while (j >= 0 && state.array[j] > key) {
        state.array[j + 1] = state.array[j];
        state.swaps++;

        resetColors();
        state.barStates[j] = 2;
        state.barStates[j + 1] = 2;
        yield 'swap';

        j = j - 1;

        if (j >= 0) {
          state.comparisons++;
          resetColors();
          state.barStates[j] = 1;
          yield 'compare';
        }
      }

      state.array[j + 1] = key;

      for (let k = 0; k <= i; k++) state.barStates[k] = 3;
      yield 'inserted';
    }
    yield 'done';
  }

  const executeStep = useCallback((): boolean => {
    const state = stateRef.current;

    if (!state.sortGenerator) {
      if (state.currentMode === 'BUBBLE') state.sortGenerator = bubbleSortGen();
      else if (state.currentMode === 'SELECTION') state.sortGenerator = selectionSortGen();
      else if (state.currentMode === 'INSERTION') state.sortGenerator = insertionSortGen();

      if (dataStatusRef.current) {
        dataStatusRef.current.textContent = 'SEDANG MENGURUTKAN...';
        dataStatusRef.current.className = 'text-xs font-black text-sky-400 uppercase tracking-widest';
      }
    }

    const result = state.sortGenerator!.next();

    updateTelemetry();
    drawArray();

    if (result.done || result.value === 'done') {
      state.isSorted = true;
      state.isPlaying = false;
      for (let i = 0; i < state.array.length; i++) state.barStates[i] = 3;
      drawArray();
      updatePlayButtonUI();

      if (dataStatusRef.current) {
        dataStatusRef.current.textContent = 'PENGURUTAN SELESAI!';
        dataStatusRef.current.className = 'text-xs font-black text-emerald-400 uppercase tracking-widest';
      }
      return false;
    }
    return true;
  }, [updateTelemetry, drawArray, updatePlayButtonUI, resetColors]);

  const animate = useCallback((timestamp: number) => {
    const state = stateRef.current;
    if (!state.lastFrameTime) state.lastFrameTime = timestamp;
    const elapsed = timestamp - state.lastFrameTime;

    if (sliderSpeedRef.current) {
      state.animationSpeed = parseInt(sliderSpeedRef.current.value);
      let speedText = 'Sedang';
      if (state.animationSpeed < 30) speedText = 'Lambat';
      else if (state.animationSpeed > 70) speedText = 'Cepat';
      if (valSpeedRef.current) valSpeedRef.current.textContent = speedText;
    }

    const delay = 500 - (state.animationSpeed / 100) * 490;

    if (state.isPlaying && elapsed > delay) {
      state.lastFrameTime = timestamp;
      const continuePlaying = executeStep();
      if (!continuePlaying) state.isPlaying = false;
    }

    state.animationId = requestAnimationFrame(animate);
  }, [executeStep]);

  const setMode = useCallback((mode: SortMode) => {
    const state = stateRef.current;
    state.currentMode = mode;
    state.isPlaying = false;
    state.sortGenerator = null;

    if (btnBubbleRef.current && btnSelectionRef.current && btnInsertionRef.current) {
      const btns = [btnBubbleRef.current, btnSelectionRef.current, btnInsertionRef.current];
      btns.forEach(btn => {
        btn.classList.remove('ring-4', 'ring-black', 'bg-purple-400', 'text-white');
        btn.classList.add('bg-slate-200', 'text-slate-600');
      });

      const activeBtn = mode === 'BUBBLE' ? btnBubbleRef.current
        : mode === 'SELECTION' ? btnSelectionRef.current
        : btnInsertionRef.current;

      activeBtn.classList.add('ring-4', 'ring-black', 'bg-purple-400', 'text-white');
      activeBtn.classList.remove('bg-slate-200', 'text-slate-600');
    }

    initArray();
  }, [initArray]);

  const handlePlay = useCallback(() => {
    const state = stateRef.current;
    if (state.isSorted) return;
    state.isPlaying = !state.isPlaying;
    updatePlayButtonUI();
  }, [updatePlayButtonUI]);

  const handleStep = useCallback(() => {
    const state = stateRef.current;
    if (state.isPlaying) state.isPlaying = false;
    if (!state.isSorted) executeStep();
  }, [executeStep]);

  const handleShuffle = useCallback(() => {
    const state = stateRef.current;
    state.isPlaying = false;
    state.sortGenerator = null;
    initArray();
  }, [initArray]);

  const handleSizeChange = useCallback(() => {
    const state = stateRef.current;
    if (state.isPlaying) state.isPlaying = false;
    state.sortGenerator = null;
    initArray();
  }, [initArray]);

  useEffect(() => {
    initArray();
    stateRef.current.animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(stateRef.current.animationId);
  }, [initArray, animate]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-purple-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">ILMU KOMPUTER & PEMROGRAMAN</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: ALGORITMA SORTING</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Visualisasi Cara Mesin Mengurutkan Data (Bubble, Selection, Insertion)</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#a855f7] text-md rotate-2 z-30 uppercase">Panel Algoritma</span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Algoritma</label>
              <div className="grid grid-cols-1 gap-2">
                <button ref={btnBubbleRef} onClick={() => setMode('BUBBLE')} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-purple-400 text-white py-2 px-3 text-xs font-bold text-left flex justify-between items-center ring-4 ring-black uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  <span>BUBBLE SORT</span>
                  <span className="text-[9px] bg-white text-black px-1 border border-black">O(n)</span>
                </button>
                <button ref={btnSelectionRef} onClick={() => setMode('SELECTION')} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 text-slate-600 py-2 px-3 text-xs font-bold text-left flex justify-between items-center uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  <span>SELECTION SORT</span>
                  <span className="text-[9px] bg-white text-black px-1 border border-black">O(n)</span>
                </button>
                <button ref={btnInsertionRef} onClick={() => setMode('INSERTION')} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 text-slate-600 py-2 px-3 text-xs font-bold text-left flex justify-between items-center uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  <span>INSERTION SORT</span>
                  <span className="text-[9px] bg-white text-black px-1 border border-black">O(n)</span>
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-yellow-800 uppercase text-[10px]">Ukuran Data (N)</span>
                <span ref={valSizeRef} className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-yellow-600">15 Balok</span>
              </div>
              <input ref={sliderSizeRef} type="range" min="5" max="50" step="1" defaultValue="15" onChange={handleSizeChange} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-800 uppercase text-[10px]">Kecepatan Animasi</span>
                <span ref={valSpeedRef} className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-600">Sedang</span>
              </div>
              <input ref={sliderSpeedRef} type="range" min="1" max="100" step="1" defaultValue="50" className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-black pt-4">
              <div className="flex gap-2">
                <button ref={btnPlayRef} onClick={handlePlay} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-emerald-400 hover:bg-emerald-300 py-3 text-sm flex-1 flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">MULAI SORTING</button>
                <button ref={btnStepRef} onClick={handleStep} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-amber-300 hover:bg-amber-200 py-3 px-4 text-xs font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" title="Langkah Manual">STEP</button>
              </div>
              <button ref={btnShuffleRef} onClick={handleShuffle} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 text-sm w-full flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">ACAK DATA (SHUFFLE)</button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-purple-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">METRIK KINERJA (PERFORMANCE)</h4>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Perbandingan (IF)</span>
                <span ref={dataCompsRef} className="text-2xl font-black text-rose-400 font-mono">0</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Pertukaran (SWAP)</span>
                <span ref={dataSwapsRef} className="text-2xl font-black text-sky-400 font-mono">0</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase text-slate-400">Status Operasi:</span>
              <span ref={dataStatusRef} className="text-xs font-black text-yellow-300 uppercase tracking-widest">SIAP (DATA ACAK)</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 border-8 border-black rounded-xl relative flex flex-col w-full h-[600px] overflow-hidden" style={{ backgroundColor: '#f8fafc', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">Visualisasi Array (Data Set)</span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 border border-black"></div> Belum Diurutkan</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-400 border border-black"></div> Sedang Dibandingkan</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-400 border border-black"></div> Bertukar Posisi (Swap)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-400 border border-black"></div> Posisi Final (Terurut)</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-end justify-center px-4 pb-8 pt-20">
              <svg viewBox="0 0 800 450" className="w-full h-full overflow-visible">
                <line x1="20" y1="440" x2="780" y2="440" stroke="#0f172a" strokeWidth="4" strokeLinecap="round"/>
                <g ref={barsGroupRef}></g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-purple-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">Buku Panduan: Algoritma Pengurutan Dasar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-purple-700 border-b-2 border-black pb-1 mb-2">Bubble Sort</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Menggelembungkan data terbesar ke ujung kanan. Membandingkan dua data bersebelahan; jika kiri lebih besar dari kanan, mereka ditukar. Proses diulang sampai tidak ada lagi yang perlu ditukar.
            </p>
            <div className="text-[10px] font-bold text-rose-500 mt-2 bg-rose-50 p-2 border border-rose-200">Kelemahan: Sangat lambat karena melakukan terlalu banyak pertukaran (Swap).</div>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-700 border-b-2 border-black pb-1 mb-2">Selection Sort</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Mencari elemen terkecil di seluruh sisa data yang belum terurut, lalu menukarnya langsung ke posisi paling depan. Setelah itu mencari elemen terkecil kedua, dan seterusnya.
            </p>
            <div className="text-[10px] font-bold text-sky-600 mt-2 bg-sky-50 p-2 border border-sky-200">Kelebihan: Meminimalkan jumlah pertukaran (Swap) dibandingkan Bubble Sort.</div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-700 border-b-2 border-black pb-1 mb-2">Insertion Sort</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Bekerja seperti mengurutkan kartu remi di tangan. Mengambil satu elemen baru dan menyisipkannya ke posisi yang tepat di kumpulan data yang sudah terurut di sebelah kirinya.
            </p>
            <div className="text-[10px] font-bold text-emerald-600 mt-2 bg-emerald-50 p-2 border border-emerald-200">Kelebihan: Sangat efisien jika datanya sudah "hampir terurut".</div>
          </div>
        </div>
      </div>
    </div>
  );
}