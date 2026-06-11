import { useState, type FormEvent } from 'react'
import type { PrecedenceRow, SolveRequest, TaskRow } from '../types'
import {
  buildSequentialPrecedence,
  compatibleSetsFromInputs,
  DEFAULT_TASKS,
  precedenceToTuples,
  tasksToRecord,
} from '../utils'

interface ParameterFormProps {
  onSubmit: (request: SolveRequest) => void
  loading: boolean
}

export function ParameterForm({ onSubmit, loading }: ParameterFormProps) {
  const [cycleTimeInput, setCycleTimeInput] = useState('2')
  const [tasks, setTasks] = useState<TaskRow[]>(DEFAULT_TASKS)
  const [sequentialPrecedence, setSequentialPrecedence] = useState(true)
  const [customPrecedence, setCustomPrecedence] = useState<PrecedenceRow[]>([])
  const [compatibleSetInputs, setCompatibleSetInputs] = useState<string[]>([])

  const taskIds = tasks.map((task) => task.id)

  function syncTaskCount(nextTasks: TaskRow[]) {
    setTasks(nextTasks)
    if (!sequentialPrecedence) {
      setCustomPrecedence([])
    }
    setCompatibleSetInputs([])
  }

  function addTask() {
    const nextId = tasks.length + 1
    syncTaskCount([...tasks, { id: nextId, time: 1 }])
  }

  function removeTask(taskId: number) {
    if (tasks.length <= 1) return
    const nextTasks = tasks
      .filter((task) => task.id !== taskId)
      .map((task, index) => ({ ...task, id: index + 1 }))
    syncTaskCount(nextTasks)
  }

  function updateTaskTime(taskId: number, time: number) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, time } : task)),
    )
  }

  function addPrecedenceRow() {
    setCustomPrecedence((current) => [...current, { before: 1, after: 2 }])
  }

  function removePrecedenceRow(index: number) {
    setCustomPrecedence((current) => current.filter((_, i) => i !== index))
  }

  function updatePrecedence(index: number, field: 'before' | 'after', value: number) {
    setCustomPrecedence((current) =>
      current.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )
  }

  function handleSequentialToggle(enabled: boolean) {
    setSequentialPrecedence(enabled)
    setCustomPrecedence([])
  }

  function addCompatibleSet() {
    setCompatibleSetInputs((current) => [...current, ''])
  }

  function removeCompatibleSet(index: number) {
    setCompatibleSetInputs((current) => current.filter((_, i) => i !== index))
  }

  function updateCompatibleSet(index: number, value: string) {
    setCompatibleSetInputs((current) =>
      current.map((group, i) => (i === index ? value : group)),
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const precedence = sequentialPrecedence
      ? buildSequentialPrecedence(tasks.length)
      : customPrecedence
    onSubmit({
      cycle_time: Number(cycleTimeInput),
      task_times: tasksToRecord(tasks),
      precedence: precedenceToTuples(precedence),
      compatible_sets: compatibleSetsFromInputs(compatibleSetInputs),
    })
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <h2>Parameters</h2>

      <div className="form-grid">
        <div className="form-column">
          <section className="form-section">
            <div className="section-header">
              <h3>Task times</h3>
              <button type="button" className="secondary" onClick={addTask}>
                Add task
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Time (min)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.id}</td>
                      <td>
                        <input
                          type="number"
                          min={0.001}
                          step="0.001"
                          value={task.time}
                          onChange={(event) =>
                            updateTaskTime(task.id, Number(event.target.value))
                          }
                          required
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => removeTask(task.id)}
                          disabled={tasks.length <= 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="form-column form-column-compact">
          <section className="form-section form-section-compact">
            <label className="cycle-time-label">
              Max Cycle Time (min)
              <input
                className="compact-input"
                type="number"
                min={0.001}
                step="0.001"
                value={cycleTimeInput}
                onChange={(event) => setCycleTimeInput(event.target.value)}
                required
              />
            </label>
          </section>

          <section className="form-section form-section-compact">
            <div className="section-header compact-header">
              <h3>Precedence</h3>
              <label className="toggle toggle-compact">
                <input
                  type="checkbox"
                  checked={sequentialPrecedence}
                  onChange={(event) => handleSequentialToggle(event.target.checked)}
                />
                Sequential
              </label>
            </div>
            {sequentialPrecedence ? (
              <p className="hint compact-hint">
                Tasks follow order 1 → 2 → … → {tasks.length}.
              </p>
            ) : (
              <>
                <div className="section-header compact-header">
                  <p className="hint compact-hint">Custom before/after pairs.</p>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={addPrecedenceRow}
                  >
                    Add pair
                  </button>
                </div>
                {customPrecedence.length === 0 ? (
                  <p className="empty compact-hint">No precedence constraints.</p>
                ) : (
                  <div className="stack precedence-stack compact-stack">
                    {customPrecedence.map((row, index) => (
                      <div className="compact-row inline-row" key={`${row.before}-${row.after}-${index}`}>
                        <select
                          className="compact-input"
                          value={row.before}
                          aria-label={`Pair ${index + 1} before`}
                          onChange={(event) =>
                            updatePrecedence(index, 'before', Number(event.target.value))
                          }
                        >
                          {taskIds.map((id) => (
                            <option key={id} value={id}>
                              {id}
                            </option>
                          ))}
                        </select>
                        <span className="arrow">→</span>
                        <select
                          className="compact-input"
                          value={row.after}
                          aria-label={`Pair ${index + 1} after`}
                          onChange={(event) =>
                            updatePrecedence(index, 'after', Number(event.target.value))
                          }
                        >
                          {taskIds.map((id) => (
                            <option key={id} value={id}>
                              {id}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="secondary compact-btn"
                          onClick={() => removePrecedenceRow(index)}
                          aria-label={`Remove pair ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="form-section form-section-compact">
            <div className="section-header compact-header">
              <h3>Compatible sets</h3>
              <button type="button" className="secondary compact-btn" onClick={addCompatibleSet}>
                Add group
              </button>
            </div>
            {compatibleSetInputs.length === 0 ? (
              <p className="empty compact-hint">No groups defined.</p>
            ) : (
              <div className="stack compact-stack">
                {compatibleSetInputs.map((groupInput, index) => (
                  <div className="compact-row inline-row" key={index}>
                    <span className="group-label">G{index + 1}</span>
                    <input
                      className="compact-input group-input"
                      type="text"
                      inputMode="text"
                      value={groupInput}
                      onChange={(event) => updateCompatibleSet(index, event.target.value)}
                      placeholder="1, 2, 3"
                    />
                    <button
                      type="button"
                      className="secondary compact-btn"
                      onClick={() => removeCompatibleSet(index)}
                      aria-label={`Remove group ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button type="submit" className="primary form-submit" disabled={loading}>
            {loading ? 'Solving…' : 'Run solver'}
          </button>
        </div>
      </div>
    </form>
  )
}
