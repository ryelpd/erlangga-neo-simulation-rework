import { useState, useEffect, useRef } from 'react';

interface Packet {
  id: number;
  type: 'DATA' | 'SYN' | 'SYN-ACK' | 'ACK';
  dir: 'C2S' | 'S2C';
  seqNum: number | string;
  x: number;
  targetX: number;
  isLost: boolean;
  lostX: number;
  spawnTime: number;
  hasProcessed: boolean;
}

const PC_X = 130;
const SERVER_X = 670;
const PATH_Y = 200;
const SPEED = 250;
const TCP_TIMEOUT = 2500;

export default function JaringanProtokol() {
  const [currentMode, setCurrentMode] = useState<'TCP' | 'UDP'>('TCP');
  const [lossRate, setLossRate] = useState(20);
  const [stats, setStats] = useState({ sent: 0, received: 0, lost: 0 });
  const [tcpState, setTcpState] = useState<'CLOSED' | 'SYN_SENT' | 'ESTABLISHED'>('CLOSED');
  const [logs, setLogs] = useState<string[]>(['Sistem Siap. Menunggu perintah...']);
  const [serverBuffer, setServerBuffer] = useState<number[]>([]);
  const [activePackets, setActivePackets] = useState<Packet[]>([]);
  
  const packetLayerRef = useRef<SVGGElement>(null);
  const serverBufferGroupRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const sendQueueRef = useRef<{ seqNum: number; attempt: number; lastSentTime: number; acked: boolean }[]>([]);
  const statsRef = useRef(stats); // Keep ref for animation loop

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-20), msg]);
  };

  const resetSim = () => {
    setStats({ sent: 0, received: 0, lost: 0 });
    setTcpState('CLOSED');
    sendQueueRef.current = [];
    setActivePackets([]);
    setServerBuffer([]);
    setLogs(['Sistem di-reset. Siap menerima perintah.']);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    lastTimeRef.current = 0;
    requestAnimationFrame(drawFrame);
  };

  const setMode = (mode: 'TCP' | 'UDP') => {
    setCurrentMode(mode);
    resetSim();
    addLog(`Mode diubah ke ${mode}`);
  };

  const spawnPacket = (type: Packet['type'], dir: Packet['dir'], seqNum: number | string = 0): Packet => {
    const isClientToServer = dir === 'C2S';
    const startX = isClientToServer ? PC_X : SERVER_X;
    const targetX = isClientToServer ? SERVER_X : PC_X;

    const isLost = Math.random() < (lossRate / 100);
    let lostX = 0;
    if (isLost) {
      lostX = PC_X + 100 + Math.random() * (SERVER_X - PC_X - 200);
    }

    const pkt: Packet = {
      id: Date.now() + Math.random(),
      type, dir, seqNum,
      x: startX, targetX,
      isLost, lostX,
      spawnTime: performance.now(),
      hasProcessed: false
    };

    setActivePackets(prev => [...prev, pkt]);

    if (type === 'DATA') {
      setStats(prev => ({ ...prev, sent: prev.sent + 1 }));
    }

    return pkt;
  };

  const drawFrame = (timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    // TCP Queue Processing
    if (currentMode === 'TCP' && tcpState === 'ESTABLISHED') {
      const now = performance.now();
      sendQueueRef.current.forEach(item => {
        if (!item.acked) {
          if (item.lastSentTime === 0 || (now - item.lastSentTime > TCP_TIMEOUT)) {
            if (item.lastSentTime > 0) addLog(`TCP: Retransmission D${item.seqNum}`);
            else addLog(`TCP: Mengirim D${item.seqNum}`);
            spawnPacket('DATA', 'C2S', item.seqNum);
            item.lastSentTime = now;
          }
        }
      });
    }

    // Move Packets
    let packetsUpdated = false;

    const newPackets = activePackets.filter(p => {
      if (p.hasProcessed) return false;

      let dirMult = p.dir === 'C2S' ? 1 : -1;
      p.x += SPEED * dt * dirMult;

      // Check Loss
      let pastLossPoint = (p.dir === 'C2S' && p.x >= p.lostX) || (p.dir === 'S2C' && p.x <= p.lostX);
      if (p.isLost && pastLossPoint) {
        p.hasProcessed = true;
        packetsUpdated = true;
        
        if (p.type === 'DATA') {
          setStats(s => ({ ...s, lost: s.lost + 1 }));
          addLog(`[X] Paket D${p.seqNum} hilang!`);
        } else {
          addLog(`[X] Paket ${p.type} hilang!`);
        }
        return false; // Remove
      }

      // Check Arrival
      let hasArrived = (p.dir === 'C2S' && p.x >= p.targetX) || (p.dir === 'S2C' && p.x <= p.targetX);
      if (hasArrived) {
        p.hasProcessed = true;
        packetsUpdated = true;

        if (p.dir === 'C2S') {
          if (p.type === 'DATA') {
            setStats(s => ({ ...s, received: s.received + 1 }));
            addLog(`[+] Server menerima D${p.seqNum}`);
            setServerBuffer(prev => [...prev.slice(-9), Number(p.seqNum)]);

            if (currentMode === 'TCP') {
              spawnPacket('ACK', 'S2C', Number(p.seqNum));
            }
          } else if (p.type === 'SYN') {
            addLog('TCP: Server menerima SYN, membalas SYN-ACK');
            spawnPacket('SYN-ACK', 'S2C');
          }
        } else {
          if (p.type === 'SYN-ACK') {
            addLog('TCP: Client menerima SYN-ACK, membalas ACK');
            spawnPacket('ACK', 'C2S', 'H');
            setTcpState('ESTABLISHED');
            addLog('TCP: KONEKSI ESTABLISHED!');
          } else if (p.type === 'ACK') {
             if (p.seqNum !== 'H') {
               addLog(`[+] Client menerima ACK untuk D${p.seqNum}`);
               let qItem = sendQueueRef.current.find(q => q.seqNum === p.seqNum);
               if (qItem) qItem.acked = true;
             }
          }
        }
        return false; // Remove
      }

      return true;
    });

    if (packetsUpdated || activePackets.length > 0) {
      setActivePackets(newPackets);
    }

    animationRef.current = requestAnimationFrame(drawFrame);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(animationRef.current);
  }, [currentMode, tcpState, lossRate, activePackets]);

  const handleSend = () => {
    if (currentMode === 'UDP') {
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => spawnPacket('DATA', 'C2S', i), i * 300);
      }
    } else {
      for (let i = 1; i <= 5; i++) {
        sendQueueRef.current.push({ seqNum: i, attempt: 1, lastSentTime: 0, acked: false });
      }
      if (tcpState === 'CLOSED') {
        addLog('TCP: Memulai Three-Way Handshake...');
        setTcpState('SYN_SENT');
        spawnPacket('SYN', 'C2S');
      } else if (tcpState === 'ESTABLISHED') {
        // Trigger queue processing in next frame
      }
    }
  };

  const getPacketColor = (type: string) => {
    if (type === 'DATA') return currentMode === 'UDP' ? '#f97316' : '#38bdf8';
    if (type === 'SYN' || type === 'SYN-ACK') return '#facc15';
    if (type === 'ACK') return '#34d399';
    return '#fff';
  };

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center font-sans">
      <style>{`
        body { font-family: 'Space Grotesk', sans-serif; background-color: #fdfbf7; background-image: radial-gradient(#000000 1.5px, transparent 1.5px); background-size: 24px 24px; }
        .neo-box { background-color: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0px 0px #000000; border-radius: 12px; }
        .neo-btn { border: 4px solid #000000; box-shadow: 4px 4px 0px 0px #000000; border-radius: 8px; transition: all 0.1s ease-in-out; font-weight: bold; cursor: pointer; text-transform: uppercase; }
        .neo-btn:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0px 0px #000000; }
        .bg-pattern-dot { background-color: #f8fafc; background-image: radial-gradient(#cbd5e1 2px, transparent 2px); background-size: 20px 20px; }
      `}</style>

      <header className="text-center mb-8 max-w-6xl bg-indigo-300 neo-box p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 text-black">ILMU KOMPUTER & JARINGAN</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: PROTOKOL TCP VS UDP</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Simulasi Pengiriman Paket Data</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="neo-box bg-white p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#818cf8] text-md transform rotate-2 z-30 uppercase">Pengaturan Jaringan</span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Protokol Transport</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode('TCP')} className={`mode-btn neo-btn py-2 px-2 text-xs font-bold w-full ${currentMode === 'TCP' ? 'bg-emerald-400 text-black ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}>🛡️ TCP (Reliable)</button>
                <button onClick={() => setMode('UDP')} className={`mode-btn neo-btn py-2 px-2 text-xs font-bold w-full ${currentMode === 'UDP' ? 'bg-emerald-400 text-black ring-4 ring-black' : 'bg-slate-200 text-slate-600'}`}>🚀 UDP (Fast)</button>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Tingkat Gangguan</span>
                <span className="font-mono font-black text-sm bg-white px-2 border-2 border-black">{lossRate}%</span>
              </div>
              <input type="range" min="0" max="80" step="5" value={lossRate} onChange={(e) => setLossRate(Number(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button onClick={handleSend} className="neo-btn bg-sky-400 hover:bg-sky-300 py-4 text-sm flex-1 flex items-center justify-center gap-2">📡 KIRIM 5 PAKET</button>
              <button onClick={resetSim} className="neo-btn bg-slate-800 text-white hover:bg-slate-700 py-4 px-4 text-xs">🔄 RESET</button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-indigo-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">STATISTIK PENGIRIMAN</h4>
            
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Terkirim</span>
                <span className="text-xl font-black text-sky-400">{stats.sent}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-emerald-600 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Diterima</span>
                <span className="text-xl font-black text-emerald-400">{stats.received}</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-rose-600 rounded">
                <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Hilang</span>
                <span className="text-xl font-black text-rose-400">{stats.lost}</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-slate-700 text-left h-24 overflow-y-auto font-mono text-[10px] leading-tight flex flex-col gap-1">
              {logs.map((log, i) => (
                <div key={i} className={log.includes('[X]') ? 'text-rose-400' : (log.includes('[+]') ? 'text-emerald-400' : 'text-sky-300')}>{'>'} {log}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="neo-box bg-pattern-dot p-0 relative flex flex-col items-center w-full h-[600px] border-8 border-black overflow-hidden">
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] transform -rotate-1 z-30 uppercase">Visualisasi Aliran Data</span>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
              <svg viewBox="0 0 800 400" className="w-full h-full overflow-visible">
                <line x1="150" y1="200" x2="650" y2="200" stroke="#cbd5e1" strokeWidth="8" strokeDasharray="15 10" />
                
                <g transform="translate(70, 160)">
                    <path d="M -40 60 L 40 60 L 50 70 L -50 70 Z" fill="#64748b" stroke="#000" strokeWidth="3" />
                    <rect x="-35" y="0" width="70" height="55" rx="3" fill="#1e293b" stroke="#000" strokeWidth="3" />
                    <rect x="-30" y="5" width="60" height="45" fill="#38bdf8" />
                    <text x="0" y="-15" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily="Space Grotesk">CLIENT</text>
                    <rect x="-35" y="90" width="70" height="20" fill={currentMode === 'TCP' ? (tcpState === 'ESTABLISHED' ? '#34d399' : (tcpState === 'SYN_SENT' ? '#facc15' : '#facc15')) : '#94a3b8'} stroke="#000" strokeWidth="2"/>
                    <text x="0" y="104" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#000">{currentMode === 'TCP' ? tcpState : ''}</text>
                </g>

                <g transform="translate(730, 130)">
                    <rect x="-35" y="0" width="70" height="120" fill="#334155" stroke="#000" strokeWidth="4" />
                    <text x="0" y="-15" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily="Space Grotesk">SERVER</text>
                    <g transform="translate(-80, -30)" ref={serverBufferGroupRef}>
                        <text x="0" y="0" fontSize="10" fontWeight="bold" fill="#64748b">Buffer:</text>
                        {serverBuffer.map((num, i) => (
                           <g key={i} transform={`translate(${(i % 5) * 18}, ${Math.floor(i / 5) * 18 + 10})`}>
                             <rect width="15" height="15" fill={currentMode === 'UDP' ? '#f97316' : '#38bdf8'} stroke="#000" />
                             <text x="7.5" y="11" textAnchor="middle" fontSize="8" fontWeight="bold" fill={currentMode === 'UDP' ? '#fff' : '#000'}>{num}</text>
                           </g>
                        ))}
                    </g>
                </g>

                <g ref={packetLayerRef}>
                  {activePackets.map(p => (
                    <g key={p.id} transform={`translate(${p.x}, ${PATH_Y})`}>
                      <rect x="-15" y="-10" width="30" height="20" rx="2" fill={getPacketColor(p.type)} stroke="#000" strokeWidth="2" />
                      <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill={p.type === 'DATA' && currentMode === 'UDP' ? '#fff' : '#000'}>
                        {p.type === 'DATA' ? 'D'+p.seqNum : p.type}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-100 neo-box p-6 w-full max-w-6xl z-10 relative mb-10 border-4 border-black text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">Buku Panduan: Memilih Protokol 📖</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-xl uppercase text-emerald-700 border-b-2 border-black pb-1 mb-2">🛡️ TCP</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Mengutamakan <b>Keandalan</b>. Three-Way Handshake & Retransmission jika paket hilang.
            </p>
            <p className="text-xs font-medium text-slate-600 bg-white p-2 border-2 border-black">
              <b>Kegunaan:</b> Web Browsing, Email, FTP.
            </p>
          </div>
          
          <div className="bg-sky-50 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-xl uppercase text-sky-700 border-b-2 border-black pb-1 mb-2">🚀 UDP</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Mengutamakan <b>Kecepatan</b>. Tanpa koneksi & tanpa retransmission. Packet loss = data hilang.
            </p>
            <p className="text-xs font-medium text-slate-600 bg-white p-2 border-2 border-black">
              <b>Kegunaan:</b> Video Streaming, VoIP, Game Online.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
