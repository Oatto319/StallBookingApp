"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // รับข้อมูลที่ส่งมาจากหน้าจองผ่าน URL
  const bookingId = searchParams.get("id");
  const price = searchParams.get("price");
  const stallCode = searchParams.get("stall");

  // State สำหรับจำลองการอัปโหลดสลิป
  const [isUploading, setIsUploading] = useState(false);

  const handleConfirmPayment = () => {
    if (!confirm("ยืนยันการแจ้งโอนเงิน?")) return;
    
    setIsUploading(true);
    
    // จำลองการส่งข้อมูล (ของจริงต้องเขียน API อัปโหลดรูป)
    setTimeout(() => {
      alert("✅ แจ้งโอนเงินเรียบร้อย! เจ้าหน้าที่จะตรวจสอบและอนุมัติเร็วๆ นี้");
      router.push("/"); // เด้งกลับหน้าแรก
    }, 2000);
  };

  if (!bookingId) return <div className="p-10 text-center text-red-500">❌ ไม่พบข้อมูลการจอง</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl border-t-8 border-blue-600">
        
        {/* หัวข้อ */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">ยืนยันการชำระเงิน</h1>
          <p className="text-gray-500">Booking ID: <span className="font-mono text-blue-600">#{bookingId.slice(0, 8)}</span></p>
        </div>

        {/* ยอดเงินและแผง */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6 text-center">
          <p className="text-gray-600 mb-1">ชำระค่าจองแผง <strong className="text-gray-800 text-lg">{stallCode}</strong></p>
          <div className="text-4xl font-extrabold text-blue-700 my-2">
            {Number(price).toLocaleString()} ฿
          </div>
          <p className="text-xs text-red-500">*กรุณาชำระภายใน 15 นาที</p>
        </div>

        {/* ช่องทางชำระเงิน (QR Code จำลอง) */}
        <div className="flex flex-col items-center mb-6 space-y-4">
          <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center shadow-inner relative overflow-hidden">
             {/* ตรงนี้ใส่รูป QR Code จริงๆ ได้เลย เช่น <img src="/qr.jpg" /> */}
             <div className="text-center text-gray-400">
                <p className="text-xs">SCAN ME</p>
                <div className="w-32 h-32 bg-gray-800 mx-auto mt-1"></div>
             </div>
          </div>
          <div className="text-center w-full">
            <p className="font-bold text-gray-700 text-lg">ธนาคารกสิกรไทย (KBANK)</p>
            <div className="font-mono text-xl bg-gray-100 px-3 py-2 rounded mt-1 border border-dashed border-gray-400 select-all cursor-pointer hover:bg-gray-200 transition">
              012-3-45678-9
            </div>
            <p className="text-sm text-gray-500 mt-1">ชื่อบัญชี: บจก. ตลาดนัดไฮโซ</p>
          </div>
        </div>

        {/* ปุ่มแจ้งโอน */}
        <button
          onClick={handleConfirmPayment}
          disabled={isUploading}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
            isUploading 
              ? "bg-gray-400 cursor-not-allowed text-gray-100" 
              : "bg-green-600 hover:bg-green-700 text-white hover:scale-105"
          }`}
        >
          {isUploading ? "⏳ กำลังส่งข้อมูล..." : "📤 แนบสลิป / แจ้งโอนเงิน"}
        </button>

        <button 
          onClick={() => router.push("/")}
          className="w-full mt-4 text-gray-400 hover:text-gray-600 text-sm underline"
        >
          ยกเลิก / ทำรายการภายหลัง
        </button>

      </div>
    </div>
  );
}

// ต้องมี Suspense ครอบเพื่อให้ใช้งาน useSearchParams ได้ใน Next.js
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">⏳ กำลังโหลดหน้าจ่ายเงิน...</div>}>
      <PaymentContent />
    </Suspense>
  );
}