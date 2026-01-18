'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = 'http://127.0.0.1:8000';

interface StudentData {
  id: number;
  nama: string;
  nis: string;
  kelas: string;
  status: string;
  waktu: string;
}

export default function DashboardPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('12 RPL');
  const [selectedMapel, setSelectedMapel] = useState('Matematika');

  const classOptions = ['12 RPL', '12 TKJ', '11 RPL', '10 TKJ'];
  const mapelOptions = ['Matematika', 'Bahasa Inggris', 'Pemrograman Web', 'Jaringan Dasar'];

  const fetchClassData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/class-attendance`, {
        params: { kelas: selectedClass, mapel: selectedMapel }
      });
      setStudents(res.data.data);
    } catch (error) {
      console.error("Gagal ambil data kelas:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedMapel]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      setStudents(prev => prev.map(s => 
        s.id === id ? { ...s, status: newStatus, waktu: newStatus === 'Hadir' ? 'Manual' : '-' } : s
      ));
      await axios.post(`${API_URL}/update-status`, {
        siswa_id: id,
        status: newStatus,
        mata_pelajaran: selectedMapel
      });
    } catch (error) {
        console.error("Gagal update:", error);
        alert("Gagal update status.");
        fetchClassData();
    }
  };

  const handleDownloadExcel = () => {
    const dataToExport = students.map(s => ({
      "NIS": s.nis, "Nama Siswa": s.nama, "Kelas": s.kelas, "Mapel": selectedMapel, "Status": s.status, "Waktu": s.waktu
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");
    XLSX.writeFile(workbook, `Absensi_${selectedClass}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER & FILTER (Responsive) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800">🏫 Jurnal Guru Digital</h1>
              <p className="text-slate-500 text-xs sm:text-sm">Monitoring & Absensi Manual Per Kelas.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Kelas</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full sm:w-32 p-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  {classOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Mata Pelajaran</label>
                <select 
                  value={selectedMapel}
                  onChange={(e) => setSelectedMapel(e.target.value)}
                  className="w-full sm:w-56 p-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  {mapelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TABEL AREA (Responsive Scroll) */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="font-bold text-slate-700 text-sm sm:text-base">Daftar Siswa: <span className="text-blue-600">{selectedClass}</span></h2>
            <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={handleDownloadExcel} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-md">
                  📥 Excel
                </button>
                <button onClick={fetchClassData} className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100">
                  🔄 Refresh
                </button>
            </div>
          </div>

          {/* TABEL DATA (Fully Responsive) */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-162.5">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                  <th className="p-4 border-b text-center w-20">NIS</th>
                  <th className="p-4 border-b">Nama Siswa</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b text-center">Aksi Guru (Cross Check)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium">
                {loading ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400 animate-pulse">Memuat data kelas...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400">Belum ada data siswa di kelas ini.</td></tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-500 font-mono text-[10px] sm:text-xs text-center">{student.nis}</td>
                      <td className="p-4 font-bold text-slate-800">{student.nama}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-tighter
                          ${student.status === 'Hadir' ? 'bg-green-100 text-green-700 border-green-200' : 
                            student.status === 'Bolos' ? 'bg-red-100 text-red-700 border-red-200' :
                            student.status === 'Izin' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                          {student.status}
                        </span>
                        {student.status === 'Hadir' && <span className="ml-2 text-[10px] text-slate-400 font-mono">({student.waktu})</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          {/* TOMBOL HADIR ✅ */}
                          <button 
                            onClick={() => handleUpdateStatus(student.id, 'Hadir')} 
                            title="Hadir Manual"
                            className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition shadow-sm active:scale-90 border border-green-200"
                          >
                            ✅
                          </button>
                          
                          {/* TOMBOL IZIN/SAKIT ⚠️ (KEMBALI DIPASANG) */}
                          <button 
                            onClick={() => handleUpdateStatus(student.id, 'Izin')} 
                            title="Izin / Sakit"
                            className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-500 hover:text-white transition shadow-sm active:scale-90 border border-yellow-200"
                          >
                            ⚠️
                          </button>

                          {/* TOMBOL BOLOS ❌ */}
                          <button 
                            onClick={() => handleUpdateStatus(student.id, 'Bolos')} 
                            title="Tandai Bolos"
                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm active:scale-90 border border-red-200"
                          >
                            ❌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden p-3 bg-blue-50 text-[10px] text-center font-bold text-blue-400 italic">
            💡 Geser ke samping untuk melihat aksi guru
          </div>
        </div>
      </div>
    </div>
  );
}