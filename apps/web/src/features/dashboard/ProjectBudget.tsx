import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { DashboardCard } from './DashboardCard';
import { Briefcase, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  budget: number | null;
  status: string;
  actualHours?: number;
}

export function ProjectBudget() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get<{ data: Project[] }>('/projects', {
          params: { status: 'active' }
        });
        
        setProjects(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <DashboardCard
      title="Project Budgets"
      icon={<Briefcase className="w-5 h-5 text-purple-500" />}
      isLoading={isLoading}
      isEmpty={projects.length === 0}
      emptyMessage="No active projects found."
    >
      <div className="space-y-4 overflow-y-auto max-h-[300px] hide-scrollbar pr-1">
        {projects.map(project => {
          const budget = project.budget || 0;
          const actualHours = project.actualHours || 0;
          const percentage = budget > 0 ? Math.min(Math.round((actualHours / budget) * 100), 100) : 0;
          
          let progressColor = 'bg-blue-500';
          if (percentage >= 100) progressColor = 'bg-red-500';
          else if (percentage >= 80) progressColor = 'bg-orange-500';

          return (
            <div key={project.id} className="bg-background border border-border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <Link to={`/projects/${project.id}`} className="text-sm font-medium text-text hover:text-blue-500 truncate mr-2">
                  {project.name}
                </Link>
                {budget > 0 ? (
                  <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
                    {actualHours.toFixed(1)} / {budget}h
                  </span>
                ) : (
                  <span className="text-xs font-medium text-text-secondary flex items-center gap-1">
                    <Info className="w-3 h-3" /> No budget
                  </span>
                )}
              </div>
              
              {budget > 0 && (
                <div className="w-full bg-surface border border-border rounded-full h-2 overflow-hidden relative">
                  <div 
                    className={`h-full ${progressColor} transition-all duration-500 ease-in-out`} 
                    style={{ width: `${percentage}%` }} 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
