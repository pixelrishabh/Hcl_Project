import React from "react"
import { ShieldCheck, Flame, Gauge, AlertTriangle, Unplug, Disc } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FaultInjectionPanelProps {
  currentMode: string
  currentSubmode: string
  onSelectMode: (mode: string, submode?: string) => void
  disabled?: boolean
}

export const FaultInjectionPanel: React.FC<FaultInjectionPanelProps> = ({
  currentMode,
  currentSubmode,
  onSelectMode,
  disabled = false,
}) => {
  const modes = [
    {
      id: "normal",
      submode: "normal",
      title: "Normal Baseline",
      desc: "Healthy envelope (ISO Zone A/B)",
      icon: ShieldCheck,
      color: "emerald",
      badgeText: "ISO ZONE A/B",
      activeBg: "border-emerald-500 bg-emerald-950/30 text-emerald-400 ring-1 ring-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]",
    },
    {
      id: "bearing_wear",
      submode: "bearing_wear",
      title: "Bearing Wear",
      desc: "Vib > 4.5 mm/s, slow temp climb",
      icon: Disc,
      color: "amber",
      badgeText: "TWF FAULT",
      activeBg: "border-amber-500 bg-amber-950/30 text-amber-400 ring-1 ring-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
    },
    {
      id: "overheating",
      submode: "overheating",
      title: "Stator Overheating",
      desc: "Temp > 75.0°C thermal runaway",
      icon: Flame,
      color: "rose",
      badgeText: "HDF RUNAWAY",
      activeBg: "border-rose-500 bg-rose-950/30 text-rose-400 ring-1 ring-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]",
    },
    {
      id: "pressure_drop",
      submode: "pressure_drop",
      title: "Pressure Drop",
      desc: "Discharge < 3.0 bar (Cavitation / Leak)",
      icon: Gauge,
      color: "purple",
      badgeText: "PWF LOSS",
      activeBg: "border-purple-500 bg-purple-950/30 text-purple-400 ring-1 ring-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.25)]",
    },
    {
      id: "sensor_failure",
      submode: "disconnect",
      title: "RTD Disconnect",
      desc: "Sensor out-of-range flag (-999°C)",
      icon: Unplug,
      color: "cyan",
      badgeText: "OPEN CIRCUIT",
      activeBg: "border-cyan-500 bg-cyan-950/30 text-cyan-400 ring-1 ring-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]",
    },
    {
      id: "sensor_failure",
      submode: "flatline",
      title: "ADC Flatline",
      desc: "Sensor freeze / zero-variance",
      icon: AlertTriangle,
      color: "slate",
      badgeText: "ZERO VARIANCE",
      activeBg: "border-slate-400 bg-slate-900/50 text-slate-200 ring-1 ring-slate-400/60 shadow-[0_0_15px_rgba(148,163,184,0.2)]",
    },
  ]

  const isSelected = (modeId: string, submodeId: string) => {
    if (modeId === "sensor_failure") {
      return currentMode === "sensor_failure" && currentSubmode === submodeId
    }
    return currentMode === modeId
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold tracking-wide uppercase font-mono flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-scada-cyan animate-pulse"></span>
              Fault Mode Simulator
            </CardTitle>
            <CardDescription className="text-xs">
              Inject physical degradation or sensor anomalies into the telemetry pipeline
            </CardDescription>
          </div>
          <Badge
            variant={currentMode === "normal" ? "success" : "critical"}
            className="text-[10px] uppercase font-mono px-2 py-0.5"
          >
            {currentMode === "normal" ? "BASELINE HEALTHY" : `ACTIVE: ${currentMode.replace("_", " ")}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {modes.map((item) => {
            const active = isSelected(item.id, item.submode)
            const Icon = item.icon
            return (
              <button
                key={`${item.id}-${item.submode}`}
                type="button"
                disabled={disabled}
                onClick={() => onSelectMode(item.id, item.submode)}
                className={`group relative flex flex-col p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                  active
                    ? item.activeBg
                    : "border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border text-foreground"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${active ? "animate-pulse" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <span className="text-xs font-semibold font-mono tracking-tight">{item.title}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono tracking-tighter opacity-80">
                    {item.badgeText}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {item.desc}
                </p>
                {active && (
                  <span className="absolute bottom-1 right-2 text-[9px] font-mono text-primary font-bold">
                    INJECTED ●
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
