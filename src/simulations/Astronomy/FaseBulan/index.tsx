import { useState } from 'react';

export default function FaseBulan() {
  const [phase, setPhase] = useState(0);
  
  const phases = [
    { name: 'New Moon', illumination: 0 },
    { name: 'Waxing Crescent', illumination: 25 },
    { name: 'First Quarter', illumination: 50 },
    { name: 'Waxing Gibbous', illumination: 75 },
    { name: 'Full Moon', illumination: 100 },
    { name: 'Waning Gibbous', illumination: 75 },
    { name: 'Last Quarter', illumination: 50 },
    { name: 'Waning Crescent', illumination: 25 },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-slate-100 mb-8">Fase Bulan</h2>
      
      <div className="bg-slate-800/50 rounded-2xl p-8 mb-8">
        <div className="flex justify-center mb-8">
          <div 
            className="w-64 h-64 rounded-full bg-slate-900 relative overflow-hidden border-4 border-slate-700"
            style={{
              background: `linear-gradient(${phase * 45}deg, #1e293b 0%, #f1f5f9 ${phases[phase].illumination}%, #1e293b ${phases[phase].illumination}%)`
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-slate-400 text-sm">Moon Phase</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-slate-100">{phases[phase].name}</h3>
          <p className="text-slate-400">Illumination: {phases[phase].illumination}%</p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setPhase((p) => (p - 1 + phases.length) % phases.length)}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setPhase((p) => (p + 1) % phases.length)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {phases.map((p, index) => (
          <button
            key={p.name}
            onClick={() => setPhase(index)}
            className={`p-4 rounded-xl border transition-all ${
              phase === index
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <p className="text-xs text-slate-400 truncate">{p.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
