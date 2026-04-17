import type { FeishuConnectionSettings, FeishuRecord, FeishuTableField } from './types';

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

export class FeishuClient {
  private tenantToken?: string;

  constructor(private readonly settings: FeishuConnectionSettings) {}

  private get appToken(): string {
    if (!this.settings.feishuAppToken) {
      throw new Error('缺少 FEISHU_APP_TOKEN');
    }

    return this.settings.feishuAppToken;
  }

  async getTenantAccessToken(): Promise<string> {
    if (this.tenantToken) {
      return this.tenantToken;
    }

    if (!this.settings.feishuAppId || !this.settings.feishuAppSecret) {
      throw new Error('缺少飞书应用凭证，请先填写 App ID 和 App Secret');
    }

    const response = await fetch(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          app_id: this.settings.feishuAppId,
          app_secret: this.settings.feishuAppSecret,
        }),
      }
    );

    const payload = (await response.json()) as FeishuApiEnvelope<{
      tenant_access_token?: string;
    }> & {
      tenant_access_token?: string;
    };
    const tenantAccessToken = payload.tenant_access_token || payload.data?.tenant_access_token;

    if (payload.code !== 0 || !tenantAccessToken) {
      throw new Error(`获取飞书访问令牌失败: ${payload.msg}`);
    }

    this.tenantToken = tenantAccessToken;
    return this.tenantToken;
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const token = await this.getTenantAccessToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
        ...(init?.headers ?? {}),
      },
    });

    const payload = (await response.json()) as FeishuApiEnvelope<T>;
    if (payload.code !== 0) {
      throw new Error(payload.msg || `飞书接口调用失败 (${payload.code})`);
    }

    return payload.data;
  }

  async listFields(tableId: string): Promise<FeishuTableField[]> {
    const items: FeishuTableField[] = [];
    let pageToken = '';
    let hasMore = true;

    while (hasMore) {
      const query = new URLSearchParams({ page_size: '200' });
      if (pageToken) {
        query.set('page_token', pageToken);
      }

      const data = await this.request<PagedData<FeishuTableField>>(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/fields?${query.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );

      items.push(...(data.items ?? []));
      hasMore = Boolean(data.has_more);
      pageToken = data.page_token ?? '';
    }

    return items;
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
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );

      items.push(...(data.items ?? []));
      hasMore = Boolean(data.has_more);
      pageToken = data.page_token ?? '';
    }

    return items;
  }

  async searchRecords(tableId: string, body: Record<string, unknown>): Promise<FeishuRecord[]> {
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
        }
      );

      items.push(...(data.items ?? []));
      hasMore = Boolean(data.has_more);
      pageToken = data.page_token ?? '';
    }

    return items;
  }

  async createRecord(tableId: string, fields: Record<string, unknown>): Promise<FeishuRecord> {
    const data = await this.request<{ record: FeishuRecord }>(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/records`,
      {
        method: 'POST',
        body: JSON.stringify({ fields }),
      }
    );

    return data.record;
  }

  async updateRecord(
    tableId: string,
    recordId: string,
    fields: Record<string, unknown>
  ): Promise<FeishuRecord> {
    const data = await this.request<{ record: FeishuRecord }>(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.appToken}/tables/${tableId}/records/${recordId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ fields }),
      }
    );

    return data.record;
  }

  async downloadAttachment(fileToken: string): Promise<Buffer> {
    const token = await this.getTenantAccessToken();
    const response = await fetch(
      `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`下载飞书附件失败: ${response.status} ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
