// 11. Parse Content JSON
// Gemini Content Generator의 응답(텍스트)을 파싱하여 JSON 객체로 변환합니다.
// 병렬 실행(Fan-out)을 지원하기 위해 들어오는 모든 아이템($input.all())을 처리합니다.

return $input.all().map(item => {
    const rawText = item.json.text;

    // 1. 텍스트가 없는 경우 에러 처리
    if (!rawText) {
        return {
            json: {
                error: "No text field found",
                ...item.json // 기존 데이터 보존 시도
            },
            pairedItem: item.pairedItem
        };
    }

    // 2. 마크다운 코드 블록(```json ... ```) 안전하게 제거
    // 정규식을 사용하여 앞뒤의 마크다운 태그만 제거하고 내용물은 유지합니다.
    const cleanJson = rawText
        .replace(/^```json\s*/i, "") // 시작 태그 (case insensitive)
        .replace(/\s*```$/, "")      // 종료 태그
        .trim();

    try {
        // 3. JSON 파싱
        const parsed = JSON.parse(cleanJson);

        return {
            json: parsed,
            pairedItem: item.pairedItem // Lineage 유지
        };
    } catch (error) {
        // 4. 파싱 실패 시 에러 로그 반환 (디버깅용)
        return {
            json: {
                error: "JSON Parsing Failed",
                message: error.message,
                raw: rawText,
                clean: cleanJson
            },
            pairedItem: item.pairedItem
        };
    }
});
