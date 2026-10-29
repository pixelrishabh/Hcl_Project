"""Capture ISA-101 SCADA Dashboard screenshots across themes and fault modes."""

import functools
import http.server
import os
from pathlib import Path
import shutil
import socketserver
import subprocess
import threading
import time

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DASHBOARD_DIR = PROJECT_ROOT / "dashboard"
SCREENSHOTS_DIR = PROJECT_ROOT / "docs" / "screenshots"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

ARTIFACT_DIR = Path(r"C:\Users\Rishabh\.gemini\antigravity\brain\1fdf87af-d629-4a60-88f2-935283b245b0")
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

CHROME_BIN = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TEMP_PROFILE = r"C:\Users\Rishabh\AppData\Local\Temp\chrome_scada_profile"
PORT = 8999

CASES = [
    {
        "name": "dashboard-dark-normal.png",
        "url_param": "mode=normal&theme=dark",
        "title": "Dark Theme - Normal Operating State",
    },
    {
        "name": "dashboard-light-normal.png",
        "url_param": "mode=normal&theme=light",
        "title": "Light Theme - Normal Operating State",
    },
    {
        "name": "dashboard-fault-bearing-wear.png",
        "url_param": "mode=bearing_wear&theme=dark",
        "title": "Bearing Wear Fault Mode (Zone C Alert)",
    },
    {
        "name": "dashboard-fault-stator-overheating.png",
        "url_param": "mode=overheating&theme=dark",
        "title": "Stator Overheating Fault Mode (Thermal Trip)",
    },
    {
        "name": "dashboard-fault-pressure-drop.png",
        "url_param": "mode=pressure_drop&theme=dark",
        "title": "Pressure Drop Fault Mode (Cavitation Trip)",
    },
    {
        "name": "dashboard-fault-rtd-disconnect.png",
        "url_param": "mode=sensor_failure&submode=disconnect&theme=dark",
        "title": "RTD Disconnect Fault Mode (Sensor Fault Sentinel)",
    },
    {
        "name": "dashboard-fault-adc-flatline.png",
        "url_param": "mode=sensor_failure&submode=flatline&theme=dark",
        "title": "ADC Flatline Fault Mode (Zero-Variance Freeze)",
    },
]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def capture_all():
    print(f"Starting static dashboard server from: {DASHBOARD_DIR}")
    handler = functools.partial(QuietHandler, directory=str(DASHBOARD_DIR))
    server = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    base_url = f"http://127.0.0.1:{PORT}/index.html"

    try:
        for idx, item in enumerate(CASES, 1):
            filename = item["name"]
            param = item["url_param"]
            target_url = f"{base_url}?{param}"
            output_file = SCREENSHOTS_DIR / filename

            print(f"[{idx}/{len(CASES)}] Capturing: {item['title']} -> {filename}...")

            cmd = [
                CHROME_BIN,
                "--headless=new",
                "--no-sandbox",
                "--disable-gpu",
                "--window-size=1440,960",
                "--virtual-time-budget=5000",
                f"--user-data-dir={TEMP_PROFILE}_{filename}",
                f"--screenshot={str(output_file)}",
                target_url,
            ]

            res = subprocess.run(cmd, capture_output=True, text=True)
            if output_file.exists():
                size_kb = output_file.stat().st_size / 1024
                print(f"  -> Saved {output_file.name} ({size_kb:.1f} KB)")
                # Copy to artifact directory
                artifact_file = ARTIFACT_DIR / filename
                shutil.copy2(output_file, artifact_file)
            else:
                print(f"  -> ERROR: Failed to capture {filename}: {res.stderr}")

        print("\nAll screenshots captured and saved to docs/screenshots/ and brain artifact directory!")
    finally:
        server.shutdown()


if __name__ == "__main__":
    capture_all()
