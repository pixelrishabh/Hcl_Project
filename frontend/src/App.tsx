import React, { useState, useEffect, useRef, useMemo } from "react"
import { Header } from "./components/Header"
import { ActiveAlarmBar } from "./components/ActiveAlarmBar"
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
import {
  SensorReading,
  DiagnosisRecord,
  DatasetInfo,
  DatabaseStats,
  ActiveAlarm,
  HealthBreakdown,
} from "./types"

export const App: React.FC = () => {
  // Parse optional URL parameters for direct mode/theme testing
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
  const paramMode = urlParams?.get("mode") || "normal"
  const paramSubmode = urlParams?.get("submode") || "flatline"
  const paramTheme = urlParams?.get("theme")

  // Connection and system state
  const [isLive, setIsLive] = useState<boolean>(false)
  const [currentMode, setCurrentMode] = useState<string>(paramMode)
  const [currentSubmode, setCurrentSubmode] = useState<string>(paramSubmode)
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null)
  const [previousReading, setPreviousReading] = useState<SensorReading | null>(null)
  const [history, setHistory] = useState<SensorReading[]>([])
  const [latestDiagnosis, setLatestDiagnosis] = useState<DiagnosisRecord | null>(null)
  const [diagnosesHistory, setDiagnosesHistory] = useState<DiagnosisRecord[]>([])
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null)
  const [dbStats, setDbStats] = useState<DatabaseStats | undefined>(undefined)
  const [healthIndex, setHealthIndex] = useState<HealthBreakdown | undefined>(undefined)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false)
  const [isInjecting, setIsInjecting] = useState<boolean>(false)

  // Client-side Active Alarms State
  const [activeAlarms, setActiveAlarms] = useState<ActiveAlarm[]>([])

  // Standalone simulator instance for instant offline resilience
  const simulatorRef = useRef<StandalonePhysicsSimulator>(new StandalonePhysicsSimulator())
  const standaloneTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
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

  // Process live alarms based on current reading and mode
  useEffect(() => {
    if (!latestReading) return
    const nowStr = new Date().toTimeString().split(" ")[0]
    const temp = latestReading.temperature
    const vib = latestReading.vibration
    const press = latestReading.pressure

    setActiveAlarms((prev) => {
      const updated: ActiveAlarm[] = []
      const prevMap = new Map(prev.map((a) => [a.id, a]))

      // 1. RTD Disconnect Sentinel
      if (temp < -900) {
        const existing = prevMap.get("alarm-rtd-disconnect")
        updated.push({
          id: "alarm-rtd-disconnect",
          title: "RTD SENSOR OPEN",
          severity: "SENSOR_FAULT",
          raisedAt: existing ? existing.raisedAt : nowStr,
          acknowledged: existing ? existing.acknowledged : false,
          channel: "temperature",
          message: "Out-of-range sentinel -999.0°C received",
        })
      }

      // 2. ADC Flatline
      if (currentMode === "sensor_failure" && currentSubmode === "flatline") {
        const existing = prevMap.get("alarm-adc-flatline")
        updated.push({
          id: "alarm-adc-flatline",
          title: "ADC FLATLINE",
          severity: "SENSOR_FAULT",
          raisedAt: existing ? existing.raisedAt : nowStr,
          acknowledged: existing ? existing.acknowledged : false,
          channel: "system",
          message: "Zero-variance analog freeze detected across cycles",
        })
      }

      // 3. Stator Overheating Trip
      if (temp >= 75.0) {
        const existing = prevMap.get("alarm-temp-trip")
        updated.push({
          id: "alarm-temp-trip",
          title: "THERMAL OVERHEAT",
          severity: "CRITICAL",
          raisedAt: existing ? existing.raisedAt : nowStr,
          acknowledged: existing ? existing.acknowledged : false,
          channel: "temperature",
          message: `Stator temp ${temp.toFixed(1)}°C exceeds 75.0°C trip limit`,
        })
      } else if (temp >= 65.0 && temp < 75.0) {
        const existing = prevMap.get("alarm-temp-warn")
        updated.push({
          id: "alarm-temp-warn",
          title: "TEMP ELEVATED",
          severity: "WARNING",
          raisedAt: existing ? existing.raisedAt : nowStr,
          acknowledged: existing ? existing.acknowledged : false,
          channel: "temperature",
          message: `Stator temp ${temp.toFixed(1)}°C exceeds 65.0°C warning limit`,
        })
      }

      // 4. Vibration Trip & Alert (ISO 20816-3)
      if (vib > 7.1) {
        const existing = prevMap.get("alarm-vib-trip")
        updated.push({
          id: "alarm-vib-trip",
          title: "VIBRATION TRIP",
          severity: "CRITICAL",
          raisedAt: existing ? existing.raisedAt : nowStr,
          acknowledged: existing ? existing.acknowledged : false,
          channel: "vibration",
          message: `Vibration ${vib.toFixed(2)} mm/s exceeds ISO 20816-3 Zone D (7.1 mm/s)`,
        })
      } else if (vib > 4.5) {
        const existing = prevMap.get("alarm-vib-warn")
        updated.push({
          id: "alarm-vib-warn",
          title: "VIBRATION ALERT",
          severity: "WARNING",
          raisedAt: existing ? existing.raisedAt : nowStr,
          acknowledged: existing ? existing.acknowledged : false,
          channel: "vibration",
          message: `Vibration ${vib.toFixed(2)} mm/s enters ISO 20816-3 Zone C (4.5 mm/s)`,
        })
      }

      // 5. Hydraulic Pressure Trip & Warning
      if (press < 3.0) {
        const existing = prevMap.get("alarm-press-trip")
        updated.push({
          id: "alarm-press-trip",
          title: "HYDRAULIC CAVITATION",
          severity: "CRITICAL",
          raisedAt: existing ? existing.raisedAt : nowStr,
          acknowledged: existing ? existing.acknowledged : false,
          channel: "pressure",
          message: `Discharge pressure ${press.toFixed(2)} bar collapsed below 3.0 bar`,
        })
      } else if (press < 3.8) {
        const existing = prevMap.get("alarm-press-warn")
        updated.push({
          id: "alarm-press-warn",
          title: "PRESSURE LOW",
          severity: "WARNING",
          raisedAt: existing ? existing.raisedAt : nowStr,
          acknowledged: existing ? existing.acknowledged : false,
          channel: "pressure",
          message: `Discharge pressure ${press.toFixed(2)} bar below 3.8 bar warning`,
        })
      }

      return updated
    })
  }, [latestReading, currentMode, currentSubmode])

  const handleAcknowledgeAlarm = (id: string) => {
    setActiveAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    )
  }

  const handleAcknowledgeAllAlarms = () => {
    setActiveAlarms((prev) => prev.map((a) => ({ ...a, acknowledged: true })))
  }

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
      if (statusData.health_index) {
        setHealthIndex(statusData.health_index)
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
      if (paramMode && paramMode !== "normal") {
        simulatorRef.current.setMode(paramMode, paramSubmode)
      }

      // Seed initial history
      const initialHistory: SensorReading[] = []
      let lastDiag: DiagnosisRecord | null = null
      for (let i = 0; i < 30; i++) {
        const { reading, detection } = simulatorRef.current.step()
        initialHistory.push(reading)
        if (detection) {
          lastDiag = {
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
            diagnosis_text: `Critical anomaly detected on ${reading.device_id}. Anomaly corresponds to ${detection.fault_category.replace('_', ' ')}. Symptoms include: ${detection.symptoms.join('; ')}. Immediate maintenance intervention recommended according to API 610 industrial guidelines and ISO 20816-3 (formerly ISO 10816-3).`,
            sections: {
              fault_summary: `Severe ${detection.fault_category.replace('_', ' ')} detected.`,
              root_cause: `Mechanical degradation or barrier breakdown. Operating metrics exceeded acceptable envelope.`,
              recommended_actions: [
                "Throttle pump speed via VFD to minimum safe operation point.",
                "Verify lube oil temperature, contamination, and seal flush integrity.",
                "Cross-check secondary RTD sensors and vibration spectral peaks.",
                "Issue immediate work order for mechanical maintenance technician.",
              ],
              severity: "High",
              urgency: "Immediate",
            },
            latency_seconds: 0.38,
            runtime: "Stand-in Physics Classifier & RAG Retriever",
            duration: "30s",
            peak_value:
              detection.fault_category === "bearing_wear"
                ? `${reading.vibration.toFixed(2)} mm/s`
                : detection.fault_category === "overheating"
                ? `${reading.temperature.toFixed(1)} °C`
                : `${reading.pressure.toFixed(2)} bar`,
            time_to_detect: "0.38s",
          }
        }
      }
      setHistory(initialHistory)
      setLatestReading(initialHistory[initialHistory.length - 1])
      if (lastDiag) {
        setLatestDiagnosis(lastDiag)
        setDiagnosesHistory([lastDiag])
      }

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
            diagnosis_text: `Critical anomaly detected on ${reading.device_id}. Anomaly corresponds to ${detection.fault_category.replace('_', ' ')}. Symptoms include: ${detection.symptoms.join('; ')}. Immediate maintenance intervention recommended according to API 610 industrial guidelines and ISO 20816-3 (formerly ISO 10816-3).`,
            sections: {
              fault_summary: `Severe ${detection.fault_category.replace('_', ' ')} detected.`,
              root_cause: `Mechanical degradation or barrier breakdown. Operating metrics exceeded acceptable envelope.`,
              recommended_actions: [
                "Throttle pump speed via VFD to minimum safe operation point.",
                "Verify lube oil temperature, contamination, and seal flush integrity.",
                "Cross-check secondary RTD sensors and vibration spectral peaks.",
                "Issue immediate work order for mechanical maintenance technician.",
              ],
              severity: "High",
              urgency: "Immediate",
            },
            latency_seconds: 0.38,
            runtime: "Stand-in Physics Classifier & RAG Retriever",
            duration: "30s",
            peak_value:
              detection.fault_category === "bearing_wear"
                ? `${reading.vibration.toFixed(2)} mm/s`
                : detection.fault_category === "overheating"
                ? `${reading.temperature.toFixed(1)} °C`
                : `${reading.pressure.toFixed(2)} bar`,
            time_to_detect: "0.38s",
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
          if (data.health_index) setHealthIndex(data.health_index)
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
          if (data.health_index) setHealthIndex(data.health_index)
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
        console.warn("SSE connection error, attempting retry...")
        sse.close()
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
      setActiveAlarms([])
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
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans">
      {/* 1. Header with Persistent Data-Source Badge & Controls */}
      <Header
        isLive={isLive}
        mode={currentMode}
        totalDiagnoses={diagnosesHistory.length}
        dbRecords={dbStats?.sensor_readings_count || 10000}
        onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
      />

      {/* 2. Top Active-Alarm Bar */}
      <ActiveAlarmBar
        alarms={activeAlarms}
        onAcknowledge={handleAcknowledgeAlarm}
        onAcknowledgeAll={handleAcknowledgeAllAlarms}
      />

      {/* 3. Pipeline Connectivity Banner */}
      <ConnectionBanner
        isLive={isLive}
        onReconnect={connectBackend}
        onOpenDataset={() => setIsDatasetModalOpen(true)}
      />

      {/* 4. Main SCADA Dashboard Layout */}
      <main className="flex-1 container max-w-7xl mx-auto p-4 sm:p-5 space-y-3.5">
        {/* Top: 4 Real-Time Sensor Telemetry & Health Cards */}
        <SensorMetricsGrid
          reading={latestReading}
          previousReading={previousReading}
          history={history}
          mode={currentMode}
          healthIndexOverride={healthIndex}
        />

        {/* Center: Fault Simulator Controller */}
        <FaultInjectionPanel
          currentMode={currentMode}
          currentSubmode={currentSubmode}
          onSelectMode={handleSelectMode}
          disabled={isInjecting}
        />

        {/* Middle Two-Column Grid: Waveform Charts & Diagnostic Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
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

        {/* Bottom: Persistent Incident Audit Trail */}
        <IncidentHistoryTable history={diagnosesHistory} />
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-border py-3 text-xs font-mono text-muted bg-surface">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span>P_311: Industrial SCADA Control Room HMI</span> &middot;{" "}
            <span>API 610 Centrifugal Slurry Pump</span> &middot;{" "}
            <span>ISO 20816-3 (formerly ISO 10816-3) Vibration Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <span>ISA-101 Standard Compliant</span>
          </div>
        </div>
      </footer>

      {/* 6. Dataset & Database Modal */}
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
