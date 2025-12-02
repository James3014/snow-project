/**
 * 雪场识别全面测试
 * 测试所有雪场的中文名、英文名、日文名、拼音、别名等是否能被正确识别
 */

import { pinyinToResortId, getAllMatchingResortIds, pinyinToChinese } from '../platform/frontend/ski-platform/src/features/ai/utils/pinyinMapper.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resortsData = JSON.parse(readFileSync(join(__dirname, '../data/resorts_for_matcher.json'), 'utf8'));

interface TestCase {
  input: string;
  expectedResortId: string;
  description: string;
}

// 测试结果统计
interface TestResult {
  total: number;
  passed: number;
  failed: number;
  ambiguous: number;
  failedCases: Array<{
    input: string;
    expected: string;
    actual: string | null;
    allMatches: string[];
    description: string;
  }>;
}

/**
 * 为每个雪场生成测试用例
 */
function generateTestCases(): TestCase[] {
  const testCases: TestCase[] = [];

  for (const resort of resortsData.resorts) {
    const { id, name, name_en, name_ja } = resort;

    // 测试 1: 完整中文名
    testCases.push({
      input: name,
      expectedResortId: id,
      description: `完整中文名: ${name}`,
    });

    // 测试 2: 英文名
    if (name_en) {
      testCases.push({
        input: name_en,
        expectedResortId: id,
        description: `英文名: ${name_en}`,
      });
    }

    // 测试 3: 日文名
    if (name_ja) {
      testCases.push({
        input: name_ja,
        expectedResortId: id,
        description: `日文名: ${name_ja}`,
      });
    }

    // 测试 4: 中文名的各种变体（去除"滑雪場"等后缀）
    const shortName = name
      .replace(/滑雪場$/, '')
      .replace(/滑雪度假村$/, '')
      .replace(/度假村$/, '')
      .replace(/滑雪公園$/, '')
      .replace(/滑雪$/, '')
      .trim();

    if (shortName !== name && shortName.length >= 2) {
      testCases.push({
        input: shortName,
        expectedResortId: id,
        description: `简短中文名: ${shortName}`,
      });
    }

    // 测试 5: 特殊缩写（针对特定雪场）
    const specialAbbreviations = getSpecialAbbreviations(id, name);
    for (const abbr of specialAbbreviations) {
      testCases.push({
        input: abbr,
        expectedResortId: id,
        description: `特殊缩写: ${abbr}`,
      });
    }
  }

  return testCases;
}

/**
 * 为特定雪场生成特殊缩写
 */
function getSpecialAbbreviations(resortId: string, resortName: string): string[] {
  const abbreviations: string[] = [];

  // 白马系列
  if (resortId.startsWith('hakuba_')) {
    abbreviations.push('白馬');
    abbreviations.push('baima');
    abbreviations.push('hakuba');
  }

  // 二世谷
  if (resortId.includes('niseko')) {
    abbreviations.push('二世谷');
    abbreviations.push('二世古');
    abbreviations.push('niseko');
  }

  // 野澤溫泉
  if (resortId.includes('nozawa')) {
    abbreviations.push('野澤');
    abbreviations.push('nozawa');
  }

  // 苗場
  if (resortId.includes('naeba')) {
    abbreviations.push('苗場');
    abbreviations.push('naeba');
  }

  // 神樂
  if (resortId.includes('kagura')) {
    abbreviations.push('神樂');
    abbreviations.push('kagura');
  }

  // GALA湯澤
  if (resortId.includes('gala')) {
    abbreviations.push('GALA');
    abbreviations.push('gala');
    abbreviations.push('湯澤');
  }

  // 富良野
  if (resortId.includes('furano')) {
    abbreviations.push('富良野');
    abbreviations.push('furano');
  }

  // 留壽都
  if (resortId.includes('rusutsu')) {
    abbreviations.push('留壽都');
    abbreviations.push('rusutsu');
  }

  // 安比
  if (resortId.includes('appi')) {
    abbreviations.push('安比');
    abbreviations.push('appi');
  }

  // 藏王
  if (resortId.includes('zao')) {
    abbreviations.push('藏王');
    abbreviations.push('zao');
  }

  // 赤倉系列
  if (resortId.includes('akakura')) {
    abbreviations.push('赤倉');
    abbreviations.push('akakura');
  }

  // 輕井澤
  if (resortId.includes('karuizawa')) {
    abbreviations.push('輕井澤');
    abbreviations.push('karuizawa');
  }

  // 星野系列
  if (resortName.includes('星野')) {
    abbreviations.push('星野');
    abbreviations.push('hoshino');
  }

  return abbreviations;
}

/**
 * 执行测试
 */
function runTests(): TestResult {
  const testCases = generateTestCases();
  const result: TestResult = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    ambiguous: 0,
    failedCases: [],
  };

  console.log(`开始测试 ${testCases.length} 个测试用例...\n`);

  for (const testCase of testCases) {
    const { input, expectedResortId, description } = testCase;
    const actualResortId = pinyinToResortId(input);
    const allMatches = getAllMatchingResortIds(input);

    if (actualResortId === expectedResortId) {
      result.passed++;
      console.log(`✅ PASS: ${description}`);
      console.log(`   输入: "${input}" -> 识别为: ${actualResortId}\n`);
    } else {
      // 检查是否是歧义匹配（多个雪场匹配）
      if (allMatches.length > 1 && allMatches.includes(expectedResortId)) {
        result.ambiguous++;
        console.log(`⚠️  AMBIGUOUS: ${description}`);
        console.log(`   输入: "${input}" -> 匹配多个雪场: ${allMatches.join(', ')}`);
        console.log(`   期望: ${expectedResortId}\n`);
      } else {
        result.failed++;
        console.log(`❌ FAIL: ${description}`);
        console.log(`   输入: "${input}"`);
        console.log(`   期望: ${expectedResortId}`);
        console.log(`   实际: ${actualResortId || 'null'}`);
        console.log(`   所有匹配: ${allMatches.join(', ') || '无'}\n`);

        result.failedCases.push({
          input,
          expected: expectedResortId,
          actual: actualResortId,
          allMatches,
          description,
        });
      }
    }
  }

  return result;
}

/**
 * 打印测试总结
 */
function printSummary(result: TestResult) {
  console.log('\n========================================');
  console.log('测试总结');
  console.log('========================================');
  console.log(`总测试数: ${result.total}`);
  console.log(`通过: ${result.passed} (${((result.passed / result.total) * 100).toFixed(2)}%)`);
  console.log(`失败: ${result.failed} (${((result.failed / result.total) * 100).toFixed(2)}%)`);
  console.log(`歧义: ${result.ambiguous} (${((result.ambiguous / result.total) * 100).toFixed(2)}%)`);
  console.log('========================================\n');

  if (result.failedCases.length > 0) {
    console.log('失败的测试用例详情:');
    console.log('========================================');
    for (const failedCase of result.failedCases) {
      console.log(`描述: ${failedCase.description}`);
      console.log(`输入: "${failedCase.input}"`);
      console.log(`期望: ${failedCase.expected}`);
      console.log(`实际: ${failedCase.actual || 'null'}`);
      console.log(`所有匹配: ${failedCase.allMatches.join(', ') || '无'}`);
      console.log('---');
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('雪场识别全面测试');
  console.log('========================================\n');
  console.log(`資料源: ${resortsData.resorts.length} 个雪场\n`);

  const result = runTests();
  printSummary(result);

  // 退出代码：如果有失败的测试，返回 1
  process.exit(result.failed > 0 ? 1 : 0);
}

// 运行测试
main();
