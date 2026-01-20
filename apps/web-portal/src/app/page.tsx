"use client";
import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [mode, setMode] = useState<"ABSEN" | "DAFTAR">("ABSEN");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({ nama: "", nis: "", kelas: "" });

  // Konversi Gambar ke File
  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmit = useCallback(async () => {
    setMsg(null);
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return setMsg({ type: "error", text: "Kamera gelap/mati!" });

    setLoading(true);
    try {
      const file = dataURLtoFile(imageSrc, "capture.jpg");
      const formData = new FormData();
      formData.append("file", file);

      let url = "";
      if (mode === "ABSEN") {
        url = "/attendance-check-in";
        formData.append("mata_pelajaran", "Umum");
      } else {
        if (!form.nama || !form.nis || !form.kelas) throw new Error("Isi semua data!");
        url = "/register-student";
        formData.append("nama", form.nama);
        formData.append("nis", form.nis);
        formData.append("kelas", form.kelas);
      }

      // Kirim tanpa header manual (Biar Axios yang atur boundary)
      const res = await axios.post(`${API_BASE_URL}${url}`, formData);

      if (mode === "ABSEN") {
        setMsg({ type: "success", text: `✅ Hallo ${res.data.student.nama}! Absen Masuk.` });
      } else {
        setMsg({ type: "success", text: "🎉 Pendaftaran Berhasil!" });
        setForm({ nama: "", nis: "", kelas: "" });
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message;
      setMsg({ type: "error", text: `❌ ${detail}` });
    } finally {
      setLoading(false);
    }
  }, [webcamRef, mode, form]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-8 w-full max-w-5xl border border-slate-700">
        
        {/* KAMERA */}
        <div className="w-full md:w-1/2 relative group">
          <div className="rounded-2xl overflow-hidden border-4 border-slate-600 shadow-inner bg-black">
            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-auto" />
          </div>
          <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-2xl m-1 pointer-events-none"></div>
        </div>

        {/* KONTROL */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Sistem Absensi Wajah</h2>
            <p className="text-slate-400 text-sm">Versi 3.0 Stable Build</p>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl">
            {["ABSEN", "DAFTAR"].map((m) => (
              <button
                key={m}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => { setMode(m as any); setMsg(null); }}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${mode === m ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
              >
                {m === "ABSEN" ? "📷 SCAN WAJAH" : "📝 DAFTAR BARU"}
              </button>
            ))}
          </div>

          {mode === "DAFTAR" && (
            <div className="space-y-3 animate-fade-in">
              <input 
                className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                placeholder="Nama Lengkap" 
                value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} 
              />
              <div className="flex gap-3">
                <input 
                  className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  placeholder="NIS" 
                  value={form.nis} onChange={(e) => setForm({...form, nis: e.target.value})} 
                />
                <input 
                  className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  placeholder="Kelas" 
                  value={form.kelas} onChange={(e) => setForm({...form, kelas: e.target.value})} 
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2
              ${loading ? "bg-slate-600 cursor-not-allowed" : mode === "ABSEN" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"}
            `}
          >
            {loading ? "⏳ Memproses..." : mode === "ABSEN" ? "📸 TEMBAK ABSEN" : "💾 SIMPAN DATA"}
          </button>

          {msg && (
            <div className={`p-4 rounded-xl text-center font-bold text-sm border ${msg.type === "success" ? "bg-emerald-900/30 border-emerald-500 text-emerald-400" : "bg-red-900/30 border-red-500 text-red-400"}`}>
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}