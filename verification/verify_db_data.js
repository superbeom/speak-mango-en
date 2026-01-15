const fs = require("fs");
const path = require("path");

/**
 * Gemini 출력에 대한 엄격한 검증 로직 (Local CLI 버전)
 * n8n/expressions/code/10_validate_content.js의 로직과 동일합니다.
 *
 * 실행 방법:
 * node verification/verify_db_data.js
 * (루트 디렉토리의 temp.json을 읽어서 검증합니다)
 */

// ==========================================================================
//  헬퍼 함수 및 상수 (n8n 코드와 동일)
// ==========================================================================

const REGEX = {
  // 한글 (한국어): 음절, 자모, 호환 자모
  hangul: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/,
  // 가나 (일본어): 히라가나, 가타카나
  kana: /[\u3040-\u309F\u30A0-\u30FF]/,
  // 한자 (중국어/일본어): 통합 한자
  han: /[\u4E00-\u9FCC\u3400-\u4DB5]/,
  // 키릴 문자 (러시아어)
  cyrillic: /[\u0400-\u04FF]/,
  // 아랍어
  arabic: /[\u0600-\u06FF\u0750-\u077F]/,
  // 영어/라틴 문자 (누출 여부 엄격 검사)
  english_letters: /[a-zA-Z]/,
  // 마크다운 검사 (굵게/이탤릭 마커: **, *) - 쌍으로 사용되거나 시작/끝 확인
  markdown_emphasis: /(\*\*|__|\*|_)/,
};

const TARGET_LANGS = ["ko", "ja", "es", "fr", "de", "ru", "zh", "ar"];

// 휴리스틱: 소문자로 시작하는 고유명사나 예외적인 케이스 명시적 허용
const ALLOWED_ENGLISH_TERMS = [
  "iPhone",
  "eBay",
  "iMac",
  "iPad",
  "iOS",
  "macOS",
];

function validateItem(item) {
  let errors = [];
  const id = item.id || "unknown_id";

  // 1. 구조 검사 (Top-level)
  if (!item.expression) errors.push("Missing 'expression' field.");
  if (!item.meaning) errors.push("Missing 'meaning' field.");
  if (!item.content) errors.push("Missing 'content' field.");
  if (!item.tags) errors.push("Missing 'tags' field.");
  if (!item.dialogue || !Array.isArray(item.dialogue)) {
    errors.push("Missing 'dialogue' top-level array.");
  } else if (item.dialogue.length === 0) {
    errors.push("'dialogue' array is empty.");
  }

  // 규칙: Expression 문장 부호
  if (item.expression && /[.,]$/.test(item.expression.trim())) {
    errors.push("Expression must not end with a period (.) or comma (,).");
  }

  // 2. 태그: 소문자 영어만 허용, '#' 금지
  if (item.tags && Array.isArray(item.tags)) {
    item.tags.forEach((tag) => {
      if (tag.includes("#")) errors.push(`Tag '${tag}' contains '#'.`);
      if (tag !== tag.toLowerCase())
        errors.push(`Tag '${tag}' must be lowercase.`);
      if (!REGEX.english_letters.test(tag))
        errors.push(`Tag '${tag}' must contain English letters.`);
      if (
        REGEX.hangul.test(tag) ||
        REGEX.kana.test(tag) ||
        REGEX.cyrillic.test(tag) ||
        REGEX.arabic.test(tag)
      ) {
        errors.push(`Tag '${tag}' must be English ONLY.`);
      }
    });
  }

  // 3. 의미: 대상 언어만 허용 (영어 제외)
  if (item.meaning) {
    TARGET_LANGS.forEach((lang) => {
      const text = item.meaning[lang];
      if (!text) {
        errors.push(`Missing meaning for language: ${lang}`);
        return;
      }

      // 규칙: 대상 언어 혼용 금지
      if (lang === "ko" && (REGEX.kana.test(text) || REGEX.han.test(text)))
        errors.push(`Meaning (${lang}) contains Mixed Foreign Script.`);
      if (lang === "ja" && REGEX.hangul.test(text))
        errors.push(
          `Meaning (${lang}) contains Mixed Foreign Script (Hangul).`
        );

      // 규칙: 언어 혼용 금지 (영어 누출 검사)
      if (["ko", "ja", "zh", "ru", "ar"].includes(lang)) {
        checkEnglishInclusion(text, `Meaning (${lang})`, errors);
      }

      // 규칙: 문장 부호 (물음표 검증은 제외 > 언어별 물음표가 다름, 마침표 금지만 검증)
      if (text.trim().endsWith(".") && !text.trim().endsWith("...")) {
        errors.push(`Meaning (${lang}) must not end with a period (.).`);
      }
    });
  }

  // 4. 콘텐츠: 대상 언어 + 영어(설명용) 허용
  if (item.content) {
    TARGET_LANGS.forEach((lang) => {
      const contentObj = item.content[lang];
      if (!contentObj) {
        errors.push(`Missing content object for language: ${lang}`);
        return;
      }

      // 구조 검사 (언어별 상세 필드)
      if (!contentObj.situation)
        errors.push(`Content (${lang}) is missing 'situation'.`);
      if (!contentObj.tip) errors.push(`Content (${lang}) is missing 'tip'.`);
      if (!contentObj.quiz) {
        errors.push(`Content (${lang}) is missing 'quiz'.`);
      } else {
        if (!contentObj.quiz.question)
          errors.push(`Content (${lang}).quiz is missing 'question'.`);
        if (!contentObj.quiz.answer)
          errors.push(`Content (${lang}).quiz is missing 'answer'.`);

        // 규칙: quiz에 options 필드가 있으면 안 됨 (DB 구조 위반)
        if (contentObj.quiz.options) {
          errors.push(
            `Content (${lang}).quiz must NOT have 'options' field. Options should be in 'question' field as "A. ...", "B. ...", "C. ...".`
          );
        }

        // 규칙: quiz.question에 선택지 A, B, C가 모두 포함되어야 함
        if (contentObj.quiz.question) {
          const questionText = contentObj.quiz.question;
          const hasOptionA =
            /\nA\.\s/.test(questionText) || /^A\.\s/.test(questionText);
          const hasOptionB = /\nB\.\s/.test(questionText);
          const hasOptionC = /\nC\.\s/.test(questionText);

          if (!hasOptionA || !hasOptionB || !hasOptionC) {
            const missing = [];
            if (!hasOptionA) missing.push("A");
            if (!hasOptionB) missing.push("B");
            if (!hasOptionC) missing.push("C");
            errors.push(
              `Content (${lang}).quiz.question must contain all options (A, B, C). Missing: ${missing.join(
                ", "
              )}. Format: "Question text\\n\\nA. option1\\nB. option2\\nC. option3"`
            );
          }
        }
      }

      const fieldsToCheck = [
        contentObj.situation,
        contentObj.tip,
        contentObj.quiz?.question,
      ].filter(Boolean);

      fieldsToCheck.forEach((text) => {
        if (lang === "ko" && REGEX.kana.test(text))
          errors.push(`Content (${lang}) contains Kana.`);
        else if (lang === "ja" && REGEX.hangul.test(text))
          errors.push(`Content (${lang}) contains Hangul.`);
        else if (["es", "fr", "de"].includes(lang)) {
          if (
            REGEX.hangul.test(text) ||
            REGEX.kana.test(text) ||
            REGEX.cyrillic.test(text) ||
            REGEX.arabic.test(text)
          ) {
            errors.push(`Content (${lang}) contains Mixed Foreign Script.`);
          }
        }
      });

      if (contentObj.quiz && contentObj.quiz.answer) {
        if (!["A", "B", "C"].includes(contentObj.quiz.answer)) {
          errors.push(
            `Quiz Answer (${lang}) must be 'A', 'B', or 'C'. Found: ${contentObj.quiz.answer}`
          );
        }
      }

      // 규칙: 퀴즈 선택지 언어 일관성
      if (["ko", "ja", "zh", "ru", "ar"].includes(lang)) {
        if (contentObj.quiz && contentObj.quiz.question) {
          const lines = contentObj.quiz.question.split("\n");
          const opts = [];

          lines.forEach((line) => {
            const trimmed = line.trim();
            if (
              trimmed.startsWith("A.") ||
              trimmed.startsWith("B.") ||
              trimmed.startsWith("C.")
            ) {
              // "A. 내용" -> "내용" 추출
              opts.push(trimmed.substring(2).trim());
            }
          });

          if (opts.length === 3) {
            const isTarget = (s) => {
              if (lang === "ko") return REGEX.hangul.test(s);
              if (lang === "ja") return REGEX.kana.test(s) || REGEX.han.test(s);
              if (lang === "zh") return REGEX.han.test(s);
              if (lang === "ru") return REGEX.cyrillic.test(s);
              if (lang === "ar") return REGEX.arabic.test(s);
              return false;
            };
            const cnt = opts.filter(isTarget).length;
            // 3개 모두 타겟 언어이거나(3), 모두 영어(0)여야 함.
            if (cnt !== 0 && cnt !== 3) {
              errors.push(
                `Quiz Options (${lang}) must be consistent (All English OR All Target). Mixed scripts found.`
              );
            }
          }
        }
      }
    });
  }

  // 5. 대화: 최상위 레벨 배열
  if (item.dialogue && Array.isArray(item.dialogue)) {
    // 규칙: 대화는 2~4턴 사이여야 함 (프롬프트는 2~3턴 권장하나, 4턴도 허용)
    if (item.dialogue.length < 2 || item.dialogue.length > 4) {
      errors.push(
        `Dialogue length must be between 2 and 4. Found: ${item.dialogue.length}`
      );
    }

    item.dialogue.forEach((dItem, idx) => {
      if (dItem.en) {
        if (REGEX.hangul.test(dItem.en) || REGEX.kana.test(dItem.en)) {
          errors.push(`Dialogue[${idx}].en contains non-English characters.`);
        }
      }

      if (dItem.translations) {
        TARGET_LANGS.forEach((lang) => {
          const text = dItem.translations[lang];
          if (!text) return;

          // 규칙: 순수 텍스트만 허용 (마크다운 금지)
          if (text.includes("**") || text.includes("__")) {
            errors.push(
              `Dialogue[${idx}].translations.${lang} contains Markdown Bold (**): "${text}"`
            );
          }

          // 규칙: 언어 혼용 금지 (영어 누출 검사)
          if (["ko", "ja", "zh", "ru", "ar"].includes(lang)) {
            checkEnglishInclusion(
              text,
              `Dialogue[${idx}].translations.${lang}`,
              errors
            );
          } else {
            // 라틴 계열 (es, fr, de): 전체 표현이 누출되었는지 확인
            if (
              item.expression &&
              text.toLowerCase().includes(item.expression.toLowerCase())
            ) {
              // 거짓 양성 필터링 (예: "Pizza" -> "Pizza")
              // 휴리스틱: 표현이 4글자보다 긴 경우에만 플래그 처리. 짧은 단어는 우연일 수 있음.
              if (item.expression.length > 4) {
                errors.push(
                  `Dialogue[${idx}].translations.${lang} contains English expression leakage: "${item.expression}"`
                );
              }
            }
          }

          // 규칙: 대상 언어 혼용 금지
          if (lang === "ko" && (REGEX.kana.test(text) || REGEX.han.test(text)))
            errors.push(
              `Dialogue[${idx}].translations.${lang} contains foreign script.`
            );
          if (lang === "ja" && REGEX.hangul.test(text))
            errors.push(
              `Dialogue[${idx}].translations.${lang} contains Hangul.`
            );
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

/**
 * 스마트 영어 포함 검사
 */
function checkEnglishInclusion(text, context, errors) {
  const englishMatches = text.match(/[a-zA-Z]{2,}/g) || [];

  const invalidWords = englishMatches.filter((word) => {
    // 1. 허용 목록에 있으면 통과
    if (
      ALLOWED_ENGLISH_TERMS.some(
        (term) => term.toLowerCase() === word.toLowerCase()
      )
    )
      return false;
    // 2. 대문자로 시작하면 통과
    if (/^[A-Z]/.test(word)) return false;
    // 3. 그 외 (소문자)는 차단!
    return true;
  });

  if (invalidWords.length > 0) {
    errors.push(
      `${context} contains English leakage: ${invalidWords.join(", ")}`
    );
  }
}

// ==========================================================================
//  Local CLI Wrapper
// ==========================================================================

function runLocalTest() {
  try {
    const filePath = path.resolve(__dirname, "../temp.json");

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      console.log(
        "Please create a 'temp.json' file in the project root to verify."
      );
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log(`Checking ${data.length} items from ${filePath}...`);

    let allViolations = [];
    data.forEach((item) => {
      // temp.json은 배열이므로 각 요소가 바로 item 데이터입니다.
      const result = validateItem(item);

      if (!result.valid) {
        allViolations.push({
          id: item.id,
          expression: item.expression,
          errors: result.errors,
        });
      }
    });

    if (allViolations.length > 0) {
      console.log(`❌ Found ${allViolations.length} items with violations.`);
      const outPath = path.resolve(__dirname, "strict_violations.json");
      fs.writeFileSync(outPath, JSON.stringify(allViolations, null, 2));
      console.log(`Violations saved to '${outPath}'`);
      process.exit(1);
    } else {
      console.log("✅ All items passed strict validation!");
      process.exit(0);
    }
  } catch (e) {
    console.error("Error reading/parsing temp.json:", e);
    process.exit(1);
  }
}

if (require.main === module) {
  runLocalTest();
}
