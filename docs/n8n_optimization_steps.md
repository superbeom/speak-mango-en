# n8n Optimization Guide: AI-Driven Generation & Duplicate Check

이 문서는 외부 블로그 스크래핑 방식에서 벗어나, **AI가 스스로 카테고리별 유용한 표현을 선정하고 생성하는 방식**으로 전환하는 가이드입니다. 이 구조는 외부 의존성을 제거하여 워크플로우의 안정성을 극대화합니다.

## 🏗️ 목표 구조 (Target Architecture)

1.  **Schedule Trigger** (매일 9시 실행)
2.  **Code Node** (카테고리 랜덤 선택 - Business, Travel, Native Slang 등)
3.  **Gemini (Expression Generator)** (선택된 카테고리에 맞는 표현 1개 생성)
4.  **Supabase (Check Duplicate)** (DB 중복 확인)
5.  **If Node** (중복 여부 판단)
6.  **Gemini (Content Generator)** (상세 콘텐츠 생성 - 중복이 아닐 때만 실행)
7.  **Supabase (Insert)** (저장)

---

## 🛠️ 단계별 설정 가이드 (Step-by-Step)

### 1단계: 기존 HTTP Request 제거 및 Code 노드 추가

1.  기존의 `HTTP Request` 노드를 삭제합니다.
2.  **Code** 노드를 추가하고 이름을 `Pick Category`로 설정합니다.
3.  다음 코드를 입력하여 실행 때마다 카테고리를 랜덤하게 하나 뽑도록 합니다.

    ```javascript
    const categories = [
      "미국 원어민이 매일 쓰는 생활 표현",
      "비즈니스 미팅에서 꼭 필요한 영어 표현",
      "여행지에서 유용한 필수 영어 표현",
      "미드나 영화에 자주 나오는 트렌디한 표현",
      "감정을 표현하는 섬세한 영어 단어",
      "자주 틀리는 콩글리시 교정"
    ];

    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    return {
      json: {
        category: randomCategory
      }
    };
    ```

### 2단계: Gemini Expression Generator 설정 (표현 생성)

`Pick Category` 노드 뒤에 **Google Gemini Chat Model** 노드를 연결합니다.

-   **Name**: `Gemini Expression Generator`
-   **Prompt**:
    ```text
    Role: Professional English Teacher
    Task: Suggest ONE useful English expression related to the category below.

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

-   **Name**: `Check Duplicate`
-   **Operation**: `Get All`
-   **Table**: `expressions`
-   **Return All**: `True`
-   **Limit**: `1`
-   **Filters**:
    -   **Column**: `expression`
    -   **Operator**: `Equal`
    -   **Value**: `{{ $('Gemini Expression Generator').item.json.expression }}`

### 4단계: If 노드 추가 (조건 분기)

`Check Duplicate` 뒤에 **If** 노드를 추가합니다.

-   **Name**: `If New`
-   **Conditions**:
    -   Number: `{{ $items('Check Duplicate').length }}` **Equal** `0`
    -   (데이터가 없으면 0이므로 새로운 표현임)

### 5단계: Gemini Content Generator 설정 (상세 내용 생성)

`If New` 노드의 **True** (위쪽) 출력에 새로운 **Google Gemini Chat Model** 노드를 연결합니다.

-   **Name**: `Gemini Content Generator`
-   **Prompt**:
    ```text
    Role: Professional English Content Creator.
    Task: Create a detailed study card for the following English expression.

    Expression: {{ $('Gemini Expression Generator').item.json.expression }}
    Meaning: {{ $('Gemini Expression Generator').item.json.meaning }}
    Category: {{ $('Pick Category').item.json.category }}

    Output format (JSON):
    {
      "expression": "...",
      "meaning": "...",
      "content": "Make it roughly 300 characters long in Korean. Include nuances, origin(if any), and situational usage tips.",
      "tags": ["tag1", "tag2", "Category Name"],
      "example_conversation": "A: ...\nB: ..."
    }
    ```

### 6단계: Supabase Insert 설정

`Gemini Content Generator` 뒤에 **Supabase** 노드를 연결하여 최종 데이터를 저장합니다.

-   **Operation**: `Create`
-   **Table**: `expressions`
-   **Columns to Ignore**: `id`, `created_at` (DB 자동 생성)
-   **Mapping**: `Gemini Content Generator`의 JSON 출력값을 각 컬럼에 매핑합니다.

---

## ✅ 완료 확인

1.  **Execute Workflow**를 실행합니다.
2.  `Pick Category`가 랜덤한 주제를 뽑고, Gemini가 그에 맞는 표현을 생성하는지 확인합니다.
3.  이미 DB에 있는 표현이라면 `If New`에서 False로 빠지는지 확인합니다.