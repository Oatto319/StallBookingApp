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
    console.error('Error fetching stalls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stalls', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}