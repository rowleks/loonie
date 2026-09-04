/**
 * Timezone-aware helpers for scheduling. All wall-clock times in the product
 * (booking slots, "today's schedule", day boundaries) are interpreted in the
 * business's timezone — Metro Vancouver for the launch org. Stored timestamps
 * are always UTC instants (`timestamptz`).
 */
export const ORG_TIMEZONE = 'America/Vancouver'

export type CalendarDate = { year: number; month: number; day: number }
export type WallClockTime = { hours: number; minutes: number }

/** Offset (ms) to add to a UTC instant to get its wall-clock reading in `timeZone`. */
function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)

  const get = (type: Intl.DateTimeFormatPart['type']): number => {
    const value = parts.find((part) => part.type === type)?.value
    if (value === undefined) throw new Error(`Missing ${type} in timezone formatting`)
    return Number(value)
  }

  // hourCycle 'h23' keeps hours in 00–23, so no midnight-as-24 special case.
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  return asUtc - instant.getTime()
}

/**
 * UTC instant of a wall-clock date+time in `timeZone`. Two passes so DST
 * boundaries resolve correctly (the first guess may land on the wrong side).
 */
export function zonedDateTimeToInstant(
  date: CalendarDate,
  time: WallClockTime,
  timeZone: string = ORG_TIMEZONE,
): Date {
  const guess = Date.UTC(date.year, date.month - 1, date.day, time.hours, time.minutes)

  let offset = getTimeZoneOffsetMs(new Date(guess), timeZone)
  let instant = guess - offset
  offset = getTimeZoneOffsetMs(new Date(instant), timeZone)
  instant = guess - offset

  return new Date(instant)
}

/** The calendar date an instant falls on, in `timeZone`. */
export function calendarDateInTz(
  instant: Date,
  timeZone: string = ORG_TIMEZONE,
): CalendarDate {
  // en-CA formats as YYYY-MM-DD — stable to split.
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
  const [year, month, day] = formatted.split('-').map(Number)
  return { year: year!, month: month!, day: day! }
}

export function startOfZonedDay(date: CalendarDate, timeZone: string = ORG_TIMEZONE): Date {
  return zonedDateTimeToInstant(date, { hours: 0, minutes: 0 }, timeZone)
}

export function startOfNextZonedDay(date: CalendarDate, timeZone: string = ORG_TIMEZONE): Date {
  const next = calendarDateInTz(new Date(Date.UTC(date.year, date.month - 1, date.day + 1)), 'UTC')
  return startOfZonedDay(next, timeZone)
}

/** [start of today, start of tomorrow) in the org timezone. */
export function getTodayRange(now: Date = new Date()): { start: Date; end: Date } {
  const today = calendarDateInTz(now)
  return { start: startOfZonedDay(today), end: startOfNextZonedDay(today) }
}

/** First instant of the month containing `now`, in the org timezone. */
export function getStartOfZonedMonth(now: Date = new Date()): Date {
  const today = calendarDateInTz(now)
  return zonedDateTimeToInstant(
    { year: today.year, month: today.month, day: 1 },
    { hours: 0, minutes: 0 },
  )
}

/** Parses an HTML date input value (YYYY-MM-DD). */
export function parseDateInput(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return { year, month, day }
}

/** Parses an HTML time input value (HH:MM or H:MM). */
export function parseTimeInput(value: string): WallClockTime | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return { hours, minutes }
}

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ORG_TIMEZONE,
  hour: 'numeric',
  minute: '2-digit',
})

/** e.g. "9:00 AM – 12:30 PM" */
export function formatTimeWindow(start: Date, end: Date): string {
  return `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`
}

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ORG_TIMEZONE,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

/** e.g. "Mon, Sep 7" */
export function formatDay(date: Date): string {
  return dayFormatter.format(date)
}

/** "Today" / "Tomorrow" / a formatted day, relative to `now` in the org timezone. */
export function formatDayRelative(date: Date, now: Date = new Date()): string {
  const target = calendarDateInTz(date)
  const today = calendarDateInTz(now)
  const tomorrow = calendarDateInTz(startOfNextZonedDay(today))

  if (
    target.year === today.year &&
    target.month === today.month &&
    target.day === today.day
  ) {
    return 'Today'
  }
  if (
    target.year === tomorrow.year &&
    target.month === tomorrow.month &&
    target.day === tomorrow.day
  ) {
    return 'Tomorrow'
  }
  return formatDay(date)
}
