import os
import shutil
import logging
import psycopg2
import face_recognition
import numpy as np
import uuid
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# Setup Logging & Env
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

# Setup Folder Upload
UPLOAD_DIR = "temp_uploads"
if os.path.exists(UPLOAD_DIR): shutil.rmtree(UPLOAD_DIR) # Bersihkan sisa lama
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Konfigurasi DB
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS")
}

app = FastAPI(title="Face Attendance V3")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FUNGSI PROSES GAMBAR (SOLUSI ERROR 8BIT/RGB) ---
def process_image_robust(file_path: str):
    try:
        # Buka gambar dengan Pillow
        pil_image = Image.open(file_path)
        
        # Paksa konversi ke RGB (Mencegah error RGBA/Grayscale)
        pil_image = pil_image.convert("RGB")
        
        # Ubah ke Numpy Array
        image_array = np.array(pil_image)
        
        # Deteksi Wajah
        face_locations = face_recognition.face_locations(image_array)
        if not face_locations:
            return None
            
        # Encoding
        encodings = face_recognition.face_encodings(image_array, face_locations)
        return encodings[0]
    except Exception as e:
        logger.error(f"Gagal memproses gambar: {e}")
        return None

def save_temp_file(upload_file: UploadFile) -> str:
    filename = f"{uuid.uuid4()}.jpg"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return path

def get_db():
    return psycopg2.connect(**DB_CONFIG)

# --- ENDPOINTS ---
@app.get("/")
def root():
    return {"status": "ONLINE", "version": "3.0 Stable"}

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
        # --- LOGIKA BARU: CEK WAJAH GANDA ---
        # Ambil semua wajah yang ada di database
        cursor.execute("SELECT nama, face_encoding FROM siswa")
        existing_students = cursor.fetchall()
        
        for student in existing_students:
            db_nama, db_encoding = student
            # Bandingkan wajah baru dengan wajah di database
            # Jika mirip (jarak < 0.5), tolak pendaftaran!
            is_match = face_recognition.compare_faces([np.array(db_encoding)], encoding, tolerance=0.5)[0]
            
            if is_match:
                raise HTTPException(
                    status_code=400, 
                    detail=f"⛔ GAGAL: Wajah ini sudah terdaftar atas nama '{db_nama}'!"
                )
        # ------------------------------------

        # Jika lolos pengecekan, baru simpan
        cursor.execute(
            "INSERT INTO siswa (nama, nis, kelas, face_encoding) VALUES (%s, %s, %s, %s)", 
            (nama, nis, kelas, encoding.tolist())
        )
        conn.commit()
        return {"status": "success", "message": f"Siswa {nama} berhasil didaftarkan"}
        
    except HTTPException as he:
        raise he # Lempar error validasi wajah ke Frontend
    except Exception as e:
        conn.rollback()
        # Cek error duplikat NIS (Constraint Database)
        if "unique constraint" in str(e).lower() and "nis" in str(e).lower():
            raise HTTPException(status_code=400, detail="NIS ini sudah terpakai!")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/attendance-check-in")
async def attendance_check_in(
    file: UploadFile = File(...), 
    mata_pelajaran: str = Form("Umum")
):
    file_path = save_temp_file(file)
    input_encoding = process_image_robust(file_path)
    if os.path.exists(file_path): os.remove(file_path)

    if input_encoding is None:
        raise HTTPException(status_code=400, detail="Wajah tidak terdeteksi.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nama, nis, kelas, face_encoding FROM siswa")
    students = cursor.fetchall()
    
    for s in students:
        s_id, s_nama, s_nis, s_kelas, s_enc = s
        # Bandingkan
        matches = face_recognition.compare_faces([np.array(s_enc)], input_encoding, tolerance=0.5)
        
        if matches[0]:
            # Logika Absen (Hapus duplikat hari ini -> Insert Baru -> Update Rekap)
            cursor.execute("DELETE FROM absensi WHERE siswa_id=%s AND mata_pelajaran=%s AND DATE(waktu_scan)=CURRENT_DATE", (s_id, mata_pelajaran))
            cursor.execute("INSERT INTO absensi (siswa_id, status_kehadiran, mata_pelajaran) VALUES (%s, 'Hadir', %s)", (s_id, mata_pelajaran))
            
            cursor.execute("""
                INSERT INTO attendance_history (siswa_id, kelas, mata_pelajaran, status, tanggal)
                VALUES (%s, %s, %s, 'Hadir', CURRENT_DATE)
                ON CONFLICT (siswa_id, mata_pelajaran, tanggal) DO UPDATE SET status='Hadir', waktu_absen=CURRENT_TIME
            """, (s_id, s_kelas, mata_pelajaran))
            
            conn.commit()
            cursor.close()
            conn.close()
            return {"status": "success", "student": {"nama": s_nama, "nis": s_nis, "kelas": s_kelas}}
            
    cursor.close()
    conn.close()
    raise HTTPException(status_code=401, detail="Wajah tidak dikenali.")

# Endpoint Rekap (Untuk Dashboard/Rekap Page)
@app.post("/rekap-absensi")
async def rekap_absensi(start: str = Form(...), end: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT h.tanggal, s.nama, s.kelas, h.mata_pelajaran, h.status, h.waktu_absen 
        FROM attendance_history h
        JOIN siswa s ON h.siswa_id = s.id
        WHERE h.tanggal BETWEEN %s AND %s
        ORDER BY h.tanggal DESC, h.waktu_absen DESC
    """, (start, end))
    data = cursor.fetchall()
    conn.close()
    
    results = [{"tanggal": str(r[0]), "nama": r[1], "kelas": r[2], "mapel": r[3], "status": r[4], "waktu": str(r[5])} for r in data]
    return {"data": results}