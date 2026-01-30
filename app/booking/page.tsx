'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  ArrowLeft,
  Store,
  Users,
  MapPin
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
          
          // Mock: A02 เป็นช่องที่มีคนจองอยู่
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

  // Countdown timer
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
  const handleSelectStall = async (stall: Stall) => {
    if (stall.status === 'booked') return;

    // ถ้ากดช่องสีเหลือง (reserved โดยคนอื่น) → ไปหน้า queue-status เลย
    if (stall.status === 'reserved' && stall.reservedBy !== sessionId) {
      const user = localStorage.getItem('user');
      if (!user) {
        alert('กรุณาเข้าสู่ระบบก่อนเข้าคิว');
        router.push('/login');
        return;
      }

      const userData = JSON.parse(user);

      try {
        // เข้าคิวทันทีโดยไม่ต้องเลือกวันที่
        const response = await fetch('/api/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stallId: stall.number,
            bookingDate: new Date().toISOString().split('T')[0], // วันที่ปัจจุบัน (placeholder)
            userId: userData.id,
            userName: `${userData.firstName} ${userData.lastName}`,
          }),
        });

        if (response.ok) {
          const queueData = await response.json();
          
          // บันทึกข้อมูลช่องที่เข้าคิว
          localStorage.setItem('queuedStall', JSON.stringify({
            stall: stall,
            queueId: queueData.queueId,
            position: queueData.position
          }));

          // ไปหน้า queue-status ทันที
          router.push(
            `/queue-status?queueId=${queueData.queueId}&stallId=${stall.number}`
          );
        } else {
          const errorData = await response.json();
          if (response.status === 409) {
            alert(`คุณอยู่ในคิวสำหรับช่อง ${stall.number} อยู่แล้ว`);
            // ไปหน้า queue-status
            router.push(`/queue-status?stallId=${stall.number}`);
          } else {
            throw new Error(errorData.message);
          }
        }
      } catch (error) {
        console.error('Error joining queue:', error);
        alert('เกิดข้อผิดพลาดในการเข้าคิว กรุณาลองใหม่');
      }
      return;
    }

    // ถ้ากดช่องสีเขียว (available) → จองชั่วคราว
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

  // Proceed to payment (for available stalls)
  const handleProceedToPayment = () => {
    if (!selectedStall) {
      alert('กรุณาเลือกช่องก่อน');
      return;
    }

    // บันทึกข้อมูลการจองชั่วคราว
    localStorage.setItem(
      'pendingBooking',
      JSON.stringify({
        stall: {
          id: selectedStall.id,
          zone: selectedStall.zone,
          number: selectedStall.number,
          price: selectedStall.price,
          size: selectedStall.size,
        },
        sessionId,
        expiresAt: selectedStall.reservedUntil,
      })
    );

    // ไปหน้า payment (ให้เลือกวันที่ที่นั่น)
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
    if (stall.status === 'reserved') return 'bg-yellow-400 hover:bg-yellow-500 cursor-pointer text-slate-800';
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
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">กลับหน้าแรก</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">จองช่องตลาด</h1>
          <p className="text-sm text-slate-600">เลือกช่องที่ต้องการจอง</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 shadow-md border-l-4 border-green-500">
            <div className="text-xl font-bold text-green-600">{availableCount}</div>
            <div className="text-xs text-slate-600">ช่องว่าง</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-md border-l-4 border-red-500">
            <div className="text-xl font-bold text-red-600">{bookedCount}</div>
            <div className="text-xs text-slate-600">จองแล้ว</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-md border-l-4 border-yellow-500">
            <div className="text-xl font-bold text-yellow-600">{reservedCount}</div>
            <div className="text-xs text-slate-600">มีคนจอง</div>
          </div>
        </div>

        {/* Reservation Timer Alert */}
        {selectedStall && timeLeft !== null && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg shadow-md">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-yellow-800">
                  จองที่ <strong>{selectedStall.number}</strong> ชั่วคราว - เหลือเวลา: <strong className="text-base font-bold">{formatTime(timeLeft)}</strong>
                </p>
              </div>
              <button
                onClick={handleReleaseStall}
                className="ml-2 text-xs text-yellow-700 hover:text-yellow-900 underline font-medium"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl p-4 md:p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            เลือกช่องจอด
          </h2>

          {/* Zone Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              กรองตามโซน
            </label>
            <select 
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="all">ทุกโซน</option>
              <option value="A">Zone A - ฿500/วัน (2x2 ม.)</option>
              <option value="B">Zone B - ฿600/วัน (2x3 ม.)</option>
              <option value="C">Zone C - ฿700/วัน (2x3 ม.)</option>
              <option value="D">Zone D - ฿800/วัน (3x3 ม.)</option>
              <option value="E">Zone E - ฿900/วัน (3x4 ม.)</option>
            </select>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-400 border border-green-500 rounded"></div>
              <span className="text-xs text-slate-700 font-medium">ว่าง - กดจองเลย</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 border border-blue-800 rounded"></div>
              <span className="text-xs text-slate-700 font-medium">คุณเลือกอยู่</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-400 border border-yellow-500 rounded"></div>
              <span className="text-xs text-slate-700 font-medium">มีคนจอง - กดเข้าคิว</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-400 border border-red-500 rounded"></div>
              <span className="text-xs text-slate-700 font-medium">เต็ม</span>
            </div>
          </div>

          {/* Booth Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4 max-h-96 overflow-y-auto p-2">
            {filteredStalls.map(stall => (
              <button
                key={stall.id}
                onClick={() => handleSelectStall(stall)}
                disabled={stall.status === 'booked'}
                className={`
                  aspect-square rounded-lg border-2 transition-all
                  ${getStallColor(stall)}
                  ${stall.id === selectedStall?.id ? 'border-blue-900 scale-105 shadow-lg' : 'border-transparent'}
                  disabled:opacity-70
                `}
                title={`${stall.number} - ${stall.price} บาท/วัน - ${
                  stall.status === 'reserved' && stall.reservedBy !== sessionId 
                    ? 'กดเพื่อเข้าคิว' 
                    : stall.status === 'available' 
                    ? 'ว่าง' 
                    : stall.status === 'booked' 
                    ? 'จองแล้ว' 
                    : 'เลือกแล้ว'
                }`}
              >
                <div className="text-xs font-bold">{stall.number}</div>
                {stall.status === 'reserved' && stall.reservedBy !== sessionId && (
                  <div className="text-[9px] mt-0.5">
                    <Users className="w-3 h-3 mx-auto" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Selected Booth Info */}
          {selectedStall && selectedStall.reservedBy === sessionId && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-1 mb-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">ช่องที่เลือก</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-white rounded p-2 shadow-sm">
                  <span className="text-xs text-slate-500">เลขที่</span>
                  <div className="font-bold text-lg text-blue-600">{selectedStall.number}</div>
                </div>
                <div className="bg-white rounded p-2 shadow-sm">
                  <span className="text-xs text-slate-500">โซน</span>
                  <div className="font-bold text-sm text-slate-800">Zone {selectedStall.zone}</div>
                </div>
                <div className="bg-white rounded p-2 shadow-sm">
                  <span className="text-xs text-slate-500">ขนาด</span>
                  <div className="font-bold text-xs text-slate-700">{selectedStall.size}</div>
                </div>
                <div className="bg-white rounded p-2 shadow-sm">
                  <span className="text-xs text-slate-500">ราคา/วัน</span>
                  <div className="font-bold text-sm text-slate-700">฿{selectedStall.price}</div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mb-4">
            <div className="flex">
              <AlertCircle className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">วิธีการจอง:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><strong className="text-green-700">ช่องว่าง (สีเขียว)</strong>: กดเลือก → ไปหน้าชำระเงิน → เลือกวันที่</li>
                  <li><strong className="text-yellow-700">มีคนจอง (สีเหลือง)</strong>: กดเพื่อเข้าคิว → รอจนถึงคิว</li>
                  <li><strong className="text-red-700">จองแล้ว (สีแดง)</strong>: ไม่สามารถจองได้</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {selectedStall && selectedStall.reservedBy === sessionId && (
            <button
              onClick={handleProceedToPayment}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              ไปเลือกวันที่และชำระเงิน
            </button>
          )}

          {!selectedStall && (
            <div className="text-center py-4 text-slate-500 text-sm">
              👆 กรุณาเลือกช่องจากด้านบน
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;