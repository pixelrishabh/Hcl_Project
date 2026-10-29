import React, { useState } from "react"
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Clock,
  ShieldAlert,
  Wrench,
  CheckSquare,
  Square,
  Unplug,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DiagnosisRecord } from "../types"

interface DiagnosisPanelProps {
  diagnosis: DiagnosisRecord | null
  currentMode: string
}

export const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({
  diagnosis,
  currentMode,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({})

  const isNormal = currentMode === "normal" && (!diagnosis || diagnosis.fault_category === "normal")

  if (isNormal) {
    return (
      <Card className="border-border bg-surface">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold tracking-wide uppercase font-mono flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted" />
              Diagnostic Intelligence &amp; RAG Reasoning
            </CardTitle>
            <Badge variant="nominal" className="font-mono text-xs">
              SYSTEM NOMINAL
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted">
            Grounded LLM diagnosis with domain technical manual retrieval
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-col items-center justify-center py-8 text-center border rounded-[4px] border-border bg-raised">
            <CheckCircle2 className="h-8 w-8 text-muted mb-2 opacity-80" />
            <h4 className="text-xs font-semibold text-text font-mono uppercase">
              Operating Within Healthy Parameter Envelopes
            </h4>
            <p className="text-xs text-muted max-w-md mt-1 font-mono">
              ISO 20816-3 (formerly ISO 10816-3) Zone A/B compliant. No thermal runaway, hydraulic cavitation, or sensor dropouts detected. Continuous 1 Hz SCADA surveillance active.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const category = diagnosis?.fault_category || currentMode
  const symptoms = diagnosis?.symptoms || []
  const sources = diagnosis?.retrieved_sources || []
  const sections = diagnosis?.sections || {}
  const latency = diagnosis?.latency_seconds || 0.42

  const isTrip =
    category === "overheating" ||
    category === "pressure_drop" ||
    (diagnosis?.readings && (diagnosis.readings.vibration > 7.1 || diagnosis.readings.temperature >= 75.0 || diagnosis.readings.pressure < 3.0))

  const isSensorFault = category === "sensor_failure"

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  const defaultActions = [
    "Verify secondary instrumentation and cross-check redundant physical gauges.",
    "Throttle pump variable frequency drive (VFD) to safe minimum baseline.",
    "Inspect lubrication oil condition, seal flush lines, and mechanical couplings.",
    "If mechanical or electrical disassembly is required, execute Lockout/Tagout (LOTO).",
    "Log work order in CMMS according to API 610 industrial maintenance standards.",
  ]

  const actions = sections.recommended_actions && sections.recommended_actions.length > 0
    ? sections.recommended_actions
    : defaultActions

  return (
    <Card
      className={`border bg-surface ${
        isTrip
          ? "border-crit/70 bg-crit/5"
          : isSensorFault
          ? "border-sensor-fault/70 bg-sensor-fault/5"
          : "border-warn/70 bg-warn/5"
      }`}
    >
      {/* 1. FAULT NAME + SEVERITY */}
      <CardHeader className="pb-2.5 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle
                className={`text-xs font-semibold tracking-wide uppercase font-mono flex items-center gap-1.5 ${
                  isTrip
                    ? "text-crit"
                    : isSensorFault
                    ? "text-sensor-fault"
                    : "text-warn"
                }`}
              >
                {isTrip ? (
                  <AlertOctagon className="h-4 w-4 shrink-0" />
                ) : isSensorFault ? (
                  <Unplug className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                Active Incident: {category.toUpperCase().replace("_", " ")}
              </CardTitle>
            </div>
            <CardDescription className="text-[11px] font-mono text-muted mt-0.5">
              Target: {diagnosis?.device_id || "pump_centrifugal_01"} &middot; Time: {diagnosis?.timestamp || "Active Telemetry"}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={isTrip ? "critical" : isSensorFault ? "sensorFault" : "warning"}
              className="text-xs uppercase font-mono font-bold"
            >
              {isTrip ? "TRIP (CRITICAL)" : isSensorFault ? "SENSOR FAULT" : "WARNING (ALERT)"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 space-y-3.5">
        {/* 2. PHYSICAL EVIDENCE & ROOT CAUSE */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-muted" />
              Observed Physical Evidence
            </h4>
            <span className="text-[10px] font-mono text-muted flex items-center gap-1 tabular-nums">
              <Clock className="h-3 w-3 text-muted" /> TTD / Latency: {latency.toFixed(2)}s
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {symptoms.length > 0 ? (
              symptoms.map((symptom, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-2 py-0.5 rounded-[4px] border text-[11px] font-mono ${
                    isTrip
                      ? "border-crit/40 bg-crit/15 text-text"
                      : isSensorFault
                      ? "border-sensor-fault/40 bg-sensor-fault/15 text-text"
                      : "border-warn/40 bg-warn/15 text-text"
                  }`}
                >
                  &bull; {symptom}
                </span>
              ))
            ) : (
              <span className="text-xs font-mono text-muted border border-border px-2 py-0.5 rounded-[4px]">
                Telemetry parameter deviation confirmed on active channel
              </span>
            )}
          </div>

          {/* Root cause text */}
          <div className="rounded-[4px] border border-border bg-raised p-2.5 text-xs font-mono text-text leading-relaxed">
            <div className="text-[10px] uppercase font-bold text-muted mb-1">
              Automated Root Cause Diagnosis:
            </div>
            <p className="text-xs">
              {sections.root_cause ||
                diagnosis?.diagnosis_text ||
                `Root cause corresponds to ${category.replace("_", " ")} according to API 610 centrifugal pump mechanical dynamics and ISO 20816-3 (formerly ISO 10816-3) standard vibration envelopes.`}
            </p>
          </div>
        </div>

        {/* 3. STANDARD OPERATING PROCEDURES (SOP) CHECKLIST WITH TICKABLE STEPS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-muted" />
              Standard Operating Procedures (SOP) Checklist
            </h4>
            <span className="text-[10px] font-mono text-muted tabular-nums">
              {Object.values(completedSteps).filter(Boolean).length}/{actions.length} Completed
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {actions.map((action, idx) => {
              const isChecked = !!completedSteps[idx]
              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`flex items-start gap-2 p-2 rounded-[4px] border cursor-pointer select-none transition-colors ${
                    isChecked
                      ? "border-border bg-raised/50 text-muted line-through"
                      : "border-border bg-raised text-text hover:bg-surface"
                  }`}
                >
                  <button
                    type="button"
                    aria-label={`Step ${idx + 1}`}
                    className="mt-0.5 shrink-0 text-muted"
                  >
                    {isChecked ? (
                      <CheckSquare className="h-3.5 w-3.5 text-text" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-muted" />
                    )}
                  </button>
                  <span className="tabular-nums font-bold text-[11px] text-muted shrink-0">
                    Step {idx + 1}:
                  </span>
                  <span className="leading-tight">{action}</span>
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* 4. GROUNDED TECHNICAL MANUALS (RAG) WITH SIMILARITY SCORES AS THIN BARS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted" />
              Retrieved Technical Manuals (RAG)
            </h4>
            <span className="text-[10px] font-mono text-muted">
              TF-IDF Cosine Match
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sources.length > 0 ? (
              sources.map((src, idx) => {
                const scorePercent = Math.min(100, Math.round(src.score * 100))
                return (
                  <div
                    key={idx}
                    className="flex flex-col p-2 rounded-[4px] border border-border bg-raised text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-text font-semibold">
                      <span className="truncate max-w-[150px]">{src.source}</span>
                      <span className="text-[10px] text-muted tabular-nums">
                        {scorePercent}%
                      </span>
                    </div>
                    <span className="text-[10px] text-muted mt-0.5 truncate">
                      {src.section || "Technical Guidelines"}
                    </span>
                    {/* Thin similarity score bar */}
                    <div className="h-1 w-full bg-surface border border-border/60 rounded-[1px] mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-2 p-2 rounded-[4px] border border-border text-xs font-mono text-muted">
                Reference Standards: API 610 Centrifugal Slurry Dynamics &middot; ISO 20816-3 (formerly ISO 10816-3)
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
