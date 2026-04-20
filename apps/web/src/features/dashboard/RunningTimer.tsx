import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { DashboardCard } from './DashboardCard';
import { Play, Square, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TimeEntry {
  id: string;
  startTime: string;
  endTime: string | null;
  projectId: string;
  workTypeId: string;
  userId: string;
  project?: { name: string };
}

export function RunningTimer() {
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fetchRunning = async () => {
    try {
      const res = await api.get<{ data: TimeEntry[] }>('/time-entries', {
        params: { running: 'true' }
      });
      if (res.data.data && res.data.data.length > 0) {
        const entry = res.data.data[0];
        setRunningEntry(entry);
        setElapsedSeconds(Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000));
      } else {
        setRunningEntry(null);
        setElapsedSeconds(0);
      }
    } catch (err) {
      console.error('Failed to fetch running timer', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRunning();
  }, []);

  useEffect(() => {
    if (!runningEntry) return;

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - new Date(runningEntry.startTime).getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [runningEntry]);

  const stopTimer = async () => {
    if (!runningEntry) return;
    try {
      await api.patch(`/time-entries/${runningEntry.id}`, {
        endTime: new Date().toISOString()
      });
      setRunningEntry(null);
    } catch (err) {
      console.error('Failed to stop timer', err);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardCard
      title="Running Timer"
      icon={<Timer className="w-5 h-5" />}
      isLoading={isLoading}
      isEmpty={false}
    >
      {runningEntry ? (
        <div className="flex flex-col items-center justify-center py-4 h-full">
          <div className="text-4xl font-mono font-medium text-text mb-2 tracking-wider">
            {formatTime(elapsedSeconds)}
          </div>
          <div className="text-sm text-text-secondary mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {runningEntry.project?.name || 'Project Tracking'}
          </div>
          <button
            onClick={stopTimer}
            className="flex items-center gap-2 px-6 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors rounded-lg font-medium"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop Timer
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 h-full text-center">
          <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
            <Timer className="w-6 h-6 text-text-secondary" />
          </div>
          <p className="text-text-secondary mb-6">No timer currently running</p>
          <Link
            to="/time"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium shadow-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            Quick Start
          </Link>
        </div>
      )}
    </DashboardCard>
  );
}
