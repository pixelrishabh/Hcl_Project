import React, { useEffect, useState } from "react"
import { Activity, Database, Radio, Moon, Sun, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  isLive: boolean
  mode: string
  totalDiagnoses: number
  dbRecords?: number
  onOpenDatasetModal: () => void
}

export const Header: React.FC<HeaderProps> = ({
  isLive,
  mode,
  totalDiagnoses,
  dbRecords = 10000,
  onOpenDatasetModal,
}) => {
  const [clock, setClock] = useState<string>("--:--:--")
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setClock(now.toTimeString().split(" ")[0])
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
      localStorage.setItem("scada-theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("scada-theme", "light")
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface">
      <div className="container flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Asset Identification */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-14 items-center justify-center rounded-[4px] bg-raised border border-border text-text font-mono font-bold text-xs tracking-wider">
            P_311
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-text font-mono uppercase">
                Centrifugal Slurry Pump HMI
              </h1>
              {/* Persistent Data Source Badge: SIMULATED vs LIVE MQTT */}
              <Badge
                variant={isLive ? "scada" : "default"}
                className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-[4px] border ${
                  isLive
                    ? "border-accent/40 bg-accent/15 text-accent font-semibold"
                    : "border-border bg-raised text-muted font-normal"
                }`}
              >
                {isLive ? "LIVE MQTT" : "SIMULATED"}
              </Badge>
            </div>
            <span className="text-[11px] text-muted font-mono">
              API 610 Heavy Duty Slurry &middot; ISO 20816-3 (formerly ISO 10816-3)
            </span>
          </div>
        </div>

        {/* System Status Indicators & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* MQTT Broker Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-border bg-surface text-xs font-mono">
            <Radio className="h-3.5 w-3.5 text-muted" />
            <span className="text-muted">LINK:</span>
            <span className="text-text font-semibold">{isLive ? "TCP:1883" : "LOCAL LOOP"}</span>
          </div>

          {/* Stream Rate */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-border bg-surface text-xs font-mono">
            <Activity className="h-3.5 w-3.5 text-muted" />
            <span className="text-muted">SCAN:</span>
            <span className="text-text tabular-nums font-semibold">1 Hz</span>
          </div>

          {/* Connected Dataset & Database Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDatasetModal}
            className="h-7 text-xs font-mono gap-1.5 border-border bg-raised hover:bg-surface text-text"
          >
            <Database className="h-3.5 w-3.5 text-muted" />
            <span className="hidden sm:inline">DATASET &amp; DB</span>
            <span className="text-[10px] text-muted tabular-nums">
              [{dbRecords.toLocaleString()}]
            </span>
          </Button>

          {/* Digital Clock */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-[4px] border border-border bg-raised text-xs font-mono text-text tabular-nums">
            <Clock className="h-3 w-3 text-muted" />
            <span>{clock}</span>
          </div>

          {/* Dark/Light Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-[4px] border border-border hover:bg-raised text-text"
            title="Toggle color theme (Light / Dark Control Room)"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-text" />
            ) : (
              <Moon className="h-4 w-4 text-text" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
