import psycopg2
import os
from dotenv import load_dotenv
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

load_dotenv()

# Konfigurasi
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

def reset_and_setup():
    print(f"🔥 MEMULAI RESET TOTAL DATABASE: {DB_NAME}...")
    try:
        # 1. KONEKSI KE SYSTEM POSTGRES (Untuk hapus/buat DB)
        conn = psycopg2.connect(dbname="postgres", user=DB_USER, password=DB_PASS, host=DB_HOST)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # 2. PUTUSKAN KONEKSI LAMA
        cursor.execute(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{DB_NAME}' AND pid <> pg_backend_pid();
        """)
        
        # 3. HAPUS & BUAT DB BARU
        cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME};")
        print("🗑️  Database lama dihapus.")
        cursor.execute(f"CREATE DATABASE {DB_NAME};")
        print("🏗️  Database baru dibuat.")
        
        cursor.close()
        conn.close()
        
        # 4. BUAT TABEL (Koneksi ke DB Baru)
        conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST)
        cursor = conn.cursor()
        
        # Tabel SISWA
        cursor.execute("""
            CREATE TABLE siswa (
                id SERIAL PRIMARY KEY,
                nama VARCHAR(100) NOT NULL,
                nis VARCHAR(50) UNIQUE NOT NULL,
                kelas VARCHAR(50),
                face_encoding FLOAT8[]
            );
        """)
        
        # Tabel ABSENSI
        cursor.execute("""
            CREATE TABLE absensi (
                id SERIAL PRIMARY KEY,
                siswa_id INTEGER REFERENCES siswa(id) ON DELETE CASCADE,
                mata_pelajaran VARCHAR(100) DEFAULT 'Umum',
                waktu_scan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status_kehadiran VARCHAR(50)
            );
        """)
        
        # Tabel HISTORY
        cursor.execute("""
            CREATE TABLE attendance_history (
                id SERIAL PRIMARY KEY,
                siswa_id INTEGER REFERENCES siswa(id),
                kelas VARCHAR(50),
                mata_pelajaran VARCHAR(100),
                status VARCHAR(20),
                tanggal DATE DEFAULT CURRENT_DATE,
                waktu_absen TIME DEFAULT CURRENT_TIME,
                UNIQUE(siswa_id, mata_pelajaran, tanggal)
            );
        """)
        
        conn.commit()
        conn.close()
        print("✅ SETUP SELESAI: Tabel Siswa, Absensi, & History siap!")
        
    except Exception as e:
        print(f"❌ ERROR FATAL: {e}")
        print("💡 Cek password di .env!")

if __name__ == "__main__":
    reset_and_setup()