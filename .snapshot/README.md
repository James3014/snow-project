# .snapshot - Agent 自動讀取資料目錄

## 📋 目的
此目錄包含 agent 每次開啟時需要自動讀取的關鍵資料，確保 agent 能快速了解專案現狀。

## 📁 目錄結構
```
.snapshot/
├── README.md              # 本說明文件
├── project_overview.md    # 專案總覽
├── current_status.md      # 當前狀態
├── architecture.md        # 系統架構
├── recent_changes.md      # 最近變更
└── next_priorities.md     # 下一步優先事項
```

## 🔄 更新頻率
- **project_overview.md**: 重大功能變更時更新
- **current_status.md**: 每週更新或重要里程碑時更新
- **architecture.md**: 架構變更時更新
- **recent_changes.md**: 每次重要提交後更新
- **next_priorities.md**: 每次規劃會議後更新

## 📖 使用方式
Agent 啟動時會自動讀取這些文件，快速獲得專案脈絡，無需重複詢問基礎資訊。
