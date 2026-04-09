import { useState, useRef, useEffect, useCallback } from 'react';

interface Wave {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

const FORK_A_X = 250;
const FORK_B_X = 550;
const FORK_Y = 350;

export default function ResonansiBunyi() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  
  const [freqA, setFreqA] = useState(440);
  const [freqB, setFreqB] = useState(440);
  const [isVacuum, setIsVacuum] = useState(false);
  const [energyB, setEnergyB] = useState(0);
  const [resonanceStatus, setResonanceStatus] = useState('MENUNGGU SUMBER BUNYI');
  const [resonanceStatusColor, setResonanceStatusColor] = useState('text-slate-500');
  const [barColor, setBarColor] = useState('bg-emerald-500');
  
  const wavesRef = useRef<Wave[]>([]);
  const energyARef = useRef(0);
  const energyBRef = useRef(0);
  const freqARef = useRef(440);
  const freqBRef = useRef(440);
  const isVacuumRef = useRef(false);
  const hammerActionRef = useRef(0);
  const canvasSizeRef = useRef({ width: 800, height: 600 });

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvasSizeRef.current = { width: canvas.width, height: canvas.height };
  }, []);

  const drawTuningFork = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, energy: number, frequency: number, colorStr: string) => {
    const wobble = energy > 0.1 ? Math.sin(Date.now() * frequency * 0.0001) * (energy / 15) : 0;

    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(x - 40, y + 100, 80, 100);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x, y + 140, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.rect(x - 5, y + 50, 10, 50);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText(frequency + ' Hz', x, y + 185);

    ctx.beginPath();
    ctx.arc(x, y + 50, 20, 0, Math.PI, false);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(x - 25, y + 50);
    ctx.lineTo(x - 25 - wobble, y - 80);
    ctx.lineTo(x - 15 - wobble, y - 80);
    ctx.lineTo(x - 15, y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 15, y + 50);
    ctx.lineTo(x + 15 + wobble, y - 80);
    ctx.lineTo(x + 25 + wobble, y - 80);
    ctx.lineTo(x + 25, y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorStr;
    ctx.fillRect(x - 25 - wobble, y - 80, 10, 20);
    ctx.fillRect(x + 15 + wobble, y - 80, 10, 20);

    return wobble;
  }, []);

  const drawHammer = useCallback((ctx: CanvasRenderingContext2D, p: number) => {
    const hX = FORK_A_X - 100 + (p * 50);
    const hY = FORK_Y - 50 + (Math.sin(p * Math.PI) * -30);
    const angle = p * Math.PI / 4;

    ctx.save();
    ctx.translate(hX, hY);
    ctx.rotate(angle);

    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(-60, -5, 60, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.rect(0, -15, 30, 30);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawPingPongBall = useCallback((ctx: CanvasRenderingContext2D, wobbleRightTine: number) => {
    const anchorX = FORK_B_X + 60;
    const anchorY = FORK_Y - 150;

    let restBallX = FORK_B_X + 25 + 10;
    let restBallY = FORK_Y - 50;

    let ballX = restBallX;
    let ballY = restBallY;

    if (wobbleRightTine > 0.5) {
      ballX += wobbleRightTine * 3;
      ballY -= wobbleRightTine * 0.5;
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(ballX, ballY);
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (wobbleRightTine > 3) {
      ctx.strokeStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(ballX + 15, ballY - 15);
      ctx.lineTo(ballX + 25, ballY - 25);
      ctx.moveTo(ballX + 20, ballY);
      ctx.lineTo(ballX + 30, ballY);
      ctx.moveTo(ballX + 15, ballY + 15);
      ctx.lineTo(ballX + 25, ballY + 25);
      ctx.stroke();
    }
  }, []);

  const updatePhysics = useCallback((dt: number) => {
    let eA = energyARef.current;
    let eB = energyBRef.current;
    const vac = isVacuumRef.current;
    const fA = freqARef.current;
    const fB = freqBRef.current;
    let ham = hammerActionRef.current;

    if (eA > 0) {
      eA -= 5 * dt;
      if (eA < 0) eA = 0;
    }
    if (eB > 0) {
      eB -= 10 * dt;
      if (eB < 0) eB = 0;
    }

    if (eA > 10 && !vac) {
      if (Math.random() < 0.1) {
        wavesRef.current.push({
          x: FORK_A_X,
          y: FORK_Y - 50,
          r: 20,
          opacity: eA / 100
        });
      }
    }

    for (let i = wavesRef.current.length - 1; i >= 0; i--) {
      const w = wavesRef.current[i];
      w.r += 300 * dt;
      w.opacity -= 0.5 * dt;

      if (w.r > 290 && w.r < 310) {
        if (fA === fB && !vac) {
          eB += eA * 0.1 * dt;
          if (eB > 100) eB = 100;
        }
      }

      if (w.opacity <= 0) {
        wavesRef.current.splice(i, 1);
      }
    }

    if (ham > 0 && ham < 1) {
      ham += 5 * dt;
      if (ham >= 1) {
        ham = 0;
        eA = 100;
      }
    }

    energyARef.current = eA;
    energyBRef.current = eB;
    hammerActionRef.current = ham;

    setEnergyB(eB);

    if (vac) {
      setResonanceStatus('RUANG HAMPA (GELOMBANG TIDAK MERAMBAT)');
      setResonanceStatusColor('text-slate-500');
      setBarColor('bg-slate-500');
    } else if (eB > 5) {
      setResonanceStatus('RESONANSI AKTIF (ENERGI TERSALURKAN)');
      setResonanceStatusColor('text-emerald-400');
      setBarColor('bg-emerald-500');
    } else if (eA > 10 && fA !== fB) {
      setResonanceStatus('TIDAK RESONANSI (FREKUENSI BERBEDA)');
      setResonanceStatusColor('text-rose-500');
      setBarColor('bg-rose-500');
    } else {
      setResonanceStatus('MENUNGGU SUMBER BUNYI');
      setResonanceStatusColor('text-slate-500');
    }
  }, []);

  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    const { width, height } = canvasSizeRef.current;

    updatePhysics(dt);

    ctx.clearRect(0, 0, width, height);

    wavesRef.current.forEach(w => {
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, -Math.PI / 3, Math.PI / 3);
      ctx.strokeStyle = `rgba(156, 163, 175, ${Math.max(0, w.opacity)})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, FORK_Y + 200, width, 50);

    drawTuningFork(ctx, FORK_A_X, FORK_Y, energyARef.current, freqARef.current, '#ef4444');
    const wobbleB = drawTuningFork(ctx, FORK_B_X, FORK_Y, energyBRef.current, freqBRef.current, '#3b82f6');

    drawPingPongBall(ctx, wobbleB);

    drawHammer(ctx, hammerActionRef.current);

    animationRef.current = requestAnimationFrame(drawFrame);
  }, [updatePhysics, drawTuningFork, drawHammer, drawPingPongBall]);

  useEffect(() => {
    updateCanvasSize();
    
    const handleResize = () => updateCanvasSize();
    window.addEventListener('resize', handleResize);
    
    animationRef.current = requestAnimationFrame(drawFrame);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawFrame, updateCanvasSize]);

  const handleFreqAChange = (freq: number) => {
    setFreqA(freq);
    freqARef.current = freq;
    energyARef.current = 0;
  };

  const handleFreqBChange = (freq: number) => {
    setFreqB(freq);
    freqBRef.current = freq;
    setEnergyB(0);
    energyBRef.current = 0;
  };

  const handleAir = () => {
    setIsVacuum(false);
    isVacuumRef.current = false;
  };

  const handleVacuum = () => {
    setIsVacuum(true);
    isVacuumRef.current = true;
    wavesRef.current = [];
    setEnergyB(0);
    energyBRef.current = 0;
  };

  const handleHit = () => {
    if (hammerActionRef.current === 0) {
      hammerActionRef.current = 0.01;
    }
  };

  const handleStop = () => {
    setEnergyB(0);
    energyARef.current = 0;
    energyBRef.current = 0;
    wavesRef.current = [];
  };

  const getFreqButtonStyle = (type: 'A' | 'B', currentFreq: number, btnFreq: number) => {
    const isActive = currentFreq === btnFreq;
    const base = "neo-btn py-2 px-1 text-[11px] font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all";
    if (isActive) {
      return `${base} ${type === 'A' ? 'bg-rose-400' : 'bg-blue-400'} text-white ring-4 ring-black`;
    }
    return `${base} bg-white text-slate-700`;
  };

  const getMediumButtonStyle = (isCurrentVacuum: boolean, isVacuumBtn: boolean) => {
    const isActive = isCurrentVacuum === isVacuumBtn;
    const base = "neo-btn py-2 px-1 text-[11px] font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all";
    if (isActive) {
      if (isVacuumBtn) {
        return `${base} bg-slate-800 text-white ring-4 ring-black`;
      }
      return `${base} bg-emerald-300 text-black ring-4 ring-black`;
    }
    return `${base} bg-white text-slate-700`;
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">FISIKA GELOMBANG</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: RESONANSI BUNYI
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Transfer Energi Melalui Gelombang Akustik & Syarat Frekuensi Alami
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md transform rotate-2 z-30 uppercase">
            Panel Eksperimen
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-rose-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-rose-800 mb-1">Frekuensi Garpu Tala A (Sumber)</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleFreqAChange(440)} className={getFreqButtonStyle('A', freqA, 440)}>
                  440 Hz (Nada A)
                </button>
                <button onClick={() => handleFreqAChange(512)} className={getFreqButtonStyle('A', freqA, 512)}>
                  512 Hz (Nada C)
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-blue-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-blue-800 mb-1">Frekuensi Garpu Tala B (Penerima)</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleFreqBChange(440)} className={getFreqButtonStyle('B', freqB, 440)}>
                  440 Hz (Nada A)
                </button>
                <button onClick={() => handleFreqBChange(512)} className={getFreqButtonStyle('B', freqB, 512)}>
                  512 Hz (Nada C)
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-100 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Medium Perambat Udara</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleAir} className={getMediumButtonStyle(isVacuum, false)}>
                  UDARA (NORMAL)
                </button>
                <button onClick={handleVacuum} className={getMediumButtonStyle(isVacuum, true)}>
                  RUANG HAMPA
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-black pt-4">
              <button onClick={handleHit} className="neo-btn bg-yellow-400 hover:bg-yellow-300 py-4 text-sm flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
                <span className="text-xl">🔨</span> PUKUL GARPU TALA A
              </button>
              <button onClick={handleStop} className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-2 px-4 text-xs border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none">
                HENTIKAN GETARAN
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
            <h4 className="font-black text-sky-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">TELEMETRI PENERIMA (B)</h4>
            
            <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col justify-center items-center mb-2">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Amplitudo Getaran Garpu B</span>
              <div className="w-full bg-slate-900 h-4 border-2 border-black rounded overflow-hidden">
                <div className={`h-full ${barColor} transition-all duration-100`} style={{ width: `${energyB}%` }}></div>
              </div>
              <span className="text-xs font-black text-white mt-1">{Math.floor(energyB)}%</span>
            </div>

            <div className="bg-black p-3 border-2 border-dashed border-slate-500 flex flex-col items-center justify-center text-center mt-3 h-20 rounded">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Status Fenomena</span>
              <span className={`text-xs font-black uppercase tracking-widest ${resonanceStatusColor}`}>{resonanceStatus}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className={`neo-box p-0 relative flex flex-col items-center w-full h-[600px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000000] ${isVacuum ? 'bg-slate-800' : ''}`} style={!isVacuum ? { backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' } : {}}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Meja Laboratorium Akustik
            </span>

            {isVacuum && (
              <div className="absolute top-16 bg-slate-800 text-white font-black px-4 py-2 border-4 border-black shadow-[4px_4px_0px_#000] text-sm transform rotate-2 z-40">
                KONDISI VAKUM: UDARA DIKELUARKAN
              </div>
            )}

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-4 h-1 bg-rose-500"></div> Garpu A (Sumber)</div>
              <div className="flex items-center gap-2"><div className="w-4 h-1 bg-blue-500"></div> Garpu B (Penerima)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 border border-black rounded-full"></div> Bola Pingpong (Indikator)</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-sky-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black rounded-lg">
          Buku Panduan: Memahami Resonansi
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Apa itu Resonansi?</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Resonansi adalah peristiwa ikut bergetarnya suatu benda akibat pengaruh getaran gelombang dari benda lain. Saat resonansi terjadi, transfer energi antar benda menjadi sangat efisien, sehingga amplitudo (simpangan) getaran benda penerima menjadi sangat besar.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Syarat Utama: Frekuensi Alami</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Setiap benda memiliki <b>frekuensi alami</b>. Garpu tala 440 Hz tidak akan mau merespons gelombang suara dari garpu tala 512 Hz. Mereka harus memiliki frekuensi yang <b>sama persis</b> agar gelombang suara dapat "menuntun" dan memperbesar getaran benda penerima.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Pentingnya Medium</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Gelombang bunyi adalah <b>gelombang mekanik</b>, yang berarti ia membutuhkan medium (seperti udara, air, atau benda padat) untuk merambat. Di ruang hampa (vakum) seperti luar angkasa, tidak ada partikel yang bisa didorong oleh getaran, sehingga suara tidak bisa merambat sama sekali!
            </p>
          </div>
        </div>

        <div className="mt-6 bg-slate-900 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
          <h4 className="font-black text-md uppercase text-yellow-300 mb-2">Aplikasi di Dunia Nyata</h4>
          <p className="text-sm font-semibold leading-relaxed text-slate-300">
            Prinsip resonansi digunakan pada <b>kotak gitar akustik</b> untuk memperkuat suara senar yang tipis. Sayangnya, resonansi juga bisa merusak; suara penyanyi sopran dengan frekuensi yang tepat bisa memecahkan gelas kaca, dan embusan angin dengan frekuensi spesifik pernah meruntuhkan jembatan gantung raksasa (Jembatan Tacoma Narrows).
          </p>
        </div>
      </div>
    </div>
  );
}