export class SettingUpdateItem {
  key!: string;
  value!: string;
}

export class BulkUpdateSettingsDto {
  settings!: SettingUpdateItem[];
}