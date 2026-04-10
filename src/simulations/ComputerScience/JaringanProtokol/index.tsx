import { useRef, useEffect, useCallback } from 'react';

interface Packet {
  id: number;
  type: 'DATA' | 'SYN' | 'SYN-ACK' | 'ACK';
  dir: 'C2S' | 'S2C';
  seqNum: number | string;
  x: number;
  targetX: number;
  isLost: boolean;
  lostX: number;
  hasProcessed: boolean;
}

interface SendQueueItem {
  seqNum: number;
  lastSentTime: number;
  acked: boolean;
}

interface Stats {
  sent: number;
  received: number;
  lost: number;
}

const PC_X = 130;
const SERVER_X = 670;
const PATH_Y = 200;
const SPEED = 250;
const TCP_TIMEOUT = 2500;

export default function JaringanProtokol() {
  const stateRef = useRef({
    currentMode: 'TCP' as 'TCP' | 'UDP',
    lossRate: 20,
    stats: { sent: 0, received: 0, lost: 0 } as Stats,
    tcpState: 'CLOSED' as 'CLOSED' | 'SYN_SENT' | 'ESTABLISHED',
    logs: ['Sistem Siap. Menunggu perintah...'] as string[],
    serverBuffer: [] as number[],
    packets: [] as Packet[],
    sendQueue: [] as SendQueueItem[],
    lastTime: 0,
    animationId: 0,
  });

  const modeBtnTcpRef = useRef<HTMLButtonElement>(null);
  const modeBtnUdpRef = useRef<HTMLButtonElement>(null);
  const lossSliderRef = useRef<HTMLInputElement>(null);
  const lossValRef = useRef<HTMLSpanElement>(null);

  const statSentRef = useRef<HTMLSpanElement>(null);
  const statReceivedRef = useRef<HTMLSpanElement>(null);
  const statLostRef = useRef<HTMLSpanElement>(null);
  const logsDivRef = useRef<HTMLDivElement>(null);
  const serverBufferDivRef = useRef<HTMLDivElement>(null);
  const tcpStateRectRef = useRef<SVGRectElement>(null);
  const tcpStateTextRef = useRef<SVGTextElement>(null);

  const packetSvgRef = useRef<SVGGElement>(null);

  const addLog = useCallback((msg: string) => {
    const state = stateRef.current;
    state.logs = [...state.logs.slice(-20), msg];
    if (logsDivRef.current) {
      logsDivRef.current.innerHTML = state.logs.map(log => {
        const colorClass = log.includes('[X]') ? 'text-rose-400' : log.includes('[+]') ? 'text-emerald-400' : 'text-sky-300';
        return `<div class="${colorClass}">> ${log}</div>`;
      }).join('');
      logsDivRef.current.scrollTop = logsDivRef.current.scrollHeight;
    }
  }, []);

  const updateStatsUI = useCallback(() => {
    const state = stateRef.current;
    if (statSentRef.current) statSentRef.current.textContent = String(state.stats.sent);
    if (statReceivedRef.current) statReceivedRef.current.textContent = String(state.stats.received);
    if (statLostRef.current) statLostRef.current.textContent = String(state.stats.lost);
  }, []);

  const updateServerBufferUI = useCallback(() => {
    const state = stateRef.current;
    if (serverBufferDivRef.current) {
      serverBufferDivRef.current.innerHTML = state.serverBuffer.slice(-10).map(num => {
        const bgColor = state.currentMode === 'UDP' ? 'bg-orange-500 text-white' : 'bg-sky-400 text-black';
        return `<span class="inline-block w-5 h-5 ${bgColor} border-2 border-black font-bold text-xs text-center leading-5 m-0.5">${num}</span>`;
      }).join('');
    }
  }, []);

  const updateTcpStateUI = useCallback(() => {
    const state = stateRef.current;
    if (tcpStateRectRef.current && tcpStateTextRef.current) {
      if (state.currentMode === 'TCP') {
        tcpStateTextRef.current.textContent = state.tcpState;
        const bgColor = state.tcpState === 'ESTABLISHED' ? '#34d399' : state.tcpState === 'SYN_SENT' ? '#facc15' : '#facc15';
        tcpStateRectRef.current.setAttribute('fill', bgColor);
      } else {
        tcpStateTextRef.current.textContent = '';
        tcpStateRectRef.current.setAttribute('fill', '#94a3b8');
      }
    }
  }, []);

  const updatePacketsSvg = useCallback(() => {
    const state = stateRef.current;
    if (!packetSvgRef.current) return;

    while (packetSvgRef.current.firstChild) {
      packetSvgRef.current.removeChild(packetSvgRef.current.firstChild);
    }

    state.packets.forEach(p => {
      if (p.hasProcessed) return;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${p.x}, ${PATH_Y})`);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '-15');
      rect.setAttribute('y', '-10');
      rect.setAttribute('width', '30');
      rect.setAttribute('height', '20');
      rect.setAttribute('rx', '2');
      
      let fillColor = '#38bdf8';
      if (p.type === 'DATA' && state.currentMode === 'UDP') fillColor = '#f97316';
      if (p.type === 'SYN' || p.type === 'SYN-ACK') fillColor = '#facc15';
      if (p.type === 'ACK') fillColor = '#34d399';
      
      rect.setAttribute('fill', fillColor);
      rect.setAttribute('stroke', '#000');
      rect.setAttribute('stroke-width', '2');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '4');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-weight', 'bold');
      
      const textColor = (p.type === 'DATA' && state.currentMode === 'UDP') ? '#fff' : '#000';
      text.setAttribute('fill', textColor);
      text.textContent = p.type === 'DATA' ? 'D' + p.seqNum : p.type;

      g.appendChild(rect);
      g.appendChild(text);
      packetSvgRef.current!.appendChild(g);
    });
  }, []);

  const spawnPacket = useCallback((type: Packet['type'], dir: Packet['dir'], seqNum: number | string = 0): Packet => {
    const state = stateRef.current;
    const isClientToServer = dir === 'C2S';
    const startX = isClientToServer ? PC_X : SERVER_X;
    const targetX = isClientToServer ? SERVER_X : PC_X;

    const isLost = Math.random() < (state.lossRate / 100);
    let lostX = 0;
    if (isLost) {
      lostX = PC_X + 100 + Math.random() * (SERVER_X - PC_X - 200);
    }

    const pkt: Packet = {
      id: Date.now() + Math.random(),
      type, dir, seqNum,
      x: startX, targetX,
      isLost, lostX,
      hasProcessed: false
    };

    state.packets.push(pkt);

    if (type === 'DATA') {
      state.stats.sent++;
      updateStatsUI();
    }

    return pkt;
  }, [updateStatsUI]);

  const animate = useCallback((timestamp: number) => {
    const state = stateRef.current;
    if (!state.lastTime) state.lastTime = timestamp;
    const dt = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;

    if (state.currentMode === 'TCP' && state.tcpState === 'ESTABLISHED') {
      const now = performance.now();
      state.sendQueue.forEach(item => {
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

    state.packets = state.packets.filter(p => {
      if (p.hasProcessed) return false;

      const dirMult = p.dir === 'C2S' ? 1 : -1;
      p.x += SPEED * dt * dirMult;

      const pastLossPoint = (p.dir === 'C2S' && p.x >= p.lostX) || (p.dir === 'S2C' && p.x <= p.lostX);
      if (p.isLost && p.lostX > 0 && pastLossPoint) {
        p.hasProcessed = true;
        
        if (p.type === 'DATA') {
          state.stats.lost++;
          updateStatsUI();
          addLog(`[X] Paket D${p.seqNum} hilang!`);
        } else {
          addLog(`[X] Paket ${p.type} hilang!`);
        }
        return false;
      }

      const hasArrived = (p.dir === 'C2S' && p.x >= p.targetX) || (p.dir === 'S2C' && p.x <= p.targetX);
      if (hasArrived) {
        p.hasProcessed = true;

        if (p.dir === 'C2S') {
          if (p.type === 'DATA') {
            state.stats.received++;
            updateStatsUI();
            addLog(`[+] Server menerima D${p.seqNum}`);
            state.serverBuffer.push(Number(p.seqNum));
            state.serverBuffer = state.serverBuffer.slice(-10);
            updateServerBufferUI();

            if (state.currentMode === 'TCP') {
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
            state.tcpState = 'ESTABLISHED';
            updateTcpStateUI();
            addLog('TCP: KONEKSI ESTABLISHED!');
          } else if (p.type === 'ACK') {
            if (p.seqNum !== 'H') {
              addLog(`[+] Client menerima ACK untuk D${p.seqNum}`);
              const qItem = state.sendQueue.find(q => q.seqNum === Number(p.seqNum));
              if (qItem) qItem.acked = true;
            }
          }
        }
        return false;
      }

      return true;
    });

    updatePacketsSvg();
    state.animationId = requestAnimationFrame(animate);
  }, [addLog, spawnPacket, updateStatsUI, updateServerBufferUI, updateTcpStateUI, updatePacketsSvg]);

  const resetSim = useCallback(() => {
    const state = stateRef.current;
    state.stats = { sent: 0, received: 0, lost: 0 };
    state.tcpState = 'CLOSED';
    state.sendQueue = [];
    state.packets = [];
    state.serverBuffer = [];
    state.logs = ['Sistem di-reset. Siap menerima perintah.'];
    state.lastTime = 0;

    updateStatsUI();
    updateServerBufferUI();
    updateTcpStateUI();
    updatePacketsSvg();
    
    if (logsDivRef.current) {
      logsDivRef.current.innerHTML = '<div class="text-sky-300">> Sistem di-reset. Siap menerima perintah.</div>';
    }
  }, [updateStatsUI, updateServerBufferUI, updateTcpStateUI, updatePacketsSvg]);

  const setMode = useCallback((mode: 'TCP' | 'UDP') => {
    const state = stateRef.current;
    state.currentMode = mode;
    
    state.stats = { sent: 0, received: 0, lost: 0 };
    state.tcpState = 'CLOSED';
    state.sendQueue = [];
    state.packets = [];
    state.serverBuffer = [];
    state.lastTime = 0;

    updateStatsUI();
    updateServerBufferUI();
    updateTcpStateUI();
    updatePacketsSvg();
    
    if (logsDivRef.current) {
      logsDivRef.current.innerHTML = '<div class="text-sky-300">> Sistem di-reset. Siap menerima perintah.</div>';
    }

    if (modeBtnTcpRef.current && modeBtnUdpRef.current) {
      modeBtnTcpRef.current.classList.remove('ring-4', 'ring-black', 'bg-emerald-400');
      modeBtnTcpRef.current.classList.add('bg-slate-200', 'text-slate-600');
      modeBtnUdpRef.current.classList.remove('ring-4', 'ring-black', 'bg-emerald-400');
      modeBtnUdpRef.current.classList.add('bg-slate-200', 'text-slate-600');

      if (mode === 'TCP') {
        modeBtnTcpRef.current.classList.add('ring-4', 'ring-black', 'bg-emerald-400');
        modeBtnTcpRef.current.classList.remove('bg-slate-200', 'text-slate-600');
      } else {
        modeBtnUdpRef.current.classList.add('ring-4', 'ring-black', 'bg-emerald-400');
        modeBtnUdpRef.current.classList.remove('bg-slate-200', 'text-slate-600');
      }
    }

    state.logs = ['Sistem di-reset. Siap menerima perintah.', `Mode diubah ke ${mode}`];
    if (logsDivRef.current) {
      logsDivRef.current.innerHTML = state.logs.map(log => `<div class="text-sky-300">> ${log}</div>`).join('');
    }
  }, [updateStatsUI, updateServerBufferUI, updateTcpStateUI, updatePacketsSvg]);

  const handleSend = useCallback(() => {
    const state = stateRef.current;
    
    if (state.currentMode === 'UDP') {
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => spawnPacket('DATA', 'C2S', i), i * 300);
      }
      addLog('UDP: Mengirim 5 paket DATA (no handshake)');
    } else {
      for (let i = 1; i <= 5; i++) {
        state.sendQueue.push({ seqNum: i, lastSentTime: 0, acked: false });
      }
      
      if (state.tcpState === 'CLOSED') {
        addLog('TCP: Memulai Three-Way Handshake...');
        state.tcpState = 'SYN_SENT';
        updateTcpStateUI();
        spawnPacket('SYN', 'C2S');
      } else if (state.tcpState === 'ESTABLISHED') {
        addLog('TCP: Koneksi sudah aktif, mengirim paket...');
      }
    }
  }, [spawnPacket, addLog, updateTcpStateUI]);

  const handleLossChange = useCallback(() => {
    const state = stateRef.current;
    if (lossSliderRef.current) {
      state.lossRate = Number(lossSliderRef.current.value);
      if (lossValRef.current) lossValRef.current.textContent = state.lossRate + '%';
    }
  }, []);

  useEffect(() => {
    resetSim();
    stateRef.current.animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(stateRef.current.animationId);
  }, [resetSim, animate]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">ILMU KOMPUTER & JARINGAN</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: PROTOKOL TCP VS UDP</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Simulasi Pengiriman Paket Data</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#818cf8] text-md rotate-2 z-30 uppercase">Pengaturan Jaringan</span>

          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Protokol Transport</label>
              <div className="grid grid-cols-2 gap-2">
                <button ref={modeBtnTcpRef} onClick={() => setMode('TCP')} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-emerald-400 text-black py-2 px-2 text-xs font-bold ring-4 ring-black uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">TCP (Reliable)</button>
                <button ref={modeBtnUdpRef} onClick={() => setMode('UDP')} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 text-slate-600 py-2 px-2 text-xs font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">UDP (Fast)</button>
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-rose-800 uppercase text-[10px]">Tingkat Gangguan Jaringan</span>
                <span ref={lossValRef} className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-rose-600">20%</span>
              </div>
              <input ref={lossSliderRef} type="range" min="0" max="80" step="5" value="20" onChange={handleLossChange} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" style={{ background: 'linear-gradient(to right, #34d399 0%, #facc15 40%, #ef4444 80%)' }} />
              <div className="text-[9px] font-bold text-slate-500 flex justify-between">
                <span>Stabil</span>
                <span>Sedang</span>
                <span>Buruk</span>
              </div>
            </div>

            <div className="flex gap-2 border-t-4 border-black pt-4">
              <button onClick={handleSend} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-sky-400 hover:bg-sky-300 text-black py-4 text-sm flex-1 flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">KIRIM 5 PAKET</button>
              <button onClick={resetSim} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-4 px-4 text-xs font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">RESET</button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-indigo-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">STATISTIK PENGIRIMAN</h4>
            
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-slate-800 p-2 border-2 border-sky-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Terkirim</span>
                <span ref={statSentRef} className="text-xl font-black text-sky-400">0</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-emerald-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Diterima</span>
                <span ref={statReceivedRef} className="text-xl font-black text-emerald-400">0</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-rose-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400">Hilang</span>
                <span ref={statLostRef} className="text-xl font-black text-rose-400">0</span>
              </div>
            </div>

            <div ref={logsDivRef} className="bg-black p-2 border-2 border-slate-700 text-left h-24 overflow-y-auto font-mono text-[10px] leading-tight">
              <div className="text-sky-300">{'>'} Sistem Siap. Menunggu perintah...</div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 border-8 border-black rounded-xl relative flex flex-col items-center w-full h-[600px] overflow-hidden" style={{ backgroundColor: '#f8fafc', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">Visualisasi Aliran Data</span>

            <div className="w-full h-full relative z-10 flex items-center justify-center pt-8">
              <svg viewBox="0 0 800 400" className="w-full h-full overflow-visible">
                <line x1="150" y1="200" x2="650" y2="200" stroke="#cbd5e1" strokeWidth="8" strokeDasharray="15 10" />
                
                <g transform="translate(70, 160)">
                  <path d="M -40 60 L 40 60 L 50 70 L -50 70 Z" fill="#64748b" stroke="#000" strokeWidth="3" />
                  <rect x="-35" y="0" width="70" height="55" rx="3" fill="#1e293b" stroke="#000" strokeWidth="3" />
                  <rect x="-30" y="5" width="60" height="45" fill="#38bdf8" />
                  <text x="0" y="-15" textAnchor="middle" fontSize="14" fontWeight="900">CLIENT</text>
                  <rect ref={tcpStateRectRef} x="-35" y="90" width="70" height="20" fill="#facc15" stroke="#000" strokeWidth="2"/>
                  <text ref={tcpStateTextRef} x="0" y="104" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#000">CLOSED</text>
                </g>

                <g transform="translate(730, 130)">
                  <rect x="-35" y="0" width="70" height="120" fill="#334155" stroke="#000" strokeWidth="4" />
                  <text x="0" y="-15" textAnchor="middle" fontSize="14" fontWeight="900">SERVER</text>
                  <text x="0" y="40" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">Buffer:</text>
                  <foreignObject x="-45" y="50" width="90" height="60">
                    <div ref={serverBufferDivRef} className="flex flex-wrap gap-0.5 justify-center"></div>
                  </foreignObject>
                </g>

                <g ref={packetSvgRef}></g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-indigo-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">Buku Panduan: Memilih Protokol</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-xl uppercase text-emerald-700 border-b-2 border-black pb-1 mb-2">TCP (Transmission Control Protocol)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Mengutamakan <b>Keandalan (Reliability)</b>.<br/>
              - Three-Way Handshake sebelum transfer data<br/>
              - Retransmission otomatis jika paket hilang<br/>
              - Setiap paket di-ACK (acknowledged)
            </p>
            <p className="text-xs font-medium text-slate-600 bg-white p-2 border-2 border-black">
              <b>Kegunaan:</b> Web Browsing (HTTP), Email (SMTP), File Transfer (FTP)
            </p>
          </div>
          
          <div className="bg-orange-50 border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-xl uppercase text-orange-700 border-b-2 border-black pb-1 mb-2">UDP (User Datagram Protocol)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Mengutamakan <b>Kecepatan (Speed)</b>.<br/>
              - Tanpa handshake (connectionless)<br/>
              - Tanpa retransmission (fire and forget)<br/>
              - Packet loss = data hilang permanen
            </p>
            <p className="text-xs font-medium text-slate-600 bg-white p-2 border-2 border-black">
              <b>Kegunaan:</b> Video Streaming, VoIP, Game Online, DNS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}