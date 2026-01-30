"use client";
import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, User, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ตรวจสอบสถานะ Login
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const adminStatus = localStorage.getItem("isAdmin");
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    if (adminStatus === "true") {
      setIsAdmin(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    setUser(null);
    setIsAdmin(false);
    router.push("/");
    window.location.reload();
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <ShoppingBag className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
              MarketBooker
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              หน้าแรก
            </Link>
            <Link href="/minimap" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              ผังตลาด
            </Link>
            <Link href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              วิธีจอง
            </Link>

            {/* เปลี่ยนเฉพาะส่วนนี้ - แสดงปุ่มตามสถานะ Login */}
            {user ? (
              <>
                {isAdmin && (
                  <Link 
                    href="/admin/bookings"
                    className="text-slate-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    ผู้ดูแลสบ
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 font-medium">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                    {isAdmin && <span className="ml-2 text-xs text-blue-600">(Admin)</span>}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-100"
                  >
                    <LogOut className="w-4 h-4" />
                    ออกจากระบบ
                  </button>
                </div>
              </>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                <User className="w-4 h-4" />
                เข้าสู่ระบบ
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2">
              {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 p-4 space-y-4 shadow-xl">
          <Link 
            href="/" 
            className="block text-slate-600 font-medium px-4"
            onClick={() => setIsOpen(false)}
          >
            หน้าแรก
          </Link>
          <Link
            href="/minimap"
            className="block text-slate-600 font-medium px-4"
            onClick={() => setIsOpen(false)}
          >
            ผังตลาด
          </Link>
          <Link 
            href="#" 
            className="block text-slate-600 font-medium px-4"
            onClick={() => setIsOpen(false)}
          >
            วิธีจอง
          </Link>

          {/* เปลี่ยนเฉพาะส่วนนี้ - Mobile Menu */}
          <div className="pt-2">
            {user ? (
              <>
                <div className="px-4 py-2 text-slate-600 font-medium mb-2">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                  {isAdmin && <span className="ml-2 text-xs text-blue-600">(Admin)</span>}
                </div>
                
                {isAdmin && (
                  <Link 
                    href="/admin/bookings"
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all mb-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    ผู้ดูแลสบ
                  </Link>
                )}

                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;