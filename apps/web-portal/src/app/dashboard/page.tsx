"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useTheme } from "../ThemeContext";

const API_BASE_URL = "http://127.0.0.1:8000";

interface StatItem {
  waktu: string;
  nama: string;
  kelas: string;
  mapel: string;
  status: string;
}

export default function DashboardPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [stats, setStats] = useState({ total: 0, hadir: 0, terbaru: [] as StatItem[] });
  const [loading, setLoading] = useState(true);

  // Style Config
  const theme = {
    textMain: isDarkMode ? "text-white" : "text-slate-800",
    textSec: isDarkMode ? "text-slate-400" : "text-slate-500",
    card: isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200 shadow-xl",
    tableHead: isDarkMode ? "bg-slate-900/50 text-slate-400" : "bg-slate-100 text-slate-600",
    tableRow: isDarkMode ? "hover:bg-slate-700/50 text-slate-300" : "hover:bg-slate-50 text-slate-700",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const formData = new FormData();
        formData.append("start", today);
        formData.append("end", today);

        const res = await axios.post(`${API_BASE_URL}/rekap-absensi`, formData);
        const data = res.data.data;

        setStats({
          total: data.length,
          hadir: data.filter((item: StatItem) => item.status === "Hadir").length,
          terbaru: data.slice(0, 10) // Ambil maksimal 10 data terakhir
        });
      } catch (err: unknown) {
        console.error("Gagal ambil dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={`transition-colors duration-500 font-sans w-full max-w-[100vw]`}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4 animate-fade-in">
        <div>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>
            Dashboard <span className="text-blue-500">Guru</span>
          </h1>
          <p className={`text-xs md:text-sm ${theme.textSec} mt-1`}>Pantauan aktivitas siswa hari ini.</p>
        </div>
        
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-full shadow-lg transition-transform hover:scale-110 self-end md:self-auto ${isDarkMode ? "bg-yellow-400 text-yellow-900" : "bg-slate-700 text-white"}`}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>
      
      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 animate-fade-in">
        <div className="bg-linear-to-br from-blue-600 to-indigo-600 p-6 rounded-3xl text-white shadow-xl transform transition hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Hadir Hari Ini</p>
              <h3 className="text-4xl md:text-5xl font-extrabold mt-2">{stats.hadir}</h3>
            </div>
            <div className="text-3xl opacity-50">🎓</div>
          </div>
        </div>

        <div className={`p-6 rounded-3xl border ${theme.card} transform transition hover:-translate-y-1`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${theme.textSec}`}>Total Scan</p>
              <h3 className={`text-4xl md:text-5xl font-extrabold mt-2 ${theme.textMain}`}>{stats.total}</h3>
            </div>
            <div className="text-3xl opacity-50">📷</div>
          </div>
        </div>

        <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-xl transform transition hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Status System</p>
              <h3 className="text-xl md:text-2xl font-bold mt-4">ONLINE 🟢</h3>
            </div>
            <div className="text-3xl opacity-50">⚡</div>
          </div>
        </div>
      </div>

      {/* TABEL AKTIVITAS */}
      <div className={`rounded-3xl border overflow-hidden ${theme.card} animate-fade-in`}>
        <div className={`p-6 border-b ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}>
          <h3 className={`font-bold text-lg ${theme.textMain}`}>⏳ Aktivitas Terakhir</h3>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            {/* Header Tabel: Bersih dari komentar yang memicu error hydration */}
            <thead className={`uppercase font-bold text-xs ${theme.tableHead}`}>
              <tr>
                <th className="p-4 md:p-5">Waktu</th>
                <th className="p-4 md:p-5">Nama Siswa</th>
                <th className="p-4 md:p-5">Kelas</th>
                <th className="p-4 md:p-5">Mapel</th>
                <th className="p-4 md:p-5">Status</th>
              </tr>
            </thead>
            
            {/* Body Tabel: Logic Render Data Dikembalikan */}
            <tbody className={`divide-y ${isDarkMode ? "divide-slate-700" : "divide-slate-100"}`}>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center animate-pulse">Memuat data...</td></tr>
              ) : stats.terbaru.length === 0 ? (
                <tr><td colSpan={5} className={`p-8 text-center italic ${theme.textSec}`}>Belum ada aktivitas hari ini.</td></tr>
              ) : (
                stats.terbaru.map((item, idx) => (
                  <tr key={idx} className={`transition duration-200 ${theme.tableRow}`}>
  <td className="p-4 md:p-5 font-mono text-blue-500 font-bold">{item.waktu}</td>
  <td className={`p-4 md:p-5 font-bold ${theme.textMain}`}>{item.nama}</td>
  <td className="p-4 md:p-5">{item.kelas}</td>
  
  {/* LOGIC TAMPILAN MAPEL */}
  <td className="p-4 md:p-5">
    {item.mapel === "-" ? (
      <span className="text-slate-400 italic font-medium">📥 Check-In (Gerbang)</span>
    ) : (
      <span className="font-bold text-blue-600 dark:text-blue-400">{item.mapel}</span>
    )}
  </td>

  <td className="p-4 md:p-5">
    {/* Badge Status tetap sama */}
    <span className={`px-3 py-1 rounded-full text-xs font-bold border 
      ${item.status === 'Hadir' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
        item.status === 'Alpha' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 
        item.status === 'Sakit' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
        'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
      {item.status}
    </span>
  </td>
</tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}