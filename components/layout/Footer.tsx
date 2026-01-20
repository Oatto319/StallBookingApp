import React from 'react';
import { Facebook, LineChart, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* ส่วนข้อมูลแอป */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">M</span>
              </div>
              MarketBooker
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              ระบบจัดการและจองพื้นที่ตลาดนัดออนไลน์ที่ช่วยให้ชีวิตพ่อค้าแม่ค้าง่ายขึ้น 
              สะดวก รวดเร็ว และตรวจสอบได้ทุกขั้นตอน
            </p>
          </div>

          {/* ลิงก์ด่วน */}
          <div>
            <h4 className="font-bold text-slate-800 mb-4">ลิงก์ที่เกี่ยวข้อง</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors">หน้าแรก</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">ผังตลาดทั้งหมด</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">ตรวจสอบการจอง</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">คำถามที่พบบ่อย</a></li>
            </ul>
          </div>

          {/* ติดต่อเรา */}
          <div>
            <h4 className="font-bold text-slate-800 mb-4">ติดต่อฝ่ายดูแลตลาด</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500" /> 02-123-4567
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" /> contact@market.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" /> ถนนคนเดิน จังหวัดอุบลฯ
              </li>
            </ul>
          </div>

          {/* โซเชียลมีเดีย */}
          <div>
            <h4 className="font-bold text-slate-800 mb-4">ติดตามข่าวสาร</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                <span className="font-bold text-xs">LINE</span>
              </a>
            </div>
          </div>

        </div>

        {/* ส่วนลิขสิทธิ์ด้านล่างสุด */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:row justify-between items-center gap-4">
          <p className="text-slate-400 text-xs text-center">
            © 2026 MarketBooker System. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#" className="hover:underline">นโยบายความเป็นส่วนตัว</a>
            <a href="#" className="hover:underline">เงื่อนไขการใช้งาน</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;