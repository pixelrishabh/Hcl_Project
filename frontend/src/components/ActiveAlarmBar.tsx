import React from "react"
import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2, Check, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ActiveAlarm } from "../types"

interface ActiveAlarmBarProps {
  alarms: ActiveAlarm[]
  onAcknowledge: (id: string) => void
  onAcknowledgeAll: () => void
}

export const ActiveAlarmBar: React.FC<ActiveAlarmBarProps> = ({
  alarms,
  onAcknowledge,
  onAcknowledgeAll,
}) => {
  const unackedAlarms = alarms.filter((a) => !a.acknowledged)
  const hasAlarms = alarms.length > 0

  if (!hasAlarms) {
    return (
      <div className="w-full border-b border-border bg-surface px-4 py-1.5 text-xs font-mono text-muted flex items-center justify-between">
        <div className="container max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-muted shrink-0" />
            <span>
              <strong>ALARM SYSTEM:</strong> NOMINAL &middot; All process parameters operating within ISO 20816-3 (formerly ISO 10816-3) limits
            </span>
          </div>
          <span className="text-[11px] text-muted hidden sm:inline tabular-nums">
            0 ACTIVE PROCESS ALARMS
          </span>
        </div>
      </div>
    )
  }

  // Get highest severity
  const isTrip = alarms.some((a) => a.severity === "CRITICAL" && !a.acknowledged)
  const isSensorFault = alarms.some((a) => a.severity === "SENSOR_FAULT" && !a.acknowledged)
  const isWarn = alarms.some((a) => a.severity === "WARNING" && !a.acknowledged)

  const bannerBorder = isTrip
    ? "border-crit/60 bg-crit/10"
    : isSensorFault
    ? "border-sensor-fault/60 bg-sensor-fault/10"
    : isWarn
    ? "border-warn/60 bg-warn/10"
    : "border-border bg-raised text-muted"

  return (
    <div className={`w-full border-b transition-colors px-4 py-2 text-xs font-mono ${bannerBorder}`}>
      <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide">
            {isTrip ? (
              <>
                <AlertOctagon className="h-4 w-4 text-crit shrink-0" />
                <span className="text-crit font-bold">ALARM ACTIVE:</span>
              </>
            ) : isSensorFault ? (
              <>
                <AlertCircle className="h-4 w-4 text-sensor-fault shrink-0" />
                <span className="text-sensor-fault font-bold">INSTRUMENTATION ALARM:</span>
              </>
            ) : isWarn ? (
              <>
                <AlertTriangle className="h-4 w-4 text-warn shrink-0" />
                <span className="text-warn font-bold">WARNING ACTIVE:</span>
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 text-muted shrink-0" />
                <span className="text-muted font-bold">ACKNOWLEDGED ALARMS:</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {alarms.map((alarm) => {
              const isCritSev = alarm.severity === "CRITICAL"
              const isSensorSev = alarm.severity === "SENSOR_FAULT"
              return (
                <div
                  key={alarm.id}
                  className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] border text-xs ${
                    alarm.acknowledged
                      ? "border-border bg-surface text-muted"
                      : isCritSev
                      ? "border-crit/50 bg-crit/20 text-text"
                      : isSensorSev
                      ? "border-sensor-fault/50 bg-sensor-fault/20 text-text"
                      : "border-warn/50 bg-warn/20 text-text"
                  }`}
                >
                  <Badge
                    variant={
                      alarm.acknowledged
                        ? "nominal"
                        : isCritSev
                        ? "critical"
                        : isSensorSev
                        ? "sensorFault"
                        : "warning"
                    }
                    className="text-[10px] px-1 py-0 uppercase"
                  >
                    {alarm.severity === "CRITICAL"
                      ? "TRIP"
                      : alarm.severity === "SENSOR_FAULT"
                      ? "SENSOR FAULT"
                      : "WARNING"}
                  </Badge>

                  <span className="font-semibold">{alarm.title}:</span>
                  <span className="text-muted">{alarm.message}</span>
                  <span className="text-[10px] text-muted tabular-nums">
                    [{alarm.raisedAt}]
                  </span>

                  {!alarm.acknowledged ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAcknowledge(alarm.id)}
                      className="h-5 px-1.5 text-[10px] border-border bg-surface hover:bg-raised text-text ml-1"
                    >
                      ACK
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted flex items-center gap-0.5 ml-1">
                      <Check className="h-3 w-3" /> ACKED
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {unackedAlarms.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAcknowledgeAll}
            className="h-6 text-[11px] px-2 font-mono border-border bg-surface hover:bg-raised text-text shrink-0"
          >
            ACKNOWLEDGE ALL ({unackedAlarms.length})
          </Button>
        )}
      </div>
    </div>
  )
}

