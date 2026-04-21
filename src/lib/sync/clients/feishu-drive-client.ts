import type {
  SyncAuthService,
  SyncDriveService,
} from '../types';

export class FeishuDriveClient implements SyncDriveService {
  constructor(private readonly auth: SyncAuthService) {}

  async downloadAttachment(fileToken: string): Promise<Buffer> {
    const tenantToken = await this.auth.getTenantAccessToken();
    const response = await fetch(
      `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `下载飞书附件失败: ${response.status} ${response.statusText}`,
      );
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
