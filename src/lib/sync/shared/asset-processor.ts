import type { SyncContext } from '../types';
import { getAttachments } from './field-reader';

type RecordOssFilePayload = {
  fileName: string;
  ossPath: string;
  ossUrl: string;
  hash: string;
  fileSize: number;
  usage: string;
  recordId: string;
};

export interface ProcessAttachmentsResult {
  urls: string[];
  names: string[];
  warnings: string[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

async function recordOssFile(
  ctx: SyncContext,
  payload: RecordOssFilePayload,
): Promise<string | null> {
  if (!ctx.settings.feishuOssTableId) {
    return null;
  }

  try {
    await ctx.services.feishuBitable.createRecord(ctx.settings.feishuOssTableId, {
      文本: `${payload.fileName} - ${payload.usage}`,
      文件名: payload.fileName,
      OSS路径: payload.ossPath,
      OSS_URL: {
        link: payload.ossUrl,
        text: payload.ossUrl,
      },
      MD5哈希: payload.hash,
      文件大小: formatSize(payload.fileSize),
      上传时间: Date.now(),
      用途: payload.usage,
      关联记录ID: payload.recordId,
    });

    return null;
  } catch (error) {
    return `记录 OSS 文件失败，已跳过: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}

export async function processAttachments(
  ctx: SyncContext,
  attachmentField: unknown,
  usage: string,
  recordId: string,
): Promise<ProcessAttachmentsResult> {
  if (!ctx.includeAssets || !ctx.services.oss.isConfigured) {
    return {
      urls: [],
      names: [],
      warnings: [],
    };
  }

  const attachments = getAttachments(attachmentField);
  if (attachments.length === 0) {
    return {
      urls: [],
      names: [],
      warnings: [],
    };
  }

  const urls: string[] = [];
  const names: string[] = [];
  const warnings: string[] = [];

  for (const attachment of attachments) {
    const fileToken = attachment.file_token || attachment.token;
    const fileName = attachment.name || 'image.jpg';
    if (!fileToken) {
      continue;
    }

    try {
      const buffer = await ctx.services.feishuDrive.downloadAttachment(fileToken);
      const uploaded = await ctx.services.oss.upload(buffer, fileName);
      const ossRecordWarning = await recordOssFile(ctx, {
        fileName,
        ossPath: uploaded.path,
        ossUrl: uploaded.url,
        hash: uploaded.hash,
        fileSize: buffer.length,
        usage,
        recordId,
      });

      if (ossRecordWarning) {
        warnings.push(ossRecordWarning);
        ctx.logger.warn(ossRecordWarning);
      }

      urls.push(uploaded.url);
      names.push(fileName);
    } catch (error) {
      const warning = `记录 ${recordId} 的 ${usage} 附件 ${fileName} 处理失败: ${
        error instanceof Error ? error.message : String(error)
      }`;
      warnings.push(warning);
      ctx.logger.warn(warning);
    }
  }

  return { urls, names, warnings };
}
