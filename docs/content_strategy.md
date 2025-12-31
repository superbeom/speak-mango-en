# Content Strategy: Daily English

벤치마킹 분석을 통해 도출된 "쉽고 재미있는" 영어 학습 콘텐츠의 표준 구조입니다.
이 구조는 학생들이 부담 없이 학습하고, 실생활에서 바로 사용할 수 있도록 설계되었습니다.

## 🎯 Core Principles (핵심 원칙)

1.  **Friendly & Relatable**: 딱딱한 사전적 정의보다는 친구가 알려주는 듯한 구어체 톤앤매너.
2.  **Context First**: "뜻"보다 "상황"을 먼저 제시하여 몰입감 유도.
3.  **Interaction**: 퀴즈를 통해 능동적 학습 유도.

## 📝 Content Structure (콘텐츠 구조)

모든 표현 포스팅은 다음 4단계 흐름을 따릅니다.

### 1. The Hook (상황 도입)
- **What**: 이 표현이 쓰이는 구체적인 상황이나 감정을 묘사.
- **Why**: 학습자의 공감을 얻고 "나도 이런 말 하고 싶었는데!"라는 니즈 자극.
- *Example*: "친구랑 약속 잡을 때, 다 좋은데 딱히 땡기는 건 없을 때 있잖아요. 그럴 때 원어민들은 뭐라고 할까요?"

### 2. The Core (핵심 표현)
- **Expression**: 영어 표현 (굵게 강조).
- **Meaning**: 직관적인 한국어 뜻 (사전적 의미보다는 뉘앙스 중심).
- *Example*: **"I'm easy."** (난 뭐든 좋아 / 난 상관 없어)

### 3. The Context (실전 대화)
- **Dialogue**: A/B 대화 형식을 통해 문맥 속에서의 쓰임새를 보여줌.
- **Translation**: 자연스러운 구어체 번역 병기.
- *Format*:
  > **A**: What do you want for dinner? Pizza or Burgers?
  > (저녁 뭐 먹을래? 피자? 햄버거?)
  >
  > **B**: **I'm easy.** Anything is fine.
  > (난 다 좋아. 뭐든 상관없어.)

### 4. The Finisher (팁 & 퀴즈)
- **Tip/Nuance**: 주의할 점이나 유사 표현 (One Point Lesson).
- **Quiz**: 간단한 빈칸 채우기나 O/X 퀴즈로 마무리.

---

## 🤖 AI Prompt Guide (for n8n)

Gemini에게 요청할 데이터 구조입니다.

```json
{
  "expression": "I'm easy",
  "meaning": "난 뭐든 좋아 (상관 없어)",
  "situation": "점심 메뉴를 고르거나 약속 장소를 정할 때, 상대방의 의견을 따르겠다는 쿨한 태도를 보일 때 사용해요.",
  "dialogue": [
    {
      "en": "Are you picky about food?",
      "kr": "너 음식 가리는 거 있어?"
    },
    {
      "en": "No, I'm easy. I eat anything.",
      "kr": "아니, 난 뭐든 좋아. 다 잘 먹어."
    }
  ],
  "tip": "'I'm easy'는 '쉬운 사람'이라는 뜻이 아니라 '까다롭지 않다'는 뜻이에요. 사람을 주어로 쓸 때 오해하지 않도록 주의하세요!",
  "tags": ["daily", "food", "casual"]
}
```
