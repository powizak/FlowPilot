export interface UpdateWebhookDto {
  url?: string;
  secret?: string;
  events?: string[];
  isActive?: boolean;
}
