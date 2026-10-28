import React, { useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pause, Play, Layers, Thermometer, Activity, Gauge, Info } from "lucide-react"
import { SensorReading } from "../types"

interface TelemetryChartProps {
  history: SensorReading[]
  isPaused: boolean
  onTogglePause: () => void
}

type ChartViewMode = "overview" | "temperature" | "vibration" | "pressure"

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  history,
  isPaused,
  onTogglePause,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>("overview")
  const [viewPoints, setViewPoints] = useState<number>(30)

  // Calibrated, accessible color palette (Okabe-Ito / WCAG AA compliant)
  const COLORS = {
    temp: "#f59e0b", // Warm Amber
    tempLine: "#d97706",
    vib: "#0ea5e9", // Electric Cyan / Sky
    vibLine: "#0284c7",
    press: "#3b82f6", // Steel Blue
    pressLine: "#2563eb",
    danger: "#ef4444", // Crimson Red for trip threshold
    warning: "#f59e0b", // Amber for warning threshold
    grid: "hsl(var(--border))",
  }

  // Slice history for viewing window
  const windowData = history.slice(-viewPoints)

  // Normalized Multi-Channel calculation for the Overview view
  // Normalizes each metric to a 0 - 100% operational scale so all 3 channels share a valid common axis!
  // Temp: 30°C -> 0%, 85°C -> 100%
  // Vib: 0 mm/s -> 0%, 8.0 mm/s -> 100%
  // Press: 1.0 bar -> 0%, 6.0 bar -> 100%
  const chartData = windowData.map((r) => {
    const rawTemp = r.temperature < -900 ? null : r.temperature
    const normTemp = rawTemp !== null ? Math.min(100, Math.max(0, ((rawTemp - 30) / (85 - 30)) * 100)) : null
    const normVib = Math.min(100, Math.max(0, (r.vibration / 8.0) * 100))
    const normPress = Math.min(100, Math.max(0, ((r.pressure - 1.0) / (6.0 - 1.0)) * 100))

    return {
      time: r.timestamp.length > 8 ? r.timestamp.substring(11, 19) : r.timestamp,
      rawTemp,
      rawVib: r.vibration,
      rawPress: r.pressure,
      // Scaled values for overview
      normTemp,
      normVib,
      normPress,
    }
  })

  // Statistical summary for current window
  const validTemps = chartData.map((d) => d.rawTemp).filter((v): v is number => v !== null)
  const validVibs = chartData.map((d) => d.rawVib)
  const validPress = chartData.map((d) => d.rawPress)

  const avgTemp = validTemps.length ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : 0
  const maxTemp = validTemps.length ? Math.max(...validTemps) : 0
  const avgVib = validVibs.length ? validVibs.reduce((a, b) => a + b, 0) / validVibs.length : 0
  const maxVib = validVibs.length ? Math.max(...validVibs) : 0
  const avgPress = validPress.length ? validPress.reduce((a, b) => a + b, 0) / validPress.length : 0
  const minPress = validPress.length ? Math.min(...validPress) : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload
      return (
        <div className="rounded-lg border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur font-mono text-xs space-y-1.5 z-50 min-w-[200px]">
          <div className="flex items-center justify-between border-b pb-1 text-muted-foreground">
            <span className="font-semibold">Time: {label}</span>
            <span className="text-[10px]">1 Hz Synchronized</span>
          </div>

          {(viewMode === "overview" || viewMode === "temperature") && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Stator Temp:
              </span>
              <span className="font-bold text-foreground">
                {dataPoint.rawTemp !== null ? `${dataPoint.rawTemp.toFixed(1)} °C` : "OPEN CIRCUIT"}
              </span>
            </div>
          )}

          {(viewMode === "overview" || viewMode === "vibration") && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-sky-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Vibration RMS:
              </span>
              <span className="font-bold text-foreground">
                {dataPoint.rawVib.toFixed(2)} mm/s
              </span>
            </div>
          )}

          {(viewMode === "overview" || viewMode === "pressure") && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-blue-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Hydraulic Press:
              </span>
              <span className="font-bold text-foreground">
                {dataPoint.rawPress.toFixed(2)} bar
              </span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-border/80 bg-card/80 backdrop-blur">
      <CardHeader className="p-3.5 sm:p-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-sm font-semibold tracking-wide uppercase font-mono flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></span>
              Real-Time SCADA Waveform Telemetry
            </CardTitle>
            <CardDescription className="text-xs">
              Calibrated sensor time-series with ISO 10816 &amp; API 610 threshold boundaries
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Points Selector */}
            <div className="flex items-center rounded-md border bg-muted/40 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewPoints(15)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  viewPoints === 15
                    ? "bg-background shadow-xs font-bold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                15s
              </button>
              <button
                type="button"
                onClick={() => setViewPoints(30)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  viewPoints === 30
                    ? "bg-background shadow-xs font-bold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                30s
              </button>
              <button
                type="button"
                onClick={() => setViewPoints(60)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  viewPoints === 60
                    ? "bg-background shadow-xs font-bold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                60s
              </button>
            </div>

            {/* Pause / Resume Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePause}
              className={`h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer ${
                isPaused ? "border-amber-500 text-amber-500 bg-amber-500/10 font-bold" : ""
              }`}
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </Button>
          </div>
        </div>

        {/* View Mode Tabs (Fixes misleading axis scaling) */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2.5 text-xs font-mono border-t border-border/50 mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode("overview")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs cursor-pointer transition-colors ${
                viewMode === "overview"
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Normalized Tri-Axis</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("temperature")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs cursor-pointer transition-colors ${
                viewMode === "temperature"
                  ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Thermometer className="h-3.5 w-3.5 text-amber-500" />
              <span>Temperature (°C)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("vibration")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs cursor-pointer transition-colors ${
                viewMode === "vibration"
                  ? "border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold shadow-xs"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-sky-500" />
              <span>Vibration (mm/s)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("pressure")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs cursor-pointer transition-colors ${
                viewMode === "pressure"
                  ? "border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Gauge className="h-3.5 w-3.5 text-blue-500" />
              <span>Discharge (bar)</span>
            </button>
          </div>

          {/* Quick Context Summary Tag */}
          <div className="text-[11px] font-mono text-muted-foreground hidden md:flex items-center gap-2">
            {viewMode === "overview" && (
              <span>0&ndash;100% Envelope Scale &middot; Balanced Comparison</span>
            )}
            {viewMode === "temperature" && (
              <span>Avg: <strong>{avgTemp.toFixed(1)}°C</strong> &middot; Max: <strong>{maxTemp.toFixed(1)}°C</strong></span>
            )}
            {viewMode === "vibration" && (
              <span>Avg: <strong>{avgVib.toFixed(2)}</strong> &middot; Peak: <strong>{maxVib.toFixed(2)} mm/s</strong></span>
            )}
            {viewMode === "pressure" && (
              <span>Avg: <strong>{avgPress.toFixed(2)}</strong> &middot; Min: <strong>{minPress.toFixed(2)} bar</strong></span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-4 pt-1">
        <div className="h-[290px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "overview" ? (
              // 1. OVERVIEW: Normalized Tri-Axis Chart
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Reference Danger Zone (80 - 100% envelope threshold) */}
                <ReferenceLine y={80} stroke={COLORS.danger} strokeDasharray="3 3" label={{ value: "Alarm Level (80%)", position: "insideTopRight", fill: COLORS.danger, fontSize: 9, fontFamily: "monospace" }} />
                <ReferenceLine y={65} stroke={COLORS.warning} strokeDasharray="3 3" label={{ value: "Warning Band (65%)", position: "insideTopRight", fill: COLORS.warning, fontSize: 9, fontFamily: "monospace" }} />

                <Line
                  type="monotone"
                  dataKey="normTemp"
                  name="Temperature"
                  stroke={COLORS.temp}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="normVib"
                  name="Vibration RMS"
                  stroke={COLORS.vib}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="normPress"
                  name="Discharge Pressure"
                  stroke={COLORS.press}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            ) : viewMode === "temperature" ? (
              // 2. TEMPERATURE DETAIL CHART (°C with Alarm Limits)
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <YAxis
                  domain={[40, 90]}
                  stroke={COLORS.temp}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}°C`}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={75.0} stroke={COLORS.danger} strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Critical Trip: 75°C", position: "insideTopRight", fill: COLORS.danger, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }} />
                <ReferenceLine y={65.0} stroke={COLORS.warning} strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Warning Threshold: 65°C", position: "insideTopRight", fill: COLORS.warning, fontSize: 10, fontFamily: "monospace" }} />
                <ReferenceLine y={54.0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" label={{ value: "Nominal Target: 54°C", position: "insideBottomRight", fill: "hsl(var(--muted-foreground))", fontSize: 9, fontFamily: "monospace" }} />

                <Line
                  type="monotone"
                  dataKey="rawTemp"
                  name="Temperature"
                  stroke={COLORS.temp}
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: COLORS.temp }}
                  isAnimationActive={false}
                />
              </LineChart>
            ) : viewMode === "vibration" ? (
              // 3. VIBRATION RMS CHART (ISO 10816 Zones)
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <YAxis
                  domain={[0, 8.5]}
                  stroke={COLORS.vib}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={7.1} stroke={COLORS.danger} strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Zone D Trip: 7.1 mm/s", position: "insideTopRight", fill: COLORS.danger, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }} />
                <ReferenceLine y={4.5} stroke={COLORS.warning} strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Zone C Alert: 4.5 mm/s", position: "insideTopRight", fill: COLORS.warning, fontSize: 10, fontFamily: "monospace" }} />
                <ReferenceLine y={2.8} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" label={{ value: "Zone B Limit: 2.8 mm/s", position: "insideBottomRight", fill: "hsl(var(--muted-foreground))", fontSize: 9, fontFamily: "monospace" }} />

                <Line
                  type="monotone"
                  dataKey="rawVib"
                  name="Vibration RMS"
                  stroke={COLORS.vib}
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: COLORS.vib }}
                  isAnimationActive={false}
                />
              </LineChart>
            ) : (
              // 4. DISCHARGE PRESSURE CHART (Hydraulic bar)
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <YAxis
                  domain={[1.5, 6.0]}
                  stroke={COLORS.press}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v.toFixed(1)} bar`}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={4.8} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" label={{ value: "Design Spec: 4.80 bar", position: "insideTopRight", fill: "hsl(var(--muted-foreground))", fontSize: 9, fontFamily: "monospace" }} />
                <ReferenceLine y={3.8} stroke={COLORS.warning} strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Low Warning: 3.80 bar", position: "insideTopRight", fill: COLORS.warning, fontSize: 10, fontFamily: "monospace" }} />
                <ReferenceLine y={3.0} stroke={COLORS.danger} strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Cavitation / Leak Trip: 3.00 bar", position: "insideBottomRight", fill: COLORS.danger, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }} />

                <Line
                  type="monotone"
                  dataKey="rawPress"
                  name="Discharge Pressure"
                  stroke={COLORS.press}
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: COLORS.press }}
                  isAnimationActive={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
