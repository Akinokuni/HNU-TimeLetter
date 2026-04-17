export interface FeishuRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

export interface FeishuTableField {
  field_id: string;
  field_name: string;
  type: number;
  is_primary?: boolean;
  property?: Record<string, unknown>;
}

export interface FeishuConnectionSettings {
  feishuAppId?: string;
  feishuAppSecret?: string;
  feishuAppToken?: string;
  feishuTableId?: string;
  feishuViewId?: string;
  feishuExhibitionWikiUrl?: string;
  feishuExhibitionAppToken?: string;
  feishuExhibitionTableId?: string;
  feishuExhibitionViewId?: string;
  feishuCardWikiUrl?: string;
  feishuCardAppToken?: string;
  feishuCardTableId?: string;
  feishuCardViewId?: string;
  feishuCardIdFieldName?: string;
  feishuLocationsTableId?: string;
  feishuOssTableId?: string;
  ossRegion?: string;
  ossBucket?: string;
  ossAccessKeyId?: string;
  ossAccessKeySecret?: string;
}

export interface LocationCoordsEntry {
  name: string;
  x: number;
  y: number;
}

export type LocationCoords = Record<string, LocationCoordsEntry>;
