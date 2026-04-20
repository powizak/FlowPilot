import React from 'react';

export function SkillsSection() {
  const skills = [
    { name: 'Echo', description: 'Testing skill that echoes the input back.' },
    { name: 'Task Decomposition', description: 'Breaks down a large task into smaller manageable subtasks.' },
    { name: 'Meeting Notes → Tasks', description: 'Extracts action items and tasks from meeting transcripts.' },
    { name: 'Invoice Draft', description: 'AI-enhanced drafts for your invoices based on work logged.' },
    { name: 'Weekly Review', description: 'Generates a summary of your week\'s work and achievements.' }
  ];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
      <h3 className="text-lg font-medium text-gray-100 mb-4">AI Skills Overview</h3>
      <div className="space-y-3">
        {skills.map(s => (
          <div key={s.name} className="flex justify-between items-center bg-gray-800 p-3 rounded-md">
            <div>
              <p className="text-sm font-medium text-gray-200">{s.name}</p>
              <p className="text-xs text-gray-400 mt-1">{s.description}</p>
            </div>
            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded">Enabled</span>
          </div>
        ))}
      </div>
    </div>
  );
}
