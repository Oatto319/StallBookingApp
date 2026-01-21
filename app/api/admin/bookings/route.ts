import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: { stall: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body; 
    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}