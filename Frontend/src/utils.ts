import type { PrecedenceRow, TaskRow } from './types'

export function buildSequentialPrecedence(taskCount: number): PrecedenceRow[] {
  if (taskCount < 2) return []
  return Array.from({ length: taskCount - 1 }, (_, i) => ({
    before: i + 1,
    after: i + 2,
  }))
}

export function tasksToRecord(tasks: TaskRow[]): Record<number, number> {
  return Object.fromEntries(tasks.map((task) => [task.id, task.time]))
}

export function precedenceToTuples(precedence: PrecedenceRow[]): [number, number][] {
  return precedence.map((row) => [row.before, row.after])
}

export function parseCompatibleSetInput(value: string): number[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0)
}

export function compatibleSetsFromInputs(inputs: string[]): number[][] {
  return inputs.map(parseCompatibleSetInput)
}

export const DEFAULT_TASKS: TaskRow[] = [
  { id: 1, time: 0.595 },
  { id: 2, time: 1.107 },
  { id: 3, time: 0.78 },
  { id: 4, time: 0.353 },
  { id: 5, time: 0.717 },
  { id: 6, time: 0.589 },
  { id: 7, time: 1.893 },
  { id: 8, time: 1.278 },
  { id: 9, time: 1.273 },
]
