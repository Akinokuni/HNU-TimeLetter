import * as crypto from 'node:crypto';
import * as path from 'node:path';
import OSS from 'ali-oss';
import type {
  SyncEnvironmentSettings,
  SyncOssService,
} from '../types';

export class OssClient implements SyncOssService {
  private readonly client: OSS | null;

  constructor(private readonly settings: SyncEnvironmentSettings) {
    if (
      !settings.ossRegion ||
      !settings.ossBucket ||
      !settings.ossAccessKeyId ||
      !settings.ossAccessKeySecret
    ) {
      this.client = null;
      return;
    }

    this.client = new OSS({
      region: settings.ossRegion,
      accessKeyId: settings.ossAccessKeyId,
      accessKeySecret: settings.ossAccessKeySecret,
      bucket: settings.ossBucket,
    });
  }

  get isConfigured() {
    return Boolean(this.client);
  }

  async upload(buffer: Buffer, fileName: string) {
    if (!this.client || !this.settings.ossBucket || !this.settings.ossRegion) {
      throw new Error('OSS 未配置，无法上传附件');
    }

    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const ext = path.extname(fileName) || '.jpg';
    const ossPath = `hnu-timeletter/${hash}${ext}`;

    try {
      await this.client.head(ossPath);
    } catch (error) {
      const maybeError = error as { code?: string; status?: number };
      if (maybeError.code === 'NoSuchKey' || maybeError.status === 404) {
        await this.client.put(ossPath, buffer);
      } else {
        throw error;
      }
    }

    return {
      url: `https://${this.settings.ossBucket}.${this.settings.ossRegion}.aliyuncs.com/${ossPath}`,
      path: ossPath,
      hash,
    };
  }
}
