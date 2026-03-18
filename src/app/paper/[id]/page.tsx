import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ReviewReport from '@/components/ReviewReport';
import BadgeTag from '@/components/BadgeTag';
import { TRACK_CONFIG, isLocked, getLockDate, MODIFICATION_PERIOD_DAYS } from '@/lib/constants';

interface PaperPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { reviews: true, parent: true, revisions: true },
  });

  if (!submission) {
    notFound();
  }

  const trackConfig = TRACK_CONFIG[submission.track as 'A' | 'B'];
  const locked = isLocked(submission.submittedAt);
  const lockDate = getLockDate(submission.submittedAt);

  // Calculate time remaining
  const now = new Date();
  const timeRemaining = lockDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));

  // Parse reviews with safety
  const reviews = submission.reviews.map(review => {
    let dimensions = [];
    let suggestions = '';
    try {
      dimensions = JSON.parse(review.dimensions);
    } catch {
      dimensions = [];
    }
    try {
      suggestions = review.suggestions || '';
    } catch {
      suggestions = '';
    }
    return {
      modelName: review.model as 'claude' | 'gpt' | 'gemini',
      dimensions,
      weightedTotal: review.weightedTotal,
      badge: review.badge,
      summary: review.summary,
      suggestions,
    };
  });

  // Calculate final score (median of available models)
  const scores = reviews.map(r => r.weightedTotal);
  let finalScore = submission.finalScore || 0;
  if (scores.length > 0) {
    scores.sort((a, b) => a - b);
    finalScore = scores[Math.floor(scores.length / 2)];
  }

  const formattedDate = new Date(submission.submittedAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="bg-white border border-stone-200 rounded-lg p-8 mb-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <h1 className="text-4xl font-serif font-bold text-stone-900">
                {submission.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-stone-600">
                <span>{trackConfig.label}</span>
                <span>作者: {submission.authorDisplay}</span>
                <span>{formattedDate}</span>
              </div>
            </div>
            {submission.badge && <BadgeTag badge={submission.badge as any} />}
          </div>

          {/* Status Info */}
          <div className="border-t border-stone-200 pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-stone-600">状态</p>
                <p className="font-medium text-stone-900 mt-1">
                  {submission.badge ? '已评审' : locked ? '已锁定' : '开放中'}
                </p>
              </div>
              {submission.badge && (
                <div>
                  <p className="text-stone-600">综合评分</p>
                  <p className="font-medium text-stone-900 mt-1">{finalScore.toFixed(1)}</p>
                </div>
              )}
            </div>

            {/* Repro Level for Track B */}
            {submission.track === 'B' && submission.reproLevel && (
              <div className="pt-2">
                <p className="text-sm text-stone-600">可复现性层级</p>
                <p className="font-medium text-stone-900 mt-1">{submission.reproLevel}</p>
              </div>
            )}

            {/* Action Buttons */}
            {!locked && !submission.badge && (
              <div className="flex gap-3 pt-4">
                <Link
                  href={`/paper/${submission.id}/edit`}
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-center text-sm font-medium"
                >
                  📝 编辑投稿
                </Link>
                <Link
                  href={`/api/submissions/${submission.id}/feedback`}
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center text-sm font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("LLM 反馈功能开发中，敬请期待");
                  }}
                >
                  🤖 请求 LLM 反馈
                </Link>
              </div>
            )}

            {/* Modification Notice */}
            {!locked && !submission.badge && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-1">修改期进行中</p>
                <p className="text-sm text-blue-700">
                  你还有 {daysRemaining > 0 ? `${daysRemaining} 天` : `${hoursRemaining} 小时`} 的时间可以修改这个投稿。
                  修改期结束后，投稿将被锁定供评审。
                </p>
              </div>
            )}
          </div>

          {/* Parent Submission Link */}
          {submission.parent && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                这是对{' '}
                <Link href={`/paper/${submission.parent.id}`} className="font-medium underline hover:no-underline">
                  原始投稿
                </Link>
                {' '}的修改版本
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        {submission.content && (
          <div className="bg-white border border-stone-200 rounded-lg p-8 mb-8">
            <MarkdownRenderer content={submission.content} />
          </div>
        )}

        {/* Attachments */}
        {(() => {
          try {
            const atts = JSON.parse(submission.attachments || "[]");
            return atts.length > 0 ? (
              <div className="bg-white border border-stone-200 rounded-lg p-6 mb-8">
                <p className="text-sm font-medium text-stone-900 mb-4">附件</p>
                <div className="space-y-2">
                  {atts.map((att: { filename: string; url: string; size: number; type: string }, i: number) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      <span className="text-lg">
                        {att.type?.includes("pdf") ? "📄" : att.type?.includes("image") ? "🖼️" : "📎"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-900 truncate">{att.filename}</p>
                        <p className="text-xs text-stone-400">
                          {att.size < 1024 * 1024
                            ? `${(att.size / 1024).toFixed(1)} KB`
                            : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                        </p>
                      </div>
                      <span className="text-xs text-stone-500">下载 ↓</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null;
          } catch {
            return null;
          }
        })()}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900">评审报告</h2>
            {reviews.map((review) => (
              <ReviewReport
                key={review.modelName}
                modelName={review.modelName}
                dimensions={review.dimensions}
                weightedTotal={review.weightedTotal}
                badge={review.badge as "featured" | "accepted" | "notable" | "archived" | "rejected"}
                summary={review.summary}
                suggestions={review.suggestions}
              />
            ))}
          </div>
        )}

        {/* Version History */}
        {submission.revisions && submission.revisions.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-lg p-6 mb-8">
            <p className="text-sm font-medium text-stone-900 mb-3">版本历史</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm p-3 bg-stone-50 rounded-lg">
                <span className="text-stone-700">当前版本</span>
                <span className="text-stone-500">
                  {new Date(submission.submittedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              {submission.revisions.map((revision, index) => (
                <Link
                  key={revision.id}
                  href={`/paper/${revision.id}`}
                  className="flex items-center justify-between text-sm p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <span className="text-stone-700">修改版本 {index + 1}</span>
                  <span className="text-stone-500">
                    {new Date(revision.submittedAt).toLocaleDateString('zh-CN')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {submission.tags && (
          (() => {
            try {
              const tags = JSON.parse(submission.tags);
              return tags.length > 0 ? (
                <div className="bg-white border border-stone-200 rounded-lg p-6 mb-8">
                  <p className="text-sm font-medium text-stone-900 mb-3">学科标签</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            } catch {
              return null;
            }
          })()
        )}
      </div>
    </main>
  );
}
