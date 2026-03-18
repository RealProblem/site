import { Suspense } from "react";
import { prisma } from "@/lib/db";
import SubmissionCard from "@/components/SubmissionCard";
import FilterBar from "@/components/FilterBar";
import { isLocked, MODIFICATION_PERIOD_DAYS } from "@/lib/constants";

interface BrowsePageProps {
  searchParams: Promise<{
    track?: string;
    badge?: string;
    q?: string;
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 20;

function safeParseTags(tagsJson: string | null): string[] {
  try {
    return tagsJson ? JSON.parse(tagsJson) : [];
  } catch {
    return [];
  }
}

function getDaysRemaining(submittedAt: Date): number {
  const lockDate = new Date(submittedAt);
  lockDate.setDate(lockDate.getDate() + MODIFICATION_PERIOD_DAYS);
  const now = new Date();
  const daysLeft = Math.ceil(
    (lockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, daysLeft);
}

function getStatus(
  submittedAt: Date,
  badge: string | null
): "open" | "locked" | "reviewed" {
  if (badge) return "reviewed";
  if (isLocked(submittedAt)) return "locked";
  return "open";
}

async function BrowseContent({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const track =
    params.track && params.track !== "all" ? params.track : undefined;
  const badge =
    params.badge && params.badge !== "all" ? params.badge : undefined;
  const q = params.q?.trim() || "";
  const page = Math.max(1, parseInt(params.page || "1"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (track) where.track = track;
  if (badge) where.badge = badge;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { content: { contains: q } },
      { authorDisplay: { contains: q } },
    ];
  }

  const total = await prisma.submission.count({ where });
  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    skip: (page - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  });

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">
          浏览投稿
        </h1>

        <FilterBar track={track} badge={badge} q={q} />

        {submissions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-stone-500 text-lg">暂无匹配的投稿</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-6">
              共 {total} 篇投稿{q && `（搜索：${q}）`}
            </p>
            <div className="space-y-4 mb-8">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  id={submission.id}
                  title={submission.title}
                  track={submission.track as "A" | "B"}
                  author={submission.authorDisplay}
                  badge={
                    (submission.badge as
                      | "featured"
                      | "accepted"
                      | "notable"
                      | "archived"
                      | "rejected") || undefined
                  }
                  tags={safeParseTags(submission.tags)}
                  submissionDate={submission.submittedAt}
                  status={getStatus(submission.submittedAt, submission.badge)}
                  daysRemainingInModification={getDaysRemaining(
                    submission.submittedAt
                  )}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white border border-stone-200 rounded-lg p-4">
                <p className="text-sm text-stone-500">
                  第 {page} 页 / 共 {totalPages} 页
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <a
                      href={`/browse?${new URLSearchParams({
                        ...(track ? { track } : {}),
                        ...(badge ? { badge } : {}),
                        ...(q ? { q } : {}),
                        page: String(page - 1),
                      }).toString()}`}
                      className="px-4 py-2 border border-stone-200 rounded-lg hover:bg-stone-50 text-sm"
                    >
                      ← 上一页
                    </a>
                  )}
                  {page < totalPages && (
                    <a
                      href={`/browse?${new URLSearchParams({
                        ...(track ? { track } : {}),
                        ...(badge ? { badge } : {}),
                        ...(q ? { q } : {}),
                        page: String(page + 1),
                      }).toString()}`}
                      className="px-4 py-2 border border-stone-200 rounded-lg hover:bg-stone-50 text-sm"
                    >
                      下一页 →
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function BrowsePage(props: BrowsePageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-50">
          <div className="mx-auto max-w-4xl px-6 py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-stone-200 rounded w-32" />
              <div className="h-32 bg-stone-200 rounded" />
              <div className="h-24 bg-stone-200 rounded" />
              <div className="h-24 bg-stone-200 rounded" />
            </div>
          </div>
        </main>
      }
    >
      <BrowseContent {...props} />
    </Suspense>
  );
}
