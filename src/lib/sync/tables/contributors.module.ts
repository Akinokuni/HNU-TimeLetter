import type { Contributor } from '../../types';
import type { TableSyncModule } from '../types';
import { getPersonName, getText } from '../shared/field-reader';
import { writeContributors } from '../writers/contributors.writer';

export const contributorsModule: TableSyncModule<'contributors'> = {
  key: 'contributors',
  label: '鸣谢名单',
  async run(ctx) {
    if (!ctx.settings.feishuContributorsTableId) {
      throw new Error('缺少 feishuContributorsTableId，无法同步鸣谢名单');
    }

    const records = await ctx.services.feishuBitable.listRecords(
      ctx.settings.feishuContributorsTableId
    );

    const contributors: Contributor[] = records.map((record) => {
      const fields = record.fields;
      
      // 兼容多类型：支持普通文本列或人员列
      const name = getText(fields['姓名']) || getPersonName(fields['姓名']) || '匿名用户';
      const role = getText(fields['职位']) || getText(fields['角色']) || '';
      const message = getText(fields['留言']) || getText(fields['寄语']) || getText(fields['感言']) || '';

      return {
        id: record.record_id,
        name,
        role,
        message,
      };
    });

    const info = await writeContributors(ctx, contributors);

    return {
      output: contributors,
      summary: {
        successRecords: contributors.length,
        skippedRecords: 0,
        failedRecords: 0,
        contributorCount: contributors.length,
        filesWritten: [info.path],
      },
    };
  },
};
