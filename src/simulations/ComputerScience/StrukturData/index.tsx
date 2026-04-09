import { useState, useRef } from 'react';

const MAX_CAPACITY = 8;

export default function StrukturData() {
  const [currentMode, setCurrentMode] = useState<'STACK' | 'QUEUE'>('STACK');
  const [dataArray, setDataArray] = useState<{ id: number; value: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  const renderAreaRef = useRef<HTMLDivElement>(null);

  const generateRandomData = () => Math.floor(Math.random() * 99) + 1;

  const setMode = (mode: 'STACK' | 'QUEUE') => {
    if (dataArray.length > 0) {
      const confirmChange = window.confirm("Mengubah struktur data akan mengosongkan memori saat ini. Lanjutkan?");
      if (!confirmChange) return;
    }
    setCurrentMode(mode);
    setDataArray([]);
  };

  const addData = () => {
    if (dataArray.length >= MAX_CAPACITY) return;

    let val = inputValue.trim();
    if (val === '') val = generateRandomData().toString();

    setDataArray(prev => [...prev, { id: Date.now(), value: val }]);
    setInputValue('');
  };

  const removeData = () => {
    if (dataArray.length === 0) return;

    if (currentMode === 'STACK') {
      setDataArray(prev => prev.slice(0, -1));
    } else {
      setDataArray(prev => prev.slice(1));
    }
  };

  const clearData = () => {
    setDataArray([]);
  };

  const getSize = () => dataArray.length;
  
  const getPeek = () => {
    if (dataArray.length === 0) return '-';
    if (currentMode === 'STACK') return dataArray[dataArray.length - 1].value;
    return dataArray[0].value;
  };

  const getStatus = () => {
    if (dataArray.length === 0) return { text: 'MEMORI KOSONG', class: 'text-sky-400' };
    if (dataArray.length >= MAX_CAPACITY) return { text: 'OVERFLOW (PENUH)', class: 'text-rose-500' };
    return { text: 'MEMORI TERISI', class: 'text-emerald-400' };
  };

  const status = getStatus();

  const getStackButtonClass = () => 
    `mode-btn neo-btn py-2 px-2 text-xs font-bold w-full ${currentMode === 'STACK' ? 'bg-rose-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`;

  const getQueueButtonClass = () => 
    `mode-btn neo-btn py-2 px-2 text-xs font-bold w-full ${currentMode === 'QUEUE' ? 'bg-sky-400 text-white ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`;

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center font-sans">
      <style>{`
        body { font-family: 'Space Grotesk', sans-serif; background-color: #fdfbf7; background-image: radial-gradient(#000000 1.5px, transparent 1.5px); background-size: 24px 24px; }
        .neo-box { background-color: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0px 0px #000000; border-radius: 12px; }
        .neo-btn { border: 4px solid #000000; box-shadow: 4px 4px 0px 0px #000000; border-radius: 8px; transition: all 0.1s ease-in-out; font-weight: bold; cursor: pointer; text-transform: uppercase; }
        .neo-btn:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0px 0px #000000; }
        .neo-btn:disabled { background-color: #e2e8f0 !important; color: #94a3b8 !important; cursor: not-allowed; transform: translate(4px, 4px); box-shadow: 0px 0px 0px 0px #000000; }
        .neo-tag { border: 3px solid #000; box-shadow: 3px 3px 0px 0px #000; }
        .bg-pattern-dot { background-color: #f8fafc; background-image: radial-gradient(#cbd5e1 2px, transparent 2px); background-size: 20px 20px; }
        .neo-input { border: 4px solid #000; box-shadow: 4px 4px 0px 0px #000; font-family: 'Space Grotesk', sans-serif; font-weight: bold; }
        .neo-input:focus { outline: none; background-color: #fef08a; }
        .container-stack { border-left: 12px solid #000; border-right: 12px solid #000; border-bottom: 12px solid #000; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; background-color: rgba(255, 255, 255, 0.5); }
        .container-queue { border-top: 12px solid #000; border-bottom: 12px solid #000; background-color: rgba(255, 255, 255, 0.5); }
        .anim-stack-enter { animation: slideDown 0.3s ease-out forwards; }
        .anim-queue-enter { animation: slideLeft 0.3s ease-out forwards; }
        @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideLeft { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-yellow-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 neo-tag font-bold text-sm transform -rotate-3 text-black border-2 border-black">ILMU KOMPUTER</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: STRUKTUR DATA</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Visualisasi Memori: Stack (Tumpukan) & Queue (Antrean)</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">Operasi Memori</span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Struktur Data</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode('STACK')} className={getStackButtonClass()}>📚 STACK (LIFO)</button>
                <button onClick={() => setMode('QUEUE')} className={getQueueButtonClass()}>🚶 QUEUE (FIFO)</button>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Data Baru</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addData()}
                  className="neo-input px-3 py-2 w-full text-sm" 
                  placeholder="Ketik nilai..." 
                  maxLength={5}
                />
                <button onClick={() => setInputValue(String(generateRandomData()))} className="neo-btn bg-sky-300 text-black px-3 py-2 text-xl" title="Angka Acak">🎲</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t-4 border-black pt-4">
              <button onClick={addData} disabled={getSize() >= MAX_CAPACITY} className="neo-btn bg-emerald-400 hover:bg-emerald-300 py-4 text-sm flex flex-col items-center justify-center gap-1">
                <span className="text-lg">📥</span>
                <span>{currentMode === 'STACK' ? 'PUSH' : 'ENQUEUE'}</span>
              </button>
              <button onClick={removeData} disabled={getSize() === 0} className="neo-btn bg-rose-400 hover:bg-rose-300 py-4 text-sm flex flex-col items-center justify-center gap-1">
                <span className="text-lg">📤</span>
                <span>{currentMode === 'STACK' ? 'POP' : 'DEQUEUE'}</span>
              </button>
            </div>
            
            <button onClick={clearData} className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-2 text-xs w-full mt-[-10px]">🧹 KOSONGKAN MEMORI</button>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">STATUS STRUKTUR DATA</h4>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Ukuran (Size)</span>
                <div className="text-xl font-black text-white"><span>{getSize()}</span> <span className="text-xs text-slate-500">/ 8</span></div>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center text-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">{currentMode === 'STACK' ? 'Elemen Puncak (Top)' : 'Elemen Depan (Front)'}</span>
                <span className="text-md font-black text-yellow-300">{getPeek()}</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex justify-center items-center mt-2">
              <span className={`text-sm font-black uppercase tracking-widest ${status.class}`}>{status.text}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-pattern-dot p-0 relative flex flex-col items-center w-full h-[500px] border-8 border-black overflow-hidden">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              {currentMode === 'STACK' ? 'Visualisasi: Stack (Tumpukan LIFO)' : 'Visualisasi: Queue (Antrean FIFO)'}
            </span>

            <div ref={renderAreaRef} className="w-full h-full relative z-10 flex items-center justify-center p-8 mt-4">
              {currentMode === 'STACK' ? (
                <div className="container-stack flex flex-col-reverse justify-start items-center p-4 w-48 h-[380px] gap-2">
                  {dataArray.map((item, index) => {
                    const isTop = index === dataArray.length - 1;
                    return (
                      <div key={item.id} className={`w-full h-10 border-4 border-black flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_#000] transition-all relative ${isTop ? 'bg-rose-400 text-white' : 'bg-white text-black'}`}>
                        {item.value}
                        {isTop && <div className="absolute -left-16 bg-slate-900 text-white px-2 py-1 text-[10px] font-bold border-2 border-black">TOP ➔</div>}
                        <div className="absolute -right-8 text-slate-400 font-mono text-xs font-bold">[{index}]</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="container-queue flex flex-row justify-start items-center p-4 w-full h-32 gap-3 overflow-hidden">
                  {dataArray.map((item, index) => {
                    const isFront = index === 0;
                    const isRear = index === dataArray.length - 1;
                    let bgClass = 'bg-white text-black';
                    if (isFront) bgClass = 'bg-emerald-400 text-black';
                    if (isRear && dataArray.length > 1) bgClass = 'bg-sky-400 text-white';

                    return (
                      <div key={item.id} className={`min-w-[60px] h-16 border-4 border-black flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_#000] transition-all relative ${bgClass}`}>
                        {item.value}
                        {isFront && (
                          <div className="absolute -bottom-8 bg-slate-900 text-white px-2 py-1 text-[9px] font-bold border-2 border-black whitespace-nowrap">FRONT (Keluar)</div>
                        )}
                        {isRear && !isFront && (
                          <div className="absolute -top-8 bg-slate-900 text-white px-2 py-1 text-[9px] font-bold border-2 border-black whitespace-nowrap">REAR (Masuk)</div>
                        )}
                        {isFront && <div className="absolute -left-6 text-xl font-bold">⬅</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-sky-100 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">Buku Panduan: Konsep Memori 📖</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-xl uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">📚 STACK (Tumpukan)</h4>
            <div className="inline-block bg-slate-900 text-white px-2 py-1 text-xs font-bold mb-3 border-2 border-black">Prinsip: LIFO (Last In, First Out)</div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Bayangkan sebuah tumpukan piring. Anda hanya bisa menaruh piring baru di posisi <b>paling atas (Push)</b>, dan mengambil piring yang <b>paling atas (Pop)</b>.
            </p>
            <p className="text-xs font-medium text-slate-600 bg-slate-100 p-2 border-l-4 border-rose-500">
              <b>Fungsi:</b> Tombol "Undo" (Ctrl+Z), riwayat navigasi browser, Call Stack pemrograman.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-xl uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">🚶 QUEUE (Antrean)</h4>
            <div className="inline-block bg-slate-900 text-white px-2 py-1 text-xs font-bold mb-3 border-2 border-black">Prinsip: FIFO (First In, First Out)</div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Seperti antrean kasir. Orang datang terakhir masuk di <b>belakang (Enqueue)</b>, dan dilayani yang <b>depan (Dequeue)</b>.
            </p>
            <p className="text-xs font-medium text-slate-600 bg-slate-100 p-2 border-l-4 border-sky-500">
              <b>Fungsi:</b> Antrean print, pesan/server task, pemrosesan data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
