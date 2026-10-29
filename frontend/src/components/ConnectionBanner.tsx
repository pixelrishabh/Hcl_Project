import React from "react"
import { CheckCircle2, AlertTriangle, RefreshCw, Database } from "lucide-react"
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
      className={`w-full border-b px-4 py-1.5 text-xs font-mono transition-colors ${
        isLive
          ? "border-border bg-surface text-muted"
          : "border-warn/30 bg-warn/10 text-text"
      }`}
    >
      <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          {isLive ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-muted shrink-0" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-warn shrink-0" />
          )}
          <span>
            {isLive ? (
              <span>
                <strong className="text-text">Telemetry Pipeline Online:</strong> MQTT Broker (:1883) &middot; PostgreSQL Ingestion (:5432) &middot; 1 Hz Ingestion
              </span>
            ) : (
              <span>
                <strong className="text-warn">Standalone Physics Simulator:</strong> High-Fidelity Pump Dynamic Model &amp; UCI AI4I Synthetic Generator Active.
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDataset}
            className="h-6 text-xs px-2 font-mono text-muted hover:text-text hover:bg-raised gap-1"
          >
            <Database className="h-3 w-3 text-muted" />
            <span>Dataset &amp; Persistence Explorer</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onReconnect}
            className="h-6 text-xs px-2 font-mono border-border bg-raised hover:bg-surface text-text gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>{isLive ? "Refresh Sync" : "Connect Live"}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
