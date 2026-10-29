"""P_311: Knowledge-Driven IoT Fault Diagnosis Assistant.

Utility script to import the UCI AI4I 2020 Predictive Maintenance Dataset
from data/ai4i2020.csv into PostgreSQL table 'ai4i2020_dataset'.

Idempotent: If records are already present in the database, it reports existing count
and avoids duplicate insertion.
"""

import csv
import logging
from pathlib import Path
import sys
import time

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from config import DATA_DIR
from database.db import get_db_connection, is_database_available

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] ImportAI4I: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("ImportAI4I")


def create_ai4i_table_if_not_exists() -> bool:
    """Ensure the ai4i2020_dataset table and indexes exist in PostgreSQL."""
    create_sql = """
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
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(create_sql)
        return True
    except Exception as e:
        logger.error(f"Failed to create ai4i2020_dataset table: {e}")
        return False


def import_dataset(csv_path: Path = DATA_DIR / "ai4i2020.csv", force: bool = False) -> int:
    """Import CSV into PostgreSQL database if not already present."""
    if not csv_path.exists():
        logger.error(f"CSV file not found at: {csv_path}")
        return 0

    if not is_database_available(force_check=True):
        logger.error("PostgreSQL database is currently unavailable. Check service/container status.")
        return 0

    if not create_ai4i_table_if_not_exists():
        return 0

    # 1. Check if records already exist
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS c FROM ai4i2020_dataset;")
                row = cur.fetchone()
                existing_count = row["c"] if row else 0

        if existing_count > 0 and not force:
            logger.info(
                f"[SKIPPED] Table 'ai4i2020_dataset' already contains {existing_count} records. "
                "Bypassing duplicate insert ('if already present then don't')."
            )
            return existing_count
    except Exception as e:
        logger.warning(f"Error checking existing table counts: {e}")

    # 2. Parse CSV
    logger.info(f"Reading records from {csv_path}...")
    records = []
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append((
                int(row["UDI"]),
                row["Product ID"].strip(),
                row["Type"].strip(),
                float(row["Air temperature [K]"]),
                float(row["Process temperature [K]"]),
                int(row["Rotational speed [rpm]"]),
                float(row["Torque [Nm]"]),
                int(row["Tool wear [min]"]),
                int(row["Machine failure"]),
                int(row["TWF"]),
                int(row["HDF"]),
                int(row["PWF"]),
                int(row["OSF"]),
                int(row["RNF"]),
            ))

    total = len(records)
    logger.info(f"Parsed {total} records from CSV. Starting batch insertion into PostgreSQL...")

    insert_sql = """
        INSERT INTO ai4i2020_dataset (
            udi, product_id, type, air_temperature_k, process_temperature_k,
            rotational_speed_rpm, torque_nm, tool_wear_min, machine_failure,
            twf, hdf, pwf, osf, rnf
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        ON CONFLICT (udi) DO NOTHING;
    """

    t0 = time.time()
    batch_size = 1000
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            for i in range(0, total, batch_size):
                cur.executemany(insert_sql, records[i:i + batch_size])

            cur.execute("SELECT COUNT(*) AS c FROM ai4i2020_dataset;")
            final_count = cur.fetchone()["c"]

    elapsed = round(time.time() - t0, 3)
    logger.info(
        f"[SUCCESS] Imported {total} records into 'ai4i2020_dataset' in {elapsed}s. "
        f"Verified total database rows: {final_count}."
    )
    return final_count


if __name__ == "__main__":
    import_dataset()
