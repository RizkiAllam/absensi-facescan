import psycopg2

try:
    # ⚠️ PENTING: Ganti 'admin123' dengan password yang tadi Anda buat!
    conn = psycopg2.connect(
        host="localhost",
        database="absensi_sekolah",
        user="postgres",
        password="admin123" 
    )
    print("✅ SUKSES: Pintu Database Terbuka!")
    conn.close()
except Exception as e:
    print("❌ GAGAL: ", e)