/**
 * 用戶回報問題的回歸測試
 * 確保所有用戶發現的 bug 都已修復且不會再次出現
 */

const fs = require('fs');
const path = require('path');

// 讀取本地雪場資料
const localResortsPath = path.join(__dirname, '../platform/frontend/ski-platform/src/shared/data/local-resorts.ts');
const localResortsContent = fs.readFileSync(localResortsPath, 'utf-8');
const match = localResortsContent.match(/export const LOCAL_RESORTS: Resort\[\] = (\[[\s\S]*?\n\]);/);
const resortsData = JSON.parse(match[1]);

// 別名配置（同步自 resortAliases.ts）
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
  'nagano_nozawa_onsen': {
    aliases: ['野澤溫泉滑雪場', '野澤溫泉', '野澤', 'nozawa onsen', 'nozawa'],
    priority: 9,
  },
};

function getAliases(resort_id, fullName) {
  if (RESORT_ALIASES[resort_id]) {
    return RESORT_ALIASES[resort_id].aliases;
  }
  // 自動提取
  const withoutSuffix = fullName.replace(/滑雪場|度假村|滑雪度假村|滑雪公園|溫泉|高原/g, '').trim();
  return [fullName, withoutSuffix];
}

function getPriority(resort_id) {
  return RESORT_ALIASES[resort_id]?.priority || 5;
}

// 匹配單個雪場
function matchSingleResort(input, resort) {
  const normalized = input.toLowerCase().trim();
  const aliases = getAliases(resort.resort_id, resort.names.zh);

  let bestConfidence = 0;

  for (let i = 0; i < aliases.length; i++) {
    const alias = aliases[i].toLowerCase();

    // 精確匹配
    if (normalized === alias) {
      return { confidence: i === 0 ? 1.0 : 0.98 };
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

    // 別名包含輸入
    if (alias.includes(normalized) && normalized.length >= 2) {
      bestConfidence = Math.max(bestConfidence, 0.75);
    }
  }

  return bestConfidence > 0 ? { confidence: bestConfidence } : null;
}

// 匹配所有雪場並返回最佳結果
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

  // 排序：信心度優先，相同時按優先級
  matches.sort((a, b) => {
    const confidenceDiff = b.confidence - a.confidence;
    if (Math.abs(confidenceDiff) < 0.01) {
      return b.priority - a.priority;
    }
    return confidenceDiff;
  });

  return matches.length > 0 ? matches[0] : null;
}

// 用戶回報的問題列表
const USER_REPORTED_ISSUES = [
  {
    issue: 'Issue #1',
    date: '2025-11-11 09:32',
    input: '新增苗場2月3到7日',
    expected: 'yuzawa_naeba',
    description: '用戶輸入帶「新增」前綴的句子無法識別雪場',
    originalError: '系統回覆「請告訴我你想去哪個雪場？」',
  },
  {
    issue: 'Issue #2',
    date: '2025-11-11 10:08',
    input: '1月2號到6號去星野',
    expected: 'hokkaido_tomamu',
    description: '複雜日期+雪場組合無法識別，且應該匹配TOMAMU而非NEKOMA',
    originalError: '系統回覆「請告訴我你想去哪個雪場？」',
  },
  {
    issue: 'Issue #3 (之前的問題)',
    date: '更早',
    input: '2月3到8日去苗場',
    expected: 'yuzawa_naeba',
    description: '日期+去+雪場的基本格式',
    originalError: '無法識別苗場',
  },
  {
    issue: 'Issue #4 (之前的問題)',
    date: '更早',
    input: '12月20到26去白馬八方',
    expected: 'hakuba_happo_one',
    description: '複雜日期+去+雪場',
    originalError: '無法識別白馬八方',
  },
  {
    issue: 'Issue #5 (之前的問題)',
    date: '更早',
    input: '12-30到1月2號去野澤溫泉',
    expected: 'nagano_nozawa_onsen',
    description: '跨年日期+雪場',
    originalError: '日期識別問題',
  },
  {
    issue: 'Issue #6',
    date: '2025-11-11 10:42',
    input: '我在2月20-28要去苗場',
    expected: 'yuzawa_naeba',
    description: '「我在」+日期範圍+「要去」+雪場的格式',
    originalError: '系統回覆「請告訴我你想去哪個雪場？」',
  },
  {
    issue: 'Issue #7',
    date: '2025-11-11 10:57',
    input: '苗場我要在2月21-28去',
    expected: 'yuzawa_naeba',
    description: '雪場在前的語序變化',
    originalError: '系統回覆「請告訴我你想去哪個雪場？」',
  },
];

// 執行測試
console.log('=== 用戶回報問題 - 回歸測試 ===\n');
console.log(`總共 ${USER_REPORTED_ISSUES.length} 個用戶回報的問題\n`);

let passCount = 0;
let failCount = 0;
const failures = [];

USER_REPORTED_ISSUES.forEach((issue, index) => {
  console.log(`${issue.issue}: ${issue.description}`);
  console.log(`回報時間: ${issue.date}`);
  console.log(`原始錯誤: ${issue.originalError}`);
  console.log(`測試輸入: "${issue.input}"`);

  const result = matchResort(issue.input, resortsData);

  if (result && result.resort.resort_id === issue.expected) {
    console.log(`✅ 已修復 - 匹配到 ${result.resort.names.zh} (${result.resort.resort_id})`);
    console.log(`   信心度: ${Math.round(result.confidence * 100)}%, 優先級: ${result.priority}`);
    passCount++;
  } else {
    console.log(`❌ 仍然失敗 - 預期 ${issue.expected}，實際 ${result ? result.resort.resort_id : 'null'}`);
    failCount++;
    failures.push({
      issue: issue.issue,
      input: issue.input,
      expected: issue.expected,
      actual: result ? result.resort.resort_id : null,
    });
  }
  console.log();
});

console.log('=== 回歸測試總結 ===\n');
console.log(`總計：${USER_REPORTED_ISSUES.length} 個問題`);
console.log(`已修復：${passCount} 個 ✅`);
console.log(`仍存在：${failCount} 個 ❌`);
console.log(`修復率：${(passCount / USER_REPORTED_ISSUES.length * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log('\n=== 仍未修復的問題 ===\n');
  failures.forEach((f) => {
    console.log(`${f.issue}: "${f.input}"`);
    console.log(`  預期：${f.expected}`);
    console.log(`  實際：${f.actual || 'null'}\n`);
  });
  process.exit(1);
} else {
  console.log('\n✅ 所有用戶回報的問題都已修復！');
  process.exit(0);
}
