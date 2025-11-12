/**
 * 雪场识别功能综合测试脚本
 *
 * 按照 Linus Torvalds 原则：
 * "Bad programmers worry about the code. Good programmers worry about data structures."
 *
 * 本测试专注于数据完整性和识别准确性
 */

import { ResortIndex } from './src/features/ai/utils/ResortIndex';
import { getLocalResorts } from './src/shared/data/local-resorts';
import type { Resort } from './src/shared/data/resorts';

// 测试用例接口
interface TestCase {
  input: string;
  expectedResortId: string;
  category: string;
  description: string;
}

// 测试结果接口
interface TestResult {
  input: string;
  expectedResortId: string;
  actualResortId: string | null;
  actualResortName: string | null;
  confidence: number;
  passed: boolean;
  category: string;
  description: string;
}

/**
 * 测试用例数据（覆盖所有 43 个雪场）
 */
const TEST_CASES: TestCase[] = [
  // ==================== 北海道 (5个) ====================
  { input: '富良野', expectedResortId: 'hokkaido_furano', category: '北海道', description: '核心名称' },
  { input: '富良野滑雪场', expectedResortId: 'hokkaido_furano', category: '北海道', description: '完整名称' },
  { input: 'furano', expectedResortId: 'hokkaido_furano', category: '北海道', description: '拼音' },
  { input: '去富良野滑雪', expectedResortId: 'hokkaido_furano', category: '北海道', description: '口语化' },

  { input: '二世谷', expectedResortId: 'hokkaido_niseko_moiwa', category: '北海道', description: '核心名称' },
  { input: 'niseko', expectedResortId: 'hokkaido_niseko_moiwa', category: '北海道', description: '拼音' },
  { input: '二世谷Moiwa', expectedResortId: 'hokkaido_niseko_moiwa', category: '北海道', description: '完整别名' },
  { input: '想去二世谷', expectedResortId: 'hokkaido_niseko_moiwa', category: '北海道', description: '口语化' },

  { input: '留寿都', expectedResortId: 'hokkaido_rusutsu', category: '北海道', description: '核心名称' },
  { input: '留壽都', expectedResortId: 'hokkaido_rusutsu', category: '北海道', description: '繁体字' },
  { input: 'rusutsu', expectedResortId: 'hokkaido_rusutsu', category: '北海道', description: '拼音' },

  { input: '札幌手稻', expectedResortId: 'hokkaido_sapporo_teine', category: '北海道', description: '核心名称' },
  { input: '手稻', expectedResortId: 'hokkaido_sapporo_teine', category: '北海道', description: '简称' },

  { input: '星野TOMAMU', expectedResortId: 'hokkaido_tomamu', category: '北海道', description: '完整名称' },
  { input: 'TOMAMU', expectedResortId: 'hokkaido_tomamu', category: '北海道', description: '核心名称' },
  { input: 'tomamu', expectedResortId: 'hokkaido_tomamu', category: '北海道', description: '小写拼音' },
  { input: '星野', expectedResortId: 'hokkaido_tomamu', category: '北海道', description: '品牌名' },

  // ==================== 长野白马地区 (6个) ====================
  { input: '白马八方尾根', expectedResortId: 'hakuba_happo_one', category: '白马', description: '完整名称' },
  { input: '白馬八方尾根', expectedResortId: 'hakuba_happo_one', category: '白马', description: '繁体字' },
  { input: '白马八方', expectedResortId: 'hakuba_happo_one', category: '白马', description: '核心名称' },
  { input: '八方尾根', expectedResortId: 'hakuba_happo_one', category: '白马', description: '简称' },
  { input: '八方', expectedResortId: 'hakuba_happo_one', category: '白马', description: '最简称' },
  { input: 'hakuba happo', expectedResortId: 'hakuba_happo_one', category: '白马', description: '英文' },
  { input: 'happo', expectedResortId: 'hakuba_happo_one', category: '白马', description: '英文简称' },

  { input: '白马五龙', expectedResortId: 'hakuba_goryu_47', category: '白马', description: '核心名称' },
  { input: '白馬五龍', expectedResortId: 'hakuba_goryu_47', category: '白马', description: '繁体字' },
  { input: '白马47', expectedResortId: 'hakuba_goryu_47', category: '白马', description: '别名' },
  { input: '五龙', expectedResortId: 'hakuba_goryu_47', category: '白马', description: '简称' },
  { input: 'goryu', expectedResortId: 'hakuba_goryu_47', category: '白马', description: '拼音' },

  { input: '白马Cortina', expectedResortId: 'hakuba_cortina', category: '白马', description: '完整名称' },
  { input: '白馬Cortina', expectedResortId: 'hakuba_cortina', category: '白马', description: '繁体字' },
  { input: 'cortina', expectedResortId: 'hakuba_cortina', category: '白马', description: '简称' },

  { input: '白马岩岳', expectedResortId: 'hakuba_iwatake', category: '白马', description: '核心名称' },
  { input: '白馬岩岳', expectedResortId: 'hakuba_iwatake', category: '白马', description: '繁体字' },
  { input: '岩岳', expectedResortId: 'hakuba_iwatake', category: '白马', description: '简称' },
  { input: 'iwatake', expectedResortId: 'hakuba_iwatake', category: '白马', description: '拼音' },

  { input: '白马栂池', expectedResortId: 'hakuba_tsugaike_kogen', category: '白马', description: '核心名称' },
  { input: '白馬栂池', expectedResortId: 'hakuba_tsugaike_kogen', category: '白马', description: '繁体字' },
  { input: '栂池', expectedResortId: 'hakuba_tsugaike_kogen', category: '白马', description: '简称' },
  { input: 'tsugaike', expectedResortId: 'hakuba_tsugaike_kogen', category: '白马', description: '拼音' },

  { input: '白马乘鞍', expectedResortId: 'hakuba_norikura', category: '白马', description: '核心名称' },
  { input: '白馬乗鞍', expectedResortId: 'hakuba_norikura', category: '白马', description: '繁体字' },
  { input: '乘鞍', expectedResortId: 'hakuba_norikura', category: '白马', description: '简称' },
  { input: 'norikura', expectedResortId: 'hakuba_norikura', category: '白马', description: '拼音' },

  // ==================== 长野其他 (4个) ====================
  { input: '轻井泽王子', expectedResortId: 'nagano_karuizawa_prince', category: '长野其他', description: '核心名称' },
  { input: '輕井澤王子', expectedResortId: 'nagano_karuizawa_prince', category: '长野其他', description: '繁体字' },
  { input: '轻井泽', expectedResortId: 'nagano_karuizawa_prince', category: '长野其他', description: '简称' },
  { input: 'karuizawa', expectedResortId: 'nagano_karuizawa_prince', category: '长野其他', description: '拼音' },

  { input: '野泽温泉', expectedResortId: 'nagano_nozawa_onsen', category: '长野其他', description: '核心名称' },
  { input: '野澤溫泉', expectedResortId: 'nagano_nozawa_onsen', category: '长野其他', description: '繁体字' },
  { input: '野泽', expectedResortId: 'nagano_nozawa_onsen', category: '长野其他', description: '简称' },
  { input: 'nozawa', expectedResortId: 'nagano_nozawa_onsen', category: '长野其他', description: '拼音' },

  { input: '黑姬高原', expectedResortId: 'nagano_kurohime_kogen', category: '长野其他', description: '核心名称' },
  { input: '黑姬', expectedResortId: 'nagano_kurohime_kogen', category: '长野其他', description: '简称' },

  { input: '斑尾高原', expectedResortId: 'nagano_madarao_kogen', category: '长野其他', description: '核心名称' },
  { input: '斑尾', expectedResortId: 'nagano_madarao_kogen', category: '长野其他', description: '简称' },

  // ==================== 新潟妙高地区 (5个) ====================
  { input: '赤仓观光', expectedResortId: 'myoko_akakura_kanko', category: '妙高', description: '核心名称' },
  { input: '赤倉觀光', expectedResortId: 'myoko_akakura_kanko', category: '妙高', description: '繁体字' },
  { input: '赤仓', expectedResortId: 'myoko_akakura_kanko', category: '妙高', description: '简称（应返回观光）' },

  { input: '赤仓温泉', expectedResortId: 'myoko_akakura_onsen', category: '妙高', description: '核心名称' },
  { input: '赤倉溫泉', expectedResortId: 'myoko_akakura_onsen', category: '妙高', description: '繁体字' },

  { input: '妙高池之平', expectedResortId: 'myoko_ikenotaira', category: '妙高', description: '核心名称' },
  { input: '池之平', expectedResortId: 'myoko_ikenotaira', category: '妙高', description: '简称' },

  { input: '乐天新井', expectedResortId: 'myoko_lotte_arai', category: '妙高', description: '核心名称' },
  { input: '樂天新井', expectedResortId: 'myoko_lotte_arai', category: '妙高', description: '繁体字' },
  { input: '新井', expectedResortId: 'myoko_lotte_arai', category: '妙高', description: '简称' },

  { input: '妙高杉之原', expectedResortId: 'myoko_suginohara', category: '妙高', description: '核心名称' },
  { input: '杉之原', expectedResortId: 'myoko_suginohara', category: '妙高', description: '简称' },

  // ==================== 新潟湯澤地区 (11个) ====================
  { input: 'GALA湯澤', expectedResortId: 'yuzawa_gala', category: '湯澤', description: '完整名称' },
  { input: 'GALA汤泽', expectedResortId: 'yuzawa_gala', category: '湯澤', description: '简体字' },
  { input: 'GALA', expectedResortId: 'yuzawa_gala', category: '湯澤', description: '核心名称' },
  { input: 'gala', expectedResortId: 'yuzawa_gala', category: '湯澤', description: '小写' },

  { input: '石打丸山', expectedResortId: 'yuzawa_ishiuchi_maruyama', category: '湯澤', description: '核心名称' },
  { input: '石打', expectedResortId: 'yuzawa_ishiuchi_maruyama', category: '湯澤', description: '简称' },

  { input: '岩原', expectedResortId: 'yuzawa_iwappara', category: '湯澤', description: '核心名称' },
  { input: 'iwappara', expectedResortId: 'yuzawa_iwappara', category: '湯澤', description: '拼音' },

  { input: '上越国际', expectedResortId: 'yuzawa_joetsu_kokusai', category: '湯澤', description: '核心名称' },
  { input: '上越國際', expectedResortId: 'yuzawa_joetsu_kokusai', category: '湯澤', description: '繁体字' },
  { input: '上越', expectedResortId: 'yuzawa_joetsu_kokusai', category: '湯澤', description: '简称' },

  { input: '神乐', expectedResortId: 'yuzawa_kagura', category: '湯澤', description: '核心名称' },
  { input: '神樂', expectedResortId: 'yuzawa_kagura', category: '湯澤', description: '繁体字' },
  { input: 'kagura', expectedResortId: 'yuzawa_kagura', category: '湯澤', description: '拼音' },

  { input: '神立高原', expectedResortId: 'yuzawa_kandatsu', category: '湯澤', description: '核心名称' },
  { input: '神立', expectedResortId: 'yuzawa_kandatsu', category: '湯澤', description: '简称' },

  { input: '舞子高原', expectedResortId: 'yuzawa_maiko_kogen', category: '湯澤', description: '核心名称' },
  { input: '舞子', expectedResortId: 'yuzawa_maiko_kogen', category: '湯澤', description: '简称' },

  { input: '苗场', expectedResortId: 'yuzawa_naeba', category: '湯澤', description: '核心名称' },
  { input: '苗場', expectedResortId: 'yuzawa_naeba', category: '湯澤', description: '繁体字' },
  { input: 'naeba', expectedResortId: 'yuzawa_naeba', category: '湯澤', description: '拼音' },
  { input: '苗场怎么样', expectedResortId: 'yuzawa_naeba', category: '湯澤', description: '口语化' },

  { input: '湯澤中里', expectedResortId: 'yuzawa_nakazato', category: '湯澤', description: '完整名称' },
  { input: '汤泽中里', expectedResortId: 'yuzawa_nakazato', category: '湯澤', description: '简体字' },
  { input: '中里', expectedResortId: 'yuzawa_nakazato', category: '湯澤', description: '简称' },

  { input: 'NASPA', expectedResortId: 'yuzawa_naspa_ski_garden', category: '湯澤', description: '核心名称' },
  { input: 'naspa', expectedResortId: 'yuzawa_naspa_ski_garden', category: '湯澤', description: '小写' },

  { input: '湯澤公園', expectedResortId: 'yuzawa_park', category: '湯澤', description: '完整名称' },
  { input: '汤泽公园', expectedResortId: 'yuzawa_park', category: '湯澤', description: '简体字' },

  // ==================== 其他地区 (12个) ====================
  { input: '猪苗代', expectedResortId: 'fukushima_inawashiro', category: '其他', description: '核心名称' },
  { input: 'inawashiro', expectedResortId: 'fukushima_inawashiro', category: '其他', description: '拼音' },

  { input: '星野NEKOMA', expectedResortId: 'fukushima_nekoma_mountain', category: '其他', description: '核心名称' },
  { input: 'NEKOMA', expectedResortId: 'fukushima_nekoma_mountain', category: '其他', description: '简称' },
  { input: 'nekoma', expectedResortId: 'fukushima_nekoma_mountain', category: '其他', description: '小写' },

  { input: '丸沼高原', expectedResortId: 'gunma_marunuma_kogen', category: '其他', description: '核心名称' },
  { input: '丸沼', expectedResortId: 'gunma_marunuma_kogen', category: '其他', description: '简称' },

  { input: '水上高原', expectedResortId: 'gunma_minakami_kogen', category: '其他', description: '核心名称' },
  { input: '水上', expectedResortId: 'gunma_minakami_kogen', category: '其他', description: '简称' },

  { input: '尾濑岩鞍', expectedResortId: 'gunma_oze_iwakura', category: '其他', description: '核心名称' },
  { input: '岩鞍', expectedResortId: 'gunma_oze_iwakura', category: '其他', description: '简称' },

  { input: 'White Valley', expectedResortId: 'gunma_white_valley', category: '其他', description: '英文名' },
  { input: 'white valley', expectedResortId: 'gunma_white_valley', category: '其他', description: '小写英文' },

  { input: '安比高原', expectedResortId: 'iwate_appi_kogen', category: '其他', description: '核心名称' },
  { input: '安比', expectedResortId: 'iwate_appi_kogen', category: '其他', description: '简称' },
  { input: 'appi', expectedResortId: 'iwate_appi_kogen', category: '其他', description: '拼音' },

  { input: '雫石', expectedResortId: 'iwate_shizukuishi', category: '其他', description: '核心名称' },
  { input: 'shizukuishi', expectedResortId: 'iwate_shizukuishi', category: '其他', description: '拼音' },

  { input: '龙王', expectedResortId: 'nagano_ryuoo_ski_park', category: '其他', description: '核心名称' },
  { input: '龍王', expectedResortId: 'nagano_ryuoo_ski_park', category: '其他', description: '繁体字' },

  { input: 'Edelweiss', expectedResortId: 'tochigi_edelweiss', category: '其他', description: '核心名称' },
  { input: 'edelweiss', expectedResortId: 'tochigi_edelweiss', category: '其他', description: '小写' },

  { input: 'Hunter Mountain', expectedResortId: 'tochigi_hunter_mountain_shiobara', category: '其他', description: '英文名' },
  { input: 'hunter mountain', expectedResortId: 'tochigi_hunter_mountain_shiobara', category: '其他', description: '小写英文' },

  { input: '蔵王温泉', expectedResortId: 'yamagata_zao_onsen', category: '其他', description: '核心名称' },
  { input: '藏王溫泉', expectedResortId: 'yamagata_zao_onsen', category: '其他', description: '繁体字' },
  { input: '蔵王', expectedResortId: 'yamagata_zao_onsen', category: '其他', description: '简称' },
  { input: 'zao', expectedResortId: 'yamagata_zao_onsen', category: '其他', description: '拼音' },

  // ==================== 地区群组测试 ====================
  { input: '白马', expectedResortId: 'hakuba_happo_one', category: '地区群', description: '白马地区（应返回建议列表）' },
  { input: 'hakuba', expectedResortId: 'hakuba_happo_one', category: '地区群', description: '白马拼音' },
  { input: '妙高', expectedResortId: 'myoko_akakura_kanko', category: '地区群', description: '妙高地区（应返回建议列表）' },
  { input: 'myoko', expectedResortId: 'myoko_akakura_kanko', category: '地区群', description: '妙高拼音' },
  { input: '汤泽', expectedResortId: 'yuzawa_gala', category: '地区群', description: '汤泽地区（应返回建议列表）' },
  { input: 'yuzawa', expectedResortId: 'yuzawa_gala', category: '地区群', description: '汤泽拼音' },
];

/**
 * 运行测试
 */
async function runTests(): Promise<void> {
  console.log('='.repeat(80));
  console.log('雪场识别功能综合测试');
  console.log('='.repeat(80));
  console.log();

  // 获取雪场数据
  const resorts = getLocalResorts();
  console.log(`✓ 已加载 ${resorts.length} 个雪场数据`);
  console.log();

  // 创建索引
  const index = new ResortIndex(resorts);
  console.log('✓ 已创建雪场索引');
  console.log();

  // 运行测试
  const results: TestResult[] = [];
  let passCount = 0;
  let failCount = 0;

  console.log('开始执行测试...');
  console.log('-'.repeat(80));

  for (const testCase of TEST_CASES) {
    const match = index.match(testCase.input);

    const passed = match?.resort.resort_id === testCase.expectedResortId;

    if (passed) {
      passCount++;
    } else {
      failCount++;
    }

    const result: TestResult = {
      input: testCase.input,
      expectedResortId: testCase.expectedResortId,
      actualResortId: match?.resort.resort_id || null,
      actualResortName: match?.resort.names.zh || null,
      confidence: match?.confidence || 0,
      passed,
      category: testCase.category,
      description: testCase.description,
    };

    results.push(result);

    // 实时输出测试结果
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const color = passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${color}${status}${reset} | ${testCase.input.padEnd(20)} | ${testCase.category.padEnd(10)} | ${testCase.description}`);

    if (!passed) {
      const expectedResort = resorts.find(r => r.resort_id === testCase.expectedResortId);
      console.log(`      期望: ${expectedResort?.names.zh || testCase.expectedResortId}`);
      console.log(`      实际: ${result.actualResortName || '无匹配'} (${result.actualResortId || 'null'})`);
      console.log(`      信心度: ${result.confidence.toFixed(2)}`);
    }
  }

  console.log('-'.repeat(80));
  console.log();

  // 统计结果
  console.log('='.repeat(80));
  console.log('测试结果摘要');
  console.log('='.repeat(80));
  console.log();
  console.log(`总测试数: ${TEST_CASES.length}`);
  console.log(`通过数: ${passCount} (${(passCount / TEST_CASES.length * 100).toFixed(1)}%)`);
  console.log(`失败数: ${failCount} (${(failCount / TEST_CASES.length * 100).toFixed(1)}%)`);
  console.log();

  // 按类别统计
  const categoryStats = new Map<string, { pass: number; fail: number }>();
  for (const result of results) {
    if (!categoryStats.has(result.category)) {
      categoryStats.set(result.category, { pass: 0, fail: 0 });
    }
    const stats = categoryStats.get(result.category)!;
    if (result.passed) {
      stats.pass++;
    } else {
      stats.fail++;
    }
  }

  console.log('按类别统计:');
  console.log('-'.repeat(80));
  for (const [category, stats] of categoryStats) {
    const total = stats.pass + stats.fail;
    const passRate = (stats.pass / total * 100).toFixed(1);
    console.log(`${category.padEnd(15)} | 通过: ${stats.pass}/${total} (${passRate}%)`);
  }
  console.log();

  // 失败案例详情
  const failedResults = results.filter(r => !r.passed);
  if (failedResults.length > 0) {
    console.log('='.repeat(80));
    console.log('失败案例详情');
    console.log('='.repeat(80));
    console.log();

    // 按类别分组失败案例
    const failuresByCategory = new Map<string, TestResult[]>();
    for (const result of failedResults) {
      if (!failuresByCategory.has(result.category)) {
        failuresByCategory.set(result.category, []);
      }
      failuresByCategory.get(result.category)!.push(result);
    }

    for (const [category, failures] of failuresByCategory) {
      console.log(`【${category}】`);
      console.log('-'.repeat(80));
      for (const failure of failures) {
        const expectedResort = resorts.find(r => r.resort_id === failure.expectedResortId);
        console.log(`输入: "${failure.input}" (${failure.description})`);
        console.log(`  期望: ${expectedResort?.names.zh} (${failure.expectedResortId})`);
        console.log(`  实际: ${failure.actualResortName || '无匹配'} (${failure.actualResortId || 'null'})`);
        console.log(`  信心度: ${failure.confidence.toFixed(2)}`);
        console.log();
      }
    }
  }

  // 保存结果到文件
  const resultsJson = JSON.stringify(results, null, 2);
  const fs = await import('fs');
  fs.writeFileSync('test-results.json', resultsJson, 'utf-8');
  console.log('✓ 测试结果已保存到 test-results.json');
  console.log();

  // 生成改善建议
  if (failedResults.length > 0) {
    console.log('='.repeat(80));
    console.log('问题分析与改善建议');
    console.log('='.repeat(80));
    console.log();

    analyzeFailures(failedResults, resorts);
  }
}

/**
 * 分析失败原因并提出改善建议
 */
function analyzeFailures(failures: TestResult[], resorts: Resort[]): void {
  // 分类问题
  const missingAliases: TestResult[] = [];
  const wrongMatch: TestResult[] = [];
  const noMatch: TestResult[] = [];

  for (const failure of failures) {
    if (!failure.actualResortId) {
      noMatch.push(failure);
    } else if (failure.actualResortId !== failure.expectedResortId) {
      wrongMatch.push(failure);
    }
  }

  console.log('1. 完全无法识别的案例:');
  console.log('-'.repeat(80));
  if (noMatch.length > 0) {
    for (const result of noMatch) {
      const expectedResort = resorts.find(r => r.resort_id === result.expectedResortId);
      console.log(`  - "${result.input}" -> 期望: ${expectedResort?.names.zh}`);
      console.log(`    原因: 别名配置缺失或匹配算法无法识别`);
    }
  } else {
    console.log('  无');
  }
  console.log();

  console.log('2. 匹配到错误雪场的案例:');
  console.log('-'.repeat(80));
  if (wrongMatch.length > 0) {
    for (const result of wrongMatch) {
      const expectedResort = resorts.find(r => r.resort_id === result.expectedResortId);
      console.log(`  - "${result.input}" -> 期望: ${expectedResort?.names.zh}, 实际: ${result.actualResortName}`);
      console.log(`    原因: 优先级问题或别名冲突`);
    }
  } else {
    console.log('  无');
  }
  console.log();

  console.log('3. 建议改善措施:');
  console.log('-'.repeat(80));
  console.log('  a) 数据结构层面:');
  console.log('     - 补充缺失的雪场别名（resortAliases.ts）');
  console.log('     - 调整优先级配置，处理歧义匹配');
  console.log('     - 添加更多常见的简称和口语化表达');
  console.log();
  console.log('  b) 算法层面:');
  console.log('     - 优化拼音匹配逻辑');
  console.log('     - 改进简繁体字识别');
  console.log('     - 优化地区群组识别');
  console.log();
  console.log('  c) 具体需要补充的别名:');

  // 分析具体需要补充的别名
  const aliasesToAdd = new Map<string, string[]>();
  for (const result of noMatch) {
    const resortId = result.expectedResortId;
    if (!aliasesToAdd.has(resortId)) {
      aliasesToAdd.set(resortId, []);
    }
    aliasesToAdd.get(resortId)!.push(result.input);
  }

  if (aliasesToAdd.size > 0) {
    for (const [resortId, aliases] of aliasesToAdd) {
      const resort = resorts.find(r => r.resort_id === resortId);
      console.log(`     - ${resort?.names.zh} (${resortId}): ${aliases.join(', ')}`);
    }
  } else {
    console.log('     - 无需补充新别名，主要是算法优化问题');
  }
  console.log();
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
