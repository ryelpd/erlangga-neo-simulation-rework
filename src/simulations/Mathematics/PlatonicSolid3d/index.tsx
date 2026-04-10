import type { ReactNode } from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

type SolidType = 'TETRA' | 'CUBE' | 'OCTA' | 'DODECA' | 'ICOSA';

interface SolidData {
  name: string;
  desc: string;
  v: number;
  e: number;
  f: number;
  color: number;
  btnColor: string;
  createGeom: () => THREE.BufferGeometry;
}

const SOLIDS: Record<SolidType, SolidData> = {
  TETRA: {
    name: 'Tetrahedron',
    desc: 'Bentuk piramida segitiga. Tersusun dari 4 segitiga sama sisi yang identik. Merupakan bangun ruang paling sederhana yang dapat ada di dimensi tiga.',
    v: 4, e: 6, f: 4,
    color: 0xf43f5e,
    btnColor: 'bg-rose-400',
    createGeom: () => new THREE.TetrahedronGeometry(2),
  },
  CUBE: {
    name: 'Hexahedron (Kubus)',
    desc: 'Tersusun dari 6 persegi (bujur sangkar) yang identik. Pada setiap titik sudutnya, bertemulah tepat 3 buah persegi.',
    v: 8, e: 12, f: 6,
    color: 0x38bdf8,
    btnColor: 'bg-sky-400',
    createGeom: () => new THREE.BoxGeometry(2.5, 2.5, 2.5),
  },
  OCTA: {
    name: 'Octahedron',
    desc: 'Tersusun dari 8 segitiga sama sisi. Bentuknya menyerupai dua piramida alas persegi yang saling menempel di bagian alasnya.',
    v: 6, e: 12, f: 8,
    color: 0x10b981,
    btnColor: 'bg-emerald-400',
    createGeom: () => new THREE.OctahedronGeometry(2.5),
  },
  DODECA: {
    name: 'Dodecahedron',
    desc: 'Tersusun dari 12 pentagon (segi lima) beraturan. Pada setiap titik sudutnya, bertemulah 3 buah pentagon.',
    v: 20, e: 30, f: 12,
    color: 0xa855f7,
    btnColor: 'bg-purple-400',
    createGeom: () => new THREE.DodecahedronGeometry(2),
  },
  ICOSA: {
    name: 'Icosahedron',
    desc: 'Tersusun dari 20 segitiga sama sisi. Ini adalah bangun ruang Platonik dengan jumlah sisi terbanyak.',
    v: 12, e: 30, f: 20,
    color: 0xfacc15,
    btnColor: 'bg-yellow-400',
    createGeom: () => new THREE.IcosahedronGeometry(2.2),
  },
};

export default function PlatonicSolid3d(): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mainMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);
  const animationIdRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  
  const [currentSolid, setCurrentSolid] = useState<SolidType>('TETRA');
  const [showWireframe, setShowWireframe] = useState(false);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(true);

  const currentData = SOLIDS[currentSolid];

  const createSolid = useCallback((type: SolidType) => {
    const data = SOLIDS[type];
    const scene = sceneRef.current;
    if (!scene) return;

    if (mainMeshRef.current) {
      scene.remove(mainMeshRef.current);
      mainMeshRef.current.geometry.dispose();
      (mainMeshRef.current.material as THREE.Material).dispose();
    }
    if (wireframeMeshRef.current) {
      scene.remove(wireframeMeshRef.current);
      wireframeMeshRef.current.geometry.dispose();
      (wireframeMeshRef.current.material as THREE.Material).dispose();
    }

    const geometry = data.createGeom();

    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.3,
      metalness: 0.1,
      flatShading: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(0.5, 0.5, 0);
    mainMeshRef.current = mesh;
    scene.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    wireframe.rotation.set(0.5, 0.5, 0);
    wireframeMeshRef.current = wireframe;
    scene.add(wireframe);
  }, []);

  const updateWireframeDisplay = useCallback(() => {
    const mainMesh = mainMeshRef.current;
    const wireframeMesh = wireframeMeshRef.current;
    if (!mainMesh || !wireframeMesh) return;

    if (showWireframe) {
      (mainMesh.material as THREE.MeshStandardMaterial).opacity = 0.5;
      (mainMesh.material as THREE.MeshStandardMaterial).transparent = true;
      (wireframeMesh.material as THREE.LineBasicMaterial).color.setHex(0xffffff);
    } else {
      (mainMesh.material as THREE.MeshStandardMaterial).opacity = 1.0;
      (mainMesh.material as THREE.MeshStandardMaterial).transparent = false;
      (wireframeMesh.material as THREE.LineBasicMaterial).color.setHex(0x000000);
    }
  }, [showWireframe]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 0.8);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.4);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    createSolid(currentSolid);

    const onMouseDown = () => {
      isDraggingRef.current = true;
      autoRotateRef.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const mainMesh = mainMeshRef.current;
      const wireframeMesh = wireframeMeshRef.current;
      if (!mainMesh || !wireframeMesh) return;

      mainMesh.rotation.x += e.movementY * 0.01;
      mainMesh.rotation.y += e.movementX * 0.01;
      wireframeMesh.rotation.x += e.movementY * 0.01;
      wireframeMesh.rotation.y += e.movementX * 0.01;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      if (autoRotateEnabled) autoRotateRef.current = true;
    };

    const onTouchStart = (e: TouchEvent) => {
      isDraggingRef.current = true;
      autoRotateRef.current = false;
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const mainMesh = mainMeshRef.current;
      const wireframeMesh = wireframeMeshRef.current;
      if (!mainMesh || !wireframeMesh) return;

      const deltaX = e.touches[0].clientX - prevMouseRef.current.x;
      const deltaY = e.touches[0].clientY - prevMouseRef.current.y;

      mainMesh.rotation.x += deltaY * 0.01;
      mainMesh.rotation.y += deltaX * 0.01;
      wireframeMesh.rotation.x += deltaY * 0.01;
      wireframeMesh.rotation.y += deltaX * 0.01;

      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      if (autoRotateEnabled) autoRotateRef.current = true;
    };

    const onResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', onResize);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (autoRotateRef.current && mainMeshRef.current && wireframeMeshRef.current) {
        mainMeshRef.current.rotation.x += 0.005;
        mainMeshRef.current.rotation.y += 0.01;
        wireframeMeshRef.current.rotation.x += 0.005;
        wireframeMeshRef.current.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);

      if (mainMeshRef.current) {
        scene.remove(mainMeshRef.current);
        mainMeshRef.current.geometry.dispose();
        (mainMeshRef.current.material as THREE.Material).dispose();
      }
      if (wireframeMeshRef.current) {
        scene.remove(wireframeMeshRef.current);
        wireframeMeshRef.current.geometry.dispose();
        (wireframeMeshRef.current.material as THREE.Material).dispose();
      }
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    createSolid(currentSolid);
    updateWireframeDisplay();
  }, [currentSolid, createSolid]);

  useEffect(() => {
    updateWireframeDisplay();
  }, [showWireframe, updateWireframeDisplay]);

  useEffect(() => {
    autoRotateRef.current = autoRotateEnabled;
  }, [autoRotateEnabled]);

  const handleResetView = () => {
    if (mainMeshRef.current && wireframeMeshRef.current) {
      mainMeshRef.current.rotation.set(0.5, 0.5, 0);
      wireframeMeshRef.current.rotation.set(0.5, 0.5, 0);
    }
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">MATEMATIKA GEOMETRI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: PLATONIC SOLIDS
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Eksplorasi 3D Lima Polihedron Reguler dan Rumus Euler
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#818cf8] text-md transform rotate-2 z-30 uppercase">
            Panel Bentuk
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Bangun Ruang</label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(SOLIDS) as [SolidType, SolidData][]).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => setCurrentSolid(key)}
                    className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg py-2 px-3 text-xs font-bold text-left flex justify-between items-center transition-all
                      ${currentSolid === key 
                        ? `${data.btnColor} text-white ring-4 ring-black translate-x-[4px] translate-y-[4px] shadow-none` 
                        : 'bg-slate-200 text-slate-600'
                      }`}
                  >
                    <span>{key === 'TETRA' && '🔺'}{key === 'CUBE' && '🟦'}{key === 'OCTA' && '💎'}{key === 'DODECA' && '⚽'}{key === 'ICOSA' && '🌐'} {data.name}</span>
                    <span className="text-[9px] bg-white text-black px-1 border border-black">{data.f} Sisi</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500">Opsi Rendering 3D</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={showWireframe}
                    onChange={(e) => setShowWireframe(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  Tampilkan Rangka (Wireframe)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={autoRotateEnabled}
                    onChange={(e) => setAutoRotateEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  Putar Otomatis
                </label>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button
                onClick={handleResetView}
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase bg-slate-800 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all py-3 text-sm w-full flex items-center justify-center gap-2"
              >
                RESET KAMERA
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-indigo-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">SIFAT TOPOLOGI (RUMUS EULER)</h4>
            
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Titik Sudut (V)</span>
                <span className="text-2xl font-black text-sky-400 font-mono">{currentData.v}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Rusuk (E)</span>
                <span className="text-2xl font-black text-rose-400 font-mono">{currentData.e}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Sisi (F)</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{currentData.f}</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-indigo-500 flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Pembuktian Karakteristik Euler (V - E + F)</span>
              <div className="flex items-center gap-2 font-mono font-black text-lg text-yellow-300">
                <span className="text-sky-400">{currentData.v}</span> - 
                <span className="text-rose-400">{currentData.e}</span> + 
                <span className="text-emerald-400">{currentData.f}</span> = 
                <span className="text-2xl text-white ml-2 border-b-2 border-white">2</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-pattern-dot p-0 relative flex flex-col w-full h-[650px] border-8 border-black overflow-hidden rounded-xl" style={{ backgroundColor: '#0f172a', backgroundImage: 'radial-gradient(#1e293b 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Proyeksi 3D: {currentData.name}
            </span>

            <div className="absolute bottom-4 left-4 z-20 bg-white/90 p-3 border-4 border-black shadow-[4px_4px_0px_#000] max-w-xs">
              <h3 className="font-black text-lg uppercase text-slate-800 border-b-2 border-black pb-1 mb-1">{currentData.name}</h3>
              <p className="text-xs font-bold text-slate-600">{currentData.desc}</p>
            </div>

            <div className="absolute top-4 right-4 z-20 bg-yellow-300 p-2 border-4 border-black shadow-[4px_4px_0px_#000] font-black text-[10px] transform rotate-3 cursor-pointer select-none">
              Klik & Geser untuk Memutar
            </div>

            <div ref={containerRef} className="w-full h-full relative z-10 flex items-center justify-center cursor-grab" style={{ touchAction: 'none' }} />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-indigo-50 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Bangun Ruang Sempurna
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-indigo-700 border-b-2 border-black pb-1 mb-2">Apa itu Solid Platonik?</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Bangun ruang Platonik adalah polihedron (bangun ruang bersisi banyak) yang <b>sangat teratur</b>. Semua sisinya berupa poligon beraturan yang identik (bentuk dan ukurannya sama persis), dan pada setiap titik sudutnya bertemu jumlah sisi yang sama banyak.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">Mengapa Hanya Ada Lima?</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Secara matematis, untuk membentuk sudut bangun ruang, jumlah sudut bidang datar yang bertemu di satu titik <b>harus kurang dari 360</b>. Hanya ada lima kombinasi poligon beraturan yang memenuhi syarat ketat ini di alam semesta kita!
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">Karakteristik Euler</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Ahli matematika Leonhard Euler menemukan fakta menakjubkan: Untuk polihedron sederhana apa pun (tanpa lubang), jika Anda mengambil jumlah titik sudut (<b>V</b>ertices), menguranginya dengan jumlah rusuk (<b>E</b>dges), dan menambahkannya dengan jumlah sisi (<b>F</b>aces), hasilnya <b>selalu tepat 2</b>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}