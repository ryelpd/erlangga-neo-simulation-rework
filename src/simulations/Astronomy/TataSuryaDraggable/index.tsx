import { useState, useRef, useCallback, useEffect } from 'react';

interface Planet {
  name: string;
  color: string;
  r: number;
  dist: number;
  speed: number;
  angle: number;
  desc: string;
  hasRings?: boolean;
}

const INITIAL_PLANETS: Planet[] = [
  { name: "Merkurius", color: "#94a3b8", r: 8, dist: 60, speed: 4.7, angle: Math.random() * 360, desc: "Planet terkecil dan terdekat." },
  { name: "Venus", color: "#fbbf24", r: 14, dist: 90, speed: 3.5, angle: Math.random() * 360, desc: "Planet paling panas karena efek rumah kaca." },
  { name: "Bumi", color: "#3b82f6", r: 15, dist: 130, speed: 2.9, angle: Math.random() * 360, desc: "Satu-satunya rumah bagi kehidupan yang diketahui." },
  { name: "Mars", color: "#ef4444", r: 10, dist: 170, speed: 2.4, angle: Math.random() * 360, desc: "Planet merah dengan gunung api raksasa." },
  { name: "Jupiter", color: "#f97316", r: 35, dist: 240, speed: 1.3, angle: Math.random() * 360, desc: "Raksasa gas dengan Bintik Merah Besar." },
  { name: "Saturnus", color: "#eab308", r: 30, dist: 320, speed: 0.9, angle: Math.random() * 360, desc: "Terkenal dengan cincin es dan debunya.", hasRings: true },
  { name: "Uranus", color: "#22d3ee", r: 22, dist: 380, speed: 0.6, angle: Math.random() * 360, desc: "Raksasa es yang berputar miring." },
  { name: "Neptunus", color: "#6366f1", r: 21, dist: 440, speed: 0.5, angle: Math.random() * 360, desc: "Planet terluar dengan angin tercepat." }
];

export default function TataSuryaDraggable() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeScale, setTimeScale] = useState(1.0);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const planetsRef = useRef<Planet[]>(JSON.parse(JSON.stringify(INITIAL_PLANETS)));
  const planetElementsRef = useRef<Map<string, SVGGElement>>(new Map());
  const solarCanvasRef = useRef<SVGSVGElement>(null);
  const planetGroupRef = useRef<SVGGElement>(null);
  const orbitGroupRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const draggedPlanetRef = useRef<Planet | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const renderOrbits = useCallback(() => {
    if (!orbitGroupRef.current) return;
    orbitGroupRef.current.innerHTML = '';
    if (!showOrbits) return;

    planetsRef.current.forEach((p) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '400');
      circle.setAttribute('cy', '400');
      circle.setAttribute('r', String(p.dist));
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#cbd5e1');
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('stroke-dasharray', '6 4');
      circle.setAttribute('opacity', '0.3');
      orbitGroupRef.current?.appendChild(circle);
    });
  }, [showOrbits]);

  const updateOrbitForPlanet = useCallback((planet: Planet) => {
    if (!orbitGroupRef.current || !showOrbits) return;
    
    const existingOrbit = orbitGroupRef.current.querySelector(`[data-planet="${planet.name}"]`);
    if (existingOrbit) {
      existingOrbit.setAttribute('r', String(planet.dist));
    } else {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '400');
      circle.setAttribute('cy', '400');
      circle.setAttribute('r', String(planet.dist));
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#cbd5e1');
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('stroke-dasharray', '6 4');
      circle.setAttribute('opacity', '0.3');
      circle.setAttribute('data-planet', planet.name);
      orbitGroupRef.current.appendChild(circle);
    }
  }, [showOrbits]);

  const createPlanetElements = useCallback(() => {
    if (!planetGroupRef.current) return;
    planetGroupRef.current.innerHTML = '';
    planetElementsRef.current.clear();

    planetsRef.current.forEach((p) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'planet-node cursor-pointer');
      g.setAttribute('data-name', p.name);

      if (p.hasRings) {
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ring.setAttribute('rx', String(p.r * 1.8));
        ring.setAttribute('ry', String(p.r * 0.6));
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', p.color);
        ring.setAttribute('stroke-width', '4');
        ring.setAttribute('opacity', '0.5');
        g.appendChild(ring);
      }

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', String(p.r));
      circle.setAttribute('fill', p.color);
      circle.setAttribute('stroke', '#000');
      circle.setAttribute('stroke-width', '2');
      g.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('y', String(p.r + 15));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('class', 'planet-label');
      text.textContent = p.name;
      text.style.display = showLabels ? 'block' : 'none';
      g.appendChild(text);

      g.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        draggedPlanetRef.current = p;
        isDraggingRef.current = true;
        setIsPlaying(false);
      });

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPlanet(p);
      });

      planetGroupRef.current?.appendChild(g);
      planetElementsRef.current.set(p.name, g);
    });
  }, [showLabels]);

  const updatePlanetPosition = (planet: Planet) => {
    const el = planetElementsRef.current.get(planet.name);
    if (!el) return;

    const rad = (planet.angle * Math.PI) / 180;
    const x = 400 + planet.dist * Math.cos(rad);
    const y = 400 + planet.dist * Math.sin(rad);
    el.setAttribute('transform', `translate(${x}, ${y})`);
  };

  useEffect(() => {
    createPlanetElements();
    renderOrbits();

    planetsRef.current.forEach(p => {
      updatePlanetPosition(p);
    });
  }, [createPlanetElements, renderOrbits]);

  useEffect(() => {
    lastTimeRef.current = performance.now();

    const animate = (timestamp: number) => {
      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (isPlaying && !isDraggingRef.current) {
        planetsRef.current.forEach(p => {
          const angularVelocity = (p.speed * timeScale) * (dt / 16.6);
          p.angle += angularVelocity;
          updatePlanetPosition(p);
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, timeScale]);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggedPlanetRef.current || !solarCanvasRef.current) return;

    const rect = solarCanvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const svgX = (clientX - rect.left) * (800 / rect.width);
    const svgY = (clientY - rect.top) * (800 / rect.height);

    const dx = svgX - 400;
    const dy = svgY - 400;
    const newDist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.max(50, Math.min(600, newDist));

    const k = 2.9 * Math.sqrt(130);
    const newSpeed = k / Math.sqrt(clampedDist);
    const newAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    const planet = draggedPlanetRef.current;
    planet.dist = clampedDist;
    planet.speed = newSpeed;
    planet.angle = newAngle;

    updatePlanetPosition(planet);
    updateOrbitForPlanet(planet);

    if (selectedPlanet && selectedPlanet.name === planet.name) {
      setSelectedPlanet({ ...planet });
    }
  }, [selectedPlanet, updateOrbitForPlanet]);

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
    draggedPlanetRef.current = null;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e);
    };
    const handleMouseUp = () => endDrag();
    const handleTouchEnd = () => endDrag();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMove, endDrag]);

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeScale(parseFloat(e.target.value));
  };

  const togglePlay = () => {
    if (isDraggingRef.current) return;
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      lastTimeRef.current = performance.now();
    }
  };

  const handleReset = () => {
    planetsRef.current = JSON.parse(JSON.stringify(INITIAL_PLANETS));
    setSelectedPlanet(null);
    createPlanetElements();
    renderOrbits();

    planetsRef.current.forEach(p => {
      updatePlanetPosition(p);
    });
  };

  const toggleOrbits = () => {
    setShowOrbits(!showOrbits);
  };

  const toggleLabels = () => {
    setShowLabels(!showLabels);
  };

  const zoomIn = () => {
    setZoomLevel(prev => prev * 1.2);
  };

  const zoomOut = () => {
    setZoomLevel(prev => prev / 1.2);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full relative mx-4 md:mx-auto mt-4">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm -rotate-3 text-black">FISIKA ASTRONOMI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: TATA SURYA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Eksplorasi Orbit, Jarak, dan Kecepatan Planet
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 mx-4 md:mx-auto items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md rotate-2 z-30 uppercase">
            Panel Kontrol
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="bg-indigo-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-indigo-800 uppercase text-[10px]">Kecepatan Simulasi</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-indigo-600">{timeScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={timeScale}
                onChange={handleSpeedChange}
                className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[3px_3px_0px_0px_#000] [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-black [&::-webkit-slider-runnable-track]:rounded"
              />
              <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
                <span>Diam</span>
                <span>Cepat</span>
              </div>
            </div>

            <div className="bg-yellow-100 border-4 border-black p-3 text-xs font-bold shadow-[4px_4px_0px_0px_#000]">
              💡 <b>Instruksi:</b> DRAG (Geser) planet manapun untuk mengubah jarak orbitnya dari matahari secara manual.
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500">Opsi Visual</label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input type="checkbox" checked={showOrbits} onChange={toggleOrbits} className="w-4 h-4 accent-indigo-500" />
                Tampilkan Garis Orbit
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input type="checkbox" checked={showLabels} onChange={toggleLabels} className="w-4 h-4 accent-indigo-500" />
                Tampilkan Nama Planet
              </label>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={togglePlay}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg transition-all font-bold cursor-pointer uppercase py-3 text-sm flex-1 flex items-center justify-center gap-2 ${
                  isPlaying ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-emerald-400 hover:bg-emerald-300'
                } text-black`}
              >
                {isPlaying ? '⏸️ JEDA WAKTU' : '▶️ LANJUTKAN'}
              </button>
              <button
                onClick={handleReset}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-3 px-4 text-xs transition-all"
              >
                🔄 RESET
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-yellow-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA PLANET TERPILIH</h4>
            {selectedPlanet ? (
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <div className="text-xl font-black text-white">{selectedPlanet.name.toUpperCase()}</div>
                <div className="text-[10px] text-yellow-400 font-bold mb-2">{selectedPlanet.desc}</div>
                <div className="grid grid-cols-2 gap-2 mt-2 border-t border-slate-700 pt-2">
                  <div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold">Jarak Visual</div>
                    <div className="text-sm font-mono text-sky-400">{selectedPlanet.dist.toFixed(0)} px</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold">Velositas</div>
                    <div className="text-sm font-mono text-emerald-400">{selectedPlanet.speed.toFixed(2)} deg/f</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-400 italic">Klik planet untuk detail...</div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-900 border-8 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-0 relative flex flex-col items-center w-full h-[650px] overflow-hidden" style={{
            backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 4px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 3px), radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 4px)',
            backgroundSize: '550px 550px, 350px 350px, 250px 250px',
            backgroundPosition: '0 0, 40px 60px, 130px 270px'
          }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">
              Model Heliosentris (Skala Relatif)
            </span>

            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <svg
                ref={solarCanvasRef}
                viewBox="0 0 800 800"
                className="w-full h-full overflow-visible"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              >
                <g ref={orbitGroupRef} />

                <g transform="translate(400, 400)">
                  <circle r="40" fill="#facc15" stroke="#eab308" strokeWidth="4" />
                  <circle r="35" fill="url(#sunGrad)" />
                </g>

                <defs>
                  <radialGradient id="sunGrad">
                    <stop offset="0%" stopColor="#fff7ed" />
                    <stop offset="100%" stopColor="#facc15" />
                  </radialGradient>
                </defs>

                <g ref={planetGroupRef} />
              </svg>
            </div>

            <div className="absolute bottom-4 left-4 flex gap-2 z-30">
              <button onClick={zoomIn} className="bg-white border-4 border-black shadow-[4px_4px_0px_#000] p-2 text-xl hover:bg-slate-100 transition-all">➕</button>
              <button onClick={zoomOut} className="bg-white border-4 border-black shadow-[4px_4px_0px_#000] p-2 text-xl hover:bg-slate-100 transition-all">➖</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-indigo-50 border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl p-6 w-full max-w-6xl z-10 relative mx-4 md:mx-auto mb-10">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">
          Buku Panduan: Hukum Gerak Planet 📖
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Hukum Kepler III</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Kuadrat periode orbit suatu planet sebanding dengan pangkat tiga jarak rata-ramanya dari Matahari. Sederhananya: <b>Semakin jauh sebuah planet, semakin lambat ia bergerak melingkari Matahari.</b>
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-600 border-b-2 border-black pb-1 mb-2">Gravitasi Newton</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Gaya tarik Matahari menjaga planet tetap pada orbitnya. Jika Anda <b>menarik planet lebih dekat</b> di simulasi ini, ia akan berputar lebih cepat untuk mengimbangi tarikan gravitasi yang lebih kuat.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Skala Logaritmik</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Di alam semesta nyata, jarak Neptunus 30x lebih jauh dari Bumi. Jika digambar dengan skala asli, Merkurius akan terlalu kecil untuk dilihat. Simulasi ini menggunakan <b>skala visual terkompresi</b> agar semua planet terlihat dalam satu layar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}