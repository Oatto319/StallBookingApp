// lib/bookingService.ts
export interface Booking {
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
  sessionId?: string;
}

export interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'system';
  message: string;
  time: string;
  read: boolean;
  bookingId?: string;
}

const BOOKINGS_KEY = 'market_bookings';
const NOTIFICATIONS_KEY = 'market_notifications';

// ==================== BOOKINGS ====================

// Get all bookings
export const getAllBookings = (): Booking[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BOOKINGS_KEY);
  return data ? JSON.parse(data) : [];
};

// Add new booking
export const addBooking = (booking: Omit<Booking, 'id' | 'createdAt'>): Booking => {
  const bookings = getAllBookings();
  const newBooking: Booking = {
    ...booking,
    id: `BK${String(bookings.length + 1001).padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
  };
  
  bookings.push(newBooking);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  
  // Add notification
  addNotification({
    type: 'booking',
    message: `การจองใหม่: ${booking.customerName} - ช่อง ${booking.stallNumber}`,
    time: 'เมื่อสักครู่',
    read: false,
    bookingId: newBooking.id
  });
  
  return newBooking;
};

// Update booking status
export const updateBookingStatus = (
  bookingId: string, 
  status: Booking['status'],
  paymentStatus?: Booking['paymentStatus']
): boolean => {
  const bookings = getAllBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  
  if (index === -1) return false;
  
  const oldStatus = bookings[index].status;
  bookings[index].status = status;
  if (paymentStatus) {
    bookings[index].paymentStatus = paymentStatus;
  }
  
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  
  // Add notification for status change
  if (oldStatus !== status) {
    const statusLabels = {
      pending: 'รอดำเนินการ',
      confirmed: 'ยืนยันแล้ว',
      cancelled: 'ยกเลิก',
      completed: 'เสร็จสิ้น'
    };
    
    addNotification({
      type: 'booking',
      message: `เปลี่ยนสถานะ ${bookings[index].stallNumber}: ${statusLabels[oldStatus]} → ${statusLabels[status]}`,
      time: 'เมื่อสักครู่',
      read: false,
      bookingId: bookingId
    });
  }
  
  return true;
};

// Delete booking
export const deleteBooking = (bookingId: string): boolean => {
  const bookings = getAllBookings();
  const booking = bookings.find(b => b.id === bookingId);
  const filtered = bookings.filter(b => b.id !== bookingId);
  
  if (filtered.length === bookings.length) return false;
  
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(filtered));
  
  if (booking) {
    addNotification({
      type: 'system',
      message: `ลบการจอง: ${booking.stallNumber} - ${booking.customerName}`,
      time: 'เมื่อสักครู่',
      read: false,
    });
  }
  
  return true;
};

// Get booking by ID
export const getBookingById = (bookingId: string): Booking | null => {
  const bookings = getAllBookings();
  return bookings.find(b => b.id === bookingId) || null;
};

// Get bookings by stall
export const getBookingsByStall = (stallNumber: string): Booking[] => {
  const bookings = getAllBookings();
  return bookings.filter(b => b.stallNumber === stallNumber);
};

// Check if stall is available for date range
export const isStallAvailable = (
  stallNumber: string, 
  startDate: string, 
  endDate: string
): boolean => {
  const bookings = getBookingsByStall(stallNumber);
  const activeBookings = bookings.filter(
    b => b.status === 'confirmed' || b.status === 'pending'
  );
  
  return !activeBookings.some(booking => {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    const requestStart = new Date(startDate);
    const requestEnd = new Date(endDate);
    
    return (
      (requestStart >= bookingStart && requestStart <= bookingEnd) ||
      (requestEnd >= bookingStart && requestEnd <= bookingEnd) ||
      (requestStart <= bookingStart && requestEnd >= bookingEnd)
    );
  });
};

// ==================== NOTIFICATIONS ====================

// Get all notifications
export const getNotifications = (): Notification[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

// Add notification
export const addNotification = (notification: Omit<Notification, 'id'>): Notification => {
  const notifications = getNotifications();
  const newNotif: Notification = {
    ...notification,
    id: `NOTIF${Date.now()}${Math.random()}`,
  };
  
  notifications.unshift(newNotif);
  // Keep only last 50 notifications
  const trimmed = notifications.slice(0, 50);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
  
  return newNotif;
};

// Mark notification as read
export const markNotificationAsRead = (id: string): boolean => {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === id);
  
  if (index === -1) return false;
  
  notifications[index].read = true;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  return true;
};

// Mark all as read
export const markAllNotificationsAsRead = (): void => {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
};

// ==================== STATISTICS ====================

export interface BookingStats {
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

export const calculateStats = (): BookingStats => {
  const bookings = getAllBookings();
  
  const pending = bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;
  
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.totalPrice, 0);
  
  const pendingRevenue = bookings
    .filter(b => b.paymentStatus === 'pending' && b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalPrice, 0);
  
  // Get unique stalls that are currently booked
  const occupiedStallsSet = new Set(
    bookings
      .filter(b => b.status === 'confirmed' || b.status === 'pending')
      .map(b => b.stallNumber)
  );
  const occupied = occupiedStallsSet.size;
  
  return {
    totalBookings: bookings.length,
    pendingBookings: pending,
    confirmedBookings: confirmed,
    completedBookings: completed,
    cancelledBookings: cancelled,
    totalRevenue: totalRevenue,
    pendingRevenue: pendingRevenue,
    availableStalls: 100 - occupied,
    occupiedStalls: occupied
  };
};