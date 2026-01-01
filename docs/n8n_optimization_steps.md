# n8n Optimization Guide: AI-Driven Generation & Duplicate Check

이 문서는 외부 블로그 스크래핑 방식에서 벗어나, **AI가 스스로 카테고리별 유용한 표현을 선정하고 생성하는 방식**으로 전환하는 가이드입니다. 이 구조는 외부 의존성을 제거하여 워크플로우의 안정성을 극대화합니다.

## 🏗️ 목표 구조 (Target Architecture)

1.  **Schedule Trigger** (매일 9시 실행)
2.  **Code Node** (카테고리 랜덤 선택 - Business, Travel, Native Slang 등)
3.  **Gemini (Expression Generator)** (선택된 카테고리에 맞는 표현 1개 생성)
4.  **Supabase (Check Duplicate)** (DB 중복 확인)
5.  **If Node** (중복 여부 판단)
6.  **Gemini (Content Generator)** (상세 콘텐츠 생성 - 중복이 아닐 때만 실행)
7.  **Code Node (Parse JSON)** (Gemini 응답을 순수 JSON 객체로 변환)
8.  **Supabase (Insert)** (저장)

---

## 🛠️ 단계별 설정 가이드 (Step-by-Step)

### 1단계: 기존 HTTP Request 제거 및 Code 노드 추가

1.  기존의 `HTTP Request` 노드를 삭제합니다.
2.  **Code** 노드를 추가하고 다음과 같이 설정합니다.
    - **Name**: `Pick Category`
3.  다음 코드를 입력하여 실행 때마다 카테고리를 랜덤하게 하나 뽑도록 합니다.

    - **Domain**: 대분류 (conversation, test 등)
    - **Category**: 소분류 (business, travel, shopping 등)
    - **Topic**: AI 프롬프트에 전달할 구체적인 주제 설명

    ```javascript
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
    ```

### 2단계: Gemini Expression Generator 설정 (표현 생성)

`Pick Category` 노드 뒤에 **Google Gemini Chat Model** 노드를 연결합니다.

- **Name**: `Gemini Expression Generator`
- **Prompt**:

  ```text
  Role: Professional English Teacher
  Task: Suggest ONE useful English expression related to the category below.

  Domain: {{ $('Pick Category').item.json.domain }}
  Category: {{ $('Pick Category').item.json.category }}

  Requirements:
  1. The expression must be practical and widely used.
  2. Output MUST be a clean JSON object.

  Output Format (JSON):
  {
    "expression": "Hold your horses",
    "meaning": "잠깐 기다리세요 / 진정하세요"
  }
  ```

### 3단계: Supabase 중복 체크 노드 추가

`Gemini Expression Generator` 뒤에 **Supabase** 노드를 추가합니다.

- **Name**: `Check Duplicate`
- **Operation**: `Get All`
- **Table**: `expressions`
- **Return All**: `True`
- **Limit**: `1`
- **Filters**:
  - **Column**: `expression`
  - **Operator**: `Equal`
  - **Value**: `{{ $('Gemini Expression Generator').item.json.expression }}`

### 4단계: If 노드 추가 (조건 분기)

`Check Duplicate` 뒤에 **If** 노드를 추가합니다.

- **Name**: `If New`
- **Conditions**:
  - Number: `{{ $items('Check Duplicate').length }}` **Equal** `0`
  - (데이터가 없으면 0이므로 새로운 표현임)

### 5단계: Gemini Content Generator 설정 (상세 내용 생성)

`If New` 노드의 **True** (위쪽) 출력에 새로운 **Google Gemini Chat Model** 노드를 연결합니다.

- **Name**: `Gemini Content Generator`
- **Prompt (Define below)**:

  ```text
  Role: Professional English Content Creator & Polyglot Teacher.
  Task: Create a detailed study card for the following English expression in three languages: Korean (ko), Japanese (ja), and Spanish (es).

  Expression: {{ $('Gemini Expression Generator').item.json.expression }}
  Domain: {{ $('Pick Category').item.json.domain }}
  Category: {{ $('Pick Category').item.json.category }}

  Requirements:
  1. Tone: Friendly, humorous, and engaging (target audience: 20-30s), BUT **MUST use polite language (존댓말/Desu-Masu form) consistently**.
  2. Constraint:
     - **NEVER use casual speech (반말)** in the explanation, tips, or situation description.
     - Do NOT mix polite and casual styles. Keep the tone consistent throughout.
     - Do NOT address the reader as specific groups like "Kids" or "Students". Use a general, relatable tone suitable for young adults.
  3. Output MUST be a valid JSON object matching the schema below.
  4. 'meaning' and 'content' fields must contain keys for 'ko', 'ja', 'es'.
  5. In the dialogue section, use the key 'translation' for the translated sentence.
  6. **Consistency**: Use the 'Example (Korean)' below as a reference for the depth, humor, and style. Apply the same quality to Japanese and Spanish.
  7. **Fixed Fields**: Include the 'domain' and 'category' exactly as provided in the input.

  Example Output (Reference this style for ALL languages):
  {
    "expression": "under the weather",
    "domain": "conversation",
    "category": "daily",
    "meaning": {
      "ko": "몸이 좀 안 좋아",
      "ja": "体調が少し悪い",
      "es": "sentirse un poco mal"
    },
    "content": {
      "ko": {
        "situation": "🌟 아침에 일어났는데 왠지 모르게 몸이 축 처지고, 컨디션이 별로일 때! 😱 '아, 나 오늘 뭔가 좀 별론데... 병든 병아리 같아...' 할 때 쓰는 핵인싸 표현이에요! 진짜 아픈 건 아닌데 그렇다고 완전 쌩쌩하지도 않을 때, 가볍게 내 상태를 말하고 싶을 때 찰떡같이 쓸 수 있답니다! 🤒✨",
        "dialogue": [
          { "en": "Hey, you look a bit down. Are you okay?", "translation": "저기, 좀 기분이 안 좋아 보이는데. 괜찮아요?" },
          { "en": "I'm feeling a bit under the weather today, so I think I'll just head home early.", "translation": "오늘 몸이 좀 안 좋아서, 일찍 집에 가려고요." }
        ],
        "tip": "🚨 **꿀팁 방출!** 'under the weather'는 진짜 심각하게 아플 때보다는 가볍게 '컨디션이 안 좋다', '감기 기운이 있다' 정도의 느낌이에요. 😷 만약 진짜 심하게 아프다면 'I'm sick' 또는 'I have a fever'처럼 구체적으로 말하는 게 좋아요. 😉 그리고 이 표현은 뱃사람들이 배에서 날씨가 안 좋을 때 아픈 사람을 갑판 아래로 보내 '날씨 아래'에 있게 했다는 유래가 있대요! 완전 신기하죠? ⚓️🌊",
        "quiz": {
          "question": "다음 중 'I'm feeling a bit under the weather.'와 가장 비슷한 상황은?\n\nA. 🥳 파티에서 신나게 춤추고 있다.\nB. 😴 침대에서 밍기적거리며 몸이 좀 으슬으슬하다.\nC. 🏋️‍♀️ 헬스장에서 역기를 들고 운동하고 있다.",
          "answer": "B"
        }
      },
      "ja": {
        "situation": "朝起きた時に、なんとなく体がだるくて「今日はなんだか調子が悪いな…」と感じる時にぴったりの表現です！😷 本当にひどい病気ではないけれど、100%元気でもない時に、自分の状態をカジュアルに伝えることができます。✨",
        "dialogue": [
          { "en": "Hey, you look a bit down. Are you okay?", "translation": "ねえ、なんだか元気がないみたいだけど大丈夫？" },
          { "en": "I'm feeling a bit under the weather today.", "translation": "今日はちょっと体調が悪くて。" }
        ],
        "tip": "💡 **豆知識!** この表現は、昔の船乗りが天候が悪くて体調を崩した時に、甲板の下（Under the deck）に避難したことから「Under the weather」になったという説があります。⚓️ 本当に体調が悪い時は「I'm sick」を使いましょう！",
        "quiz": { "question": "体調が少し悪い時に使う表現は？", "answer": "under the weather" }
      },
      "es": {
        "situation": "¡Cuando te despiertas y te sientes un poco cansado o sin energía! 😱 Es una expresión muy común para decir que no te sientes al 100%, pero tampoco estás gravemente enfermo. 🤒✨",
        "dialogue": [
          { "en": "Hey, you look a bit down. Are you okay?", "translation": "Oye, te ves un poco desanimado. ¿Estás bien?" },
          { "en": "I'm feeling a bit under the weather today.", "translation": "Hoy me siento un poco mal." }
        ],
        "tip": "🚨 **¡Dato curioso!** El origen viene de los marineros. Cuando el clima era malo y se sentían mal, bajaban debajo de la cubierta para estar 'bajo el clima'. 🌊⚓️ Si estás realmente enfermo, es mejor usar 'I'm sick'.",
        "quiz": { "question": "¿Qué dices cuando no te sientes bien pero no es grave?", "answer": "under the weather" }
      }
    },
    "tags": ["daily", "health", "lifestyle"]
  }
  ```

### 6단계: JSON Parsing (문자열 -> JSON 변환)

Gemini가 JSON을 문자열(`text`)로 반환할 경우를 대비하여 **Code** 노드를 추가합니다.
`Gemini Content Generator`와 `Supabase Insert` 사이에 연결하세요.

- **Name**: `Parse JSON`
- **Code**:

  ````javascript
  // Gemini의 응답에서 JSON 문자열 부분만 추출하여 파싱합니다.
  const rawText = $input.first().json.text;
  // 마크다운 코드 블록(```json ... ```) 제거
  const cleanJson = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return {
      json: JSON.parse(cleanJson),
    };
  } catch (error) {
    return {
      json: {
        error: "JSON Parsing Failed",
        raw: rawText,
      },
    };
  }
  ````

### 7단계: Supabase Insert 설정

`Parse JSON` 노드 뒤에 **Supabase** 노드를 연결하여 최종 데이터를 저장합니다.

- **Name**: `Supabase Insert`
- **Schema**: `daily_english`
- **Resource**: `Row`
- **Operation**: `Create`
- **Table Name or ID**: `expressions`
- **Data to Send**: `Auto-Map Input Data to Columns`
- **Mapping**: `expression`, `domain`, `category`, `meaning`, `content`, `tags` 등 모든 컬럼이 `Parse JSON`의 출력값과 자동으로 매핑됩니다.

---

## ✅ 완료 확인

1.  **Execute Workflow**를 실행합니다.
2.  `Pick Category`가 랜덤한 주제를 뽑고, Gemini가 그에 맞는 표현을 생성하는지 확인합니다.
3.  이미 DB에 있는 표현이라면 `If New`에서 False로 빠지는지 확인합니다.
