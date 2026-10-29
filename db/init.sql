-- ==============================================================================
-- IoT Fault Diagnosis Assistant - PostgreSQL Schema Initialization
-- Target Database: iot_fault_diagnosis
-- ==============================================================================
-- Note: To create the database from psql if it does not exist:
--   CREATE DATABASE iot_fault_diagnosis;
-- Connect to the database before running the table schema:
--   \c iot_fault_diagnosis
-- ==============================================================================

-- 1. Sensor Readings Table (Live Ingestion from MQTT & Sensor Simulator)
-- Stores each physical sensor reading along with timestamp and predicted fault status.
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'pump_centrifugal_01',
    temperature NUMERIC(8, 2) NOT NULL,
    vibration NUMERIC(8, 2) NOT NULL,
    pressure NUMERIC(8, 2) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    fault_status VARCHAR(64) NOT NULL DEFAULT 'normal',
    mode VARCHAR(32) NOT NULL DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sensor_readings_device_ts UNIQUE (device_id, timestamp)
);

-- Indexes for time-series range lookups, ordering, and fault classification
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
    ON sensor_readings (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_ts 
    ON sensor_readings (device_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_fault_status 
    ON sensor_readings (fault_status);


-- 2. Fault Incidents Table (Historical RAG + LLM Diagnoses)
-- Stores detailed diagnostic synthesis reports generated when anomalies are confirmed.
CREATE TABLE IF NOT EXISTS fault_incidents (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    fault_category VARCHAR(64) NOT NULL,
    symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    temperature NUMERIC(8, 2),
    vibration NUMERIC(8, 2),
    pressure NUMERIC(8, 2),
    retrieved_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    diagnosis_text TEXT,
    likely_fault TEXT,
    why TEXT,
    recommended_checks TEXT,
    confidence_limitations TEXT,
    sections JSONB NOT NULL DEFAULT '{}'::jsonb,
    runtime VARCHAR(64),
    latency_seconds DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_fault_incident_device_ts UNIQUE (device_id, timestamp)
);

-- Indexes for incident history ordering and filtering
CREATE INDEX IF NOT EXISTS idx_fault_incidents_timestamp 
    ON fault_incidents (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_fault_incidents_device_timestamp 
    ON fault_incidents (device_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_fault_incidents_category 
    ON fault_incidents (fault_category);


-- 3. Backward-Compatibility View for Telemetry Readings
CREATE OR REPLACE VIEW telemetry_readings AS
    SELECT id, timestamp, device_id, temperature, vibration, pressure, mode, created_at, fault_status
    FROM sensor_readings;


-- 4. Sensor Readings Retention Pruning Function
CREATE OR REPLACE FUNCTION prune_old_sensor_readings(retention_days INT DEFAULT 7)
RETURNS BIGINT AS $$
DECLARE
    deleted_count BIGINT;
BEGIN
    DELETE FROM sensor_readings
    WHERE timestamp < (CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Backward compatibility alias
CREATE OR REPLACE FUNCTION prune_old_telemetry(retention_days INT DEFAULT 7)
RETURNS BIGINT AS $$
BEGIN
    RETURN prune_old_sensor_readings(retention_days);
END;
$$ LANGUAGE plpgsql;

-- 5. UCI AI4I 2020 Predictive Maintenance Dataset Table
CREATE TABLE IF NOT EXISTS ai4i2020_dataset (
    udi INT PRIMARY KEY,
    product_id VARCHAR(32) NOT NULL,
    type VARCHAR(8) NOT NULL,
    air_temperature_k NUMERIC(8, 2) NOT NULL,
    process_temperature_k NUMERIC(8, 2) NOT NULL,
    rotational_speed_rpm INT NOT NULL,
    torque_nm NUMERIC(8, 2) NOT NULL,
    tool_wear_min INT NOT NULL,
    machine_failure INT NOT NULL,
    twf INT NOT NULL,
    hdf INT NOT NULL,
    pwf INT NOT NULL,
    osf INT NOT NULL,
    rnf INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai4i_machine_failure ON ai4i2020_dataset (machine_failure);
CREATE INDEX IF NOT EXISTS idx_ai4i_product_id ON ai4i2020_dataset (product_id);
