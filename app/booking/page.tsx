'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  ArrowLeft,
  Store,
  DollarSign,
  CalendarDays,
  X,
  Plus
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
  
  // Multiple dates selection
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Get next Saturday
  const getNextSaturday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    return nextSaturday.toISOString().split('T')[0];
  };

  // Check if date is Saturday or Sunday
  const isWeekend = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

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

  // Calculate total price when dates or stall changes
  useEffect(() => {
    if (selectedStall && selectedDates.length > 0) {
      setTotalPrice(selectedStall.price * selectedDates.length);
    } else {
      setTotalPrice(0);
    }
  }, [selectedDates, selectedStall]);

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
    setSelectedDates([]);
    setNewDate('');
  };

  // Add new date
  const handleAddDate = () => {
    if (!newDate) {
      alert('กรุณาเลือกวันที่');
      return;
    }

    if (!isWeekend(newDate)) {
      alert('⚠️ กรุณาเลือกวันเสาร์หรืออาทิตย์เท่านั้น\n(ตลาดนัดถนนคนเดินเปิดทุกวันเสาร์-อาทิตย์)');
      return;
    }

    if (selectedDates.includes(newDate)) {
      alert('วันที่นี้ถูกเลือกแล้ว');
      return;
    }

    setSelectedDates(prev => [...prev, newDate].sort());
    setNewDate('');
  };

  // Remove date
  const handleRemoveDate = (dateToRemove: string) => {
    setSelectedDates(prev => prev.filter(d => d !== dateToRemove));
  };

  // Quick add multiple dates
  const handleQuickAddDates = (type: 'weekend' | '2weekends' | '4weekends') => {
    if (!selectedStall) {
      alert('กรุณาเลือกช่องก่อน');
      return;
    }

    const dates: string[] = [];
    const startDate = new Date(getNextSaturday());

    switch (type) {
      case 'weekend':
        // This weekend (Sat + Sun)
        dates.push(startDate.toISOString().split('T')[0]);
        const sunday = new Date(startDate);
        sunday.setDate(startDate.getDate() + 1);
        dates.push(sunday.toISOString().split('T')[0]);
        break;

      case '2weekends':
        // 2 weekends (4 days)
        for (let week = 0; week < 2; week++) {
          const sat = new Date(startDate);
          sat.setDate(startDate.getDate() + (week * 7));
          dates.push(sat.toISOString().split('T')[0]);
          
          const sun = new Date(sat);
          sun.setDate(sat.getDate() + 1);
          dates.push(sun.toISOString().split('T')[0]);
        }
        break;

      case '4weekends':
        // 4 weekends (8 days)
        for (let week = 0; week < 4; week++) {
          const sat = new Date(startDate);
          sat.setDate(startDate.getDate() + (week * 7));
          dates.push(sat.toISOString().split('T')[0]);
          
          const sun = new Date(sat);
          sun.setDate(sat.getDate() + 1);
          dates.push(sun.toISOString().split('T')[0]);
        }
        break;
    }

    // Merge with existing dates and remove duplicates
    const uniqueDates = Array.from(new Set([...selectedDates, ...dates])).sort();
    setSelectedDates(uniqueDates);
  };

  const formatDateThai = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const dayName = dayNames[date.getDay()];
    return dayName + ' ' + date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Proceed to payment
  const handleProceedToPayment = () => {
    if (!selectedStall || selectedDates.length === 0) {
      alert('กรุณาเลือกช่องและวันที่จอง');
      return;
    }
    
    localStorage.setItem('pendingBooking', JSON.stringify({
      stall: {
        ...selectedStall,
        price: totalPrice
      },
      sessionId,
      bookingDates: selectedDates,
      numberOfDays: selectedDates.length,
      totalPrice,
      pricePerDay: selectedStall.price,
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
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">กลับหน้าแรก</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">จองช่องตลาด</h1>
          <p className="text-sm text-slate-600">เลือกช่องและระบุวันที่ต้องการจอง (เลือกได้หลายวัน)</p>
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
            <div className="text-xs text-slate-600">กำลังจอง</div>
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
            เลือกช่องและวันที่จอง
          </h2>

          {/* Filters and Date Selection */}
          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-1 gap-4">
              {/* Zone Filter */}
              <div>
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

              {/* Multiple Date Picker */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-base text-slate-800">เลือกวันที่จอง (หลายวัน)</h3>
                </div>
                
                {/* Weekend Only Notice */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-purple-800">
                    <strong>📅 ตลาดนัดถนนคนเดิน</strong> เปิดทุกวันเสาร์-อาทิตย์เท่านั้น
                  </p>
                </div>

                {/* Quick Add Buttons */}
                {selectedStall && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">📅 จองแบบด่วน:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAddDates('weekend')}
                        className="px-3 py-2 text-sm font-medium bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-all"
                      >
                        สุดสัปดาห์นี้
                        <div className="text-xs text-slate-600">(2 วัน)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAddDates('2weekends')}
                        className="px-3 py-2 text-sm font-medium bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 hover:border-purple-400 transition-all"
                      >
                        2 สุดสัปดาห์
                        <div className="text-xs text-slate-600">(4 วัน)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAddDates('4weekends')}
                        className="px-3 py-2 text-sm font-medium bg-white border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-100 hover:border-green-400 transition-all"
                      >
                        4 สุดสัปดาห์
                        <div className="text-xs text-slate-600">(8 วัน)</div>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Add Date Input */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    เพิ่มวันที่จอง <span className="text-purple-600">(เสาร์-อาทิตย์)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      min={getNextSaturday()}
                      disabled={!selectedStall}
                      className="flex-1 px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddDate}
                      disabled={!selectedStall || !newDate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่ม
                    </button>
                  </div>
                  {!selectedStall && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ เลือกช่องก่อน</p>
                  )}
                </div>

                {/* Selected Dates List */}
                {selectedDates.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border-2 border-blue-200">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      วันที่เลือก ({selectedDates.length} วัน)
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedDates.map((date, index) => (
                        <div
                          key={date}
                          className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 bg-blue-200 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium text-slate-800">
                              {formatDateThai(date)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDate(date)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Date & Price Summary */}
            {selectedStall && selectedDates.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">จำนวนวันที่จอง</p>
                    <p className="text-3xl font-bold text-blue-600">{selectedDates.length}</p>
                    <p className="text-xs text-slate-600">วัน</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600 mb-1">ราคารวมทั้งหมด</p>
                    <p className="text-3xl font-bold text-green-600">฿{totalPrice.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      ({selectedStall.price.toLocaleString()} บาท × {selectedDates.length} วัน)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-400 border border-green-500 rounded"></div>
              <span className="text-xs text-slate-700">ว่าง</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-600 border border-blue-800 rounded"></div>
              <span className="text-xs text-slate-700">เลือกแล้ว</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-400 border border-yellow-500 rounded"></div>
              <span className="text-xs text-slate-700">จองโดยคนอื่น</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-400 border border-red-500 rounded"></div>
              <span className="text-xs text-slate-700">เต็ม</span>
            </div>
          </div>

          {/* Booth Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4 max-h-96 overflow-y-auto p-2">
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
                title={`${stall.number} - ${stall.price} บาท/วัน`}
              >
                <div className="text-xs font-bold">{stall.number}</div>
              </button>
            ))}
          </div>

          {/* Selected Booth Info */}
          {selectedStall && (
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
          {!selectedStall && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mb-4">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">วิธีการจอง:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>เลือกช่องที่ต้องการจากด้านล่าง</li>
                    <li>เลือกวันที่จอง (สามารถเลือกได้หลายวัน ไม่ต้องติดกัน)</li>
                    <li>ตรวจสอบราคาและจำนวนวัน</li>
                    <li>กดปุ่มชำระเงิน</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleProceedToPayment}
            disabled={!selectedStall || selectedDates.length === 0 || totalPrice === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            {totalPrice > 0 ? `ชำระเงิน ฿${totalPrice.toLocaleString()} (${selectedDates.length} วัน)` : 'กรุณาเลือกช่องและวันที่'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;