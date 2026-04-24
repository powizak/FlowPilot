export interface TaskSuggestion {
  id?: string;
  name: string;
  description?: string;
}

export interface TaskDecompositionResult {
  description?: string;
  tasks?: TaskSuggestion[];
}

export function getTaskDecompositionText(
  result: TaskDecompositionResult | string,
): string {
  if (typeof result === 'string') return result;
  if (typeof result?.description === 'string') return result.description;
  if (typeof result?.tasks?.[0]?.description === 'string') {
    return result.tasks[0].description;
  }
  return JSON.stringify(result);
}
