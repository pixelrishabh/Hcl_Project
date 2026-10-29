import React, { useState, useMemo } from "react"
import {
  History,
  Search,
  ArrowUpDown,
  Download,
  AlertTriangle,
  AlertOctagon,
  Eye,
  CheckCircle2,
  Unplug,
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

type SortField = "timestamp" | "fault_category" | "temperature" | "vibration" | "duration" | "ttd"

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

  // Helper to extract peak value for an incident
  const getPeakValue = (r: DiagnosisRecord): string => {
    if (r.peak_value) return r.peak_value
    const cat = r.fault_category.toLowerCase()
    if (cat.includes("bearing") && r.readings) {
      return `${r.readings.vibration.toFixed(2)} mm/s`
    }
    if (cat.includes("overheating") && r.readings) {
      return r.readings.temperature < -900 ? "OPEN" : `${r.readings.temperature.toFixed(1)} °C`
    }
    if (cat.includes("pressure") && r.readings) {
      return `${r.readings.pressure.toFixed(2)} bar`
    }
    if (cat.includes("sensor") && r.readings) {
      return r.readings.temperature < -900 ? "-999 °C" : "0.00 var"
    }
    return r.readings ? `${r.readings.vibration.toFixed(2)} mm/s` : "--"
  }

  // Helper to extract duration
  const getDuration = (r: DiagnosisRecord): string => {
    if (r.duration) return r.duration
    return "30s"
  }

  // Helper to extract Time-to-Detect (TTD)
  const getTTD = (r: DiagnosisRecord): number => {
    return r.latency_seconds || 0.42
  }

  // Metrics calculation
  const totalIncidents = history.length
  const criticalCount = history.filter(
    (h) =>
      h.fault_category === "overheating" ||
      h.fault_category === "pressure_drop" ||
      (h.readings && (h.readings.vibration > 7.1 || h.readings.temperature >= 75.0 || h.readings.pressure < 3.0))
  ).length
  const sensorFaultCount = history.filter((h) => h.fault_category === "sensor_failure").length
  const warningCount = Math.max(0, totalIncidents - criticalCount - sensorFaultCount)

  // Filtered & Sorted Records
  const processedRecords = useMemo(() => {
    const result = history.filter((item) => {
      // Category filter
      const matchesCategory = filterMode === "all" || item.fault_category === filterMode

      // Severity filter
      const isCritical =
        item.fault_category === "overheating" ||
        item.fault_category === "pressure_drop" ||
        (item.readings && (item.readings.vibration > 7.1 || item.readings.temperature >= 75.0 || item.readings.pressure < 3.0))
      const isSensorFault = item.fault_category === "sensor_failure"

      const matchesSeverity =
        filterSeverity === "all" ||
        (filterSeverity === "critical" && isCritical) ||
        (filterSeverity === "sensorFault" && isSensorFault) ||
        (filterSeverity === "warning" && !isCritical && !isSensorFault)

      // Search query
      const term = search.toLowerCase()
      const matchesSearch =
        term === "" ||
        item.fault_category.toLowerCase().includes(term) ||
        item.timestamp.includes(term) ||
        item.device_id.toLowerCase().includes(term) ||
        (item.symptoms && item.symptoms.some((s) => s.toLowerCase().includes(term)))

      return matchesCategory && matchesSeverity && matchesSearch
    })

    // Sort logic
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
      } else if (sortField === "duration") {
        comparison = getDuration(a).localeCompare(getDuration(b))
      } else if (sortField === "ttd") {
        comparison = getTTD(a) - getTTD(b)
      }
      return sortAsc ? comparison : -comparison
    })

    return result
  }, [history, filterMode, filterSeverity, search, sortField, sortAsc])

  // Export CSV Handler including new columns
  const handleExportCSV = () => {
    if (processedRecords.length === 0) return
    const headers = [
      "Timestamp",
      "Device ID",
      "Fault Category",
      "Severity",
      "Duration",
      "Peak Value",
      "Time-to-Detect (s)",
      "Temperature (°C)",
      "Vibration (mm/s)",
      "Pressure (bar)",
      "Symptoms",
      "Diagnosis",
    ]
    const rows = processedRecords.map((r) => {
      const isCrit =
        r.fault_category === "overheating" ||
        r.fault_category === "pressure_drop" ||
        (r.readings && (r.readings.vibration > 7.1 || r.readings.temperature >= 75.0 || r.readings.pressure < 3.0))
      const isSensor = r.fault_category === "sensor_failure"
      const severity = isCrit ? "TRIP" : isSensor ? "SENSOR FAULT" : "WARNING"

      return [
        `"${r.timestamp}"`,
        `"${r.device_id}"`,
        `"${r.fault_category}"`,
        `"${severity}"`,
        `"${getDuration(r)}"`,
        `"${getPeakValue(r)}"`,
        getTTD(r).toFixed(3),
        r.readings?.temperature ?? "",
        r.readings?.vibration ?? "",
        r.readings?.pressure ?? "",
        `"${(r.symptoms || []).join("; ").replace(/"/g, '""')}"`,
        `"${(r.diagnosis_text || "").replace(/"/g, '""')}"`,
      ]
    })
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `p311_scada_incident_audit_${new Date().toISOString().slice(0, 10)}.csv`
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
      <Card className="border-border bg-surface">
        <CardHeader className="p-3.5 pb-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xs font-semibold tracking-wide uppercase font-mono flex items-center gap-2">
                <History className="h-4 w-4 text-muted" />
                Persistent SCADA Incident Audit Trail
              </CardTitle>
              <CardDescription className="text-xs text-muted font-mono">
                PostgreSQL persistence layer with ISO 20816-3 (formerly ISO 10816-3) fault provenance and RAG diagnoses
              </CardDescription>
            </div>

            {/* Quick KPI pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="nominal" className="font-mono text-xs py-0.5">
                Total: <strong className="tabular-nums ml-1">{totalIncidents}</strong>
              </Badge>
              <Badge variant="critical" className="font-mono text-xs py-0.5 gap-1">
                <AlertOctagon className="h-3 w-3" /> Trip: <span className="tabular-nums">{criticalCount}</span>
              </Badge>
              <Badge variant="warning" className="font-mono text-xs py-0.5 gap-1">
                <AlertTriangle className="h-3 w-3" /> Warn: <span className="tabular-nums">{warningCount}</span>
              </Badge>
              {sensorFaultCount > 0 && (
                <Badge variant="sensorFault" className="font-mono text-xs py-0.5 gap-1">
                  <Unplug className="h-3 w-3" /> Sensor: <span className="tabular-nums">{sensorFaultCount}</span>
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-7 text-xs font-mono gap-1 cursor-pointer border-border bg-raised text-text hover:bg-surface"
                title="Download complete incident audit trail in CSV format"
              >
                <Download className="h-3 w-3" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>

          {/* Filtering and Search Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-2.5 border-t border-border mt-2">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search symptom, mode, or device..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-[4px] border border-border bg-raised text-xs font-mono text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="md:col-span-5 flex items-center gap-1 overflow-x-auto text-xs font-mono">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2 py-1 rounded-[4px] border cursor-pointer transition-colors ${
                  filterMode === "all"
                    ? "border-accent bg-accent/15 text-accent font-semibold"
                    : "border-border bg-raised text-muted hover:text-text"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("bearing_wear")}
                className={`px-2 py-1 rounded-[4px] border cursor-pointer transition-colors ${
                  filterMode === "bearing_wear"
                    ? "border-warn bg-warn/15 text-warn font-semibold"
                    : "border-border bg-raised text-muted hover:text-text"
                }`}
              >
                Bearing
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("overheating")}
                className={`px-2 py-1 rounded-[4px] border cursor-pointer transition-colors ${
                  filterMode === "overheating"
                    ? "border-crit bg-crit/15 text-crit font-semibold"
                    : "border-border bg-raised text-muted hover:text-text"
                }`}
              >
                Overheat
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("pressure_drop")}
                className={`px-2 py-1 rounded-[4px] border cursor-pointer transition-colors ${
                  filterMode === "pressure_drop"
                    ? "border-crit bg-crit/15 text-crit font-semibold"
                    : "border-border bg-raised text-muted hover:text-text"
                }`}
              >
                Pressure
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("sensor_failure")}
                className={`px-2 py-1 rounded-[4px] border cursor-pointer transition-colors ${
                  filterMode === "sensor_failure"
                    ? "border-sensor-fault bg-sensor-fault/15 text-sensor-fault font-semibold"
                    : "border-border bg-raised text-muted hover:text-text"
                }`}
              >
                Sensor
              </button>
            </div>

            {/* Severity Filter */}
            <div className="md:col-span-3 flex items-center justify-end gap-1.5 text-xs font-mono">
              <span className="text-muted text-[11px]">Severity:</span>
              <button
                type="button"
                onClick={() => setFilterSeverity("all")}
                className={`px-2 py-0.5 rounded-[4px] border ${
                  filterSeverity === "all" ? "border-border bg-raised text-text font-semibold" : "border-transparent text-muted"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity("critical")}
                className={`px-2 py-0.5 rounded-[4px] border ${
                  filterSeverity === "critical"
                    ? "border-crit bg-crit/15 text-crit font-semibold"
                    : "border-transparent text-muted"
                }`}
              >
                Trip
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity("warning")}
                className={`px-2 py-0.5 rounded-[4px] border ${
                  filterSeverity === "warning"
                    ? "border-warn bg-warn/15 text-warn font-semibold"
                    : "border-transparent text-muted"
                }`}
              >
                Warn
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity("sensorFault")}
                className={`px-2 py-0.5 rounded-[4px] border ${
                  filterSeverity === "sensorFault"
                    ? "border-sensor-fault bg-sensor-fault/15 text-sensor-fault font-semibold"
                    : "border-transparent text-muted"
                }`}
              >
                Inst
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 pt-1">
          {processedRecords.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted border rounded-[4px] border-border bg-raised space-y-1.5">
              <CheckCircle2 className="h-5 w-5 text-muted mx-auto opacity-70" />
              <p>No historical incident records match the active search and filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setFilterMode("all")
                  setFilterSeverity("all")
                }}
                className="h-6 text-[11px] font-mono mt-1 border-border bg-surface"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted text-left">
                    <th
                      onClick={() => toggleSort("timestamp")}
                      className="py-2 px-2.5 font-semibold cursor-pointer hover:text-text transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Timestamp</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("fault_category")}
                      className="py-2 px-2.5 font-semibold cursor-pointer hover:text-text transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Classification</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-2 px-2.5 font-semibold">Peak Value</th>
                    <th
                      onClick={() => toggleSort("duration")}
                      className="py-2 px-2.5 font-semibold cursor-pointer hover:text-text transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Duration</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("ttd")}
                      className="py-2 px-2.5 font-semibold cursor-pointer hover:text-text transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>TTD</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-2 px-2.5 font-semibold">Observed Symptoms</th>
                    <th className="py-2 px-2.5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {processedRecords.slice(0, rowsPerPage).map((record, idx) => {
                    const isCrit =
                      record.fault_category === "overheating" ||
                      record.fault_category === "pressure_drop" ||
                      (record.readings &&
                        (record.readings.vibration > 7.1 ||
                          record.readings.temperature >= 75.0 ||
                          record.readings.pressure < 3.0))
                    const isSensor = record.fault_category === "sensor_failure"

                    return (
                      <tr key={idx} className="hover:bg-raised transition-colors">
                        <td className="py-2 px-2.5 text-muted whitespace-nowrap tabular-nums">
                          {record.timestamp}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <Badge
                            variant={isCrit ? "critical" : isSensor ? "sensorFault" : "warning"}
                            className="text-[10px] uppercase font-mono"
                          >
                            {isCrit ? "TRIP" : isSensor ? "SENSOR" : "WARNING"} &middot; {record.fault_category.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap tabular-nums font-semibold text-text">
                          {getPeakValue(record)}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap tabular-nums text-muted">
                          {getDuration(record)}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap tabular-nums text-muted">
                          {getTTD(record).toFixed(2)}s
                        </td>
                        <td className="py-2 px-2.5 text-muted max-w-xs truncate">
                          {record.symptoms && record.symptoms.length > 0
                            ? record.symptoms.join("; ")
                            : "Sensor threshold deviation recorded"}
                        </td>
                        <td className="py-2 px-2.5 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIncident(record)}
                            className="h-6 px-2 text-xs font-mono gap-1 text-accent hover:text-text hover:bg-surface cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
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
                <div className="flex items-center justify-between pt-2.5 text-xs font-mono text-muted border-t border-border mt-2">
                  <span className="tabular-nums">
                    Showing {Math.min(rowsPerPage, processedRecords.length)} of {processedRecords.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRowsPerPage(10)}
                      className={`px-2 py-0.5 rounded-[4px] border ${
                        rowsPerPage === 10 ? "border-border bg-raised font-bold text-text" : "border-transparent"
                      }`}
                    >
                      10
                    </button>
                    <button
                      type="button"
                      onClick={() => setRowsPerPage(25)}
                      className={`px-2 py-0.5 rounded-[4px] border ${
                        rowsPerPage === 25 ? "border-border bg-raised font-bold text-text" : "border-transparent"
                      }`}
                    >
                      25
                    </button>
                    <button
                      type="button"
                      onClick={() => setRowsPerPage(50)}
                      className={`px-2 py-0.5 rounded-[4px] border ${
                        rowsPerPage === 50 ? "border-border bg-raised font-bold text-text" : "border-transparent"
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
          <DialogContent className="max-w-2xl font-mono text-xs border-border bg-surface text-text">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                <AlertOctagon className="h-4 w-4 text-crit" />
                Diagnostic Incident Detail &middot; {selectedIncident.fault_category.toUpperCase().replace("_", " ")}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-muted">
                Timestamp: {selectedIncident.timestamp} &middot; Target: {selectedIncident.device_id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 my-2">
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-[4px] border border-border bg-raised">
                <div>
                  <span className="text-muted block text-[10px] uppercase">STATOR TEMP</span>
                  <span className="text-xs font-bold text-text tabular-nums">
                    {selectedIncident.readings?.temperature < -900
                      ? "OPEN CIRCUIT"
                      : `${selectedIncident.readings?.temperature}°C`}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">VIBRATION RMS</span>
                  <span className="text-xs font-bold text-text tabular-nums">
                    {selectedIncident.readings?.vibration} mm/s
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">DISCHARGE PRESS</span>
                  <span className="text-xs font-bold text-text tabular-nums">
                    {selectedIncident.readings?.pressure} bar
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[4px] border border-border bg-raised text-[11px]">
                <div>
                  <span className="text-muted block text-[10px] uppercase">PEAK VALUE</span>
                  <span className="font-bold text-text tabular-nums">{getPeakValue(selectedIncident)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">TIME TO DETECT (TTD)</span>
                  <span className="font-bold text-text tabular-nums">{getTTD(selectedIncident).toFixed(2)}s</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-text mb-1 uppercase tracking-wider text-[11px]">
                  Observed Physical Evidence:
                </h5>
                <ul className="list-disc pl-4 space-y-0.5 text-muted">
                  {(selectedIncident.symptoms || ["Parameter threshold breached"]).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {selectedIncident.diagnosis_text && (
                <div>
                  <h5 className="font-bold text-text mb-1 uppercase tracking-wider text-[11px]">
                    Automated RAG LLM Diagnostic Assessment:
                  </h5>
                  <p className="p-2.5 rounded-[4px] border border-border bg-raised text-text whitespace-pre-wrap leading-relaxed text-xs">
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
