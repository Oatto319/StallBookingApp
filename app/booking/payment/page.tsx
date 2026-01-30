'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Building2, Smartphone, Check, Clock, AlertCircle, ArrowLeft, Upload, CalendarDays, Scan, X, FileCheck, Loader2, RotateCw, XCircle, CheckCircle, Plus } from 'lucide-react';

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
      setError("❌ ไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 10MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError("❌ กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG)");
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
        setError('❌ ไม่สามารถอ่านจำนวนเงินจากสลิปได้ กรุณาอัปโหลดสลิปที่ชัดเจนกว่า');
      } else {
        setIsOCRVerified(false);
        const diff = Math.abs((result.amount || 0) - expectedAmount);
        setError(
          `❌ จำนวนเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ\n` +
          `• ยอดที่ต้องชำระ: ฿${expectedAmount.toLocaleString()}\n` +
          `• จำนวนในสลิป: ฿${result.amount.toLocaleString()}\n` +
          `• แตกต่างกัน: ฿${diff.toLocaleString()}\n\n` +
          `กรุณาโอนเงินตามจำนวนที่ถูกต้องและอัปโหลดสลิปใหม่`
        );
      }
    } else {
      setIsOCRVerified(false);
      const errorMsg = result.errors?.join('\n• ') || 'ไม่สามารถอ่านข้อมูลจากสลิปได้';
      setError(
        `❌ ไม่สามารถตรวจสอบสลิปได้\n• ${errorMsg}\n\n` +
        `💡 คำแนะนำ:\n` +
        `• ถ่ายภาพให้ชัดเจน ไม่เบลอ\n` +
        `• มีแสงเพียงพอ ไม่มีเงาบดบัง\n` +
        `• ถ่ายให้เห็นข้อมูลครบถ้วน\n` +
        `• ใช้สลิปจากธนาคารที่รองรับ (ธนาคารไทยทุกธนาคาร)`
      );
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      setError('❌ กรุณากรอกข้อมูลติดต่อให้ครบถ้วน');
      return false;
    }

    if (selectedDates.length === 0) {
      setError('❌ กรุณาเลือกวันที่จองอย่างน้อย 1 วัน');
      return false;
    }

    if (paymentMethod === 'creditcard') {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv) {
        setError('❌ กรุณากรอกข้อมูลบัตรเครดิตให้ครบถ้วน');
        return false;
      }
    }

    if (paymentMethod === 'bank' || paymentMethod === 'promptpay') {
      if (!formData.slipImage) {
        setError('❌ กรุณาอัพโหลดสลิปการโอนเงิน');
        return false;
      }

      if (!ocrResult || !ocrResult.success) {
        setError('❌ ไม่สามารถตรวจสอบสลิปได้ กรุณาอัปโหลดสลิปที่ชัดเจนกว่า');
        return false;
      }

      if (!isOCRVerified) {
        setError('❌ สลิปยังไม่ผ่านการตรวจสอบ กรุณาอัปโหลดสลิปที่มีจำนวนเงินถูกต้อง');
        return false;
      }

      if (ocrResult.amount !== totalPrice) {
        setError(`❌ จำนวนเงินไม่ตรงกัน (ต้องการ: ฿${totalPrice.toLocaleString()}, ในสลิป: ฿${ocrResult.amount?.toLocaleString() || '0'})`);
        return false;
      }

      if ((ocrResult.confidence || 0) < 0.7) {
        setError(`❌ ความชัดเจนของสลิปไม่เพียงพอ (${((ocrResult.confidence || 0) * 100).toFixed(0)}%) กรุณาอัปโหลดสลิปที่ชัดเจนกว่า`);
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
      setError('❌ เกิดข้อผิดพลาดในการชำระเงิน: ' + (err instanceof Error ? err.message : 'กรุณาลองใหม่อีกครั้ง'));
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
    
    if (result.success) {
      const expectedAmount = totalPrice;
      
      if (result.amount === expectedAmount) {
        setIsOCRVerified(true);
        setError('');
      } else if (!result.amount) {
        setIsOCRVerified(false);
        setError('❌ ไม่สามารถอ่านจำนวนเงินจากสลิปได้ กรุณาอัปโหลดสลิปที่ชัดเจนกว่า');
      } else {
        setIsOCRVerified(false);
        const diff = Math.abs((result.amount || 0) - expectedAmount);
        setError(
          `❌ จำนวนเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ\n` +
          `• ยอดที่ต้องชำระ: ฿${expectedAmount.toLocaleString()}\n` +
          `• จำนวนในสลิป: ฿${result.amount.toLocaleString()}\n` +
          `• แตกต่างกัน: ฿${diff.toLocaleString()}\n\n` +
          `กรุณาโอนเงินตามจำนวนที่ถูกต้องและอัปโหลดสลิปใหม่`
        );
      }
    } else {
      setIsOCRVerified(false);
      const errorMsg = result.errors?.join('\n• ') || 'ไม่สามารถอ่านข้อมูลจากสลิปได้';
      setError(
        `❌ ไม่สามารถตรวจสอบสลิปได้\n• ${errorMsg}\n\n` +
        `💡 คำแนะนำ:\n` +
        `• ถ่ายภาพให้ชัดเจน ไม่เบลอ\n` +
        `• มีแสงเพียงพอ ไม่มีเงาบดบัง\n` +
        `• ถ่ายให้เห็นข้อมูลครบถ้วน\n` +
        `• ใช้สลิปจากธนาคารที่รองรับ (ธนาคารไทยทุกธนาคาร)`
      );
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            กลับ
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ชำระเงิน</h1>
          <p className="text-slate-600">เลือกวันที่จองและชำระเงินภายในเวลาที่กำหนด</p>
        </div>

        {/* OCR Status Banner */}
        {isOCRVerified && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-7 w-7 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-green-800 text-lg">✓ สลิปผ่านการตรวจสอบแล้ว</p>
                <p className="text-sm text-green-700">
                  จำนวนเงิน ฿{ocrResult?.amount?.toLocaleString()} ถูกต้อง - พร้อมชำระเงิน
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timer Alert */}
        <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg shadow-md">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-orange-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                เหลือเวลา: <strong className="text-xl font-bold">{formatTime(timeLeft)}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Side - Booking Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h3 className="font-bold text-lg text-slate-800 mb-4">สรุปการจอง</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">ช่องที่:</span>
                  <span className="font-bold text-blue-600">{bookingData.stall.number}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">โซน:</span>
                  <span className="font-bold">Zone {bookingData.stall.zone}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">ขนาด:</span>
                  <span className="font-bold text-sm">{bookingData.stall.size}</span>
                </div>
                
                {/* Booking Dates List */}
                {selectedDates.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDays className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-700 font-medium">วันที่จอง ({selectedDates.length} วัน):</span>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {selectedDates.map((date, idx) => (
                        <div key={date} className="text-sm flex items-center gap-2 py-1">
                          <span className="text-blue-600 font-bold">#{idx + 1}</span>
                          <span className="text-slate-700">{formatDateThai(date)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">ราคาต่อวัน:</span>
                    <span className="font-bold">฿{bookingData.stall.price.toLocaleString()}</span>
                  </div>
                  {selectedDates.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">คำนวณ:</span>
                      <span className="text-slate-700">
                        ฿{bookingData.stall.price.toLocaleString()} × {selectedDates.length} วัน
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-slate-200 pt-3">
                  <div className="flex justify-between text-xl p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 shadow-md">
                    <span className="text-slate-800 font-bold">ยอดชำระรวม:</span>
                    <span className="font-bold text-green-600">
                      ฿{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Account Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                ข้อมูลบัญชีสำหรับโอนเงิน
              </h3>
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600">ธนาคาร:</p>
                      <p className="font-bold text-slate-800">กรุงเทพ (BBL)</p>
                    </div>
                    <div>
                      <p className="text-slate-600">สาขา:</p>
                      <p className="font-bold text-slate-800">สาขาหลัก</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-600">เลขที่บัญชี:</p>
                      <p className="font-bold text-blue-600 text-lg">123-4-56789-0</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-600">ชื่อบัญชี:</p>
                      <p className="font-bold text-slate-800">บริษัท ตลาดนัด จำกัด</p>
                    </div>
                  </div>
                </div>
                {totalPrice > 0 && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <strong>⚠️ สำคัญมาก:</strong> โอนตามยอดที่แสดงเท่านั้น{' '}
                      <strong className="text-red-900 text-base">฿{totalPrice.toLocaleString()}</strong>
                      <br />
                      <span className="text-xs">ระบบจะตรวจสอบจำนวนเงินอัตโนมัติด้วย AI - หากไม่ตรงจะไม่สามารถชำระได้</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Date Selection & Form */}
          <div>
            <form onSubmit={handleSubmitPayment} className="space-y-6">
              
              {/* Date Selection */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  เลือกวันที่จอง
                  <span className="text-red-500">*</span>
                </h3>

                {/* Weekend Only Notice */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-purple-800">
                    <strong>📅 ตลาดนัดถนนคนเดิน</strong> เปิดทุกวันเสาร์-อาทิตย์เท่านั้น
                  </p>
                </div>

                {/* Quick Add Buttons */}
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
                      className="flex-1 px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddDate}
                      disabled={!newDate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่ม
                    </button>
                  </div>
                </div>

                {/* Selected Dates List */}
                {selectedDates.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      วันที่เลือก ({selectedDates.length} วัน)
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedDates.map((date, index) => (
                        <div
                          key={date}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-blue-200"
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

                {selectedDates.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ กรุณาเลือกวันที่จองอย่างน้อย 1 วัน
                    </p>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">ข้อมูลติดต่อ</h3>
                <div className="space-y-4">
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

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">วิธีการชำระเงิน</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('promptpay')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'promptpay'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className="h-8 w-8 mx-auto mb-2 text-blue-600" />
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
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
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
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">บัตรเครดิต</p>
                  </button>
                </div>
              </div>

              {/* Upload Slip with OCR */}
              {(paymentMethod === 'bank' || paymentMethod === 'promptpay') && totalPrice > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-slate-700 font-bold">
                      <Scan className="w-5 h-5 text-blue-600" />
                      อัปโหลดสลิปการโอนเงิน
                      <span className="text-red-500">*</span>
                    </label>
                    {ocrAttempts > 0 && (
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                        ครั้งที่: {ocrAttempts}
                      </span>
                    )}
                  </div>
                  
                  {/* OCR Info */}
                  <div className="mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <Scan className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-bold">🤖 ระบบตรวจสอบอัตโนมัติด้วย AI OCR</p>
                        <p className="mt-1">✓ อ่านและตรวจสอบจำนวนเงินจากสลิปอัตโนมัติ</p>
                        <p className="text-red-700 font-semibold mt-1">
                          ⚠️ จำนวนเงินต้องตรงกับยอดชำระ: ฿{totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!slipPreview ? (
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-blue-400 transition-all cursor-pointer bg-slate-50 border-slate-300">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="slip-upload"
                        disabled={ocrProcessing}
                      />
                      <label htmlFor="slip-upload" className="cursor-pointer">
                        <div className="space-y-3">
                          {ocrProcessing ? (
                            <>
                              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                              <p className="font-bold text-blue-600">🔍 กำลังอ่านสลิป...</p>
                              <p className="text-xs text-blue-500">กำลังใช้ AI ตรวจสอบ กรุณารอสักครู่</p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-12 h-12 mx-auto text-slate-400" />
                              <div>
                                <p className="font-bold text-slate-700">📸 คลิกเพื่ออัปโหลดสลิป</p>
                                <p className="text-xs text-slate-500 mt-1">JPG, PNG (ไม่เกิน 10MB)</p>
                                {totalPrice > 0 && (
                                  <p className="text-xs text-red-600 font-medium mt-2">
                                    จำนวนเงินต้องเป็น ฿{totalPrice.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Preview */}
                      <div className="relative">
                        <img 
                          src={slipPreview} 
                          alt="Payment Slip" 
                          className="max-w-full max-h-80 mx-auto rounded-xl shadow-lg border-4 border-slate-200"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            type="button"
                            onClick={removeSlip}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {ocrResult && !ocrProcessing && (
                          <button
                            type="button"
                            onClick={retryOCR}
                            className="absolute bottom-2 right-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 shadow-lg flex items-center gap-1 text-sm"
                          >
                            <RotateCw className="w-3 h-3" />
                            อ่านใหม่
                          </button>
                        )}
                      </div>

                      {/* Processing */}
                      {ocrProcessing && (
                        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            <div className="flex-1">
                              <p className="font-bold text-blue-800">🔍 กำลังวิเคราะห์สลิป...</p>
                              <p className="text-xs text-blue-600 mt-1">AI กำลังอ่านและตรวจสอบข้อมูล</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* OCR Result */}
                      {!ocrProcessing && ocrResult && (
                        <div className={`border-2 rounded-xl p-4 ${
                          isOCRVerified
                            ? 'bg-green-50 border-green-400'
                            : 'bg-red-50 border-red-400'
                        }`}>
                          <div className="flex items-start gap-3">
                            {isOCRVerified ? (
                              <FileCheck className="w-7 h-7 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-7 h-7 text-red-600 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className={`font-bold text-lg mb-2 ${
                                isOCRVerified ? 'text-green-800' : 'text-red-800'
                              }`}>
                                {isOCRVerified ? '✓ ตรวจสอบผ่าน!' : '✗ ตรวจสอบไม่ผ่าน'}
                              </p>
                              
                              {ocrResult.success && (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className={`p-2 rounded border ${
                                      isOCRVerified ? 'bg-white border-green-300' : 'bg-white border-red-300'
                                    }`}>
                                      <p className="text-xs text-slate-600">จำนวนในสลิป</p>
                                      <p className={`font-bold text-lg ${
                                        isOCRVerified ? 'text-green-700' : 'text-red-700'
                                      }`}>
                                        ฿{ocrResult.amount?.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded border border-blue-300">
                                      <p className="text-xs text-slate-600">ยอดที่ต้องชำระ</p>
                                      <p className="font-bold text-blue-700 text-lg">
                                        ฿{totalPrice.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>

                                  {isOCRVerified ? (
                                    <div className="bg-green-100 border border-green-400 rounded p-2 flex items-center gap-2">
                                      <Check className="w-5 h-5 text-green-700" />
                                      <div>
                                        <p className="text-xs font-bold text-green-800">
                                          จำนวนเงินถูกต้อง - พร้อมชำระ
                                        </p>
                                        {ocrResult.bankName && (
                                          <p className="text-xs text-green-700">
                                            {ocrResult.bankName} • {ocrResult.transactionDate}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-red-100 border border-red-400 rounded p-2">
                                      <p className="text-xs font-bold text-red-800">
                                        จำนวนเงินไม่ถูกต้อง - กรุณาโอนใหม่
                                      </p>
                                    </div>
                                  )}

                                  {showOCRDetails && ocrResult.referenceNo && (
                                    <div className="bg-white rounded border p-2 text-xs">
                                      <p><strong>เลขอ้างอิง:</strong> {ocrResult.referenceNo}</p>
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setShowOCRDetails(!showOCRDetails)}
                                    className="w-full text-xs text-blue-600 font-medium py-1 hover:underline"
                                  >
                                    {showOCRDetails ? '▲ ซ่อน' : '▼ แสดง'}รายละเอียด
                                  </button>
                                </div>
                              )}

                              {!ocrResult.success && ocrResult.errors && (
                                <div className="text-xs text-red-700 space-y-1">
                                  {ocrResult.errors.slice(0, 2).map((err, i) => (
                                    <p key={i}>• {err}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Credit Card Form */}
              {paymentMethod === 'creditcard' && (
                <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      หมายเลขบัตร <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        วันหมดอายุ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        CVV <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="123"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 whitespace-pre-line font-medium">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={processing || ocrProcessing || selectedDates.length === 0 || (paymentMethod !== 'creditcard' && totalPrice > 0 && !isOCRVerified)}
                  className={`flex-1 font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 text-white text-lg ${
                    processing || ocrProcessing || selectedDates.length === 0 || (paymentMethod !== 'creditcard' && totalPrice > 0 && !isOCRVerified)
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                  }`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin h-6 w-6" />
                      กำลังดำเนินการ...
                    </>
                  ) : ocrProcessing ? (
                    <>
                      <Loader2 className="animate-spin h-6 w-6" />
                      กำลังตรวจสอบสลิป...
                    </>
                  ) : selectedDates.length === 0 ? (
                    <>
                      <AlertCircle className="h-6 w-6" />
                      กรุณาเลือกวันที่จอง
                    </>
                  ) : !isOCRVerified && paymentMethod !== 'creditcard' && totalPrice > 0 ? (
                    <>
                      <AlertCircle className="h-6 w-6" />
                      กรุณาอัปโหลดสลิปที่ถูกต้อง
                    </>
                  ) : (
                    <>
                      <Check className="h-6 w-6" />
                      ยืนยันชำระเงิน ฿{totalPrice.toLocaleString()}
                    </>
                  )}
                </button>

                {/* Skip Payment Button */}
                <button
                  type="button"
                  onClick={() => {
                    router.push('/booking/success');
                  }}
                  disabled={processing}
                  className="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="ข้ามการชำระเงินและไปหน้าสำเร็จ"
                >
                  ⏭️ ข้าม
                </button>
              </div>

              {/* Warning */}
              {selectedDates.length === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3">
                  <p className="text-xs text-yellow-800 text-center">
                    <strong>⚠️ กรุณาเลือกวันที่จอง</strong><br />
                    เลือกวันที่จากด้านบนเพื่อดำเนินการต่อ
                  </p>
                </div>
              )}

              {(paymentMethod === 'bank' || paymentMethod === 'promptpay') && totalPrice > 0 && !isOCRVerified && selectedDates.length > 0 && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-3">
                  <p className="text-xs text-orange-800 text-center">
                    <strong>⚠️ ยังไม่สามารถชำระได้</strong><br />
                    กรุณาอัปโหลดสลิปที่มีจำนวนเงิน{' '}
                    <strong>฿{totalPrice.toLocaleString()}</strong>
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;