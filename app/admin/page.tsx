"use client";

import { useState, useEffect } from "react";

type Booking = {
  id: string;
  customerName: string;
  customerTel: string;
  bookingDate: string;
  status: string;
  stall: {
    code: string;
    price: number;
  };
};

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลเมื่อเข้าหน้าเว็บ
  const fetchBookings = () => {
    fetch("/api/admin/bookings")
      .then((res) => res.json())
      .then((data) => {
        setBookings(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ฟังก์ชันเปลี่ยนสถานะ (อนุมัติ / ยกเลิก)
  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${newStatus}?`)) return;

    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });

    fetchBookings(); // โหลดข้อมูลใหม่ทันที
  };

  if (loading) return <div className="p-10">⏳ Loading Admin Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">👮‍♂️ Admin Dashboard (จัดการการจอง)</h1>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-4">แผง</th>
                <th className="p-4">วันที่จอง</th>
                <th className="p-4">ชื่อลูกค้า</th>
                <th className="p-4">เบอร์โทร</th>
                <th className="p-4">ราคา</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-lg">{b.stall.code}</td>
                  <td className="p-4">{new Date(b.bookingDate).toLocaleDateString("th-TH")}</td>
                  <td className="p-4">{b.customerName}</td>
                  <td className="p-4 text-gray-600">{b.customerTel}</td>
                  <td className="p-4">{b.stall.price}.-</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        b.status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : b.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-center space-x-2">
                    {b.status === "PENDING_PAYMENT" && (
                      <>
                        <button
                          onClick={() => updateStatus(b.id, "PAID")}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => updateStatus(b.id, "CANCELLED")}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          ยกเลิก
                        </button>
                      </>
                    )}
                    {b.status !== "PENDING_PAYMENT" && <span className="text-gray-400 text-sm">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {bookings.length === 0 && (
            <div className="p-10 text-center text-gray-500">ยังไม่มีรายการจองเข้ามา</div>
          )}
        </div>
      </div>
    </div>
  );
}