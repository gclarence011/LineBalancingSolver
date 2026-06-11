export interface SolveRequest {
  cycle_time: number
  task_times: Record<number, number>
  precedence: [number, number][]
  compatible_sets: number[][] | null
}

export interface StationResult {
  station_id: number
  tasks: number[]
  load: number
  machine_qty: number
}

export interface SolveResponse {
  status: string
  cycle_time: number
  max_cycle_time: number
  stations_used: number
  stations: StationResult[]
}

export interface TaskRow {
  id: number
  time: number
}

export interface PrecedenceRow {
  before: number
  after: number
}
