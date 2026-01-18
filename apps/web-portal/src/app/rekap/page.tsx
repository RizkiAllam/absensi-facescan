'use client';

import { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = 'http://127.0.0.1:8000';

// 1. Definisikan Interface agar tidak pakai 'any'
interface RekapData {
  tanggal: string;
  nis: string;
  nama: string;
  kelas: string;
  mapel: string;
  status: string;
  waktu: string;
}

export default function RekapPage() {
  const [data, setData] = useState<RekapData[]>([]); // 2. Gunakan Interface di sini
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    kelas: '',
    mata_pelajaran: ''
  });

  const handleFetchRekap = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/rekap-absensi`, filters);
      setData(res.data.data);
    } catch (error) {
      console.error("Gagal ambil rekap:", error);
      alert("Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Keseluruhan");
    XLSX.writeFile(workbook, `Rekap_Absensi_${filters.start_date}_sd_${filters.end_date}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black mb-6">🗓️ Rekap Histori Database</h1>

        {/* PANEL FILTER */}
        <div className="bg-white p-6 rounded-2xl shadow-md mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-500">DARI TANGGAL</label>
            <input type="date" className="w-full p-2 border rounded outline-blue-500" 
              value={filters.start_date} onChange={(e) => setFilters({...filters, start_date: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-500">SAMPAI TANGGAL</label>
            <input type="date" className="w-full p-2 border rounded outline-blue-500" 
              value={filters.end_date} onChange={(e) => setFilters({...filters, end_date: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-500">KELAS (OPSIONAL)</label>
            <input type="text" placeholder="Semua" className="w-full p-2 border rounded outline-blue-500" 
              value={filters.kelas} onChange={(e) => setFilters({...filters, kelas: e.target.value})} />
          </div>
          <button 
            onClick={handleFetchRekap} 
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:bg-slate-400 transition"
          >
            {loading ? "⏳ MENCARI..." : "🔎 CARI DATA"}
          </button>
        </div>

        {/* TABEL HASIL */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <span className="font-bold text-slate-700">Ditemukan: {data.length} Baris Data</span>
            <button 
                onClick={downloadExcel} 
                disabled={data.length === 0 || loading} 
                className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-bold disabled:bg-slate-300 transition hover:bg-green-700 shadow-sm"
            >
              📥 EXPORT EXCEL
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                <tr>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Nama Siswa</th>
                    <th className="p-4">Mata Pelajaran</th>
                    <th className="p-4">Status</th>
                </tr>
                </thead>
                <tbody className="divide-y text-sm">
                {loading ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold">Sedang memproses data...</td></tr>
                ) : data.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">Tidak ada data ditemukan untuk filter ini.</td></tr>
                ) : (
                    data.map((item, i) => ( // 3. 'item' sekarang otomatis bertipe RekapData
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono text-slate-500">{item.tanggal}</td>
                        <td className="p-4 font-bold text-slate-800">{item.nama}</td>
                        <td className="p-4 text-slate-600">{item.mapel}</td>
                        <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                item.status === 'Hadir' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-red-100 text-red-700 border-red-200'
                            }`}>
                            {item.status.toUpperCase()}
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
    </div>
  );
}