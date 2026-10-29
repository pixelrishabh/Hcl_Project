"""P_311: Knowledge-Driven IoT Fault Diagnosis Assistant.

Data persistence module package.
Re-exports repository methods from db.repository.
"""

from db.repository import (
    get_ai4i_dataset_stats,
    get_database_stats,
    get_db_stats,
    get_recent_diagnoses,
    get_recent_sensor_readings,
    insert_diagnosis,
    insert_sensor_reading,
    insert_sensor_readings_batch,
    insert_telemetry_batch,
    is_database_available,
    prune_old_sensor_readings,
    prune_old_telemetry,
)

__all__ = [
    "is_database_available",
    "insert_diagnosis",
    "get_recent_diagnoses",
    "insert_sensor_reading",
    "insert_sensor_readings_batch",
    "insert_telemetry_batch",
    "get_recent_sensor_readings",
    "prune_old_sensor_readings",
    "prune_old_telemetry",
    "get_database_stats",
    "get_db_stats",
    "get_ai4i_dataset_stats",
]
