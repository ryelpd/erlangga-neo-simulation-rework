import { useState, useEffect, useRef } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const QUIZ_DATA: QuizQuestion[] = [
  {
    question: "1. Pada board Arduino, kaki panjang LED (Anoda / Positif) harus dihubungkan menuju...",
    options: ["Pin GND (Ground)", "Pin Digital (seperti Pin 13)", "Kaki pendek LED", "Terserah di mana saja"],
    answer: 1,
  },
  {
    question: "2. Apa fungsi pemasangan komponen Resistor pada rangkaian LED di atas?",
    options: ["Untuk membuat lampu berkedip otomatis", "Sebagai sumber energi listrik utama", "Menghambat arus listrik agar LED tidak menerima tegangan berlebih dan rusak", "Mengubah warna LED menjadi merah"],
    answer: 2,
  },
  {
    question: "3. Perintah kode 'digitalWrite(13, HIGH);' memerintahkan mikrokontroler untuk...",
    options: ["Membaca input dari sensor", "Memutus tegangan menjadi 0 Volt", "Mengeluarkan tegangan 5 Volt pada pin 13", "Mereset ulang program"],
    answer: 2,
  },
  {
    question: "4. Apa yang terjadi jika kabel dari Pin 13 dihubungkan, kabel GND dilepas, lalu diberikan perintah HIGH?",
    options: ["Lampu menyala terang", "Lampu rusak terbakar", "Lampu tetap mati karena rangkaian terbuka (arus tidak bisa kembali ke sumber)", "Arduino akan meledak"],
    answer: 2,
  },
  {
    question: "5. Jika Anda menggunakan mode 'Kabel Langsung' dari Pin 13 ke LED dan memberikan sinyal HIGH, LED menjadi rusak. Fenomena ini dapat dijelaskan dengan...",
    options: ["Hukum Newton", "Hukum Pascal", "Hukum Ohm", "Hukum Kekekalan Energi"],
    answer: 2,
  },
];

interface SimulationState {
  gndConnected: boolean;
  powerConnection: 'none' | 'resistor' | 'direct';
  pin13State: 'LOW' | 'HIGH';
  isBlinking: boolean;
  ledBroken: boolean;
}

export default function ArduinoLed() {
  const [state, setState] = useState<SimulationState>({
    gndConnected: false,
    powerConnection: 'none',
    pin13State: 'LOW',
    isBlinking: false,
    ledBroken: false,
  });

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.isBlinking) {
      blinkIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          pin13State: prev.pin13State === 'HIGH' ? 'LOW' : 'HIGH',
        }));
      }, 1000);
    } else {
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
      }
    }

    return () => {
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
      }
    };
  }, [state.isBlinking]);

  const circuitClosed = state.gndConnected && state.powerConnection !== 'none';

  useEffect(() => {
    if (circuitClosed && state.pin13State === 'HIGH' && state.powerConnection === 'direct') {
      setState(prev => ({
        ...prev,
        ledBroken: true,
        isBlinking: false,
      }));
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
      }
    }
  }, [circuitClosed, state.pin13State, state.powerConnection]);

  const toggleGND = () => {
    setState(prev => ({ ...prev, gndConnected: !prev.gndConnected }));
  };

  const setPowerConnection = (connection: 'none' | 'resistor' | 'direct') => {
    setState(prev => ({
      ...prev,
      powerConnection: prev.powerConnection === connection ? 'none' : connection,
    }));
  };

  const setPinState = (level: 'LOW' | 'HIGH') => {
    setState(prev => ({
      ...prev,
      pin13State: level,
      isBlinking: false,
    }));
  };

  const toggleBlink = () => {
    setState(prev => ({
      ...prev,
      isBlinking: !prev.isBlinking,
      pin13State: prev.isBlinking ? 'LOW' : prev.pin13State,
    }));
  };

  const resetLED = () => {
    setState(prev => ({
      ...prev,
      ledBroken: false,
      powerConnection: prev.powerConnection === 'direct' ? 'none' : prev.powerConnection,
    }));
  };

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

  const ledIsOn = circuitClosed && state.pin13State === 'HIGH' && !state.ledBroken;

  return (
    <div className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[length:24px_24px] p-4 md:p-8">
      <header className="text-center mb-8 max-w-6xl bg-teal-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform -rotate-3 text-teal-800">
          MIKROKONTROLER & ELEKTRONIKA
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">
          LAB VIRTUAL: ARDUINO UNO
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Membangun Rangkaian Dasar LED dan Memahami Sinyal Digital
        </p>
      </header>

      <div className="neo-box bg-white p-6 w-full max-w-6xl mb-8 flex flex-col gap-6 z-10 relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-slate-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_0px_#000]">
              1. Susun Rangkaian
            </label>
            <div className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 h-full rounded-xl">
              <div className="flex justify-between items-center bg-white border-2 border-black p-2">
                <span className="font-bold text-xs uppercase">Kabel GND (Hitam)</span>
                <button
                  onClick={toggleGND}
                  className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg px-3 py-1 text-xs font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${state.gndConnected ? 'bg-amber-400 ring-2 ring-black' : 'bg-slate-300'}`}
                >
                  {state.gndConnected ? 'LEPAS' : 'PASANG'}
                </button>
              </div>

              <div className="flex flex-col gap-2 bg-white border-2 border-black p-2">
                <span className="font-bold text-xs uppercase">Jalur Power (Pin 13)</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPowerConnection('resistor')}
                    className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${state.powerConnection === 'resistor' ? 'bg-amber-400 ring-2 ring-black' : 'bg-slate-300'}`}
                  >
                    PAKAI RESISTOR
                  </button>
                  <button
                    onClick={() => setPowerConnection('direct')}
                    className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${state.powerConnection === 'direct' ? 'bg-rose-400 text-black ring-2 ring-black' : 'bg-slate-300 text-rose-700'}`}
                  >
                    KABEL LANGSUNG
                  </button>
                </div>
              </div>

              {state.ledBroken && (
                <button
                  onClick={resetLED}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-rose-500 text-white px-3 py-2 text-xs mt-auto uppercase font-bold"
                >
                  Ganti LED yang Rusak
                </button>
              )}
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-yellow-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_0px_#000]">
              2. Beri Perintah (Pin 13)
            </label>
            <div className="bg-yellow-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 h-full justify-center rounded-xl">
              <button
                onClick={() => setPinState('LOW')}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 text-sm font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${!state.isBlinking && state.pin13State === 'LOW' ? 'bg-amber-300 ring-4 ring-black' : 'bg-white'}`}
              >
                MATI (LOW / 0V)
              </button>
              <button
                onClick={() => setPinState('HIGH')}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 text-sm font-bold text-red-600 uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${!state.isBlinking && state.pin13State === 'HIGH' ? 'bg-amber-300 ring-4 ring-black' : 'bg-white'}`}
              >
                NYALA (HIGH / 5V)
              </button>
              <button
                onClick={toggleBlink}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-teal-200 py-2 text-sm font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${state.isBlinking ? 'ring-4 ring-black bg-amber-300' : ''}`}
              >
                JALANKAN KODE BLINK
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <label className="text-sm font-bold text-black uppercase bg-teal-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_0px_#000]">
              3. Kode di Arduino
            </label>
            <div className="bg-[#1e293b] text-[#e2e8f0] p-4 shadow-[4px_4px_0px_0px_#000] text-xs h-full flex flex-col justify-center leading-relaxed border-4 border-black rounded-xl font-mono">
              <span className="text-blue-400">void</span> <span className="text-yellow-200">setup</span>() {'{'}
              <br />
              &nbsp;&nbsp;<span className="text-orange-300">pinMode</span>(<span className="text-purple-300">13</span>, <span className="text-teal-300">OUTPUT</span>);
              <br />
              {'}'}
              <br /><br />
              <span className="text-blue-400">void</span> <span className="text-yellow-200">loop</span>() {'{'}
              <br />
              &nbsp;&nbsp;<span className={`p-1 rounded ${state.pin13State === 'HIGH' ? 'bg-yellow-400 text-black font-bold' : ''}`}>digitalWrite(13, {state.pin13State});</span>
              <br />
              {'}'}
            </div>
          </div>
        </div>
      </div>

      <div className="neo-box bg-[#e2e8f0] p-2 md:p-6 relative flex flex-col items-center w-full max-w-6xl z-10 mb-10 overflow-hidden border-8 border-black rounded-xl">
        <div className="absolute top-4 left-4 z-20 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] transform -rotate-2 rounded-lg">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-teal-700">MEJA KERJA (WORKBENCH)</h2>
        </div>

        <div className="absolute top-4 right-4 z-30 bg-white/95 p-3 md:p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 text-xs md:text-sm font-bold uppercase w-60 md:w-80 backdrop-blur-sm rounded-xl">
          <h3 className="text-center font-black border-b-4 border-black pb-2 mb-1 text-slate-800">STATUS SISTEM</h3>

          <div className="flex justify-between items-center mt-1">
            <span className="text-slate-600">Sirkuit Tertutup?</span>
            <span className={`font-mono font-black ${circuitClosed ? 'text-emerald-600' : 'text-rose-600'}`}>
              {circuitClosed ? 'YA' : 'TIDAK'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-700">Voltase Pin 13</span>
            <span className="font-mono text-blue-700 font-black">{state.pin13State === 'HIGH' ? '5 Volt' : '0 Volt'}</span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-dashed border-slate-400 pt-2 mt-1">
            <span className="text-red-700">Kondisi LED</span>
            <span className={`font-mono font-black ${state.ledBroken ? 'text-black bg-rose-400 px-2' : ledIsOn ? 'text-emerald-600' : 'text-slate-500'}`}>
              {state.ledBroken ? 'RUSAK' : ledIsOn ? 'MENYALA' : 'MATI'}
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

              <circle cx="175" cy="20" r="4" fill="#64748b" />
              <text x="175" y="45" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">GND</text>

              <circle cx="195" cy="20" r="4" fill="#64748b" />
              <text x="195" y="45" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">13</text>

              <rect x="205" y="60" width="10" height="15" fill={state.pin13State === 'HIGH' ? '#ef4444' : '#fcd34d'} stroke="#000" strokeWidth="2" />
              <text x="210" y="85" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">L</text>

              <rect x="100" y="220" width="200" height="20" fill="#000" stroke="#333" strokeWidth="2" />
            </g>

            <g transform="translate(500, 100)">
              <rect x="0" y="0" width="450" height="200" fill="#f8fafc" stroke="#000" strokeWidth="4" rx="5" />
              <rect x="20" y="90" width="410" height="20" fill="#cbd5e1" stroke="#000" strokeWidth="2" />

              <line x1="20" y1="20" x2="430" y2="20" stroke="#ef4444" strokeWidth="3" />
              <line x1="20" y1="180" x2="430" y2="180" stroke="#3b82f6" strokeWidth="3" />

              <rect x="95" y="40" width="10" height="45" fill="#e2e8f0" stroke="#94a3b8" rx="2" />
              <circle cx="100" cy="50" r="3" fill="#333" />
              <circle cx="100" cy="70" r="3" fill="#333" />

              <rect x="145" y="40" width="10" height="45" fill="#e2e8f0" stroke="#94a3b8" rx="2" />
              <circle cx="150" cy="50" r="3" fill="#333" />
              <circle cx="150" cy="70" r="3" fill="#333" />

              <rect x="255" y="40" width="10" height="45" fill="#e2e8f0" stroke="#94a3b8" rx="2" />
              <circle cx="260" cy="70" r="3" fill="#333" />
            </g>

            <path
              d="M 225 100 Q 300 20, 450 100 T 650 170"
              fill="none"
              stroke="#1e293b"
              strokeWidth="8"
              strokeLinecap="round"
              opacity={state.gndConnected ? 1 : 0}
            />

            <path
              d="M 245 100 Q 350 -20, 450 60 T 600 170"
              fill="none"
              stroke="#ef4444"
              strokeWidth="8"
              strokeLinecap="round"
              opacity={state.powerConnection === 'direct' ? 1 : 0}
            />

            <path
              d="M 245 100 Q 400 -20, 500 80 T 760 170"
              fill="none"
              stroke="#ef4444"
              strokeWidth="8"
              strokeLinecap="round"
              opacity={state.powerConnection === 'resistor' ? 1 : 0}
            />

            <g transform="translate(600, 170)" opacity={state.powerConnection === 'resistor' ? 1 : 0}>
              <line x1="0" y1="0" x2="30" y2="0" stroke="#94a3b8" strokeWidth="4" />
              <line x1="130" y1="0" x2="160" y2="0" stroke="#94a3b8" strokeWidth="4" />
              <rect x="30" y="-10" width="100" height="20" fill="#fcd34d" stroke="#000" strokeWidth="3" rx="5" />
              <rect x="45" y="-10" width="8" height="20" fill="#78350f" />
              <rect x="65" y="-10" width="8" height="20" fill="#000" />
              <rect x="85" y="-10" width="8" height="20" fill="#ef4444" />
              <rect x="110" y="-10" width="8" height="20" fill="#d4af37" />
              <text x="80" y="-15" fontSize="12" fontWeight="bold" textAnchor="middle">220 Ω</text>
            </g>

            <g transform="translate(600, 150)">
              <path d="M 15 -30 L 15 -15 L 0 0" fill="none" stroke="#94a3b8" strokeWidth="4" />
              <line x1="35" y1="-30" x2="50" y2="0" stroke="#94a3b8" strokeWidth="4" />

              <path
                d="M 5 -30 C 5 -70, 45 -70, 45 -30 L 45 -25 L 5 -25 Z"
                fill={state.ledBroken ? '#1e293b' : ledIsOn ? '#ef4444' : '#b91c1c'}
                stroke="#000"
                strokeWidth="3"
                style={ledIsOn ? { filter: 'drop-shadow(0px 0px 15px #ef4444) drop-shadow(0px 0px 5px #fca5a5)' } : {}}
              />
              <rect x="0" y="-25" width="50" height="5" fill={state.ledBroken ? '#991b1b' : '#991b1b'} stroke="#000" strokeWidth="3" />
              <text x="25" y="-60" fontSize="24" textAnchor="middle" opacity={state.ledBroken ? 1 : 0}>💥</text>
            </g>
          </svg>
        </div>
      </div>

      <div className="bg-amber-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform rotate-1 text-amber-800">
          KONSEP ELEKTRONIKA: RANGKAIAN & SINYAL DIGITAL
        </h3>
        <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/70 p-4 border-2 border-black border-dashed rounded-xl">
          Agar lampu LED dapat menyala, diperlukan dua syarat utama: sebuah <b>Rangkaian Tertutup</b> (Closed Loop) dan pemberian tegangan yang sesuai melalui <b>Sinyal Digital</b>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="text-lg font-black text-slate-700 mb-2 border-b-4 border-black pb-2 uppercase">Sirkuit Tertutup</h4>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Arus listrik hanya mengalir jika ada jalan memutar yang utuh dari Kutub Positif (sumber tegangan, misal Pin 13) melewati komponen (LED) dan kembali ke Kutub Negatif (Ground / GND). Jika ada satu kabel terputus, arus berhenti.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="text-lg font-black text-red-700 mb-2 border-b-4 border-black pb-2 uppercase">Fungsi Resistor</h4>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Pin digital Arduino mengeluarkan tegangan <b>5 Volt</b>. Namun, LED merah biasanya hanya mampu menahan ~2 Volt. Sesuai <b>Hukum Ohm (V = I × R)</b>, kita butuh Resistor sebagai "penghambat" agar LED tidak kelebihan arus dan pecah/terbakar.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl">
            <h4 className="text-lg font-black text-blue-700 mb-2 border-b-4 border-black pb-2 uppercase">Sinyal Digital (I/O)</h4>
            <p className="text-sm font-semibold text-slate-800 text-justify">
              Mikrokontroler bekerja dengan logika digital 1 dan 0.
              <br />
              <b>HIGH (1):</b> Arduino menyalurkan tegangan 5V ke komponen.
              <br />
              <b>LOW (0):</b> Arduino memutus tegangan (0V).
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-teal-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl">
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
                            : 'bg-white hover:bg-teal-200'
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
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-teal-500 text-black font-black py-4 px-10 text-xl md:text-2xl w-full mt-8 uppercase tracking-widest hover:bg-teal-600 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              CEK JAWABAN SAYA!
            </button>
          )}

          {quizSubmitted && (
            <div className={`mt-8 text-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-xl ${score === 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-yellow-300' : 'bg-rose-400'}`}>
              <h4 className="text-3xl font-black text-black mb-2 uppercase">NILAI AKHIR: {score}/5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black rounded-lg">
                {score === 5 ? 'LUAR BIASA! PEMAHAMAN ELEKTRONIKAMU SEMPURNA.' : score >= 3 ? 'KERJA BAGUS! TAPI MASIH BISA DIPERBAIKI.' : 'JANGAN MENYERAH. BACA LAGI KONSEP RANGKAIAN DI ATAS.'}
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