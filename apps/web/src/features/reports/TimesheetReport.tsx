import { useCallback, useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { downloadCsv } from './utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { User } from '@flowpilot/shared';

interface TimesheetRow {
  period: string;
  totalHours: number;
  billableHours: number;
  count: number;
}

type GroupBy = 'day' | 'week' | 'month';

interface Props {
  dateFrom: string;
  dateTo: string;
  onExportRef?: (fn: () => void) => void;
}

export function TimesheetReport({ dateFrom, dateTo, onExportRef }: Props) {
  const [data, setData] = useState<TimesheetRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api
      .get<{ data: User[] }>('/users')
      .then((res) => setUsers(res.data.data))
      .catch(console.error);
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: TimesheetRow[] }>(
        '/reports/timesheet',
        {
          params: { dateFrom, dateTo, userId: userId || undefined, groupBy },
        },
      );
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch timesheet report', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, userId, groupBy]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (onExportRef) {
      onExportRef(() => {
        downloadCsv(
          '/reports/timesheet',
          { dateFrom, dateTo, userId: userId || undefined, groupBy },
          'timesheet_report',
        );
      });
    }
  }, [onExportRef, dateFrom, dateTo, userId, groupBy]);

  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      nonBillable: Math.max(0, item.totalHours - item.billableHours),
    }));
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="flex-1">
          <label
            htmlFor="timesheet-report-user"
            className="block text-sm font-medium text-zinc-400 mb-1"
          >
            User
          </label>
          <select
            id="timesheet-report-user"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label
            htmlFor="timesheet-report-group-by"
            className="block text-sm font-medium text-zinc-400 mb-1"
          >
            Group By
          </label>
          <select
            id="timesheet-report-group-by"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-80">
        <h3 className="text-zinc-100 font-medium mb-4">Hours Overview</h3>
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-zinc-500">
            Loading chart...
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500">
            No data found
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="period"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  color: '#e4e4e7',
                }}
                cursor={{ fill: '#27272a', opacity: 0.4 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar
                dataKey="billableHours"
                name="Billable"
                stackId="a"
                fill="#3b82f6"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="nonBillable"
                name="Non-Billable"
                stackId="a"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                opacity={0.5}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-zinc-400">
            <thead className="text-xs text-zinc-500 bg-zinc-950 uppercase border-b border-zinc-800">
              <tr>
                <th className="px-6 py-3 font-medium">Period</th>
                <th className="px-6 py-3 font-medium">Entries</th>
                <th className="px-6 py-3 font-medium">Billable Hours</th>
                <th className="px-6 py-3 font-medium">Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.period}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                >
                  <td className="px-6 py-3 font-medium text-zinc-300">
                    {row.period}
                  </td>
                  <td className="px-6 py-3">{row.count}</td>
                  <td className="px-6 py-3">{row.billableHours.toFixed(2)}</td>
                  <td className="px-6 py-3">{row.totalHours.toFixed(2)}</td>
                </tr>
              ))}
              {data.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
