import { useState, useEffect, useRef, type ReactNode } from 'react';

interface PageTableEntry {
  frame: number | null;
  valid: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const NUM_PAGES = 8;
const NUM_FRAMES = 4;

const quizData: QuizQuestion[] = [
  {
    question: '1. Virtual Memory memberikan ilusi kepada CPU bahwa ia memiliki...',
    options: ['RAM lebih kecil dari yang sebenarnya', 'RAM yang sangat besar', 'Hard disk yang sangat cepat', 'Processor yang lebih cepat'],
    answer: 1,
  },
  {
    question: '2. Page Fault terjadi ketika...',
    options: ['Data sudah ada di RAM', 'CPU meminta data yang tidak ada di RAM', 'Hard disk penuh', 'RAM penuh dan tidak bisa ditulis'],
    answer: 1,
  },
  {
    question: '3. Algoritma FIFO dalam page replacement artinya...',
    options: ['Menghapus halaman yang paling jarang digunakan', 'Menghapus halaman yang paling sering digunakan', 'Menghapus halaman yang paling pertama masuk', 'Menghapus halaman acak'],
    answer: 2,
  },
  {
    question: '4. Apa yang terjadi pada saat "Page Hit"?',
    options: ['OS mengambil data dari hard disk', 'Data langsung diakses dari RAM', 'CPU berhenti bekerja', 'Terjadi error sistem'],
    answer: 1,
  },
  {
    question: '5. Tujuan utama menggunakan Virtual Memory adalah...',
    options: ['Mempercepat processor', 'Menambah kapasitas memori fisik yang terbatas', 'Mengurangi penggunaan listrik', 'Memperbesar hard disk'],
    answer: 1,
  },
];

export default function VirtualMemory(): ReactNode {
  const [pageTable, setPageTable] = useState<PageTableEntry[]>([]);
  const [ramState, setRamState] = useState<(number | null)[]>([]);
  const [fifoQueue, setFifoQueue] = useState<number[]>([]);
  const [stats, setStats] = useState({ hits: 0, faults: 0, total: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Sistem siap. RAM kosong. Menunggu instruksi CPU...']);
  const [cpuRequest, setCpuRequest] = useState('IDLE');
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(5).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const autoPlayRef = useRef<number | null>(null);

  const initSystem = () => {
    const newPageTable: PageTableEntry[] = Array(NUM_PAGES).fill(null).map(() => ({ frame: null, valid: false }));
    setPageTable(newPageTable);
    setRamState(Array(NUM_FRAMES).fill(null));
    setFifoQueue([]);
    setStats({ hits: 0, faults: 0, total: 0 });
    setLogs(['Sistem di-reset. RAM kosong.']);
    setCpuRequest('IDLE');
    setIsProcessing(false);
  };

  useEffect(() => {
    initSystem();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg].slice(-6));
  };

  const requestPage = async (pageNum: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setCpuRequest(`P${pageNum}`);

    const newStats = { ...stats, total: stats.total + 1 };
    setStats(newStats);

    addLog(`CPU meminta akses ke Page ${pageNum}...`);
    await new Promise((r) => setTimeout(r, 600));

    if (pageTable[pageNum].valid) {
      // Page Hit
      newStats.hits++;
      setStats({ ...newStats });
      const frameNum = pageTable[pageNum].frame;
      addLog(`Alamat Virtual P${pageNum} valid di Frame Fisik F${frameNum}.`);
      await new Promise((r) => setTimeout(r, 500));
    } else {
      // Page Fault
      newStats.faults++;
      setStats({ ...newStats });
      addLog(`Page ${pageNum} tidak ada di memori! Terjadi Interupsi OS.`);
      await new Promise((r) => setTimeout(r, 800));

      let targetFrame = -1;

      if (fifoQueue.length >= NUM_FRAMES) {
        const victimPage = fifoQueue.shift()!;
        targetFrame = pageTable[victimPage].frame!;
        addLog(`Kapasitas RAM penuh. Mengeluarkan Page ${victimPage} dari Frame ${targetFrame} (FIFO).`);

        const newPT = [...pageTable];
        newPT[victimPage] = { ...newPT[victimPage], valid: false, frame: null };
        setPageTable(newPT);

        const newFifo = [...fifoQueue];
        setFifoQueue(newFifo);
        await new Promise((r) => setTimeout(r, 800));
      } else {
        targetFrame = ramState.findIndex((val) => val === null);
      }

      addLog(`Memuat Page ${pageNum} dari Disk ke Frame ${targetFrame}...`);
      await new Promise((r) => setTimeout(r, 800));

      const newRam = [...ramState];
      newRam[targetFrame] = pageNum;
      setRamState(newRam);

      const newPT2 = [...pageTable];
      newPT2[pageNum] = { ...newPT2[pageNum], valid: true, frame: targetFrame };
      setPageTable(newPT2);

      const newFifo2 = [...fifoQueue, pageNum];
      setFifoQueue(newFifo2);
    }

    setCpuRequest('IDLE');
    setIsProcessing(false);
  };

  const toggleAuto = () => {
    if (isAutoPlaying) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      setIsAutoPlaying(false);
    } else {
      setIsAutoPlaying(true);
      const localitySet = [0, 1, 2, 0, 1, 3, 4, 1, 2, 5, 0, 1];
      let lIdx = 0;
      autoPlayRef.current = window.setInterval(() => {
        if (!isProcessing) {
          const reqP = localitySet[lIdx];
          lIdx = (lIdx + 1) % localitySet.length;
          requestPage(reqP);
        }
      }, 1500);
    }
  };

  const handleAnswerSelect = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (userAnswers.every((a) => a !== null)) {
      setQuizSubmitted(true);
    }
  };

  const handleRetry = () => {
    setUserAnswers(new Array(5).fill(null));
    setQuizSubmitted(false);
  };

  const score = quizSubmitted
    ? userAnswers.reduce<number>((acc, ans, i) => (ans === quizData[i].answer ? acc + 1 : acc), 0)
    : 0;

  const allAnswered = userAnswers.every((a) => a !== null);

  const hitRate = stats.total === 0 ? 0 : (stats.hits / stats.total) * 100;

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <style>{`
        .highlight-yellow { animation: flashYellow 0.6s ease-out; }
        @keyframes flashYellow { 0% { background-color: #fde047; transform: scale(1.05); } 100% { background-color: inherit; transform: scale(1); } }
        .highlight-emerald { animation: flashEmerald 0.6s ease-out; background-color: #34d399 !important; color: #000 !important; }
        @keyframes flashEmerald { 0% { transform: scale(1.1); box-shadow: 0 0 15px #34d399; } 100% { transform: scale(1); box-shadow: none; } }
        .highlight-rose { animation: flashRose 0.6s ease-out; background-color: #fb7185 !important; color: #000 !important; }
        @keyframes flashRose { 0% { transform: scale(1.1); box-shadow: 0 0 15px #fb7185; } 100% { transform: scale(1); box-shadow: none; } }
        .highlight-sky { animation: flashSky 0.6s ease-out; background-color: #38bdf8; transform: scale(1.05); }
        @keyframes flashSky { 0% { background-color: #38bdf8; transform: scale(1.05); } 100% { background-color: inherit; transform: scale(1); } }
        .neo-box { background-color: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0px 0px #000000; border-radius: 12px; }
        .neo-btn { border: 4px solid #000000; box-shadow: 4px 4px 0px 0px #000000; border-radius: 8px; transition: all 0.1s ease-in-out; font-weight: bold; cursor: pointer; text-transform: uppercase; }
        .neo-btn:active, .neo-btn-pressed { transform: translate(4px, 4px); box-shadow: 0px 0px 0px 0px #000000; }
        .neo-btn:disabled { background-color: #e2e8f0 !important; color: #94a3b8 !important; cursor: not-allowed; transform: translate(4px, 4px); box-shadow: 0px 0px 0px 0px #000000; }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-indigo-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black font-bold text-sm transform -rotate-3 text-black">SISTEM OPERASI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: VIRTUAL MEMORY
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Simulasi Paging, Page Fault, dan Algoritma Penggantian FIFO
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#818cf8] text-md transform rotate-2 z-30 uppercase">
            Panel Permintaan CPU
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Minta Akses Halaman (Manual)</label>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: NUM_PAGES }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => requestPage(i)}
                    disabled={isProcessing || isAutoPlaying}
                    className="neo-btn bg-white py-2 text-xs font-bold hover:bg-slate-200 disabled:opacity-50"
                  >
                    P{i}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 border-4 border-black p-3 text-[10px] font-bold shadow-[4px_4px_0px_0px_#000] text-slate-700">
              ℹ️ <b>Info:</b> Memori Fisik (RAM) hanya muat 4 Halaman. Jika penuh, halaman tertua akan dikeluarkan (Algoritma FIFO).
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={toggleAuto}
                disabled={isProcessing}
                className={`neo-btn py-3 text-sm flex-1 flex items-center justify-center gap-2 ${isAutoPlaying ? 'bg-rose-400' : 'bg-yellow-400 hover:bg-yellow-300'}`}
              >
                {isAutoPlaying ? '⏸️ HENTIKAN OTOMATIS' : '▶️ REQUEST OTOMATIS'}
              </button>
              <button
                onClick={() => { if (isAutoPlaying) toggleAuto(); initSystem(); }}
                className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-3 px-4 text-xs"
              >
                🔄 RESET
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-indigo-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">STATISTIK KINERJA MEMORI</h4>
            
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <span className="text-[9px] font-bold uppercase text-emerald-400 block mb-1">Page Hit (Sukses)</span>
                <span className="text-2xl font-black text-emerald-400">{stats.hits}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <span className="text-[9px] font-bold uppercase text-rose-400 block mb-1">Page Fault (Gagal)</span>
                <span className="text-2xl font-black text-rose-400">{stats.faults}</span>
              </div>
            </div>

            <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center mb-2">
              <span className="text-[9px] font-bold uppercase text-slate-400">Total Permintaan</span>
              <span className="text-md font-black text-white">{stats.total}</span>
            </div>
            <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase text-slate-400">Hit Rate (%)</span>
              <span className="text-md font-black text-sky-400">{hitRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-[#f8fafc] p-6 relative flex flex-col w-full h-[650px] border-8 border-black overflow-hidden" style={{ background: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Arsitektur Paging
            </span>

            <div className="w-full bg-black border-4 border-slate-700 p-3 text-xs font-mono text-white h-20 overflow-y-auto mt-6 mb-4 flex flex-col gap-1 shadow-inner">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>

            <div className="flex-1 w-full flex flex-col lg:flex-row gap-4 items-stretch justify-between">
              <div className="flex flex-col w-full lg:w-5/12 gap-4">
                <div className="bg-white border-4 border-black p-3 text-center shadow-[4px_4px_0px_0px_#000]">
                  <h3 className="font-black text-sm uppercase text-slate-800 border-b-2 border-slate-300 pb-1 mb-2">Unit Pemroses (CPU)</h3>
                  <div className="text-lg font-black text-indigo-600 bg-indigo-50 border-2 border-indigo-200 py-1 rounded">
                    {cpuRequest}
                  </div>
                </div>

                <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000] flex-1 flex flex-col">
                  <h3 className="font-black text-sm uppercase text-slate-800 border-b-2 border-slate-300 pb-1 mb-2 text-center">Tabel Halaman (MMU)</h3>
                  <div className="grid grid-cols-3 gap-1 mb-1 text-[9px] font-bold text-slate-500 text-center bg-slate-100 p-1">
                    <div>Page</div>
                    <div>Frame</div>
                    <div>Valid</div>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
                    {pageTable.map((entry, i) => (
                      <div key={i} className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold border-2 border-transparent p-1">
                        <div className="bg-indigo-100 text-indigo-800 rounded">P{i}</div>
                        <div className={`rounded ${entry.valid ? 'bg-sky-100 text-sky-700 font-black' : 'bg-slate-100 text-slate-500'}`}>
                          {entry.valid ? `F${entry.frame}` : '-'}
                        </div>
                        <div className={`rounded ${entry.valid ? 'bg-emerald-100 text-emerald-700 font-black' : 'bg-rose-100 text-rose-600'}`}>
                          {entry.valid ? '1' : '0'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-full lg:w-3/12 gap-4">
                <div className="bg-sky-50 border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000] h-full flex flex-col">
                  <h3 className="font-black text-sm uppercase text-sky-800 border-b-2 border-sky-200 pb-1 mb-2 text-center">Memori Fisik (RAM)</h3>
                  <div className="flex flex-col gap-2 flex-1 justify-center">
                    {ramState.map((page, i) => (
                      <div key={i} className="relative border-2 border-black bg-white h-12 flex items-center justify-center font-bold text-sm">
                        <span className="absolute -left-2 top-1/2 transform -translate-y-1/2 -translate-x-full text-[10px] font-bold text-slate-500">F{i}</span>
                        {page !== null ? `Page ${page}` : 'Kosong'}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 border-t-2 border-dashed border-sky-300 pt-2">
                    <span className="text-[9px] font-bold text-slate-500 block mb-1 text-center">Urutan FIFO</span>
                    <div className="flex justify-center gap-1 font-mono text-[10px] font-bold text-sky-700">
                      {fifoQueue.length > 0 ? fifoQueue.map(p => `P${p}`).join(' ➔ ') : '-'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-full lg:w-3/12 gap-4">
                <div className="bg-slate-100 border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000] h-full flex flex-col">
                  <h3 className="font-black text-sm uppercase text-slate-800 border-b-2 border-slate-300 pb-1 mb-2 text-center">Storage (Hard Disk)</h3>
                  <div className="grid grid-cols-2 gap-2 flex-1 content-start">
                    {Array.from({ length: NUM_PAGES }, (_, i) => (
                      <div key={i} className="border-2 border-slate-400 bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center h-10 rounded">
                        Page {i}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-indigo-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Konsep Memori Virtual 📖
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-indigo-700 border-b-2 border-black pb-1 mb-2">Virtual Memory</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Teknik yang memberikan ilusi kepada program bahwa ia memiliki memori sangat besar. Sebagian besar data disimpan di Hard Disk (lambat).
            </p>
          </div>
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Page Hit vs Fault</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              <b>Hit:</b> Data ada di RAM (Cepat).<br/>
              <b>Fault:</b> Data tidak ada di RAM (Lambat, harus ambil dari Disk).
            </p>
          </div>
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Page Replacement (FIFO)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Jika RAM penuh, sistem membuang halaman tertua untuk memberi ruang. Algoritma FIFO = yang masuk pertama, keluar pertama.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-amber-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform -rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI KONSEP [KUIS]</h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                <h4 className="font-bold text-black mb-4 text-base md:text-lg bg-white inline-block px-2 border-2 border-black">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIdx) => {
                    let btnClass = "border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg text-left px-4 py-3 text-sm md:text-base font-bold uppercase transition-all ";
                    if (quizSubmitted) {
                      if (oIdx === q.answer) btnClass += "bg-green-400 text-black";
                      else if (userAnswers[qIdx] === oIdx) btnClass += "bg-rose-400 text-black opacity-80";
                      else btnClass += "bg-slate-200 opacity-50";
                    } else {
                      btnClass += userAnswers[qIdx] === oIdx ? "bg-black text-white" : "bg-white text-black hover:bg-sky-200";
                    }
                    return (
                      <button key={oIdx} onClick={() => handleAnswerSelect(qIdx, oIdx)} disabled={quizSubmitted} className={btnClass}>
                        {quizSubmitted && oIdx === q.answer && "BENAR: "}
                        {quizSubmitted && userAnswers[qIdx] === oIdx && oIdx !== q.answer && "SALAH: "}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted && allAnswered && (
            <div className="text-center mt-8">
              <button onClick={handleSubmit} className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-sky-500 text-black font-black py-4 px-10 text-xl uppercase hover:bg-sky-600 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none">
                CEK JAWABAN SAYA!
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? "LUAR BIASA!" : score >= 3 ? "KERJA BAGUS!" : "JANGAN MENYERAH!"}
              </p>
              <br />
              <button onClick={handleRetry} className="border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg bg-black text-white py-3 px-8 text-lg font-bold hover:bg-slate-800 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none">
                ULANGI KUIS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}