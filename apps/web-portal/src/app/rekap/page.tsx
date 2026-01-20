"use client";
import { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function RekapPage() {
  const [dates, setDates] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCari = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("start", dates.start);
      formData.append("end", dates.end);

      const res = await axios.post(`${API_BASE_URL}/rekap-absensi`, formData);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data rekap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">🗓️ Rekap Absensi</h1>
          <p className="text-slate-400 text-sm">Laporan kehadiran siswa per periode</p>
        </div>
        
        {/* FILTER TANGGAL */}
        <div className="flex gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <input 
            type="date" 
            className="bg-slate-700 text-white p-2 rounded-lg outline-none border border-slate-600 focus:border-blue-500"
            value={dates.start}
            onChange={(e) => setDates({...dates, start: e.target.value})}
          />
          <span className="text-white self-center">-</span>
          <input 
            type="date" 
            className="bg-slate-700 text-white p-2 rounded-lg outline-none border border-slate-600 focus:border-blue-500"
            value={dates.end}
            onChange={(e) => setDates({...dates, end: e.target.value})}
          />
          <button 
            onClick={handleCari}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition disabled:opacity-50"
          >
            {loading ? "..." : "CARI"}
          </button>
        </div>
      </div>

      {/* TABEL HASIL */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 uppercase font-bold text-slate-500 text-xs border-b border-slate-200">
              <tr>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Jam</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">Mata Pelajaran</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    {loading ? "Sedang memuat data..." : "Tidak ada data pada tanggal yang dipilih."}
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.map((item: any, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono">{item.tanggal}</td>
                    <td className="p-4 font-mono text-blue-600 font-bold">{item.waktu}</td>
                    <td className="p-4 font-bold text-slate-800">{item.nama}</td>
                    <td className="p-4">{item.kelas}</td>
                    <td className="p-4">{item.mapel}</td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
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