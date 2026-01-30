import bcrypt from "bcryptjs";

// Shared user storage (in-memory) - ใช้ร่วมกันระหว่าง login/register
let users: any[] = [];

// ✅ Initialize with Admin and Test User accounts
export const initializeUsers = async () => {
  // ตรวจสอบว่า admin มีอยู่หรือไม่
  if (users.some(u => u.email === 'admin@example.com')) {
    return users;
  }

  // สร้าง Admin account
  const hashedAdminPassword = await bcrypt.hash('Admin@1234', 10);
  const adminUser = {
    id: 1,
    firstName: 'แอดมิน',
    lastName: 'ระบบ',
    email: 'admin@example.com',
    phone: '0800000000',
    password: hashedAdminPassword,
    userType: 'admin',
    isAdmin: true,
    createdAt: new Date().toISOString(),
  };
  users.push(adminUser);
  console.log('✅ Admin account initialized: admin@example.com / Admin@1234');

  // สร้าง Test User account
  const hashedUserPassword = await bcrypt.hash('User@1234', 10);
  const testUser = {
    id: 2,
    firstName: 'ทดสอบ',
    lastName: 'ผู้ใช้',
    email: 'user@example.com',
    phone: '0812345678',
    password: hashedUserPassword,
    userType: 'buyer',
    isAdmin: false,
    createdAt: new Date().toISOString(),
  };
  users.push(testUser);
  console.log('✅ Test user account initialized: user@example.com / User@1234');
  
  return users;
};

// ✅ Get all users
export const getUsers = (): any[] => {
  return users;
};

// ✅ Add user
export const addUser = (user: any) => {
  users.push(user);
  return user;
};

// ✅ Find user by email
export const findUserByEmail = (email: string) => {
  return users.find(u => u.email === email);
};

// ✅ Get next user ID
export const getNextUserId = () => {
  return users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
};

// Initialize on module load
initializeUsers().catch(err => console.error('Error initializing users:', err));
