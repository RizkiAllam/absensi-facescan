import os
import cv2
import numpy as np
import face_recognition
import psycopg2
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = FastAPI()

# --- CONFIG CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE CONNECTION ---
def get_db():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            dbname=os.getenv("DB_NAME")
        )
        return conn
    except Exception as e:
        print(f"❌ DB Error: {e}")
        raise HTTPException(status_code=500, detail="Database Connection Failed")

# --- UTILS ---
def save_temp_file(file: UploadFile) -> str:
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    return file_path

def process_image_robust(image_path):
    image = face_recognition.load_image_file(image_path)
    if image is None: return None
    encodings = face_recognition.face_encodings(image)
    if len(encodings) > 0:
        return encodings[0]
    return None

# ==========================================
# 🚀 ENDPOINTS UTAMA
# ==========================================

@app.get("/")
def read_root():
    return {"message": "Face Recognition Service V3 (DB Timezone Fix) Online 🟢"}

# 1. REGISTER SISWA
@app.post("/register-student")
async def register_student(
    nama: str = Form(...), 
    nis: str = Form(...), 
    kelas: str = Form(...), 
    file: UploadFile = File(...)
):
    file_path = save_temp_file(file)
    encoding = process_image_robust(file_path)
    
    if os.path.exists(file_path): os.remove(file_path)
    
    if encoding is None:
        raise HTTPException(status_code=400, detail="Wajah tidak terdeteksi. Pastikan pencahayaan cukup.")

    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # CEK WAJAH GANDA
        cursor.execute("SELECT nama, face_encoding FROM siswa")
        existing_students = cursor.fetchall()
        
        for student in existing_students:
            db_nama, db_encoding = student
            if db_encoding:
                is_match = face_recognition.compare_faces([np.array(db_encoding)], encoding, tolerance=0.5)[0]
                if is_match:
                    raise HTTPException(status_code=400, detail=f"⛔ GAGAL: Wajah sudah terdaftar a.n '{db_nama}'!")

        cursor.execute(
            "INSERT INTO siswa (nama, nis, kelas, face_encoding) VALUES (%s, %s, %s, %s)", 
            (nama, nis, kelas, encoding.tolist())
        )
        conn.commit()
        return {"status": "success", "message": f"Siswa {nama} berhasil didaftarkan"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="NIS ini sudah terpakai!")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# 2. ABSENSI (SCAN WAJAH) - FIX UTAMA DISINI
@app.post("/attendance-check-in")
async def attendance_check_in(
    file: UploadFile = File(...),
    # UBAH DEFAULT DARI "Umum" JADI "-"
    mata_pelajaran: str = Form("-") 
):
    file_path = save_temp_file(file)
    unknown_encoding = process_image_robust(file_path)
    
    if os.path.exists(file_path): os.remove(file_path)
    if unknown_encoding is None:
        raise HTTPException(status_code=400, detail="Wajah tidak jelas.")

    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, nama, face_encoding FROM siswa")
        students = cursor.fetchall()
        
        found_student = None
        for student in students:
            s_id, s_nama, s_encoding = student
            if s_encoding:
                match = face_recognition.compare_faces([np.array(s_encoding)], unknown_encoding, tolerance=0.5)[0]
                if match:
                    found_student = (s_id, s_nama)
                    break
        
        if found_student:
            student_id, student_name = found_student
            
            # Cek duplikasi absen hari ini (interval 5 menit)
            cursor.execute("""
                SELECT id FROM absensi 
                WHERE siswa_id = %s 
                AND waktu_scan > (LOCALTIMESTAMP - INTERVAL '5 minutes')
            """, (student_id,))
            
            if cursor.fetchone():
                return {"status": "info", "message": f"⏳ {student_name} sudah absen barusan."}

            # Simpan Absen (Mapel "-" artinya Masuk Gerbang)
            cursor.execute("""
                INSERT INTO absensi (siswa_id, mata_pelajaran, waktu_scan, status_kehadiran) 
                VALUES (%s, %s, LOCALTIMESTAMP, 'Hadir')
                RETURNING waktu_scan
            """, (student_id, mata_pelajaran))
            
            saved_time = cursor.fetchone()[0]
            conn.commit()
            
            jam_display = saved_time.strftime("%H:%M")
            
            return {
                "status": "success", 
                "student": {"nama": student_name}, 
                "waktu": jam_display
            }
        else:
            raise HTTPException(status_code=404, detail="Wajah tidak dikenali.")
            
    finally:
        cursor.close()
        conn.close()

# 3. UPDATE MANUAL GURU
@app.post("/update-absen-manual")
def update_absen_manual(
    siswa_id: int = Form(...), 
    status: str = Form(...), 
    tanggal: str = Form(...),
    mapel: str = Form(...)
):
    conn = get_db()
    cursor = conn.cursor()
    
    # Ambil Jam Sekarang
    jam_sekarang = datetime.now().strftime("%H:%M:%S")
    timestamp_lengkap = f"{tanggal} {jam_sekarang}"

    cursor.execute("""
        SELECT id FROM absensi 
        WHERE siswa_id = %s AND DATE(waktu_scan) = %s AND mata_pelajaran = %s
    """, (siswa_id, tanggal, mapel))
    
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute("UPDATE absensi SET status_kehadiran = %s WHERE id = %s", (status, existing[0]))
    else:
        cursor.execute("""
            INSERT INTO absensi (siswa_id, waktu_scan, status_kehadiran, mata_pelajaran) 
            VALUES (%s, %s::timestamp, %s, %s)
        """, (siswa_id, timestamp_lengkap, status, mapel))
        
    conn.commit()
    conn.close()
    return {"status": "success"}

# 4. GURU CHECK DATA
@app.post("/guru-check")
def get_guru_check_data(tanggal: str = Form(...), kelas: str = Form(...), mapel: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, nama, nis FROM siswa WHERE kelas = %s ORDER BY nama ASC", (kelas,))
    students = cursor.fetchall()
    
    result = []
    for s in students:
        s_id, s_nama, s_nis = s
        
        cursor.execute("""
            SELECT status_kehadiran, waktu_scan FROM absensi 
            WHERE siswa_id = %s AND DATE(waktu_scan) = %s AND mata_pelajaran = %s
            ORDER BY id DESC LIMIT 1
        """, (s_id, tanggal, mapel))
        
        absen = cursor.fetchone()
        status = "Belum Absen"
        jam = "-"
        
        if absen:
            status = absen[0]
            if absen[1]:
                jam = absen[1].strftime("%H:%M")
            
        result.append({"id": s_id, "nama": s_nama, "nis": s_nis, "status": status, "jam": jam})
        
    conn.close()
    return {"data": result}

# 5. REKAP & DASHBOARD
@app.post("/rekap-absensi")
def get_rekap_absensi(start: str = Form(...), end: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    query = """
        SELECT 
            TO_CHAR(a.waktu_scan, 'YYYY-MM-DD') as tanggal,
            TO_CHAR(a.waktu_scan, 'HH24:MI') as jam,
            s.nama, s.kelas, a.mata_pelajaran, a.status_kehadiran
        FROM absensi a
        JOIN siswa s ON a.siswa_id = s.id
        WHERE DATE(a.waktu_scan) BETWEEN %s AND %s
        ORDER BY s.kelas ASC, a.mata_pelajaran ASC, a.waktu_scan DESC
    """
    cursor.execute(query, (start, end))
    data = [{"tanggal": r[0], "waktu": r[1], "nama": r[2], "kelas": r[3], "mapel": r[4], "status": r[5]} for r in cursor.fetchall()]
    conn.close()
    return {"data": data}

# 6. MANAJEMEN KELAS
@app.get("/kelas")
def get_all_kelas():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT nama_kelas FROM kelas ORDER BY nama_kelas ASC")
    data = [row[0] for row in cursor.fetchall()]
    conn.close()
    return {"data": data}

@app.post("/kelas")
def add_kelas(nama_kelas: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO kelas (nama_kelas) VALUES (%s)", (nama_kelas,))
        conn.commit()
        return {"status": "success"}
    except:
        return {"status": "error"}
    finally:
        conn.close()