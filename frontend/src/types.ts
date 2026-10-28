export interface SensorReading {
  device_id: string
  timestamp: string
  temperature: number
  vibration: number
  pressure: number
  mode?: string
  fault_status?: string
}

export interface RetrievedSource {
  source: string
  section: string
  score: number
}

export interface DiagnosisRecord {
  timestamp: string
  device_id: string
  fault_category: string
  symptoms: string[]
  readings: {
    temperature: number
    vibration: number
    pressure: number
  }
  retrieved_sources?: RetrievedSource[]
  diagnosis_text?: string
  sections?: {
    fault_summary?: string
    root_cause?: string
    recommended_actions?: string[]
    severity?: string
    urgency?: string
  }
  runtime?: string
  latency_seconds?: number
}

export interface DatabaseStats {
  available: boolean
  status: string
  sensor_readings_count?: number
  diagnoses_count?: number
  host?: string
  port?: number
  database?: string
  user?: string
  retention_days?: number
}

export interface DatasetInfo {
  dataset_name: string
  source: string
  total_records: number
  nominal_samples: number
  failure_samples: number
  features: string[]
  engineered_features: Array<{ name: string; formula: string }>
  model: {
    type: string
    path: string
    accuracy: number
    precision: number
    recall: number
    roc_auc: number
  }
  physical_mapping: Record<string, string>
  database?: DatabaseStats
}

export interface StatusResponse {
  mode: string
  submode?: string
  latest_reading?: SensorReading
  history?: SensorReading[]
  latest_diagnosis?: DiagnosisRecord
  total_diagnoses?: number
  llm_runtime?: string
  database?: DatabaseStats
  dataset?: {
    name: string
    records: number
    ml_model: string
    accuracy: number
    roc_auc: number
    failure_modes: string[]
  }
}
