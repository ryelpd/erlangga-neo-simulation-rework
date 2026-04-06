import { useState, useMemo } from 'react';

export default function SqlJoinVisualizer() {
  const [joinType, setJoinType] = useState<'INNER' | 'LEFT' | 'RIGHT' | 'FULL'>('INNER');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null, null]);

  const tableA = [
    { id: 1, nama: "Budi", dept_id: 10 },
    { id: 2, nama: "Siti", dept_id: 20 },
    { id: 3, nama: "Andi", dept_id: 10 },
    { id: 4, nama: "Rina", dept_id: null }
  ];

  const tableB = [
    { dept_id: 10, nama_dept: "IT" },
    { dept_id: 20, nama_dept: "HRD" },
    { dept_id: 30, nama_dept: "Finance" }
  ];

  const formatNull = (val: number | string | null): string => {
    if (val === null || val === undefined) return 'NULL';
    return String(val);
  };

  const joinResult = useMemo(() => {
    const resultSet: Array<{
      id: number | null;
      nama: string | null;
      dept_id: number | null;
      b_dept_id: number | null;
      nama_dept: string | null;
    }> = [];

    if (joinType === 'INNER') {
      tableA.forEach(a => {
        tableB.forEach(b => {
          if (a.dept_id === b.dept_id) {
            resultSet.push({ ...a, b_dept_id: b.dept_id, nama_dept: b.nama_dept });
          }
        });
      });
    } else if (joinType === 'LEFT') {
      tableA.forEach(a => {
        let matched = false;
        tableB.forEach(b => {
          if (a.dept_id === b.dept_id) {
            resultSet.push({ ...a, b_dept_id: b.dept_id, nama_dept: b.nama_dept });
            matched = true;
          }
        });
        if (!matched) {
          resultSet.push({ ...a, b_dept_id: null, nama_dept: null });
        }
      });
    } else if (joinType === 'RIGHT') {
      tableB.forEach(b => {
        let matched = false;
        tableA.forEach(a => {
          if (a.dept_id === b.dept_id) {
            resultSet.push({ ...a, b_dept_id: b.dept_id, nama_dept: b.nama_dept });
            matched = true;
          }
        });
        if (!matched) {
          resultSet.push({ id: null, nama: null, dept_id: null, b_dept_id: b.dept_id, nama_dept: b.nama_dept });
        }
      });
    } else if (joinType === 'FULL') {
      tableA.forEach(a => {
        let matched = false;
        tableB.forEach(b => {
          if (a.dept_id === b.dept_id) {
            resultSet.push({ ...a, b_dept_id: b.dept_id, nama_dept: b.nama_dept });
            matched = true;
          }
        });
        if (!matched) {
          resultSet.push({ ...a, b_dept_id: null, nama_dept: null });
        }
      });
      tableB.forEach(b => {
        const matched = tableA.find(a => a.dept_id === b.dept_id);
        if (!matched) {
          resultSet.push({ id: null, nama: null, dept_id: null, b_dept_id: b.dept_id, nama_dept: b.nama_dept });
        }
      });
    }

    return resultSet;
  }, [joinType]);

  const vennColors = useMemo(() => {
    switch (joinType) {
      case 'INNER':
        return { left: '#ffffff', right: '#ffffff', center: '#22c55e' };
      case 'LEFT':
        return { left: '#38bdf8', right: '#ffffff', center: '#38bdf8' };
      case 'RIGHT':
        return { left: '#ffffff', right: '#fb7185', center: '#fb7185' };
      case 'FULL':
        return { left: '#facc15', right: '#facc15', center: '#facc15' };
      default:
        return { left: '#ffffff', right: '#ffffff', center: '#22c55e' };
    }
  }, [joinType]);

  const joinDescription = useMemo(() => {
    switch (joinType) {
      case 'INNER':
        return 'Mengambil HANYA data yang beririsan (cocok di kedua tabel).';
      case 'LEFT':
        return 'Mengambil SEMUA data Kiri (A), dan data Kanan (B) yang cocok.';
      case 'RIGHT':
        return 'Mengambil SEMUA data Kanan (B), dan data Kiri (A) yang cocok.';
      case 'FULL':
        return 'Mengambil SELURUH data dari kedua tabel (Kiri maupun Kanan).';
      default:
        return '';
    }
  }, [joinType]);

  const quizData = [
    {
      question: "1. Jenis JOIN manakah yang paling tepat digunakan jika kita HANYA ingin melihat Karyawan yang sudah pasti memiliki Departemen?",
      options: ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"],
      answer: 2
    },
    {
      question: "2. Lihat Tabel A dan Tabel B. Jika kita menggunakan LEFT JOIN (Tabel A LEFT JOIN Tabel B), mengapa Rina menghasilkan nilai NULL pada kolom Nama_Dept?",
      options: ["Karena Rina belum gajian", "Karena Rina memiliki Dept_ID yang bernilai NULL, sehingga tidak ada kecocokan di Tabel B", "Karena Tabel B tidak memiliki kolom Rina", "Karena LEFT JOIN menghapus data"],
      answer: 1
    },
    {
      question: "3. Jika kita menggunakan RIGHT JOIN (Tabel A RIGHT JOIN Tabel B), departemen manakah yang akan muncul meskipun belum memiliki karyawan?",
      options: ["IT", "HRD", "Finance", "Tidak ada"],
      answer: 2
    },
    {
      question: "4. Sebuah query FULL OUTER JOIN akan menghasilkan baris data sebanyak...",
      options: ["Sama dengan jumlah baris INNER JOIN", "Gabungan semua baris yang cocok, ditambah baris tidak cocok dari Kiri, dan baris tidak cocok dari Kanan", "Hanya baris yang tidak memiliki pasangan", "Sama dengan perkalian jumlah baris (Cross Join)"],
      answer: 1
    },
    {
      question: "5. Secara visual pada Diagram Venn, bagian mana yang diwarnai untuk mempresentasikan INNER JOIN?",
      options: ["Seluruh lingkaran kiri", "Seluruh lingkaran kanan", "Hanya area perpotongan (irisan) di tengah", "Bagian luar dari kedua lingkaran"],
      answer: 2
    }
  ];

  const selectAnswer = (qIndex: number, optIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIndex] = optIndex;
    setUserAnswers(newAnswers);
  };

  const getScore = (): number => {
    return userAnswers.reduce<number>((score, ans, idx) =>
      ans === quizData[idx].answer ? score + 1 : score, 0
    );
  };

  const resetQuiz = () => {
    setUserAnswers([null, null, null, null, null]);
    setQuizSubmitted(false);
  };

  const joinTypes: Array<{ type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL', label: string }> = [
    { type: 'INNER', label: 'INNER JOIN' },
    { type: 'LEFT', label: 'LEFT JOIN' },
    { type: 'RIGHT', label: 'RIGHT JOIN' },
    { type: 'FULL', label: 'FULL OUTER JOIN' }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-yellow-300 border-4 border-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black font-bold text-sm transform -rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            ILMU KOMPUTER & DATABASE
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-center">
            LAB VIRTUAL: SQL JOIN VISUALIZER
          </h1>
          <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black mx-auto block text-center">
            Menganalisis Relasi Data Antar Tabel (Relational Database)
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            <div className="bg-white border-4 border-black p-6 flex flex-col gap-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <label className="text-sm font-bold text-black uppercase bg-cyan-300 inline-block px-2 border-2 border-black w-max shadow-[2px_2px_0px_#000]">
                PILIH JENIS JOIN
              </label>
              <div className="flex flex-col gap-3">
                {joinTypes.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => setJoinType(type)}
                    className={`py-3 border-4 border-black text-center text-lg font-bold uppercase transition-all rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                      joinType === type
                        ? 'bg-emerald-400 text-black ring-4 ring-black'
                        : 'bg-slate-100 text-slate-500 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 border-4 border-black p-6 flex flex-col items-center gap-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-white px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000] transform rotate-2">
                <h3 className="font-black uppercase text-sm">DIAGRAM VENN</h3>
              </div>
              
              <div className="w-full aspect-[4/3] bg-white border-4 border-black shadow-inner flex items-center justify-center relative overflow-hidden p-4 rounded-lg">
                <svg viewBox="0 0 300 200" className="w-full h-full">
                  <defs>
                    <clipPath id="intersectClip">
                      <circle cx="190" cy="100" r="70" />
                    </clipPath>
                  </defs>

                  <circle cx="110" cy="100" r="70" fill={vennColors.left} stroke="#000" strokeWidth="4" />
                  <circle cx="190" cy="100" r="70" fill={vennColors.right} stroke="#000" strokeWidth="4" />
                  <circle cx="110" cy="100" r="70" fill={vennColors.center} clipPath="url(#intersectClip)" stroke="#000" strokeWidth="4"/>

                  <text x="60" y="105" fontSize="20" fontWeight="900" fill="#000">A</text>
                  <text x="230" y="105" fontSize="20" fontWeight="900" fill="#000">B</text>
                </svg>
              </div>

              <div className="w-full bg-yellow-300 p-3 border-4 border-black text-center shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <span className="font-bold text-sm text-black">{joinDescription}</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="bg-rose-50 border-4 border-black p-4 flex-1 flex flex-col gap-2 relative rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <span className="absolute -top-3 left-4 bg-rose-400 text-white font-black px-2 py-1 border-2 border-black text-sm">TABEL A (KIRI)</span>
                <h3 className="font-bold text-lg mt-2 mb-1">KARYAWAN</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border-4 border-black bg-white text-sm">
                    <thead className="bg-rose-200">
                      <tr>
                        <th className="border-2 border-black p-2 text-left font-black uppercase">ID</th>
                        <th className="border-2 border-black p-2 text-left font-black uppercase">Nama</th>
                        <th className="border-2 border-black p-2 text-left font-black uppercase bg-yellow-200 border-b-4 border-black border-dashed">Dept_ID (FK)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableA.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-100">
                          <td className="border-2 border-black p-2">{row.id}</td>
                          <td className="border-2 border-black p-2">{row.nama}</td>
                          <td className={`border-2 border-black p-2 font-bold ${row.dept_id === null ? 'text-red-500 italic bg-red-100' : ''}`}>
                            {formatNull(row.dept_id)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-sky-50 border-4 border-black p-4 flex-1 flex flex-col gap-2 relative rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <span className="absolute -top-3 left-4 bg-sky-400 text-white font-black px-2 py-1 border-2 border-black text-sm">TABEL B (KANAN)</span>
                <h3 className="font-bold text-lg mt-2 mb-1">DEPARTEMEN</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border-4 border-black bg-white text-sm">
                    <thead className="bg-sky-200">
                      <tr>
                        <th className="border-2 border-black p-2 text-left font-black uppercase bg-yellow-200 border-b-4 border-black border-dashed">Dept_ID (PK)</th>
                        <th className="border-2 border-black p-2 text-left font-black uppercase">Nama_Dept</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableB.map((row) => (
                        <tr key={row.dept_id} className="hover:bg-slate-100">
                          <td className="border-2 border-black p-2 font-bold">{row.dept_id}</td>
                          <td className="border-2 border-black p-2">{row.nama_dept}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="w-full flex justify-center text-4xl">⬇️</div>

            <div className="bg-white border-4 border-black p-6 relative flex flex-col gap-3 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <span className="absolute -top-4 right-6 bg-black text-white font-black px-3 py-1 border-4 border-white shadow-[4px_4px_0px_#facc15] text-xl transform rotate-2">
                {joinType} JOIN
              </span>
              
              <div className="bg-slate-900 text-emerald-400 p-4 border-4 border-black font-mono text-sm overflow-x-auto shadow-[4px_4px_0px_0px_#000] rounded-lg">
                <span className="text-pink-400">SELECT</span> A.Nama, B.Nama_Dept<br/>
                <span className="text-pink-400">FROM</span> Karyawan A<br/>
                <span className="text-yellow-400 font-bold">{joinType}{joinType === 'FULL' ? ' OUTER' : ''} JOIN</span> Departemen B<br/>
                <span className="text-pink-400">ON</span> A.Dept_ID = B.Dept_ID;
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full border-collapse border-4 border-black bg-white">
                  <thead className="bg-slate-200">
                    <tr>
                      <th className="border-2 border-black p-2 text-left font-black uppercase">Karyawan (A)</th>
                      <th className="border-2 border-black p-2 text-left font-black uppercase">Dept_ID (A)</th>
                      <th className="border-2 border-black p-2 text-left font-black uppercase">Dept_ID (B)</th>
                      <th className="border-2 border-black p-2 text-left font-black uppercase">Nama Dept (B)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {joinResult.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-100">
                        <td className={`border-2 border-black p-2 ${row.nama === null ? 'bg-slate-100' : 'bg-rose-50'}`}>
                          {row.nama === null ? <span className="text-red-500 italic font-bold bg-red-100 px-1">NULL</span> : row.nama}
                        </td>
                        <td className={`border-2 border-black p-2 ${row.dept_id === null ? 'bg-slate-100' : 'bg-rose-50 font-bold'}`}>
                          {row.dept_id === null ? <span className="text-red-500 italic font-bold bg-red-100 px-1">NULL</span> : row.dept_id}
                        </td>
                        <td className={`border-2 border-black p-2 ${row.b_dept_id === null ? 'bg-slate-100' : 'bg-sky-50 font-bold'}`}>
                          {row.b_dept_id === null ? <span className="text-red-500 italic font-bold bg-red-100 px-1">NULL</span> : row.b_dept_id}
                        </td>
                        <td className={`border-2 border-black p-2 ${row.nama_dept === null ? 'bg-slate-100' : 'bg-sky-50'}`}>
                          {row.nama_dept === null ? <span className="text-red-500 italic font-bold bg-red-100 px-1">NULL</span> : row.nama_dept}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right font-bold text-sm mt-1">Total: {joinResult.length} Baris</div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-200 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-4 transform -rotate-1">
            PENJELASAN KONSEP: RELASI DATABASE 🧠
          </h3>
          
          <p className="text-black font-semibold text-md leading-relaxed mb-4 bg-white/80 p-3 border-2 border-black border-dashed">
            Dalam database relasional, data seringkali dipecah ke dalam beberapa tabel untuk menghindari duplikasi (Normalisasi). <b>SQL JOIN</b> digunakan untuk menggabungkan kembali baris-baris dari dua atau lebih tabel berdasarkan kolom terkait yang ada di antara mereka (Primary Key & Foreign Key).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-emerald-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-emerald-800 mb-2 border-b-4 border-black pb-1">🟢 INNER JOIN</h4>
              <p className="text-sm font-semibold">Mengembalikan baris data hanya ketika ada nilai yang <b>cocok di KEDUA tabel</b>. Data yang tidak memiliki pasangan akan dibuang dari hasil akhir.</p>
            </div>
            
            <div className="bg-sky-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-sky-800 mb-2 border-b-4 border-black pb-1">🔵 LEFT JOIN</h4>
              <p className="text-sm font-semibold">Mengembalikan <b>SELURUH baris dari Tabel Kiri (A)</b>, dan baris yang cocok dari Tabel Kanan (B). Jika tidak punya pasangan, hasil B akan <code>NULL</code>.</p>
            </div>
            
            <div className="bg-rose-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-rose-800 mb-2 border-b-4 border-black pb-1">🔴 RIGHT JOIN</h4>
              <p className="text-sm font-semibold">Kebalikan dari Left Join. Mengembalikan <b>SELURUH baris dari Tabel Kanan (B)</b>. Jika tidak punya pasangan, sisi A akan menjadi <code>NULL</code>.</p>
            </div>

            <div className="bg-yellow-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] rounded-lg">
              <h4 className="font-black text-lg uppercase text-yellow-800 mb-2 border-b-4 border-black pb-1">🟡 FULL OUTER JOIN</h4>
              <p className="text-sm font-semibold">Menggabungkan hasil dari Left dan Right Join. Mengembalikan <b>SEMUA baris dari kedua tabel</b>. Yang tidak punya pasangan akan diisi <code>NULL</code>.</p>
            </div>
          </div>
        </div>

        <div className="bg-fuchsia-300 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#fff] transform rotate-1 mb-6 rounded-lg">
            <h3 className="text-2xl font-black uppercase tracking-widest text-center">
              EVALUASI KONSEP [KUIS]
            </h3>
          </div>
          
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] rounded-lg">
            <div className="space-y-6">
              {quizData.map((q, qIndex) => (
                <div key={qIndex} className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg">
                  <h4 className="font-bold text-black mb-4 text-lg bg-sky-200 inline-block px-2 border-2 border-black">
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => !quizSubmitted && selectAnswer(qIndex, optIndex)}
                        disabled={quizSubmitted}
                        className={`text-left px-4 py-3 border-4 border-black font-bold transition-all rounded-lg ${
                          quizSubmitted
                            ? optIndex === q.answer
                              ? 'bg-green-400 text-black'
                              : userAnswers[qIndex] === optIndex
                                ? 'bg-rose-400 text-black line-through'
                                : 'bg-white opacity-50'
                            : userAnswers[qIndex] === optIndex
                              ? 'bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-slate-100 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        {quizSubmitted && optIndex === q.answer && '[ BENAR ] '}
                        {quizSubmitted && userAnswers[qIndex] === optIndex && optIndex !== q.answer && '[ SALAH ] '}
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!quizSubmitted && userAnswers.every(a => a !== null) && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="bg-slate-900 text-white font-bold py-3 px-10 text-xl uppercase tracking-widest border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg"
                  >
                    KIRIM JAWABAN!
                  </button>
                </div>
              )}
            </div>

            {quizSubmitted && (() => {
              const score = getScore();
              return (
                <div className="mt-8 text-center p-6 bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_#000] rounded-lg">
                  <h4 className="text-3xl font-black text-black mb-2 uppercase">SKOR AKHIR: {score} / 5</h4>
                  <p className="text-black font-semibold text-lg mb-6 bg-white inline-block px-4 py-1 border-2 border-black">
                    {score === 5
                      ? "SEMPURNA! PEMAHAMAN DATABASE ANDA SANGAT BAIK."
                      : score >= 3
                        ? "CUKUP BAIK. COBA PERHATIKAN LAGI TABEL HASIL DI SIMULASI."
                        : "YUK BACA LAGI BAGIAN PENJELASAN KONSEP DI ATAS."}
                  </p>
                  <br />
                  <button
                    onClick={resetQuiz}
                    className="bg-black text-white py-3 px-8 text-lg uppercase tracking-wider font-bold border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg"
                  >
                    ULANGI KUIS
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}