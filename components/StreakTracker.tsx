
import React from 'react';
import type { StreakData } from '../types';
import FireIcon from './icons/FireIcon';

interface StreakTrackerProps {
  streakData: StreakData;
  isTodayComplete: boolean;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const StreakTracker: React.FC<StreakTrackerProps> = ({ streakData, isTodayComplete }) => {
  const { currentStreak, history } = streakData;

  const now = new Date();

  // Formatter for YYYY-MM-DD in Paris timezone
  const parisDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' });
  const todayDateString = parisDateFormatter.format(now);

  // Formatter to get weekday for determining week start
  const parisWeekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short' });
  const weekdaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentDayName = parisWeekdayFormatter.format(now);
  const dayOfWeekAdjusted = weekdaysShort.indexOf(currentDayName); // 0=Mon, 6=Sun

  const daysOfThisWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    // Go back to the start of the week (Monday) and then add i days
    date.setDate(date.getDate() - dayOfWeekAdjusted + i);
    return {
      date: parisDateFormatter.format(date),
      dayLabel: DAY_LABELS[i],
    };
  });

  const historySet = new Set(history);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 bg-brand-surface text-brand-text rounded-lg p-4 b-border b-shadow">
      {/* Streak Count */}
      <div className="flex items-center gap-4 self-start sm:self-center">
        <div className="flex-shrink-0 flex items-center justify-center bg-brand-surface-light rounded-full w-14 h-14 b-border">
            <FireIcon size={28} className="text-orange-400" isFilled={isTodayComplete}/>
        </div>
        <div>
            <span className="font-bold text-4xl leading-none">{currentStreak}</span>
            <p className="text-brand-text-secondary text-sm">Day Streak</p>
        </div>
      </div>
      
      {/* 7-Day Chart */}
      <div className="flex items-center justify-between gap-1 w-full sm:w-auto sm:justify-end sm:gap-3">
        {daysOfThisWeek.map(({ date, dayLabel }, index) => {
          const isActive = historySet.has(date) || (isTodayComplete && date === todayDateString);
          const isToday = date === todayDateString;
          return (
            <div key={index} className="flex flex-col items-center gap-2 p-1 rounded-md text-center">
               <span className={`text-xs sm:text-sm ${isToday ? 'text-brand-text font-bold' : 'text-brand-text-secondary'}`}>{dayLabel}</span>
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-colors duration-200 b-border ${isActive ? 'bg-brand-primary' : 'bg-brand-surface-light'}`}
                title={`Activity on ${date}`}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StreakTracker;