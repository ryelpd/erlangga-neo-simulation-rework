import type { ReactNode } from 'react';
import { useState } from 'react';

const genotypes: Record<string, { alleles: [string, string] }> = {
  'XCY': { alleles: ['XC', 'Y'] },
  'XcY': { alleles: ['Xc', 'Y'] },
  'XCXC': { alleles: ['XC', 'XC'] },
  'XCXc': { alleles: ['XC', 'Xc'] },
  'XcXc': { alleles: ['Xc', 'Xc'] }
};

interface OffspringResult {
  genotypeHtml: string;
  rawG: string;
  phenotype: string;
  styleClass: string;
  isCb: boolean;
}

function formatAlleleHTML(allele: string): string {
  if (allele === 'Y') return '<span class="text-slate-600">Y</span>';
  if (allele === 'XC') return 'X<sup class="text-emerald-600">C</sup>';
  if (allele === 'Xc') return 'X<sup class="text-rose-600">c</sup>';
  return allele;
}

function evaluateOffspring(alleleDad: string, alleleMom: string): OffspringResult {
  let g: string;
  
  if (alleleDad === 'Y' || alleleMom === 'Y') {
    const xAllele = alleleDad.startsWith('X') ? alleleDad : alleleMom;
    g = xAllele + 'Y';
  } else {
    if (alleleDad === 'XC' && alleleMom === 'Xc') g = 'XCXc';
    else if (alleleDad === 'Xc' && alleleMom === 'XC') g = 'XCXc';
    else if (alleleDad === 'XC' && alleleMom === 'XC') g = 'XCXC';
    else g = 'XcXc';
  }

  let phenotype = '';
  let styleClass = '';
  let isCb = false;
  const isMale = g.includes('Y');

  if (isMale) {
    if (g === 'XCY') { phenotype = '♂ Normal'; styleClass = 'bg-sky-200'; }
    else { phenotype = '♂ Buta Warna'; styleClass = 'bg-rose-200'; isCb = true; }
  } else {
    if (g === 'XCXC') { phenotype = '♀ Normal'; styleClass = 'bg-emerald-200'; }
    else if (g === 'XCXc') { phenotype = '♀ Carrier'; styleClass = 'bg-yellow-200'; }
    else { phenotype = '♀ Buta Warna'; styleClass = 'bg-rose-300'; isCb = true; }
  }

  let htmlG = '';
  if (g === 'XCY') htmlG = 'X<sup class="text-emerald-600">C</sup>Y';
  else if (g === 'XcY') htmlG = 'X<sup class="text-rose-600">c</sup>Y';
  else if (g === 'XCXC') htmlG = 'X<sup class="text-emerald-600">C</sup>X<sup class="text-emerald-600">C</sup>';
  else if (g === 'XCXc') htmlG = 'X<sup class="text-emerald-600">C</sup>X<sup class="text-rose-600">c</sup>';
  else if (g === 'XcXc') htmlG = 'X<sup class="text-rose-600">c</sup>X<sup class="text-rose-600">c</sup>';

  return { genotypeHtml: htmlG, rawG: g, phenotype, styleClass, isCb };
}

const quizData = [
  { 
    question: "1. Sifat genetik buta warna terpaut pada kromosom apa?", 
    options: ["Kromosom Y", "Kromosom Autosom", "Kromosom X", "DNA Mitokondria"], 
    answer: 2 
  },
  { 
    question: "2. Mengapa laki-laki secara genetik lebih rentan terkena buta warna dibandingkan perempuan?", 
    options: ["Karena laki-laki hanya memiliki satu kromosom X", "Karena gen buta warna itu dominan", "Karena kromosom Y menyebabkan buta warna", "Karena mata laki-laki berbeda"], 
    answer: 0 
  },
  { 
    question: "3. Cobalah di simulasi: Jika Ayah normal (XCY) dan Ibu carrier (XCXc), berapa persen kemungkinan anak LAKI-LAKI mereka lahir buta warna?", 
    options: ["0%", "25%", "50%", "100%"], 
    answer: 2 
  },
  { 
    question: "4. Berdasarkan simulasi, apa syarat SATU-SATUNYA agar pasangan suami istri bisa memiliki ANAK PEREMPUAN yang buta warna (XcXc)?", 
    options: ["Ayahnya normal, Ibunya buta warna", "Ayahnya PASTI buta warna, Ibunya minimal carrier atau buta warna", "Ayahnya normal, Ibunya normal", "Tidak mungkin terjadi"], 
    answer: 1 
  },
  { 
    question: "5. Apa pengertian dari perempuan dengan fenotipe 'Carrier'?", 
    options: ["Perempuan yang buta warna parah", "Perempuan yang normal namun dapat menurunkan gen buta warna ke anaknya", "Perempuan yang kebal terhadap semua penyakit mata", "Perempuan dengan dua gen resesif (XcXc)"], 
    answer: 1 
  }
];

export default function GenetikaButaWarna(): ReactNode {
  const [father, setFather] = useState<string>('XCY');
  const [mother, setMother] = useState<string>('XCXC');
  const [animKey, setAnimKey] = useState(0);

  const dadAlleles = genotypes[father].alleles;
  const momAlleles = genotypes[mother].alleles;

  const offspring1 = evaluateOffspring(dadAlleles[0], momAlleles[0]);
  const offspring2 = evaluateOffspring(dadAlleles[0], momAlleles[1]);
  const offspring3 = evaluateOffspring(dadAlleles[1], momAlleles[0]);
  const offspring4 = evaluateOffspring(dadAlleles[1], momAlleles[1]);
  const offspringList = [offspring1, offspring2, offspring3, offspring4];

  let totalCbCount = 0;
  let fNormCount = 0, fCarCount = 0, fCbCount = 0;
  let mNormCount = 0, mCbCount = 0;

  offspringList.forEach(child => {
    if (child.isCb) totalCbCount++;
    if (child.rawG.includes('Y')) {
      if (child.rawG === 'XCY') mNormCount++;
      else mCbCount++;
    } else {
      if (child.rawG === 'XCXC') fNormCount++;
      else if (child.rawG === 'XCXc') fCarCount++;
      else fCbCount++;
    }
  });

  const totalCbPct = (totalCbCount / 4) * 100;

  const handleCross = () => {
    setAnimKey(k => k + 1);
  };

  const fatherOptions = [
    { genotype: 'XCY', label: 'Normal', html: 'X<sup class="text-emerald-600">C</sup>Y' },
    { genotype: 'XcY', label: 'Buta Warna', html: 'X<sup class="text-rose-600">c</sup>Y' }
  ];

  const motherOptions = [
    { genotype: 'XCXC', label: 'Normal', html: 'X<sup class="text-emerald-600">C</sup>X<sup class="text-emerald-600">C</sup>' },
    { genotype: 'XCXc', label: 'Carrier (Pembawa)', html: 'X<sup class="text-emerald-600">C</sup>X<sup class="text-rose-600">c</sup>' },
    { genotype: 'XcXc', label: 'Buta Warna', html: 'X<sup class="text-rose-600">c</sup>X<sup class="text-rose-600">c</sup>' }
  ];

  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleAnswer = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (userAnswers.every(a => a !== null)) {
      setQuizSubmitted(true);
    }
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
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_#000] font-bold text-sm transform -rotate-3 text-black">BIOLOGI GENETIKA</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">
          LAB VIRTUAL: GENETIKA BUTA WARNA
        </h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black">
          Pewarisan Sifat Pautan Kromosom X (X-Linked Recessive)
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#facc15] text-md transform rotate-2 z-30 uppercase">
            Pemilihan Induk (Parental)
          </span>

          <div className="flex flex-col gap-6 mt-4">
            <div className="bg-blue-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b-4 border-black pb-2 mb-1">
                <span className="text-3xl">👨</span>
                <h3 className="font-black uppercase text-blue-800 text-lg">Genotipe Ayah</h3>
              </div>
              <div className="flex flex-col gap-2">
                {fatherOptions.map(opt => (
                  <button
                    key={opt.genotype}
                    onClick={() => setFather(opt.genotype)}
                    className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase transition-all py-2 px-3 text-sm flex justify-between items-center
                      ${father === opt.genotype 
                        ? 'bg-emerald-400 text-black ring-4 ring-black translate-x-[4px] translate-y-[4px] shadow-none' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    <span className="font-bold">{opt.label}</span>
                    <span className="font-mono text-lg bg-white px-2 border-2 border-black" dangerouslySetInnerHTML={{ __html: opt.html }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-rose-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b-4 border-black pb-2 mb-1">
                <span className="text-3xl">👩</span>
                <h3 className="font-black uppercase text-rose-800 text-lg">Genotipe Ibu</h3>
              </div>
              <div className="flex flex-col gap-2">
                {motherOptions.map(opt => (
                  <button
                    key={opt.genotype}
                    onClick={() => setMother(opt.genotype)}
                    className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase transition-all py-2 px-3 text-sm flex justify-between items-center
                      ${mother === opt.genotype 
                        ? 'bg-emerald-400 text-black ring-4 ring-black translate-x-[4px] translate-y-[4px] shadow-none' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    <span className="font-bold">{opt.label}</span>
                    <span className="font-mono text-lg bg-white px-2 border-2 border-black" dangerouslySetInnerHTML={{ __html: opt.html }} />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCross}
              className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-yellow-400 hover:bg-yellow-300 py-4 text-lg font-black uppercase mt-2 flex items-center justify-center gap-2 transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none"
            >
              🧬 Lakukan Persilangan
            </button>
          </div>
        </div>

        <div className="bg-[#f8fafc] border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col items-center justify-center w-full lg:w-1/3 min-h-[450px] overflow-hidden">
          <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-xs transform -rotate-2 z-30 uppercase">
            Papan Catur Punnett
          </span>

          <div className="w-full flex justify-center items-center mt-6">
            <div key={animKey} className="grid gap-1 bg-black border-4 border-black p-1 shadow-[8px_8px_0px_0px_#000] w-full max-w-[350px]" style={{ gridTemplateColumns: '80px 1fr 1fr', gridTemplateRows: '80px 1fr 1fr' }}>
              <div className="bg-slate-200 relative overflow-hidden flex items-center justify-center">
                <span className="absolute top-2 right-2 text-rose-600 font-bold text-[10px]">IBU (♀)</span>
                <span className="absolute bottom-2 left-2 text-blue-600 font-bold text-[10px]">AYAH (♂)</span>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent" style={{ background: 'linear-gradient(to bottom right, transparent 48%, #000 48%, #000 52%, transparent 52%)' }}></div>
              </div>
              
              <div className="bg-slate-100 font-black text-xl flex items-center justify-center text-rose-800" dangerouslySetInnerHTML={{ __html: formatAlleleHTML(momAlleles[0]) }} />
              <div className="bg-slate-100 font-black text-xl flex items-center justify-center text-rose-800" dangerouslySetInnerHTML={{ __html: formatAlleleHTML(momAlleles[1]) }} />

              <div className="bg-slate-100 font-black text-xl flex items-center justify-center text-blue-800" dangerouslySetInnerHTML={{ __html: formatAlleleHTML(dadAlleles[0]) }} />
              
              <div className={`bg-white flex flex-col items-center justify-center p-2 min-h-[100px] animate-[fadeIn_0.4s_ease-out_forwards]`} style={{ animationDelay: '0s' }}>
                <span className="font-mono font-black text-2xl" dangerouslySetInnerHTML={{ __html: offspring1.genotypeHtml }} />
                <span className={`mt-2 text-[10px] sm:text-xs font-bold px-2 py-1 border-2 border-black ${offspring1.styleClass}`}>{offspring1.phenotype}</span>
              </div>
              
              <div className={`bg-white flex flex-col items-center justify-center p-2 min-h-[100px] animate-[fadeIn_0.4s_ease-out_forwards]`} style={{ animationDelay: '0.1s' }}>
                <span className="font-mono font-black text-2xl" dangerouslySetInnerHTML={{ __html: offspring2.genotypeHtml }} />
                <span className={`mt-2 text-[10px] sm:text-xs font-bold px-2 py-1 border-2 border-black ${offspring2.styleClass}`}>{offspring2.phenotype}</span>
              </div>

              <div className="bg-slate-100 font-black text-xl flex items-center justify-center text-blue-800" dangerouslySetInnerHTML={{ __html: formatAlleleHTML(dadAlleles[1]) }} />
              
              <div className={`bg-white flex flex-col items-center justify-center p-2 min-h-[100px] animate-[fadeIn_0.4s_ease-out_forwards]`} style={{ animationDelay: '0.2s' }}>
                <span className="font-mono font-black text-2xl" dangerouslySetInnerHTML={{ __html: offspring3.genotypeHtml }} />
                <span className={`mt-2 text-[10px] sm:text-xs font-bold px-2 py-1 border-2 border-black ${offspring3.styleClass}`}>{offspring3.phenotype}</span>
              </div>
              
              <div className={`bg-white flex flex-col items-center justify-center p-2 min-h-[100px] animate-[fadeIn_0.4s_ease-out_forwards]`} style={{ animationDelay: '0.3s' }}>
                <span className="font-mono font-black text-2xl" dangerouslySetInnerHTML={{ __html: offspring4.genotypeHtml }} />
                <span className={`mt-2 text-[10px] sm:text-xs font-bold px-2 py-1 border-2 border-black ${offspring4.styleClass}`}>{offspring4.phenotype}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white border-2 border-black p-3 flex gap-4 text-[10px] font-bold uppercase w-full justify-center">
            <span className="flex items-center gap-1"><span className="text-emerald-600 text-lg">C</span> = Gen Normal Dominan</span>
            <span className="flex items-center gap-1"><span className="text-rose-600 text-lg">c</span> = Gen Buta Warna Resesif</span>
          </div>
        </div>

        <div className="bg-slate-900 text-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 relative flex flex-col gap-4 w-full lg:w-1/3 justify-start">
          <span className="absolute -top-4 left-6 bg-yellow-400 text-black font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#000] text-md transform -rotate-2 z-30 uppercase">
            Probabilitas Anak (F1)
          </span>

          <div className="bg-black p-4 border-4 border-yellow-400 text-center shadow-[4px_4px_0px_0px_#facc15] mt-4">
            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block mb-2 border-b border-slate-700 pb-2">PELUANG ANAK BUTA WARNA (TOTAL)</span>
            <span className="font-mono font-black text-5xl text-rose-500">{totalCbPct}%</span>
          </div>

          <div className="mt-4 flex flex-col gap-4 flex-1">
            <div className="bg-rose-950 p-4 border-4 border-rose-500 flex flex-col gap-2">
              <h4 className="font-black text-rose-300 text-sm uppercase flex items-center gap-2 mb-2">
                <span className="bg-rose-500 text-white px-2 rounded-full">♀</span> Anak Perempuan
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="flex flex-col bg-slate-800 p-2 border border-slate-600">
                  <span className="text-emerald-400 text-lg">{fNormCount > 0 ? '50%' : '0%'}</span>
                  <span className="text-slate-400 mt-1">Normal</span>
                </div>
                <div className="flex flex-col bg-slate-800 p-2 border border-slate-600">
                  <span className="text-yellow-400 text-lg">{fCarCount > 0 ? '50%' : '0%'}</span>
                  <span className="text-slate-400 mt-1">Carrier</span>
                </div>
                <div className="flex flex-col bg-slate-800 p-2 border border-slate-600">
                  <span className="text-rose-400 text-lg">{fCbCount > 0 ? '100%' : '0%'}</span>
                  <span className="text-slate-400 mt-1">Buta W.</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-950 p-4 border-4 border-blue-500 flex flex-col gap-2">
              <h4 className="font-black text-blue-300 text-sm uppercase flex items-center gap-2 mb-2">
                <span className="bg-blue-500 text-white px-2 rounded-full">♂</span> Anak Laki-Laki
              </h4>
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                <div className="flex flex-col bg-slate-800 p-2 border border-slate-600">
                  <span className="text-sky-400 text-lg">{mNormCount > 0 ? '50%' : '0%'}</span>
                  <span className="text-slate-400 mt-1">Normal</span>
                </div>
                <div className="flex flex-col bg-slate-800 p-2 border border-slate-600">
                  <span className="text-rose-400 text-lg">{mCbCount > 0 ? '50%' : '0%'}</span>
                  <span className="text-slate-400 mt-1">Buta Warna</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 text-center mt-1 italic">*Laki-laki tidak bisa menjadi Carrier.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-yellow-100 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 transform -rotate-1 uppercase text-black">
          MENGAPA LAKI-LAKI LEBIH RENTAN BUTA WARNA? 🧬
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-rose-600 border-b-2 border-black pb-1 mb-3">Pewarisan Terpaut Kromosom X</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Gen yang mengatur penglihatan warna terletak pada <b>Kromosom X</b>. Sifat buta warna adalah <b>Resesif (c)</b>, sedangkan penglihatan normal adalah <b>Dominan (C)</b>.
              <br /><br />
              Karena sifatnya resesif, gen buta warna akan "kalah" tertutupi jika ada gen normal dominan yang menemaninya.
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-blue-600 border-b-2 border-black pb-1 mb-3">Perbedaan Kromosom Seks</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              • <b>Perempuan (XX):</b> Memiliki dua kromosom X. Jika satu X rusak (c), X yang lain masih bisa menutupi (C), sehingga ia hanya menjadi pembawa sifat (<i>Carrier</i>) namun penglihatannya normal.
              <br />
              • <b>Laki-laki (XY):</b> Hanya memiliki SATU kromosom X (dari ibu). Kromosom Y tidak memiliki gen penglihatan warna. Jadi, jika laki-laki mendapat kromosom X resesif (c), ia <b>pasti akan buta warna</b> karena tidak ada gen C lain untuk menolongnya.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 bg-indigo-300 border-4 border-black shadow-[8px_8px_0px_0px_#000000] rounded-xl p-6 w-full max-w-6xl z-10 relative">
        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center">
            EVALUASI KONSEP GENETIKA [KUIS]
          </h3>
        </div>
        
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="space-y-6 text-black">
            {quizData.map((q, qIdx) => (
              <div key={qIdx} className="bg-slate-50 p-4 border-4 border-black shadow-[4px_4px_0px_#000] mb-4">
                <h4 className="font-bold mb-3 text-sm uppercase tracking-tight">{q.question}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswer(qIdx, oIdx)}
                      disabled={quizSubmitted}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase transition-all text-left px-4 py-2 bg-white text-xs
                        ${quizSubmitted 
                          ? oIdx === q.answer 
                            ? 'bg-green-400 text-black' 
                            : userAnswers[qIdx] === oIdx 
                              ? 'bg-rose-400 text-black' 
                              : ''
                          : userAnswers[qIdx] === oIdx 
                            ? 'bg-black text-white translate-x-[4px] translate-y-[4px] shadow-none' 
                            : 'hover:bg-slate-100'
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
                className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-3 px-10 text-xl w-full mt-4 bg-slate-900 text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
              >
                KIRIM JAWABAN!
              </button>
            )}
            
            {quizSubmitted && (
              <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score}/5</h4>
                <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                  {score === 5 ? "Sempurna! Anda memahami materi pewarisan sifat dengan baik." : "Bagus! Coba simulasi persilangan sekali lagi."}
                </p>
                <br />
                <button
                  onClick={handleRetry}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg font-bold uppercase py-3 px-8 text-lg bg-black text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                >
                  ULANGI KUIS
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}