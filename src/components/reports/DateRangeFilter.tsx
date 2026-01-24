import { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

type PresetOption = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';

const presetOptions: { value: PresetOption; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'thisWeek', label: 'This week' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
];

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetOption>('last7days');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePresetChange = (preset: PresetOption) => {
    setSelectedPreset(preset);
    const today = new Date();

    switch (preset) {
      case 'today':
        onDateRangeChange({ from: today, to: today });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        onDateRangeChange({ from: yesterday, to: yesterday });
        break;
      case 'last7days':
        onDateRangeChange({ from: subDays(today, 6), to: today });
        break;
      case 'last30days':
        onDateRangeChange({ from: subDays(today, 29), to: today });
        break;
      case 'thisWeek':
        onDateRangeChange({ from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) });
        break;
      case 'lastWeek':
        const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        onDateRangeChange({ from: lastWeekStart, to: endOfWeek(lastWeekStart, { weekStartsOn: 1 }) });
        break;
      case 'thisMonth':
        onDateRangeChange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        onDateRangeChange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'custom':
        setIsCalendarOpen(true);
        break;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as PresetOption)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {presetOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
                </>
              ) : (
                format(dateRange.from, 'MMM d, yyyy')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onDateRangeChange({ from: range.from, to: range.to });
                setSelectedPreset('custom');
                setIsCalendarOpen(false);
              } else if (range?.from) {
                onDateRangeChange({ from: range.from, to: range.from });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
