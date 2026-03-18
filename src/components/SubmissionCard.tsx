import Link from 'next/link';
import { TRACK_CONFIG } from '@/lib/constants';
import BadgeTag from './BadgeTag';

interface SubmissionCardProps {
  id: string;
  title: string;
  track: 'A' | 'B';
  author: string;
  badge?: 'featured' | 'accepted' | 'notable' | 'archived' | 'rejected';
  tags: string[];
  submissionDate: Date;
  status: 'open' | 'locked' | 'reviewed';
  daysRemainingInModification?: number;
}

export default function SubmissionCard({
  id,
  title,
  track,
  author,
  badge,
  tags,
  submissionDate,
  status,
  daysRemainingInModification,
}: SubmissionCardProps) {
  const trackConfig = TRACK_CONFIG[track];
  const formattedDate = new Date(submissionDate).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const statusDisplay: Record<string, string> = {
    open: '开放投稿',
    locked: '已锁定',
    reviewed: '已评审',
  };

  const trackColor = track === 'A' ? 'bg-blue-600' : 'bg-purple-600';

  return (
    <Link href={`/paper/${id}`}>
      <article className="block p-6 border border-stone-200 rounded-lg hover:border-stone-300 hover:shadow-md transition-all bg-white">
        <div className="space-y-4">
          {/* Header with track and badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-stone-900 mb-2 line-clamp-2">
                {title}
              </h2>
            </div>
            {badge && <BadgeTag badge={badge} />}
          </div>

          {/* Track badge and author */}
          <div className="flex items-center gap-3 text-sm">
            <span
              className={`inline-flex px-2.5 py-1 rounded text-white text-xs font-semibold ${trackColor}`}
            >
              Track {track}
            </span>
            <span className="text-stone-600">{author}</span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2.5 py-1 bg-stone-100 text-stone-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer with metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
            <span>{formattedDate}</span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded ${
                  status === 'open'
                    ? 'bg-green-50 text-green-700'
                    : status === 'locked'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-stone-100 text-stone-700'
                }`}
              >
                {statusDisplay[status]}
              </span>
              {daysRemainingInModification !== undefined && status === 'open' && (
                <span className="text-stone-600">
                  {daysRemainingInModification} 天可修改
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
