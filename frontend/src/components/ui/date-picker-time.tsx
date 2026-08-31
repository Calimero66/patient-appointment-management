import * as React from 'react';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';

import { Button } from './button';
import { Calendar } from './calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

interface DatePickerTimeProps {
  date?: Date;
  time?: string;
  onDateChange?: (date?: Date) => void;
  onTimeChange?: (time: string) => void;
  className?: string;
}

export function DatePickerTime({
  date,
  time = '10:30:00',
  onDateChange,
  onTimeChange,
  className
}: DatePickerTimeProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className || ''}`}>
      {/* Date Field */}
      <div className="flex-1 space-y-1">
        <label htmlFor="date-picker-optional" className="block text-xs font-semibold text-slate-700">
          Date *
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker-optional"
              className="w-full justify-between font-normal text-xs bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
            >
              <span className={date ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                {date ? format(date, 'PPP') : 'Select date'}
              </span>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              defaultMonth={date}
              onSelect={(selectedDate) => {
                onDateChange?.(selectedDate);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Field */}
      <div className="w-full sm:w-36 space-y-1">
        <label htmlFor="time-picker-optional" className="block text-xs font-semibold text-slate-700">
          Time *
        </label>
        <input
          type="time"
          id="time-picker-optional"
          step="1"
          value={time}
          onChange={(e) => onTimeChange?.(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
        />
      </div>
    </div>
  );
}
