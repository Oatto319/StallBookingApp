'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Clock, DollarSign, Calendar, MapPin, User, FileCheck } from 'lucide-react';

interface Booking {
  id: string;
  userEmail: string;
  userName?: string;
  stallNumber: string;
  stallZone: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  bookingDate: string;
  paymentSlip?: string;
  referenceNo?: string;
}

const AdminBookingsPage = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ตรวจสอบสิทธิ์ Admin
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const adminStatus = localStorage.getItem('isAdmin');

    if (!adminStatus || adminStatus !== 'true') {
      router.push('/');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
    setIsAdmin(true);

    // โหลดข้อมูลการจอง (จำลอง)
    loadBookings();
  }, [router]);

  const loadBookings = () => {
    setLoading(true);
    // ตัวอย่างข้อมูล - ในการทำงานจริงต้องเรียก API
    const mockBookings: Booking[] = [
      {
        id: '1',
        userEmail: 'user1@example.com',
        userName: 'สมชาย ใจดี',
        stallNumber: 'A-01',
        stallZone: 'A',
        startDate: '2026-01-31',
        endDate: '2026-02-07',
        numberOfDays: 8,
        totalPrice: 1000,
        status: 'pending',
        bookingDate: '2026-01-30',
        referenceNo: 'REF123456789',
      },
      {
        id: '2',
        userEmail: 'user2@example.com',
        userName: 'จันทรา สวยใจ',
        stallNumber: 'B-05',
        stallZone: 'B',
        startDate: '2026-02-01',
        endDate: '2026-02-10',
        numberOfDays: 10,
        totalPrice: 1500,
        status: 'pending',
        bookingDate: '2026-01-30',
        referenceNo: 'REF987654321',
      },
    ];
    setTimeout(() => {
      setBookings(mockBookings);
      setLoading(false);
    }, 500);
  };

  const handleApprove = async (bookingId: string) => {
    // ส่งไปยัง API เพื่ออนุมัติการจอง
    console.log('Approving booking:', bookingId);
    
    // อัปเดต UI
    setBookings(bookings.map(b => 
      b.id === bookingId ? { ...b, status: 'approved' } : b
    ));
  };

  const handleReject = async (bookingId: string) => {
    // ส่งไปยัง API เพื่อปฏิเสธการจอง
    console.log('Rejecting booking:', bookingId);
    
    // อัปเดต UI
    setBookings(bookings.map(b => 
      b.id === bookingId ? { ...b, status: 'rejected' } : b
    ));
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-bold">⛔ คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            ✓ ยืนยันการจอง
          </h1>
          <p className="text-slate-600">
            ผู้ดูแลระบบ: {user?.name || user?.email}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6 bg-white rounded-xl shadow-sm p-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status === 'all' && '📋 ทั้งหมด'}
              {status === 'pending' && '⏳ รอการยืนยัน'}
              {status === 'approved' && '✅ อนุมัติแล้ว'}
              {status === 'rejected' && '❌ ปฏิเสธ'}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-slate-600 mt-4">กำลังโหลด...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-slate-600 text-lg">ไม่มีการจองที่ต้องยืนยัน</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map(booking => (
              <div
                key={booking.id}
                className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
                  booking.status === 'pending' ? 'border-yellow-500' :
                  booking.status === 'approved' ? 'border-green-500' :
                  'border-red-500'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  
                  {/* User Info */}
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">ผู้จอง</p>
                      <p className="font-bold text-slate-900">{booking.userName}</p>
                      <p className="text-xs text-slate-500">{booking.userEmail}</p>
                    </div>
                  </div>

                  {/* Stall Info */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">แผงค้า</p>
                      <p className="font-bold text-slate-900">เขต {booking.stallZone} หมายเลข {booking.stallNumber}</p>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">ยอดชำระ</p>
                      <p className="font-bold text-slate-900">฿{booking.totalPrice.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{booking.numberOfDays} วัน</p>
                    </div>
                  </div>

                  {/* Date Info */}
                  <div className="flex items-start gap-3 md:col-span-1 lg:col-span-1">
                    <Calendar className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">วันจอง</p>
                      <p className="font-bold text-slate-900 text-sm">{booking.startDate} ถึง {booking.endDate}</p>
                    </div>
                  </div>

                  {/* Reference Number */}
                  <div className="flex items-start gap-3">
                    <FileCheck className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">เลขอ้างอิง</p>
                      <p className="font-bold text-slate-900 text-sm font-mono">{booking.referenceNo}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-end">
                    <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status === 'pending' && '⏳ รอการยืนยัน'}
                      {booking.status === 'approved' && '✅ อนุมัติแล้ว'}
                      {booking.status === 'rejected' && '❌ ปฏิเสธ'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {booking.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleApprove(booking.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
                    >
                      <Check className="w-5 h-5" />
                      อนุมัติการจอง
                    </button>
                    <button
                      onClick={() => handleReject(booking.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all"
                    >
                      <X className="w-5 h-5" />
                      ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingsPage;
