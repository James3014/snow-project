/**
 * 測試新的別名系統
 */

// 模擬別名系統
const RESORT_ALIASES = {
  'hokkaido_tomamu': {
    aliases: ['星野集團TOMAMU度假村', '星野TOMAMU', 'TOMAMU', 'tomamu', '星野', 'hoshino'],
    priority: 10,
  },
  'fukushima_nekoma_mountain': {
    aliases: ['星野集團 NEKOMA MOUNTAIN', '星野NEKOMA', 'NEKOMA', 'nekoma'],
    priority: 5,
  },
  'yuzawa_naeba': {
    aliases: ['苗場滑雪場', '苗場', 'naeba'],
    priority: 10,
  },
  'hakuba_happo_one': {
    aliases: ['白馬八方尾根滑雪場', '白馬八方尾根', '白馬八方', '八方尾根', '八方', 'hakuba happo', 'happo'],
    priority: 9,
  },
};

function getAliases(resort_id) {
  return RESORT_ALIASES[resort_id]?.aliases || [];
}

function getPriority(resort_id) {
  return RESORT_ALIASES[resort_id]?.priority || 5;
}

// 簡化的匹配邏輯
function matchResort(input, resort_id) {
  const normalized = input.toLowerCase().trim();
  const aliases = getAliases(resort_id);

  let bestConfidence = 0;

  for (let i = 0; i < aliases.length; i++) {
    const alias = aliases[i].toLowerCase();

    // 精確匹配
    if (normalized === alias) {
      return { confidence: i === 0 ? 1.0 : 0.98, resort_id };
    }

    // 輸入包含別名
    if (normalized.includes(alias) && alias.length >= 2) {
      let confidence = 0.85;
      if (alias.length >= 4) confidence = 0.90;
      else if (alias.length === 3) confidence = 0.87;
      else confidence = 0.80;

      if (i === 0) confidence += 0.05;
      bestConfidence = Math.max(bestConfidence, confidence);
    }
  }

  return bestConfidence > 0 ? { confidence: bestConfidence, resort_id } : null;
}

// 匹配所有雪場並選擇最佳
function findBestMatch(input, resort_ids) {
  const matches = [];

  for (const resort_id of resort_ids) {
    const result = matchResort(input, resort_id);
    if (result) {
      matches.push({ ...result, priority: getPriority(resort_id) });
    }
  }

  // 排序：信心度優先，相同時按優先級
  matches.sort((a, b) => {
    const confidenceDiff = b.confidence - a.confidence;
    if (Math.abs(confidenceDiff) < 0.01) {
      return b.priority - a.priority;
    }
    return confidenceDiff;
  });

  return matches[0] || null;
}

// 測試案例
const testCases = [
  {
    input: '1月2號到6號去星野',
    resorts: ['hokkaido_tomamu', 'fukushima_nekoma_mountain'],
    expected: 'hokkaido_tomamu',
    reason: '星野 → TOMAMU 優先級10 > NEKOMA 優先級5',
  },
  {
    input: '新增苗場2月3到7日',
    resorts: ['yuzawa_naeba'],
    expected: 'yuzawa_naeba',
    reason: '苗場在輸入中',
  },
  {
    input: '12月20到26去白馬八方',
    resorts: ['hakuba_happo_one'],
    expected: 'hakuba_happo_one',
    reason: '白馬八方在輸入中',
  },
  {
    input: '星野',
    resorts: ['hokkaido_tomamu', 'fukushima_nekoma_mountain'],
    expected: 'hokkaido_tomamu',
    reason: '精確匹配「星野」，TOMAMU 優先級更高',
  },
];

console.log('=== 測試新的別名系統 ===\n');

let passCount = 0;
let failCount = 0;

testCases.forEach((test, index) => {
  console.log(`測試 ${index + 1}: "${test.input}"`);
  console.log(`  原因: ${test.reason}`);

  const result = findBestMatch(test.input, test.resorts);

  if (result && result.resort_id === test.expected) {
    console.log(`  ✅ 通過 - 匹配到 ${result.resort_id} (信心度: ${Math.round(result.confidence * 100)}%, 優先級: ${result.priority})`);
    passCount++;
  } else {
    console.log(`  ❌ 失敗 - 預期 ${test.expected}，實際 ${result ? result.resort_id : 'null'}`);
    failCount++;
  }
  console.log();
});

console.log('=== 測試總結 ===');
console.log(`通過: ${passCount}/${testCases.length}`);
console.log(`失敗: ${failCount}/${testCases.length}`);
console.log(`成功率: ${(passCount / testCases.length * 100).toFixed(1)}%`);

if (passCount === testCases.length) {
  console.log('\n✅ 所有測試通過！新的別名系統運作正常');
} else {
  console.log('\n❌ 有測試失敗，需要調整');
}
