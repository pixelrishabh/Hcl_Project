"""P_311: Knowledge-Driven IoT Fault Diagnosis Assistant.

Database connection manager for PostgreSQL persistence layer.
Handles connections, circuit breaking for offline Docker states, and health checks.
Re-exports unified database connection functions from database.db.
"""

from database.db import (
    get_connection_params,
    is_database_available,
    get_db_connection,
)

__all__ = [
    "get_connection_params",
    "is_database_available",
    "get_db_connection",
]
