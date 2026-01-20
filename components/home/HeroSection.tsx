import React from 'react';
import { MapPin, Search, Calendar } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-b from-blue-50 to-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge ตกแต่ง */}
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
            เปิดจองแล้ววันนี้! ตลาดนัดคนเดินวันหยุด
          </span>
          
          {/* หัวข้อหลัก */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            จองทำเลทอง <span className="text-blue-600">ง่ายๆ แค่ปลายนิ้ว</span>
          </h1>
          
          {/* คำอธิบาย */}
          <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-10">
            ระบบจองที่ขายของออนไลน์ที่สะดวกที่สุด เลือกโซนที่ชอบ เช็คราคาที่ใช่ 
            พร้อมระบบจ่ายเงินและรับใบเสร็จทันที ไม่ต้องรอลุ้นหน้างาน
          </p>

          {/* แถบค้นหา/ปุ่มกดจองด่วน */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button className="flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 w-full md:w-auto">
              <Calendar className="mr-2 h-5 w-5" />
              เริ่มจองที่ว่างตอนนี้
            </button>
            <button className="flex items-center justify-center px-8 py-4 bg-white border-2 border-blue-100 hover:border-blue-200 text-blue-600 font-semibold rounded-xl transition-all w-full md:w-auto">
              <MapPin className="mr-2 h-5 w-5" />
              ดูผังตลาดทั้งหมด
            </button>
          </div>

          {/* สถิติเล็กๆ เพื่อความน่าเชื่อถือ */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-8 border-t border-slate-100 pt-12 max-w-3xl mx-auto">
            <div>
              <p className="text-3xl font-bold text-blue-600">200+</p>
              <p className="text-sm text-slate-500 font-medium">ทำเลที่ว่าง</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">5</p>
              <p className="text-sm text-slate-500 font-medium">โซนยอดนิยม</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-3xl font-bold text-blue-600">1,200+</p>
              <p className="text-sm text-slate-500 font-medium">พ่อค้าแม่ค้าใช้งาน</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;