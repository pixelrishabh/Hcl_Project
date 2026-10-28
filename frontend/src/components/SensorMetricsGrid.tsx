import React from "react"
import { Thermometer, Gauge, Activity, ArrowUpRight, ArrowDownRight, Minus, AlertOctagon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SensorReading } from "../types"

interface SensorMetricsGridProps {
  reading: SensorReading | null
  previousReading: SensorReading | null
}

export const SensorMetricsGrid: React.FC<SensorMetricsGridProps> = ({
  reading,
  previousReading,
}) => {
  const temp = reading ? reading.temperature : 54.0
  const vib = reading ? reading.vibration : 1.45
  const press = reading ? reading.pressure : 4.52

  const prevTemp = previousReading ? previousReading.temperature : temp
  const prevVib = previousReading ? previousReading.vibration : vib
  const prevPress = previousReading ? previousReading.pressure : press

  const tempDiff = temp - prevTemp
  const vibDiff = vib - prevVib
  const pressDiff = press - prevPress

  // Temperature Status
  const isTempSentinel = temp < -900
  const isTempCritical = temp >= 75.0
  const isTempWarning = temp >= 65.0 && temp < 75.0
  const tempProgress = isTempSentinel ? 100 : Math.min(100, Math.max(0, ((temp - 30) / (85 - 30)) * 100))

  // Vibration ISO 10816 Zone
  let vibZone = "Zone A: Excellent"
  let vibVariant: "success" | "warning" | "critical" = "success"
  if (vib > 7.1) {
    vibZone = "Zone D: Critical"
    vibVariant = "critical"
  } else if (vib > 4.5) {
    vibZone = "Zone C: Restricted"
    vibVariant = "warning"
  } else if (vib > 2.3) {
    vibZone = "Zone B: Acceptable"
    vibVariant = "success"
  }
  const vibProgress = Math.min(100, Math.max(0, (vib / 8.0) * 100))

  // Pressure Status
  const isPressLow = press < 3.0
  const isPressWarning = press >= 3.0 && press < 3.8
  const pressProgress = Math.min(100, Math.max(0, (press / 6.0) * 100))

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. TEMPERATURE CARD */}
      <Card
        className={`relative overflow-hidden transition-all duration-300 border ${
          isTempCritical || isTempSentinel
            ? "border-rose-500/80 bg-rose-950/20 scada-glow-rose ring-1 ring-rose-500/50"
            : isTempWarning
            ? "border-amber-500/80 bg-amber-950/20 scada-glow-amber"
            : "border-border bg-card/70"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-amber-500" />
              Stator Temperature
            </span>
            {isTempSentinel ? (
              <Badge variant="critical">DISCONNECTED</Badge>
            ) : isTempCritical ? (
              <Badge variant="critical">CRITICAL &gt;75°C</Badge>
            ) : isTempWarning ? (
              <Badge variant="warning">ELEVATED</Badge>
            ) : (
              <Badge variant="success">NOMINAL</Badge>
            )}
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {isTempSentinel ? "OPEN" : temp.toFixed(1)}
              </span>
              <span className="text-sm font-mono text-muted-foreground">°C</span>
            </div>

            <div className="flex items-center text-xs font-mono">
              {Math.abs(tempDiff) < 0.05 ? (
                <span className="text-muted-foreground flex items-center gap-0.5">
                  <Minus className="h-3 w-3" /> 0.0
                </span>
              ) : tempDiff > 0 ? (
                <span className="text-rose-400 flex items-center gap-0.5 font-semibold">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +{tempDiff.toFixed(1)}
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-0.5 font-semibold">
                  <ArrowDownRight className="h-3.5 w-3.5" /> {tempDiff.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>Limit: 75.0°C</span>
              <span>{isTempSentinel ? "RTD -999" : `${tempProgress.toFixed(0)}% Capacity`}</span>
            </div>
            <Progress
              value={tempProgress}
              className="h-1.5 bg-muted/60"
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

      {/* 2. VIBRATION RMS CARD */}
      <Card
        className={`relative overflow-hidden transition-all duration-300 border ${
          vibVariant === "critical"
            ? "border-rose-500/80 bg-rose-950/20 scada-glow-rose ring-1 ring-rose-500/50"
            : vibVariant === "warning"
            ? "border-amber-500/80 bg-amber-950/20 scada-glow-amber"
            : "border-border bg-card/70"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-scada-cyan" />
              Vibration RMS (ISO 10816)
            </span>
            <Badge variant={vibVariant} className="text-[10px]">
              {vibZone.split(":")[0]}
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
              {Math.abs(vibDiff) < 0.02 ? (
                <span className="text-muted-foreground flex items-center gap-0.5">
                  <Minus className="h-3 w-3" /> 0.00
                </span>
              ) : vibDiff > 0 ? (
                <span className="text-rose-400 flex items-center gap-0.5 font-semibold">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +{vibDiff.toFixed(2)}
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-0.5 font-semibold">
                  <ArrowDownRight className="h-3.5 w-3.5" /> {vibDiff.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>{vibZone}</span>
              <span>Trip: 7.1 mm/s</span>
            </div>
            <Progress
              value={vibProgress}
              className="h-1.5 bg-muted/60"
              indicatorClassName={
                vibVariant === "critical"
                  ? "bg-rose-500"
                  : vibVariant === "warning"
                  ? "bg-amber-500"
                  : "bg-scada-cyan"
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. DISCHARGE PRESSURE CARD */}
      <Card
        className={`relative overflow-hidden transition-all duration-300 border ${
          isPressLow
            ? "border-rose-500/80 bg-rose-950/20 scada-glow-rose ring-1 ring-rose-500/50"
            : isPressWarning
            ? "border-amber-500/80 bg-amber-950/20 scada-glow-amber"
            : "border-border bg-card/70"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-purple-400" />
              Discharge Pressure
            </span>
            {isPressLow ? (
              <Badge variant="critical">PRESSURE DROP</Badge>
            ) : isPressWarning ? (
              <Badge variant="warning">BELOW SPEC</Badge>
            ) : (
              <Badge variant="success">STABLE</Badge>
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
              {Math.abs(pressDiff) < 0.02 ? (
                <span className="text-muted-foreground flex items-center gap-0.5">
                  <Minus className="h-3 w-3" /> 0.00
                </span>
              ) : pressDiff > 0 ? (
                <span className="text-emerald-400 flex items-center gap-0.5 font-semibold">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +{pressDiff.toFixed(2)}
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-0.5 font-semibold">
                  <ArrowDownRight className="h-3.5 w-3.5" /> {pressDiff.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>Nominal: 4.50 bar</span>
              <span>Low Limit: 3.00 bar</span>
            </div>
            <Progress
              value={pressProgress}
              className="h-1.5 bg-muted/60"
              indicatorClassName={
                isPressLow
                  ? "bg-rose-500"
                  : isPressWarning
                  ? "bg-amber-500"
                  : "bg-purple-500"
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
