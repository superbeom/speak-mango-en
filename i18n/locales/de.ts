import { SERVICE_NAME } from "@/constants";

export const de = {
  meta: {
    expressionTitle: "{expression}",
    expressionDesc:
      "{meaning} | Lernen Sie mit muttersprachlicher Aussprache auf {serviceName}.",
    mainTitle: "{serviceName} - Tägliche englische Konversation",
    mainDescription: `Frische englische Ausdrücke, die täglich von ${SERVICE_NAME} handverlesen werden. Verbessern Sie Ihre Geschäfts-, Reise- und Alltagskonversationsfähigkeiten mit einem Satz pro Tag. Inklusive muttersprachlicher Aussprache und Erklärung der Nuancen.`,
    keywords: `Englische Konversation, Alltagsenglisch, Ein Satz pro Tag, Englischer Ausdruck, ${SERVICE_NAME}, Englisch lernen, Englischstudium, Englischunterricht`,
    seo: {
      expressionSuffixes: ["Bedeutung", "Definition", "Erklärung"],
      meaningSuffixes: [
        "auf Englisch",
        "wie sagt man {} auf Englisch",
        "Englische Übersetzung",
      ],
    },
    categories: {
      daily: "Alltagsenglisch",
      business: "Geschäftsenglisch",
      travel: "Reiseenglisch",
      shopping: "Einkaufsenglisch",
      emotion: "Gefühlsausdrücke",
      slang: "Umgangssprache",
    },
  },
  common: {
    back: "Zurück",
    loading: "Laden...",
    loadMore: "Mehr laden",
    notFound: "Daten nicht gefunden.",
  },
  home: {
    title: "Heutige Ausdrücke",
    description:
      "Lernen Sie nützliche englische Ausdrücke einfach und mit Spaß.",
    subHeader: "Jeden Tag ein neuer Ausdruck.",
    emptyState: "Keine Ausdrücke gefunden. Kommen Sie später wieder!",
    emptyStateSub: "Versuchen Sie, Ihre Filter oder Suchanfrage anzupassen.",
  },
  filter: {
    searchPlaceholder: "Ausdrücke suchen...",
    filteringByTag: "Filtern nach Tag: #{tag}",
    categoryLabel: "Kategorie",
    all: "Alle",
  },
  detail: {
    situationTitle: "💡 Was ist die Situation?",
    dialogueTitle: "💬 Lernen mit Dialog!",
    tipTitle: "🍯 Lehrertipp!",
    missionTitle: "🔥 Heutige Mission!",
    checkAnswer: "Antwort überprüfen",
    relatedTitle: "📚 Wie wäre es mit diesen Ausdrücken?",
    playAll: "Alles abspielen",
    stop: "Stopp",
    share: "Teilen",
    shareCopied: "Erfolgreich geteilt!",
    shareFailed: "Teilen fehlgeschlagen",
  },
  card: {
    label: "Ausdruck des Tages",
    situationQuestion: "Was ist die Situation?",
    noDescription: "Keine Beschreibung verfügbar.",
    share: "Teilen",
    shareCopied: "Erfolgreich geteilt!",
    shareFailed: "Teilen fehlgeschlagen",
  },
};
