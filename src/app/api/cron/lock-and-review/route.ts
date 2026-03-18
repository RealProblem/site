import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MODIFICATION_PERIOD_DAYS } from "@/lib/constants";
import { runFullReview } from "@/lib/llm-judge";

export async function POST(request: NextRequest) {
  try {
    // Simple auth check: require header "Authorization: Bearer CRON_SECRET"
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.warn("CRON_SECRET environment variable not set");
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    if (token !== cronSecret) {
      return NextResponse.json(
        { error: "Invalid Authorization token" },
        { status: 401 }
      );
    }

    // Calculate the lock date threshold
    const lockThreshold = new Date();
    lockThreshold.setDate(lockThreshold.getDate() - MODIFICATION_PERIOD_DAYS);

    // Find all submissions with status "open" where submittedAt + 7 days <= now
    const submissionsToLock = await prisma.submission.findMany({
      where: {
        status: "open",
        submittedAt: {
          lte: lockThreshold,
        },
      },
    });

    const results = {
      locked: 0,
      reviewed: 0,
      errors: [] as string[],
    };

    // Process each submission
    for (const submission of submissionsToLock) {
      try {
        // Update status to "locked"
        await prisma.submission.update({
          where: { id: submission.id },
          data: { status: "locked" },
        });
        results.locked++;

        // Trigger review
        const reviewResult = await runFullReview(
          submission.track,
          submission.title,
          submission.authorDisplay,
          submission.reproLevel,
          submission.content,
          false
        );

        // Save reviews for each model
        for (const [modelName, result] of Object.entries(reviewResult.results)) {
          if (result) {
            await prisma.review.create({
              data: {
                submissionId: submission.id,
                model: modelName,
                dimensions: JSON.stringify(result.dimensions),
                weightedTotal: result.weightedTotal,
                badge: result.badge,
                summary: result.summary,
                suggestions: result.suggestions,
                rawResponse: JSON.stringify(result),
              },
            });
          }
        }

        // Update submission with final review results
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            finalScore: reviewResult.finalScore,
            badge: reviewResult.finalBadge,
            status: "reviewed",
            reviewedAt: new Date(),
          },
        });

        results.reviewed++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.errors.push(`Submission ${submission.id}: ${errorMsg}`);
        console.error(`Error processing submission ${submission.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${submissionsToLock.length} submissions`,
      results,
    });
  } catch (error) {
    console.error("POST /api/cron/lock-and-review error:", error);
    return NextResponse.json(
      { error: "Failed to process cron job" },
      { status: 500 }
    );
  }
}
