/**
 * Levenshtein Distance 算法
 * 用於計算兩個字串之間的編輯距離，實現拼寫糾錯
 */

/**
 * 計算兩個字串之間的 Levenshtein 距離
 * 表示從 str1 轉換到 str2 所需的最少編輯操作次數（插入、刪除、替換）
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // 創建 DP 矩陣
  const matrix: number[][] = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0));

  // 初始化第一行和第一列
  for (let i = 0; i <= len1; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= len2; j++) {
    matrix[j][0] = j;
  }

  // 填充矩陣
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1,  // 替換
          matrix[j][i - 1] + 1,      // 插入
          matrix[j - 1][i] + 1       // 刪除
        );
      }
    }
  }

  return matrix[len2][len1];
}

/**
 * 計算相似度分數（0-1，1 表示完全相同）
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(
    str1.toLowerCase(),
    str2.toLowerCase()
  );
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) return 1;

  return 1 - distance / maxLength;
}

/**
 * 檢查兩個字串是否足夠相似（用於模糊匹配）
 */
export function isSimilar(
  str1: string,
  str2: string,
  threshold: number = 0.7
): boolean {
  return calculateSimilarity(str1, str2) >= threshold;
}
