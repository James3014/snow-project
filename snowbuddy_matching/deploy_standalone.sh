#!/bin/bash
# Snowbuddy Matching Service - 獨立部署腳本

echo "🎿 Snowbuddy Matching Service - 獨立部署準備"
echo "=============================================="

# 1. 建立獨立 Git 倉庫 (可選)
read -p "是否建立獨立 Git 倉庫? (y/n): " CREATE_REPO

if [ "$CREATE_REPO" = "y" ]; then
    echo "📁 建立獨立 Git 倉庫..."
    
    # 初始化 Git
    git init
    
    # 建立 .gitignore
    cat > .gitignore << EOF
__pycache__/
*.py[cod]
*$py.class
.venv/
.env
.pytest_cache/
*.log
.DS_Store
EOF
    
    # 建立 README
    cat > README_STANDALONE.md << EOF
# Snowbuddy Matching Service

獨立部署的智慧雪伴媒合服務

## 部署配置

### 環境變數
\`\`\`env
USER_CORE_API_URL=https://user-core.zeabur.app
RESORT_SERVICES_API_URL=https://resort-api.zeabur.app  
SERVICE_TOKEN=snowbuddy-service-token
\`\`\`

### 部署命令
\`\`\`bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8002
\`\`\`

## API 端點
- GET /health - 健康檢查
- POST /searches - 發起媒合搜尋
- GET /searches/{id} - 獲取媒合結果
- POST /requests - 媒合請求管理
EOF
    
    # 提交初始版本
    git add .
    git commit -m "Initial commit: Snowbuddy Matching Service"
    
    echo "✅ 獨立 Git 倉庫已建立"
    echo "📋 下一步: 推送到 GitHub 並配置 Zeabur"
else
    echo "📋 使用主專案 Git 連結部署"
fi

# 2. 顯示部署資訊
echo ""
echo "🚀 部署資訊"
echo "============"
echo "主專案 Git: https://github.com/James3014/snow-project.git"
echo "服務路徑: /snowbuddy_matching/"
echo "端口: 8002"
echo ""
echo "🔧 Zeabur 配置"
echo "=============="
echo "Repository: https://github.com/James3014/snow-project.git"
echo "Root Directory: snowbuddy_matching"
echo "Build Command: pip install -r requirements.txt"
echo "Start Command: uvicorn app.main:app --host 0.0.0.0 --port 8002"
echo ""
echo "🌍 環境變數"
echo "==========="
echo "USER_CORE_API_URL=https://user-core.zeabur.app"
echo "RESORT_SERVICES_API_URL=https://resort-api.zeabur.app"
echo "SERVICE_TOKEN=snowbuddy-service-token"
echo ""
echo "✅ 準備完成！可以開始部署了"
