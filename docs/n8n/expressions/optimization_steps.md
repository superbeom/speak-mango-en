# n8n Optimization Guide: AI-Driven Generation & TTS Integration

이 문서는 외부 블로그 스크래핑 방식에서 벗어나, **AI가 스스로 카테고리별 유용한 표현을 선정하고 생성하며, 원어민 음성(TTS)까지 자동으로 합성하는 방식**으로 전환하는 가이드입니다. 이 구조는 외부 의존성을 제거하여 워크플로우의 안정성을 극대화하고 학습 경험을 고도화합니다.

## 🏗️ 목표 구조 (Target Architecture)

1.  **Schedule Trigger** (매일 9시 실행)
2.  **Pick Category** (카테고리 랜덤 선택 - Business, Travel, Native Slang 등)
3.  **Get Existing Expressions (Supabase)** (선택된 카테고리의 기존 표현 조회)
4.  **Gemini Expression Generator** (기존 표현을 제외하고 새로운 표현 1개 생성)
5.  **Parse Expression JSON** (Gemini 응답을 순수 JSON 객체로 변환)
6.  **Check Duplicate (Supabase)** (DB 중복 확인 - 안전장치)
7.  **If New** (중복 여부 판단)
8.  **Gemini Content Generator** (상세 콘텐츠 생성 - Role A/B 포함)
9.  **Parse Content JSON** (Gemini 응답을 순수 JSON 객체로 변환)
10. **Generate ID (Code)** (저장 경로용 UUID 미리 생성)
11. **Prepare TTS Requests (Code)** (대화문 분리 및 목소리 할당)
12. **Groq Orpheus TTS (HTTP)** (음성 합성 호출)
13. **Upload to Storage (Supabase)** (오디오 파일 업로드)
14. **Aggregate TTS Results (Code)** (오디오 경로를 데이터에 병합)
15. **Supabase Insert** (데이터 저장)

---

## 🛠️ 단계별 설정 가이드 (Step-by-Step)

### 1단계: Schedule Trigger 설정

워크플로우의 시작점입니다. **Schedule Trigger** 노드를 추가합니다.

- **Trigger Interval**: `Custom (Cron)`
- **Expression**: `0 9 * * *`

### 2단계: Pick Category

1.  **Code** 노드를 추가하고 이름을 `Pick Category`로 설정합니다.
2.  다음 코드를 입력하여 실행 때마다 카테고리를 랜덤하게 하나 뽑도록 합니다.

    - **주의**: 여기서 사용하는 `category` 값은 웹 앱의 `lib/constants.ts`에 정의된 `CATEGORIES`와 일치해야 필터링이 정상적으로 작동합니다.

    - **Domain**: 대분류 (conversation, test, vocabulary 등)
    - **Category**: 소분류 (daily, business, travel, shopping 등)
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

### 3단계: Get Existing Expressions (중복 방지용 조회)

`Pick Category` 뒤에 **Supabase** 노드를 추가하여, 해당 카테고리에 이미 존재하는 표현들을 미리 가져옵니다. 이를 AI에게 전달하여 중복 생성을 원천 차단합니다.

- **Name**: `Get Existing Expressions`
- **Schema**: `speak_mango_en`
- **Operation**: `Get Many`
- **Table Name or ID**: `expressions`
- **Return All**: `True`
- **Filters**:
  - **Filter**: `Build Manually`
  - **Must Match**: `All Filters`
  - **Field Name or ID**: `category - (string)`
  - **Condition**: `Equal`
  - **Field Value**: `{{ $('Pick Category').item.json.category }}`

### 4단계: Gemini Expression Generator (표현 생성)

`Get Existing Expressions` 노드 뒤에 **Google Gemini Chat Model** 노드를 연결합니다.

- **Name**: `Gemini Expression Generator`
- **Settings**: `Execute Once` 토글을 **On**으로 켜주세요. (매우 중요! 입력 데이터가 여러 개라도 AI는 한 번만 실행되어야 합니다.)
- **Prompt**:

  ```text
  Role: Professional English Teacher
  Task: Suggest ONE useful English expression related to the category below.

  Domain: {{ $('Pick Category').first().json.domain }}
  Category: {{ $('Pick Category').first().json.category }}

  # EXCLUDED EXPRESSIONS (Do NOT generate these):
  {{ $items("Get Existing Expressions").map(item => item.json.expression).join(", ") }}

  Requirements:
  1. The expression must be practical and widely used.
  2. **Do NOT use any expression listed in the 'EXCLUDED EXPRESSIONS' list.**
  3. Capitalization for 'expression':
     - Start with an UPPERCASE letter for standalone sentences (e.g., "Don't take it personally", "No cap").
     - Start with a lowercase letter for general phrases or idioms (e.g., "spill the tea", "hit the road").
  4. Punctuation for 'expression': Do NOT include trailing periods (.) or commas (,). Exclamation marks (!) and question marks (?) are allowed.
  5. For the 'meaning' field:
     - Provide a concise definition in a casual tone (반말).
     - If there are multiple meanings, separate them with ' · ' (middle dot).
     - Do NOT end with a period (.).
  6. Output MUST be a clean JSON object.

  Output Format (JSON):
  {
    "expression": "Hold your horses",
    "meaning": "잠깐 기다려 · 진정해"
  }
  ```

  > **💡 팁**: `# EXCLUDED EXPRESSIONS` 아래의 `{{ ... }}` 코드는 n8n의 Expression 기능입니다. 별도의 Code Node 없이도, 이전 노드(`Get Existing Expressions`)에서 가져온 수많은 데이터 중 `expression` 필드만 추출하여 쉼표로 연결된 문자열로 변환해 줍니다. Gemini에게는 제외해야 할 표현 목록만 깔끔하게 전달됩니다.

### 5단계: Parse Expression JSON

Gemini가 생성한 표현 데이터가 문자열 형태(Markdown Code Block 등)로 반환될 수 있으므로, 이를 순수 JSON 객체로 변환하는 과정이 반드시 필요합니다.

`Gemini Expression Generator` 뒤에 **Code** 노드를 추가하고 연결합니다.

- **Name**: `Parse Expression JSON`
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

### 6단계: Supabase 중복 체크 노드 추가

`Parse Expression JSON` 노드 뒤에 **Supabase** 노드를 추가합니다. (AI가 제외 목록을 무시했을 경우를 대비한 2차 안전장치입니다.)

- **Name**: `Check Duplicate`
- **Schema**: `speak_mango_en`
- **Operation**: `Get Many`
- **Table Name or ID**: `expressions`
- **Return All**: `False`
- **Limit**: `1`
- **Always Output Data**: `On` (중요: 중복된 데이터가 없을 때도 빈 객체를 반환하여 워크플로우가 멈추지 않게 해야 합니다.)
- **Filters**:
  - **Filter**: `Build Manually`
  - **Must Match**: `Any Filter`
  - **Field Name or ID**: `expression - (string)`
  - **Condition**: `ILIKE operator`
  - **Field Value**: `*{{ $('Parse Expression JSON').item.json.expression }}*`
  - _(참고: 'Equal' 대신 'Like'를 사용하여 "touch base"가 생성될 때 기존의 "Let's touch base"도 중복으로 감지하도록 함)_

### 7단계: If 노드 추가 (조건 분기)

`Check Duplicate` 뒤에 **If** 노드를 추가합니다.

- **Name**: `If New`
- **Conditions**: `{{ $('Check Duplicate').first().json.expression }}`
- **String**: `is empty`
  - (데이터가 없으면 'is empty'이므로 새로운 표현임)

### 8단계: Gemini Content Generator (상세 내용 생성)

`If New` 노드의 **True** 출력에 새로운 **Google Gemini Chat Model** 노드를 연결합니다.

- **Name**: `Gemini Content Generator`
- **Prompt (Define below)**:

  ```text
  Role: Professional English Content Creator & Polyglot Teacher.
  Task: Create a detailed study card for the following English expression in these languages: **English (en), Korean (ko), Japanese (ja), Spanish (es), French (fr), German (de), Russian (ru), Chinese (zh), and Arabic (ar)**.

  Expression: {{ $('Parse Expression JSON').item.json.expression }}
  Domain: {{ $('Pick Category').first().json.domain }}
  Category: {{ $('Pick Category').first().json.category }}

  Requirements:
  1. Tone: Friendly, humorous, and engaging (target audience: 20-30s), BUT **MUST use polite language consistently** for explanations.
      - **English**: Use **Standard English** (Friendly, conversational, yet educational).
      - **Korean**: Use **존댓말 (Jondaetmal)**.
      - **Japanese**: Use **Desu-Masu Form (丁寧語)**.
      - **Spanish**: Use **'Tú' form** but keep it respectful and professional.
      - **French**: Use **'Tu' form** for engagement but maintain a polite, helpful tone (or 'Vous' if context demands strict formality, but 'Tu' is preferred for 20-30s friendly content).
      - **German**: Use **'Du' form** (friendly, for 20-30s audience).
      - **Russian**: Use **'Вы' (Polite)** for general explanations to maintain authority, or **'ты'** if very casual. (Stick to **Friendly 'Вы'** or respectful **'ты'**). Let's use **Friendly 'Ты'** for this target audience (20-30s blog style).
      - **Chinese**: Use **Polite yet friendly (你 + 敬语/Polite particles)**.
      - **Arabic**: Use **Modern Standard Arabic (MSA)** but with a friendly, accessible tone (avoid overly archaic vocabulary).
  2. For the 'meaning' field in ALL languages:
     - **Tone**: Use a **casual tone** by default.
       - **Korean**: Use **반말 (Banmal)**.
       - **Japanese**: Use **Plain Form (Tameguchi/タメ口)**.
       - **Spanish**: Use **Informal 'Tú' form**.
       - **French**: Use **Informal 'Tu' form**.
       - **German**: Use **Informal 'Du' form**.
       - **Russian**: Use **Informal 'ты' form**.
       - **Chinese**: Use **Casual speech**.
       - **Arabic**: Use **MSA** (simplified).
     - **EXCEPTION**: If the English expression is formal or typically used in a polite situation (e.g., "Could I...", "May I..."), use a **polite tone** in all languages.
       - **Korean**: 존댓말 (Jondaetmal).
       - **Japanese**: Desu-Masu Form (丁寧語).
       - **Spanish**: Formal 'Usted' form.
       - **French**: Formal 'Vous' form.
       - **German**: Formal 'Sie' form.
       - **Russian**: Formal 'Вы' form.
       - **Chinese**: Polite speech (using '您' instead of '你').
       - **Arabic**: Formal MSA (Fusha).
     - For English (en) meaning: Provide a simple, clear definition or synonym in English.
     - **Punctuation**: If the English expression is a question (?), the meaning MUST also end with a question mark (?) or be phrased as a question. Do NOT use trailing periods (.) for statements.
     - If there are multiple meanings, separate them with ' · ' (middle dot).
  3. Formatting for 'expression':
     - **Capitalization**: **Start with an UPPERCASE letter** if the expression is a standalone sentence or interjection (e.g., "No worries", "Never mind", "Don't take it personally"). **Start with a lowercase letter** ONLY if it is a phrase or idiom used within a sentence (e.g., "spill the tea", "hit the road").
     - Punctuation: Do NOT include trailing periods (.) or commas (,). Exclamation marks (!) and question marks (?) are allowed.
  4. Constraint for content:
     - **NEVER use casual speech** in the explanation, tips, dialogue, or situation description (except for the 'meaning' field).
       - **English**: Avoid text-speak (e.g., "u", "r") or excessive slang in explanations; keep it clear and accessible.
       - **Korean**: No 반말 (Banmal).
       - **Japanese**: No Plain Form (Tameguchi).
       - **Spanish/French/German/Russian**: Maintain a helpful, teacher-like tone (avoid overly colloquial slang in the explanation text itself).
     - Do NOT mix polite and casual styles. Keep the tone consistent throughout.
     - Do NOT address the reader as specific groups like "Kids" or "Students". Use a general, relatable tone suitable for young adults.
  5. Output MUST be a valid JSON object matching the schema below.
  6. 'meaning' and 'content' fields must contain keys for **en, ko, ja, es, fr, de, ru, zh, ar**.
  7. **Dialogue & Roles (CRITICAL)**:
     - The `dialogue` field is a **TOP-LEVEL array** (sibling to `meaning` and `content`), NOT inside `content`.
     - Create a **coherent, natural conversation** between two people (A and B).
     - **The dialogue MUST consist of 2 or 3 turns (A -> B or A -> B -> A).**
     - Ensure natural interaction where either speaker can use the target expression in a meaningful context (not limited to a Q&A pattern).
     - Each entry in the `dialogue` array MUST include:
       - `"role"`: Value "A" or "B" to distinguish speakers.
       - `"en"`: The English sentence.
       - `"translations"`: **CRITICAL** An object containing translations for **ALL 8 target languages**: `"ko"`, `"ja"`, `"es"`, `"fr"`, `"de"`, `"ru"`, `"zh"`, `"ar"`.
       *   **Do NOT omit this object or any languages.**
       *   **Target Language ONLY**: The value MUST contain ONLY the translated text in the target language.
       *   **No Mixed Language (CRITICAL)**: **NEVER** include the original English text or the English expression in the translation. (e.g., **Bad**: "안녕하세요. Hello.", **Good**: "안녕하세요")
  8. **Consistency**: Use the 'Example (Korean)' below as a reference for the depth, humor, and style. Apply the same quality to English, Japanese, Spanish, French, German, Russian, Chinese, and Arabic.
  9. **Fixed Fields**: Include the 'domain' and 'category' exactly as provided in the input.
  10. **Quiz Logic (CRITICAL)**:
      - The quiz must test the understanding of the English expression.
      - **Randomly select one of the following patterns**:
        - **Pattern 1 (Situation -> English)**: Describe a situation in [Target Language] and ask "Which English expression fits this situation?". -> The options (A, B, C) MUST be **English expressions**.
          *   *Example (Target Language: ko)*: Q: "친구가 \"이번 주말에 영화 볼까요?\"라고 제안했을 때, 긍정적으로 동의하는 가장 자연스러운 영어 표현은?\n\nA. Sounds bad\nB. Sounds good\nC. Sounds angry"
        - **Pattern 2 (Expression -> Situation)**: Show the expression and ask "When would you use this?" in [Target Language]. -> The options (A, B, C) MUST be **situations described in [Target Language]**.
          *   *Example (Target Language: ko)*: Q: "다음 중 'What's up?'을 가장 자연스럽게 사용할 수 있는 상황은?\n\nA. 💰 은행에서 대출 상담을 받고 있다.\nB. 🚀 회사 중역 회의에서 발표를 시작한다.\nC. 🚶‍♀️ 길을 걷다가 친구와 눈이 마주쳤다."
        - **Pattern 3 (Negative Logic)**: Ask "Which situation is **NOT** appropriate for this expression?" in [Target Language]. -> The options (A, B, C) MUST be **situations described in [Target Language]**.
          *   *Example (Target Language: ko)*: Q: "다음 중 'Let's touch base.'의 사용이 적절하지 않은 상황은?\n\nA. 🙋‍♀️ 팀원과 주간 보고서에 대해 짧게 이야기할 때.\nB. 🥳 친구들과 주말에 놀러 갈 계획을 세울 때.\nC. 🧑‍💻 고객과 다음 단계 논의를 위해 연락할 때."
      - **Strict Formatting & Validation Rules**:
        1. **These rules apply to ALL languages (en, ko, ja, es, fr, de, ru, zh, ar).**
        2. You **MUST** provide 3 distinct options labeled A, B, and C.
        3. You **MUST** use `\n` (newline) to separate the question and each option.
        4. The 'answer' field MUST be **only the uppercase letter** (e.g., "A", "B", "C"). **NEVER** include the full text of the answer.
        5. **Randomize the correct answer position**: The correct answer MUST be randomly assigned to A, B, or C. Do NOT default to 'B'. ensure equal distribution of A, B, and C across different generations.
  11. **Tags (MANDATORY)**: Include a `"tags"` field containing an array of 3 to 5 lowercase strings. These tags should be relevant keywords that help categorize the expression (e.g., "idiom", "office", "slang", "travel"). Do NOT include the '#' symbol.
  12. **Currency & Numbers**:
      - Always use **`$` (USD)** for currency to maintain consistency (e.g., "$10", "$50.50"). Do not use other currencies like 'won', 'yen', or 'euro' unless the expression specifically requires it.
      - Use commas for numbers larger than 1,000 (e.g., "1,000", "10,000").

  Example Output (Reference this style for ALL languages):
  {
    "expression": "under the weather",
    "domain": "conversation",
    "category": "daily",
    "meaning": {
      "en": "not feeling well · feeling sick",
      "ko": "몸이 좀 안 좋아 · 컨디션이 별로야",
      "ja": "体調が少し悪い · 気分がすぐれない",
      "es": "sentirse un poco mal · no estar al cien",
      "fr": "se sentir mal · être patraque",
      "de": "sich nicht gut fühlen · angeschlagen sein",
      "ru": "неважно себя чувствовать · приболеть",
      "zh": "身体不舒服 · 感觉不太好",
      "ar": "لست على ما يرام · أشعر بالمرض"
    },
    "content": {
      "en": {
        "situation": "This is perfect for those days when you wake up feeling a bit sluggish or off. 😱 It's a great expression to say you're not 100%, but not seriously ill either! 🤒✨",
        "tip": "💡 **Fun Fact!** This idiom is said to come from sailors who would go below deck (under the weather rail) when they felt seasick during bad weather! ⚓️🌊 Remember, if you are genuinely sick, it's better to say 'I'm sick' or 'I have a fever'.",
        "quiz": {
          "question": "When is the most appropriate time to use 'under the weather'?\n\nA. 🥳 When you are dancing happily at a party.\nB. 😴 When you are lying in bed feeling a bit chilly and off.\nC. 🏋️‍♀️ When you are lifting weights energetically at the gym.",
          "answer": "B"
        }
      },
      "ko": {
        "situation": "🌟 아침에 일어났는데 왠지 모르게 몸이 축 처지고, 컨디션이 별로일 때! 😱 '아, 나 오늘 뭔가 좀 별론데... 병든 병아리 같아...' 할 때 쓰는 핵인싸 표현이에요! 진짜 아픈 건 아닌데 그렇다고 완전 쌩쌩하지도 않을 때, 가볍게 내 상태를 말하고 싶을 때 찰떡같이 쓸 수 있답니다! 🤒✨",
        "tip": "🚨 **꿀팁 방출!** 'under the weather'는 진짜 심각하게 아플 때보다는 가볍게 '컨디션이 안 좋다', '감기 기운이 있다' 정도의 느낌이에요. 😷 만약 진짜 심하게 아프다면 'I'm sick' 또는 'I have a fever'처럼 구체적으로 말하는 게 좋아요. 😉 그리고 이 표현은 뱃사람들이 배에서 날씨가 안 좋을 때 아픈 사람을 갑판 아래로 보내 '날씨 아래'에 있게 했다는 유래가 있대요! 완전 신기하죠? ⚓️🌊",
        "quiz": {
          "question": "다음 중 'under the weather'를 사용하기 가장 적절한 상황은?\n\nA. 🥳 파티에서 신나게 춤추고 있다.\nB. 😴 침대에서 밍기적거리며 몸이 좀 으슬으슬하다.\nC. 🏋️‍♀️ 헬스장에서 역기를 들고 운동하고 있다.",
          "answer": "B"
        }
      },
      "ja": {
        "situation": "朝起きた時に、なんとなく体がだるくて「今日はなんだか調子が悪いな…」と感じる時にぴったりの表現です！😷 本当にひどい病気ではないけれど、100%元気でもない時に、自分の状態をカジュアルに伝えることができます。✨",
        "tip": "💡 **豆知識!** この表現は、昔の船乗りが天候が悪くて体調を崩した時に、甲板の下（Under the deck）に避難したことから「Under the weather」になったという説があります。⚓️ 本当に体調が悪い時は「I'm sick」を使いましょう！",
        "quiz": {
          "question": "「under the weather」を使うのに最も適した状況は？\n\nA. 🥳 パーティーで楽しく踊っている。\nB. 😴 風邪気味で、ベッドで休んでいる。\nC. 🏋️‍♀️ ジムで元気にトレーニングしている。",
          "answer": "B"
        }
      },
      "es": {
        "situation": "¡Cuando te despiertas y te sientes un poco cansado o sin energía! 😱 Es una expresión muy común para decir que no te sientes al 100%, pero tampoco estás gravemente enfermo. 🤒✨",
        "tip": "🚨 **¡Dato curioso!** El origen viene de los marineros. Cuando el clima era malo y se sentían mal, bajaban debajo de la cubierta para estar 'bajo el clima'. 🌊⚓️ Si estás realmente enfermo, es mejor usar 'I'm sick'.",
        "quiz": {
          "question": "¿En qué situación usarías \"under the weather\"?\n\nA. 🥳 En una fiesta bailando alegremente.\nB. 😴 Descansando en la cama porque te sientes un poco mal.\nC. 🏋️‍♀️ Entrenando con mucha energía en el gimnasio.",
          "answer": "B"
        }
      },
      "fr": {
        "situation": "C'est parfait pour les jours où vous vous réveillez un peu mou. 😱 C'est une super expression pour dire que vous n'êtes pas à 100%, sans être gravement malade ! 🤒✨",
        "tip": "💡 **Le saviez-vous ?** Cette expression viendrait des marins qui descendaient sous le pont pour s'abriter du mauvais temps quand ils avaient le mal de mer ! ⚓️🌊",
        "quiz": {
          "question": "Quand est-il le plus approprié d'utiliser 'under the weather' ?\n\nA. 🥳 Quand vous dansez joyeusement à une fête.\nB. 😴 Quand vous êtes au lit et que vous vous sentez un peu fébrile.\nC. 🏋️‍♀️ Quand vous soulevez des poids énergiquement à la salle de sport.",
          "answer": "B"
        }
      },
      "de": {
        "situation": "Perfekt für Tage, an denen man aufwacht und sich einfach schlapp fühlt. 😱 Ein toller Ausdruck, um zu sagen, dass man nicht 100% fit ist, aber auch nicht ernsthaft krank! 🤒✨",
        "tip": "💡 **Schon gewusst?** Diese Redewendung stammt angeblich von Seeleuten, die bei schlechtem Wetter unter Deck gingen, wenn sie seekrank waren! ⚓️🌊",
        "quiz": {
          "question": "Wann ist der beste Zeitpunkt, 'under the weather' zu verwenden?\n\nA. 🥳 Wenn du fröhlich auf einer Party tanzt.\nB. 😴 Wenn du im Bett liegst und dich etwas kränklich fühlst.\nC. 🏋️‍♀️ Wenn du im Fitnessstudio energiegeladen Gewichte hebst.",
          "answer": "B"
        }
      },
      "ru": {
        "situation": "Это идеально подходит для тех дней, когда вы просыпаетесь с чувством вялости. 😱 Отличное выражение, чтобы сказать, что вы не на 100% в форме, но и не серьезно больны! 🤒✨",
        "tip": "💡 **Интересный факт!** Говорят, что эта идиома пошла от моряков, которые спускались под палубу (under the weather rail), когда их укачивало во время шторма! ⚓️🌊",
        "quiz": {
          "question": "Когда уместнее всего использовать 'under the weather'?\n\nA. 🥳 Когда вы радостно танцуете на вечеринке.\nB. 😴 Когда вы лежите в кровати и чувствуете легкое недомогание.\nC. 🏋️‍♀️ Когда вы энергично поднимаете тяжести в спортзале.",
          "answer": "B"
        }
      },
      "zh": {
        "situation": "当你早上醒来感觉有点没精神或者不舒服的时候，用这个词再合适不过了！😱 这是一个很好的表达，用来形容你状态不是100%好，但也没生什么大病！🤒✨",
        "tip": "💡 **冷知识！** 据说这句习语源于水手，当遇到恶劣天气感到晕船时，他们会躲到甲板下面（under the weather rail）！⚓️🌊",
        "quiz": {
          "question": "什么时候最适合使用 'under the weather'？\n\nA. 🥳 当你在派对上开心地跳舞时。\nB. 😴 当你躺在床上感觉有点发冷不舒服时。\nC. 🏋️‍♀️ 当你在健身房精力充沛地举重时。",
          "answer": "B"
        }
      },
      "ar": {
        "situation": "هذا التعبير مثالي للأيام التي تستيقظ فيها وأنت تشعر ببعض الخمول أو التعب. 😱 إنه تعبير رائع لتقول إنك لست في كامل لياقتك، لكنك لست مريضاً بشكل خطير أيضاً! 🤒✨",
        "tip": "💡 **حقيقة ممتعة!** يقال إن هذا المصطلح جاء من البحارة الذين كانوا ينزلون تحت سطح السفينة (تحت حاجز الطقس) عندما يشعرون بدوار البحر أثناء الطقس السيئ! ⚓️🌊",
        "quiz": {
          "question": "متى يكون الوقت الأنسب لاستخدام عبارة 'under the weather'؟\n\nA. 🥳 عندما ترقص بسعادة في حفلة.\nB. 😴 عندما تكون مستلقياً في السرير وتشعر ببعض البرودة والتوعك.\nC. 🏋️‍♀️ عندما ترفع الأثقال بنشاط في صالة الألعاب الرياضية.",
          "answer": "B"
        }
      }
    },
    "dialogue": [
      {
        "role": "A",
        "en": "Hey, you look a bit down. Are you okay?",
        "translations": {
          "ko": "저기, 좀 기분이 안 좋아 보이는데. 괜찮아요?",
          "ja": "ねえ、なんだか元気がないみたいだけど大丈夫？",
          "es": "Oye, te ves un poco desanimado. ¿Estás bien?",
          "fr": "Hé, tu as l'air un peu déprimé. Ça va ?",
          "de": "Hey, du siehst ein bisschen niedergeschlagen aus. Alles okay?",
          "ru": "Эй, ты выглядишь немного подавленным. Ты в порядке?",
          "zh": "嘿，你看起来有点沮丧。你还好吗？",
          "ar": "مهلاً، تبدو محبطاً قليلاً. هل أنت بخير؟"
        }
      },
      {
        "role": "B",
        "en": "I'm feeling a bit under the weather today, so I think I'll just head home early.",
        "translations": {
          "ko": "오늘 몸이 좀 안 좋아서, 일찍 집에 가려고요.",
          "ja": "今日はちょっと体調が悪いので、早めに帰ろうと思います。",
          "es": "Hoy me siento un poco mal, así que creo que me iré a casa temprano.",
          "fr": "Je ne me sens pas très bien aujourd'hui, donc je pense que je vais rentrer plus tôt.",
          "de": "Ich fühle mich heute etwas angeschlagen, deshalb werde ich wohl früher nach Hause gehen.",
          "ru": "Я сегодня неважно себя чувствую, поэтому думаю пойти домой пораньше.",
          "zh": "我今天身体有点不舒服，想早点回家。",
          "ar": "أشعر بتوعك قليل اليوم، لذا سأعود إلى المنزل مبكراً."
        }
      }
    ],
    "tags": ["daily", "health", "lifestyle"]
  }
  ```

### 9단계: Parse Content JSON

Gemini가 JSON을 문자열(`text`)로 반환할 경우를 대비하여 **Code** 노드를 추가합니다.
`Gemini Content Generator`와 `Supabase Insert` 사이에 연결하세요.

- **Name**: `Parse Content JSON`
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

### 10단계: Generate ID (Code)

저장 경로 및 DB ID로 사용할 UUID를 여기서 생성해야 데이터가 덮어씌워지지 않습니다.

- **Name**: `Generate ID`
- **Code**:

  ```javascript
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );

  return { json: { ...$input.first().json, id: uuid } };
  ```

### 11단계: Prepare TTS Requests

대화문을 개별 오디오 요청으로 분리합니다.

```javascript
const items = $input.all();
let results = [];

items.forEach((item, itemIndex) => {
  const data = item.json;

  // top-level dialogue 추출
  const dialogueEntries = data.dialogue || [];
  const expressionId = data.id;

  dialogueEntries.forEach((entry, lineIndex) => {
    const rawText = entry.en || "";
    const role = (entry.role || "A").toUpperCase();

    // 텍스트 정제
    const cleanedText = rawText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    // 역할별 목소리 할당
    const voice = role === "B" ? "troy" : "hannah";

    results.push({
      json: {
        ...data, // 원본 데이터 유지
        tts_input: cleanedText.substring(0, 200),
        tts_voice: voice,
        tts_line_index: lineIndex,
        tts_model: "canopylabs/orpheus-v1-english",
        tts_format: "wav",
        tts_endpoint: "https://api.groq.com/openai/v1/audio/speech",
        // Storage 저장을 위한 경로 확정
        storage_path: `expressions/${expressionId}/${lineIndex}.wav`,
      },
      pairedItem: { item: itemIndex },
    });
  });
});

return results;
```

### 12단계: Groq Orpheus TTS (HTTP Request)

11단계에서 분리된 각 대화 문장을 실제 오디오 파일(WAV)로 변환하는 단계입니다.

- **Name**: `Groq Orpheus TTS`
- **Method**: `POST`
- **URL**: `https://api.groq.com/openai/v1/audio/speech`
- **Authentication**: `Header Auth` 선택
  - **Name**: `Authorization`
  - **Value**: `Bearer <YOUR_GROQ_API_KEY>`
- **Body Content Type**: `JSON`
- **Body Parameters**:
  - `model`: `canopylabs/orpheus-v1-english`
  - `input`: `{{ $json.tts_input }}`
  - `voice`: `{{ $json.tts_voice }}`
  - `response_format`: `wav`
- **Response Format**: `File` (중요: 응답을 바이너리 파일로 받아야 합니다.)

> **⚠️ 중요 (400 Bad Request 에러 발생 시)**: `canopylabs/orpheus-v1-english` 모델을 처음 사용하는 경우, 반드시 **[Groq Console](https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english)**에 접속하여 해당 모델의 이용 약관(Terms)을 **승인(Accept)**해야 합니다. 승인하지 않으면 API 호출 시 에러가 발생합니다.

### 13단계: Upload to Storage (Supabase REST API)

공식 Supabase 노드는 파일 업로드를 지원하지 않으므로, **HTTP Request** 노드를 사용하여 직접 업로드합니다.

- **사전 작업**: Supabase Dashboard > Storage에서 **`speak-mango-en`**라는 이름의 Bucket을 미리 생성해야 합니다. (폴더는 자동으로 생성되므로 Bucket만 있으면 됩니다.)
- **Name**: `Upload to Storage`
- **Method**: `POST`
- **URL**: `https://<YOUR_PROJECT_REF>.supabase.co/storage/v1/object/speak-mango-en/{{ $json.storage_path }}`
  - (참고: `storage_path`에 `expressions/...`가 포함되어 있음)
- **Authentication**: `Generic Credential Type`
- **Generic Auth Type**: `Header Auth`
- **Header Auth**: `Supabase Header Auth`
  - `Name`: `Authorization`
  - `Value`: `Bearer <YOUR_SERVICE_ROLE_KEY>`
- **Send Body**: `Binary`
  - `Body Content Type`: `n8n Binary File`
  - `Input Data Field Name`: `data` (12단계 Groq TTS 노드에서 받은 바이너리 필드명)
- **Options**: `Response`
  - **Response Format**: `JSON`

### 14단계: Aggregate TTS Results (Code)

업로드된 오디오 파일들의 경로(`storage_path`)를 원본 데이터 구조의 각 대화문(`dialogue`) 항목에 다시 주입하고, 하나로 합칩니다.

- **Name**: `Aggregate TTS Results`
- **Code**:

  ```javascript
  // n8n Code Node: Aggregate TTS Results
  // 분리되었던 대화문 라인들을 다시 하나로 합치고 audio_url을 주입합니다.

  const items = $input.all();
  if (items.length === 0) return [];

  // 1. 원본 데이터 복원 (Prepare TTS Requests 노드의 결과 참조)
  const firstItem = items[0];
  const parentItemIndex = firstItem.pairedItem.item;
  const parentData = $items("Prepare TTS Requests")[parentItemIndex].json;

  // 원본 데이터 복제 (deep copy)
  let finalData = JSON.parse(JSON.stringify(parentData));

  // 2. 불필요한 임시 필드 일괄 제거 (tts_ 로 시작하는 모든 필드)
  Object.keys(finalData).forEach((key) => {
    if (key.startsWith("tts_") || key === "storage_path") {
      delete finalData[key];
    }
  });

  // 3. 오디오 URL 주입
  items.forEach((item) => {
    const pIdx = item.pairedItem.item;
    const originalReq = $items("Prepare TTS Requests")[pIdx].json;

    const idx = originalReq.tts_line_index;
    // Upload to Storage 결과(Key)에서 경로 추출
    let path = item.json.Key || originalReq.storage_path;

    // 버킷 명칭(speak-mango-en/)이 포함되어 있다면 제거하여 경로 정규화
    if (path.startsWith("speak-mango-en/")) {
      path = path.replace("speak-mango-en/", "");
    }

    // top-level dialogue에 audio_url 주입
    if (finalData.dialogue && finalData.dialogue[idx]) {
      finalData.dialogue[idx].audio_url = path;
    }
  });

  return [{ json: finalData }];
  ```
- **역할**: 분산된 여러 아이템을 다시 1개의 아이템으로 병합하여 최종 저장을 준비합니다.

### 15단계: Supabase Insert 설정

`Parse JSON` 노드 뒤에 **Supabase** 노드를 연결하여 최종 데이터를 저장합니다.

- **Name**: `Supabase Insert`
- **Schema**: `speak_mango_en`
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
4.  **Supabase Storage**에 `speak-mango-en` 버킷 생성 여부 확인.
5.  DB `expressions` 테이블의 `content` 내 `audio_url` 경로 정상 저장 확인.

---

## 🔄 Universal Backfill Strategy (Multi-Language Expansion)

기존 데이터에 새로운 언어(독일어, 프랑스어, 러시아어, 중국어, 아랍어)를 추가하거나, 전체 콘텐츠를 리뉴얼할 때 사용하는 **Universal Backfill System** 가이드입니다.

### 📂 폴더 구조 및 파일 (`n8n/expressions/backfill_universal/`)

1.  **`universal_backfill_workflow.json`**: 백필 전용 통합 워크플로우.
2.  **`universal_backfill_prompt.txt`**: **6개 국어**(`en`, `fr`, `de`, `ru`, `zh`, `ar`)를 생성합니다. (기존 `ko`, `ja`, `es`는 보존됨)
3.  **`supplementary_backfill_prompt.txt`**: 기존 언어(EN)는 유지하고 **추가 언어만** 생성하기 위한 프롬프트.
4.  **`universal_backfill_parse_code.js`**: Universal 모드용 병합 로직 (EN 업데이트 포함).
5.  **`supplementary_backfill_parse_code.js`**: Supplementary 모드용 병합 로직 (EN 보존).

### 🚀 사용 가이드

1.  **영어 및 신규 언어 추가 (Partial Update)**:
    - `universal_backfill_prompt.txt` 내용을 복사하여 Gemini 노드에 설정.
    - **주의**: `en` 및 신규 5개 국어(`fr`, `de`, `ru`, `zh`, `ar`)만 생성되며, 기존의 `ko`, `ja`, `es` 데이터는 보존됩니다.

2.  **새로운 언어만 추가하고 싶은 경우**:
    - `supplementary_backfill_prompt.txt` 내용을 복사하여 Gemini 노드에 설정.
    - **주의**: 영어(`en`) 필드는 생성되지 않으며, `Parse Content JSON` 단계에서 기존 데이터와 병합될 때 기존 영어 데이터가 보존됩니다.

3.  **데이터 병합 로직 (Javascript)**:
    - **Universal**: `universal_backfill_parse_code.js`를 `Parse Content JSON` 노드에 복사하여 사용하세요. (영어 갱신 + 신규 언어 추가)
    - **Supplementary**: `supplementary_backfill_parse_code.js`를 `Parse Content JSON` 노드에 복사하여 사용하세요. (영어 보존 + 신규 언어만 추가)
    - **공통 동작**: `meaning`, `content` 및 `dialogue`의 `translations` 객체를 타겟 언어에 맞춰 지능적으로 병합합니다.
