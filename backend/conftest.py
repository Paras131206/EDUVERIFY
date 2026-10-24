"""
Pytest configuration for backend test suite.
"""

import sys
from pathlib import Path

# Ensure backend and engine directories are on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

engine_dir = Path(__file__).resolve().parent.parent / "engine"
if str(engine_dir) not in sys.path:
    sys.path.insert(0, str(engine_dir))
