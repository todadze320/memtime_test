export type Client = {
  id: number
  name: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

export type Project = {
  id: number
  clientId: number
  name: string
  status: string
  createdAt: string
  updatedAt: string
}

export type Task = {
  id: number
  projectId: number
  name: string
  status: string
  createdAt: string
  updatedAt: string
}

export type TimeEntry = {
  id: number
  userId: string
  taskId: number
  comment: string
  start: string
  end: string
  createdAt: string
  updatedAt: string
}

export type TimeEntryPayload = {
  taskId: number
  comment: string
  start: string
  end: string
}

export type ApiErrorBody = {
  error?: string
}

export type PaginationParams = {
  limit?: number
  offset?: number
}
