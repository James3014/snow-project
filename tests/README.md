# 雪場識別測試套件

本目錄包含所有雪場識別相關的測試，確保系統穩定可靠。

## 🔴 重要：用戶回報問題測試

### `user_reported_issues_test.js` ⭐ **每次修改後必須運行**

這是**最重要的測試**，包含所有用戶實際發現並回報的 bug。

**運行方式**：
```bash
node tests/user_reported_issues_test.js
```

**當前測試案例**（修復率：100%）：
- ✅ Issue #1 (2025-11-11): "新增苗場2月3到7日" → 苗場滑雪場
- ✅ Issue #2 (2025-11-11): "1月2號到6號去星野" → 星野TOMAMU
- ✅ Issue #3: "2月3到8日去苗場" → 苗場滑雪場
- ✅ Issue #4: "12月20到26去白馬八方" → 白馬八方尾根
- ✅ Issue #5: "12-30到1月2號去野澤溫泉" → 野澤溫泉

**如何添加新的用戶回報問題**：
發現新 bug 時，請立即在 `user_reported_issues_test.js` 中添加：
```javascript
{
  issue: 'Issue #N',
  date: '2025-XX-XX',
  input: '用戶的實際輸入',
  expected: 'expected_resort_id',
  description: '問題描述',
  originalError: '原始錯誤信息',
}
```

## 其他測試文件

### 1. `resort_recognition_test.ts`
- **目的**: 测试所有雪场的各种变体是否能被正确识别
- **测试内容**:
  - 完整中文名（如"白馬Cortina滑雪場"）
  - 英文名（如"Hakuba Cortina Ski Resort"）
  - 日文名（如"白馬コルチナスキー場"）
  - 简短名称（如"白馬"、"Cortina"）
  - 拼音（如"baima"、"cortina"）
  - 各种别名和缩写
- **数据源**: `data/resorts_for_matcher.json` (43个雪场)

### 2. `date_recognition_test.ts`
- **目的**: 测试各种日期格式是否能被正确识别
- **测试内容**:
  - **绝对日期格式**:
    - 完整日期: `2024-12-25`, `2024/12/25`, `2024年12月25日`
    - 月日格式: `12月25日`, `12/25`, `12-25`
  - **相对日期格式**:
    - 今天/明天/後天/大後天
    - 星期几: `下週一`, `下週五`
    - X天後: `5天後`, `10日後`
    - X週後: `2週後`
  - **日期范围格式**:
    - `12月11到20日`, `12月11至20日`, `12月11~20日`
    - `12/11-20`, `12/11到20`
  - **混合文本中的日期提取**

### 3. `conversation_integration_test.ts`
- **目的**: 测试真实用户输入场景中的雪场和日期识别
- **测试内容**:
  - 雪场 + 日期的组合识别
  - 各种口语化表达
  - 中文、英文、拼音混合输入
  - 边缘情况和挑战性测试
- **测试用例示例**:
  - `"白馬12月14-16"` → 白馬 + 12月14-16日
  - `"我想去二世谷明天滑雪"` → 二世谷 + 明天
  - `"nozawa onsen 2月20日"` → 野澤溫泉 + 2月20日

## 运行方法

### 方法 1: 使用 Bash 脚本（推荐）

```bash
# 赋予执行权限
chmod +x tests/run_all_tests.sh

# 运行所有测试
./tests/run_all_tests.sh
```

### 方法 2: 手动运行单个测试

首先进入前端项目目录并安装 ts-node（如果未安装）:

```bash
cd platform/frontend/ski-platform
npm install -D ts-node
```

然后运行各个测试:

```bash
# 雪场识别测试
npx ts-node --esm ../../../tests/resort_recognition_test.ts

# 日期识别测试
npx ts-node --esm ../../../tests/date_recognition_test.ts

# 综合场景测试
npx ts-node --esm ../../../tests/conversation_integration_test.ts
```

### 方法 3: 编译后运行

```bash
# 编译前端项目
cd platform/frontend/ski-platform
npm run build

# 运行测试（需要先编译测试文件）
# TODO: 添加编译步骤
```

## 测试结果

测试运行后会在控制台输出详细的测试结果，包括:
- ✅ 通过的测试
- ❌ 失败的测试
- ⚠️  歧义匹配（多个雪场匹配同一输入）

测试日志会保存在 `tests/logs/` 目录下。

## 测试统计

运行所有测试后，会显示:
- 总测试数
- 通过率
- 失败的测试用例详情

## 预期结果

理想情况下，所有测试应该通过。如果有失败的测试：

1. **雪场识别失败**:
   - 检查 `pinyinMapper.ts` 中是否缺少该雪场的别名
   - 检查 `resortMatcher.ts` 的匹配逻辑是否需要优化

2. **日期识别失败**:
   - 检查 `dateParser.ts` 的日期解析逻辑
   - 确认日期格式是否在支持范围内

3. **综合场景失败**:
   - 检查是否是雪场识别问题
   - 检查是否是日期识别问题
   - 检查两者的整合是否有问题

## 添加新测试

要添加新的测试用例，编辑相应的测试文件:

### 添加雪场识别测试

在 `resort_recognition_test.ts` 的 `generateTestCases()` 函数中添加新的测试用例。

### 添加日期识别测试

在 `date_recognition_test.ts` 的 `generateSingleDateTests()` 或 `generateDateRangeTests()` 函数中添加新的测试用例。

### 添加综合场景测试

在 `conversation_integration_test.ts` 的 `generateConversationTests()` 函数中添加新的测试用例。

## 故障排除

### 找不到模块

如果运行测试时出现"找不到模块"的错误:

```bash
# 确保在正确的目录
cd platform/frontend/ski-platform

# 安装依赖
npm install

# 安装 ts-node
npm install -D ts-node
```

### TypeScript 编译错误

如果出现 TypeScript 编译错误，检查:
- 是否安装了所有依赖
- TypeScript 版本是否正确
- tsconfig.json 配置是否正确

### 测试失败

如果测试失败:
1. 查看详细的错误信息
2. 检查 `tests/logs/` 目录下的日志文件
3. 确认测试用例的期望值是否正确
4. 如果是已知的限制，可以调整测试用例或标记为预期失败

## 持续改进

随着对话功能的改进，应该：
1. 定期运行这些测试
2. 为新发现的问题添加测试用例
3. 保持测试用例与实际功能同步
4. 提高测试覆盖率

## 联系

如有问题或建议，请联系开发团队。
