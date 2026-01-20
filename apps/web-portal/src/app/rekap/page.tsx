/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import axios from "axios";
import { useTheme } from "../ThemeContext";

const API_BASE_URL = "http://127.0.0.1:8000";

interface RekapItem { tanggal: string; waktu: string; nama: string; kelas: string; mapel: string; status: string; }

export default function RekapPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [dates, setDates] = useState({ start: new Date().toISOString().split("T")[0], end: new Date().toISOString().split("T")[0] });
  const [data, setData] = useState<RekapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const theme = {
    textMain: isDarkMode ? "text-white" : "text-slate-800",
    textSec: isDarkMode ? "text-slate-400" : "text-slate-500",
    card: isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200 shadow-xl",
    input: isDarkMode ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900",
    tableHead: isDarkMode ? "bg-slate-900/50 text-slate-400" : "bg-slate-100 text-slate-600",
    tableRow: isDarkMode ? "hover:bg-slate-700/50 text-slate-300" : "hover:bg-slate-50 text-slate-700",
  };

  const handleCari = async () => {
    setLoading(true); setHasSearched(true);
    try {
      const formData = new FormData();
      formData.append("start", dates.start); formData.append("end", dates.end);
      const res = await axios.post(`${API_BASE_URL}/rekap-absensi`, formData);
      setData(res.data.data);
    } catch (err) { alert("Gagal koneksi."); } finally { setLoading(false); }
  };

  return (
    <div className={`transition-colors duration-500 font-sans w-full max-w-[100vw]`}>
      
      {/* HEADER RESPONSIVE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 animate-fade-in">
        <div>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>
            Rekap <span className="text-blue-500">Database</span>
          </h1>
          <p className={`text-xs md:text-sm ${theme.textSec} mt-1`}>Laporan kehadiran siswa.</p>
        </div>
        <button onClick={toggleTheme} className={`p-2 rounded-full shadow-lg transition-transform hover:scale-110 self-end md:self-auto ${isDarkMode ? "bg-yellow-400 text-yellow-900" : "bg-slate-700 text-white"}`}>
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>

      {/* FILTER BOX: Input Stack Vertical di HP */}
      <div className={`p-4 rounded-2xl border mb-8 flex flex-col md:flex-row gap-4 items-center ${theme.card} animate-fade-in`}>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-2xl">📅</span>
          <span className={`font-bold text-sm ${theme.textMain}`}>Periode:</span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-1">
          <input type="date" className={`w-full md:flex-1 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme.input}`} value={dates.start} onChange={(e) => setDates({...dates, start: e.target.value})} />
          <span className={`hidden md:block self-center ${theme.textSec}`}>s/d</span>
          <input type="date" className={`w-full md:flex-1 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme.input}`} value={dates.end} onChange={(e) => setDates({...dates, end: e.target.value})} />
        </div>

        <button onClick={handleCari} disabled={loading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50">
          {loading ? "..." : "🔍 CARI DATA"}
        </button>
      </div>

      {/* TABEL RESPONSIVE */}
      <div className={`rounded-3xl border overflow-hidden ${theme.card} animate-fade-in`}>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={`uppercase font-bold text-xs ${theme.tableHead}`}>
              <tr>
                <th className="p-4 md:p-5">Tanggal</th>
                <th className="p-4 md:p-5">Jam</th>
                <th className="p-4 md:p-5">Nama</th>
                <th className="p-4 md:p-5">Kelas</th>
                <th className="p-4 md:p-5">Mapel</th>
                <th className="p-4 md:p-5">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-slate-700" : "divide-slate-100"}`}>
              {!hasSearched && data.length === 0 ? (<tr><td colSpan={6} className="p-8 text-center text-slate-500">Pilih tanggal lalu cari.</td></tr>) : 
               data.length === 0 ? (<tr><td colSpan={6} className="p-8 text-center italic text-slate-500">Data tidak ditemukan.</td></tr>) : 
               data.map((item, idx) => (
                <tr key={idx} className={theme.tableRow}>
                  <td className="p-4 md:p-5 font-mono text-slate-500">{item.tanggal}</td>
                  <td className="p-4 md:p-5 font-mono text-blue-500 font-bold">{item.waktu}</td>
                  <td className={`p-4 md:p-5 font-bold ${theme.textMain}`}>{item.nama}</td>
                  <td className="p-4 md:p-5">{item.kelas}</td>
                  <td className="p-4 md:p-5">{item.mapel}</td>
                  <td className="p-4 md:p-5"><span className="bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs border border-green-500/20">{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}