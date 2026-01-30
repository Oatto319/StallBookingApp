import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUsers, initializeUsers, findUserByEmail } from "@/lib/users";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export async function POST(request: NextRequest) {
  try {
    // Initialize users (create admin if not exists)
    await initializeUsers();

    const body = await request.json();
    const { email, password } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!email || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกอีเมลและรหัสผ่าน" },
        { status: 400 }
      );
    }

    // ค้นหาผู้ใช้ในฐานข้อมูล
    const user = findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { message: "ไม่พบผู้ใช้งานในระบบ" },
        { status: 401 }
      );
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // สร้าง JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.userType,
        isAdmin: user.isAdmin || false,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ส่งข้อมูลผู้ใช้กลับ (ไม่รวมรหัสผ่าน)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" },
      { status: 500 }
    );
  }
}