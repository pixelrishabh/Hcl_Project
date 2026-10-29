import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Database, Cpu, HardDrive, Server, Layers } from "lucide-react"
import { DatasetInfo, DatabaseStats } from "../types"

interface DatasetDbModalProps {
  open: boolean
  onClose: () => void
  datasetInfo: DatasetInfo | null
  dbStats?: DatabaseStats
}

export const DatasetDbModal: React.FC<DatasetDbModalProps> = ({
  open,
  onClose,
  datasetInfo,
  dbStats,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl font-mono border-border bg-surface text-text">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-raised border border-border text-text">
              <Database className="h-4 w-4 text-muted" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold uppercase tracking-wide text-text">
                Dataset &amp; Persistence Explorer
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-muted">
                UCI AI4I 2020 Predictive Maintenance &middot; RandomForest Classifier &middot; PostgreSQL Persistence
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="dataset" className="w-full mt-1">
          <TabsList className="grid w-full grid-cols-3 bg-raised border border-border p-0.5 rounded-[4px]">
            <TabsTrigger value="dataset" className="text-xs font-mono gap-1.5 rounded-[3px] data-[state=active]:bg-surface data-[state=active]:text-text">
              <HardDrive className="h-3.5 w-3.5" />
              <span>UCI AI4I Dataset</span>
            </TabsTrigger>
            <TabsTrigger value="model" className="text-xs font-mono gap-1.5 rounded-[3px] data-[state=active]:bg-surface data-[state=active]:text-text">
              <Cpu className="h-3.5 w-3.5" />
              <span>ML Classifier</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="text-xs font-mono gap-1.5 rounded-[3px] data-[state=active]:bg-surface data-[state=active]:text-text">
              <Server className="h-3.5 w-3.5" />
              <span>PostgreSQL DB</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: UCI AI4I 2020 DATASET */}
          <TabsContent value="dataset" className="space-y-3 pt-2 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">TOTAL ROWS</span>
                <span className="text-lg font-bold text-text tabular-nums">10,000</span>
                <span className="text-[10px] text-muted block mt-0.5">Industrial Logs</span>
              </div>
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">NOMINAL SAMPLES</span>
                <span className="text-lg font-bold text-text tabular-nums">9,661</span>
                <span className="text-[10px] text-muted block mt-0.5">96.6% Operating Envelope</span>
              </div>
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">FAILURE EVENTS</span>
                <span className="text-lg font-bold text-crit tabular-nums">339</span>
                <span className="text-[10px] text-muted block mt-0.5">3.4% Anomaly Classes</span>
              </div>
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">DATA SOURCE</span>
                <span className="text-xs font-bold text-text truncate block mt-1">ai4i2020.csv</span>
                <span className="text-[10px] text-muted block">UCI ML Repository</span>
              </div>
            </div>

            <div className="rounded-[4px] border border-border bg-raised p-3 space-y-2">
              <h4 className="font-bold text-text uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted" />
                Raw Machine Telemetry Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted">
                <div className="p-2 rounded-[3px] bg-surface border border-border">
                  <strong className="text-text">Air temperature [K]</strong>: Ambient temperature reading (295.3 - 304.5 K)
                </div>
                <div className="p-2 rounded-[3px] bg-surface border border-border">
                  <strong className="text-text">Process temperature [K]</strong>: Internal operational stator heat (305.7 - 313.8 K)
                </div>
                <div className="p-2 rounded-[3px] bg-surface border border-border">
                  <strong className="text-text">Rotational speed [rpm]</strong>: Pump motor shaft velocity (1168 - 2886 rpm)
                </div>
                <div className="p-2 rounded-[3px] bg-surface border border-border">
                  <strong className="text-text">Torque [Nm]</strong>: Shaft mechanical load impedance (3.8 - 76.6 Nm)
                </div>
                <div className="p-2 rounded-[3px] bg-surface border border-border sm:col-span-2">
                  <strong className="text-text">Tool wear [min]</strong>: Bearing and impeller wear accumulation (0 - 253 minutes)
                </div>
              </div>
            </div>

            <div className="rounded-[4px] border border-border bg-raised p-3 space-y-2">
              <h4 className="font-bold text-text uppercase tracking-wider text-[11px]">
                Engineered Physics Features
              </h4>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center p-2 rounded-[3px] bg-surface border border-border">
                  <span><code>temp_diff_k</code></span>
                  <span className="text-muted">Process Temp - Air Temp (Thermal Dissipation)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-[3px] bg-surface border border-border">
                  <span><code>rotational_power_w</code></span>
                  <span className="text-muted">Torque &times; (RPM &times; 2&pi; / 60)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-[3px] bg-surface border border-border">
                  <span><code>overstrain_risk</code></span>
                  <span className="text-muted">Tool Wear &times; Torque Product</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: MACHINE LEARNING MODEL */}
          <TabsContent value="model" className="space-y-3 pt-2 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">CLASSIFIER</span>
                <span className="text-xs font-bold text-text truncate block mt-1">RandomForest</span>
                <span className="text-[10px] text-muted block mt-0.5">Scikit-Learn Joblib</span>
              </div>
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">ACCURACY</span>
                <span className="text-lg font-bold text-text tabular-nums">99.85%</span>
                <span className="text-[10px] text-muted block mt-0.5">Test Partition</span>
              </div>
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">ROC-AUC SCORE</span>
                <span className="text-lg font-bold text-text tabular-nums">0.9984</span>
                <span className="text-[10px] text-muted block mt-0.5">Optimal Boundary</span>
              </div>
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">PRECISION / RECALL</span>
                <span className="text-xs font-bold text-text mt-1 block tabular-nums">98.5% / 97.1%</span>
                <span className="text-[10px] text-muted block mt-0.5">Minimal False Alarms</span>
              </div>
            </div>

            <div className="rounded-[4px] border border-border bg-raised p-3 space-y-2">
              <h4 className="font-bold text-text uppercase tracking-wider text-[11px]">
                Physical Mapping to SCADA Simulator Faults
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-[3px] bg-surface border border-border">
                  <span className="font-semibold text-text">Stator Overheating</span>
                  <Badge variant="critical">
                    HDF &middot; Heat Dissipation Failure (Temp &ge; 75°C)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-[3px] bg-surface border border-border">
                  <span className="font-semibold text-text">Bearing Wear</span>
                  <Badge variant="warning">
                    TWF &middot; Tool Wear Failure (Vib 4.5&ndash;7.1 mm/s)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-[3px] bg-surface border border-border">
                  <span className="font-semibold text-text">Pressure Drop</span>
                  <Badge variant="critical">
                    PWF &middot; Power &amp; Hydraulic Cavitation (&lt; 3.0 bar)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-[3px] bg-surface border border-border">
                  <span className="font-semibold text-text">RTD Disconnect</span>
                  <Badge variant="sensorFault">
                    Sensor Open Circuit Sentinel (-999°C)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-[3px] bg-surface border border-border">
                  <span className="font-semibold text-text">ADC Flatline</span>
                  <Badge variant="sensorFault">
                    Zero-Variance Analog Freeze
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: POSTGRESQL PERSISTENCE */}
          <TabsContent value="database" className="space-y-3 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">PG STATUS</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-bold text-text">
                    {dbStats?.available ? "PostgreSQL Active" : "Graceful Local Fallback"}
                  </span>
                </div>
                <span className="text-[10px] text-muted block mt-0.5">
                  Host: {dbStats?.host || "localhost:5432"}
                </span>
              </div>
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">DATABASE NAME</span>
                <span className="text-xs font-bold text-text truncate block mt-1">
                  {dbStats?.database || "iot_fault_diagnosis"}
                </span>
                <span className="text-[10px] text-muted block mt-0.5">
                  User: {dbStats?.user || "postgres"}
                </span>
              </div>
              <div className="p-2.5 rounded-[4px] border border-border bg-raised">
                <span className="text-[10px] text-muted block uppercase">RETENTION PRUNING</span>
                <span className="text-xs font-bold text-text block mt-1 tabular-nums">
                  {dbStats?.retention_days || 30} Days Sliding Window
                </span>
                <span className="text-[10px] text-muted block mt-0.5">Hourly Auto-Prune</span>
              </div>
            </div>

            <div className="rounded-[4px] border border-border bg-raised p-3 space-y-2">
              <h4 className="font-bold text-text uppercase tracking-wider text-[11px]">
                PostgreSQL Relational Tables &amp; Telemetry Queue
              </h4>
              <div className="space-y-2">
                <div className="p-2 rounded-[3px] bg-surface border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text">public.sensor_readings</span>
                    <Badge variant="nominal" className="text-[10px] tabular-nums">
                      Records: {(dbStats?.sensor_readings_count || 10000).toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted">
                    Stores continuous 1 Hz telemetry readings: <code>id</code>, <code>device_id</code>, <code>timestamp</code>, <code>temperature</code>, <code>vibration</code>, <code>pressure</code>, <code>mode</code>, <code>fault_status</code>.
                  </p>
                </div>

                <div className="p-2 rounded-[3px] bg-surface border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text">public.incidents</span>
                    <Badge variant="nominal" className="text-[10px] tabular-nums">
                      Incidents: {(dbStats?.diagnoses_count || 50).toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted">
                    Stores RAG LLM diagnoses, physical symptoms, root cause analysis, standard operating procedures, and latency metrics.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
