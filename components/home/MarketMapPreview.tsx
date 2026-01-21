"use client"; // ต้องใช้เพราะมีการคลิก (Interaction)

import React, { useState } from 'react';
import { CheckCircle2, Info } from 'lucide-react';

// จำลองข้อมูลล็อกตลาด
const mockZones = [
  { id: 'A1', status: 'available', price: 200 },
  { id: 'A2', status: 'booked', price: 200 },
  { id: 'A3', status: 'available', price: 200 },
  { id: 'A4', status: 'available', price: 200 },
  { id: 'B1', status: 'booked', price: 150 },
  { id: 'B2', status: 'available', price: 150 },
  { id: 'B3', status: 'booked', price: 150 },
  { id: 'B4', status: 'available', price: 150 },
  { id: 'C1', status: 'available', price: 300 },
  { id: 'C2', status: 'available', price: 300 },
];

const MarketMapPreview = () => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      {/* ส่วนอธิบายสัญลักษณ์สี */}
      <div className="flex gap-6 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
          <span className="text-slate-600 font-medium">ว่าง (Available)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-200 rounded-sm"></div>
          <span className="text-slate-600 font-medium">จองแล้ว (Booked)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 ring-2 ring-blue-600 rounded-sm"></div>
          <span className="text-slate-600 font-medium font-bold">ที่คุณเลือก</span>
        </div>
      </div>

      {/* ผังจำลองล็อกตลาด */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {mockZones.map((zone) => (
          <button
            key={zone.id}
            disabled={zone.status === 'booked'}
            onClick={() => setSelectedZone(zone.id)}
            className={`
              relative h-24 rounded-xl flex flex-col items-center justify-center transition-all
              ${zone.status === 'booked' 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md border-2 border-transparent'
              }
              ${selectedZone === zone.id ? 'bg-blue-100 border-blue-600 shadow-inner' : ''}
            `}
          >
            <span className="text-lg font-bold">{zone.id}</span>
            <span className="text-xs font-semibold mt-1">฿{zone.price}</span>
            
            {selectedZone === zone.id && (
              <div className="absolute top-1 right-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ส่วนแสดงรายละเอียดเมื่อเลือก */}
      {selectedZone ? (
        <div className="mt-8 p-4 bg-blue-600 rounded-xl text-white flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
          <div>
            <p className="text-blue-100 text-sm font-medium">ทำเลที่เลือก</p>
            <p className="text-xl font-bold text-white">ล็อก {selectedZone} - ฿{mockZones.find(z => z.id === selectedZone)?.price}</p>
          </div>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors">
            จองเลย
          </button>
        </div>
      ) : (
        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
          <p className="text-slate-500 flex items-center justify-center gap-2">
            <Info className="w-4 h-4" /> กรุณาเลือกทำเลที่คุณต้องการเพื่อดูรายละเอียด
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketMapPreview;