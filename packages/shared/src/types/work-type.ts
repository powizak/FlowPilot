export interface WorkType {
  id: string;
  name: string;
  hourlyRate: number;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkTypeDto {
  name: string;
  hourlyRate: number;
  color: string;
  isActive?: boolean;
}
