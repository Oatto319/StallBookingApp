'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
    setShowDropdown(false);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">📍 StallBooking</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="text-slate-700 hover:text-blue-600 transition font-medium"
            >
              หน้าหลัก
            </Link>
            <Link 
              href="/stalls" 
              className="text-slate-700 hover:text-blue-600 transition font-medium"
            >
              แผงตลาด
            </Link>

            {/* Auth Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                >
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                  <svg 
                    className={`w-4 h-4 transition transform ${showDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-slate-200">
                    <Link
                      href="/profile"
                      className="block px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-t-lg transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      👤 โปรไฟล์
                    </Link>
                    <Link
                      href="/bookings"
                      className="block px-4 py-3 text-slate-700 hover:bg-slate-100 transition border-t border-slate-200"
                      onClick={() => setShowDropdown(false)}
                    >
                      📅 การจองของฉัน
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-lg transition border-t border-slate-200"
                    >
                      🚪 ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}