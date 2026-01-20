"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios, { AxiosError } from "axios";
import { useTheme } from "./ThemeContext";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [mode, setMode] = useState<"ABSEN" | "DAFTAR">("ABSEN");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // State Form Pendaftaran
  const [form, setForm] = useState({ nama: "", nis: "", kelas: "" });
  const [kelasOptions, setKelasOptions] = useState<string[]>([]); // Untuk Dropdown Kelas

  const { isDarkMode, toggleTheme } = useTheme(); 

  // --- 1. FETCH KELAS DARI DB (AGAR DROPDOWN MUNCUL) ---
  useEffect(() => {
    const fetchKelas = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/kelas`);
        setKelasOptions(res.data.data);
      } catch (err) { console.error(err); }
    };
    fetchKelas();
  }, []);

  // --- LOGIC SYSTEM ---
  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmit = useCallback(async () => {
    setMsg(null);
    const imageSrc = webcamRef.current?.getScreenshot();
    
    if (!imageSrc) {
      setMsg({ type: "error", text: "❌ Kamera belum siap/gelap!" });
      return;
    }

    setLoading(true);
    try {
      const file = dataURLtoFile(imageSrc, "capture.jpg");
      const formData = new FormData();
      formData.append("file", file);

      let url = "";
      if (mode === "ABSEN") {
        url = "/attendance-check-in";
        formData.append("mata_pelajaran", "-"); 
      } else {
        if (!form.nama || !form.nis || !form.kelas) throw new Error("Mohon isi semua data siswa.");
        url = "/register-student";
        formData.append("nama", form.nama);
        formData.append("nis", form.nis);
        formData.append("kelas", form.kelas);
      }

      const res = await axios.post(`${API_BASE_URL}${url}`, formData);

      // --- PERBAIKAN UTAMA DISINI (ERROR HANDLING) ---
      if (res.data.status === "info") {
        // Jika Backend bilang "Sudah absen barusan"
        setMsg({ type: "error", text: res.data.message }); // Tampilkan sebagai alert merah/kuning
      } else if (mode === "ABSEN") {
        // Jika Sukses Absen
        const namaSiswa = res.data.student?.nama || "Siswa"; // Safety check
        setMsg({ type: "success", text: `✅ Hallo ${namaSiswa}! Absen Sukses.` });
      } else {
        // Jika Sukses Daftar
        setMsg({ type: "success", text: "🎉 Pendaftaran Siswa Berhasil!" });
        setForm({ nama: "", nis: "", kelas: "" });
      }

    } catch (err: unknown) {
      console.error(err);
      let detail = "Terjadi kesalahan sistem.";
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<{ detail: string }>;
        detail = error.response?.data?.detail || error.message;
      } else if (err instanceof Error) {
        detail = err.message;
      }
      setMsg({ type: "error", text: `⛔ ${detail}` });
    } finally {
      setLoading(false);
    }
  }, [webcamRef, mode, form]);

  // --- THEME ---
  const theme = {
    card: isDarkMode ? "bg-slate-800 border-slate-700 shadow-none" : "bg-white border-slate-200 shadow-2xl",
    textMain: isDarkMode ? "text-white" : "text-slate-800",
    textSec: isDarkMode ? "text-slate-400" : "text-slate-500",
    input: isDarkMode ? "bg-slate-900 border-slate-600 text-white placeholder-slate-500" : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400",
  };

  return (
    <div className={`transition-colors duration-500 font-sans w-full max-w-[100vw] overflow-x-hidden`}>
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-6 md:mb-8 animate-fade-in px-2">
        <div>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>
            Absensi<span className="text-blue-500">Wajah</span>
          </h1>
          <p className={`text-xs md:text-sm ${theme.textSec}`}>Sistem Cerdas V3.0</p>
        </div>
        
        <button 
          onClick={toggleTheme} 
          className={`p-2 md:p-3 rounded-full shadow-lg transition-transform hover:scale-110 ${isDarkMode ? "bg-yellow-400 text-yellow-900" : "bg-slate-700 text-white"}`}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>

      {/* MAIN CARD */}
      <div className={`max-w-6xl mx-auto rounded-3xl overflow-hidden border ${theme.card} flex flex-col lg:flex-row transition-all duration-500`}>
        
        {/* AREA KAMERA */}
        <div className="w-full lg:w-1/2 p-4 md:p-8 bg-black relative flex flex-col justify-center items-center">
          <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl group">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <div className="absolute inset-0 border-2 border-dashed border-white/30 m-4 rounded-xl pointer-events-none"></div>
            <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded animate-pulse">
              LIVE REC ●
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-4 text-center">Pastikan wajah terlihat jelas & pencahayaan cukup.</p>
        </div>

        {/* AREA KONTROL */}
        <div className={`w-full lg:w-1/2 p-6 md:p-10 flex flex-col justify-center ${isDarkMode ? "bg-slate-800" : "bg-white"}`}>
          
          <div className={`flex p-1 rounded-xl mb-6 md:mb-8 ${isDarkMode ? "bg-slate-900" : "bg-slate-100"}`}>
            {(["ABSEN", "DAFTAR"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setMsg(null); }}
                className={`flex-1 py-2 md:py-3 rounded-lg font-bold text-xs md:text-sm transition-all duration-300
                  ${mode === m 
                    ? "bg-blue-600 text-white shadow-md transform scale-100" 
                    : `${theme.textSec} hover:text-blue-500`}
                `}
              >
                {m === "ABSEN" ? "📷 SCAN ABSEN" : "📝 DAFTAR"}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4 md:space-y-5 animate-fade-in">
            {mode === "ABSEN" ? (
              <div className="text-center py-4">
                <div className="text-5xl md:text-6xl mb-4">🙂</div>
                <h3 className={`text-lg md:text-xl font-bold ${theme.textMain}`}>Siap untuk Absen?</h3>
                <p className={`text-sm ${theme.textSec}`}>Hadapkan wajah ke kamera lalu tekan tombol di bawah.</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1">
                  <label className={`text-[10px] md:text-xs font-bold ml-1 ${theme.textSec}`}>NAMA LENGKAP</label>
                  <input 
                    className={`w-full p-3 md:p-4 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${theme.input}`}
                    placeholder="Contoh: Rizki"
                    value={form.nama}
                    onChange={(e) => setForm({...form, nama: e.target.value})}
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <div className="w-full md:w-1/2 space-y-1">
                    <label className={`text-[10px] md:text-xs font-bold ml-1 ${theme.textSec}`}>NIS</label>
                    <input 
                      className={`w-full p-3 md:p-4 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${theme.input}`}
                      placeholder="001"
                      value={form.nis}
                      onChange={(e) => setForm({...form, nis: e.target.value})}
                    />
                  </div>
                  <div className="w-full md:w-1/2 space-y-1">
                    <label className={`text-[10px] md:text-xs font-bold ml-1 ${theme.textSec}`}>KELAS</label>
                    
                    {/* DROPDOWN KELAS (DARI DB) */}
                    <select 
                      className={`w-full p-3 md:p-4 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none ${theme.input}`}
                      value={form.kelas}
                      onChange={(e) => setForm({...form, kelas: e.target.value})}
                    >
                      <option value="">Pilih Kelas</option>
                      {kelasOptions.map((k, idx) => (
                        <option key={idx} value={k} className="text-black">{k}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 md:py-4 mt-2 rounded-xl font-bold text-sm md:text-lg text-white shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex justify-center items-center gap-2
                ${loading 
                  ? "bg-slate-500 cursor-not-allowed" 
                  : mode === "ABSEN" 
                    ? "bg-linear-to-r from-blue-600 to-indigo-600" 
                    : "bg-linear-to-r from-emerald-600 to-teal-600"}
              `}
            >
              {loading ? "⏳ Memproses..." : mode === "ABSEN" ? "📸 TEMBAK ABSEN" : "💾 SIMPAN DATA"}
            </button>

            {msg && (
              <div className={`mt-4 p-3 md:p-4 rounded-xl border flex items-center gap-3 animate-fade-in
                ${msg.type === "success" 
                  ? "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400" 
                  : "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400"}
              `}>
                <span className="text-lg md:text-xl">{msg.type === "success" ? "✅" : "🚨"}</span>
                <span className="font-bold text-xs md:text-sm break-words">{msg.text}</span>
              </div>
            )}
            
          </div>
        </div>
      </div>
      
      <div className={`text-center mt-8 text-[10px] md:text-xs ${theme.textSec}`}>
        &copy; 2026 Face Recognition System by Rizki
      </div>
    </div>
  );
}