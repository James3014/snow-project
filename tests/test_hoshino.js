/**
 * 測試星野雪場匹配
 */

const fs = require('fs');
const path = require('path');

// 讀取本地雪場資料
const localResortsPath = path.join(__dirname, '../platform/frontend/ski-platform/src/shared/data/local-resorts.ts');
const localResortsContent = fs.readFileSync(localResortsPath, 'utf-8');
const match = localResortsContent.match(/export const LOCAL_RESORTS: Resort\[\] = (\[[\s\S]*?\n\]);/);
const resortsData = JSON.parse(match[1]);

console.log(`已載入 ${resortsData.length} 個雪場資料\n`);

// 匹配單個雪場
function matchSingleResort(input, resort) {
  const normalized = input.toLowerCase().trim();
  const zhName = resort.names.zh;
  const zhShort = zhName.replace(/滑雪場|度假村|滑雪度假村|滑雪公園|溫泉|高原/g, '').trim();

  let bestConfidence = 0;

  // 反向匹配
  const chineseSequences = normalized.match(/[\u4e00-\u9fa5]+/g) || [];
  for (let seq of chineseSequences) {
    if (seq.length >= 3) {
      seq = seq
        .replace(/新增|建立|創建|規劃|安排/g, '')
        .replace(/去|到|想|打算|準備|計劃|前往/g, '')
        .replace(/號|日|月|年/g, '')
        .trim();

      if (seq.length >= 2) {
        if (zhName.toLowerCase().includes(seq) || (zhShort && zhShort.toLowerCase().includes(seq))) {
          let confidence = 0.87;
          if (seq === '星野' && resort.resort_id === 'hokkaido_tomamu') {
            confidence = 0.90;
          } else if (seq === '星野') {
            confidence = 0.84;
          }
          bestConfidence = Math.max(bestConfidence, confidence);
        }
      }
    }
  }

  return bestConfidence > 0 ? { resort, confidence: bestConfidence } : null;
}

// 匹配所有雪場
function matchResort(input, resorts) {
  const allMatches = [];
  for (const resort of resorts) {
    const result = matchSingleResort(input, resort);
    if (result) {
      allMatches.push(result);
    }
  }
  allMatches.sort((a, b) => b.confidence - a.confidence);
  return allMatches.length > 0 ? allMatches[0] : null;
}

// 測試
const input = '1月2號到6號去星野';
console.log(`測試輸入：「${input}」\n`);

const result = matchResort(input, resortsData);

if (result) {
  console.log(`✅ 匹配成功！`);
  console.log(`雪場：${result.resort.names.zh}`);
  console.log(`ID：${result.resort.resort_id}`);
  console.log(`信心度：${Math.round(result.confidence * 100)}%`);

  if (result.resort.resort_id === 'hokkaido_tomamu') {
    console.log('\n✅ 正確！匹配到 TOMAMU');
  } else {
    console.log('\n❌ 錯誤！應該匹配到 TOMAMU');
  }
} else {
  console.log('❌ 無匹配');
}
