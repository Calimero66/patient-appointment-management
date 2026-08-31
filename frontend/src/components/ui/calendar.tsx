import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../../lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 font-sans bg-white rounded-2xl shadow-xs border border-slate-200', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month_caption: 'flex justify-between items-center px-1 font-semibold text-xs text-slate-900',
        caption_label: 'text-xs font-bold text-slate-900',
        nav: 'space-x-1 flex items-center',
        button_previous: 'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer',
        button_next: 'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer',
        month_grid: 'w-full border-collapse space-y-1 text-xs mt-2',
        weekdays: 'flex',
        weekday: 'text-slate-400 rounded-md w-8 font-semibold text-[11px] text-center',
        week: 'flex w-full mt-1',
        day: 'h-8 w-8 p-0 font-semibold rounded-lg text-slate-900 hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-600 focus:text-white transition-colors cursor-pointer flex items-center justify-center',
        selected: 'bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-xs',
        today: 'bg-slate-100 text-blue-600 font-bold border border-blue-200',
        outside: 'text-slate-300 opacity-50',
        disabled: 'text-slate-300 opacity-40 cursor-not-allowed',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
