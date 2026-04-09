import { useState, useRef, useEffect } from 'react';

const BP_TABLET = 480;
const BP_DESKTOP = 640;

type LayoutMode = 'FLEX' | 'GRID';
type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface CSSRule {
  prop: string;
  val: string;
}

function getCSSSyntax(selector: string, rules: CSSRule[], indent = "  "): string {
  let css = `<span class="token-tag">${selector}</span> <span class="token-punct">{</span><br>`;
  rules.forEach(r => {
    css += `${indent}<span class="token-prop">${r.prop}</span><span class="token-punct">:</span> <span class="token-val">${r.val}</span><span class="token-punct">;</span><br>`;
  });
  css += `<span class="token-punct">}</span><br>`;
  return css;
}

export default function DesainWebResponsif() {
  const [currentMode, setCurrentMode] = useState<LayoutMode>('FLEX');
  const [currentWidth, setCurrentWidth] = useState(800);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('desktop');
  const [cssCodeHtml, setCssCodeHtml] = useState('');
  const [activeBreakpointLabel, setActiveBreakpointLabel] = useState('@media desktop');
  const [activeBreakpointColor, setActiveBreakpointColor] = useState('bg-sky-400');

  const cardContainerRef = useRef<HTMLDivElement>(null);
  const card4Ref = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const elSidebarRef = useRef<HTMLDivElement>(null);

  const updateCSSCodeDisplay = (mode: LayoutMode, breakpoint: Breakpoint) => {
    let codeHtml = "";

    if (mode === 'FLEX') {
      if (breakpoint === 'mobile') {
        setActiveBreakpointLabel("Default (Mobile First)");
        setActiveBreakpointColor("bg-rose-400");
        codeHtml += `<span class="text-slate-500 italic">/* Layout HP (Default) */</span><br>`;
        codeHtml += getCSSSyntax(".container", [
          {prop: "display", val: "flex"},
          {prop: "flex-direction", val: "column"}
        ]);
        codeHtml += getCSSSyntax(".card-grid", [
          {prop: "display", val: "flex"},
          {prop: "flex-direction", val: "column"}
        ]);
      } else if (breakpoint === 'tablet') {
        setActiveBreakpointLabel(`@media (min-width: ${BP_TABLET}px)`);
        setActiveBreakpointColor("bg-yellow-400");
        codeHtml += `<span class="token-mq">@media</span> (min-width: ${BP_TABLET}px) <span class="token-punct">{</span><br>`;
        codeHtml += `<span class="text-slate-500 italic pl-4">/* Sidebar tetap di atas, Kartu menyamping */</span><br>`;
        codeHtml += getCSSSyntax(".card-grid", [
          {prop: "flex-direction", val: "row"},
          {prop: "flex-wrap", val: "wrap"}
        ], "    ");
        codeHtml += getCSSSyntax(".card", [
          {prop: "width", val: "calc(50% - gap)"}
        ], "    ");
        codeHtml += `<span class="token-punct">}</span>`;
      } else {
        setActiveBreakpointLabel(`@media (min-width: ${BP_DESKTOP}px)`);
        setActiveBreakpointColor("bg-sky-400");
        codeHtml += `<span class="token-mq">@media</span> (min-width: ${BP_DESKTOP}px) <span class="token-punct">{</span><br>`;
        codeHtml += `<span class="text-slate-500 italic pl-4">/* Sidebar pindah ke kiri */</span><br>`;
        codeHtml += getCSSSyntax(".container", [
          {prop: "flex-direction", val: "row"}
        ], "    ");
        codeHtml += getCSSSyntax(".sidebar", [
          {prop: "width", val: "200px"},
          {prop: "flex-shrink", val: "0"}
        ], "    ");
        codeHtml += `<span class="text-slate-500 italic pl-4">/* Kartu sejajar 1 baris */</span><br>`;
        codeHtml += getCSSSyntax(".card", [
          {prop: "flex", val: "1"}
        ], "    ");
        codeHtml += `<span class="token-punct">}</span>`;
      }
    } else if (mode === 'GRID') {
      if (breakpoint === 'mobile') {
        setActiveBreakpointLabel("Default (Mobile First)");
        setActiveBreakpointColor("bg-rose-400");
        codeHtml += `<span class="text-slate-500 italic">/* Layout HP (Default) */</span><br>`;
        codeHtml += getCSSSyntax(".container", [
          {prop: "display", val: "grid"},
          {prop: "grid-template-columns", val: "1fr"}
        ]);
        codeHtml += getCSSSyntax(".card-grid", [
          {prop: "display", val: "grid"},
          {prop: "grid-template-columns", val: "1fr"}
        ]);
      } else if (breakpoint === 'tablet') {
        setActiveBreakpointLabel(`@media (min-width: ${BP_TABLET}px)`);
        setActiveBreakpointColor("bg-yellow-400");
        codeHtml += `<span class="token-mq">@media</span> (min-width: ${BP_TABLET}px) <span class="token-punct">{</span><br>`;
        codeHtml += `<span class="text-slate-500 italic pl-4">/* Grid 2 Kolom untuk Kartu */</span><br>`;
        codeHtml += getCSSSyntax(".card-grid", [
          {prop: "grid-template-columns", val: "repeat(2, 1fr)"}
        ], "    ");
        codeHtml += `<span class="token-punct">}</span>`;
      } else {
        setActiveBreakpointLabel(`@media (min-width: ${BP_DESKTOP}px)`);
        setActiveBreakpointColor("bg-sky-400");
        codeHtml += `<span class="token-mq">@media</span> (min-width: ${BP_DESKTOP}px) <span class="token-punct">{</span><br>`;
        codeHtml += `<span class="text-slate-500 italic pl-4">/* Definisi layout keseluruhan */</span><br>`;
        codeHtml += getCSSSyntax(".container", [
          {prop: "grid-template-columns", val: "200px 1fr"}
        ], "    ");
        codeHtml += `<span class="text-slate-500 italic pl-4">/* Grid 4 Kolom untuk Kartu */</span><br>`;
        codeHtml += getCSSSyntax(".card-grid", [
          {prop: "grid-template-columns", val: "repeat(4, 1fr)"}
        ], "    ");
        codeHtml += `<span class="token-punct">}</span>`;
      }
    }

    setCssCodeHtml(codeHtml);
  };

  const applyLayoutLogic = (mode: LayoutMode, breakpoint: Breakpoint) => {
    if (!mainContainerRef.current || !elSidebarRef.current || !cardContainerRef.current || !card4Ref.current) return;

    const cards = cardContainerRef.current.children;

    if (mode === 'FLEX') {
      if (breakpoint === 'mobile') {
        mainContainerRef.current.style.display = "flex";
        mainContainerRef.current.style.flexDirection = "column";
        mainContainerRef.current.style.gap = "12px";
        
        cardContainerRef.current.style.display = "flex";
        cardContainerRef.current.style.flexDirection = "column";
        cardContainerRef.current.style.gap = "8px";
        
        card4Ref.current.style.display = "none";
      } else if (breakpoint === 'tablet') {
        mainContainerRef.current.style.display = "flex";
        mainContainerRef.current.style.flexDirection = "column";
        mainContainerRef.current.style.gap = "12px";

        cardContainerRef.current.style.display = "flex";
        cardContainerRef.current.style.flexDirection = "row";
        cardContainerRef.current.style.flexWrap = "wrap";
        cardContainerRef.current.style.gap = "8px";
        
        for(let i=0; i<cards.length; i++) {
          const card = cards[i] as HTMLElement;
          card.style.width = "calc(50% - 4px)";
          card.style.display = "flex";
        }
      } else {
        mainContainerRef.current.style.display = "flex";
        mainContainerRef.current.style.flexDirection = "row";
        mainContainerRef.current.style.gap = "16px";

        elSidebarRef.current.style.width = "200px";
        elSidebarRef.current.style.flexShrink = "0";

        cardContainerRef.current.style.display = "flex";
        cardContainerRef.current.style.flexDirection = "row";
        cardContainerRef.current.style.gap = "8px";

        for(let i=0; i<cards.length; i++) {
          const card = cards[i] as HTMLElement;
          card.style.flex = "1";
          card.style.width = "";
          card.style.display = "flex";
        }
      }
    } else if (mode === 'GRID') {
      if (breakpoint === 'mobile') {
        mainContainerRef.current.style.display = "grid";
        mainContainerRef.current.style.gridTemplateColumns = "1fr";
        mainContainerRef.current.style.gap = "12px";

        cardContainerRef.current.style.display = "grid";
        cardContainerRef.current.style.gridTemplateColumns = "1fr";
        cardContainerRef.current.style.gap = "8px";
        
        card4Ref.current.style.display = "none";
      } else if (breakpoint === 'tablet') {
        mainContainerRef.current.style.display = "grid";
        mainContainerRef.current.style.gridTemplateColumns = "1fr";
        mainContainerRef.current.style.gap = "12px";

        cardContainerRef.current.style.display = "grid";
        cardContainerRef.current.style.gridTemplateColumns = "repeat(2, 1fr)";
        cardContainerRef.current.style.gap = "8px";
        
        for(let i=0; i<cards.length; i++) {
          const card = cards[i] as HTMLElement;
          card.style.display = "flex";
        }
      } else {
        mainContainerRef.current.style.display = "grid";
        mainContainerRef.current.style.gridTemplateColumns = "200px 1fr";
        mainContainerRef.current.style.gap = "16px";

        cardContainerRef.current.style.display = "grid";
        cardContainerRef.current.style.gridTemplateColumns = "repeat(4, 1fr)";
        cardContainerRef.current.style.gap = "8px";
        
        for(let i=0; i<cards.length; i++) {
          const card = cards[i] as HTMLElement;
          card.style.display = "flex";
        }
      }
    }
  };

  const updateSimulation = (width: number, mode: LayoutMode) => {
    let newBreakpoint: Breakpoint = 'mobile';
    if (width >= BP_DESKTOP) newBreakpoint = 'desktop';
    else if (width >= BP_TABLET) newBreakpoint = 'tablet';

    setCurrentBreakpoint(newBreakpoint);
    applyLayoutLogic(mode, newBreakpoint);
    updateCSSCodeDisplay(mode, newBreakpoint);
  };

  useEffect(() => {
    updateSimulation(currentWidth, currentMode);
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value);
    setCurrentWidth(width);
    updateSimulation(width, currentMode);
  };

  const handlePresetClick = (width: number) => {
    setCurrentWidth(width);
    updateSimulation(width, currentMode);
  };

  const handleModeChange = (mode: LayoutMode) => {
    setCurrentMode(mode);
    updateSimulation(currentWidth, mode);
  };

  const getBreakpointButtonStyle = (bp: Breakpoint) => {
    const isActive = currentBreakpoint === bp;
    const base = "neo-btn py-3 text-xl flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all";
    if (isActive) {
      if (bp === 'mobile') return `${base} bg-rose-200 ring-4 ring-black`;
      if (bp === 'tablet') return `${base} bg-yellow-200 ring-4 ring-black`;
      return `${base} bg-sky-200 ring-4 ring-black`;
    }
    return `${base} bg-white text-slate-700`;
  };

  const getModeButtonStyle = (mode: LayoutMode) => {
    const isActive = currentMode === mode;
    const base = "neo-btn py-2 px-2 text-xs font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all";
    if (isActive) {
      return `${base} bg-emerald-300 text-black ring-4 ring-black`;
    }
    return `${base} bg-slate-200 text-slate-600`;
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-blue-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">PENGEMBANGAN WEB</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: DESAIN RESPONSIF
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Simulasi Media Queries, Flexbox, dan CSS Grid
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#3b82f6] text-md transform rotate-2 z-30 uppercase">
            Inspektur Layout (DevTools)
          </span>

          <div className="flex flex-col gap-4 mt-4 h-[550px] overflow-y-auto pr-2">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Metode Layout Utama</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleModeChange('FLEX')} className={getModeButtonStyle('FLEX')}>
                  FLEXBOX
                </button>
                <button onClick={() => handleModeChange('GRID')} className={getModeButtonStyle('GRID')}>
                  CSS GRID
                </button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-800 uppercase text-[10px]">Lebar Layar (Viewport Width)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-blue-600">{currentWidth}px</span>
              </div>
              <input type="range" min="320" max="800" step="10" value={currentWidth} onChange={handleSliderChange} className="w-full" />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500 mt-1">
                <span>Handphone</span>
                <span>Tablet</span>
                <span>Desktop</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handlePresetClick(320)} className={getBreakpointButtonStyle('mobile')} title="Mobile (< 480px)">
                📱
              </button>
              <button onClick={() => handlePresetClick(500)} className={getBreakpointButtonStyle('tablet')} title="Tablet (≥ 480px)">
                💊
              </button>
              <button onClick={() => handlePresetClick(800)} className={getBreakpointButtonStyle('desktop')} title="Desktop (≥ 640px)">
                💻
              </button>
            </div>

            <div className="flex flex-col flex-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] bg-slate-900 mt-2 rounded-lg">
              <div className="bg-slate-800 border-b-2 border-slate-700 p-2 flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-slate-300">Live CSS Inspector</span>
                <span className={`text-[9px] font-bold ${activeBreakpointColor} text-black px-2 py-0.5 rounded`}>{activeBreakpointLabel}</span>
              </div>
              <div className="p-3 text-[11px] leading-relaxed overflow-y-auto" style={{ fontFamily: 'Courier New, Courier, monospace' }}>
                <style>{`.token-tag { color: #f43f5e; } .token-prop { color: #38bdf8; } .token-val { color: #facc15; } .token-punct { color: #cbd5e1; } .token-mq { color: #a855f7; font-weight: bold; }`}</style>
                <div dangerouslySetInnerHTML={{ __html: cssCodeHtml }} />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-pattern-dot p-0 relative flex flex-col items-center w-full h-[600px] border-8 border-black overflow-hidden pt-8 pb-4 px-2 rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Uji Responsivitas (Responsive Testing)
            </span>

            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col h-full mx-auto relative overflow-hidden transition-all duration-200" style={{ width: `${currentWidth}px`, maxWidth: '100%' }}>
              <div className="bg-slate-200 border-b-4 border-black p-2 flex items-center gap-2 shrink-0">
                <div className="flex gap-1.5 ml-1">
                  <div className="w-3 h-3 rounded-full bg-rose-500 border-2 border-black"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-black"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-black"></div>
                </div>
                <div className="bg-white border-2 border-black rounded-md flex-1 mx-4 py-1 text-center font-mono text-[10px] font-bold text-slate-500 flex justify-between px-3">
                  <span>localhost:8080/index.html</span>
                  <span className="text-blue-600">{currentWidth}px</span>
                </div>
                <div className="text-lg">☰</div>
              </div>

              <div className="flex-1 bg-slate-100 overflow-y-auto overflow-x-hidden p-3 w-full h-full transition-all duration-300">
                <div className="w-full h-full transition-all duration-300">
                  <header className="bg-rose-400 border-4 border-black p-4 shadow-[4px_4px_0px_#000] flex items-center justify-center font-black text-xl mb-3 transition-all duration-300">
                    HEADER
                  </header>

                  <div ref={mainContainerRef} className="w-full transition-all duration-300">
                    <aside ref={elSidebarRef} className="bg-sky-400 border-4 border-black p-4 shadow-[4px_4px_0px_#000] flex items-center justify-center font-black text-lg transition-all duration-300">
                      SIDEBAR
                    </aside>

                    <main className="bg-yellow-300 border-4 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-col gap-3 transition-all duration-300">
                      <h2 className="font-black text-lg text-center uppercase border-b-4 border-black pb-2">Konten Utama</h2>
                      
                      <div ref={cardContainerRef} className="w-full transition-all duration-300">
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center h-24 transition-all duration-300">
                          <span className="font-black text-2xl">1</span>
                          <span className="text-xs font-bold">Produk A</span>
                        </div>
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center h-24 transition-all duration-300">
                          <span className="font-black text-2xl">2</span>
                          <span className="text-xs font-bold">Produk B</span>
                        </div>
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center h-24 transition-all duration-300">
                          <span className="font-black text-2xl">3</span>
                          <span className="text-xs font-bold">Produk C</span>
                        </div>
                        <div ref={card4Ref} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center h-24 transition-all duration-300">
                          <span className="font-black text-2xl">4</span>
                          <span className="text-xs font-bold">Produk D</span>
                        </div>
                      </div>
                    </main>
                  </div>

                  <footer className="bg-emerald-400 border-4 border-black p-4 shadow-[4px_4px_0px_#000] flex items-center justify-center font-black text-xl mt-3 transition-all duration-300">
                    FOOTER
                  </footer>
                </div>
              </div>
            </div>

            <div className="absolute bottom-2 text-[10px] font-bold text-slate-500 bg-white px-2 border-2 border-slate-300 rounded-full">
              Gunakan slider di kiri untuk mengubah lebar browser
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-blue-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black rounded-lg">
          Buku Panduan: Anatomi Desain Responsif
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">1. Media Queries (@media)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Kunci utama desain responsif. Media Query bertindak seperti sakelar bersyarat (IF statement) di dalam CSS. Aturan seperti <span className="bg-slate-200 px-1 font-mono text-xs">@media (min-width: 640px)</span> berarti: "Terapkan gaya-gaya ini HANYA JIKA lebar layar pengguna minimal 640 pixel atau lebih besar."
            </p>
            <div className="text-[10px] font-bold text-slate-500 italic mt-2">
              *Praktik terbaik saat ini adalah <b>Mobile-First</b>: Tulis kode untuk HP dulu, lalu gunakan (min-width) untuk menyesuaikan layar besar.
            </div>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">2. CSS Flexbox (1-Dimensi)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Flexbox sangat baik untuk mengatur elemen dalam <b>satu baris (row)</b> atau <b>satu kolom (column)</b>. Pada simulasi ini, Anda bisa melihat bagaimana Flexbox mengubah arah susunan (flex-direction) dari berderet ke bawah di layar HP, menjadi berderet menyamping di layar Desktop.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">3. CSS Grid (2-Dimensi)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Grid jauh lebih kuat untuk mendesain tata letak makro karena ia mengontrol <b>baris dan kolom sekaligus</b>. Dengan Grid, mendefinisikan layout kompleks (seperti memisahkan Sidebar di kiri dan Main Content di kanan) menjadi sangat mudah dan rapi menggunakan <span className="bg-slate-200 px-1 font-mono text-xs">grid-template-columns</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}