import React, { useEffect, useState } from "react"
import { Activity, Cpu, Database, Radio, Moon, Sun, Clock, Zap } from "lucide-react"
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Machine Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono font-bold shadow-sm">
            <span className="text-sm tracking-wider">P_311</span>
            <span className={`absolute -top-1 -right-1 flex h-2.5 w-2.5`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight sm:text-base">
                IoT Fault Diagnosis Assistant
              </h1>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] py-0 border-scada-cyan/40 text-scada-cyan bg-scada-cyan/5">
                SCADA v2.4
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Industrial Centrifugal Slurry Pump [API 610 / ISO 10816]
            </span>
          </div>
        </div>

        {/* System Status Indicators & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* MQTT Broker Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-card/60 text-xs font-mono">
            <Radio className={`h-3.5 w-3.5 ${isLive ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-muted-foreground">MQTT:</span>
            <span className="font-semibold">{isLive ? "1883 ONLINE" : "STANDALONE"}</span>
          </div>

          {/* Telemetry Rate */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-card/60 text-xs font-mono">
            <Activity className="h-3.5 w-3.5 text-scada-cyan animate-pulse" />
            <span className="text-muted-foreground">Stream:</span>
            <span className="text-scada-cyan font-semibold">{isLive ? "1 Hz LIVE" : "1 Hz DEMO"}</span>
          </div>

          {/* Diagnostic LLM */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-card/60 text-xs font-mono">
            <Cpu className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-muted-foreground">LLM:</span>
            <span className="text-violet-400 font-semibold">RAG ACTIVE</span>
          </div>

          {/* Connected Dataset & Database Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDatasetModal}
            className="h-8 gap-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-mono text-xs"
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI4I &amp; PG</span>
            <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-[10px] font-mono">
              {dbRecords.toLocaleString()}
            </Badge>
          </Button>

          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border bg-muted/30 text-xs font-mono text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{clock}</span>
          </div>

          {/* Dark/Light Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-md"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 transition-all" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700 transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
