import React from "react"
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Wrench,
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
  const isNormal = currentMode === "normal" && (!diagnosis || diagnosis.fault_category === "normal")

  if (isNormal) {
    return (
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase font-mono flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-400" />
              Diagnostic Intelligence &amp; RAG Reasoning
            </CardTitle>
            <Badge variant="success" className="font-mono text-xs">
              SYSTEM NOMINAL
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Grounded LLM diagnosis with domain knowledge retrieval
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed border-emerald-500/20 bg-emerald-500/5">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2 opacity-80" />
            <h4 className="text-sm font-semibold text-emerald-400 font-mono">
              Operating Within Healthy Parameter Envelopes
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mt-1">
              ISO 10816 Zone A/B compliant. No thermal runaway, hydraulic cavitation, or sensor dropouts detected. Continuous 1 Hz SCADA surveillance active.
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
  const runtime = diagnosis?.runtime || "Local RAG Retrieval & Diagnostic LLM"

  return (
    <Card className="border-rose-500/40 bg-card/60 backdrop-blur shadow-[0_0_20px_rgba(244,63,94,0.1)]">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold tracking-wide uppercase font-mono flex items-center gap-2 text-rose-400">
              <ShieldAlert className="h-4 w-4 text-rose-500 animate-pulse" />
              Active Incident: {category.toUpperCase().replace("_", " ")}
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              Timestamp: {diagnosis?.timestamp || "Active Telemetry Trigger"} &middot; Device: {diagnosis?.device_id || "pump_centrifugal_01"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="critical" className="font-mono text-xs">
              FAULT DETECTED
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Physical Symptoms */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Observed Physical Symptoms
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {symptoms.length > 0 ? (
              symptoms.map((symptom, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-[11px] py-1 px-2 font-normal"
                >
                  &bull; {symptom}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-xs font-mono">
                Telemetry thresholds breached on active channel
              </Badge>
            )}
          </div>
        </div>

        {/* Diagnosis & Root Cause */}
        <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary font-mono flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-scada-cyan" />
              Root Cause &amp; Physical Mechanism
            </span>
            <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Latency: {latency.toFixed(2)}s
            </span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            {sections.root_cause ||
              diagnosis?.diagnosis_text ||
              `Severe degradation detected in centrifugal pump assembly corresponding to ${category.replace("_", " ")}. Operating parameters indicate mechanical stress or thermal barrier failure.`}
          </p>
        </div>

        {/* Recommended Actions */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono mb-2 flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-scada-cyan" />
            Standard Operating Procedures (SOP) &amp; Remediation
          </h4>
          <div className="space-y-1.5">
            {(sections.recommended_actions || [
              "Throttle VFD drive to minimum allowable safe RPM to relieve mechanical torque.",
              "Inspect bearing housing lubrication levels and grease condition for metallic particles.",
              "Execute thermal imaging on stator core and check cooling jacket flow rate.",
              "Prepare maintenance dispatch ticket according to API 610 industrial maintenance protocol.",
            ]).map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded border border-border/40 bg-card text-xs text-foreground/90"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span className="pt-0.5">{action}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Grounded RAG Knowledge Base Sources */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-violet-400" />
              Retrieved Knowledge Chunks (RAG)
            </h4>
            <span className="text-[10px] font-mono text-muted-foreground">
              TF-IDF Cosine Similarity
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sources.length > 0 ? (
              sources.map((src, idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-2.5 rounded border border-violet-500/20 bg-violet-500/5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between font-semibold text-violet-300">
                    <span className="truncate">{src.source}</span>
                    <Badge variant="outline" className="text-[9px] py-0 border-violet-500/30 text-violet-300">
                      Score: {(src.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {src.section || "Technical Specification"}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-2.5 rounded border border-border/50 text-xs font-mono text-muted-foreground">
                Knowledge Base: pump_fault_kb.md (API 610 Slurry Standards &amp; ISO 10816 Vibration Envelopes)
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
