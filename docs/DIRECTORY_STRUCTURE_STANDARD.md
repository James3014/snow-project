# 統一目錄結構規範

## 🎯 目標
標準化所有服務的目錄結構，提升程式碼可維護性和開發效率。

## 📁 標準目錄結構

### 後端服務標準結構
```
services/{service-name}/
├── app/                    # 應用程式碼
│   ├── main.py            # 應用入口點
│   ├── models/            # 資料模型
│   ├── services/          # 業務邏輯
│   ├── repositories/      # 資料存取層
│   └── utils/             # 工具函數
├── tests/                 # 測試程式碼
│   ├── unit/              # 單元測試
│   ├── integration/       # 整合測試
│   └── fixtures/          # 測試資料
├── docs/                  # 文檔
│   ├── README.md          # 服務說明
│   ├── API.md             # API 文檔
│   └── DEPLOYMENT.md      # 部署指南
├── requirements.txt       # Python 依賴
├── Dockerfile            # 容器配置
└── .env.example          # 環境變數範例
```

### 前端模組標準結構
```
platform/frontend/{module-name}/
├── src/                   # 源碼
│   ├── components/        # React 組件
│   ├── hooks/             # 自定義 Hooks
│   ├── services/          # API 服務
│   ├── store/             # 狀態管理
│   ├── types/             # TypeScript 類型
│   └── utils/             # 工具函數
├── tests/                 # 測試程式碼
│   ├── components/        # 組件測試
│   ├── hooks/             # Hook 測試
│   └── __mocks__/         # Mock 資料
├── public/                # 靜態資源
├── package.json          # 依賴配置
└── tsconfig.json         # TypeScript 配置
```

## 🔧 實作計劃

### Phase 1: 後端服務標準化
1. 重構現有服務目錄結構
2. 統一命名規範
3. 標準化配置文件

### Phase 2: 前端模組標準化
1. 重構前端目錄結構
2. 統一組件組織方式
3. 標準化構建配置
