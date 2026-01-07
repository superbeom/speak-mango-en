// Gemini의 응답에서 JSON 문자열 부분만 추출하여 파싱합니다.
const rawText = $input.first().json.text;
// 마크다운 코드 블록(```json ... ```) 제거
const cleanJson = rawText
  .replace(/```json/g, "")
  .replace(/`/g, "")
  .trim();

try {
  return {
    json: JSON.parse(cleanJson),
  };
} catch (error) {
  // 파싱 실패 시 에러 로그 반환 (디버깅용)
  return {
    json: {
      error: "JSON Parsing Failed",
      raw: rawText,
    },
  };
}
