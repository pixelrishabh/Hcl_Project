import React, { useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Maximize2, Pause, Play } from "lucide-react"
import { SensorReading } from "../types"

interface TelemetryChartProps {
  history: SensorReading[]
  isPaused: boolean
  onTogglePause: () => void
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  history,
  isPaused,
  onTogglePause,
}) => {
  const [showTemp, setShowTemp] = useState(true)
  const [showVib, setShowVib] = useState(true)
  const [showPress, setShowPress] = useState(true)
  const [viewPoints, setViewPoints] = useState<number>(30)

  // Slice history for viewing window
  const chartData = history.slice(-viewPoints).map((r) => ({
    time: r.timestamp.length > 8 ? r.timestamp.substring(11, 19) : r.timestamp,
    temperature: r.temperature < -900 ? null : r.temperature,
    vibration: r.vibration,
    pressure: r.pressure,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-md font-mono text-xs space-y-1 z-50">
          <p className="font-semibold text-muted-foreground border-b pb-1 mb-1">
            Time: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span style={{ color: entry.color }} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold">
                {entry.value !== null ? entry.value.toFixed(2) : "OFFLINE"}{" "}
                {entry.name.includes("Temp") ? "°C" : entry.name.includes("Vib") ? "mm/s" : "bar"}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur">
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold tracking-wide uppercase font-mono flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              Real-Time SCADA Waveform Telemetry
            </CardTitle>
            <CardDescription className="text-xs">
              Synchronized 1 Hz multi-channel sensor dynamics [Temperature &middot; Vibration RMS &middot; Discharge Pressure]
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Points Selector */}
            <div className="flex items-center rounded-md border bg-muted/40 p-0.5 text-xs font-mono">
              <button
                onClick={() => setViewPoints(15)}
                className={`px-2 py-0.5 rounded ${viewPoints === 15 ? 'bg-background shadow-xs font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                15s
              </button>
              <button
                onClick={() => setViewPoints(30)}
                className={`px-2 py-0.5 rounded ${viewPoints === 30 ? 'bg-background shadow-xs font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                30s
              </button>
              <button
                onClick={() => setViewPoints(60)}
                className={`px-2 py-0.5 rounded ${viewPoints === 60 ? 'bg-background shadow-xs font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                60s
              </button>
            </div>

            {/* Pause / Resume Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePause}
              className={`h-7 px-2.5 text-xs font-mono gap-1 ${isPaused ? 'border-amber-500 text-amber-400 bg-amber-500/10' : ''}`}
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </Button>
          </div>
        </div>

        {/* Channel Toggles */}
        <div className="flex items-center gap-3 pt-2 text-xs font-mono border-t border-border/40 mt-2">
          <button
            onClick={() => setShowTemp(!showTemp)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
              showTemp ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "opacity-40 border-muted"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Temp (°C)</span>
          </button>

          <button
            onClick={() => setShowVib(!showVib)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
              showVib ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "opacity-40 border-muted"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>Vibration (mm/s)</span>
          </button>

          <button
            onClick={() => setShowPress(!showPress)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
              showPress ? "border-purple-500/50 bg-purple-500/10 text-purple-400" : "opacity-40 border-muted"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span>Pressure (bar)</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-4 pt-0">
        <div className="h-[280px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                fontFamily="IBM Plex Mono, monospace"
              />
              {/* Left Axis: Temperature & Pressure */}
              <YAxis
                yAxisId="left"
                domain={[30, 95]}
                stroke="#f59e0b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}°`}
                fontFamily="IBM Plex Mono, monospace"
              />
              {/* Right Axis: Vibration */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 8.5]}
                stroke="#06b6d4"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toFixed(1)}`}
                fontFamily="IBM Plex Mono, monospace"
              />
              <Tooltip content={<CustomTooltip />} />
              {showTemp && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showVib && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="vibration"
                  name="Vibration RMS"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showPress && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pressure"
                  name="Discharge Pressure"
                  stroke="#c084fc"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
