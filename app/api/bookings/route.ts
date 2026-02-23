import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';    

export async function POST(request: Request) {
  try {
    // 1. รับค่าจากหน้าบ้าน (ชื่อคนจอง, เบอร์โทร, รหัสแผง, วันที่)
    const body = await request.json();
    const { customerName, customerTel, stallCode, bookingDate } = body;

    // แปลงวันที่ให้เป็น Object Date ของ Javascript
    const targetDate = new Date(bookingDate);

    // 2. ค้นหา Stall ID จาก Stall Code (เช่น A01 -> ID ยาวๆ)
    const stall = await prisma.stall.findFirst({
      where: { code: stallCode }
    });

    if (!stall) {
      return NextResponse.json({ error: 'ไม่พบหมายเลขแผงนี้' }, { status: 404 });
    }

    // 3. เริ่ม Transaction (เพื่อให้เช็คและจองเกิดขึ้นพร้อมกัน ป้องกันคนจองชนกัน)
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      
      // A. เช็คว่ามีคนจองไปแล้วหรือยัง? (สถานะต้องไม่ใช่ CANCELLED)
      const existingBooking = await tx.booking.findFirst({
        where: {
          stallId: stall.id,
          bookingDate: targetDate,
          status: { not: 'CANCELLED' } // สถานะอื่นๆ ถือว่าไม่ว่าง
        }
      });

      if (existingBooking) {
        throw new Error('OCCUPIED'); // ถ้าเจอว่ามีคนจอง ให้เด้ง error ออกไปทันที
      }

      // B. ถ้าว่าง ให้สร้าง Booking ใหม่
      const newBooking = await tx.booking.create({
        data: {
          stallId: stall.id,
          customerName,
          customerTel,
          bookingDate: targetDate,
          status: 'PENDING_PAYMENT' // สถานะเริ่มต้นคือ รอจ่ายเงิน
        }
      });

      return newBooking;
    });

    // 4. จองสำเร็จ! ส่งข้อมูลกลับไป
    return NextResponse.json({ 
      success: true, 
      message: 'จองสำเร็จ! กรุณาชำระเงิน',
      booking: result 
    });

  } catch (error: any) {
    console.error('Booking error:', error);
    if (error.message === 'OCCUPIED') {
      return NextResponse.json({ error: 'เสียใจด้วย ล็อคนี้ถูกจองไปแล้วในวันนี้' }, { status: 409 });
    }
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการจอง',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}