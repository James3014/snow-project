/**
 * 測試各種日期格式
 */

import { extractDates } from '../platform/frontend/ski-platform/src/features/ai/utils/dateParser.js';

function testDateFormats() {
  console.log('=== 測試各種日期範圍格式 ===\n');

  const testCases = [
    // 用戶實際輸入的格式
    '12-22到26去野澤',
    '12-22到26號',
    '12-22到26',
    '12月22到26',
    '12月22到26號',

    // 其他常見格式
    '12/22到26',
    '12/22-26',
    '12-22至26',
    '22到26號',
    '22號到26號',

    // 已知可以工作的格式
    '12月22日到26日',
    '12月22-26',
    '12/22-12/26',
  ];

  let passCount = 0;
  let failCount = 0;

  for (const input of testCases) {
    console.log(`\n輸入: "${input}"`);
    console.log('-'.repeat(60));

    const dates = extractDates(input);

    if (dates.startDate && dates.endDate) {
      console.log('✅ PASS');
      console.log('  startDate:', dates.startDate.toISOString().split('T')[0]);
      console.log('  endDate:', dates.endDate.toISOString().split('T')[0]);

      const diffTime = dates.endDate.getTime() - dates.startDate.getTime();
      const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log('  duration:', duration, '天');
      passCount++;
    } else if (dates.startDate) {
      console.log('⚠️  PARTIAL - 只識別到 startDate');
      console.log('  startDate:', dates.startDate.toISOString().split('T')[0]);
      console.log('  endDate: 未識別');
      failCount++;
    } else {
      console.log('❌ FAIL - 沒有識別到任何日期');
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`總結: ${passCount}/${testCases.length} 通過, ${failCount}/${testCases.length} 失敗`);
  console.log('='.repeat(60));
}

testDateFormats();
