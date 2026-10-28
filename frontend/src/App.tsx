import React, { useState, useEffect, useRef } from "react"
import { Header } from "./components/Header"
import { ConnectionBanner } from "./components/ConnectionBanner"
import { SensorMetricsGrid } from "./components/SensorMetricsGrid"
import { FaultInjectionPanel } from "./components/FaultInjectionPanel"
import { TelemetryChart } from "./components/TelemetryChart"
import { DiagnosisPanel } from "./components/DiagnosisPanel"
import { IncidentHistoryTable } from "./components/IncidentHistoryTable"
import { DatasetDbModal } from "./components/DatasetDbModal"
import {
  fetchStatus,
  fetchDataset,
  fetchDiagnoses,
  postMode,
  StandalonePhysicsSimulator,
  API_BASE,
} from "./services/api"
import { SensorReading, DiagnosisRecord, DatasetInfo, DatabaseStats } from "./types"

export const App: React.FC = () => {
  // Connection and system state
  const [isLive, setIsLive] = useState<boolean>(false)
  const [currentMode, setCurrentMode] = useState<string>("normal")
  const [currentSubmode, setCurrentSubmode] = useState<string>("flatline")
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null)
  const [previousReading, setPreviousReading] = useState<SensorReading | null>(null)
  const [history, setHistory] = useState<SensorReading[]>([])
  const [latestDiagnosis, setLatestDiagnosis] = useState<DiagnosisRecord | null>(null)
  const [diagnosesHistory, setDiagnosesHistory] = useState<DiagnosisRecord[]>([])
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null)
  const [dbStats, setDbStats] = useState<DatabaseStats | undefined>(undefined)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false)
  const [isInjecting, setIsInjecting] = useState<boolean>(false)

  // Standalone simulator instance for instant offline resilience
  const simulatorRef = useRef<StandalonePhysicsSimulator>(new StandalonePhysicsSimulator())
  const standaloneTimerRef = useRef<any>(null)
  const sseRef = useRef<EventSource | null>(null)
  const isPausedRef = useRef<boolean>(isPaused)
  isPausedRef.current = isPaused

  // Initialize and synchronize
  useEffect(() => {
    connectBackend()
    return () => {
      if (standaloneTimerRef.current) clearInterval(standaloneTimerRef.current)
      if (sseRef.current) sseRef.current.close()
    }
  }, [])

  const connectBackend = async () => {
    try {
      const statusData = await fetchStatus()
      setIsLive(true)
      if (standaloneTimerRef.current) {
        clearInterval(standaloneTimerRef.current)
        standaloneTimerRef.current = null
      }

      if (statusData.mode) {
        setCurrentMode(statusData.mode)
        setCurrentSubmode(statusData.submode || "flatline")
      }
      if (statusData.latest_reading) {
        setLatestReading(statusData.latest_reading)
      }
      if (statusData.history && statusData.history.length > 0) {
        setHistory(statusData.history)
      }
      if (statusData.latest_diagnosis) {
        setLatestDiagnosis(statusData.latest_diagnosis)
      }
      if (statusData.database) {
        setDbStats(statusData.database)
      }

      // Load dataset info and diagnoses
      fetchDataset()
        .then(setDatasetInfo)
        .catch(() => {})
      fetchDiagnoses()
        .then(setDiagnosesHistory)
        .catch(() => {})

      // Open SSE Stream
      initSSE()
    } catch (err) {
      console.warn("Backend not reachable directly, engaging Standalone Demo Mode:", err)
      engageStandaloneMode()
    }
  }

  const engageStandaloneMode = () => {
    setIsLive(false)
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }

    if (!standaloneTimerRef.current) {
      // Seed initial history
      const initialHistory: SensorReading[] = []
      for (let i = 0; i < 30; i++) {
        const { reading } = simulatorRef.current.step()
        initialHistory.push(reading)
      }
      setHistory(initialHistory)
      setLatestReading(initialHistory[initialHistory.length - 1])

      // 1 Hz simulation loop
      standaloneTimerRef.current = setInterval(() => {
        if (isPausedRef.current) return
        const { reading, detection } = simulatorRef.current.step()

        setPreviousReading((prev) => latestReading || prev)
        setLatestReading(reading)
        setHistory((prev) => {
          const updated = [...prev, reading]
          if (updated.length > 60) updated.shift()
          return updated
        })

        if (detection) {
          const simulatedDiag: DiagnosisRecord = {
            timestamp: reading.timestamp,
            device_id: reading.device_id,
            fault_category: detection.fault_category,
            symptoms: detection.symptoms,
            readings: {
              temperature: reading.temperature,
              vibration: reading.vibration,
              pressure: reading.pressure,
            },
            retrieved_sources: [
              {
                source: "pump_fault_kb.md",
                section: "Slurry Pump Vibration & Thermal Dynamics",
                score: 0.94,
              },
              {
                source: "ai4i_mapping.json",
                section: "UCI Predictive Maintenance Boundary",
                score: 0.88,
              },
            ],
            diagnosis_text: `Critical anomaly detected on ${reading.device_id}. Anomaly corresponds to ${detection.fault_category.replace('_', ' ')}. Symptoms include: ${detection.symptoms.join('; ')}. Immediate maintenance intervention recommended according to API 610 industrial guidelines.`,
            sections: {
              fault_summary: `Severe ${detection.fault_category.replace('_', ' ')} detected.`,
              root_cause: `Mechanical degradation or barrier breakdown. Operating metrics exceeded acceptable envelope.`,
              recommended_actions: [
                "Throttle pump speed via VFD to minimum safe operation point.",
                "Verify lube oil temperature, contamination, and seal integrity.",
                "Cross-check secondary RTD sensors and vibration spectral peaks.",
                "Issue immediate work order for mechanical maintenance technician.",
              ],
              severity: "High",
              urgency: "Immediate",
            },
            latency_seconds: 0.38,
            runtime: "Stand-in Physics Classifier & RAG Retriever",
          }
          setLatestDiagnosis(simulatedDiag)
          setDiagnosesHistory((prev) => [simulatedDiag, ...prev.slice(0, 49)])
        }
      }, 1000)
    }
  }

  const initSSE = () => {
    if (sseRef.current) sseRef.current.close()

    try {
      const sse = new EventSource(`${API_BASE}/api/stream`)
      sseRef.current = sse

      sse.addEventListener("init", (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.mode) setCurrentMode(data.mode)
          if (data.submode) setCurrentSubmode(data.submode)
          if (data.latest_reading) setLatestReading(data.latest_reading)
          if (data.history) setHistory(data.history)
          if (data.latest_diagnosis) setLatestDiagnosis(data.latest_diagnosis)
        } catch (e) {
          console.error("Error parsing init SSE:", e)
        }
      })

      sse.addEventListener("telemetry", (event) => {
        if (isPausedRef.current) return
        try {
          const data = JSON.parse(event.data)
          if (data.latest) {
            setPreviousReading((prev) => latestReading || prev)
            setLatestReading(data.latest)
            setHistory((prev) => {
              const updated = [...prev, data.latest]
              if (updated.length > 60) updated.shift()
              return updated
            })
          }
          if (data.mode) setCurrentMode(data.mode)
        } catch (e) {
          console.error("Error parsing telemetry SSE:", e)
        }
      })

      sse.addEventListener("diagnosis", (event) => {
        try {
          const data = JSON.parse(event.data)
          setLatestDiagnosis(data)
          setDiagnosesHistory((prev) => [data, ...prev.slice(0, 49)])
        } catch (e) {
          console.error("Error parsing diagnosis SSE:", e)
        }
      })

      sse.onerror = () => {
        console.warn("SSE connection error, closing stream...")
        sse.close()
        // Do not immediately drop to standalone if temporary, but try reconnecting
      }
    } catch (e) {
      console.error("Failed to initialize SSE:", e)
    }
  }

  // Handle Mode Change
  const handleSelectMode = async (mode: string, submode: string = "flatline") => {
    setIsInjecting(true)
    setCurrentMode(mode)
    setCurrentSubmode(submode)
    simulatorRef.current.setMode(mode, submode)

    if (mode === "normal") {
      setLatestDiagnosis(null)
    }

    if (isLive) {
      try {
        await postMode(mode, submode)
      } catch (e) {
        console.warn("Failed to POST mode to backend, updating local state:", e)
      }
    }
    setIsInjecting(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* 1. Header */}
      <Header
        isLive={isLive}
        mode={currentMode}
        totalDiagnoses={diagnosesHistory.length}
        dbRecords={dbStats?.sensor_readings_count || 10000}
        onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
      />

      {/* 2. Connection and Standalone Status Banner */}
      <ConnectionBanner
        isLive={isLive}
        onReconnect={connectBackend}
        onOpenDataset={() => setIsDatasetModalOpen(true)}
      />

      {/* 3. Main SCADA Dashboard Layout */}
      <main className="flex-1 container max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Top: 4 Critical Real-Time Sensor Telemetry & Health Cards */}
        <SensorMetricsGrid
          reading={latestReading}
          previousReading={previousReading}
          history={history}
          mode={currentMode}
        />

        {/* Center: Fault Simulator Controller */}
        <FaultInjectionPanel
          currentMode={currentMode}
          currentSubmode={currentSubmode}
          onSelectMode={handleSelectMode}
          disabled={isInjecting}
        />

        {/* Middle Two-Column Grid: Waveform Charts & Diagnostic Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Waveform Telemetry Chart (7 cols on desktop) */}
          <div className="lg:col-span-7">
            <TelemetryChart
              history={history}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
            />
          </div>

          {/* Diagnostic Intelligence & Grounded RAG Reasoning (5 cols) */}
          <div className="lg:col-span-5">
            <DiagnosisPanel
              diagnosis={latestDiagnosis}
              currentMode={currentMode}
            />
          </div>
        </div>

        {/* Bottom: Persistent Incident Log Table */}
        <IncidentHistoryTable history={diagnosesHistory} />
      </main>

      {/* 4. Footer */}
      <footer className="border-t py-4 text-xs font-mono text-muted-foreground bg-card/40">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span>P_311: Knowledge-Driven IoT Fault Diagnosis Assistant</span> &middot;{" "}
            <span>API 610 Centrifugal Slurry Pump</span> &middot;{" "}
            <span>ISO 10816 Vibration Standards</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Powered by shadcn/ui &amp; Tailwind CSS</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </footer>

      {/* 5. Dataset & Database Modal */}
      <DatasetDbModal
        open={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        datasetInfo={datasetInfo}
        dbStats={dbStats}
      />
    </div>
  )
}

export default App
