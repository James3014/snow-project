/**
 * 執行雪場識別測試
 * 使用本地資料測試所有情況
 */

const fs = require('fs');
const path = require('path');

// 讀取本地雪場資料
const localResortsPath = path.join(__dirname, '../platform/frontend/ski-platform/src/shared/data/local-resorts.ts');
const localResortsContent = fs.readFileSync(localResortsPath, 'utf-8');

// 提取 LOCAL_RESORTS 陣列
const match = localResortsContent.match(/export const LOCAL_RESORTS: Resort\[\] = (\[[\s\S]*?\n\]);/);
if (!match) {
  console.error('無法解析 local-resorts.ts');
  process.exit(1);
}

const resortsData = JSON.parse(match[1]);
console.log(`已載入 ${resortsData.length} 個雪場資料\n`);

// 測試案例
const testCases = [
  // 直接輸入
  { input: '苗場', expected: 'yuzawa_naeba', type: 'single' },
  { input: '野澤溫泉', expected: 'nagano_nozawa_onsen', type: 'single' },
  { input: '二世谷', expected: 'hokkaido_niseko_moiwa', type: 'single' },
  { input: '留壽都', expected: 'hokkaido_rusutsu', type: 'single' },
  { input: '富良野', expected: 'hokkaido_furano', type: 'single' },

  // 完整名稱
  { input: '苗場滑雪場', expected: 'yuzawa_naeba', type: 'single' },
  { input: '野澤溫泉滑雪場', expected: 'nagano_nozawa_onsen', type: 'single' },
  { input: '白馬八方尾根滑雪場', expected: 'hakuba_happo_one', type: 'single' },

  // 句子中
  { input: '2月3到8日去苗場', expected: 'yuzawa_naeba', type: 'single' },
  { input: '新增苗場2月3到7日', expected: 'yuzawa_naeba', type: 'single' },
  { input: '想去野澤溫泉滑雪', expected: 'nagano_nozawa_onsen', type: 'single' },
  { input: '12月去留壽都', expected: 'hokkaido_rusutsu', type: 'single' },
  { input: '明年1月去二世谷滑雪', expected: 'hokkaido_niseko_moiwa', type: 'single' },
  { input: '打算去富良野', expected: 'hokkaido_furano', type: 'single' },

  // 雪場群
  { input: '白馬', expected: 'hakuba', type: 'group', count: 6 },
  { input: '湯澤', expected: 'yuzawa', type: 'group', count: 11 },

  // 英文
  { input: 'Naeba', expected: 'yuzawa_naeba', type: 'single' },
  { input: 'Niseko', expected: 'hokkaido_niseko_moiwa', type: 'single' },
  { input: 'Rusutsu', expected: 'hokkaido_rusutsu', type: 'single' },

  // 複雜組合
  { input: '12月20到26去白馬八方', expected: 'hakuba_happo_one', type: 'single' },
  { input: '2025年1月15日去苗場', expected: 'yuzawa_naeba', type: 'single' },
  { input: '12-30到1月2號去野澤溫泉', expected: 'nagano_nozawa_onsen', type: 'single' },

  // 特殊雪場
  { input: 'GALA湯澤', expected: 'yuzawa_gala', type: 'single' },
  { input: '神樂', expected: 'yuzawa_kagura', type: 'single' },
  { input: '去GALA', expected: 'yuzawa_gala', type: 'single' },

  // 縮寫
  { input: '白馬八方', expected: 'hakuba_happo_one', type: 'single' },
  { input: '白馬五龍', expected: 'hakuba_goryu_47', type: 'single' },
];

// 簡化的匹配函數（模擬 resortMatcher 邏輯）
function matchResort(input, resorts) {
  const normalized = input.toLowerCase().trim();

  for (const resort of resorts) {
    const zhName = resort.names.zh;
    const enName = resort.names.en.toLowerCase();
    const jaName = resort.names.ja;

    // 1. 精確匹配
    if (zhName.toLowerCase() === normalized || enName === normalized) {
      return { resort, confidence: 1.0 };
    }

    // 2. 短名稱匹配（去除後綴）
    const zhShort = zhName.replace(/滑雪場|度假村|滑雪度假村|滑雪公園|溫泉|高原/g, '').trim();
    const enShort = enName.replace(/resort|ski resort|ski area|snow resort|ski|snow/g, '').trim();

    if (zhShort && zhShort.length >= 2 && normalized === zhShort.toLowerCase()) {
      return { resort, confidence: 0.98 };
    }
    if (enShort && enShort.length >= 3 && normalized === enShort.toLowerCase()) {
      return { resort, confidence: 0.98 };
    }

    // 3. 包含匹配
    if (zhName.toLowerCase().includes(normalized) && normalized.length >= 2) {
      return { resort, confidence: 0.9 };
    }
    if (enName.includes(normalized) && normalized.length >= 3) {
      return { resort, confidence: 0.9 };
    }

    // 4. 用戶輸入包含短名稱（句子中）
    if (zhShort && zhShort.length >= 2 && normalized.includes(zhShort.toLowerCase())) {
      return { resort, confidence: 0.85 };
    }
    if (enShort && enShort.length >= 3 && normalized.includes(enShort.toLowerCase())) {
      return { resort, confidence: 0.85 };
    }

    // 4.3. 反向匹配：雪場名包含用戶輸入的子串（處理「12月20到26去白馬八方」→「白馬八方尾根」）
    // 從用戶輸入中提取連續的中文字符序列（長度 >= 3）
    const chineseSequences = normalized.match(/[\u4e00-\u9fa5]+/g) || [];
    for (let seq of chineseSequences) {
      if (seq.length >= 3) {
        // 移除常見的動作詞前綴（包括「新增」、「建立」、「創建」等行程創建關鍵詞）
        seq = seq.replace(/^(新增|建立|創建|規劃|計劃|安排|去|到|想去|打算去|打算|想|準備去|準備|計劃去|前往)/, '');

        // 再次檢查長度（至少 2 個字符，如「苗場」、「白馬」）
        if (seq.length >= 2) {
          // 檢查雪場名或短名稱是否包含這個序列
          if (zhName.toLowerCase().includes(seq) || (zhShort && zhShort.toLowerCase().includes(seq))) {
            // 但要排除太通用的詞（如「滑雪」、「度假」等）
            const tooGeneric = ['滑雪', '度假村'];
            if (!tooGeneric.some(word => seq.includes(word))) {
              return { resort, confidence: 0.87 };
            }
          }
        }
      }
    }

    // 4.5. 短名稱分詞匹配（處理「二世谷Moiwa」→「二世谷」的情況）
    // 要求詞長 >= 3，避免「白馬」這種太短的詞導致誤匹配
    if (zhShort && zhShort.length >= 2) {
      const zhShortWords = zhShort.split(/[A-Za-z\s&]+/).filter(w => w.length >= 3);
      for (const word of zhShortWords) {
        if (normalized.includes(word.toLowerCase())) {
          return { resort, confidence: 0.82 };
        }
      }
    }

    // 5. 部分詞匹配（排除通用後綴）
    const excludeWords = ['滑雪場', '度假村', '滑雪度假村', '滑雪公園', '溫泉', '高原', '&', 'ski', 'resort', 'snow', 'winter', 'sports', 'park'];
    const zhWords = zhName.split(/[、，\s&]+/).filter(w => !excludeWords.includes(w));
    const enWords = enName.split(/[\s\-&]+/).filter(w => !excludeWords.includes(w));

    for (const word of zhWords) {
      if (word.length >= 2 && normalized.includes(word.toLowerCase())) {
        return { resort, confidence: 0.8 };
      }
    }

    for (const word of enWords) {
      if (word.length >= 3 && normalized.includes(word.toLowerCase())) {
        return { resort, confidence: 0.8 };
      }
    }
  }

  return null;
}

// 檢查雪場群
function isResortGroup(input, resorts) {
  const normalized = input.toLowerCase();

  const groups = {
    '白馬': r => r.names.zh.includes('白馬'),
    'hakuba': r => r.names.zh.includes('白馬'),
    '湯澤': r => r.resort_id.includes('yuzawa_'),
    'yuzawa': r => r.resort_id.includes('yuzawa_'),
    '妙高': r => r.names.zh.includes('妙高') || r.names.zh.includes('赤倉'),
  };

  for (const [keyword, filter] of Object.entries(groups)) {
    if (normalized === keyword || normalized.includes(keyword)) {
      const matches = resorts.filter(filter);
      if (matches.length > 1) {
        return { isGroup: true, matches };
      }
    }
  }

  return { isGroup: false };
}

// 執行測試
console.log('=== 開始測試 ===\n');

let passed = 0;
let failed = 0;
const failures = [];

testCases.forEach((testCase, index) => {
  const { input, expected, type } = testCase;

  if (type === 'group') {
    // 測試雪場群
    const groupResult = isResortGroup(input, resortsData);
    if (groupResult.isGroup && groupResult.matches.length >= (testCase.count || 2)) {
      console.log(`✅ ${index + 1}. "${input}" → ${groupResult.matches.length} 個雪場（雪場群）`);
      passed++;
    } else {
      console.log(`❌ ${index + 1}. "${input}" → 預期雪場群但只找到 ${groupResult.matches?.length || 0} 個`);
      failed++;
      failures.push({ input, expected: `${testCase.count}個雪場`, actual: groupResult.matches?.length || 0 });
    }
  } else {
    // 測試單個雪場
    const result = matchResort(input, resortsData);
    if (result && result.resort.resort_id === expected) {
      console.log(`✅ ${index + 1}. "${input}" → ${result.resort.names.zh} (${result.resort.resort_id}) [${(result.confidence * 100).toFixed(0)}%]`);
      passed++;
    } else {
      const actual = result ? `${result.resort.names.zh} (${result.resort.resort_id})` : '未匹配';
      console.log(`❌ ${index + 1}. "${input}" → 預期 ${expected} 但得到 ${actual}`);
      failed++;
      failures.push({ input, expected, actual: result?.resort.resort_id || 'null' });
    }
  }
});

console.log('\n=== 測試總結 ===\n');
console.log(`總計：${testCases.length} 個測試`);
console.log(`通過：${passed} 個 ✅`);
console.log(`失敗：${failed} 個 ❌`);
console.log(`成功率：${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log('\n=== 失敗案例詳情 ===\n');
  failures.forEach((f, i) => {
    console.log(`${i + 1}. "${f.input}"`);
    console.log(`   預期：${f.expected}`);
    console.log(`   實際：${f.actual}`);
    console.log('');
  });

  console.log('\n=== 建議的修復方向 ===\n');
  console.log('1. 檢查短名稱提取邏輯是否正確');
  console.log('2. 確認句子中的雪場名提取');
  console.log('3. 驗證雪場群檢測邏輯');
  console.log('4. 測試英文名稱匹配');
}

console.log('\n測試完成！');

// 返回非零退出碼如果有失敗
process.exit(failed > 0 ? 1 : 0);
