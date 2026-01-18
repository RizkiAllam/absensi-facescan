import os
import shutil
import logging
import psycopg2
import face_recognition
import numpy as np
import uuid
import pydantic
from dotenv import load_dotenv
from datetime import datetime, date
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import Json
from PIL import Image, UnidentifiedImageError
from typing import Optional, List, Dict, Any

# --- CONFIGURATION ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load file .env
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS")
}
TOLERANCE_LEVEL = 0.5 

app = FastAPI(title="Face Recognition Attendance System", version="2.0.0")

# --- FIX CORS (SANGAT PENTING) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"], # Pastikan POST & OPTIONS diizinkan
    allow_headers=["*"],
)

# --- MODELS ---
class ManualUpdate(pydantic.BaseModel):
    siswa_id: int
    status: str
    mata_pelajaran: str

class RekapRequest(pydantic.BaseModel):
    start_date: str
    end_date: str
    kelas: Optional[str] = None
    mata_pelajaran: Optional[str] = None

# --- DB UTILITIES ---
def get_db_connection():
    try:
        return psycopg2.connect(**DB_CONFIG)
    except psycopg2.Error as e:
        logger.error(f"Database connection failed: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")

# --- CORE LOGIC ---
def process_image_to_encoding(file_path: str) -> Optional[np.ndarray]:
    try:
        pil_image = Image.open(file_path).convert("RGB")
        image_array = np.array(pil_image)
        face_locations = face_recognition.face_locations(image_array)
        if not face_locations: return None
        encodings = face_recognition.face_encodings(image_array, face_locations)
        return encodings[0]
    except Exception: return None

def save_upload_file(upload_file: UploadFile, prefix: str) -> str:
    filename, ext = os.path.splitext(upload_file.filename)
    unique_filename = f"{prefix}_{uuid.uuid4()}{ext}"
    path = f"{UPLOAD_DIR}/{unique_filename}"
    with open(path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return path

# --- ENDPOINTS ---

@app.get("/")
def root():
    return {"status": "ONLINE", "service": "Face Recognition API v2.0"}

@app.post("/register-student")
async def register_student(nama: str = Form(...), nis: str = Form(...), kelas: str = Form(...), file: UploadFile = File(...)):
    file_path = save_upload_file(file, "reg")
    encoding = process_image_to_encoding(file_path)
    if os.path.exists(file_path): os.remove(file_path)
    if encoding is None: raise HTTPException(status_code=400, detail="Wajah tidak terdeteksi.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO siswa (nama, nis, kelas, face_encoding) VALUES (%s, %s, %s, %s)", (nama, nis, kelas, encoding.tolist()))
        conn.commit()
        return {"status": "success"}
    finally:
        cursor.close()
        conn.close()

@app.post("/attendance-check-in")
async def attendance_check_in(file: UploadFile = File(...), mata_pelajaran: str = Form("Umum")):
    file_path = save_upload_file(file, "abs")
    input_encoding = process_image_to_encoding(file_path)
    if os.path.exists(file_path): os.remove(file_path)
    if input_encoding is None: raise HTTPException(status_code=400, detail="Wajah tidak terdeteksi.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nama, nis, kelas, face_encoding FROM siswa")
    db_students = cursor.fetchall()
    
    for student in db_students:
        s_id, s_nama, s_nis, s_kelas, s_encoding = student
        if face_recognition.compare_faces([np.array(s_encoding)], input_encoding, tolerance=TOLERANCE_LEVEL)[0]:
            # Hapus absen lama di hari yang sama & mapel sama agar tidak duplikat
            cursor.execute("DELETE FROM absensi WHERE siswa_id = %s AND mata_pelajaran = %s AND DATE(waktu_scan) = CURRENT_DATE", (s_id, mata_pelajaran))
            cursor.execute("INSERT INTO absensi (siswa_id, status_kehadiran, mata_pelajaran) VALUES (%s, 'Hadir', %s)", (s_id, mata_pelajaran))
            
            cursor.execute("""
                INSERT INTO attendance_history (siswa_id, kelas, mata_pelajaran, status, tanggal)
                VALUES (%s, %s, %s, 'Hadir', CURRENT_DATE)
                ON CONFLICT (siswa_id, mata_pelajaran, tanggal) DO UPDATE SET status = 'Hadir'
            """, (s_id, s_kelas, mata_pelajaran))
            
            conn.commit()
            cursor.close()
            conn.close()
            return {"status": "success", "student": {"nama": s_nama, "nis": s_nis}}

    cursor.close()
    conn.close()
    raise HTTPException(status_code=401, detail="Wajah tidak dikenali")

@app.get("/class-attendance")
async def get_class_attendance(kelas: str, mapel: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT s.id, s.nama, s.nis, s.kelas, COALESCE(a.status_kehadiran, 'Belum Absen'), a.waktu_scan
            FROM siswa s
            LEFT JOIN absensi a ON s.id = a.siswa_id AND a.mata_pelajaran = %s AND DATE(a.waktu_scan) = CURRENT_DATE
            WHERE s.kelas = %s ORDER BY s.nama ASC;
        """
        cursor.execute(query, (mapel, kelas))
        data = [{"id": r[0], "nama": r[1], "nis": r[2], "kelas": r[3], "status": r[4], "waktu": r[5].strftime("%H:%M") if r[5] else "-"} for r in cursor.fetchall()]
        return {"status": "success", "data": data}
    finally:
        cursor.close()
        conn.close()

@app.post("/update-status")
async def update_student_status(payload: ManualUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Update Tabel Absensi (Harian) - Hapus dulu baru insert biar bersih
        cursor.execute("DELETE FROM absensi WHERE siswa_id = %s AND mata_pelajaran = %s AND DATE(waktu_scan) = CURRENT_DATE", (payload.siswa_id, payload.mata_pelajaran))
        cursor.execute("INSERT INTO absensi (siswa_id, mata_pelajaran, status_kehadiran) VALUES (%s, %s, %s)", (payload.siswa_id, payload.mata_pelajaran, payload.status))
        
        # 2. Update Tabel Histori (Rekap)
        cursor.execute("SELECT kelas FROM siswa WHERE id = %s", (payload.siswa_id,))
        s_kelas = cursor.fetchone()[0]
        cursor.execute("""
            INSERT INTO attendance_history (siswa_id, kelas, mata_pelajaran, status, tanggal)
            VALUES (%s, %s, %s, %s, CURRENT_DATE)
            ON CONFLICT (siswa_id, mata_pelajaran, tanggal) DO UPDATE SET status = EXCLUDED.status
        """, (payload.siswa_id, s_kelas, payload.mata_pelajaran, payload.status))
        
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/rekap-absensi")
async def get_rekap_absensi(req: RekapRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT h.tanggal, s.nis, s.nama, h.kelas, h.mata_pelajaran, h.status, h.waktu_absen
            FROM attendance_history h JOIN siswa s ON h.siswa_id = s.id
            WHERE h.tanggal BETWEEN %s AND %s
        """
        params = [req.start_date, req.end_date]
        if req.kelas: query += " AND h.kelas = %s"; params.append(req.kelas)
        if req.mata_pelajaran: query += " AND h.mata_pelajaran = %s"; params.append(req.mata_pelajaran)
        
        cursor.execute(query, tuple(params))
        data = [{"tanggal": str(r[0]), "nis": r[1], "nama": r[2], "kelas": r[3], "mapel": r[4], "status": r[5], "waktu": str(r[6])} for r in cursor.fetchall()]
        return {"status": "success", "data": data}
    finally:
        cursor.close()
        conn.close()