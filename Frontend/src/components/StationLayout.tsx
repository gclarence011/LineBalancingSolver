import type { SolveResponse } from '../types'

interface StationLayoutProps {
  result: SolveResponse | null
}

function MachineCard({
  label,
  tasks,
  load,
  maxCycleTime,
}: {
  label: string
  tasks: number[]
  load: number
  maxCycleTime: number
}) {
  const utilization = Math.min(load / maxCycleTime, 1)

  return (
    <article className="machine-card">
      <header>
        <strong>{label}</strong>
      </header>
      <div className="task-chips">
        {tasks.map((taskId) => (
          <span className="chip" key={taskId}>
            T{taskId}
          </span>
        ))}
      </div>
      <div className="load-bar">
        <div className="load-fill" style={{ width: `${utilization * 100}%` }} />
      </div>
      <footer>
        Load {load.toFixed(3)} / {maxCycleTime} ({(utilization * 100).toFixed(1)}%)
      </footer>
    </article>
  )
}

export function StationLayout({ result }: StationLayoutProps) {
  if (!result || result.status !== 'Optimal' || result.stations.length === 0) {
    return null
  }

  return (
    <section className="panel">
      <h2>Line layout</h2>
      <p className="hint scroll-hint">Scroll left or right to view all stations.</p>
      <div className="station-row">
        {result.stations.map((station) => {
          const machines = Array.from({ length: station.machine_qty }, (_, index) => index + 1)

          return (
            <article className="station-group" key={station.station_id}>
              <header className="station-group-header">
                <strong>Station {station.station_id}</strong>
                {station.machine_qty > 1 && (
                  <span>{station.machine_qty} parallel</span>
                )}
              </header>
              <div className="machine-row">
                {machines.map((machineIndex) => (
                  <MachineCard
                    key={machineIndex}
                    label={`Machine ${machineIndex}`}
                    tasks={station.tasks}
                    load={station.load}
                    maxCycleTime={result.max_cycle_time}
                  />
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
