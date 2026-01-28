'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Maximize2, 
  Minimize2,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ZoomIn,
  ZoomOut,
  Store,
  Navigation,
  Home,
  ShoppingCart
} from 'lucide-react';

interface Stall {
  id: string;
  zone: number;
  number: string;
  price: number;
  size: string;
  status: 'available' | 'booked' | 'reserved';
  category: string;
}

const MinimapPage = () => {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedZone, setSelectedZone] = useState<number | 'all'>('all');
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLegend, setShowLegend] = useState(true);

  // Zone configuration แบบมินิแมพเกม
  const zones = [
    { id: 1, name: 'Zone A', color: '#FFD93D', borderColor: '#FFA500', category: '🎽 เสื้อผ้า', stallsPerRow: 5, rows: 4, price: 500, icon: '👕' },
    { id: 2, name: 'Zone B', color: '#6BCB77', borderColor: '#4D96A9', category: '🍜 อาหาร', stallsPerRow: 5, rows: 4, price: 600, icon: '🍔' },
    { id: 3, name: 'Zone C', color: '#4D96FF', borderColor: '#1E40AF', category: '🎨 ของตกแต่ง', stallsPerRow: 5, rows: 4, price: 550, icon: '🎨' },
    { id: 4, name: 'Zone D', color: '#C77DFF', borderColor: '#9333EA', category: '💎 เครื่องประดับ', stallsPerRow: 5, rows: 4, price: 700, icon: '💍' },
    { id: 5, name: 'Zone E', color: '#FF6B9D', borderColor: '#DB2777', category: '👟 รองเท้า กระเป๋า', stallsPerRow: 5, rows: 4, price: 650, icon: '👜' },
    { id: 6, name: 'Zone F', color: '#FFA559', borderColor: '#EA580C', category: '📱 ของใช้', stallsPerRow: 5, rows: 4, price: 500, icon: '📱' },
    { id: 7, name: 'Zone G', color: '#2DD4BF', borderColor: '#0D9488', category: '🪑 เฟอร์นิเจอร์', stallsPerRow: 5, rows: 4, price: 800, icon: '🪑' },
    { id: 8, name: 'Zone H', color: '#FB7185', borderColor: '#DC2626', category: '🎮 ของสะสม', stallsPerRow: 5, rows: 4, price: 600, icon: '🎮' },
  ];

  // Generate stalls
  useEffect(() => {
    const generateStalls = () => {
      const allStalls: Stall[] = [];
      
      zones.forEach(zone => {
        const totalStalls = zone.stallsPerRow * zone.rows;
        for (let i = 1; i <= totalStalls; i++) {
          const randomStatus = Math.random();
          let status: 'available' | 'booked' | 'reserved';
          
          if (randomStatus < 0.5) status = 'available';
          else if (randomStatus < 0.8) status = 'booked';
          else status = 'reserved';

          allStalls.push({
            id: `Z${zone.id}-${i}`,
            zone: zone.id,
            number: `${zone.name.split(' ')[1]}${i.toString().padStart(2, '0')}`,
            price: zone.price,
            size: '2x3 ม.',
            status: status,
            category: zone.category
          });
        }
      });

      setStalls(allStalls);
    };

    generateStalls();
  }, []);

  // Filter stalls
  const filteredStalls = stalls.filter(stall => {
    const zoneMatch = selectedZone === 'all' || stall.zone === selectedZone;
    const searchMatch = searchQuery === '' || 
      stall.number.toLowerCase().includes(searchQuery.toLowerCase());
    return zoneMatch && searchMatch;
  });

  // Get stall color
  const getStallColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500 border-emerald-600 shadow-emerald-200';
      case 'booked':
        return 'bg-rose-500 border-rose-600 shadow-rose-200';
      case 'reserved':
        return 'bg-amber-500 border-amber-600 shadow-amber-200';
      default:
        return 'bg-slate-400 border-slate-500';
    }
  };

  // Stats
  const availableCount = stalls.filter(s => s.status === 'available').length;
  const bookedCount = stalls.filter(s => s.status === 'booked').length;
  const reservedCount = stalls.filter(s => s.status === 'reserved').length;

  // Get zone stalls
  const getZoneStalls = (zoneId: number) => {
    return stalls.filter(s => s.zone === zoneId);
  };

  // Handle stall click
  const handleStallClick = (stall: Stall) => {
    setSelectedStall(stall);
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" />
            กลับหน้าแรก
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                ผังตลาด MarketBooker
              </h1>
              <p className="text-slate-600">🗺️ มินิแมพแบบเกม - เลือกโซนและช่องที่ต้องการจอง</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border-2 border-emerald-200 shadow-lg">
            <div className="text-3xl font-bold text-emerald-600">{availableCount}</div>
            <div className="text-sm text-emerald-700 font-medium">✅ ช่องว่าง</div>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-4 border-2 border-rose-200 shadow-lg">
            <div className="text-3xl font-bold text-rose-600">{bookedCount}</div>
            <div className="text-sm text-rose-700 font-medium">❌ จองแล้ว</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 border-2 border-amber-200 shadow-lg">
            <div className="text-3xl font-bold text-amber-600">{reservedCount}</div>
            <div className="text-sm text-amber-700 font-medium">⏳ กำลังจอง</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border-2 border-blue-200 shadow-lg">
            <div className="text-3xl font-bold text-blue-600">{stalls.length}</div>
            <div className="text-sm text-blue-700 font-medium">📊 ทั้งหมด</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Search */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border-2 border-slate-200 shadow-lg">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                🔍 ค้นหาช่อง
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="A01, B05..."
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* Zone Filter */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border-2 border-slate-200 shadow-lg max-h-[600px] overflow-y-auto">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                📍 เลือกโซน
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedZone('all')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold ${
                    selectedZone === 'all' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200'
                  }`}
                >
                  🌐 ทุกโซน
                </button>
                {zones.map(zone => {
                  const zoneStalls = getZoneStalls(zone.id);
                  const available = zoneStalls.filter(s => s.status === 'available').length;
                  return (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        selectedZone === zone.id 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-5 h-5 rounded-full shadow-md" 
                          style={{ backgroundColor: zone.color }}
                        ></div>
                        <span className="font-bold">{zone.icon} {zone.name}</span>
                      </div>
                      <div className="text-xs opacity-90 ml-7">{zone.category}</div>
                      <div className="text-xs mt-1 ml-7 font-semibold">
                        💰 ฿{zone.price}/วัน • {available}/{zoneStalls.length} ว่าง
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border-2 border-slate-200 shadow-lg">
              <h3 className="font-bold text-slate-800 mb-3">🔍 ซูมแผนที่</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="flex-1 bg-white hover:bg-slate-50 p-3 rounded-xl transition-all border-2 border-slate-200 shadow-md active:scale-95"
                >
                  <ZoomOut className="w-5 h-5 mx-auto text-slate-600" />
                </button>
                <div className="flex-1 text-center font-bold text-slate-700 text-lg">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <button
                  onClick={handleZoomIn}
                  className="flex-1 bg-white hover:bg-slate-50 p-3 rounded-xl transition-all border-2 border-slate-200 shadow-md active:scale-95"
                >
                  <ZoomIn className="w-5 h-5 mx-auto text-slate-600" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border-2 border-slate-200 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800">🎮 สัญลักษณ์</h3>
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showLegend ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
              {showLegend && (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                    <div className="w-8 h-8 bg-emerald-500 border-2 border-emerald-600 rounded-lg shadow-md"></div>
                    <span className="text-slate-700 font-semibold">✅ ว่าง</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                    <div className="w-8 h-8 bg-amber-500 border-2 border-amber-600 rounded-lg shadow-md"></div>
                    <span className="text-slate-700 font-semibold">⏳ กำลังจอง</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                    <div className="w-8 h-8 bg-rose-500 border-2 border-rose-600 rounded-lg shadow-md"></div>
                    <span className="text-slate-700 font-semibold">❌ จองแล้ว</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Stall Info */}
            {selectedStall && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border-2 border-blue-300 shadow-xl">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  📋 ข้อมูลช่อง
                </h3>
                <div className="space-y-2 text-sm bg-white rounded-xl p-3 border border-blue-200">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">หมายเลข:</span>
                    <span className="font-bold text-blue-600">{selectedStall.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">โซน:</span>
                    <span className="font-bold">{selectedStall.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">ประเภท:</span>
                    <span className="font-bold text-xs">{selectedStall.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">ราคา:</span>
                    <span className="font-bold text-green-600">฿{selectedStall.price}/วัน</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-slate-600 font-medium">สถานะ:</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      selectedStall.status === 'available' ? 'text-green-600' :
                      selectedStall.status === 'reserved' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedStall.status === 'available' && '✅'}
                      {selectedStall.status === 'reserved' && '⏳'}
                      {selectedStall.status === 'booked' && '❌'}
                      {selectedStall.status === 'available' ? 'ว่าง' :
                       selectedStall.status === 'reserved' ? 'กำลังจอง' : 'จองแล้ว'}
                    </span>
                  </div>
                </div>
                {selectedStall.status === 'available' && (
                  <Link
                    href="/booking"
                    className="mt-3 w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg active:scale-95"
                  >
                    <CheckCircle className="w-5 h-5" />
                    🎯 จองช่องนี้
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Main Map Area - Game Style Minimap */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border-4 border-slate-300 shadow-2xl p-8 overflow-auto">
              
              {/* Market Entrance - Game Style */}
              <div className="mb-8">
                <div className="relative bg-gradient-to-b from-slate-700 to-slate-900 text-white text-center py-6 rounded-2xl shadow-2xl border-4 border-slate-600 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  <Store className="w-10 h-10 mx-auto mb-2 relative z-10" />
                  <div className="text-2xl font-bold relative z-10">🏪 ทางเข้าตลาด</div>
                  <div className="text-sm opacity-90 flex items-center justify-center gap-2 relative z-10 mt-1">
                    <Navigation className="w-4 h-4" />
                    MARKET ENTRANCE
                  </div>
                </div>
              </div>

              <div 
                style={{ 
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.3s ease'
                }}
              >
                {/* Market Grid Layout - Game Style */}
                <div className="grid grid-cols-4 gap-6">
                  
                  {zones.map(zone => {
                    const zoneStalls = getZoneStalls(zone.id);
                    const stallsPerRow = zone.stallsPerRow;
                    const available = zoneStalls.filter(s => s.status === 'available').length;
                    
                    return (
                      <div 
                        key={zone.id}
                        className={`
                          rounded-2xl p-5 transition-all shadow-xl border-4
                          ${selectedZone !== 'all' && selectedZone !== zone.id ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}
                        `}
                        style={{ 
                          backgroundColor: zone.color,
                          borderColor: zone.borderColor
                        }}
                      >
                        {/* Zone Header - Game Style */}
                        <div className="bg-white/95 backdrop-blur rounded-xl p-4 mb-4 shadow-lg border-2 border-slate-200">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-2xl">{zone.icon}</span>
                            <div className="font-black text-xl text-slate-800">
                              {zone.name}
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 text-center font-medium">
                            {zone.category}
                          </div>
                          <div className="mt-2 flex items-center justify-center gap-3 text-sm">
                            <span className="font-bold text-green-600">
                              💰 ฿{zone.price}/วัน
                            </span>
                          </div>
                          <div className="mt-2 bg-slate-100 rounded-lg py-1 px-2 text-center">
                            <span className="text-xs font-bold text-slate-700">
                              ✅ {available}/{zoneStalls.length} ว่าง
                            </span>
                          </div>
                        </div>

                        {/* Stalls Grid - Game Style */}
                        <div className={`grid grid-cols-${stallsPerRow} gap-2`}>
                          {zoneStalls.map((stall) => (
                            <button
                              key={stall.id}
                              onClick={() => handleStallClick(stall)}
                              className={`
                                aspect-square rounded-xl transition-all flex flex-col items-center justify-center
                                border-3 shadow-lg relative overflow-hidden
                                ${getStallColor(stall.status)}
                                ${selectedStall?.id === stall.id ? 'ring-4 ring-white scale-110 z-20 shadow-2xl' : ''}
                                ${stall.status === 'available' ? 'hover:scale-110 cursor-pointer hover:shadow-2xl' : 'cursor-not-allowed opacity-60'}
                              `}
                              title={`${stall.number} - ${stall.category}`}
                            >
                              {/* Shine effect for available stalls */}
                              {stall.status === 'available' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                              )}
                              
                              <div className="text-xs font-black text-white drop-shadow-lg relative z-10">
                                {stall.number.slice(-2)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                </div>
              </div>

              {/* Zone Legend - Game Style */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {zones.map(zone => (
                  <div 
                    key={zone.id}
                    className="rounded-xl p-4 text-center shadow-lg border-3 transition-all hover:scale-105 cursor-pointer"
                    style={{ 
                      backgroundColor: zone.color,
                      borderColor: zone.borderColor,
                      borderWidth: '3px'
                    }}
                    onClick={() => setSelectedZone(zone.id)}
                  >
                    <div className="text-2xl mb-1">{zone.icon}</div>
                    <div className="font-black text-white drop-shadow-lg">{zone.name}</div>
                    <div className="text-xs text-white/90 mt-1 font-semibold drop-shadow">{zone.category}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions - Game Style */}
            <div className="mt-6 bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-blue-500 p-5 rounded-r-2xl shadow-lg">
              <p className="text-sm text-slate-800 font-medium">
                <strong className="text-blue-700">🎮 วิธีใช้งาน:</strong> คลิกที่ช่องเพื่อดูรายละเอียด • แต่ละโซนมีสินค้าและราคาต่างกัน • สามารถจองได้ทันทีหากช่องว่าง ✅
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimapPage;