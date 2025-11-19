'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { SharedComponentProps } from '../types'
import { formatDate } from '@/lib/shared/formatters'
import { CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateRange {
  from?: Date
  to?: Date
}

interface DateRangePickerProps extends SharedComponentProps {
  /** Selected date range */
  value?: DateRange
  /** Called when date range changes */
  onChange?: (range: DateRange) => void
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Show time picker (not implemented in basic version) */
  showTime?: boolean
  /** Quick select presets */
  presets?: Array<{ label: string; range: DateRange }>
}

/**
 * DateRangePicker Component
 *
 * Calendar-based date range picker with quick presets.
 * Supports selecting date ranges for filtering, reporting, and booking.
 *
 * @example
 * ```tsx
 * const [dateRange, setDateRange] = useState<DateRange>({ from: new Date(), to: new Date() })
 *
 * <DateRangePicker
 *   value={dateRange}
 *   onChange={setDateRange}
 *   placeholder="Select date range"
 *   presets={[
 *     { label: 'Today', range: { from: today, to: today } },
 *     { label: 'This Week', range: { from: weekStart, to: weekEnd } },
 *   ]}
 * />
 * ```
 */
export default function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  disabled = false,
  showTime = false,
  presets = [],
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [from, setFrom] = useState<Date | undefined>(value?.from)
  const [to, setTo] = useState<Date | undefined>(value?.to)
  const [month, setMonth] = useState<Date>(value?.from || new Date())

  // Default presets if none provided
  const defaultPresets: Array<{ label: string; range: DateRange }> = presets.length > 0 ? presets : [
    {
      label: 'Today',
      range: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: 'Last 7 days',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
      },
    },
    {
      label: 'This Month',
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
    {
      label: 'Last 30 days',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
      },
    },
  ]

  const handleDateClick = (date: Date) => {
    if (!from) {
      setFrom(date)
    } else if (!to) {
      if (date < from) {
        setTo(from)
        setFrom(date)
      } else {
        setTo(date)
      }
      handleApply({ from, to: date })
    } else {
      setFrom(date)
      setTo(undefined)
    }
  }

  const handleApply = (range: DateRange) => {
    onChange?.(range)
    setIsOpen(false)
  }

  const handleClear = () => {
    setFrom(undefined)
    setTo(undefined)
    onChange?.({ from: undefined, to: undefined })
  }

  const handlePreset = (preset: DateRange) => {
    setFrom(preset.from)
    setTo(preset.to)
    handleApply(preset)
  }

  const displayText =
    from && to
      ? `${formatDate(from, 'MMM d')} - ${formatDate(to, 'MMM d, yyyy')}`
      : from
        ? `${formatDate(from, 'MMM d, yyyy')}`
        : placeholder

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('w-full justify-start text-left font-normal', !from && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="flex flex-col gap-2 border-r p-3">
            {defaultPresets.map((preset) => (
              <Button
                key={preset.label}
                variant={
                  from?.getTime() === preset.range.from?.getTime() &&
                  to?.getTime() === preset.range.to?.getTime()
                    ? 'default'
                    : 'ghost'
                }
                size="sm"
                onClick={() => handlePreset(preset.range)}
                className="justify-start text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={{ from, to }}
              onSelect={(range: any) => {
                if (range?.from) setFrom(range.from)
                if (range?.to) setTo(range.to)
              }}
              month={month}
              onMonthChange={setMonth}
              disabled={disabled}
              className="rounded-md border"
            />

            {/* Actions */}
            <div className="mt-3 flex gap-2 border-t pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
                className="flex-1"
                disabled={!from && !to}
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => handleApply({ from, to })}
                disabled={!from || !to}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
