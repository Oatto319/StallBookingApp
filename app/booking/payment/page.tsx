'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Building2, Smartphone, Check, Clock, AlertCircle, ArrowLeft, QrCode, Upload, ImageIcon } from 'lucide-react';

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
  expiresAt: string;
}

const PaymentPage = () => {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'creditcard' | 'bank' | 'promptpay'>('promptpay');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [slipPreview, setSlipPreview] = useState<string>('');

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

  // QR Code placeholder
  const paymentQRCode = "https://via.placeholder.com/300x300.png?text=QR+Code+Payment";

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB");
        return;
      }
      setFormData(prev => ({ ...prev, slipImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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

    if (paymentMethod === 'bank' || paymentMethod === 'promptpay') {
      if (!formData.slipImage) {
        setError('กรุณาอัพโหลดสลิปการโอนเงิน');
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const paymentData = {
        ...formData,
        booking: bookingData,
        paymentMethod,
        timestamp: new Date().toISOString()
      };

      console.log('Payment submitted:', paymentData);

      // Clear booking data
      localStorage.removeItem('pendingBooking');

      // Redirect to success page
      router.push('/booking/success?stall=' + bookingData?.stall.number);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง');
      setProcessing(false);
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
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            กลับ
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ชำระเงิน</h1>
          <p className="text-slate-600">กรุณาชำระเงินภายในเวลาที่กำหนด</p>
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
          {/* Left Side - Booking Summary & QR */}
          <div>
            {/* Booking Summary */}
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
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">วันที่จอง:</span>
                  <span className="font-bold">{bookingData.bookingDate}</span>
                </div>
                <div className="border-t-2 border-slate-200 pt-3">
                  <div className="flex justify-between text-xl p-3 bg-green-50 rounded-lg">
                    <span className="text-slate-800 font-bold">ยอดชำระ:</span>
                    <span className="font-bold text-green-600">฿{bookingData.stall.price}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Payment */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-lg text-slate-800">สแกน QR Code เพื่อชำระเงิน</h3>
              </div>
              <div className="flex justify-center mb-4">
                <div className="bg-slate-50 p-6 rounded-xl border-2 border-slate-200">
                  <img 
                    src={paymentQRCode} 
                    alt="QR Code Payment" 
                    className="w-64 h-64 object-contain"
                  />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-slate-700 font-medium">
                  โอนเงินจำนวน <span className="text-2xl font-bold text-blue-600">฿{bookingData.stall.price}</span>
                </p>
                <p className="text-sm text-slate-500">และอัปโหลดสลิปด้านขวา</p>
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

              {/* Upload Slip */}
              {(paymentMethod === 'bank' || paymentMethod === 'promptpay') && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <label className="block text-slate-700 font-bold mb-2 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    อัปโหลดสลิปการโอนเงิน <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition-all cursor-pointer bg-slate-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="slip-upload"
                    />
                    <label htmlFor="slip-upload" className="cursor-pointer">
                      {slipPreview ? (
                        <div className="space-y-4">
                          <img 
                            src={slipPreview} 
                            alt="Payment Slip" 
                            className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                          />
                          <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                            <Check className="w-5 h-5" />
                            อัปโหลดสลิปเรียบร้อย (คลิกเพื่อเปลี่ยน)
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                          <p className="text-slate-600 font-medium">คลิกเพื่ออัปโหลดสลิป</p>
                          <p className="text-xs text-slate-400">รองรับไฟล์ JPG, PNG (ไม่เกิน 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Credit Card Form */}
              {paymentMethod === 'creditcard' && (
                <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      หมายเลขบัตร
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        วันหมดอายุ
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123"
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ หมายเหตุ:</strong> กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนกดยืนยัน 
                  หลังจากยืนยันแล้วจะไม่สามารถแก้ไขได้
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    ยืนยันการชำระเงิน
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

export default PaymentPage;