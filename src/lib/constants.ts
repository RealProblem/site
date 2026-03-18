export const BADGE_CONFIG = {
  featured: { label: "精选问题", emoji: "🌟", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  accepted: { label: "正式收录", emoji: "✅", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  notable: { label: "值得关注", emoji: "💡", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  archived: { label: "存档", emoji: "📌", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" },
  rejected: { label: "不收录", emoji: "❌", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
} as const;

export const TRACK_CONFIG = {
  A: { label: "问题轨", description: "只提问，不要求解答" },
  B: { label: "问题+解答轨", description: "提问并给出自己的解答" },
} as const;

export const REPRO_CONFIG = {
  na: { label: "不适用", description: "无实验内容" },
  spec: { label: "⬛ 描述级", description: "提供足够的细节描述" },
  code: { label: "🟧 代码级", description: "公开代码+环境配置" },
  full_open: { label: "🟩 完全开放", description: "代码+数据+环境+一键复现" },
} as const;

export const DISCIPLINES = [
  "计算机科学", "人工智能", "数学", "物理学", "化学",
  "生物学", "医学", "心理学", "经济学", "社会学",
  "哲学", "语言学", "教育学", "法学", "工程学",
  "环境科学", "材料科学", "天文学", "地球科学", "其他",
];

export const MODIFICATION_PERIOD_DAYS = 7;

export function getBadgeFromScore(score: number): string {
  if (score >= 90) return "featured";
  if (score >= 70) return "accepted";
  if (score >= 50) return "notable";
  if (score >= 30) return "archived";
  return "rejected";
}

export function isLocked(submittedAt: Date): boolean {
  const lockDate = new Date(submittedAt);
  lockDate.setDate(lockDate.getDate() + MODIFICATION_PERIOD_DAYS);
  return new Date() >= lockDate;
}

export function getLockDate(submittedAt: Date): Date {
  const lockDate = new Date(submittedAt);
  lockDate.setDate(lockDate.getDate() + MODIFICATION_PERIOD_DAYS);
  return lockDate;
}
