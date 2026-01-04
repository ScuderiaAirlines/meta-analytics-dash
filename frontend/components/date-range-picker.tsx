"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, subDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { toZonedTime } from "date-fns-tz"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value: { startDate: string; endDate: string }
  onChange: (range: { startDate: string; endDate: string }) => void
  className?: string
}

// Get current date in IST
const getISTDate = () => {
  return toZonedTime(new Date(), 'Asia/Kolkata')
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(value.startDate),
    to: new Date(value.endDate),
  })

  const presets = [
    {
      label: "Today",
      getValue: () => {
        const today = getISTDate()
        return { from: today, to: today }
      },
    },
    {
      label: "Yesterday",
      getValue: () => {
        const yesterday = subDays(getISTDate(), 1)
        return { from: yesterday, to: yesterday }
      },
    },
    {
      label: "Last 7D",
      getValue: () => ({
        from: subDays(getISTDate(), 6),
        to: getISTDate(),
      }),
    },
    {
      label: "Last 30D",
      getValue: () => ({
        from: subDays(getISTDate(), 29),
        to: getISTDate(),
      }),
    },
  ]

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue()
    setDate(range)
    if (range.from && range.to) {
      onChange({
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: format(range.to, "yyyy-MM-dd"),
      })
    }
  }

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate)
    if (selectedDate?.from && selectedDate?.to) {
      onChange({
        startDate: format(selectedDate.from, "yyyy-MM-dd"),
        endDate: format(selectedDate.to, "yyyy-MM-dd"),
      })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "MMM dd, yyyy")} -{" "}
                {format(date.to, "MMM dd, yyyy")}
              </>
            ) : (
              format(date.from, "MMM dd, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Preset buttons on the left */}
          <div className="flex flex-col gap-1 p-3 border-r">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start h-8 text-sm font-normal"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          {/* Calendar on the right */}
          <div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
