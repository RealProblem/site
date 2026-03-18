import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isLocked } from "@/lib/constants";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        reviews: true,
        versions: {
          orderBy: { versionNum: "asc" },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("GET /api/submissions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, tags, attachments } = body;

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

    // Check if status is "open"
    if (submission.status !== "open") {
      return NextResponse.json(
        { error: "Submission is not in open status" },
        { status: 400 }
      );
    }

    // Check if still within modification period (7 days)
    if (isLocked(submission.submittedAt)) {
      return NextResponse.json(
        { error: "Modification period has expired" },
        { status: 400 }
      );
    }

    // Parse tags if provided
    let parsedTags: string | undefined;
    if (tags) {
      try {
        if (typeof tags === "string") {
          parsedTags = JSON.stringify(JSON.parse(tags));
        } else if (Array.isArray(tags)) {
          parsedTags = JSON.stringify(tags);
        }
      } catch {
        return NextResponse.json(
          { error: "tags must be a valid JSON array or string" },
          { status: 400 }
        );
      }
    }

    // Get the latest version number
    const latestVersion = await prisma.version.findFirst({
      where: { submissionId: id },
      orderBy: { versionNum: "desc" },
    });

    const nextVersionNum = (latestVersion?.versionNum || 0) + 1;

    // Parse attachments if provided
    let parsedAttachments: string | undefined;
    if (attachments && Array.isArray(attachments)) {
      parsedAttachments = JSON.stringify(attachments);
    }

    // Update submission and create new version
    const updated = await prisma.submission.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(parsedTags !== undefined && { tags: parsedTags }),
        ...(parsedAttachments !== undefined && { attachments: parsedAttachments }),
        versions: {
          create: {
            title: title || submission.title,
            content: content || submission.content,
            versionNum: nextVersionNum,
          },
        },
      },
      include: {
        reviews: true,
        versions: {
          orderBy: { versionNum: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/submissions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
