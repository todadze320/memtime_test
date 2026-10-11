import { useCallback, useEffect, useState } from 'react'
import { ApiError, getTimeEntries } from '../api/client'
import type { TimeEntry } from '../api/types'
import { durationMinutes, formatDisplayDate } from '../utils/datetime'

const PAGE_SIZE = 10

type TimeEntriesTableProps = {
  refreshToken: number
  onEditEntry: (entry: TimeEntry) => void
}

export function TimeEntriesTable({
  refreshToken,
  onEditEntry,
}: TimeEntriesTableProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)

  const loadPage = useCallback(async (pageOffset: number) => {
    setLoading(true)
    setError(null)
    try {
      const page = await getTimeEntries({
        limit: PAGE_SIZE,
        offset: pageOffset,
      })
      setEntries(page)
      setHasNext(page.length === PAGE_SIZE)
      setOffset(pageOffset)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load time entries',
      )
      setEntries([])
      setHasNext(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPage(0)
  }, [loadPage, refreshToken])

  return (
    <div className="panel">
      <div className="panel__header">
        <h2 className="panel__title">Time entries</h2>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => void loadPage(offset)}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Task ID</th>
              <th scope="col">Comment</th>
              <th scope="col">Start</th>
              <th scope="col">End</th>
              <th scope="col">Duration</th>
              <th scope="col">Created at</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="muted">
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="muted">
                  No time entries yet. Log your first entry below.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const mins = durationMinutes(entry.start, entry.end)
                return (
                  <tr key={entry.id}>
                    <td>{entry.id}</td>
                    <td>{entry.taskId}</td>
                    <td className="data-table__comment">{entry.comment}</td>
                    <td>{formatDisplayDate(entry.start)}</td>
                    <td>{formatDisplayDate(entry.end)}</td>
                    <td>{mins != null ? `${mins} min` : '—'}</td>
                    <td>{formatDisplayDate(entry.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => onEditEntry(entry)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          type="button"
          className="btn btn--secondary"
          disabled={loading || offset === 0}
          onClick={() => void loadPage(Math.max(0, offset - PAGE_SIZE))}
        >
          Previous
        </button>
        <span className="pagination__info muted">
          Showing {entries.length === 0 ? 0 : offset + 1}–
          {offset + entries.length}
        </span>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={loading || !hasNext}
          onClick={() => void loadPage(offset + PAGE_SIZE)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
