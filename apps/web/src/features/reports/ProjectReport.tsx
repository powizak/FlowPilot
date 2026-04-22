import { useCallback, useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { downloadCsv } from './utils';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Project } from '@flowpilot/shared';

interface ProjectSummary {
  totalHours: number;
  billableHours: number;
  totalAmount: number;
  invoicedAmount: number;
  uninvoicedAmount: number;
  workTypes: Array<{
    label: string;
    hours: number;
  }>;
}

const COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
  '#ec4899',
];

interface Props {
  onExportRef?: (fn: () => void) => void;
}

export function ProjectReport({ onExportRef }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [data, setData] = useState<ProjectSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api
      .get<{ data: Project[] }>('/projects')
      .then((res) => setProjects(res.data.data))
      .catch(console.error);
  }, []);

  const fetchReport = useCallback(async () => {
    if (!projectId) {
      setData(null);
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.get<{ data: ProjectSummary }>(
        `/reports/project/${projectId}`,
      );
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch project report', error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (onExportRef && projectId) {
      onExportRef(() => {
        downloadCsv(
          `/reports/project/${projectId}`,
          {},
          `project_${projectId}_report`,
        );
      });
    }
  }, [onExportRef, projectId]);

  const pieData = useMemo(() => {
    if (!data || !data.workTypes) return [];
    return data.workTypes
      .map((item) => ({
        name: item.label || 'Uncategorized',
        value: Math.round(item.hours * 10) / 10,
      }))
      .filter((item) => item.value > 0);
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <label
          htmlFor="project-report-project"
          className="block text-sm font-medium text-zinc-400 mb-1"
        >
          Select Project
        </label>
        <select
          id="project-report-project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {!projectId ? (
        <div className="flex items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
          Please select a project to view the report
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center p-12 text-zinc-500">
          Loading project data...
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
          No data found for this project
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-sm font-medium text-zinc-400 mb-1">
                Total Hours
              </div>
              <div className="text-2xl font-semibold text-zinc-100">
                {data.totalHours.toFixed(2)}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-sm font-medium text-zinc-400 mb-1">
                Billable Hours
              </div>
              <div className="text-2xl font-semibold text-zinc-100">
                {data.billableHours.toFixed(2)}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-sm font-medium text-zinc-400 mb-1">
                Total Amount
              </div>
              <div className="text-2xl font-semibold text-zinc-100">
                ${data.totalAmount.toFixed(2)}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-sm font-medium text-zinc-400 mb-1">
                Invoiced
              </div>
              <div className="text-2xl font-semibold text-green-400">
                ${data.invoicedAmount.toFixed(2)}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-sm font-medium text-zinc-400 mb-1">
                Uninvoiced
              </div>
              <div className="text-2xl font-semibold text-yellow-500">
                ${data.uninvoicedAmount.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-96 flex flex-col">
            <h3 className="text-zinc-100 font-medium mb-4">
              Time by Work Type
            </h3>
            {pieData.length > 0 ? (
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      stroke="none"
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        color: '#e4e4e7',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                No time logged yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
