import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

const ALICE_X = 150;
const ALICE_Y = 275;
const BOB_X = 650;
const BOB_Y = 275;
const MID_X = 400;

interface Keys {
  alice_pub: string;
  alice_priv: string;
  bob_pub: string;
  bob_priv: string;
}

interface Knowledge {
  priv: boolean;
  ownPub: boolean;
  bobPub?: boolean;
  alicePub?: boolean;
}

const KEYS: Keys = {
  alice_pub: 'PUB-A-7F2',
  alice_priv: 'PRV-A-9X1',
  bob_pub: 'PUB-B-4D8',
  bob_priv: 'PRV-B-2K9'
};

export default function EnkripsiE2EE(): ReactNode {
  const [simState, setSimState] = useState(0);
  const [isHackerActive, setIsHackerActive] = useState(false);
  const [messageRaw, setMessageRaw] = useState('');
  const [messageCipher, setMessageCipher] = useState('');
  const [animProgress, setAnimProgress] = useState(0);
  const [status, setStatus] = useState('MENUNGGU PERTUKARAN KUNCI');
  const [statusColor, setStatusColor] = useState('text-slate-400');
  const [statusBg, setStatusBg] = useState('bg-slate-800');
  const [statusBorder, setStatusBorder] = useState('border-slate-500');

  const [aliceKnows, setAliceKnows] = useState<Knowledge>({ priv: true, ownPub: true, bobPub: false });
  const [bobKnows, setBobKnows] = useState<Knowledge>({ priv: true, ownPub: true, alicePub: false });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  const encryptFake = useCallback((text: string): string => {
    if (!text) return 'NULL';
    const b64 = btoa(text).substring(0, 15);
    return b64 + '@' + Math.random().toString(36).substring(2, 6).toUpperCase();
  }, []);

  const updateLogic = useCallback(() => {
    if (simState === 1 || simState === 3) {
      setAnimProgress(prev => {
        const newProgress = prev + 0.015;
        if (newProgress >= 1.0) {
          if (simState === 1) {
            setSimState(2);
            setAliceKnows(prev => ({ ...prev, bobPub: true }));
            setBobKnows(prev => ({ ...prev, alicePub: true }));
            setStatus('KUNCI PUBLIK DITUKAR. SIAP MENGIRIM PESAN.');
            setStatusColor('text-emerald-400');
            setStatusBg('bg-emerald-900');
            setStatusBorder('border-emerald-400');
          } else if (simState === 3) {
            setSimState(4);
            setStatus('PESAN SAMPAI & DIDEKRIPSI OLEH BOB.');
            setStatusColor('text-teal-300');
            setStatusBg('bg-teal-900');
            setStatusBorder('border-teal-400');
          }
          return 0;
        }
        return newProgress;
      });
    }

    timeRef.current += 0.1;
  }, [simState, isHackerActive]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Network lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ALICE_X + 50, ALICE_Y);
    ctx.lineTo(BOB_X - 50, ALICE_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Internet cloud
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(MID_X - 30, ALICE_Y + 10, 30, 0, Math.PI * 2);
    ctx.arc(MID_X, ALICE_Y - 20, 40, 0, Math.PI * 2);
    ctx.arc(MID_X + 40, ALICE_Y, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px "Space Grotesk"';
    ctx.textAlign = 'center';
    ctx.fillText('JARINGAN INTERNET PUBLIK', MID_X, ALICE_Y + 50);

    // Draw Alice
    ctx.save();
    ctx.translate(ALICE_X, ALICE_Y);
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-40, -30, 80, 60);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(-40, -30, 80, 60);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#475569';
    ctx.fillRect(-10, 30, 20, 15);
    ctx.fillRect(-30, 45, 60, 5);
    ctx.fillStyle = '#020617';
    ctx.fillRect(-35, -25, 70, 50);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px "Space Grotesk"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ALICE', 0, -5);

    // Alice's keys
    ctx.font = 'bold 10px "Courier New"';
    let kY = 65;
    if (aliceKnows.priv) {
      ctx.fillStyle = '#fb7185';
      ctx.fillText('🔑 Pribadi: [Disembunyikan]', 0, kY);
      kY += 15;
    }
    if (aliceKnows.ownPub) {
      ctx.fillStyle = '#34d399';
      ctx.fillText(`🔓 Publik: ${KEYS.alice_pub}`, 0, kY);
      kY += 15;
    }
    if (aliceKnows.bobPub) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`🔓 Pub Bob: ${KEYS.bob_pub}`, 0, kY);
    }
    ctx.restore();

    // Draw Bob
    ctx.save();
    ctx.translate(BOB_X, BOB_Y);
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-40, -30, 80, 60);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(-40, -30, 80, 60);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#475569';
    ctx.fillRect(-10, 30, 20, 15);
    ctx.fillRect(-30, 45, 60, 5);
    ctx.fillStyle = '#020617';
    ctx.fillRect(-35, -25, 70, 50);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px "Space Grotesk"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOB', 0, -5);

    // Bob's keys
    ctx.font = 'bold 10px "Courier New"';
    kY = 65;
    if (bobKnows.priv) {
      ctx.fillStyle = '#fb7185';
      ctx.fillText('🔑 Pribadi: [Disembunyikan]', 0, kY);
      kY += 15;
    }
    if (bobKnows.ownPub) {
      ctx.fillStyle = '#34d399';
      ctx.fillText(`🔓 Publik: ${KEYS.bob_pub}`, 0, kY);
      kY += 15;
    }
    if (bobKnows.alicePub) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`🔓 Pub Alice: ${KEYS.alice_pub}`, 0, kY);
    }

    // Message on Bob's screen
    if (simState === 4) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 10px "Space Grotesk"';
      ctx.fillText('Pesan:', 0, 10);
      const displayMsg = messageRaw.length > 8 ? messageRaw.substring(0, 8) + '...' : messageRaw;
      ctx.fillText(displayMsg, 0, 20);
    }
    ctx.restore();

    // Draw Hacker
    if (isHackerActive) {
      const evX = MID_X;
      const evY = ALICE_Y - 120;

      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(MID_X, ALICE_Y);
      ctx.lineTo(evX, evY + 30);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#000000';
      ctx.fillRect(evX - 60, evY - 40, 120, 80);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.strokeRect(evX - 60, evY - 40, 120, 80);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 12px "Courier New"';
      ctx.textAlign = 'left';
      ctx.fillText('root@eve:~#', evX - 50, evY - 20);
      ctx.fillText('sniffing...', evX - 50, evY - 5);

      if (simState === 1 && animProgress > 0.3 && animProgress < 0.7) {
        ctx.fillStyle = '#34d399';
        ctx.fillText('Pub key got', evX - 50, evY + 15);
      } else if (simState === 3 && animProgress > 0.3 && animProgress < 0.7) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('Data: ' + messageCipher.substring(0, 8), evX - 50, evY + 15);
        ctx.fillText('[ENCRYPTED]', evX - 50, evY + 28);
      } else if (simState === 4) {
        ctx.fillStyle = '#64748b';
        ctx.fillText('Cannot decryp', evX - 50, evY + 15);
        ctx.fillText('No Priv Key!', evX - 50, evY + 28);
      }
    }

    // Draw animation
    if (simState === 1) {
      const ax = ALICE_X + 50 + (animProgress * (BOB_X - ALICE_X - 100));
      const bx = BOB_X - 50 - (animProgress * (BOB_X - ALICE_X - 100));

      ctx.fillStyle = '#10b981';
      ctx.fillRect(ax - 20, ALICE_Y - 20, 40, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PUB-A', ax, ALICE_Y - 10);

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(bx - 20, ALICE_Y + 5, 40, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText('PUB-B', bx, ALICE_Y + 15);
    } else if (simState === 3) {
      const px = ALICE_X + 50 + (animProgress * (BOB_X - ALICE_X - 100));

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - 25, ALICE_Y - 15, 50, 30);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 25, ALICE_Y - 15, 50, 30);

      ctx.beginPath();
      ctx.arc(px, ALICE_Y - 15, 8, Math.PI, 0);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      if (animProgress > 0.2 && animProgress < 0.8) {
        ctx.fillText('***', px, ALICE_Y + 3);
      } else {
        ctx.fillText('MSG', px, ALICE_Y + 3);
      }

      if (animProgress > 0.85) {
        ctx.fillStyle = '#fb7185';
        ctx.fillText('🔑', px + 20, ALICE_Y - 10);
      }
    }
  }, [simState, isHackerActive, animProgress, aliceKnows, bobKnows, messageRaw, messageCipher]);

  useEffect(() => {
    const loop = () => {
      updateLogic();
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateLogic, draw]);

  const handleKeys = () => {
    if (simState === 0) {
      setSimState(1);
      setAnimProgress(0);
      setStatus('PROSES PERTUKARAN KUNCI PUBLIK...');
      setStatusColor('text-amber-400');
      setStatusBg('bg-amber-900');
      setStatusBorder('border-amber-400');
    }
  };

  const handleSend = () => {
    if (simState === 2 || simState === 4) {
      const raw = messageRaw || 'Pesan Rahasia';
      setMessageRaw(raw);
      setMessageCipher(encryptFake(raw));
      setSimState(3);
      setAnimProgress(0);
      setStatus('MENGGUNAKAN KUNCI PUBLIK BOB UNTUK ENKRIPSI...');
      setStatusColor('text-indigo-300');
      setStatusBg('bg-indigo-900');
      setStatusBorder('border-indigo-400');
    }
  };

  const handleReset = () => {
    setSimState(0);
    setAnimProgress(0);
    setMessageRaw('');
    setMessageCipher('');
    setAliceKnows({ priv: true, ownPub: true, bobPub: false });
    setBobKnows({ priv: true, ownPub: true, alicePub: false });
    setStatus('MENUNGGU PERTUKARAN KUNCI');
    setStatusColor('text-slate-400');
    setStatusBg('bg-slate-800');
    setStatusBorder('border-slate-500');
  };

  const valHacker = isHackerActive ? 'AKTIF' : 'NONAKTIF';
  const valHackerColor = isHackerActive ? 'text-rose-600' : 'text-slate-600';

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-900 p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-violet-200 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 w-full relative overflow-hidden">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] font-bold text-sm transform -rotate-3 z-10">KEAMANAN SIBER & KRIPTOGRAFI</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight relative z-10">
          LAB VIRTUAL: ENKRIPSI END-TO-END
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] relative z-10">
          Simulasi Kriptografi Asimetris (Kunci Publik & Kunci Pribadi)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-slate-900 shadow-[4px_4px_0px_#8b5cf6] text-md transform rotate-2 z-30 uppercase">
            Terminal Pengirim
          </span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-violet-50 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg">
              <label className="font-black text-violet-900 uppercase text-[10px]">Tulis Pesan Rahasia (Dari Alice ke Bob)</label>
              <textarea
                value={messageRaw}
                onChange={(e) => setMessageRaw(e.target.value)}
                className="w-full p-2 border-2 border-slate-900 rounded font-mono text-sm resize-none h-20 focus:outline-none focus:ring-4 focus:ring-violet-300"
                placeholder="Ketik pesan rahasia di sini..."
              />
            </div>

            <div className="bg-rose-50 p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col gap-2 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-rose-900 uppercase text-[10px]">Simulasi Man-in-the-Middle</span>
                <span className={`font-mono font-black text-sm bg-white px-2 border-2 border-slate-900 rounded ${valHackerColor}`}>{valHacker}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHackerActive}
                  onChange={(e) => setIsHackerActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-900 after:border-4 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-500 border-4 border-slate-900"></div>
              </label>
              <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase leading-tight">Aktifkan untuk melihat data apa yang dicuri oleh peretas di jaringan internet.</p>
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-slate-900 pt-4 mt-2">
              <button
                onClick={handleKeys}
                disabled={simState !== 0}
                className={`border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${simState === 0 ? 'bg-amber-400 hover:bg-amber-300 text-black' : 'bg-slate-300 hover:bg-slate-200 text-slate-600'}`}
              >
                {simState === 0 ? 'BUAT & TUKAR KUNCI PUBLIK' : 'KUNCI PUBLIK TELAH DITUKAR'}
              </button>
              <button
                onClick={handleSend}
                disabled={simState !== 2 && simState !== 4}
                className={`border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg py-3 px-3 w-full text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${simState === 2 || simState === 4 ? 'bg-emerald-400 hover:bg-emerald-300 text-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {simState === 3 ? 'MENGIRIM...' : simState === 4 ? 'ENKRIPSI & KIRIM LAGI' : 'ENKRIPSI & KIRIM PESAN'}
              </button>
              <button
                onClick={handleReset}
                className="border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-2 px-3 w-full text-xs flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                RESET SESI
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] mt-4 relative overflow-hidden rounded-lg">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-violet-500 rounded-full opacity-20 blur-xl"></div>
            <h4 className="font-black text-violet-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">DATA JARINGAN (CIPHERTEXT)</h4>

            <div className="bg-slate-800 p-3 border-2 border-slate-600 rounded-lg flex flex-col items-center shadow-inner mb-3">
              <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Paket Teks Terenkripsi</span>
              <span className="text-sm font-black text-amber-400 math-font break-all text-center">{messageCipher || '[Belum Ada Data]'}</span>
            </div>

            <div className={`${statusBg} p-3 border-2 border-dashed ${statusBorder} rounded text-center flex flex-col items-center justify-center min-h-[48px] transition-colors duration-300`}>
              <span className={`text-xs font-black uppercase tracking-widest ${statusColor}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div
            className="border-8 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-0 relative flex flex-col items-center w-full h-[600px] lg:h-auto overflow-hidden"
            style={{
              backgroundColor: '#0f172a',
              backgroundImage: 'linear-gradient(rgba(167, 139, 250, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(167, 139, 250, 0.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          >
            <span className="absolute top-4 left-4 bg-white text-slate-900 font-black px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] text-[10px] transform -rotate-1 z-30 uppercase rounded">
              Diagram Jaringan (Visualizer)
            </span>

            {isHackerActive && (
              <div className="absolute top-8 right-8 bg-rose-600 text-white font-black px-4 py-2 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] text-md uppercase z-40 glitch-text tracking-widest text-center rounded">
                ⚠️ EVE MENYADAP JARINGAN
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={800}
              height={550}
              className="w-full h-full block object-contain"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 bg-slate-900 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-white">
        <h3 className="text-xl font-bold bg-violet-400 inline-block px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] mb-6 transform -rotate-1 uppercase text-black rounded">
          Konsep Kriptografi Asimetris (E2EE)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-amber-400 border-b-2 border-slate-600 pb-2 mb-3">1. Sepasang Kunci Unik</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Setiap pengguna memiliki dua kunci: <b>Kunci Publik (Gembok Terbuka)</b> yang boleh dibagikan ke siapa saja, dan <b>Kunci Pribadi (Anak Kunci)</b> yang disimpan rahasia di perangkatnya sendiri. Keduanya dibuat menggunakan rumus matematika kompleks secara bersamaan.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-emerald-400 border-b-2 border-slate-600 pb-2 mb-3">2. Enkripsi (Mengunci)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Jika Alice ingin mengirim pesan ke Bob, Alice akan membungkus pesannya dengan <b>Kunci Publik Bob</b>. Begitu pesan ini dikunci (dienkripsi), teksnya akan berubah menjadi sandi acak (Ciphertext) yang tidak bisa dibaca oleh siapapun.
            </p>
          </div>

          <div className="bg-slate-800 border-4 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_#000]">
            <h4 className="font-black text-md uppercase text-sky-400 border-b-2 border-slate-600 pb-2 mb-3">3. Dekripsi (Membuka)</h4>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              Pesan yang sudah dikunci dengan Kunci Publik Bob, <b>HANYA BISA</b> dibuka oleh <b>Kunci Pribadi Bob</b>. Jika peretas mencegat pesan di tengah jalan, mereka hanya mendapat teks acak karena mereka tidak memiliki kunci pribadi Bob. Inilah esensi E2EE.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}