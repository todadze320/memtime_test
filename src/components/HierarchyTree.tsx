import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  fetchAllClientProjects,
  fetchAllClients,
  fetchAllProjectTasks,
} from '../api/client'
import type { Client, Project, Task } from '../api/types'

type TreeTask = Task & { kind: 'task' }
type TreeProject = Project & { kind: 'project'; tasks: TreeTask[] | null }
type TreeClient = Client & { kind: 'client'; projects: TreeProject[] | null }

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

type HierarchyTreeProps = {
  selectedTaskId: number | null
  onSelectTask: (task: Task, project: Project, client: Client) => void
}

export function HierarchyTree({
  selectedTaskId,
  onSelectTask,
}: HierarchyTreeProps) {
  const [clients, setClients] = useState<TreeClient[]>([])
  const [clientsState, setClientsState] = useState<LoadState>('idle')
  const [clientsError, setClientsError] = useState<string | null>(null)
  const [expandedClients, setExpandedClients] = useState<Set<number>>(
    () => new Set(),
  )
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(
    () => new Set(),
  )
  const [loadingClients, setLoadingClients] = useState<Set<number>>(
    () => new Set(),
  )
  const [loadingProjects, setLoadingProjects] = useState<Set<number>>(
    () => new Set(),
  )

  useEffect(() => {
    let cancelled = false
    setClientsState('loading')
    fetchAllClients()
      .then((list) => {
        if (cancelled) return
        setClients(
          list.map((c) => ({ ...c, kind: 'client' as const, projects: null })),
        )
        setClientsState('loaded')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setClientsError(
          err instanceof ApiError ? err.message : 'Failed to load clients',
        )
        setClientsState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadProjects = useCallback(async (clientId: number) => {
    setLoadingClients((prev) => new Set(prev).add(clientId))
    try {
      const projects = await fetchAllClientProjects(clientId)
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                projects: projects.map((p) => ({
                  ...p,
                  kind: 'project' as const,
                  tasks: null,
                })),
              }
            : c,
        ),
      )
    } catch (err) {
      setClientsError(
        err instanceof ApiError
          ? err.message
          : `Failed to load projects for client ${clientId}`,
      )
    } finally {
      setLoadingClients((prev) => {
        const next = new Set(prev)
        next.delete(clientId)
        return next
      })
    }
  }, [])

  const loadTasks = useCallback(async (clientId: number, projectId: number) => {
    setLoadingProjects((prev) => new Set(prev).add(projectId))
    try {
      const tasks = await fetchAllProjectTasks(projectId)
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId || !c.projects) return c
          return {
            ...c,
            projects: c.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    tasks: tasks.map((t) => ({
                      ...t,
                      kind: 'task' as const,
                    })),
                  }
                : p,
            ),
          }
        }),
      )
    } catch (err) {
      setClientsError(
        err instanceof ApiError
          ? err.message
          : `Failed to load tasks for project ${projectId}`,
      )
    } finally {
      setLoadingProjects((prev) => {
        const next = new Set(prev)
        next.delete(projectId)
        return next
      })
    }
  }, [])

  const toggleClient = (client: TreeClient) => {
    const next = new Set(expandedClients)
    if (next.has(client.id)) {
      next.delete(client.id)
      setExpandedClients(next)
      return
    }
    next.add(client.id)
    setExpandedClients(next)
    if (client.projects === null) {
      void loadProjects(client.id)
    }
  }

  const toggleProject = (client: TreeClient, project: TreeProject) => {
    const next = new Set(expandedProjects)
    if (next.has(project.id)) {
      next.delete(project.id)
      setExpandedProjects(next)
      return
    }
    next.add(project.id)
    setExpandedProjects(next)
    if (project.tasks === null) {
      void loadTasks(client.id, project.id)
    }
  }

  if (clientsState === 'loading') {
    return (
      <div className="panel panel--tree">
        <h2 className="panel__title">Clients &amp; tasks</h2>
        <p className="muted">Loading clients…</p>
      </div>
    )
  }

  if (clientsState === 'error') {
    return (
      <div className="panel panel--tree">
        <h2 className="panel__title">Clients &amp; tasks</h2>
        <p className="error-text">{clientsError}</p>
      </div>
    )
  }

  return (
    <div className="panel panel--tree">
      <h2 className="panel__title">Clients &amp; tasks</h2>
      <p className="panel__hint muted">
        Expand a client, then a project. Select a task to pre-fill the time
        entry form.
      </p>
      {clientsError ? (
        <p className="error-text error-text--inline">{clientsError}</p>
      ) : null}
      <ul className="tree" role="tree" aria-label="Clients, projects, and tasks">
        {clients.map((client) => {
          const clientOpen = expandedClients.has(client.id)
          const clientLoading = loadingClients.has(client.id)
          return (
            <li key={client.id} className="tree__node" role="treeitem">
              <button
                type="button"
                className="tree__row tree__row--client"
                aria-expanded={clientOpen}
                onClick={() => toggleClient(client)}
              >
                <span className="tree__chevron" aria-hidden>
                  {clientLoading ? '…' : clientOpen ? '▾' : '▸'}
                </span>
                <span className="tree__label">{client.name}</span>
                <span className="tree__meta">#{client.id}</span>
              </button>
              {clientOpen && client.projects ? (
                <ul className="tree__children" role="group">
                  {client.projects.length === 0 ? (
                    <li className="tree__empty muted">No projects</li>
                  ) : (
                    client.projects.map((project) => {
                      const projectOpen = expandedProjects.has(project.id)
                      const projectLoading = loadingProjects.has(project.id)
                      return (
                        <li key={project.id} className="tree__node" role="treeitem">
                          <button
                            type="button"
                            className="tree__row tree__row--project"
                            aria-expanded={projectOpen}
                            onClick={() => toggleProject(client, project)}
                          >
                            <span className="tree__chevron" aria-hidden>
                              {projectLoading ? '…' : projectOpen ? '▾' : '▸'}
                            </span>
                            <span className="tree__label">{project.name}</span>
                            <span className="tree__meta">#{project.id}</span>
                          </button>
                          {projectOpen && project.tasks ? (
                            <ul className="tree__children" role="group">
                              {project.tasks.length === 0 ? (
                                <li className="tree__empty muted">No tasks</li>
                              ) : (
                                project.tasks.map((task) => {
                                  const selected = selectedTaskId === task.id
                                  return (
                                    <li key={task.id} role="treeitem">
                                      <button
                                        type="button"
                                        className={`tree__row tree__row--task${selected ? ' tree__row--selected' : ''}`}
                                        aria-selected={selected}
                                        onClick={() =>
                                          onSelectTask(task, project, client)
                                        }
                                      >
                                        <span className="tree__chevron tree__chevron--leaf" />
                                        <span className="tree__label">
                                          {task.name}
                                        </span>
                                        <span className="tree__meta">
                                          #{task.id}
                                        </span>
                                      </button>
                                    </li>
                                  )
                                })
                              )}
                            </ul>
                          ) : null}
                        </li>
                      )
                    })
                  )}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
