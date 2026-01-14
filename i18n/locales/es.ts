import { SERVICE_NAME } from "@/constants";

export const es = {
  meta: {
    expressionTitle: "{expression}",
    expressionDesc:
      "{meaning} | Aprende con pronunciación nativa en {serviceName}.",
    mainTitle: "{serviceName} - Coversación en Inglés Diaria",
    mainDescription: `Expresiones en inglés frescas seleccionadas por ${SERVICE_NAME} cada día. Mejora tus habilidades de conversación para negocios, viajes y la vida diaria con una frase al día. Incluye pronunciación nativa y explicación de matices.`,
    keywords: `Conversación en inglés, Inglés de negocios, Inglés diario, Una frase al día, Expresión en inglés, ${SERVICE_NAME}, Estudio de inglés`,
  },
  common: {
    back: "Atrás",
    loading: "Cargando...",
    loadMore: "Cargar más",
    notFound: "Datos no encontrados.",
  },
  home: {
    title: "Expresiones de Hoy",
    description:
      "Aprende expresiones útiles en inglés de forma fácil y divertida.",
    subHeader: "Cada día, una nueva expresión.",
    emptyState: "No se encontraron expresiones. ¡Vuelve más tarde!",
    emptyStateSub: "Intenta ajustar tus filtros o búsqueda.",
  },
  filter: {
    searchPlaceholder: "Buscar expresiones...",
    filteringByTag: "Filtrando por etiqueta: #{tag}",
    categoryLabel: "Categoría",
    all: "Todos",
  },
  detail: {
    situationTitle: "💡 ¿Cuál es la situación?",
    dialogueTitle: "💬 ¡Aprende con diálogo!",
    tipTitle: "🍯 ¡Consejo del profesor!",
    missionTitle: "🔥 ¡Misión de hoy!",
    checkAnswer: "Ver respuesta",
    relatedTitle: "📚 ¿Qué tal estas expresiones?",
    playAll: "Reproducir todo",
    stop: "Detener",
    share: "Compartir",
    shareCopied: "¡Enlace copiado al portapapeles!",
    shareFailed: "Error al compartir. Inténtalo de nuevo.",
  },
  card: {
    label: "Expresión de Hoy",
    situationQuestion: "¿Cuál es la situación?",
    noDescription: "No hay descripción disponible.",
  },
};
