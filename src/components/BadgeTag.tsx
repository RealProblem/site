import { BADGE_CONFIG } from '@/lib/constants';

interface BadgeTagProps {
  badge: 'featured' | 'accepted' | 'notable' | 'archived' | 'rejected';
}

export default function BadgeTag({ badge }: BadgeTagProps) {
  const config = BADGE_CONFIG[badge];

  if (!config) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color} border ${config.border}`}
    >
      <span className="text-base">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
