import { useState, useRef, useEffect, useCallback } from 'react';

interface Node {
  id: string;
  name: string;
  ip: string;
  mac: string;
  x: number;
  y: number;
}

interface Waypoint {
  x: number;
  y: number;
  final?: boolean;
  targetId?: string;
  hopId?: string | null;
  action?: string;
}

interface Packet {
  src: string;
  dst: string;
  targetNodeId: string;
  x: number;
  y: number;
  color: string;
  label: string;
  waypoints: Waypoint[];
  wpIdx: number;
  isCollisionTest: boolean;
  isLost: boolean;
}

interface LogEntry {
  time: string;
  type: 'normal' | 'error' | 'success' | 'system' | 'warning';
  msg: string;
}

const INITIAL_NODES: { [key: string]: Node } = {
  'A': { id: 'A', name: 'PC A', ip: '192.168.1.1', mac: 'AA:AA', x: 0, y: 0 },
  'B': { id: 'B', name: 'PC B', ip: '192.168.1.2', mac: 'BB:BB', x: 0, y: 0 },
  'C': { id: 'C', name: 'PC C', ip: '192.168.1.3', mac: 'CC:CC', x: 0, y: 0 },
  'D': { id: 'D', name: 'PC D', ip: '192.168.1.4', mac: 'DD:DD', x: 0, y: 0 }
};

const SPEED = 250;

export default function TopologiJaringan() {
  const [currentMode, setCurrentMode] = useState<'STAR_SWITCH' | 'STAR_HUB' | 'BUS' | 'RING' | 'MESH'>('STAR_SWITCH');
  const [sourceId, setSourceId] = useState('A');
  const [destId, setDestId] = useState('C');
  const [logs, setLogs] = useState<LogEntry[]>([{ time: '00:00', type: 'normal', msg: 'Sistem Jaringan Siap. Topologi aktif.' }]);
  const [nodes, setNodes] = useState<{ [key: string]: Node }>({ ...INITIAL_NODES });
  const [activeFlashes, setActiveFlashes] = useState<{ [key: string]: string }>({});

  const packetsRef = useRef<Packet[]>([]);
  const nodesRef = useRef(nodes);
  const animFrameIdRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef(0);
  const isSimulatingRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'normal') => {
    const time = new Date().toISOString().substring(14, 19);
    setLogs(prev => [...prev, { time, type, msg }]);
  }, []);

  const triggerFlash = useCallback((nodeId: string, type: string) => {
    setActiveFlashes(prev => ({ ...prev, [nodeId]: type }));
    setTimeout(() => {
      setActiveFlashes(prev => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
    }, 500);
  }, []);

  const updateNodePositions = useCallback(() => {
    const newNodes = { ...INITIAL_NODES };
    
    if (currentMode.startsWith('STAR') || currentMode === 'MESH') {
      newNodes['A'].x = 100; newNodes['A'].y = 100;
      newNodes['B'].x = 500; newNodes['B'].y = 100;
      newNodes['C'].x = 500; newNodes['C'].y = 400;
      newNodes['D'].x = 100; newNodes['D'].y = 400;
    } else if (currentMode === 'BUS') {
      newNodes['A'].x = 100; newNodes['A'].y = 120;
      newNodes['B'].x = 250; newNodes['B'].y = 120;
      newNodes['D'].x = 400; newNodes['D'].y = 120;
      newNodes['C'].x = 550; newNodes['C'].y = 120;
    } else if (currentMode === 'RING') {
      newNodes['A'].x = 150; newNodes['A'].y = 250;
      newNodes['B'].x = 300; newNodes['B'].y = 100;
      newNodes['C'].x = 450; newNodes['C'].y = 250;
      newNodes['D'].x = 300; newNodes['D'].y = 400;
    }
    
    setNodes(newNodes);
  }, [currentMode]);

  useEffect(() => {
    updateNodePositions();
  }, [updateNodePositions]);

  const sendPacket = useCallback((srcId: string, dstId: string, isCollisionTest: boolean = false) => {
    const srcNode = nodesRef.current[srcId];
    const dstNode = nodesRef.current[dstId];
    const label = `To:${dstId}`;
    const createdPackets: Packet[] = [];

    if (currentMode === 'STAR_HUB') {
      Object.keys(nodesRef.current).forEach(nId => {
        if (nId !== srcId) {
          createdPackets.push({
            src: srcId, dst: dstId, targetNodeId: nId,
            x: srcNode.x, y: srcNode.y, color: '#facc15', label: label,
            waypoints: [
              { x: 300, y: 250 },
              { x: nodesRef.current[nId].x, y: nodesRef.current[nId].y, final: true, targetId: nId }
            ],
            wpIdx: 0, isCollisionTest, isLost: false
          });
        }
      });
      addLog(`HUB: ${srcNode.ip} Broadcast paket (Tujuan ${dstNode.ip}) ke semua port.`, 'warning');
    } else if (currentMode === 'STAR_SWITCH') {
      createdPackets.push({
        src: srcId, dst: dstId, targetNodeId: dstId,
        x: srcNode.x, y: srcNode.y, color: '#38bdf8', label: label,
        waypoints: [
          { x: 300, y: 250, action: 'check_mac' },
          { x: dstNode.x, y: dstNode.y, final: true, targetId: dstId }
        ],
        wpIdx: 0, isCollisionTest, isLost: false
      });
      addLog(`SWITCH: ${srcNode.ip} mengirim Unicast ke ${dstNode.ip}.`);
    } else if (currentMode === 'MESH') {
      createdPackets.push({
        src: srcId, dst: dstId, targetNodeId: dstId,
        x: srcNode.x, y: srcNode.y, color: '#38bdf8', label: label,
        waypoints: [{ x: dstNode.x, y: dstNode.y, final: true, targetId: dstId }],
        wpIdx: 0, isCollisionTest, isLost: false
      });
      addLog(`MESH: ${srcNode.ip} mengirim langsung ke ${dstNode.ip}.`);
    } else if (currentMode === 'BUS') {
      Object.keys(nodesRef.current).forEach(nId => {
        if (nId !== srcId) {
          createdPackets.push({
            src: srcId, dst: dstId, targetNodeId: nId,
            x: srcNode.x, y: srcNode.y, color: '#facc15', label: label,
            waypoints: [
              { x: srcNode.x, y: 250 },
              { x: nodesRef.current[nId].x, y: 250 },
              { x: nodesRef.current[nId].x, y: nodesRef.current[nId].y, final: true, targetId: nId }
            ],
            wpIdx: 0, isCollisionTest, isLost: false
          });
        }
      });
      addLog(`BUS: Sinyal dari ${srcNode.ip} merambat ke seluruh Backbone.`, 'warning');
    } else if (currentMode === 'RING') {
      const ringOrder = ['A', 'B', 'C', 'D'];
      const startIdx = ringOrder.indexOf(srcId);
      const wps: Waypoint[] = [];
      let currIdx = startIdx;
      
      while (true) {
        currIdx = (currIdx + 1) % ringOrder.length;
        const nId = ringOrder[currIdx];
        const isFinal = nId === dstId;
        wps.push({
          x: nodesRef.current[nId].x, y: nodesRef.current[nId].y,
          hopId: isFinal ? null : nId,
          final: isFinal, targetId: nId
        });
        if (isFinal) break;
      }
      
      createdPackets.push({
        src: srcId, dst: dstId, targetNodeId: dstId,
        x: srcNode.x, y: srcNode.y, color: '#a855f7', label: label,
        waypoints: wps, wpIdx: 0, isCollisionTest, isLost: false
      });
      addLog(`RING: Token dari ${srcNode.ip} berjalan menuju ${dstNode.ip}.`);
    }

    packetsRef.current = [...packetsRef.current, ...createdPackets];
    
    if (!isSimulatingRef.current) {
      isSimulatingRef.current = true;
      lastTimeRef.current = performance.now();
      requestAnimationFrame(updateSimulation);
    }
  }, [currentMode, addLog]);

  const updateSimulation = useCallback((timestamp: number) => {
    const dt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    if (currentMode === 'BUS' || currentMode === 'STAR_HUB') {
      for (let i = 0; i < packetsRef.current.length; i++) {
        for (let j = i + 1; j < packetsRef.current.length; j++) {
          const p1 = packetsRef.current[i];
          const p2 = packetsRef.current[j];
          
          if (p1.isCollisionTest && p2.isCollisionTest && !p1.isLost && !p2.isLost) {
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            let isColliding = false;
            
            if (currentMode === 'STAR_HUB' && dist < 20 && p1.wpIdx === 0 && p2.wpIdx === 0) {
              isColliding = true;
            } else if (currentMode === 'BUS' && dist < 20 && p1.y > 240 && p2.y > 240) {
              isColliding = true;
            }

            if (isColliding) {
              addLog('COLLISION DETECTED! Sinyal bertabrakan.', 'error');
              p1.isLost = true;
              p2.isLost = true;
            }
          }
        }
      }
    }

    for (let i = packetsRef.current.length - 1; i >= 0; i--) {
      const p = packetsRef.current[i];
      if (p.isLost) {
        packetsRef.current.splice(i, 1);
        continue;
      }

      const target = p.waypoints[p.wpIdx];
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.hypot(dx, dy);
      const move = SPEED * dt;

      if (dist <= move) {
        p.x = target.x;
        p.y = target.y;

        if (target.hopId) {
          triggerFlash(target.hopId, 'yellow');
          addLog(`Paket transit melewati ${nodesRef.current[target.hopId].ip}...`);
        }

        if (target.final && target.targetId) {
          packetsRef.current.splice(i, 1);
          if (target.targetId === p.dst) {
            addLog(`${nodesRef.current[target.targetId].ip} Menerima data dari ${nodesRef.current[p.src].ip}.`, 'success');
            triggerFlash(target.targetId, 'green');
          } else {
            addLog(`${nodesRef.current[target.targetId].ip} Menolak data (Bukan tujuan).`, 'error');
            triggerFlash(target.targetId, 'red');
          }
        } else {
          p.wpIdx++;
        }
      } else {
        p.x += (dx / dist) * move;
        p.y += (dy / dist) * move;
      }
    }

    if (packetsRef.current.length > 0) {
      animFrameIdRef.current = requestAnimationFrame(updateSimulation);
    } else {
      isSimulatingRef.current = false;
    }
  }, [currentMode, addLog, triggerFlash]);

  const handleSendPacket = () => {
    sendPacket(sourceId, destId, false);
  };

  const handleCollisionTest = () => {
    if (currentMode === 'STAR_SWITCH' || currentMode === 'MESH' || currentMode === 'RING') {
      addLog(`Topologi ${currentMode} aman dari Collision.`, 'success');
    }
    sendPacket('A', 'C', true);
    sendPacket('D', 'B', true);
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const getDestOptions = () => {
    return ['A', 'B', 'C', 'D'].filter(id => id !== sourceId);
  };

  const renderCables = () => {
    const elements: React.ReactNode[] = [];

    if (currentMode === 'BUS') {
      elements.push(
        <line key="backbone" x1="50" y1="250" x2="600" y2="250" stroke="#1e293b" strokeWidth="8" />
      );
      Object.values(nodes).forEach(n => {
        elements.push(
          <line key={`tap-${n.id}`} x1={n.x} y1={n.y} x2={n.x} y2="250" stroke="#94a3b8" strokeWidth="4" />
        );
        elements.push(
          <circle key={`joint-${n.id}`} cx={n.x} cy="250" r="5" fill="#000" />
        );
      });
    } else if (currentMode === 'RING') {
      const points = [nodes['A'], nodes['B'], nodes['C'], nodes['D']].map(n => `${n.x},${n.y}`).join(' ');
      elements.push(
        <polygon key="ring" points={points} fill="none" stroke="#94a3b8" strokeWidth="6" />
      );
    } else if (currentMode === 'MESH') {
      const keys = Object.keys(nodes);
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          elements.push(
            <line
              key={`mesh-${i}-${j}`}
              x1={nodes[keys[i]].x}
              y1={nodes[keys[i]].y}
              x2={nodes[keys[j]].x}
              y2={nodes[keys[j]].y}
              stroke="#cbd5e1"
              strokeWidth="4"
            />
          );
        }
      }
    } else {
      Object.values(nodes).forEach(n => {
        elements.push(
          <line key={`star-${n.id}`} x1={n.x} y1={n.y} x2="300" y2="250" stroke="#94a3b8" strokeWidth="6" />
        );
      });
    }

    return elements;
  };

  const renderPackets = () => {
    return packetsRef.current.map((p, i) => {
      if (p.isLost) return null;
      return (
        <g key={`packet-${i}`} transform={`translate(${p.x}, ${p.y})`}>
          <rect x="-15" y="-10" width="30" height="20" rx="3" fill={p.color} stroke="#000" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="900" fontFamily="Space Grotesk" fill="#000">{p.label}</text>
        </g>
      );
    });
  };

  const getCenterDeviceColor = () => {
    return currentMode === 'STAR_HUB' ? '#f43f5e' : '#10b981';
  };

  const getCenterLabel = () => {
    return currentMode === 'STAR_HUB' ? 'HUB' : 'SWITCH';
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-sky-300 neo-box p-6 w-full relative border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">ILMU KOMPUTER & JARINGAN</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: TOPOLOGI JARINGAN
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">
          Simulasi Pergerakan Data pada Mode Star, Bus, Ring, dan Mesh
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#38bdf8] text-md transform rotate-2 z-30 uppercase">
            Pusat Kendali
          </span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Topologi & Perangkat</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'STAR_SWITCH', label: '🌟 STAR (SWITCH)' },
                  { id: 'STAR_HUB', label: '🔀 STAR (HUB)' },
                  { id: 'BUS', label: '🚌 BUS LINE' },
                  { id: 'RING', label: '⭕ RING' },
                  { id: 'MESH', label: '🕸️ FULL MESH', span: true }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentMode(item.id as typeof currentMode)}
                    className={`neo-btn py-2 px-1 text-[10px] font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none ${currentMode === item.id ? 'bg-emerald-300 ring-4 ring-black' : 'bg-slate-200 text-slate-600'} ${item.span ? 'col-span-2' : ''}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 rounded-lg">
              <label className="text-[11px] font-black uppercase text-blue-800 border-b-2 border-blue-200 pb-1">Pengiriman Unicast (1 ke 1)</label>
              
              <div className="flex justify-between items-center gap-2">
                <div className="flex flex-col w-1/2">
                  <span className="text-[9px] font-bold text-slate-600 mb-1">Pengirim:</span>
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="border-4 border-black shadow-[2px_2px_0px_0px_#000] p-2 font-bold text-sm rounded cursor-pointer focus:bg-yellow-200 outline-none"
                  >
                    {['A', 'B', 'C', 'D'].map(id => (
                      <option key={id} value={id}>{nodes[id]?.ip} (PC {id})</option>
                    ))}
                  </select>
                </div>
                <span className="font-black text-xl mt-4">➔</span>
                <div className="flex flex-col w-1/2">
                  <span className="text-[9px] font-bold text-slate-600 mb-1">Tujuan:</span>
                  <select
                    value={destId}
                    onChange={(e) => setDestId(e.target.value)}
                    className="border-4 border-black shadow-[2px_2px_0px_0px_#000] p-2 font-bold text-sm rounded cursor-pointer focus:bg-yellow-200 outline-none"
                  >
                    {getDestOptions().map(id => (
                      <option key={id} value={id}>{nodes[id]?.ip} (PC {id})</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleSendPacket}
                className="neo-btn bg-sky-400 hover:bg-sky-300 text-black py-3 mt-2 text-xs font-bold w-full border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                ✉️ KIRIM PAKET DATA
              </button>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2 rounded-lg">
              <label className="text-[11px] font-black uppercase text-rose-800 mb-1">Uji Kerentanan Jaringan</label>
              <button
                onClick={handleCollisionTest}
                className="neo-btn bg-rose-500 hover:bg-rose-400 text-white py-3 text-[10px] font-bold w-full border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                💥 SIMULASIKAN TRAFIK BERSAMAAN
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4 rounded-lg">
            <h4 className="font-black text-sky-400 text-[10px] mb-2 uppercase tracking-widest border-b-2 border-slate-700 pb-1">LOG AKTIVITAS (PACKET SNIFFER)</h4>
            
            <div
              ref={logRef}
              className="bg-black p-2 border-2 border-slate-700 text-left h-40 overflow-y-auto font-mono text-[10px] leading-relaxed flex flex-col gap-1 rounded"
            >
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.type === 'error' ? 'text-rose-400 font-bold' :
                    log.type === 'success' ? 'text-emerald-400 font-bold' :
                    log.type === 'system' ? 'text-yellow-300 font-bold' :
                    log.type === 'warning' ? 'text-orange-400 font-bold' :
                    'text-sky-200'
                  }
                >
                  [{log.time}] {log.type === 'error' && '❌'} {log.type === 'success' && '✅'} {log.type === 'system' && '⚡'} {log.type === 'warning' && '⚠️'} {log.msg}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-[#f8fafc] p-0 relative flex flex-col w-full h-[650px] border-8 border-black overflow-hidden rounded-xl shadow-[8px_8px_0px_0px_#000000]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">
              Denah Jaringan (LAN)
            </span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000] rounded">
              <div className="flex items-center gap-2"><div className="w-4 h-2 bg-sky-400 border border-black"></div> Unicast</div>
              <div className="flex items-center gap-2"><div className="w-4 h-2 bg-yellow-400 border border-black"></div> Broadcast</div>
              <div className="flex items-center gap-2"><div className="w-4 h-2 bg-purple-500 border border-black"></div> Token Ring</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-400 border border-black rounded-full"></div> Diterima</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 border border-black rounded-full"></div> Ditolak</div>
            </div>

            <div className="w-full h-full flex justify-center items-center pt-8 p-4">
              <svg viewBox="0 0 600 500" className="w-full h-full overflow-visible">
                <defs>
                  <g id="pcIcon">
                    <rect x="-25" y="-30" width="50" height="40" rx="3" fill="#1e293b" stroke="#000" strokeWidth="3" />
                    <rect x="-20" y="-25" width="40" height="30" fill="#f8fafc" />
                    <rect x="-5" y="10" width="10" height="15" fill="#64748b" stroke="#000" strokeWidth="3" />
                    <rect x="-15" y="25" width="30" height="5" fill="#64748b" stroke="#000" strokeWidth="3" />
                  </g>
                </defs>

                <g id="cablesGroup">
                  {renderCables()}
                </g>

                {currentMode.startsWith('STAR') && (
                  <g transform="translate(300, 250)">
                    <rect x="-40" y="-25" width="80" height="50" rx="4" fill={getCenterDeviceColor()} stroke="#000" strokeWidth="4" />
                    <rect x="-30" y="-15" width="10" height="10" fill="#000" />
                    <rect x="-15" y="-15" width="10" height="10" fill="#000" />
                    <rect x="0" y="-15" width="10" height="10" fill="#000" />
                    <rect x="15" y="-15" width="10" height="10" fill="#000" />
                    <text x="0" y="15" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="14" fill="#fff">{getCenterLabel()}</text>
                  </g>
                )}

                <g id="nodesGroup">
                  {Object.values(nodes).map(node => (
                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                      <use href="#pcIcon" />
                      <rect
                        x="-20"
                        y="-25"
                        width="40"
                        height="30"
                        fill={
                          activeFlashes[node.id] === 'green' ? '#dcfce7' :
                          activeFlashes[node.id] === 'red' ? '#fee2e2' :
                          activeFlashes[node.id] === 'yellow' ? '#fef9c3' : 'transparent'
                        }
                        className="transition-colors duration-300"
                      />
                      <text x="0" y="-35" textAnchor="middle" fontWeight="900" fontSize="14">{node.name}</text>
                      <text x="0" y="45" textAnchor="middle" fontWeight="bold" fontSize="10" fill="#475569">{node.ip}</text>
                      <text x="0" y="57" textAnchor="middle" fontWeight="bold" fontSize="9" fill="#64748b">MAC: {node.mac}</text>
                    </g>
                  ))}
                </g>

                <g id="packetsGroup">
                  {renderPackets()}
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-sky-50 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black rounded-xl shadow-[8px_8px_0px_0px_#000000]">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          Buku Panduan: Memilih Topologi Jaringan 📖
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-xl uppercase text-emerald-600 border-b-2 border-black pb-1 mb-2">🌟 STAR (SWITCH)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Topologi paling umum hari ini. Semua PC terhubung ke satu titik pusat cerdas (Switch). Switch membaca MAC Address dan meneruskan paket <b>hanya</b> ke PC tujuan (Unicast).
            </p>
            <div className="bg-emerald-50 p-2 border-2 border-emerald-200 text-xs text-emerald-900 font-bold rounded">
              ✅ Bebas dari tabrakan data. Aman dari penyadapan.<br />
              ❌ Jika Switch rusak, seluruh jaringan mati (Single Point of Failure).
            </div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-xl uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">🔀 STAR (HUB)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Secara fisik berbentuk bintang, namun secara logika bekerja seperti Bus. Hub "bodoh" dan menyalin paket yang masuk ke <b>semua port</b> (Broadcast).
            </p>
            <div className="bg-rose-50 p-2 border-2 border-rose-200 text-xs text-rose-900 font-bold rounded">
              ✅ Murah dan mudah dikonfigurasi.<br />
              ❌ Rentan penyadapan dan sering terjadi <b>Tabrakan (Collision)</b>.
            </div>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-xl uppercase text-yellow-600 border-b-2 border-black pb-1 mb-2">🚌 BUS (Jalur Tunggal)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              Semua PC menempel pada satu kabel tulang punggung utama (Backbone). Data menjalar ke dua arah dan ditangkap oleh semua PC.
            </p>
            <div className="bg-yellow-50 p-2 border-2 border-yellow-200 text-xs text-yellow-900 font-bold rounded">
              ✅ Sangat hemat kabel.<br />
              ❌ Paling rawan tabrakan. Jika kabel utama putus, jaringan terbelah dua.
            </div>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000] rounded-lg">
            <h4 className="font-black text-xl uppercase text-purple-600 border-b-2 border-black pb-1 mb-2">⭕ RING & 🕸️ MESH</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              <b>Ring:</b> Data berputar searah jarum jam secara estafet.<br />
              <b>Mesh:</b> Semua PC saling terhubung langsung satu sama lain.
            </p>
            <div className="bg-purple-50 p-2 border-2 border-purple-200 text-xs text-purple-900 font-bold rounded">
              ✅ Mesh: Tidak mungkin down sepenuhnya. Super cepat.<br />
              ❌ Mesh: Sangat mahal dan butuh terlalu banyak kabel.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}