/**
 * 調試日期範圍解析問題
 */

import { parseIntent } from '../platform/frontend/ski-platform/src/features/ai/utils/intentParser.js';
import { extractDates } from '../platform/frontend/ski-platform/src/features/ai/utils/dateParser.js';

async function testDateRangeParsing() {
  console.log('=== 調試日期範圍解析 ===\n');

  const testCases = [
    '12月15-20 二世谷',
    '12月15-20',
    '二世谷 12月15-20',
  ];

  for (const input of testCases) {
    console.log(`\n測試輸入: "${input}"`);
    console.log('-'.repeat(50));

    // 測試 extractDates
    const dates = extractDates(input);
    console.log('extractDates 結果:');
    console.log('  startDate:', dates.startDate?.toISOString().split('T')[0]);
    console.log('  endDate:', dates.endDate?.toISOString().split('T')[0]);

    // 測試 parseIntent
    const intent = await parseIntent(input);
    console.log('\nparseIntent 結果:');
    console.log('  action:', intent.action);
    console.log('  resort:', intent.resort?.resort.names.zh);
    console.log('  startDate:', intent.startDate?.toISOString().split('T')[0]);
    console.log('  endDate:', intent.endDate?.toISOString().split('T')[0]);
    console.log('  duration:', intent.duration);
  }
}

testDateRangeParsing();
