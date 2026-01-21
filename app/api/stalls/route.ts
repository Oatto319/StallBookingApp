import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ✅ ต้องมีปีกกา { prisma } เพราะเรา export const

export async function GET() {
  try {
    const stalls = await prisma.stall.findMany({
      orderBy: {
        code: 'asc',
      },
    });
    return NextResponse.json(stalls);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
  }
}