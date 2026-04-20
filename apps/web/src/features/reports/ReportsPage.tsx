import { useState, useMemo, useRef } from 'react';
import { TimesheetReport } from './TimesheetReport';
import { ProjectReport } from './ProjectReport';
import { UtilizationReport } from './UtilizationReport';
import { UnbilledReport } from './UnbilledReport';
import {
  Calendar,
  Download,
  BarChart2,
  PieChart,
  Activity,
  DollarSign,
} from 'lucide-react';

type TabType = 'timesheet' | 'project' | 'utilization' | 'unbilled';

const PRESETS = [
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'Custom', value: 'custom' },
];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('timesheet');
  const [preset, setPreset] = useState('this_month');

  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const exportRef = useRef<(() => void) | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from = new Date(today);
    let to = new Date(today);

    switch (preset) {
      case 'this_week': {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        from = new Date(today.setDate(diff));
        to = new Date(from);
        to.setDate(to.getDate() + 6);
        break;
      }
      case 'this_month':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'last_month':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'this_quarter': {
        const quarter = Math.floor(today.getMonth() / 3);
        from = new Date(today.getFullYear(), quarter * 3, 1);
        to = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        break;
      }
      case 'custom':
        from = customFrom ? new Date(customFrom) : today;
        to = customTo ? new Date(customTo) : today;
        break;
    }

    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }, [preset, customFrom, customTo]);

  const handleExport = () => {
    if (exportRef.current) {
      exportRef.current();
    }
  };

  const setExportAction = (fn: () => void) => {
    exportRef.current = fn;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Reports</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Analyze time, projects, and utilization
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-zinc-400 ml-2" />
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="bg-transparent border-none text-sm text-zinc-200 focus:ring-0 py-1.5 pl-1 pr-8"
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value} className="bg-zinc-900">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-zinc-500">-</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex border-b border-zinc-800 mb-6 overflow-x-auto hide-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('timesheet')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'timesheet'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Timesheet
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('project')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'project'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Project
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('utilization')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'utilization'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Utilization
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unbilled')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'unbilled'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Unbilled
        </button>
      </div>

      <div className="flex-1">
        {activeTab === 'timesheet' && (
          <TimesheetReport
            dateFrom={dateRange.from}
            dateTo={dateRange.to}
            onExportRef={setExportAction}
          />
        )}
        {activeTab === 'project' && (
          <ProjectReport onExportRef={setExportAction} />
        )}
        {activeTab === 'utilization' && (
          <UtilizationReport
            dateFrom={dateRange.from}
            dateTo={dateRange.to}
            onExportRef={setExportAction}
          />
        )}
        {activeTab === 'unbilled' && (
          <UnbilledReport onExportRef={setExportAction} />
        )}
      </div>
    </div>
  );
}
