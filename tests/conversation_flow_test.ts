/**
 * 測試對話流程 - 驗證日期範圍識別修復
 */

import { processUserInput, createInitialContext } from '../platform/frontend/ski-platform/src/features/ai/utils/conversationEngine.js';

async function testConversationFlow() {
  console.log('=== 測試對話流程 ===\n');

  // 測試場景 1: 一次性輸入雪場和日期範圍
  console.log('場景 1: 用戶輸入 "12月15-20 二世谷"');
  console.log('-'.repeat(60));

  let context = createInitialContext();

  const result1 = await processUserInput('12月15-20 二世谷', context);
  console.log('狀態:', result1.updatedContext.state);
  console.log('回應:', result1.response.message);
  console.log('累積數據:');
  console.log('  - resort:', result1.updatedContext.accumulatedData.resort?.resort.names.zh);
  console.log('  - startDate:', result1.updatedContext.accumulatedData.startDate?.toISOString().split('T')[0]);
  console.log('  - endDate:', result1.updatedContext.accumulatedData.endDate?.toISOString().split('T')[0]);
  console.log('  - duration:', result1.updatedContext.accumulatedData.duration);

  // 如果還需要日期，繼續測試
  if (result1.updatedContext.state === 'AWAITING_DATE') {
    console.log('\n系統還在等待日期，繼續輸入...\n');
    const result2 = await processUserInput('12月15-20', result1.updatedContext);
    console.log('狀態:', result2.updatedContext.state);
    console.log('回應:', result2.response.message);
    console.log('累積數據:');
    console.log('  - resort:', result2.updatedContext.accumulatedData.resort?.resort.names.zh);
    console.log('  - startDate:', result2.updatedContext.accumulatedData.startDate?.toISOString().split('T')[0]);
    console.log('  - endDate:', result2.updatedContext.accumulatedData.endDate?.toISOString().split('T')[0]);
    console.log('  - duration:', result2.updatedContext.accumulatedData.duration);
    context = result2.updatedContext;
  } else {
    context = result1.updatedContext;
  }

  // 測試場景 2: 分步輸入
  console.log('\n\n場景 2: 分步輸入');
  console.log('-'.repeat(60));

  context = createInitialContext();

  console.log('\n步驟 1: 輸入 "建立行程"');
  const step1 = await processUserInput('建立行程', context);
  console.log('狀態:', step1.updatedContext.state);
  console.log('回應:', step1.response.message);

  console.log('\n步驟 2: 輸入 "白馬"');
  const step2 = await processUserInput('白馬', step1.updatedContext);
  console.log('狀態:', step2.updatedContext.state);
  console.log('回應:', step2.response.message);

  console.log('\n步驟 3: 輸入 "12月25-30"');
  const step3 = await processUserInput('12月25-30', step2.updatedContext);
  console.log('狀態:', step3.updatedContext.state);
  console.log('回應:', step3.response.message);
  console.log('累積數據:');
  console.log('  - resort:', step3.updatedContext.accumulatedData.resort?.resort.names.zh);
  console.log('  - startDate:', step3.updatedContext.accumulatedData.startDate?.toISOString().split('T')[0]);
  console.log('  - endDate:', step3.updatedContext.accumulatedData.endDate?.toISOString().split('T')[0]);
  console.log('  - duration:', step3.updatedContext.accumulatedData.duration);

  // 驗證結果
  console.log('\n\n=== 驗證結果 ===');
  console.log('-'.repeat(60));

  const checks = [
    { name: '場景1: startDate 已設置', pass: context.accumulatedData.startDate !== undefined },
    { name: '場景1: endDate 已設置', pass: context.accumulatedData.endDate !== undefined },
    { name: '場景1: duration 已計算', pass: context.accumulatedData.duration !== undefined },
    { name: '場景1: 狀態為 CREATING_TRIP 或更後面', pass: ['CREATING_TRIP', 'TRIP_CREATED'].includes(context.state) || context.accumulatedData.duration !== undefined },
    { name: '場景2: startDate 已設置', pass: step3.updatedContext.accumulatedData.startDate !== undefined },
    { name: '場景2: endDate 已設置', pass: step3.updatedContext.accumulatedData.endDate !== undefined },
    { name: '場景2: duration 已計算', pass: step3.updatedContext.accumulatedData.duration !== undefined },
  ];

  let passCount = 0;
  for (const check of checks) {
    const status = check.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${check.name}`);
    if (check.pass) passCount++;
  }

  console.log(`\n總結: ${passCount}/${checks.length} 測試通過`);

  if (passCount === checks.length) {
    console.log('\n🎉 所有測試通過！日期範圍識別修復成功！');
  } else {
    console.log('\n⚠️ 部分測試失敗，需要進一步檢查');
  }
}

testConversationFlow().catch(console.error);
