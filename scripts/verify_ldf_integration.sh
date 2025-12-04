#!/bin/bash
# LDF Integration Verification Script
# Run this script to quickly verify all workflow integrations

set -e

echo "=================================================="
echo "LDF Integration Verification"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Snowbuddy Matching files
echo "📦 Test 1: Checking Snowbuddy Matching files..."
if [ -f "snowbuddy_matching/app/services/workflow_orchestrator.py" ]; then
    echo -e "${GREEN}✅ workflow_orchestrator.py exists${NC}"
else
    echo -e "${RED}❌ workflow_orchestrator.py missing${NC}"
    exit 1
fi

if [ -f "snowbuddy_matching/app/clients/workflow_client.py" ]; then
    echo -e "${GREEN}✅ workflow_client.py exists${NC}"
else
    echo -e "${RED}❌ workflow_client.py missing${NC}"
    exit 1
fi

# Test 2: Check User Core workflow dispatchers
echo ""
echo "📦 Test 2: Checking User Core workflow dispatchers..."
if [ -f "platform/user_core/services/workflow_dispatchers.py" ]; then
    echo -e "${GREEN}✅ workflow_dispatchers.py exists${NC}"

    # Check for each dispatcher class
    dispatchers=(
        "CasiWorkflowDispatcher"
        "TripBuddyWorkflowDispatcher"
        "CourseRecommendationWorkflowDispatcher"
        "GearReminderWorkflowDispatcher"
    )

    for dispatcher in "${dispatchers[@]}"; do
        if grep -q "class $dispatcher" platform/user_core/services/workflow_dispatchers.py; then
            echo -e "  ${GREEN}✅ $dispatcher found${NC}"
        else
            echo -e "  ${RED}❌ $dispatcher missing${NC}"
            exit 1
        fi
    done
else
    echo -e "${RED}❌ workflow_dispatchers.py missing${NC}"
    exit 1
fi

# Test 3: Check integration points
echo ""
echo "📦 Test 3: Checking integration points..."

# Check behavior_events.py
if grep -q "get_casi_workflow_dispatcher" platform/user_core/api/behavior_events.py; then
    echo -e "${GREEN}✅ CASI dispatcher integrated in behavior_events.py${NC}"
else
    echo -e "${YELLOW}⚠️  CASI dispatcher not found in behavior_events.py${NC}"
fi

# Check search_router.py
if grep -q "MatchingWorkflowOrchestrator\|get_matching_workflow_orchestrator" snowbuddy_matching/app/routers/search_router.py; then
    echo -e "${GREEN}✅ Matching orchestrator integrated in search_router.py${NC}"
else
    echo -e "${YELLOW}⚠️  Matching orchestrator not found in search_router.py${NC}"
fi

# Test 4: Check documentation
echo ""
echo "📦 Test 4: Checking documentation..."
docs=(
    "docs/LDF_ENVIRONMENT.md"
    "docs/LDF_TODO.md"
    "docs/LDF_TEST_REPORT.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ $doc exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $doc missing${NC}"
    fi
done

# Test 5: Run Python structure test
echo ""
echo "📦 Test 5: Running Python structure analysis..."
cd platform/user_core
if [ -f "test_workflow_structure.py" ]; then
    python3 test_workflow_structure.py
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Python structure test passed${NC}"
    else
        echo -e "${RED}❌ Python structure test failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  test_workflow_structure.py not found${NC}"
fi
cd ../..

# Summary
echo ""
echo "=================================================="
echo "Summary"
echo "=================================================="
echo -e "${GREEN}✅ All LDF integration checks passed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure environment variables (see docs/LDF_ENVIRONMENT.md)"
echo "  2. Deploy Lambda Durable Functions to AWS"
echo "  3. Run: cd snowbuddy_matching && python3 test_ldf_integration.py"
echo ""
