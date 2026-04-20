import { useParams } from 'react-router-dom';
import { KanbanView } from '../features/tasks/views/KanbanView';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div className="p-8 text-red-500">Project ID missing</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <KanbanView projectId={id} />
    </div>
  );
}
