"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface FilterBarProps {
  track?: string;
  badge?: string;
  q?: string;
}

export default function FilterBar({ track, badge, q }: FilterBarProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(q || "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/browse?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchInput.trim()) {
      params.set("q", searchInput);
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-6 mb-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-900">轨道</label>
          <select
            value={track || "all"}
            onChange={(e) => updateFilter("track", e.target.value)}
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            <option value="all">全部</option>
            <option value="A">A 轨 · 问题轨</option>
            <option value="B">B 轨 · 问题+解答轨</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-900">状态</label>
          <select
            value={badge || "all"}
            onChange={(e) => updateFilter("badge", e.target.value)}
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            <option value="all">全部</option>
            <option value="featured">🌟 精选问题</option>
            <option value="accepted">✅ 正式收录</option>
            <option value="notable">💡 值得关注</option>
            <option value="archived">📌 存档</option>
            <option value="rejected">❌ 不收录</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-900">搜索</label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="搜索标题或内容…"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              搜索
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
