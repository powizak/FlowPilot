export interface TimeEntry {
  id: string;
  taskId: string | null;
  projectId: string;
  userId: string;
  workTypeId: string | null;
  description: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  isBillable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTimeEntryDto {
  taskId?: string | null;
  projectId: string;
  userId: string;
  workTypeId?: string | null;
  description?: string | null;
  startedAt: Date;
  endedAt?: Date | null;
  durationMinutes?: number | null;
  isBillable?: boolean;
}
