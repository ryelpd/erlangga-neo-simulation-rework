import { useState, useRef } from 'react';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function Kriptografi() {
  const [currentMode, setCurrentMode] = useState<'CAESAR' | 'VIGENERE'>('CAESAR');
  const [inputText, setInputText] = useState('RAHASIA');
  const [shift, setShift] = useState(3);
  const [vigenereKey, setVigenereKey] = useState('KEY');
  const [logs, setLogs] = useState<string[]>(['Sistem Siap. Menunggu input pesan...']);
  const [isAnimating, setIsAnimating] = useState(false);

  const blocksGroupRef = useRef<SVGGElement>(null);
  const linesGroupRef = useRef<SVGGElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-10), msg]);
  };

  const cleanInput = (str: string) => str.toUpperCase().replace(/[^A-Z]/g, '');

  const drawBox = (id: string, x: number, y: number, size: number, text: string, bgColor: string, textColor = '#000', label = '') => {
    if (!blocksGroupRef.current) return;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = id;
    g.setAttribute('transform', `translate(${x}, ${y})`);

    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    shadow.setAttribute('x', '3');
    shadow.setAttribute('y', '3');
    shadow.setAttribute('width', String(size));
    shadow.setAttribute('height', String(size));
    shadow.setAttribute('fill', '#000');
    shadow.setAttribute('rx', '4');

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(size));
    rect.setAttribute('height', String(size));
    rect.setAttribute('fill', bgColor);
    rect.setAttribute('stroke', '#000');
    rect.setAttribute('stroke-width', '3');
    rect.setAttribute('rx', '4');

    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', String(size / 2));
    textEl.setAttribute('y', String(size / 2 + 8));
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('font-weight', '900');
    textEl.setAttribute('font-size', String(size * 0.5));
    textEl.setAttribute('fill', textColor);
    textEl.textContent = text;

    g.appendChild(shadow);
    g.appendChild(rect);
    g.appendChild(textEl);

    if (label !== '') {
      const labelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelEl.setAttribute('x', String(size / 2));
      labelEl.setAttribute('y', String(size + 15));
      labelEl.setAttribute('text-anchor', 'middle');
      labelEl.setAttribute('font-weight', 'bold');
      labelEl.setAttribute('font-size', '10');
      labelEl.setAttribute('fill', '#64748b');
      labelEl.textContent = label;
      g.appendChild(labelEl);
    }

    blocksGroupRef.current.appendChild(g);
    return g;
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    if (!linesGroupRef.current) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', '#94a3b8');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-dasharray', '4 4');
    linesGroupRef.current.appendChild(line);
  };

  const runCrypto = async (operation: 'ENC' | 'DEC') => {
    if (isAnimating) return;

    let text = cleanInput(inputText);
    if (text.length === 0) {
      addLog('Input tidak valid!');
      return;
    }

    setInputText(text);
    setIsAnimating(true);
    setLogs([]);

    const actionName = operation === 'ENC' ? 'Enkripsi' : 'Dekripsi';
    addLog(`Memulai proses ${actionName} (${currentMode})...`);

    const boxSize = 40;
    const spacing = 15;
    const totalWidth = text.length * (boxSize + spacing) - spacing;
    const startX = (800 - totalWidth) / 2;
    const topY = 50;
    const midY = 160;
    const bottomY = 270;

    let resultText = "";
    let shiftKeys: number[] = [];

    if (currentMode === 'CAESAR') {
      for (let i = 0; i < text.length; i++) shiftKeys.push(shift);
      addLog(`Kunci Shift Caesar = ${shift}`);
    } else {
      let vKey = cleanInput(vigenereKey) || "A";
      for (let i = 0; i < text.length; i++) {
        shiftKeys.push(ALPHABET.indexOf(vKey[i % vKey.length]));
      }
      addLog(`Kata Kunci Vigenère = ${vKey}`);
    }

    if (blocksGroupRef.current) blocksGroupRef.current.innerHTML = '';
    if (linesGroupRef.current) linesGroupRef.current.innerHTML = '';

    // Draw Input Row
    let inputNodes: { char: string, idx: number, x: number }[] = [];
    for (let i = 0; i < text.length; i++) {
      let char = text[i];
      let idx = ALPHABET.indexOf(char);
      let x = startX + i * (boxSize + spacing);
      drawBox(`in-${i}`, x, topY, boxSize, char, operation === 'ENC' ? '#bae6fd' : '#fecaca', '#000', `[${idx}]`);
      inputNodes.push({ char, idx, x });
    }

    for (let i = 0; i < text.length; i++) {
      let node = inputNodes[i];
      let kIdx = shiftKeys[i];

      // Draw Key Box
      let keyBoxBg = currentMode === 'CAESAR' ? '#e9d5ff' : '#ddd6fe';
      let keyBoxLabel = currentMode === 'CAESAR' ? `Shift` : `K=${kIdx}`;
      drawBox(`key-${i}`, node.x, midY, boxSize, ALPHABET[kIdx], keyBoxBg, '#000', keyBoxLabel);
      drawLine(node.x + boxSize/2, topY + boxSize + 20, node.x + boxSize/2, midY);

      await new Promise(r => setTimeout(r, 300));

      let p = node.idx;
      let c_idx: number;

      if (operation === 'ENC') {
        c_idx = (p + kIdx) % 26;
        addLog(`Huruf '${node.char}': (${p} + ${kIdx}) mod 26 = ${c_idx} ➔ ${ALPHABET[c_idx]}`);
      } else {
        c_idx = (p - kIdx) % 26;
        if (c_idx < 0) c_idx += 26;
        addLog(`Huruf '${node.char}': (${p} - ${kIdx}) mod 26 = ${c_idx} ➔ ${ALPHABET[c_idx]}`);
      }

      let resChar = ALPHABET[c_idx];
      resultText += resChar;

      drawLine(node.x + boxSize/2, midY + boxSize + 20, node.x + boxSize/2, bottomY);

      let outBoxColor = operation === 'ENC' ? '#fecaca' : '#bae6fd';
      drawBox(`out-${i}`, node.x, bottomY, boxSize, resChar, outBoxColor, '#000', `[${c_idx}]`);

      await new Promise(r => setTimeout(r, 400));
    }

    addLog(`Proses selesai. Hasil: ${resultText}`);
    setInputText(resultText);
    setIsAnimating(false);
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center font-sans">
      <style>{`
        body { font-family: 'Space Grotesk', sans-serif; background-color: #fdfbf7; background-image: radial-gradient(#000000 1.5px, transparent 1.5px); background-size: 24px 24px; }
        .neo-box { background-color: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0px 0px #000000; border-radius: 12px; }
        .neo-btn { border: 4px solid #000000; box-shadow: 4px 4px 0px 0px #000000; border-radius: 8px; transition: all 0.1s ease-in-out; font-weight: bold; cursor: pointer; text-transform: uppercase; }
        .neo-btn:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0px 0px #000000; }
        .neo-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .neo-input { border: 4px solid #000; box-shadow: 4px 4px 0px 0px #000; font-family: 'Space Grotesk', sans-serif; font-weight: bold; }
        .bg-pattern-dot { background-color: #f8fafc; background-image: radial-gradient(#cbd5e1 2px, transparent 2px); background-size: 20px 20px; }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-purple-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 text-black">KEAMANAN SIBER</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: KRIPTOGRAFI</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Simulasi Enkripsi & Dekripsi</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#a855f7] text-md transform rotate-2 z-30 uppercase">Mesin Enigma</span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Algoritma Sandi</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setCurrentMode('CAESAR')} className={`mode-btn neo-btn py-2 px-2 text-xs font-bold w-full ${currentMode === 'CAESAR' ? 'bg-purple-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}>🛡️ CAESAR</button>
                <button onClick={() => setCurrentMode('VIGENERE')} className={`mode-btn neo-btn py-2 px-2 text-xs font-bold w-full ${currentMode === 'VIGENERE' ? 'bg-purple-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}>🗝️ VIGENÈRE</button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-slate-500">Pesan (Maks 12 Huruf)</label>
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value.toUpperCase())} maxLength={12} className="neo-input px-3 py-3 w-full text-lg" />
            </div>

            {currentMode === 'CAESAR' ? (
              <div className="bg-purple-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-purple-800 uppercase text-[10px]">Nilai Geseran</span>
                  <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{shift}</span>
                </div>
                <input type="range" min="1" max="25" step="1" value={shift} onChange={(e) => setShift(Number(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
              </div>
            ) : (
              <div className="bg-purple-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
                <label className="text-[11px] font-black uppercase text-purple-800 mb-1">Kata Kunci</label>
                <input type="text" value={vigenereKey} onChange={(e) => setVigenereKey(e.target.value.toUpperCase())} maxLength={12} className="neo-input px-3 py-2 w-full text-md" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 border-t-4 border-black pt-4">
              <button onClick={() => runCrypto('ENC')} disabled={isAnimating} className="neo-btn bg-rose-400 hover:bg-rose-300 text-black py-4 text-sm flex items-center justify-center gap-1">🔒 ENKRIPSI</button>
              <button onClick={() => runCrypto('DEC')} disabled={isAnimating} className="neo-btn bg-sky-400 hover:bg-sky-300 text-black py-4 text-sm flex items-center justify-center gap-1">🔓 DEKRIPSI</button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-purple-400 text-[10px] mb-2 uppercase tracking-widest border-b-2 border-slate-700 pb-2">LOG OPERASI</h4>
            <div className="bg-black p-2 border-2 border-slate-700 text-left h-32 overflow-y-auto font-mono text-[11px] leading-tight flex flex-col gap-1">
              {logs.map((log, i) => (
                <div key={i} className={log.includes('[OK]') ? 'text-emerald-400' : 'text-slate-300'}>- {log}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-pattern-dot p-0 relative flex flex-col items-center w-full h-[600px] border-8 border-black overflow-hidden">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">Visualisasi Transformasi Karakter</span>

            <div className="absolute bottom-4 left-4 right-4 z-20 bg-white p-2 border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col items-center">
              <span className="text-[9px] font-black uppercase text-slate-500 mb-1">Indeks Alfabet (A=0, Z=25)</span>
              <div className="flex flex-wrap justify-center gap-1 font-mono text-[9px] font-bold">
                {ALPHABET.split('').map((char, i) => (
                  <div key={i} className="flex flex-col items-center px-1"><span className="text-slate-400 text-[8px]">{i}</span><span>{char}</span></div>
                ))}
              </div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center p-4">
              <svg viewBox="0 0 800 400" className="w-full h-full overflow-visible">
                <g ref={linesGroupRef}></g>
                <g ref={blocksGroupRef}></g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-100 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">Buku Panduan: Kriptografi 📖</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-purple-50 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-xl uppercase text-purple-700 border-b-2 border-black pb-1 mb-2">🛡️ Sandi Caesar</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">Mengganti huruf dengan menggeser N posisi dalam alfabet.</p>
            <div className="bg-white p-2 border-2 border-black font-mono text-xs">C = (P + K) mod 26</div>
            <p className="text-[10px] mt-2 font-bold text-rose-500">Kelemahan: Hanya 25 kemungkinan kunci.</p>
          </div>
          
          <div className="bg-indigo-50 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-xl uppercase text-indigo-700 border-b-2 border-black pb-1 mb-2">🗝️ Sandi Vigenère</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">Substitusi polialfabetik menggunakan kata kunci yang diulang.</p>
            <div className="bg-white p-2 border-2 border-black font-mono text-xs">C = (P + K) mod 26</div>
            <p className="text-[10px] mt-2 font-bold text-rose-500">Kelebihan: Lebih sulit dipecahkan daripada Caesar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
