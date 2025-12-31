import { Expression } from "@/types/database.types";

export const MOCK_EXPRESSIONS: Expression[] = [
  {
    id: "1",
    expression: "Break a leg",
    meaning: "행운을 빌어! 🍀",
    content: {
      situation: "친구나 가족이 중요한 시험이나 공연을 앞두고 있을 때, '잘해!' 혹은 '행운을 빌어!'라는 뜻으로 사용해요. 원래는 무대 올라가기 전에 하는 말이었대요! 😎",
      dialogue: [
        { en: "I have a big audition today.", kr: "나 오늘 중요한 오디션이 있어." },
        { en: "Break a leg! You'll be great.", kr: "행운을 빌어! 넌 잘할 거야." }
      ],
      tip: "진짜 다리를 부러뜨리라는 게 아니니까 걱정 마세요! 반어법으로 행운을 비는 귀여운 표현이랍니다. ✨",
      quiz: { question: "중요한 시험을 앞둔 친구에게 할 수 있는 말은?", answer: "Break a leg" }
    },
    tags: ["daily", "idiom"],
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    expression: "Under the weather",
    meaning: "몸 컨디션이 별로야.. 🤒",
    content: {
      situation: "감기 기운이 있거나 몸이 으슬으슬할 때, 딱 찝어서 어디가 아프다기보다 전반적으로 상태가 안 좋을 때 쓰는 표현이에요. ☁️",
      dialogue: [
        { en: "Are you coming to the party tonight?", kr: "오늘 밤 파티에 올 거야?" },
        { en: "I'm feeling a bit under the weather, so I'll pass.", kr: "몸이 좀 안 좋아서 이번엔 빠질게." }
      ],
      tip: "날씨(weather) 아래에 있다는 건, 기분이 가라앉고 몸이 무겁다는 뉘앙스예요! ☔",
      quiz: { question: "몸 상태가 좋지 않을 때 쓰는 표현은?", answer: "Under the weather" }
    },
    tags: ["health", "daily"],
    published_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    expression: "Bite the bullet",
    meaning: "꾹 참고 해버리자! 😬",
    content: {
      situation: "정말 하기 싫은 일인데 피할 수 없을 때, '에라 모르겠다, 꾹 참고 하자!'라고 결심할 때 쓰는 표현이에요. 치과 가기 전이나 밀린 숙제 할 때 딱이죠? 📚",
      dialogue: [
        { en: "I hate going to the dentist.", kr: "나 진짜 치과 가는 거 싫어해." },
        { en: "I know, but you just have to bite the bullet.", kr: "알아, 그래도 그냥 꾹 참고 다녀와야 해." }
      ],
      tip: "옛날에 수술할 때 총알(bullet)을 입에 물고 참았던 것에서 유래했대요. 정말 무시무시한 유래죠? 😱",
      quiz: { question: "싫은 일을 꾹 참고 할 때 쓰는 표현은?", answer: "Bite the bullet" }
    },
    tags: ["idiom", "resilience"],
    published_at: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];
