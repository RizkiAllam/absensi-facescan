"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import axios from 'axios'; // 👈 1. UPDATE IMPORT INI

// --- KONFIGURASI ---
const API_BASE_URL = "http://127.0.0.1:8000";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [mode, setMode] = useState<"ABSEN" | "DAFTAR">("ABSEN");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    nis: "",
    kelas: "",
  });

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmit = useCallback(async () => {
    setMessage(null);

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setMessage({
        type: "error",
        text: "Gagal mengambil foto. Pastikan kamera nyala!",
      });
      return;
    }

    setLoading(true);

    try {
      const file = dataURLtoFile(imageSrc, "face_capture.jpg");
      const payload = new FormData();
      payload.append("file", file);

      let endpoint = "";

      if (mode === "ABSEN") {
        endpoint = "/attendance-check-in";
      } else {
        if (!formData.nama || !formData.nis || !formData.kelas) {
          throw new Error("Semua kolom (Nama, NIS, Kelas) wajib diisi!");
        }
        endpoint = "/register-student";
        payload.append("nama", formData.nama);
        payload.append("nis", formData.nis);
        payload.append("kelas", formData.kelas);
      }

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (mode === "ABSEN") {
        setMessage({
          type: "success",
          text: `✅ Hallo ${response.data.student.nama}! Absensi berhasil.`,
        });
      } else {
        setMessage({ type: "success", text: "🎉 Siswa berhasil didaftarkan!" });
        setFormData({ nama: "", nis: "", kelas: "" });
      }
    } catch (error) {
      // 👈 2. JANGAN PAKAI ': any' DI SINI
      console.error("Error:", error);
      let errorMsg = "Terjadi kesalahan sistem.";

      // Teknik "Type Guard" (Cara Pro menangani Error)
      if (axios.isAxiosError(error)) {
        // Jika error dari Backend (400, 404, 500)
        errorMsg = error.response?.data?.detail || error.message;
      } else if (error instanceof Error) {
        // Jika error validasi frontend (misal form kosong)
        errorMsg = error.message;
      }

      setMessage({ type: "error", text: `❌ ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  }, [webcamRef, mode, formData]);

  // ... (Bagian return / JSX di bawah tidak ada yang berubah, tetap sama)
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
        🏢 Face Recognition System
      </h1>
      <p className="text-slate-400 mb-8 text-center">
        Sistem Absensi Sekolah Berbasis AI
      </p>

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 bg-black relative flex items-center justify-center p-4">
          <div className="relative rounded-xl overflow-hidden border-4 border-slate-800 shadow-lg">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 border-2 border-dashed border-white/50 m-8 rounded-lg pointer-events-none opacity-50"></div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-slate-50">
          <div className="flex bg-slate-200 p-1 rounded-lg mb-6">
            <button
              onClick={() => {
                setMode("ABSEN");
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === "ABSEN" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              📷 SCAN ABSEN
            </button>
            <button
              onClick={() => {
                setMode("DAFTAR");
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === "DAFTAR" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              📝 DAFTAR BARU
            </button>
          </div>

          {mode === "DAFTAR" && (
            <div className="space-y-3 mb-6 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                  placeholder="Contoh: Rizki Allam"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    NIS
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                    placeholder="123456"
                    value={formData.nis}
                    onChange={(e) =>
                      setFormData({ ...formData, nis: e.target.value })
                    }
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                    placeholder="12 RPL"
                    value={formData.kelas}
                    onChange={(e) =>
                      setFormData({ ...formData, kelas: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                ℹ️ Pastikan wajah siswa terlihat jelas di kamera sebelum
                mendaftar.
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-transform transform active:scale-95 flex justify-center items-center gap-2
              ${loading ? "bg-slate-400 cursor-not-allowed" : mode === "ABSEN" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
            `}
          >
            {loading ? (
              <span>⏳ Memproses...</span>
            ) : mode === "ABSEN" ? (
              <>📸 AMBIL ABSEN</>
            ) : (
              <>💾 SIMPAN DATA</>
            )}
          </button>

          {message && (
            <div
              className={`mt-6 p-4 rounded-lg text-sm font-medium animate-bounce-in ${message.type === "success" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <a
              href="/dashboard"
              className="text-slate-400 hover:text-blue-600 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              📊 Lihat Dashboard Guru &rarr;
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
