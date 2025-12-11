# LDF (Lambda Durable Functions) 整合測試報告

**測試日期**: 2025-12-04 09:09  
**測試人**: Kiro AI  
**狀態**: ⚠️ IAM 權限問題

---

## 📋 測試環境

### Lambda Function URL
```
https://6y344hipvjibf4z7dco2p4v2de0magmi.lambda-url.us-east-2.on.aws/
```

### IAM 用戶
- **用戶名**: `snowbuddy-lambda-user`
- **Access Key**: `AKIAU4FIO5FMVSV5PCYI`
- **Region**: `us-east-2`

### 認證方式
- **Auth Mode**: `iam_sigv4`
- **Service**: `lambda`

---

## ✅ 測試結果

### 1. 配置檢查
- ✅ 環境變數正確配置
- ✅ AWS credentials 已設定
- ✅ Workflow client 初始化成功
- ✅ SigV4 簽名正確生成

### 2. Lambda Function URL 調用
- ❌ **403 Forbidden - AccessDeniedException**

**錯誤訊息**:
```json
{
  "Message": "Forbidden. For troubleshooting Function URL authorization issues, 
   see: https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html"
}
```

**錯誤類型**: `x-amzn-errortype: AccessDeniedException`

### 3. Redis Fallback 模式
- ✅ Matching service 初始化成功
- ✅ Redis 連接正常
- ✅ Fallback 模式可用

---

## 🔍 問題診斷

### 根本原因
IAM 用戶 `snowbuddy-lambda-user` **缺少 `lambda:InvokeFunctionUrl` 權限**

### 驗證步驟
1. ✅ URL 正確
2. ✅ Region 正確
3. ✅ Access Key 有效
4. ✅ Secret Key 有效
5. ✅ SigV4 簽名正確
6. ❌ IAM 權限不足

---

## 🔧 解決方案

### 選項 1: 添加 IAM 策略（推薦）

在 AWS IAM Console 中為 `snowbuddy-lambda-user` 添加以下策略：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "InvokeLambdaFunctionURL",
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunctionUrl"
      ],
      "Resource": "arn:aws:lambda:us-east-2:*:function:*"
    }
  ]
}
```

**步驟**:
1. 登入 AWS Console
2. 進入 IAM → Users → snowbuddy-lambda-user
3. 點擊 "Add permissions" → "Create inline policy"
4. 選擇 JSON 編輯器，貼上上述策略
5. 命名為 `LambdaFunctionURLInvoke`
6. 儲存

### 選項 2: 使用更具體的 Resource ARN

如果知道 Lambda Function 的完整 ARN：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "InvokeLambdaFunctionURL",
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunctionUrl"
      ],
      "Resource": "arn:aws:lambda:us-east-2:ACCOUNT_ID:function:FUNCTION_NAME"
    }
  ]
}
```

### 選項 3: 檢查 Lambda Function URL 的 Resource Policy

確認 Lambda Function URL 的 Resource-based policy 允許此 IAM 用戶：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:user/snowbuddy-lambda-user"
      },
      "Action": "lambda:InvokeFunctionUrl",
      "Resource": "arn:aws:lambda:us-east-2:ACCOUNT_ID:function:FUNCTION_NAME"
    }
  ]
}
```

---

## 📊 測試統計

| 測試項目 | 狀態 | 說明 |
|---------|------|------|
| 環境配置 | ✅ | 所有環境變數正確 |
| AWS Credentials | ✅ | Access Key 和 Secret Key 有效 |
| SigV4 簽名 | ✅ | 簽名生成正確 |
| Lambda 調用 | ❌ | 403 Forbidden (IAM 權限) |
| Redis Fallback | ✅ | 可正常使用 |

---

## 🎯 當前狀態

### ⚠️ LDF 模式：不可用
- 原因：IAM 權限不足
- 影響：無法使用 Lambda Durable Functions
- 解決：添加 `lambda:InvokeFunctionUrl` 權限

### ✅ Fallback 模式：可用
- Redis 連接正常
- Matching service 可運行
- 使用 BackgroundTasks 處理搜尋

---

## 📝 後續步驟

### 立即執行
1. **添加 IAM 權限**（見上方解決方案）
2. **重新測試**：`python test_ldf_integration.py`
3. **驗證成功**：應該看到 ✅ LDF Workflow Mode: PASS

### 部署前
1. 確認 IAM 權限已添加
2. 在 Zeabur 設定環境變數（使用相同的 credentials）
3. 部署 snowbuddy_matching 服務
4. 測試端到端流程

---

## 🔗 參考文件

- [AWS Lambda Function URLs - Authorization](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html)
- [IAM Policies for Lambda](https://docs.aws.amazon.com/lambda/latest/dg/lambda-permissions.html)
- [LDF_ENVIRONMENT.md](../docs/LDF_ENVIRONMENT.md)
- [LDF_TODO.md](../docs/LDF_TODO.md)

---

**測試完成時間**: 2025-12-04 09:09  
**下一步**: 添加 IAM 權限後重新測試
