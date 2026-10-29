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
      desc: "Healthy parameter envelope (ISO 20816-3 Zone A/B)",
      icon: ShieldCheck,
      badgeText: "ZONE A/B (NORMAL)",
      activeClass: "border-border bg-raised text-text ring-1 ring-border",
      badgeVariant: "nominal" as const,
    },
    {
      id: "bearing_wear",
      submode: "bearing_wear",
      title: "Bearing Wear",
      desc: "Vib 4.5-7.1 mm/s, slow frictional heat climb",
      icon: Disc,
      badgeText: "ZONE C ALERT (WARNING)",
      activeClass: "border-warn bg-warn/15 text-warn ring-1 ring-warn",
      badgeVariant: "warning" as const,
    },
    {
      id: "overheating",
      submode: "overheating",
      title: "Stator Overheating",
      desc: "Temp > 75.0°C rapid thermal runaway",
      icon: Flame,
      badgeText: "THERMAL TRIP (CRITICAL)",
      activeClass: "border-crit bg-crit/15 text-crit ring-1 ring-crit",
      badgeVariant: "critical" as const,
    },
    {
      id: "pressure_drop",
      submode: "pressure_drop",
      title: "Pressure Drop",
      desc: "Discharge < 3.0 bar (Hydraulic Cavitation / Pipe Rupture)",
      icon: Gauge,
      badgeText: "CAVITATION TRIP (CRITICAL)",
      activeClass: "border-crit bg-crit/15 text-crit ring-1 ring-crit",
      badgeVariant: "critical" as const,
    },
    {
      id: "sensor_failure",
      submode: "disconnect",
      title: "RTD Disconnect",
      desc: "Resistance open-circuit sentinel (-999°C)",
      icon: Unplug,
      badgeText: "SENSOR FAULT (OPEN CIRCUIT)",
      activeClass: "border-sensor-fault bg-sensor-fault/15 text-sensor-fault ring-1 ring-sensor-fault",
      badgeVariant: "sensorFault" as const,
    },
    {
      id: "sensor_failure",
      submode: "flatline",
      title: "ADC Flatline",
      desc: "Sensor freeze / zero-variance analog freeze",
      icon: AlertTriangle,
      badgeText: "SENSOR FAULT (FLATLINE)",
      activeClass: "border-sensor-fault bg-sensor-fault/15 text-sensor-fault ring-1 ring-sensor-fault",
      badgeVariant: "sensorFault" as const,
    },
  ]

  const isSelected = (modeId: string, submodeId: string) => {
    if (modeId === "sensor_failure") {
      return currentMode === "sensor_failure" && currentSubmode === submodeId
    }
    return currentMode === modeId
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader className="pb-2.5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold tracking-wide uppercase font-mono flex items-center gap-2 text-text">
              <span className="h-2 w-2 rounded-[2px] bg-accent"></span>
              Fault Injection Controller
            </CardTitle>
            <CardDescription className="text-xs text-muted font-mono">
              Inject controlled mechanical degradation, hydraulic failure, or instrument faults into the SCADA pipeline
            </CardDescription>
          </div>
          <Badge
            variant={currentMode === "normal" ? "nominal" : "warning"}
            className="text-[10px] uppercase font-mono px-2 py-0.5"
          >
            {currentMode === "normal"
              ? "OPERATING STATE: NOMINAL"
              : `ACTIVE INJECTION: ${currentMode.toUpperCase().replace("_", " ")}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {modes.map((item) => {
            const active = isSelected(item.id, item.submode)
            const Icon = item.icon
            return (
              <button
                key={`${item.id}-${item.submode}`}
                type="button"
                disabled={disabled}
                onClick={() => onSelectMode(item.id, item.submode)}
                className={`flex flex-col p-2.5 rounded-[4px] border text-left transition-colors cursor-pointer ${
                  active
                    ? item.activeClass
                    : "border-border bg-raised hover:bg-surface text-text"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold font-mono tracking-tight">{item.title}</span>
                  </div>
                  <Badge
                    variant={item.badgeVariant}
                    className="text-[9px] py-0 px-1 font-mono tracking-tighter"
                  >
                    {item.badgeText}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                  {item.desc}
                </p>
                {active && (
                  <span className="text-[9px] font-mono font-bold mt-1 text-right">
                    ACTIVE INJECTION [ON]
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
