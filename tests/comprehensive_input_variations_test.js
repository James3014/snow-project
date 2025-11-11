/**
 * 全面的輸入變化測試
 * 涵蓋用戶可能使用的各種中文說法
 * 目的：主動發現問題，而不是等用戶回報
 */

const fs = require('fs');
const path = require('path');

// 讀取本地雪場資料
const localResortsPath = path.join(__dirname, '../platform/frontend/ski-platform/src/shared/data/local-resorts.ts');
const localResortsContent = fs.readFileSync(localResortsPath, 'utf-8');
const match = localResortsContent.match(/export const LOCAL_RESORTS: Resort\[\] = (\[[\s\S]*?\n\]);/);
const resortsData = JSON.parse(match[1]);

// 別名配置
const RESORT_ALIASES = {
  'yuzawa_naeba': {
    aliases: ['苗場滑雪場', '苗場', 'naeba'],
    priority: 10,
  },
  'hokkaido_tomamu': {
    aliases: ['星野集團TOMAMU度假村', '星野TOMAMU', 'TOMAMU', 'tomamu', '星野', 'hoshino'],
    priority: 10,
  },
  'hakuba_happo_one': {
    aliases: ['白馬八方尾根滑雪場', '白馬八方尾根', '白馬八方', '八方尾根', '八方'],
    priority: 9,
  },
  'nagano_nozawa_onsen': {
    aliases: ['野澤溫泉滑雪場', '野澤溫泉', '野澤', 'nozawa'],
    priority: 9,
  },
};

function getAliases(resort_id, fullName) {
  if (RESORT_ALIASES[resort_id]) {
    return RESORT_ALIASES[resort_id].aliases;
  }
  const withoutSuffix = fullName.replace(/滑雪場|度假村|滑雪度假村|滑雪公園|溫泉|高原/g, '').trim();
  return [fullName, withoutSuffix];
}

function getPriority(resort_id) {
  return RESORT_ALIASES[resort_id]?.priority || 5;
}

function matchSingleResort(input, resort) {
  const normalized = input.toLowerCase().trim();
  const aliases = getAliases(resort.resort_id, resort.names.zh);

  let bestConfidence = 0;

  for (let i = 0; i < aliases.length; i++) {
    const alias = aliases[i].toLowerCase();

    if (normalized === alias) {
      return { confidence: i === 0 ? 1.0 : 0.98 };
    }

    if (normalized.includes(alias) && alias.length >= 2) {
      let confidence = 0.85;
      if (alias.length >= 4) confidence = 0.90;
      else if (alias.length === 3) confidence = 0.87;
      else confidence = 0.80;

      if (i === 0) confidence += 0.05;
      bestConfidence = Math.max(bestConfidence, confidence);
    }

    if (alias.includes(normalized) && normalized.length >= 2) {
      bestConfidence = Math.max(bestConfidence, 0.75);
    }
  }

  return bestConfidence > 0 ? { confidence: bestConfidence } : null;
}

function matchResort(input, resorts) {
  const matches = [];

  for (const resort of resorts) {
    const result = matchSingleResort(input, resort);
    if (result && result.confidence >= 0.5) {
      matches.push({
        resort,
        confidence: result.confidence,
        priority: getPriority(resort.resort_id),
      });
    }
  }

  matches.sort((a, b) => {
    const confidenceDiff = b.confidence - a.confidence;
    if (Math.abs(confidenceDiff) < 0.01) {
      return b.priority - a.priority;
    }
    return confidenceDiff;
  });

  return matches.length > 0 ? matches[0] : null;
}

// === 測試案例：涵蓋各種常見的中文說法 ===
const testCases = [
  // 雪場：苗場
  {
    category: '基本格式',
    input: '苗場',
    expected: 'yuzawa_naeba',
  },
  {
    category: '去+雪場',
    input: '去苗場',
    expected: 'yuzawa_naeba',
  },
  {
    category: '想去+雪場',
    input: '想去苗場',
    expected: 'yuzawa_naeba',
  },
  {
    category: '打算去+雪場',
    input: '打算去苗場',
    expected: 'yuzawa_naeba',
  },
  {
    category: '新增+雪場+日期',
    input: '新增苗場2月3到7日',
    expected: 'yuzawa_naeba',
  },
  {
    category: '日期+去+雪場',
    input: '2月3到8日去苗場',
    expected: 'yuzawa_naeba',
  },
  {
    category: '我+時間+要去+雪場',
    input: '我2月要去苗場',
    expected: 'yuzawa_naeba',
  },
  {
    category: '我在+日期範圍+要去+雪場',
    input: '我在2月20-28要去苗場',
    expected: 'yuzawa_naeba',
  },
  {
    category: '我+日期+想去+雪場',
    input: '我2月20日想去苗場',
    expected: 'yuzawa_naeba',
  },
  {
    category: '計劃+日期+去+雪場',
    input: '計劃2月去苗場',
    expected: 'yuzawa_naeba',
  },
  {
    category: '準備+日期+去+雪場',
    input: '準備2月去苗場',
    expected: 'yuzawa_naeba',
  },

  // 雪場：星野
  {
    category: '基本格式',
    input: '星野',
    expected: 'hokkaido_tomamu',
  },
  {
    category: '日期+去+雪場',
    input: '1月2號到6號去星野',
    expected: 'hokkaido_tomamu',
  },
  {
    category: '我+日期+要去+雪場',
    input: '我1月要去星野',
    expected: 'hokkaido_tomamu',
  },

  // 雪場：白馬八方
  {
    category: '日期+去+雪場',
    input: '12月20到26去白馬八方',
    expected: 'hakuba_happo_one',
  },
  {
    category: '我+日期+想去+雪場',
    input: '我12月想去白馬八方',
    expected: 'hakuba_happo_one',
  },

  // 雪場：野澤溫泉
  {
    category: '跨年日期+去+雪場',
    input: '12-30到1月2號去野澤溫泉',
    expected: 'nagano_nozawa_onsen',
  },
  {
    category: '想去+雪場+日期',
    input: '想去野澤溫泉12月',
    expected: 'nagano_nozawa_onsen',
  },

  // 更多變化
  {
    category: '要+雪場+日期',
    input: '要苗場2月20日',
    expected: 'yuzawa_naeba',
  },
  {
    category: '幫我+動詞+雪場',
    input: '幫我新增苗場',
    expected: 'yuzawa_naeba',
  },
  {
    category: '建立+雪場+行程',
    input: '建立苗場行程',
    expected: 'yuzawa_naeba',
  },

  // === 語序變化：雪場在前 ===
  {
    category: '【語序】雪場+日期',
    input: '苗場2月21-28',
    expected: 'yuzawa_naeba',
  },
  {
    category: '【語序】雪場+我要+日期+去',
    input: '苗場我要在2月21-28去',
    expected: 'yuzawa_naeba',
  },
  {
    category: '【語序】雪場+我+日期+想去',
    input: '苗場我2月想去',
    expected: 'yuzawa_naeba',
  },
  {
    category: '【語序】雪場+日期+要去',
    input: '苗場2月20日要去',
    expected: 'yuzawa_naeba',
  },

  // === 語序變化：雪場在中間 ===
  {
    category: '【語序】我+雪場+日期',
    input: '我苗場2月',
    expected: 'yuzawa_naeba',
  },
  {
    category: '【語序】日期+雪場+要去',
    input: '2月苗場要去',
    expected: 'yuzawa_naeba',
  },
];

// 執行測試
console.log('=== 全面的輸入變化測試 ===');
console.log(`總共 ${testCases.length} 個測試案例\n`);

let passCount = 0;
let failCount = 0;
const failures = [];

// 按分類分組
const byCategory = {};
testCases.forEach(test => {
  if (!byCategory[test.category]) {
    byCategory[test.category] = [];
  }
  byCategory[test.category].push(test);
});

Object.keys(byCategory).forEach(category => {
  console.log(`\n【${category}】`);
  byCategory[category].forEach((test) => {
    const result = matchResort(test.input, resortsData);
    const pass = result && result.resort.resort_id === test.expected;

    if (pass) {
      console.log(`  ✅ "${test.input}" → ${result.resort.names.zh}`);
      passCount++;
    } else {
      console.log(`  ❌ "${test.input}" → ${result ? result.resort.names.zh : '無匹配'} (預期：${test.expected})`);
      failCount++;
      failures.push({
        category: test.category,
        input: test.input,
        expected: test.expected,
        actual: result ? result.resort.resort_id : null,
      });
    }
  });
});

console.log('\n\n=== 測試總結 ===\n');
console.log(`總計：${testCases.length} 個案例`);
console.log(`通過：${passCount} 個 ✅`);
console.log(`失敗：${failCount} 個 ❌`);
console.log(`成功率：${(passCount / testCases.length * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log('\n=== 失敗案例 ===\n');
  failures.forEach((f, i) => {
    console.log(`${i + 1}. [${f.category}] "${f.input}"`);
    console.log(`   預期：${f.expected}`);
    console.log(`   實際：${f.actual || 'null'}\n`);
  });
  process.exit(1);
} else {
  console.log('\n✅ 所有常見說法都能正確識別！');
  process.exit(0);
}
