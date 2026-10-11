/** ISO 8601 → value for `<input type="datetime-local">` (local timezone). */
export function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** datetime-local value → ISO 8601 UTC string. */
export function datetimeLocalToIso(local: string): string {
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date/time')
  }
  return d.toISOString()
}

export function formatDisplayDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function durationMinutes(start: string, end: string): number | null {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null
  return Math.round((e - s) / 60_000)
}
