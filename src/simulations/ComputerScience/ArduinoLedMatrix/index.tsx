import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_DATA: QuizQuestion[] = [
  {
    question: "1. Mengapa menggunakan IC MAX7219 untuk mengontrol layar LED 8x8 (64 lampu) lebih efisien daripada menghubungkan LED langsung ke Arduino?",
    options: ["Karena lampu LED MAX7219 lebih terang", "Karena MAX7219 hanya butuh 3 pin data (DIN, CS, CLK) untuk mengontrol 64 LED (Multiplexing)", "Karena Arduino tidak memiliki arus listrik", "Karena MAX7219 terbuat dari emas"],
    answer: 1,
  },
  {
    question: "2. Pada protokol komunikasi SPI di modul ini, jalur mana yang berfungsi sebagai pengirim data bit pola gambar dari Arduino ke Modul?",
    options: ["VCC (Power)", "CLK (Clock)", "DIN (Data In)", "GND (Ground)"],
    answer: 2,
  },
  {
    question: "3. Apa yang terjadi pada layar jika Anda hanya menghubungkan Kabel Power (VCC & GND) tanpa Kabel Data, lalu mengirim pola gambar?",
    options: ["Layar akan menampilkan gambar dengan normal", "Layar akan meledak", "Layar tetap mati/kosong karena tidak ada data yang masuk ke chip", "Layar akan menyala berkedip acak"],
    answer: 2,
  },
  {
    question: "4. Teknik di mana baris dan kolom LED dinyalakan bergantian secara sangat cepat sehingga mata manusia melihatnya sebagai gambar utuh disebut...",
    options: ["Multitasking", "Multiplexing", "Overclocking", "Short Circuit"],
    answer: 1,
  },
  {
    question: "5. Library apa yang sering digunakan di Arduino (seperti pada contoh kode) untuk mempermudah penulisan program layar MAX7219?",
    options: ["LiquidCrystal.h", "LedControl.h", "Servo.h", "Wire.h"],
    answer: 1,
  },
];

const PATTERNS: Record<string, number[]> = {
  clear: new Array(64).fill(0),
  smile: [
    0, 0, 1, 1, 1, 1, 0, 0,
    0, 1, 0, 0, 0, 0, 1, 0,
    1, 0, 1, 0, 0, 1, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 1, 0, 0, 1, 0, 1,
    1, 0, 0, 1, 1, 0, 0, 1,
    0, 1, 0, 0, 0, 0, 1, 0,
    0, 0, 1, 1, 1, 1, 0, 0,
  ],
  heart: [
    0, 1, 1, 0, 0, 1, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    0, 1, 1, 1, 1, 1, 1, 0,
    0, 0, 1, 1, 1, 1, 0, 0,
    0, 0, 0, 1, 1, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  box: [
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 1, 1, 1, 1, 0, 1,
    1, 0, 1, 0, 0, 1, 0, 1,
    1, 0, 1, 0, 0, 1, 0, 1,
    1, 0, 1, 1, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
  ],
};

const CODE_SNIPPETS: Record<string, string> = {
  clear: "lc.clearDisplay(0);",
  smile: "displayPattern(smileArray);",
  heart: "displayPattern(heartArray);",
  box: "displayPattern(boxArray);",
};

type PatternKey = 'clear' | 'smile' | 'heart' | 'box';

interface SimulationState {
  powerConnected: boolean;
  dataConnected: boolean;
  activePattern: PatternKey;
}

export default function ArduinoLedMatrix() {
  const [state, setState] = useState<SimulationState>({
    powerConnected: false,
    dataConnected: false,
    activePattern: 'clear',
  });

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const togglePower = () => {
    setState(prev => ({ ...prev, powerConnected: !prev.powerConnected }));
  };

  const toggleData = () => {
    setState(prev => ({ ...prev, dataConnected: !prev.dataConnected }));
  };

  const setPattern = (pattern: PatternKey) => {
    setState(prev => ({ ...prev, activePattern: pattern }));
  };

  const canDisplay = state.powerConnected && state.dataConnected;
  const targetPattern = canDisplay ? PATTERNS[state.activePattern] : PATTERNS['clear'];

  const ledElements = useMemo(() => {
    const elements: ReactNode[] = [];
    const padding = 30;
    const startX = 85;
    const startY = 60;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const idx = row * 8 + col;
        const isOn = targetPattern[idx] === 1;
        elements.push(
          <circle
            key={`led_${row}_${col}`}
            cx={startX + col * padding}
            cy={startY + row * padding}
            r={10}
            fill={isOn ? '#ef4444' : '#334155'}
            stroke={isOn ? '#fca5a5' : '#0f172a'}
            style={isOn ? { filter: 'drop-shadow(0px 0px 4px #ef4444)' } : {}}
          />
        );
      }
    }
    return elements;
  }, [targetPattern]);

  const handleAnswerClick = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    if (userAnswers.every((a) => a !== null)) {
      setQuizSubmitted(true);
    }
  };

  const handleRetryQuiz = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const score = userAnswers.reduce<number>((acc, a, i) => {
    if (a === QUIZ_DATA[i].answer) return acc + 1;
    return acc;
  }, 0);

  const allAnswered = userAnswers.every((a) => a !== null);

  const codeSnippet = CODE_SNIPPETS[state.activePattern];
  const codeHighlighted = state.activePattern !== 'clear';

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform -rotate-3 text-indigo-800">
          MIKROKONTROLER & DISPLAY
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
          LAB VIRTUAL: LED MATRIX 8x8
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Membangun Rangkaian Display MAX7219 dan Protokol SPI
        </p>
      </header>

      <div className="neo-box bg-white p-6 w-full max-w-6xl mb-8 flex flex-col gap-6 z-10 relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-slate-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_0px_#000]">
              1. Susun Rangkaian (Wiring)
            </label>
            <div className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 h-full justify-center rounded-xl">
              <div className="flex justify-between items-center bg-white border-2 border-black p-2">
                <span className="font-bold text-xs uppercase">Kabel Power (5V & GND)</span>
                <button
                  onClick={togglePower}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg px-3 py-1 text-xs font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${state.powerConnected ? 'bg-emerald-400 ring-2 ring-black' : 'bg-slate-300'}`}
                >
                  {state.powerConnected ? 'LEPAS' : 'PASANG'}
                </button>
              </div>

              <div className="flex justify-between items-center bg-white border-2 border-black p-2">
                <span className="font-bold text-xs uppercase">Kabel Data (DIN, CS, CLK)</span>
                <button
                  onClick={toggleData}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg px-3 py-1 text-xs font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${state.dataConnected ? 'bg-emerald-400 ring-2 ring-black' : 'bg-slate-300'}`}
                >
                  {state.dataConnected ? 'LEPAS' : 'PASANG'}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-rose-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_0px_#000]">
              2. Kirim Pola Gambar
            </label>
            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] grid grid-cols-2 gap-2 h-full content-center rounded-xl">
              <button
                onClick={() => setPattern('smile')}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-white py-2 text-sm font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${state.activePattern === 'smile' ? 'ring-4 ring-black bg-rose-200' : ''}`}
              >
                SMILE
              </button>
              <button
                onClick={() => setPattern('heart')}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-white py-2 text-sm font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${state.activePattern === 'heart' ? 'ring-4 ring-black bg-rose-200' : ''}`}
              >
                HEART
              </button>
              <button
                onClick={() => setPattern('box')}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-white py-2 text-sm font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${state.activePattern === 'box' ? 'ring-4 ring-black bg-rose-200' : ''}`}
              >
                BOX
              </button>
              <button
                onClick={() => setPattern('clear')}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 py-2 text-sm font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${state.activePattern === 'clear' ? 'ring-4 ring-black bg-rose-200' : ''}`}
              >
                CLEAR
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-indigo-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_0px_#000]">
              3. Kode di Arduino
            </label>
            <div className="bg-[#1e293b] text-[#e2e8f0] p-4 shadow-[4px_4px_0px_0px_#000] text-xs h-full flex flex-col justify-center leading-relaxed border-4 border-black rounded-xl font-mono">
              <span className="text-slate-400">#include &lt;LedControl.h&gt;</span>
              <br />
              <span className="text-slate-400">LedControl lc=LedControl(11,13,10,1);</span>
              <br /><br />
              <span className="text-blue-400">void</span> <span className="text-yellow-200">loop</span>() {'{'}
              <br />
              &nbsp;&nbsp;<span className={`p-1 rounded ${codeHighlighted ? 'bg-yellow-400 text-black font-bold' : ''}`}>{codeSnippet}</span>
              <br />
              {'}'}
            </div>
          </div>
        </div>
      </div>

      <div className="neo-box bg-[#e2e8f0] p-2 md:p-6 relative flex flex-col items-center w-full max-w-6xl z-10 mb-10 overflow-hidden border-8 border-black rounded-xl">
        <div className="absolute top-4 left-4 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform -rotate-2 rounded-lg">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-indigo-700">MEJA KERJA (WORKBENCH)</h2>
        </div>

        <div className="absolute top-4 right-4 z-30 bg-white/95 p-3 md:p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs md:text-sm font-bold uppercase w-60 md:w-80 backdrop-blur-sm rounded-xl">
          <h3 className="text-center font-black border-b-4 border-black pb-2 mb-1 text-slate-800">STATUS KONEKSI</h3>

          <div className="flex justify-between items-center mt-1">
            <span className="text-slate-600">Arus Listrik (VCC/GND)</span>
            <span className={`font-mono font-black ${state.powerConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
              {state.powerConnected ? 'TERHUBUNG (5V)' : 'TERPUTUS'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-700">Jalur Data (SPI)</span>
            <span className={`font-mono font-black ${state.dataConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
              {state.dataConnected ? 'TERHUBUNG (SPI)' : 'TERPUTUS'}
            </span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-dashed border-slate-400 pt-2 mt-1">
            <span className="text-indigo-700">Status Layar</span>
            <span className={`font-mono font-black ${canDisplay && state.activePattern !== 'clear' ? 'text-indigo-600' : 'text-slate-500'}`}>
              {canDisplay && state.activePattern !== 'clear' ? 'AKTIF MENAMPILKAN' : 'OFF / KOSONG'}
            </span>
          </div>
        </div>

        <div className="mt-56 md:mt-16 relative w-full max-w-[1000px] h-[450px] bg-slate-100 border-4 border-black overflow-hidden shadow-[inset_0px_0px_20px_rgba(0,0,0,0.1)] rounded-xl">
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <svg viewBox="0 0 1000 450" className="w-full h-full relative z-20">
            <g transform="translate(50, 80)">
              <rect x="0" y="0" width="350" height="250" fill="#0d9488" stroke="#000" strokeWidth="4" rx="10" />
              <rect x="330" y="20" width="20" height="210" fill="#0f766e" stroke="#000" strokeWidth="2" />

              <rect x="-10" y="20" width="40" height="50" fill="#cbd5e1" stroke="#000" strokeWidth="4" rx="2" />
              <rect x="-10" y="180" width="40" height="40" fill="#1e293b" stroke="#000" strokeWidth="4" rx="2" />

              <rect x="180" y="100" width="100" height="40" fill="#1e293b" stroke="#000" strokeWidth="3" rx="2" />

              <circle cx="120" cy="120" r="30" fill="none" stroke="#fff" strokeWidth="3" />
              <circle cx="105" cy="120" r="10" fill="none" stroke="#fff" strokeWidth="2" />
              <circle cx="135" cy="120" r="10" fill="none" stroke="#fff" strokeWidth="2" />
              <text x="120" y="180" fill="#fff" fontFamily="monospace" fontWeight="bold" fontSize="28" textAnchor="middle">UNO</text>

              <rect x="80" y="10" width="240" height="20" fill="#000" stroke="#333" strokeWidth="2" />

              <circle cx="195" cy="20" r="4" fill="#64748b" />
              <text x="195" y="45" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">13</text>

              <circle cx="215" cy="20" r="4" fill="#64748b" />
              <text x="215" y="45" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">11</text>

              <circle cx="225" cy="20" r="4" fill="#64748b" />
              <text x="225" y="45" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">10</text>

              <rect x="100" y="220" width="120" height="20" fill="#000" stroke="#333" strokeWidth="2" />

              <circle cx="140" cy="230" r="4" fill="#64748b" />
              <text x="140" y="215" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">5V</text>

              <circle cx="160" cy="230" r="4" fill="#64748b" />
              <text x="160" y="215" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">GND</text>
            </g>

            <g transform="translate(550, 40)">
              <rect x="0" y="0" width="340" height="340" fill="#1e293b" stroke="#000" strokeWidth="4" rx="8" />

              <rect x="10" y="120" width="20" height="100" fill="#000" stroke="#333" strokeWidth="2" />
              <g fontSize="10" fill="#fff" fontWeight="bold" textAnchor="start">
                <circle cx="20" cy="135" r="3" fill="#cbd5e1" />
                <text x="35" y="138">VCC</text>

                <circle cx="20" cy="155" r="3" fill="#cbd5e1" />
                <text x="35" y="158">GND</text>

                <circle cx="20" cy="175" r="3" fill="#cbd5e1" />
                <text x="35" y="178">DIN</text>

                <circle cx="20" cy="195" r="3" fill="#cbd5e1" />
                <text x="35" y="198">CS</text>

                <circle cx="20" cy="215" r="3" fill="#cbd5e1" />
                <text x="35" y="218">CLK</text>
              </g>

              <rect x="70" y="45" width="250" height="250" fill="#0f172a" stroke="#000" strokeWidth="2" />
              {ledElements}

              <rect x="150" y="310" width="80" height="20" fill="#000" stroke="#333" strokeWidth="2" />
              <text x="190" y="323" fill="#fff" fontSize="10" fontFamily="monospace" textAnchor="middle">MAX7219</text>
            </g>

            <g opacity={state.powerConnected ? 1 : 0}>
              <path d="M 190 310 Q 250 400, 450 350 T 570 175" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
              <path d="M 210 310 Q 280 430, 480 380 T 570 195" fill="none" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
            </g>

            <g opacity={state.dataConnected ? 1 : 0}>
              <path d="M 265 100 Q 350 20, 480 80 T 570 215" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" />
              <path d="M 275 100 Q 380 -10, 500 60 T 570 235" fill="none" stroke="#eab308" strokeWidth="6" strokeLinecap="round" />
              <path d="M 245 100 Q 320 50, 450 100 T 570 255" fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>

      <div className="bg-indigo-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform rotate-1 text-indigo-800">
          KONSEP ELEKTRONIKA: MULTIPLEXING & KOMUNIKASI SPI
        </h3>
        <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/70 p-4 border-2 border-black border-dashed rounded-xl">
          Mengendalikan 64 lampu LED secara individual akan membutuhkan 64 pin Arduino (yang mana tidak cukup). Solusinya adalah menggunakan teknik <b>Multiplexing</b> dan <b>IC Driver MAX7219</b>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="text-lg font-black text-slate-700 mb-2 border-b-4 border-black pb-2 uppercase">Multiplexing</h4>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              LED disusun dalam bentuk matriks baris dan kolom. Dengan menyalakan satu baris dalam sepersekian milidetik lalu berpindah ke baris berikutnya dengan sangat cepat, mata kita akan melihat seluruh gambar secara utuh (Efek Persistensi Penglihatan).
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="text-lg font-black text-rose-700 mb-2 border-b-4 border-black pb-2 uppercase">Chip MAX7219</h4>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Sebuah chip pintar yang mengambil alih tugas menyalakan dan mematikan matriks dengan cepat. Arduino hanya perlu mengirimkan "pola gambar" yang diinginkan ke chip ini, dan chip yang akan mengatur sisa pekerjaan beratnya.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="text-lg font-black text-blue-700 mb-2 border-b-4 border-black pb-2 uppercase">Protokol Data (SPI)</h4>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Untuk mengirim gambar ke chip MAX7219, Arduino menggunakan 3 kabel data utama:
              <br />
              <b>DIN:</b> Data In (Mengirim bit gambar).
              <br />
              <b>CLK:</b> Clock (Detak penyeimbang sinkronisasi).
              <br />
              <b>CS:</b> Chip Select (Memilih modul aktif).
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform -rotate-1 mb-6 rounded-lg">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP [KUIS]
          </h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] rounded-xl">
          <div className="space-y-6">
            {QUIZ_DATA.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl">
                <h4 className="font-bold text-black mb-4 text-base md:text-lg bg-white inline-block px-2 border-2 border-black">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswerClick(qIdx, oIdx)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg text-left px-4 py-3 text-sm md:text-base font-bold uppercase transition-all ${
                        quizSubmitted
                          ? oIdx === q.answer
                            ? 'bg-green-400 text-black'
                            : userAnswers[qIdx] === oIdx
                            ? 'bg-rose-400 text-black line-through opacity-80'
                            : 'bg-slate-200 opacity-50'
                          : userAnswers[qIdx] === oIdx
                            ? 'bg-black text-white'
                            : 'bg-white hover:bg-indigo-200'
                      } ${!quizSubmitted ? 'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted && allAnswered && (
            <button
              onClick={handleSubmitQuiz}
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-indigo-500 text-white font-black py-4 px-10 text-xl md:text-2xl w-full mt-8 uppercase tracking-widest hover:bg-indigo-600 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              CEK JAWABAN SAYA!
            </button>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-xl ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black rounded-lg">
                {score === 5 ? 'LUAR BIASA! PEMAHAMAN SISTEM DISPLAYMU SEMPURNA.' : score >= 3 ? 'KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI.' : 'JANGAN MENYERAH. BACA LAGI KONSEP MULTIPLEXING DI ATAS.'}
              </p>
              <br />
              <button
                onClick={handleRetryQuiz}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-black text-white py-3 px-8 text-lg uppercase tracking-wider hover:bg-slate-800 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                ULANGI KUIS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}