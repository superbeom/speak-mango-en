import { SERVICE_NAME } from "@/constants";

export const fr = {
  meta: {
    expressionTitle: "{expression}",
    expressionDesc:
      "{meaning} | Apprenez avec une prononciation native sur {serviceName}.",
    mainTitle: "{serviceName} - Conversation Anglaise Quotidienne",
    mainDescription: `Des expressions anglaises fraîches sélectionnées à la main par ${SERVICE_NAME} tous les jours. Améliorez vos compétences en conversation professionnelle, de voyage et quotidienne avec une phrase par jour. Inclut la prononciation native et l'explication des nuances.`,
    keywords: `Conversation anglaise, Anglais des affaires, Anglais quotidien, Une phrase par jour, Expression anglaise, ${SERVICE_NAME}, Étude de l'anglais, étudier l'anglais, apprentissage de l'anglais, apprendre l'anglais`,
    seo: {
      expressionSuffixes: ["définition", "signification", "sens"],
      meaningSuffixes: ["en anglais", "comment dire en anglais", "traduction en anglais"],
    },
  },
  common: {
    back: "Retour",
    loading: "Chargement...",
    loadMore: "Voir plus",
    notFound: "Données non trouvées.",
  },
  home: {
    title: "Expressions d'Aujourd'hui",
    description:
      "Apprenez des expressions anglaises utiles facilement et en vous amusant.",
    subHeader: "Chaque jour, une nouvelle expression.",
    emptyState: "Aucune expression trouvée. Revenez plus tard !",
    emptyStateSub: "Essayez d'ajuster vos filtres ou votre recherche.",
  },
  filter: {
    searchPlaceholder: "Rechercher des expressions...",
    filteringByTag: "Filtrage par tag : #{tag}",
    categoryLabel: "Catégorie",
    all: "Tout",
  },
  detail: {
    situationTitle: "💡 Quelle est la situation ?",
    dialogueTitle: "💬 Apprenez avec le dialogue !",
    tipTitle: "🍯 Conseil du prof !",
    missionTitle: "🔥 Mission d'aujourd'hui !",
    checkAnswer: "Vérifier la réponse",
    relatedTitle: "📚 Que pensez-vous de ces expressions ?",
    playAll: "Tout écouter",
    stop: "Arrêter",
    share: "Partager",
    shareCopied: "Partagé avec succès !",
    shareFailed: "Échec du partage",
  },
  card: {
    label: "Expression du Jour",
    situationQuestion: "Quelle est la situation ?",
    noDescription: "Aucune description disponible.",
    share: "Partager",
    shareCopied: "Partagé avec succès !",
    shareFailed: "Échec du partage",
  },
};
