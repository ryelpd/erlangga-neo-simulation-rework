import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

interface Charge {
  id: number;
  x: number;
  y: number;
  q: number; // Charge in microCoulombs
}

interface FieldLine {
  points: { x: number; y: number }[];
  strength: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 550;
const K = 8.99; // Coulomb constant (simplified)

export default function MedanListrik(): ReactNode {
  const [charges, setCharges] = useState<Charge[]>([
    { id: 1, x: 300, y: 275, q: 5 },
    { id: 2, x: 500, y: 275, q: -5 }
  ]);
  const [selectedCharge, setSelectedCharge] = useState<number | null>(null);
  const [testChargeQ, setTestChargeQ] = useState(1);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [testChargePos, setTestChargePos] = useState({ x: 400, y: 200 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const calculateField = useCallback((x: number, y: number, excludeId?: number): { Ex: number; Ey: number; magnitude: number } => {
    let Ex = 0;
    let Ey = 0;

    for (const charge of charges) {
      if (charge.id === excludeId) continue;

      const dx = x - charge.x;
      const dy = y - charge.y;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);

      if (r < 20) continue; // Too close to charge

      const E = (K * charge.q) / r2;
      Ex += E * (dx / r);
      Ey += E * (dy / r);
    }

    const magnitude = Math.sqrt(Ex * Ex + Ey * Ey);
    return { Ex, Ey, magnitude };
  }, [charges]);

  const generateFieldLines = useCallback((): FieldLine[] => {
    const lines: FieldLine[] = [];
    const numLines = 12;

    for (const charge of charges) {
      if (charge.q <= 0) continue; // Only start from positive charges

      const numToEmit = Math.floor(Math.abs(charge.q) / 5 * numLines);

      for (let i = 0; i < numToEmit; i++) {
        const angle = (i / numToEmit) * Math.PI * 2;
        const points: { x: number; y: number }[] = [];
        let x = charge.x + Math.cos(angle) * 30;
        let y = charge.y + Math.sin(angle) * 30;

        for (let step = 0; step < 100; step++) {
          points.push({ x, y });
          const field = calculateField(x, y);

          if (field.magnitude < 0.01) break;

          const dx = field.Ex / field.magnitude * 5;
          const dy = field.Ey / field.magnitude * 5;

          x += dx;
          y += dy;

          // Check if reached negative charge
          let reachedNegative = false;
          for (const c of charges) {
            if (c.q < 0) {
              const dist = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2);
              if (dist < 30) {
                reachedNegative = true;
                break;
              }
            }
          }

          if (reachedNegative) {
            points.push({ x, y });
            break;
          }

          // Check bounds
          if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) break;
        }

        if (points.length > 2) {
          lines.push({ points, strength: Math.abs(charge.q) });
        }
      }
    }

    return lines;
  }, [charges, calculateField]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw field lines
    if (showFieldLines) {
      const fieldLines = generateFieldLines();
      for (const line of fieldLines) {
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(line.points[i].x, line.points[i].y);
        }
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 + line.strength / 20})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Draw field vectors grid
    if (showVectors) {
      const vectorSpacing = 60;
      for (let x = vectorSpacing; x < CANVAS_WIDTH; x += vectorSpacing) {
        for (let y = vectorSpacing; y < CANVAS_HEIGHT; y += vectorSpacing) {
          // Skip near charges
          let tooClose = false;
          for (const charge of charges) {
            const dist = Math.sqrt((x - charge.x) ** 2 + (y - charge.y) ** 2);
            if (dist < 40) {
              tooClose = true;
              break;
            }
          }
          if (tooClose) continue;

          const field = calculateField(x, y);
          if (field.magnitude < 0.05) continue;

          const scale = Math.min(field.magnitude * 8, 25);
          const angle = Math.atan2(field.Ey, field.Ex);

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);

          // Arrow
          ctx.beginPath();
          ctx.moveTo(-scale, 0);
          ctx.lineTo(scale, 0);
          ctx.lineTo(scale - 8, -5);
          ctx.moveTo(scale, 0);
          ctx.lineTo(scale - 8, 5);
          ctx.strokeStyle = 'rgba(167, 139, 250, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.restore();
        }
      }
    }

    // Draw test charge
    const testField = calculateField(testChargePos.x, testChargePos.y);
    const testForce = testField.magnitude * testChargeQ;

    ctx.beginPath();
    ctx.arc(testChargePos.x, testChargePos.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = testChargeQ > 0 ? '#10b981' : '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Test charge label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(testChargeQ > 0 ? '+' : '-', testChargePos.x, testChargePos.y + 4);

    // Force vector on test charge
    if (testForce > 0.1 && showVectors) {
      const forceAngle = testChargeQ > 0 ? Math.atan2(testField.Ey, testField.Ex) : Math.atan2(-testField.Ey, -testField.Ex);
      const forceLength = Math.min(testForce * 10, 60);

      ctx.save();
      ctx.translate(testChargePos.x, testChargePos.y);
      ctx.rotate(forceAngle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(forceLength, 0);
      ctx.lineTo(forceLength - 10, -6);
      ctx.moveTo(forceLength, 0);
      ctx.lineTo(forceLength - 10, 6);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    }

    // Draw source charges
    for (const charge of charges) {
      const isSelected = selectedCharge === charge.id;

      // Charge circle
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = charge.q > 0 ? '#3b82f6' : '#ef4444';
      ctx.fill();

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Charge symbol
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(charge.q > 0 ? '+' : '-', charge.x, charge.y);

      // Charge value label
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`${Math.abs(charge.q)} μC`, charge.x, charge.y + 45);
    }

    // Draw info panel
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(10, 10, 200, 100);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 200, 100);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Test Charge: ${testChargeQ} μC`, 20, 35);
    ctx.fillText(`Field Strength: ${testField.magnitude.toFixed(3)} N/μC`, 20, 55);
    ctx.fillText(`Force: ${testForce.toFixed(3)} N`, 20, 75);
    ctx.fillText(`Charges: ${charges.length}`, 20, 95);
  }, [charges, selectedCharge, testChargePos, testChargeQ, showFieldLines, showVectors, calculateField, generateFieldLines]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

      // Check if clicking on a charge
      for (const charge of charges) {
        const dist = Math.sqrt((x - charge.x) ** 2 + (y - charge.y) ** 2);
        if (dist < 30) {
          setSelectedCharge(charge.id);
          isDraggingRef.current = true;
          dragOffsetRef.current = { x: x - charge.x, y: y - charge.y };
          return;
        }
      }

      // Check if clicking on test charge
      const testDist = Math.sqrt((x - testChargePos.x) ** 2 + (y - testChargePos.y) ** 2);
      if (testDist < 20) {
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: x - testChargePos.x, y: y - testChargePos.y };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

      if (selectedCharge !== null) {
        setCharges(prev => prev.map(c =>
          c.id === selectedCharge
            ? { ...c, x: x - dragOffsetRef.current.x, y: y - dragOffsetRef.current.y }
            : c
        ));
      } else {
        setTestChargePos({
          x: x - dragOffsetRef.current.x,
          y: y - dragOffsetRef.current.y
        });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [charges, selectedCharge, testChargePos]);

  useEffect(() => {
    draw();
  }, [draw]);

  const addPositiveCharge = () => {
    const newId = Math.max(...charges.map(c => c.id), 0) + 1;
    setCharges(prev => [...prev, { id: newId, x: 400 + Math.random() * 100, y: 275 + Math.random() * 100, q: 5 }]);
  };

  const addNegativeCharge = () => {
    const newId = Math.max(...charges.map(c => c.id), 0) + 1;
    setCharges(prev => [...prev, { id: newId, x: 400 + Math.random() * 100, y: 275 + Math.random() * 100, q: -5 }]);
  };

  const removeSelectedCharge = () => {
    if (selectedCharge !== null && charges.length > 2) {
      setCharges(prev => prev.filter(c => c.id !== selectedCharge));
      setSelectedCharge(null);
    }
  };

  const clearAll = () => {
    setCharges([
      { id: 1, x: 300, y: 275, q: 5 },
      { id: 2, x: 500, y: 275, q: -5 }
    ]);
    setSelectedCharge(null);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-black p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-violet-200 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 w-full relative overflow-hidden">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] font-bold text-sm transform -rotate-3 z-10">FISIKA ELEKTROMAGNETIK</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight relative z-10">
          LAB VIRTUAL: MEDAN LISTRIK
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] relative z-10">
          Visualisasi Medan Elektrostatik & Gaya Coulomb
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-slate-900 shadow-[4px_4px_0px_#8b5cf6] text-md transform rotate-2 z-30 uppercase">
            Panel Kontrol
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-violet-50 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg">
              <span className="font-black text-violet-900 uppercase text-[10px]">Muatan Sumber</span>
              <div className="flex gap-2">
                <button
                  onClick={addPositiveCharge}
                  className="flex-1 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-blue-400 hover:bg-blue-300 py-2 px-3 text-sm font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  + Tambah Positif
                </button>
                <button
                  onClick={addNegativeCharge}
                  className="flex-1 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-red-400 hover:bg-red-300 py-2 px-3 text-sm font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  - Tambah Negatif
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={removeSelectedCharge}
                  disabled={selectedCharge === null || charges.length <= 2}
                  className="flex-1 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-300 disabled:cursor-not-allowed py-2 px-3 text-sm font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Hapus Terpilih
                </button>
                <button
                  onClick={clearAll}
                  className="flex-1 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-600 hover:bg-slate-500 py-2 px-3 text-sm font-bold text-white uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg">
              <span className="font-black text-sky-900 uppercase text-[10px]">Muatan Uji (Test Charge)</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">q₀ =</span>
                <input
                  type="number"
                  value={testChargeQ}
                  onChange={(e) => setTestChargeQ(parseFloat(e.target.value) || 0)}
                  className="flex-1 border-2 border-slate-900 rounded px-2 py-1 font-mono text-sm"
                  step="0.5"
                  min="-10"
                  max="10"
                />
                <span className="text-xs font-bold">μC</span>
              </div>
              <p className="text-[9px] text-slate-500">Drag bola hijau/merah di canvas untuk memindahkan</p>
            </div>

            <div className="bg-slate-100 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg">
              <span className="font-black text-slate-900 uppercase text-[10px]">Visualisasi</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFieldLines}
                  onChange={(e) => setShowFieldLines(e.target.checked)}
                  className="w-4 h-4 accent-violet-500"
                />
                <span className="text-xs font-bold">Garis Medan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVectors}
                  onChange={(e) => setShowVectors(e.target.checked)}
                  className="w-4 h-4 accent-violet-500"
                />
                <span className="text-xs font-bold">Vektor Medan & Gaya</span>
              </label>
            </div>

            <div className="bg-slate-900 text-white p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg">
              <h4 className="font-black text-violet-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">INFO MEDAN</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Kuat Medan (E):</span>
                  <span className="font-mono font-bold">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gaya (F = qE):</span>
                  <span className="font-mono font-bold">-</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-2">
                  *Lihat panel di canvas untuk nilai real-time
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3">
          <div
            className="border-8 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-0 relative overflow-hidden"
            style={{
              backgroundColor: '#f8fafc',
              backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-slate-900 font-black px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] text-[10px] transform -rotate-1 z-40 uppercase rounded">
              Visualisasi Medan Listrik
            </span>

            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-auto block"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-violet-400 inline-block px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] mb-6 transform -rotate-1 uppercase text-black rounded">
          Konsep Medan Listrik 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-blue-400 border-b-2 border-slate-600 pb-2 mb-3">1. Medan Listrik (E)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Ruang di sekitar muatan listrik yang masih dipengaruhi oleh gaya Coulomb. Kuat medan listrik didefinisikan sebagai gaya per satuan muatan: <b>E = F/q</b> atau untuk muatan titik <b>E = kQ/r²</b>. Satuan: N/C atau V/m.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-amber-400 border-b-2 border-slate-600 pb-2 mb-3">2. Garis Medan</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Garis imajiner yang menunjukkan arah medan listrik. Garis medan <b>keluar dari muatan positif</b> dan <b>masuk ke muatan negatif</b>. Kerapatan garis menunjukkan kuat medan - semakin rapat garis, semakin kuat medannya.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-emerald-400 border-b-2 border-slate-600 pb-2 mb-3">3. Gaya Coulomb (F)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Gaya yang dialami muatan uji dalam medan listrik: <b>F = q₀E</b>. Muatan positif mengalami gaya <b>searah</b> dengan medan, muatan negatif mengalami gaya <b>berlawanan arah</b> dengan medan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}