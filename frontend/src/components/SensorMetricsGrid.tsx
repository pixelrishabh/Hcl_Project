import React, { useMemo, useState, useEffect, useRef } from "react"
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
  Info,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SensorReading, SensorQuality, HealthBreakdown } from "../types"

interface SensorMetricsGridProps {
  reading: SensorReading | null
  previousReading: SensorReading | null
  history?: SensorReading[]
  mode?: string
  healthIndexOverride?: HealthBreakdown
}

export const SensorMetricsGrid: React.FC<SensorMetricsGridProps> = ({
  reading,
  previousReading,
  history = [],
  mode = "normal",
  healthIndexOverride,
}) => {
  const [secondsAgo, setSecondsAgo] = useState<number>(0)
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const lastReadingRef = useRef<SensorReading | null>(reading)

  // Track time in current zone
  const zoneTrackerRef = useRef<{
    vibZone: string
    vibSeconds: number
    tempZone: string
    tempSeconds: number
    pressZone: string
    pressSeconds: number
  }>({
    vibZone: "A/B",
    vibSeconds: 0,
    tempZone: "NOMINAL",
    tempSeconds: 0,
    pressZone: "NOMINAL",
    pressSeconds: 0,
  })

  useEffect(() => {
    if (reading && reading !== lastReadingRef.current) {
      lastReadingRef.current = reading
      lastUpdateTimeRef.current = Date.now()
      setSecondsAgo(0)
    }
  }, [reading])

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastUpdateTimeRef.current) / 1000)
      setSecondsAgo(elapsed)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const temp = reading ? reading.temperature : 54.0
  const vib = reading ? reading.vibration : 1.45
  const press = reading ? reading.pressure : 4.52

  const prevTemp = previousReading ? previousReading.temperature : temp
  const prevVib = previousReading ? previousReading.vibration : vib
  const prevPress = previousReading ? previousReading.pressure : press

  // Rate of change calculations (Δ per sample / min)
  const tempRate = temp < -900 || prevTemp < -900 ? 0 : (temp - prevTemp) * 60
  const vibRate = (vib - prevVib) * 60
  const pressRate = (press - prevPress) * 60

  // Baselines & targets according to API 610 and ISO 20816-3
  const TARGET_TEMP = 54.0
  const TARGET_VIB = 1.40
  const TARGET_PRESS = 4.80

  // Rolling stats from history
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

  // Check variance in recent history for ADC flatline detection
  const recentHistory = history.slice(-6)
  const tempVariance = recentHistory.length >= 5
    ? Math.max(...recentHistory.map((r) => r.temperature)) - Math.min(...recentHistory.map((r) => r.temperature))
    : 1.0

  // 1. Temperature Status
  const isTempSentinel = temp < -900
  const isTempCritical = temp >= 75.0
  const isTempWarning = temp >= 65.0 && temp < 75.0
  const tempDeltaTarget = isTempSentinel ? 0 : temp - TARGET_TEMP
  const tempProgress = isTempSentinel
    ? 100
    : Math.min(100, Math.max(0, ((temp - 30) / (85 - 30)) * 100))

  const currentTempZone = isTempSentinel
    ? "SENSOR_FAULT"
    : isTempCritical
    ? "CRITICAL"
    : isTempWarning
    ? "WARNING"
    : "NOMINAL"

  let tempQuality: SensorQuality = "GOOD"
  if (isTempSentinel) {
    tempQuality = "BAD"
  } else if (mode === "sensor_failure" && tempVariance < 0.001) {
    tempQuality = "STALE"
  } else if (secondsAgo > 5) {
    tempQuality = "STALE"
  }

  // 2. Vibration ISO 20816-3 Zone
  let vibZoneName = "Zone A/B"
  let vibZoneDesc = "Acceptable Operation"
  let vibStatus: "nominal" | "warning" | "critical" = "nominal"
  let currentVibZone = "A/B"
  if (vib > 7.1) {
    vibZoneName = "Zone D"
    vibZoneDesc = "Severe Damage / Trip"
    vibStatus = "critical"
    currentVibZone = "D"
  } else if (vib > 4.5) {
    vibZoneName = "Zone C"
    vibZoneDesc = "Restricted Operation / Alert"
    vibStatus = "warning"
    currentVibZone = "C"
  } else if (vib > 2.8) {
    vibZoneName = "Zone B"
    vibZoneDesc = "Unrestricted Long-Term Operation"
    vibStatus = "nominal"
    currentVibZone = "B"
  }
  const vibDeltaTarget = vib - TARGET_VIB
  const vibProgress = Math.min(100, Math.max(0, (vib / 8.0) * 100))
  const vibQuality: SensorQuality = secondsAgo > 5 ? "STALE" : "GOOD"

  // 3. Pressure Status
  const isPressLow = press < 3.0
  const isPressWarning = press >= 3.0 && press < 3.8
  const pressDeltaTarget = press - TARGET_PRESS
  const pressProgress = Math.min(100, Math.max(0, (press / 6.0) * 100))
  const currentPressZone = isPressLow ? "CRITICAL" : isPressWarning ? "WARNING" : "NOMINAL"
  const pressQuality: SensorQuality = secondsAgo > 5 ? "STALE" : "GOOD"

  // Update time in zone
  useEffect(() => {
    const tracker = zoneTrackerRef.current
    if (tracker.tempZone === currentTempZone) {
      tracker.tempSeconds += 1
    } else {
      tracker.tempZone = currentTempZone
      tracker.tempSeconds = 1
    }

    if (tracker.vibZone === currentVibZone) {
      tracker.vibSeconds += 1
    } else {
      tracker.vibZone = currentVibZone
      tracker.vibSeconds = 1
    }

    if (tracker.pressZone === currentPressZone) {
      tracker.pressSeconds += 1
    } else {
      tracker.pressZone = currentPressZone
      tracker.pressSeconds = 1
    }
  }, [reading, currentTempZone, currentVibZone, currentPressZone])

  // 4. Equipment Health Index Breakdown
  const healthData: HealthBreakdown = useMemo(() => {
    if (healthIndexOverride) return healthIndexOverride

    const deductions: Record<string, number> = {}

    if (isTempSentinel) {
      deductions["Sensor RTD Disconnect"] = -85
      return {
        score: 15.0,
        status: "SENSOR_FAULT",
        deductions,
      }
    }

    if (vib > 7.1) {
      deductions["Vibration (Zone D Trip)"] = -65
    } else if (vib > 4.5) {
      const penalty = Math.round(15 + ((vib - 4.5) / 2.6) * 15)
      deductions[`Vibration (Zone C Alert)`] = -penalty
    } else if (vib > 2.8) {
      const penalty = Math.round(((vib - 2.8) / 1.7) * 8)
      if (penalty > 0) deductions["Vibration (Elevated)"] = -penalty
    }

    if (isTempCritical) {
      deductions["Temperature (Overheat Trip)"] = -40
    } else if (isTempWarning) {
      const penalty = Math.round(10 + ((temp - 65) / 10) * 15)
      deductions["Temperature (Elevated Warning)"] = -penalty
    }

    if (isPressLow) {
      deductions["Pressure (Cavitation / Leak)"] = -35
    } else if (isPressWarning) {
      const penalty = Math.round(5 + ((3.8 - press) / 0.8) * 15)
      deductions["Pressure (Sub-nominal Flow)"] = -penalty
    }

    const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0)
    const score = Math.max(5.0, Math.min(100.0, Math.round((100.0 + totalDeductions) * 10) / 10))
    const status = score < 45 ? "TRIP" : score < 80 ? "WARNING" : "NOMINAL"

    return {
      score,
      status,
      deductions,
    }
  }, [healthIndexOverride, isTempSentinel, vib, isTempCritical, isTempWarning, temp, isPressLow, isPressWarning, press])

  const renderRateIcon = (rate: number, unit: string) => {
    const absRate = Math.abs(rate)
    if (absRate < 0.05) {
      return (
        <span className="flex items-center text-muted text-[11px] font-mono gap-0.5">
          <Minus className="h-3 w-3" />
          <span className="tabular-nums">0.0 {unit}/m</span>
        </span>
      )
    }
    if (rate > 0) {
      return (
        <span className="flex items-center text-text text-[11px] font-mono gap-0.5">
          <ArrowUpRight className="h-3 w-3 text-muted" />
          <span className="tabular-nums">+{rate.toFixed(1)} {unit}/m</span>
        </span>
      )
    }
    return (
      <span className="flex items-center text-text text-[11px] font-mono gap-0.5">
        <ArrowDownRight className="h-3 w-3 text-muted" />
        <span className="tabular-nums">{rate.toFixed(1)} {unit}/m</span>
      </span>
    )
  }

  const renderQualityBadge = (quality: SensorQuality) => {
    if (quality === "BAD") {
      return (
        <Badge variant="sensorFault" className="text-[10px] px-1 py-0">
          BAD QUALITY
        </Badge>
      )
    }
    if (quality === "STALE") {
      return (
        <Badge variant="warning" className="text-[10px] px-1 py-0">
          STALE
        </Badge>
      )
    }
    return (
      <Badge variant="nominal" className="text-[10px] px-1 py-0 text-muted">
        GOOD
      </Badge>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. SYNTHESIZED KPI: EQUIPMENT HEALTH INDEX */}
      <Card
        className={`relative transition-colors border ${
          healthData.status === "TRIP"
            ? "border-crit/70 bg-crit/10"
            : healthData.status === "WARNING"
            ? "border-warn/70 bg-warn/10"
            : healthData.status === "SENSOR_FAULT"
            ? "border-sensor-fault/70 bg-sensor-fault/10"
            : "border-border bg-surface"
        }`}
      >
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-muted" />
              Equipment Health Index
            </span>
            <Badge
              variant={
                healthData.status === "TRIP"
                  ? "critical"
                  : healthData.status === "WARNING"
                  ? "warning"
                  : healthData.status === "SENSOR_FAULT"
                  ? "sensorFault"
                  : "nominal"
              }
              className="text-[10px] uppercase font-semibold"
            >
              {healthData.status === "TRIP"
                ? "TRIP"
                : healthData.status === "WARNING"
                ? "WARNING"
                : healthData.status === "SENSOR_FAULT"
                ? "SENSOR FAULT"
                : "NOMINAL"}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-text tabular-nums">
                {healthData.score.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-muted">%</span>
            </div>

            <div className="text-right text-[11px] font-mono text-muted">
              <span>Risk: </span>
              <strong className={
                healthData.status === "TRIP"
                  ? "text-crit"
                  : healthData.status === "WARNING"
                  ? "text-warn"
                  : "text-text"
              }>
                {healthData.status === "TRIP" ? "HIGH (TRIP)" : healthData.status === "WARNING" ? "ELEVATED" : "LOW (NORMAL)"}
              </strong>
            </div>
          </div>

          <Progress
            value={healthData.score}
            className="h-1.5 bg-raised my-2"
            indicatorClassName={
              healthData.status === "TRIP"
                ? "bg-crit"
                : healthData.status === "WARNING"
                ? "bg-warn"
                : healthData.status === "SENSOR_FAULT"
                ? "bg-sensor-fault"
                : "bg-muted"
            }
          />

          {/* Inline breakdown of deductions */}
          <div className="mt-2.5 pt-2 border-t border-border/60 text-[10px] font-mono space-y-1">
            <div className="flex items-center justify-between text-muted">
              <span>Health Breakdown:</span>
              <span className="tabular-nums">Updated {secondsAgo}s ago</span>
            </div>
            {Object.keys(healthData.deductions).length > 0 ? (
              <div className="space-y-0.5">
                {Object.entries(healthData.deductions).map(([reason, penalty]) => (
                  <div key={reason} className="flex items-center justify-between">
                    <span className="text-muted truncate max-w-[170px]">{reason}</span>
                    <span className="text-crit font-bold tabular-nums">{penalty}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-[10px] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-muted shrink-0" />
                <span>All parameters nominal (0 deductions)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. STATOR TEMPERATURE KPI */}
      <Card
        className={`relative transition-colors border ${
          isTempCritical
            ? "border-crit/70 bg-crit/10"
            : isTempWarning
            ? "border-warn/70 bg-warn/10"
            : isTempSentinel
            ? "border-sensor-fault/70 bg-sensor-fault/10"
            : "border-border bg-surface"
        }`}
      >
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-series-temp" />
              Stator Core Temp
            </span>
            <div className="flex items-center gap-1.5">
              {renderQualityBadge(tempQuality)}
              {isTempSentinel ? (
                <Badge variant="sensorFault" className="gap-1 text-[10px]">
                  <Unplug className="h-3 w-3" /> SENSOR FAULT
                </Badge>
              ) : isTempCritical ? (
                <Badge variant="critical" className="gap-1 text-[10px]">
                  <AlertOctagon className="h-3 w-3" /> TRIP (&ge;75°C)
                </Badge>
              ) : isTempWarning ? (
                <Badge variant="warning" className="gap-1 text-[10px]">
                  <AlertTriangle className="h-3 w-3" /> WARNING
                </Badge>
              ) : (
                <Badge variant="nominal" className="text-[10px]">
                  NOMINAL
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-text tabular-nums">
                {isTempSentinel ? "ERR" : temp.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-muted">°C</span>
            </div>

            <div className="text-right">
              {renderRateIcon(tempRate, "°C")}
            </div>
          </div>

          <Progress
            value={tempProgress}
            className="h-1.5 bg-raised my-2"
            indicatorClassName={
              isTempCritical
                ? "bg-crit"
                : isTempWarning
                ? "bg-warn"
                : isTempSentinel
                ? "bg-sensor-fault"
                : "bg-series-temp"
            }
          />

          <div className="mt-2.5 pt-2 border-t border-border/60 text-[10px] font-mono flex items-center justify-between text-muted">
            <span className="tabular-nums">Zone: {zoneTrackerRef.current.tempSeconds}s</span>
            <span className="tabular-nums">60s: {minTemp.toFixed(1)}&ndash;{maxTemp.toFixed(1)}°C</span>
            <span className="tabular-nums">Updated {secondsAgo}s ago</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. VIBRATION RMS (ISO 20816-3) */}
      <Card
        className={`relative transition-colors border ${
          vibStatus === "critical"
            ? "border-crit/70 bg-crit/10"
            : vibStatus === "warning"
            ? "border-warn/70 bg-warn/10"
            : "border-border bg-surface"
        }`}
      >
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-series-vib" />
              Vibration RMS (ISO)
            </span>
            <div className="flex items-center gap-1.5">
              {renderQualityBadge(vibQuality)}
              <Badge
                variant={
                  vibStatus === "critical"
                    ? "critical"
                    : vibStatus === "warning"
                    ? "warning"
                    : "nominal"
                }
                className="text-[10px]"
              >
                {vibStatus === "critical"
                  ? `${vibZoneName} (TRIP)`
                  : vibStatus === "warning"
                  ? `${vibZoneName} (WARNING)`
                  : `${vibZoneName} (NOMINAL)`}
              </Badge>
            </div>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-text tabular-nums">
                {vib.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-muted">mm/s</span>
            </div>

            <div className="text-right">
              {renderRateIcon(vibRate, "mm/s")}
            </div>
          </div>

          <Progress
            value={vibProgress}
            className="h-1.5 bg-raised my-2"
            indicatorClassName={
              vibStatus === "critical"
                ? "bg-crit"
                : vibStatus === "warning"
                ? "bg-warn"
                : "bg-series-vib"
            }
          />

          <div className="mt-2.5 pt-2 border-t border-border/60 text-[10px] font-mono flex items-center justify-between text-muted">
            <span className="tabular-nums">Zone: {zoneTrackerRef.current.vibSeconds}s</span>
            <span className="tabular-nums">Trip: &gt;7.10</span>
            <span className="tabular-nums">Updated {secondsAgo}s ago</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. DISCHARGE HYDRAULIC PRESSURE */}
      <Card
        className={`relative transition-colors border ${
          isPressLow
            ? "border-crit/70 bg-crit/10"
            : isPressWarning
            ? "border-warn/70 bg-warn/10"
            : "border-border bg-surface"
        }`}
      >
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-series-press" />
              Discharge Pressure
            </span>
            <div className="flex items-center gap-1.5">
              {renderQualityBadge(pressQuality)}
              <Badge
                variant={
                  isPressLow
                    ? "critical"
                    : isPressWarning
                    ? "warning"
                    : "nominal"
                }
                className="text-[10px]"
              >
                {isPressLow
                  ? "TRIP (CAVITATION <3.0)"
                  : isPressWarning
                  ? "WARNING (<3.8)"
                  : "NOMINAL"}
              </Badge>
            </div>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-text tabular-nums">
                {press.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-muted">bar</span>
            </div>

            <div className="text-right">
              {renderRateIcon(pressRate, "bar")}
            </div>
          </div>

          <Progress
            value={pressProgress}
            className="h-1.5 bg-raised my-2"
            indicatorClassName={
              isPressLow
                ? "bg-crit"
                : isPressWarning
                ? "bg-warn"
                : "bg-series-press"
            }
          />

          <div className="mt-2.5 pt-2 border-t border-border/60 text-[10px] font-mono flex items-center justify-between text-muted">
            <span className="tabular-nums">Zone: {zoneTrackerRef.current.pressSeconds}s</span>
            <span className="tabular-nums">Trip: &lt;3.00</span>
            <span className="tabular-nums">Updated {secondsAgo}s ago</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
