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
  Edit,
  Trash2,
  LogOut,
  Bell,
  Settings,
  MapPin,
  FileText,
  BarChart3,
  Home,
  X,
  Plus,
  RefreshCw,
  User,
  Mail,
  Phone,
  CreditCard,
  AlertTriangle,
  TrendingDown
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
}

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  pendingRevenue: number;
  availableStalls: number;
  occupiedStalls: number;
}

interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'system';
  message: string;
  time: string;
  read: boolean;
}

// Thai names for realistic data
const thaiFirstNames = [
  'สมชาย', 'สมหญิง', 'วิชัย', 'วิภา', 'สุรชัย', 'สุดารัตน์', 'ประเสริฐ', 'ประภา',
  'นิคม', 'นิภา', 'วิทยา', 'วิมล', 'เจริญ', 'จันทร์', 'ชัยยา', 'ชาญชัย',
  'ธนพล', 'ธนพร', 'อนุชา', 'อนงค์', 'พิชัย', 'พิมพ์', 'กิตติ', 'กัญญา',
  'ศักดิ์', 'ศิริ', 'รัตน์', 'รุ่ง', 'สุทธิ', 'สุพัตร', 'บุญมี', 'บุญธรรม',
  'มานพ', 'มาลัย', 'ยศ', 'ยุพา', 'ลักษณ์', 'ลัดดา', 'วรรณ', 'วาสนา',
  'สมพร', 'สมบัติ', 'ณัฐ', 'นัท', 'ภัทร', 'ภาวิน', 'อภิชัย', 'อรุณ'
];

const thaiLastNames = [
  'ใจดี', 'รักดี', 'มั่นคง', 'เจริญ', 'สุขใส', 'ทองดี', 'สุวรรณ', 'เพชร',
  'ศรีสุข', 'พูลสวัสดิ์', 'บุญมา', 'ชัยชนะ', 'วิชัยดิษฐ', 'สมบูรณ์', 'รุ่งเรือง',
  'ประสงค์', 'สิริมงคล', 'มงคล', 'เกียรติ', 'ภูมิใจ', 'แสงทอง', 'จันทร์เจ้า',
  'สว่างวงศ์', 'ชัยวัฒน์', 'ธนากร', 'วรวุฒิ', 'สุขสันต์', 'รัตนพันธ์'
];

const AdminDashboard = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    availableStalls: 75,
    occupiedStalls: 25
  });

  // Check authentication
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin !== 'true') {
      alert('กรุณา Login ด้วยบัญชี Admin');
      router.push('/');
      return;
    }
  }, [router]);

  // Generate realistic mock bookings
  useEffect(() => {
    generateBookings();
    generateNotifications();
  }, []);

  const generateBookings = () => {
    const zones = [
      { name: 'A', price: 500, size: 'เล็ก (2x2 ม.)' },
      { name: 'B', price: 600, size: 'กลาง (2x3 ม.)' },
      { name: 'C', price: 700, size: 'กลาง (2x3 ม.)' },
      { name: 'D', price: 800, size: 'ใหญ่ (3x3 ม.)' },
      { name: 'E', price: 900, size: 'ใหญ่ (3x4 ม.)' }
    ];

    const mockBookings: Booking[] = Array.from({ length: 100 }, (_, i) => {
      const paymentMethods: Array<'creditcard' | 'bank' | 'promptpay'> = ['creditcard', 'bank', 'promptpay'];
      
      // Realistic distribution of statuses
      let status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
      const rand = Math.random();
      if (rand < 0.15) status = 'pending';
      else if (rand < 0.55) status = 'confirmed';
      else if (rand < 0.75) status = 'completed';
      else status = 'cancelled';

      // Payment status based on booking status
      let paymentStatus: 'pending' | 'paid' | 'refunded';
      if (status === 'cancelled') {
        paymentStatus = Math.random() < 0.7 ? 'refunded' : 'pending';
      } else if (status === 'pending') {
        paymentStatus = 'pending';
      } else {
        paymentStatus = Math.random() < 0.9 ? 'paid' : 'pending';
      }
      
      const firstName = thaiFirstNames[Math.floor(Math.random() * thaiFirstNames.length)];
      const lastName = thaiLastNames[Math.floor(Math.random() * thaiLastNames.length)];
      
      const zone = zones[Math.floor(i / 20)];
      const stallNum = String((i % 20) + 1).padStart(2, '0');
      const stallNumber = `${zone.name}${stallNum}`;
      
      const days = Math.floor(Math.random() * 7) + 1;
      
      // Random dates in the past 3 months
      const daysAgo = Math.floor(Math.random() * 90);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      
      const createdAt = new Date(startDate);
      createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 48));
      
      return {
        id: `BK${String(i + 1).padStart(4, '0')}`,
        stallNumber: stallNumber,
        customerName: `${firstName} ${lastName}`,
        phone: `0${Math.floor(Math.random() * 2) + 8}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        bookingDate: startDate.toISOString().split('T')[0],
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: days,
        pricePerDay: zone.price,
        totalPrice: days * zone.price,
        status: status,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        createdAt: createdAt.toISOString(),
        zone: zone.name,
        size: zone.size
      };
    });

    setBookings(mockBookings);
    calculateStats(mockBookings);
  };

  const generateNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'booking',
        message: 'มีการจองใหม่ 3 รายการรอการอนุมัติ',
        time: '5 นาทีที่แล้ว',
        read: false
      },
      {
        id: '2',
        type: 'payment',
        message: 'ได้รับการชำระเงิน ฿15,000 จาก สมชาย ใจดี',
        time: '1 ชั่วโมงที่แล้ว',
        read: false
      },
      {
        id: '3',
        type: 'system',
        message: 'อัพเดทระบบเสร็จสมบูรณ์',
        time: '3 ชั่วโมงที่แล้ว',
        read: true
      }
    ];
    setNotifications(mockNotifications);
  };

  const calculateStats = (bookingList: Booking[]) => {
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
    
    const occupied = bookingList.filter(b => 
      b.status === 'confirmed' || b.status === 'pending'
    ).length;

    setStats({
      totalBookings: bookingList.length,
      pendingBookings: pending,
      confirmedBookings: confirmed,
      completedBookings: completed,
      cancelledBookings: cancelled,
      totalRevenue: totalRevenue,
      pendingRevenue: pendingRevenue,
      availableStalls: 100 - occupied,
      occupiedStalls: occupied
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
        return { ...b, status: newStatus, paymentStatus: newPaymentStatus };
      }
      return b;
    });

    setBookings(updatedBookings);
    calculateStats(updatedBookings);
    alert('อัพเดทสถานะเรียบร้อย!');
  };

  // Handle delete booking
  const handleDeleteBooking = (bookingId: string) => {
    if (!confirm('ยืนยันการลบการจองนี้? การกระทำนี้ไม่สามารถยกเลิกได้')) return;

    const updatedBookings = bookings.filter(b => b.id !== bookingId);
    setBookings(updatedBookings);
    calculateStats(updatedBookings);
    setSelectedBooking(null);
    alert('ลบการจองเรียบร้อย!');
  };

  // Handle export
  const handleExport = () => {
    setIsExporting(true);
    
    // Create CSV content
    const headers = ['รหัส', 'ช่อง', 'ลูกค้า', 'โทรศัพท์', 'อีเมล', 'วันที่เริ่ม', 'วันที่สิ้นสุด', 'จำนวนวัน', 'ยอดเงิน', 'สถานะ', 'การชำระ'];
    const rows = filteredBookings.map(b => [
      b.id,
      b.stallNumber,
      b.customerName,
      b.phone,
      b.email,
      b.startDate,
      b.endDate,
      b.days,
      b.totalPrice,
      getStatusLabel(b.status),
      getPaymentLabel(b.paymentStatus)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
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
    generateBookings();
    generateNotifications();
    alert('รีเฟรชข้อมูลเรียบร้อย!');
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm('ยืนยันการออกจากระบบ?')) {
      localStorage.removeItem('isAdmin');
      router.push('/');
    }
  };

  // Mark notification as read
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 pt-20">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">ระบบจัดการตลาด</p>
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

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-slate-100 relative transition-colors"
                >
                  <Bell className="w-6 h-6 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
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
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !notif.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              !notif.read ? 'bg-blue-500' : 'bg-slate-300'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-800">{notif.message}</p>
                              <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Settings className="w-6 h-6 text-slate-600" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">ออก</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">การจองทั้งหมด</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.totalBookings}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-green-600 font-medium">+12%</span>
              <span className="text-xs text-slate-500">จากเดือนที่แล้ว</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">รอดำเนินการ</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.pendingBookings}</p>
            <div className="mt-2">
              <span className="text-xs text-slate-500">รอการอนุมัติ</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">ยืนยันแล้ว</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.confirmedBookings}</p>
            <div className="mt-2">
              <span className="text-xs text-green-600 font-medium">อัตราการอนุมัติ 85%</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">รายได้รวม</h3>
            <p className="text-3xl font-bold text-slate-900">฿{stats.totalRevenue.toLocaleString()}</p>
            <div className="mt-2">
              <span className="text-xs text-purple-600 font-medium">รอชำระ ฿{stats.pendingRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-md text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">เสร็จสิ้น</h3>
              <CheckCircle className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{stats.completedBookings}</p>
            <p className="text-xs opacity-75 mt-1">รายการที่เสร็จสมบูรณ์</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 shadow-md text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">ยกเลิก</h3>
              <XCircle className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{stats.cancelledBookings}</p>
            <p className="text-xs opacity-75 mt-1">
              อัตรายกเลิก {((stats.cancelledBookings / stats.totalBookings) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-md text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">ช่องว่าง</h3>
              <Store className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{stats.availableStalls}</p>
            <p className="text-xs opacity-75 mt-1">จาก 100 ช่อง</p>
          </div>
        </div>

        {/* Stall Availability */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              สถิติการจองช่อง
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">ช่องว่าง</span>
                  <span className="text-sm font-semibold text-green-600">{stats.availableStalls}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.availableStalls}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">ช่องที่จองแล้ว</span>
                  <span className="text-sm font-semibold text-blue-600">{stats.occupiedStalls}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.occupiedStalls}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">อัตราการใช้งาน</p>
                    <p className="text-2xl font-bold text-green-600">{stats.occupiedStalls}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">เฉลี่ยรายได้/ช่อง</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ฿{stats.occupiedStalls > 0 ? Math.round(stats.totalRevenue / stats.occupiedStalls).toLocaleString() : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <h3 className="font-bold text-lg text-slate-800 mb-4">ลิงก์ด่วน</h3>
            <div className="space-y-2">
              <Link
                href="/minimap"
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-left border border-transparent hover:border-blue-200 group"
              >
                <MapPin className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-slate-700">ดูผังตลาด</span>
              </Link>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors text-left border border-transparent hover:border-green-200 group"
              >
                <FileText className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-slate-700">ออกรายงาน</span>
              </button>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors text-left border border-transparent hover:border-purple-200 group"
              >
                <Users className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-slate-700">จัดการลูกค้า</span>
              </button>
              <button
                onClick={() => router.push('/booking')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors text-left border border-transparent hover:border-orange-200 group"
              >
                <Plus className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-slate-700">เพิ่มการจองใหม่</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Store className="w-6 h-6 text-blue-600" />
                รายการจองทั้งหมด ({filteredBookings.length})
              </h2>
              
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหา รหัส, ชื่อ, โทร, อีเมล..."
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-72"
                  />
                </div>

                {/* Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                  >
                    <option value="all">ทุกสถานะ ({bookings.length})</option>
                    <option value="pending">รอดำเนินการ ({stats.pendingBookings})</option>
                    <option value="confirmed">ยืนยันแล้ว ({stats.confirmedBookings})</option>
                    <option value="completed">เสร็จสิ้น ({stats.completedBookings})</option>
                    <option value="cancelled">ยกเลิก ({stats.cancelledBookings})</option>
                  </select>
                </div>

                {/* Export */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">
                    {isExporting ? 'กำลังดาวน์โหลด...' : 'Export CSV'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">รหัส</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ช่อง</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ลูกค้า</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ติดต่อ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">วันที่</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">จำนวนวัน</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ยอดเงิน</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">การชำระ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{booking.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">{booking.zone}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{booking.stallNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{booking.customerName}</p>
                        <p className="text-xs text-slate-500">{booking.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{booking.phone}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="text-slate-900 font-medium">{new Date(booking.startDate).toLocaleDateString('th-TH')}</p>
                        <p className="text-slate-500">ถึง {new Date(booking.endDate).toLocaleDateString('th-TH')}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-purple-600">{booking.days} วัน</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-green-600">฿{booking.totalPrice.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">฿{booking.pricePerDay}/วัน</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getPaymentBadge(booking.paymentStatus)}</td>
                    <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => setSelectedBooking(booking)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="อนุมัติ"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="ยกเลิก"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            
            {filteredBookings.length === 0 && (
              <div className="p-10 text-center text-slate-500">
                <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">ไม่พบรายการจอง</p>
                <p className="text-sm mt-1">ลองค้นหาด้วยคำอื่นหรือเปลี่ยนตัวกรอง</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                รายละเอียดการจอง
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Booking ID and Stall */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">รหัสการจอง</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedBooking.id}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-1">ช่อง / โซน</p>
                  <p className="text-2xl font-bold text-green-700">{selectedBooking.stallNumber} / Zone {selectedBooking.zone}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  ข้อมูลลูกค้า
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">ชื่อ-นามสกุล</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      เบอร์โทร
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{selectedBooking.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      อีเมล
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{selectedBooking.email}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border-2 border-purple-200">
                  <p className="text-sm text-slate-600 mb-1">ขนาดช่อง</p>
                  <p className="text-base font-bold text-purple-600">{selectedBooking.size}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-orange-200">
                  <p className="text-sm text-slate-600 mb-1">วิธีชำระเงิน</p>
                  <p className="text-base font-bold text-orange-600">
                    {selectedBooking.paymentMethod === 'creditcard' ? 'บัตรเครดิต' : 
                     selectedBooking.paymentMethod === 'bank' ? 'โอนธนาคาร' : 'PromptPay'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-slate-600 mb-1">วันที่เริ่มต้น</p>
                  <p className="text-base font-semibold text-blue-700">
                    {new Date(selectedBooking.startDate).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-slate-600 mb-1">วันที่สิ้นสุด</p>
                  <p className="text-base font-semibold text-blue-700">
                    {new Date(selectedBooking.endDate).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Price Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-green-700 mb-1">จำนวนวัน</p>
                    <p className="text-3xl font-bold text-green-600">{selectedBooking.days}</p>
                  </div>
                  <div className="text-center border-x border-green-200">
                    <p className="text-sm text-green-700 mb-1">ราคา/วัน</p>
                    <p className="text-3xl font-bold text-green-600">฿{selectedBooking.pricePerDay}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-green-700 mb-1">รวมทั้งหมด</p>
                    <p className="text-3xl font-bold text-green-600">฿{selectedBooking.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200 text-center">
                  <p className="text-sm text-green-700">
                    คำนวณ: ฿{selectedBooking.pricePerDay} × {selectedBooking.days} วัน = ฿{selectedBooking.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">สถานะการชำระ</p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-slate-600" />
                    {getPaymentBadge(selectedBooking.paymentStatus)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">สถานะการจอง</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </div>

              {/* Creation Date */}
              <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-200">
                <p>สร้างเมื่อ: {new Date(selectedBooking.createdAt).toLocaleString('th-TH')}</p>
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5" />
                    อนุมัติการจอง
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedBooking.id, 'cancelled');
                      setSelectedBooking(null);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <XCircle className="w-5 h-5" />
                    ยกเลิกการจอง
                  </button>
                </>
              )}
              {selectedBooking.status === 'confirmed' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedBooking.id, 'completed');
                    setSelectedBooking(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                  ทำเครื่องหมายเสร็จสิ้น
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-semibold transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Management Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                จัดการลูกค้า
              </h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white">
                  <p className="text-sm opacity-90 mb-1">ลูกค้าทั้งหมด</p>
                  <p className="text-3xl font-bold">{new Set(bookings.map(b => b.customerName)).size}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white">
                  <p className="text-sm opacity-90 mb-1">ลูกค้าที่ใช้งานอยู่</p>
                  <p className="text-3xl font-bold">
                    {new Set(bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').map(b => b.customerName)).size}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white">
                  <p className="text-sm opacity-90 mb-1">ลูกค้าประจำ</p>
                  <p className="text-3xl font-bold">
                    {bookings.filter((b, i, arr) => arr.filter(x => x.customerName === b.customerName).length > 1).length}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-xl">
                <p className="text-sm text-blue-800">
                  💡 <strong>คุณสมบัติ:</strong> ดูรายชื่อลูกค้า ประวัติการจอง และข้อมูลการติดต่อทั้งหมด
                </p>
              </div>

              <div className="text-center py-8">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">รายการลูกค้าพร้อมแสดงผล</p>
                <p className="text-sm text-slate-500">
                  มีลูกค้า {new Set(bookings.map(b => b.customerName)).size} ท่านในระบบ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-600" />
                ออกรายงาน
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    handleExport();
                    setShowReportModal(false);
                  }}
                  className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all group"
                >
                  <Download className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-slate-800 mb-1">Export ข้อมูลการจอง</h4>
                  <p className="text-sm text-slate-600">ดาวน์โหลดรายการจองทั้งหมดเป็น CSV</p>
                </button>

                <button className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all group">
                  <BarChart3 className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-slate-800 mb-1">รายงานสถิติ</h4>
                  <p className="text-sm text-slate-600">วิเคราะห์ข้อมูลการจองและรายได้</p>
                </button>

                <button className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:shadow-lg transition-all group">
                  <DollarSign className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-slate-800 mb-1">รายงานรายได้</h4>
                  <p className="text-sm text-slate-600">สรุปรายได้รายวัน/เดือน/ปี</p>
                </button>

                <button className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl hover:shadow-lg transition-all group">
                  <Calendar className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-slate-800 mb-1">รายงานตามช่วงเวลา</h4>
                  <p className="text-sm text-slate-600">เลือกช่วงวันที่ที่ต้องการ</p>
                </button>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl">
                <p className="text-sm text-yellow-800">
                  💡 <strong>เคล็ดลับ:</strong> รายงานทั้งหมดจะถูกสร้างในรูปแบบ PDF และ CSV สำหรับความสะดวกในการใช้งาน
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-6 h-6 text-slate-600" />
                ตั้งค่าระบบ
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-2">ข้อมูลระบบ</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">เวอร์ชัน:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ผู้ใช้งาน:</span>
                    <span className="font-medium">Admin</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">อัพเดทล่าสุด:</span>
                    <span className="font-medium">{new Date().toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-2">การแจ้งเตือน</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-700">การจองใหม่</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-700">การชำระเงิน</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-700">การยกเลิก</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </label>
                </div>
              </div>

              <button
                onClick={() => {
                  alert('บันทึกการตั้งค่าเรียบร้อย!');
                  setShowSettings(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;