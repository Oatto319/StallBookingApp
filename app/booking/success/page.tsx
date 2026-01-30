'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, Mail, Phone, MapPin, Calendar, Home } from 'lucide-react';

const BookingSuccessContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [stallNumber, setStallNumber] = useState('');

  useEffect(() => {
    const stall = searchParams.get('stall');
    if (stall) {
      setStallNumber(stall);
    }
  }, [searchParams]);

  const handleDownloadReceipt = () => {
    // In real app, generate and download PDF receipt
    alert('กำลังดาวน์โหลดใบเสร็จ...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            จองสำเร็จ! 🎉
          </h1>
          <p className="text-lg text-slate-600">
            ขอบคุณที่ใช้บริการ MarketBooker
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
            <h2 className="text-xl font-semibold mb-2">รายละเอียดการจอง</h2>
            <p className="text-blue-100">หมายเลขการจอง: #BK{Date.now()}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Stall Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">หมายเลขที่</p>
                  <p className="text-lg font-bold text-slate-900">{stallNumber}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">วันที่จอง</p>
                  <p className="text-lg font-bold text-slate-900">
                    {new Date().toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200"></div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">ข้อมูลติดต่อ</h3>
              <div className="space-y-2">
                <div className="flex items-center text-slate-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">ใบเสร็จส่งไปยังอีเมลของคุณแล้ว</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span className="text-sm">หากมีข้อสงสัย โทร 02-xxx-xxxx</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md"
              >
                <Download className="h-5 w-5 mr-2" />
                ดาวน์โหลดใบเสร็จ
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex items-center justify-center px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-xl transition-all"
              >
                <Home className="h-5 w-5 mr-2" />
                กลับหน้าแรก
              </button>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
          <h3 className="font-semibold text-blue-900 mb-2">สิ่งที่ต้องเตรียม</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>นำใบเสร็จมาแสดงในวันงาน</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>มาถึงก่อนเวลาเริ่มงาน 30 นาที</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>ตรวจสอบกฎระเบียบของตลาดก่อนวันงาน</span>
            </li>
          </ul>
        </div>

        {/* Next Booking CTA */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-4">ต้องการจองเพิ่มเติม?</p>
          <button
            onClick={() => router.push('/booking')}
            className="inline-flex items-center px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-all"
          >
            จองที่เพิ่ม
          </button>
        </div>
      </div>
    </div>
  );
};

const BookingSuccessPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>}>
      <BookingSuccessContent />
    </Suspense>
  );
};

export default BookingSuccessPage;