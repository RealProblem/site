import BadgeTag from './BadgeTag';

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  comment: string;
}

interface ReviewReportProps {
  modelName: 'claude' | 'gpt' | 'gemini';
  dimensions: DimensionScore[];
  weightedTotal: number;
  badge: 'featured' | 'accepted' | 'notable' | 'archived' | 'rejected';
  summary: string;
  suggestions: string | string[];
}

export default function ReviewReport({
  modelName,
  dimensions,
  weightedTotal,
  badge,
  summary,
  suggestions,
}: ReviewReportProps) {
  const modelDisplayName: Record<string, string> = {
    claude: 'Claude',
    gpt: 'GPT-4',
    gemini: 'Gemini',
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="border border-stone-200 rounded-lg bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <h3 className="text-lg font-semibold text-stone-900">
          {modelDisplayName[modelName]} 评审报告
        </h3>
        <BadgeTag badge={badge} />
      </div>

      {/* Weighted Score */}
      <div className="bg-stone-50 rounded-lg p-4">
        <div className="text-sm text-stone-600 mb-2">综合评分</div>
        <div className="text-3xl font-bold text-stone-900">{weightedTotal.toFixed(1)}</div>
      </div>

      {/* Dimension Scores */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
          维度评分
        </h4>
        <div className="space-y-3">
          {dimensions.map((dimension) => {
            const percentage = dimension.score;
            return (
              <div key={dimension.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">
                    {dimension.name}
                  </span>
                  <span className="text-sm font-semibold text-stone-900">
                    {dimension.score}
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getScoreColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-stone-600">{dimension.comment}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-stone-100 pt-4">
        <h4 className="text-sm font-semibold text-stone-900 mb-2">评审总结</h4>
        <p className="text-sm text-stone-700 leading-relaxed">{summary}</p>
      </div>

      {/* Suggestions */}
      {(Array.isArray(suggestions) ? suggestions.length > 0 : !!suggestions) && (
        <div className="border-t border-stone-100 pt-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-3">改进建议</h4>
          {Array.isArray(suggestions) ? (
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex gap-3 text-sm text-stone-700">
                  <span className="text-amber-600 font-semibold mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-700">{suggestions}</p>
          )}
        </div>
      )}
    </div>
  );
}
