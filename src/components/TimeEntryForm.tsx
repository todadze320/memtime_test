import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  ApiError,
  createTimeEntry,
  updateTimeEntry,
} from '../api/client'
import type { TimeEntry, TimeEntryPayload } from '../api/types'
import { Alert } from './Alert'
import {
  datetimeLocalToIso,
  durationMinutes,
  isoToDatetimeLocal,
} from '../utils/datetime'

type TimeEntryFormProps = {
  selectedTaskId: number | null
  editingEntry: TimeEntry | null
  onCreated: () => void
  onUpdated: () => void
  onEntryMissing: () => void
  onClearEdit: () => void
}

type FormFields = {
  taskId: string
  comment: string
  start: string
  end: string
}

function emptyForm(taskId: number | null): FormFields {
  const now = new Date()
  const end = new Date(now.getTime() + 60 * 60 * 1000)
  return {
    taskId: taskId != null ? String(taskId) : '',
    comment: '',
    start: isoToDatetimeLocal(now.toISOString()),
    end: isoToDatetimeLocal(end.toISOString()),
  }
}

function formFromEntry(entry: TimeEntry): FormFields {
  return {
    taskId: String(entry.taskId),
    comment: entry.comment,
    start: isoToDatetimeLocal(entry.start),
    end: isoToDatetimeLocal(entry.end),
  }
}

function validate(fields: FormFields): string | null {
  const taskId = Number(fields.taskId)
  if (!fields.taskId.trim() || !Number.isInteger(taskId) || taskId <= 0) {
    return 'Task ID is required and must be a positive integer.'
  }
  if (!fields.comment.trim()) {
    return 'Comment is required.'
  }
  if (!fields.start || !fields.end) {
    return 'Start and end times are required.'
  }
  try {
    const startIso = datetimeLocalToIso(fields.start)
    const endIso = datetimeLocalToIso(fields.end)
    if (new Date(endIso) <= new Date(startIso)) {
      return 'End time must be after start time.'
    }
  } catch {
    return 'Start and end must be valid date/time values.'
  }
  return null
}

function toPayload(fields: FormFields): TimeEntryPayload {
  return {
    taskId: Number(fields.taskId),
    comment: fields.comment.trim(),
    start: datetimeLocalToIso(fields.start),
    end: datetimeLocalToIso(fields.end),
  }
}

function apiErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return 'Something went wrong. Please try again.'
  }
  if (err.status === 404) {
    return `${err.message}. It may have been deleted. Your changes are still in the form.`
  }
  if (err.status === 400) {
    return err.message || 'Invalid request. Check your input and try again.'
  }
  return err.message
}

export function TimeEntryForm({
  selectedTaskId,
  editingEntry,
  onCreated,
  onUpdated,
  onEntryMissing,
  onClearEdit,
}: TimeEntryFormProps) {
  const mode = editingEntry ? 'update' : 'create'
  const [fields, setFields] = useState<FormFields>(() =>
    emptyForm(selectedTaskId),
  )
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [entryMissing, setEntryMissing] = useState(false)

  useEffect(() => {
    if (editingEntry) {
      setFields(formFromEntry(editingEntry))
      setFieldError(null)
      setSuccess(null)
      setEntryMissing(false)
    }
  }, [editingEntry])

  useEffect(() => {
    if (selectedTaskId != null) {
      setFields((prev) => ({
        ...prev,
        taskId: String(selectedTaskId),
      }))
    }
  }, [selectedTaskId])

  const duration = useMemo(() => {
    try {
      if (!fields.start || !fields.end) return null
      return durationMinutes(
        datetimeLocalToIso(fields.start),
        datetimeLocalToIso(fields.end),
      )
    } catch {
      return null
    }
  }, [fields.start, fields.end])

  const setField =
    (key: keyof FormFields) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }))
      setFieldError(null)
      setSuccess(null)
    }

  const save = async (asNew: boolean) => {
    const validation = validate(fields)
    if (validation) {
      setFieldError(validation)
      setSuccess(null)
      return
    }

    setSubmitting(true)
    setFieldError(null)
    setSuccess(null)
    setEntryMissing(false)
    try {
      const payload = toPayload(fields)
      if (asNew || !editingEntry) {
        const created = await createTimeEntry(payload)
        if (editingEntry) onClearEdit()
        setSuccess(`Time entry created successfully (ID ${created.id}).`)
        setFields(emptyForm(selectedTaskId))
        onCreated()
      } else {
        const updated = await updateTimeEntry(editingEntry.id, payload)
        setSuccess(`Time entry ${updated.id} updated successfully.`)
        onUpdated()
      }
    } catch (err) {
      if (!asNew && err instanceof ApiError && err.status === 404) {
        setEntryMissing(true)
        onEntryMissing()
      }
      setFieldError(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void save(false)
  }

  const switchToCreate = () => {
    onClearEdit()
    setFields(emptyForm(selectedTaskId))
    setFieldError(null)
    setSuccess(null)
    setEntryMissing(false)
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h2 className="panel__title">Log time</h2>
        <div className="segmented" role="tablist" aria-label="Form mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'create'}
            className={`segmented__btn${mode === 'create' ? ' segmented__btn--active' : ''}`}
            onClick={switchToCreate}
          >
            New entry
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'update'}
            className={`segmented__btn${mode === 'update' ? ' segmented__btn--active' : ''}`}
            disabled={mode !== 'update'}
            title={
              mode === 'update'
                ? undefined
                : 'Click "Edit" on a time entry above to update it'
            }
          >
            Update entry
          </button>
        </div>
      </div>

      {editingEntry ? (
        <p className="panel__hint muted">
          Editing entry #{editingEntry.id}. Selecting a task in the tree changes
          this entry's task.
        </p>
      ) : null}

      {success ? (
        <Alert variant="success" onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      ) : null}
      {fieldError ? (
        <Alert variant="error" onDismiss={() => setFieldError(null)}>
          {fieldError}
          {entryMissing ? (
            <div className="alert__action">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={submitting}
                onClick={() => void save(true)}
              >
                Save as new entry
              </button>
            </div>
          ) : null}
        </Alert>
      ) : null}

      <form className="form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="form__field">
          <span className="form__label">Task ID</span>
          <input
            type="number"
            min={1}
            step={1}
            required
            value={fields.taskId}
            onChange={setField('taskId')}
            placeholder="Select a task from the tree or enter ID"
          />
        </label>

        <label className="form__field form__field--full">
          <span className="form__label">Comment</span>
          <textarea
            rows={3}
            required
            value={fields.comment}
            onChange={setField('comment')}
            placeholder="What did you work on?"
          />
        </label>

        <label className="form__field">
          <span className="form__label">Start</span>
          <input
            type="datetime-local"
            required
            value={fields.start}
            onChange={setField('start')}
          />
        </label>

        <label className="form__field">
          <span className="form__label">End</span>
          <input
            type="datetime-local"
            required
            value={fields.end}
            onChange={setField('end')}
          />
        </label>

        {duration != null ? (
          <p className="form__duration muted">Duration: {duration} minutes</p>
        ) : null}

        <div className="form__actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting
              ? 'Saving…'
              : mode === 'create'
                ? 'Create time entry'
                : 'Update time entry'}
          </button>
          {mode === 'update' ? (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={switchToCreate}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
