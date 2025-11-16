/**
 * 調試最後 3 個失敗測試
 */
import { describe, it } from 'vitest';
import { parseIntent } from '../intentParser';

describe('Debug remaining failures', () => {
  it('查看「新雪谷」的解析結果', async () => {
    const result = await parseIntent('新雪谷');
    console.log('\n=== 新雪谷 ===');
    console.log('resort:', !!result.resort, result.resort);
  });

  it('查看「野澤 2025/3/20-2025/3/25」的解析結果', async () => {
    const result = await parseIntent('野澤 2025/3/20-2025/3/25');
    console.log('\n=== 野澤 2025/3/20-2025/3/25 ===');
    console.log('startDate:', result.startDate);
    console.log('endDate:', result.endDate);
    console.log('Start Year:', result.startDate?.getFullYear());
    console.log('End Year:', result.endDate?.getFullYear());
    console.log('End Day:', result.endDate?.getDate());
  });

  it('查看「二世谷 99月99日」的解析結果', async () => {
    const result = await parseIntent('二世谷 99月99日');
    console.log('\n=== 二世谷 99月99日 ===');
    console.log('resort:', !!result.resort);
    console.log('startDate:', result.startDate);
    console.log('Is startDate NaN?', result.startDate ? isNaN(result.startDate.getTime()) : 'undefined');
  });
});
