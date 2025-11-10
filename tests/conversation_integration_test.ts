/**
 * 对话功能综合测试
 * 测试用户在对话中输入的雪场+日期组合是否能被正确识别
 */

import { pinyinToResortId, getAllMatchingResortIds } from '../platform/frontend/ski-platform/src/features/ai/utils/pinyinMapper';
import { parseDate, extractDates } from '../platform/frontend/ski-platform/src/features/ai/utils/dateParser';
import resortsData from '../data/resorts_for_matcher.json';

interface ConversationTestCase {
  input: string;
  expectedResort: string;
  expectedStartDate?: string; // YYYY-MM-DD
  expectedEndDate?: string; // YYYY-MM-DD
  description: string;
}

interface TestResult {
  total: number;
  passed: number;
  failed: number;
  partiallyPassed: number;
  failedCases: Array<{
    input: string;
    expected: string;
    actual: string;
    description: string;
  }>;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 计算未来的日期
 */
function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDate(date);
}

/**
 * 生成真实场景的测试用例
 */
function generateConversationTests(): ConversationTestCase[] {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  return [
    // ========================================
    // 经典用户输入场景
    // ========================================

    // 白馬系列
    {
      input: '白馬12月14-16',
      expectedResort: 'hakuba_cortina', // 或其他白馬雪场
      expectedStartDate: `${currentYear}-12-14`,
      expectedEndDate: `${currentYear}-12-16`,
      description: '白馬 + 日期范围 (短格式)',
    },
    {
      input: '我想去白馬12月14日到16日滑雪',
      expectedResort: 'hakuba_cortina',
      expectedStartDate: `${currentYear}-12-14`,
      expectedEndDate: `${currentYear}-12-16`,
      description: '白馬 + 日期范围 (完整句子)',
    },
    {
      input: '白馬八方明天',
      expectedResort: 'hakuba_happo_one',
      expectedStartDate: getFutureDate(1),
      description: '白馬八方 + 相对日期',
    },
    {
      input: 'hakuba cortina 12/25',
      expectedResort: 'hakuba_cortina',
      expectedStartDate: `${currentYear}-12-25`,
      description: '英文雪场名 + 斜杠日期',
    },

    // 二世谷
    {
      input: '二世谷1月10到15號',
      expectedResort: 'hokkaido_niseko_moiwa',
      expectedStartDate: `${nextYear}-01-10`,
      expectedEndDate: `${nextYear}-01-15`,
      description: '二世谷 + 跨年日期范围',
    },
    {
      input: 'niseko明天',
      expectedResort: 'hokkaido_niseko_moiwa',
      expectedStartDate: getFutureDate(1),
      description: '英文 niseko + 明天',
    },

    // 野澤溫泉
    {
      input: '野澤溫泉3月1至5日',
      expectedResort: 'nagano_nozawa_onsen',
      expectedStartDate: `${nextYear}-03-01`,
      expectedEndDate: `${nextYear}-03-05`,
      description: '野澤溫泉 + 3月日期范围',
    },
    {
      input: '野澤下週五',
      expectedResort: 'nagano_nozawa_onsen',
      // expectedStartDate 动态计算
      description: '野澤 + 下週五',
    },
    {
      input: 'nozawa onsen 2月20日',
      expectedResort: 'nagano_nozawa_onsen',
      expectedStartDate: `${nextYear}-02-20`,
      description: '英文 nozawa onsen + 日期',
    },

    // 富良野
    {
      input: '富良野12月25日到12月30日',
      expectedResort: 'hokkaido_furano',
      expectedStartDate: `${currentYear}-12-25`,
      expectedEndDate: `${currentYear}-12-30`,
      description: '富良野 + 完整日期范围',
    },
    {
      input: 'furano後天',
      expectedResort: 'hokkaido_furano',
      expectedStartDate: getFutureDate(2),
      description: '英文 furano + 後天',
    },

    // 留壽都
    {
      input: '留壽都1月5到10日',
      expectedResort: 'hokkaido_rusutsu',
      expectedStartDate: `${nextYear}-01-05`,
      expectedEndDate: `${nextYear}-01-10`,
      description: '留壽都 + 跨年日期',
    },
    {
      input: 'rusutsu 12/20',
      expectedResort: 'hokkaido_rusutsu',
      expectedStartDate: `${currentYear}-12-20`,
      description: '英文 rusutsu + 斜杠日期',
    },

    // 神樂
    {
      input: '神樂1月15到20',
      expectedResort: 'yuzawa_kagura',
      expectedStartDate: `${nextYear}-01-15`,
      expectedEndDate: `${nextYear}-01-20`,
      description: '神樂 + 跨年日期范围',
    },
    {
      input: 'kagura明天',
      expectedResort: 'yuzawa_kagura',
      expectedStartDate: getFutureDate(1),
      description: '英文 kagura + 明天',
    },

    // 苗場
    {
      input: '苗場12月18-22',
      expectedResort: 'yuzawa_naeba',
      expectedStartDate: `${currentYear}-12-18`,
      expectedEndDate: `${currentYear}-12-22`,
      description: '苗場 + 日期范围',
    },
    {
      input: 'naeba 1/10',
      expectedResort: 'yuzawa_naeba',
      expectedStartDate: `${nextYear}-01-10`,
      description: '英文 naeba + 跨年日期',
    },

    // GALA湯澤
    {
      input: 'GALA湯澤12月30日',
      expectedResort: 'yuzawa_gala',
      expectedStartDate: `${currentYear}-12-30`,
      description: 'GALA湯澤 + 日期',
    },
    {
      input: 'gala明天',
      expectedResort: 'yuzawa_gala',
      expectedStartDate: getFutureDate(1),
      description: '英文 gala + 明天',
    },

    // 安比高原
    {
      input: '安比高原1月20到25日',
      expectedResort: 'iwate_appi_kogen',
      expectedStartDate: `${nextYear}-01-20`,
      expectedEndDate: `${nextYear}-01-25`,
      description: '安比高原 + 跨年日期范围',
    },
    {
      input: 'appi 2/15',
      expectedResort: 'iwate_appi_kogen',
      expectedStartDate: `${nextYear}-02-15`,
      description: '英文 appi + 跨年日期',
    },

    // 藏王
    {
      input: '藏王溫泉2月1到5日',
      expectedResort: 'yamagata_zao_onsen',
      expectedStartDate: `${nextYear}-02-01`,
      expectedEndDate: `${nextYear}-02-05`,
      description: '藏王溫泉 + 跨年日期范围',
    },
    {
      input: 'zao明天',
      expectedResort: 'yamagata_zao_onsen',
      expectedStartDate: getFutureDate(1),
      description: '英文 zao + 明天',
    },

    // 輕井澤
    {
      input: '輕井澤王子12月25日',
      expectedResort: 'nagano_karuizawa_prince',
      expectedStartDate: `${currentYear}-12-25`,
      description: '輕井澤王子 + 日期',
    },
    {
      input: 'karuizawa 1/1',
      expectedResort: 'nagano_karuizawa_prince',
      expectedStartDate: `${nextYear}-01-01`,
      description: '英文 karuizawa + 跨年日期',
    },

    // 星野系列
    {
      input: '星野TOMAMU 1月5到10日',
      expectedResort: 'hokkaido_tomamu',
      expectedStartDate: `${nextYear}-01-05`,
      expectedEndDate: `${nextYear}-01-10`,
      description: '星野TOMAMU + 跨年日期范围',
    },
    {
      input: 'tomamu明天',
      expectedResort: 'hokkaido_tomamu',
      expectedStartDate: getFutureDate(1),
      description: '英文 tomamu + 明天',
    },

    // 赤倉系列
    {
      input: '赤倉觀光12月20日',
      expectedResort: 'myoko_akakura_kanko',
      expectedStartDate: `${currentYear}-12-20`,
      description: '赤倉觀光 + 日期',
    },
    {
      input: '赤倉溫泉1月10日',
      expectedResort: 'myoko_akakura_onsen',
      expectedStartDate: `${nextYear}-01-10`,
      description: '赤倉溫泉 + 跨年日期',
    },

    // 樂天新井
    {
      input: '樂天新井1月15到20日',
      expectedResort: 'myoko_lotte_arai',
      expectedStartDate: `${nextYear}-01-15`,
      expectedEndDate: `${nextYear}-01-20`,
      description: '樂天新井 + 跨年日期范围',
    },
    {
      input: 'lotte arai 2/10',
      expectedResort: 'myoko_lotte_arai',
      expectedStartDate: `${nextYear}-02-10`,
      description: '英文 lotte arai + 跨年日期',
    },

    // ========================================
    // 边缘情况和挑战性测试
    // ========================================

    // 非常短的输入
    {
      input: '白馬明天',
      expectedResort: 'hakuba_cortina',
      expectedStartDate: getFutureDate(1),
      description: '超短输入: 白馬明天',
    },

    // 拼音输入
    {
      input: 'baima 12/20',
      expectedResort: 'hakuba_cortina',
      expectedStartDate: `${currentYear}-12-20`,
      description: '拼音输入: baima',
    },

    // 口语化表达
    {
      input: '我想後天去二世谷滑雪',
      expectedResort: 'hokkaido_niseko_moiwa',
      expectedStartDate: getFutureDate(2),
      description: '口语化: 我想後天去二世谷滑雪',
    },

    // 多个日期格式混合
    {
      input: '富良野12月25號到30號',
      expectedResort: 'hokkaido_furano',
      expectedStartDate: `${currentYear}-12-25`,
      expectedEndDate: `${currentYear}-12-30`,
      description: '混合使用"號"',
    },
  ];
}

/**
 * 执行综合测试
 */
function runConversationTests(): TestResult {
  const testCases = generateConversationTests();
  const result: TestResult = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    partiallyPassed: 0,
    failedCases: [],
  };

  console.log('========================================');
  console.log('对话功能综合测试');
  console.log('========================================\n');

  for (const testCase of testCases) {
    const { input, expectedResort, expectedStartDate, expectedEndDate, description } = testCase;

    // 识别雪场
    const resortId = pinyinToResortId(input);
    const allResorts = getAllMatchingResortIds(input);

    // 识别日期
    const dates = extractDates(input);
    const actualStartDate = dates.startDate ? formatDate(dates.startDate) : null;
    const actualEndDate = dates.endDate ? formatDate(dates.endDate) : null;

    // 判断结果
    const resortMatched = resortId === expectedResort || allResorts.includes(expectedResort);
    const startDateMatched = !expectedStartDate || actualStartDate === expectedStartDate;
    const endDateMatched = !expectedEndDate || actualEndDate === expectedEndDate;

    if (resortMatched && startDateMatched && endDateMatched) {
      result.passed++;
      console.log(`✅ PASS: ${description}`);
      console.log(`   输入: "${input}"`);
      console.log(`   雪场: ${resortId} ${allResorts.length > 1 ? `(歧义: ${allResorts.join(', ')})` : ''}`);
      console.log(`   日期: ${actualStartDate || '无'}${actualEndDate ? ` 到 ${actualEndDate}` : ''}\n`);
    } else if (resortMatched || startDateMatched) {
      result.partiallyPassed++;
      console.log(`⚠️  PARTIAL: ${description}`);
      console.log(`   输入: "${input}"`);
      console.log(`   期望雪场: ${expectedResort} | 实际: ${resortId || 'null'} ${allResorts.length > 1 ? `(所有: ${allResorts.join(', ')})` : ''}`);
      console.log(`   期望日期: ${expectedStartDate || '无'}${expectedEndDate ? ` 到 ${expectedEndDate}` : ''}`);
      console.log(`   实际日期: ${actualStartDate || '无'}${actualEndDate ? ` 到 ${actualEndDate}` : ''}\n`);

      result.failedCases.push({
        input,
        expected: `雪场: ${expectedResort}, 日期: ${expectedStartDate || '无'}${expectedEndDate ? ` 到 ${expectedEndDate}` : ''}`,
        actual: `雪场: ${resortId || 'null'}, 日期: ${actualStartDate || '无'}${actualEndDate ? ` 到 ${actualEndDate}` : ''}`,
        description: `${description} (部分匹配)`,
      });
    } else {
      result.failed++;
      console.log(`❌ FAIL: ${description}`);
      console.log(`   输入: "${input}"`);
      console.log(`   期望雪场: ${expectedResort} | 实际: ${resortId || 'null'}`);
      console.log(`   期望日期: ${expectedStartDate || '无'}${expectedEndDate ? ` 到 ${expectedEndDate}` : ''}`);
      console.log(`   实际日期: ${actualStartDate || '无'}${actualEndDate ? ` 到 ${actualEndDate}` : ''}\n`);

      result.failedCases.push({
        input,
        expected: `雪场: ${expectedResort}, 日期: ${expectedStartDate || '无'}${expectedEndDate ? ` 到 ${expectedEndDate}` : ''}`,
        actual: `雪场: ${resortId || 'null'}, 日期: ${actualStartDate || '无'}${actualEndDate ? ` 到 ${actualEndDate}` : ''}`,
        description,
      });
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
  console.log(`完全通过: ${result.passed} (${((result.passed / result.total) * 100).toFixed(2)}%)`);
  console.log(`部分通过: ${result.partiallyPassed} (${((result.partiallyPassed / result.total) * 100).toFixed(2)}%)`);
  console.log(`失败: ${result.failed} (${((result.failed / result.total) * 100).toFixed(2)}%)`);
  console.log('========================================\n');

  if (result.failedCases.length > 0) {
    console.log('失败或部分通过的测试用例详情:');
    console.log('========================================');
    for (const failedCase of result.failedCases) {
      console.log(`描述: ${failedCase.description}`);
      console.log(`输入: "${failedCase.input}"`);
      console.log(`期望: ${failedCase.expected}`);
      console.log(`实际: ${failedCase.actual}`);
      console.log('---');
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('对话功能综合测试');
  console.log('测试真实用户输入场景中的雪场和日期识别\n');

  const result = runConversationTests();
  printSummary(result);

  // 退出代码：如果有完全失败的测试，返回 1
  process.exit(result.failed > 0 ? 1 : 0);
}

// 运行测试
main();
