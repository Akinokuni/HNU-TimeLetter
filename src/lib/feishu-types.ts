/**
 * 飞书开放平台相关的共享类型定义
 *
 * 来源：飞书多维表格 OpenAPI
 * - records/search 返回 items，每项包含 record_id 和 fields
 * - fields 接口返回字段元信息（field_id / field_name / type）
 * - 附件字段返回 [{ file_token, name, ... }]
 */

export type FeishuField = {
  field_id: string;
  field_name: string;
  type: number;
};

export type FeishuRecord = {
  record_id: string;
  fields: Record<string, unknown>;
};

export type FeishuAttachment = {
  file_token?: string;
  token?: string;
  name?: string;
};
