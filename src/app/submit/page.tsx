"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { TRACK_CONFIG, REPRO_CONFIG, DISCIPLINES } from "@/lib/constants";

interface Attachment {
  filename: string;
  url: string;
  size: number;
  type: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SubmitPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    track: "A" as "A" | "B",
    authorDisplay: "",
    reproLevel: "na",
    tags: [] as string[],
    content: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTrackChange = (track: "A" | "B") => {
    setFormData((prev) => ({
      ...prev,
      track,
      reproLevel: track === "A" ? "na" : prev.reproLevel,
    }));
  };

  const handleTagChange = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        setError(`文件 ${file.name} 超过 20MB 限制`);
        continue;
      }

      try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "上传失败");
        }

        const attachment: Attachment = await res.json();
        setAttachments((prev) => [...prev, attachment]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `上传 ${file.name} 失败`
        );
      }
    }

    setIsUploading(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.title.trim()) {
      setError("请输入标题");
      setIsLoading(false);
      return;
    }

    if (!formData.content.trim() && attachments.length === 0) {
      setError("请输入内容或上传文档");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          track: formData.track,
          authorDisplay: formData.authorDisplay || "匿名",
          reproLevel: formData.track === "B" ? formData.reproLevel : "na",
          tags: formData.tags,
          content: formData.content,
          attachments: attachments,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "投稿失败");
      }

      const data = await response.json();
      router.push(`/paper/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">
          投稿
        </h1>
        <p className="text-stone-500 mb-10">
          分享你的真问题。不限格式，不限长度。
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-white p-8 rounded-lg border border-stone-200"
        >
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-900">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="用一句话描述你的问题"
            />
          </div>

          {/* Track Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-stone-900">
              投稿轨道
            </label>
            <div className="space-y-2">
              {(
                Object.entries(TRACK_CONFIG) as Array<
                  [string, { label: string; description: string }]
                >
              ).map(([key, config]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 cursor-pointer p-4 border rounded-lg transition-colors ${
                    formData.track === key
                      ? "border-stone-900 bg-stone-50"
                      : "border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="track"
                    value={key}
                    checked={formData.track === key}
                    onChange={() => handleTrackChange(key as "A" | "B")}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-stone-900">
                      Track {key}：{config.label}
                    </p>
                    <p className="text-sm text-stone-500">{config.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Author */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-900">
              作者署名
            </label>
            <input
              type="text"
              name="authorDisplay"
              value={formData.authorDisplay}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="留空则显示为「匿名」"
            />
            <p className="text-xs text-stone-400">
              可以使用真名、化名或留空匿名。我们不做任何身份验证。
            </p>
          </div>

          {/* Repro Level (Track B only) */}
          {formData.track === "B" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-stone-900">
                可复现性等级
              </label>
              <div className="space-y-2">
                {(
                  Object.entries(REPRO_CONFIG) as Array<
                    [string, { label: string; description: string }]
                  >
                ).map(([key, config]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 cursor-pointer p-3 border rounded-lg transition-colors ${
                      formData.reproLevel === key
                        ? "border-stone-900 bg-stone-50"
                        : "border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reproLevel"
                      value={key}
                      checked={formData.reproLevel === key}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          reproLevel: e.target.value,
                        }))
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        {config.label}
                      </p>
                      <p className="text-xs text-stone-500">
                        {config.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Discipline Tags */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-stone-900">
              学科标签
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {DISCIPLINES.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-stone-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.tags.includes(tag)}
                    onChange={() => handleTagChange(tag)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-stone-700">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-stone-900">
              上传文档
            </label>
            <p className="text-xs text-stone-400 mb-2">
              支持 PDF、Word、LaTeX、Markdown、图片等格式，单个文件不超过
              20MB。可上传多个文件。
            </p>

            <div
              className="border-2 border-dashed border-stone-200 rounded-lg p-6 text-center hover:border-stone-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.tex,.csv,.zip,.gz,.png,.jpg,.jpeg,.gif,.webp"
              />
              {isUploading ? (
                <p className="text-stone-500">上传中…</p>
              ) : (
                <>
                  <p className="text-stone-600 mb-1">
                    点击选择文件，或将文件拖到此处
                  </p>
                  <p className="text-xs text-stone-400">
                    PDF · Word · LaTeX · Markdown · 图片 · ZIP
                  </p>
                </>
              )}
            </div>

            {/* Uploaded files list */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-3">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">
                        {att.type.includes("pdf")
                          ? "📄"
                          : att.type.includes("image")
                          ? "🖼️"
                          : att.type.includes("zip") || att.type.includes("gz")
                          ? "📦"
                          : "📎"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-stone-900 truncate">
                          {att.filename}
                        </p>
                        <p className="text-xs text-stone-400">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="text-stone-400 hover:text-red-500 transition-colors text-sm px-2"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-900">
              正文内容
            </label>
            <p className="text-xs text-stone-400 mb-1">
              支持 Markdown 格式。如果你的主要内容在上传的文档中，这里可以写摘要或留空。
            </p>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={14}
              className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono text-sm leading-relaxed"
              placeholder={"## 问题陈述\n\n在这里描述你的问题…\n\n## 背景与动机\n\n为什么这个问题值得关注…"}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="w-full px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:bg-stone-400 transition-colors font-medium"
            >
              {isLoading ? "提交中…" : "提交投稿"}
            </button>
            <p className="text-xs text-stone-400 text-center">
              投稿后进入 7 天公开修改期，期间可修改内容。修改期结束后 LLM Judge
              自动评审。
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
