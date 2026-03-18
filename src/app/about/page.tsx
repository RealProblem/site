export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-16">
        {/* Title */}
        <section className="text-center space-y-4">
          <h1 className="text-5xl font-serif font-bold text-stone-900">
            关于 RealProblem
          </h1>
          <p className="text-xl text-stone-600">
            真问题，不需要好听的答案
          </p>
        </section>

        {/* Mission */}
        <section className="space-y-6">
          <h2 className="text-3xl font-serif font-bold text-stone-900">使命与定位</h2>
          <div className="prose prose-stone max-w-none space-y-4">
            <p className="text-lg text-stone-700 leading-relaxed">
              RealProblem 是一份学术期刊，致力于发现、讨论和解决真实的、有深度的学术问题。
            </p>
            <p className="text-lg text-stone-700 leading-relaxed">
              我们认为好的学术工作始于好的问题。本期刊欢迎任何学科领域的研究者提出他们遇到的真实问题——无论这个问题有多么离经叛道、多么令人困惑，只要它有学术价值，我们就想听。
            </p>
            <p className="text-lg text-stone-700 leading-relaxed">
              我们的目标是建立一个严肃但不刻板、开放但有质量把关的学术交流平台，使研究者能够分享他们最真实的学术思考。
            </p>
          </div>
        </section>

        {/* Dual-Track System */}
        <section className="space-y-6">
          <h2 className="text-3xl font-serif font-bold text-stone-900">双轨制投稿体系</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-stone-900 pl-6 py-4 bg-stone-50 rounded-r">
              <h3 className="text-xl font-bold text-stone-900 mb-3">Track A：问题轨</h3>
              <p className="text-stone-700 mb-3">
                "只问不答"——提出一个有学术价值的问题，但不一定要给出完整答案。
              </p>
              <ul className="space-y-2 text-stone-700">
                <li>• 问题可以来自研究过程中的卡点</li>
                <li>• 问题可以是对某个领域现状的反思和质疑</li>
                <li>• 问题可以是跨学科的困境和矛盾</li>
                <li>• 我们鼓励"暴露无知"，而非隐藏问题</li>
              </ul>
            </div>
            <div className="border-l-4 border-stone-900 pl-6 py-4 bg-stone-50 rounded-r">
              <h3 className="text-xl font-bold text-stone-900 mb-3">Track B：问题+解答轨</h3>
              <p className="text-stone-700 mb-3">
                既提出问题，也给出自己的思考、方案或部分解答。
              </p>
              <ul className="space-y-2 text-stone-700">
                <li>• 更接近传统论文的模式</li>
                <li>• 要求提供可复现性证据（代码、数据或详细描述）</li>
                <li>• 强调论据充分和逻辑清晰</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Review Mechanism */}
        <section className="space-y-6">
          <h2 className="text-3xl font-serif font-bold text-stone-900">评审机制：LLM Judge</h2>
          <div className="prose prose-stone max-w-none space-y-4">
            <p className="text-lg text-stone-700 leading-relaxed">
              本期刊采用 LLM Judge 评审体系，使用三个主流大语言模型对所有投稿进行独立评审：
            </p>
            <ul className="space-y-2 text-stone-700">
              <li>• <strong>Claude 3.5 Sonnet</strong></li>
              <li>• <strong>GPT-4 Turbo</strong></li>
              <li>• <strong>Gemini 2.0</strong></li>
            </ul>
            <p className="text-lg text-stone-700 leading-relaxed">
              每个模型独立评审投稿，从以下维度给出评分：
            </p>
            <ul className="space-y-2 text-stone-700">
              <li>• 问题的原创性和深度</li>
              <li>• 问题的清晰程度和表达质量</li>
              <li>• 学术相关性和科研价值</li>
              <li>• (仅对 Track B) 解答的合理性和充分性</li>
            </ul>
            <p className="text-lg text-stone-700 leading-relaxed">
              三个模型的评分取中位数作为最终综合评分，以此确定投稿的 Badge（徽章）。
            </p>
          </div>
        </section>

        {/* Badge System */}
        <section className="space-y-6">
          <h2 className="text-3xl font-serif font-bold text-stone-900">Badge 徽章说明</h2>
          <div className="space-y-4">
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
              <p className="font-bold text-yellow-900 mb-2">🌟 精选问题 (Featured) — 综合评分 ≥ 90</p>
              <p className="text-yellow-800">
                最高级别。问题具有显著的原创性、深度和学术价值，表达清晰，有潜力成为同领域研究的参考。
              </p>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <p className="font-bold text-green-900 mb-2">✅ 正式收录 (Accepted) — 综合评分 ≥ 70</p>
              <p className="text-green-800">
                符合期刊质量标准。问题有学术价值，论证充分，值得发表和讨论。
              </p>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <p className="font-bold text-blue-900 mb-2">💡 值得关注 (Notable) — 综合评分 ≥ 50</p>
              <p className="text-blue-800">
                虽然问题本身可能还需要打磨，但具有一定学术相关性。作者可以收集反馈后重新投稿。
              </p>
            </div>
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
              <p className="font-bold text-gray-900 mb-2">📌 存档 (Archived) — 综合评分 ≥ 30</p>
              <p className="text-gray-800">
                问题本身可能缺乏深度或清晰度，但仍被保留以供参考。建议重新审视和改进。
              </p>
            </div>
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <p className="font-bold text-red-900 mb-2">❌ 不收录 (Rejected) — 综合评分 &lt; 30</p>
              <p className="text-red-800">
                问题不符合期刊的学术标准，可能缺乏足够的学术相关性或清晰的表述。
              </p>
            </div>
          </div>
        </section>

        {/* Submission Policy */}
        <section className="space-y-6">
          <h2 className="text-3xl font-serif font-bold text-stone-900">投稿政策</h2>
          <div className="space-y-4 text-stone-700">
            <div>
              <h3 className="font-bold text-stone-900 mb-2">投稿资格</h3>
              <p>任何人都可以投稿，无需具有学术身份。我们欢迎来自学生、研究者、从业者的真实问题。</p>
            </div>
            <div>
              <h3 className="font-bold text-stone-900 mb-2">修改期</h3>
              <p>投稿后有 7 天的修改期。7 天后投稿将被锁定，提交给评审模型进行评审。修改期内可以无限次修改。</p>
            </div>
            <div>
              <h3 className="font-bold text-stone-900 mb-2">评审周期</h3>
              <p>投稿锁定后，通常在 24-72 小时内完成 LLM 评审并公布结果。</p>
            </div>
            <div>
              <h3 className="font-bold text-stone-900 mb-2">重新投稿</h3>
              <p>被拒或低评分的投稿可以在修改后重新投稿。系统会记录版本历史。</p>
            </div>
            <div>
              <h3 className="font-bold text-stone-900 mb-2">著作权</h3>
              <p>投稿即意味着你同意内容被公开发表。我们采用 CC-BY 协议。</p>
            </div>
            <div>
              <h3 className="font-bold text-stone-900 mb-2">匿名投稿</h3>
              <p>所有投稿默认匿名。你可以选择显示昵称，但不会透露身份。</p>
            </div>
          </div>
        </section>

        {/* Reproducibility Levels */}
        <section className="space-y-6">
          <h2 className="text-3xl font-serif font-bold text-stone-900">可复现性等级（Track B）</h2>
          <div className="space-y-4">
            <div className="border border-stone-200 rounded-lg p-4">
              <p className="font-bold text-stone-900 mb-2">⬛ 描述级 (Descriptive)</p>
              <p className="text-stone-700">
                提供足够的细节描述，使得具有相关背景的读者能理解你的方案，但不提供可直接运行的代码或数据。
              </p>
            </div>
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <p className="font-bold text-orange-900 mb-2">🟧 代码级 (Code)</p>
              <p className="text-orange-800">
                提供完整的代码和必要的环境配置文件，使得技术背景的读者可以复现你的工作。
              </p>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <p className="font-bold text-green-900 mb-2">🟩 完全开放 (Full Open)</p>
              <p className="text-green-800">
                代码 + 数据 + 环境配置 + 一键复现脚本。这是最高标准，任何人都能在其机器上完整复现你的工作。
              </p>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="border-t border-stone-200 pt-12">
          <h2 className="text-xl font-bold text-stone-900 mb-4">免责声明</h2>
          <p className="text-stone-600 leading-relaxed">
            RealProblem 是一份社区驱动的期刊，采用 LLM 评审而非传统的人工评审。
            LLM 的评审结果仅供参考，可能存在偏见或错误。我们鼓励读者独立思考，形成自己的判断。
            投稿内容的学术价值需要学术界的长期检验。
          </p>
        </section>
      </div>
    </main>
  );
}
