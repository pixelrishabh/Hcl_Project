import React, { useState } from "react"
import { History, Search, Filter, ShieldAlert, ChevronRight, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { DiagnosisRecord } from "../types"

interface IncidentHistoryTableProps {
  history: DiagnosisRecord[]
}

export const IncidentHistoryTable: React.FC<IncidentHistoryTableProps> = ({
  history,
}) => {
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState<string>("")
  const [selectedIncident, setSelectedIncident] = useState<DiagnosisRecord | null>(null)

  const filteredHistory = history.filter((item) => {
    const matchesFilter = filter === "all" || item.fault_category === filter
    const matchesSearch =
      search === "" ||
      item.fault_category.toLowerCase().includes(search.toLowerCase()) ||
      item.timestamp.includes(search) ||
      (item.symptoms && item.symptoms.some((s) => s.toLowerCase().includes(search.toLowerCase())))
    return matchesFilter && matchesSearch
  })

  return (
    <>
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold tracking-wide uppercase font-mono flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Persistent Diagnostic Incident Log
              </CardTitle>
              <CardDescription className="text-xs">
                Historical record of detected anomaly events persisted to PostgreSQL and JSONL audit trail
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <div className="flex items-center rounded-md border bg-muted/40 p-0.5 text-xs font-mono">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-2 py-0.5 rounded ${filter === "all" ? 'bg-background shadow-xs font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  All ({history.length})
                </button>
                <button
                  onClick={() => setFilter("bearing_wear")}
                  className={`px-2 py-0.5 rounded ${filter === "bearing_wear" ? 'bg-background shadow-xs font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Bearing
                </button>
                <button
                  onClick={() => setFilter("overheating")}
                  className={`px-2 py-0.5 rounded ${filter === "overheating" ? 'bg-background shadow-xs font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Overheat
                </button>
                <button
                  onClick={() => setFilter("pressure_drop")}
                  className={`px-2 py-0.5 rounded ${filter === "pressure_drop" ? 'bg-background shadow-xs font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Pressure
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          {filteredHistory.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground border rounded-lg border-dashed">
              No historical incident records match the current filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground text-left">
                    <th className="py-2 px-3 font-semibold">Timestamp</th>
                    <th className="py-2 px-3 font-semibold">Fault Mode</th>
                    <th className="py-2 px-3 font-semibold">Sensor Snapshot</th>
                    <th className="py-2 px-3 font-semibold">Symptoms / Actions</th>
                    <th className="py-2 px-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredHistory.slice(0, 10).map((record, idx) => {
                    const isOverheat = record.fault_category === "overheating"
                    const isBearing = record.fault_category === "bearing_wear"
                    const isPressure = record.fault_category === "pressure_drop"
                    return (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                          {record.timestamp}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge
                            variant={
                              isOverheat
                                ? "critical"
                                : isBearing
                                ? "warning"
                                : isPressure
                                ? "secondary"
                                : "outline"
                            }
                            className="text-[10px] uppercase font-mono"
                          >
                            {record.fault_category.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-foreground whitespace-nowrap">
                          {record.readings ? (
                            <span className="space-x-2">
                              <span>T: <strong className="text-amber-400">{record.readings.temperature}°C</strong></span>
                              <span>V: <strong className="text-cyan-400">{record.readings.vibration}mm/s</strong></span>
                              <span>P: <strong className="text-purple-400">{record.readings.pressure}bar</strong></span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                          {record.symptoms && record.symptoms.length > 0
                            ? record.symptoms.join("; ")
                            : "Anomaly flagged by fault detector"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIncident(record)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="max-w-2xl font-mono text-xs">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                Incident Report &middot; {selectedIncident.fault_category.toUpperCase().replace("_", " ")}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                Timestamp: {selectedIncident.timestamp} &middot; Device: {selectedIncident.device_id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="grid grid-cols-3 gap-2 p-3 rounded-md border bg-muted/20">
                <div>
                  <span className="text-muted-foreground block text-[10px]">TEMPERATURE</span>
                  <span className="text-sm font-bold text-amber-400">
                    {selectedIncident.readings?.temperature}°C
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">VIBRATION RMS</span>
                  <span className="text-sm font-bold text-cyan-400">
                    {selectedIncident.readings?.vibration} mm/s
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">DISCHARGE PRESSURE</span>
                  <span className="text-sm font-bold text-purple-400">
                    {selectedIncident.readings?.pressure} bar
                  </span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-foreground mb-1 uppercase tracking-wider text-[11px]">
                  Observed Physical Symptoms:
                </h5>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {(selectedIncident.symptoms || ["Threshold breached"]).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {selectedIncident.diagnosis_text && (
                <div>
                  <h5 className="font-bold text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Diagnosis Assessment:
                  </h5>
                  <p className="p-2.5 rounded border bg-card text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {selectedIncident.diagnosis_text}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
