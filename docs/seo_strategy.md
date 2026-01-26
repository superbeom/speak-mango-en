# SEO Strategy & Implementation Guide

> 이 문서는 Speak Mango 프로젝트의 SEO 전략, 의사결정 과정, 그리고 기술적 구현 내용을 상세히 기록합니다.

## 1. Core Goal (핵심 목표)

사용자가 영어 표현을 검색할 때 주로 사용하는 **"구체적인 검색 의도(Search Intent)"**를 공략하여 유입을 늘리는 것입니다.

- **Target Keywords**: 단순 단어 검색보다는 "Long-tail Keywords" 타겟팅.
  - 예: "Feel Blue" (X) -> 경쟁이 매우 치열함.
  - 예: **"Feel Blue 뜻"**, **"Feel Blue 의미"**, **"우울하다 영어로"** (O) -> 사용자의 의도가 명확하고 전환율이 높음.

## 2. Key Strategies (주요 전략)

### 2.1 Dynamic Keyword Generation (동적 키워드 생성)

정적 키워드(`meta keywords`)만으로는 수천 개의 표현 페이지를 일일이 대응할 수 없습니다. 따라서 **Dictionary 기반의 접미사 조합(Suffix Combination)** 전략을 사용합니다.

- **Expression Suffixes**: 표현 중심 검색어
  - 패턴: `Expression` + `Suffix`
  - 예: "Hit the sack" + "Meaning" -> "Hit the sack Meaning"
- **Meaning Suffixes**: 의미 중심 검색어
  - 패턴: `Meaning` + `Suffix`
  - 예: "자러 가다" + "영어로" -> "자러 가다 영어로"
  - **Case Study ("Feel Blue")**:
    - "Feel Blue"라는 표현이 있을 때, 사용자는 단순히 "Feel Blue"라고 검색하기보다 **"Feel Blue 뜻"**, **"우울하다 영어로"**와 같이 구체적인 질문 형태로 검색합니다.
    - 이러한 "Long-tail Keyword"는 경쟁이 적고, 사용자의 학습 의도가 명확하므로 전환율이 더 높습니다.

### 2.2 Granular Meaning Splitting (의미 분리)

하나의 표현이 여러 가지 뉘앙스나 의미를 가질 때, 이를 `·` (Middle Dot)으로 구분하여 관리하고 있습니다. SEO 관점에서는 이들을 뭉뚱그리기보다 **개별적으로 분리하여 타겟팅**하는 것이 유리합니다.

- **Before**: "좋은 가격에 물건을 사다 · 저렴하게 득템하다" (하나의 문자열)
  - 생성 키워드: "좋은 가격에 물건을 사다 · 저렴하게 득템하다 영어로" (검색 확률 낮음)
- **After**: 의미를 분리하여 각각 생성
  1. "좋은 가격에 물건을 사다 영어로"
  2. "저렴하게 득템하다 영어로"

**구현 (`lib/seo.ts`)**:

```typescript
const meanings = meaning.split("·").map((m) => m.trim());
meanings.forEach((m) => {
  seo.meaningSuffixes.forEach((suffix) => keywords.push(`${m} ${suffix}`));
});
```

### 2.3 White Hat SEO (Visible Keywords)

Google 등 최신 검색 엔진은 `meta name="keywords"` 태그의 가중치를 거의 인정하지 않거나 무시하고 있습니다. 단순히 메타 태그에 키워드를 나열하는 것만으로는 충분하지 않습니다.

> [!WARNING] > **🛑 하지만 주의할 점이 있습니다! (Hidden Text & Cloaking)**
>
> 사용자에게는 숨기고(display: none, 같은 색상 텍스트 등) 봇에게만 키워드를 보여주는 방식(Hidden Text)은 구글의 스팸 정책(**Cloaking**) 위반으로 간주됩니다. 이는 오히려 검색 결과에서 아예 **제외(De-indexing)**되거나 심각한 **페널티**를 받을 수 있는 치명적인 위험이 있습니다.

✅ **더 안전하고 효과적인 제안 (White Hat SEO)**

우리는 **"Visible Keywords"** 전략을 채택했습니다. 생성된 고관여 키워드들을 페이지 하단에 **"Related Topics"** 섹션으로 사용하여 사용자에게 **"시각적으로 정당하게"** 노출합니다.

- **Method**: `KeywordList` 컴포넌트를 통해 태그 형태로 렌더링.
- **Benefits**:
  1. **User Experience**: 사용자에게 연관된 학습 주제나 뉘앙스를 한눈에 파악할 수 있는 유용한 정보를 제공합니다.
  2. **Keyword Density**: 자연스럽게 페이지 본문 내의 핵심 키워드 밀도를 높여 랭킹에 긍정적인 영향을 줍니다.
  3. **Compliance**: 구글의 웹마스터 가이드라인을 100% 준수하는 White Hat 방식입니다.

### 2.4 Localized Category Keywords (동적 키워드 현지화)

단순 번역을 넘어, 검색 의도(Intent)와 사용자 언어 맥락(Context)에 맞는 카테고리 키워드를 매핑합니다.

- **Problem**: 'Business English'라는 키워드는 영어권에서는 유효하지만, 한국어 사용자에게는 '비즈니스 영어'가 더 검색량이 많습니다. 또한 'Travel' 카테고리 페이지에 'Business English' 키워드가 하드코딩되어 있는 것은 부자연스럽습니다.
- **Strategy**:
  - `categories` 맵을 언어별로 정의하여 동적으로 매핑합니다.
  - 예: `travel` -> `여행 영어` (KO), `Travel English` (EN), `旅行英会話` (JA).
  - 이를 통해 검색 엔진에게 페이지의 **주제 적합성(Topical Relevance)**을 더 강력하게 전달합니다.

## 3. Technical Implementation (기술 구현)

### 3.1 Architecture

SEO 로직을 한곳에서 관리하고 재사용하기 위해 유틸리티 함수로 분리했습니다.

- **Configuration**: `i18n/locales/*.ts` (최상위 `seo` 객체 내 `suffixes`, `categories` 정의)
- **Logic**: `lib/seo.ts` (키워드 생성 및 분리 로직)
- **Metadata**: `app/expressions/[id]/page.tsx` (`generateMetadata`)
- **UI**: `app/expressions/[id]/page.tsx` (하단 `KeywordList`)

### 3.2 Workflow

1.  **Locale Config**: 각 언어별(`ko`, `en`, `ja`, etc.)로 적절한 `expressionSuffixes`와 `meaningSuffixes`를 정의합니다.
2.  **Generate**: `generateSeoKeywords` 함수가 호출되면:
    - 기본 키워드 로드
    - 표현 + 접미사 조합
    - 의미(· 분리) + 접미사 조합
    - 중복 제거
3.  **Apply**:
    - `<head>` 메타 태그에 주입 (봇용)
    - `<body>` 하단 목록에 렌더링 (사용자+봇용)

## 4. Q&A (Decision Logs)

**Q. 왜 메타 태그(`keywords`)만으로는 부족한가요?**
A. 구글은 2009년부터 메타 키워드 태그를 랭킹 요소로 사용하지 않는다고 공식 선언했습니다. 하지만 Bing, Yandex 등 다른 검색 엔진이나 일부 디렉토리 서비스에서는 여전히 참고할 수 있어 유지하되, 핵심 전략은 **"페이지 본문 콘텐츠(Visible Text)"**에 키워드를 포함시키는 것입니다.

**Q. 의미 분리(Splitting)가 왜 중요한가요?**
A. 사용자는 "저렴하게 득템하다 영어로" 라고 검색하지, "좋은 가격에 물건을 사다 · 저렴하게 득템하다 영어로" 라고 검색하지 않습니다. 검색 쿼리와 정확히 일치(Exact Match)하는 키워드를 생성하기 위해 분리가 필수적입니다.

**Q. Visible Keyword 섹션이 디자인을 해치지 않나요?**
A. 이를 위해 `KeywordList` 컴포넌트를 페이지 최하단에 배치하고, 은은한 스타일(회색조 태그)을 적용하여 본문 경험을 방해하지 않으면서 정보로서의 가치를 제공하도록 디자인했습니다.

## 5. Technical SEO Improvements

최근 Google Search Console 및 SEO 분석 도구에서 발견된 기술적 문제들을 해결하기 위해 다음과 같은 조치를 적용했습니다.

### 5.1 Crawling Control (크롤링 제어)

- **Issue**: 관리자 페이지(`(admin)/studio/[id]`)가 검색 엔진에 노출될 위험이 있음.
- **Solution**:
  1. **robots.txt**: `/studio`, `/admin` 경로를 명시적으로 `disallow` 처리.
  2. **Meta Tag**: Studio 페이지의 `generateMetadata`에서 `robots: { index: false, follow: false }`를 반환하여 인덱싱 원천 차단.

### 5.2 International SEO (다국어 SEO)

- **Issue**: "적절한 표준 태그가 포함된 대체 페이지" 오류 발생. 다국어 페이지 간의 관계가 명확하지 않음.
- **Solution**:
  - **Canonical Tag**: 모든 페이지에 자기 자신을 가리키는 `canonical` 태그 추가 (중복 콘텐츠 방지).
  - **Hreflang Tags**: `app/layout.tsx`에서 `SUPPORTED_LANGUAGES`를 기반으로 `alternates.languages`를 동적으로 생성.
    - 예: `<link rel="alternate" hreflang="ko-KR" href="/ko" />`
    - 이를 통해 검색 엔진이 사용자 언어에 맞는 적절한 페이지를 제공하도록 유도.
