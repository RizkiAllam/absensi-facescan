'use client';

import './globals.css';
import Link from 'next/link';
import { useState } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: '📷 Mode Absen Wajah', href: '/' },
    { name: '🏫 Jurnal & Dashboard', href: '/dashboard' },
    { name: '🗓️ Rekap Database', href: '/rekap' },
  ];

  return (
    <html lang="en">
      <body className="bg-slate-100 flex min-h-screen">
        
        {/* MOBILE HEADER (Hanya muncul di HP) */}
        <header className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 flex justify-between items-center z-50">
          <h2 className="text-lg font-black tracking-tighter text-blue-400">ABSENSI <span className="text-white">PRO</span></h2>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-slate-800 rounded-lg">
            {isOpen ? '✕' : '☰'}
          </button>
        </header>

        {/* SIDEBAR (Responsive) */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 hidden lg:block">
            <h2 className="text-xl font-black tracking-tighter text-blue-400">
              ABSENSI <span className="text-white">PRO</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Management System</p>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-20 lg:mt-4">
            {menuItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition font-bold text-sm"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-6 border-t border-slate-800 hidden lg:block">
            <div className="bg-slate-800 p-3 rounded-xl">
               <p className="text-[10px] text-slate-400 font-bold">USER LOGIN</p>
               <p className="text-sm font-bold text-blue-400">Admin Utama</p>
            </div>
          </div>
        </aside>

        {/* AREA KONTEN UTAMA */}
        <main className="flex-1 w-full min-w-0 pt-16 lg:pt-0 overflow-x-hidden">
          {children}
        </main>

        {/* OVERLAY (Klik untuk tutup sidebar di HP) */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </body>
    </html>
  );
}