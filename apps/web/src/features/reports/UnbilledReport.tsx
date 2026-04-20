import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { downloadCsv } from './utils';
import { ChevronDown, ChevronRight, DollarSign, Clock } from 'lucide-react';
import { TimeEntry } from '@flowpilot/shared';

interface UnbilledEntry extends TimeEntry {
  user?: {
    id: string;
    name: string;
  };
}

interface UnbilledProject {
  projectId: string;
  projectName: string;
  unbilledHours: number;
  unbilledAmount: number;
  entries: UnbilledEntry[];
}

interface Props {
  onExportRef?: (fn: () => void) => void;
}

export function UnbilledReport({ onExportRef }: Props) {
  const [data, setData] = useState<UnbilledProject[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: UnbilledProject[] }>(
        '/reports/billing',
      );
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch billing report', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (onExportRef) {
      onExportRef(() => {
        downloadCsv('/reports/billing', {}, 'unbilled_report');
      });
    }
  }, [onExportRef]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalHours = data.reduce((sum, p) => sum + p.unbilledHours, 0);
  const totalAmount = data.reduce((sum, p) => sum + p.unbilledAmount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-400">
              Total Unbilled Hours
            </div>
            <div className="text-2xl font-bold text-zinc-100">
              {totalHours.toFixed(2)}h
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-400">
              Total Unbilled Amount
            </div>
            <div className="text-2xl font-bold text-zinc-100">
              ${totalAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-zinc-400">
            <thead className="text-xs text-zinc-500 bg-zinc-950 uppercase border-b border-zinc-800">
              <tr>
                <th className="px-6 py-3 w-10"></th>
                <th className="px-6 py-3 font-medium">Project</th>
                <th className="px-6 py-3 font-medium text-right">Hours</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    Loading billing data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No unbilled time found
                  </td>
                </tr>
              ) : (
                data.map((project) => (
                  <React.Fragment key={project.projectId}>
                    <tr
                      className="border-b border-zinc-800 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                      onClick={() => toggleExpand(project.projectId)}
                    >
                      <td className="px-6 py-4">
                        {expanded[project.projectId] ? (
                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-200">
                        {project.projectName}
                        <span className="ml-2 text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                          {project.entries.length} entries
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-zinc-300">
                        {project.unbilledHours.toFixed(2)}h
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-400">
                        ${project.unbilledAmount.toFixed(2)}
                      </td>
                    </tr>
                    {expanded[project.projectId] && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-0 border-b border-zinc-800"
                        >
                          <div className="bg-zinc-950 px-12 py-3 shadow-inner">
                            <table className="w-full text-xs text-zinc-500">
                              <thead>
                                <tr className="border-b border-zinc-800/50">
                                  <th className="py-2 text-left font-medium">
                                    Date
                                  </th>
                                  <th className="py-2 text-left font-medium">
                                    User
                                  </th>
                                  <th className="py-2 text-left font-medium">
                                    Description
                                  </th>
                                  <th className="py-2 text-right font-medium">
                                    Hours
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {project.entries.map((entry) => (
                                  <tr
                                    key={entry.id}
                                    className="border-b border-zinc-900/50 hover:bg-zinc-900/80"
                                  >
                                    <td className="py-2">
                                      {new Date(
                                        entry.startedAt,
                                      ).toLocaleDateString()}
                                    </td>
                                    <td className="py-2">
                                      {entry.user?.name || 'Unknown'}
                                    </td>
                                    <td
                                      className="py-2 max-w-xs truncate"
                                      title={entry.description || ''}
                                    >
                                      {entry.description || '—'}
                                    </td>
                                    <td className="py-2 text-right">
                                      {entry.durationMinutes
                                        ? (entry.durationMinutes / 60).toFixed(
                                            2,
                                          )
                                        : '0.00'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
            {!isLoading && data.length > 0 && (
              <tfoot className="bg-zinc-900 font-bold border-t-2 border-zinc-700">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-zinc-100">
                    Total Unbilled
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-100">
                    {totalHours.toFixed(2)}h
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-400">
                    ${totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
