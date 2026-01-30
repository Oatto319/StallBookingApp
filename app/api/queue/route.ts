import { NextRequest, NextResponse } from "next/server";

// In-memory queue storage (temporary until we migrate to Prisma)
let bookingQueue: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stallId = searchParams.get("stallId");
    const bookingDate = searchParams.get("bookingDate");
    const userId = searchParams.get("userId");

    // ดึงสถานะคิวของผู้ใช้
    if (userId && stallId && bookingDate) {
      const userQueue = bookingQueue.find(
        (q) =>
          q.stallId === stallId &&
          q.bookingDate === bookingDate &&
          q.userId === userId
      );

      if (!userQueue) {
        return NextResponse.json(
          { message: "ไม่พบข้อมูลคิว", queueStatus: null },
          { status: 404 }
        );
      }

      // คำนวณเวลาที่เหลือ
      const timeLeftMs = new Date(userQueue.offerExpiry).getTime() - Date.now();
      const timeLeft = Math.max(0, Math.ceil(timeLeftMs / 1000)); // เลขวินาที

      return NextResponse.json({
        message: "ข้อมูลคิว",
        queueStatus: {
          id: userQueue.id,
          position: userQueue.queuePosition,
          status: userQueue.status,
          totalInQueue: bookingQueue.filter(
            (q) => q.stallId === stallId && q.bookingDate === bookingDate
          ).length,
          timeLeft: timeLeft,
          stallId,
          bookingDate,
        },
      });
    }

    // ดึงรายชื่อทั้งหมดในคิวสำหรับจอดและวันที่นั้นๆ
    if (stallId && bookingDate) {
      const queue = bookingQueue
        .filter((q) => q.stallId === stallId && q.bookingDate === bookingDate)
        .sort((a, b) => a.queuePosition - b.queuePosition);

      return NextResponse.json({
        message: "รายชื่อในคิว",
        queue: queue,
        totalCount: queue.length,
      });
    }

    return NextResponse.json(
      { message: "กรุณาระบุ stallId, bookingDate" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Queue GET error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลคิว" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stallId, bookingDate, userId, userName } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!stallId || !bookingDate || !userId || !userName) {
      return NextResponse.json(
        { message: "กรุณาระบุข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าผู้ใช้อยู่ในคิวแล้วหรือไม่
    const existingQueue = bookingQueue.find(
      (q) =>
        q.stallId === stallId &&
        q.bookingDate === bookingDate &&
        q.userId === userId
    );

    if (existingQueue) {
      return NextResponse.json(
        { message: "คุณอยู่ในคิวแล้ว", queueId: existingQueue.id },
        { status: 409 }
      );
    }

    // คำนวณตำแหน่งในคิว
    const queueForThisStallDate = bookingQueue.filter(
      (q) => q.stallId === stallId && q.bookingDate === bookingDate
    );
    const newPosition = queueForThisStallDate.length + 1;

    // สร้างรายการคิวใหม่
    const newQueue = {
      id: `queue_${Date.now()}_${Math.random()}`,
      stallId,
      bookingDate,
      userId,
      userName,
      status: "WAITING",
      queuePosition: newPosition,
      createdAt: new Date(),
      offerExpiry: null as null | Date,
      notified: false,
    };

    bookingQueue.push(newQueue);

    // ถ้าเป็นคนแรกในคิว ให้เสนออนุมัติทันที
    if (newPosition === 1) {
      newQueue.status = "OFFERED";
      newQueue.offerExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที
      newQueue.notified = true;
    }

    return NextResponse.json(
      {
        message: "เข้าคิวสำเร็จ",
        queueId: newQueue.id,
        position: newPosition,
        status: newQueue.status,
        totalInQueue: newPosition,
        offerExpiry: newQueue.offerExpiry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Queue POST error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการสร้างคิว" },
      { status: 500 }
    );
  }
}

// PATCH - ยอมรับหรือปฏิเสธเสนอ
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { queueId, action } = body; // action: "ACCEPT" หรือ "REJECT"

    if (!queueId || !action) {
      return NextResponse.json(
        { message: "กรุณาระบุ queueId และ action" },
        { status: 400 }
      );
    }

    const queueIndex = bookingQueue.findIndex((q) => q.id === queueId);
    if (queueIndex === -1) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลคิว" },
        { status: 404 }
      );
    }

    const queue = bookingQueue[queueIndex];

    if (action === "ACCEPT") {
      queue.status = "ACCEPTED";
      queue.offerExpiry = null;

      return NextResponse.json({
        message: "ยอมรับเสนอสำเร็จ คุณสามารถทำการจองได้เลย",
        queueStatus: queue,
      });
    } else if (action === "REJECT") {
      queue.status = "EXPIRED";
      queue.offerExpiry = null;

      // ลบคิวนี้ออก และจัดลำดับใหม่
      bookingQueue.splice(queueIndex, 1);

      // อัปเดตตำแหน่งใหม่และเสนออันดับถัดไป (ถ้ามี)
      const remainingQueue = bookingQueue.filter(
        (q) => q.stallId === queue.stallId && q.bookingDate === queue.bookingDate
      );
      remainingQueue.forEach((q, index) => {
        q.queuePosition = index + 1;
        if (index === 0) {
          q.status = "OFFERED";
          q.offerExpiry = new Date(Date.now() + 10 * 60 * 1000);
          q.notified = true;
        }
      });

      return NextResponse.json({
        message: "ปฏิเสธเสนอแล้ว",
        nextInQueue: remainingQueue[0] || null,
      });
    }

    return NextResponse.json(
      { message: "action ไม่ถูกต้อง" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Queue PATCH error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการอัปเดตคิว" },
      { status: 500 }
    );
  }
}

// DELETE - ออกจากคิว
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { queueId } = body;

    if (!queueId) {
      return NextResponse.json(
        { message: "กรุณาระบุ queueId" },
        { status: 400 }
      );
    }

    const queueIndex = bookingQueue.findIndex((q) => q.id === queueId);
    if (queueIndex === -1) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลคิว" },
        { status: 404 }
      );
    }

    const removedQueue = bookingQueue[queueIndex];
    bookingQueue.splice(queueIndex, 1);

    // จัดลำดับใหม่สำหรับคนที่เหลือ
    const remainingQueue = bookingQueue.filter(
      (q) =>
        q.stallId === removedQueue.stallId &&
        q.bookingDate === removedQueue.bookingDate
    );
    remainingQueue.forEach((q, index) => {
      q.queuePosition = index + 1;
      if (index === 0) {
        q.status = "OFFERED";
        q.offerExpiry = new Date(Date.now() + 10 * 60 * 1000);
        q.notified = true;
      }
    });

    return NextResponse.json({
      message: "ออกจากคิวสำเร็จ",
      nextInQueue: remainingQueue[0] || null,
    });
  } catch (error) {
    console.error("Queue DELETE error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการลบคิว" },
      { status: 500 }
    );
  }
}
