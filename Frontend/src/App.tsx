import { useState } from 'react'
import { solveAssemblyLine } from './api'
import { ParameterForm } from './components/ParameterForm'
import { ResultsTable } from './components/ResultsTable'
import { StationLayout } from './components/StationLayout'
import type { SolveRequest, SolveResponse } from './types'
import './App.css'

function App() {
  const [result, setResult] = useState<SolveResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(request: SolveRequest) {
    setLoading(true)
    setError(null)
    try {
      const response = await solveAssemblyLine(request)
      setResult(response)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">SALBP-1 Demo</p>
          <h1>Assembly Line Balancing</h1>
          <p>
            Enter task times, precedence, and compatibility rules, then minimize
            the number of workstations for a given cycle time.
          </p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="layout">
        <ParameterForm onSubmit={handleSubmit} loading={loading} />
        <div className="results-column">
          <ResultsTable result={result} />
          <StationLayout result={result} />
        </div>
      </main>
    </div>
  )
}

export default App
