import { NextResponse } from 'next/server';
import { generateAvailableCardId } from '@/lib/card-id';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await generateAvailableCardId();

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '生成 CardID 失败。',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
