import psycopg2
import os
from dotenv import load_dotenv

# 1. Inisialisasi Environment Variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS") 
DB_PORT = os.getenv("DB_PORT")

def upgrade_database():
    """
    Melakukan patching pada database yang sudah ada tanpa menghapus data siswa
    """
    conn = None
    try:
        print(f"🔌 Menghubungkan ke '{DB_NAME}' untuk proses upgrade...")
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        cursor = conn.cursor()
        
        # 1. Menambahkan kolom 'mata_pelajaran' ke tabel harian
        print("🔨 Memastikan kolom 'mata_pelajaran' tersedia di tabel harian...")
        cursor.execute("ALTER TABLE absensi ADD COLUMN IF NOT EXISTS mata_pelajaran VARCHAR(100);")
        
        # 2. Membuat tabel Histori untuk Rekap (Penyebab Error 500 jika tidak ada)
        print("🔨 Sinkronisasi tabel 'attendance_history' untuk fitur rekap...")
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
        
        conn.commit()
        cursor.close()
        print("✅ UPGRADE BERHASIL! Database sekarang support multi-mapel dan rekap.")
        
    except Exception as e:
        print(f"❌ Gagal melakukan upgrade database: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    upgrade_database()