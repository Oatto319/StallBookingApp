'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ส่งอีเมลรีเซ็ตรหัสผ่าน
      // สามารถเพิ่ม API call ที่นี่ในอนาคต
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดบางอย่าง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">ลืมรหัสผ่าน</h1>
          <p className="text-slate-600">กรุณากรอกอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน</p>
        </div>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-600 font-medium mb-2">ส่งสำเร็จ!</p>
            <p className="text-green-600 text-sm mb-6">
              ลิงก์รีเซ็ตรหัสผ่านได้ถูกส่งไปยังอีเมล {email} แล้ว
            </p>
            <p className="text-slate-600 text-xs mb-6">
              กรุณาตรวจสอบอีเมลของคุณและติดตามขั้นตอนการรีเซ็ตรหัสผ่าน
            </p>
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← กลับไปเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  อีเมล *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="example@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-slate-600">
                จำรหัสผ่านได้แล้ว?{' '}
                <Link
                  href="/login"
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  เข้าสู่ระบบ
                </Link>
              </p>
              <p className="text-slate-600">
                ยังไม่มีบัญชี?{' '}
                <Link
                  href="/register"
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  สมัครสมาชิก
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}