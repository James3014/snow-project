/**
 * 简化的测试脚本 - 用于快速验证雪场和日期识别
 * 使用 Node.js 直接运行，不需要 TypeScript 编译
 */

const fs = require('fs');
const path = require('path');

// 读取雪场数据
const resortsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/resorts_for_matcher.json'), 'utf8')
);

console.log('========================================');
console.log('雪场识别和日期识别快速测试');
console.log('========================================\n');

// 测试 1: 验证雪场数据加载
console.log('✅ 测试 1: 雪场数据加载');
console.log(`   成功加载 ${resortsData.resorts.length} 个雪场数据`);
console.log(`   数据生成时间: ${resortsData.metadata.generated_at}`);
console.log();

// 测试 2: 列出所有雪场名称
console.log('✅ 测试 2: 所有雪场列表');
console.log('---');
const resortsByRegion = {};
for (const resort of resortsData.resorts) {
  const region = resort.region;
  if (!resortsByRegion[region]) {
    resortsByRegion[region] = [];
  }
  resortsByRegion[region].push({
    id: resort.id,
    name: resort.name,
    name_en: resort.name_en,
    name_ja: resort.name_ja,
  });
}

for (const [region, resorts] of Object.entries(resortsByRegion)) {
  console.log(`\n【${region}】 (${resorts.length} 个雪场)`);
  for (const resort of resorts) {
    console.log(`  • ${resort.name}`);
    console.log(`    - ID: ${resort.id}`);
    console.log(`    - 英文: ${resort.name_en}`);
    console.log(`    - 日文: ${resort.name_ja}`);
  }
}

console.log();
console.log('========================================');
console.log('需要测试的雪场识别场景');
console.log('========================================\n');

// 生成测试场景
const testScenarios = [
  { resort: '白馬Cortina滑雪場', variations: ['白馬', 'cortina', 'hakuba cortina', 'baima'] },
  { resort: '二世谷Moiwa滑雪場', variations: ['二世谷', 'niseko', 'moiwa', 'ershi'] },
  { resort: '野澤溫泉滑雪場', variations: ['野澤', 'nozawa', 'yeze'] },
  { resort: '富良野滑雪度假村', variations: ['富良野', 'furano', 'fuliang'] },
  { resort: '留壽都度假村', variations: ['留壽都', 'rusutsu', 'liushou'] },
  { resort: '神樂滑雪場', variations: ['神樂', 'kagura', 'shenle'] },
  { resort: '苗場滑雪場', variations: ['苗場', 'naeba', 'miaochang'] },
  { resort: 'GALA湯澤滑雪場', variations: ['GALA', 'gala', '湯澤', 'yuzawa'] },
  { resort: '安比高原滑雪場', variations: ['安比', 'appi', 'anbi'] },
  { resort: '藏王溫泉滑雪場', variations: ['藏王', 'zao', 'cangwang'] },
];

console.log('热门雪场需要测试的变体:\n');
for (const scenario of testScenarios) {
  console.log(`${scenario.resort}:`);
  console.log(`  测试输入: ${scenario.variations.join(', ')}`);
  console.log();
}

console.log('========================================');
console.log('需要测试的日期格式');
console.log('========================================\n');

const dateFormats = [
  { category: '绝对日期', formats: [
    '2024-12-25',
    '2024/12/25',
    '2024年12月25日',
    '12月25日',
    '12/25',
    '12-25'
  ]},
  { category: '相对日期', formats: [
    '今天',
    '明天',
    '後天',
    '大後天',
    '下週一',
    '下週五',
    '5天後',
    '2週後'
  ]},
  { category: '日期范围', formats: [
    '12月11到20日',
    '12月11至20日',
    '12月11~20日',
    '12/11-20',
    '1月5到10日'
  ]},
  { category: '综合场景', formats: [
    '白馬12月14-16',
    '二世谷明天',
    'nozawa onsen 2月20日',
    '富良野12月25日到12月30日'
  ]}
];

for (const category of dateFormats) {
  console.log(`【${category.category}】`);
  for (const format of category.formats) {
    console.log(`  • ${format}`);
  }
  console.log();
}

console.log('========================================');
console.log('测试总结');
console.log('========================================');
console.log(`总雪场数: ${resortsData.resorts.length}`);
console.log(`需要测试的场景: ${testScenarios.length * 4 + dateFormats.reduce((sum, cat) => sum + cat.formats.length, 0)}`);
console.log();
console.log('✅ 数据验证完成！');
console.log('👉 请运行完整测试以验证所有场景:');
console.log('   cd platform/frontend/ski-platform');
console.log('   npx ts-node --esm ../../../tests/resort_recognition_test.ts');
console.log();
