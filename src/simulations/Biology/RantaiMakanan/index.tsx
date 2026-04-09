import { useState, useRef, useEffect } from 'react';

const quizData = [
  {
    question: '1. Organisme yang dapat membuat makanannya sendiri (fotosintesis) disebut...',
    options: ['Konsumen', 'Produsen', 'Dekomposer', 'Predator'],
    answer: 1,
  },
  {
    question: '2. Kelinci yang memakan rumput termasuk dalam tingkatan trofik...',
    options: ['Produsen', 'Konsumen Primer', 'Konsumen Sekunder', 'Dekomposer'],
    answer: 1,
  },
  {
    question: '3. apa yang terjadi jika populasi rubah (predator) menurun drastis?',
    options: ['Rumput akan habis dimakan kelinci', 'Populasi kelinci akan meningkat drastis', 'Ekosistem menjadi lebih seimbang', 'Tidak ada perubahan'],
    answer: 1,
  },
  {
    question: '4. Siklus predator-mangsa (Lotka-Volterra) menunjukkan bahwa populasi itu...',
    options: ['Selalu stabil', 'Berfluktuasi secara bergelombang', 'Selalu meningkat', 'Selalu menurun'],
    answer: 1,
  },
  {
    question: '5. Jika rumput tersedia melimpah, apa yang akan terjadi pada populasi kelinci?',
    options: ['Tetap sama', 'Menurun karena makanan terlalu banyak', 'Meningkat drastis (ledakan populasi)', 'Mati kelaparan'],
    answer: 2,
  },
];

class Grass {
  x: number;
  y: number;
  size: number;

  constructor(w: number, h: number) {
    this.x = Math.random() * (w - 20) + 10;
    this.y = Math.random() * (h - 20) + 10;
    this.size = 6;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
  }
}

class Agent {
  x: number;
  y: number;
  color: string;
  size: number;
  speed: number;
  energy: number;
  vx: number;
  vy: number;

  constructor(w: number, h: number, color: string, size: number, speed: number, startEnergy: number) {
    this.x = Math.random() * (w - 20) + 10;
    this.y = Math.random() * (h - 20) + 10;
    this.color = color;
    this.size = size;
    this.speed = speed;
    this.energy = startEnergy;

    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  move(w: number, h: number) {
    this.vx += (Math.random() - 0.5) * 0.5;
    this.vy += (Math.random() - 0.5) * 0.5;

    const currentSpeed = Math.hypot(this.vx, this.vy);
    this.vx = (this.vx / currentSpeed) * this.speed;
    this.vy = (this.vy / currentSpeed) * this.speed;

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < this.size) { this.x = this.size; this.vx *= -1; }
    if (this.x > w - this.size) { this.x = w - this.size; this.vx *= -1; }
    if (this.y < this.size) { this.y = this.size; this.vy *= -1; }
    if (this.y > h - this.size) { this.y = h - this.size; this.vy *= -1; }
  }
}

class Rabbit extends Agent {
  constructor(w: number, h: number) {
    super(w, h, '#ffffff', 5, 1.2, 100);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

class Fox extends Agent {
  constructor(w: number, h: number) {
    super(w, h, '#f97316', 7, 1.8, 200);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x - this.size, this.y - this.size / 2);
    ctx.lineTo(this.x + this.size, this.y - this.size / 2);
    ctx.lineTo(this.x, this.y + this.size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

export default function RantaiMakanan() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [counts, setCounts] = useState({ grass: 0, rabbit: 0, fox: 0 });
  const [status, setStatus] = useState('Siklus Alami Berjalan');
  const [historyData, setHistoryData] = useState<{g: number; r: number; f: number}[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizData.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const frameCountRef = useRef(0);
  const grassesRef = useRef<Grass[]>([]);
  const rabbitsRef = useRef<Rabbit[]>([]);
  const foxesRef = useRef<Fox[]>([]);
  const reqRef = useRef<number>(0);

  const MAX_GRASS = 300;
  const GRASS_SPAWN_RATE = 3;
  const RABBIT_ENERGY_LOSS = 0.15;
  const RABBIT_EAT_GAIN = 40;
  const RABBIT_REPRODUCE = 180;
  const FOX_ENERGY_LOSS = 0.4;
  const FOX_EAT_GAIN = 120;
  const FOX_REPRODUCE = 350;
  const MAX_HISTORY = 100;

  const distance = (a: {x: number; y: number}, b: {x: number; y: number}) => Math.hypot(a.x - b.x, a.y - b.y);

  const initEcosystem = (w: number, h: number) => {
    grassesRef.current = [];
    rabbitsRef.current = [];
    foxesRef.current = [];
    setHistoryData([]);

    for (let i = 0; i < 100; i++) grassesRef.current.push(new Grass(w, h));
    for (let i = 0; i < 20; i++) rabbitsRef.current.push(new Rabbit(w, h));
    for (let i = 0; i < 5; i++) foxesRef.current.push(new Fox(w, h));
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      if (grassesRef.current.length === 0) {
        initEcosystem(canvas.width, canvas.height);
      }
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      if (isRunning) {
        frameCountRef.current++;

        if (frameCountRef.current % GRASS_SPAWN_RATE === 0 && grassesRef.current.length < MAX_GRASS) {
          grassesRef.current.push(new Grass(w, h));
          if (Math.random() > 0.5 && grassesRef.current.length > 1) {
            const parent = grassesRef.current[Math.floor(Math.random() * grassesRef.current.length)];
            const newG = new Grass(w, h);
            newG.x = Math.max(10, Math.min(w - 10, parent.x + (Math.random() - 0.5) * 30));
            newG.y = Math.max(10, Math.min(h - 10, parent.y + (Math.random() - 0.5) * 30));
            grassesRef.current.push(newG);
          }
        }

        for (let i = rabbitsRef.current.length - 1; i >= 0; i--) {
          const r = rabbitsRef.current[i];
          r.move(w, h);
          r.energy -= RABBIT_ENERGY_LOSS;

          if (r.energy <= 0) {
            rabbitsRef.current.splice(i, 1);
            continue;
          }

          for (let j = grassesRef.current.length - 1; j >= 0; j--) {
            if (distance(r, grassesRef.current[j]) < r.size + 4) {
              grassesRef.current.splice(j, 1);
              r.energy += RABBIT_EAT_GAIN;
              break;
            }
          }

          if (r.energy > RABBIT_REPRODUCE) {
            r.energy /= 2;
            rabbitsRef.current.push(new Rabbit(w, h));
          }
        }

        for (let i = foxesRef.current.length - 1; i >= 0; i--) {
          const f = foxesRef.current[i];
          f.move(w, h);
          f.energy -= FOX_ENERGY_LOSS;

          if (f.energy <= 0) {
            foxesRef.current.splice(i, 1);
            continue;
          }

          for (let j = rabbitsRef.current.length - 1; j >= 0; j--) {
            if (distance(f, rabbitsRef.current[j]) < f.size + rabbitsRef.current[j].size) {
              rabbitsRef.current.splice(j, 1);
              f.energy += FOX_EAT_GAIN;
              break;
            }
          }

          if (f.energy > FOX_REPRODUCE) {
            f.energy /= 2;
            foxesRef.current.push(new Fox(w, h));
          }
        }

        if (grassesRef.current.length === 0 && Math.random() < 0.05) grassesRef.current.push(new Grass(w, h));
        if (rabbitsRef.current.length === 0 && Math.random() < 0.01) rabbitsRef.current.push(new Rabbit(w, h));
      }

      ctx.clearRect(0, 0, w, h);
      grassesRef.current.forEach(g => g.draw(ctx));
      rabbitsRef.current.forEach(r => r.draw(ctx));
      foxesRef.current.forEach(f => f.draw(ctx));

      setCounts({
        grass: grassesRef.current.length,
        rabbit: rabbitsRef.current.length,
        fox: foxesRef.current.length,
      });

      let newStatus = 'Siklus Alami Berjalan';

      if (foxesRef.current.length === 0 && rabbitsRef.current.length > 50) {
        newStatus = 'Ledakan Hama (Tanpa Predator)';
      } else if (rabbitsRef.current.length === 0 && foxesRef.current.length > 0) {
        newStatus = 'Krisis Pangan Predator';
      } else if (grassesRef.current.length < 20 && rabbitsRef.current.length > 0) {
        newStatus = 'Krisis Vegetasi (Overgrazing)';
      }

      setStatus(newStatus);

      if (frameCountRef.current % 15 === 0) {
        setHistoryData(prev => {
          const newData = [...prev, { g: grassesRef.current.length, r: rabbitsRef.current.length, f: foxesRef.current.length }];
          if (newData.length > MAX_HISTORY) newData.shift();
          return newData;
        });
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isRunning]);

  const selectAnswer = (qIndex: number, optIndex: number) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[qIndex] = optIndex;
      return newAnswers;
    });
  };

  const calculateScore = () => {
    setQuizSubmitted(true);
    let s = 0;
    userAnswers.forEach((ans, index) => {
      if (ans === quizData[index].answer) s++;
    });
    setScore(s);
  };

  const retryQuiz = () => {
    setUserAnswers(new Array(quizData.length).fill(null));
    setQuizSubmitted(false);
    setScore(0);
  };

  const addGrass = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      for (let i = 0; i < 50; i++) grassesRef.current.push(new Grass(canvas.width, canvas.height));
    }
  };

  const addRabbit = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      for (let i = 0; i < 10; i++) rabbitsRef.current.push(new Rabbit(canvas.width, canvas.height));
    }
  };

  const addFox = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      for (let i = 0; i < 5; i++) foxesRef.current.push(new Fox(canvas.width, canvas.height));
    }
  };

  const disaster = () => {
    rabbitsRef.current = rabbitsRef.current.filter(() => Math.random() > 0.5);
    foxesRef.current = foxesRef.current.filter(() => Math.random() > 0.5);
  };

  const resetSim = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      initEcosystem(canvas.width, canvas.height);
    }
  };

  const maxVal = Math.max(100, ...historyData.map(d => Math.max(d.g, d.r, d.f)));

  const getPoints = (key: 'g' | 'r' | 'f') => {
    return historyData.map((d, i) => {
      const x = (i / MAX_HISTORY) * 100;
      const y = 100 - (d[key] / maxVal * 100);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">EKOLOGI & POPULASI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: RANTAI MAKANAN</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Interaksi Produsen, Herbivora, dan Karnivora
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30 uppercase">
            Panel Kendali
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-slate-500">Intervensi Alam</label>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={addGrass} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 px-3 text-xs bg-emerald-200 hover:bg-emerald-300 text-black transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  🌱 Tumbuhkan Rumput
                </button>
                <button onClick={addRabbit} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 px-3 text-xs bg-slate-100 hover:bg-slate-200 text-black transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  🐇 Lepasliarkan 10 Kelinci
                </button>
                <button onClick={addFox} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 px-3 text-xs bg-orange-200 hover:bg-orange-300 text-black transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  🦊 Lepasliarkan 5 Rubah
                </button>
                <button onClick={disaster} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold cursor-pointer uppercase py-2 px-3 text-xs bg-rose-500 hover:bg-rose-600 text-white mt-2 border-dashed transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  ⚠️ Wabah Penyakit
                </button>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-all font-bold cursor-pointer uppercase py-3 text-sm flex-1 active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${
                  isRunning ? 'bg-yellow-400' : 'bg-emerald-400'
                } text-black`}
              >
                {isRunning ? '⏸️ JEDA' : '▶️ LANJUTKAN'}
              </button>
              <button onClick={resetSim} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 hover:bg-slate-300 font-bold cursor-pointer uppercase py-3 px-4 text-sm text-black">
                🔄 RESET
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-emerald-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA POPULASI</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800 p-2 border-2 border-emerald-500 rounded flex flex-col items-center">
                <span className="text-[16px]">🌱</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Rumput</span>
                <span className="text-xl font-black text-emerald-400">{counts.grass}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-white rounded flex flex-col items-center">
                <span className="text-[16px]">🐇</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Kelinci</span>
                <span className="text-xl font-black text-white">{counts.rabbit}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-orange-500 rounded flex flex-col items-center">
                <span className="text-[16px]">🦊</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Rubah</span>
                <span className="text-xl font-black text-orange-400">{counts.fox}</span>
              </div>
            </div>
            <div className="mt-3 text-center bg-slate-800 p-2 border-2 border-dashed border-slate-600">
              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Status</span>
              <span className="text-xs font-black text-yellow-300 uppercase">{status}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 p-0 relative flex w-full h-[350px] overflow-hidden border-8 border-black rounded-xl" style={{ backgroundColor: '#f1f5f9', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">
              Kawasan Cagar Alam
            </span>
            <canvas ref={canvasRef} className="w-full h-full block z-10" />
          </div>

          <div className="bg-slate-900 p-4 relative flex flex-col w-full h-[200px] border-4 border-black rounded-xl">
            <h4 className="font-black text-white text-[10px] mb-2 uppercase tracking-widest border-b-2 border-slate-700 pb-1">GRAFIK HISTORI POPULASI</h4>
            <div className="relative w-full h-full">
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-slate-500 font-bold py-1">
                <span>Max</span>
                <span>0</span>
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute left-6 right-0 top-1 bottom-4 w-[calc(100%-24px)] h-[calc(100%-20px)] border-l-2 border-b-2 border-slate-700">
                <polyline fill="none" stroke="#34d399" strokeWidth="2" points={getPoints('g')} />
                <polyline fill="none" stroke="#ffffff" strokeWidth="2" points={getPoints('r')} />
                <polyline fill="none" stroke="#f97316" strokeWidth="2" points={getPoints('f')} />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-emerald-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan: Siklus Predator-Mangsa 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">PRODUSEN (RUMPUT)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Tingkat trofik pertama. Tumbuh secara otomatis menyerap energi matahari. Jika herbivora terlalu sedikit, rumput akan tumbuh lebat.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-slate-600 border-b-2 border-black pb-1 mb-2">KONSUMEN I (KELINCI)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Herbivora pemakan produsen. Jika rumput melimpah, populasi mereka akan meledak. Namun, ledakan populasi akan menghabiskan rumput.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-orange-600 border-b-2 border-black pb-1 mb-2">KONSUMEN II (RUBAH)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Karnivora predator. Populasi mereka dikendalikan oleh jumlah mangsa. Jika kelinci habis, rubah akan mati kelaparan.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <h4 className="font-black text-md uppercase text-yellow-300 mb-2">Persamaan Lotka-Volterra</h4>
          <p className="text-sm font-semibold leading-relaxed text-slate-300">
            Keseimbangan ini <b>berupa gelombang/siklus</b>. Populasi Mangsa Naik ➡️ Predator Naik ➡️ Mangsa Habis ➡️ Predator Mati ➡️ Mangsa Bebas Berkembang. Siklus ini terus berulang!
          </p>
        </div>
      </div>

      <div className="mb-12 bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">EVALUASI RANTAI MAKANAN [KUIS]</h3>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6">
            {quizData.map((q, qIndex) => (
              <div key={qIndex} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
                <h4 className="font-bold mb-3 text-sm uppercase">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, optIndex) => (
                    <button
                      key={optIndex}
                      onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold text-left px-4 py-2 text-xs transition-all ${
                        quizSubmitted
                          ? optIndex === q.answer
                            ? 'bg-green-400 text-black'
                            : userAnswers[qIndex] === optIndex
                            ? 'bg-rose-400 text-black line-through'
                            : 'bg-white opacity-50'
                          : userAnswers[qIndex] === optIndex
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-yellow-200 text-black cursor-pointer'
                      }`}
                    >
                      {quizSubmitted && optIndex === q.answer && '[ BENAR ] '}
                      {quizSubmitted && userAnswers[qIndex] === optIndex && optIndex !== q.answer && '[ SALAH ] '}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!quizSubmitted && userAnswers.every((a) => a !== null) && (
              <div className="text-center mt-8">
                <button
                  onClick={calculateScore}
                  className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg bg-slate-900 text-white font-bold py-3 px-10 text-xl uppercase tracking-widest hover:bg-slate-800 active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
                >
                  KIRIM JAWABAN!
                </button>
              </div>
            )}
          </div>
          {quizSubmitted && (
            <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
              <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                {score === 5 ? 'Sempurna! Anda mengerti ekosistem!' : 'Bagus! Coba eksplorasi lagi simulasinya.'}
              </p>
              <br />
              <button
                onClick={retryQuiz}
                className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg bg-black text-white font-bold py-3 px-8 text-lg uppercase tracking-wider active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
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
