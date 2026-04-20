import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { DashboardCard } from './DashboardCard';
import { BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TimesheetRow {
  period: string;
  totalHours: number;
  billableHours: number;
  count: number;
}

export function WeeklyHours() {
  const [data, setData] = useState<TimesheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        
        const from = new Date(today.setDate(diff));
        from.setHours(0, 0, 0, 0);
        
        const to = new Date(from);
        to.setDate(to.getDate() + 6);
        to.setHours(23, 59, 59, 999);

        const res = await api.get<{ data: TimesheetRow[] }>('/reports/timesheet', {
          params: {
            dateFrom: from.toISOString(),
            dateTo: to.toISOString(),
            groupBy: 'day'
          }
        });
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const apiData = res.data.data || [];
        
        const chartData = days.map((d, i) => {
          const apiDateStr = new Date(from);
          apiDateStr.setDate(from.getDate() + i);
          const yyyyMmDd = apiDateStr.toISOString().split('T')[0];
          
          const match = apiData.find(item => item.period === yyyyMmDd);
          return {
            name: d,
            hours: match ? match.totalHours : 0
          };
        });

        setData(chartData as any);
      } catch (err) {
        console.error('Failed to fetch weekly hours', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHours();
  }, []);

  return (
    <DashboardCard
      title="Weekly Hours"
      icon={<BarChartIcon className="w-5 h-5 text-blue-500" />}
      isLoading={isLoading}
      isEmpty={false}
    >
      <div className="h-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
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
              tickFormatter={(v) => `${v}h`} 
            />
            <Tooltip 
              cursor={{ fill: '#27272a', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
              itemStyle={{ color: '#e4e4e7' }}
              formatter={(value: number) => [`${value.toFixed(1)} h`, 'Total']}
            />
            <Bar 
              dataKey="hours" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
