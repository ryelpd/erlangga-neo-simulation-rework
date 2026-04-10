import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';

type UnitCategory = 'length' | 'mass' | 'temperature' | 'volume' | 'time' | 'area' | 'speed' | 'data';

interface Unit {
  name: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

const unitData: Record<UnitCategory, { label: string; color: string; units: Unit[] }> = {
  length: {
    label: 'Panjang',
    color: 'bg-blue-400',
    units: [
      { name: 'Kilometer', symbol: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { name: 'Meter', symbol: 'm', toBase: v => v, fromBase: v => v },
      { name: 'Centimeter', symbol: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
      { name: 'Millimeter', symbol: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { name: 'Mile', symbol: 'mi', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
      { name: 'Yard', symbol: 'yd', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
      { name: 'Foot', symbol: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      { name: 'Inch', symbol: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
    ],
  },
  mass: {
    label: 'Massa',
    color: 'bg-amber-400',
    units: [
      { name: 'Kilogram', symbol: 'kg', toBase: v => v, fromBase: v => v },
      { name: 'Gram', symbol: 'g', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { name: 'Milligram', symbol: 'mg', toBase: v => v / 1e6, fromBase: v => v * 1e6 },
      { name: 'Metric Ton', symbol: 't', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { name: 'Pound', symbol: 'lb', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
      { name: 'Ounce', symbol: 'oz', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
      { name: 'Stone', symbol: 'st', toBase: v => v * 6.35029, fromBase: v => v / 6.35029 },
    ],
  },
  temperature: {
    label: 'Temperatur',
    color: 'bg-rose-400',
    units: [
      { name: 'Celsius', symbol: '°C', toBase: v => v, fromBase: v => v },
      { name: 'Fahrenheit', symbol: '°F', toBase: v => (v - 32) * 5/9, fromBase: v => v * 9/5 + 32 },
      { name: 'Kelvin', symbol: 'K', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
    ],
  },
  volume: {
    label: 'Volume',
    color: 'bg-cyan-400',
    units: [
      { name: 'Liter', symbol: 'L', toBase: v => v, fromBase: v => v },
      { name: 'Milliliter', symbol: 'mL', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { name: 'Cubic Meter', symbol: 'm³', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { name: 'Gallon (US)', symbol: 'gal', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
      { name: 'Quart (US)', symbol: 'qt', toBase: v => v * 0.946353, fromBase: v => v / 0.946353 },
      { name: 'Pint (US)', symbol: 'pt', toBase: v => v * 0.473176, fromBase: v => v / 0.473176 },
      { name: 'Cup (US)', symbol: 'cup', toBase: v => v * 0.236588, fromBase: v => v / 0.236588 },
      { name: 'Fluid Ounce (US)', symbol: 'fl oz', toBase: v => v * 0.0295735, fromBase: v => v / 0.0295735 },
    ],
  },
  time: {
    label: 'Waktu',
    color: 'bg-purple-400',
    units: [
      { name: 'Second', symbol: 's', toBase: v => v, fromBase: v => v },
      { name: 'Minute', symbol: 'min', toBase: v => v * 60, fromBase: v => v / 60 },
      { name: 'Hour', symbol: 'h', toBase: v => v * 3600, fromBase: v => v / 3600 },
      { name: 'Day', symbol: 'd', toBase: v => v * 86400, fromBase: v => v / 86400 },
      { name: 'Week', symbol: 'wk', toBase: v => v * 604800, fromBase: v => v / 604800 },
      { name: 'Month (30d)', symbol: 'mo', toBase: v => v * 2592000, fromBase: v => v / 2592000 },
      { name: 'Year (365d)', symbol: 'yr', toBase: v => v * 31536000, fromBase: v => v / 31536000 },
    ],
  },
  area: {
    label: 'Luas',
    color: 'bg-green-400',
    units: [
      { name: 'Square Meter', symbol: 'm²', toBase: v => v, fromBase: v => v },
      { name: 'Square Kilometer', symbol: 'km²', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      { name: 'Square Centimeter', symbol: 'cm²', toBase: v => v / 10000, fromBase: v => v * 10000 },
      { name: 'Hectare', symbol: 'ha', toBase: v => v * 10000, fromBase: v => v / 10000 },
      { name: 'Acre', symbol: 'ac', toBase: v => v * 4046.86, fromBase: v => v / 4046.86 },
      { name: 'Square Mile', symbol: 'mi²', toBase: v => v * 2589988, fromBase: v => v / 2589988 },
      { name: 'Square Foot', symbol: 'ft²', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
      { name: 'Square Inch', symbol: 'in²', toBase: v => v * 0.00064516, fromBase: v => v / 0.00064516 },
    ],
  },
  speed: {
    label: 'Kecepatan',
    color: 'bg-orange-400',
    units: [
      { name: 'Meter/Second', symbol: 'm/s', toBase: v => v, fromBase: v => v },
      { name: 'Kilometer/Hour', symbol: 'km/h', toBase: v => v / 3.6, fromBase: v => v * 3.6 },
      { name: 'Mile/Hour', symbol: 'mph', toBase: v => v * 0.44704, fromBase: v => v / 0.44704 },
      { name: 'Foot/Second', symbol: 'ft/s', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      { name: 'Knot', symbol: 'kn', toBase: v => v * 0.514444, fromBase: v => v / 0.514444 },
      { name: 'Mach', symbol: 'Ma', toBase: v => v * 343, fromBase: v => v / 343 },
    ],
  },
  data: {
    label: 'Data Digital',
    color: 'bg-indigo-400',
    units: [
      { name: 'Byte', symbol: 'B', toBase: v => v, fromBase: v => v },
      { name: 'Kilobyte', symbol: 'KB', toBase: v => v * 1024, fromBase: v => v / 1024 },
      { name: 'Megabyte', symbol: 'MB', toBase: v => v * 1048576, fromBase: v => v / 1048576 },
      { name: 'Gigabyte', symbol: 'GB', toBase: v => v * 1073741824, fromBase: v => v / 1073741824 },
      { name: 'Terabyte', symbol: 'TB', toBase: v => v * 1099511627776, fromBase: v => v / 1099511627776 },
      { name: 'Petabyte', symbol: 'PB', toBase: v => v * 1125899906842624, fromBase: v => v / 1125899906842624 },
      { name: 'Bit', symbol: 'bit', toBase: v => v / 8, fromBase: v => v * 8 },
      { name: 'Kilobit', symbol: 'Kbit', toBase: v => v * 128, fromBase: v => v / 128 },
    ],
  },
};

function formatNumber(value: number): string {
  if (value === 0) return '0';
  if (Math.abs(value) < 0.000001 || Math.abs(value) > 1e12) {
    return value.toExponential(6);
  }
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(6).replace(/\.?0+$/, '');
}

const quizData = [
  {
    question: "1. Berapa meter dalam 1 kilometer?",
    options: ["10 meter", "100 meter", "1000 meter", "10000 meter"],
    answer: 2,
  },
  {
    question: "2. Konversi 100°C ke Fahrenheit...",
    options: ["212°F", "180°F", "100°F", "32°F"],
    answer: 0,
  },
  {
    question: "3. Berapa gram dalam 1 kilogram?",
    options: ["10 gram", "100 gram", "1000 gram", "10000 gram"],
    answer: 2,
  },
  {
    question: "4. 1 mile (mil) kira-kira sama dengan berapa kilometer?",
    options: ["1 km", "1.6 km", "2.5 km", "10 km"],
    answer: 1,
  },
  {
    question: "5. Berapa detik dalam 1 jam?",
    options: ["60 detik", "600 detik", "3600 detik", "36000 detik"],
    answer: 2,
  },
];

export default function KonverterSatuanUniversal(): ReactNode {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnitIdx, setFromUnitIdx] = useState(0);
  const [toUnitIdx, setToUnitIdx] = useState(1);
  const [inputValue, setInputValue] = useState<string>('1');
  const [showQuiz, setShowQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const currentCategory = unitData[category];
  const units = currentCategory.units;

  const result = useMemo(() => {
    const numValue = parseFloat(inputValue) || 0;
    const fromUnit = units[fromUnitIdx];
    const toUnit = units[toUnitIdx];
    const baseValue = fromUnit.toBase(numValue);
    return toUnit.fromBase(baseValue);
  }, [inputValue, units, fromUnitIdx, toUnitIdx]);

  const handleSwap = () => {
    setFromUnitIdx(toUnitIdx);
    setToUnitIdx(fromUnitIdx);
    setInputValue(formatNumber(result));
  };

  const handleCategoryChange = (newCategory: UnitCategory) => {
    setCategory(newCategory);
    setFromUnitIdx(0);
    setToUnitIdx(1);
    setInputValue('1');
  };

  const handleAnswer = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (userAnswers.every(a => a !== null)) setQuizSubmitted(true);
  };

  const handleRetry = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const score = userAnswers.reduce<number>((acc, a, i) => {
    if (a === quizData[i].answer) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="min-h-screen text-black p-4 md:p-8 flex flex-col items-center bg-[#fdfbf7]" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-emerald-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">MATEMATIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          KONVERTER SATUAN UNIVERSAL
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Konversi Satuan Panjang, Massa, Temperatur, Volume, Waktu, Luas, Kecepatan & Data
        </p>
      </header>

      <div className="w-full max-w-6xl mb-6 z-10">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-4 relative">
          <span className="absolute -top-3 left-4 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-sm transform -rotate-2 z-30 uppercase">
            Pilih Kategori
          </span>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {(Object.entries(unitData) as [UnitCategory, typeof unitData.length][]).map(([key, data]) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key)}
                className={`px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-black uppercase text-sm transition-all
                  ${category === key 
                    ? `${data.color} text-black translate-x-[4px] translate-y-[4px] shadow-none` 
                    : 'bg-white text-black hover:translate-x-[2px] hover:translate-y-[2px]'
                  }`}
              >
                {data.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-5 w-full lg:w-1/2">
          <span className="absolute -top-4 right-6 bg-blue-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform rotate-2 z-30 uppercase">
            Satuan Asal (From)
          </span>

          <div className="mt-4 flex flex-col gap-4">
            <div className={`${currentCategory.color} p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-black uppercase text-xs">Pilih Satuan:</span>
              </div>
              <select
                value={fromUnitIdx}
                onChange={(e) => setFromUnitIdx(Number(e.target.value))}
                className="w-full p-3 border-4 border-black font-bold text-lg bg-white shadow-[4px_4px_0px_0px_#000] cursor-pointer"
              >
                {units.map((unit, idx) => (
                  <option key={idx} value={idx}>{unit.name} ({unit.symbol})</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black uppercase text-xs">Nilai Input:</span>
              </div>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full p-3 border-4 border-black font-bold text-2xl bg-white shadow-[4px_4px_0px_0px_#000] text-center font-mono"
                placeholder="0"
              />
            </div>

            <div className="flex justify-center mt-2">
              <div className="bg-black text-white px-4 py-3 border-4 border-white shadow-[4px_4px_0px_#38bdf8] font-mono text-2xl font-black">
                {inputValue || '0'} {units[fromUnitIdx].symbol}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={handleSwap}
            className="bg-yellow-400 text-black px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl font-black uppercase text-lg hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all flex flex-col items-center gap-1"
          >
            <span className="text-2xl">⇄</span>
            <span className="text-xs">TUKAR</span>
          </button>
        </div>

        <div className="bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-5 w-full lg:w-1/2">
          <span className="absolute -top-4 left-6 bg-emerald-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Satuan Tujuan (To)
          </span>

          <div className="mt-4 flex flex-col gap-4">
            <div className={`bg-slate-700 p-4 border-4 border-slate-500 shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-black uppercase text-xs text-slate-300">Pilih Satuan:</span>
              </div>
              <select
                value={toUnitIdx}
                onChange={(e) => setToUnitIdx(Number(e.target.value))}
                className="w-full p-3 border-4 border-black font-bold text-lg bg-white shadow-[4px_4px_0px_0px_#000] text-black cursor-pointer"
              >
                {units.map((unit, idx) => (
                  <option key={idx} value={idx}>{unit.name} ({unit.symbol})</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-800 p-4 border-4 border-slate-600 flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black uppercase text-xs text-slate-400">Hasil Konversi:</span>
              </div>
              <div className="w-full p-3 border-4 border-emerald-500 font-bold text-2xl bg-white shadow-[4px_4px_0px_0px_#10b981] text-center font-mono text-black">
                {formatNumber(result)}
              </div>
            </div>

            <div className="flex justify-center mt-2">
              <div className="bg-emerald-400 text-black px-4 py-3 border-4 border-black shadow-[4px_4px_0px_#fff] font-mono text-2xl font-black">
                {formatNumber(result)} {units[toUnitIdx].symbol}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 mb-10 z-10 relative text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase">
          TABEL KONVERSI PENTING
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">PANJANG</h4>
            <div className="text-xs font-mono space-y-1">
              <div>1 km = 1000 m</div>
              <div>1 m = 100 cm</div>
              <div>1 m = 1000 mm</div>
              <div>1 mi ≈ 1.609 km</div>
              <div>1 ft = 12 in</div>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-amber-600 border-b-2 border-black pb-1 mb-2">MASSA</h4>
            <div className="text-xs font-mono space-y-1">
              <div>1 kg = 1000 g</div>
              <div>1 g = 1000 mg</div>
              <div>1 t = 1000 kg</div>
              <div>1 lb ≈ 0.454 kg</div>
              <div>1 oz ≈ 28.35 g</div>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-rose-600 border-b-2 border-black pb-1 mb-2">TEMPERATUR</h4>
            <div className="text-xs font-mono space-y-1">
              <div>0°C = 32°F = 273.15K</div>
              <div>100°C = 212°F</div>
              <div>°F = °C × 9/5 + 32</div>
              <div>°C = (°F - 32) × 5/9</div>
              <div>K = °C + 273.15</div>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-sm uppercase text-purple-600 border-b-2 border-black pb-1 mb-2">WAKTU</h4>
            <div className="text-xs font-mono space-y-1">
              <div>1 min = 60 s</div>
              <div>1 h = 60 min = 3600 s</div>
              <div>1 d = 24 h = 86400 s</div>
              <div>1 wk = 7 d</div>
              <div>1 yr = 365 d</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 mb-10 z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            FORMULA KONVERSI
          </h3>
        </div>
        
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-100 p-4 border-4 border-black">
              <h4 className="font-black text-lg uppercase text-sky-600 mb-3">Cara Konversi Satuan</h4>
              <div className="text-sm font-semibold space-y-2">
                <p>1. Konversi nilai ke <b>satuan dasar</b> (meter, kilogram, liter, detik, etc.)</p>
                <p>2. Konversi dari satuan dasar ke <b>satuan target</b></p>
                <div className="bg-yellow-200 p-3 border-2 border-black mt-3 font-mono text-xs">
                  Formula: <b>Nilai Target = Nilai Asal × (Faktor Asal ÷ Faktor Target)</b>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-4 border-4 border-black">
              <h4 className="font-black text-lg uppercase text-rose-600 mb-3">Contoh Konversi</h4>
              <div className="text-sm font-semibold space-y-2">
                <div className="bg-blue-100 p-2 border-2 border-black">
                  <b>5 km → meter:</b><br/>
                  5 km × 1000 = <b>5000 m</b>
                </div>
                <div className="bg-amber-100 p-2 border-2 border-black">
                  <b>2 kg → gram:</b><br/>
                  2 kg × 1000 = <b>2000 g</b>
                </div>
                <div className="bg-rose-100 p-2 border-2 border-black">
                  <b>100°C → Fahrenheit:</b><br/>
                  100 × 9/5 + 32 = <b>212°F</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl bg-slate-800 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 mb-10 z-10 relative">
        <button
          onClick={() => setShowQuiz(!showQuiz)}
          className="w-full bg-yellow-400 text-black px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-black uppercase text-lg hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
        >
          {showQuiz ? '▼ TUTUP KUIS' : '▶ UJI PENGETAHUAN ANDA (KUIS)'}
        </button>

        {showQuiz && (
          <div className="mt-6 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] text-black">
            <div className="bg-black text-white p-3 mb-4 font-black uppercase text-center">
              EVALUASI KONSEP KONVERSI SATUAN
            </div>
            <div className="space-y-4">
              {quizData.map((q, qIdx) => (
                <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
                  <h4 className="font-bold mb-3 text-sm uppercase">{q.question}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswer(qIdx, oIdx)}
                        disabled={quizSubmitted}
                        className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold text-xs transition-all px-3 py-2
                          ${quizSubmitted 
                            ? oIdx === q.answer 
                              ? 'bg-green-400 text-black' 
                              : userAnswers[qIdx] === oIdx 
                                ? 'bg-rose-400 text-black' 
                                : 'bg-white'
                            : userAnswers[qIdx] === oIdx 
                              ? 'bg-black text-white translate-x-[4px] translate-y-[4px] shadow-none' 
                              : 'bg-white hover:bg-slate-100'
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!quizSubmitted && userAnswers.every(a => a !== null) && (
                <button
                  onClick={handleSubmit}
                  className="w-full border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-black uppercase py-3 px-10 text-xl mt-4 bg-slate-900 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                >
                  KIRIM JAWABAN!
                </button>
              )}

              {quizSubmitted && (
                <div className="mt-4 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                  <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR: {score}/5</h4>
                  <p className="text-black font-semibold text-lg mb-4 bg-white inline-block px-4 py-1 border-2 border-black">
                    {score === 5 ? "Sempurna! Master Konversi Satuan!" : "Bagus! Pelajari lagi tabel konversi di atas."}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-black uppercase py-3 px-8 text-lg bg-black text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                  >
                    ULANGI KUIS
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}