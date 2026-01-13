// n8n Code Node: Parse Gemini JSON Response
// Gemini의 응답 텍스트에서 마크다운 코드 블록을 제거하고 깨끗한 JSON 객체로 파싱합니다.

const items = $input.all();
const results = [];

items.forEach((item) => {
    const rawText = item.json.text || "";

    // 마크다운 코드 블록(```json ... ```) 및 백틱 제거
    const cleanJson = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    try {
        const parsedData = JSON.parse(cleanJson);
        results.push({
            json: parsedData
        });
    } catch (error) {
        // 파싱 실패 시 디버깅을 위한 원본 텍스트 및 에러 정보 반환
        results.push({
            json: {
                error: "JSON Parsing Failed",
                message: error.message,
                raw_text: rawText
            }
        });
    }
});

return results;
