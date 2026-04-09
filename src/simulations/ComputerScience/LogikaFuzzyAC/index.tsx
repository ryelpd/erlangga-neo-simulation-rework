import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const CHART_Y = 350;
const CHART_HEIGHT = 200;
const CHART_WIDTH = 800;

interface AirflowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export default function LogikaFuzzyAC(): ReactNode {
  const [isFuzzyMode, setIsFuzzyMode] = useState(true);
  const [targetTemp, setTargetTemp] = useState(24);
  const [outsideTemp, setOutsideTemp] = useState(32);
  const [roomTemp, setRoomTemp] = useState(32);
  const [compressorPower, setCompressorPower] = useState(0);
  const [status, setStatus] = useState('MENUNGGU SENSOR...');
  const [statusColor, setStatusColor] = useState('text-teal-200');
  const [statusBg, setStatusBg] = useState('bg-teal-900');
  const [statusBorder, setStatusBorder] = useState('border-teal-400');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crispIsOnRef = useRef(false);
  const fanAngleRef = useRef(0);
  const timeRef = useRef(0);
  const tempHistoryRef = useRef<number[]>(new Array(400).fill(32));
  const targetHistoryRef = useRef<number[]>(new Array(400).fill(24));
  const airflowParticlesRef = useRef<AirflowParticle[]>([]);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const updateCrispControl = useCallback(() => {
    if (roomTemp >= targetTemp + 1.0) {
      crispIsOnRef.current = true;
    } else if (roomTemp <= targetTemp - 1.0) {
      crispIsOnRef.current = false;
    }

    const power = crispIsOnRef.current ? 100 : 0;
    setCompressorPower(power);

    if (power === 100) {
      setStatus('JIKA SUHU > TARGET+1 : NYALAKAN 100%');
      setStatusColor('text-amber-200');
      setStatusBg('bg-amber-900');
      setStatusBorder('border-amber-400');
    } else {
      setStatus('JIKA SUHU < TARGET-1 : MATIKAN 0%');
      setStatusColor('text-slate-300');
      setStatusBg('bg-slate-800');
      setStatusBorder('border-slate-500');
    }
  }, [roomTemp, targetTemp]);

  const updateFuzzyControl = useCallback(() => {
    const error = roomTemp - targetTemp;
    let power = 0;

    if (error <= -0.5) {
      power = 0;
      setStatus('JIKA SUHU DINGIN : KOMPRESOR MATI (0%)');
      setStatusColor('text-slate-300');
      setStatusBg('bg-slate-800');
      setStatusBorder('border-slate-500');
    } else if (error > -0.5 && error <= 0.5) {
      power = (error + 0.5) * 20;
      setStatus('JIKA SUHU PAS : DAYA RENDAH UNTUK MAINTAIN');
      setStatusColor('text-teal-200');
      setStatusBg('bg-teal-900');
      setStatusBorder('border-teal-400');
    } else if (error > 0.5 && error <= 2.0) {
      power = 20 + ((error - 0.5) / 1.5) * 40;
      setStatus('JIKA SUHU AGAK PANAS : DAYA SEDANG');
      setStatusColor('text-sky-200');
      setStatusBg('bg-sky-900');
      setStatusBorder('border-sky-400');
    } else if (error > 2.0 && error <= 5.0) {
      power = 60 + ((error - 2.0) / 3.0) * 40;
      setStatus('JIKA SUHU PANAS : DAYA TINGGI');
      setStatusColor('text-indigo-200');
      setStatusBg('bg-indigo-900');
      setStatusBorder('border-indigo-400');
    } else {
      power = 100;
      setStatus('JIKA SUHU SANGAT PANAS : DAYA MAKSIMAL (100%)');
      setStatusColor('text-amber-200');
      setStatusBg('bg-amber-900');
      setStatusBorder('border-amber-400');
    }

    setCompressorPower(power);
  }, [roomTemp, targetTemp]);

  const updatePhysics = useCallback(() => {
    // Calculate control
    if (isFuzzyMode) {
      updateFuzzyControl();
    } else {
      updateCrispControl();
    }

    // Physics
    const heatLeakRate = 0.005;
    const heatChange = (outsideTemp - roomTemp) * heatLeakRate;
    const coolingRate = 0.04;
    const coolChange = (compressorPower / 100) * coolingRate;

    const newRoomTemp = Math.max(10, Math.min(50, roomTemp + heatChange - coolChange));
    setRoomTemp(newRoomTemp);

    // Update graph arrays
    if (Math.floor(timeRef.current * 10) % 2 === 0) {
      tempHistoryRef.current.push(newRoomTemp);
      tempHistoryRef.current.shift();
      targetHistoryRef.current.push(targetTemp);
      targetHistoryRef.current.shift();
    }

    // Particles
    if (compressorPower > 0 && Math.random() < compressorPower / 100) {
      airflowParticlesRef.current.push({
        x: 400 + (Math.random() - 0.5) * 100,
        y: 120,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + (compressorPower / 100) * 4,
        life: 1.0
      });
    }

    for (let i = airflowParticlesRef.current.length - 1; i >= 0; i--) {
      const p = airflowParticlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0 || p.y > 350) {
        airflowParticlesRef.current.splice(i, 1);
      }
    }

    // Update fan angle
    fanAngleRef.current += compressorPower * 0.005;
    timeRef.current += 0.1;
  }, [isFuzzyMode, updateFuzzyControl, updateCrispControl, outsideTemp, roomTemp, compressorPower, targetTemp]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Room Window
    ctx.fillStyle = outsideTemp > 30 ? '#fef08a' : '#e0f2fe';
    ctx.fillRect(50, 50, 100, 150);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, 100, 150);
    ctx.beginPath();
    ctx.moveTo(100, 50);
    ctx.lineTo(100, 200);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(50, 125);
    ctx.lineTo(150, 125);
    ctx.stroke();

    // Thermometer
    const thX = 700;
    const thY = 100;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(thX, thY, 15, 100, 10);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(thX + 7.5, thY + 110, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const liqH = Math.max(0, Math.min(100, ((roomTemp - 10) / 40) * 90));
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(thX + 7.5, thY + 110, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(thX + 4, thY + 95 - liqH, 7, liqH + 15);

    // AC Body
    const acX = 300;
    const acY = 50;
    const acW = 200;
    const acH = 60;

    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(acX + 10, acY + 10, acW, acH);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(acX, acY, acW, acH);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(acX, acY, acW, acH);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(acX + 140, acY + 15, 40, 25);
    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(targetTemp + '°', acX + 160, acY + 33);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(acX + 20, acY + 20, 30, 4);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(acX + 10, acY + acH - 15, acW - 20, 10);
    ctx.strokeRect(acX + 10, acY + acH - 15, acW - 20, 10);

    // Fan
    ctx.save();
    ctx.beginPath();
    ctx.rect(acX + 10, acY + acH - 15, acW - 20, 10);
    ctx.clip();

    ctx.translate(acX + acW / 2, acY + acH - 10);
    ctx.rotate(fanAngleRef.current);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(80, 0);
      ctx.stroke();
      ctx.rotate(Math.PI / 2);
    }
    ctx.restore();

    // Status Light
    ctx.fillStyle = compressorPower > 0 ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(acX + 185, acY + 27, 4, 0, Math.PI * 2);
    ctx.fill();

    // Airflow Particles
    for (const p of airflowParticlesRef.current) {
      ctx.fillStyle = `rgba(56, 189, 248, ${p.life * 0.5})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 + (1 - p.life) * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Graph
    ctx.save();
    ctx.translate(0, CHART_Y);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let y = 0; y <= CHART_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CHART_WIDTH, y);
      ctx.stroke();
    }

    const mapY = (temp: number) => {
      const ratio = (temp - 15) / 25;
      return CHART_HEIGHT - (ratio * CHART_HEIGHT);
    };

    // Target Line
    ctx.beginPath();
    for (let i = 0; i < targetHistoryRef.current.length; i++) {
      const px = (i / targetHistoryRef.current.length) * CHART_WIDTH;
      const py = mapY(targetHistoryRef.current[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Actual Temp Line
    ctx.beginPath();
    for (let i = 0; i < tempHistoryRef.current.length; i++) {
      const px = (i / tempHistoryRef.current.length) * CHART_WIDTH;
      const py = mapY(tempHistoryRef.current[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Space Grotesk"';
    ctx.textAlign = 'left';
    ctx.fillText('GRAFIK SUHU RUANGAN SEIRING WAKTU', 20, 20);
    ctx.fillStyle = '#2dd4bf';
    ctx.fillText('--- SUHU TARGET', 20, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('━━━ SUHU AKTUAL', 20, 60);

    ctx.restore();
  }, [outsideTemp, roomTemp, targetTemp, compressorPower]);

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

  const handleModeChange = (fuzzy: boolean) => {
    setIsFuzzyMode(fuzzy);
  };

  const handleTargetChange = (value: number) => {
    setTargetTemp(value);
    targetHistoryRef.current[targetHistoryRef.current.length - 1] = value;
  };

  const bgRatio = Math.max(0, Math.min(1, (roomTemp - 16) / 20));
  const r = Math.floor(241 + bgRatio * 14);
  const g = Math.floor(245 - bgRatio * 10);
  const b = Math.floor(249 - bgRatio * 30);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-teal-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black z-10">KECERDASAN BUATAN & SISTEM KENDALI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black relative z-10">
          LAB VIRTUAL: LOGIKA FUZZY
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_#000] text-black relative z-10">
          Simulasi Kendali Pendingin Ruangan (AC) Inverter vs Konvensional
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#2dd4bf] text-md transform rotate-2 z-30 uppercase">
            Remote AC
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-teal-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-teal-900 uppercase text-[10px]">Suhu Target (Remote)</span>
                <span className="font-mono font-black text-xl bg-white px-2 border-2 border-black text-teal-700">{targetTemp} °C</span>
              </div>
              <input
                type="range"
                min="16"
                max="30"
                step="1"
                value={targetTemp}
                onChange={(e) => handleTargetChange(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Dingin (16°C)</span>
                <span>Sejuk (30°C)</span>
              </div>
            </div>

            <div className="bg-orange-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-orange-900 uppercase text-[10px]">Suhu Luar Ruangan (Cuaca)</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-orange-700">{outsideTemp} °C</span>
              </div>
              <input
                type="range"
                min="20"
                max="40"
                step="1"
                value={outsideTemp}
                onChange={(e) => setOutsideTemp(parseInt(e.target.value))}
                className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000000] [&::-webkit-slider-thumb]:bg-orange-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Mendung</span>
                <span>Terik Panas</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t-4 border-black pt-4">
              <label className="text-[11px] font-black uppercase text-slate-700 mb-1">Pilih Mode Kendali (Algoritma)</label>
              <button
                onClick={() => handleModeChange(true)}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#115e59] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${isFuzzyMode ? 'bg-teal-400 hover:bg-teal-300 text-black' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
              >
                MODE FUZZY (INVERTER HALUS)
              </button>
              <button
                onClick={() => handleModeChange(false)}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#475569] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${!isFuzzyMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
              >
                MODE CRISP (ON / OFF KLASIK)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-teal-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-teal-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">SENSOR RUANGAN (REAL-TIME)</h4>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Suhu Aktual</span>
                <span className="text-xl font-black text-white">{roomTemp.toFixed(2)} °C</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center relative overflow-hidden">
                <span className="text-[9px] font-bold uppercase text-amber-400 mb-1">Kinerja Kompresor</span>
                <span className="text-xl font-black text-amber-400 relative z-10">{compressorPower.toFixed(1)}%</span>
              </div>
            </div>

            <div className={`${statusBg} p-3 border-2 border-dashed ${statusBorder} text-center flex flex-col items-center justify-center min-h-[50px] transition-colors duration-300 rounded`}>
              <span className="text-[9px] font-bold uppercase text-teal-200 mb-1">Keputusan Algoritma:</span>
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
              backgroundColor: `rgb(${r}, ${g}, ${b})`,
              backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-slate-900 font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Diagram Ruang & Grafik Suhu
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
        <h3 className="text-xl font-bold bg-teal-400 inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Logika Crisp vs Logika Fuzzy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-slate-400 border-b-2 border-slate-600 pb-1 mb-2">1. Logika Crisp (Biner)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Sistem klasik hanya mengenal nilai absolut: Benar (1) atau Salah (0). Pada AC lama, kompresor hanya bisa <b>MENYALA 100%</b> atau <b>MATI 0%</b>. Jika suhu mencapai target, AC mati. Jika ruangan panas lagi, AC menyala penuh. Ini menyebabkan suhu berfluktuasi dan boros listrik akibat tarikan awal.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-teal-400 border-b-2 border-slate-600 pb-1 mb-2">2. Logika Fuzzy (Derajat)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Logika Fuzzy meniru cara pikir manusia yang memiliki "derajat". Bukan cuma Panas/Dingin, tapi bisa <i>Agak Panas</i>, <i>Sedikit Hangat</i>. AC Inverter menggunakan logika ini untuk mengatur putaran kompresor secara linier (misal: 43%, 60%).
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-md uppercase text-amber-400 border-b-2 border-slate-600 pb-1 mb-2">3. Aturan Fuzzy (Fuzzy Rules)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Contoh Aturan (If-Then):<br />
              - JIKA Suhu Ruangan <b>Jauh Lebih Panas</b> DARI Target, MAKA Kompresor <b>Sangat Cepat</b>.<br />
              - JIKA Suhu Ruangan <b>Hampir Pas</b>, MAKA Kompresor <b>Pelan</b> (Sekadar menjaga suhu stabil).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}