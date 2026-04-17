import { NextResponse } from 'next/server';
import { FeishuClient } from '@/server/feishu/client';
import { getEnvSettings } from '@/server/feishu/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileToken: string }> }
) {
  const { fileToken } = await context.params;
  const normalizedToken = decodeURIComponent(fileToken).trim();

  if (!normalizedToken) {
    return NextResponse.json(
      { message: '缺少飞书附件 fileToken。' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const settings = getEnvSettings();
    const client = new FeishuClient(settings);
    const tenantAccessToken = await client.getTenantAccessToken();
    const response = await fetch(
      `https://open.feishu.cn/open-apis/drive/v1/medias/${normalizedToken}/download`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tenantAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          message: `飞书附件读取失败：${response.status} ${response.statusText}`,
        },
        {
          status: response.status,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    return new NextResponse(Buffer.from(await response.arrayBuffer()), {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '飞书附件读取失败。',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
