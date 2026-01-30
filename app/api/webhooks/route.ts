import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle webhook payload
    return NextResponse.json({
      success: true,
      message: 'Webhook received'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 400 }
    );
  }
}
