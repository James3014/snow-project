/**
 * 調試測試 - 查看 parseIntent 返回值
 */
import { describe, it } from 'vitest';
import { parseIntent } from '../intentParser';

describe('Debug parseIntent', () => {
  it('查看「二世谷 12月20日 5天」的解析結果', async () => {
    const result = await parseIntent('二世谷 12月20日 5天');
    console.log('\n=== 二世谷 12月20日 5天 ===');
    console.log('startDate:', !!result.startDate, result.startDate);
    console.log('endDate:', !!result.endDate, result.endDate);
    console.log('duration:', result.duration);
  });

  it('查看「野澤 3/20-25 3天」的解析結果', async () => {
    const result = await parseIntent('野澤 3/20-25 3天');
    console.log('\n=== 野澤 3/20-25 3天 ===');
    console.log('startDate:', !!result.startDate, result.startDate);
    console.log('endDate:', !!result.endDate, result.endDate);
    console.log('duration:', result.duration);
  });
});
