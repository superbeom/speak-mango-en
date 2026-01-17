// 주제 목록 정의 (대분류/소분류 체계 적용)
const topics = [
  {
    domain: "conversation",
    category: "daily",
    topic: "미국 원어민이 매일 쓰는 생활 영어 표현",
  },
  {
    domain: "conversation",
    category: "business",
    topic: "비즈니스 미팅이나 이메일에서 꼭 필요한 정중한 영어 표현",
  },
  {
    domain: "conversation",
    category: "travel",
    topic: "해외 여행할 때 유용한 필수 영어 표현",
  },
  {
    domain: "conversation",
    category: "shopping",
    topic: "해외 직구 쇼핑이나 매장에서 사용하는 쇼핑 관련 영어 표현",
  },
  {
    domain: "conversation",
    category: "emotion",
    topic: "기쁨, 슬픔, 화남 등 감정을 섬세하게 표현하는 영어 단어",
  },
  {
    domain: "conversation",
    category: "slang",
    topic: "미드나 영화에 자주 나오는 최신 트렌디한 슬랭",
  },
];

// 랜덤 선택
const selected = topics[Math.floor(Math.random() * topics.length)];

return {
  json: {
    domain: selected.domain,
    category: selected.category,
    topic: selected.topic, // AI 프롬프트용
  },
};
