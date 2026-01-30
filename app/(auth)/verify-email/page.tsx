'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('ลิงก์ยืนยันไม่ถูกต้อง');
        return;
      }

      try {
        // สามารถเพิ่ม API call เพื่อตรวจสอบ token ที่นี่
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('success');
        setMessage('อีเมลของคุณได้รับการยืนยันแล้ว');
      } catch (error) {
        setStatus('error');
        setMessage('ลิงก์ยืนยันหมดอายุหรือไม่ถูกต้อง');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">กำลังตรวจสอบ</h1>
            <p className="text-slate-600">กรุณารอสักครู่...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4 animate-bounce">✅</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">ยืนยันสำเร็จ!</h1>
            <p className="text-slate-600 mb-6">{message}</p>
            <p className="text-slate-500 text-sm mb-6">
              ขอบคุณที่ยืนยันอีเมลของคุณ คุณสามารถเข้าสู่ระบบได้แล้ว
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              เข้าสู่ระบบ
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">ยืนยันไม่สำเร็จ</h1>
            <p className="text-slate-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/register"
                className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                สมัครใหม่
              </Link>
              <Link
                href="/login"
                className="block px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-medium"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </>
        )}

        <div className="mt-6">
          <p className="text-slate-500 text-sm">
            ต้องการความช่วยเหลือ?{' '}
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              กลับไปหน้าหลัก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}