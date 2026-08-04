import React, { FC } from 'react';
import { TravelLog } from '../types';
import { CalendarDays, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { CanvasEditor } from './CanvasEditor';

interface RecordCardProps {
  log: TravelLog;
  onEdit: (log: TravelLog) => void;
  onDelete: (id: string) => void;
  onClick?: (log: TravelLog) => void;
  isDarkMode?: boolean;
}

export const RecordCard: FC<RecordCardProps> = ({ log, onEdit, onDelete, onClick, isDarkMode = false }) => {
  return (
    <div
      onClick={() => onClick && onClick(log)}
      className={`bg-white dark:bg-surface-primary rounded-[28px] p-6 shadow-sm dark:shadow-none border border-stone-100 dark:border-subtle-border flex flex-col relative overflow-hidden h-[360px] w-full ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex flex-col gap-2 flex-1 overflow-hidden relative">
        <h3 className="font-logo font-bold text-lg text-stone-900 dark:text-text-primary shrink-0">{log.title}</h3>
        <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-text-secondary mb-2 shrink-0">
          <div className="flex items-center gap-1">
            <CalendarDays size={14} />
            <span>{log.date}</span>
          </div>
          {log.location && (
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{log.location}</span>
            </div>
          )}
        </div>
        
        <div className="absolute inset-0 pb-8 pt-16 pointer-events-none">
          <CanvasEditor 
            text={log.content || ''}
            stamps={(Array.isArray(log.stamps) ? log.stamps : []).filter(Boolean).map((s, i) => {
              if (typeof s === 'string') {
                return { id: `legacy-${i}`, imageUrl: s, x: 20 + i*10, y: 20 + i*10, w: 40, h: 40 } as any;
              }
              return {
                ...s,
                id: s.id !== undefined && s.id !== null ? String(s.id) : `stamp-${i}`
              };
            })} 
            readOnly 
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
}
