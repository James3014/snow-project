#!/bin/bash

# 雪场识别和日期识别全面测试运行脚本

echo "=================================================="
echo "雪场识别和日期识别全面测试"
echo "=================================================="
echo ""

# 检查是否安装了 ts-node
if ! command -v ts-node &> /dev/null; then
    echo "❌ ts-node 未安装，正在安装..."
    cd platform/frontend/ski-platform
    npm install -D ts-node
    cd ../../..
fi

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 运行测试的函数
run_test() {
    local test_name=$1
    local test_file=$2

    echo ""
    echo "=================================================="
    echo "运行测试: $test_name"
    echo "=================================================="
    echo ""

    cd platform/frontend/ski-platform
    if npx ts-node --esm ../../../tests/$test_file 2>&1 | tee ../../../tests/logs/${test_file%.ts}.log; then
        echo -e "${GREEN}✅ $test_name 测试通过${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $test_name 测试失败${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    cd ../../..

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# 创建日志目录
mkdir -p tests/logs

# 运行各个测试
echo "开始运行测试套件..."
echo ""

# 测试 1: 雪场识别
run_test "雪场识别" "resort_recognition_test.ts"

# 测试 2: 日期识别
run_test "日期识别" "date_recognition_test.ts"

# 测试 3: 综合场景
run_test "对话综合场景" "conversation_integration_test.ts"

# 打印总结
echo ""
echo "=================================================="
echo "测试总结"
echo "=================================================="
echo "总测试套件数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAILED_TESTS 个测试套件失败${NC}"
    echo "详细日志请查看 tests/logs/ 目录"
    exit 1
fi
