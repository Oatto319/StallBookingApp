'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  Check, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  Upload, 
  CalendarDays, 
  Scan, 
  X, 
  FileCheck, 
  Loader2, 
  RotateCw, 
  XCircle, 
  CheckCircle, 
  Plus,
  MapPin,
  DollarSign,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface BookingData {
  stall: {
    id: string;
    zone: string;
    number: string;
    price: number;
    size: string;
  };
  sessionId: string;
  bookingDate?: string;
  startDate?: string;
  endDate?: string;
  numberOfDays?: number;
  totalPrice?: number;
  bookingDates?: string[];
  pricePerDay?: number;
  expiresAt: string;
  queueId?: string;
}

interface OCRResult {
  success: boolean;
  amount?: number;
  bankName?: string;
  transactionDate?: string;
  transactionTime?: string;
  fromAccount?: string;
  toAccount?: string;
  referenceNo?: string;
  confidence?: number;
  rawText?: string;
  errors?: string[];
}

const PaymentPage = () => {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'creditcard' | 'bank' | 'promptpay'>('promptpay');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [slipPreview, setSlipPreview] = useState<string>('');
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showOCRDetails, setShowOCRDetails] = useState(false);
  const [ocrAttempts, setOcrAttempts] = useState(0);
  const [isOCRVerified, setIsOCRVerified] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);

  // Multiple dates selection
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    slipImage: null as File | null
  });

  // Current step
  const [currentStep, setCurrentStep] = useState(1); // 1: Dates, 2: Contact, 3: Payment

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Get next Saturday
  const getNextSaturday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    return nextSaturday.toISOString().split('T')[0];
  };

  // Check if date is Saturday or Sunday
  const isWeekend = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  useEffect(() => {
    const storedData = localStorage.getItem('pendingBooking');
    if (!storedData) {
      router.push('/booking');
      return;
    }

    const data: BookingData = JSON.parse(storedData);
    const expiresAt = new Date(data.expiresAt);
    const now = new Date();

    if (expiresAt < now) {
      alert('หมดเวลาการจอง กรุณาเลือกที่ใหม่อีกครั้ง');
      localStorage.removeItem('pendingBooking');
      router.push('/booking');
      return;
    }

    setBookingData(data);
    
    // ถ้ามี bookingDates มาจากหน้า booking เดิม ให้ใช้ต่อ
    if (data.bookingDates && data.bookingDates.length > 0) {
      setSelectedDates(data.bookingDates);
      setTotalPrice(data.totalPrice || 0);
    }
    
    setTimeLeft(Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  }, [router]);

  // Calculate total price when dates change
  useEffect(() => {
    if (bookingData && selectedDates.length > 0) {
      const pricePerDay = bookingData.stall.price;
      setTotalPrice(pricePerDay * selectedDates.length);
    } else {
      setTotalPrice(0);
    }
  }, [selectedDates, bookingData]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            alert('หมดเวลาการจอง');
            localStorage.removeItem('pendingBooking');
            router.push('/booking');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    const dates: string[] = [];
    const startDate = new Date(getNextSaturday());

    switch (type) {
      case 'weekend':
        dates.push(startDate.toISOString().split('T')[0]);
        const sunday = new Date(startDate);
        sunday.setDate(startDate.getDate() + 1);
        dates.push(sunday.toISOString().split('T')[0]);
        break;

      case '2weekends':
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

    const uniqueDates = Array.from(new Set([...selectedDates, ...dates])).sort();
    setSelectedDates(uniqueDates);
  };

  // ระบบ OCR - เรียก API จริง
  const processSlipWithOCR = async (file: File): Promise<OCRResult> => {
    setOcrProcessing(true);
    setOcrAttempts(prev => prev + 1);
    
    try {
      const formDataOCR = new FormData();
      formDataOCR.append('slip', file);
      formDataOCR.append('expectedAmount', totalPrice.toString());

      const response = await fetch('/api/ocr/verify-slip', {
        method: 'POST',
        body: formDataOCR
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'ไม่สามารถเชื่อมต่อกับระบบ OCR ได้');
      }

      const result: OCRResult = await response.json();
      return result;

    } catch (error) {
      console.error('OCR Error:', error);
      return {
        success: false,
        confidence: 0,
        errors: [
          error instanceof Error ? error.message : 'ไม่สามารถประมวลผลสลิปได้',
          'กรุณาตรวจสอบว่าไฟล์เป็นสลิปการโอนเงินที่ชัดเจน'
        ]
      };
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setOcrResult(null);
    setIsOCRVerified(false);

    if (file.size > 10 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ไม่เกิน 10MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    setFormData(prev => ({ ...prev, slipImage: file }));
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setSlipPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // ประมวลผล OCR อัตโนมัติ
    const result = await processSlipWithOCR(file);
    setOcrResult(result);

    // ตรวจสอบผลลัพธ์
    if (result.success) {
      const expectedAmount = totalPrice;
      
      if (result.amount === expectedAmount) {
        setIsOCRVerified(true);
        setError('');
      } else if (!result.amount) {
        setIsOCRVerified(false);
        setError('ไม่สามารถอ่านจำนวนเงินจากสลิปได้');
      } else {
        setIsOCRVerified(false);
        setError(`จำนวนเงินไม่ตรงกัน: ต้องการ ฿${expectedAmount.toLocaleString()} แต่ในสลิปเป็น ฿${result.amount.toLocaleString()}`);
      }
    } else {
      setIsOCRVerified(false);
      setError(result.errors?.[0] || 'ไม่สามารถอ่านสลิปได้ กรุณาอัปโหลดภาพที่ชัดเจนกว่า');
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      setError('กรุณากรอกข้อมูลติดต่อให้ครบถ้วน');
      return false;
    }

    if (selectedDates.length === 0) {
      setError('กรุณาเลือกวันที่จองอย่างน้อย 1 วัน');
      return false;
    }

    if (paymentMethod === 'creditcard') {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv) {
        setError('กรุณากรอกข้อมูลบัตรเครดิตให้ครบถ้วน');
        return false;
      }
    }

    if (paymentMethod === 'bank' || paymentMethod === 'promptpay') {
      if (!formData.slipImage) {
        setError('กรุณาอัพโหลดสลิปการโอนเงิน');
        return false;
      }

      if (!isOCRVerified) {
        setError('สลิปยังไม่ผ่านการตรวจสอบ');
        return false;
      }
    }

    return true;
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setProcessing(true);

    try {
      const paymentData = {
        ...formData,
        booking: {
          ...bookingData,
          bookingDates: selectedDates,
          numberOfDays: selectedDates.length,
          totalPrice: totalPrice,
          pricePerDay: bookingData?.stall.price
        },
        paymentMethod,
        ocrResult: ocrResult,
        ocrVerified: isOCRVerified,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'การชำระเงินล้มเหลว');
      }

      const result = await response.json();
      console.log('Payment submitted:', result);

      localStorage.removeItem('pendingBooking');
      router.push('/booking/success?stall=' + bookingData?.stall.number);
    } catch (err) {
      setError('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : 'กรุณาลองใหม่'));
      setProcessing(false);
    }
  };

  const removeSlip = () => {
    setSlipPreview('');
    setFormData(prev => ({ ...prev, slipImage: null }));
    setOcrResult(null);
    setIsOCRVerified(false);
    setError('');
    setOcrAttempts(0);
  };

  const retryOCR = async () => {
    if (!formData.slipImage) return;
    
    setError('');
    setIsOCRVerified(false);
    const result = await processSlipWithOCR(formData.slipImage);
    setOcrResult(result);
    
    if (result.success && result.amount === totalPrice) {
      setIsOCRVerified(true);
      setError('');
    } else {
      setIsOCRVerified(false);
      setError(result.errors?.[0] || 'จำนวนเงินไม่ตรงกัน');
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            กลับ
          </button>
          <h1 className="text-3xl font-bold text-slate-900">ชำระเงิน</h1>
        </div>

        {/* Timer */}
        <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-900">
                เหลือเวลา: <span className="text-xl font-bold">{formatTime(timeLeft)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* OCR Success Banner */}
        {isOCRVerified && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-bold text-green-900">สลิปผ่านการตรวจสอบ</p>
                <p className="text-sm text-green-700">จำนวนเงิน ฿{ocrResult?.amount?.toLocaleString()} ถูกต้อง</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left: Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                สรุปการจอง
              </h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600 text-sm">ช่องที่:</span>
                  <span className="font-bold text-blue-600 text-lg">{bookingData.stall.number}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600 text-sm">โซน:</span>
                  <span className="font-semibold">Zone {bookingData.stall.zone}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600 text-sm block mb-1">ขนาด:</span>
                  <span className="font-medium text-sm">{bookingData.stall.size}</span>
                </div>
              </div>

              {/* Selected Dates */}
              {selectedDates.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      วันที่จอง ({selectedDates.length} วัน)
                    </span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedDates.slice(0, 3).map((date, idx) => (
                      <div key={date} className="text-xs text-slate-700">
                        {idx + 1}. {formatDateThai(date)}
                      </div>
                    ))}
                    {selectedDates.length > 3 && (
                      <div className="text-xs text-blue-600 font-medium">
                        และอีก {selectedDates.length - 3} วัน
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price Calculation */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">ราคา/วัน:</span>
                  <span className="font-semibold">฿{bookingData.stall.price.toLocaleString()}</span>
                </div>
                {selectedDates.length > 0 && (
                  <div className="flex justify-between text-sm text-slate-600 mb-3">
                    <span>× {selectedDates.length} วัน</span>
                    <span>฿{totalPrice.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-400">
                  <span className="font-bold text-slate-900">ยอดชำระ:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ฿{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Bank Info - Collapsible */}
              {(paymentMethod === 'bank' || paymentMethod === 'promptpay') && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowBankInfo(!showBankInfo)}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">ข้อมูลบัญชี</span>
                    </div>
                    {showBankInfo ? (
                      <ChevronUp className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                  
                  {showBankInfo && (
                    <div className="mt-2 p-3 bg-white border border-blue-200 rounded-lg text-sm">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-slate-500">ธนาคาร</p>
                          <p className="font-semibold">กรุงเทพ (BBL)</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">เลขที่บัญชี</p>
                          <p className="font-bold text-blue-600">123-4-56789-0</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">ชื่อบัญชี</p>
                          <p className="font-semibold">บริษัท ตลาดนัด จำกัด</p>
                        </div>
                      </div>
                      {totalPrice > 0 && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs text-red-800">
                            <strong>⚠️ โอนตามยอดเท่านั้น:</strong> ฿{totalPrice.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmitPayment} className="space-y-6">
              
              {/* Step 1: Select Dates */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="font-bold text-lg">เลือกวันที่จอง</h3>
                </div>

                {/* Info */}
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-900">
                    📅 <strong>ตลาดนัด</strong> เปิดทุกวันเสาร์-อาทิตย์
                  </p>
                </div>

                {/* Quick Select */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">จองแบบเร็ว:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAddDates('weekend')}
                      className="px-3 py-2 text-sm bg-blue-50 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      สุดสัปดาห์นี้
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddDates('2weekends')}
                      className="px-3 py-2 text-sm bg-purple-50 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                    >
                      2 สัปดาห์
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddDates('4weekends')}
                      className="px-3 py-2 text-sm bg-green-50 border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                    >
                      4 สัปดาห์
                    </button>
                  </div>
                </div>

                {/* Manual Add */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    หรือเลือกเอง:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      min={getNextSaturday()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddDate}
                      disabled={!newDate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่ม
                    </button>
                  </div>
                </div>

                {/* Selected List */}
                {selectedDates.length > 0 ? (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      เลือกแล้ว ({selectedDates.length} วัน)
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {selectedDates.map((date, idx) => (
                        <div
                          key={date}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded border border-blue-200"
                        >
                          <span className="text-sm font-medium text-slate-800">
                            {idx + 1}. {formatDateThai(date)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDate(date)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ กรุณาเลือกวันที่จองอย่างน้อย 1 วัน
                    </p>
                  </div>
                )}
              </div>

              {/* Step 2: Contact Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="font-bold text-lg">ข้อมูลติดต่อ</h3>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ชื่อ-นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="กรอกชื่อ-นามสกุล"
                      required
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        อีเมล <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="example@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        เบอร์โทร <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0xx-xxx-xxxx"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Payment */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-lg">ชำระเงิน</h3>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('promptpay')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'promptpay'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">PromptPay</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'bank'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">โอนธนาคาร</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('creditcard')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'creditcard'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">บัตรเครดิต</p>
                  </button>
                </div>

                {/* Upload Slip */}
                {(paymentMethod === 'bank' || paymentMethod === 'promptpay') && totalPrice > 0 && (
                  <div>
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Scan className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-900">
                          <p className="font-bold">ระบบตรวจสอบอัตโนมัติ (AI OCR)</p>
                          <p className="mt-1">จำนวนเงินต้องเป็น: <strong className="text-red-600">฿{totalPrice.toLocaleString()}</strong></p>
                        </div>
                      </div>
                    </div>

                    {!slipPreview ? (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors bg-slate-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="slip-upload"
                          disabled={ocrProcessing}
                        />
                        <label htmlFor="slip-upload" className="cursor-pointer">
                          {ocrProcessing ? (
                            <div className="space-y-3">
                              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                              <p className="font-bold text-blue-600">กำลังตรวจสอบ...</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Upload className="w-12 h-12 mx-auto text-slate-400" />
                              <div>
                                <p className="font-bold text-slate-700">คลิกเพื่ออัปโหลดสลิป</p>
                                <p className="text-sm text-slate-500 mt-1">JPG, PNG (ไม่เกิน 10MB)</p>
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Preview */}
                        <div className="relative">
                          <img 
                            src={slipPreview} 
                            alt="Slip" 
                            className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg border-2 border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={removeSlip}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Processing */}
                        {ocrProcessing && (
                          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                            <p className="text-sm font-medium text-blue-900">กำลังตรวจสอบสลิป...</p>
                          </div>
                        )}

                        {/* Result */}
                        {!ocrProcessing && ocrResult && (
                          <div className={`border-2 rounded-lg p-4 ${
                            isOCRVerified ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                          }`}>
                            <div className="flex items-start gap-3">
                              {isOCRVerified ? (
                                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className={`font-bold mb-2 ${
                                  isOCRVerified ? 'text-green-900' : 'text-red-900'
                                }`}>
                                  {isOCRVerified ? '✓ ตรวจสอบผ่าน' : '✗ ไม่ผ่าน'}
                                </p>
                                
                                {ocrResult.success && (
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <p className="text-slate-600">จำนวนในสลิป</p>
                                      <p className={`font-bold ${isOCRVerified ? 'text-green-700' : 'text-red-700'}`}>
                                        ฿{ocrResult.amount?.toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">ยอดที่ต้องชำระ</p>
                                      <p className="font-bold text-blue-700">
                                        ฿{totalPrice.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {!isOCRVerified && (
                                  <button
                                    type="button"
                                    onClick={retryOCR}
                                    className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <RotateCw className="w-3 h-3" />
                                    ลองอีกครั้ง
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Credit Card */}
                {paymentMethod === 'creditcard' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="หมายเลขบัตร"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="MM/YY"
                        required
                      />
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="CVV"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit & Skip Buttons */}
              <div className="space-y-3">
                {/* Main Submit Button */}
                <button
                  type="submit"
                  disabled={
                    processing || 
                    ocrProcessing || 
                    selectedDates.length === 0 || 
                    (paymentMethod !== 'creditcard' && totalPrice > 0 && !isOCRVerified)
                  }
                  className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                    processing || ocrProcessing || selectedDates.length === 0 || 
                    (paymentMethod !== 'creditcard' && totalPrice > 0 && !isOCRVerified)
                      ? 'bg-slate-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                  }`}
                >
                  {processing || ocrProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      ยืนยันชำระ ฿{totalPrice.toLocaleString()}
                    </>
                  )}
                </button>

                {/* Test Complete Button */}
                <button
                  type="button"
                  onClick={() => {
                    // Validate minimum requirements
                    if (!formData.name || !formData.email || !formData.phone) {
                      alert('⚠️ กรุณากรอกข้อมูลติดต่อให้ครบถ้วน');
                      return;
                    }

                    if (selectedDates.length === 0) {
                      alert('⚠️ กรุณาเลือกวันที่จองอย่างน้อย 1 วัน');
                      return;
                    }

                    if (!confirm('🧪 ทดสอบระบบ\n\nจะสร้างการจองแบบทดสอบและบันทึกลงระบบ\n\nข้อมูลจะแสดงใน Admin Dashboard\n\nดำเนินการต่อหรือไม่?')) {
                      return;
                    }

                    try {
                      // Create booking data
                      const bookingId = 'BK' + Date.now();
                      const newBooking = {
                        id: bookingId,
                        stallNumber: bookingData.stall.number,
                        customerName: formData.name,
                        phone: formData.phone,
                        email: formData.email,
                        bookingDate: new Date().toISOString().split('T')[0],
                        startDate: selectedDates[0] || new Date().toISOString().split('T')[0],
                        endDate: selectedDates[selectedDates.length - 1] || new Date().toISOString().split('T')[0],
                        days: selectedDates.length,
                        totalPrice: totalPrice,
                        pricePerDay: bookingData.stall.price,
                        status: 'pending',
                        paymentStatus: 'pending',
                        paymentMethod: paymentMethod,
                        createdAt: new Date().toISOString(),
                        zone: bookingData.stall.zone,
                        size: bookingData.stall.size,
                        bookingDates: selectedDates,
                        isTest: true
                      };

                      // Get existing bookings
                      const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                      
                      // Add new booking
                      existingBookings.push(newBooking);
                      
                      // Save to localStorage
                      localStorage.setItem('bookings', JSON.stringify(existingBookings));
                      
                      // Remove pending booking
                      localStorage.removeItem('pendingBooking');
                      
                      // Redirect to success
                      router.push('/booking/success?stall=' + bookingData.stall.number + '&test=true&bookingId=' + bookingId);
                    } catch (error) {
                      console.error('Error creating test booking:', error);
                      alert('❌ เกิดข้อผิดพลาดในการสร้างการจองทดสอบ');
                    }
                  }}
                  disabled={processing || selectedDates.length === 0 || !formData.name || !formData.email || !formData.phone}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-orange-600"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span>⚡ เสร็จสิ้น (ทดสอบ)</span>
                </button>

                {/* Info about test button */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-800 text-center">
                    💡 <strong>ปุ่มด้านบน</strong> ใช้สำหรับทดสอบระบบ - บันทึกข้อมูลและข้ามการชำระเงิน
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;