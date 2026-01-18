import psycopg2
import os
from dotenv import load_dotenv
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# 1. Inisialisasi Environment Variables dari file .env
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS") 
DB_PORT = os.getenv("DB_PORT")
TARGET_DB = DB_NAME 

def create_database():
    """
    Menghubungkan ke system database 'postgres' untuk membuat database project
    """
    conn = None
    try:
        print(f"🔌 Menghubungkan ke System Database @{DB_HOST}...")
        conn = psycopg2.connect(
            dbname="postgres", 
            user=DB_USER, 
            password=DB_PASS, 
            host=DB_HOST, 
            port=DB_PORT
        )
        # Operasi CREATE DATABASE memerlukan autocommit aktif
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Cek apakah database target sudah ada
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{TARGET_DB}';")
        exists = cursor.fetchone()

        if not exists:
            print(f"🔨 Database '{TARGET_DB}' belum ada. Membuat baru...")
            cursor.execute(f"CREATE DATABASE {TARGET_DB};")
            print(f"✅ Database '{TARGET_DB}' BERHASIL DIBUAT!")
        else:
            print(f"ℹ️ Database '{TARGET_DB}' sudah ada. Lanjut ke setup tabel...")

        cursor.close()
    except Exception as e:
        print(f"❌ Gagal membuat database: {e}")
    finally:
        if conn:
            conn.close()

def create_tables():
    """
    Membangun struktur tabel lengkap di dalam database target
    """
    conn = None
    try:
        print(f"🔌 Menghubungkan ke '{TARGET_DB}' untuk setup tabel...")
        conn = psycopg2.connect(
            dbname=TARGET_DB, 
            user=DB_USER, 
            password=DB_PASS, 
            host=DB_HOST, 
            port=DB_PORT
        )
        cursor = conn.cursor()

        # 1. Tabel SISWA (Penyimpanan data profil dan encoding wajah)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS siswa (
                id SERIAL PRIMARY KEY,
                nama VARCHAR(100) NOT NULL,
                nis VARCHAR(50) UNIQUE NOT NULL,
                kelas VARCHAR(50),
                face_encoding FLOAT8[]
            );
        """)
        print("✅ Tabel 'siswa' Siap.")

        # 2. Tabel ABSENSI (Data kehadiran harian/real-time)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS absensi (
                id SERIAL PRIMARY KEY,
                siswa_id INTEGER REFERENCES siswa(id) ON DELETE CASCADE,
                mata_pelajaran VARCHAR(100),
                waktu_scan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status_kehadiran VARCHAR(50)
            );
        """)
        print("✅ Tabel 'absensi' Siap.")

        # 3. Tabel ATTENDANCE_HISTORY (Penyimpanan permanen untuk fitur REKAP)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attendance_history (
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
        print("✅ Tabel 'attendance_history' Siap.")
        
        conn.commit()
        cursor.close()
        print("🎉 SETUP DATABASE SELESAI SEMPURNA!")

    except Exception as e:
        print(f"❌ Gagal membuat tabel: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_database() 
    create_tables()