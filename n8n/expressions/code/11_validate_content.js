/**
 * Gemini 출력에 대한 엄격한 검증 로직 (n8n 버전)
 * 08_gemini_content_generator_prompt.txt의 규칙과 일치합니다.
 *
 * 사용법:
 * 1. 아래의 모든 코드를 n8n Code 노드에 복사하세요.
 * 2. 'Parse Content JSON' 노드 뒤에 연결하세요.
 * 3. 각 항목을 검증하며 위반 사항이 발견되면 워크플로우를 중단합니다.
 */

// ==========================================================================
//  헬퍼 함수 및 상수
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
  // CJK 마침표 (고리점)
  ideographic_full_stop: /。/,
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

const ALLOWED_NAMES = ["Sarah", "Emily", "Mike", "David", "SNS"];

function validateItem(item) {
  let errors = [];

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
    // 규칙: English("en")도 검증 대상에 포함 (마침표 규칙 적용을 위해)
    const meaningLangs = [...TARGET_LANGS, "en"];
    meaningLangs.forEach((lang) => {
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
          `Meaning (${lang}) contains Mixed Foreign Script (Hangul).`,
        );

      // 규칙: 언어 혼용 금지 (영어 누출 검사)
      if (["ko", "ja", "zh", "ru", "ar"].includes(lang)) {
        checkEnglishInclusion(text, `Meaning (${lang})`, errors);
      }

      // 규칙: 문장 부호 (마침표 금지 - 문장 중간 포함)
      // ... (말줄임표)는 허용하되, 그 외의 .은 모두 에러 처리
      if (text.replace(/\.\.\./g, "").includes(".")) {
        errors.push(`Meaning (${lang}) must not contain a period (.).`);
      }
      if (text.includes(";")) {
        errors.push(`Meaning (${lang}) must not contain a semicolon (;).`);
      }
      // 규칙: CJK 마침표(。) 금지
      if (REGEX.ideographic_full_stop.test(text)) {
        errors.push(
          `Meaning (${lang}) must not contain an ideographic full stop (。).`,
        );
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
            `Content (${lang}).quiz must NOT have 'options' field. Options should be in 'question' field as "A. ...", "B. ...", "C. ...".`,
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
                ", ",
              )}. Format: "Question text\\n\\nA. option1\\nB. option2\\nC. option3"`,
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
            `Quiz Answer (${lang}) must be 'A', 'B', or 'C'. Found: ${contentObj.quiz.answer}`,
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
                `Quiz Options (${lang}) must be consistent (All English OR All Target). Mixed scripts found.`,
              );
            }

            // Quiz Logic:
            // 1. If Question contains English (Pattern 2/3) -> Options must be Target Language.
            // 2. If Question does NOT contain English (Pattern 1) -> Options must be English.

            // Extract ONLY the question text (exclude options)
            // Strategy: Take all lines BEFORE the first line that starts with "A."
            let questionBody = "";
            let foundOption = false;
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("A.")) {
                foundOption = true;
                break;
              }
              if (!foundOption) {
                questionBody += line + " ";
              }
            }

            // Check English presence in the *Question Body* only
            // Exclude allowed names and terms to prevent false positives (Pattern 1 being mistaken for Pattern 2/3)
            let checkBody = questionBody;

            // Remove allowed names
            ALLOWED_NAMES.forEach((name) => {
              checkBody = checkBody.replace(new RegExp(name, "gi"), "");
            });

            // Remove allowed English terms
            ALLOWED_ENGLISH_TERMS.forEach((term) => {
              checkBody = checkBody.replace(new RegExp(term, "gi"), "");
            });

            const englishInQuestion = /[a-zA-Z]{2,}/.test(checkBody);

            if (englishInQuestion) {
              // Pattern 2/3: Question has English -> Options MUST be Target (cnt === 3)
              if (cnt !== 3) {
                errors.push(
                  `Quiz Pattern Mismatch (${lang}): Question contains English (Pattern 2/3), so Options must be in Target Language. Found English Options.`,
                );
              }
            } else {
              // Pattern 1: Question has NO English -> Options MUST be English (cnt === 0)
              if (cnt !== 0) {
                errors.push(
                  `Quiz Pattern Mismatch (${lang}): Question has NO English (Pattern 1), so Options must be in English. Found Target Language Options.`,
                );
              }
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
        `Dialogue length must be between 2 and 4. Found: ${item.dialogue.length}`,
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
              `Dialogue[${idx}].translations.${lang} contains Markdown Bold (**): "${text}"`,
            );
          }

          // 규칙: 언어 혼용 금지 (영어 누출 검사)
          if (["ko", "ja", "zh", "ru", "ar"].includes(lang)) {
            checkEnglishInclusion(
              text,
              `Dialogue[${idx}].translations.${lang}`,
              errors,
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
                  `Dialogue[${idx}].translations.${lang} contains English expression leakage: "${item.expression}"`,
                );
              }
            }
          }

          // 규칙: 대상 언어 혼용 금지
          if (lang === "ko" && (REGEX.kana.test(text) || REGEX.han.test(text)))
            errors.push(
              `Dialogue[${idx}].translations.${lang} contains foreign script.`,
            );
          if (lang === "ja" && REGEX.hangul.test(text))
            errors.push(
              `Dialogue[${idx}].translations.${lang} contains Hangul.`,
            );
        });
      }

      // 규칙: 성별-이름 일관성 검증 (Role A는 여성, Role B는 남성)
      if (dItem.role && dItem.en) {
        const femaleNames = ["sarah", "emily"];
        const maleNames = ["mike", "david"];

        // 호격 패턴 검사 (상대방을 부르는 경우만 검증)
        const addressingPatterns = [
          /^(hey|hi|hello|yo|well|so|oh|ah|guess)\s+(\w+)/i, // "Hey Mike", "Hi Emily", "Guess what, Emily"
          /,\s*(\w+)[,\.\?!]/i, // "..., Mike.", "..., Emily?"
          /(\w+),\s+(how|what|do|can|would|are|is)/i, // "Mike, how are you?"
          /\b(\w+),\s+(you|your|do|did|can|could|would|will)/i, // "Emily, you...", "Mike, your..."
        ];

        addressingPatterns.forEach((pattern) => {
          const match = dItem.en.match(pattern);
          if (match) {
            const addressedName = match[match.length - 1].toLowerCase();

            // Role A(여성)가 여성 이름으로 상대를 부르는 경우
            if (dItem.role === "A" && femaleNames.includes(addressedName)) {
              errors.push(
                `Dialogue[${idx}]: Role A (Female) is addressing someone as '${addressedName}' (female name). Should use male names (Mike/David).`,
              );
            }

            // Role B(남성)가 남성 이름으로 상대를 부르는 경우
            if (dItem.role === "B" && maleNames.includes(addressedName)) {
              errors.push(
                `Dialogue[${idx}]: Role B (Male) is addressing someone as '${addressedName}' (male name). Should use female names (Sarah/Emily).`,
              );
            }
          }
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
 * 허용:
 * 1. 허용 목록의 용어 (iPhone, eBay...)
 * 2. 고유명사 (대문자로 시작: Instagram, TikTok)
 * 3. 약어 (모두 대문자: ROI, CEO)
 * 차단:
 * - 소문자 영어 단어 (누출 가능성 높음)
 */
function checkEnglishInclusion(text, context, errors) {
  const englishMatches = text.match(/[a-zA-Z]{2,}/g) || [];

  const invalidWords = englishMatches.filter((word) => {
    // 1. 허용 목록에 있으면 통과 (대소문자 무시)
    if (
      ALLOWED_ENGLISH_TERMS.some(
        (term) => term.toLowerCase() === word.toLowerCase(),
      )
    )
      return false;

    // 2. 대문자로 시작하면 통과 (고유명사 / 약어)
    // 예: Instagram, TikTok, ROI, CEO, TV
    if (/^[A-Z]/.test(word)) return false;

    // 3. 그 외 (소문자)는 차단!
    // 예: "reach", "out", "hello", "meaning"
    return true;
  });

  if (invalidWords.length > 0) {
    errors.push(
      `${context} contains English leakage: ${invalidWords.join(", ")}`,
    );
  }
}

// ==========================================================================
//  N8N 실행 블록
// ==========================================================================

const allViolations = [];

// 모든 입력 항목 반복
for (const item of $input.all()) {
  // 파싱된 JSON이 item.json에 있다고 가정
  // n8n 출력 구조가 평탄화된 경우 'dataToCheck'를 그에게 맞게 조정하세요.
  const dataToCheck = item.json;

  // 검증 실행
  const result = validateItem(dataToCheck); // dataToCheck는 expression, meaning 등을 포함하는 객체여야 함

  if (!result.valid) {
    allViolations.push({
      expression: dataToCheck.expression,
      errors: result.errors,
    });

    // 항목을 유효하지 않음으로 표시 (선택 사항, throw하지 않을 경우 다운스트림 디버깅용)
    item.json._validation = { status: "error", errors: result.errors };
  } else {
    item.json._validation = { status: "success" };
  }
}

// 위반 사항 발견 시 워크플로우 중단
if (allViolations.length > 0) {
  // 에러 메시지 포맷팅
  const errorMsg = allViolations
    .map((v) => `[${v.expression}] Errors: ${v.errors.join("; ")}`)
    .join("\n");

  // 에러를 발생시켜 워크플로우 중단 및 위반 사항 표시
  throw new Error(
    `❌ Strict Validation Failed for ${allViolations.length} items:\n${errorMsg}`,
  );
}

// 모두 통과 시 항목 반환
return $input.all();
