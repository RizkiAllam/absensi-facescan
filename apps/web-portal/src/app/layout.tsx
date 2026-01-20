'use client';
import './globals.css';
import Link from 'next/link';
import { useState } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 flex min-h-screen">
        {/* SIDEBAR */}
        <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col fixed h-full z-10`}> 
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
            {isOpen && <h1 className="font-bold text-xl tracking-tight">ABSENSI <span className="text-blue-500">PRO</span></h1>}
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <Link href="/" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 transition text-slate-300 hover:text-white">
              <span>📷</span> {isOpen && <span>Absen Wajah</span>}
            </Link>
            <Link href="/dashboard" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 transition text-slate-300 hover:text-white">
              <span>📊</span> {isOpen && <span>Dashboard</span>}
            </Link>
            <Link href="/rekap" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 transition text-slate-300 hover:text-white">
              <span>📅</span> {isOpen && <span>Rekap Data</span>}
            </Link>
          </nav>

          <button onClick={() => setIsOpen(!isOpen)} className="p-4 text-center text-slate-500 hover:text-white text-sm border-t border-slate-800">
            {isOpen ? '◀ Kecilkan Menu' : '▶'}
          </button>
        </aside>

        {/* CONTENT AREA */}
        <main className={`flex-1 p-8 transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'}`}>
          {children}
        </main>
      </body>
    </html>
  );
}