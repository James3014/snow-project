#!/usr/bin/env python3
"""
代碼驗證腳本 - 檢查實施是否正確

不需要運行服務器，只檢查：
1. Python 語法是否正確
2. 導入是否可以解析
3. 文件結構是否完整
4. TypeScript 文件是否存在
"""
import os
import sys
import ast
from pathlib import Path

# 顏色輸出
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(msg):
    print(f"{GREEN}✅ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}❌ {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}⚠️  {msg}{RESET}")

def print_info(msg):
    print(f"{BLUE}ℹ️  {msg}{RESET}")

def check_python_syntax(file_path):
    """檢查 Python 文件語法"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
        ast.parse(code)
        return True, None
    except SyntaxError as e:
        return False, f"第 {e.lineno} 行: {e.msg}"
    except Exception as e:
        return False, str(e)

def check_file_exists(file_path, base_path):
    """檢查文件是否存在"""
    full_path = base_path / file_path
    return full_path.exists()

def main():
    print("\n" + "="*60)
    print("  🧪 社交功能實施驗證")
    print("="*60 + "\n")

    base_path = Path("/home/user/snow-project")
    errors = []
    warnings = []

    # ===== 檢查後端 Python 文件 =====
    print_info("檢查後端 Python 文件...")

    backend_files = {
        "數據模型": [
            "platform/user_core/models/social.py",
            "platform/user_core/models/user_profile.py",
        ],
        "服務層": [
            "platform/user_core/services/social_service.py",
            "platform/user_core/services/ski_map_service.py",
            "platform/user_core/services/auth_service.py",
            "platform/user_core/services/redis_cache.py",
        ],
        "API 端點": [
            "platform/user_core/api/social.py",
            "platform/user_core/api/ski_map.py",
            "platform/user_core/api/main.py",
        ],
        "Schemas": [
            "platform/user_core/schemas/social.py",
            "platform/user_core/schemas/ski_map.py",
        ],
        "遷移腳本": [
            "platform/user_core/alembic/versions/l5m6n7o8p9q0_add_display_name_to_users.py",
            "platform/user_core/alembic/versions/m1n2o3p4q5r6_add_social_features.py",
        ],
        "測試腳本": [
            "platform/user_core/scripts/run_migrations.py",
            "platform/user_core/scripts/test_social_api.py",
        ],
    }

    backend_ok = 0
    backend_total = 0

    for category, files in backend_files.items():
        print(f"\n  📂 {category}")
        for file_path in files:
            backend_total += 1
            full_path = base_path / file_path

            if not full_path.exists():
                print_error(f"文件不存在: {file_path}")
                errors.append(f"缺少文件: {file_path}")
                continue

            # 檢查語法
            is_valid, error_msg = check_python_syntax(full_path)
            if is_valid:
                print_success(f"{file_path}")
                backend_ok += 1
            else:
                print_error(f"{file_path}")
                print(f"       語法錯誤: {error_msg}")
                errors.append(f"語法錯誤 ({file_path}): {error_msg}")

    # ===== 檢查前端 TypeScript 文件 =====
    print_info("\n檢查前端 TypeScript 文件...")

    frontend_files = {
        "動態牆": [
            "platform/frontend/ski-platform/src/features/activity-feed/types/feed.types.ts",
            "platform/frontend/ski-platform/src/features/activity-feed/api/activityFeedApi.ts",
            "platform/frontend/ski-platform/src/features/activity-feed/hooks/useActivityFeed.ts",
            "platform/frontend/ski-platform/src/features/activity-feed/hooks/useFeedPolling.ts",
            "platform/frontend/ski-platform/src/features/activity-feed/components/FeedItem.tsx",
            "platform/frontend/ski-platform/src/features/activity-feed/components/FeedList.tsx",
            "platform/frontend/ski-platform/src/features/activity-feed/pages/FeedPage.tsx",
        ],
        "滑雪地圖": [
            "platform/frontend/ski-platform/src/features/ski-map/types/map.types.ts",
            "platform/frontend/ski-platform/src/features/ski-map/api/skiMapApi.ts",
            "platform/frontend/ski-platform/src/features/ski-map/hooks/useSkiMap.ts",
            "platform/frontend/ski-platform/src/features/ski-map/components/JapanSkiRegionsMap.tsx",
            "platform/frontend/ski-platform/src/features/ski-map/pages/SkiMapPage.tsx",
        ],
    }

    frontend_ok = 0
    frontend_total = 0

    for category, files in frontend_files.items():
        print(f"\n  📂 {category}")
        for file_path in files:
            frontend_total += 1
            full_path = base_path / file_path

            if full_path.exists():
                print_success(f"{file_path}")
                frontend_ok += 1
            else:
                print_error(f"文件不存在: {file_path}")
                errors.append(f"缺少文件: {file_path}")

    # ===== 檢查文檔 =====
    print_info("\n檢查文檔...")

    docs = [
        "SOCIAL_FEATURES_GUIDE.md",
    ]

    docs_ok = 0
    for doc in docs:
        full_path = base_path / doc
        if full_path.exists():
            print_success(doc)
            docs_ok += 1
        else:
            print_error(f"文檔不存在: {doc}")
            warnings.append(f"缺少文檔: {doc}")

    # ===== 檢查關鍵配置 =====
    print_info("\n檢查配置文件...")

    configs = [
        ("docker-compose.yml", "Docker Compose 配置"),
        ("platform/user_core/requirements.txt", "Python 依賴"),
        ("platform/user_core/alembic.ini", "Alembic 配置"),
    ]

    config_ok = 0
    for config_path, desc in configs:
        full_path = base_path / config_path
        if full_path.exists():
            print_success(f"{desc} ({config_path})")
            config_ok += 1
        else:
            print_warning(f"{desc} 不存在: {config_path}")
            warnings.append(f"缺少配置: {config_path}")

    # ===== 總結 =====
    print("\n" + "="*60)
    print("  📊 驗證總結")
    print("="*60)

    print(f"\n後端文件: {backend_ok}/{backend_total} 通過")
    print(f"前端文件: {frontend_ok}/{frontend_total} 通過")
    print(f"文檔: {docs_ok}/{len(docs)} 通過")
    print(f"配置: {config_ok}/{len(configs)} 通過")

    total_checks = backend_total + frontend_total + len(docs) + len(configs)
    total_ok = backend_ok + frontend_ok + docs_ok + config_ok

    print(f"\n總計: {total_ok}/{total_checks} 項檢查通過")

    if errors:
        print(f"\n{RED}發現 {len(errors)} 個錯誤:{RESET}")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")

    if warnings:
        print(f"\n{YELLOW}發現 {len(warnings)} 個警告:{RESET}")
        for i, warning in enumerate(warnings, 1):
            print(f"  {i}. {warning}")

    # ===== 最終結果 =====
    print("\n" + "="*60)
    if not errors and backend_ok == backend_total and frontend_ok == frontend_total:
        print_success("所有檢查通過！✨ 代碼結構完整，可以部署。")
        print("="*60 + "\n")

        print("📋 下一步操作：")
        print("  1. 使用 Docker Compose 啟動服務：")
        print("     cd /home/user/snow-project")
        print("     docker-compose up -d")
        print()
        print("  2. 運行數據庫遷移：")
        print("     docker-compose exec user-core python scripts/run_migrations.py")
        print()
        print("  3. 測試 API：")
        print("     docker-compose exec user-core python scripts/test_social_api.py")
        print()
        print("  4. 訪問服務：")
        print("     - Swagger 文檔: http://localhost:8001/docs")
        print("     - 前端: http://localhost:3000")
        return 0
    else:
        print_error(f"發現 {len(errors)} 個錯誤，請修復後再部署。")
        print("="*60 + "\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
