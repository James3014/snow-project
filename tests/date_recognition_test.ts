/**
 * 日期识别全面测试
 * 测试各种日期格式是否能被正确识别
 */

import { parseDate, extractDates } from '../platform/frontend/ski-platform/src/features/ai/utils/dateParser.js';

interface DateTestCase {
  input: string;
  expectedDate?: string; // YYYY-MM-DD 格式
  description: string;
  shouldMatch: boolean;
  minConfidence?: number;
}

interface DateRangeTestCase {
  input: string;
  expectedStartDate?: string; // YYYY-MM-DD 格式
  expectedEndDate?: string; // YYYY-MM-DD 格式
  description: string;
  shouldMatch: boolean;
}

interface TestResult {
  total: number;
  passed: number;
  failed: number;
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
 * 计算未来的日期（用于相对日期测试）
 */
function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDate(date);
}

/**
 * 获取下一个指定星期几
 */
function getNextWeekday(targetDay: number): string {
  const now = new Date();
  const currentDay = now.getDay();
  let daysToAdd = targetDay - currentDay;

  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  const result = new Date(now);
  result.setDate(result.getDate() + daysToAdd);
  return formatDate(result);
}

/**
 * 生成单日期测试用例
 */
function generateSingleDateTests(): DateTestCase[] {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  return [
    // ========================================
    // 绝对日期格式测试
    // ========================================

    // 完整日期格式
    {
      input: '2024-12-25',
      expectedDate: '2024-12-25',
      description: '完整日期 (YYYY-MM-DD)',
      shouldMatch: true,
      minConfidence: 1.0,
    },
    {
      input: '2024/12/25',
      expectedDate: '2024-12-25',
      description: '完整日期 (YYYY/MM/DD)',
      shouldMatch: true,
      minConfidence: 1.0,
    },
    {
      input: '2024年12月25日',
      expectedDate: '2024-12-25',
      description: '完整日期 (中文格式)',
      shouldMatch: true,
      minConfidence: 1.0,
    },

    // 月日格式（会自动推断年份）
    {
      input: '12月25日',
      expectedDate: `${currentYear}-12-25`,
      description: '月日格式 (中文)',
      shouldMatch: true,
      minConfidence: 0.9,
    },
    {
      input: '12/25',
      expectedDate: `${currentYear}-12-25`,
      description: '月日格式 (斜杠)',
      shouldMatch: true,
      minConfidence: 0.9,
    },
    {
      input: '12-25',
      expectedDate: `${currentYear}-12-25`,
      description: '月日格式 (横线)',
      shouldMatch: true,
      minConfidence: 0.9,
    },
    {
      input: '1月15日',
      expectedDate: `${nextYear}-01-15`,
      description: '跨年月份 (1月) - 应推断为明年',
      shouldMatch: true,
      minConfidence: 0.9,
    },
    {
      input: '3月10日',
      expectedDate: `${nextYear}-03-10`,
      description: '跨年月份 (3月) - 应推断为明年',
      shouldMatch: true,
      minConfidence: 0.9,
    },

    // ========================================
    // 相对日期格式测试
    // ========================================

    // 今天/明天/后天
    {
      input: '今天',
      expectedDate: getFutureDate(0),
      description: '相对日期: 今天',
      shouldMatch: true,
      minConfidence: 1.0,
    },
    {
      input: '明天',
      expectedDate: getFutureDate(1),
      description: '相对日期: 明天',
      shouldMatch: true,
      minConfidence: 1.0,
    },
    {
      input: '後天',
      expectedDate: getFutureDate(2),
      description: '相对日期: 後天',
      shouldMatch: true,
      minConfidence: 1.0,
    },
    {
      input: '大後天',
      expectedDate: getFutureDate(3),
      description: '相对日期: 大後天',
      shouldMatch: true,
      minConfidence: 1.0,
    },

    // 星期几
    {
      input: '下週一',
      expectedDate: getNextWeekday(1),
      description: '相对日期: 下週一',
      shouldMatch: true,
      minConfidence: 1.0,
    },
    {
      input: '下週五',
      expectedDate: getNextWeekday(5),
      description: '相对日期: 下週五',
      shouldMatch: true,
      minConfidence: 1.0,
    },
    {
      input: '下週日',
      expectedDate: getNextWeekday(0),
      description: '相对日期: 下週日',
      shouldMatch: true,
      minConfidence: 1.0,
    },

    // X天后
    {
      input: '5天後',
      expectedDate: getFutureDate(5),
      description: '相对日期: 5天後',
      shouldMatch: true,
      minConfidence: 1.0,
    },
    {
      input: '10日後',
      expectedDate: getFutureDate(10),
      description: '相对日期: 10日後',
      shouldMatch: true,
      minConfidence: 1.0,
    },

    // X週后
    {
      input: '2週後',
      expectedDate: getFutureDate(14),
      description: '相对日期: 2週後',
      shouldMatch: true,
      minConfidence: 1.0,
    },

    // ========================================
    // 混合文本中的日期提取
    // ========================================
    {
      input: '我想去白馬12月25日滑雪',
      expectedDate: `${currentYear}-12-25`,
      description: '混合文本中提取日期',
      shouldMatch: true,
      minConfidence: 0.9,
    },
    {
      input: '明天去野澤溫泉',
      expectedDate: getFutureDate(1),
      description: '混合文本中提取相对日期',
      shouldMatch: true,
      minConfidence: 1.0,
    },
    {
      input: '下週五想去二世谷',
      expectedDate: getNextWeekday(5),
      description: '混合文本中提取星期',
      shouldMatch: true,
      minConfidence: 1.0,
    },
  ];
}

/**
 * 生成日期范围测试用例
 */
function generateDateRangeTests(): DateRangeTestCase[] {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  return [
    // ========================================
    // 日期范围格式测试
    // ========================================

    // 标准格式
    {
      input: '12月11到20日',
      expectedStartDate: `${currentYear}-12-11`,
      expectedEndDate: `${currentYear}-12-20`,
      description: '日期范围: 12月11到20日',
      shouldMatch: true,
    },
    {
      input: '12月11至20日',
      expectedStartDate: `${currentYear}-12-11`,
      expectedEndDate: `${currentYear}-12-20`,
      description: '日期范围: 12月11至20日',
      shouldMatch: true,
    },
    {
      input: '12月11~20日',
      expectedStartDate: `${currentYear}-12-11`,
      expectedEndDate: `${currentYear}-12-20`,
      description: '日期范围: 12月11~20日',
      shouldMatch: true,
    },
    {
      input: '12月11-20日',
      expectedStartDate: `${currentYear}-12-11`,
      expectedEndDate: `${currentYear}-12-20`,
      description: '日期范围: 12月11-20日',
      shouldMatch: true,
    },

    // 斜杠格式
    {
      input: '12/11-20',
      expectedStartDate: `${currentYear}-12-11`,
      expectedEndDate: `${currentYear}-12-20`,
      description: '日期范围: 12/11-20',
      shouldMatch: true,
    },
    {
      input: '12/11到20',
      expectedStartDate: `${currentYear}-12-11`,
      expectedEndDate: `${currentYear}-12-20`,
      description: '日期范围: 12/11到20',
      shouldMatch: true,
    },

    // 跨年范围
    {
      input: '1月5到10日',
      expectedStartDate: `${nextYear}-01-05`,
      expectedEndDate: `${nextYear}-01-10`,
      description: '跨年日期范围: 1月5到10日',
      shouldMatch: true,
    },
    {
      input: '2月15到20日',
      expectedStartDate: `${nextYear}-02-15`,
      expectedEndDate: `${nextYear}-02-20`,
      description: '跨年日期范围: 2月15到20日',
      shouldMatch: true,
    },

    // ========================================
    // 混合文本中的日期范围提取
    // ========================================
    {
      input: '我想去白馬12月14-16日滑雪',
      expectedStartDate: `${currentYear}-12-14`,
      expectedEndDate: `${currentYear}-12-16`,
      description: '混合文本中提取日期范围',
      shouldMatch: true,
    },
    {
      input: '二世谷1月10到15號',
      expectedStartDate: `${nextYear}-01-10`,
      expectedEndDate: `${nextYear}-01-15`,
      description: '混合文本中提取跨年日期范围',
      shouldMatch: true,
    },
    {
      input: '野澤溫泉3月1至5日',
      expectedStartDate: `${nextYear}-03-01`,
      expectedEndDate: `${nextYear}-03-05`,
      description: '混合文本中提取3月日期范围',
      shouldMatch: true,
    },

    // 不同分隔符
    {
      input: '富良野12月25日到12月30日',
      expectedStartDate: `${currentYear}-12-25`,
      expectedEndDate: `${currentYear}-12-30`,
      description: '完整日期范围',
      shouldMatch: true,
    },
  ];
}

/**
 * 执行单日期测试
 */
function runSingleDateTests(): TestResult {
  const testCases = generateSingleDateTests();
  const result: TestResult = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    failedCases: [],
  };

  console.log('========================================');
  console.log('单日期识别测试');
  console.log('========================================\n');

  for (const testCase of testCases) {
    const { input, expectedDate, description, shouldMatch, minConfidence } = testCase;
    const parsed = parseDate(input);

    if (shouldMatch) {
      if (parsed && formatDate(parsed.date) === expectedDate) {
        if (!minConfidence || parsed.confidence >= minConfidence) {
          result.passed++;
          console.log(`✅ PASS: ${description}`);
          console.log(`   输入: "${input}"`);
          console.log(`   期望: ${expectedDate}`);
          console.log(`   识别: ${formatDate(parsed.date)} (信心度: ${parsed.confidence})\n`);
        } else {
          result.failed++;
          console.log(`❌ FAIL: ${description} (信心度不足)`);
          console.log(`   输入: "${input}"`);
          console.log(`   期望信心度: >= ${minConfidence}`);
          console.log(`   实际信心度: ${parsed.confidence}\n`);

          result.failedCases.push({
            input,
            expected: `${expectedDate} (confidence >= ${minConfidence})`,
            actual: `${formatDate(parsed.date)} (confidence: ${parsed.confidence})`,
            description,
          });
        }
      } else {
        result.failed++;
        console.log(`❌ FAIL: ${description}`);
        console.log(`   输入: "${input}"`);
        console.log(`   期望: ${expectedDate}`);
        console.log(`   实际: ${parsed ? formatDate(parsed.date) : 'null'}\n`);

        result.failedCases.push({
          input,
          expected: expectedDate || 'null',
          actual: parsed ? formatDate(parsed.date) : 'null',
          description,
        });
      }
    }
  }

  return result;
}

/**
 * 执行日期范围测试
 */
function runDateRangeTests(): TestResult {
  const testCases = generateDateRangeTests();
  const result: TestResult = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    failedCases: [],
  };

  console.log('========================================');
  console.log('日期范围识别测试');
  console.log('========================================\n');

  for (const testCase of testCases) {
    const { input, expectedStartDate, expectedEndDate, description, shouldMatch } = testCase;
    const extracted = extractDates(input);

    if (shouldMatch) {
      const actualStartDate = extracted.startDate ? formatDate(extracted.startDate) : null;
      const actualEndDate = extracted.endDate ? formatDate(extracted.endDate) : null;

      if (actualStartDate === expectedStartDate && actualEndDate === expectedEndDate) {
        result.passed++;
        console.log(`✅ PASS: ${description}`);
        console.log(`   输入: "${input}"`);
        console.log(`   期望: ${expectedStartDate} 到 ${expectedEndDate}`);
        console.log(`   识别: ${actualStartDate} 到 ${actualEndDate}\n`);
      } else {
        result.failed++;
        console.log(`❌ FAIL: ${description}`);
        console.log(`   输入: "${input}"`);
        console.log(`   期望: ${expectedStartDate} 到 ${expectedEndDate}`);
        console.log(`   实际: ${actualStartDate || 'null'} 到 ${actualEndDate || 'null'}\n`);

        result.failedCases.push({
          input,
          expected: `${expectedStartDate} 到 ${expectedEndDate}`,
          actual: `${actualStartDate || 'null'} 到 ${actualEndDate || 'null'}`,
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
function printSummary(singleDateResult: TestResult, dateRangeResult: TestResult) {
  const totalTests = singleDateResult.total + dateRangeResult.total;
  const totalPassed = singleDateResult.passed + dateRangeResult.passed;
  const totalFailed = singleDateResult.failed + dateRangeResult.failed;

  console.log('\n========================================');
  console.log('测试总结');
  console.log('========================================');
  console.log(`总测试数: ${totalTests}`);
  console.log(`  - 单日期测试: ${singleDateResult.total}`);
  console.log(`  - 日期范围测试: ${dateRangeResult.total}`);
  console.log(`\n通过: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(2)}%)`);
  console.log(`  - 单日期通过: ${singleDateResult.passed}`);
  console.log(`  - 日期范围通过: ${dateRangeResult.passed}`);
  console.log(`\n失败: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(2)}%)`);
  console.log(`  - 单日期失败: ${singleDateResult.failed}`);
  console.log(`  - 日期范围失败: ${dateRangeResult.failed}`);
  console.log('========================================\n');

  if (totalFailed > 0) {
    console.log('失败的测试用例详情:');
    console.log('========================================');

    if (singleDateResult.failedCases.length > 0) {
      console.log('\n【单日期测试失败】');
      for (const failedCase of singleDateResult.failedCases) {
        console.log(`描述: ${failedCase.description}`);
        console.log(`输入: "${failedCase.input}"`);
        console.log(`期望: ${failedCase.expected}`);
        console.log(`实际: ${failedCase.actual}`);
        console.log('---');
      }
    }

    if (dateRangeResult.failedCases.length > 0) {
      console.log('\n【日期范围测试失败】');
      for (const failedCase of dateRangeResult.failedCases) {
        console.log(`描述: ${failedCase.description}`);
        console.log(`输入: "${failedCase.input}"`);
        console.log(`期望: ${failedCase.expected}`);
        console.log(`实际: ${failedCase.actual}`);
        console.log('---');
      }
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('日期识别全面测试');
  console.log('========================================\n');

  const singleDateResult = runSingleDateTests();
  const dateRangeResult = runDateRangeTests();

  printSummary(singleDateResult, dateRangeResult);

  // 退出代码：如果有失败的测试，返回 1
  const totalFailed = singleDateResult.failed + dateRangeResult.failed;
  process.exit(totalFailed > 0 ? 1 : 0);
}

// 运行测试
main();
