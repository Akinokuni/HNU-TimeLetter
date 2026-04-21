import type { TableSyncModule } from '../types';
import { getNumber, getText } from '../shared/field-reader';
import {
  readLocationConfig,
  writeLocationConfig,
} from '../writers/locations.writer';

export const locationsModule: TableSyncModule<'locations'> = {
  key: 'locations',
  label: '地点配置',
  async run(ctx) {
    const fallback = readLocationConfig();
    const warnings: string[] = [];

    if (!ctx.settings.feishuAppToken || !ctx.settings.feishuLocationsTableId) {
      const warning = '缺少飞书地点表配置，已保留本地 locations.json';
      warnings.push(warning);
      ctx.logger.warn(warning);

      return {
        output: fallback,
        summary: {
          totalRecords: 0,
          successRecords: Object.keys(fallback).length,
          skippedRecords: 0,
          failedRecords: 0,
          locationCount: Object.keys(fallback).length,
        },
        warnings,
      };
    }

    try {
      const records = await ctx.services.feishuBitable.listRecords(
        ctx.settings.feishuLocationsTableId,
      );

      const next = {} as typeof fallback;
      let successRecords = 0;
      let skippedRecords = 0;

      records.forEach((record) => {
        const id = getText(record.fields['地点ID']);
        if (!id) {
          skippedRecords += 1;
          return;
        }

        next[id] = {
          name: getText(record.fields['地点名称']) || id,
          x: getNumber(record.fields['坐标X(%)']),
          y: getNumber(record.fields['坐标Y(%)']),
        };
        successRecords += 1;
      });

      if (Object.keys(next).length === 0) {
        const warning = '飞书未返回任何有效地点记录，已保留本地 locations.json';
        warnings.push(warning);
        ctx.logger.warn(warning);

        return {
          output: fallback,
          summary: {
            totalRecords: records.length,
            successRecords: 0,
            skippedRecords: records.length,
            failedRecords: 0,
            locationCount: Object.keys(fallback).length,
          },
          warnings,
        };
      }

      const filePath = writeLocationConfig(next);

      return {
        output: next,
        filesWritten: [filePath],
        summary: {
          totalRecords: records.length,
          successRecords,
          skippedRecords,
          failedRecords: 0,
          filesWritten: [filePath],
          locationCount: Object.keys(next).length,
        },
        warnings,
      };
    } catch (error) {
      const warning = `同步地点配置失败，已保留本地 locations.json: ${
        error instanceof Error ? error.message : String(error)
      }`;
      warnings.push(warning);
      ctx.logger.warn(warning);

      return {
        output: fallback,
        summary: {
          totalRecords: 0,
          successRecords: Object.keys(fallback).length,
          skippedRecords: 0,
          failedRecords: 0,
          locationCount: Object.keys(fallback).length,
        },
        warnings,
      };
    }
  },
};
