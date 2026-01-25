"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Mock Admin Account
const ADMIN_ACCOUNT = {
  email: "admin@marketbooker.com",
  password: "admin123",
  role: "admin",
  name: "ผู้ดูแลระบบ"
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ตรวจสอบว่าเป็น Admin account หรือไม่
      if (
        formData.email === ADMIN_ACCOUNT.email &&
        formData.password === ADMIN_ACCOUNT.password
      ) {
        // Login สำเร็จ - บันทึกข้อมูล Admin
        const adminData = {
          email: ADMIN_ACCOUNT.email,
          role: ADMIN_ACCOUNT.role,
          name: ADMIN_ACCOUNT.name,
          id: "admin-001"
        };

        localStorage.setItem("user", JSON.stringify(adminData));
        localStorage.setItem("token", "admin-token-" + Date.now());
        localStorage.setItem("isAdmin", "true");

        // ไปหน้าหลัก (Home) แทน Dashboard
        router.push("/");
        return;
      }

      // ถ้าไม่ใช่ admin ให้เรียก API ปกติ
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }

      // บันทึก token ลง localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // ไปหน้าหลัก
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            เข้าสู่ระบบ
          </h1>
          <p className="text-slate-600">
            ยินดีต้อนรับกลับสู่ระบบจองแผงตลาด
          </p>
        </div>

        {/* Admin Info Card */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">
            🔐 บัญชีทดสอบสำหรับแอดมิน:
          </p>
          <div className="text-xs text-blue-700 space-y-1">
            <p>อีเมล: <span className="font-mono bg-white px-2 py-0.5 rounded">admin@marketbooker.com</span></p>
            <p>รหัสผ่าน: <span className="font-mono bg-white px-2 py-0.5 rounded">admin123</span></p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              อีเมล
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="example@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              รหัสผ่าน
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          {/* Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="remember"
                className="ml-2 text-sm text-slate-600"
              >
                จดจำฉันไว้
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-slate-300"></div>
          <span className="px-4 text-sm text-slate-500">หรือ</span>
          <div className="flex-1 border-t border-slate-300"></div>
        </div>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-slate-600">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}