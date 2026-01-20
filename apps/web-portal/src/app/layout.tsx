/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import './globals.css';
import Link from 'next/link';
import { useState } from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';

// --- KOMPONEN SIDEBAR (KHUSUS LAPTOP) ---

function DesktopSidebar({ isOpen, setIsOpen, theme }: any) {
  return (
    <aside className={`hidden md:flex ${isOpen ? 'w-64' : 'w-20'} ${theme.sidebarBg} border-r transition-all duration-300 flex-col fixed h-full z-30`}> 
      <div className="p-6 flex items-center gap-3">
        <div className={`w-8 h-8 ${theme.iconBg} rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-lg`}>A</div>
        <h1 className={`font-bold text-xl tracking-tight transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
          ABSENSI <span className="text-blue-500">PRO</span>
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <NavItem href="/" icon="📷" label="Absen Wajah" isOpen={isOpen} theme={theme} />
        <NavItem href="/dashboard" icon="📊" label="Dashboard" isOpen={isOpen} theme={theme} />
        <NavItem href="/guru" icon="📝" label="Guru Check" isOpen={isOpen} theme={theme} />
        <NavItem href="/rekap" icon="📅" label="Rekap Data" isOpen={isOpen} theme={theme} />
      </nav>

      <button onClick={() => setIsOpen(!isOpen)} className={`p-4 text-center text-sm border-t ${theme.borderColor} ${theme.textSec} hover:text-blue-500`}>
        {isOpen ? '◀ Kecilkan Menu' : '▶'}
      </button>
    </aside>
  );
}

// --- KOMPONEN BOTTOM BAR (KHUSUS HP) ---
function MobileBottomNav({ theme }: any) {
  return (
    <div className={`md:hidden fixed bottom-0 left-0 w-full ${theme.sidebarBg} border-t ${theme.borderColor} flex justify-around items-center p-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]`}>
      <Link href="/" className="flex flex-col items-center gap-1 group">
        <span className="text-2xl group-hover:scale-110 transition">📷</span>
        <span className={`text-[10px] font-bold ${theme.textSec}`}>Absen</span>
      </Link>
      <Link href="/dashboard" className="flex flex-col items-center gap-1 group">
        <span className="text-2xl group-hover:scale-110 transition">📊</span>
        <span className={`text-[10px] font-bold ${theme.textSec}`}>Dash</span>
      </Link>
      <Link href="/guru" className="flex flex-col items-center gap-1 group">
        <span className="text-2xl group-hover:scale-110 transition">📝</span>
        <span className={`text-[10px] font-bold ${theme.textSec}`}>Guru</span>
      </Link>
      <Link href="/rekap" className="flex flex-col items-center gap-1 group">
        <span className="text-2xl group-hover:scale-110 transition">📅</span>
        <span className={`text-[10px] font-bold ${theme.textSec}`}>Rekap</span>
      </Link>
    </div>
  );
}

// --- KONTEN UTAMA ---
function MainContent({ children }: { children: React.ReactNode }) {
  // Default Sidebar Tertutup (False)
  const [isOpen, setIsOpen] = useState(false); 
  const { isDarkMode } = useTheme();

  // Config Warna Terpusat (Fix Masalah Belang)
  const theme = {
    // Jika Light Mode (Default), Sidebar jadi Putih. Jika Dark, jadi Hitam.
    sidebarBg: isDarkMode ? 'bg-slate-950' : 'bg-white',
    bodyBg: isDarkMode ? 'bg-slate-900' : 'bg-slate-50',
    textMain: isDarkMode ? 'text-white' : 'text-slate-800',
    textSec: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    textHover: isDarkMode ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-blue-50 hover:text-blue-600',
    borderColor: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    iconBg: 'bg-blue-600',
  };

  return (
    <body className={`${theme.bodyBg} ${theme.textMain} min-h-screen transition-colors duration-500`}>
      
      {/* 1. Sidebar Kiri (Hanya muncul di Layar Besar/md ke atas) */}
      <DesktopSidebar isOpen={isOpen} setIsOpen={setIsOpen} theme={theme} />

      {/* 2. Bottom Bar (Hanya muncul di HP/hidden di md) */}
      <MobileBottomNav theme={theme} />

      {/* 3. Area Konten */}
      {/* Margin Kiri (ml) ada di Desktop. Margin Bawah (mb) ada di HP supaya tidak ketutup menu bawah */}
      <main className={`transition-all duration-300 p-4 md:p-8 
        ${isOpen ? 'md:ml-64' : 'md:ml-20'} 
        mb-20 md:mb-0
      `}>
        {children}
      </main>
    </body>
  );
}

// Helper Menu Item
function NavItem({ href, icon, label, isOpen, theme }: any) {
  return (
    <Link href={href} className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${theme.textHover} group relative`}>
      <span className="text-xl">{icon}</span>
      <span className={`font-medium whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
        {label}
      </span>
      {/* Tooltip saat sidebar tutup (Hanya di Desktop) */}
      {!isOpen && (
        <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap hidden md:block">
          {label}
        </div>
      )}
    </Link>
  );
}

// ROOT LAYOUT
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <ThemeProvider>
        <MainContent>{children}</MainContent>
      </ThemeProvider>
    </html>
  );
}