import React from 'react';
import { MousePointerClick, QrCode, TicketCheck } from 'lucide-react';

const steps = [
  {
    title: '1. เลือกทำเล',
    description: 'เลือกโซนและเลขล็อกที่ต้องการขาย บนผังตลาดแบบ Interactive',
    icon: <MousePointerClick className="w-8 h-8 text-blue-600" />,
    color: 'bg-blue-50',
  },
  {
    title: '2. แสกนจ่ายเงิน',
    description: 'ชำระเงินผ่าน QR Code PromptPay ระบบจะตรวจสอบยอดให้อัตโนมัติ',
    icon: <QrCode className="w-8 h-8 text-blue-600" />,
    color: 'bg-blue-50',
  },
  {
    title: '3. รับใบเสร็จ',
    description: 'รับใบจองและใบเสร็จดิจิทัล เพื่อใช้ยืนยันตัวตนในวันเข้าขาย',
    icon: <TicketCheck className="w-8 h-8 text-blue-600" />,
    color: 'bg-blue-50',
  },
];

const BookingSteps = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">
            ขั้นตอนการจองง่ายๆ
          </h2>
          <p className="mt-4 text-slate-600">
            ไม่ต้องเดินทางมาจองที่หน้างาน ทำทุกอย่างได้จบในมือถือเครื่องเดียว
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative p-8 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:shadow-blue-100/50 transition-all group"
            >
              {/* ตกแต่งด้วยเลขลำดับจางๆ ด้านหลัง */}
              <div className="absolute top-4 right-6 text-6xl font-black text-slate-50 group-hover:text-blue-50 transition-colors">
                0{index + 1}
              </div>

              <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 relative z-10`}>
                {step.icon}
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-3 relative z-10">
                {step.title}
              </h3>
              <p className="text-slate-600 leading-relaxed relative z-10">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookingSteps;