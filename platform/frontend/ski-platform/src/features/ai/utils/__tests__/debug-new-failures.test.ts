/**
 * 調試新測試的失敗
 */
import { describe, it } from 'vitest';
import { parseIntent } from '../intentParser';
import { updateFormFromInput, createEmptyForm } from '../tripFormLogic';

describe('Debug new test failures', () => {
  it('查看「野澤 3/20至3/25」的解析結果', async () => {
    const result = await parseIntent('野澤 3/20至3/25');
    console.log('\n=== 野澤 3/20至3/25 ===');
    console.log('startDate:', result.startDate);
    console.log('endDate:', result.endDate);
    console.log('endDate status:', result.endDate ? 'exists' : 'undefined');
  });

  it('查看「野澤 3月20-25日」visibility 解析', async () => {
    const result = await parseIntent('野澤 3月20-25日');
    console.log('\n=== 野澤 3月20-25日 ===');
    console.log('visibility:', result.visibility);
    console.log('maxBuddies:', result.maxBuddies);
  });

  it('查看「2025年3月20日到3月25日」的解析結果', async () => {
    const result = await parseIntent('我計劃在2025年3月20日到3月25日去野澤溫泉滑雪場，想公開找2個滑雪夥伴一起');
    console.log('\n=== 詳細描述 ===');
    console.log('startDate:', result.startDate);
    console.log('endDate:', result.endDate);
    console.log('resort:', !!result.resort);
    console.log('visibility:', result.visibility);
    console.log('maxBuddies:', result.maxBuddies);
  });

  it('查看「白馬」的解析結果', async () => {
    const result = await parseIntent('白馬');
    console.log('\n=== 白馬 ===');
    console.log('resort:', !!result.resort, result.resort);
  });

  it('查看「Hakuba」的解析結果', async () => {
    const result = await parseIntent('Hakuba 3/20-25');
    console.log('\n=== Hakuba ===');
    console.log('resort:', !!result.resort, result.resort);
  });

  it('測試 visibility 行為', async () => {
    let form = createEmptyForm();
    form = await updateFormFromInput(form, '野澤 3月20-25日');
    console.log('\n=== updateFormFromInput 野澤 3月20-25日 ===');
    console.log('visibility status:', form.visibility.status);
    console.log('visibility value:', form.visibility.status === 'filled' ? form.visibility.value : 'N/A');
  });
});
