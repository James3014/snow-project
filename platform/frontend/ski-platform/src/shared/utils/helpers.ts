/**
 * Utility Helper Functions
 * 工具辅助函数
 */

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

/**
 * 生成半匿名显示名
 */
export function generateDisplayName(fullName: string): string {
  if (!fullName || fullName.length < 2) return 'User';
  return `${fullName[0]}${fullName[fullName.length - 1].toUpperCase()}.`;
}

/**
 * 根据百分比获取颜色
 */
export function getProgressColor(percentage: number): 'red' | 'yellow' | 'green' | 'blue' {
  if (percentage < 25) return 'red';
  if (percentage < 50) return 'yellow';
  if (percentage < 100) return 'blue';
  return 'green';
}

/**
 * 截断文本
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 根据难度获取显示文本
 */
export function getDifficultyLabel(level: 'beginner' | 'intermediate' | 'advanced'): string {
  const labels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
  };
  return labels[level];
}

/**
 * 根据难度获取emoji
 */
export function getDifficultyEmoji(level: 'beginner' | 'intermediate' | 'advanced'): string {
  const emojis = {
    beginner: '🟢',
    intermediate: '🔵',
    advanced: '⚫',
  };
  return emojis[level];
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 数组去重
 */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * 随机ID生成
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
