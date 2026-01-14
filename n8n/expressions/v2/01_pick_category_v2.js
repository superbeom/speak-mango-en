// 주제 목록 정의 (대분류/소분류 체계 적용)
// V2 변경점: 랜덤 선택 없이 모든 카테고리를 반환하여 동시에 병렬 처리합니다.
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

// 모든 주제를 아이템으로 반환 (Fan-out)
return topics.map(t => ({
    json: {
        domain: t.domain,
        category: t.category,
        topic: t.topic
    }
}));
