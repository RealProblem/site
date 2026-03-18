import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { title, track, content, authorDisplay, reproLevel, tags, attachments } = body;

    if (!title || !track) {
      return NextResponse.json(
        { error: "Missing required fields: title, track" },
        { status: 400 }
      );
    }

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "请输入内容或上传文档" },
        { status: 400 }
      );
    }

    // Validate track is A or B
    if (track !== "A" && track !== "B") {
      return NextResponse.json(
        { error: "track must be 'A' or 'B'" },
        { status: 400 }
      );
    }

    // Parse and validate tags if provided
    let parsedTags = "[]";
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

    // Parse attachments
    let parsedAttachments = "[]";
    if (attachments && Array.isArray(attachments)) {
      parsedAttachments = JSON.stringify(attachments);
    }

    // Create submission with first version in a transaction
    const submission = await prisma.submission.create({
      data: {
        title,
        track,
        content: content || "",
        attachments: parsedAttachments,
        authorDisplay: authorDisplay || "匿名",
        reproLevel: reproLevel || "na",
        tags: parsedTags,
        status: "open",
        versions: {
          create: {
            title,
            content,
            versionNum: 1,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("POST /api/submissions error:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
