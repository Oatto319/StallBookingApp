'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Users, AlertCircle, CheckCircle, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface QueueStatus {
  id: string;
  position: number;
  status: string;
  totalInQueue: number;
  timeLeft: number;
  stallId: string;
  bookingDate: string;
}

const QueueStatusPage = () => {
  const router = useRouter();
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showReadyAlert, setShowReadyAlert] = useState(false);

  // ดึงข้อมูลจาก URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queueId = params.get('queueId');
    const stallId = params.get('stallId');
    const bookingDate = params.get('bookingDate');
    const userData = localStorage.getItem('user');

    if (userData) {
      setUser(JSON.parse(userData));
    }

    if (queueId && stallId && userData) {
      fetchQueueStatus(stallId, bookingDate || new Date().toISOString().split('T')[0]);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchQueueStatus = async (stallId: string, bookingDate: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const response = await fetch(
        `/api/queue?stallId=${stallId}&bookingDate=${bookingDate}&userId=${user.id}`
      );

      if (response.ok) {
        const data = await response.json();
        setQueueStatus(data.queueStatus);
        setTimeRemaining(data.queueStatus.timeLeft);
      }
    } catch (error) {
      console.error('Error fetching queue status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!queueStatus || queueStatus.status !== 'OFFERED') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return queueStatus.timeLeft;
        if (prev <= 0) {
          handleRejectOffer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [queueStatus]);

  // Polling - ตรวจสอบสถานะคิวทุก 2 วินาที
  useEffect(() => {
    if (!queueStatus || queueStatus.status !== 'WAITING') return;

    const interval = setInterval(async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;

        const user = JSON.parse(userData);
        const response = await fetch(
          `/api/queue?stallId=${queueStatus.stallId}&bookingDate=${queueStatus.bookingDate}&userId=${user.id}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.queueStatus) {
            const oldStatus = queueStatus.status;
            setQueueStatus(data.queueStatus);
            setTimeRemaining(data.queueStatus.timeLeft);

            // ถ้า status เปลี่ยนจาก WAITING → OFFERED = ถึงคิวแล้ว
            if (
              data.queueStatus.status === 'OFFERED' &&
              oldStatus === 'WAITING'
            ) {
              setShowReadyAlert(true);
              
              // แจ้งเตือนด้วย browser notification (ถ้าได้รับอนุญาต)
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🎉 ถึงคิวของคุณแล้ว!', {
                  body: `ช่อง ${queueStatus.stallId} พร้อมให้จองแล้ว กดเพื่อไปหน้าชำระเงิน`,
                  icon: '/icon.png',
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // ตรวจสอบทุก 2 วินาที

    return () => clearInterval(interval);
  }, [queueStatus, router]);

  // ขออนุญาต notification เมื่อ component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleAcceptOffer = async () => {
    if (!queueStatus) return;

    try {
      const response = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: queueStatus.id,
          action: 'ACCEPT',
        }),
      });

      if (response.ok) {
        // ดึงข้อมูลช่องจาก localStorage
        const queuedStallData = localStorage.getItem('queuedStall');
        let stallInfo = null;
        
        if (queuedStallData) {
          const queuedStall = JSON.parse(queuedStallData);
          stallInfo = queuedStall.stall;
        }

        // บันทึกข้อมูลการจองไปหน้า payment
        localStorage.setItem(
          'pendingBooking',
          JSON.stringify({
            stall: {
              id: stallInfo?.id || queueStatus.stallId,
              zone: stallInfo?.zone || '',
              number: queueStatus.stallId,
              price: stallInfo?.price || 0,
              size: stallInfo?.size || '',
            },
            sessionId: `queue_${queueStatus.id}`,
            queueId: queueStatus.id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 นาที
          })
        );

        // ไปหน้า payment (ให้เลือกวันที่ที่นั่น)
        router.push('/booking/payment');
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const handleRejectOffer = async () => {
    if (!queueStatus) return;

    try {
      const response = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: queueStatus.id,
          action: 'REJECT',
        }),
      });

      if (response.ok) {
        setQueueStatus({ ...queueStatus, status: 'EXPIRED' });
        setTimeout(() => {
          router.push('/booking');
        }, 2000);
      }
    } catch (error) {
      console.error('Error rejecting offer:', error);
    }
  };

  const handleLeaveQueue = async () => {
    if (!queueStatus) return;

    const confirmLeave = confirm('คุณแน่ใจหรือไม่ว่าต้องการออกจากคิว?');
    if (!confirmLeave) return;

    try {
      const response = await fetch('/api/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: queueStatus.id,
        }),
      });

      if (response.ok) {
        router.push('/booking');
      }
    } catch (error) {
      console.error('Error leaving queue:', error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 pt-24">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">กำลังโหลด...</p>
        </div>
      </main>
    );
  }

  if (!queueStatus) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 pt-24">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            ไม่พบข้อมูลคิว
          </h1>
          <p className="text-slate-600 mb-6">
            โปรดตรวจสอบข้อมูลการเข้าคิวของคุณ
          </p>
          <Link
            href="/booking"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            กลับไปจองจอด
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 pt-24 pb-8">
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Ready Alert - แสดงเมื่อถึงคิว */}
        {showReadyAlert && queueStatus.status === 'OFFERED' && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-6 animate-bounce">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">🎉 ถึงคิวของคุณแล้ว!</h2>
              <p className="text-lg mb-4">ช่อง {queueStatus.stallId} พร้อมให้จองแล้ว</p>
              <button
                onClick={() => setShowReadyAlert(false)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all"
              >
                รับทราบ
              </button>
            </div>
          </div>
        )}

        {/* Status Card - WAITING */}
        {queueStatus.status === 'WAITING' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <Clock className="w-12 h-12 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-800">
                คุณอยู่ในคิว
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-slate-600 text-sm font-medium mb-2">
                  ตำแหน่งในคิว
                </p>
                <p className="text-4xl font-bold text-blue-600">
                  #{queueStatus.position}
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-slate-600 text-sm font-medium mb-2">
                  จำนวนคนรอทั้งหมด
                </p>
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  <p className="text-4xl font-bold text-blue-600">
                    {queueStatus.totalInQueue}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white p-6 mb-6">
              <p className="text-sm font-medium mb-2">ช่องที่เข้าคิว</p>
              <p className="text-2xl font-bold">
                {queueStatus.stallId}
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-blue-800">
                  <p className="font-semibold mb-1">โปรดรอสักครู่</p>
                  <p>เมื่อถึงคิวของคุณ ระบบจะแจ้งเตือนให้ทราบทันที</p>
                  <p className="text-xs mt-2 text-blue-600">💡 อย่าปิดหน้าต่างนี้เพื่อรอการแจ้งเตือน</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLeaveQueue}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              ออกจากคิว
            </button>
          </div>
        )}

        {/* Offer Card - OFFERED */}
        {queueStatus.status === 'OFFERED' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border-2 border-green-500">
            <div className="flex items-center gap-4 mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <h1 className="text-3xl font-bold text-slate-800">
                ถึงคิวของคุณแล้ว!
              </h1>
            </div>

            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-slate-600 text-sm font-medium mb-2">
                เวลาที่เหลือในการตัดสินใจ
              </p>
              <p className="text-5xl font-bold text-green-600">
                {timeRemaining}
                <span className="text-2xl ml-2">วินาที</span>
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white p-6 mb-6">
              <p className="text-sm font-medium mb-2">ช่องที่พร้อมจอง</p>
              <p className="text-2xl font-bold">{queueStatus.stallId}</p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-6">
              <p className="text-sm text-orange-800">
                <strong>⚠️ สำคัญ:</strong> คุณมี <strong>{Math.ceil((timeRemaining || 0) / 60)} นาที</strong> ในการตัดสินใจ<br />
                หากหมดเวลา คุณจะต้องเข้าคิวใหม่
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleRejectOffer}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
              >
                ปฏิเสธ
              </button>
              <button
                onClick={handleAcceptOffer}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                ยอมรับและไปจอง
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Expired Card */}
        {queueStatus.status === 'EXPIRED' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border-2 border-red-500">
            <div className="flex items-center gap-4 mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h1 className="text-3xl font-bold text-slate-800">
                หมดเวลาแล้ว
              </h1>
            </div>

            <p className="text-slate-600 text-center mb-6 text-lg">
              คุณหมดเวลาในการตัดสินใจ
              <br />
              กรุณาเข้าคิวใหม่หากต้องการจองช่องนี้
            </p>

            <button
              onClick={() => router.push('/booking')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
            >
              กลับไปเลือกช่อง
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-blue-50 rounded-xl p-6 text-sm text-slate-600">
          <h3 className="font-semibold text-slate-800 mb-3">ข้อมูลการใช้งาน</h3>
          <ul className="space-y-2">
            <li>✓ คุณจะอยู่ในคิวจนกว่าช่องจะว่าง</li>
            <li>✓ เมื่อถึงคิว ระบบจะแจ้งเตือนให้คุณทราบ</li>
            <li>✓ คุณมีเวลา 10 นาทีในการตัดสินใจ</li>
            <li>✓ กดปุ่ม "ยอมรับและไปจอง" เพื่อไปหน้าเลือกวันที่และชำระเงิน</li>
            <li>✓ หากปฏิเสธหรือหมดเวลา คุณจะต้องเข้าคิวใหม่</li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default QueueStatusPage;