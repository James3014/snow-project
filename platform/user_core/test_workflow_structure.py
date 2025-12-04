#!/usr/bin/env python3
"""Test workflow dispatcher structure without full dependency tree."""
import ast
import sys
from pathlib import Path

def analyze_workflow_file():
    """Analyze workflow_dispatchers.py structure."""
    print("🔍 Analyzing Workflow Dispatcher Structure\n")
    print("=" * 60)

    file_path = Path(__file__).parent / "services" / "workflow_dispatchers.py"

    with open(file_path) as f:
        source = f.read()

    tree = ast.parse(source)

    # Find all classes
    classes = []
    functions = []

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            methods = [m.name for m in node.body if isinstance(m, ast.FunctionDef)]
            classes.append({
                'name': node.name,
                'methods': methods,
                'line': node.lineno
            })
        elif isinstance(node, ast.FunctionDef) and node.col_offset == 0:
            functions.append({
                'name': node.name,
                'line': node.lineno
            })

    print("\n📦 Classes Found:")
    for cls in classes:
        if 'Dispatcher' in cls['name']:
            print(f"\n  {cls['name']} (line {cls['line']})")
            for method in cls['methods']:
                if not method.startswith('_'):
                    print(f"    • {method}()")

    print("\n\n🔧 Factory Functions:")
    for func in functions:
        if func['name'].startswith('get_'):
            print(f"  • {func['name']}() (line {func['line']})")

    # Check TODO items completion
    print("\n\n✅ LDF TODO Completion Check:")
    print("=" * 60)

    todo_items = {
        "P0: Snowbuddy Matching Workflow": "MatchingWorkflowOrchestrator",
        "P1: CASI Skill Sync Workflow": "CasiWorkflowDispatcher",
        "P1: TripBuddy Request Workflow": "TripBuddyWorkflowDispatcher",
        "P2: Course Recommendation Workflow": "CourseRecommendationWorkflowDispatcher",
        "P2: Gear Reminder Workflow": "GearReminderWorkflowDispatcher"
    }

    class_names = [cls['name'] for cls in classes]

    for priority, class_name in todo_items.items():
        if any(class_name in cn for cn in class_names):
            print(f"  ✅ {priority}")
        else:
            print(f"  ❌ {priority} (missing {class_name})")

    # Check integration points
    print("\n\n🔗 Integration Points:")
    print("=" * 60)

    # Check behavior_events.py
    behavior_file = Path(__file__).parent / "api" / "behavior_events.py"
    if behavior_file.exists():
        with open(behavior_file) as f:
            behavior_src = f.read()
            if "get_casi_workflow_dispatcher" in behavior_src:
                print("  ✅ CASI dispatcher integrated in behavior_events.py")
            else:
                print("  ❌ CASI dispatcher NOT found in behavior_events.py")

    # Check snowbuddy_matching search_router.py
    matching_file = Path(__file__).parent.parent.parent / "snowbuddy_matching" / "app" / "routers" / "search_router.py"
    if matching_file.exists():
        with open(matching_file) as f:
            matching_src = f.read()
            if "MatchingWorkflowOrchestrator" in matching_src or "get_matching_workflow_orchestrator" in matching_src:
                print("  ✅ Matching orchestrator integrated in search_router.py")
            else:
                print("  ❌ Matching orchestrator NOT found in search_router.py")

    print("\n\n📊 Summary:")
    print("=" * 60)
    print(f"  Total Dispatcher Classes: {len([c for c in classes if 'Dispatcher' in c['name']])}")
    print(f"  Total Factory Functions: {len([f for f in functions if f['name'].startswith('get_')])}")
    print(f"  Lines of Code: {len(source.splitlines())}")

    print("\n✅ Structure analysis complete!")
    return True

if __name__ == "__main__":
    try:
        analyze_workflow_file()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
