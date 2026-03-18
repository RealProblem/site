"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

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

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/submissions/${id}`);
        if (!res.ok) throw new Error("投稿不存在");
        const data = await res.json();

        // Check if editable
        if (data.status !== "open") {
          setError("修改期已结束，无法编辑");
          setCanEdit(false);
        } else {
          const lockDate = new Date(data.submittedAt);
          lockDate.setDate(lockDate.getDate() + 7);
          if (new Date() >= lockDate) {
            setError("修改期已结束，无法编辑");
            setCanEdit(false);
          } else {
            setCanEdit(true);
          }
        }

        setTitle(data.title);
        setContent(data.content || "");
        try {
          setAttachments(JSON.parse(data.attachments || "[]"));
        } catch {
          setAttachments([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "上传失败");
        }
        const attachment: Attachment = await res.json();
        setAttachments((prev) => [...prev, attachment]);
      } catch (err) {
        setError(err instanceof Error ? err.message : `上传失败`);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, attachments }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存失败");
      }

      setSuccess(true);
      setTimeout(() => router.push(`/paper/${id}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <p className="text-stone-500">加载中…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            编辑投稿
          </h1>
          <button
            onClick={() => router.push(`/paper/${id}`)}
            className="text-sm text-stone-500 hover:text-stone-900"
          >
            ← 返回
          </button>
        </div>

        {!canEdit ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <p className="text-amber-800">{error || "无法编辑此投稿"}</p>
            <button
              onClick={() => router.push(`/paper/${id}`)}
              className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm"
            >
              返回投稿页
            </button>
          </div>
        ) : (
          <div className="space-y-6 bg-white p-8 rounded-lg border border-stone-200">
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-900">
                标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-stone-900">
                附件
              </label>
              <div
                className="border-2 border-dashed border-stone-200 rounded-lg p-4 text-center hover:border-stone-400 transition-colors cursor-pointer"
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
                  <p className="text-stone-500 text-sm">上传中…</p>
                ) : (
                  <p className="text-stone-500 text-sm">点击上传新文件</p>
                )}
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-stone-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span>
                          {att.type?.includes("pdf") ? "📄" : att.type?.includes("image") ? "🖼️" : "📎"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-stone-900 truncate">{att.filename}</p>
                          <p className="text-xs text-stone-400">{formatFileSize(att.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAttachment(i)}
                        className="text-stone-400 hover:text-red-500 text-sm px-2"
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
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono text-sm leading-relaxed"
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                保存成功，正在跳转…
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving || isUploading}
              className="w-full px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:bg-stone-400 transition-colors font-medium"
            >
              {saving ? "保存中…" : "保存修改"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
