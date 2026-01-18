# 🏫 Smart Attendance System (Face Recognition)

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</p>

Sistem Absensi Sekolah modern yang mengintegrasikan kecerdasan buatan (**Face Recognition**) untuk otomatisasi presensi siswa dan dashboard manajemen berbasis web untuk tenaga pengajar.

## 🌟 Fitur Utama

- **🛡️ High Accuracy Face Recognition**: Identifikasi identitas siswa secara real-time menggunakan pustaka OpenCV dan Dlib.
- **📊 Interactive Teacher Dashboard**: Panel khusus guru untuk memantau kehadiran dan mengubah status secara manual (Hadir, Izin, Sakit, Bolos).
- **📚 Multi-Subject System**: Pencatatan log kehadiran yang terpisah dan terorganisir per mata pelajaran.
- **🕒 Attendance History**: Rekapitulasi data otomatis untuk memudahkan pelaporan bulanan atau semester.

## 🛠️ Arsitektur Teknologi

### **Backend (Face Service)**
- **Language**: Python 3.x
- **Framework**: FastAPI
- **Database**: PostgreSQL with Psycopg2
- **AI Libraries**: OpenCV, Face Recognition, NumPy

### **Frontend (Web Portal)**
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Shadcn UI
- **State Management**: React Hooks & Axios

---

## ⚙️ Panduan Instalasi

### 1. Database Setup
Pastikan PostgreSQL sudah terinstall. Konfigurasikan file `.env` di folder `apps/face-service/`:
```env
DB_HOST=127.0.0.1
DB_NAME=face_attendance_db
DB_USER=postgres
DB_PASS=your_password
DB_PORT=5432
