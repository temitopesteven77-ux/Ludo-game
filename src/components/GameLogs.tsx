import { useEffect, useRef } from 'react';
import { GameLog } from '../types';
import { Terminal, Calendar, Award } from 'lucide-react';

interface GameLogsProps {
  logs: GameLog[];
  onClearLogs: () => void;
}

export default function GameLogs({ logs, onClearLogs }: GameLogsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs when changes occur
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Player Color map for styling logs
  const textColors = {
    red: 'text-red-500 font-bold dark:text-red-400',
    green: 'text-emerald-500 font-bold dark:text-emerald-400',
    yellow: 'text-amber-500 font-bold dark:text-amber-400',
    blue: 'text-blue-500 font-bold dark:text-blue-400'
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-lg h-96">
      
      {/* Header logs */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest font-mono">
            Chronology Feed
          </h3>
        </div>
        <button
          onClick={onClearLogs}
          className="text-[10px] font-mono font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase outline-none"
        >
          Clear feed
        </button>
      </div>

      {/* Feed container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scroll-smooth"
      >
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs font-mono text-slate-400">Feed waiting for initial moves...</p>
          </div>
        ) : (
          logs.map((log) => {
            const hasTrophy = log.text.includes('home') || log.text.includes('Wins') || log.text.includes('captured');
            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 text-xs font-mono border-b border-slate-50 dark:border-slate-800/40 pb-1.5 transition-all duration-300 hover:bg-slate-50/20"
              >
                {/* Visual stamp / indicator */}
                <span className="text-[10px] text-slate-400 select-none font-mono">
                  {log.timestamp}
                </span>

                {/* Log message with styled variables */}
                <div className="flex-1 text-slate-600 dark:text-slate-300">
                  {hasTrophy && <Award className="w-3.5 h-3.5 inline text-amber-500 mr-1 pb-0.5" />}
                  {log.color ? (
                    <span>
                      <span className={`${textColors[log.color]}`}>
                        [{log.color.toUpperCase()}]
                      </span>{' '}
                      {log.text}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">{log.text}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
