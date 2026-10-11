import { useCallback, useState } from 'react'
import type { Client, Project, Task, TimeEntry } from './api/types'
import { HierarchyTree } from './components/HierarchyTree'
import { TimeEntriesTable } from './components/TimeEntriesTable'
import { TimeEntryForm } from './components/TimeEntryForm'
import './App.css'

function App() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [selectionLabel, setSelectionLabel] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [entriesRefresh, setEntriesRefresh] = useState(0)

  const handleSelectTask = useCallback(
    (task: Task, project: Project, client: Client) => {
      setSelectedTaskId(task.id)
      setSelectionLabel(`${client.name} → ${project.name} → ${task.name}`)
    },
    [],
  )

  const handleEditEntry = useCallback((entry: TimeEntry) => {
    setEditingEntry(entry)
    setSelectedTaskId(entry.taskId)
    setSelectionLabel(null)
  }, [])

  const handleClearEdit = useCallback(() => {
    setEditingEntry(null)
  }, [])

  const bumpEntries = useCallback(() => {
    setEntriesRefresh((n) => n + 1)
  }, [])

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">Memtime interview demo</p>
          <h1 className="app__title">Time tracking</h1>
          <p className="app__subtitle muted">
            Browse clients and tasks, review logged time, and create or update
            entries with validated ISO timestamps.
          </p>
        </div>
        {selectionLabel ? (
          <div className="selection-badge" title="Selected task">
            <span className="selection-badge__label">Selected task</span>
            <span className="selection-badge__value">{selectionLabel}</span>
          </div>
        ) : null}
      </header>

      <div className="app__layout">
        <aside className="app__sidebar">
          <HierarchyTree
            selectedTaskId={selectedTaskId}
            onSelectTask={handleSelectTask}
          />
        </aside>
        <main className="app__main">
          <TimeEntriesTable
            refreshToken={entriesRefresh}
            onEditEntry={handleEditEntry}
          />
          <TimeEntryForm
            selectedTaskId={selectedTaskId}
            editingEntry={editingEntry}
            onClearEdit={handleClearEdit}
            onCreated={bumpEntries}
            onUpdated={bumpEntries}
            onEntryMissing={bumpEntries}
          />
        </main>
      </div>
    </div>
  )
}

export default App
