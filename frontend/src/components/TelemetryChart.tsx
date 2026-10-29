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
  ReferenceArea,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pause, Play, Layers, Thermometer, Activity, Gauge, AlertTriangle, Unplug } from "lucide-react"
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

  // Use CSS variable references matching design tokens
  const COLORS = {
    temp: "var(--series-temp)",
    vib: "var(--series-vib)",
    press: "var(--series-press)",
    warn: "var(--warn)",
    crit: "var(--crit)",
    sensorFault: "var(--sensor-fault)",
    muted: "var(--muted)",
    grid: "var(--border)",
  }

  // Slice history for viewing window
  const windowData = history.slice(-viewPoints)

  // Detect sensor faults in the current viewing window
  const hasRtdSentinel = windowData.some((r) => r.temperature < -900)
  const isAdcFlatlined =
    windowData.length >= 6 &&
    windowData.some((r) => r.mode === "sensor_failure") &&
    Math.max(...windowData.map((r) => r.temperature)) - Math.min(...windowData.map((r) => r.temperature)) < 0.001

  // Engineering span definitions
  const SPANS = {
    temp: { min: 30.0, max: 85.0, unit: "°C" },
    vib: { min: 0.0, max: 8.0, unit: "mm/s" },
    press: { min: 1.0, max: 6.0, unit: "bar" },
  }

  // Normalized Multi-Channel calculation for the Overview view
  // Normalizes each metric to a 0 - 100% operational scale so all 3 channels share a valid common axis
  const chartData = windowData.map((r) => {
    const isFaulted = r.temperature < -900
    const rawTemp = isFaulted ? null : r.temperature
    const normTemp = rawTemp !== null ? Math.min(100, Math.max(0, ((rawTemp - 30) / (85 - 30)) * 100)) : null
    const normVib = Math.min(100, Math.max(0, (r.vibration / 8.0) * 100))
    const normPress = Math.min(100, Math.max(0, ((r.pressure - 1.0) / (6.0 - 1.0)) * 100))

    // Fault line data point (for gray dashed bad quality line)
    const faultTemp = isFaulted ? 50 : null

    return {
      time: r.timestamp.length > 8 ? r.timestamp.substring(11, 19) : r.timestamp,
      rawTemp,
      rawVib: r.vibration,
      rawPress: r.pressure,
      faultTemp,
      normTemp,
      normVib,
      normPress,
      isFaulted,
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

  interface TooltipPayloadItem {
    name: string
    value: number | null
    payload: {
      rawTemp: number | null
      rawVib: number
      rawPress: number
      isFaulted?: boolean
    }
  }

  interface CustomTooltipProps {
    active?: boolean
    payload?: TooltipPayloadItem[]
    label?: string
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload
      return (
        <div className="rounded-[4px] border border-border bg-surface p-2.5 text-text font-mono text-xs space-y-1.5 z-50 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-border/60 pb-1 text-muted text-[11px]">
            <span>TIME: {label}</span>
            <span className="tabular-nums">1 Hz SCADA</span>
          </div>

          {(viewMode === "overview" || viewMode === "temperature") && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-1.5 w-3 bg-series-temp inline-block rounded-xs" />
                Stator Temp:
              </span>
              <span className="font-bold tabular-nums">
                {dataPoint.rawTemp !== null ? (
                  `${dataPoint.rawTemp.toFixed(1)} °C`
                ) : (
                  <span className="text-sensor-fault font-semibold">BAD QUALITY (OPEN)</span>
                )}
              </span>
            </div>
          )}

          {(viewMode === "overview" || viewMode === "vibration") && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-1.5 w-3 border-t-2 border-dashed border-series-vib inline-block" />
                Vibration RMS:
              </span>
              <span className="font-bold tabular-nums">
                {dataPoint.rawVib.toFixed(2)} mm/s
              </span>
            </div>
          )}

          {(viewMode === "overview" || viewMode === "pressure") && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-1.5 w-3 border-t-2 border-dotted border-series-press inline-block" />
                Discharge Press:
              </span>
              <span className="font-bold tabular-nums">
                {dataPoint.rawPress.toFixed(2)} bar
              </span>
            </div>
          )}

          {viewMode === "overview" && (
            <div className="border-t border-border/50 pt-1 text-[10px] text-muted space-y-0.5">
              <div className="text-[10px] font-semibold text-text uppercase">Real Channel Scales:</div>
              <div className="flex justify-between">
                <span>Temp Span:</span>
                <span className="tabular-nums">{SPANS.temp.min}&ndash;{SPANS.temp.max} {SPANS.temp.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Vib Span:</span>
                <span className="tabular-nums">{SPANS.vib.min.toFixed(1)}&ndash;{SPANS.vib.max.toFixed(1)} {SPANS.vib.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Press Span:</span>
                <span className="tabular-nums">{SPANS.press.min.toFixed(1)}&ndash;{SPANS.press.max.toFixed(1)} {SPANS.press.unit}</span>
              </div>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader className="p-3.5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-xs font-semibold tracking-wide uppercase font-mono flex items-center gap-2">
              <span className="h-2 w-2 rounded-[2px] bg-accent"></span>
              SCADA Waveform Telemetry
            </CardTitle>
            <CardDescription className="text-xs text-muted font-mono">
              Calibrated sensor time-series with ISO 20816-3 (formerly ISO 10816-3) zone boundaries
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sensor fault badge in header when active */}
            {hasRtdSentinel && (
              <Badge variant="sensorFault" className="gap-1 text-[10px] uppercase font-mono">
                <Unplug className="h-3 w-3" /> SENSOR FAULT (RTD)
              </Badge>
            )}
            {isAdcFlatlined && (
              <Badge variant="sensorFault" className="gap-1 text-[10px] uppercase font-mono">
                <AlertTriangle className="h-3 w-3" /> SENSOR FAULT (ADC)
              </Badge>
            )}

            {/* View Points Window Selector */}
            <div className="flex items-center rounded-[4px] border border-border bg-raised p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewPoints(15)}
                className={`px-2 py-0.5 rounded-[2px] cursor-pointer transition-colors ${
                  viewPoints === 15
                    ? "bg-surface font-bold text-text"
                    : "text-muted hover:text-text"
                }`}
              >
                15s
              </button>
              <button
                type="button"
                onClick={() => setViewPoints(30)}
                className={`px-2 py-0.5 rounded-[2px] cursor-pointer transition-colors ${
                  viewPoints === 30
                    ? "bg-surface font-bold text-text"
                    : "text-muted hover:text-text"
                }`}
              >
                30s
              </button>
              <button
                type="button"
                onClick={() => setViewPoints(60)}
                className={`px-2 py-0.5 rounded-[2px] cursor-pointer transition-colors ${
                  viewPoints === 60
                    ? "bg-surface font-bold text-text"
                    : "text-muted hover:text-text"
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
              className={`h-7 px-2.5 text-xs font-mono gap-1 border-border ${
                isPaused ? "border-warn bg-warn/15 text-warn font-bold" : "bg-raised text-text"
              }`}
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span>{isPaused ? "RESUME" : "PAUSE"}</span>
            </Button>
          </div>
        </div>

        {/* View Mode Channel Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 text-xs font-mono border-t border-border mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode("overview")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] border text-xs cursor-pointer transition-colors ${
                viewMode === "overview"
                  ? "border-accent bg-accent/15 text-accent font-semibold"
                  : "border-border bg-raised text-muted hover:text-text"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Normalized Tri-Axis</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("temperature")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] border text-xs cursor-pointer transition-colors ${
                viewMode === "temperature"
                  ? "border-series-temp bg-series-temp/15 text-text font-semibold"
                  : "border-border bg-raised text-muted hover:text-text"
              }`}
            >
              <Thermometer className="h-3.5 w-3.5 text-series-temp" />
              <span>Temp (°C) [Solid]</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("vibration")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] border text-xs cursor-pointer transition-colors ${
                viewMode === "vibration"
                  ? "border-series-vib bg-series-vib/15 text-text font-semibold"
                  : "border-border bg-raised text-muted hover:text-text"
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-series-vib" />
              <span>Vib (mm/s) [Dashed]</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("pressure")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] border text-xs cursor-pointer transition-colors ${
                viewMode === "pressure"
                  ? "border-series-press bg-series-press/15 text-text font-semibold"
                  : "border-border bg-raised text-muted hover:text-text"
              }`}
            >
              <Gauge className="h-3.5 w-3.5 text-series-press" />
              <span>Discharge (bar) [Dotted]</span>
            </button>
          </div>

          {/* Real Min / Max context summary */}
          <div className="text-[11px] font-mono text-muted hidden md:flex items-center gap-2">
            {viewMode === "overview" && (
              <span>Channels: <strong>Temp Solid</strong> &middot; <strong>Vib Dashed</strong> &middot; <strong>Press Dotted</strong></span>
            )}
            {viewMode === "temperature" && (
              <span>60s Window: Avg <strong className="tabular-nums">{avgTemp.toFixed(1)}°C</strong> &middot; Max <strong className="tabular-nums">{maxTemp.toFixed(1)}°C</strong></span>
            )}
            {viewMode === "vibration" && (
              <span>60s Window: Avg <strong className="tabular-nums">{avgVib.toFixed(2)}</strong> &middot; Peak <strong className="tabular-nums">{maxVib.toFixed(2)} mm/s</strong></span>
            )}
            {viewMode === "pressure" && (
              <span>60s Window: Avg <strong className="tabular-nums">{avgPress.toFixed(2)}</strong> &middot; Min <strong className="tabular-nums">{minPress.toFixed(2)} bar</strong></span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-4 pt-1">
        <div className="h-[280px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "overview" ? (
              // 1. OVERVIEW: Normalized Tri-Axis Chart
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke={COLORS.muted}
                  fontSize={10}
                  tickLine={false}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={COLORS.muted}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <Tooltip content={<CustomTooltip />} />

                {/* ISO Zones Faint Horizontal Bands */}
                {/* Zone A (0-35%): no fill */}
                {/* Zone B (35-56%): warn @ 8% */}
                <ReferenceArea y1={35} y2={56.25} fill="var(--warn)" fillOpacity={0.08} />
                {/* Zone C (56-88%): orange @ 12% */}
                <ReferenceArea y1={56.25} y2={88.75} fill="var(--series-temp)" fillOpacity={0.12} />
                {/* Zone D (88-100%): crit @ 15% */}
                <ReferenceArea y1={88.75} y2={100} fill="var(--crit)" fillOpacity={0.15} />

                {/* 1px dashed threshold lines with labels */}
                <ReferenceLine
                  y={88.75}
                  stroke={COLORS.crit}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{ value: "TRIP (Zone D / >7.1 mm/s)", position: "insideTopRight", fill: COLORS.crit, fontSize: 9, fontFamily: "monospace" }}
                />
                <ReferenceLine
                  y={56.25}
                  stroke={COLORS.warn}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{ value: "ALERT (Zone C / 4.5 mm/s)", position: "insideTopRight", fill: COLORS.warn, fontSize: 9, fontFamily: "monospace" }}
                />

                {/* Solid Line for Temperature */}
                <Line
                  type="monotone"
                  dataKey="normTemp"
                  name="Temperature"
                  stroke={COLORS.temp}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {/* Dashed Line for Vibration RMS */}
                <Line
                  type="monotone"
                  dataKey="normVib"
                  name="Vibration RMS"
                  stroke={COLORS.vib}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                />
                {/* Dotted Line for Discharge Pressure */}
                <Line
                  type="monotone"
                  dataKey="normPress"
                  name="Discharge Pressure"
                  stroke={COLORS.press}
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  dot={false}
                  isAnimationActive={false}
                />
                {/* Bad quality line if RTD faulted */}
                {hasRtdSentinel && (
                  <Line
                    type="monotone"
                    dataKey="faultTemp"
                    name="Sensor Fault"
                    stroke={COLORS.muted}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            ) : viewMode === "temperature" ? (
              // 2. TEMPERATURE DETAIL CHART (°C with Alarm Limits)
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke={COLORS.muted}
                  fontSize={10}
                  tickLine={false}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <YAxis
                  domain={[35, 90]}
                  stroke={COLORS.temp}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}°C`}
                  fontFamily="IBM Plex Mono, monospace"
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Faint Horizontal Thermal Bands */}
                <ReferenceArea y1={65.0} y2={75.0} fill="var(--warn)" fillOpacity={0.08} />
                <ReferenceArea y1={75.0} y2={90.0} fill="var(--crit)" fillOpacity={0.15} />

                <ReferenceLine
                  y={75.0}
                  stroke={COLORS.crit}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  label={{ value: "TRIP: 75.0°C", position: "insideTopRight", fill: COLORS.crit, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}
                />
                <ReferenceLine
                  y={65.0}
                  stroke={COLORS.warn}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  label={{ value: "WARNING: 65.0°C", position: "insideTopRight", fill: COLORS.warn, fontSize: 10, fontFamily: "monospace" }}
                />
                <ReferenceLine
                  y={54.0}
                  stroke={COLORS.muted}
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{ value: "NOMINAL: 54.0°C", position: "insideBottomRight", fill: COLORS.muted, fontSize: 9, fontFamily: "monospace" }}
                />

                {/* Solid Line for Temperature */}
                <Line
                  type="monotone"
                  dataKey="rawTemp"
                  name="Temperature"
                  stroke={COLORS.temp}
                  strokeWidth={2}
                  dot={{ r: 2, fill: COLORS.temp }}
                  isAnimationActive={false}
                />
              </LineChart>
            ) : viewMode === "vibration" ? (
              // 3. VIBRATION RMS CHART (ISO 20816-3 Zones)
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke={COLORS.muted}
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

                {/* ISO Zones Faint Horizontal Bands */}
                {/* Zone A: no fill (< 2.8) */}
                {/* Zone B: warn @ 8% (2.8 - 4.5) */}
                <ReferenceArea y1={2.8} y2={4.5} fill="var(--warn)" fillOpacity={0.08} />
                {/* Zone C: orange @ 12% (4.5 - 7.1) */}
                <ReferenceArea y1={4.5} y2={7.1} fill="var(--series-temp)" fillOpacity={0.12} />
                {/* Zone D: crit @ 15% (> 7.1) */}
                <ReferenceArea y1={7.1} y2={8.5} fill="var(--crit)" fillOpacity={0.15} />

                {/* 1px dashed reference lines */}
                <ReferenceLine
                  y={7.1}
                  stroke={COLORS.crit}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  label={{ value: "Zone D TRIP: 7.1 mm/s", position: "insideTopRight", fill: COLORS.crit, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}
                />
                <ReferenceLine
                  y={4.5}
                  stroke={COLORS.warn}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  label={{ value: "Zone C ALERT: 4.5 mm/s", position: "insideTopRight", fill: COLORS.warn, fontSize: 10, fontFamily: "monospace" }}
                />
                <ReferenceLine
                  y={2.8}
                  stroke={COLORS.muted}
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{ value: "Zone B LIMIT: 2.8 mm/s", position: "insideBottomRight", fill: COLORS.muted, fontSize: 9, fontFamily: "monospace" }}
                />

                {/* Dashed Line for Vibration RMS */}
                <Line
                  type="monotone"
                  dataKey="rawVib"
                  name="Vibration RMS"
                  stroke={COLORS.vib}
                  strokeWidth={2}
                  strokeDasharray="5 5"
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
                  stroke={COLORS.muted}
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

                {/* Faint Horizontal Pressure Cavitation Bands */}
                <ReferenceArea y1={1.5} y2={3.0} fill="var(--crit)" fillOpacity={0.15} />
                <ReferenceArea y1={3.0} y2={3.8} fill="var(--warn)" fillOpacity={0.08} />

                <ReferenceLine
                  y={4.8}
                  stroke={COLORS.muted}
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{ value: "DESIGN SPEC: 4.80 bar", position: "insideTopRight", fill: COLORS.muted, fontSize: 9, fontFamily: "monospace" }}
                />
                <ReferenceLine
                  y={3.8}
                  stroke={COLORS.warn}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  label={{ value: "LOW WARNING: 3.80 bar", position: "insideTopRight", fill: COLORS.warn, fontSize: 10, fontFamily: "monospace" }}
                />
                <ReferenceLine
                  y={3.0}
                  stroke={COLORS.crit}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  label={{ value: "TRIP (CAVITATION / LEAK): 3.00 bar", position: "insideBottomRight", fill: COLORS.crit, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}
                />

                {/* Dotted Line for Discharge Pressure */}
                <Line
                  type="monotone"
                  dataKey="rawPress"
                  name="Discharge Pressure"
                  stroke={COLORS.press}
                  strokeWidth={2}
                  strokeDasharray="2 2"
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
