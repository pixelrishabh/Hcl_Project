import { DiagnosisRecord, DatasetInfo, SensorReading, StatusResponse } from "../types"

// Determine API base URL
const isLocalFileOrDifferentPort =
  typeof window !== "undefined" &&
  (window.location.protocol === "file:" ||
    (window.location.port !== "8080" && window.location.port !== "3000"))

export const API_BASE = isLocalFileOrDifferentPort
  ? "http://localhost:8080"
  : ""

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/api/status`, { mode: "cors" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchDataset(): Promise<DatasetInfo> {
  const res = await fetch(`${API_BASE}/api/dataset`, { mode: "cors" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchDiagnoses(): Promise<DiagnosisRecord[]> {
  const res = await fetch(`${API_BASE}/api/diagnoses`, { mode: "cors" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchReadings(limit: number = 60): Promise<SensorReading[]> {
  const res = await fetch(`${API_BASE}/api/readings?limit=${limit}`, { mode: "cors" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function postMode(mode: string, submode: string = "flatline"): Promise<{ status: string; mode: string; submode: string }> {
  const res = await fetch(`${API_BASE}/api/mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, submode }),
    mode: "cors",
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Standalone Simulator Fallback for instant offline resilience
export class StandalonePhysicsSimulator {
  private mode: string = "normal"
  private submode: string = "flatline"
  private stepCount: number = 0
  private lastTemp: number = 54.2
  private lastVib: number = 1.45
  private lastPress: number = 4.52

  setMode(mode: string, submode: string = "flatline") {
    this.mode = mode
    this.submode = submode
    this.stepCount = 0
  }

  getMode() {
    return { mode: this.mode, submode: this.submode }
  }

  step(): { reading: SensorReading; detection?: { has_fault: boolean; fault_category: string; symptoms: string[]; query: string } } {
    this.stepCount++
    const now = new Date()
    const timestamp = now.toISOString().replace("T", " ").substring(0, 19)

    let temp = this.lastTemp
    let vib = this.lastVib
    let press = this.lastPress
    let faultCategory = "normal"
    const symptoms: string[] = []

    const jitter = (range: number) => (Math.random() - 0.5) * range

    switch (this.mode) {
      case "normal":
        temp = 54.0 + Math.sin(this.stepCount * 0.1) * 1.5 + jitter(0.4)
        vib = 1.4 + Math.sin(this.stepCount * 0.15) * 0.2 + jitter(0.1)
        press = 4.5 + Math.cos(this.stepCount * 0.08) * 0.1 + jitter(0.05)
        break

      case "bearing_wear":
        vib = Math.min(6.8, 1.8 + this.stepCount * 0.18 + jitter(0.4))
        temp = Math.min(74.0, 55.0 + this.stepCount * 0.35 + jitter(0.5))
        press = 4.4 + jitter(0.1)
        faultCategory = "bearing_wear"
        if (vib > 4.5) {
          symptoms.push(
            `High vibration velocity RMS ${vib.toFixed(2)} mm/s entering ISO 20816-3 (formerly ISO 10816-3) Zone C alert band (4.5-7.1 mm/s)`
          )
        }
        if (temp > 65) symptoms.push(`Bearing housing temperature elevated at ${temp.toFixed(1)} °C`)
        break

      case "overheating":
        temp = Math.min(88.0, 56.0 + this.stepCount * 0.75 + jitter(0.6))
        vib = 1.6 + jitter(0.2)
        press = 4.3 + jitter(0.1)
        faultCategory = "overheating"
        if (temp > 75.0) symptoms.push(`Stator core temperature critical at ${temp.toFixed(1)} °C (> 75.0 °C trip limit)`)
        break

      case "pressure_drop":
        press = Math.max(1.8, 4.5 - this.stepCount * 0.15 + jitter(0.1))
        temp = 56.0 + jitter(0.5)
        vib = 2.1 + (press < 3.0 ? jitter(0.6) : jitter(0.2))
        faultCategory = "pressure_drop"
        if (press < 3.0) symptoms.push(`Discharge pressure critically dropped to ${press.toFixed(2)} bar (< 3.0 bar cavitation limit)`)
        break

      case "sensor_failure":
        if (this.submode === "disconnect") {
          temp = -999.0
          vib = 1.5 + jitter(0.1)
          press = 4.5 + jitter(0.05)
          faultCategory = "sensor_failure"
          symptoms.push("RTD resistance open-circuit: returned out-of-range sentinel -999.0 °C")
        } else {
          // flatline
          temp = 52.0
          vib = 1.4
          press = 4.5
          faultCategory = "sensor_failure"
          if (this.stepCount > 5) symptoms.push("Sensor ADC zero-variance freeze detected across multiple cycles")
        }
        break
    }

    this.lastTemp = temp
    this.lastVib = vib
    this.lastPress = press

    const reading: SensorReading = {
      device_id: "pump_centrifugal_01",
      timestamp,
      temperature: parseFloat(temp.toFixed(2)),
      vibration: parseFloat(vib.toFixed(2)),
      pressure: parseFloat(press.toFixed(2)),
      mode: this.mode,
      fault_status: faultCategory,
    }

    let detection = undefined
    if (faultCategory !== "normal" && symptoms.length > 0) {
      detection = {
        has_fault: true,
        fault_category: faultCategory,
        symptoms,
        query: `${faultCategory} centrifugal pump symptoms: ${symptoms.join("; ")}`,
      }
    }

    return { reading, detection }
  }
}
