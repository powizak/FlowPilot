export type SettingKey =
  | 'app.name'
  | 'app.locale'
  | 'app.timezone'
  | 'app.currency'
  | 'invoice.numberFormat'
  | 'invoice.defaultPaymentTermsDays'
  | 'timeTracking.autoStopHours'
  | 'timeTracking.roundingMinutes';

export type SettingType = 'string' | 'number' | 'boolean' | 'json';

export interface Setting {
  id: string;
  key: SettingKey;
  value: string;
  type: SettingType;
  updatedAt: Date;
}
