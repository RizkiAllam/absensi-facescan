/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../ThemeContext";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function GuruPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Data State
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMapel, setSelectedMapel] = useState("Matematika"); // Default Mapel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKelas, setNewKelas] = useState("");

  const theme = {
    textMain: isDarkMode ? "text-white" : "text-slate-800",
    textSec: isDarkMode ? "text-slate-400" : "text-slate-500",
    card: isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200 shadow-xl",
    input: isDarkMode ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900",
    btnInactive: isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600",
  };

  useEffect(() => {
    fetchKelas();
  }, []);

  const fetchKelas = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/kelas`);
      setKelasOptions(res.data.data);
      if (res.data.data.length > 0 && !selectedKelas) setSelectedKelas(res.data.data[0]);
    } catch (err) { console.error(err); }
  };

  // FETCH DATA SAAT FILTER BERUBAH
  useEffect(() => {
    if (selectedKelas && selectedDate && selectedMapel) {
      fetchStudentData();
    }
  }, [selectedKelas, selectedDate, selectedMapel]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("tanggal", selectedDate);
      formData.append("kelas", selectedKelas);
      formData.append("mapel", selectedMapel); // Kirim Mapel
      const res = await axios.post(`${API_BASE_URL}/guru-check`, formData);
      setStudents(res.data.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: status } : s));
    try {
      const formData = new FormData();
      formData.append("siswa_id", id.toString());
      formData.append("status", status);
      formData.append("tanggal", selectedDate);
      formData.append("mapel", selectedMapel); // Simpan status untuk mapel ini
      await axios.post(`${API_BASE_URL}/update-absen-manual`, formData);
    } catch (err) { alert("Gagal update status"); }
  };

  const handleAddKelas = async () => {
    if (!newKelas) return;
    try {
      const formData = new FormData();
      formData.append("nama_kelas", newKelas);
      await axios.post(`${API_BASE_URL}/kelas`, formData);
      setNewKelas(""); fetchKelas();
    } catch (err) { alert("Gagal."); }
  };

  return (
    <div className="font-sans w-full max-w-[100vw] pb-24 md:pb-0">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 animate-fade-in">
        <div>
          <h1 className={`text-2xl md:text-3xl font-extrabold ${theme.textMain}`}>Guru <span className="text-blue-500">Check</span></h1>
          <p className={`text-xs ${theme.textSec}`}>Kelola Kehadiran Per Mata Pelajaran</p>
        </div>
        <button onClick={toggleTheme} className={`p-2 rounded-full shadow-lg ${isDarkMode ? "bg-yellow-400 text-yellow-900" : "bg-slate-700 text-white"}`}>
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>

      {/* MANAJEMEN KELAS */}
      <div className={`p-4 rounded-2xl border mb-6 ${theme.card} animate-fade-in`}>
        <h3 className={`font-bold text-sm mb-3 ${theme.textMain}`}>📚 Tambah Kelas Baru</h3>
        <div className="flex gap-2">
          <input className={`flex-1 p-2 rounded-lg border text-sm outline-none ${theme.input}`} placeholder="Nama Kelas..." value={newKelas} onChange={(e) => setNewKelas(e.target.value)} />
          <button onClick={handleAddKelas} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs">TAMBAH</button>
        </div>
      </div>

      {/* FILTER BAR (Responsive Stack) */}
      <div className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row gap-4 ${theme.card} animate-fade-in`}>
        
        <div className="flex-1 w-full">
          <label className={`text-[10px] font-bold block mb-1 uppercase ${theme.textSec}`}>Kelas</label>
          <select className={`w-full p-3 rounded-xl border outline-none ${theme.input}`} value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
            {kelasOptions.map(k => <option key={k} value={k} className="text-black">{k}</option>)}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className={`text-[10px] font-bold block mb-1 uppercase ${theme.textSec}`}>Mata Pelajaran</label>
          <input 
            className={`w-full p-3 rounded-xl border outline-none ${theme.input}`} 
            placeholder="Cth: Matematika, Penjas..."
            value={selectedMapel}
            onChange={(e) => setSelectedMapel(e.target.value)}
          />
        </div>

        <div className="flex-1 w-full">
          <label className={`text-[10px] font-bold block mb-1 uppercase ${theme.textSec}`}>Tanggal</label>
          <input type="date" className={`w-full p-3 rounded-xl border outline-none ${theme.input}`} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
      </div>

      {/* LIST SISWA */}
      <div className="space-y-3 animate-fade-in">
        {loading ? <p className="text-center opacity-50">Memuat data...</p> : 
         students.length === 0 ? <p className="text-center opacity-50">Tidak ada siswa.</p> : 
         students.map((student) => (
            <div key={student.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${theme.card}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg 
                  ${student.status === "Hadir" ? "bg-green-500" : student.status === "Belum Absen" ? "bg-slate-400" : "bg-yellow-500"}`}>
                  {student.nama.charAt(0)}
                </div>
                <div>
                  <h4 className={`font-bold ${theme.textMain}`}>{student.nama}</h4>
                  <p className={`text-xs ${theme.textSec}`}>{student.nis} • {student.jam !== "-" ? `Jam: ${student.jam}` : "Belum ada data"}</p>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
                {["Hadir", "Izin", "Sakit", "Alpha"].map((st) => (
                  <button key={st} onClick={() => updateStatus(student.id, st)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                      ${student.status === st 
                        ? (st === "Hadir" ? "bg-green-600 text-white" : st === "Alpha" ? "bg-red-600 text-white" : "bg-yellow-500 text-white") 
                        : theme.btnInactive}`}>
                    {st.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}