#!/usr/bin/env node

/**
 * i18n Locale Language Consistency Validator
 *
 * 목적:
 * - i18n/locales 폴더의 각 언어 파일이 해당 언어만 포함하는지 검증
 * - 동적으로 치환되는 템플릿 변수는 영어 포함 허용 (동적 변수)
 *
 * 사용법:
 * node verification/verify_i18n_locales.js
 */

const fs = require("fs");
const path = require("path");

// ==========================================================================
//  정규 표현식 패턴
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
  // 영어/라틴 문자
  english_letters: /[a-zA-Z]/,
};

// 허용된 영어 용어 (고유명사, 브랜드명, 템플릿 변수 등)
const ALLOWED_ENGLISH_TERMS = [
  "iPhone",
  "eBay",
  "iMac",
  "iPad",
  "iOS",
  "macOS",
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "Twitter",
  "Google",
  "Amazon",
  "Netflix",
  "Spotify",
  "LinkedIn",
  // 템플릿 변수 (동적으로 치환되는 변수명)
  "serviceName",
  "expression",
  "meaning",
  "tag",
];

// 언어별 설정
const LANGUAGE_CONFIG = {
  ko: {
    name: "Korean",
    primaryScript: REGEX.hangul,
    allowedScripts: [REGEX.hangul],
    forbiddenScripts: [REGEX.kana, REGEX.han, REGEX.cyrillic, REGEX.arabic],
  },
  ja: {
    name: "Japanese",
    primaryScript: REGEX.kana,
    allowedScripts: [REGEX.kana, REGEX.han], // 일본어는 한자 사용
    forbiddenScripts: [REGEX.hangul, REGEX.cyrillic, REGEX.arabic],
  },
  zh: {
    name: "Chinese",
    primaryScript: REGEX.han,
    allowedScripts: [REGEX.han],
    forbiddenScripts: [REGEX.hangul, REGEX.kana, REGEX.cyrillic, REGEX.arabic],
  },
  ru: {
    name: "Russian",
    primaryScript: REGEX.cyrillic,
    allowedScripts: [REGEX.cyrillic],
    forbiddenScripts: [REGEX.hangul, REGEX.kana, REGEX.han, REGEX.arabic],
  },
  ar: {
    name: "Arabic",
    primaryScript: REGEX.arabic,
    allowedScripts: [REGEX.arabic],
    forbiddenScripts: [REGEX.hangul, REGEX.kana, REGEX.han, REGEX.cyrillic],
  },
  // 라틴 계열 언어 (es, fr, de, en)는 영어 알파벳 사용
  es: {
    name: "Spanish",
    primaryScript: REGEX.english_letters,
    allowedScripts: [REGEX.english_letters],
    forbiddenScripts: [
      REGEX.hangul,
      REGEX.kana,
      REGEX.han,
      REGEX.cyrillic,
      REGEX.arabic,
    ],
  },
  fr: {
    name: "French",
    primaryScript: REGEX.english_letters,
    allowedScripts: [REGEX.english_letters],
    forbiddenScripts: [
      REGEX.hangul,
      REGEX.kana,
      REGEX.han,
      REGEX.cyrillic,
      REGEX.arabic,
    ],
  },
  de: {
    name: "German",
    primaryScript: REGEX.english_letters,
    allowedScripts: [REGEX.english_letters],
    forbiddenScripts: [
      REGEX.hangul,
      REGEX.kana,
      REGEX.han,
      REGEX.cyrillic,
      REGEX.arabic,
    ],
  },
  en: {
    name: "English",
    primaryScript: REGEX.english_letters,
    allowedScripts: [REGEX.english_letters],
    forbiddenScripts: [
      REGEX.hangul,
      REGEX.kana,
      REGEX.han,
      REGEX.cyrillic,
      REGEX.arabic,
    ],
  },
};

// ==========================================================================
//  헬퍼 함수
// ==========================================================================

/**
 * 스마트 영어 포함 검사 (비라틴 언어용)
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
        (term) => term.toLowerCase() === word.toLowerCase()
      )
    )
      return false;

    // 2. 대문자로 시작하면 통과 (고유명사 / 약어)
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

/**
 * 객체를 재귀적으로 순회하며 모든 문자열 값 추출
 */
function extractStrings(obj, currentPath = "") {
  const strings = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof value === "string") {
      strings.push({ path: fullPath, value });
    } else if (typeof value === "object" && value !== null) {
      strings.push(...extractStrings(value, fullPath));
    }
  }

  return strings;
}

/**
 * TypeScript 파일에서 export된 객체 파싱
 */
function parseLocaleFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");

  // export const ko = { ... }; 형태에서 객체 부분 추출
  const match = content.match(
    /export\s+const\s+\w+\s*=\s*(\{[\s\S]*\});?\s*$/m
  );

  if (!match) {
    throw new Error(`Failed to parse locale file: ${filePath}`);
  }

  // JSON으로 변환하기 위해 간단한 처리
  // 주의: 이 방법은 간단한 객체에만 작동합니다
  let objectStr = match[1];

  // 템플릿 리터럴 제거 (간단한 케이스만)
  objectStr = objectStr.replace(/`[^`]*`/g, (match) => {
    return JSON.stringify(match.slice(1, -1));
  });

  // 주석 제거
  objectStr = objectStr.replace(/\/\/.*/g, "");
  objectStr = objectStr.replace(/\/\*[\s\S]*?\*\//g, "");

  // 키를 따옴표로 감싸기
  objectStr = objectStr.replace(/(\w+):/g, '"$1":');

  // 마지막 쉼표 제거
  objectStr = objectStr.replace(/,(\s*[}\]])/g, "$1");

  try {
    return JSON.parse(objectStr);
  } catch (error) {
    // 파싱 실패 시 수동으로 값 추출 (템플릿 리터럴 등으로 인한 경우)
    return parseFallback(content);
  }
}

/**
 * 파싱 실패 시 폴백 메서드
 */
function parseFallback(content) {
  const result = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const match = line.match(/(\w+):\s*["']([^"']+)["']/);
    if (match) {
      result[match[1]] = match[2];
    }
  }

  return result;
}

/**
 * 언어 파일 검증
 */
function validateLocaleFile(lang, filePath) {
  const config = LANGUAGE_CONFIG[lang];
  if (!config) {
    console.warn(`⚠️  No configuration for language: ${lang}`);
    return { valid: true, errors: [] };
  }

  const errors = [];

  try {
    // 파일 파싱
    const localeData = parseLocaleFile(filePath);

    // 문자열 추출
    const strings = extractStrings(localeData);

    // 각 문자열 검증
    strings.forEach(({ path, value }) => {
      // 금지된 스크립트 검사
      config.forbiddenScripts.forEach((forbiddenRegex) => {
        if (forbiddenRegex.test(value)) {
          errors.push(
            `[${path}] Contains forbidden script for ${config.name}: "${value}"`
          );
        }
      });

      // 비라틴 언어의 경우 영어 누출 검사
      if (!["es", "fr", "de", "en"].includes(lang)) {
        checkEnglishInclusion(value, `[${path}]`, errors);
      }
    });
  } catch (error) {
    errors.push(`Failed to validate file: ${error.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ==========================================================================
//  메인 실행
// ==========================================================================

function main() {
  const localesDir = path.join(__dirname, "../i18n/locales");

  if (!fs.existsSync(localesDir)) {
    console.error(`❌ Locales directory not found: ${localesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".ts"));

  console.log(`\n🔍 Validating ${files.length} locale files...\n`);

  const allViolations = [];

  files.forEach((file) => {
    const lang = path.basename(file, ".ts");
    const filePath = path.join(localesDir, file);

    console.log(
      `📄 Checking ${file} (${LANGUAGE_CONFIG[lang]?.name || lang})...`
    );

    const result = validateLocaleFile(lang, filePath);

    if (!result.valid) {
      allViolations.push({
        file,
        lang,
        errors: result.errors,
      });
      console.log(`   ❌ Found ${result.errors.length} violations`);
    } else {
      console.log(`   ✅ All checks passed`);
    }
  });

  console.log("\n" + "=".repeat(60));

  if (allViolations.length > 0) {
    console.log(
      `\n❌ Validation Failed for ${allViolations.length} file(s):\n`
    );

    allViolations.forEach(({ file, lang, errors }) => {
      console.log(`\n📄 ${file} (${LANGUAGE_CONFIG[lang]?.name || lang}):`);
      errors.forEach((error, idx) => {
        console.log(`   ${idx + 1}. ${error}`);
      });
    });

    console.log("\n" + "=".repeat(60));
    process.exit(1);
  } else {
    console.log("\n✅ All locale files passed validation!");
    console.log("=".repeat(60) + "\n");
    process.exit(0);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { validateLocaleFile, extractStrings, checkEnglishInclusion };
