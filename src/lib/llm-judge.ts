import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getBadgeFromScore } from "./constants";

interface ReviewDimension {
  name: string;
  score: number;
  weight: number;
  comment: string;
}

export interface ReviewResult {
  dimensions: ReviewDimension[];
  weightedTotal: number;
  badge: string;
  summary: string;
  suggestions: string;
}

function buildPrompt(track: string, title: string, author: string, reproLevel: string, content: string, isFeedback: boolean = false): string {
  const trackADimensions = `
| 维度 | 权重 | 说明 |
|------|------|------|
| 问题的真实性 | 0.30 | 这是否是一个真实存在、有具体所指的问题，而非空泛或人为制造？ |
| 被忽视程度 | 0.25 | 这个问题在现有文献/讨论中是否确实缺乏关注？ |
| 表述清晰度 | 0.20 | 问题是否被清晰、准确、无歧义地陈述？ |
| 潜在价值 | 0.15 | 回答这个问题可能带来什么样的认知或实践进展？ |
| 背景充分性 | 0.10 | 是否提供了足够的背景让非本领域读者也能理解？ |`;

  const trackBDimensions = `
| 维度 | 权重 | 说明 |
|------|------|------|
| 问题的真实性 | 0.20 | 这是否是一个真实存在、有具体所指的问题，而非空泛或人为制造？ |
| 被忽视程度 | 0.15 | 这个问题在现有文献/讨论中是否确实缺乏关注？ |
| 解答的实质性 | 0.25 | 解答是否有实质内容（数据、推理、框架），而非空泛讨论？ |
| 方法论合理性 | 0.15 | 方法是否合理？推理链是否站得住脚？ |
| 可复现性 | 0.15 | （如有实验）开源程度和复现难度；无实验则评估论证的可验证性 |
| 表述质量 | 0.10 | 整体逻辑清晰度和写作质量 |`;

  const dimensions = track === "A" ? trackADimensions : trackBDimensions;

  const modeInstruction = isFeedback
    ? `你现在处于"反馈建议模式"。请给出建设性的改进建议，帮助投稿者在修改期内提升稿件质量。不要给出最终裁决。`
    : `你现在处于"最终裁决模式"。请给出正式的评审结果。`;

  return `你是 RealProblem 期刊的自动评审系统。RealProblem 专注于收录各学科中真正重要但在传统学术体系中被忽视的问题。

${modeInstruction}

## 投稿信息
- Track: ${track === "A" ? "问题轨（只提问）" : "问题+解答轨（提问并解答）"}
- 标题: ${title}
- 作者署名: ${author}
- 可复现性层级: ${reproLevel}

## 全文
${content}

## 评审维度
请逐条评分（0-100），并为每个维度写一段 2-3 句的评审意见。
${dimensions}

## 注意事项
1. 你评审的不是"论文写得好不好"，而是"这个问题是不是真问题"
2. 负面结果、失败报告、方法论质疑都是完全合格的投稿类型
3. 不要因为缺乏正面结果而扣分
4. 不要因为文章短而扣分——500字的精准提问可以优于5000字的空泛讨论
5. 对可复现性层级：full_open 在可复现性维度加 10 分，code 加 5 分，spec 为基础分
6. 警惕纯 AI 生成的空泛内容——如果文章缺乏具体的个人思考、领域洞察或原创视角，在所有维度扣分
7. 投稿语言为中文，请用中文撰写所有评审意见

## 输出格式
请严格按以下 JSON 格式输出，不要添加任何其他文字：
{
  "dimensions": [
    {"name": "维度名称", "score": 85, "weight": 0.30, "comment": "评审意见..."}
  ],
  "weightedTotal": 82.5,
  "badge": "accepted",
  "summary": "一段话总结评审结论（50-100字）",
  "suggestions": "给投稿者的改进建议（50-100字）"
}

badge 取值规则：weightedTotal >= 90 → "featured", >= 70 → "accepted", >= 50 → "notable", >= 30 → "archived", < 30 → "rejected"`;
}

function parseReviewJSON(text: string): ReviewResult {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate and normalize
  const result: ReviewResult = {
    dimensions: parsed.dimensions || [],
    weightedTotal: parsed.weightedTotal || 0,
    badge: parsed.badge || getBadgeFromScore(parsed.weightedTotal || 0),
    summary: parsed.summary || "",
    suggestions: parsed.suggestions || "",
  };

  // Recalculate weighted total for accuracy
  if (result.dimensions.length > 0) {
    result.weightedTotal = Math.round(
      result.dimensions.reduce((sum: number, d: ReviewDimension) => sum + d.score * d.weight, 0) * 10
    ) / 10;
    result.badge = getBadgeFromScore(result.weightedTotal);
  }

  return result;
}

async function reviewWithClaude(prompt: string): Promise<ReviewResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseReviewJSON(text);
}

async function reviewWithGPT(prompt: string): Promise<ReviewResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4096,
  });
  const text = response.choices[0]?.message?.content || "";
  return parseReviewJSON(text);
}

async function reviewWithGemini(prompt: string): Promise<ReviewResult> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseReviewJSON(text);
}

async function reviewWithBailian(prompt: string): Promise<ReviewResult> {
  // 阿里云百炼 OpenAI 兼容接口
  const client = new OpenAI({
    apiKey: process.env.BAILIAN_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });
  const response = await client.chat.completions.create({
    model: process.env.BAILIAN_MODEL || "qwen-max",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4096,
  });
  const text = response.choices[0]?.message?.content || "";
  return parseReviewJSON(text);
}

// Model registry: name → review function + env key
const MODEL_REGISTRY: Record<string, { fn: (prompt: string) => Promise<ReviewResult>; envKey: string }> = {
  claude: { fn: reviewWithClaude, envKey: "ANTHROPIC_API_KEY" },
  gpt: { fn: reviewWithGPT, envKey: "OPENAI_API_KEY" },
  gemini: { fn: reviewWithGemini, envKey: "GOOGLE_AI_API_KEY" },
  bailian: { fn: reviewWithBailian, envKey: "BAILIAN_API_KEY" },
};

export interface FullReviewResult {
  results: Record<string, ReviewResult | null>;
  finalScore: number;
  finalBadge: string;
  errors: string[];
}

export async function runFullReview(
  track: string,
  title: string,
  author: string,
  reproLevel: string,
  content: string,
  isFeedback: boolean = false
): Promise<FullReviewResult> {
  const prompt = buildPrompt(track, title, author, reproLevel, content, isFeedback);
  const errors: string[] = [];

  // Determine which models have API keys configured
  const activeModels = Object.entries(MODEL_REGISTRY)
    .filter(([, config]) => !!process.env[config.envKey])
    .map(([name, config]) => ({ name, fn: config.fn }));

  if (activeModels.length === 0) {
    return {
      results: {},
      finalScore: 0,
      finalBadge: "archived",
      errors: ["未配置任何 LLM API 密钥"],
    };
  }

  // Run all available models in parallel
  const settled = await Promise.allSettled(
    activeModels.map(({ fn }) => fn(prompt))
  );

  const results: Record<string, ReviewResult | null> = {};
  const scores: number[] = [];

  settled.forEach((outcome, i) => {
    const modelName = activeModels[i].name;
    if (outcome.status === "fulfilled") {
      results[modelName] = outcome.value;
      scores.push(outcome.value.weightedTotal);
    } else {
      results[modelName] = null;
      errors.push(`${modelName}: ${outcome.reason}`);
    }
  });

  // Calculate median score
  scores.sort((a, b) => a - b);
  let finalScore = 0;
  if (scores.length >= 3) {
    finalScore = scores[Math.floor(scores.length / 2)]; // median
  } else if (scores.length === 2) {
    finalScore = (scores[0] + scores[1]) / 2;
  } else if (scores.length === 1) {
    finalScore = scores[0];
  }

  finalScore = Math.round(finalScore * 10) / 10;

  return {
    results,
    finalScore,
    finalBadge: getBadgeFromScore(finalScore),
    errors,
  };
}
