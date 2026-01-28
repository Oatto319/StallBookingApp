'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Building2, Smartphone, Check, Clock, AlertCircle, ArrowLeft, Upload, ImageIcon, TestTube, CalendarDays, Scan, X, FileCheck, Loader2, ZoomIn, RotateCw, Info } from 'lucide-react';

interface BookingData {
  stall: {
    id: string;
    zone: string;
    number: string;
    price: number;
    size: string;
  };
  sessionId: string;
  bookingDate: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  totalPrice: number;
  bookingDates: string[];
  pricePerDay: number;
  expiresAt: string;
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

const ImprovedPaymentPage = () => {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'creditcard' | 'bank' | 'promptpay'>('promptpay');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [slipPreview, setSlipPreview] = useState<string>('');
  const [testMode, setTestMode] = useState(true);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showOCRDetails, setShowOCRDetails] = useState(false);
  const [ocrAttempts, setOcrAttempts] = useState(0);
  const [showRawText, setShowRawText] = useState(false);

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
    setTimeLeft(Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  }, [router]);

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
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ระบบ OCR ที่ปรับปรุงแล้ว
  const processSlipWithOCR = async (file: File): Promise<OCRResult> => {
    setOcrProcessing(true);
    setOcrAttempts(prev => prev + 1);
    
    try {
      // สร้าง FormData สำหรับส่งไฟล์
      const formDataOCR = new FormData();
      formDataOCR.append('slip', file);
      formDataOCR.append('expectedAmount', bookingData?.totalPrice.toString() || '0');
      formDataOCR.append('testMode', testMode.toString());

      // ในโหมดทดสอบ: จำลองผลลัพธ์ OCR ที่สมจริง
      if (testMode) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // จำลองการประมวลผล
        
        const mockResult: OCRResult = {
          success: true,
          amount: bookingData?.totalPrice || 1000,
          bankName: 'ธนาคารกรุงเทพ',
          transactionDate: new Date().toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          transactionTime: new Date().toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          fromAccount: '123-4-56789-0',
          toAccount: '987-6-54321-0',
          referenceNo: `REF${Date.now()}`,
          confidence: 0.92,
          rawText: `ธนาคารกรุงเทพ\nใบโอนเงิน\nจำนวนเงิน ${bookingData?.totalPrice.toLocaleString()} บาท\nวันที่ ${new Date().toLocaleDateString('th-TH')}\nเวลา ${new Date().toLocaleTimeString('th-TH')}`,
          errors: []
        };
        
        return mockResult;
      }

      // โหมดจริง: เรียก API OCR
      const response = await fetch('/api/ocr/verify-slip', {
        method: 'POST',
        body: formDataOCR
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR processing failed');
      }

      const result: OCRResult = await response.json();
      return result;

    } catch (error) {
      console.error('OCR Error:', error);
      return {
        success: false,
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'ไม่สามารถประมวลผลได้']
      };
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // รีเซ็ตสถานะเก่า
    setError('');
    setOcrResult(null);

    // ตรวจสอบขนาดไฟล์
    if (file.size > 10 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 10MB");
      return;
    }

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG)");
      return;
    }

    setFormData(prev => ({ ...prev, slipImage: file }));
    
    // แสดงตัวอย่างรูปภาพ
    const reader = new FileReader();
    reader.onloadend = () => {
      setSlipPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // ประมวลผล OCR อัตโนมัติ
    const result = await processSlipWithOCR(file);
    setOcrResult(result);

    // แสดงผลลัพธ์
    if (result.success) {
      const expectedAmount = bookingData?.totalPrice || 0;
      if (result.amount === expectedAmount) {
        // ความสำเร็จ
        setError('');
      } else {
        const diff = Math.abs((result.amount || 0) - expectedAmount);
        setError(`⚠️ จำนวนเงินไม่ตรงกับยอดชำระ (ต่างกัน ฿${diff.toLocaleString()})`);
      }
    } else {
      const errorMsg = result.errors?.join(', ') || 'ไม่สามารถอ่านข้อมูลจากสลิปได้';
      if (testMode) {
        setError(`⚠️ ${errorMsg} (โหมดทดสอบ - สามารถดำเนินการต่อได้)`);
      } else {
        setError(`❌ ${errorMsg} - กรุณาอัปโหลดสลิปใหม่ที่ชัดเจนกว่า`);
      }
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return false;
    }

    if (paymentMethod === 'creditcard') {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv) {
        setError('กรุณากรอกข้อมูลบัตรเครดิตให้ครบถ้วน');
        return false;
      }
    }

    // ตรวจสอบการอัปโหลดสลิป
    if (paymentMethod === 'bank' || paymentMethod === 'promptpay') {
      if (!formData.slipImage) {
        setError('กรุณาอัพโหลดสลิปการโอนเงิน');
        return false;
      }

      // ในโหมดจริง: ต้องผ่าน OCR
      if (!testMode) {
        if (!ocrResult || !ocrResult.success) {
          setError('ไม่สามารถตรวจสอบสลิปได้ กรุณาอัปโหลดสลิปที่ชัดเจน');
          return false;
        }

        // ตรวจสอบจำนวนเงิน
        const expectedAmount = bookingData?.totalPrice || 0;
        if (ocrResult.amount !== expectedAmount) {
          setError(`จำนวนเงินไม่ตรงกับยอดชำระ (สลิป: ฿${ocrResult.amount?.toLocaleString()}, ยอดชำระ: ฿${expectedAmount.toLocaleString()})`);
          return false;
        }

        // ตรวจสอบความมั่นใจของ OCR
        if ((ocrResult.confidence || 0) < 0.6) {
          setError('ความชัดเจนของสลิปไม่เพียงพอ กรุณาอัปโหลดสลิปที่ชัดเจนกว่า');
          return false;
        }
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
        booking: bookingData,
        paymentMethod,
        testMode,
        ocrResult: ocrResult,
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
        throw new Error('Payment processing failed');
      }

      const result = await response.json();
      console.log('Payment submitted:', result);

      localStorage.removeItem('pendingBooking');
      router.push('/booking/success?stall=' + bookingData?.stall.number);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง');
      setProcessing(false);
    }
  };

  const removeSlip = () => {
    setSlipPreview('');
    setFormData(prev => ({ ...prev, slipImage: null }));
    setOcrResult(null);
    setError('');
    setOcrAttempts(0);
  };

  const retryOCR = async () => {
    if (!formData.slipImage) return;
    
    setError('');
    const result = await processSlipWithOCR(formData.slipImage);
    setOcrResult(result);
  };

  // คำนวณ confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBgColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-50 border-green-300';
    if (confidence >= 0.6) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
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
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            กลับ
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ชำระเงิน</h1>
          <p className="text-slate-600">กรุณาชำระเงินภายในเวลาที่กำหนด</p>
        </div>

        {/* Test Mode Toggle */}
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TestTube className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-bold text-purple-800">โหมดทดสอบระบบ OCR</p>
                <p className="text-sm text-purple-600">
                  {testMode 
                    ? '✓ เปิดใช้งาน - จำลองการอ่านสลิป (ไม่ต้องใช้สลิปจริง)' 
                    : '✓ ปิดใช้งาน - ใช้ OCR จริง ต้องอัปโหลดสลิปที่ชัดเจน'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTestMode(!testMode)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                testMode ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  testMode ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Timer Alert */}
        <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-orange-600 mr-3" />
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
                
                <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700 font-medium">ช่วงเวลาจอง:</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">เริ่ม:</span>
                      <span className="font-bold text-slate-800">{formatDateThai(bookingData.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">สิ้นสุด:</span>
                      <span className="font-bold text-slate-800">{formatDateThai(bookingData.endDate)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-slate-600">จำนวนวัน:</span>
                      <span className="font-bold text-blue-600">{bookingData.numberOfDays} วัน</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">ราคาต่อวัน:</span>
                    <span className="font-bold">฿{bookingData.pricePerDay?.toLocaleString() || bookingData.stall.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">คำนวณ:</span>
                    <span className="text-slate-700">
                      ฿{bookingData.pricePerDay?.toLocaleString() || bookingData.stall.price} × {bookingData.numberOfDays} วัน
                    </span>
                  </div>
                </div>

                <div className="border-t-2 border-slate-200 pt-3">
                  <div className="flex justify-between text-xl p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <span className="text-slate-800 font-bold">ยอดชำระรวม:</span>
                    <span className="font-bold text-green-600">
                      ฿{(bookingData.totalPrice || bookingData.stall.price).toLocaleString()}
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
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
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
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ สำคัญ:</strong> โอนตามยอดที่แสดงด้านบนเท่านั้น และอัปโหลดสลิปด้านขวา
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form & Upload */}
          <div>
            <form onSubmit={handleSubmitPayment} className="space-y-6">
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
                        ? 'border-blue-500 bg-blue-50'
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
                        ? 'border-blue-500 bg-blue-50'
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
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">บัตรเครดิต</p>
                  </button>
                </div>
              </div>

              {/* Upload Slip with Enhanced OCR */}
              {(paymentMethod === 'bank' || paymentMethod === 'promptpay') && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-slate-700 font-bold">
                      <Scan className="w-5 h-5 text-blue-600" />
                      อัปโหลดสลิปการโอนเงิน
                      <span className="text-red-500">*</span>
                    </label>
                    {ocrAttempts > 0 && (
                      <span className="text-xs text-slate-500">
                        ครั้งที่ {ocrAttempts}
                      </span>
                    )}
                  </div>
                  
                  {/* OCR Info Banner */}
                  <div className="mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800 space-y-1">
                        <p className="font-bold">💡 ระบบ OCR อัตโนมัติ (Optical Character Recognition)</p>
                        <p>✓ รองรับทุกธนาคารในไทย (กรุงเทพ, กสิกรไทย, ไทยพาณิชย์, กรุงไทย, ฯลฯ)</p>
                        <p>✓ อ่านข้อมูลจากสลิปอัตโนมัติ: จำนวนเงิน, ธนาคาร, วันที่-เวลา</p>
                        <p className="text-yellow-700">⚠️ สำหรับความแม่นยำสูงสุด: ถ่ายภาพให้ชัดเจน ไม่เบลอ มีแสงเพียงพอ</p>
                      </div>
                    </div>
                  </div>

                  {!slipPreview ? (
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center hover:border-blue-500 transition-all cursor-pointer ${
                      testMode ? 'bg-purple-50 border-purple-300' : 'bg-slate-50 border-slate-300'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="slip-upload"
                        disabled={ocrProcessing}
                      />
                      <label htmlFor="slip-upload" className="cursor-pointer">
                        <div className="space-y-4">
                          {ocrProcessing ? (
                            <>
                              <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
                              <div className="space-y-2">
                                <p className="font-bold text-blue-600 text-lg">กำลังประมวลผล OCR...</p>
                                <p className="text-sm text-blue-500">ระบบกำลังอ่านข้อมูลจากสลิป กรุณารอสักครู่</p>
                                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                  <span>●</span>
                                  <span>กำลังปรับภาพ</span>
                                  <span>●</span>
                                  <span>อ่านข้อความ</span>
                                  <span>●</span>
                                  <span>ตรวจสอบข้อมูล</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <Upload className={`w-16 h-16 mx-auto ${testMode ? 'text-purple-400' : 'text-slate-400'}`} />
                              <div>
                                <p className={`font-bold text-lg mb-1 ${testMode ? 'text-purple-600' : 'text-slate-700'}`}>
                                  📸 คลิกเพื่ออัปโหลดสลิปการโอนเงิน
                                </p>
                                <p className="text-sm text-slate-500">
                                  รองรับไฟล์ JPG, PNG (ไม่เกิน 10MB)
                                </p>
                              </div>
                              {testMode && (
                                <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                                  <p className="text-sm text-purple-700 font-medium">
                                    🧪 โหมดทดสอบ - จะจำลองผลการอ่าน OCR
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Slip Preview */}
                      <div className="relative group">
                        <img 
                          src={slipPreview} 
                          alt="Payment Slip" 
                          className="max-w-full max-h-96 mx-auto rounded-xl shadow-lg border-4 border-slate-200"
                        />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button
                            type="button"
                            onClick={removeSlip}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                            title="ลบสลิป"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        {ocrResult && !ocrProcessing && (
                          <button
                            type="button"
                            onClick={retryOCR}
                            className="absolute bottom-3 right-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg flex items-center gap-2"
                          >
                            <RotateCw className="w-4 h-4" />
                            <span className="text-sm font-medium">อ่านใหม่</span>
                          </button>
                        )}
                      </div>

                      {/* OCR Processing */}
                      {ocrProcessing && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-5">
                          <div className="flex items-center gap-4">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-bold text-blue-800 text-lg">🔍 กำลังวิเคราะห์สลิปด้วย OCR...</p>
                              <p className="text-sm text-blue-600 mt-1">
                                ระบบกำลังอ่านและตรวจสอบข้อมูล กรุณารอสักครู่
                              </p>
                              <div className="mt-3 w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '70%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* OCR Result */}
                      {!ocrProcessing && ocrResult && (
                        <div className={`border-3 rounded-xl p-5 ${
                          ocrResult.success 
                            ? getConfidenceBgColor(ocrResult.confidence || 0)
                            : 'bg-red-50 border-red-300'
                        }`}>
                          <div className="flex items-start gap-4 mb-4">
                            {ocrResult.success ? (
                              <FileCheck className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                            ) : (
                              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className={`font-bold text-lg ${ocrResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                  {ocrResult.success ? '✓ อ่านสลิปสำเร็จ!' : '✗ ไม่สามารถอ่านสลิปได้'}
                                </p>
                                {ocrResult.success && ocrResult.confidence && (
                                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${getConfidenceColor(ocrResult.confidence)} bg-white`}>
                                    ความแม่นยำ: {(ocrResult.confidence * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              
                              {ocrResult.success && (
                                <div className="space-y-3">
                                  {/* Main Info Grid */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-lg border border-green-200">
                                      <p className="text-xs text-slate-600 mb-1">จำนวนเงิน</p>
                                      <p className="font-bold text-green-700 text-xl">
                                        ฿{ocrResult.amount?.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-green-200">
                                      <p className="text-xs text-slate-600 mb-1">ธนาคาร</p>
                                      <p className="font-bold text-slate-800 text-sm">
                                        {ocrResult.bankName || '-'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Details Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => setShowOCRDetails(!showOCRDetails)}
                                    className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center gap-2 py-2 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                                  >
                                    {showOCRDetails ? '▲' : '▼'}
                                    <span>{showOCRDetails ? 'ซ่อน' : 'แสดง'}รายละเอียดเพิ่มเติม</span>
                                  </button>

                                  {/* Expanded Details */}
                                  {showOCRDetails && (
                                    <div className="space-y-2">
                                      <div className="bg-white rounded-lg border-2 border-green-200 p-4 text-sm space-y-2">
                                        {ocrResult.transactionDate && (
                                          <div className="flex justify-between py-1 border-b border-slate-100">
                                            <strong className="text-slate-600">📅 วันที่:</strong>
                                            <span className="text-slate-800">{ocrResult.transactionDate}</span>
                                          </div>
                                        )}
                                        {ocrResult.transactionTime && (
                                          <div className="flex justify-between py-1 border-b border-slate-100">
                                            <strong className="text-slate-600">🕐 เวลา:</strong>
                                            <span className="text-slate-800">{ocrResult.transactionTime}</span>
                                          </div>
                                        )}
                                        {ocrResult.fromAccount && (
                                          <div className="flex justify-between py-1 border-b border-slate-100">
                                            <strong className="text-slate-600">📤 จากบัญชี:</strong>
                                            <span className="text-slate-800 font-mono">{ocrResult.fromAccount}</span>
                                          </div>
                                        )}
                                        {ocrResult.toAccount && (
                                          <div className="flex justify-between py-1 border-b border-slate-100">
                                            <strong className="text-slate-600">📥 ไปยังบัญชี:</strong>
                                            <span className="text-slate-800 font-mono">{ocrResult.toAccount}</span>
                                          </div>
                                        )}
                                        {ocrResult.referenceNo && (
                                          <div className="flex justify-between py-1">
                                            <strong className="text-slate-600">🔖 เลขอ้างอิง:</strong>
                                            <span className="text-slate-800 font-mono">{ocrResult.referenceNo}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Raw Text Toggle */}
                                      {ocrResult.rawText && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => setShowRawText(!showRawText)}
                                            className="w-full text-slate-600 hover:text-slate-700 text-xs font-medium flex items-center justify-center gap-1 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50"
                                          >
                                            {showRawText ? '▲' : '▼'}
                                            <span>ข้อความดิบจาก OCR</span>
                                          </button>
                                          {showRawText && (
                                            <div className="bg-slate-100 rounded-lg p-3 text-xs font-mono text-slate-700 max-h-40 overflow-y-auto border border-slate-300">
                                              {ocrResult.rawText}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {/* Amount Verification */}
                                  {ocrResult.amount && (
                                    <div className={`p-3 rounded-lg border-2 ${
                                      ocrResult.amount === bookingData.totalPrice
                                        ? 'bg-green-100 border-green-400'
                                        : 'bg-yellow-100 border-yellow-400'
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        {ocrResult.amount === bookingData.totalPrice ? (
                                          <>
                                            <Check className="w-5 h-5 text-green-700" />
                                            <p className="text-sm font-bold text-green-800">
                                              ✓ จำนวนเงินถูกต้อง ตรงกับยอดชำระ
                                            </p>
                                          </>
                                        ) : (
                                          <>
                                            <AlertCircle className="w-5 h-5 text-yellow-700" />
                                            <div className="flex-1">
                                              <p className="text-sm font-bold text-yellow-800">
                                                ⚠️ จำนวนเงินไม่ตรงกัน
                                              </p>
                                              <p className="text-xs text-yellow-700 mt-1">
                                                ยอดชำระ: ฿{bookingData.totalPrice.toLocaleString()} • 
                                                ในสลิป: ฿{ocrResult.amount.toLocaleString()} • 
                                                ส่วนต่าง: ฿{Math.abs(ocrResult.amount - bookingData.totalPrice).toLocaleString()}
                                              </p>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Error Messages */}
                              {!ocrResult.success && ocrResult.errors && ocrResult.errors.length > 0 && (
                                <div className="mt-3 space-y-1">
                                  {ocrResult.errors.map((error, idx) => (
                                    <p key={idx} className="text-sm text-red-600 flex items-start gap-2">
                                      <span>•</span>
                                      <span>{error}</span>
                                    </p>
                                  ))}
                                  <p className="text-xs text-red-500 mt-2">
                                    {testMode 
                                      ? '💡 กรุณาอัปโหลดสลิปใหม่ หรือดำเนินการต่อในโหมดทดสอบ' 
                                      : '💡 แนะนำ: ถ่ายภาพใหม่ให้ชัดเจน มีแสงเพียงพอ ไม่มีเงา'}
                                  </p>
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className={`border-l-4 p-4 rounded-r-xl ${
                  error.includes('⚠️') 
                    ? 'bg-yellow-50 border-yellow-400' 
                    : 'bg-red-50 border-red-400'
                }`}>
                  <div className="flex items-start">
                    <AlertCircle className={`h-5 w-5 mr-3 flex-shrink-0 mt-0.5 ${
                      error.includes('⚠️') ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                    <p className={`text-sm font-medium ${
                      error.includes('⚠️') ? 'text-yellow-800' : 'text-red-700'
                    }`}>
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Info Notice */}
              <div className={`border-l-4 rounded-r-xl p-4 ${
                testMode ? 'bg-purple-50 border-purple-400' : 'bg-blue-50 border-blue-400'
              }`}>
                <p className={`text-sm ${testMode ? 'text-purple-800' : 'text-blue-800'}`}>
                  {testMode ? (
                    <>
                      <strong>🧪 โหมดทดสอบ:</strong> ระบบจะจำลองการอ่าน OCR สำหรับการทดสอบเท่านั้น 
                      ในโหมดจริงจะใช้ AI อ่านสลิปจริง
                    </>
                  ) : (
                    <>
                      <strong>🔒 โหมดจริง:</strong> ระบบใช้ OCR ตรวจสอบสลิปอัตโนมัติ 
                      กรุณาอัปโหลดสลิปที่ชัดเจนและถูกต้อง
                    </>
                  )}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing || ocrProcessing}
                className={`w-full font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 text-white text-lg ${
                  processing || ocrProcessing
                    ? 'bg-slate-400 cursor-not-allowed'
                    : testMode 
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' 
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                }`}
              >
                {processing || ocrProcessing ? (
                  <>
                    <Loader2 className="animate-spin h-6 w-6" />
                    {ocrProcessing ? 'กำลังประมวลผล OCR...' : 'กำลังดำเนินการชำระเงิน...'}
                  </>
                ) : (
                  <>
                    <Check className="h-6 w-6" />
                    {testMode ? '🧪 ทดสอบการชำระเงิน' : '✓ ยืนยันการชำระเงิน'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedPaymentPage;