"use client";

import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, User } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // ตรวจสอบการ Scroll เพื่อเปลี่ยนความใสของ Navbar
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

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <ShoppingBag className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
              MarketBooker
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">หน้าแรก</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">ผังตลาด</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">วิธีจอง</a>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
              <User className="w-4 h-4" />
              เข้าสู่ระบบ
            </button>
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
          <a href="#" className="block text-slate-600 font-medium px-4">หน้าแรก</a>
          <a href="#" className="block text-slate-600 font-medium px-4">ผังตลาด</a>
          <a href="#" className="block text-slate-600 font-medium px-4">วิธีจอง</a>
          <div className="pt-2">
            <button className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold">
              <User className="w-4 h-4" />
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;