'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  ArrowLeft,
  Store,
  DollarSign,
  User,
  Phone,
  Mail
} from 'lucide-react';
import Link from 'next/link';

// Types
interface Stall {
  id: string;
  zone: string;
  number: string;
  price: number;
  size: string;
  status: 'available' | 'selected' | 'booked' | 'reserved';
  reservedBy?: string;
  reservedUntil?: Date;
}

const BookingPage = () => {
  const router = useRouter();
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [bookingDate, setBookingDate] = useState('');
  const [step, setStep] = useState(1);

  // Initialize stalls
  useEffect(() => {
    const initializeStalls = () => {
      const mockStalls: Stall[] = [];
      const zones = [
        { name: 'A', count: 20, price: 500, size: 'เล็ก (2x2 ม.)' },
        { name: 'B', count: 20, price: 600, size: 'กลาง (2x3 ม.)' },
        { name: 'C', count: 20, price: 700, size: 'กลาง (2x3 ม.)' },
        { name: 'D', count: 20, price: 800, size: 'ใหญ่ (3x3 ม.)' },
        { name: 'E', count: 20, price: 900, size: 'ใหญ่ (3x4 ม.)' }
      ];
      
      zones.forEach(zone => {
        for (let i = 1; i <= zone.count; i++) {
          const stallId = `${zone.name}${i}`;
          const stallNumber = `${zone.name}${i.toString().padStart(2, '0')}`;
          
          // ล็อค A02 เป็นตัวอย่างที่กำลังถูกจองโดยคนอื่น
          if (stallNumber === 'A02') {
            mockStalls.push({
              id: stallId,
              zone: zone.name,
              number: stallNumber,
              price: zone.price,
              size: zone.size,
              status: 'reserved',
              reservedBy: 'other_user_session',
              reservedUntil: new Date(Date.now() + 10 * 60 * 1000)
            });
          } else {
            mockStalls.push({
              id: stallId,
              zone: zone.name,
              number: stallNumber,
              price: zone.price,
              size: zone.size,
              status: Math.random() > 0.7 ? 'booked' : 'available'
            });
          }
        }
      });
      
      setStalls(mockStalls);
      setLoading(false);
    };

    initializeStalls();
  }, []);

  // Countdown timer for reservation
  useEffect(() => {
    if (selectedStall && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            handleReleaseStall();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [selectedStall, timeLeft]);

  // Handle stall selection
  const handleSelectStall = (stall: Stall) => {
    if (stall.status === 'booked') return;
    
    if (stall.status === 'reserved' && stall.reservedBy !== sessionId) {
      const now = new Date();
      if (stall.reservedUntil && stall.reservedUntil > now) {
        alert('ที่นี่กำลังถูกจองโดยผู้ใช้อื่น กรุณาเลือกที่อื่น');
        return;
      }
    }

    if (selectedStall && selectedStall.id !== stall.id) {
      handleReleaseStall();
    }

    const reservedUntil = new Date(Date.now() + 5 * 60 * 1000);
    
    setStalls(prev => prev.map(s => 
      s.id === stall.id 
        ? { ...s, status: 'reserved', reservedBy: sessionId, reservedUntil }
        : s
    ));
    
    setSelectedStall({ ...stall, status: 'reserved', reservedBy: sessionId, reservedUntil });
    setTimeLeft(300);
  };

  // Release stall
  const handleReleaseStall = () => {
    if (!selectedStall) return;

    setStalls(prev => prev.map(s => 
      s.id === selectedStall.id && s.reservedBy === sessionId
        ? { ...s, status: 'available', reservedBy: undefined, reservedUntil: undefined }
        : s
    ));
    
    setSelectedStall(null);
    setTimeLeft(null);
  };

  // Proceed to payment
  const handleProceedToPayment = () => {
    if (!selectedStall || !bookingDate) {
      alert('กรุณาเลือกที่และวันที่จอง');
      return;
    }
    
    localStorage.setItem('pendingBooking', JSON.stringify({
      stall: selectedStall,
      sessionId,
      bookingDate,
      expiresAt: selectedStall.reservedUntil
    }));
    
    router.push('/booking/payment');
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter stalls
  const filteredStalls = selectedZone === 'all' 
    ? stalls 
    : stalls.filter(s => s.zone === selectedZone);

  // Get stall color
  const getStallColor = (stall: Stall) => {
    if (stall.status === 'booked') return 'bg-red-400 cursor-not-allowed text-white';
    if (stall.id === selectedStall?.id) return 'bg-blue-600 text-white cursor-pointer border-blue-800';
    if (stall.status === 'reserved') return 'bg-yellow-400 cursor-not-allowed text-slate-800';
    return 'bg-green-400 hover:bg-green-500 cursor-pointer text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">กำลังโหลดข้อมูลที่ว่าง...</p>
        </div>
      </div>
    );
  }

  const availableCount = stalls.filter(s => s.status === 'available').length;
  const bookedCount = stalls.filter(s => s.status === 'booked').length;
  const reservedCount = stalls.filter(s => s.status === 'reserved').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">กลับหน้าแรก</span>
          </Link>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">จองช่องตลาด</h1>
          <p className="text-slate-600">เลือกช่องที่ต้องการและชำระเงินเพื่อยืนยันการจอง</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            <div className="text-sm text-slate-600">ช่องว่าง</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">{bookedCount}</div>
            <div className="text-sm text-slate-600">จองแล้ว</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-600">{reservedCount}</div>
            <div className="text-sm text-slate-600">กำลังจอง</div>
          </div>
        </div>

        {/* Reservation Timer Alert */}
        {selectedStall && timeLeft !== null && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-md">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  คุณได้จองที่ <strong>{selectedStall.number}</strong> ไว้ชั่วคราว
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  เหลือเวลา: <strong className="text-lg font-bold">{formatTime(timeLeft)}</strong> กรุณาดำเนินการชำระเงินภายในเวลาที่กำหนด
                </p>
              </div>
              <button
                onClick={handleReleaseStall}
                className="ml-4 text-sm text-yellow-700 hover:text-yellow-900 underline font-medium"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            เลือกช่องที่ต้องการจอง
          </h2>

          {/* Filters */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  กรองตามโซน
                </label>
                <select 
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">ทุกโซน</option>
                  <option value="A">Zone A - ฿500 (2x2 ม.)</option>
                  <option value="B">Zone B - ฿600 (2x3 ม.)</option>
                  <option value="C">Zone C - ฿700 (2x3 ม.)</option>
                  <option value="D">Zone D - ฿800 (3x3 ม.)</option>
                  <option value="E">Zone E - ฿900 (3x4 ม.)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  วันที่ต้องการจอง *
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-400 border-2 border-green-500 rounded"></div>
              <span className="text-sm text-slate-700 font-medium">ว่าง (เลือกได้)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 border-2 border-blue-800 rounded"></div>
              <span className="text-sm text-slate-700 font-medium">เลือกโดยคุณ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-400 border-2 border-yellow-500 rounded"></div>
              <span className="text-sm text-slate-700 font-medium">กำลังจองโดยคนอื่น</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-400 border-2 border-red-500 rounded"></div>
              <span className="text-sm text-slate-700 font-medium">จองแล้ว (เต็ม)</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-600">พบ {filteredStalls.length} ช่อง</span>
            </div>
          </div>

          {/* Booth Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-6 max-h-96 overflow-y-auto p-2">
            {filteredStalls.map(stall => (
              <button
                key={stall.id}
                onClick={() => handleSelectStall(stall)}
                disabled={stall.status === 'booked' || (stall.status === 'reserved' && stall.reservedBy !== sessionId)}
                className={`
                  aspect-square rounded-lg border-2 transition-all
                  ${getStallColor(stall)}
                  ${stall.id === selectedStall?.id ? 'border-blue-900 scale-105 shadow-lg' : 'border-transparent'}
                  disabled:opacity-70
                `}
                title={`${stall.number} - ${stall.price} บาท${stall.status === 'reserved' && stall.reservedBy !== sessionId ? ' (กำลังถูกจองโดยผู้อื่น)' : ''}`}
              >
                <div className="text-xs font-bold">{stall.number}</div>
              </button>
            ))}
          </div>

          {/* Selected Booth Info */}
          {selectedStall && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6 mb-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-lg text-slate-800">ช่องที่เลือก</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-3 shadow">
                  <span className="text-xs text-slate-500">เลขที่ช่อง</span>
                  <div className="font-bold text-xl text-blue-600">{selectedStall.number}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow">
                  <span className="text-xs text-slate-500">โซน</span>
                  <div className="font-bold text-lg text-slate-800">Zone {selectedStall.zone}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow">
                  <span className="text-xs text-slate-500">ขนาด</span>
                  <div className="font-bold text-sm text-slate-700">{selectedStall.size}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow">
                  <span className="text-xs text-slate-500">ราคา</span>
                  <div className="font-bold text-xl text-green-600">฿{selectedStall.price}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow">
                  <span className="text-xs text-slate-500">เวลาที่เหลือ</span>
                  <div className="font-bold text-lg text-orange-600">{timeLeft && formatTime(timeLeft)}</div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleProceedToPayment}
            disabled={!selectedStall || !bookingDate}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            ดำเนินการชำระเงิน
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;