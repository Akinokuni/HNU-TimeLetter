import { FeishuClient } from './client';
import type { FeishuConnectionSettings } from './types';

type WikiNodeResponse = {
  node?: {
    obj_type?: string;
    obj_token?: string;
  };
};

export interface ParsedFeishuTableLink {
  raw: string;
  wikiNodeToken?: string;
  appToken?: string;
  tableId?: string;
  viewId?: string;
}

export interface ResolvedFeishuTableLink extends ParsedFeishuTableLink {
  appToken: string;
}

export function parseFeishuTableLink(rawLink: string): ParsedFeishuTableLink {
  const raw = rawLink.trim();
  if (!raw) {
    throw new Error('缺少飞书表格链接');
  }

  try {
    const url = new URL(raw);
    const segments = url.pathname.split('/').filter(Boolean);
    const wikiIndex = segments.indexOf('wiki');
    const baseIndex = segments.indexOf('base');

    return {
      raw,
      wikiNodeToken: wikiIndex >= 0 ? segments[wikiIndex + 1] : undefined,
      appToken: baseIndex >= 0 ? segments[baseIndex + 1] : undefined,
      tableId: url.searchParams.get('table')?.trim() || undefined,
      viewId: url.searchParams.get('view')?.trim() || undefined,
    };
  } catch {
    return {
      raw,
      wikiNodeToken: raw,
    };
  }
}

export async function resolveFeishuTableLink(
  settings: FeishuConnectionSettings,
  rawLink: string
): Promise<ResolvedFeishuTableLink> {
  const parsed = parseFeishuTableLink(rawLink);

  if (parsed.appToken) {
    return {
      ...parsed,
      appToken: parsed.appToken,
    };
  }

  if (!parsed.wikiNodeToken) {
    throw new Error('无法从链接中解析出 Wiki 节点 token');
  }

  const client = new FeishuClient(settings);
  const tenantToken = await client.getTenantAccessToken();
  const response = await fetch(
    `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(parsed.wikiNodeToken)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tenantToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
    }
  );

  const payload = (await response.json()) as {
    code: number;
    msg: string;
    data?: WikiNodeResponse;
  };

  if (payload.code !== 0) {
    throw new Error(`获取 Wiki 节点失败: ${payload.msg || payload.code}`);
  }

  const node = payload.data?.node;
  if (node?.obj_type !== 'bitable' || !node.obj_token) {
    throw new Error('当前 Wiki 节点不是多维表格，无法解析 app_token');
  }

  return {
    ...parsed,
    appToken: node.obj_token,
  };
}
