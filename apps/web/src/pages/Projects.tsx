import { useState } from 'react';
import { ProjectForm } from '../features/projects/components/ProjectForm';
import { api } from '../lib/api';

export default function Projects() {
  const [showForm, setShowForm] = useState(false);

  const handleSave = async (data: any) => {
    await api.post('/projects', data);
    setShowForm(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1>Projects</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded text-sm font-medium"
        >
          New Project
        </button>
      </div>
      <p className="text-text-secondary mt-2">Coming soon</p>

      {showForm && (
        <ProjectForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
