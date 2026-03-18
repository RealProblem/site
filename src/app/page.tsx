import Link from 'next/link';
import { prisma } from '@/lib/db';
import SubmissionCard from '@/components/SubmissionCard';
import { isLocked, MODIFICATION_PERIOD_DAYS } from '@/lib/constants';

export default async function Home() {
  // Fetch statistics
  const totalSubmissions = await prisma.submission.count();
  const reviewedCount = await prisma.submission.count({
    where: { badge: { not: null } },
  });
  const featuredCount = await prisma.submission.count({
    where: { badge: 'featured' },
  });

  // Fetch featured submissions (up to 5)
  const featured = await prisma.submission.findMany({
    where: { badge: 'featured' },
    orderBy: { submittedAt: 'desc' },
    take: 5,
  });

  // Fetch latest submissions (10)
  const latest = await prisma.submission.findMany({
    orderBy: { submittedAt: 'desc' },
    take: 10,
  });

  // Helper function to calculate days remaining
  const getDaysRemaining = (submittedAt: Date): number => {
    const lockDate = new Date(submittedAt);
    lockDate.setDate(lockDate.getDate() + MODIFICATION_PERIOD_DAYS);
    const now = new Date();
    const daysLeft = Math.ceil((lockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const getStatus = (submittedAt: Date, badge: string | null) => {
    if (badge) return 'reviewed';
    if (isLocked(submittedAt)) return 'locked';
    return 'open';
  };

  const safeParseTags = (tagsJson: string | null) => {
    try {
      return tagsJson ? JSON.parse(tagsJson) : [];
    } catch {
      return [];
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl font-serif font-bold text-stone-900">
              RealProblem
            </h1>
            <p className="text-2xl text-stone-600 font-light">
              真问题，不需要好听的答案
            </p>
            <Link
              href="/submit"
              className="inline-block px-8 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium"
            >
              投稿
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-stone-900">{totalSubmissions}</p>
              <p className="text-stone-600 text-sm">总投稿数</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-stone-900">{reviewedCount}</p>
              <p className="text-stone-600 text-sm">已评审</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-stone-900">{featuredCount}</p>
              <p className="text-stone-600 text-sm">精选问题</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {featured.length > 0 && (
        <section className="bg-white border-b border-stone-200">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-3xl font-serif font-bold text-stone-900 mb-12">
              精选问题
            </h2>
            <div className="grid gap-6">
              {featured.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  id={submission.id}
                  title={submission.title}
                  track={submission.track as 'A' | 'B'}
                  author={submission.authorDisplay}
                  badge={submission.badge as 'featured' | 'accepted' | 'notable' | 'archived' | 'rejected'}
                  tags={safeParseTags(submission.tags)}
                  submissionDate={submission.submittedAt}
                  status={getStatus(submission.submittedAt, submission.badge)}
                  daysRemainingInModification={getDaysRemaining(submission.submittedAt)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Section */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-3xl font-serif font-bold text-stone-900 mb-12">
            最新投稿
          </h2>
          <div className="grid gap-6">
            {latest.map((submission) => (
              <SubmissionCard
                key={submission.id}
                id={submission.id}
                title={submission.title}
                track={submission.track as 'A' | 'B'}
                author={submission.authorDisplay}
                badge={submission.badge as any}
                tags={JSON.parse(submission.tags || '[]')}
                submissionDate={submission.submittedAt}
                status={getStatus(submission.submittedAt, submission.badge)}
                daysRemainingInModification={getDaysRemaining(submission.submittedAt)}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
