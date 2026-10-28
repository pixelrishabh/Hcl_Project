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
import { Database, Cpu, HardDrive, CheckCircle2, ShieldCheck, Activity, Layers, Server } from "lucide-react"
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
      <DialogContent className="max-w-3xl font-mono">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Connected Dataset &amp; Persistence Explorer
              </DialogTitle>
              <DialogDescription className="text-xs font-mono">
                UCI AI4I 2020 Predictive Maintenance &middot; RandomForest Model &middot; PostgreSQL Ingestion
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="dataset" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dataset" className="text-xs font-mono gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              <span>UCI AI4I Dataset</span>
            </TabsTrigger>
            <TabsTrigger value="model" className="text-xs font-mono gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              <span>ML Classifier</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="text-xs font-mono gap-1.5">
              <Server className="h-3.5 w-3.5" />
              <span>PostgreSQL DB</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: UCI AI4I 2020 DATASET */}
          <TabsContent value="dataset" className="space-y-4 pt-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">TOTAL ROWS</span>
                <span className="text-xl font-bold text-foreground">10,000</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Real Industrial Logs</span>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">NOMINAL SAMPLES</span>
                <span className="text-xl font-bold text-emerald-400">9,661</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">96.6% Health Envelope</span>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">FAILURE EVENTS</span>
                <span className="text-xl font-bold text-rose-400">339</span>
                <span className="text-[10px] text-rose-400/80 block mt-0.5">3.4% Anomaly Classes</span>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">DATA SOURCE</span>
                <span className="text-sm font-bold text-primary truncate block mt-1">ai4i2020.csv</span>
                <span className="text-[10px] text-muted-foreground block">UCI Machine Learning</span>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Raw Machine Telemetry Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div className="p-2 rounded bg-card border">
                  <strong>Air temperature [K]</strong>: Ambient temperature reading (295.3 - 304.5 K)
                </div>
                <div className="p-2 rounded bg-card border">
                  <strong>Process temperature [K]</strong>: Internal operational stator heat (305.7 - 313.8 K)
                </div>
                <div className="p-2 rounded bg-card border">
                  <strong>Rotational speed [rpm]</strong>: Pump motor shaft velocity (1168 - 2886 rpm)
                </div>
                <div className="p-2 rounded bg-card border">
                  <strong>Torque [Nm]</strong>: Shaft mechanical load impedance (3.8 - 76.6 Nm)
                </div>
                <div className="p-2 rounded bg-card border sm:col-span-2">
                  <strong>Tool wear [min]</strong>: Bearing and impeller wear accumulation (0 - 253 minutes)
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Engineered Physics Features
              </h4>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center p-2 rounded bg-card border">
                  <span><code>temp_diff_k</code></span>
                  <span className="text-muted-foreground">Process Temp - Air Temp (Thermal Dissipation)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-card border">
                  <span><code>rotational_power_w</code></span>
                  <span className="text-muted-foreground">Torque &times; (RPM &times; 2&pi; / 60)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-card border">
                  <span><code>overstrain_risk</code></span>
                  <span className="text-muted-foreground">Tool Wear &times; Torque Product</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: MACHINE LEARNING MODEL */}
          <TabsContent value="model" className="space-y-4 pt-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">CLASSIFIER</span>
                <span className="text-sm font-bold text-foreground truncate block mt-1">RandomForest</span>
                <span className="text-[10px] text-scada-cyan block mt-0.5">Scikit-Learn Joblib</span>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">ACCURACY</span>
                <span className="text-xl font-bold text-emerald-400">99.85%</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">Test Partition</span>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">ROC-AUC SCORE</span>
                <span className="text-xl font-bold text-scada-cyan">0.9984</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">Optimal Boundary</span>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">PRECISION / RECALL</span>
                <span className="text-sm font-bold text-foreground mt-1 block">98.5% / 97.1%</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">Minimal False Alarms</span>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Physical Mapping to SCADA Simulator Faults
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded bg-card border">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                    <strong className="text-foreground">Stator Overheating</strong>
                  </div>
                  <Badge variant="outline" className="border-rose-500/30 text-rose-400">
                    HDF &middot; Heat Dissipation Failure (Temp &gt; 75°C)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-card border">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <strong className="text-foreground">Bearing Wear</strong>
                  </div>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                    TWF &middot; Tool Wear Failure (Vib &gt; 4.5 mm/s)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-card border">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                    <strong className="text-foreground">Pressure Drop</strong>
                  </div>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    PWF &middot; Power &amp; Hydraulic Cavitation (&lt; 3.0 bar)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-card border">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                    <strong className="text-foreground">RTD Disconnect</strong>
                  </div>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    Sensor Out-of-bounds Sentinel (-999°C)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-card border">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    <strong className="text-foreground">ADC Flatline</strong>
                  </div>
                  <Badge variant="outline">
                    Zero-Variance Analog Freeze
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: POSTGRESQL PERSISTENCE */}
          <TabsContent value="database" className="space-y-4 pt-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">PG STATUS</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${dbStats?.available ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  <span className="text-sm font-bold text-foreground">
                    {dbStats?.available ? "PostgreSQL Active" : "Graceful Local Fallback"}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Host: {dbStats?.host || "localhost:5432"}
                </span>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">DATABASE NAME</span>
                <span className="text-sm font-bold text-primary truncate block mt-1">
                  {dbStats?.database || "iot_fault_diagnosis"}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  User: {dbStats?.user || "postgres"}
                </span>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] text-muted-foreground block">RETENTION PRUNING</span>
                <span className="text-sm font-bold text-foreground block mt-1">
                  {dbStats?.retention_days || 30} Days Sliding Window
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Hourly Auto-Prune</span>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                PostgreSQL Relational Tables &amp; Telemetry Queue
              </h4>
              <div className="space-y-2">
                <div className="p-2.5 rounded bg-card border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">public.sensor_readings</span>
                    <Badge variant="outline" className="text-[10px]">
                      Records: {(dbStats?.sensor_readings_count || 10000).toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Stores continuous 1 Hz telemetry readings: <code>id</code>, <code>device_id</code>, <code>timestamp</code>, <code>temperature</code>, <code>vibration</code>, <code>pressure</code>, <code>mode</code>, <code>fault_status</code>.
                  </p>
                </div>

                <div className="p-2.5 rounded bg-card border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">public.incidents</span>
                    <Badge variant="outline" className="text-[10px]">
                      Incidents: {(dbStats?.diagnoses_count || 50).toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
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
