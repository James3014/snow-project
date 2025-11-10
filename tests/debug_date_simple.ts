/**
 * 調試日期範圍解析問題 - 簡化版
 */

import { extractDates } from '../platform/frontend/ski-platform/src/features/ai/utils/dateParser.js';

function testDateRangeParsing() {
  console.log('=== 調試日期範圍解析 ===\n');

  const testCases = [
    '12月15-20 二世谷',
    '12月15-20',
    '二世谷 12月15-20',
    '12月15到20日',
    '12月15至20日',
  ];

  for (const input of testCases) {
    console.log(`\n測試輸入: "${input}"`);
    console.log('-'.repeat(50));

    const dates = extractDates(input);
    console.log('extractDates 結果:');
    console.log('  startDate:', dates.startDate?.toISOString().split('T')[0]);
    console.log('  endDate:', dates.endDate?.toISOString().split('T')[0]);

    if (dates.startDate && dates.endDate) {
      const diffTime = dates.endDate.getTime() - dates.startDate.getTime();
      const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log('  duration (計算):', duration, '天');
    }
  }
}

testDateRangeParsing();
