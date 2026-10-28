import React, { useState, useMemo } from "react"
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  ArrowUpDown,
  Download,
  AlertTriangle,
  AlertOctagon,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react"
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

type SortField = "timestamp" | "fault_category" | "temperature" | "vibration"

export const IncidentHistoryTable: React.FC<IncidentHistoryTableProps> = ({
  history,
}) => {
  const [filterMode, setFilterMode] = useState<string>("all")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [search, setSearch] = useState<string>("")
  const [sortField, setSortField] = useState<SortField>("timestamp")
  const [sortAsc, setSortAsc] = useState<boolean>(false)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [selectedIncident, setSelectedIncident] = useState<DiagnosisRecord | null>(null)

  // Incident Metrics Calculation
  const totalIncidents = history.length
  const criticalCount = history.filter(
    (h) =>
      h.fault_category === "overheating" ||
      (h.readings && (h.readings.vibration > 7.1 || h.readings.temperature >= 75.0 || h.readings.pressure < 3.0))
  ).length
  const warningCount = totalIncidents - criticalCount

  // Filtered & Sorted Records
  const processedRecords = useMemo(() => {
    let result = history.filter((item) => {
      // Filter by category
      const matchesCategory = filterMode === "all" || item.fault_category === filterMode

      // Filter by severity
      const isCritical =
        item.fault_category === "overheating" ||
        (item.readings && (item.readings.vibration > 7.1 || item.readings.temperature >= 75.0 || item.readings.pressure < 3.0))
      const matchesSeverity =
        filterSeverity === "all" ||
        (filterSeverity === "critical" && isCritical) ||
        (filterSeverity === "warning" && !isCritical)

      // Search term
      const term = search.toLowerCase()
      const matchesSearch =
        term === "" ||
        item.fault_category.toLowerCase().includes(term) ||
        item.timestamp.includes(term) ||
        item.device_id.toLowerCase().includes(term) ||
        (item.symptoms && item.symptoms.some((s) => s.toLowerCase().includes(term)))

      return matchesCategory && matchesSeverity && matchesSearch
    })

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      if (sortField === "timestamp") {
        comparison = a.timestamp.localeCompare(b.timestamp)
      } else if (sortField === "fault_category") {
        comparison = a.fault_category.localeCompare(b.fault_category)
      } else if (sortField === "temperature") {
        const tempA = a.readings?.temperature ?? 0
        const tempB = b.readings?.temperature ?? 0
        comparison = tempA - tempB
      } else if (sortField === "vibration") {
        const vibA = a.readings?.vibration ?? 0
        const vibB = b.readings?.vibration ?? 0
        comparison = vibA - vibB
      }
      return sortAsc ? comparison : -comparison
    })

    return result
  }, [history, filterMode, filterSeverity, search, sortField, sortAsc])

  // Export CSV Handler
  const handleExportCSV = () => {
    if (processedRecords.length === 0) return
    const headers = [
      "Timestamp",
      "Device ID",
      "Fault Category",
      "Temperature (°C)",
      "Vibration (mm/s)",
      "Pressure (bar)",
      "Symptoms",
      "Diagnosis",
    ]
    const rows = processedRecords.map((r) => [
      `"${r.timestamp}"`,
      `"${r.device_id}"`,
      `"${r.fault_category}"`,
      r.readings?.temperature ?? "",
      r.readings?.vibration ?? "",
      r.readings?.pressure ?? "",
      `"${(r.symptoms || []).join("; ").replace(/"/g, '""')}"`,
      `"${(r.diagnosis_text || "").replace(/"/g, '""')}"`,
    ])
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `p311_scada_incidents_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  return (
    <>
      <Card className="border-border/80 bg-card/80 backdrop-blur">
        <CardHeader className="p-3.5 sm:p-4 pb-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold tracking-wide uppercase font-mono flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Persistent SCADA Incident Audit Trail
              </CardTitle>
              <CardDescription className="text-xs">
                PostgreSQL backed failure event repository with grounding provenance and RAG diagnoses
              </CardDescription>
            </div>

            {/* Quick KPI pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs py-0.5">
                Total: <strong>{totalIncidents}</strong>
              </Badge>
              <Badge variant="critical" className="font-mono text-xs py-0.5 gap-1">
                <AlertOctagon className="h-3 w-3" /> Critical: {criticalCount}
              </Badge>
              <Badge variant="warning" className="font-mono text-xs py-0.5 gap-1">
                <AlertTriangle className="h-3 w-3" /> Alerts: {warningCount}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-7 text-xs font-mono gap-1 cursor-pointer"
                title="Download CSV report"
              >
                <Download className="h-3 w-3" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>

          {/* Filtering and Search Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-3 border-t border-border/50 mt-2">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by symptom, fault, or time..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background/80 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="md:col-span-5 flex items-center gap-1 overflow-x-auto text-xs font-mono">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                  filterMode === "all"
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("bearing_wear")}
                className={`px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                  filterMode === "bearing_wear"
                    ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 font-bold"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                Bearing
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("overheating")}
                className={`px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                  filterMode === "overheating"
                    ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                Overheat
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("pressure_drop")}
                className={`px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                  filterMode === "pressure_drop"
                    ? "bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                Pressure
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("sensor_failure")}
                className={`px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                  filterMode === "sensor_failure"
                    ? "bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-400 font-bold"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                Sensor
              </button>
            </div>

            {/* Severity Filter */}
            <div className="md:col-span-3 flex items-center justify-end gap-1.5 text-xs font-mono">
              <span className="text-muted-foreground text-[11px]">Severity:</span>
              <button
                type="button"
                onClick={() => setFilterSeverity("all")}
                className={`px-2 py-0.5 rounded border ${
                  filterSeverity === "all" ? "bg-muted font-bold text-foreground" : "text-muted-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity("critical")}
                className={`px-2 py-0.5 rounded border ${
                  filterSeverity === "critical"
                    ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold"
                    : "text-muted-foreground"
                }`}
              >
                Crit
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity("warning")}
                className={`px-2 py-0.5 rounded border ${
                  filterSeverity === "warning"
                    ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 font-bold"
                    : "text-muted-foreground"
                }`}
              >
                Warn
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 sm:p-4 pt-1">
          {processedRecords.length === 0 ? (
            <div className="py-10 text-center text-xs font-mono text-muted-foreground border rounded-lg border-dashed bg-muted/10 space-y-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto opacity-70" />
              <p>No historical incident records match the active search and filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setFilterMode("all")
                  setFilterSeverity("all")
                }}
                className="h-6 text-[11px] font-mono mt-1"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-left">
                    <th
                      onClick={() => toggleSort("timestamp")}
                      className="py-2.5 px-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Timestamp (UTC)</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("fault_category")}
                      className="py-2.5 px-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Classification Mode</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 font-semibold">Sensor Snapshot</th>
                    <th className="py-2.5 px-3 font-semibold">Observed Symptoms</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {processedRecords.slice(0, rowsPerPage).map((record, idx) => {
                    const isCrit =
                      record.fault_category === "overheating" ||
                      (record.readings &&
                        (record.readings.vibration > 7.1 ||
                          record.readings.temperature >= 75.0 ||
                          record.readings.pressure < 3.0))

                    return (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                          {record.timestamp}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge
                            variant={isCrit ? "critical" : "warning"}
                            className="text-[10px] uppercase font-mono"
                          >
                            {record.fault_category.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {record.readings ? (
                            <span className="space-x-2 text-[11px]">
                              <span>
                                T:{" "}
                                <strong
                                  className={
                                    record.readings.temperature >= 75
                                      ? "text-rose-500 font-bold"
                                      : "text-amber-500"
                                  }
                                >
                                  {record.readings.temperature < -900
                                    ? "OPEN"
                                    : `${record.readings.temperature}°C`}
                                </strong>
                              </span>
                              <span>
                                V:{" "}
                                <strong
                                  className={
                                    record.readings.vibration > 4.5
                                      ? "text-rose-500 font-bold"
                                      : "text-sky-500"
                                  }
                                >
                                  {record.readings.vibration}mm/s
                                </strong>
                              </span>
                              <span>
                                P:{" "}
                                <strong
                                  className={
                                    record.readings.pressure < 3.0
                                      ? "text-rose-500 font-bold"
                                      : "text-blue-500"
                                  }
                                >
                                  {record.readings.pressure}bar
                                </strong>
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                          {record.symptoms && record.symptoms.length > 0
                            ? record.symptoms.join("; ")
                            : "Sensor threshold deviation recorded"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIncident(record)}
                            className="h-7 px-2 text-xs font-mono gap-1 text-primary hover:bg-primary/10 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination control */}
              {processedRecords.length > 10 && (
                <div className="flex items-center justify-between pt-3 text-xs font-mono text-muted-foreground border-t border-border/40 mt-2">
                  <span>
                    Showing {Math.min(rowsPerPage, processedRecords.length)} of {processedRecords.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRowsPerPage(10)}
                      className={`px-2 py-0.5 rounded border ${
                        rowsPerPage === 10 ? "bg-muted font-bold text-foreground" : ""
                      }`}
                    >
                      10
                    </button>
                    <button
                      type="button"
                      onClick={() => setRowsPerPage(25)}
                      className={`px-2 py-0.5 rounded border ${
                        rowsPerPage === 25 ? "bg-muted font-bold text-foreground" : ""
                      }`}
                    >
                      25
                    </button>
                    <button
                      type="button"
                      onClick={() => setRowsPerPage(50)}
                      className={`px-2 py-0.5 rounded border ${
                        rowsPerPage === 50 ? "bg-muted font-bold text-foreground" : ""
                      }`}
                    >
                      50
                    </button>
                  </div>
                </div>
              )}
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
                Diagnostic Incident Detail &middot; {selectedIncident.fault_category.toUpperCase().replace("_", " ")}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                Timestamp: {selectedIncident.timestamp} &middot; Target Asset: {selectedIncident.device_id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-md border bg-muted/20">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">STATOR TEMP</span>
                  <span className="text-sm font-bold text-amber-500">
                    {selectedIncident.readings?.temperature < -900
                      ? "OPEN CIRCUIT"
                      : `${selectedIncident.readings?.temperature}°C`}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">VIBRATION RMS</span>
                  <span className="text-sm font-bold text-sky-500">
                    {selectedIncident.readings?.vibration} mm/s
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">DISCHARGE PRESS</span>
                  <span className="text-sm font-bold text-blue-500">
                    {selectedIncident.readings?.pressure} bar
                  </span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-foreground mb-1 uppercase tracking-wider text-[11px]">
                  Observed Physical Symptoms:
                </h5>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {(selectedIncident.symptoms || ["Parameter threshold breached"]).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {selectedIncident.diagnosis_text && (
                <div>
                  <h5 className="font-bold text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Automated RAG LLM Diagnostic Assessment:
                  </h5>
                  <p className="p-3 rounded border bg-card text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {selectedIncident.diagnosis_text}
                  </p>
                </div>
              )}

              {selectedIncident.sections?.recommended_actions && (
                <div>
                  <h5 className="font-bold text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Standard Operating Procedure Actions:
                  </h5>
                  <div className="space-y-1.5 mt-1">
                    {selectedIncident.sections.recommended_actions.map((act, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded border bg-card/60">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[9px]">
                          {idx + 1}
                        </span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
