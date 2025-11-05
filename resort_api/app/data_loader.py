import yaml
from pathlib import Path
from typing import Dict, List

from .models import Resort

def load_resort_data(data_path: Path) -> Dict[str, Resort]:
    """
    Scans the specified data path for YAML files, loads, validates,
    and returns them as a dictionary of Resort objects.
    """
    resorts: Dict[str, Resort] = {}
    if not data_path.is_dir():
        print(f"Error: Data path {data_path} is not a valid directory.")
        return resorts

    for yaml_file in data_path.rglob('*.yaml'):
        print(f"Processing file: {yaml_file.name}")
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if not data or 'resort_id' not in data:
                    print(f"Warning: Skipping {yaml_file.name} because it is empty or missing a resort_id.")
                    continue
                
                resort = Resort(**data)
                if resort.resort_id in resorts:
                    print(f"Warning: Duplicate resort_id '{resort.resort_id}' found in {yaml_file.name}. Overwriting.")
                resorts[resort.resort_id] = resort

        except yaml.YAMLError as e:
            print(f"Error parsing YAML file {yaml_file.name}: {e}")
        except Exception as e:
            # Pydantic validation errors will be caught here
            print(f"Error validating data from {yaml_file.name}: {e}")
            
    print(f"Successfully loaded {len(resorts)} resorts.")
    return resorts

