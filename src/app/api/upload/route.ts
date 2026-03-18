import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Max file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/x-tex",
  "application/x-latex",
  "application/zip",
  "application/gzip",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "bin";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小不能超过 20MB" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type) && file.type !== "") {
      // Allow empty type (some browsers don't set it for .tex/.md)
      const ext = getExtension(file.name);
      const allowedExts = [
        "pdf", "doc", "docx", "ppt", "pptx", "txt", "md",
        "csv", "tex", "latex", "zip", "gz", "tar",
        "png", "jpg", "jpeg", "gif", "webp",
      ];
      if (!allowedExts.includes(ext)) {
        return NextResponse.json(
          { error: `不支持的文件类型：${file.type || ext}` },
          { status: 400 }
        );
      }
    }

    // Create uploads directory
    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = getExtension(file.name);
    const uniqueName = `${randomUUID()}.${ext}`;
    const filePath = join(uploadsDir, uniqueName);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const fileInfo = {
      filename: file.name,
      url: `/uploads/${uniqueName}`,
      size: file.size,
      type: file.type || ext,
    };

    return NextResponse.json(fileInfo, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "文件上传失败" }, { status: 500 });
  }
}
