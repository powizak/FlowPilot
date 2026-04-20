export interface CreateWebhookDto {
  url: string;
  secret?: string;
  events: string[];
  isActive?: boolean;
}
