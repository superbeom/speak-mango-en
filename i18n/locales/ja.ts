import { SERVICE_NAME } from "@/constants";

export const ja = {
  meta: {
    expressionTitle: "{expression}",
    expressionDesc:
      "{meaning} | {serviceName}でネイティブの発音と一緒に学びましょう。",
    mainTitle: "{serviceName} - 毎日の英会話",
    mainDescription: `${SERVICE_NAME}が厳選した新鮮な英語表現を毎日お届けします。1日1フレーズでビジネス、旅行、日常会話のスキルを向上させましょう。ネイティブの発音とニュアンス解説付き。`,
    keywords: `英会話, ビジネス英語, 日常英語, 1日1フレーズ, 英語表現, ${SERVICE_NAME}, 英語学習`,
  },
  common: {
    back: "戻る",
    loading: "読み込み中...",
    loadMore: "もっと見る",
    notFound: "データが見つかりません。",
  },
  home: {
    title: "今日の表現",
    description: "便利で楽しい英語表現を簡単に学びましょう。",
    subHeader: "毎日、新しい表現をひとつ。",
    emptyState: "表現が見つかりません。また後で来てください！",
    emptyStateSub: "フィルターや検索条件を調整してみてください。",
  },
  filter: {
    searchPlaceholder: "表現を検索...",
    filteringByTag: "タグでフィルタリング: #{tag}",
    categoryLabel: "カテゴリー",
    all: "すべて",
  },
  detail: {
    situationTitle: "💡 どんな状況？",
    dialogueTitle: "💬 会話で学ぼう！",
    tipTitle: "🍯 先生のヒント！",
    missionTitle: "🔥 今日のミッション！",
    checkAnswer: "答えを確認",
    relatedTitle: "📚 こんな表現もどうですか？",
    playAll: "すべて再生",
    stop: "停止",
    share: "共有",
    shareCopied: "リンクがクリップボードにコピーされました！",
    shareFailed: "共有に失敗しました。もう一度お試しください。",
  },
  card: {
    label: "今日の表現",
    situationQuestion: "どんな状況？",
    noDescription: "説明がありません。",
    share: "共有",
    shareCopied: "リンクをコピーしました！",
    shareFailed: "共有に失敗しました",
  },
};
