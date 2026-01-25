import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // ลบ token จากตัวแปร session หรือ database ถ้ามี
    // ส่วนนี้ทำหน้าที่เพื่อให้ระบบ backend สามารถบันทึก logout event ได้

    return NextResponse.json({
      message: 'ออกจากระบบสำเร็จ',
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการออกจากระบบ' },
      { status: 500 }
    );
  }
}