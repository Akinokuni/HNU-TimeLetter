import * as crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import OSS from 'ali-oss';
import type { FeishuConnectionSettings } from './types';

export class OssService {
  readonly client: OSS | null;

  constructor(private readonly settings: FeishuConnectionSettings) {
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

  get isConfigured(): boolean {
    return Boolean(this.client);
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string
  ): Promise<{ url: string; path: string; hash: string }> {
    if (!this.client || !this.settings.ossBucket || !this.settings.ossRegion) {
      throw new Error('OSS 未配置，无法上传本地图片');
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

  async uploadFile(filePath: string): Promise<{ url: string; path: string; hash: string }> {
    const buffer = await fs.readFile(filePath);
    return this.uploadBuffer(buffer, path.basename(filePath));
  }
}
