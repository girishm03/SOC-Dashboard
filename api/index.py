import sys
import os

# Set up paths so backend modules can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(parent_dir, "backend")

for p in [backend_dir, parent_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from main import app
