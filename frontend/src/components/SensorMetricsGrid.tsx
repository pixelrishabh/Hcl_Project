import React from "react"
import {
  Thermometer,
  Gauge,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Unplug,
  HeartPulse,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SensorReading } from "../types"

interface SensorMetricsGridProps {
  reading: SensorReading | null
  previousReading: SensorReading | null
  history?: SensorReading[]
  mode?: string
}

export const SensorMetricsGrid: React.FC<SensorMetricsGridProps> = ({
  reading,
  previousReading,
  history = [],
  mode = "normal",
}) => {
  const temp = reading ? reading.temperature : 54.0
  const vib = reading ? reading.vibration : 1.45
  const press = reading ? reading.pressure : 4.52

  // Baselines & targets according to API 610 and ISO 10816-3
  const TARGET_TEMP = 54.0
  const TARGET_VIB = 1.40
  const TARGET_PRESS = 4.80

  // Rolling 60s statistical calculations
  const validHistory = history.filter((r) => r.temperature > -900)
  const tempValues = validHistory.map((r) => r.temperature)
  const vibValues = history.map((r) => r.vibration)
  const pressValues = history.map((r) => r.pressure)

  const minTemp = tempValues.length ? Math.min(...tempValues) : temp
  const maxTemp = tempValues.length ? Math.max(...tempValues) : temp
  const minVib = vibValues.length ? Math.min(...vibValues) : vib
  const maxVib = vibValues.length ? Math.max(...vibValues) : vib
  const minPress = pressValues.length ? Math.min(...pressValues) : press
  const maxPress = pressValues.length ? Math.max(...pressValues) : press

  // Temperature Status
  const isTempSentinel = temp < -900
  const isTempCritical = temp >= 75.0
  const isTempWarning = temp >= 65.0 && temp < 75.0
  const tempDeltaTarget = isTempSentinel ? 0 : temp - TARGET_TEMP
  const tempProgress = isTempSentinel
    ? 100
    : Math.min(100, Math.max(0, ((temp - 30) / (85 - 30)) * 100))

  // Vibration ISO 10816 Zone
  let vibZoneName = "Zone A"
  let vibZoneDesc = "Newly Commissioned"
  let vibStatus: "nominal" | "warning" | "critical" = "nominal"
  if (vib > 7.1) {
    vibZoneName = "Zone D (Trip)"
    vibZoneDesc = "Severe Damage / Trip"
    vibStatus = "critical"
  } else if (vib > 4.5) {
    vibZoneName = "Zone C (Alert)"
    vibZoneDesc = "Unrestricted Long-Term Danger"
    vibStatus = "warning"
  } else if (vib > 2.8) {
    vibZoneName = "Zone B (Acceptable)"
    vibZoneDesc = "Unrestricted Long-Term Operation"
    vibStatus = "nominal"
  }
  const vibDeltaTarget = vib - TARGET_VIB
  const vibProgress = Math.min(100, Math.max(0, (vib / 8.0) * 100))

  // Pressure Status
  const isPressLow = press < 3.0
  const isPressWarning = press >= 3.0 && press < 3.8
  const pressDeltaTarget = press - TARGET_PRESS
  const pressProgress = Math.min(100, Math.max(0, (press / 6.0) * 100))

  // Overall Equipment Health Score Calculation (0 - 100%)
  let healthScore = 98.5
  if (isTempSentinel) {
    healthScore = 15.0
  } else if (isTempCritical || vibStatus === "critical" || isPressLow) {
    healthScore = Math.max(12, Math.min(38, 100 - (vib > 7.1 ? 65 : 45) - (isTempCritical ? 40 : 0) - (isPressLow ? 35 : 0)))
  } else if (isTempWarning || vibStatus === "warning" || isPressWarning) {
    healthScore = Math.max(48, Math.min(74, 100 - (vib > 4.5 ? 30 : 15) - (isTempWarning ? 25 : 10) - (isPressWarning ? 20 : 5)))
  } else {
    // Normal fluctuations
    healthScore = Math.max(88, 99.2 - Math.abs(vibDeltaTarget) * 3 - Math.abs(tempDeltaTarget) * 0.4)
  }

  const isHealthCritical = healthScore < 45
  const isHealthWarning = healthScore >= 45 && healthScore < 80

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. SYNTHESIZED KPI: EQUIPMENT HEALTH INDEX */}
      <Card
        className={`relative overflow-hidden transition-all duration-300 border ${
          isHealthCritical
            ? "border-rose-500/70 bg-rose-500/10 scada-panel-glow-rose ring-1 ring-rose-500/40"
            : isHealthWarning
            ? "border-amber-500/70 bg-amber-500/10 scada-panel-glow-amber ring-1 ring-amber-500/40"
            : "border-border/80 bg-card/80"
        }`}
      >
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-primary" />
              Equipment Health Index
            </span>
            <Badge
              variant={isHealthCritical ? "critical" : isHealthWarning ? "warning" : "success"}
              className="text-[10px]"
            >
              {isHealthCritical ? "TRIP IMMINENT" : isHealthWarning ? "ATTENTION REQ" : "API 610 OPTIMAL"}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {healthScore.toFixed(1)}
              </span>
              <span className="text-sm font-mono text-muted-foreground">%</span>
            </div>

            <div className="text-right text-[11px] font-mono text-muted-foreground">
              <span>Risk: </span>
              <strong className={isHealthCritical ? "text-rose-500" : isHealthWarning ? "text-amber-500" : "text-emerald-500"}>
                {isHealthCritical ? "HIGH" : isHealthWarning ? "MODERATE" : "LOW"}
              </strong>
            </div>
          </div>

          <div className="space-y-1.5 mt-3">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>Availability Metric</span>
              <span>Target &gt;95%</span>
            </div>
            <Progress
              value={healthScore}
              className="h-1.5 bg-muted"
              indicatorClassName={
                isHealthCritical
                  ? "bg-rose-500"
                  : isHealthWarning
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. STATOR TEMPERATURE KPI */}
      <Card
        className={`relative overflow-hidden transition-all duration-300 border ${
          isTempCritical || isTempSentinel
            ? "border-rose-500/70 bg-rose-500/10 scada-panel-glow-rose ring-1 ring-rose-500/40"
            : isTempWarning
            ? "border-amber-500/70 bg-amber-500/10 scada-panel-glow-amber ring-1 ring-amber-500/40"
            : "border-border/80 bg-card/80"
        }`}
      >
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-amber-500" />
              Stator Core Temp
            </span>
            {isTempSentinel ? (
              <Badge variant="critical" className="gap-1">
                <Unplug className="h-3 w-3" /> OPEN CIRCUIT
              </Badge>
            ) : isTempCritical ? (
              <Badge variant="critical" className="gap-1">
                <AlertOctagon className="h-3 w-3" /> CRITICAL &gt;75°C
              </Badge>
            ) : isTempWarning ? (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> ELEVATED
              </Badge>
            ) : (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> NOMINAL
              </Badge>
            )}
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {isTempSentinel ? "ERR" : temp.toFixed(1)}
              </span>
              <span className="text-sm font-mono text-muted-foreground">°C</span>
            </div>

            <div className="flex items-center text-xs font-mono">
              {!isTempSentinel && (
                <span
                  className={`flex items-center gap-0.5 font-semibold ${
                    tempDeltaTarget > 10
                      ? "text-rose-500"
                      : tempDeltaTarget > 5
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  }`}
                  title={`Deviation from ${TARGET_TEMP}°C baseline`}
                >
                  {tempDeltaTarget >= 0 ? `+${tempDeltaTarget.toFixed(1)}°` : `${tempDeltaTarget.toFixed(1)}°`}
                  <span className="text-[10px] text-muted-foreground font-normal ml-0.5">base</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 mt-3">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>60s: {minTemp.toFixed(1)}° &ndash; {maxTemp.toFixed(1)}°C</span>
              <span>Trip: 75.0°C</span>
            </div>
            <Progress
              value={tempProgress}
              className="h-1.5 bg-muted"
              indicatorClassName={
                isTempCritical || isTempSentinel
                  ? "bg-rose-500"
                  : isTempWarning
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. VIBRATION RMS (ISO 10816-3) */}
      <Card
        className={`relative overflow-hidden transition-all duration-300 border ${
          vibStatus === "critical"
            ? "border-rose-500/70 bg-rose-500/10 scada-panel-glow-rose ring-1 ring-rose-500/40"
            : vibStatus === "warning"
            ? "border-amber-500/70 bg-amber-500/10 scada-panel-glow-amber ring-1 ring-amber-500/40"
            : "border-border/80 bg-card/80"
        }`}
      >
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-sky-500" />
              Vibration RMS (ISO)
            </span>
            <Badge
              variant={vibStatus === "critical" ? "critical" : vibStatus === "warning" ? "warning" : "success"}
              className="text-[10px]"
            >
              {vibZoneName}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {vib.toFixed(2)}
              </span>
              <span className="text-sm font-mono text-muted-foreground">mm/s</span>
            </div>

            <div className="flex items-center text-xs font-mono">
              <span
                className={`flex items-center gap-0.5 font-semibold ${
                  vib > 4.5
                    ? "text-rose-500"
                    : vib > 2.8
                    ? "text-amber-500"
                    : "text-muted-foreground"
                }`}
                title={`Target baseline is ${TARGET_VIB.toFixed(2)} mm/s`}
              >
                {vibDeltaTarget >= 0 ? `+${vibDeltaTarget.toFixed(2)}` : vibDeltaTarget.toFixed(2)}
                <span className="text-[10px] text-muted-foreground font-normal ml-0.5">base</span>
              </span>
            </div>
          </div>

          <div className="space-y-1.5 mt-3">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>60s: {minVib.toFixed(2)} &ndash; {maxVib.toFixed(2)} mm/s</span>
              <span>Trip: 7.10 mm/s</span>
            </div>
            <Progress
              value={vibProgress}
              className="h-1.5 bg-muted"
              indicatorClassName={
                vibStatus === "critical"
                  ? "bg-rose-500"
                  : vibStatus === "warning"
                  ? "bg-amber-500"
                  : "bg-sky-500"
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. DISCHARGE HYDRAULIC PRESSURE */}
      <Card
        className={`relative overflow-hidden transition-all duration-300 border ${
          isPressLow
            ? "border-rose-500/70 bg-rose-500/10 scada-panel-glow-rose ring-1 ring-rose-500/40"
            : isPressWarning
            ? "border-amber-500/70 bg-amber-500/10 scada-panel-glow-amber ring-1 ring-amber-500/40"
            : "border-border/80 bg-card/80"
        }`}
      >
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-blue-500" />
              Discharge Pressure
            </span>
            {isPressLow ? (
              <Badge variant="critical">CAVITATION &lt;3.0 bar</Badge>
            ) : isPressWarning ? (
              <Badge variant="warning">BELOW SPEC</Badge>
            ) : (
              <Badge variant="success">STEADY STATE</Badge>
            )}
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {press.toFixed(2)}
              </span>
              <span className="text-sm font-mono text-muted-foreground">bar</span>
            </div>

            <div className="flex items-center text-xs font-mono">
              <span
                className={`flex items-center gap-0.5 font-semibold ${
                  isPressLow
                    ? "text-rose-500"
                    : isPressWarning
                    ? "text-amber-500"
                    : "text-muted-foreground"
                }`}
                title={`Target baseline is ${TARGET_PRESS.toFixed(2)} bar`}
              >
                {pressDeltaTarget >= 0 ? `+${pressDeltaTarget.toFixed(2)}` : pressDeltaTarget.toFixed(2)}
                <span className="text-[10px] text-muted-foreground font-normal ml-0.5">base</span>
              </span>
            </div>
          </div>

          <div className="space-y-1.5 mt-3">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>60s: {minPress.toFixed(2)} &ndash; {maxPress.toFixed(2)} bar</span>
              <span>Low Trip: 3.00 bar</span>
            </div>
            <Progress
              value={pressProgress}
              className="h-1.5 bg-muted"
              indicatorClassName={
                isPressLow
                  ? "bg-rose-500"
                  : isPressWarning
                  ? "bg-amber-500"
                  : "bg-blue-500"
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
