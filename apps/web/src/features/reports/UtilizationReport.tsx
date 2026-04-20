import { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { downloadCsv } from './utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface UtilizationRow {
  userId: string;
  userName: string;
  totalHours: number;
  billableHours: number;
  utilizationPercent: number;
}

interface Props {
  dateFrom: string;
  dateTo: string;
  onExportRef?: (fn: () => void) => void;
}

export function UtilizationReport({ dateFrom, dateTo, onExportRef }: Props) {
  const [data, setData] = useState<UtilizationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: UtilizationRow[] }>('/reports/utilization', {
        params: { dateFrom, dateTo }
      });
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch utilization report', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (onExportRef) {
      onExportRef(() => {
        downloadCsv('/reports/utilization', { dateFrom, dateTo }, 'utilization_report');
      });
    }
  }, [onExportRef, dateFrom, dateTo]);

  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      nonBillable: Math.max(0, item.totalHours - item.billableHours)
    }));
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-[500px]">
        <h3 className="text-zinc-100 font-medium mb-4">User Utilization</h3>
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-zinc-500">Loading chart...</div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500">No data found</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="userName" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={120} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }}
                cursor={{ fill: '#27272a', opacity: 0.4 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="billableHours" name="Billable" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="nonBillable" name="Non-Billable" stackId="a" fill="#3f3f46" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(user => (
          <div key={user.userId} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-zinc-200">{user.userName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user.utilizationPercent >= 80 ? 'bg-green-500/10 text-green-400' :
                user.utilizationPercent >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {user.utilizationPercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Billable</span>
              <span className="text-zinc-300">{user.billableHours.toFixed(2)}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Total</span>
              <span className="text-zinc-300">{user.totalHours.toFixed(2)}h</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${user.utilizationPercent >= 80 ? 'bg-green-500' : user.utilizationPercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, user.utilizationPercent)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
