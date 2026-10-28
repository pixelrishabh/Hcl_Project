import React from "react"
import { AlertCircle, CheckCircle2, RefreshCw, Database, Server } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConnectionBannerProps {
  isLive: boolean
  onReconnect: () => void
  onOpenDataset: () => void
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({
  isLive,
  onReconnect,
  onOpenDataset,
}) => {
  return (
    <div
      className={`w-full border-b px-4 py-2 text-xs transition-colors ${
        isLive
          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
          : "border-amber-500/20 bg-amber-500/5 text-amber-300"
      }`}
    >
      <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          {isLive ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 animate-bounce" />
          )}
          <span>
            {isLive ? (
              <span className="font-mono">
                <strong className="text-emerald-400">Live Telemetry Pipeline Active:</strong> MQTT Broker (:1883) &middot; PostgreSQL (:5432) &middot; 1 Hz Continuous Ingestion
              </span>
            ) : (
              <span className="font-mono">
                <strong className="text-amber-400">Standalone Interactive Mode:</strong> High-Fidelity Physics Simulator &amp; UCI AI4I Dataset Active. (Run <code>Launch_Dashboard.bat</code> for live pipeline)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDataset}
            className="h-7 text-xs px-2.5 font-mono text-foreground hover:bg-background/80 gap-1.5"
          >
            <Database className="h-3.5 w-3.5 text-scada-cyan" />
            <span>Dataset &amp; DB Explorer</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onReconnect}
            className="h-7 text-xs px-2.5 font-mono bg-background/50 hover:bg-background gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            <span>{isLive ? "Refresh Sync" : "Connect Live"}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
