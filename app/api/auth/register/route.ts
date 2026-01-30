import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUsers, initializeUsers, findUserByEmail, addUser, getNextUserId } from "@/lib/users";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export async function POST(request: NextRequest) {
  try {
    // Initialize users (create admin if not exists)
    await initializeUsers();

    const body = await request.json();
    const { firstName, lastName, email, phone, password, userType } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบความยาวรหัสผ่าน
    if (password.length < 6) {
      return NextResponse.json(
        { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างผู้ใช้ใหม่
    const newUser = {
      id: getNextUserId(),
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      userType: userType || "seller",
      isAdmin: userType === 'admin' ? true : false,
      createdAt: new Date().toISOString(),
    };

    // เพิ่มผู้ใช้ในฐานข้อมูล
    addUser(newUser);

    // สร้าง JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        userType: newUser.userType,
        isAdmin: newUser.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ส่งข้อมูลผู้ใช้กลับ (ไม่รวมรหัสผ่าน)
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        message: "สมัครสมาชิกสำเร็จ",
        token,
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" },
      { status: 500 }
    );
  }
}