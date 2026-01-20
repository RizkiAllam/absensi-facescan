"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, hadir: 0, terbaru: [] });
  const [loading, setLoading] = useState(true);

  // Ambil data hari ini saat halaman dibuka
  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        
        // Kita pakai endpoint rekap, tapi filter khusus hari ini
        const formData = new FormData();
        formData.append("start", today);
        formData.append("end", today);

        const res = await axios.post(`${API_BASE_URL}/rekap-absensi`, formData);
        const data = res.data.data; // Array data absensi

        setStats({
          total: data.length, // Total yang absen hari ini
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hadir: data.filter((item: any) => item.status === "Hadir").length,
          terbaru: data.slice(0, 5) // Ambil 5 orang terakhir
        });
      } catch (err) {
        console.error("Gagal ambil data dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white">📊 Dashboard Guru</h1>
      
      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <p className="text-sm opacity-80 font-bold">SISWA HADIR HARI INI</p>
          <h3 className="text-4xl font-bold mt-2">{stats.hadir}</h3>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl text-white border border-slate-700">
          <p className="text-sm opacity-80 font-bold">TOTAL AKTIVITAS SCAN</p>
          <h3 className="text-4xl font-bold mt-2">{stats.total}</h3>
        </div>
        <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg">
          <p className="text-sm opacity-80 font-bold">STATUS SYSTEM</p>
          <h3 className="text-4xl font-bold mt-2">ONLINE 🟢</h3>
        </div>
      </div>

      {/* TABEL AKTIVITAS TERBARU */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="font-bold text-lg text-white">⏳ Aktivitas Absen Terakhir</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 uppercase font-bold text-xs">
              <tr>
                <th className="p-4">Waktu</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">Mapel</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center">Memuat data...</td></tr>
              ) : stats.terbaru.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500">Belum ada absen hari ini.</td></tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                stats.terbaru.map((item: any, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/50 transition">
                    <td className="p-4 font-mono text-blue-400">{item.waktu}</td>
                    <td className="p-4 font-bold text-white">{item.nama}</td>
                    <td className="p-4">{item.kelas}</td>
                    <td className="p-4">{item.mapel}</td>
                    <td className="p-4"><span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">{item.status}</span></td>
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