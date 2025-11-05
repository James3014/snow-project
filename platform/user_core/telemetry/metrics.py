from __future__ import annotations

from collections import defaultdict
from typing import DefaultDict, Dict, List, Optional

_timing_samples: DefaultDict[str, List[float]] = defaultdict(list)


def record_timing(metric: str, elapsed_seconds: float, threshold_seconds: Optional[float] = None) -> None:
    """Record an execution timing and emit a warning when SLA thresholds are breached."""
    _timing_samples[metric].append(elapsed_seconds)
    if threshold_seconds is not None and elapsed_seconds > threshold_seconds:
        print(
            f"WARN: SLA breach on {metric}: {elapsed_seconds:.3f}s exceeded threshold {threshold_seconds:.3f}s"
        )


def get_timings(metric: str) -> List[float]:
    """Retrieve recorded timing samples for diagnostics."""
    return list(_timing_samples.get(metric, []))
