import type {
  FeishuRecord,
  SyncAuthService,
  SyncBitableService,
  SyncEnvironmentSettings,
} from '../types';

type FeishuApiEnvelope<T> = {
  code: number;
  msg: string;
  data: T;
};

type PagedData<T> = {
  items?: T[];
  has_more?: boolean;
  page_token?: string;
};

export class FeishuBitableClient implements SyncBitableService {
  constructor(
    private readonly auth: SyncAuthService,
    private readonly settings: SyncEnvironmentSettings,
  ) {}

  private get appToken() {
    if (!this.settings.feishuAppToken) {
      throw new Error('缺少 FEISHU_APP_TOKEN');
    }

    return this.settings.feishuAppToken;
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const tenantToken = await this.auth.getTenantAccessToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${tenantToken}`,
        'Content-Type': 'application/json; charset=utf-8',
        ...(init.headers ?? {}),
      },
    });

    const payload = (await response.json()) as FeishuApiEnvelope<T>;
    if (payload.code !== 0) {
      throw new Error(payload.msg || `飞书多维表格接口调用失败 (${payload.code})`);
    }

    return payload.data;
  }

  async listRecords(tableId: string): Promise<FeishuRecord[]> {
    const items: FeishuRecord[] = [];
    let pageToken = '';
    let hasMore = true;

    while (hasMore) {
      const query = new URLSearchParams({ page_size: '500' });
      if (pageToken) {
        query.set('page_token', pageToken);
      }

      const data = await this.request<PagedData<FeishuRecord>>(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/records?${query.toString()}`,
        {
          method: 'GET',
        },
      );

      items.push(...(data.items ?? []));
      hasMore = Boolean(data.has_more);
      pageToken = data.page_token ?? '';
    }

    return items;
  }

  async searchRecords(
    tableId: string,
    body: Record<string, unknown>,
  ): Promise<FeishuRecord[]> {
    const items: FeishuRecord[] = [];
    let pageToken = '';
    let hasMore = true;

    while (hasMore) {
      const data = await this.request<PagedData<FeishuRecord>>(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/records/search`,
        {
          method: 'POST',
          body: JSON.stringify({
            page_size: 500,
            ...body,
            ...(pageToken ? { page_token: pageToken } : {}),
          }),
        },
      );

      items.push(...(data.items ?? []));
      hasMore = Boolean(data.has_more);
      pageToken = data.page_token ?? '';
    }

    return items;
  }

  async createRecord(
    tableId: string,
    fields: Record<string, unknown>,
  ): Promise<FeishuRecord> {
    const data = await this.request<{ record: FeishuRecord }>(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/records`,
      {
        method: 'POST',
        body: JSON.stringify({ fields }),
      },
    );

    return data.record;
  }

  async updateRecord(
    tableId: string,
    recordId: string,
    fields: Record<string, unknown>,
  ): Promise<FeishuRecord> {
    const data = await this.request<{ record: FeishuRecord }>(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/records/${recordId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ fields }),
      },
    );

    return data.record;
  }
}
