import { scheduleRequest } from './rateLimiter'
import type {
  ApiErrorBody,
  Client,
  PaginationParams,
  Project,
  Task,
  TimeEntry,
  TimeEntryPayload,
} from './types'

// Same-origin path; the dev/preview server proxies it and adds the Authorization header.
const BASE_URL = '/api/v1'

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody

  constructor(status: number, body: ApiErrorBody) {
    super(body.error ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function buildQuery(params?: PaginationParams): string {
  if (!params) return ''
  const search = new URLSearchParams()
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.offset != null) search.set('offset', String(params.offset))
  const q = search.toString()
  return q ? `?${q}` : ''
}

function statusMessage(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return 'The API rejected our credentials. Check the configured API key.'
    case 429:
      return 'Too many requests. Please wait a minute and try again.'
    default:
      return status >= 500
        ? 'The time tracking service is unavailable. Please try again shortly.'
        : `Request failed with status ${status}`
  }
}

function errorFromResponse(status: number, text: string): ApiError {
  let serverMessage: string | undefined
  try {
    const parsed = JSON.parse(text) as ApiErrorBody
    serverMessage = typeof parsed.error === 'string' ? parsed.error : undefined
  } catch {
    // Auth and rate-limit errors come back as plain text, not JSON.
  }
  return new ApiError(status, { error: serverMessage ?? statusMessage(status) })
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return scheduleRequest(async () => {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    })
    const text = await response.text()
    if (!response.ok) {
      throw errorFromResponse(response.status, text)
    }
    try {
      return JSON.parse(text) as T
    } catch {
      throw new ApiError(response.status, {
        error: 'The server returned an unexpected response.',
      })
    }
  })
}

const PAGE_SIZE = 100

export async function fetchAllClients(): Promise<Client[]> {
  const all: Client[] = []
  let offset = 0
  for (;;) {
    const page = await getClients({ limit: PAGE_SIZE, offset })
    all.push(...page)
    if (page.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return all
}

export function getClients(params?: PaginationParams) {
  return request<Client[]>(`/clients${buildQuery(params)}`)
}

export function getClientProjects(clientId: number, params?: PaginationParams) {
  return request<Project[]>(`/clients/${clientId}/projects${buildQuery(params)}`)
}

export async function fetchAllClientProjects(
  clientId: number,
): Promise<Project[]> {
  const all: Project[] = []
  let offset = 0
  for (;;) {
    const page = await getClientProjects(clientId, {
      limit: PAGE_SIZE,
      offset,
    })
    all.push(...page)
    if (page.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return all
}

export function getProjectTasks(projectId: number, params?: PaginationParams) {
  return request<Task[]>(`/projects/${projectId}/tasks${buildQuery(params)}`)
}

export async function fetchAllProjectTasks(projectId: number): Promise<Task[]> {
  const all: Task[] = []
  let offset = 0
  for (;;) {
    const page = await getProjectTasks(projectId, {
      limit: PAGE_SIZE,
      offset,
    })
    all.push(...page)
    if (page.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return all
}

export function getTimeEntries(params?: PaginationParams) {
  return request<TimeEntry[]>(`/time-entries${buildQuery(params)}`)
}

export function createTimeEntry(payload: TimeEntryPayload) {
  return request<TimeEntry>('/time-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function updateTimeEntry(id: number, payload: TimeEntryPayload) {
  return request<TimeEntry>(`/time-entries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
