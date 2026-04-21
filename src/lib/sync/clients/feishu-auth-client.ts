import type { SyncAuthService, SyncEnvironmentSettings } from '../types';

type TenantTokenEnvelope = {
  code: number;
  msg: string;
  tenant_access_token?: string;
};

export class FeishuAuthClient implements SyncAuthService {
  private tenantToken?: string;

  constructor(private readonly settings: SyncEnvironmentSettings) {}

  async getTenantAccessToken(): Promise<string> {
    if (this.tenantToken) {
      return this.tenantToken;
    }

    if (!this.settings.feishuAppId || !this.settings.feishuAppSecret) {
      throw new Error(
        '缺少飞书应用凭证，请先配置 FEISHU_APP_ID 和 FEISHU_APP_SECRET',
      );
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
      },
    );

    const payload = (await response.json()) as TenantTokenEnvelope;
    if (payload.code !== 0 || !payload.tenant_access_token) {
      throw new Error(`获取飞书访问令牌失败: ${payload.msg}`);
    }

    this.tenantToken = payload.tenant_access_token;
    return this.tenantToken;
  }
}
