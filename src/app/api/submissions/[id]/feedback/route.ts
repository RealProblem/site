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

    // Check if status is "open" and within modification period
    if (submission.status !== "open") {
      return NextResponse.json(
        { error: "Feedback is only available for open submissions" },
        { status: 400 }
      );
    }

    if (isLocked(submission.submittedAt)) {
      return NextResponse.json(
        { error: "Modification period has expired" },
        { status: 400 }
      );
    }

    // Run full review with isFeedback=true (don't save to DB)
    const feedbackResult = await runFullReview(
      submission.track,
      submission.title,
      submission.authorDisplay,
      submission.reproLevel,
      submission.content,
      true // isFeedback = true
    );

    // Return feedback without saving to database
    return NextResponse.json({
      feedback: feedbackResult,
      message: "Feedback provided for modification purposes only. Not saved as official review.",
    });
  } catch (error) {
    console.error("POST /api/submissions/[id]/feedback error:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}
