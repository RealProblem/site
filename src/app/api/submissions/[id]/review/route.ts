import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isLocked } from "@/lib/constants";
import { runFullReview } from "@/lib/llm-judge";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check if status is "open" (and past lock date) or "locked"
    if (submission.status !== "open" && submission.status !== "locked") {
      return NextResponse.json(
        { error: `Cannot review submission with status: ${submission.status}` },
        { status: 400 }
      );
    }

    // If status is "open" and past lock date, update to "locked"
    let currentSubmission = submission;
    if (submission.status === "open" && isLocked(submission.submittedAt)) {
      currentSubmission = await prisma.submission.update({
        where: { id },
        data: { status: "locked" },
      });
    }

    // Run full review
    const reviewResult = await runFullReview(
      submission.track,
      submission.title,
      submission.authorDisplay,
      submission.reproLevel,
      submission.content,
      false // isFeedback = false for actual review
    );

    // Save each model's review as a Review record
    for (const [modelName, result] of Object.entries(reviewResult.results)) {
      if (result) {
        await prisma.review.create({
          data: {
            submissionId: id,
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

    // Update submission with final score, badge, and status
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        finalScore: reviewResult.finalScore,
        badge: reviewResult.finalBadge,
        status: "reviewed",
        reviewedAt: new Date(),
      },
      include: {
        reviews: true,
        versions: true,
      },
    });

    return NextResponse.json({
      submission: updatedSubmission,
      reviewResult,
      errors: reviewResult.errors,
    });
  } catch (error) {
    console.error("POST /api/submissions/[id]/review error:", error);
    return NextResponse.json(
      { error: "Failed to process review" },
      { status: 500 }
    );
  }
}
