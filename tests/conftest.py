import sys
import os

# Add the project root to the system path. 
# This allows pytest to find all modules (e.g., platform, resort_api) when run from the root.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
