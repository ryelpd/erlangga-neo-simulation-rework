import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const Z_START = -100;
const Z_TOKENIZE = 200;
const Z_FILTER = 400;
const Z_VECTORIZE = 600;
const Z_END = 850;

const STOP_WORDS = ['saya', 'aku', 'ingin', 'mau', 'ke', 'di', 'dari', 'yang', 'untuk', 'dan', 'ini', 'itu', 'apakah', 'tolong', 'bantu', 'sangat', 'sekali'];

const STEM_MAP: Record<string, string> = {
  'memesan': 'pesan', 'pesanan': 'pesan', 'berjalan': 'jalan', 'berlari': 'lari',
  'membeli': 'beli', 'mencari': 'cari', 'mengeluh': 'keluh', 'keluhan': 'keluh',
  'bagaimana': 'bagaimana', 'sepatu': 'sepatu', 'sneakers': 'sneakers'
};

interface Token {
  id: number;
  original: string;
  lower: string;
  stem: string;
  isStop: boolean;
  vectorId: string;
  x: number;
  y: number;
  targetY: number;
  phase: number;
  opacity: number;
  active: boolean;
}

const vocabDict: Record<string, number> = { '?': 999, '!': 998, '.': 997 };

function getWordId(word: string): number {
  if (!vocabDict[word]) {
    vocabDict[word] = Math.floor(Math.random() * 899) + 100;
  }
  return vocabDict[word];
}

const PRESETS = [
  { label: '✈️ Pesan Tiket', text: 'Saya ingin memesan tiket pesawat ke Bali besok pagi!' },
  { label: '🌤️ Tanya Cuaca', text: 'Bagaimana cuaca di Jakarta hari ini? Apakah hujan?' },
  { label: '💻 Keluhan WiFi', text: 'Tolong bantu saya, internet di rumah sangat lambat sekali.' },
  { label: '👟 Tanya Harga', text: 'Berapa harga sepatu sneakers yang warna merah itu?' }
];

export default function ChatbotNLP(): ReactNode {
  const [inputText, setInputText] = useState('');
  const [animationSpeed, setAnimationSpeed] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [cleanCount, setCleanCount] = useState(0);
  const [status, setStatus] = useState('MENUNGGU INPUT...');
  const [statusColor, setStatusColor] = useState('text-slate-400');
  const [statusBg, setStatusBg] = useState('bg-slate-800');
  const [statusBorder, setStatusBorder] = useState('border-slate-500');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokensRef = useRef<Token[]>([]);
  const pipelineTimeRef = useRef(0);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const updateInitialStats = useCallback((text: string) => {
    setCharCount(text.length);
    setTokenCount(text.trim() === '' ? 0 : text.trim().split(/\s+/).length);
    setCleanCount(0);
  }, []);

  const startPipeline = useCallback(() => {
    const text = inputText.trim();
    if (text === '') return;

    setIsProcessing(true);
    pipelineTimeRef.current = 0;
    tokensRef.current = [];

    const words = text.match(/\b[\w']+\b|[.,!?]/g) || [];
    let currentXOffset = Z_START;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const isPunctuation = /^[.,!?]$/.test(word);
      const lower = word.toLowerCase();
      const isStop = STOP_WORDS.includes(lower) || isPunctuation;
      const stem = STEM_MAP[lower] || lower;
      const vid = getWordId(stem);

      tokensRef.current.push({
        id: i,
        original: word,
        lower,
        stem,
        isStop,
        vectorId: `[${vid}]`,
        x: currentXOffset,
        y: 275,
        targetY: 275,
        phase: 0,
        opacity: 1.0,
        active: true
      });

      currentXOffset -= 40;
    }

    setStatus('MEMROSES DATA...');
    setStatusColor('text-amber-400');
    setStatusBg('bg-amber-900');
    setStatusBorder('border-amber-400');
    setCleanCount(0);
  }, [inputText]);

  const updatePhysics = useCallback(() => {
    if (!isProcessing) return;

    let allDone = true;
    let activeCount = 0;

    for (const t of tokensRef.current) {
      t.x += animationSpeed * 1.5;

      if (t.x >= Z_END) {
        if (t.active) t.active = false;
      } else {
        allDone = false;
      }

      if (t.x >= Z_TOKENIZE && t.phase === 0) {
        t.phase = 1;
        if (!t.isStop) t.targetY = 275 + (Math.random() - 0.5) * 40;
      }

      if (t.x >= Z_FILTER && t.phase === 1) {
        t.phase = 2;
        if (t.isStop) {
          t.targetY = t.y + (Math.random() > 0.5 ? -150 : 150);
        }
      }

      if (t.x >= Z_VECTORIZE && t.phase === 2 && !t.isStop) {
        t.phase = 3;
        t.targetY = 275;
      }

      t.y += (t.targetY - t.y) * 0.1;

      if (t.isStop && t.phase >= 2) {
        t.opacity -= 0.02 * animationSpeed;
        if (t.opacity < 0) t.opacity = 0;
      }

      if (t.x >= Z_FILTER && t.active && !t.isStop) {
        activeCount++;
      }
    }

    setCleanCount(activeCount);

    if (allDone) {
      setIsProcessing(false);
      setStatus('PEMROSESAN SELESAI');
      setStatusColor('text-emerald-400');
      setStatusBg('bg-emerald-900');
      setStatusBorder('border-emerald-400');
    }
  }, [isProcessing, animationSpeed]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw zones
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 50, Z_TOKENIZE, 450);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(Z_TOKENIZE, 50, Z_FILTER - Z_TOKENIZE, 450);
    ctx.fillStyle = '#312e81';
    ctx.fillRect(Z_FILTER, 50, Z_VECTORIZE - Z_FILTER, 450);
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(Z_VECTORIZE, 50, 800 - Z_VECTORIZE, 450);

    // Draw separators
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    const zones = [
      { x: Z_TOKENIZE, label: '1. Tokenisasi (Lowercasing)' },
      { x: Z_FILTER, label: '2. Filter & Stemming' },
      { x: Z_VECTORIZE, label: '3. Vektorisasi (Word2Vec)' }
    ];

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px "Space Grotesk"';
    ctx.textAlign = 'left';

    zones.forEach(z => {
      ctx.beginPath();
      ctx.moveTo(z.x, 50);
      ctx.lineTo(z.x, 500);
      ctx.stroke();
      ctx.save();
      ctx.translate(z.x + 10, 80);
      ctx.fillText(z.label, 0, 0);
      ctx.restore();
    });

    ctx.setLineDash([]);

    // Draw conveyor line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 275);
    ctx.lineTo(800, 275);
    ctx.stroke();

    // Draw tokens
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const t of tokensRef.current) {
      if (t.x < 0 || t.opacity <= 0) continue;

      let displayText = t.original;
      let bgColor = '#e2e8f0';
      let textColor = '#0f172a';
      let borderColor = '#94a3b8';
      let fontStyle = 'bold 14px "Space Grotesk"';

      if (t.phase === 1) {
        displayText = t.lower;
        bgColor = '#bae6fd';
        borderColor = '#0284c7';
      } else if (t.phase === 2) {
        if (t.isStop) {
          displayText = t.lower;
          bgColor = '#fecdd3';
          borderColor = '#e11d48';
          textColor = '#881337';
        } else {
          displayText = t.stem;
          bgColor = '#c7d2fe';
          borderColor = '#6d28d9';
        }
      } else if (t.phase === 3) {
        displayText = t.vectorId;
        bgColor = '#064e3b';
        borderColor = '#34d399';
        textColor = '#34d399';
        fontStyle = 'bold 16px "Courier New"';
      }

      ctx.globalAlpha = t.opacity;
      ctx.font = fontStyle;
      const textWidth = ctx.measureText(displayText).width;
      const boxW = textWidth + 20;
      const boxH = 30;

      ctx.fillStyle = bgColor;
      ctx.fillRect(t.x - boxW / 2, t.y - boxH / 2, boxW, boxH);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(t.x - boxW / 2, t.y - boxH / 2, boxW, boxH);
      ctx.fillStyle = textColor;
      ctx.fillText(displayText, t.x, t.y);
      ctx.globalAlpha = 1.0;
    }
  }, []);

  useEffect(() => {
    const loop = () => {
      updatePhysics();
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updatePhysics, draw]);

  const handlePreset = (text: string) => {
    setInputText(text);
    updateInitialStats(text);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    updateInitialStats(text);
  };

  const speedLabels = ['Sangat Lambat', 'Normal', 'Cepat', 'Sangat Cepat', 'Instan'];

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-fuchsia-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">KECERDASAN BUATAN (AI)</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: CHATBOT NLP
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Simulasi Pemrosesan Bahasa Manusia Menjadi Data Token (Vektor)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#d946ef] text-md transform rotate-2 z-30 uppercase">
            Input Pengguna
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-slate-700">Pesan Manusia (Raw Text):</label>
              <textarea
                value={inputText}
                onChange={handleInputChange}
                className="w-full p-3 border-4 border-black rounded-lg resize-none h-24 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-fuchsia-300"
                placeholder="Ketik kalimat di sini..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-slate-700">Pilih Preset Cepat:</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => handlePreset(preset.text)}
                    className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-fuchsia-100 hover:bg-fuchsia-200 py-2 text-[10px] font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-emerald-900 uppercase text-[10px]">Kecepatan Pipeline</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-emerald-700">{speedLabels[animationSpeed - 1]}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-black pt-4">
              <button
                onClick={startPipeline}
                disabled={isProcessing || inputText.trim() === ''}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#064e3b] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${isProcessing ? 'bg-slate-300 hover:bg-slate-200' : 'bg-emerald-400 hover:bg-emerald-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                JALANKAN PIPELINE NLP
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-fuchsia-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-fuchsia-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">METRIK PEMROSESAN DATA</h4>

            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Karakter</span>
                <span className="text-lg font-black text-white">{charCount}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Token Awal</span>
                <span className="text-lg font-black text-white">{tokenCount}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-fuchsia-900 rounded flex flex-col items-center relative overflow-hidden">
                <span className="text-[9px] font-bold uppercase text-fuchsia-400 mb-1">Token Aktif</span>
                <span className="text-lg font-black text-fuchsia-400 relative z-10">{cleanCount}</span>
              </div>
            </div>

            <div className={`${statusBg} p-2 border-2 border-dashed ${statusBorder} text-center flex flex-col items-center justify-center min-h-[40px] transition-colors duration-300 rounded`}>
              <span className={`text-xs font-black uppercase tracking-widest ${statusColor}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="border-8 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-0 relative flex flex-col items-center w-full h-[550px] overflow-hidden"
            style={{
              backgroundColor: '#0f172a',
              backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-slate-900 font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Pabrik Pemrosesan Data (Pipeline)
            </span>

            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              className="w-full h-full block"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-fuchsia-400 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Langkah-Langkah Mesin Membaca Bahasa
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-sky-400 border-b-2 border-slate-600 pb-1 mb-2">1. Tokenisasi</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Mesin tidak membaca kalimat secara utuh. Langkah pertama adalah <b>memecah kalimat</b> menjadi potongan-potongan kecil yang disebut "Token" (biasanya berupa kata, suku kata, atau tanda baca). Proses ini juga mengubah semua huruf menjadi huruf kecil (lowercase).
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-rose-400 border-b-2 border-slate-600 pb-1 mb-2">2. Penyaringan & Stemming</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Tidak semua kata memiliki makna inti. Kata hubung seperti <i>"yang, di, ke, dari, saya"</i> dibuang (<b>Stopword Removal</b>). Kemudian, kata berimbuhan diubah ke kata dasarnya (<b>Stemming</b>), misalnya <i>"memesan"</i> menjadi <i>"pesan"</i>. Ini sangat menghemat memori komputer.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-emerald-400 border-b-2 border-slate-600 pb-1 mb-2">3. Vektorisasi (Encoding)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              AI dan algoritma Matematika tidak mengerti teks. Oleh karena itu, setiap token unik dicocokkan dengan Kamus (Vocabulary) dan diubah menjadi kumpulan <b>Angka (Vektor)</b>. Vektor angka inilah yang akan dikalkulasi oleh jaringan saraf tiruan (Neural Network) untuk menentukan balasan Chatbot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}