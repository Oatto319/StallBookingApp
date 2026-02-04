'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  LogOut,
  Bell,
  Settings,
  MapPin,
  FileText,
  BarChart3,
  Home,
  X,
  RefreshCw,
  User,
  Mail,
  Phone,
  CreditCard,
  AlertTriangle,
  Package,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: string;
  stallNumber: string;
  customerName: string;
  phone: string;
  email: string;
  bookingDate: string;
  startDate: string;
  endDate: string;
  days: number;
  totalPrice: number;
  pricePerDay: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'creditcard' | 'bank' | 'promptpay';
  createdAt: string;
  zone: string;
  size: string;
  bookingDates?: string[];
}

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  pendingRevenue: number;
  todayBookings: number;
  weekBookings: number;
}

const AdminDashboard = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    todayBookings: 0,
    weekBookings: 0
  });

  // Check authentication
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin !== 'true') {
      alert('กรุณา Login ด้วยบัญชี Admin');
      router.push('/');
      return;
    }
    
    loadBookings();
  }, [router]);

  // Load real bookings from localStorage
  const loadBookings = () => {
    try {
      const storedBookings = localStorage.getItem('bookings');
      if (storedBookings) {
        const parsedBookings = JSON.parse(storedBookings);
        setBookings(parsedBookings);
        calculateStats(parsedBookings);
      } else {
        // No bookings yet
        setBookings([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
      calculateStats([]);
    }
  };

  // Calculate statistics
  const calculateStats = (bookingList: Booking[]) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const pending = bookingList.filter(b => b.status === 'pending').length;
    const confirmed = bookingList.filter(b => b.status === 'confirmed').length;
    const completed = bookingList.filter(b => b.status === 'completed').length;
    const cancelled = bookingList.filter(b => b.status === 'cancelled').length;
    
    const totalRevenue = bookingList
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    
    const pendingRevenue = bookingList
      .filter(b => b.paymentStatus === 'pending' && b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    
    const todayBookings = bookingList.filter(b => 
      b.bookingDate === today || b.createdAt?.split('T')[0] === today
    ).length;

    const weekBookings = bookingList.filter(b => {
      const bookingDate = b.bookingDate || b.createdAt?.split('T')[0];
      return bookingDate >= weekAgo;
    }).length;

    setStats({
      totalBookings: bookingList.length,
      pendingBookings: pending,
      confirmedBookings: confirmed,
      completedBookings: completed,
      cancelledBookings: cancelled,
      totalRevenue: totalRevenue,
      pendingRevenue: pendingRevenue,
      todayBookings: todayBookings,
      weekBookings: weekBookings
    });
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.stallNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.phone.includes(searchQuery) ||
      booking.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Handle status update
  const handleUpdateStatus = (bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${getStatusLabel(newStatus)}?`)) return;

    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        let newPaymentStatus = b.paymentStatus;
        if (newStatus === 'cancelled' && b.paymentStatus === 'paid') {
          newPaymentStatus = 'refunded';
        }
        if (newStatus === 'confirmed' && b.paymentStatus === 'pending') {
          newPaymentStatus = 'paid';
        }
        return { ...b, status: newStatus, paymentStatus: newPaymentStatus };
      }
      return b;
    });

    setBookings(updatedBookings);
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
    calculateStats(updatedBookings);
    alert('อัพเดทสถานะเรียบร้อย!');
  };

  // Handle delete booking
  const handleDeleteBooking = (bookingId: string) => {
    if (!confirm('ยืนยันการลบการจองนี้? การกระทำนี้ไม่สามารถยกเลิกได้')) return;

    const updatedBookings = bookings.filter(b => b.id !== bookingId);
    setBookings(updatedBookings);
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
    calculateStats(updatedBookings);
    setSelectedBooking(null);
    alert('ลบการจองเรียบร้อย!');
  };

  // Handle export
  const handleExport = () => {
    setIsExporting(true);
    
    const headers = ['รหัส', 'ช่อง', 'ลูกค้า', 'โทรศัพท์', 'อีเมล', 'วันที่จอง', 'จำนวนวัน', 'ยอดเงิน', 'สถานะ', 'การชำระ'];
    const rows = filteredBookings.map(b => [
      b.id,
      b.stallNumber,
      b.customerName,
      b.phone,
      b.email,
      b.bookingDate,
      b.days,
      b.totalPrice,
      getStatusLabel(b.status),
      getPaymentLabel(b.paymentStatus)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setIsExporting(false);
      alert('ดาวน์โหลดรายงานเรียบร้อย!');
    }, 1000);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadBookings();
    alert('รีเฟรชข้อมูลเรียบร้อย!');
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm('ยืนยันการออกจากระบบ?')) {
      localStorage.removeItem('isAdmin');
      router.push('/');
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'รอดำเนินการ',
      confirmed: 'ยืนยันแล้ว',
      cancelled: 'ยกเลิก',
      completed: 'เสร็จสิ้น'
    };
    return labels[status as keyof typeof labels];
  };

  // Get payment label
  const getPaymentLabel = (status: string) => {
    const labels = {
      pending: 'รอชำระ',
      paid: 'ชำระแล้ว',
      refunded: 'คืนเงิน'
    };
    return labels[status as keyof typeof labels];
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  // Get payment status badge
  const getPaymentBadge = (status: string) => {
    const styles = {
      pending: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {getPaymentLabel(status)}
      </span>
    );
  };

  const formatDateThai = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get pending notifications count
  const unreadCount = stats.pendingBookings;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">ระบบจัดการตลาดนัด</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="w-5 h-5 text-slate-600" />
              </button>

              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">หน้าแรก</span>
              </Link>

              <Link
                href="/minimap"
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <MapPin className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">ผังตลาด</span>
              </Link>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-slate-100 relative transition-colors"
                >
                  <Bell className="w-6 h-6 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
                    <div className="p-4 border-b border-slate-200">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">การแจ้งเตือน</h3>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      {unreadCount > 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-yellow-900">
                            มี {unreadCount} รายการรอการอนุมัติ
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            กรุณาตรวจสอบและอนุมัติการจอง
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">ไม่มีการแจ้งเตือนใหม่</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">ออก</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">ยินดีต้อนรับ, Admin! 👋</h2>
              <p className="text-blue-100">วันนี้มีการจอง {stats.todayBookings} รายการ • สัปดาห์นี้ {stats.weekBookings} รายการ</p>
            </div>
            <Activity className="w-16 h-16 text-white/30" />
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                +{stats.weekBookings}
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">การจองทั้งหมด</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.totalBookings}</p>
            <p className="text-xs text-slate-500 mt-2">รายการทั้งหมดในระบบ</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              {stats.pendingBookings > 0 && (
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                  ใหม่!
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">รอดำเนินการ</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.pendingBookings}</p>
            <p className="text-xs text-orange-600 mt-2 font-medium">ต้องอนุมัติด่วน</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">ยืนยันแล้ว</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.confirmedBookings}</p>
            <p className="text-xs text-green-600 mt-2 font-medium">
              {stats.totalBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0}% ของทั้งหมด
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">รายได้รวม</h3>
            <p className="text-3xl font-bold text-slate-900">฿{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-purple-600 mt-2 font-medium">
              รอชำระ ฿{stats.pendingRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-sm opacity-90">เสร็จสิ้น</p>
                <p className="text-3xl font-bold">{stats.completedBookings}</p>
              </div>
            </div>
            <div className="h-2 bg-blue-400/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/80 rounded-full transition-all"
                style={{ width: `${stats.totalBookings > 0 ? (stats.completedBookings / stats.totalBookings) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-sm opacity-90">ยกเลิก</p>
                <p className="text-3xl font-bold">{stats.cancelledBookings}</p>
              </div>
            </div>
            <p className="text-sm opacity-90">
              อัตราการยกเลิก: {stats.totalBookings > 0 ? ((stats.cancelledBookings / stats.totalBookings) * 100).toFixed(1) : 0}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-sm opacity-90">วันนี้</p>
                <p className="text-3xl font-bold">{stats.todayBookings}</p>
              </div>
            </div>
            <p className="text-sm opacity-90">
              การจองใหม่วันนี้
            </p>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Store className="w-6 h-6 text-blue-600" />
                รายการจองทั้งหมด ({filteredBookings.length})
              </h2>
              
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหา..."
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">ทุกสถานะ</option>
                    <option value="pending">รอดำเนินการ</option>
                    <option value="confirmed">ยืนยันแล้ว</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>

                <button
                  onClick={handleExport}
                  disabled={isExporting || filteredBookings.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center">
                <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-600 mb-2">
                  {bookings.length === 0 ? 'ยังไม่มีการจอง' : 'ไม่พบรายการที่ค้นหา'}
                </p>
                <p className="text-sm text-slate-500">
                  {bookings.length === 0 
                    ? 'การจองจากหน้า Payment จะแสดงที่นี่'
                    : 'ลองค้นหาด้วยคำอื่นหรือเปลี่ยนตัวกรอง'
                  }
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">รหัส</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">ช่อง</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">ลูกค้า</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">วันที่จอง</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">จำนวนวัน</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">ยอดเงิน</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">สถานะ</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">{booking.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-xs font-bold text-white">{booking.zone}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{booking.stallNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{booking.customerName}</p>
                          <p className="text-xs text-slate-500">{booking.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{formatDateThai(booking.bookingDate)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                          {booking.days} วัน
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-green-600">฿{booking.totalPrice.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">฿{booking.pricePerDay}/วัน</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getStatusBadge(booking.status)}
                          <div>{getPaymentBadge(booking.paymentStatus)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setSelectedBooking(booking)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {booking.status === 'pending' && (
                            <button 
                              onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="อนุมัติ"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-7 h-7 text-blue-600" />
                รายละเอียดการจอง
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border-2 border-blue-200 shadow-md">
                  <p className="text-sm text-blue-600 font-semibold mb-1">รหัสการจอง</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedBooking.id}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border-2 border-green-200 shadow-md">
                  <p className="text-sm text-green-600 font-semibold mb-1">ช่อง / โซน</p>
                  <p className="text-2xl font-bold text-green-700">{selectedBooking.stallNumber}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  ข้อมูลลูกค้า
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">ชื่อ-นามสกุล</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      เบอร์โทร
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{selectedBooking.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      อีเมล
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{selectedBooking.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200">
                <h4 className="font-bold text-purple-900 mb-4">รายละเอียดการจอง</h4>
                
                {selectedBooking.bookingDates && selectedBooking.bookingDates.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-sm text-purple-700 font-semibold mb-2">
                      วันที่จอง ({selectedBooking.bookingDates.length} วัน):
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {selectedBooking.bookingDates.map((date, idx) => (
                        <div key={date} className="bg-white px-3 py-2 rounded-lg text-sm">
                          <span className="font-semibold text-purple-600">#{idx + 1}</span> {formatDateThai(date)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-slate-600">เริ่มต้น</p>
                      <p className="font-semibold text-slate-900">{formatDateThai(selectedBooking.startDate)}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-slate-600">สิ้นสุด</p>
                      <p className="font-semibold text-slate-900">{formatDateThai(selectedBooking.endDate)}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-slate-600">จำนวนวัน</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedBooking.days}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-slate-600">ราคา/วัน</p>
                    <p className="text-lg font-bold text-purple-600">฿{selectedBooking.pricePerDay}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-slate-600">รวม</p>
                    <p className="text-lg font-bold text-green-600">฿{selectedBooking.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">สถานะ</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">การชำระเงิน</p>
                  {getPaymentBadge(selectedBooking.paymentStatus)}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {selectedBooking.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedBooking.id, 'confirmed');
                      setSelectedBooking(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5" />
                    อนุมัติการจอง
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedBooking.id, 'cancelled');
                      setSelectedBooking(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <XCircle className="w-5 h-5" />
                    ยกเลิก
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-bold transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;