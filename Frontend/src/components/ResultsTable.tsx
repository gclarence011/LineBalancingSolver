import type { SolveResponse } from '../types'

interface ResultsTableProps {
  result: SolveResponse | null
}

export function ResultsTable({ result }: ResultsTableProps) {
  if (!result) {
    return (
      <section className="panel">
        <h2>Results</h2>
        <p className="empty">Run the solver to see station assignments.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Results</h2>
      <div className="summary-grid">
        <div>
          <span className="label">Status</span>
          <strong>{result.status}</strong>
        </div>
        <div>
          <span className="label">Cycle time</span>
          <strong>{result.cycle_time}</strong>
        </div>
        <div>
          <span className="label">Max cycle time</span>
          <strong>{result.max_cycle_time}</strong>
        </div>
        <div>
          <span className="label">Stations used</span>
          <strong>{result.stations_used}</strong>
        </div>
      </div>

      {result.status !== 'Optimal' ? (
        <p className="warning">Solver did not find an optimal assignment.</p>
      ) : (
        <div className="table-wrap">
          <table className="results-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>Tasks</th>
                <th>Load</th>
                <th>Machine qty</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {result.stations.map((station) => (
                <tr key={station.station_id}>
                  <td>{station.station_id}</td>
                  <td>{station.tasks.join(', ')}</td>
                  <td>{station.load.toFixed(3)}</td>
                  <td>{station.machine_qty}</td>
                  <td>{((station.load / result.max_cycle_time) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
